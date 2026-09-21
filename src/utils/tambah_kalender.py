"""Tambah kolom kalender (libur nasional, Ramadan, nama hari) ke CSV harga.

Input : data_harga_pasar.csv (kolom: tanggal, komoditas_id, komoditas, grup, satuan,
        harga_kemarin, harga)
Output: data_harga_pasar_kalender.csv (input + kolom kalender), atau in-place dengan --inplace

Kolom baru:
  hari_nama         : Senin..Minggu
  is_weekend        : 1 = Sabtu/Minggu
  is_libur_nasional : 1 = hari libur nasional / cuti bersama
  nama_libur        : nama hari liburnya (kosong bila bukan)
  is_ramadan        : 1 = tanggal jatuh di bulan Ramadan
  is_pra_ramadan    : 1 = 14 hari sebelum Ramadan (periode kenaikan permintaan)

Kumpulan tanggal Ramadan di-hardcode sesuai SKB 3 Menteri (transparan & bisa
diperbaiki); versi pustaka holidays hanya benar untuk Idulfitri, bukan Ramadan.

Pemakaian:
  python tambah_kalender.py
  python tambah_kalender.py --input data_wonokromo.csv --output data_wonokromo_kalender.csv
"""

import argparse
import csv
import os
import sys
from datetime import date, datetime, timedelta

import holidays

NAMA_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

# Rentang Ramadan (tanggal mulai & selesai, inklusif) menurut SKB 3 Menteri RI.
# Perbarui baris tahun baru begitu SKB tahun berjalan diterbitkan.
RAMADAN = {
    2020: (date(2020, 4, 24), date(2020, 5, 23)),
    2021: (date(2021, 4, 13), date(2021, 5, 12)),
    2022: (date(2022, 4, 3), date(2022, 5, 1)),
    2023: (date(2023, 3, 23), date(2023, 4, 21)),
    2024: (date(2024, 3, 12), date(2024, 4, 9)),
    2025: (date(2025, 3, 1), date(2025, 3, 30)),
    2026: (date(2026, 2, 19), date(2026, 3, 19)),  # perkiraan, verifikasi saat SKB terbit
}


def buat_kalender(tahun_min, tahun_maks):
    """Return (libur: dict tanggal->nama, ramadan: set tanggal, pra_ramadan: set tanggal)."""
    libur = holidays.ID(years=range(tahun_min, tahun_maks + 1),
                        categories=(holidays.PUBLIC, holidays.GOVERNMENT))

    ramadan = set()
    pra_ramadan = set()
    for mulai, selesai in RAMADAN.values():
        d = mulai
        while d <= selesai:
            ramadan.add(d.isoformat())
            d += timedelta(days=1)
        d = mulai - timedelta(days=14)
        while d < mulai:
            pra_ramadan.add(d.isoformat())
            d += timedelta(days=1)

    return {t.isoformat(): n for t, n in libur.items()}, ramadan, pra_ramadan


def main(argv=None):
    app = argparse.ArgumentParser(description="Tambah kolom kalender ke CSV harga")
    app.add_argument("--input", default="data_harga_pasar.csv")
    app.add_argument("--output", default=None,
                     help="default: <input>_kalender.csv (diabaikan jika --inplace)")
    app.add_argument("--inplace", action="store_true", help="timpa file input langsung")
    args = app.parse_args(argv)

    if not os.path.exists(args.input):
        raise SystemExit(f"File tidak ditemukan: {args.input}")

    # Baca semua baris
    with open(args.input, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)
    if not rows:
        raise SystemExit("File input kosong.")

    # Kalender sesuai rentang tahun data
    tahun = sorted({r["tanggal"][:4] for r in rows})
    tahun_min, tahun_maks = int(tahun[0]), int(tahun[-1])
    libur, ramadan, pra_ramadan = buat_kalender(tahun_min, tahun_maks)

    kolom_baru = ["hari_nama", "is_weekend", "is_libur_nasional",
                  "nama_libur", "is_ramadan", "is_pra_ramadan"]
    fieldnames_out = fieldnames + [k for k in kolom_baru if k not in fieldnames]

    n_libur = n_ramadan = 0
    for r in rows:
        tgl = datetime.strptime(r["tanggal"], "%Y-%m-%d").date()
        nama = libur.get(r["tanggal"], "")
        if nama:
            n_libur += 1
        if r["tanggal"] in ramadan:
            n_ramadan += 1
        r["hari_nama"] = NAMA_HARI[tgl.weekday()]
        r["is_weekend"] = "1" if tgl.weekday() >= 5 else "0"
        r["is_libur_nasional"] = "1" if nama else "0"
        r["nama_libur"] = nama
        r["is_ramadan"] = "1" if r["tanggal"] in ramadan else "0"
        r["is_pra_ramadan"] = "1" if r["tanggal"] in pra_ramadan else "0"

    output = args.input if args.inplace else (args.output or
              os.path.splitext(args.input)[0] + "_kalender.csv")
    with open(output, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames_out)
        w.writeheader()
        w.writerows(rows)

    print(f"Input   : {args.input} ({len(rows)} baris)")    
    print(f"Output  : {output}")
    print(f"Periode : {rows[0]['tanggal']} s.d. {rows[-1]['tanggal']} "
          f"({tahun_min}-{tahun_maks})")
    print(f"Baris libur nasional : {n_libur}")
    print(f"Baris Ramadan        : {n_ramadan}")
    print(f"Kolom baru           : {', '.join(kolom_baru)}")


if __name__ == "__main__":
    sys.exit(main())
