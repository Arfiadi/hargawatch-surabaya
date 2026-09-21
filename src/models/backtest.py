"""Walk-forward rolling-origin backtesting engine for HargaWatch Surabaya.

Evaluates multi-step direct forecasting without temporal data leakage.
Computes WAPE, MAE, sMAPE, Directional Accuracy, and Prediction Interval Coverage.
"""

import argparse
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

from src.analytics.features import build_supervised_dataset
from src.models.models import NaiveLastValueForecaster, NaiveSMAForecaster, LightGBMForecaster


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_origin: np.ndarray) -> Dict[str, float]:
    """Computes time-series forecasting metrics."""
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    y_origin = np.asarray(y_origin, dtype=float)
    
    abs_errors = np.abs(y_true - y_pred)
    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    wape = float(np.sum(abs_errors) / (np.sum(y_true) + 1e-5)) * 100
    
    denominator = (np.abs(y_true) + np.abs(y_pred)) / 2.0 + 1e-5
    smape = float(np.mean(abs_errors / denominator)) * 100
    
    # Directional accuracy relative to origin price
    actual_dir = np.sign(y_true - y_origin)
    pred_dir = np.sign(y_pred - y_origin)
    da = float(np.mean(actual_dir == pred_dir)) * 100
    
    return {
        "MAE (Rp)": round(mae, 2),
        "RMSE (Rp)": round(rmse, 2),
        "WAPE (%)": round(wape, 2),
        "sMAPE (%)": round(smape, 2),
        "Directional Accuracy (%)": round(da, 2)
    }


def run_walk_forward_backtest(
    commodity_name: str = "Cabe Rawit Merah",
    horizon: int = 7,
    test_start_date: str = "2025-01-01",
    window_step_days: int = 14,
    include_weather: bool = True
) -> pd.DataFrame:
    """Executes walk-forward rolling-origin validation on out-of-sample data."""
    # Find commodity_id
    from src.analytics.features import DATA_PROCESSED
    df_kom = pd.read_csv(DATA_PROCESSED / "dim_komoditas.csv")
    match = df_kom[df_kom["komoditas"].str.lower() == commodity_name.lower()]
    if match.empty:
        raise ValueError(f"Commodity '{commodity_name}' not found in dim_komoditas.csv")
    komoditas_id = int(match["komoditas_id"].iloc[0])

    print(f"\n[BACKTEST] Building supervised dataset for {commodity_name} (ID: {komoditas_id}), Horizon: {horizon}d...")
    df = build_supervised_dataset(horizon=horizon, komoditas_id=komoditas_id, include_weather=include_weather)
    
    # Define feature set
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

    split_date = pd.Timestamp(test_start_date)
    test_dates = df[df["tanggal"] >= split_date]["tanggal"].drop_duplicates().sort_values().tolist()
    
    if not test_dates:
        raise ValueError(f"No test observations found after {test_start_date}")

    # Rolling evaluation steps
    eval_dates = test_dates[::window_step_days]
    print(f"[BACKTEST] Testing across {len(eval_dates)} rolling evaluation origin windows from {eval_dates[0].date()} to {eval_dates[-1].date()}...")

    results = {"Naive Last Value": [], "Naive 7d SMA": [], "LightGBM p50": []}
    coverage_count = 0
    total_samples = 0

    for i, origin_date in enumerate(eval_dates):
        train_df = df[df["tanggal"] < origin_date]
        test_slice = df[df["tanggal"] == origin_date]
        
        if train_df.empty or test_slice.empty:
            continue
            
        y_train = train_df["target_price"]
        X_train = train_df[feature_cols]
        y_test = test_slice["target_price"].values
        y_origin = test_slice["price_current"].values
        
        # 1. Naive Last Value
        m_naive = NaiveLastValueForecaster()
        pred_naive = m_naive.predict(test_slice)
        
        # 2. Naive SMA
        m_sma = NaiveSMAForecaster()
        pred_sma = m_sma.predict(test_slice)
        
        # 3. LightGBM
        m_lgb = LightGBMForecaster(feature_cols=feature_cols, categorical_cols=["pasar_id"])
        m_lgb.fit(train_df, y_train)
        pred_lgb_dict = m_lgb.predict(test_slice)
        pred_lgb = pred_lgb_dict["harga_prediksi"]
        
        # Coverage check for prediction intervals (p10 to p90)
        low = pred_lgb_dict["batas_bawah"]
        high = pred_lgb_dict["batas_atas"]
        coverage_count += np.sum((y_test >= low) & (y_test <= high))
        total_samples += len(y_test)
        
        results["Naive Last Value"].append((y_test, pred_naive, y_origin))
        results["Naive 7d SMA"].append((y_test, pred_sma, y_origin))
        results["LightGBM p50"].append((y_test, pred_lgb, y_origin))

    # Aggregate metrics
    summary_rows = []
    for model_name, preds_list in results.items():
        all_y_test = np.concatenate([p[0] for p in preds_list])
        all_y_pred = np.concatenate([p[1] for p in preds_list])
        all_y_origin = np.concatenate([p[2] for p in preds_list])
        
        metrics = compute_metrics(all_y_test, all_y_pred, all_y_origin)
        metrics["Model"] = model_name
        summary_rows.append(metrics)
        
    df_summary = pd.DataFrame(summary_rows)[["Model", "WAPE (%)", "MAE (Rp)", "RMSE (Rp)", "sMAPE (%)", "Directional Accuracy (%)"]]
    
    picp = round((coverage_count / max(total_samples, 1)) * 100, 2)
    print(f"\n========================================================")
    print(f"  BACKTEST RESULTS: {commodity_name} ({horizon}-Day Horizon)")
    print(f"========================================================")
    print(df_summary.to_string(index=False))
    print(f"\nLightGBM 80% Prediction Interval Coverage (p10-p90): {picp}%")
    print(f"========================================================\n")
    
    return df_summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Walk-Forward Backtesting for HargaWatch")
    parser.add_argument("--commodity", type=str, default="Cabe Rawit Merah")
    parser.add_argument("--horizon", type=int, default=7)
    parser.add_argument("--test-start", type=str, default="2025-01-01")
    parser.add_argument("--no-weather", action="store_true")
    args = parser.parse_args()
    
    run_walk_forward_backtest(
        commodity_name=args.commodity,
        horizon=args.horizon,
        test_start_date=args.test_start,
        include_weather=not args.no_weather
    )
