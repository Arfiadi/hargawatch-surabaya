# HargaWatch — Branch `development`

> **Status: tahap produksi pipeline harian.** Branch ini berisi pekerjaan aktif yang telah berhasil disinkronisasi dengan Supabase dan Weights & Biases.

## Yang Sudah Selesai di Branch Ini

- **Preprocessing final sesuai audit** (`src/pipeline/preprocessing_final.py`)
  - Dual-price column: `harga_asli` vs `harga_imputasi` (ffill murni, NOT NULL). Tanpa interpolasi (zero lookahead bias).
- **Silver layer tervalidasi**: `fact_harga_pasar` 477k+ baris bersih dari NaN dan orphan keys.
- **Migrasi Supabase selesai**: Sinkronisasi ETL dua arah dengan cloud.
- **MLOps Integrasi Selesai**: Model eksperimen dan Champion Model di-registry ke Weights & Biases (W&B).
- **Forecasting & Early Warning Selesai**: Algoritma GBDT dan Naive terimplementasi penuh dengan *walk-forward backtesting*. Skor komposit 20-20-20-40 EWS sinkron 100%.
- **Cron Harian Lokal (Native Windows Deployment)**: Script `run_pipeline.bat` dan orkestrator `run_daily_pipeline.py` sukses menembus blokir Cloudflare dengan berjalan mulus dari laptop lokal.

## Setup GitHub Actions (ARSIP — dihentikan karena 403 Cloudflare)

~~Cron GitHub Actions~~ **TIDAK DIPAKAI.** Runner GitHub memakai IP datacenter yang diblokir Cloudflare milik Siskaperbapo.
Cron harian kini dipindahkan ke **Windows Task Scheduler (On-Premise)** melalui file `run_pipeline.bat`. Lihat panduan lengkapnya di `docs/deployment_windows.md`.

## Yang Sedang / Berikutnya Dikerjakan

- [x] Sinkronisasi `fact_forecast` & `fact_early_warning` ke Supabase.
- [x] Eksekusi Batch Forecasting Harian otomatis.
- [ ] Modul Generator Notifikasi Teks (Telegram Alerting) saat status WASPADA/TINGGI (P1-2).
- [ ] Implementasi Interpretability SHAP pada Dashboard.
- [ ] Pembangunan Frontend UI (Next.js) dengan akses data dari Supabase.

## Setup Lokal & Testing

```bash
# Setup Environment
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
copy .env.example .env                   # isi kredensial Supabase & WANDB Anda (JANGAN commit .env)

# Run Master Pipeline Secara Manual
run_pipeline.bat

# Run Tests
.\.venv\Scripts\pytest tests/
```

## Konvensi Commit
Silakan gunakan [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) untuk setiap *pull request*.
