# HargaWatch — Project Charter & Progress Report
**Platform Intelijen Harga Pangan dan Early Warning Kota Surabaya**

---

## 1. Visi & Overview Produk

### Visi
HargaWatch bukan sekadar dashboard harga pasar. Sistem ini dibangun untuk menjawab tiga pertanyaan inti bagi masyarakat, pedagang, dan pemerintah Surabaya:

1. **Harga hari ini** — di pasar mana harga suatu komoditas paling murah?
2. **Tren ke depan** — apakah harga suatu komoditas cenderung naik atau turun?
3. **Peringatan dini** — kalau ada lonjakan harga tidak wajar, kita tahu lebih awal, bukan setelah harga sudah tinggi.

Kami tidak membangun semua fitur sekaligus. Kami mulai dari fondasi data yang bisa dipercaya dari beberapa pasar strategis, baru naik bertahap ke analitik dan prediksi.

### Gambaran Produk
Produk berbentuk web dashboard dengan dua sisi tampilan:
- **Publik**: untuk masyarakat/konsumen — cek harga, bandingkan pasar, lihat tren
- **Pemerintah/Analis**: tampilan lebih dalam untuk Dinas terkait, pengelola pasar, dan peneliti

### Target User
Masyarakat/konsumen, Pemkot Surabaya, dinas terkait, pengelola pasar, pedagang/UMKM, peneliti. **Catatan penting**: proyek ini adalah tugas mata kuliah dengan syarat produk harus dapat diakses oleh user nyata — bukan hanya demo lokal.

---

## 2. Roadmap 4 Fase (Status Update)

| Fase | Fokus | Status Saat Ini |
|---|---|---|
| **0. Validasi Data** | Cek apakah data dari SISKAPERBAPO bisa ditarik secara sistematis. | ✅ **SELESAI SEMENTARA.** Data ditarik sejak 2020 hingga saat ini (6,5 tahun). |
| **1. Fondasi** | Pipeline data dasar + fitur inti: Harga Hari Ini, Best Price Finder, Price Trend | ✅ **SELESAI SEMENTARA.** Silver Layer database terbentuk di Supabase. |
| **2. Analitik** | Price Change Analytics, Price Volatility, Smart Shopping Basket | ✅ **SELESAI SEMENTARA.** Analisis disparitas dan volatilitas telah divisualisasikan. |
| **3. ML & Peringatan Dini** | Forecasting, Anomaly Detection, Early Warning, Price Surge Alert | 🔄 **ONGOING (Fase Eksperimen Data Science).** Model dibangun dan diuji mundur (*backtest*). |

---

## 3. Pasar 

Daftar pasar diambil dari **SISKAPERBAPO** (siskaperbapo.jatimprov.go.id).

| Pasar | Kecamatan | Catatan & Perlakuan |
|---|---|---|
| Tambahrejo | Simokerto | Kios TPID (Eceran) |
| Wonokromo | Wonokromo | Kios TPID (Eceran) |
| Genteng | Genteng | Kios TPID (Eceran) |
| Pucang Anom | Gubeng | Kios TPID (Eceran) |
| Keputran | Tegalsari | **Pasar Induk Grosir**. Model ML diatur untuk menyadari perbedaan struktural ini agar prediksi harga Keputran tidak melebihi eceran. |
| Soponyono | Rungkut | Pasar besar di Surabaya Timur. *Catatan Data:* Data sebelum 2023 dibuang karena kualitas pencatatan buruk. |

---

## 4. Pembagian Role

*(Catatan: Pembagian peran ini bersifat fleksibel; seluruh anggota tim saling membantu lintas pekerjaan sesuai kebutuhan proyek).*

| Nama | Role | Fokus Utama |
|---|---|---|
| **Famos** | Data Engineer | Pipeline data, validasi & cleaning, integrasi sumber data, dll |
| **Kayla** | Data Analyst | Analitik harga (trend, volatility, change analytics), pembangunan dashboard |
| **Arfi** | Data Scientist / ML Engineer | Forecasting, anomaly detection, early warning, eksperimen model |

---

## 5. Metodologi & Progress Saat Ini (Fase Eksperimen ML)

Saat ini tim Data Science (*Arfi*) sedang memusatkan perhatian pada eksperimen model peramalan di dalam `notebook/forecasting_experiments.ipynb`.

### A. Preprocessing Data (Silver Layer)
- **Zero Lookahead Bias**: Kekosongan pencatatan pada hari libur nasional dan akhir pekan **TIDAK** diisi menggunakan interpolasi linier. Sistem memakai **Forward-Fill (ffill)** untuk mempertahankan ketegasan data tanpa membocorkan masa depan.
- **Cross-Join Kalender**: Menjamin bahwa seluruh kombinasi `[pasar_id, komoditas_id, tanggal]` memiliki baris kontinu di dalam deret waktu.
- **Non-Winsorization**: Lonjakan harga ekstrem (terutama cabai Pra-Ramadan) tidak dipotong (*outlier removal*), karena ini merepresentasikan gagal panen yang wajib dideteksi oleh *Early Warning System*.

### B. Feature Engineering
- **Sinyal Hujan (Weather Lag)**: Berdasarkan uji Fungsi Korelasi Silang (CCF), hujan tidak mempengaruhi harga secara instan. Fitur yang dipakai adalah akumulasi hujan 14 hari (`rain_sum_14d`) dan jeda hujan 4 minggu (`rain_lag_28d`).
- **Sinyal Kalender Masa Depan**: Karena kita memprediksi 7 hari ke depan, model dipasok dengan fitur kalender target (apakah H+7 adalah Ramadan, Libur Nasional, atau Pra-Ramadan).
- **Momentum**: `price_lag` (H-1, H-7, H-14) dan `rolling_std_14d` untuk menangkap volatilitas lokal.

### C. Pemodelan Forecasting
- Menggunakan arsitektur **Global Multi-Market LightGBM Quantile Regression**.
- Satu model per komoditas mampu memprediksi 6 pasar sekaligus dengan menjadikan `pasar_id` sebagai *categorical feature*.
- Menghasilkan 3 prediksi: Batas Bawah ($p_{10}$), Prediksi Utama ($p_{50}$), dan Batas Atas ($p_{90}$). Rentang kuantil ini berguna untuk tingkat keyakinan EWS.

### D. Skema Evaluasi & Pengujian
- **TIDAK menggunakan Random Train-Test Split.**
- Menggunakan skema **Walk-Forward Rolling-Origin** (Contoh: Latih s.d. 1 Jan, Prediksi 7 hari. Lalu latih s.d. 15 Jan, Prediksi 7 hari. Diulang hingga 43 iterasi).
- **Hasil:** Model LightGBM berhasil mencapai **WAPE 13.98%** (mengalahkan *Baseline Naive* 14.46%) dan mampu meningkatkan *Directional Accuracy* (Tebakan arah harga) menjadi **50.00%** (dua kali lipat lebih pintar dari *baseline* buta).

### E. Early Warning System (EWS)
- EWS dikalkulasi pasca-forecasting menggunakan aturan deterministik.
- 4 Matriks Skor (Maks total 100): Tren Harga (25), Volatilitas Historis (25), Disparitas Pasar (25), dan Proyeksi Masa Depan (25).
- Menghasilkan status: **NORMAL** (<40), **WASPADA** (40-69), **TINGGI** (>=70).

---
*Dokumen ini diperbarui terakhir pada fase Eksperimen ML & Tracking (September 2026).*
