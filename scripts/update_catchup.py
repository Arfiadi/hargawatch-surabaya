"""Update catch-up HargaWatch: isi semua tanggal bolong di database.

Dirancang untuk Windows Task Scheduler (jalan saat laptop nyala) maupun manual.
Alur:
  1. Koneksi Supabase
  2. Cari tanggal tanpa satu baris pun di fact_harga_pasar / fact_harga_produsen
     (jejak mundur sampai hari yang lengkap, maks. 400 hari - bukan jendela tetap)
  3. Untuk tiap tanggal: scrape 6 pasar (pangan) + produsen Surabaya -> upsert
  4. Sinkron cuaca (jendela terakhir, ERA5 berlatensi) + inflasi (idempotent)
  5. Ringkasan hasil

Exit code:
  0 = sukses
  1 = ada tanggal yang gagal scrape lengkap (diretry otomatis run berikutnya)

Idempotent: upsert (ON CONFLICT DO UPDATE), aman dijalankan berulang.

Pemakaian:
  python scripts/update_catchup.py                    # isi bolong s.d. kemarin
  python scripts/update_catchup.py --maks 14          # batasi hari per run
  python scripts/update_catchup.py --mulai 2026-09-01 # paksa mulai tanggal tertentu
"""

import argparse
import csv
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from psycopg2.extras import execute_values

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.utils.ingest_supabase import DDL, koneksi
from src.pipeline.preprocessing_final import buat_kalender
from scripts.update_harian import (KABKOTA, UPSERT_CUACA, UPSERT_INFLASI, UPSERT_KALENDER,
                           UPSERT_PASAR, UPSERT_PRODUSEN, ambil_komoditas_valid,
                           scrape_pasar, scrape_produsen, upsert,
                           imputasi_pasar_missing, imputasi_produsen_missing)
from src.pipeline.scrape_data import ambil_daftar_pasar
from src.pipeline.download_cuaca import unduh

# Jejak mundur maksimum saat mencari bolong (laptop mati ~1 tahun masih tertangkap)
JEJAK_MAKS_HARI = 400
# Jendela minimum yang selalu diperiksa walau semua hari tampak lengkap
JENDELA_MIN_HARI = 30


def ambil_tanggal_bolong(cur, mulai_paksa=None, maks=40, jendela=JENDELA_MIN_HARI):
    """Tanggal bolong (salah satu fact kosong), diurutkan TERBARU dulu.

    Deteksi tidak lagi bergantung pada jendela tetap 30 hari: mulai dari kemarin,
    jejak mundur hari demi hari sampai menemukan hari yang kedua fact-nya lengkap
    (maks. JEJAK_MAKS_HARI). Bolong di tengah maupun bolong tua (laptop mati lama)
    tetap terdeteksi. --mulai memaksa titik awal tertentu.
    """
    kemarin = datetime.now(ZoneInfo("Asia/Jakarta")).date() - timedelta(days=1)
    if mulai_paksa:
        mulai = datetime.strptime(mulai_paksa, "%Y-%m-%d").date()
    else:
        mulai = kemarin
        batas = kemarin - timedelta(days=JEJAK_MAKS_HARI)
        while mulai > batas:
            uji = mulai - timedelta(days=1)
            cur.execute("""
                SELECT EXISTS(SELECT 1 FROM fact_harga_pasar WHERE tanggal = %s),
                       EXISTS(SELECT 1 FROM fact_harga_produsen WHERE tanggal = %s)
            """, (uji, uji))
            if all(cur.fetchone()):
                break  # ketemu hari lengkap -> bolong lebih tua dianggap sudah beres
            mulai = uji
        # jaga-jaga: minimal periksa jendela standar walau streak lengkap
        mulai = min(mulai, kemarin - timedelta(days=jendela - 1))
    cur.execute("""
        SELECT k.tanggal FROM dim_kalender k
        WHERE k.tanggal BETWEEN %s AND %s
          AND (NOT EXISTS (SELECT 1 FROM fact_harga_pasar f WHERE f.tanggal = k.tanggal)
            OR NOT EXISTS (SELECT 1 FROM fact_harga_produsen p WHERE p.tanggal = k.tanggal))
        ORDER BY k.tanggal DESC
    """, (mulai, kemarin))
    return [r[0] for r in cur.fetchall()][:maks]


def sinkron_cuaca(cur, conn):
    """Cuaca ERA5 (Open-Meteo) berlatensi beberapa hari -> tarik ulang
    sejak MAX(fact_cuaca) hingga kemarin, upsert (idempotent).

    Baris dengan metrik kunci (curah hujan) NULL TIDAK diinsert: tanggal tetap
    dianggap bolong oleh sinkron ini (MAX(tanggal) belum maju) dan diambil
    ulang di run berikutnya begitu ERA5 menerbitkan data final.
    """
    cur.execute("SELECT MAX(tanggal) FROM fact_cuaca")
    terakhir = cur.fetchone()[0]
    kemarin = datetime.now(ZoneInfo("Asia/Jakarta")).date() - timedelta(days=1)
    mulai = (terakhir + timedelta(days=1)) if terakhir else kemarin - timedelta(days=9)
    if mulai > kemarin:
        print("\nCuaca   : sudah mutakhir.")
        return
    try:
        daily = unduh(mulai.isoformat(), kemarin.isoformat())
    except Exception as e:
        print(f"\nCuaca   : [!] gagal unduh ({e})")
        return

    # FK fact_cuaca -> dim_kalender: pastikan baris kalender ada dulu
    kal = buat_kalender(mulai, kemarin)
    upsert(cur, UPSERT_KALENDER, list(kal.itertuples(index=False, name=None)))

    def val(kunci, i):
        arr = daily.get(kunci, [])
        return arr[i] if i < len(arr) else None

    rows = []
    for i, t in enumerate(daily["time"]):
        hujan = val("rain_sum", i)
        metrik = [val(k, i) for k in ("rain_sum", "precipitation_hours",
                                      "temperature_2m_mean", "temperature_2m_max",
                                      "temperature_2m_min", "relative_humidity_2m_mean",
                                      "wind_speed_10m_max")]
        # Metrik kunci (hujan) belum ada = ERA5 belum final utk hari itu ->
        # JANGAN diinsert sebagian, agar hari itu diambil ulang run berikutnya.
        # (Dulu: skip hanya bila SEMUA metrik None -> hujan bisa terlanjur NULL
        #  permanen karena MAX(tanggal) sudah maju.)
        if metrik[0] is None:
            continue
        rows.append((
            datetime.strptime(t, "%Y-%m-%d").date(),
            hujan, metrik[1], 1 if hujan > 0 else 0,
            metrik[2], metrik[3], metrik[4], metrik[5], metrik[6],
        ))
    if not rows:
        print(f"\nCuaca   : ERA5 belum menerbitkan data {mulai} s.d. {kemarin} (latensi), coba lagi esok.")
        return
    execute_values(cur, UPSERT_CUACA, rows, page_size=1000)
    conn.commit()
    print(f"\nCuaca   : +{len(rows)} baris ({mulai} s.d. {kemarin})")


def sinkron_inflasi(cur, conn):
    """Inflasi BPS terbit bulanan. Regenerasi silver CSV dari raw lokal (murah,
    tanpa download), lalu upsert idempotent. CSV raw baru dari browser akan
    otomatis terangkut di run berikutnya.

    Pengaman regresi: bila hasil regen kehilangan bulan terisi dibanding CSV
    sebelumnya (format BPS berubah?), dicetak peringatan keras di log.
    (Upsert tidak pernah menghapus -> database aman; hanya CSV yang berisiko.)
    """
    raw_dir = Path(__file__).resolve().parent.parent / "data/external/inflasi"
    path = Path(__file__).resolve().parent.parent / "data/processed/fact_inflasi.csv"

    lama_terisi = None
    if path.exists():
        with open(path, newline="", encoding="utf-8-sig") as f:
            lama_terisi = sum(
                1 for b in csv.DictReader(f)
                if (b.get("inflasi_pct") or "").strip() not in ("", "None"))

    if raw_dir.exists() and any(raw_dir.glob("*.csv")):
        try:
            import preprocessing_final as pf
            pf.buat_fact_inflasi()  # tulis ulang fact_inflasi.csv dari raw
        except Exception as e:
            print(f"Inflasi : [!] regen silver gagal ({e}), pakai CSV silver yang ada")
    if not path.exists():
        print("Inflasi : fact_inflasi.csv belum ada (jalankan preprocessing_final.py), lewati.")
        return

    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        for b in csv.DictReader(f):
            nilai = (b["inflasi_pct"] or "").strip()
            rows.append((int(b["tahun"]), int(b["bulan"]),
                         float(nilai) if nilai not in ("", "None") else None))
    terisi = sum(1 for r in rows if r[2] is not None)
    if lama_terisi is not None and terisi < lama_terisi:
        print(f"Inflasi : [!] REGEN REGRESI: bulan terisi {lama_terisi} -> {terisi}. "
              f"Format CSV raw BPS berubah? Periksa data/external/inflasi/")
    execute_values(cur, UPSERT_INFLASI, rows, page_size=100)
    conn.commit()
    print(f"Inflasi : {terisi}/{len(rows)} bulan tersinkron")


def cek_inflasi_bps():
    """Info bulan baru BPS via WebAPI (hanya log, tidak mengubah data)."""
    try:
        import download_inflasi_bps as dib
        dib.main([])
    except SystemExit:
        pass
    except Exception as e:
        print(f"Inflasi : [!] cek WebAPI BPS gagal ({e})")


def main(argv=None):
    app = argparse.ArgumentParser(description="Catch-up data bolong HargaWatch")
    app.add_argument("--mulai", default=None, help="paksa mulai tanggal YYYY-MM-DD")
    app.add_argument("--maks", type=int, default=40, help="maks hari bolong per run")
    args = app.parse_args(argv)

    conn = koneksi()
    try:
        with conn.cursor() as cur:
            cur.execute(DDL)
            conn.commit()

            # PENTING: dim_kalender hanya bertambah saat preprocessing_final
            # dijalankan. Tanpa ini, tanggal terbaru tidak ada di dim_kalender
            # -> deteksi bolong melewatkannya -> data tidak pernah terisi.
            kemarin_kal = datetime.now(ZoneInfo("Asia/Jakarta")).date() - timedelta(days=1)
            cur.execute("SELECT MAX(tanggal) FROM dim_kalender")
            kal_max = cur.fetchone()[0]
            if kal_max is None or kal_max < kemarin_kal:
                mulai_kal = (kal_max + timedelta(days=1)) if kal_max else kemarin_kal - timedelta(days=30)
                kal = buat_kalender(mulai_kal, kemarin_kal)
                upsert(cur, UPSERT_KALENDER, list(kal.itertuples(index=False, name=None)))
                conn.commit()
                print(f"dim_kalender diperpanjang: {mulai_kal} s.d. {kemarin_kal}")

            allowed_ids = ambil_komoditas_valid(cur)

            tanggal = ambil_tanggal_bolong(cur, args.mulai, args.maks)
            if not tanggal:
                print("Tidak ada tanggal bolong. Database sudah mutakhir.")
                sinkron_cuaca(cur, conn)
                sinkron_inflasi(cur, conn)
                cek_inflasi_bps()
                return 0
            print(f"Tanggal bolong: {len(tanggal)} hari "
                  f"({tanggal[-1]} s.d. {tanggal[0]}) - dikerjakan terbaru dulu")

            # dim_kalender utk seluruh rentang bolong sekaligus (buat_kalender
            # mahal: membangun kalender libur per tahun - jangan per hari)
            kal = buat_kalender(tanggal[-1], tanggal[0])
            upsert(cur, UPSERT_KALENDER, list(kal.itertuples(index=False, name=None)))
            conn.commit()

            pasar_list = ambil_daftar_pasar(KABKOTA)
            total_p, total_d = 0, 0
            tanggal_gagal = []

            for i, tgl in enumerate(tanggal):
                print(f"  {tgl} ...")
                cur.execute("SELECT EXISTS(SELECT 1 FROM fact_harga_pasar WHERE tanggal = %s)", (tgl,))
                ada_p = cur.fetchone()[0]
                cur.execute("SELECT EXISTS(SELECT 1 FROM fact_harga_produsen WHERE tanggal = %s)", (tgl,))
                ada_d = cur.fetchone()[0]

                rows_p = []
                gagal_p = False
                if not ada_p:
                    rows_p, gagal_p = scrape_pasar(tgl, allowed_ids, pasar_list)
                    if not gagal_p:
                        rows_p.extend(imputasi_pasar_missing(cur, tgl, rows_p))
                    if rows_p:
                        execute_values(cur, UPSERT_PASAR, rows_p, page_size=1000)
                else:
                    print("    fact_harga_pasar sudah lengkap, lewati.")

                rows_d = []
                gagal_d = False
                if not ada_d:
                    rows_d, gagal_d = scrape_produsen(tgl)
                    if not gagal_d:
                        rows_d.extend(imputasi_produsen_missing(cur, tgl, rows_d))
                    if rows_d:
                        execute_values(cur, UPSERT_PRODUSEN, rows_d, page_size=1000)
                else:
                    print("    fact_harga_produsen sudah lengkap, lewati.")

                conn.commit()
                total_p += len(rows_p)
                total_d += len(rows_d)
                print(f"    +{len(rows_p)} pasar, +{len(rows_d)} produsen")
                if gagal_p or gagal_d:
                    tanggal_gagal.append(tgl)  # tetap bolong -> diretry run berikutnya
                if i < len(tanggal) - 1 and (not ada_p or not ada_d):
                    time.sleep(0.5)  # sopan ke SISKAPERBAPO saat catch-up panjang

            print(f"\nSelesai. Total upsert: {total_p} pasar, {total_d} produsen "
                  f"dalam {len(tanggal)} hari.")
            if tanggal_gagal:
                print(f"Tanggal dengan sumber gagal scrape ({len(tanggal_gagal)}), "
                      f"akan diretry run berikutnya: {tanggal_gagal}")

            sinkron_cuaca(cur, conn)
            sinkron_inflasi(cur, conn)
            cek_inflasi_bps()

        if tanggal_gagal:
            print("\nSELESAI DENGAN GAGAL: ada tanggal yang belum lengkap (exit 1)")
            return 1
        print("\nSELESAI: OK")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
