"""Early Warning System (EWS) Scoring and Classification Engine for HargaWatch.

Computes 4 composite risk sub-scores (0-25 each, 0-100 total):
1. skor_tren: 7-day price momentum and trajectory
2. skor_volatilitas: 14-day rolling price variance vs historical baseline
3. skor_anomali: Cross-market disparity (spread above Surabaya city-wide median)
4. skor_prediksi: Magnitude of projected future price surge from forecasting model

Classifies status:
- NORMAL (< 40)
- WASPADA (40 - 69)
- TINGGI (>= 70)
"""

from typing import Optional
import numpy as np
import pandas as pd


def compute_early_warning_scores(
    df_current_features: pd.DataFrame,
    df_forecasts: pd.DataFrame
) -> pd.DataFrame:
    """Calculates deterministic risk scores and warning status.
    
    Parameters
    ----------
    df_current_features : pd.DataFrame
        Latest slice of features at date t with current prices, lags, and rolling stats.
        Required columns: ['tanggal', 'pasar_id', 'komoditas_id', 'price_current',
                           'price_lag_7', 'rolling_std_14d']
    df_forecasts : pd.DataFrame
        Forecasted prices for future horizon.
        Required columns: ['pasar_id', 'komoditas_id', 'harga_prediksi']
        
    Returns
    -------
    pd.DataFrame
        DataFrame matching public.fact_early_warning schema.
    """
    df = df_current_features.copy()
    
    # Merge future prediction at earliest horizon (e.g., t+7)
    df = df.merge(
        df_forecasts[["pasar_id", "komoditas_id", "harga_prediksi"]].drop_duplicates(subset=["pasar_id", "komoditas_id"]),
        on=["pasar_id", "komoditas_id"],
        how="left"
    )
    
    # 1. Skor Tren (0-25): 7-day rate of change
    pct_change_7d = ((df["price_current"] - df["price_lag_7"]) / (df["price_lag_7"] + 1e-5)) * 100
    skor_tren = np.select(
        [pct_change_7d >= 15.0, pct_change_7d >= 8.0, pct_change_7d >= 3.0],
        [25, 18, 10],
        default=0
    )
    
    # 2. Skor Volatilitas (0-25): 14-day standard deviation relative to price level
    cv_14d = (df["rolling_std_14d"] / (df["price_current"] + 1e-5)) * 100
    skor_vol = np.select(
        [cv_14d >= 15.0, cv_14d >= 8.0, cv_14d >= 4.0],
        [25, 18, 10],
        default=0
    )
    
    # 3. Skor Anomali (0-25): Cross-market disparity against city-wide median
    city_median = df.groupby("komoditas_id")["price_current"].transform("median")
    market_premium_pct = ((df["price_current"] - city_median) / (city_median + 1e-5)) * 100
    skor_anomali = np.select(
        [market_premium_pct >= 12.0, market_premium_pct >= 6.0, market_premium_pct >= 2.0],
        [25, 18, 8],
        default=0
    )
    
    # 4. Skor Prediksi (0-25): Projected increase at t+horizon
    pred_increase_pct = ((df["harga_prediksi"] - df["price_current"]) / (df["price_current"] + 1e-5)) * 100
    skor_pred = np.select(
        [pred_increase_pct >= 12.0, pred_increase_pct >= 6.0, pred_increase_pct >= 2.0],
        [25, 18, 10],
        default=0
    )
    
    total_skor = skor_tren + skor_vol + skor_anomali + skor_pred
    
    status_warning = np.select(
        [total_skor >= 70, total_skor >= 40],
        ["TINGGI", "WASPADA"],
        default="NORMAL"
    )
    
    result = pd.DataFrame({
        "tanggal": df["tanggal"].dt.strftime("%Y-%m-%d") if pd.api.types.is_datetime64_any_dtype(df["tanggal"]) else df["tanggal"],
        "pasar_id": df["pasar_id"].astype(int),
        "komoditas_id": df["komoditas_id"].astype(int),
        "skor_tren": skor_tren.astype(int),
        "skor_volatilitas": skor_vol.astype(int),
        "skor_anomali": skor_anomali.astype(int),
        "skor_prediksi": skor_pred.astype(int),
        "total_skor": total_skor.astype(int),
        "status_warning": status_warning
    })
    
    return result
