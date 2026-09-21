"""Unduh data cuaca historis Surabaya (curah hujan & suhu) dari Open-Meteo Archive API.

Output:
  - cuaca_surabaya.csv : kolom tanggal, curah_hujan_mm, jam_hujan, hari_hujan,
                         suhu_mean_c, suhu_max_c, suhu_min_c,
                         kelembapan_mean_pct, angin_max_kmh
  - cuaca_surabaya.json (versi JSON dari CSV)

Sumber: https://archive-api.open-meteo.com (gratis, tanpa key, data reanalysis ERA5)

Contoh:
  python download_cuaca.py                                  # 2020-01-01 s.d. hari ini
  python download_cuaca.py --mulai 2021-01-01 --akhir 2022-12-31
"""

import argparse
import csv
import json
import os
import sys
import time
from datetime import date, datetime, timedelta

import requests

API = "https://archive-api.open-meteo.com/v1/archive"

# Titik representatif Kota Surabaya (dekat Stasiun Meteorologi Perak I)
LAT, LON = -7.2458, 112.7378

# Unduh per blok 1 tahun agar aman dari limit panjang permintaan
BLOK_HARI = 365


def unduh(mulai, akhir, retry=3):
    params = {
        "latitude": LAT,
        "longitude": LON,
        "daily": ("rain_sum,precipitation_hours,temperature_2m_mean,temperature_2m_max,"
                  "temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max"),
        "timezone": "Asia/Jakarta",
        "start_date": mulai,
        "end_date": akhir,
    }
    for percobaan in range(1, retry + 1):
        try:
            r = requests.get(API, params=params, timeout=60)
            r.raise_for_status()
            data = r.json()
            if "daily" not in data:
                raise ValueError(f"Respon tak berisi 'daily': {str(data)[:200]}")
            return data["daily"]
        except (requests.RequestException, ValueError) as e:
            if percobaan == retry:
                raise
            print(f"  [!] {mulai}..{akhir} gagal ({e}), ulang dalam {2 ** percobaan} dtk")
            time.sleep(2 ** percobaan)
    return None


def to_float(nilai):
    return "" if nilai is None else round(nilai, 2)


def main(argv=None):
    app = argparse.ArgumentParser(description="Unduh cuaca historis Surabaya (Open-Meteo)")
    app.add_argument("--mulai", default="2020-01-01", help="tanggal awal YYYY-MM-DD")
    app.add_argument("--akhir", default=None, help="tanggal akhir YYYY-MM-DD (default: hari ini)")
    app.add_argument("--output", default="cuaca_surabaya.csv", help="file CSV keluaran")
    args = app.parse_args(argv)

    mulai = datetime.strptime(args.mulai, "%Y-%m-%d").date()
    akhir = datetime.strptime(args.akhir, "%Y-%m-%d").date() if args.akhir else date.today()
    if akhir < mulai:
        raise SystemExit("--akhir harus >= --mulai")

    print(f"Lokasi   : Surabaya ({LAT}, {LON})")
    print(f"Periode  : {mulai} s.d. {akhir}")
    print(f"Output   : {args.output}\n")

    # Resume: baca tanggal yang sudah ada di CSV
    sudah = {}
    if os.path.exists(args.output) and os.path.getsize(args.output) > 0:
        with open(args.output, newline="", encoding="utf-8-sig") as f:
            for baris in csv.DictReader(f):
                sudah[baris["tanggal"]] = baris
        print(f"Resume   : {len(sudah)} tanggal sudah ada, hanya tanggal baru yang diunduh")

    d = mulai
    total_baris_baru = 0
    while d <= akhir:
        blok_akhir = min(d + timedelta(days=BLOK_HARI - 1), akhir)

        # Cek tanggal mana dalam blok ini yang belum ada
        perlu = []
        dd = d
        while dd <= blok_akhir:
            if dd.isoformat() not in sudah:
                perlu.append(dd.isoformat())
            dd += timedelta(days=1)

        if not perlu:
            print(f"  {d} .. {blok_akhir} : sudah ada, lewati")
        else:
            data = unduh(d.isoformat(), blok_akhir.isoformat())
            waktu = data["time"]
            kolom = {
                "curah_hujan_mm": data.get("rain_sum", []),
                "jam_hujan": data.get("precipitation_hours", []),
                "suhu_mean_c": data.get("temperature_2m_mean", []),
                "suhu_max_c": data.get("temperature_2m_max", []),
                "suhu_min_c": data.get("temperature_2m_min", []),
                "kelembapan_mean_pct": data.get("relative_humidity_2m_mean", []),
                "angin_max_kmh": data.get("wind_speed_10m_max", []),
            }
            n_baru = 0
            for i, t in enumerate(waktu):
                tgl = t[:10]
                if tgl in sudah:
                    continue
                hujan = kolom["curah_hujan_mm"][i]
                sudah[tgl] = {
                    "tanggal": tgl,
                    **{k: to_float(v[i]) if i < len(v) else "" for k, v in kolom.items()},
                    "hari_hujan": 1 if (hujan or 0) > 0 else 0,
                }
                n_baru += 1
            total_baris_baru += n_baru
            print(f"  {d} .. {blok_akhir} : +{n_baru} baris baru", flush=True)
            time.sleep(0.5)

        d = blok_akhir + timedelta(days=1)

    # Tulis ulang CSV penuh (urut tanggal)
    fieldnames = ["tanggal", "curah_hujan_mm", "jam_hujan", "hari_hujan",
                  "suhu_mean_c", "suhu_max_c", "suhu_min_c",
                  "kelembapan_mean_pct", "angin_max_kmh"]
    urut = [sudah[t] for t in sorted(sudah)]
    with open(args.output, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(urut)

    with open(os.path.splitext(args.output)[0] + ".json", "w", encoding="utf-8") as f:
        json.dump(urut, f, ensure_ascii=False, indent=2)

    print(f"\nSelesai. {len(urut)} tanggal tersimpan di {args.output} (+JSON). "
          f"Baris baru: {total_baris_baru}")


if __name__ == "__main__":
    sys.exit(main())
