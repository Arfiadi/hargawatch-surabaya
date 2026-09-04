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
- ✅ **Cron harian via GitHub Actions** (`.github/workflows/update_harian.yml` + `scripts/update_harian.py`)
  - Jadwal 05:30 WIB, target data = kemarin
  - Upsert incremental (ON CONFLICT DO UPDATE) — aman dijalankan berulang

## Setup GitHub Actions (sekali saja)

1. Buka repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**
2. Tambahkan 5 secret (nilai sama persis dengan `.env`):
   `SUPABASE_HOST`, `SUPABASE_PORT`, `SUPABASE_DB`, `SUPABASE_USER`, `SUPABASE_PASSWORD`
3. Workflow harus ada di **default branch (main)** — jadwal hanya jalan di situ
4. Test manual: tab **Actions → update-harian → Run workflow**
5. Cek log di tab Actions setelahnya; data baru terlihat di Table Editor Supabase

Catatan: scheduled workflow otomatis pause bila repo 60 hari tanpa aktivitas — cukup commit kecil untuk mengaktifkan lagi.

## Yang sedang / berikutnya

- [x] Jalankan `ingest_supabase.py` ke project Supabase (butuh `.env`, lihat `.env.example`)
- [x] Cron harian: `update_harian.py` (scrape kemarin → upsert Supabase) via GitHub Actions
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
