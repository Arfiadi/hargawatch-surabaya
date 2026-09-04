"""Update harian HargaWatch: scrape harga kemarin -> upsert Supabase.

Dirancang untuk GitHub Actions (jalan tiap pagi) maupun lokal.
Strategi tanggal: dijalankan pagi WIB, target datanya = KEMARIN (hari sebelumnya),
karena data hari berjalan baru diisi petugas siang/malam.

Alur:
  1. Pastikan tabel ada (IF NOT EXISTS) + baris dim_kalender untuk tanggal target
  2. Scrape harga konsumen semua pasar Surabaya (filter pangan)
  3. Scrape harga produsen (titik pantau Surabaya)
  4. Upsert ke fact_harga_pasar & fact_harga_produsen (ON CONFLICT DO UPDATE)
  5. Verifikasi jumlah baris untuk tanggal target

Pemakaian:
  python scripts/update_harian.py                # target = kemarin (WIB)
  python scripts/update_harian.py --tanggal 2026-09-01
"""

import argparse
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import psycopg2
from psycopg2.extras import execute_values

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv

from ingest_supabase import DDL, koneksi
from preprocessing_final import buat_kalender
from scrape_data import ambil_daftar_pasar, get_html_table, is_pangan, parse_tabel
from scrape_produsen import get_html_table as get_produsen_html
from scrape_produsen import parse_tabel as parse_produsen

KABKOTA = "surabayakota"
KOTA_PRODUSEN = "Kota Surabaya"

UPSERT_PASAR = """
INSERT INTO fact_harga_pasar
  (tanggal, pasar_id, komoditas_id, harga_asli, harga_imputasi, is_imputed)
VALUES %s
ON CONFLICT (tanggal, pasar_id, komoditas_id) DO UPDATE
SET harga_asli     = EXCLUDED.harga_asli,
    harga_imputasi = EXCLUDED.harga_imputasi,
    is_imputed     = EXCLUDED.is_imputed,
    created_at     = CURRENT_TIMESTAMP
"""

UPSERT_PRODUSEN = """
INSERT INTO fact_harga_produsen
  (tanggal, komoditas, titik_pantau, kabupaten, satuan,
   harga_asli, harga_imputasi, is_imputed)
VALUES %s
ON CONFLICT (tanggal, komoditas, titik_pantau) DO UPDATE
SET harga_asli     = EXCLUDED.harga_asli,
    harga_imputasi = EXCLUDED.harga_imputasi,
    is_imputed     = EXCLUDED.is_imputed,
    created_at     = CURRENT_TIMESTAMP
"""

UPSERT_KALENDER = """
INSERT INTO dim_kalender
  (tanggal, tahun, bulan, hari_nama, is_weekend, is_libur_nasional,
   nama_libur, is_ramadan, is_pra_ramadan)
VALUES %s
ON CONFLICT (tanggal) DO NOTHING
"""


def target_tanggal(opsi):
    if opsi:
        return datetime.strptime(opsi, "%Y-%m-%d").date()
    kemarin = datetime.now(ZoneInfo("Asia/Jakarta")).date() - timedelta(days=1)
    return kemarin


def scrape_pasar(tgl, conn):
    """Scrape semua pasar Surabaya untuk satu tanggal -> baris fact siap upsert."""
    pasar = ambil_daftar_pasar(KABKOTA)
    semua = []
    for p in pasar:
        psr_id, nama = p["psr_id"], p["psr_nama"]
        try:
            html = get_html_table(tgl.isoformat(), KABKOTA, psr_id)
            baris = parse_tabel(html) if html else []
        except Exception as e:
            print(f"  [!] {nama}: gagal scrape ({e})")
            continue
        n = 0
        for b in baris:
            if not is_pangan(b.get("grup"), b.get("komoditas")):
                continue
            if not b["harga"]:  # 0 / kosong = tidak ada entri hari itu
                continue
            semua.append((tgl, psr_id, b["komoditas_id"], b["harga"], b["harga"], False))
            n += 1
        print(f"  {nama:<22} {n:>3} komoditas")
    return semua


def scrape_produsen(tgl):
    try:
        html = get_produsen_html(tgl.isoformat())
        baris = parse_produsen(html, KOTA_PRODUSEN) if html else []
    except Exception as e:
        print(f"  [!] produsen: gagal scrape ({e})")
        return []
    hasil = []
    for b in baris:
        if not b["harga"]:
            continue
        hasil.append((tgl, b["komoditas"], b["titik_pantau"], b["kabupaten"],
                      b["satuan"], b["harga"], b["harga"], False))
    print(f"  produsen              {len(hasil):>3} baris")
    return hasil


def upsert(cur, sql, records):
    if records:
        execute_values(cur, sql, records, page_size=1000)
    return len(records)


def main():
    app = argparse.ArgumentParser(description="Update harian HargaWatch ke Supabase")
    app.add_argument("--tanggal", default=None, help="target YYYY-MM-DD (default: kemarin WIB)")
    args = app.parse_args()
    tgl = target_tanggal(args.tanggal)
    print(f"HargaWatch update harian | target: {tgl}")

    conn = koneksi()
    try:
        with conn.cursor() as cur:
            cur.execute(DDL)  # IF NOT EXISTS - idempotent
            conn.commit()

            # dim_kalender untuk tanggal target
            kal = buat_kalender(tgl, tgl)
            upsert(cur, UPSERT_KALENDER, list(kal.itertuples(index=False, name=None)))
            conn.commit()

            print("Scrape harga konsumen:")
            records = scrape_pasar(tgl, conn)
            print("Scrape harga produsen:")
            records += scrape_produsen(tgl)

            # pisahkan fact pasar vs produsen berdasarkan bentuk tuple (6 vs 8 elemen)
            pasar_rows = [r for r in records if len(r) == 6]
            prod_rows = [r for r in records if len(r) == 8]
            n1 = upsert(cur, UPSERT_PASAR, pasar_rows)
            n2 = upsert(cur, UPSERT_PRODUSEN, prod_rows)
            conn.commit()
            print(f"Upsert fact_harga_pasar    : {n1} baris")
            print(f"Upsert fact_harga_produsen : {n2} baris")

            if not records:
                print("Tidak ada data untuk tanggal ini (mis. libur). Selesai tanpa perubahan.")
                return 0

            print("\nVerifikasi tanggal", tgl)
            for tabel in ["fact_harga_pasar", "fact_harga_produsen"]:
                cur.execute(f"SELECT COUNT(*) FROM {tabel} WHERE tanggal = %s", (tgl,))
                print(f"  {tabel:<22} {cur.fetchone()[0]:>5} baris")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
