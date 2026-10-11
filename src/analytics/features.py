"""Feature engineering pipeline for HargaWatch time-series forecasting.

Generates tabular features without future temporal leakage.
All features for forecasting target at t+h are strictly constructed
from information available at or before forecast origin t (plus known calendar features at t+h).
"""

import warnings
from pathlib import Path
from typing import List, Optional, Tuple
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PROCESSED = BASE_DIR / "data" / "processed"
DATA_EXTERNAL = BASE_DIR / "data" / "external"


def load_raw_datasets(force_db: bool = False) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Loads cleaned fact_harga_pasar, dim_kalender, and fact_cuaca.
    
    Prefers local CSVs by default to prevent slow notebook execution.
    Use force_db=True to pull fresh data from Supabase.
    """
    
    def _load_local_csvs():
        df_h = pd.read_csv(DATA_PROCESSED / "fact_harga_pasar.csv", parse_dates=["tanggal"])
        df_k = pd.read_csv(DATA_PROCESSED / "dim_kalender.csv", parse_dates=["tanggal"])
        path_cuaca = DATA_EXTERNAL / "cuaca" / "cuaca_surabaya.csv"
        if path_cuaca.exists():
            df_c = pd.read_csv(path_cuaca, parse_dates=["tanggal"])
        else:
            df_c = pd.DataFrame(columns=["tanggal", "curah_hujan_mm", "suhu_mean_c"])
        return df_h, df_k, df_c

    if not force_db and (DATA_PROCESSED / "fact_harga_pasar.csv").exists():
        try:
            return _load_local_csvs()
        except Exception as e:
            print(f"[WARN] Failed to load local CSVs: {e}. Falling back to DB...")

    from src.utils.ingest_supabase import koneksi
    
    try:
        conn = koneksi()
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=UserWarning, message=".*pandas only supports SQLAlchemy.*")
            df_harga = pd.read_sql("SELECT * FROM fact_harga_pasar", conn)
            df_kal = pd.read_sql("SELECT * FROM dim_kalender", conn)
            df_cuaca = pd.read_sql("SELECT * FROM fact_cuaca", conn)
        conn.close()
        
        df_harga["tanggal"] = pd.to_datetime(df_harga["tanggal"])
        df_kal["tanggal"] = pd.to_datetime(df_kal["tanggal"])
        df_cuaca["tanggal"] = pd.to_datetime(df_cuaca["tanggal"])
        try:
            DATA_PROCESSED.mkdir(parents=True, exist_ok=True)
            df_harga.to_csv(DATA_PROCESSED / "fact_harga_pasar.csv", index=False)
            df_kal.to_csv(DATA_PROCESSED / "dim_kalender.csv", index=False)
        except Exception:
            pass
        return df_harga, df_kal, df_cuaca
    except Exception as e:
        print(f"[ERROR] Gagal menarik data dari Supabase: {e}. Fallback ke CSV lokal...")
        return _load_local_csvs()


def prepare_base_series(
    df_harga: pd.DataFrame,
    komoditas_id: Optional[int] = None,
    pasar_id: Optional[int] = None
) -> pd.DataFrame:
    """Filters and sorts base series for feature construction."""
    df = df_harga.copy()
    if komoditas_id is not None:
        df = df[df["komoditas_id"] == komoditas_id]
    if pasar_id is not None:
        df = df[df["pasar_id"] == pasar_id]
        
    df = df.sort_values(["komoditas_id", "pasar_id", "tanggal"]).reset_index(drop=True)
    return df


def build_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """Builds historical lag and rolling statistics per (komoditas_id, pasar_id).
    
    These represent historical signals up to date t:
    - lag_1: price at t
    - lag_2: price at t-1
    - lag_3: price at t-2
    - lag_7: price at t-6
    - lag_14: price at t-13
    - rolling stats over 7d, 14d, 30d windows
    """
    df = df.copy()
    grouped = df.groupby(["komoditas_id", "pasar_id"])["harga_imputasi"]

    # Historical lags (shift 0 is price at t, but in training data row is at t)
    # When creating supervised training set: row date = t (origin).
    df["price_current"] = df["harga_imputasi"]
    df["price_lag_1"] = grouped.shift(1)
    df["price_lag_2"] = grouped.shift(2)
    df["price_lag_3"] = grouped.shift(3)
    df["price_lag_7"] = grouped.shift(7)
    df["price_lag_14"] = grouped.shift(14)

    # Rolling statistics (using closed='left' or shifting by 1 to include only past data)
    df["_shifted"] = grouped.shift(1)
    shifted_grouped = df.groupby(["komoditas_id", "pasar_id"])["_shifted"]
    
    df["rolling_mean_7d"] = shifted_grouped.rolling(7, min_periods=3).mean().reset_index(level=[0, 1], drop=True)
    df["rolling_std_7d"] = shifted_grouped.rolling(7, min_periods=3).std().reset_index(level=[0, 1], drop=True)
    df["rolling_mean_14d"] = shifted_grouped.rolling(14, min_periods=5).mean().reset_index(level=[0, 1], drop=True)
    df["rolling_std_14d"] = shifted_grouped.rolling(14, min_periods=5).std().reset_index(level=[0, 1], drop=True)
    df["rolling_mean_30d"] = shifted_grouped.rolling(30, min_periods=10).mean().reset_index(level=[0, 1], drop=True)
    df = df.drop(columns=["_shifted"])

    # Short-term momentum & volatility ratio
    df["pct_change_1d"] = (df["price_current"] - df["price_lag_1"]) / (df["price_lag_1"] + 1e-5)
    df["pct_change_7d"] = (df["price_current"] - df["price_lag_7"]) / (df["price_lag_7"] + 1e-5)
    df["volatility_ratio_7_30"] = df["rolling_std_7d"] / (df["rolling_std_14d"] + 1e-5)

    return df


def build_weather_features(df_cuaca: pd.DataFrame) -> pd.DataFrame:
    """Constructs lagged rainfall and weather features."""
    if df_cuaca.empty:
        return df_cuaca
        
    df_w = df_cuaca.sort_values("tanggal").copy()
    
    # Rainfall cumulative and lag features
    df_w["rain_lag_7d"] = df_w["curah_hujan_mm"].shift(7)
    df_w["rain_lag_14d"] = df_w["curah_hujan_mm"].shift(14)
    df_w["rain_lag_28d"] = df_w["curah_hujan_mm"].shift(28)
    df_w["rain_sum_7d"] = df_w["curah_hujan_mm"].rolling(7, min_periods=3).sum()
    df_w["rain_sum_14d"] = df_w["curah_hujan_mm"].rolling(14, min_periods=5).sum()
    df_w["rain_sum_30d"] = df_w["curah_hujan_mm"].rolling(30, min_periods=10).sum()
    
    cols = [
        "tanggal", "curah_hujan_mm", "suhu_mean_c",
        "rain_lag_7d", "rain_lag_14d", "rain_lag_28d",
        "rain_sum_7d", "rain_sum_14d", "rain_sum_30d"
    ]
    return df_w[[c for c in cols if c in df_w.columns]]


def build_supervised_dataset(
    horizon: int = 7,
    komoditas_id: Optional[int] = None,
    include_weather: bool = True
) -> pd.DataFrame:
    """Constructs a direct-forecasting supervised dataset for target at t + horizon.
    
    Parameters
    ----------
    horizon : int
        Days ahead to predict (e.g. 7 or 14).
    komoditas_id : Optional[int]
        Specific commodity ID or None for all.
    include_weather : bool
        Whether to merge weather exogenous features.
        
    Returns
    -------
    pd.DataFrame
        Dataset ready for model training and evaluation.
    """
    df_harga, df_kal, df_cuaca = load_raw_datasets()
    df_base = prepare_base_series(df_harga, komoditas_id=komoditas_id)
    df_lags = build_lag_features(df_base)
    
    # Target definition: price at t + horizon
    grouped = df_lags.groupby(["komoditas_id", "pasar_id"])["harga_imputasi"]
    df_lags["target_date"] = df_lags["tanggal"] + pd.Timedelta(days=horizon)
    df_lags["target_price"] = grouped.shift(-horizon)
    
    # Target delta: percentage change from origin t to t+h
    df_lags["target_delta_pct"] = (df_lags["target_price"] - df_lags["price_current"]) / df_lags["price_current"]
    
    # Merge future calendar features known at target date (t+h)
    kal_cols = [
        "tanggal", "bulan", "is_weekend", "is_libur_nasional",
        "is_ramadan", "is_pra_ramadan"
    ]
    df_kal_target = df_kal[kal_cols].copy().rename(columns={
        "tanggal": "target_date",
        "bulan": "target_bulan",
        "is_weekend": "target_is_weekend",
        "is_libur_nasional": "target_is_libur_nasional",
        "is_ramadan": "target_is_ramadan",
        "is_pra_ramadan": "target_is_pra_ramadan"
    })
    
    df_merged = df_lags.merge(df_kal_target, on="target_date", how="left")
    
    # Merge weather features at forecast origin t
    if include_weather and not df_cuaca.empty:
        df_weather_feats = build_weather_features(df_cuaca)
        df_merged = df_merged.merge(df_weather_feats, on="tanggal", how="left")

    # Drop rows where target or primary lags are NaN
    valid_mask = df_merged["target_price"].notna() & df_merged["price_lag_14"].notna()
    df_clean = df_merged[valid_mask].reset_index(drop=True)
    
    return df_clean
