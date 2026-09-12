# HargaWatch - Project Roadmap & State

*Update Terakhir: Fase Transisi Eksperimen ke Production.*

## 1. Status Fase Proyek
- ✅ **Fase 0 & 1 (Fondasi & Validasi):** Scraping data historis 6,5 tahun dan setup pipeline dasar (Silver Layer di Supabase) selesai.
- ✅ **Fase 2 (Analitik):** Analisis volatilitas, disparitas harga antar pasar, dan *data cleaning* bebas *lookahead bias* selesai.
- 🔄 **Fase 3 (ML & Early Warning - ONGOING):** Eksperimen *Forecasting* berhasil (Global Multi-Market LightGBM Quantile Regression) dengan metrik WAPE 13.98%. *Early Warning System* deterministik juga selesai dirumuskan.

## 2. Status Saat Ini (The Current State)
- Keseluruhan **logika Machine Learning saat ini masih terisolasi di dalam Jupyter Notebook** (
otebook/forecasting_experiments.ipynb). 
- File-file .py terkait ML di folder scripts/ (seperti un_forecasting.py, setup_ml_tables.py) saat ini masih berstatus **draf/eksperimental/kerangka kosong**.
- Setup frontend awal (Next.js 14 App Router) telah terinisialisasi di folder web/.

## 3. Backlog Mendesak (Prioritas Selanjutnya)
1. **[Machine Learning]** Melakukan *porting* (pemindahan) logika *forecasting* dan *Early Warning* dari 
otebook/ ke dalam *production batch script* di folder scripts/.
2. **[Database]** Eksekusi DDL di Supabase untuk membuat tabel *Gold Layer* (act_forecast, act_early_warning) yang akan menampung hasil prediksi ML.
3. **[Data Engineering]** Migrasi sistem *cron job* harian lokal (Windows Task Scheduler) ke *cloud environment* (VPS/Serverless) dan penambahan sistem *alerting* (misal: webhook Telegram).

## 4. Backlog Mendatang
1. **[Frontend]** Ekstraksi *mockup* UI dari docs/stitch/html/ ke dalam komponen React/Next.js dengan Tailwind CSS.
2. **[Frontend]** Integrasi Next.js (*App Router*) dengan Supabase via @supabase/ssr untuk menampilkan *Dashboard Publik* dan *Government View* berdasarkan data di *Silver* dan *Gold Layer*.
