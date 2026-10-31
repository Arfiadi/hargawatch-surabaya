"""Unit and integration tests for forecasting engine, baselines, and EWS generator.

Tests:
1. resolve_commodity name matching and error handling
2. RidgeForecaster fit, predict, interval bounds monotonicity
3. run_walk_forward_backtest return structure (df_summary, df_predictions)
4. run_experiment feature ablation toggles (use_weather, use_calendar)
5. generate_ews_summary_dataframe scoring and warning classification
"""

import numpy as np
import pandas as pd
import pytest

from src.models.models import RidgeForecaster
from src.models.backtest import resolve_commodity
from src.models.forecast_engine import run_experiment, ForecastEngine
from src.safety.early_warning import generate_ews_summary_dataframe


def test_resolve_commodity():
    # 1. Exact match
    cid, name = resolve_commodity("Cabe Rawit Merah")
    assert cid == 50
    assert "Cabe Rawit Merah" in name

    # 2. Case insensitive & "Cabai" spelling variant
    cid_cabai, _ = resolve_commodity("cabai rawit merah")
    assert cid_cabai == 50

    # 3. Substring match
    cid_bawang, name_bawang = resolve_commodity("Bawang Merah")
    assert cid_bawang == 39

    # 4. Integer and numeric string IDs
    cid_int, name_int = resolve_commodity(50)
    assert cid_int == 50
    assert "Cabe Rawit Merah" in name_int

    cid_str, name_str = resolve_commodity("50")
    assert cid_str == 50

    # 5. Unknown commodity raises ValueError
    with pytest.raises(ValueError):
        resolve_commodity("Komoditas Antariksa 123")


def test_ridge_forecaster():
    rng = np.random.default_rng(42)
    n = 60
    X = pd.DataFrame({
        "pasar_id": rng.choice([1, 2, 3], size=n),
        "price_current": rng.uniform(25000, 35000, size=n),
        "price_lag_1": rng.uniform(25000, 35000, size=n),
        "price_lag_7": rng.uniform(25000, 35000, size=n)
    })
    y = X["price_current"] * 1.01 + rng.normal(0, 300, size=n)

    forecaster = RidgeForecaster(
        feature_cols=["pasar_id", "price_current", "price_lag_1", "price_lag_7"],
        categorical_cols=["pasar_id"]
    )
    forecaster.fit(X, y)
    preds = forecaster.predict(X)

    assert "harga_prediksi" in preds
    assert "batas_bawah" in preds
    assert "batas_atas" in preds

    p10 = preds["batas_bawah"]
    p50 = preds["harga_prediksi"]
    p90 = preds["batas_atas"]

    assert len(p50) == n
    assert (p10 <= p50).all()
    assert (p50 <= p90).all()

    # Test single-market subset prediction (proves categorical dummy encoding does not drop the single category)
    X_single = X[X["pasar_id"] == 2].iloc[:5].copy()
    preds_single = forecaster.predict(X_single)
    assert len(preds_single["harga_prediksi"]) == 5
    assert (preds_single["batas_bawah"] <= preds_single["harga_prediksi"]).all()


def test_generate_ews_summary_dataframe():
    df_preds = pd.DataFrame({
        "tanggal": ["2026-09-01", "2026-09-01", "2026-09-01"],
        "pasar_id": [1, 2, 3],
        "komoditas_id": [50, 50, 50],
        "harga_aktual": [30000, 40000, 31000],
        "harga_prediksi": [31000, 48000, 31500],
        "price_current": [30000, 40000, 31000],
        "price_lag_7": [25000, 32000, 30500],
        "rolling_std_14d": [2000, 5000, 1000]
    })

    df_ews = generate_ews_summary_dataframe(df_preds)

    assert len(df_ews) == 3
    required_cols = [
        "tanggal", "pasar_id", "nama_pasar", "komoditas_id",
        "harga_aktual", "harga_prediksi", "skor_tren", "skor_volatilitas",
        "skor_anomali", "skor_prediksi", "total_skor", "status_warning"
    ]
    for col in required_cols:
        assert col in df_ews.columns

    assert set(df_ews["status_warning"]).issubset({"NORMAL", "WASPADA", "TINGGI"})
    # Pasar ID 2 had large surge and high volatility -> expect WASPADA or TINGGI
    p2 = df_ews[df_ews["pasar_id"] == 2].iloc[0]
    assert p2["status_warning"] in ["WASPADA", "TINGGI"]

    # Test empty dataframe handling
    df_empty_ews = generate_ews_summary_dataframe(pd.DataFrame())
    assert df_empty_ews.empty
    for col in required_cols:
        assert col in df_empty_ews.columns


@pytest.mark.requires_data
@pytest.mark.slow
def test_run_experiment_structure_and_ablation():
    """Runs a fast 1-window backtest experiment to test structure and feature toggles."""
    df_sum, df_pred = run_experiment(
        commodity_name="Beras Premium",
        model_type="ridge",
        horizon=7,
        test_start_date="2026-02-01",
        window_step_days=30,
        use_weather=False,
        use_calendar=False,
        verbose=False
    )

    assert not df_sum.empty
    assert "WAPE (%)" in df_sum.columns
    assert "MAE (Rp)" in df_sum.columns

    assert not df_pred.empty
    pred_cols = ["tanggal", "harga_aktual", "harga_prediksi", "batas_bawah", "batas_atas"]
    for col in pred_cols:
        assert col in df_pred.columns


@pytest.mark.requires_data
@pytest.mark.slow
def test_invalid_model_type_raises_error():
    """Ensures an informative ValueError is raised when unsupported model_type is given."""
    with pytest.raises(ValueError, match="Unsupported model_type"):
        run_experiment("Cabai Rawit Merah", model_type="unsupported_quantum_model", verbose=False)


@pytest.mark.requires_data
@pytest.mark.slow
def test_forecast_engine_ablation_study():
    """Verifies ForecastEngine OOP class and run_ablation_study logic."""
    engine = ForecastEngine(
        commodity_name="Beras Premium",
        horizon=7,
        test_start_date="2026-02-01",
        window_step_days=30
    )
    df_ablation = engine.run_ablation_study(model_type="ridge", verbose=False)
    assert len(df_ablation) == 4
    assert "Configuration" in df_ablation.columns
    assert "Weather" in df_ablation.columns
    assert "Calendar" in df_ablation.columns
    assert "WAPE (%)" in df_ablation.columns


@pytest.mark.requires_data
@pytest.mark.slow
def test_sanity_model_alias():
    """Tests the new 'sanity' macro alias runs both Naive Last and Naive SMA."""
    df_sum, df_pred = run_experiment(
        commodity_name="Beras Premium",
        model_type="sanity",
        horizon=7,
        test_start_date="2026-02-01",
        window_step_days=30,
        verbose=False
    )
    assert not df_sum.empty
    assert len(df_sum) == 2
    models_evaluated = df_sum["Model"].tolist()
    assert any("Last Value" in m for m in models_evaluated)
    assert any("SMA" in m for m in models_evaluated)


class _FakeWandbRun:
    """Minimal stand-in for ``wandb.Run`` so the logging contract can be asserted."""

    def __init__(self):
        self.logs = []
        self.summary = {}
        self.finished = False

    def log(self, payload):
        self.logs.append(payload)

    def finish(self):
        self.finished = True


def test_forecast_engine_log_notebook_experiment(monkeypatch):
    """Memastikan tabel dan metrik benar-benar dikirim ke W&B (bukan sekadar tidak crash)."""
    wandb = pytest.importorskip("wandb")
    if not hasattr(wandb, "Table"):
        monkeypatch.setattr(wandb, "Table", lambda dataframe=None: dataframe, raising=False)
    fake_run = _FakeWandbRun()
    monkeypatch.setattr(
        "src.models.forecast_engine._init_wandb_session",
        lambda **kwargs: (fake_run, True),
    )

    engine = ForecastEngine(
        commodity_name="Cabe Rawit Merah",
        horizon=7,
        test_start_date="2026-02-01",
        window_step_days=30
    )

    df_summary = pd.DataFrame({
        "Model": ["LightGBM p50", "CatBoost p50"],
        "WAPE (%)": [13.5, 14.2],
        "MAE (Rp)": [5200.0, 5600.0],
        "Directional Accuracy (%)": [55.0, 52.0],
        "PICP (%)": [75.0, 72.0]
    })
    df_ablation = pd.DataFrame({
        "Configuration": ["Full Features", "Without Weather"],
        "Weather": ["Yes", "No"],
        "Calendar": ["Yes", "Yes"],
        "WAPE (%)": [14.0, 13.5]
    })
    scorecard_ews = pd.DataFrame({
        "Metrik": ["Recall (Sensitivitas Krisis)", "False Alarm Rate (FAR)"],
        "Nilai": ["95.0%", "10.0%"],
        "Target SOP": [">= 90.0%", "<= 20.0%"]
    })
    df_pred = pd.DataFrame({
        "tanggal": ["2026-09-01", "2026-09-02"],
        "pasar_id": [1, 1],
        "harga_aktual": [30000, 31000],
        "harga_prediksi": [30500, 31200],
        "batas_bawah": [28000, 29000],
        "batas_atas": [33000, 34000]
    })
    feat_imp = pd.DataFrame({
        "feature": ["price_lag_1", "rolling_mean_7d"],
        "importance": [150.0, 95.0]
    })

    run = engine.log_notebook_experiment(
        df_summary_gbdt=df_summary,
        df_ablation=df_ablation,
        scorecard_ews=scorecard_ews,
        df_predictions=df_pred,
        feat_imp=feat_imp,
        run_name="Test-Notebook-Run",
        tags=["test"]
    )

    assert run is fake_run
    assert fake_run.finished is True
    assert fake_run.summary["champion_model"] == "LightGBM p50"
    assert fake_run.summary["champion_wape"] == 13.5
    assert fake_run.summary["ews_recall_pct"] == 95.0
    assert fake_run.summary["ews_far_pct"] == 10.0
    assert len(fake_run.logs) >= 5


def test_forecast_engine_log_notebook_experiment_returns_none_when_disabled(monkeypatch):
    """Mode tanpa W&B harus mengembalikan None secara eksplisit."""
    monkeypatch.setattr(
        "src.models.forecast_engine._init_wandb_session",
        lambda **kwargs: (None, False),
    )
    engine = ForecastEngine(
        commodity_name="Cabe Rawit Merah",
        horizon=7,
        test_start_date="2026-02-01",
        window_step_days=30
    )

    assert engine.log_notebook_experiment(run_name="disabled") is None


