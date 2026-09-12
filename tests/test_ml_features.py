"""Unit tests untuk feature engineering time-series dan pencegahan lookahead bias."""

import numpy as np
import pandas as pd
import pytest

from src.analytics.features import (
    prepare_base_series,
    build_lag_features,
    build_weather_features
)


def test_lag_features_no_lookahead_bias():
    """Memastikan fitur lag dan rolling window hanya menggunakan data masa lalu (t-1 kebawah)."""
    dates = pd.date_range("2026-01-01", periods=20, freq="D")
    prices = [10000 + i * 100 for i in range(20)]
    
    df_base = pd.DataFrame({
        "tanggal": dates,
        "komoditas_id": [50] * 20,
        "pasar_id": [1] * 20,
        "harga_imputasi": prices
    })
    
    df_feats = build_lag_features(df_base)
    
    # Pada indeks 10:
    # tanggal = 2026-01-11, harga = 11000
    row_10 = df_feats.iloc[10]
    assert row_10["price_current"] == prices[10]
    assert row_10["price_lag_1"] == prices[9]
    assert row_10["price_lag_2"] == prices[8]
    assert row_10["price_lag_7"] == prices[3]
    
    # rolling_mean_7d harus rata-rata dari 7 hari sebelum t (hari ke-3 s.d. ke-9), tidak boleh melibatkan hari ke-10
    expected_rolling_7d = np.mean(prices[3:10])
    assert np.isclose(row_10["rolling_mean_7d"], expected_rolling_7d)


def test_weather_features_empty_and_null_handling():
    """Memastikan fungsi weather features tahan terhadap dataframe kosong atau bernilai null."""
    df_empty = pd.DataFrame()
    res_empty = build_weather_features(df_empty)
    assert res_empty.empty
    
    dates = pd.date_range("2026-01-01", periods=10, freq="D")
    df_cuaca = pd.DataFrame({
        "tanggal": dates,
        "curah_hujan_mm": [0.0, 10.0, np.nan, 25.0, 0.0, 5.0, np.nan, 0.0, 12.0, 30.0],
        "suhu_mean_c": [28.0] * 10
    })
    
    res_cuaca = build_weather_features(df_cuaca)
    assert len(res_cuaca) == 10
    assert "rain_sum_7d" in res_cuaca.columns
    assert "rain_lag_7d" in res_cuaca.columns
