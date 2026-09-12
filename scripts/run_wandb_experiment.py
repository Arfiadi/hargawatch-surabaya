"""W&B Experiment Tracker for HargaWatch Surabaya.

Script ini melatih model LightGBM untuk komoditas tertentu,
menghitung metrik (WAPE, MAE), membuat plot Feature Importance,
dan menyimpan model beserta metriknya ke W&B Cloud.
"""

import argparse
import os
import sys
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import wandb

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.analytics.features import build_supervised_dataset
from src.models.models import LightGBMForecaster
from src.models.backtest import compute_metrics


def run_experiment(commodity_name: str, horizon: int, include_weather: bool):
    # 1. Temukan komoditas_id
    from src.analytics.features import DATA_PROCESSED
    df_kom = pd.read_csv(DATA_PROCESSED / "dim_komoditas.csv")
    match = df_kom[df_kom["komoditas"].str.lower() == commodity_name.lower()]
    if match.empty:
        raise ValueError(f"Komoditas '{commodity_name}' tidak ditemukan.")
    komoditas_id = int(match["komoditas_id"].iloc[0])

    # 2. Inisialisasi W&B
    run = wandb.init(
        project="hargawatch-surabaya",
        name=f"LGBM-{commodity_name.replace(' ', '_')}-H{horizon}",
        config={
            "commodity": commodity_name,
            "komoditas_id": komoditas_id,
            "horizon_days": horizon,
            "include_weather": include_weather,
            "model_type": "LightGBM_MultiQuantile",
            "features": "lags_rolling_calendar_weather"
        }
    )

    print(f"[W&B] Menyiapkan dataset untuk {commodity_name}...")
    df = build_supervised_dataset(horizon=horizon, komoditas_id=komoditas_id, include_weather=include_weather)
    
    # Fitur
    feature_cols = [
        "pasar_id", "price_current", "price_lag_1", "price_lag_2", "price_lag_3",
        "price_lag_7", "price_lag_14", "rolling_mean_7d", "rolling_std_7d",
        "rolling_mean_14d", "rolling_std_14d", "pct_change_1d", "pct_change_7d",
        "target_bulan", "target_is_weekend", "target_is_libur_nasional",
        "target_is_ramadan", "target_is_pra_ramadan"
    ]
    if include_weather:
        weather_cols = ["curah_hujan_mm", "rain_sum_7d", "rain_sum_14d", "rain_lag_28d"]
        feature_cols += [c for c in weather_cols if c in df.columns]

    # Split: Train (sebelum 2026), Test (2026 ke atas)
    train_df = df[df["tanggal"] < "2026-01-01"]
    test_df = df[df["tanggal"] >= "2026-01-01"]

    y_train = train_df["target_price"]
    y_test = test_df["target_price"].values
    y_origin = test_df["price_current"].values

    print("[W&B] Melatih Model LightGBM...")
    model = LightGBMForecaster(feature_cols=feature_cols, categorical_cols=["pasar_id"])
    model.fit(train_df, y_train)

    print("[W&B] Mengevaluasi Model...")
    preds = model.predict(test_df)
    pred_p50 = preds["harga_prediksi"]

    # Hitung Metrik
    metrics = compute_metrics(y_test, pred_p50, y_origin)
    print("Metrik Evaluasi:")
    for k, v in metrics.items():
        print(f"  {k}: {v}")
    
    # 3. Log metrik ke W&B
    wandb.log(metrics)

    # 4. Buat dan Log Plot Feature Importance
    feat_imp = model.get_feature_importances()
    plt.figure(figsize=(10, 8))
    plt.barh(feat_imp["feature"][:15][::-1], feat_imp["importance"][:15][::-1], color="#2563EB")
    plt.title(f"Top 15 Feature Importance ({commodity_name})")
    plt.xlabel("Importance Score")
    plt.tight_layout()
    
    plot_path = f"feat_imp_{komoditas_id}.png"
    plt.savefig(plot_path)
    wandb.log({"Feature Importance": wandb.Image(plot_path)})
    os.remove(plot_path)

    # 5. Simpan Model ke W&B Artifacts (Model Registry)
    os.makedirs("models", exist_ok=True)
    model_path = f"models/lgbm_{komoditas_id}_h{horizon}.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    
    artifact = wandb.Artifact(
        name=f"model-{komoditas_id}-h{horizon}",
        type="model",
        description=f"LightGBM Quantile model for {commodity_name} (Horizon: {horizon})"
    )
    artifact.add_file(model_path)
    run.log_artifact(artifact)

    print(f"\n[SUCCESS] Eksperimen berhasil dicatat di W&B! Cek dashboard Anda.")
    run.finish()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--commodity", type=str, default="Cabe Rawit Merah")
    parser.add_argument("--horizon", type=int, default=7)
    parser.add_argument("--no-weather", action="store_true")
    args = parser.parse_args()

    run_experiment(args.commodity, args.horizon, not args.no_weather)
