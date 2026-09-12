"""Unit tests untuk konsistensi prediksi model Machine Learning."""

import numpy as np
import pandas as pd
import pytest

from src.models.models import NaiveLastValueForecaster, NaiveSMAForecaster, LightGBMForecaster


def test_baseline_forecasters():
    """Memastikan baseline Naive dan SMA bekerja sesuai definisi matematis."""
    df_sample = pd.DataFrame({
        "price_current": [35000.0, 36000.0],
        "rolling_mean_7d": [34500.0, 35500.0]
    })
    
    naive = NaiveLastValueForecaster()
    preds_naive = naive.predict(df_sample)
    np.testing.assert_array_equal(preds_naive, np.array([35000.0, 36000.0]))
    
    sma = NaiveSMAForecaster()
    preds_sma = sma.predict(df_sample)
    np.testing.assert_array_equal(preds_sma, np.array([34500.0, 35500.0]))


def test_lightgbm_quantile_monotonicity():
    """Memastikan prediksi kuantil mematuhi relasi p10 <= p50 <= p90."""
    np.random.seed(42)
    n = 100
    X = pd.DataFrame({
        "pasar_id": np.random.choice([1, 2, 3], size=n),
        "price_lag_1": np.random.uniform(20000, 40000, size=n),
        "price_lag_7": np.random.uniform(20000, 40000, size=n),
        "rolling_mean_7d": np.random.uniform(20000, 40000, size=n),
    })
    # Target sintetik
    y = X["price_lag_1"] * 1.02 + np.random.normal(0, 500, size=n)
    
    model = LightGBMForecaster(
        feature_cols=["price_lag_1", "price_lag_7", "rolling_mean_7d"],
        categorical_cols=["pasar_id"],
        params={"n_estimators": 20, "verbose": -1, "min_child_samples": 5}
    )
    model.fit(X, y)
    
    preds = model.predict(X)
    p10 = preds["batas_bawah"]
    p50 = preds["harga_prediksi"]
    p90 = preds["batas_atas"]

    # Kuantil sanity check
    assert len(p10) == n
    assert (p10 <= p50).all(), "Batas bawah (p10) melebihi median (p50)!"
    assert (p50 <= p90).all(), "Median (p50) melebihi batas atas (p90)!"
