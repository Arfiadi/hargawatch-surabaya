"""Unified Multi-Commodity Retraining & Benchmarking Suite for HargaWatch Surabaya.

Executes walk-forward rolling-origin backtesting across all 37 active commodities.
Enforces the Parsimony Rule (Occam's Razor): GBDT models require >= 3% relative WAPE
improvement over the baseline to be selected as production champions.
Saves champion .pkl models, updates registry.json, and generates comprehensive reports.
"""

import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
import datetime
import json
from pathlib import Path
import pickle
import sys
import time
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.models.backtest import run_walk_forward_backtest
from src.models.train_production import train_champion_model, update_local_registry, get_feature_columns
from src.analytics.features import build_supervised_dataset

MODELS_DIR = BASE_DIR / "models" / "forecasting"
EXPERIMENTS_DIR = BASE_DIR / "experiments"
REPORTS_DIR = BASE_DIR / "docs" / "reports"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
EXPERIMENTS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Master Definition of all 37 Active Commodities in Surabaya
ACTIVE_COMMODITY_CONFIGS = [
    # --- Kategori 4: Kritis & Volatil (Hortikultura Sayur & Bumbu Cepat Busuk) ---
    {
        "cid": 50, "name": "Cabe Rawit Merah", "category": "Kritis & Volatil",
        "model_type": "fast", "include_calendar": True, "include_keputran": True,
        "noise_ceiling": 15.0
    },
    {
        "cid": 38, "name": "Cabe Merah Besar", "category": "Kritis & Volatil",
        "model_type": "fast", "include_calendar": True, "include_keputran": True,
        "noise_ceiling": 14.0
    },
    {
        "cid": 37, "name": "Cabe Merah Keriting", "category": "Kritis & Volatil",
        "model_type": "fast", "include_calendar": True, "include_keputran": True,
        "noise_ceiling": 13.0
    },
    {
        "cid": 39, "name": "Bawang Merah", "category": "Kritis & Volatil",
        "model_type": "fast", "include_calendar": True, "include_keputran": True,
        "noise_ceiling": 10.0
    },
    {
        "cid": 46, "name": "Tomat Merah", "category": "Kritis & Volatil",
        "model_type": "fast", "include_calendar": True, "include_keputran": True,
        "noise_ceiling": 13.0
    },
    {
        "cid": 48, "name": "BUNCIS", "category": "Kritis & Volatil",
        "model_type": "fast", "include_calendar": True, "include_keputran": True,
        "noise_ceiling": 11.0
    },
    # --- Kategori 3: Moderat & Musiman ---
    {
        "cid": 16, "name": "Telur Ayam Ras", "category": "Moderat & Musiman",
        "model_type": "fast", "include_calendar": True, "include_keputran": True,
        "noise_ceiling": 5.0
    },
    {
        "cid": 49, "name": "Bawang Putih Sinco/Honan", "category": "Moderat & Musiman",
        "model_type": "fast", "include_calendar": False, "include_keputran": True,
        "noise_ceiling": 6.0
    },
    {
        "cid": 45, "name": "KENTANG", "category": "Moderat & Musiman",
        "model_type": "fast", "include_calendar": False, "include_keputran": True,
        "noise_ceiling": 5.0
    },
    {
        "cid": 47, "name": "WORTEL", "category": "Moderat & Musiman",
        "model_type": "fast", "include_calendar": False, "include_keputran": True,
        "noise_ceiling": 7.0
    },
    {
        "cid": 44, "name": "KOL/KUBIS", "category": "Moderat & Musiman",
        "model_type": "fast", "include_calendar": False, "include_keputran": True,
        "noise_ceiling": 8.0
    },
    {
        "cid": 13, "name": "Daging Ayam Ras", "category": "Moderat & Musiman",
        "model_type": "fast", "include_calendar": True, "include_keputran": True,
        "noise_ceiling": 4.0
    },
    {
        "cid": 12, "name": "Daging Sapi Paha Belakang", "category": "Moderat & Musiman",
        "model_type": "fast", "include_calendar": True, "include_keputran": True,
        "noise_ceiling": 3.0
    },
    {
        "cid": 14, "name": "Daging Ayam Kampung", "category": "Moderat & Musiman",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 3.0
    },
    {
        "cid": 17, "name": "Telur Ayam Kampung", "category": "Moderat & Musiman",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 3.0
    },
    # --- Kategori 2: Presisi Tinggi & Inersial (Bahan Pokok, HET, Biji Kering) ---
    {
        "cid": 2, "name": "Beras Premium", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 1.0
    },
    {
        "cid": 4, "name": "Beras Medium", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 1.5
    },
    {
        "cid": 7, "name": "Gula Kristal Putih", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 2.0
    },
    {
        "cid": 10, "name": "Minyak Goreng Curah", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 1.5
    },
    {
        "cid": 96, "name": "Minyak Goreng MINYAKITA", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 1.0
    },
    {
        "cid": 92, "name": "Minyak Goreng Kemasan Premium", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 2.5
    },
    {
        "cid": 28, "name": "Garam Beryodium Halus", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 1.0
    },
    {
        "cid": 30, "name": "Terigu Protein Sedang (Kemasan)", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 1.0
    },
    {
        "cid": 25, "name": "Jagung Pipilan Kering", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 1.0
    },
    {
        "cid": 43, "name": "KETELA POHON", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 1.5
    },
    {
        "cid": 32, "name": "Kedelai Impor", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 1.5
    },
    {
        "cid": 41, "name": "KACANG HIJAU", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 2.0
    },
    {
        "cid": 42, "name": "KACANG TANAH", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 2.0
    },
    # --- Kategori Perikanan (Rantai Dingin / Laut) ---
    {
        "cid": 58, "name": "Ikan Bandeng", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 3.0
    },
    {
        "cid": 59, "name": "Ikan Kembung", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 3.0
    },
    {
        "cid": 60, "name": "Ikan Tongkol", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 3.0
    },
    {
        "cid": 61, "name": "Ikan Tuna", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 3.0
    },
    {
        "cid": 62, "name": "Ikan Cakalang", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 3.0
    },
    {
        "cid": 40, "name": "Ikan Asin Teri", "category": "Presisi Tinggi & Inersial",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 1.0
    },
    # --- Kategori 1: Produk Industri Pabrikan (FMCG Non-Volatil) ---
    {
        "cid": 35, "name": "Indomie Rasa Kari Ayam", "category": "Produk Industri FMCG",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 0.5
    },
    {
        "cid": 20, "name": "Susu Kental Manis Merk Bendera", "category": "Produk Industri FMCG",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 0.5
    },
    {
        "cid": 21, "name": "Susu Kental Manis Merk Indomilk", "category": "Produk Industri FMCG",
        "model_type": "sanity", "include_calendar": False, "include_keputran": False,
        "noise_ceiling": 0.5
    }
]


def execute_commodity_eval(cfg: Dict) -> Dict:
    """Executes backtesting and champion model training for one commodity."""
    cid = cfg["cid"]
    cname = cfg["name"]
    cat = cfg["category"]
    mtype = cfg["model_type"]
    include_cal = cfg["include_calendar"]
    include_kep = cfg["include_keputran"]
    noise_ceiling = cfg["noise_ceiling"]
    horizon = 7
    window_step_days = 14
    test_start_date = "2025-01-01"

    t0 = time.time()
    try:
        df_summary, df_predictions = run_walk_forward_backtest(
            commodity_name=cid,
            horizon=horizon,
            test_start_date=test_start_date,
            window_step_days=window_step_days,
            include_weather=False,
            include_calendar=include_cal,
            model_type=mtype,
            verbose=False
        )
    except Exception as e:
        return {
            "komoditas_id": cid,
            "commodity": cname,
            "category": cat,
            "status": "FAILED",
            "error": str(e)
        }

    if df_summary.empty:
        return {
            "komoditas_id": cid,
            "commodity": cname,
            "category": cat,
            "status": "EMPTY"
        }

    summary_records = df_summary.to_dict(orient="records")

    # Candidate filtering
    baseline_rows = [r for r in summary_records if "naive" in str(r.get("Model", "")).lower() or "sma" in str(r.get("Model", "")).lower()]
    gbdt_rows = [r for r in summary_records if any(k in str(r.get("Model", "")).lower() for k in ["lightgbm", "xgboost", "catboost"])]

    best_baseline = min(baseline_rows, key=lambda x: x["WAPE (%)"]) if baseline_rows else None
    best_gbdt = min(gbdt_rows, key=lambda x: x["WAPE (%)"]) if gbdt_rows else None

    champion = None
    selection_rationale = ""

    if best_baseline and best_gbdt:
        base_wape = best_baseline["WAPE (%)"]
        gbdt_wape = best_gbdt["WAPE (%)"]
        if base_wape <= 1e-6:
            relative_imp = 0.0
        else:
            relative_imp = (base_wape - gbdt_wape) / base_wape

        # Parsimony rule: GBDT must improve WAPE by >= 3.0% relatively
        if relative_imp >= 0.03:
            champion = best_gbdt
            selection_rationale = f"GBDT ({best_gbdt['Model']}) unggul dari Baseline ({best_baseline['Model']}) dengan perbaikan WAPE {relative_imp*100:.1f}%."
        else:
            champion = best_baseline
            selection_rationale = f"Prinsip Parsimoni: Baseline ({best_baseline['Model']}, WAPE {base_wape:.2f}%) dipilih karena GBDT ({best_gbdt['Model']}, WAPE {gbdt_wape:.2f}%) tidak memberikan perbaikan signifikan (delta < 3%)."
    elif best_gbdt:
        champion = best_gbdt
        selection_rationale = "Hanya kandidat GBDT yang tersedia."
    else:
        champion = best_baseline
        selection_rationale = f"Baseline ({best_baseline['Model']}) terpilih secara langsung (komoditas stabil / inersial)."

    champ_name = champion["Model"]
    champ_wape = float(champion["WAPE (%)"])
    champ_mae = float(champion.get("MAE (Rp)", 0.0))
    champ_da_overall = float(champion.get("Directional Accuracy (%)", 0.0))
    champ_da_active = float(champion.get("Active Directional Accuracy (%)", 0.0)) if pd.notna(champion.get("Active Directional Accuracy (%)")) else None
    champ_picp = float(champion["PICP (%)"]) if pd.notna(champion.get("PICP (%)")) else None

    is_ml = any(k in champ_name.lower() for k in ["lightgbm", "catboost", "xgboost", "ridge"])
    saved_model_path = None
    feature_cols = []

    # If ML champion, retrain on full dataset and export .pkl
    if is_ml:
        try:
            df_full = build_supervised_dataset(horizon=horizon, komoditas_id=cid, include_weather=False)
            feature_cols = get_feature_columns(df_full, include_weather=False, include_calendar=include_cal, include_keputran=include_kep)
            model_obj, _ = train_champion_model(
                model_name=champ_name,
                feature_cols=feature_cols,
                df_train=df_full
            )
            slug = champ_name.lower().split()[0].replace("forecaster", "")
            model_filename = f"{slug}_{cid}_h{horizon}.pkl"
            saved_model_path = MODELS_DIR / model_filename
            with open(saved_model_path, "wb") as f:
                pickle.dump(model_obj, f)
        except Exception as e:
            print(f"  [WARN] Retraining failed for {cname}: {e}")

    elapsed = time.time() - t0

    is_ceiling_reached = champ_wape > noise_ceiling
    ceiling_comment = (
        f"Batas Performa Tercapai: WAPE ({champ_wape:.2f}%) melampaui noise ceiling ({noise_ceiling:.1f}%). Ketiadaan data pasokan fisik membatasi akurasi."
        if is_ceiling_reached else
        "Dinamika harga berada dalam rentang akurasi wajar."
    )

    return {
        "komoditas_id": cid,
        "commodity": cname,
        "category": cat,
        "status": "SUCCESS",
        "elapsed_seconds": elapsed,
        "champion_model": champ_name,
        "is_ml_model": is_ml,
        "wape_pct": champ_wape,
        "mae_rp": champ_mae,
        "da_overall_pct": champ_da_overall,
        "da_active_pct": champ_da_active,
        "picp_pct": champ_picp,
        "selection_rationale": selection_rationale,
        "ceiling_reached": is_ceiling_reached,
        "ceiling_diagnosis": ceiling_comment,
        "benchmark_summary": summary_records,
        "saved_model_path": str(saved_model_path) if saved_model_path else None,
        "feature_cols": feature_cols
    }


def main():
    parser = argparse.ArgumentParser(description="Unified Multi-Commodity Retraining")
    parser.add_argument("--workers", type=int, default=4, help="Number of worker processes")
    args = parser.parse_args()

    print("=" * 80)
    print(" HARGAWATCH SURABAYA - UNIFIED MULTI-COMMODITY RETRAINING SUITE")
    print(f" Total Komoditas: {len(ACTIVE_COMMODITY_CONFIGS)} | Workers: {args.workers}")
    print("=" * 80)

    t0_all = time.time()
    results_map = {}

    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        future_to_cid = {executor.submit(execute_commodity_eval, cfg): cfg["cid"] for cfg in ACTIVE_COMMODITY_CONFIGS}

        for future in as_completed(future_to_cid):
            cid = future_to_cid[future]
            try:
                res = future.result()
                cname = res["commodity"]
                champ = res.get("champion_model", "Unknown")
                wape = res.get("wape_pct", 0.0)
                mae = res.get("mae_rp", 0.0)
                da_ov = res.get("da_overall_pct", 0.0)
                da_ac = res.get("da_active_pct")
                da_ac_str = f"{da_ac:.1f}%" if da_ac is not None else "N/A"
                elapsed = res.get("elapsed_seconds", 0.0)

                print(f"[PROGRESS] ID {cid:2d} ({cname:30s}): Champion -> {champ:18s} | WAPE: {wape:5.2f}% | MAE: Rp {mae:5.0f} | DA Ov: {da_ov:5.1f}% | DA Act: {da_ac_str:5s} [{elapsed:.1f}s]")

                results_map[cid] = res

                # Update registry.json
                update_local_registry(
                    komoditas_id=cid,
                    canonical_name=cname,
                    horizon=7,
                    best_model_name=champ,
                    best_wape=wape,
                    model_path=res.get("saved_model_path"),
                    features=res.get("feature_cols", [])
                )

            except Exception as exc:
                print(f"[FAIL] ID {cid} generated an exception: {exc}")

    # Save comprehensive benchmark JSON
    json_path = EXPERIMENTS_DIR / "automated_benchmarks_all_commodities.json"
    sorted_results = [results_map[cfg["cid"]] for cfg in ACTIVE_COMMODITY_CONFIGS if cfg["cid"] in results_map]
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(sorted_results, f, indent=2, ensure_ascii=False)

    total_time = time.time() - t0_all
    print("\n" + "=" * 80)
    print(f" UNIFIED RETRAINING SELESAI DALAM {total_time/60:.2f} MENIT ({len(results_map)}/37 KOMODITAS BERHASIL)")
    print(f" Checkpoint JSON: {json_path}")
    print("=" * 80)


if __name__ == "__main__":
    main()
