# HargaWatch — Branch `development`

> **Status: tahap migrasi database.** Branch ini berisi pekerjaan aktif menuju database Supabase.
> Lihat README utama di branch `main` untuk gambaran proyek.

## Yang sudah selesai di branch ini

- ✅ **Preprocessing final sesuai audit** (`scripts/preprocessing_final.py` + `notebook/preprocessing_final.ipynb`)
  - Dual-price column: `harga_asli` (0→NULL) / `harga_imputasi` (ffill murni, NOT NULL) / `is_imputed`
  - Tanpa lookahead bias (interpolasi dihapus), rupiah bulat
  - 6 pasar termasuk Genteng; leading NaN dipangkas; `harga_kemarin` statis dihapus
- ✅ **Silver layer tervalidasi**: `fact_harga_pasar` 477.097 baris, 0 NaN, 0 desimal, PK/FK konsisten
- ✅ **Migrasi Supabase selesai** (`scripts/ingest_supabase.py`): 5 tabel terisi, verifikasi 0 NULL / 0 orphan
- ✅ **Cron harian lokal** — Task Scheduler Windows (`update_catchup.py`, jadwal 07:00, self-healing jendela 30 hari)
- ⚠️ **GitHub Actions dihentikan** — Cloudflare memblokir IP datacenter runner (403 saat scrape); workflow dihapus dari repo. Alternatif masa depan: Oracle Cloud Always Free VM + Playwright stealth.

## Setup GitHub Actions (ARSIP — dihentikan karena 403 Cloudflare)

~~Cron GitHub Actions~~ **TIDAK DIPAKAI.** Runner GitHub memakai IP datacenter yang
diblokir Cloudflare milik siskaperbapo. Cron kini berjalan lokal via Task Scheduler:

```powershell
schtasks /Create /TN "HargaWatch Update Harian" /TR "C:\CODING~1\Project\HARGAW~1\scripts\update_catchup_task.cmd" /SC DAILY /ST 07:00 /F
```

Manual run: `python scripts/update_catchup.py`. Log: `logs/catchup.log`.
Alternatif cloud yang layak dicoba nanti: Oracle Cloud Always Free VM (IP dedicated)
dengan Playwright stealth sebagai pengganti `requests`.

## Yang sedang / berikutnya

- [x] Jalankan `ingest_supabase.py` ke project Supabase (butuh `.env`, lihat `.env.example`)
- [x] Cron harian lokal (Task Scheduler + catch-up self-healing)
- [ ] Tabel `fact_cuaca` & `fact_inflasi` (data sudah ada di `data/external/`)
- [ ] Forecasting 7–14 hari + aturan early warning (Normal–Waspada–Tinggi)
- [ ] Dashboard publik (Public View + Government/Analyst View)

## Setup lokal

```bash
pip install -r requirements.txt
cp .env.example .env                   # isi kredensial Supabase Anda (JANGAN commit .env)
python scripts/ingest_supabase.py      # buat tabel + muat silver layer
python scripts/ingest_supabase.py --verify   # cek ulang
```

## Konvensi commit

`feat:` fitur baru · `fix:` perbaikan · `chore:` pemeliharaan · `docs:` dokumentasi · `refactor:` restrukturisasi

Data besar (`data/raw/`, `data/processed/`, cuaca) **tidak** di-commit — dibuat ulang lewat script.
File referensi kecil yang dipertahankan: inflasi BPS (unduhan manual) & koordinat pasar.
