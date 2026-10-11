"""Empirical stress test suite for XGBoostForecaster and CatBoostForecaster.

Designed by M1 Challenger 1 to aggressively challenge:
1. Invariant: 0 <= batas_bawah <= harga_prediksi <= batas_atas under adversarial inputs.
2. Unobserved, non-sequential, and missing market categories (e.g. 146, 999, negative IDs).
3. Single-category slices during inference.
4. Extreme price spikes, zero prices, noisy features, and missing features.
5. Feature importance schema, descending ordering, and non-emptiness.
6. Empty DataFrame behavior and unfitted state protection.
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pandas as pd
import pytest

from src.models.models import XGBoostForecaster, CatBoostForecaster, HAS_XGBOOST, HAS_CATBOOST


@pytest.fixture
def feature_cols():
    return ["price_lag_1", "price_lag_7", "rolling_mean_7d", "rolling_std_7d", "weather_rainfall"]


@pytest.fixture
def base_training_data(feature_cols):
    np.random.seed(42)
    n = 200
    # Training market IDs: standard sequential [1, 2, 3, 4]
    df = pd.DataFrame({
        "pasar_id": np.random.choice([1, 2, 3, 4], size=n),
        "price_lag_1": np.random.uniform(15000, 45000, size=n),
        "price_lag_7": np.random.uniform(15000, 45000, size=n),
        "rolling_mean_7d": np.random.uniform(15000, 45000, size=n),
        "rolling_std_7d": np.random.uniform(100, 3000, size=n),
        "weather_rainfall": np.random.uniform(0, 50, size=n),
    })
    y = df["price_lag_1"] * 1.01 + np.random.normal(0, 800, size=n)
    y = pd.Series(np.maximum(1000, y), name="target_price")
    return df, y


def _assert_monotonic_invariants(preds: dict, n_expected: int, context_label: str):
    """Oracle asserting strict monotonic boundary ordering and non-negativity."""
    for key in ("batas_bawah", "harga_prediksi", "batas_atas"):
        assert key in preds, f"[{context_label}] Missing key {key} in predictions!"
        arr = preds[key]
        assert isinstance(arr, np.ndarray), f"[{context_label}] {key} is not a numpy array!"
        assert len(arr) == n_expected, f"[{context_label}] {key} length {len(arr)} != expected {n_expected}!"
        assert np.issubdtype(arr.dtype, np.integer), f"[{context_label}] {key} dtype {arr.dtype} is not integer!"
        assert not np.isnan(arr).any(), f"[{context_label}] {key} contains NaN values!"
        assert (arr >= 0).all(), f"[{context_label}] {key} contains negative values! Min: {arr.min()}"

    p10 = preds["batas_bawah"]
    p50 = preds["harga_prediksi"]
    p90 = preds["batas_atas"]

    # Invariant: 0 <= batas_bawah <= harga_prediksi <= batas_atas
    violations_lower = (p10 > p50).sum()
    violations_upper = (p50 > p90).sum()
    assert violations_lower == 0, f"[{context_label}] Quantile crossing: {violations_lower} rows where batas_bawah > harga_prediksi!"
    assert violations_upper == 0, f"[{context_label}] Quantile crossing: {violations_upper} rows where harga_prediksi > batas_atas!"


# =========================================================================
# 1. Stress Tests for XGBoostForecaster
# =========================================================================

@pytest.mark.skipif(not HAS_XGBOOST, reason="XGBoost not installed")
class TestXGBoostForecasterStress:
    
    def test_unfitted_raises_runtime_error(self, feature_cols):
        model = XGBoostForecaster(feature_cols=feature_cols)
        df_dummy = pd.DataFrame({"pasar_id": [1], "price_lag_1": [30000]})
        with pytest.raises(RuntimeError):
            model.predict(df_dummy)

    def test_empty_dataframe_predict(self, feature_cols, base_training_data):
        X_train, y_train = base_training_data
        model = XGBoostForecaster(feature_cols=feature_cols, params={"n_estimators": 10})
        model.fit(X_train, y_train)

        # Truly empty DataFrame
        res_empty = model.predict(pd.DataFrame())
        _assert_monotonic_invariants(res_empty, 0, "XGBoost-empty")

        # Zero-row DataFrame with columns
        res_zero_rows = model.predict(pd.DataFrame(columns=feature_cols + ["pasar_id"]))
        _assert_monotonic_invariants(res_zero_rows, 0, "XGBoost-zero-rows")

    def test_feature_importances(self, feature_cols, base_training_data):
        X_train, y_train = base_training_data
        model = XGBoostForecaster(feature_cols=feature_cols, params={"n_estimators": 15})

        # Before fit
        fi_before = model.get_feature_importances()
        assert isinstance(fi_before, pd.DataFrame)
        assert list(fi_before.columns) == ["feature", "importance"]
        assert len(fi_before) == 0

        # After fit
        model.fit(X_train, y_train)
        fi_after = model.get_feature_importances()
        assert isinstance(fi_after, pd.DataFrame)
        assert list(fi_after.columns) == ["feature", "importance"]
        assert len(fi_after) == len(feature_cols)
        # Verify strictly descending order
        importances = fi_after["importance"].values
        assert (np.diff(importances) <= 0).all(), f"XGBoost feature importances not descending: {importances}"

    def test_adversarial_inputs_1000_rows(self, feature_cols, base_training_data):
        X_train, y_train = base_training_data
        model = XGBoostForecaster(feature_cols=feature_cols, params={"n_estimators": 25})
        model.fit(X_train, y_train)

        np.random.seed(999)
        n_adv = 1000

        # Adversarial batch:
        # - extreme prices (0 to 10,000,000)
        # - negative features (e.g. -5000)
        # - massive outliers
        # - unobserved non-sequential market IDs: 146, 999, 4242, -1
        # - NaNs in features
        df_adv = pd.DataFrame({
            "pasar_id": np.random.choice([146, 999, 4242, -1, 1, 2], size=n_adv),
            "price_lag_1": np.random.choice([0.0, 1.0, 1e7, -5000.0, np.nan, 35000.0], size=n_adv),
            "price_lag_7": np.random.uniform(-1000, 5000000, size=n_adv),
            "rolling_mean_7d": np.random.choice([0.0, np.nan, 2e6, 40000.0], size=n_adv),
            "rolling_std_7d": np.random.uniform(0, 1e6, size=n_adv),
            "weather_rainfall": np.random.choice([np.nan, 0.0, 999.0], size=n_adv),
        })

        preds = model.predict(df_adv)
        _assert_monotonic_invariants(preds, n_adv, "XGBoost-adversarial-1000")

    def test_single_unobserved_category_slice(self, feature_cols, base_training_data):
        X_train, y_train = base_training_data
        model = XGBoostForecaster(feature_cols=feature_cols, params={"n_estimators": 15})
        model.fit(X_train, y_train)

        # Test slice contains ONLY an unobserved market (e.g. 146)
        n = 50
        df_single = pd.DataFrame({
            "pasar_id": [146] * n,
            "price_lag_1": np.full(n, 32000.0),
            "price_lag_7": np.full(n, 31500.0),
            "rolling_mean_7d": np.full(n, 31800.0),
            "rolling_std_7d": np.full(n, 500.0),
            "weather_rainfall": np.full(n, 5.0),
        })
        preds = model.predict(df_single)
        _assert_monotonic_invariants(preds, n, "XGBoost-single-unobserved-slice")

    def test_missing_feature_columns_in_predict(self, feature_cols, base_training_data):
        X_train, y_train = base_training_data
        model = XGBoostForecaster(feature_cols=feature_cols, params={"n_estimators": 15})
        model.fit(X_train, y_train)

        # DataFrame missing 'weather_rainfall' and 'rolling_std_7d'
        df_partial = pd.DataFrame({
            "pasar_id": [1, 2, 3],
            "price_lag_1": [30000.0, 31000.0, 29000.0],
            "price_lag_7": [30000.0, 31000.0, 29000.0],
            "rolling_mean_7d": [30000.0, 31000.0, 29000.0],
        })
        preds = model.predict(df_partial)
        _assert_monotonic_invariants(preds, 3, "XGBoost-missing-columns")


# =========================================================================
# 2. Stress Tests for CatBoostForecaster
# =========================================================================

@pytest.mark.skipif(not HAS_CATBOOST, reason="CatBoost not installed")
class TestCatBoostForecasterStress:

    def test_unfitted_raises_runtime_error(self, feature_cols):
        model = CatBoostForecaster(feature_cols=feature_cols)
        df_dummy = pd.DataFrame({"pasar_id": [1], "price_lag_1": [30000]})
        with pytest.raises(RuntimeError):
            model.predict(df_dummy)

    def test_empty_dataframe_predict(self, feature_cols, base_training_data):
        X_train, y_train = base_training_data
        model = CatBoostForecaster(feature_cols=feature_cols, params={"iterations": 10})
        model.fit(X_train, y_train)

        # Truly empty DataFrame
        res_empty = model.predict(pd.DataFrame())
        _assert_monotonic_invariants(res_empty, 0, "CatBoost-empty")

        # Zero-row DataFrame with columns
        res_zero_rows = model.predict(pd.DataFrame(columns=feature_cols + ["pasar_id"]))
        _assert_monotonic_invariants(res_zero_rows, 0, "CatBoost-zero-rows")

    def test_feature_importances(self, feature_cols, base_training_data):
        X_train, y_train = base_training_data
        model = CatBoostForecaster(feature_cols=feature_cols, params={"iterations": 15})

        # Before fit
        fi_before = model.get_feature_importances()
        assert isinstance(fi_before, pd.DataFrame)
        assert list(fi_before.columns) == ["feature", "importance"]
        assert len(fi_before) == 0

        # After fit
        model.fit(X_train, y_train)
        fi_after = model.get_feature_importances()
        assert isinstance(fi_after, pd.DataFrame)
        assert list(fi_after.columns) == ["feature", "importance"]
        assert len(fi_after) == len(feature_cols)
        # Verify strictly descending order
        importances = fi_after["importance"].values
        assert (np.diff(importances) <= 0).all(), f"CatBoost feature importances not descending: {importances}"

    def test_adversarial_inputs_1000_rows(self, feature_cols, base_training_data):
        X_train, y_train = base_training_data
        model = CatBoostForecaster(feature_cols=feature_cols, params={"iterations": 25})
        model.fit(X_train, y_train)

        np.random.seed(999)
        n_adv = 1000

        # Adversarial batch:
        # - extreme prices (0 to 10,000,000)
        # - negative features (e.g. -5000)
        # - massive outliers
        # - unobserved non-sequential market IDs: 146, 999, 4242, -1
        # - NaNs in features
        df_adv = pd.DataFrame({
            "pasar_id": np.random.choice([146, 999, 4242, -1, 1, 2], size=n_adv),
            "price_lag_1": np.random.choice([0.0, 1.0, 1e7, -5000.0, np.nan, 35000.0], size=n_adv),
            "price_lag_7": np.random.uniform(-1000, 5000000, size=n_adv),
            "rolling_mean_7d": np.random.choice([0.0, np.nan, 2e6, 40000.0], size=n_adv),
            "rolling_std_7d": np.random.uniform(0, 1e6, size=n_adv),
            "weather_rainfall": np.random.choice([np.nan, 0.0, 999.0], size=n_adv),
        })

        preds = model.predict(df_adv)
        _assert_monotonic_invariants(preds, n_adv, "CatBoost-adversarial-1000")

    def test_single_unobserved_category_slice(self, feature_cols, base_training_data):
        X_train, y_train = base_training_data
        model = CatBoostForecaster(feature_cols=feature_cols, params={"iterations": 15})
        model.fit(X_train, y_train)

        # Test slice contains ONLY an unobserved market (e.g. 146)
        n = 50
        df_single = pd.DataFrame({
            "pasar_id": [146] * n,
            "price_lag_1": np.full(n, 32000.0),
            "price_lag_7": np.full(n, 31500.0),
            "rolling_mean_7d": np.full(n, 31800.0),
            "rolling_std_7d": np.full(n, 500.0),
            "weather_rainfall": np.full(n, 5.0),
        })
        preds = model.predict(df_single)
        _assert_monotonic_invariants(preds, n, "CatBoost-single-unobserved-slice")

    def test_missing_feature_columns_in_predict(self, feature_cols, base_training_data):
        X_train, y_train = base_training_data
        model = CatBoostForecaster(feature_cols=feature_cols, params={"iterations": 15})
        model.fit(X_train, y_train)

        # DataFrame missing 'weather_rainfall' and 'rolling_std_7d'
        df_partial = pd.DataFrame({
            "pasar_id": [1, 2, 3],
            "price_lag_1": [30000.0, 31000.0, 29000.0],
            "price_lag_7": [30000.0, 31000.0, 29000.0],
            "rolling_mean_7d": [30000.0, 31000.0, 29000.0],
        })
        preds = model.predict(df_partial)
        _assert_monotonic_invariants(preds, 3, "CatBoost-missing-columns")


# =========================================================================
# 3. Direct Execution Harness
# =========================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("RUNNING ADVERSARIAL GBDT STRESS HARNESS")
    print("=" * 70)

    fcols = ["price_lag_1", "price_lag_7", "rolling_mean_7d", "rolling_std_7d", "weather_rainfall"]
    np.random.seed(42)
    n = 200
    df_train = pd.DataFrame({
        "pasar_id": np.random.choice([1, 2, 3, 4], size=n),
        "price_lag_1": np.random.uniform(15000, 45000, size=n),
        "price_lag_7": np.random.uniform(15000, 45000, size=n),
        "rolling_mean_7d": np.random.uniform(15000, 45000, size=n),
        "rolling_std_7d": np.random.uniform(100, 3000, size=n),
        "weather_rainfall": np.random.uniform(0, 50, size=n),
    })
    y_train = pd.Series(np.maximum(1000, df_train["price_lag_1"] * 1.01 + np.random.normal(0, 800, size=n)))

    # Test XGBoost
    print("\n[1] Testing XGBoostForecaster...")
    xgb_forecaster = XGBoostForecaster(feature_cols=fcols, params={"n_estimators": 25})
    xgb_forecaster.fit(df_train, y_train)

    # Empty
    p_empty = xgb_forecaster.predict(pd.DataFrame())
    _assert_monotonic_invariants(p_empty, 0, "XGBoost-empty")
    print("  -> Empty DataFrame: PASS")

    # Feature importances
    fi_xgb = xgb_forecaster.get_feature_importances()
    print("  -> XGBoost Feature Importances:\n", fi_xgb)
    assert len(fi_xgb) == len(fcols)
    assert (np.diff(fi_xgb["importance"].values) <= 0).all()
    print("  -> Feature Importances Descending: PASS")

    # 1000 adversarial rows
    n_adv = 1000
    df_adv = pd.DataFrame({
        "pasar_id": np.random.choice([146, 999, 4242, -1, 1, 2], size=n_adv),
        "price_lag_1": np.random.choice([0.0, 1.0, 1e7, -5000.0, np.nan, 35000.0], size=n_adv),
        "price_lag_7": np.random.uniform(-1000, 5000000, size=n_adv),
        "rolling_mean_7d": np.random.choice([0.0, np.nan, 2e6, 40000.0], size=n_adv),
        "rolling_std_7d": np.random.uniform(0, 1e6, size=n_adv),
        "weather_rainfall": np.random.choice([np.nan, 0.0, 999.0], size=n_adv),
    })
    p_adv_xgb = xgb_forecaster.predict(df_adv)
    _assert_monotonic_invariants(p_adv_xgb, n_adv, "XGBoost-adversarial-1000")
    print(f"  -> 1,000 Adversarial rows monotonicity: PASS (All {n_adv} rows satisfied 0 <= b_bawah <= p50 <= b_atas)")

    # Single slice
    p_slice_xgb = xgb_forecaster.predict(pd.DataFrame({
        "pasar_id": [146] * 10,
        "price_lag_1": [32000.0] * 10,
        "price_lag_7": [32000.0] * 10,
        "rolling_mean_7d": [32000.0] * 10,
        "rolling_std_7d": [500.0] * 10,
        "weather_rainfall": [5.0] * 10,
    }))
    _assert_monotonic_invariants(p_slice_xgb, 10, "XGBoost-single-slice-146")
    print("  -> Single unobserved category (pasar_id=146): PASS")

    # Test CatBoost
    print("\n[2] Testing CatBoostForecaster...")
    cb_forecaster = CatBoostForecaster(feature_cols=fcols, params={"iterations": 25})
    cb_forecaster.fit(df_train, y_train)

    # Empty
    p_cb_empty = cb_forecaster.predict(pd.DataFrame())
    _assert_monotonic_invariants(p_cb_empty, 0, "CatBoost-empty")
    print("  -> Empty DataFrame: PASS")

    # Feature importances
    fi_cb = cb_forecaster.get_feature_importances()
    print("  -> CatBoost Feature Importances:\n", fi_cb)
    assert len(fi_cb) == len(fcols)
    assert (np.diff(fi_cb["importance"].values) <= 0).all()
    print("  -> Feature Importances Descending: PASS")

    # 1000 adversarial rows
    p_adv_cb = cb_forecaster.predict(df_adv)
    _assert_monotonic_invariants(p_adv_cb, n_adv, "CatBoost-adversarial-1000")
    print(f"  -> 1,000 Adversarial rows monotonicity: PASS (All {n_adv} rows satisfied 0 <= b_bawah <= p50 <= b_atas)")

    # Single slice
    p_slice_cb = cb_forecaster.predict(pd.DataFrame({
        "pasar_id": [146] * 10,
        "price_lag_1": [32000.0] * 10,
        "price_lag_7": [32000.0] * 10,
        "rolling_mean_7d": [32000.0] * 10,
        "rolling_std_7d": [500.0] * 10,
        "weather_rainfall": [5.0] * 10,
    }))
    _assert_monotonic_invariants(p_slice_cb, 10, "CatBoost-single-slice-146")
    print("  -> Single unobserved category (pasar_id=146): PASS")

    print("\n" + "=" * 70)
    print("ALL EMPIRICAL GBDT STRESS TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)
