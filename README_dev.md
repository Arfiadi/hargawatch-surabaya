# HargaWatch — Branch `development`

> **Status: tahap migrasi database.** Branch ini berisi pekerjaan aktif menuju database Supabase.
> Lihat README utama di branch `main` untuk gambaran proyek.

## Yang sudah selesai di branch ini

- ✅ **Preprocessing final sesuai audit** (`scripts/preprocessing_final.py` + `notebook/preprocessing_final.ipynb`)
  - Dual-price column: `harga_asli` (0→NULL) / `harga_imputasi` (ffill murni, NOT NULL) / `is_imputed`
  - Tanpa lookahead bias (interpolasi dihapus), rupiah bulat
  - 6 pasar termasuk Genteng; leading NaN dipangkas; `harga_kemarin` statis dihapus
- ✅ **Silver layer tervalidasi**: `fact_harga_pasar` 477.097 baris, 0 NaN, 0 desimal, PK/FK konsisten
- ✅ **Script ingestion Supabase** (`scripts/ingest_supabase.py`): DDL + muat data + verifikasi otomatis

## Yang sedang / berikutnya

- [ ] Jalankan `ingest_supabase.py` ke project Supabase (butuh `.env`, lihat `.env.example`)
- [ ] Cron harian: `update_harian.py` (scrape hari ini → upsert Supabase) via Windows Task Scheduler
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
