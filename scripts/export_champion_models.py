"""Script untuk menghasilkan dan menyimpan model champion (.pkl) ke models/forecasting/

Membangun file .pkl lokal dan registry.json resmi untuk seluruh komoditas prioritas
berdasarkan hasil riset & eksperimen benchmark.
"""

import datetime
import json
import os
import pickle
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.analytics.features import build_supervised_dataset
from src.models.models import LightGBMForecaster, CatBoostForecaster, HAS_CATBOOST

MODEL_DIR = BASE_DIR / "models" / "forecasting"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
REGISTRY_FILE = MODEL_DIR / "registry.json"

CHAMPIONS_CONFIG = [
    {
        "komoditas_id": 50,
        "name": "Cabe Rawit Merah",
        "model_type": "lightgbm",
        "model_name": "LightGBM p50",
        "wape_pct": 13.79,
        "include_calendar": True,
        "is_naive": False
    },
    {
        "komoditas_id": 39,
        "name": "Bawang Merah",
        "model_type": "catboost",
        "model_name": "CatBoost p50",
        "wape_pct": 6.97,
        "include_calendar": False,
        "is_naive": False
    },
    {
        "komoditas_id": 16,
        "name": "Telur Ayam Ras",
        "model_type": "catboost",
        "model_name": "CatBoost p50",
        "wape_pct": 3.22,
        "include_calendar": False,
        "is_naive": False
    },
    {
        "komoditas_id": 10,
        "name": "Minyak Goreng Curah",
        "model_type": "lightgbm",
        "model_name": "LightGBM p50",
        "wape_pct": 1.50,
        "include_calendar": False,
        "is_naive": False
    },
    {
        "komoditas_id": 2,
        "name": "Beras Premium",
        "model_type": "naive",
        "model_name": "Naive Last Value",
        "wape_pct": 0.10,
        "include_calendar": False,
        "is_naive": True
    },
    {
        "komoditas_id": 13,
        "name": "Daging Ayam Ras",
        "model_type": "naive",
        "model_name": "Naive Last Value",
        "wape_pct": 2.00,
        "include_calendar": False,
        "is_naive": True
    },
    {
        "komoditas_id": 3,
        "name": "Bawang Putih",
        "model_type": "naive",
        "model_name": "Naive Last Value",
        "wape_pct": 3.62,
        "include_calendar": False,
        "is_naive": True
    },
    {
        "komoditas_id": 7,
        "name": "Gula Kristal Putih",
        "model_type": "naive",
        "model_name": "Naive Last Value",
        "wape_pct": 0.62,
        "include_calendar": False,
        "is_naive": True
    }
]

BASE_FEATURES = [
    "pasar_id", "price_current", "price_lag_1", "price_lag_2", "price_lag_3",
    "price_lag_7", "price_lag_14", "rolling_mean_7d", "rolling_std_7d",
    "rolling_mean_14d", "rolling_std_14d", "pct_change_1d", "pct_change_7d"
]

CALENDAR_FEATURES = [
    "target_bulan", "target_is_weekend", "target_is_libur_nasional",
    "target_is_ramadan", "target_is_pra_ramadan"
]


def main():
    print("=" * 65)
    print("  EXPORT CHAMPION ML MODELS KE FOLDER models/forecasting/")
    print("=" * 65)
    
    registry = {}
    if REGISTRY_FILE.exists():
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                registry = json.load(f)
        except Exception:
            registry = {}

    horizon = 7

    for cfg in CHAMPIONS_CONFIG:
        cid = cfg["komoditas_id"]
        cname = cfg["name"]
        key = f"{cid}_h{horizon}"
        
        feature_cols = list(BASE_FEATURES)
        if cfg["include_calendar"]:
            feature_cols += CALENDAR_FEATURES
            
        print(f"\n[INFO] Memproses komoditas: {cname} (ID: {cid})...")

        if cfg["is_naive"]:
            print(f"  -> Model Champion: {cfg['model_name']} (Baseline HET, tidak butuh file biner .pkl)")
            registry[key] = {
                "komoditas_id": cid,
                "commodity": cname,
                "horizon": horizon,
                "model_name": cfg["model_name"],
                "wape_pct": cfg["wape_pct"],
                "model_path": None,
                "features": feature_cols,
                "updated_at": datetime.datetime.now().isoformat()
            }
            continue

        # Machine Learning Model (.pkl)
        print(f"  -> Model Champion: {cfg['model_name']} ({cfg['model_type'].upper()})")
        print("  -> Membangun supervised training set...")
        df_train = build_supervised_dataset(horizon=horizon, komoditas_id=cid)
        
        if df_train.empty:
            print(f"  [ERROR] Dataframe training untuk ID {cid} kosong!")
            continue

        use_cols = [c for c in feature_cols if c in df_train.columns]
        train_data = df_train.dropna(subset=["target_price"] + use_cols).copy()
        y_train = train_data["target_price"]
        
        print(f"  -> Training pada {len(train_data)} baris data historis...")
        if cfg["model_type"] == "catboost" and HAS_CATBOOST:
            model = CatBoostForecaster(feature_cols=use_cols, categorical_cols=["pasar_id"])
        else:
            model = LightGBMForecaster(feature_cols=use_cols, categorical_cols=["pasar_id"])
            
        model.fit(train_data, y_train)
        
        slug = cfg["model_type"]
        pkl_filename = f"{slug}_{cid}_h{horizon}.pkl"
        pkl_path = MODEL_DIR / pkl_filename
        
        with open(pkl_path, "wb") as f:
            pickle.dump(model, f)
            
        size_kb = pkl_path.stat().st_size / 1024
        print(f"  -> [BERHASIL] File model disimpan ke: {pkl_path.relative_to(BASE_DIR)} ({size_kb:.1f} KB)")
        
        registry[key] = {
            "komoditas_id": cid,
            "commodity": cname,
            "horizon": horizon,
            "model_name": cfg["model_name"],
            "wape_pct": cfg["wape_pct"],
            "model_path": str(pkl_path),
            "features": use_cols,
            "updated_at": datetime.datetime.now().isoformat()
        }

    # Simpan registry.json
    with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)
        
    print("\n" + "=" * 65)
    print(f"[SELESAI] Master registry diperbarui di: {REGISTRY_FILE.relative_to(BASE_DIR)}")
    print(f"Total model terdaftar: {len(registry)}")
    print("=" * 65)


if __name__ == "__main__":
    main()
