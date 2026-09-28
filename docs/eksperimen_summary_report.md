# Laporan Ringkasan Eksperimen Forecasting (HargaWatch Surabaya)

## 1. Deskripsi Eksperimen
- **Metodologi**: Walk-Forward Backtesting (Evaluasi dengan data uji bergulir tanpa *data leakage*).
- **Cakupan Data**: 6 komoditas utama (Beras, Cabai Rawit, Bawang Merah, Bawang Putih, Daging Ayam, Telur Ayam).
- **Horizon Prediksi**: 7 hari ke depan (H+7).
- **Model yang Dievaluasi**: Baseline (Naive Last Value, Naive 7d SMA), Linear (Ridge Regression), GBDT (LightGBM, XGBoost, CatBoost), dan Model Statistik (AutoARIMA, AutoETS).
- **Metrik Utama**: WAPE (Weighted Absolute Percentage Error) - semakin rendah semakin baik.

## 2. Hasil Evaluasi Model Terbaik (Per Komoditas)
Berdasarkan pengujian pada data validasi *out-of-sample*, berikut adalah model yang menghasilkan prediksi paling akurat:

| Komoditas | Kategori Volatilitas | Model Terbaik | WAPE (%) | Arah Prediksi Benar (DA) |
| :--- | :--- | :--- | :--- | :--- |
| **Beras** | Stabil | Naive Last Value | 0.10% | 95.45% |
| **Daging Ayam** | Stabil | Naive Last Value | 2.00% | 56.06% |
| **Bawang Putih** | Stabil | Naive Last Value | 3.62% | 60.61% |
| **Telur Ayam** | Cukup Volatil | CatBoost (p50) | 3.22% | 43.94% |
| **Bawang Merah** | Volatil | CatBoost (p50) | 6.97% | 33.33% |
| **Cabai Rawit** | Sangat Volatil | LightGBM (p50) | 13.50% | 54.55% |

*Catatan: Secara agregat rata-rata di seluruh ke-6 komoditas, **CatBoost** adalah model Machine Learning dengan performa paling konsisten dan stabil (Rata-rata WAPE keseluruhan: 5.36%). Model statistik klasik (AutoARIMA/AutoETS) menempati posisi terbawah (WAPE > 7%).*

## 3. Hasil Studi Ablasi Fitur (E5)
Studi ablasi dilakukan untuk mengukur signifikansi fitur eksternal (Cuaca dan Kalender/Ramadan). Hasil uji empiris mematahkan hipotesis awal:

1. **Fitur Cuaca (Curah Hujan Surabaya) Menambahkan *Noise***: 
   Memasukkan data cuaca kota Surabaya justru meningkatkan *error* / memperburuk akurasi di semua komoditas. Hal ini terbukti karena Surabaya adalah wilayah konsumen, bukan sentra produksi (pertanian). Hujan di wilayah konsumen tidak berdampak langsung pada gagal panen.
2. **Fitur Kalender Hanya Relevan pada Komoditas Tertentu**:
   Untuk komoditas seperti Beras, Bawang, dan Daging, efek lonjakan permintaan akibat hari raya (Ramadan) umumnya diredam oleh intervensi stabilisasi pemerintah (*Operasi Pasar*). Karena itu, model ML cenderung salah tebak (*over-predict*) jika diberi fitur kalender. Sebaliknya, pada **Cabai Rawit** (yang cepat membusuk dan sulit ditimbun), fitur kalender terbukti nyata membantu meningkatkan akurasi prediksi.

## 4. Kesimpulan dan Tindak Lanjut Arsitektur
Berdasarkan temuan di atas, arsitektur *pipeline forecasting* untuk **Early Warning System (EWS)** akan disederhanakan dengan aturan berikut:

1. **Hapus Data Cuaca (Drop Weather Features)**: 
   Fitur cuaca Surabaya dinonaktifkan sepenuhnya dari *pipeline training* maupun prediksi. Hal ini akan memperingan komputasi, menekan biaya API, dan menghapus sumber *noise* pada model.
2. **Pemetaan Fitur Spesifik (Dynamic Feature Routing)**:
   - **Untuk Cabai Rawit**: *Training* menggunakan fitur **Harga Historis (Price Lags) + Fitur Kalender**.
   - **Untuk Komoditas Lainnya (Beras, Bawang, Daging, Telur)**: *Training* didasarkan secara murni pada deret waktu (*Strictly Autoregressive*), alias **HANYA menggunakan Harga Historis**.
3. **Pemilihan Engine Forecasting**:
   - Algoritma **CatBoost** dan **LightGBM** akan di-set sebagai *engine* utama untuk menangani komoditas volatil.
   - *Baseline Naive* dapat dipertahankan sebagai *sanity check* pendamping untuk komoditas yang sangat stabil.
