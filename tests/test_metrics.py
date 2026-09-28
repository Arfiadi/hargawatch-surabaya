"""Unit tests for src/analytics/metrics.py.

Tests:
1. compute_wape, compute_mae, compute_rmse, compute_smape
2. compute_picp
3. compute_directional_accuracy
4. calculate_bias
5. analyze_directional_errors
6. plot_residual_diagnostics
"""

import numpy as np
import pandas as pd
import pytest
import matplotlib.pyplot as plt

from src.analytics.metrics import (
    compute_wape,
    compute_mae,
    compute_rmse,
    compute_smape,
    compute_picp,
    compute_directional_accuracy,
    compute_metrics,
    calculate_bias,
    analyze_directional_errors,
    plot_residual_diagnostics
)


def test_core_evaluation_metrics():
    y_true = np.array([100.0, 200.0, 300.0])
    y_pred = np.array([110.0, 190.0, 330.0])
    
    # Absolute errors: [10, 10, 30] -> sum = 50, mean = 50 / 3 = 16.67
    mae = compute_mae(y_true, y_pred)
    assert np.isclose(mae, 16.67, atol=0.01)

    # Sum(y_true) = 600 -> WAPE = (50 / 600) * 100 = 8.33%
    wape = compute_wape(y_true, y_pred)
    assert np.isclose(wape, 8.33, atol=0.01)

    # Squared errors: [100, 100, 900] -> mean = 1100 / 3 = 366.67 -> sqrt = 19.15
    rmse = compute_rmse(y_true, y_pred)
    assert np.isclose(rmse, 19.15, atol=0.01)

    # sMAPE
    smape = compute_smape(y_true, y_pred)
    assert smape > 0


def test_prediction_interval_coverage_probability():
    y_true = np.array([100.0, 200.0, 300.0, 400.0])
    lower = np.array([90.0, 180.0, 310.0, 350.0])
    upper = np.array([110.0, 220.0, 350.0, 450.0])
    
    # Obs 1: 100 in [90, 110] -> True
    # Obs 2: 200 in [180, 220] -> True
    # Obs 3: 300 in [310, 350] -> False (300 < 310)
    # Obs 4: 400 in [350, 450] -> True
    # Coverage = 3 / 4 = 75.0%
    picp = compute_picp(y_true, lower, upper)
    assert picp == 75.0

    # Empty array handling
    assert compute_picp([], [], []) == 0.0


def test_directional_accuracy():
    y_origin = np.array([100.0, 100.0, 100.0, 100.0])
    y_true   = np.array([120.0,  80.0, 110.0, 100.0])  # UP, DOWN, UP, FLAT
    y_pred   = np.array([130.0,  90.0,  95.0, 100.0])  # UP, DOWN, DOWN, FLAT
    
    # Matches:
    # Obs 1: UP vs UP -> Match
    # Obs 2: DOWN vs DOWN -> Match
    # Obs 3: UP vs DOWN -> Miss
    # Obs 4: FLAT vs FLAT -> Match
    # Accuracy = 3 / 4 = 75.0%
    da = compute_directional_accuracy(y_true, y_pred, y_origin)
    assert da == 75.0


def test_compute_metrics_aggregated():
    y_true = np.array([100.0, 200.0])
    y_pred = np.array([105.0, 195.0])
    y_origin = np.array([90.0, 210.0])
    lower = np.array([90.0, 180.0])
    upper = np.array([120.0, 220.0])

    res = compute_metrics(y_true, y_pred, y_origin, lower, upper)
    assert "MAE (Rp)" in res
    assert "RMSE (Rp)" in res
    assert "WAPE (%)" in res
    assert "sMAPE (%)" in res
    assert "Directional Accuracy (%)" in res
    assert "PICP (%)" in res
    assert res["PICP (%)"] == 100.0


def test_calculate_bias():
    # 3 under-predictions (pred < true) and 1 over-prediction (pred > true)
    y_true = np.array([100.0, 200.0, 300.0, 400.0])
    y_pred = np.array([90.0,  180.0, 270.0, 420.0])

    bias = calculate_bias(y_true, y_pred)
    assert bias["under_predict_pct"] == 75.0
    assert bias["over_predict_pct"] == 25.0
    assert bias["exact_pct"] == 0.0
    assert bias["bias_tendency"] == "Under-predicting"
    assert bias["mean_bias"] < 0  # Systematic negative error


def test_analyze_directional_errors():
    y_origin = np.array([100.0, 100.0, 100.0, 100.0])
    y_true   = np.array([110.0, 120.0,  90.0,  80.0])  # UP, UP, DOWN, DOWN
    y_pred   = np.array([115.0,  95.0,  85.0, 105.0])  # UP, DOWN, DOWN, UP

    res = analyze_directional_errors(y_true, y_pred, y_origin)
    assert res["total_samples"] == 4
    assert res["actual_up_count"] == 2
    assert res["actual_down_count"] == 2
    assert res["up_accuracy_pct"] == 50.0   # 1 out of 2 UP correctly predicted
    assert res["down_accuracy_pct"] == 50.0 # 1 out of 2 DOWN correctly predicted
    assert res["false_alarm_up_count"] == 1 # 1 DOWN was wrongly predicted UP
    assert res["missed_up_count"] == 1       # 1 UP was missed (predicted DOWN)


def test_plot_residual_diagnostics():
    df_preds = pd.DataFrame({
        "tanggal": pd.date_range("2026-01-01", periods=20),
        "harga_aktual": [10000 + i * 100 + (i % 3) * 50 for i in range(20)],
        "harga_prediksi": [10000 + i * 100 for i in range(20)]
    })

    fig = plot_residual_diagnostics(df_preds)
    assert isinstance(fig, plt.Figure)
    assert len(fig.axes) == 2
    plt.close(fig)

    # Missing required columns should raise ValueError
    with pytest.raises(ValueError):
        plot_residual_diagnostics(pd.DataFrame({"foo": [1, 2, 3]}))


def test_metrics_empty_and_edge_inputs():
    """Ensures metric calculations do not crash on empty inputs or edge cases."""
    assert compute_wape([], []) == 0.0
    assert compute_mae([], []) == 0.0
    assert compute_rmse([], []) == 0.0
    assert compute_smape([], []) == 0.0
    assert compute_picp([], [], []) == 0.0
    assert compute_directional_accuracy([], []) == 0.0

    # Optional origin defaulting
    y_true = np.array([100.0, 120.0, 110.0])
    y_pred = np.array([105.0, 125.0, 108.0])
    da = compute_directional_accuracy(y_true, y_pred)
    assert 0.0 <= da <= 100.0

    dir_err = analyze_directional_errors(y_true, y_pred)
    assert dir_err["total_samples"] == 3

    # Empty plot diagnostics
    fig_empty = plot_residual_diagnostics(pd.DataFrame({"harga_aktual": [], "harga_prediksi": []}))
    assert isinstance(fig_empty, plt.Figure)
    plt.close(fig_empty)

    # Multi-market panel diagnostics
    df_panel = pd.DataFrame({
        "tanggal": ["2026-01-01"] * 3 + ["2026-01-15"] * 3 + ["2026-01-29"] * 3 + ["2026-02-12"] * 3,
        "pasar_id": [1, 2, 3] * 4,
        "harga_aktual": [30000 + i * 500 for i in range(12)],
        "harga_prediksi": [30200 + i * 480 for i in range(12)]
    })
    fig_panel = plot_residual_diagnostics(df_panel)
    assert isinstance(fig_panel, plt.Figure)
    plt.close(fig_panel)
