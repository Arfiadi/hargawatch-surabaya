"""Unit tests untuk kualitas data dan transformasi pipeline.

Berbeda dari versi sebelumnya, test di sini memanggil fungsi produksi
(``preprocessing_final`` dan ``data_quality``) sehingga regresi pada logika
bisnis benar-benar terdeteksi.
"""

import numpy as np
import pandas as pd

from src.pipeline import preprocessing_final
from src.utils.data_quality import run_forecasting_data_quality_check


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _write_raw_pasar(tmp_path, df: pd.DataFrame, slug: str = "dummy") -> None:
    """Menulis CSV mentah dengan skema yang dibaca oleh ``bersihkan_pasar``."""
    df.to_csv(tmp_path / f"data_{slug}_kalender.csv", index=False)


def _raw_pasar_rows() -> list[dict]:
    dates = pd.date_range("2026-01-01", periods=15, freq="D")
    prices = [10000.0] + [np.nan] * 8 + [12000.0, 0.0, -500.0, 12500.0, np.nan, 13000.0]
    rows = [
        {
            "tanggal": d,
            "komoditas_id": 50,
            "komoditas": "Cabe Rawit Merah",
            "grup": "CABE",
            "satuan": "Kg",
            "harga_kemarin": np.nan,
            "harga": p,
        }
        for d, p in zip(dates, prices)
    ]

    # Komoditas yang mulai terlambat: leading NaN harus dipangkas.
    rows += [
        {
            "tanggal": d,
            "komoditas_id": 60,
            "komoditas": "Telat Mulai",
            "grup": "SAYUR",
            "satuan": "Kg",
            "harga_kemarin": np.nan,
            "harga": 7000.0 + i,
        }
        for i, d in enumerate(dates[4:])
    ]

    # Komoditas langka: hanya 1 harga valid dari 21 baris -> >90% kosong, harus dibuang.
    rows += [
        {
            "tanggal": dates[i % len(dates)],
            "komoditas_id": 99,
            "komoditas": "Langka",
            "grup": "LAIN",
            "satuan": "Kg",
            "harga_kemarin": np.nan,
            "harga": 5000.0 if i == 0 else 0.0,
        }
        for i in range(21)
    ]

    # Komoditas non-pangan yang masuk daftar buang.
    rows += [
        {
            "tanggal": d,
            "komoditas_id": 77,
            "komoditas": "Bata",
            "grup": "MATERIAL",
            "satuan": "Buah",
            "harga_kemarin": np.nan,
            "harga": 1000.0,
        }
        for d in dates
    ]

    # Nama komoditas yang harus di-rename.
    rows += [
        {
            "tanggal": d,
            "komoditas_id": 88,
            "komoditas": "Halus",
            "grup": "GARAM",
            "satuan": "Kg",
            "harga_kemarin": np.nan,
            "harga": 8000.0,
        }
        for d in dates
    ]
    return rows


def _clean_sample_pasar(tmp_path, monkeypatch):
    _write_raw_pasar(tmp_path, pd.DataFrame(_raw_pasar_rows()))
    monkeypatch.setattr(preprocessing_final, "RAW_PASAR", str(tmp_path))
    return preprocessing_final.bersihkan_pasar("dummy", psr_id=1)


def _quality_dataset() -> pd.DataFrame:
    dates = pd.date_range("2026-01-01", periods=15, freq="D")
    return pd.DataFrame({
        "tanggal": dates,
        "pasar_id": [1] * 15,
        "komoditas_id": [50] * 15,
        "target_price": [30000.0 + i for i in range(15)],
        "target_date": dates + pd.to_timedelta(7, unit="D"),
        "price_current": [30000.0] * 15,
        "rolling_mean_7d": [30000.0] * 15,
        "pct_change_1d": [0.0] * 15,
    })


# ---------------------------------------------------------------------------
# preprocessing_final.bersihkan_pasar
# ---------------------------------------------------------------------------

def test_bersihkan_pasar_ffill_limit_and_non_positive_prices(tmp_path, monkeypatch):
    """Memastikan aturan produksi: ffill max 7 hari, harga <= 0 menjadi NULL."""
    result, dropped = _clean_sample_pasar(tmp_path, monkeypatch)

    assert dropped == ["Langka"]

    cabe = (
        result[result["komoditas_id"] == 50]
        .sort_values("tanggal")
        .reset_index(drop=True)
    )
    assert len(cabe) == 15

    # Harga 0 dan -500 harus hilang dari harga_asli, tetapi tetap diimputasi oleh ffill.
    assert cabe.loc[0, "harga_asli"] == 10000.0
    assert pd.isna(cabe.loc[10, "harga_asli"])
    assert pd.isna(cabe.loc[11, "harga_asli"])
    assert cabe.loc[10, "harga_imputasi"] == 12000
    assert cabe.loc[11, "harga_imputasi"] == 12000

    # Gap 8 hari: ffill(limit=7) hanya mengisi 7 hari pertama.
    assert cabe.loc[1:7, "harga_imputasi"].tolist() == [10000] * 7
    assert pd.isna(cabe.loc[8, "harga_imputasi"])

    # Flag is_imputed harus konsisten dengan harga_asli.
    assert bool(cabe.loc[1, "is_imputed"]) is True
    assert bool(cabe.loc[0, "is_imputed"]) is False


def test_bersihkan_pasar_trims_leading_nan_and_filters_commodities(tmp_path, monkeypatch):
    """Memastikan leading NaN dipangkas, komoditas buang/rename/langka ditangani."""
    result, dropped = _clean_sample_pasar(tmp_path, monkeypatch)

    # Komoditas langka (>90% kosong) dibuang dan dilaporkan.
    assert "Langka" in dropped
    assert 99 not in set(result["komoditas_id"])

    # Komoditas non-pangan dibuang, sedangkan nama "Halus" di-rename.
    assert "Bata" not in set(result["komoditas"])
    assert "Garam Beryodium Halus" in set(result["komoditas"])

    telat = (
        result[result["komoditas_id"] == 60]
        .sort_values("tanggal")
        .reset_index(drop=True)
    )
    assert len(telat) == 11
    assert telat["tanggal"].min() == pd.Timestamp("2026-01-05")
    assert telat["harga_imputasi"].isna().sum() == 0


# ---------------------------------------------------------------------------
# utils.data_quality.run_forecasting_data_quality_check
# ---------------------------------------------------------------------------

def test_data_quality_check_passes_clean_dataset():
    result = run_forecasting_data_quality_check(_quality_dataset(), horizon=7)

    assert result["passed_all"] is True
    assert result["layer1"]["validity"] == "PASSED"
    assert result["layer1"]["uniqueness"] == "PASSED"
    assert result["layer2"]["monotonic"] == "PASSED"


def test_data_quality_check_flags_invalid_target_and_duplicates():
    df = _quality_dataset()
    df.loc[3, "target_price"] = 0.0
    df.loc[5, "target_price"] = np.nan
    df = pd.concat([df, df.iloc[[0]]], ignore_index=True)

    result = run_forecasting_data_quality_check(df, horizon=7)

    assert result["passed_all"] is False
    assert "FAILED" in result["layer1"]["missing_target"]
    assert "FAILED" in result["layer1"]["validity"]
    assert "FAILED" in result["layer1"]["uniqueness"]


# ---------------------------------------------------------------------------
# Scraper parsers
# ---------------------------------------------------------------------------

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
