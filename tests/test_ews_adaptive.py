"""Unit tests verifying the adaptive EWS methodology enhancements.

Validates:
1. Plateau crisis retention (Z-level prevents volatility amnesia during prolonged high prices).
2. Universal spatial disparity for non-Keputran commodities (Beras, Daging, Minyak).
3. Cluster-adaptive trend thresholds (Beras 4% vs Telur 8% vs Cabai 15%).
"""

import numpy as np
import pandas as pd
import pytest

from src.safety.early_warning import compute_early_warning_scores


def test_ews_plateau_amnesia_prevention():
    """Memastikan skor volatilitas tidak padam menjadi 0 saat krisis bertahan lama di puncak (plateau)."""
    # Simulasi krisis hari ke-15 di mana harga bertahan di Rp 100.000
    # Volatilitas 7 hari rendah (karena harga flat tinggi), tapi Z-score terhadap baseline 30 hari sangat tinggi
    df_current = pd.DataFrame({
        "tanggal": [pd.to_datetime("2026-09-15")],
        "pasar_id": [1],
        "komoditas_id": [50],                  # Cabai Rawit
        "price_current": [100000.0],
        "price_lag_7": [100000.0],             # Flat di puncak (laju perubahan = 0%)
        "rolling_std_7d": [500.0],             # Std 7 hari sangat kecil (hampir tidak ada gejolak harian)
        "rolling_std_30d": [25000.0],          # Std 30 hari besar karena ada lonjakan dari 30rb ke 100rb
        "rolling_mean_30d": [45000.0]          # Mean 30 hari masih di Rp 45.000 -> Z-score = (100k-45k)/25k = 2.2 >= 2.0
    })

    df_forecasts = pd.DataFrame({
        "pasar_id": [1],
        "komoditas_id": [50],
        "harga_prediksi": [100000.0]
    })

    res = compute_early_warning_scores(df_current, df_forecasts)
    row = res.iloc[0]

    # Pada metode lama, vol_ratio = 500 / 25000 = 0.02 -> skor_vol = 0 (amnesia)
    # Pada metode baru, Z-score = 2.2 >= 2.0 -> skor_volatilitas HARUS tetap 20 poin!
    assert row["skor_volatilitas"] == 20


def test_ews_non_keputran_spatial_spread():
    """Memastikan komoditas non-Keputran (Beras / Daging) tetap memiliki Pilar 3 yang aktif via spread spasial."""
    # Pasar 1, 2, 3 menjual Beras Medium (ID 4)
    # Tidak ada Pasar Keputran (pasar_id=5) dalam data ini
    # Harga: Pasar 1 = 12.000, Pasar 2 = 14.500, Pasar 3 = 11.500
    # Spread = (14.500 - 11.500) / 12.666 = 23.68% >= 15.0% -> Pilar 3 = 20 pt
    df_current = pd.DataFrame({
        "tanggal": [pd.to_datetime("2026-09-01")] * 3,
        "pasar_id": [1, 2, 3],
        "komoditas_id": [4, 4, 4],             # Beras Medium
        "price_current": [12000.0, 14500.0, 11500.0],
        "price_lag_7": [12000.0, 12000.0, 11500.0],
        "rolling_std_14d": [200.0, 300.0, 150.0]
    })

    df_forecasts = pd.DataFrame({
        "pasar_id": [1, 2, 3],
        "komoditas_id": [4, 4, 4],
        "harga_prediksi": [12000.0, 14500.0, 11500.0]
    })

    res = compute_early_warning_scores(df_current, df_forecasts)

    # Seluruh baris harus mendapatkan skor_anomali aktif (tidak lagi 0 permanen!)
    assert (res["skor_anomali"] == 20).all()


def test_ews_cluster_adaptive_trend_thresholds():
    """Memastikan kepekaan threshold tren berbeda secara adil antar klaster komoditas."""
    # Uji kenaikan harga yang sama (+5.0%) pada 3 komoditas berbeda:
    # 1. Beras Premium (ID 2, Bahan Pokok): kenaikan 5% >= 4% -> HARUS 20 poin
    # 2. Telur Ayam Ras (ID 16, Moderat): kenaikan 5% >= 4% -> HARUS 10 poin (butuh 8% untuk 20)
    # 3. Cabai Rawit Merah (ID 50, Volatil): kenaikan 5% < 8% -> HARUS 0 poin (butuh 15% untuk 20)
    df_current = pd.DataFrame({
        "tanggal": [pd.to_datetime("2026-09-01")] * 3,
        "pasar_id": [1, 1, 1],
        "komoditas_id": [2, 16, 50],
        "price_current": [15750.0, 29400.0, 42000.0],
        "price_lag_7": [15000.0, 28000.0, 40000.0],   # Semuanya naik tepat 5.0%
        "rolling_std_14d": [200.0, 500.0, 1000.0]
    })

    df_forecasts = pd.DataFrame({
        "pasar_id": [1, 1, 1],
        "komoditas_id": [2, 16, 50],
        "harga_prediksi": [15750.0, 29400.0, 42000.0]
    })

    res = compute_early_warning_scores(df_current, df_forecasts)

    skor_beras = res[res["komoditas_id"] == 2]["skor_tren"].iloc[0]
    skor_telur = res[res["komoditas_id"] == 16]["skor_tren"].iloc[0]
    skor_cabai = res[res["komoditas_id"] == 50]["skor_tren"].iloc[0]

    assert skor_beras == 20
    assert skor_telur == 10
    assert skor_cabai == 0
