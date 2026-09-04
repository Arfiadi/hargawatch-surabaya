"""Preprocessing HargaWatch - Silver Layer (perbaikan sesuai audit).

Memperbaiki 6 temuan audit:
  1. Imputasi: ffill MURNI (tanpa interpolate -> tidak ada lookahead bias),
     dibulatkan ke rupiah bulat.
  2. Dual-price column: harga_asli (0 -> NULL) berdampingan dengan
     harga_imputasi (NOT NULL setelah trimming) + flag is_imputed.
  3. Pasar Genteng ikut diproses (6 pasar).
  4. Kolom harga_kemarin statis DIHAPUS (hitung dengan LAG() saat analytics).
  5. Kalender ditambahkan ke data produsen.
  6. Leading NaN dipangkas: baris sebelum entri valid pertama per komoditas
     dibuang, sehingga harga_imputasi tidak pernah NaN.

Output (data/processed/):
  dim_pasar.csv, dim_komoditas.csv, dim_kalender.csv,
  fact_harga_pasar.csv (6 pasar tergabung), fact_harga_produsen.csv

Pemakaian:
  python preprocessing_final.py          # dari root proyek
"""

import csv
import os
import sys
from pathlib import Path
from datetime import date, datetime, timedelta

import holidays
import pandas as pd

# Root proyek (relatif ke lokasi file ini: scripts/../) agar aman dijalankan
# dari folder mana pun (root, notebook/, dsb.)
BASE_DIR = Path(__file__).resolve().parent.parent

RAW_PASAR = str(BASE_DIR / "data/raw/pasar")
RAW_PRODUSEN = str(BASE_DIR / "data/raw/produsen")
OUT = str(BASE_DIR / "data/processed")

# Pasar + psr_id (dari pasar.json/surabayakota) + tipe untuk dim_pasar
PASAR = {
    "tambahrejo": (1, "Pasar Tambahrejo", "Pasar Tradisional Ritel"),
    "wonokromo": (2, "Pasar Wonokromo", "Pasar Tradisional Ritel"),
    "genteng": (3, "Pasar Genteng", "Pasar Tradisional Ritel"),
    "pucang_anom": (4, "Pasar Pucang Anom", "Pasar Tradisional Ritel"),
    "keputran": (5, "Pasar Keputran", "Pasar Induk Grosir"),
    "soponyono": (146, "Pasar Soponyono", "Pasar Tradisional Ritel"),
}

# Komoditas non-pangan / selalu kosong yang dibuang (mengikuti keputusan EDA)
DROP_KOMODITAS = {
    "Minyak Goreng Kemasan Sederhana", "Susu Bubuk Merk Bendera (Instant)",
    "Susu Bubuk Merk Indomilk (Instant)", "Kedelai Lokal", "Bata",
}

# Komoditas yang nyaris tidak pernah tercatat per pasar -> dibuang otomatis
# bila di atas 90% periode tidak ada satu pun harga valid.
AMBANG_KOMODITAS_KOSONG = 0.90

RENAME_KOMODITAS = {"Halus": "Garam Beryodium Halus"}

NAMA_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]


def buat_kalender(tanggal_min, tanggal_maks):
    """DataFrame dim_kalender dari rentang tanggal (termasuk libur & Ramadan)."""
    semua = pd.date_range(tanggal_min, tanggal_maks, freq="D")
    libur = holidays.ID(years=range(semua.min().year, semua.max().year + 1),
                        categories=(holidays.PUBLIC, holidays.GOVERNMENT))
    # Rentang Ramadan sesuai SKB 3 Menteri (sama dengan tambah_kalender.py)
    ramadan_ranges = [
        (date(2020, 4, 24), date(2020, 5, 23)),
        (date(2021, 4, 13), date(2021, 5, 12)),
        (date(2022, 4, 3), date(2022, 5, 1)),
        (date(2023, 3, 23), date(2023, 4, 21)),
        (date(2024, 3, 12), date(2024, 4, 9)),
        (date(2025, 3, 1), date(2025, 3, 30)),
        (date(2026, 2, 19), date(2026, 3, 19)),
    ]
    set_ramadan, set_pra = set(), set()
    for mulai, selesai in ramadan_ranges:
        d = mulai
        while d <= selesai:
            set_ramadan.add(d.isoformat())
            d += timedelta(days=1)
        d = mulai - timedelta(days=14)
        while d < mulai:
            set_pra.add(d.isoformat())
            d += timedelta(days=1)

    kal = pd.DataFrame({"tanggal": semua})
    kal["tahun"] = kal["tanggal"].dt.year
    kal["bulan"] = kal["tanggal"].dt.month
    kal["hari_nama"] = kal["tanggal"].dt.weekday.map(lambda i: NAMA_HARI[i])
    kal["is_weekend"] = (kal["tanggal"].dt.weekday >= 5).astype(int)
    kal["is_libur_nasional"] = kal["tanggal"].dt.date.astype(str).isin(
        [d.isoformat() for d in libur.keys()]).astype(int)
    kal["nama_libur"] = kal["tanggal"].dt.date.astype(str).map(
        lambda t: libur.get(t, ""))
    kal["is_ramadan"] = kal["tanggal"].dt.date.astype(str).isin(set_ramadan).astype(int)
    kal["is_pra_ramadan"] = kal["tanggal"].dt.date.astype(str).isin(set_pra).astype(int)
    return kal


def bersihkan_pasar(slug, psr_id):
    """Proses satu pasar -> DataFrame fact siap gabung."""
    df = pd.read_csv(f"{RAW_PASAR}/data_{slug}_kalender.csv", parse_dates=["tanggal"])

    # 0 -> NULL (harga_asli), buang komoditas non-pangan/selalu kosong
    df["harga_asli"] = df["harga"].replace(0, pd.NA)
    df = df[~df["komoditas"].isin(DROP_KOMODITAS)].copy()
    df["komoditas"] = df["komoditas"].replace(RENAME_KOMODITAS)

    # Buang komoditas yang hampir tidak pernah tercatat (>90% kosong)
    rasio = df.groupby("komoditas")["harga_asli"].apply(lambda s: s.isna().mean())
    kosong = rasio[rasio > AMBANG_KOMODITAS_KOSONG].index.tolist()
    if kosong:
        df = df[~df["komoditas"].isin(kosong)].copy()

    # Grid kalender kontinu x komoditas
    full_tanggal = pd.date_range(df["tanggal"].min(), df["tanggal"].max(), freq="D")
    grid = pd.MultiIndex.from_product(
        [df["komoditas_id"].unique(), full_tanggal],
        names=["komoditas_id", "tanggal"]).to_frame(index=False)
    df = grid.merge(df, on=["komoditas_id", "tanggal"], how="left")
    for kolom in ["komoditas", "grup", "satuan"]:
        df[kolom] = df.groupby("komoditas_id")[kolom].ffill().bfill()

    df = df.sort_values(["komoditas_id", "tanggal"]).reset_index(drop=True)

    # 6. Pangkas leading NaN: mulai dari entri valid pertama tiap komoditas.
    #    (df sudah terurut komoditas_id+tanggal dengan index kontinu, jadi
    #    index >= index-entri-pertama = baris mulai entri pertama ke atas)
    first_valid = df.groupby("komoditas_id")["harga_asli"].apply(
        lambda s: s.first_valid_index())
    df = df[df.index >= df["komoditas_id"].map(first_valid)].copy()

    # 1. Imputasi ffill MURNI + bulatkan ke rupiah (tanpa interpolate)
    df["is_imputed"] = df["harga_asli"].isna()
    harga_ffill = df.groupby("komoditas_id")["harga_asli"].ffill()
    harga_ffill = pd.to_numeric(harga_ffill, errors="coerce")
    df["harga_imputasi"] = harga_ffill.round(0).astype("Int64")

    # 4. Buang kolom statis harga_kemarin (hitung LAG() saat analytics)
    df = df.drop(columns=[c for c in ["harga", "harga_kemarin", "imputed"] if c in df.columns])

    df["pasar_id"] = psr_id

    # Kalender dari raw sudah cukup untuk kolom opsional; dim_kalender dipakai
    # sebagai sumber kebenaran saat consolidasi (kolom duplikat dibuang).
    df = df[["tanggal", "pasar_id", "komoditas_id", "komoditas", "grup",
             "satuan", "harga_asli", "harga_imputasi", "is_imputed"]]
    return df, kosong


def bersihkan_produsen(kal):
    """Produsen: dual-price + kalender."""
    df = pd.read_csv(f"{RAW_PRODUSEN}/data_produsen.csv", parse_dates=["tanggal"])
    df["harga_asli"] = df["harga"].replace(0, pd.NA)
    df = df.drop(columns=[c for c in ["harga", "harga_kemarin", "imputed"] if c in df.columns])

    # Kalender kontinu per (komoditas, titik_pantau) lalu ffill murni
    full_tanggal = pd.date_range(df["tanggal"].min(), df["tanggal"].max(), freq="D")
    grid = pd.MultiIndex.from_product(
        [df["titik_pantau"].unique(), full_tanggal],
        names=["titik_pantau", "tanggal"]).to_frame(index=False)
    df = grid.merge(df, on=["titik_pantau", "tanggal"], how="left")
    for kolom in ["komoditas", "kabupaten", "satuan"]:
        df[kolom] = df.groupby("titik_pantau")[kolom].ffill().bfill()
    df = df.sort_values(["titik_pantau", "tanggal"]).reset_index(drop=True)

    # 6. Pangkas leading NaN per titik_pantau (pola sama dengan pasar)
    first_valid = df.groupby("titik_pantau")["harga_asli"].apply(
        lambda s: s.first_valid_index())
    df = df[df.index >= df["titik_pantau"].map(first_valid)].copy()

    df["is_imputed"] = df["harga_asli"].isna()
    harga_ffill = df.groupby("titik_pantau")["harga_asli"].ffill()
    harga_ffill = pd.to_numeric(harga_ffill, errors="coerce")
    df["harga_imputasi"] = harga_ffill.round(0).astype("Int64")
    df = df.merge(kal, on="tanggal", how="left")
    return df


def main():
    os.makedirs(OUT, exist_ok=True)

    kal = buat_kalender(pd.Timestamp("2020-01-01"), pd.Timestamp.today())
    kal.to_csv(f"{OUT}/dim_kalender.csv", index=False, encoding="utf-8-sig")
    print(f"dim_kalender.csv : {len(kal)} baris")

    semua_pasar = []
    dim_pasar_rows = []
    for slug, (psr_id, nama, tipe) in PASAR.items():
        df, kosong = bersihkan_pasar(slug, psr_id)
        semua_pasar.append(df)
        dim_pasar_rows.append({
            "pasar_id": psr_id, "nama_pasar": nama, "tipe_pasar": tipe,
            "n_komoditas": df["komoditas_id"].nunique(),
            "n_hari": df["tanggal"].nunique(),
            "pct_imputed": round(100 * df["is_imputed"].mean(), 1),
        })
        catatan = f" (buang: {', '.join(kosong)})" if kosong else ""
        print(f"{nama:<22} {len(df):>7} baris | {df['komoditas'].nunique()} komoditas{catatan}")

    # dim_pasar: gabung koordinat dari data/external/pasar/koordinat_pasar.csv
    dim_pasar = pd.DataFrame(dim_pasar_rows)[["pasar_id", "nama_pasar", "tipe_pasar"]]
    path_koordinat = "data/external/pasar/koordinat_pasar.csv"
    if os.path.exists(path_koordinat):
        koord = pd.read_csv(path_koordinat).rename(columns={"psr_id": "pasar_id"})
        dim_pasar = dim_pasar.merge(
            koord[["pasar_id", "lat", "lon", "sumber"]],
            on="pasar_id", how="left")
    dim_pasar.to_csv(f"{OUT}/dim_pasar.csv", index=False, encoding="utf-8-sig")
    print(f"dim_pasar.csv    : {len(dim_pasar)} baris")

    fact_pasar = pd.concat(semua_pasar, ignore_index=True)
    fact_pasar.to_csv(f"{OUT}/fact_harga_pasar.csv", index=False, encoding="utf-8-sig")
    print(f"fact_harga_pasar.csv : {len(fact_pasar)} baris")

    # dim_komoditas: master dari seluruh fact (id, nama, grup, satuan unik)
    dim_kom = (fact_pasar[["komoditas_id", "komoditas", "grup", "satuan"]]
               .drop_duplicates("komoditas_id").sort_values("komoditas_id"))
    dim_kom.to_csv(f"{OUT}/dim_komoditas.csv", index=False, encoding="utf-8-sig")
    print(f"dim_komoditas.csv : {len(dim_kom)} komoditas")

    fact_prod = bersihkan_produsen(kal)
    fact_prod.to_csv(f"{OUT}/fact_harga_produsen.csv", index=False, encoding="utf-8-sig")
    print(f"fact_harga_produsen.csv : {len(fact_prod)} baris")

    # Verifikasi cepat
    sisa_nan = int(fact_pasar["harga_imputasi"].isna().sum())
    desimal = int((fact_pasar["harga_imputasi"] % 1 != 0).sum())
    print("\n=== Verifikasi audit ===")
    print(f"harga_imputasi NaN : {sisa_nan} (harus 0)")
    print(f"Nilai desimal      : {desimal} (harus 0)")
    print(f"Pasar terproses    : {fact_pasar['pasar_id'].nunique()} (harus 6)")
    print(f"Baris is_imputed   : {int(fact_pasar['is_imputed'].sum())} "
          f"({100*fact_pasar['is_imputed'].mean():.1f}%)")


if __name__ == "__main__":
    sys.exit(main())
