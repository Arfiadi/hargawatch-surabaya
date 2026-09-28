"""Walk-forward rolling-origin backtesting engine for HargaWatch Surabaya.

Evaluates multi-step direct forecasting without temporal data leakage.
Computes WAPE, MAE, RMSE, sMAPE, Directional Accuracy, and Prediction Interval Coverage (PICP).
Returns both summary performance metrics (df_summary) and granular predictions (df_predictions).
"""

import argparse
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

from src.analytics.features import build_supervised_dataset, DATA_PROCESSED
from src.analytics.metrics import (
    compute_metrics,
    compute_wape,
    compute_mae,
    compute_rmse,
    compute_smape,
    compute_picp,
    compute_directional_accuracy
)
from src.models.models import (
    NaiveLastValueForecaster,
    NaiveSMAForecaster,
    RidgeForecaster,
    LightGBMForecaster,
    XGBoostForecaster,
    CatBoostForecaster,
    AutoARIMAForecaster,
    AutoETSForecaster
)


def resolve_commodity(commodity_name: Union[str, int]) -> Tuple[int, str]:
    """Resolves commodity name or ID to (komoditas_id, canonical_name).
    
    Handles integer IDs, numeric strings, spelling variations (e.g., 'Cabai' vs 'Cabe'),
    case-insensitivity, and substring searches.
    """
    df_kom = pd.read_csv(DATA_PROCESSED / "dim_komoditas.csv")
    
    # 0. Check for numeric ID or numeric string
    if isinstance(commodity_name, (int, np.integer)) or (isinstance(commodity_name, str) and commodity_name.strip().isdigit()):
        cid = int(commodity_name)
        id_match = df_kom[df_kom["komoditas_id"] == cid]
        if not id_match.empty:
            return int(id_match["komoditas_id"].iloc[0]), str(id_match["komoditas"].iloc[0])

    query = str(commodity_name).strip()
    if not query:
        raise ValueError("Commodity identifier cannot be empty.")
    
    # 1. Exact case-insensitive match
    match = df_kom[df_kom["komoditas"].str.lower() == query.lower()]
    if not match.empty:
        return int(match["komoditas_id"].iloc[0]), str(match["komoditas"].iloc[0])
        
    # 2. Normalized 'cabai' -> 'cabe'
    normalized = query.lower().replace("cabai", "cabe")
    match = df_kom[df_kom["komoditas"].str.lower() == normalized]
    if not match.empty:
        return int(match["komoditas_id"].iloc[0]), str(match["komoditas"].iloc[0])
        
    # 3. Substring search
    match = df_kom[df_kom["komoditas"].str.lower().str.contains(query.lower(), regex=False)]
    if not match.empty:
        return int(match["komoditas_id"].iloc[0]), str(match["komoditas"].iloc[0])

    match = df_kom[df_kom["komoditas"].str.lower().str.contains(normalized, regex=False)]
    if not match.empty:
        return int(match["komoditas_id"].iloc[0]), str(match["komoditas"].iloc[0])

    available = df_kom["komoditas"].tolist()
    raise ValueError(f"Commodity '{commodity_name}' not found in dim_komoditas.csv. Available: {available[:8]}...")


def run_walk_forward_backtest(
    commodity_name: str = "Cabe Rawit Merah",
    horizon: int = 7,
    test_start_date: str = "2025-01-01",
    window_step_days: int = 14,
    include_weather: bool = True,
    include_calendar: bool = True,
    model_type: str = "all",
    model_params: Optional[Dict] = None,
    verbose: bool = True
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Executes walk-forward rolling-origin validation on out-of-sample data.
    
    Parameters
    ----------
    commodity_name : str
        Target commodity name.
    horizon : int
        Forecasting horizon in days (default: 7).
    test_start_date : str
        Start date for test evaluation period.
    window_step_days : int
        Step size in days between rolling origins (default: 14).
    include_weather : bool
        Whether to include lagged weather features.
    include_calendar : bool
        Whether to include future calendar features (Ramadan, weekends, holidays).
    model_type : str
        'all', 'lightgbm', 'ridge', 'naive_last', or 'naive_sma'.
    model_params : Optional[Dict]
        Hyperparameter overrides for the forecaster.
    verbose : bool
        Whether to print summary tables.
        
    Returns
    -------
    Tuple[pd.DataFrame, pd.DataFrame]
        df_summary : DataFrame
            Aggregated metric comparison across models.
        df_predictions : DataFrame
            Out-of-sample predictions containing:
            ['tanggal', 'tanggal_origin', 'pasar_id', 'komoditas_id',
             'harga_aktual', 'harga_prediksi', 'batas_bawah', 'batas_atas', ...]
    """
    komoditas_id, canonical_name = resolve_commodity(commodity_name)

    if verbose:
        print(f"\n[BACKTEST] Building supervised dataset for {canonical_name} (ID: {komoditas_id}), Horizon: {horizon}d...")
    
    df = build_supervised_dataset(
        horizon=horizon,
        komoditas_id=komoditas_id,
        include_weather=include_weather
    )
    
    # Base feature set: Price lags & rolling statistics
    feature_cols = [
        "pasar_id", "price_current", "price_lag_1", "price_lag_2", "price_lag_3",
        "price_lag_7", "price_lag_14", "rolling_mean_7d", "rolling_std_7d",
        "rolling_mean_14d", "rolling_std_14d", "pct_change_1d", "pct_change_7d"
    ]
    
    # Calendar feature toggle
    if include_calendar:
        calendar_cols = [
            "target_bulan", "target_is_weekend", "target_is_libur_nasional",
            "target_is_ramadan", "target_is_pra_ramadan"
        ]
        feature_cols += [c for c in calendar_cols if c in df.columns]

    # Weather feature toggle
    if include_weather:
        weather_cols = ["curah_hujan_mm", "rain_sum_7d", "rain_sum_14d", "rain_lag_28d", "rain_lag_7d", "rain_lag_14d"]
        feature_cols += [c for c in weather_cols if c in df.columns]

    # Retain only columns present in df
    feature_cols = [c for c in feature_cols if c in df.columns]

    split_date = pd.Timestamp(test_start_date)
    test_dates = df[df["tanggal"] >= split_date]["tanggal"].drop_duplicates().sort_values().tolist()
    
    if not test_dates:
        raise ValueError(f"No test observations found after {test_start_date}")

    eval_dates = test_dates[::window_step_days]
    if verbose:
        print(f"[BACKTEST] Testing across {len(eval_dates)} rolling evaluation origin windows from {eval_dates[0].date()} to {eval_dates[-1].date()}...")
        print(f"[BACKTEST] Feature count: {len(feature_cols)} features (Weather: {include_weather}, Calendar: {include_calendar})")

    # Validate model_type
    valid_models = {
        "all", "ensemble", "lightgbm", "lgb", "lgbm", "ridge", "linear",
        "naive", "naive_last", "naivelastvalue", "naive_sma", "sma",
        "xgboost", "xgb", "catboost", "cb", "auto_arima", "arima", "auto_ets", "ets",
        "sanity", "statistical", "gbdt"
    }
    norm_model = model_type.lower().strip()
    if norm_model not in valid_models:
        raise ValueError(
            f"Unsupported model_type '{model_type}'. Expected one of: 'lightgbm', 'xgboost', 'catboost', 'auto_arima', 'auto_ets', 'ridge', 'naive_last', 'naive_sma', 'sanity', 'statistical', 'gbdt', 'all'."
        )

    eval_all = norm_model in ["all", "ensemble"]
    do_naive_last = eval_all or norm_model in ["naive", "naive_last", "naivelastvalue", "sanity"]
    do_naive_sma = eval_all or norm_model in ["naive_sma", "sma", "sanity"]
    do_ridge = eval_all or norm_model in ["ridge", "linear"]
    do_lightgbm = eval_all or norm_model in ["lightgbm", "lgb", "lgbm", "gbdt"]
    do_xgboost = eval_all or norm_model in ["xgboost", "xgb", "gbdt"]
    do_catboost = eval_all or norm_model in ["catboost", "cb", "gbdt"]
    do_auto_arima = eval_all or norm_model in ["auto_arima", "arima", "statistical"]
    do_auto_ets = eval_all or norm_model in ["auto_ets", "ets", "statistical"]

    # Storage for results per model: (y_test, y_pred, y_origin, low, high)
    model_records: Dict[str, List[Tuple[np.ndarray, np.ndarray, np.ndarray, Optional[np.ndarray], Optional[np.ndarray]]]] = {}
    if do_naive_last:
        model_records["Naive Last Value"] = []
    if do_naive_sma:
        model_records["Naive 7d SMA"] = []
    if do_ridge:
        model_records["Ridge Regression"] = []
    if do_lightgbm:
        model_records["LightGBM p50"] = []
    if do_xgboost:
        model_records["XGBoost p50"] = []
    if do_catboost:
        model_records["CatBoost p50"] = []
    if do_auto_arima:
        model_records["AutoARIMA"] = []
    if do_auto_ets:
        model_records["AutoETS"] = []

    all_pred_rows: List[pd.DataFrame] = []

    for i, origin_date in enumerate(eval_dates):
        # Fix P0-4: Use target_date to prevent target realization leakage.
        # Only include rows whose target has already been realized by origin_date.
        if "target_date" in df.columns:
            train_df = df[df["target_date"] <= origin_date]
        else:
            train_df = df[df["tanggal"] <= origin_date - pd.Timedelta(days=horizon)]
        test_slice = df[df["tanggal"] == origin_date].copy()
        
        if train_df.empty or test_slice.empty:
            continue
            
        y_train = train_df["target_price"]
        y_test = test_slice["target_price"].values
        y_origin = test_slice["price_current"].values
        n_slice = len(y_test)

        slice_preds: Dict[str, Dict[str, np.ndarray]] = {}

        # 1. Naive Last Value (point baseline: low/high set to point forecast for tables, but None in metric intervals)
        if do_naive_last:
            m_naive = NaiveLastValueForecaster()
            p_naive = m_naive.predict(test_slice)
            slice_preds["Naive Last Value"] = {
                "pred": p_naive, "low": p_naive, "high": p_naive
            }
            model_records["Naive Last Value"].append((y_test, p_naive, y_origin, None, None))

        # 2. Naive SMA
        if do_naive_sma:
            m_sma = NaiveSMAForecaster()
            p_sma = m_sma.predict(test_slice)
            slice_preds["Naive 7d SMA"] = {
                "pred": p_sma, "low": p_sma, "high": p_sma
            }
            model_records["Naive 7d SMA"].append((y_test, p_sma, y_origin, None, None))

        # 3. Ridge Regression
        if do_ridge:
            m_ridge = RidgeForecaster(feature_cols=feature_cols, categorical_cols=["pasar_id"])
            m_ridge.fit(train_df, y_train)
            dict_ridge = m_ridge.predict(test_slice)
            p_ridge = dict_ridge["harga_prediksi"]
            low_ridge = dict_ridge["batas_bawah"]
            high_ridge = dict_ridge["batas_atas"]
            slice_preds["Ridge Regression"] = {
                "pred": p_ridge, "low": low_ridge, "high": high_ridge
            }
            model_records["Ridge Regression"].append((y_test, p_ridge, y_origin, low_ridge, high_ridge))

        # 4. LightGBM
        if do_lightgbm:
            m_lgb = LightGBMForecaster(
                feature_cols=feature_cols,
                categorical_cols=["pasar_id"],
                params=model_params
            )
            m_lgb.fit(train_df, y_train)
            dict_lgb = m_lgb.predict(test_slice)
            p_lgb = dict_lgb["harga_prediksi"]
            low_lgb = dict_lgb["batas_bawah"]
            high_lgb = dict_lgb["batas_atas"]
            slice_preds["LightGBM p50"] = {
                "pred": p_lgb, "low": low_lgb, "high": high_lgb
            }
            model_records["LightGBM p50"].append((y_test, p_lgb, y_origin, low_lgb, high_lgb))

        # 5. XGBoost
        if do_xgboost:
            m_xgb = XGBoostForecaster(
                feature_cols=feature_cols,
                categorical_cols=["pasar_id"],
                params=model_params
            )
            m_xgb.fit(train_df, y_train)
            dict_xgb = m_xgb.predict(test_slice)
            p_xgb = dict_xgb["harga_prediksi"]
            low_xgb = dict_xgb["batas_bawah"]
            high_xgb = dict_xgb["batas_atas"]
            slice_preds["XGBoost p50"] = {
                "pred": p_xgb, "low": low_xgb, "high": high_xgb
            }
            model_records["XGBoost p50"].append((y_test, p_xgb, y_origin, low_xgb, high_xgb))

        # 6. CatBoost
        if do_catboost:
            m_cb = CatBoostForecaster(
                feature_cols=feature_cols,
                categorical_cols=["pasar_id"],
                params=model_params
            )
            m_cb.fit(train_df, y_train)
            dict_cb = m_cb.predict(test_slice)
            p_cb = dict_cb["harga_prediksi"]
            low_cb = dict_cb["batas_bawah"]
            high_cb = dict_cb["batas_atas"]
            slice_preds["CatBoost p50"] = {
                "pred": p_cb, "low": low_cb, "high": high_cb
            }
            model_records["CatBoost p50"].append((y_test, p_cb, y_origin, low_cb, high_cb))

        # 7. AutoARIMA
        if do_auto_arima:
            m_arima = AutoARIMAForecaster(
                horizon=horizon,
                season_length=7,
                params=model_params
            )
            m_arima.fit(train_df, y_train)
            dict_arima = m_arima.predict(test_slice)
            p_arima = dict_arima["harga_prediksi"]
            low_arima = dict_arima["batas_bawah"]
            high_arima = dict_arima["batas_atas"]
            slice_preds["AutoARIMA"] = {
                "pred": p_arima, "low": low_arima, "high": high_arima
            }
            model_records["AutoARIMA"].append((y_test, p_arima, y_origin, low_arima, high_arima))

        # 8. AutoETS
        if do_auto_ets:
            m_ets = AutoETSForecaster(
                horizon=horizon,
                season_length=7,
                params=model_params
            )
            m_ets.fit(train_df, y_train)
            dict_ets = m_ets.predict(test_slice)
            p_ets = dict_ets["harga_prediksi"]
            low_ets = dict_ets["batas_bawah"]
            high_ets = dict_ets["batas_atas"]
            slice_preds["AutoETS"] = {
                "pred": p_ets, "low": low_ets, "high": high_ets
            }
            model_records["AutoETS"].append((y_test, p_ets, y_origin, low_ets, high_ets))

        # Determine primary model outputs for df_predictions
        if do_lightgbm and "LightGBM p50" in slice_preds:
            primary_dict = slice_preds["LightGBM p50"]
        elif do_catboost and "CatBoost p50" in slice_preds:
            primary_dict = slice_preds["CatBoost p50"]
        elif do_xgboost and "XGBoost p50" in slice_preds:
            primary_dict = slice_preds["XGBoost p50"]
        elif do_auto_arima and "AutoARIMA" in slice_preds:
            primary_dict = slice_preds["AutoARIMA"]
        elif do_auto_ets and "AutoETS" in slice_preds:
            primary_dict = slice_preds["AutoETS"]
        elif do_ridge and "Ridge Regression" in slice_preds:
            primary_dict = slice_preds["Ridge Regression"]
        elif do_naive_sma and "Naive 7d SMA" in slice_preds:
            primary_dict = slice_preds["Naive 7d SMA"]
        elif "Naive Last Value" in slice_preds:
            primary_dict = slice_preds["Naive Last Value"]
        else:
            primary_dict = next(iter(slice_preds.values()))

        # Build granular prediction dataframe for this window
        target_dates = test_slice["target_date"]
        if pd.api.types.is_datetime64_any_dtype(target_dates):
            target_dates_str = target_dates.dt.strftime("%Y-%m-%d").values
        else:
            target_dates_str = target_dates.astype(str).values

        origin_dates = test_slice["tanggal"]
        if pd.api.types.is_datetime64_any_dtype(origin_dates):
            origin_dates_str = origin_dates.dt.strftime("%Y-%m-%d").values
        else:
            origin_dates_str = origin_dates.astype(str).values

        pred_df = pd.DataFrame({
            "tanggal": target_dates_str,
            "tanggal_origin": origin_dates_str,
            "pasar_id": test_slice["pasar_id"].values,
            "komoditas_id": komoditas_id,
            "harga_aktual": y_test,
            "harga_prediksi": primary_dict["pred"],
            "batas_bawah": primary_dict["low"],
            "batas_atas": primary_dict["high"],
            "price_current": y_origin,
            "price_lag_7": test_slice["price_lag_7"].values if "price_lag_7" in test_slice.columns else y_origin,
            "rolling_std_14d": test_slice["rolling_std_14d"].values if "rolling_std_14d" in test_slice.columns else np.zeros(n_slice)
        })

        # Also append individual model predictions if present
        for m_name, m_dict in slice_preds.items():
            clean_col = m_name.lower().replace(" ", "_")
            pred_df[f"pred_{clean_col}"] = m_dict["pred"]

        all_pred_rows.append(pred_df)

    if not all_pred_rows:
        return pd.DataFrame(), pd.DataFrame()

    df_predictions = pd.concat(all_pred_rows, ignore_index=True)

    # Compute aggregate summary metrics for each evaluated model
    summary_rows = []
    for model_name, preds_list in model_records.items():
        if not preds_list:
            continue
        all_y_test = np.concatenate([p[0] for p in preds_list])
        all_y_pred = np.concatenate([p[1] for p in preds_list])
        all_y_origin = np.concatenate([p[2] for p in preds_list])
        low_candidates = [p[3] for p in preds_list if p[3] is not None]
        high_candidates = [p[4] for p in preds_list if p[4] is not None]
        all_low = np.concatenate(low_candidates) if low_candidates else None
        all_high = np.concatenate(high_candidates) if high_candidates else None

        metrics = compute_metrics(
            y_true=all_y_test,
            y_pred=all_y_pred,
            y_origin=all_y_origin,
            lower=all_low,
            upper=all_high
        )
        metrics["Model"] = model_name
        summary_rows.append(metrics)

    metric_cols = [
        "Model", "WAPE (%)", "MAE (Rp)", "RMSE (Rp)",
        "sMAPE (%)", "Directional Accuracy (%)", "PICP (%)"
    ]
    df_summary = pd.DataFrame(summary_rows)
    existing_metric_cols = [c for c in metric_cols if c in df_summary.columns]
    df_summary = df_summary[existing_metric_cols]

    if verbose:
        print(f"\n=========================================================================")
        print(f"  WALK-FORWARD BACKTEST RESULTS: {canonical_name} ({horizon}-Day Horizon)")
        print(f"=========================================================================")
        print(df_summary.to_string(index=False))
        if "LightGBM p50" in df_summary["Model"].values:
            lgb_row = df_summary[df_summary["Model"] == "LightGBM p50"].iloc[0]
            picp_val = lgb_row.get("PICP (%)", "N/A")
            print(f"\nLightGBM 80% Prediction Interval Coverage (p10-p90): {picp_val}%")
        print(f"=========================================================================\n")

    return df_summary, df_predictions


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Walk-Forward Backtesting for HargaWatch")
    parser.add_argument("--commodity", type=str, default="Cabe Rawit Merah")
    parser.add_argument("--horizon", type=int, default=7)
    parser.add_argument("--test-start", type=str, default="2025-01-01")
    parser.add_argument("--step-days", type=int, default=14)
    parser.add_argument("--model-type", type=str, default="all")
    parser.add_argument("--no-weather", action="store_true")
    parser.add_argument("--no-calendar", action="store_true")
    args = parser.parse_args()
    
    df_sum, df_pred = run_walk_forward_backtest(
        commodity_name=args.commodity,
        horizon=args.horizon,
        test_start_date=args.test_start,
        window_step_days=args.step_days,
        include_weather=not args.no_weather,
        include_calendar=not args.no_calendar,
        model_type=args.model_type
    )
