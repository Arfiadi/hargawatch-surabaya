"""Update harian HargaWatch: scrape harga satu tanggal -> upsert Supabase.

Dirancang untuk dijadwalkan (Task Scheduler) maupun manual, dan juga dipakai
sebagai library oleh update_catchup.py (scrape_* + upsert + konstanta SQL).
Strategi tanggal: dijalankan pagi WIB, target datanya = KEMARIN (hari sebelumnya),
karena data hari berjalan baru diisi petugas siang/malam.

Alur:
  1. Pastikan tabel ada (IF NOT EXISTS) + baris dim_kalender untuk tanggal target
  2. Scrape harga konsumen semua pasar Surabaya (filter pangan)
  3. Scrape harga produsen (titik pantau Surabaya)
  4. Upsert ke fact_harga_pasar & fact_harga_produsen (ON CONFLICT DO UPDATE)
  5. Verifikasi jumlah baris untuk tanggal target

Exit code:
  0 = sukses (termasuk hari libur tanpa data)
  1 = sebagian/semua sumber gagal di-scrape (Task Scheduler dapat mengalert-kan)

Pemakaian:
  python scripts/update_harian.py                # target = kemarin (WIB)
  python scripts/update_harian.py --tanggal 2026-09-01
"""

import argparse
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from psycopg2.extras import execute_values

sys.path.insert(0, str(Path(__file__).resolve().parent))

from ingest_supabase import DDL, koneksi
from preprocessing_final import buat_kalender
from scrape_data import ambil_daftar_pasar, get_html_table, is_pangan, parse_tabel
from scrape_produsen import get_html_table as get_produsen_html
from scrape_produsen import parse_tabel as parse_produsen

KABKOTA = "surabayakota"
KOTA_PRODUSEN = "Kota Surabaya"

# Politeness delay antar request ke SISKAPERBAPO (detik)
JEDA_ANTAR_PASAR = 0.5

# Harga per satuan di atas ini hampir pasti salah input/parse (dibandingkan,
# bukan diblokir - hanya peringatan di log)
HARGA_MAKS_WAJAR = 10_000_000

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
ON CONFLICT (tanggal) DO UPDATE
SET tahun             = EXCLUDED.tahun,
    bulan             = EXCLUDED.bulan,
    hari_nama         = EXCLUDED.hari_nama,
    is_weekend        = EXCLUDED.is_weekend,
    is_libur_nasional = EXCLUDED.is_libur_nasional,
    nama_libur        = EXCLUDED.nama_libur,
    is_ramadan        = EXCLUDED.is_ramadan,
    is_pra_ramadan    = EXCLUDED.is_pra_ramadan
"""

UPSERT_CUACA = """
INSERT INTO fact_cuaca
  (tanggal, curah_hujan_mm, jam_hujan, hari_hujan, suhu_mean_c, suhu_max_c,
   suhu_min_c, kelembapan_mean_pct, angin_max_kmh)
VALUES %s
ON CONFLICT (tanggal) DO UPDATE
SET curah_hujan_mm      = EXCLUDED.curah_hujan_mm,
    jam_hujan           = EXCLUDED.jam_hujan,
    hari_hujan          = EXCLUDED.hari_hujan,
    suhu_mean_c         = EXCLUDED.suhu_mean_c,
    suhu_max_c          = EXCLUDED.suhu_max_c,
    suhu_min_c          = EXCLUDED.suhu_min_c,
    kelembapan_mean_pct = EXCLUDED.kelembapan_mean_pct,
    angin_max_kmh       = EXCLUDED.angin_max_kmh
"""

UPSERT_INFLASI = """
INSERT INTO fact_inflasi (tahun, bulan, inflasi_pct)
VALUES %s
ON CONFLICT (tahun, bulan) DO UPDATE
SET inflasi_pct = EXCLUDED.inflasi_pct
"""


def target_tanggal(opsi):
    if opsi:
        return datetime.strptime(opsi, "%Y-%m-%d").date()
    kemarin = datetime.now(ZoneInfo("Asia/Jakarta")).date() - timedelta(days=1)
    return kemarin


def ambil_komoditas_valid(cur):
    """Set komoditas_id yang dikenal dim_komoditas (filter scraping)."""
    cur.execute("SELECT komoditas_id FROM dim_komoditas")
    return {r[0] for r in cur.fetchall()}


def periksa_anomali(rows, harga_idx, label):
    """Cetak peringatan utk harga di atas batas wajar (tidak memblokir upsert)."""
    aneh = [r for r in rows
            if isinstance(r[harga_idx], (int, float)) and r[harga_idx] > HARGA_MAKS_WAJAR]
    if aneh:
        print(f"  [?] {label}: {len(aneh)} harga > Rp{HARGA_MAKS_WAJAR:,} - cek manual:")
        for r in aneh[:5]:
            print(f"      {r}")


def scrape_pasar(tgl, valid_ids, pasar_list=None, jeda=JEDA_ANTAR_PASAR):
    """Scrape harga konsumen semua pasar untuk satu tanggal.

    Return (rows, ok): rows siap upsert ke fact_harga_pasar; ok=False bila
    ada pasar yang gagal di-scrape (dipakai utk exit code).
    """
    if pasar_list is None:
        pasar_list = ambil_daftar_pasar(KABKOTA)
    semua = []
    ada_gagal = False
    for i, p in enumerate(pasar_list):
        psr_id, nama = p["psr_id"], p["psr_nama"]
        if i and jeda:
            time.sleep(jeda)
        try:
            html = get_html_table(tgl.isoformat(), KABKOTA, psr_id)
            baris = parse_tabel(html) if html else []
        except Exception as e:
            print(f"  [!] {nama}: gagal scrape ({e})")
            ada_gagal = True
            continue
        n = 0
        for b in baris:
            if not is_pangan(b.get("grup"), b.get("komoditas")):
                continue
            if not b["harga"]:  # 0 / kosong = tidak ada entri hari itu
                continue
            if b["komoditas_id"] not in valid_ids:
                continue
            semua.append((tgl, psr_id, b["komoditas_id"], b["harga"], b["harga"], False))
            n += 1
        print(f"  {nama:<22} {n:>3} komoditas")
    periksa_anomali(semua, 3, "pasar")
    return semua, ada_gagal


def scrape_produsen(tgl):
    """Scrape harga produsen Kota Surabaya utk satu tanggal.

    Return (rows, ok) - baris siap upsert ke fact_harga_produsen.
    """
    try:
        html = get_produsen_html(tgl.isoformat())
        baris = parse_produsen(html, KOTA_PRODUSEN) if html else []
    except Exception as e:
        print(f"  [!] produsen: gagal scrape ({e})")
        return [], True
    hasil = []
    for b in baris:
        if not b["harga"]:
            continue
        hasil.append((tgl, b["komoditas"], b["titik_pantau"], b["kabupaten"],
                      b["satuan"], b["harga"], b["harga"], False))
    print(f"  produsen              {len(hasil):>3} baris")
    periksa_anomali(hasil, 5, "produsen")
    return hasil, False


def imputasi_pasar_missing(cur, tgl, rows_scraped):
    """Forward-fill untuk komoditas pasar yang tidak dilaporkan di SISKAPERBAPO.

    Menjaga deret waktu tetap kontinu: harga_asli = NULL,
    harga_imputasi = prev_harga_imputasi, is_imputed = True.
    """
    tercatat = {(r[1], r[2]) for r in rows_scraped}  # (pasar_id, komoditas_id)
    cur.execute("""
        SELECT DISTINCT ON (pasar_id, komoditas_id)
            pasar_id, komoditas_id, harga_imputasi
        FROM fact_harga_pasar
        WHERE tanggal < %s
        ORDER BY pasar_id, komoditas_id, tanggal DESC
    """, (tgl,))
    rows_imputed = []
    for psr_id, kom_id, prev_harga in cur.fetchall():
        if (psr_id, kom_id) not in tercatat and prev_harga is not None:
            rows_imputed.append((tgl, psr_id, kom_id, None, prev_harga, True))
    if rows_imputed:
        print(f"  imputasi pasar        {len(rows_imputed):>3} komoditas forward-fill")
    return rows_imputed


def imputasi_produsen_missing(cur, tgl, rows_scraped):
    """Forward-fill produsen bila hari libur / dinas tidak mencatat data.

    Menjaga deret produsen kontinu: harga_asli = NULL,
    harga_imputasi = prev_harga_imputasi, is_imputed = True.
    """
    tercatat = {(r[1], r[2]) for r in rows_scraped}  # (komoditas, titik_pantau)
    cur.execute("""
        SELECT DISTINCT ON (komoditas, titik_pantau)
            komoditas, titik_pantau, kabupaten, satuan, harga_imputasi
        FROM fact_harga_produsen
        WHERE tanggal < %s
        ORDER BY komoditas, titik_pantau, tanggal DESC
    """, (tgl,))
    rows_imputed = []
    for kom, titik, kab, sat, prev_harga in cur.fetchall():
        if (kom, titik) not in tercatat and prev_harga is not None:
            rows_imputed.append((tgl, kom, titik, kab, sat, None, prev_harga, True))
    if rows_imputed:
        print(f"  imputasi produsen     {len(rows_imputed):>3} titik forward-fill")
    return rows_imputed


def upsert(cur, sql, records):
    if records:
        execute_values(cur, sql, records, page_size=1000)
    return len(records)


def main(argv=None):
    app = argparse.ArgumentParser(description="Update harian HargaWatch ke Supabase")
    app.add_argument("--tanggal", default=None, help="target YYYY-MM-DD (default: kemarin WIB)")
    args = app.parse_args(argv)
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

            valid_ids = ambil_komoditas_valid(cur)

            print("Scrape harga konsumen:")
            rows_pasar, gagal_pasar = scrape_pasar(tgl, valid_ids)
            if not gagal_pasar:
                rows_pasar.extend(imputasi_pasar_missing(cur, tgl, rows_pasar))

            print("Scrape harga produsen:")
            rows_prod, gagal_prod = scrape_produsen(tgl)
            if not gagal_prod:
                rows_prod.extend(imputasi_produsen_missing(cur, tgl, rows_prod))

            n1 = upsert(cur, UPSERT_PASAR, rows_pasar)
            n2 = upsert(cur, UPSERT_PRODUSEN, rows_prod)
            conn.commit()
            print(f"Upsert fact_harga_pasar    : {n1} baris")
            print(f"Upsert fact_harga_produsen : {n2} baris")

            if not rows_pasar and not rows_prod:
                print("Tidak ada data untuk tanggal ini (mis. libur). Selesai tanpa perubahan.")
                return 0

            print("\nVerifikasi tanggal", tgl)
            for tabel in ["fact_harga_pasar", "fact_harga_produsen"]:
                cur.execute(f"SELECT COUNT(*) FROM {tabel} WHERE tanggal = %s", (tgl,))
                print(f"  {tabel:<22} {cur.fetchone()[0]:>5} baris")

        n_gagal = int(gagal_pasar) + int(gagal_prod)
        if n_gagal:
            print(f"\nSELESAI DENGAN GAGAL: {n_gagal} sumber gagal di-scrape (exit 1)")
            return 1
        print("\nSELESAI: OK")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
