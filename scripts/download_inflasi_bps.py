"""Reset download_inflasi_bps.py -> strategi final: WebAPI (list + excel legacy) sudah
buntu (host archive mati, Cloudflare di bps.go.id). Update agar jujur & berguna:
  1. WebAPI dipakai hanya untuk CEK ketersediaan bulan terbaru (updt_date) + link excel.
  2. Unduh resmi hanya via browser (Cloudflare). Notebook/script lokal tinggal
     menunggu CSV di data/external/inflasi/.

Jadi peran script diubah: checker bulan baru, bukan downloader.
"""
import argparse
import csv
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
API = "https://webapi.bps.go.id/v1/api"
DOMAIN = "0000"
OUT_DIR = BASE_DIR / "data" / "external" / "inflasi"

BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
         "Juli", "Agustus", "September", "Oktober", "November", "Desember"]


def api_get(path, key, params=None):
    p = {"key": key}
    if params:
        p.update(params)
    r = requests.get(f"{API}/{path}", params=p, timeout=60)
    r.raise_for_status()
    return r.json()


def cari_tabel_inflasi_m2m(key):
    """Return dict tabel 913 (Inflasi Nasional Bulanan M-to-M) dari list WebAPI."""
    for page in (1, 2):
        j = api_get("list/model/statictable", key,
                    {"domain": DOMAIN, "keyword": "inflasi", "page": page})
        if j.get("status") != "OK":
            continue
        for it in j["data"][1]:  # data = [meta, items]
            if it.get("table_id") == 913:
                return it
    return None


def status_bulan_db():
    """Bulan inflasi terakhir yang terisi di fact_inflasi.csv (silver)."""
    path = BASE_DIR / "data" / "processed" / "fact_inflasi.csv"
    if not path.exists():
        return None
    terakhir = None
    with open(path, newline="", encoding="utf-8-sig") as f:
        for b in csv.DictReader(f):
            if (b["inflasi_pct"] or "").strip() not in ("", "None"):
                terakhir = (int(b["tahun"]), int(b["bulan"]))
    return terakhir


def main(argv=None):
    app = argparse.ArgumentParser(description="Cek ketersediaan inflasi baru di WebAPI BPS")
    app.add_argument("--debug", action="store_true", help="dump data tabel 913")
    args = app.parse_args(argv)

    load_dotenv(BASE_DIR / ".env")
    key = os.getenv("BPS_API_KEY")
    if not key:
        print("BPS_API_KEY belum di-set di .env -> tidak bisa cek via WebAPI.")
        print("Fallback manual: unduh CSV dari browser, taruh di data/external/inflasi/,")
        print("lalu jalankan preprocessing_final.py + update_catchup.py.")
        return 0

    tabel = cari_tabel_inflasi_m2m(key)
    if not tabel:
        print("Tabel 913 tidak ditemukan di WebAPI.")
        return 1

    updt = tabel.get("updt_date", "")[:10]
    print(f"Tabel BPS : {tabel['title'].strip()}")
    print(f"Terakhir diupdate BPS : {updt}")
    print(f"Link unduhan resmi    : {tabel.get('excel', '')[:90]}... "
          f"(host legacy sudah mati - unduh via browser: bps.go.id)")

    db = status_bulan_db()
    if db:
        th, bl = db
        batas = datetime(th, bl, 1)
        updt_dt = datetime.strptime(updt, "%Y-%m-%d") if updt else None
        if updt_dt and updt_dt > batas:
            print(f"\n>> BPS sudah menerbitkan data baru (update {updt} > data lokal {th}-{bl:02d})")
            print(">> AKSI: unduh CSV terbaru via browser ke data/external/inflasi/,")
            print("   lalu: python scripts/preprocessing_final.py && python scripts/update_catchup.py")
        else:
            print(f"\n>> Data lokal ({th}-{bl:02d}) sudah terbaru, tidak ada bulan baru.")
    if args.debug:
        import json
        print(json.dumps(tabel, ensure_ascii=False)[:2000])
    return 0


if __name__ == "__main__":
    sys.exit(main())
