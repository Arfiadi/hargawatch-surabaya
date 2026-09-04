"""Update catch-up HargaWatch: isi semua tanggal bolong di database.

Dirancang untuk Windows Task Scheduler (jalan saat laptop nyala) maupun manual.
Alur:
  1. Koneksi Supabase
  2. Cari tanggal tanpa satu baris pun di fact_harga_pasar (jendela 30 hari terakhir)
  3. Untuk tiap tanggal: scrape 6 pasar (pangan) + produsen Surabaya -> upsert
  4. Ringkasan hasil

Idempotent: upsert (ON CONFLICT DO UPDATE), aman dijalankan berulang.

Pemakaian:
  python scripts/update_catchup.py                    # isi bolong s.d. kemarin
  python scripts/update_catchup.py --maks 14          # batasi hari per run
  python scripts/update_catchup.py --mulai 2026-09-01 # paksa mulai tanggal tertentu
"""

import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))

from psycopg2.extras import execute_values

from ingest_supabase import DDL, koneksi
from preprocessing_final import buat_kalender
from update_harian import KABKOTA, KOTA_PRODUSEN, UPSERT_KALENDER, UPSERT_PASAR, UPSERT_PRODUSEN, upsert
from scrape_data import ambil_daftar_pasar, get_html_table, is_pangan, parse_tabel
from scrape_produsen import get_html_table as get_produsen_html
from scrape_produsen import parse_tabel as parse_produsen


def ambil_tanggal_bolong(cur, mulai_paksa=None, maks=40, jendela=30):
    """Tanggal tanpa satu baris pun di fact, dalam jendela N hari terakhir.
    (Deteksi berbasis MAX(tanggal) buta terhadap bolong di tengah.)"""
    kemarin = datetime.now(ZoneInfo("Asia/Jakarta")).date() - timedelta(days=1)
    if mulai_paksa:
        mulai = datetime.strptime(mulai_paksa, "%Y-%m-%d").date()
    else:
        mulai = kemarin - timedelta(days=jendela - 1)
    cur.execute("""
        SELECT k.tanggal FROM dim_kalender k
        WHERE k.tanggal BETWEEN %s AND %s
          AND NOT EXISTS (SELECT 1 FROM fact_harga_pasar f WHERE f.tanggal = k.tanggal)
        ORDER BY k.tanggal
    """, (mulai, kemarin))
    return [r[0] for r in cur.fetchall()][:maks]


def scrape_satu_tanggal(tgl, pasar_list, allowed_ids):
    """Return (rows_pasar, rows_produsen) untuk satu tanggal."""
    rows_pasar, rows_prod = [], []
    for p in pasar_list:
        try:
            html = get_html_table(tgl.isoformat(), KABKOTA, p["psr_id"])
            baris = parse_tabel(html) if html else []
        except Exception as e:
            print(f"    [!] {p['psr_nama']}: {e}")
            continue
        for b in baris:
            if not is_pangan(b.get("grup"), b.get("komoditas")) or not b["harga"]:
                continue
            if int(b["komoditas_id"]) not in allowed_ids:
                continue  # komoditas yang dibuang saat preprocessing (mis. Kedelai Lokal)
            rows_pasar.append((tgl, p["psr_id"], b["komoditas_id"],
                               b["harga"], b["harga"], False))

    try:
        html = get_produsen_html(tgl.isoformat())
        baris = parse_produsen(html, KOTA_PRODUSEN) if html else []
    except Exception as e:
        print(f"    [!] produsen: {e}")
        baris = []
    for b in baris:
        if not b["harga"]:
            continue
        rows_prod.append((tgl, b["komoditas"], b["titik_pantau"], b["kabupaten"],
                          b["satuan"], b["harga"], b["harga"], False))
    return rows_pasar, rows_prod


def main():
    app = argparse.ArgumentParser(description="Catch-up data bolong HargaWatch")
    app.add_argument("--mulai", default=None, help="paksa mulai tanggal YYYY-MM-DD")
    app.add_argument("--maks", type=int, default=40, help="maks hari bolong per run")
    args = app.parse_args()

    conn = koneksi()
    try:
        with conn.cursor() as cur:
            cur.execute(DDL)
            conn.commit()

            cur.execute("SELECT komoditas_id FROM dim_komoditas")
            allowed_ids = {r[0] for r in cur.fetchall()}

            tanggal = ambil_tanggal_bolong(cur, args.mulai, args.maks)
            if not tanggal:
                print("Tidak ada tanggal bolong. Database sudah mutakhir.")
                return 0
            print(f"Tanggal bolong: {len(tanggal)} hari "
                  f"({tanggal[0]} s.d. {tanggal[-1]})")

            pasar_list = ambil_daftar_pasar(KABKOTA)
            total_p, total_d = 0, 0

            for tgl in tanggal:
                print(f"  {tgl} ...")
                rows_p, rows_d = scrape_satu_tanggal(tgl, pasar_list, allowed_ids)

                kal = buat_kalender(tgl, tgl)
                upsert(cur, UPSERT_KALENDER,
                       list(kal.itertuples(index=False, name=None)))
                if rows_p:
                    execute_values(cur, UPSERT_PASAR, rows_p, page_size=1000)
                if rows_d:
                    execute_values(cur, UPSERT_PRODUSEN, rows_d, page_size=1000)
                conn.commit()
                total_p += len(rows_p)
                total_d += len(rows_d)
                print(f"    +{len(rows_p)} pasar, +{len(rows_d)} produsen")

            print(f"\nSelesai. Total upsert: {total_p} pasar, {total_d} produsen "
                  f"dalam {len(tanggal)} hari.")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
