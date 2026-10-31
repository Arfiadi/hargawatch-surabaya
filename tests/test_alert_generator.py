"""Unit tests untuk pembentukan teks alert Telegram dan pemilihan pilar pemicu."""

import pandas as pd

from src.safety.alert_generator import (
    format_pilar_pemicu,
    generate_telegram_markdown_alert,
)


def _row(
    pasar_id: int,
    komoditas_id: int,
    status: str,
    total_skor: int,
    skor_prediksi: int = 0,
    skor_anomali: int = 0,
    skor_volatilitas: int = 0,
    skor_tren: int = 0,
) -> dict:
    return {
        "tanggal": "2026-09-01",
        "pasar_id": pasar_id,
        "komoditas_id": komoditas_id,
        "total_skor": total_skor,
        "status_warning": status,
        "skor_prediksi": skor_prediksi,
        "skor_anomali": skor_anomali,
        "skor_volatilitas": skor_volatilitas,
        "skor_tren": skor_tren,
    }


def test_format_pilar_pemicu_lists_all_active_pillars():
    row = pd.Series({
        "skor_prediksi": 20,
        "skor_anomali": 20,
        "skor_volatilitas": 18,
        "skor_tren": 18,
    })

    assert format_pilar_pemicu(row) == (
        "Proyeksi ML (Naik Tajam), Disparitas Grosir (Stok Hulu Menipis), "
        "Volatilitas Pasar, Tren Harga Historis"
    )


def test_format_pilar_pemicu_uses_fallback_when_below_thresholds():
    row = pd.Series({
        "skor_prediksi": 19,
        "skor_anomali": 19,
        "skor_volatilitas": 17,
        "skor_tren": 17,
    })

    assert format_pilar_pemicu(row) == "Akumulasi Multi-Faktor"


def test_generate_alert_returns_none_for_empty_or_all_normal():
    assert generate_telegram_markdown_alert(pd.DataFrame(), {}, {}) is None

    df_normal = pd.DataFrame([_row(1, 50, "NORMAL", 10)])
    assert generate_telegram_markdown_alert(df_normal, {50: "Cabai"}, {1: "Pasar A"}) is None


def test_generate_alert_limits_waspada_and_reports_remainder():
    rows = [_row(1, 50, "TINGGI", 95, skor_prediksi=40)]
    waspada_scores = [80, 75, 70, 65, 60, 55, 50]
    for i, score in enumerate(waspada_scores, start=1):
        rows.append(_row(10 + i, 50, "WASPADA", score))
    df = pd.DataFrame(rows)

    dict_komoditas = {50: "Cabai Rawit Merah"}
    dict_pasar = {1: "Pasar Tinggi", **{10 + i: f"Pasar W{i}" for i in range(1, 8)}}

    text = generate_telegram_markdown_alert(df, dict_komoditas, dict_pasar)

    assert text is not None
    assert "🔴 *STATUS TINGGI (BAHAYA)*" in text
    assert "Pasar Tinggi" in text
    assert "🟡 *STATUS WASPADA*" in text
    assert "Pasar W1" in text
    assert "Pasar W5" in text
    assert "Pasar W6" not in text
    assert "Pasar W7" not in text
    assert "...dan 2 peringatan waspada lainnya." in text
