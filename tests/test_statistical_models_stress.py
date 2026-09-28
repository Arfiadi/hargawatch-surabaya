"""Empirical stress tests for AutoARIMAForecaster and AutoETSForecaster.

Validates:
1. Multi-market panel handling with irregular gaps, varying history lengths, and multiple markets.
2. Horizon flexibility: h=1, h=7, h=14.
3. Strict invariant: 0 <= batas_bawah <= harga_prediksi <= batas_atas.
4. Robust slice handling: market subsets, unobserved markets, empty slices, duplicate markets, order preservation.
5. Flat/constant series and low-price boundary conditions.
6. Execution latency and CPU throughput without compilation stalls.
"""

import time
import numpy as np
import pandas as pd
import pytest

from src.models.models import AutoARIMAForecaster, AutoETSForecaster, HAS_STATSFORECAST


@pytest.fixture(scope="module")
def multi_market_stress_panel():
    """Generates an irregular multi-market panel with gaps and varying series lengths."""
    np.random.seed(42)
    records = []

    # Market 1: Long series (90 days continuous)
    dates_m1 = pd.date_range("2024-01-01", periods=90, freq="D")
    base_m1 = 35000.0
    for d in dates_m1:
        base_m1 += np.random.normal(50, 400)
        records.append({
            "pasar_id": 1,
            "tanggal": d,
            "price_current": max(1000.0, base_m1)
        })

    # Market 2: Medium series with irregular gaps (60 random days out of 90)
    choice_m2 = np.random.choice(dates_m1, size=60, replace=False)
    choice_m2 = sorted(choice_m2)
    base_m2 = 28000.0
    for d in choice_m2:
        base_m2 += np.random.normal(-30, 600)
        records.append({
            "pasar_id": 2,
            "tanggal": d,
            "price_current": max(1000.0, base_m2)
        })

    # Market 3: Short series (15 days)
    dates_m3 = pd.date_range("2024-03-01", periods=15, freq="D")
    base_m3 = 45000.0
    for d in dates_m3:
        base_m3 += np.random.normal(10, 300)
        records.append({
            "pasar_id": 3,
            "tanggal": d,
            "price_current": max(1000.0, base_m3)
        })

    # Market 4: Edge-case minimal series (8 days, just above season_length 7)
    dates_m4 = pd.date_range("2024-03-20", periods=8, freq="D")
    base_m4 = 20000.0
    for d in dates_m4:
        base_m4 += np.random.normal(0, 200)
        records.append({
            "pasar_id": 4,
            "tanggal": d,
            "price_current": max(1000.0, base_m4)
        })

    df = pd.DataFrame(records).sort_values(["pasar_id", "tanggal"]).reset_index(drop=True)
    return df


@pytest.mark.skipif(not HAS_STATSFORECAST, reason="StatsForecast not installed")
@pytest.mark.parametrize("model_cls", [AutoARIMAForecaster, AutoETSForecaster])
def test_multi_market_panel_fit_and_horizons(multi_market_stress_panel, model_cls):
    """Verifies fitting on irregular multi-market panel and predicting across horizons h=1, 7, 14."""
    df_train = multi_market_stress_panel.copy()

    model = model_cls(horizon=7, season_length=7, n_jobs=1)
    
    # 1. Fit latency check
    t0 = time.perf_counter()
    model.fit(df_train)
    fit_duration = time.perf_counter() - t0
    assert fit_duration < 10.0, f"{model_cls.__name__} fit took too long: {fit_duration:.2f}s"

    # 2. Test horizons h=1, 7, 14
    for h in [1, 7, 14]:
        origin_date = pd.Timestamp("2024-03-31")
        test_slice = pd.DataFrame({
            "pasar_id": [1, 2, 3, 4],
            "tanggal": [origin_date] * 4,
            "target_date": [origin_date + pd.Timedelta(days=h)] * 4
        })

        t_pred = time.perf_counter()
        preds = model.predict(test_slice)
        pred_duration = time.perf_counter() - t_pred
        assert pred_duration < 3.0, f"predict(h={h}) took too long: {pred_duration:.2f}s"

        for key in ["batas_bawah", "harga_prediksi", "batas_atas"]:
            assert key in preds, f"Missing required key '{key}' in prediction output"
            assert len(preds[key]) == 4, f"Output length mismatch for key '{key}'"
            assert np.issubdtype(preds[key].dtype, np.integer), f"Key '{key}' is not integer dtype: {preds[key].dtype}"

        lo = preds["batas_bawah"]
        p50 = preds["harga_prediksi"]
        hi = preds["batas_atas"]

        # Strict Monotonic Bound Invariant: 0 <= batas_bawah <= harga_prediksi <= batas_atas
        assert (lo >= 0).all(), f"Negative batas_bawah detected for h={h}: {lo}"
        assert (p50 >= lo).all(), f"Violation: batas_bawah > harga_prediksi for h={h}: lo={lo}, p50={p50}"
        assert (hi >= p50).all(), f"Violation: harga_prediksi > batas_atas for h={h}: p50={p50}, hi={hi}"


@pytest.mark.skipif(not HAS_STATSFORECAST, reason="StatsForecast not installed")
@pytest.mark.parametrize("model_cls", [AutoARIMAForecaster, AutoETSForecaster])
def test_edge_case_slices_and_unobserved_markets(multi_market_stress_panel, model_cls):
    """Tests extreme prediction slices: unobserved markets, subsets, empty slice, reordered rows."""
    model = model_cls(horizon=7, season_length=7, n_jobs=1).fit(multi_market_stress_panel)

    # 1. Empty slice handling
    df_empty = pd.DataFrame(columns=["pasar_id", "tanggal", "target_date"])
    preds_empty = model.predict(df_empty)
    for k in ["batas_bawah", "harga_prediksi", "batas_atas"]:
        assert len(preds_empty[k]) == 0
        assert np.issubdtype(preds_empty[k].dtype, np.integer)

    # 2. Subset of observed markets (e.g. only markets 2 and 4)
    df_subset = pd.DataFrame({
        "pasar_id": [2, 4],
        "tanggal": ["2024-03-31", "2024-03-31"],
        "target_date": ["2024-04-07", "2024-04-07"]
    })
    preds_subset = model.predict(df_subset)
    assert len(preds_subset["harga_prediksi"]) == 2
    assert (preds_subset["batas_bawah"] <= preds_subset["harga_prediksi"]).all()
    assert (preds_subset["harga_prediksi"] <= preds_subset["batas_atas"]).all()

    # 3. Unobserved / unseen markets (e.g., pasar_id=999, pasar_id='unknown_market')
    df_unseen = pd.DataFrame({
        "pasar_id": [999, "unknown_market", 1],
        "tanggal": ["2024-03-31", "2024-03-31", "2024-03-31"],
        "target_date": ["2024-04-07", "2024-04-07", "2024-04-07"]
    })
    preds_unseen = model.predict(df_unseen)
    assert len(preds_unseen["harga_prediksi"]) == 3
    lo_u = preds_unseen["batas_bawah"]
    p50_u = preds_unseen["harga_prediksi"]
    hi_u = preds_unseen["batas_atas"]
    assert (lo_u >= 0).all()
    assert (lo_u <= p50_u).all()
    assert (p50_u <= hi_u).all()

    # 4. Duplicate markets in slice with mixed ordering [3, 1, 3, 2, 1]
    df_dup = pd.DataFrame({
        "pasar_id": [3, 1, 3, 2, 1],
        "tanggal": ["2024-03-31"] * 5,
        "target_date": ["2024-04-07"] * 5
    })
    preds_dup = model.predict(df_dup)
    assert len(preds_dup["harga_prediksi"]) == 5
    # Check that rows with same pasar_id yield identical predictions
    assert preds_dup["harga_prediksi"][0] == preds_dup["harga_prediksi"][2]
    assert preds_dup["harga_prediksi"][1] == preds_dup["harga_prediksi"][4]


@pytest.mark.skipif(not HAS_STATSFORECAST, reason="StatsForecast not installed")
@pytest.mark.parametrize("model_cls", [AutoARIMAForecaster, AutoETSForecaster])
def test_near_zero_prices_boundary_enforcement(model_cls):
    """Stress-tests near-zero prices where normal prediction intervals span into negative territory."""
    dates = pd.date_range("2024-01-01", periods=30, freq="D")
    # Low price with high relative variance
    df_low = pd.DataFrame({
        "pasar_id": [1] * 30,
        "tanggal": dates,
        "price_current": [50.0 + (i % 5) * 20.0 for i in range(30)]
    })

    model = model_cls(horizon=7, season_length=7, n_jobs=1).fit(df_low)
    test_slice = pd.DataFrame({
        "pasar_id": [1],
        "tanggal": [pd.Timestamp("2024-01-31")],
        "target_date": [pd.Timestamp("2024-02-07")]
    })
    preds = model.predict(test_slice)

    lo = preds["batas_bawah"][0]
    p50 = preds["harga_prediksi"][0]
    hi = preds["batas_atas"][0]

    assert lo >= 0, f"Lower bound {lo} violated non-negativity (0 <= batas_bawah)"
    assert lo <= p50 <= hi, f"Monotonic ordering violated: {lo} <= {p50} <= {hi}"


@pytest.mark.skipif(not HAS_STATSFORECAST, reason="StatsForecast not installed")
@pytest.mark.parametrize("model_cls", [AutoARIMAForecaster, AutoETSForecaster])
def test_constant_series_singular_robustness(model_cls):
    """Tests constant/zero-variance series where ARIMA or ETS might produce singular matrices."""
    dates = pd.date_range("2024-01-01", periods=25, freq="D")
    df_flat = pd.DataFrame({
        "pasar_id": [10] * 25,
        "tanggal": dates,
        "price_current": [32000.0] * 25
    })

    model = model_cls(horizon=7, season_length=7, n_jobs=1)
    # Fitting should not throw exception
    model.fit(df_flat)

    test_slice = pd.DataFrame({
        "pasar_id": [10],
        "tanggal": [pd.Timestamp("2024-01-26")],
        "target_date": [pd.Timestamp("2024-02-02")]
    })
    preds = model.predict(test_slice)
    assert len(preds["harga_prediksi"]) == 1
    assert preds["batas_bawah"][0] <= preds["harga_prediksi"][0] <= preds["batas_atas"][0]


@pytest.mark.skipif(not HAS_STATSFORECAST, reason="StatsForecast not installed")
def test_cpu_high_load_throughput():
    """Tests 10 markets with 100 observations each (1000 records) for execution throughput."""
    np.random.seed(99)
    records = []
    dates = pd.date_range("2024-01-01", periods=100, freq="D")
    for m in range(1, 11):
        price = 30000.0 + m * 1000
        for d in dates:
            price += np.random.normal(0, 100)
            records.append({
                "pasar_id": m,
                "tanggal": d,
                "price_current": max(5000.0, price)
            })
    df_large = pd.DataFrame(records)

    # 1. AutoETS throughput
    t0 = time.perf_counter()
    ets = AutoETSForecaster(horizon=7, season_length=7, n_jobs=1).fit(df_large)
    ets_fit_time = time.perf_counter() - t0
    assert ets_fit_time < 12.0, f"AutoETS fit on 10 markets took {ets_fit_time:.2f}s"

    # 2. AutoARIMA throughput (with fast stepwise & approximation settings)
    t1 = time.perf_counter()
    arima = AutoARIMAForecaster(horizon=7, season_length=7, n_jobs=1).fit(df_large)
    arima_fit_time = time.perf_counter() - t1
    assert arima_fit_time < 15.0, f"AutoARIMA fit on 10 markets took {arima_fit_time:.2f}s"

    # Predict test slice with all 10 markets
    test_slice = pd.DataFrame({
        "pasar_id": list(range(1, 11)),
        "tanggal": [dates[-1]] * 10,
        "target_date": [dates[-1] + pd.Timedelta(days=7)] * 10
    })

    t_p_ets = time.perf_counter()
    p_ets = ets.predict(test_slice)
    assert time.perf_counter() - t_p_ets < 2.0
    assert (p_ets["batas_bawah"] <= p_ets["harga_prediksi"]).all()
    assert (p_ets["harga_prediksi"] <= p_ets["batas_atas"]).all()

    t_p_arima = time.perf_counter()
    p_arima = arima.predict(test_slice)
    assert time.perf_counter() - t_p_arima < 2.0
    assert (p_arima["batas_bawah"] <= p_arima["harga_prediksi"]).all()
    assert (p_arima["harga_prediksi"] <= p_arima["batas_atas"]).all()


@pytest.mark.skipif(not HAS_STATSFORECAST, reason="StatsForecast not installed")
@pytest.mark.parametrize("model_cls", [AutoARIMAForecaster, AutoETSForecaster])
def test_interface_contract_conformance(model_cls):
    """Verifies that model adheres to duck-typed interface contracts."""
    df = pd.DataFrame({
        "pasar_id": [1, 1, 1, 1, 1, 1, 1, 1],
        "tanggal": pd.date_range("2024-01-01", periods=8, freq="D"),
        "price_current": [30000 + i * 100 for i in range(8)]
    })
    model = model_cls(horizon=7, season_length=7, n_jobs=1)

    # 1. fit returns self
    ret = model.fit(df)
    assert ret is model

    # 2. feature importances returns empty DataFrame
    fi = model.get_feature_importances()
    assert isinstance(fi, pd.DataFrame)
    assert list(fi.columns) == ["feature", "importance"]
    assert len(fi) == 0

    # 3. Unfitted predict raises RuntimeError
    unfitted = model_cls()
    with pytest.raises(RuntimeError):
        unfitted.predict(df)


@pytest.mark.skipif(not HAS_STATSFORECAST, reason="StatsForecast not installed")
@pytest.mark.parametrize("model_cls", [AutoARIMAForecaster, AutoETSForecaster])
def test_dirty_panel_with_nans_and_duplicates(model_cls):
    """Stress-tests resilience against dirty data: NaNs, duplicate dates, unsorted entries."""
    dates = pd.date_range("2024-01-01", periods=15, freq="D")
    records = [
        # Normal rows
        {"pasar_id": 1, "tanggal": dates[0], "price_current": 30000.0},
        {"pasar_id": 1, "tanggal": dates[1], "price_current": np.nan}, # NaN price
        {"pasar_id": 1, "tanggal": dates[2], "price_current": 31000.0},
        {"pasar_id": 1, "tanggal": dates[2], "price_current": 31500.0}, # Duplicate date
        {"pasar_id": 1, "tanggal": pd.NaT, "price_current": 32000.0}, # NaT date
    ]
    # Add regular points so series can fit
    for d in dates[3:]:
        records.append({"pasar_id": 1, "tanggal": d, "price_current": 30000.0 + np.random.normal(0, 100)})

    df_dirty = pd.DataFrame(records).sample(frac=1.0, random_state=42) # Scrambled order
    model = model_cls(horizon=7, season_length=7, n_jobs=1)
    model.fit(df_dirty)

    test_slice = pd.DataFrame({
        "pasar_id": [1],
        "tanggal": [dates[-1]],
        "target_date": [dates[-1] + pd.Timedelta(days=7)]
    })
    preds = model.predict(test_slice)
    assert len(preds["harga_prediksi"]) == 1
    assert 0 <= preds["batas_bawah"][0] <= preds["harga_prediksi"][0] <= preds["batas_atas"][0]


@pytest.mark.skipif(not HAS_STATSFORECAST, reason="StatsForecast not installed")
@pytest.mark.parametrize("model_cls", [AutoARIMAForecaster, AutoETSForecaster])
def test_ultra_short_series_fallback(model_cls):
    """Stress-tests markets with 1 or 2 observations alongside standard markets."""
    dates = pd.date_range("2024-01-01", periods=20, freq="D")
    records = []
    # Market A: 20 days
    for d in dates:
        records.append({"pasar_id": "normal_market", "tanggal": d, "price_current": 25000.0})
    # Market B: Exactly 1 observation
    records.append({"pasar_id": "single_obs_market", "tanggal": dates[5], "price_current": 50000.0})
    # Market C: Exactly 2 observations
    records.append({"pasar_id": "two_obs_market", "tanggal": dates[3], "price_current": 40000.0})
    records.append({"pasar_id": "two_obs_market", "tanggal": dates[4], "price_current": 41000.0})

    df = pd.DataFrame(records)
    model = model_cls(horizon=7, season_length=7, n_jobs=1)
    model.fit(df)

    test_slice = pd.DataFrame({
        "pasar_id": ["normal_market", "single_obs_market", "two_obs_market"],
        "tanggal": [dates[-1]] * 3,
        "target_date": [dates[-1] + pd.Timedelta(days=7)] * 3
    })
    preds = model.predict(test_slice)
    assert len(preds["harga_prediksi"]) == 3
    for i in range(3):
        assert 0 <= preds["batas_bawah"][i] <= preds["harga_prediksi"][i] <= preds["batas_atas"][i]


@pytest.mark.skipif(not HAS_STATSFORECAST, reason="StatsForecast not installed")
@pytest.mark.parametrize("model_cls", [AutoARIMAForecaster, AutoETSForecaster])
def test_retrograde_dates_and_missing_columns(model_cls):
    """Verifies robustness against retrograde dates (target_date <= tanggal) and missing column fallbacks."""
    dates = pd.date_range("2024-01-01", periods=10, freq="D")
    df = pd.DataFrame({
        "pasar_id": [1] * 10,
        "tanggal": dates,
        "price_current": [30000.0] * 10
    })
    model = model_cls(horizon=7, season_length=7, n_jobs=1).fit(df)

    # 1. Retrograde target date (past date: target_date < tanggal) -> should clamp h to 1
    slice_retro = pd.DataFrame({
        "pasar_id": [1],
        "tanggal": [dates[-1]],
        "target_date": [dates[0]]  # Past date
    })
    preds_retro = model.predict(slice_retro)
    assert len(preds_retro["harga_prediksi"]) == 1
    assert 0 <= preds_retro["batas_bawah"][0] <= preds_retro["harga_prediksi"][0] <= preds_retro["batas_atas"][0]

    # 2. Missing target_date and tanggal (pure X without dates) -> falls back to model.horizon
    slice_nodate = pd.DataFrame({
        "pasar_id": [1]
    })
    preds_nodate = model.predict(slice_nodate)
    assert len(preds_nodate["harga_prediksi"]) == 1
    assert 0 <= preds_nodate["batas_bawah"][0] <= preds_nodate["harga_prediksi"][0] <= preds_nodate["batas_atas"][0]
