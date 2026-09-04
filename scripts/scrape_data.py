"""Scraper harga komoditas SISKAPERBAPO (harga konsumen per pasar).

Data tabel dimuat via AJAX: POST https://siskaperbapo.jatimprov.go.id/harga/tabel.nodesign
dengan body form: tanggal, kabkota, pasar (psr_id). Daftar pasar lewat
https://siskaperbapo.jatimprov.go.id/harga/pasar.json/{kabkota}

Contoh:
  python scrape_data.py                                  # Surabaya, Pasar Tambahrejo, 2020-01-01 s.d. hari ini
  python scrape_data.py --mulai 2021-01-01 --akhir 2022-12-31
  python scrape_data.py --pasar "Pasar Wonokromo" --kabkota surabayakota
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
    "Referer": f"{BASE_URL}/harga/tabel",
}

# Kelompok (kategori) yang termasuk bahan pangan
GRUP_PANGAN = {
    "BERAS", "GULA", "MINYAK GORENG", "DAGING", "TELUR AYAM", "SUSU",
    "GARAM BERYODIUM", "TEPUNG TERIGU", "KACANG KEDELAI", "MIE INSTANT",
    "CABE", "BAWANG", "SAYUR MAYUR", "IKAN SEGAR",
    # Komoditas pangan yang berdiri sendiri (punya NO sendiri, tanpa kategori)
    "JAGUNG PIPILAN KERING", "IKAN ASIN TERI", "KACANG HIJAU",
    "KACANG TANAH", "KETELA POHON",
}

# Komoditas non-pangan yang berdiri sendiri (tidak di bawah kelompok non-pangan)
# Muncul di antara kelompok IKAN SEGAR dan BESI BETON, jadi difilter manual.
NON_PANGAN_TERSENDIRI = {
    "KAYU BALOK MERANTI (4 X 10)",
    "PAPAN MERANTI (4M X 3CM X 20MM)",
    "TRIPLEK (6MM)",
}


def is_pangan(grup, komoditas):
    """True bila komoditas termasuk bahan pangan."""
    if not grup:
        return False
    return (grup.upper() in GRUP_PANGAN
            and komoditas.upper() not in NON_PANGAN_TERSENDIRI)


def ambil_daftar_pasar(kabkota):
    """Return list pasar [{psr_id, psr_nama}] untuk suatu kab/kota."""
    r = requests.get(f"{BASE_URL}/harga/pasar.json/{kabkota}", headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()


def cari_pasar(kabkota, nama_pasar):
    pasar = ambil_daftar_pasar(kabkota)
    cocok = [p for p in pasar if nama_pasar.strip().lower() in p["psr_nama"].strip().lower()]
    if not cocok:
        daftar = ", ".join(p["psr_nama"] for p in pasar)
        raise SystemExit(f"Pasar '{nama_pasar}' tidak ditemukan di {kabkota}.\nPasar tersedia: {daftar}")
    if len(cocok) > 1:
        raise SystemExit(f"Nama pasar '{nama_pasar}' tidak unik: {[p['psr_nama'] for p in cocok]}")
    return cocok[0]["psr_id"], cocok[0]["psr_nama"]


def get_html_table(tanggal, kabkota, pasar_id, retry=3):
    payload = {"tanggal": tanggal, "kabkota": kabkota, "pasar": pasar_id}
    for percobaan in range(1, retry + 1):
        try:
            resp = requests.post(f"{BASE_URL}/harga/tabel.nodesign", data=payload,
                                 headers=HEADERS, timeout=30)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            if percobaan == retry:
                raise
            time.sleep(2 ** percobaan)
    return None


def parse_angka(teks):
    """'16.500' -> 16500 ; '12.500,50' -> 12500.5 ; '0'/-/'' -> 0"""
    if teks is None:
        return 0
    bersih = teks.strip()
    if not bersih or bersih in ("-", "--"):
        return 0
    bersih = bersih.replace("Rp", "").replace(" ", "").replace(".", "")
    bersih = bersih.replace(",", ".")
    try:
        nilai = float(bersih)
        return int(nilai) if nilai.is_integer() else nilai
    except ValueError:
        return 0


def parse_tabel(html):
    """Ambil baris komoditas (yang punya span.price-tooltip-enabled + data-commodity-id).

    Satu baris -> {komoditas_id, komoditas, grup, satuan, harga_kemarin, harga}
    Kolom: NO | NAMA BAHAN POKOK | SATUAN | HARGA KEMARIN | HARGA SEKARANG | ...
    Nilai yang dipakai adalah HARGA SEKARANG (harga pada tanggal yang diminta).

    Baris non-pangan (semen, kayu, besi, paku, gas, pupuk) ikut difilter kecuali
    param `semua=True`.
    """
    soup = BeautifulSoup(html, "lxml")
    hasil = []
    grup = None
    for tr in soup.find_all("tr"):
        span = tr.find("span", class_="price-tooltip-enabled")
        if not span:
            # Baris kategori (mis. BERAS, SEMEN): kolom 1 ada NO + kolom 2 berisi nama.
            # Sub-kategori (mis. "Kental Manis", "Susu Bubuk") punya kolom 1 kosong -> diabaikan.
            sel2 = tr.find_all("td")
            if len(sel2) >= 2 and sel2[0].get_text(strip=True) and sel2[1].get_text(strip=True):
                grup = sel2[1].get_text(strip=True)
            continue
        komoditas_id = span.get("data-commodity-id")
        komoditas = span.get_text(strip=True)
        if not komoditas_id or not komoditas:
            continue
        sel = tr.find_all("td")
        if len(sel) < 5:
            continue
        # Komoditas yang berdiri sendiri (mis. Jagung) punya NO di kolom 1 ->
        # jadikan nama komoditas itu sendiri sebagai grup.
        if sel[0].get_text(strip=True):
            grup = komoditas
        hasil.append({
            "komoditas_id": int(komoditas_id),
            "komoditas": komoditas,
            "grup": grup,
            "satuan": sel[2].get_text(strip=True),
            "harga_kemarin": parse_angka(sel[3].get_text(strip=True)),
            "harga": parse_angka(sel[4].get_text(strip=True)),
        })
    return hasil


def baca_tanggal_selesai(path_csv):
    """Untuk mode resume: set tanggal yang sudah ada di CSV."""
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
            "tanggal", "komoditas_id", "komoditas", "grup", "satuan",
            "harga_kemarin", "harga",
        ])
        penulis.writeheader()
        penulis.writerows(semua_baris)


def main(argv=None):
    app = argparse.ArgumentParser(description="Scrape harga konsumen per pasar dari SISKAPERBAPO")
    app.add_argument("--kabkota", default="surabayakota", help="keycode area, mis. surabayakota")
    app.add_argument("--pasar", default="Pasar Tambahrejo", help="nama pasar (bisa sebagian)")
    app.add_argument("--mulai", default="2020-01-01", help="tanggal awal YYYY-MM-DD")
    app.add_argument("--akhir", default=None, help="tanggal akhir YYYY-MM-DD (default: hari ini)")
    app.add_argument("--skip-weekend", action="store_true", help="lewati Sabtu/Minggu")
    app.add_argument("--delay-min", type=float, default=0.4, help="delay acak min (detik)")
    app.add_argument("--delay-max", type=float, default=0.9, help="delay acak max (detik)")
    app.add_argument("--output", default="data_harga_pasar.csv", help="file CSV keluaran")
    app.add_argument("--no-resume", action="store_true", help="mulai dari nol walau CSV sudah ada")
    app.add_argument("--semua", action="store_true", help="ambil SEMUA komoditas (tidak hanya pangan)")
    app.add_argument("--parallel", type=int, default=6,
                     help="jumlah worker paralel (1 = sekuensial). Default 6, max 10")
    args = app.parse_args(argv)

    if args.parallel < 1:
        raise SystemExit("--parallel minimal 1")
    paralel = min(args.parallel, 10)
    if paralel != args.parallel:
        print(f"Catatan: --parallel dibatasi ke 10 agar tidak kena blokir")

    mulai = datetime.strptime(args.mulai, "%Y-%m-%d").date()
    akhir = datetime.strptime(args.akhir, "%Y-%m-%d").date() if args.akhir else date.today()
    if akhir < mulai:
        raise SystemExit("--akhir harus >= --mulai")

    pasar_id, pasar_nama = cari_pasar(args.kabkota, args.pasar)
    print(f"Area     : {args.kabkota}")
    print(f"Pasar    : {pasar_nama} (psr_id={pasar_id})")
    print(f"Periode  : {mulai} s.d. {akhir}  ({ (akhir - mulai).days + 1} hari)")

    done = set() if args.no_resume else baca_tanggal_selesai(args.output)
    if done:
        print(f"Resume   : {len(done)} tanggal sudah ada di {args.output}, akan dilewati")

    total_hari = (akhir - mulai).days + 1
    semua_baris = []
    kosong = []
    gagal = []
    kunci = threading.Lock()
    mulai_waktu = time.time()

    # Bangun daftar tanggal yang akan dikerjakan
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
    print(f"Akan scrape {total} tanggal dengan {paralel} worker paralel\n")

    if total == 0:
        print("Tidak ada tanggal untuk diproses (semua sudah ada / sudah dilewati).")
        return 0

    def kerjakan(tgl):
        """Ambil & parse data satu tanggal. Return (tgl, baris, error)."""
        try:
            html = get_html_table(tgl, args.kabkota, pasar_id)
            baris = parse_tabel(html) if html else []
            if not args.semua:
                baris = [b for b in baris if is_pangan(b.get("grup"), b.get("komoditas"))]
            return tgl, baris, None
        except requests.RequestException as e:
            return tgl, [], str(e)
        finally:
            time.sleep(random.uniform(args.delay_min, args.delay_max))

    selesai = 0
    dengan_data = 0
    with ThreadPoolExecutor(max_workers=paralel) as executor:
        # Kirim semua pekerjaan sekaligus; kelola sebanyak `paralel` per batch
        # agar progress & penulisan sementara tetap rapi.
        for batch_mulai in range(0, total, paralel * 4):
            batch = tanggal_list[batch_mulai:batch_mulai + paralel * 4]
            futures = {executor.submit(kerjakan, t): t for t in batch}
            for f in as_completed(futures):
                tgl, baris, err = f.result()
                selesai += 1
                with kunci:
                    if err:
                        gagal.append(tgl)
                    elif not baris:
                        kosong.append(tgl)
                    else:
                        dengan_data += 1
                        for b in baris:
                            semua_baris.append({"tanggal": tgl, **b})

                if selesai % 50 == 0 or selesai == total:
                    kecepatan = max(selesai / (time.time() - mulai_waktu), 1e-9)
                    sisa = (total - selesai) / kecepatan
                    print(f"  [{selesai}/{total}] {tgl} -> {len(semua_baris)} harga"
                          f" | {kecepatan:.1f} dtk/hari | ETA {sisa/60:.0f} mnt", flush=True)
                    tulis_csv(args.output, semua_baris)

    tulis_csv(args.output, semua_baris)

    with open(os.path.splitext(args.output)[0] + ".json", "w", encoding="utf-8") as f:
        json.dump(semua_baris, f, ensure_ascii=False, indent=2)

    print("\nSelesai.")
    print(f"Baris CSV : {len(semua_baris)} (file: {args.output})")
    print(f"Tanggal isi (bilangan): {dengan_data}/{total}")
    print(f"Tanggal tanpa data : {len(kosong)}  contoh: {kosong[:10]}")

    if gagal:
        print(f"Tanggal GAGAL ({len(gagal)}): {gagal}")
        print("Jalankan ulang perintah yang sama untuk me-retry (mode resume).")
    else:
        print("Tidak ada tanggal gagal.")


if __name__ == "__main__":
    sys.exit(main())