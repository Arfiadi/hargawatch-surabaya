"""Test fixtures and shared configuration for HargaWatch test suite."""

import sys
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

# Pastikan root direktori ada di sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))


@pytest.fixture
def sample_price_series():
    """Menyediakan time series sintetis untuk pengujian imputasi."""
    dates = pd.date_range("2026-01-01", periods=15, freq="D")
    # Hari 0: 10000, Hari 1-8 (8 hari berturut-turut): NaN, Hari 9: 12000, Hari 10: 0 (anomali)
    prices = [10000.0] + [np.nan] * 8 + [12000.0, 0.0, -500.0, 12500.0, np.nan, 13000.0]
    return pd.DataFrame({
        "tanggal": dates,
        "komoditas_id": [50] * 15,
        "harga": prices
    })


@pytest.fixture
def sample_ews_inputs():
    """Menyediakan slice fitur saat ini dan prediksi untuk pengujian Early Warning."""
    df_current = pd.DataFrame({
        "tanggal": [pd.to_datetime("2026-09-01")] * 3,
        "pasar_id": [1, 2, 3],
        "komoditas_id": [50, 50, 50],
        "price_current": [30000.0, 40000.0, 31000.0],
        "price_lag_7": [25000.0, 32000.0, 30500.0],    # Lonjakan tinggi di pasar 2 (+25%)
        "rolling_std_14d": [2000.0, 5000.0, 1000.0]    # Volatilitas tinggi di pasar 2
    })
    
    df_forecasts = pd.DataFrame({
        "pasar_id": [1, 2, 3],
        "komoditas_id": [50, 50, 50],
        "harga_prediksi": [31000.0, 48000.0, 31500.0]  # Proyeksi lonjakan tinggi di pasar 2 (+20%)
    })
    
    return df_current, df_forecasts
