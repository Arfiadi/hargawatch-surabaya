"""Champion Promotion & Serialization Utility for Autoresearch in HargaWatch Surabaya.

Reads the best verified models from `experiments/autoresearch/results.tsv`,
trains final production artifacts on the complete historical dataset, serializes them
to `models/forecasting/<model_name>_<id>_h7.pkl`, and updates `registry.json`.

Usage:
    python scripts/autoresearch/promote_champion.py --cluster 3
    python scripts/autoresearch/promote_champion.py --id 50
"""

import argparse
import datetime
import importlib
import json
import os
from pathlib import Path
import pickle
import sys
from typing import Dict, List, Optional

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.analytics.features import build_supervised_dataset
from src.models.backtest import resolve_commodity

REGISTRY_PATH = BASE_DIR / "models" / "forecasting" / "registry.json"
MODELS_DIR = BASE_DIR / "models" / "forecasting"
RESULTS_TSV = BASE_DIR / "experiments" / "autoresearch" / "results.tsv"

CATEGORY_3_IDS = [50, 39, 46, 38, 48, 37]


def load_registry() -> Dict:
    if not REGISTRY_PATH.exists():
        return {}
    try:
        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_registry(reg: Dict) -> None:
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(reg, f, indent=2)


def promote_commodity(komoditas_id: int, horizon: int = 7) -> bool:
    """Trains final production model on full dataset and promotes to registry.json."""
    cid, cname = resolve_commodity(komoditas_id)
    key = f"{cid}_h{horizon}"
    reg = load_registry()
    current_entry = reg.get(key, {})
    current_wape = float(current_entry.get("wape_pct", 999.0))
    current_model = current_entry.get("model_name", "None")

    print(f"\n[PROMOTION] Evaluating promotion for [{cid}] {cname} (Current: {current_model}, WAPE: {current_wape}%)...")

    # Load candidate from sandbox
    try:
        sandbox_mod = importlib.import_module("src.models.autoresearch_sandbox")
        importlib.reload(sandbox_mod)
        candidate_cls = getattr(sandbox_mod, "CandidateForecaster")
    except Exception as e:
        print(f"  [ERROR] Could not load CandidateForecaster: {e}")
        return False

    # Check best recorded WAPE in results.tsv
    if not RESULTS_TSV.exists():
        print("  [ERROR] results.tsv not found.")
        return False

    df_res = pd.read_csv(RESULTS_TSV, sep="\t")
    sub = df_res[(df_res["komoditas_id"] == cid) & (df_res["status"] == "SUCCESS")]
    if sub.empty:
        print(f"  [INFO] No SUCCESS benchmark results found in results.tsv for {cname}.")
        return False

    best_row = sub.sort_values("wape_pct").iloc[0]
    best_wape = float(best_row["wape_pct"])
    best_picp = float(best_row["picp_pct"]) if pd.notnull(best_row.get("picp_pct")) else None
    model_family = str(best_row["model_family"])

    # Verification: Must beat current champion by margin or be a takeover
    is_takeover = "naive" in current_model.lower() and "naive" not in model_family.lower()
    if best_wape >= current_wape and not is_takeover:
        print(f"  [SKIP] Candidate WAPE ({best_wape}%) does not beat champion ({current_wape}%).")
        return False

    print(f"  [NEW CHAMPION] Promoting {model_family} (WAPE: {best_wape}% vs {current_wape}%, PICP: {best_picp}%)...")

    # Build full supervised dataset
    df_sup = build_supervised_dataset(horizon=horizon, komoditas_id=cid, include_weather=False)

    feature_cols = [
        "pasar_id", "price_current", "price_lag_1", "price_lag_2", "price_lag_3",
        "price_lag_7", "price_lag_14", "rolling_mean_7d", "rolling_std_7d",
        "rolling_mean_14d", "rolling_std_14d", "pct_change_1d", "pct_change_7d",
        "target_bulan", "target_is_libur_nasional", "target_is_ramadan",
        "target_is_pra_ramadan", "target_hari_ke_idulfitri",
    ]
    keputran_cols = ["keputran_price_lag_1", "keputran_price_lag_2", "keputran_price_lag_3"]
    feature_cols += [c for c in keputran_cols if c in df_sup.columns]

    cand = candidate_cls(komoditas_id=cid, horizon=horizon, feature_cols=feature_cols)
    if hasattr(cand, "transform_features"):
        df_sup, custom_cols = cand.transform_features(df_sup)
        feature_cols += [c for c in custom_cols if c in df_sup.columns and c not in feature_cols]

    feature_cols = [c for c in feature_cols if c in df_sup.columns]

    # Train on all available data
    X_full = df_sup[feature_cols]
    y_full = df_sup["target_price"]
    cand.feature_cols = feature_cols
    cand.fit(X_full, y_full)

    # Serialize model artifact
    family_slug = "catboost" if "catboost" in model_family.lower() else ("xgboost" if "xgboost" in model_family.lower() else "model")
    model_filename = f"{family_slug}_{cid}_h{horizon}.pkl"
    model_path = MODELS_DIR / model_filename

    with open(model_path, "wb") as f:
        pickle.dump(cand.forecaster, f)

    # Update Registry
    reg[key] = {
        "komoditas_id": cid,
        "commodity": cname,
        "horizon": horizon,
        "model_name": f"{family_slug.capitalize()} p50",
        "wape_pct": best_wape,
        "model_path": str(model_path),
        "features": feature_cols,
        "updated_at": datetime.datetime.now().isoformat(),
    }
    save_registry(reg)
    print(f"  [SUCCESS] Promoted [{cid}] {cname} to {model_path} and updated registry.json.")
    return True


def main():
    parser = argparse.ArgumentParser(description="Promote autoresearch champion models to production")
    parser.add_argument("--id", type=int, default=None, help="Commodity ID to promote")
    parser.add_argument("--cluster", type=int, default=None, help="Cluster to promote (3 for Category 3)")
    parser.add_argument("--horizon", type=int, default=7, help="Horizon in days (default: 7)")
    args = parser.parse_args()

    if args.id:
        promote_commodity(args.id, args.horizon)
    elif args.cluster == 3:
        for cid in CATEGORY_3_IDS:
            promote_commodity(cid, args.horizon)
    else:
        print("Specify --id <ID> or --cluster 3.")


if __name__ == "__main__":
    main()
