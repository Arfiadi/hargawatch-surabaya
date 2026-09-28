# HargaWatch - Project Roadmap & PRD Mapping

*Update Terakhir: Selesainya Infrastruktur Data, MLOps, dan Deployment On-Premise.*

Dokumen ini memetakan status pengembangan proyek HargaWatch terhadap **Product Requirements Document (PRD)** spesifikasi dari dosen, serta merencanakan prioritas sprint ke depannya.

---

## 1. Status Fase Proyek (High-Level)

- ✅ **Fase 1: Data Engineering & Storage (100%)**
  Scraping 6 pasar & 37 komoditas dari Siskaperbapo, Open-Meteo, BPS. Pembersihan data (ffill) tanpa *lookahead bias*, tersentralisasi di Supabase PostgreSQL.
- ✅ **Fase 2: AI, ML, & Analitik (100%)**
  Pengembangan Machine Learning (*LightGBM Quantile Regression*) & Naive Baseline. Pelacakan eksperimen via **Weights & Biases (MLOps)**. Aturan komposit EWS (20-20-20-40) terimplementasi. *Walk-Forward Validation* selesai.
- ✅ **Fase 3: Deployment & Otomatisasi Backend (100%)**
  Infrastruktur *Cron Job* lokal via **Windows Task Scheduler** berjalan lancar tanpa terblokir Cloudflare WAF. Pipeline scraping dan forecasting (H+7 hingga H+14) berjalan otomatis setiap jam 06:00 pagi.
- 🟡 **Fase 4: Observability & Alerting (70%)**
  Bot Telegram terintegrasi ke dalam pipeline gagal/sukses. Pembangkit teks (*text template engine*) peringatan krisis pasar masih pending.
- 🔴 **Fase 5: Frontend Web & Visualisasi (10%)**
  Rangka Next.js (Web) sudah dibuat, namun antarmuka fungsional, peta interaktif, dan grafik tren masih harus dikerjakan penuh dengan menarik (*fetch*) data dari Supabase.

---

## 2. Pemetaan Kesiapan Fitur (Sesuai Spesifikasi PRD)

### 🟢 Selesai (Diimplementasikan Penuh di Backend/Database)
Fitur-fitur ini telah terenkapsulasi dengan baik di modul Python dan menghasilkan output tabel yang siap dikonsumsi di Supabase.
- [x] **Wilayah & Komoditas**: 6 Pasar Surabaya, 37 Komoditas.
- [x] **Update Data Otomatis**: Pipeline harian dengan timestamp.
- [x] **Data Pendukung**: Ekstraksi fitur cuaca, kalender/libur/Ramadan, inflasi.
- [x] **Price Change Analytics**: Modul *feature engineering* menghitung persentase perubahan, *rolling mean*, *standard deviation*.
- [x] **Price Volatility**: Modul EWS mengkalkulasi rasio volatilitas per komoditas.
- [x] **Forecasting**: Prediksi 7-14 hari menggunakan algoritma GBDT (LightGBM) & Naive.
- [x] **Variabel Eksternal**: Pengujian korelasi fitur kalender dan lag cuaca dalam model prediksi.
- [x] **Anomaly Detection**: Logika disparitas pasar (Pasar Eceran vs Pasar Grosir Keputran).
- [x] **Early Warning**: Penentuan kuantitatif status **NORMAL – WASPADA – TINGGI**.
- [x] **Seasonal Insight**: Variabel efek siklus Ramadan (is_ramadan, is_pra_ramadan).

### 🟡 Berjalan Sebagian (In Progress)
- [ ] **Price Surge Alert**: Infrastruktur Telegram sudah berfungsi (karya anggota tim), namun mesin perakit teks otomatis (*Alert Generator*) saat status EWS menjadi TINGGI masih kosong (`alert_generator.py`).

### 🔴 Belum Dimulai (Pekerjaan Frontend UI/UX)
Fitur ini membutuhkan pembuatan komponen visual di `web/` menggunakan Next.js / React:
- [ ] **Best Price Finder**: Tabel rekomendasi pasar termurah dari observasi data terbaru.
- [ ] **Smart Shopping Basket**: Modul interaktif (keranjang) untuk menjumlahkan estimasi total biaya resep masakan per pasar.
- [ ] **Price Trend**: Visualisasi grafik rentang waktu (Time-Series Chart) historis vs proyeksi ML.
- [ ] **Spatial/Market Analytics**: Peta interaktif Kota Surabaya (GIS) yang menunjukkan status warna masing-masing dari 6 pasar.
- [ ] **Commodity Risk Map**: Matriks grid/heatmap (Komoditas × Pasar) untuk memandu stakeholder secara cepat.
- [ ] **Public Dashboard**: Dasbor sederhana untuk masyarakat (Cari Komoditas → Bandingkan Pasar → Prediksi).
- [ ] **Government/Analyst View**: Dasbor analitik dalam (evaluasi WAPE/MAE model, riwayat EWS).

---

## 3. Backlog Mendesak (Prioritas Sprint Berikutnya)

Untuk mengunci 100% fungsionalitas di sisi Python/Backend sebelum seluruh tim bergeser fokus ke Web Development:

1. **[Backend P1] Implementasi Price Surge Alert (Generator Peringatan Teks):** 
   - Membangun logika di `src/safety/alert_generator.py` untuk mengolah data `fact_early_warning` dan menyusun kalimat Markdown interaktif.
   - Mengirim peringatan resmi otomatis ke grup Telegram tim yang ada di `.env` (sebagai simulasi Satgas Pangan) menggunakan fungsi `send_telegram_alert()`.
2. **[Backend P2] Implementasi Model Interpretability (SHAP):** 
   - Menghitung nilai SHAP untuk fitur GBDT (Cuaca, Kalender, Harga Masa Lalu) guna menjelaskan *mengapa* sistem memprediksi harga cabai akan naik tajam. Data penjelasan (*explainability*) ini penting untuk *Government View*.
3. **[Frontend P0] Kick-off Integrasi Frontend:**
   - Memastikan Next.js Supabase Client dapat menarik data `fact_harga_pasar`, `fact_forecast`, dan `fact_early_warning`.
   - Melengkapi komponen `Smart Shopping Basket` dan `Commodity Risk Map` di halaman web.
