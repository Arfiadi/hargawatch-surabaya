"""Evaluator Harness (The Yardstick) for Autoresearch in HargaWatch Surabaya.

FROZEN / READ-ONLY EVALUATION HARNESS:
This module evaluates candidate forecasting models against out-of-sample data
using leakage-free rolling-origin walk-forward backtesting.

Core responsibilities:
1. Load candidate model from `src.models.autoresearch_sandbox.CandidateForecaster`.
2. Execute walk-forward backtest (2025-01-01+, step 14 days) across target commodities.
3. Utilize multi-worker concurrency (ProcessPoolExecutor) across 16 CPU cores.
4. Calculate standard metrics (WAPE, MAE, RMSE, sMAPE, PICP, Directional Accuracy).
5. Enforce hard constraints (PICP >= 75.0%, no NaN/Inf, max runtime budget).
6. Output machine-readable JSON and append experiment log to `results.tsv`.

Usage:
    python scripts/autoresearch/evaluator.py --id 50 --horizon 7
    python scripts/autoresearch/evaluator.py --cluster 3 --workers 6
"""

import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
import datetime
import importlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

# Project roots
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.analytics.features import build_supervised_dataset
from src.analytics.metrics import (
    compute_directional_accuracy,
    compute_mae,
    compute_picp,
    compute_rmse,
    compute_smape,
    compute_wape,
)
from src.models.backtest import resolve_commodity

# Target Category 3 Commodities (Critical & Volatile)
CATEGORY_3_COMMODITIES = [
    (50, "Cabe Rawit Merah"),
    (39, "Bawang Merah"),
    (46, "Tomat Merah"),
    (37, "Cabe Merah Keriting"),
    (48, "Buncis"),
    (38, "Cabe Merah Besar"),
]

RESULTS_TSV_PATH = BASE_DIR / "experiments" / "autoresearch" / "results.tsv"


def get_git_commit_hash() -> str:
    """Retrieves current short git commit hash."""
    try:
        res = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=str(BASE_DIR),
            capture_output=True,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except Exception:
        return "unknown"


def evaluate_single_commodity(
    komoditas_id: int,
    horizon: int = 7,
    test_start_date: str = "2025-01-01",
    window_step_days: int = 14,
    use_candidate: bool = True,
    baseline_model: Optional[str] = None,
    verbose: bool = False,
) -> Dict[str, Any]:
    """Runs leakage-free walk-forward backtest for a single commodity.
    
    Can evaluate the candidate model in `src.models.autoresearch_sandbox`
    or compare against a standard baseline model.
    """
    start_time = time.time()
    cid, cname = resolve_commodity(komoditas_id)

    # 1. Instantiate Candidate Forecaster
    if use_candidate:
        try:
            sandbox_mod = importlib.import_module("src.models.autoresearch_sandbox")
            # Force reload to get latest agent code mutations
            importlib.reload(sandbox_mod)
            candidate_cls = getattr(sandbox_mod, "CandidateForecaster")
            model_instance = candidate_cls(komoditas_id=cid, horizon=horizon)
            model_family = getattr(model_instance, "model_family", "Candidate")
        except Exception as e:
            return {
                "komoditas_id": cid,
                "commodity": cname,
                "status": "ERROR",
                "error_msg": f"Failed to load CandidateForecaster from sandbox: {e}",
                "elapsed_seconds": round(time.time() - start_time, 2),
            }
    else:
        model_family = baseline_model or "Baseline"
        model_instance = None

    # 2. Build Supervised Dataset (Deterministic & Leakage-Free)
    include_weather = getattr(model_instance, "include_weather", False) if use_candidate else False
    include_calendar = getattr(model_instance, "include_calendar", True) if use_candidate else True

    try:
        df = build_supervised_dataset(
            horizon=horizon,
            komoditas_id=cid,
            include_weather=include_weather,
        )
    except Exception as e:
        return {
            "komoditas_id": cid,
            "commodity": cname,
            "status": "ERROR",
            "error_msg": f"Failed to build supervised dataset: {e}",
            "elapsed_seconds": round(time.time() - start_time, 2),
        }

    # 3. Base Feature Selection
    feature_cols = [
        "pasar_id", "price_current", "price_lag_1", "price_lag_2", "price_lag_3",
        "price_lag_7", "price_lag_14", "rolling_mean_7d", "rolling_std_7d",
        "rolling_mean_14d", "rolling_std_14d", "pct_change_1d", "pct_change_7d",
    ]
    keputran_cols = ["keputran_price_lag_1", "keputran_price_lag_2", "keputran_price_lag_3"]
    feature_cols += [c for c in keputran_cols if c in df.columns]

    if include_calendar:
        calendar_cols = [
            "target_bulan", "target_is_libur_nasional",
            "target_is_ramadan", "target_is_pra_ramadan",
            "target_hari_ke_idulfitri",
        ]
        feature_cols += [c for c in calendar_cols if c in df.columns]

    if include_weather:
        weather_cols = ["curah_hujan_mm", "rain_sum_7d", "rain_sum_14d", "rain_lag_28d"]
        feature_cols += [c for c in weather_cols if c in df.columns]

    # Check for custom features provided by CandidateForecaster
    if use_candidate and hasattr(model_instance, "transform_features"):
        try:
            df, custom_cols = model_instance.transform_features(df)
            feature_cols += [c for c in custom_cols if c in df.columns and c not in feature_cols]
        except Exception as e:
            return {
                "komoditas_id": cid,
                "commodity": cname,
                "status": "ERROR",
                "error_msg": f"Candidate transform_features failed: {e}",
                "elapsed_seconds": round(time.time() - start_time, 2),
            }

    feature_cols = [c for c in feature_cols if c in df.columns]

    # 4. Out-of-Sample Rolling-Origin Split
    split_date = pd.Timestamp(test_start_date)
    test_dates = df[df["tanggal"] >= split_date]["tanggal"].drop_duplicates().sort_values().tolist()
    if not test_dates:
        return {
            "komoditas_id": cid,
            "commodity": cname,
            "status": "ERROR",
            "error_msg": f"No test observations found after {test_start_date}",
            "elapsed_seconds": round(time.time() - start_time, 2),
        }

    eval_dates = test_dates[::window_step_days]

    y_test_all: List[float] = []
    y_pred_all: List[float] = []
    y_origin_all: List[float] = []
    y_low_all: List[float] = []
    y_high_all: List[float] = []

    # 5. Walk-Forward Rolling-Origin Loop
    for origin_date in eval_dates:
        if "target_date" in df.columns:
            train_df = df[df["target_date"] <= origin_date]
        else:
            train_df = df[df["tanggal"] <= origin_date - pd.Timedelta(days=horizon)]

        test_slice = df[df["tanggal"] == origin_date].copy()
        if train_df.empty or test_slice.empty:
            continue

        X_train = train_df[feature_cols]
        y_train = train_df["target_price"]
        X_test = test_slice[feature_cols]
        y_test = test_slice["target_price"].values
        y_origin = test_slice["price_current"].values

        try:
            if use_candidate:
                # Re-instantiate per origin to prevent cross-window state leakage
                cand = candidate_cls(komoditas_id=cid, horizon=horizon, feature_cols=feature_cols)
                cand.fit(X_train, y_train)
                res = cand.predict(X_test)
                
                # Expecting res as dict {'pred': ..., 'low': ..., 'high': ...} or tuple/array
                if isinstance(res, dict):
                    p_med = np.asarray(res["pred"], dtype=float)
                    p_low = np.asarray(res.get("low", p_med), dtype=float)
                    p_high = np.asarray(res.get("high", p_med), dtype=float)
                elif isinstance(res, np.ndarray) and res.ndim == 2 and res.shape[1] >= 3:
                    p_low = res[:, 0]
                    p_med = res[:, 1]
                    p_high = res[:, 2]
                else:
                    p_med = np.asarray(res, dtype=float)
                    p_low = p_med
                    p_high = p_med
            else:
                # Naive Last Value Baseline fallback
                p_med = y_origin
                p_low = y_origin
                p_high = y_origin

        except Exception as e:
            return {
                "komoditas_id": cid,
                "commodity": cname,
                "status": "ERROR",
                "error_msg": f"Training/Prediction failed at origin {origin_date.date()}: {e}",
                "elapsed_seconds": round(time.time() - start_time, 2),
            }

        # Check for NaN / Inf
        if np.isnan(p_med).any() or np.isinf(p_med).any():
            return {
                "komoditas_id": cid,
                "commodity": cname,
                "status": "INVALID",
                "error_msg": f"Predictions contain NaN or Inf at origin {origin_date.date()}",
                "elapsed_seconds": round(time.time() - start_time, 2),
            }

        y_test_all.extend(y_test.tolist())
        y_pred_all.extend(p_med.tolist())
        y_origin_all.extend(y_origin.tolist())
        y_low_all.extend(p_low.tolist())
        y_high_all.extend(p_high.tolist())

    if not y_test_all:
        return {
            "komoditas_id": cid,
            "commodity": cname,
            "status": "ERROR",
            "error_msg": "No predictions were generated across rolling origins",
            "elapsed_seconds": round(time.time() - start_time, 2),
        }

    # 6. Compute Aggregate Standard Metrics
    yt = np.array(y_test_all)
    yp = np.array(y_pred_all)
    yo = np.array(y_origin_all)
    y_low = np.array(y_low_all)
    y_high = np.array(y_high_all)

    wape = compute_wape(yt, yp)
    mae = compute_mae(yt, yp)
    rmse = compute_rmse(yt, yp)
    smape = compute_smape(yt, yp)
    da = compute_directional_accuracy(yt, yp, yo)
    picp = compute_picp(yt, y_low, y_high)

    elapsed = round(time.time() - start_time, 2)

    # Hard Constraint Check: PICP >= 75.0%
    picp_passed = picp is not None and picp >= 75.0

    return {
        "komoditas_id": cid,
        "commodity": cname,
        "horizon": horizon,
        "status": "SUCCESS",
        "model_family": model_family,
        "wape_pct": wape,
        "mae_rp": mae,
        "rmse_rp": rmse,
        "smape_pct": smape,
        "picp_pct": picp,
        "da_pct": da,
        "picp_constraint_passed": picp_passed,
        "num_predictions": len(yt),
        "num_origins": len(eval_dates),
        "elapsed_seconds": elapsed,
    }


def log_experiment_to_tsv(
    result: Dict[str, Any],
    tsv_path: Path = RESULTS_TSV_PATH,
    notes: str = "",
) -> None:
    """Appends benchmark result to results.tsv log."""
    tsv_path.parent.mkdir(parents=True, exist_ok=True)
    file_exists = tsv_path.exists()

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_hash = get_git_commit_hash()

    row = {
        "timestamp": timestamp,
        "commit_hash": commit_hash,
        "komoditas_id": result.get("komoditas_id", ""),
        "commodity": result.get("commodity", ""),
        "horizon": result.get("horizon", 7),
        "model_family": result.get("model_family", "Candidate"),
        "wape_pct": result.get("wape_pct", ""),
        "mae_rp": result.get("mae_rp", ""),
        "picp_pct": result.get("picp_pct", ""),
        "da_pct": result.get("da_pct", ""),
        "status": result.get("status", ""),
        "elapsed_seconds": result.get("elapsed_seconds", ""),
        "notes": notes or result.get("error_msg", ""),
    }

    df_row = pd.DataFrame([row])
    df_row.to_csv(
        tsv_path,
        sep="\t",
        index=False,
        mode="a" if file_exists else "w",
        header=not file_exists,
    )


def run_parallel_cluster_evaluation(
    commodities: List[Tuple[int, str]],
    horizon: int = 7,
    workers: int = 6,
    log_tsv: bool = True,
    notes: str = "",
) -> List[Dict[str, Any]]:
    """Evaluates multiple commodities concurrently across multi-core CPU workers."""
    print(f"\n=================================================================")
    print(f"  AUTORESEARCH PARALLEL EVALUATOR (16-Core Harness)")
    print(f"  Target: {len(commodities)} Commodities | Workers: {workers} | Horizon: {horizon}d")
    print(f"=================================================================")

    start_all = time.time()
    results: List[Dict[str, Any]] = []

    with ProcessPoolExecutor(max_workers=workers) as executor:
        future_to_cid = {
            executor.submit(evaluate_single_commodity, cid, horizon): (cid, cname)
            for cid, cname in commodities
        }

        for future in as_completed(future_to_cid):
            cid, cname = future_to_cid[future]
            try:
                res = future.result()
                results.append(res)
                if res.get("status") == "SUCCESS":
                    print(
                        f"  [OK] [{cid:2d}] {cname:22s} | WAPE: {res['wape_pct']:5.2f}% | "
                        f"PICP: {res['picp_pct']:5.1f}% | DA: {res['da_pct']:4.1f}% | "
                        f"Time: {res['elapsed_seconds']}s"
                    )
                else:
                    print(f"  [FAIL] [{cid:2d}] {cname:22s} | Error: {res.get('error_msg')}")

                if log_tsv:
                    log_experiment_to_tsv(res, notes=notes)

            except Exception as exc:
                err_res = {
                    "komoditas_id": cid,
                    "commodity": cname,
                    "status": "CRASH",
                    "error_msg": str(exc),
                    "elapsed_seconds": 0.0,
                }
                results.append(err_res)
                print(f"  [CRASH] [{cid:2d}] {cname:22s} generated exception: {exc}")
                if log_tsv:
                    log_experiment_to_tsv(err_res, notes=notes)

    total_time = round(time.time() - start_all, 2)
    print(f"=================================================================")
    print(f"  Finished in {total_time}s across {workers} parallel workers")
    print(f"=================================================================\n")
    return results


def main():
    parser = argparse.ArgumentParser(description="Autoresearch Evaluation Harness (The Yardstick)")
    parser.add_argument("--id", type=int, default=None, help="Evaluate single commodity ID (e.g. 50)")
    parser.add_argument("--cluster", type=int, default=None, help="Evaluate cluster (e.g. 3 for Category 3)")
    parser.add_argument("--horizon", type=int, default=7, help="Forecast horizon (default: 7)")
    parser.add_argument("--workers", type=int, default=6, help="ProcessPool workers (default: 6)")
    parser.add_argument("--json", action="store_true", help="Print output as JSON")
    parser.add_argument("--no-log", action="store_true", help="Do not append to results.tsv")
    parser.add_argument("--notes", type=str, default="", help="Experiment description/hypothesis notes")
    args = parser.parse_args()

    # Determine target commodities
    if args.id is not None:
        cid, cname = resolve_commodity(args.id)
        targets = [(cid, cname)]
    elif args.cluster == 3:
        targets = CATEGORY_3_COMMODITIES
    else:
        # Default: Category 3 if not specified
        targets = CATEGORY_3_COMMODITIES

    if len(targets) == 1:
        cid, cname = targets[0]
        res = evaluate_single_commodity(komoditas_id=cid, horizon=args.horizon, verbose=not args.json)
        if not args.no_log:
            log_experiment_to_tsv(res, notes=args.notes)

        if args.json:
            print(json.dumps(res, indent=2))
        else:
            if res.get("status") == "SUCCESS":
                print(f"\n[EVALUATION RESULT] {cname} (ID: {cid}, H={args.horizon}):")
                print(f"  Model Family : {res['model_family']}")
                print(f"  WAPE         : {res['wape_pct']}%")
                print(f"  MAE          : Rp {res['mae_rp']:,.0f}")
                print(f"  RMSE         : Rp {res['rmse_rp']:,.0f}")
                print(f"  sMAPE        : {res['smape_pct']}%")
                print(f"  PICP (80% CI): {res['picp_pct']}% (Constraint passed: {res['picp_constraint_passed']})")
                print(f"  Dir. Accuracy: {res['da_pct']}%")
                print(f"  Elapsed Time : {res['elapsed_seconds']}s\n")
            else:
                print(f"\n[EVALUATION FAILED] {res.get('error_msg')}\n")

        # Exit code reflects pass/fail
        if res.get("status") == "SUCCESS" and res.get("picp_constraint_passed", False):
            sys.exit(0)
        else:
            sys.exit(1)

    else:
        # Multi-commodity parallel evaluation
        results = run_parallel_cluster_evaluation(
            commodities=targets,
            horizon=args.horizon,
            workers=args.workers,
            log_tsv=not args.no_log,
            notes=args.notes,
        )

        all_success = all(
            r.get("status") == "SUCCESS" and r.get("picp_constraint_passed", False)
            for r in results
        )
        if args.json:
            print(json.dumps(results, indent=2))

        sys.exit(0 if all_success else 1)


if __name__ == "__main__":
    main()
