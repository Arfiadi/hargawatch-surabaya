"""Scraper harga PRODUSEN SISKAPERBAPO (tingkat petani/supplier se-Jawa Timur).

Data dimuat via AJAX: POST https://siskaperbapo.jatimprov.go.id/produsen/tabel.nodesign
dengan body form: tanggal (kabkota/pasar diabaikan server - respons memuat SEMUA
titik pantau se-Jatim, difilter di sisi parser).

Struktur respons (per baris):
  NO | NAMA BAHAN POKOK | TITIK PANTAU | KABUPATEN | SATUAN | HARGA KEMARIN |
  HARGA SEKARANG | PERUBAHAN (Rp) | PERUBAHAN (%)

Contoh:
  python scrape_produsen.py                                    # hanya Kota Surabaya, 2020 s.d. hari ini
  python scrape_produsen.py --semua-kota                       # seluruh Jawa Timur
  python scrape_produsen.py --mulai 2024-01-01 --output prod_2024.csv
"""

import argparse
import csv
import json
import os
import random
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://siskaperbapo.jatimprov.go.id"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": f"{BASE_URL}/produsen/tabel",
}


def get_html_table(tanggal, retry=3):
    payload = {"tanggal": tanggal, "kabkota": "surabayakota", "pasar": 1}
    for percobaan in range(1, retry + 1):
        try:
            resp = requests.post(f"{BASE_URL}/produsen/tabel.nodesign", data=payload,
                                 headers=HEADERS, timeout=30)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException:
            if percobaan == retry:
                raise
            time.sleep(2 ** percobaan)
    return None


def parse_angka(teks):
    """'16.500' -> 16500 ; '-' / '' -> 0"""
    if teks is None:
        return 0
    bersih = teks.strip()
    if not bersih or bersih in ("-", "--"):
        return 0
    bersih = bersih.replace("Rp", "").replace(" ", "").replace(".", "").replace(",", ".")
    try:
        nilai = float(bersih)
        return int(nilai) if nilai.is_integer() else nilai
    except ValueError:
        return 0


def parse_tabel(html, kota_filter=None):
    """Ambil baris produsen. Return list dict; difilter kolom KABUPATEN bila kota_filter di-set."""
    soup = BeautifulSoup(html, "lxml")
    hasil = []
    for tr in soup.find_all("tr"):
        sel = tr.find_all("td")
        if len(sel) < 7:
            continue
        komoditas = sel[1].get_text(strip=True)
        titik = sel[2].get_text(strip=True)
        kabupaten = sel[3].get_text(strip=True)
        if not komoditas or not titik:
            continue
        if kota_filter and kabupaten.lower() != kota_filter.lower():
            continue
        hasil.append({
            "komoditas": komoditas,
            "titik_pantau": titik,
            "kabupaten": kabupaten,
            "satuan": sel[4].get_text(strip=True),
            "harga_kemarin": parse_angka(sel[5].get_text(strip=True)),
            "harga": parse_angka(sel[6].get_text(strip=True)),
        })
    return hasil


def baca_tanggal_selesai(path_csv):
    if not os.path.exists(path_csv) or os.path.getsize(path_csv) == 0:
        return set()
    selesai = set()
    with open(path_csv, newline="", encoding="utf-8-sig") as f:
        for baris in csv.DictReader(f):
            selesai.add(baris["tanggal"])
    return selesai


def tulis_csv(path_csv, semua_baris):
    with open(path_csv, "w", newline="", encoding="utf-8-sig") as f:
        penulis = csv.DictWriter(f, fieldnames=[
            "tanggal", "komoditas", "titik_pantau", "kabupaten", "satuan",
            "harga_kemarin", "harga",
        ])
        penulis.writeheader()
        penulis.writerows(semua_baris)


def main(argv=None):
    app = argparse.ArgumentParser(description="Scrape harga produsen SISKAPERBAPO")
    app.add_argument("--mulai", default="2020-01-01", help="tanggal awal YYYY-MM-DD")
    app.add_argument("--akhir", default=None, help="tanggal akhir YYYY-MM-DD (default: hari ini)")
    app.add_argument("--kota", default="Kota Surabaya",
                     help="filter kolom KABUPATEN (string persis, mis. 'Kota Surabaya')")
    app.add_argument("--semua-kota", action="store_true", help="tanpa filter, ambil se-Jatim")
    app.add_argument("--skip-weekend", action="store_true", help="lewati Sabtu/Minggu")
    app.add_argument("--delay-min", type=float, default=0.4)
    app.add_argument("--delay-max", type=float, default=0.9)
    app.add_argument("--output", default="data_produsen.csv")
    app.add_argument("--parallel", type=int, default=6, help="worker paralel (max 10)")
    args = app.parse_args(argv)

    paralel = min(max(args.parallel, 1), 10)
    mulai = datetime.strptime(args.mulai, "%Y-%m-%d").date()
    akhir = datetime.strptime(args.akhir, "%Y-%m-%d").date() if args.akhir else date.today()
    if akhir < mulai:
        raise SystemExit("--akhir harus >= --mulai")

    kota_filter = None if args.semua_kota else args.kota
    print(f"Filter   : {'SEMUA kab/kota se-Jatim' if kota_filter is None else kota_filter}")
    print(f"Periode  : {mulai} s.d. {akhir}")
    print(f"Output   : {args.output}")

    done = baca_tanggal_selesai(args.output)
    if done:
        print(f"Resume   : {len(done)} tanggal sudah ada, akan dilewati")

    tanggal_list = []
    d = mulai
    while d <= akhir:
        tgl = d.isoformat()
        d += timedelta(days=1)
        if args.skip_weekend and datetime.strptime(tgl, "%Y-%m-%d").weekday() >= 5:
            continue
        if tgl in done:
            continue
        tanggal_list.append(tgl)

    total = len(tanggal_list)
    print(f"Akan scrape {total} tanggal dengan {paralel} worker\n")
    if total == 0:
        print("Tidak ada tanggal untuk diproses.")
        return 0

    semua_baris = []
    gagal = []
    kunci = threading.Lock()
    mulai_waktu = time.time()

    def kerjakan(tgl):
        try:
            html = get_html_table(tgl)
            baris = parse_tabel(html, kota_filter) if html else []
            return tgl, baris, None
        except requests.RequestException as e:
            return tgl, [], str(e)
        finally:
            time.sleep(random.uniform(args.delay_min, args.delay_max))

    selesai = 0
    with ThreadPoolExecutor(max_workers=paralel) as executor:
        for batch_mulai in range(0, total, paralel * 4):
            batch = tanggal_list[batch_mulai:batch_mulai + paralel * 4]
            futures = {executor.submit(kerjakan, t): t for t in batch}
            for f in as_completed(futures):
                tgl, baris, err = f.result()
                selesai += 1
                with kunci:
                    if err:
                        gagal.append(tgl)
                        print(f"  [!] {tgl} gagal: {err}")
                    else:
                        for b in baris:
                            semua_baris.append({"tanggal": tgl, **b})

                if selesai % 50 == 0 or selesai == total:
                    kecepatan = max(selesai / (time.time() - mulai_waktu), 1e-9)
                    sisa = (total - selesai) / kecepatan
                    print(f"  [{selesai}/{total}] {tgl} -> {len(semua_baris)} baris"
                          f" | ETA {sisa/60:.0f} mnt", flush=True)
                    tulis_csv(args.output, semua_baris)

    tulis_csv(args.output, semua_baris)
    with open(os.path.splitext(args.output)[0] + ".json", "w", encoding="utf-8") as f:
        json.dump(semua_baris, f, ensure_ascii=False, indent=2)

    print(f"\nSelesai. {len(semua_baris)} baris di {args.output}")
    if gagal:
        print(f"Tanggal GAGAL ({len(gagal)}): {gagal}")
        print("Jalankan ulang perintah yang sama untuk resume/retry.")
    else:
        print("Tidak ada tanggal gagal.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
