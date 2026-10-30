"""Unit tests untuk kualitas data dan transformasi pipeline."""

import numpy as np
import pandas as pd
import pytest


def test_ffill_bounded_limit(sample_price_series):
    """Memastikan imputasi forward-fill dibatasi maksimal 7 hari."""
    df = sample_price_series.copy()
    
    # Simulasikan logika pembersihan harga_asli
    df["harga_asli"] = df["harga"].apply(lambda x: pd.NA if pd.isna(x) or x <= 0 else x)
    
    # Imputasi dengan limit=7
    harga_ffill = df["harga_asli"].ffill(limit=7)
    
    # Hari 0: 10000 (valid)
    # Hari 1-7: Terisi 10000 (7 hari imputasi)
    # Hari 8: Harus NaN (karena sudah lewat 7 hari berturut-turut tanpa data baru)
    assert harga_ffill.iloc[0] == 10000.0
    for i in range(1, 8):
        assert harga_ffill.iloc[i] == 10000.0
    assert pd.isna(harga_ffill.iloc[8])


def test_non_positive_price_dropped(sample_price_series):
    """Memastikan harga nol atau negatif otomatis diubah menjadi NULL (pd.NA)."""
    df = sample_price_series.copy()
    df["harga_asli"] = df["harga"].apply(lambda x: pd.NA if pd.isna(x) or x <= 0 else x)
    
    # Hari 10 bernilai 0.0, Hari 11 bernilai -500.0
    assert pd.isna(df["harga_asli"].iloc[10])
    assert pd.isna(df["harga_asli"].iloc[11])
    # Hari 9 (12000.0) dan Hari 12 (12500.0) harus tetap utuh
    assert df["harga_asli"].iloc[9] == 12000.0
    assert df["harga_asli"].iloc[12] == 12500.0


def test_parse_angka_missing_values():
    """Memastikan string kosong, strip, dan nol di-parse menjadi None (bukan integer 0)."""
    from src.pipeline.scrape_data import parse_angka as parse_pasar
    from src.pipeline.scrape_produsen import parse_angka as parse_prod

    for parse_fn in [parse_pasar, parse_prod]:
        assert parse_fn(None) is None
        assert parse_fn("") is None
        assert parse_fn("-") is None
        assert parse_fn("--") is None
        assert parse_fn("0") is None
        assert parse_fn("Rp 0") is None
        assert parse_fn("16.500") == 16500
        assert parse_fn("12.500,50") == 12500.5


def test_validate_and_sanitize_outputs_gate():
    """Memastikan Quality Gate menolak NaN, kuantil terbalik, duplikasi, dan status invalid."""
    from scripts.run_forecasting import validate_and_sanitize_outputs

    # 1. Valid dataframes pass cleanly
    df_fc = pd.DataFrame({
        "tanggal": ["2026-11-01", "2026-11-02"],
        "pasar_id": [1, 1],
        "komoditas_id": [50, 50],
        "harga_prediksi": [50000, 52000],
        "batas_bawah": [48000, 50000],
        "batas_atas": [54000, 55000],
    })
    df_ews = pd.DataFrame({
        "tanggal": ["2026-11-01", "2026-11-02"],
        "pasar_id": [1, 1],
        "komoditas_id": [50, 50],
        "total_skor": [35, 75],
        "status_warning": ["NORMAL", "TINGGI"],
    })
    clean_fc, clean_ew = validate_and_sanitize_outputs(df_fc, df_ews)
    assert len(clean_fc) == 2
    assert len(clean_ew) == 2

    # 2. Duplicate keys are deduplicated
    df_fc_dup = pd.concat([df_fc, df_fc.iloc[[0]]], ignore_index=True)
    clean_fc_dup, _ = validate_and_sanitize_outputs(df_fc_dup, df_ews)
    assert len(clean_fc_dup) == 2

    # 3. Crossing quantiles are clipped monotonically
    df_fc_cross = df_fc.copy()
    df_fc_cross.loc[0, "batas_bawah"] = 60000  # greater than harga_prediksi (50000)
    df_fc_cross.loc[0, "batas_atas"] = 40000   # less than harga_prediksi (50000)
    clean_cross, _ = validate_and_sanitize_outputs(df_fc_cross, df_ews)
    assert clean_cross.loc[0, "batas_bawah"] <= clean_cross.loc[0, "harga_prediksi"]
    assert clean_cross.loc[0, "harga_prediksi"] <= clean_cross.loc[0, "batas_atas"]

    # 4. NaN in critical forecast columns raises ValueError
    df_fc_nan = df_fc.copy()
    df_fc_nan.loc[0, "harga_prediksi"] = np.nan
    with pytest.raises(ValueError, match="contains nulls"):
        validate_and_sanitize_outputs(df_fc_nan, df_ews)

    # 5. Invalid status_warning raises ValueError
    df_ews_bad_status = df_ews.copy()
    df_ews_bad_status.loc[0, "status_warning"] = "SUPER_CRITICAL"
    with pytest.raises(ValueError, match="invalid status_warning"):
        validate_and_sanitize_outputs(df_fc, df_ews_bad_status)

