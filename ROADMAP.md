# HargaWatch - Project Roadmap & PRD Mapping

*Update Terakhir: Selesainya Retraining Terpadu 37 Komoditas, Two-Tier Forecasting Framework, EWS Alert Generator, dan MLOps Registry.*

Dokumen ini memetakan status pengembangan proyek HargaWatch terhadap **Product Requirements Document (PRD)** spesifikasi resmi, serta merencanakan prioritas sprint ke depannya.

---

## 1. Status Fase Proyek (High-Level)

- ✅ **Fase 1: Data Engineering & Storage (100%)**
  Scraping 6 pasar & 37 komoditas dari SISKAPERBAPO, Open-Meteo, BPS. Pembersihan data (ffill limit=7) tanpa *lookahead bias*, kalenderisasi kontinu (`asfreq('D')`), tersentralisasi di Supabase PostgreSQL.
- ✅ **Fase 2: AI, ML, & Analitik (100%)**
  Pengembangan **Two-Tier Forecasting Framework**:
  - *Tier 1:* 30 komoditas teratur/stabil dimodelkan dengan *Naive Last Value* & *SMA-7d*.
  - *Tier 2:* 7 komoditas volatil (Cabai Rawit, Cabai Besar, Cabai Keriting, Bawang Merah, Tomat, Buncis, Telur Ayam) dimodelkan dengan kuantil terkalibrasi (**CatBoost** & **XGBoost** p10, p50, p90) dan *Monotone Rearrangement*.
  Pelacakan eksperimen via **Weights & Biases (MLOps)**. Aturan komposit EWS 4-pilar (100 poin) terimplementasi. *Walk-Forward Validation* selesai untuk seluruh 37 komoditas.
- ✅ **Fase 3: Deployment & Otomatisasi Backend (100%)**
  Infrastruktur *Cron Job* lokal via **Windows Task Scheduler** berjalan lancar tanpa terblokir Cloudflare WAF. Pipeline scraping, forecasting (H+1 hingga H+14), dan EWS berjalan otomatis setiap pagi melalui `run_pipeline.bat`.
- ✅ **Fase 4: Observability & Alerting (100%)**
  Bot Telegram terintegrasi penuh. Modul *Alert Generator* (`src/safety/alert_generator.py`) dan runner evaluasi risiko harian (`scripts/generate_daily_alerts.py`) siap mendistribusikan notifikasi saat status EWS mencapai WASPADA atau SIAGA TINGGI.
- 🟡 **Fase 5: Frontend Web & Visualisasi (75%)**
  Aplikasi Next.js 15 (`web/`) telah memiliki 4 rute utama: Beranda (`/`), Peta Spasial (`/peta`), Proyeksi Harga (`/forecasting`), dan Pusat Peringatan Dini (`/early-warning`). Build statis produksi berhasil 100%. Prioritas saat ini adalah penyelarasan metrik dinamis dari Supabase dan penyempurnaan checklist audit UI.

---

## 2. Pemetaan Kesiapan Fitur (Sesuai Spesifikasi PRD)

### 🟢 Selesai (Diimplementasikan Penuh di Backend/Database)
Fitur-fitur ini telah terenkapsulasi dengan baik di modul Python dan menghasilkan output tabel yang siap dikonsumsi di Supabase:
- [x] **Wilayah & Komoditas**: 6 Pasar Surabaya, 37 Komoditas aktif.
- [x] **Update Data Otomatis**: Pipeline harian dengan timestamp dan *catch-up recovery*.
- [x] **Data Pendukung**: Ekstraksi fitur cuaca (Open-Meteo), kalender libur & Ramadan, inflasi BPS.
- [x] **Price Change Analytics**: Modul *feature engineering* menghitung persentase perubahan, *rolling mean*, *standard deviation*.
- [x] **Price Volatility**: Modul EWS mengkalkulasi rasio volatilitas 7d/30d per komoditas.
- [x] **Two-Tier Forecasting**: Prediksi H+1 s.d H+14 menggunakan arsitektur Two-Tier (CatBoost, XGBoost, Naive, SMA) untuk seluruh 37 komoditas.
- [x] **Variabel Eksternal**: Pengujian korelasi fitur kalender, transmisi harga Keputran, dan lag cuaca dalam model prediksi.
- [x] **Anomaly Detection**: Logika disparitas pasar (Pasar Eceran vs Pasar Grosir Keputran).
- [x] **Adaptive Early Warning (EWS)**: Penentuan kuantitatif status komposit **NORMAL – WASPADA – SIAGA TINGGI**.
- [x] **Price Surge Alert**: Generator teks peringatan otomatis (`src/safety/alert_generator.py`) dan runner alert harian (`scripts/generate_daily_alerts.py`) terintegrasi ke Bot Telegram.
- [x] **Seasonal Insight**: Variabel efek siklus Ramadan (`is_ramadan`, `is_pra_ramadan`).

### 🟡 Berjalan Sebagian (Integrasi Frontend Web)
Komponen visual di `web/` menggunakan Next.js / React:
- [x] **Peta Interaktif 6 Pasar (`/peta`)**: Visualisasi Leaflet GIS sebaran 6 pasar Kota Surabaya.
- [x] **Forecasting View (`/forecasting`)**: Visualisasi pita kuantil p10-p50-p90 dan seleksi komoditas/pasar.
- [x] **Early Warning Center (`/early-warning`)**: Matriks risiko spasial komposit.
- [ ] **Dynamic Data Wiring**: Menghubungkan seluruh kartu evaluasi WAPE/MAE di `/forecasting` langsung dari metadata Supabase untuk menggantikan konstanta historis lama (merujuk `docs/audit_forecasting_page.md`).
- [ ] **Smart Shopping Basket**: Penyempurnaan modul kalkulasi net savings belanja mingguan di halaman beranda.

---

## 3. Backlog Prioritas Sprint Berikutnya

1. **[Frontend P0] Penuntasan Temuan Audit `/forecasting` (`docs/audit_forecasting_page.md`):**
   - Menghubungkan kartu evaluasi akurasi dan model badge langsung ke metadata per komoditas (`docs/klasifikasi_hasil_forecasting.md`).
   - Menyempurnakan responsive SVG chart di perangkat seluler.
2. **[Frontend P1] Sinkronisasi Filter Dinamis Smart Shopping Basket:**
   - Menghitung penghematan belanja riil antar-pasar berdasarkan harga observasi harian terbaru di Supabase.
3. **[MLOps P2] Model Interpretability Ekstra (SHAP / Feature Attribution):**
   - Menyajikan atribut kontribusi fitur utama pada lonjakan harga cabai dan bawang untuk kebutuhan analisis mendalam.
