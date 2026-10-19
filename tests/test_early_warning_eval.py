"""Unit tests untuk evaluasi metrik kinerja EWS (Recall, FAR, Lead Time) dan Alert Generator."""

import pytest
import pandas as pd
import numpy as np

from src.safety.early_warning import (
    compute_early_warning_scores,
    evaluate_ews_performance,
)
from src.safety.alert_generator import (
    generate_telegram_markdown_alert,
    format_pilar_pemicu,
)


def test_evaluate_ews_performance_metrics():
    """Menguji perhitungan Recall, FAR, Precision, dan evaluasi terhadap target SOP."""
    # Data sintetis: 4 observasi
    # Obs 1: Krisis aktual (+20%), Alarm TINGGI -> TP
    # Obs 2: Krisis aktual (+15%), Alarm NORMAL -> FN (Krisis luput)
    # Obs 3: Normal (+2%), Alarm TINGGI -> FP (Alarm palsu)
    # Obs 4: Normal (-1%), Alarm NORMAL -> TN
    df_ews = pd.DataFrame({
        "tanggal": ["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04"],
        "pasar_id": [1, 1, 1, 1],
        "komoditas_id": [50, 50, 50, 50],
        "price_current": [30000.0, 30000.0, 30000.0, 30000.0],
        "harga_aktual": [36000.0, 34500.0, 30600.0, 29700.0],
        "status_warning": ["TINGGI", "NORMAL", "TINGGI", "NORMAL"],
    })

    scorecard = evaluate_ews_performance(
        df_ews,
        spike_threshold_pct=10.0,
        alarm_level="TINGGI",
        horizon_days=7,
    )

    assert isinstance(scorecard, pd.DataFrame)
    assert set(["Metrik", "Nilai", "Target SOP", "Status"]).issubset(scorecard.columns)

    metrics_dict = dict(zip(scorecard["Metrik"], scorecard["Nilai"]))
    # TP = 1, FN = 1 -> Recall = 50.0%
    # FP = 1, TP = 1 -> FAR = 50.0%
    assert metrics_dict["Recall (Sensitivitas Krisis)"] == "50.0%"
    assert metrics_dict["False Alarm Rate (FAR)"] == "50.0%"
    assert metrics_dict["Lead Time Peringatan"] == "7 Hari (H+7)"
    assert metrics_dict["True Positives (Krisis Terdeteksi)"] == "1"
    assert metrics_dict["False Negatives (Krisis Luput)"] == "1"
    assert metrics_dict["False Positives (Alarm Palsu)"] == "1"


def test_evaluate_ews_performance_empty():
    """Menguji penanganan input kosong pada evaluate_ews_performance."""
    df_empty = pd.DataFrame()
    scorecard = evaluate_ews_performance(df_empty)
    assert scorecard.empty
    assert list(scorecard.columns) == ["Metrik", "Nilai", "Target SOP", "Status"]


def test_early_warning_scores_with_rolling_30d_and_90d_high():
    """Menguji bahwa skor EWS memanfaatkan rolling_std_30d dan rolling_max_90d."""
    df_current = pd.DataFrame({
        "tanggal": [pd.to_datetime("2026-09-01")],
        "pasar_id": [1],
        "komoditas_id": [50],
        "price_current": [40000.0],
        "price_lag_7": [35000.0],       # +14.28% -> Pilar 1 = 20 pt (>= 10%)
        "rolling_std_7d": [3000.0],
        "rolling_std_30d": [1500.0],     # Ratio = 2.0 >= 1.5 -> Pilar 2 = 20 pt
        "rolling_max_90d": [42000.0],
    })

    df_forecasts = pd.DataFrame({
        "pasar_id": [1],
        "komoditas_id": [50],
        "harga_prediksi": [48000.0],     # +20% -> Pilar 4 Logika A = 20 pt
        "batas_atas": [49000.0],         # 49000 > 42000 -> Pilar 4 Logika B = 20 pt
    })

    df_res = compute_early_warning_scores(df_current, df_forecasts)

    assert len(df_res) == 1
    row = df_res.iloc[0]
    assert row["skor_tren"] == 20
    assert row["skor_volatilitas"] == 20
    assert row["skor_prediksi"] == 40  # 20 (Logika A) + 20 (Logika B)
    assert row["total_skor"] >= 80
    assert row["status_warning"] == "TINGGI"


def test_generate_telegram_markdown_alert():
    """Menguji penyusunan teks Markdown untuk notifikasi Telegram."""
    df_ews = pd.DataFrame({
        "tanggal": ["2026-09-01", "2026-09-01", "2026-09-01"],
        "pasar_id": [1, 2, 3],
        "komoditas_id": [50, 50, 10],
        "total_skor": [85, 55, 20],
        "status_warning": ["TINGGI", "WASPADA", "NORMAL"],
        "skor_prediksi": [40, 20, 0],
        "skor_anomali": [20, 10, 0],
        "skor_volatilitas": [15, 15, 10],
        "skor_tren": [10, 10, 10],
    })

    dict_komoditas = {50: "Cabai Rawit Merah", 10: "Beras Medium"}
    dict_pasar = {1: "Pasar Wonokromo", 2: "Pasar Tambahrejo", 3: "Pasar Genteng"}

    alert_text = generate_telegram_markdown_alert(df_ews, dict_komoditas, dict_pasar)

    assert alert_text is not None
    assert "HARGAWATCH: PERINGATAN DINI HARGA PANGAN" in alert_text
    assert "🔴 *STATUS TINGGI (BAHAYA)*" in alert_text
    assert "Cabai Rawit Merah" in alert_text
    assert "Pasar Wonokromo" in alert_text
    assert "🟡 *STATUS WASPADA*" in alert_text
    assert "Pasar Tambahrejo" in alert_text
    # Komoditas NORMAL (Beras di Genteng) tidak boleh masuk teks peringatan
    assert "Pasar Genteng" not in alert_text
