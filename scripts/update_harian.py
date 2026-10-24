"""Update harian HargaWatch: scrape harga satu tanggal -> upsert Supabase.

Dirancang untuk dijadwalkan (Task Scheduler) maupun manual.
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
from datetime import datetime
from pathlib import Path
import sys

# Ensure UTF-8 output on Windows terminals to prevent UnicodeEncodeError
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.pipeline.ingestion import (
    KABKOTA,
    KOTA_PRODUSEN,
    JEDA_ANTAR_PASAR,
    HARGA_MAKS_WAJAR,
    UPSERT_PASAR,
    UPSERT_PRODUSEN,
    UPSERT_KALENDER,
    UPSERT_CUACA,
    UPSERT_INFLASI,
    target_tanggal,
    ambil_komoditas_valid,
    periksa_anomali,
    scrape_pasar,
    scrape_produsen,
    imputasi_pasar_missing,
    imputasi_produsen_missing,
    upsert,
)
from src.pipeline.preprocessing_final import buat_kalender
from src.utils.ingest_supabase import DDL, koneksi
from src.utils.utils_alerting import send_telegram_alert


def main(argv=None):
    app = argparse.ArgumentParser(description="Update harian HargaWatch ke Supabase")
    app.add_argument("--tanggal", default=None, help="target YYYY-MM-DD (default: kemarin WIB)")
    args = app.parse_args(argv)
    tgl = target_tanggal(args.tanggal)
    print(f"HargaWatch update harian | target: {tgl}")

    try:
        conn = koneksi()
    except Exception as e:
        err_msg = f"🚨 *[HargaWatch Alert]* Gagal koneksi ke Supabase ({tgl}):\n`{e}`"
        print(f"[ERROR] Gagal koneksi ke Supabase ({tgl}): {e}")
        send_telegram_alert(err_msg)
        return 1

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
            print(f"[SUCCESS] Upsert fact_harga_pasar    : {n1} baris ke Supabase")
            print(f"[SUCCESS] Upsert fact_harga_produsen : {n2} baris ke Supabase")

            if not rows_pasar and not rows_prod:
                warn_msg = f"⚠️ *[HargaWatch Info]* Tidak ada data scraped untuk {tgl} (mis. libur). Selesai tanpa perubahan."
                print(f"[WARN] Tidak ada data scraped untuk {tgl} (mis. libur). Selesai tanpa perubahan.")
                send_telegram_alert(warn_msg)
                return 0

            print("\nVerifikasi penyimpanan database tanggal", tgl)
            total_saved = 0
            for tabel in ["fact_harga_pasar", "fact_harga_produsen"]:
                cur.execute(f"SELECT COUNT(*) FROM {tabel} WHERE tanggal = %s", (tgl,))
                cnt = cur.fetchone()[0]
                total_saved += cnt
                print(f"  {tabel:<22} {cnt:>5} baris tersimpan")

            if total_saved == 0:
                warn_msg = f"⚠️ *[HargaWatch Alert]* Scraping berjalan tapi 0 baris tersimpan di Supabase untuk {tgl}."
                send_telegram_alert(warn_msg)

        n_gagal = int(gagal_pasar) + int(gagal_prod)
        if n_gagal:
            msg_gagal = f"🚨 *[HargaWatch Alert]* {n_gagal} sumber gagal di-scrape pada {tgl}."
            print(f"\n[FAILED] {n_gagal} sumber gagal di-scrape pada {tgl}. (exit 1)")
            send_telegram_alert(msg_gagal)
            return 1

        sukses_msg = (
            f"✅ *[HargaWatch Update - BERHASIL]*\n\n"
            f"📅 *Tanggal Target:* {tgl}\n"
            f"📊 *Hasil Upsert Supabase:*\n"
            f"  • fact_harga_pasar: {n1} baris\n"
            f"  • fact_harga_produsen: {n2} baris\n"
            f"  • Total tersimpan: {total_saved} baris\n\n"
            f"✨ Scraping harian sukses dan database telah mutakhir."
        )
        send_telegram_alert(sukses_msg)
        print("\nSELESAI: OK")
        return 0
    except Exception as e:
        err_msg = f"🚨 *[HargaWatch Error]* Pipeline update harian gagal pada {tgl}:\n`{str(e)[:400]}`"
        print(f"[ERROR] Pipeline update harian gagal pada {tgl}: {e}")
        send_telegram_alert(err_msg)
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
