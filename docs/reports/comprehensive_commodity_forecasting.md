# Laporan Hasil Eksperimen Automated Forecasting & Error Analysis (Multi-Commodity)
**Tanggal Pengujian:** 2026-10-23 23:53:53  
**Proyek:** HargaWatch Surabaya  
**Metodologi:** Rolling-Origin Walk-Forward Backtesting (22 Jendela Uji Independen)  
**Eksekusi:** Parallel Multi-Agent Compute Engine (16 CPU Cores)

---
## 1. Executive Summary: Peta Performa Seluruh Komoditas Pangan Surabaya

Eksperimen ini menguji seluruh komoditas pangan yang tersedia menggunakan prinsip *Parsimony & Data-Centric AI*. Model Machine Learning (LightGBM, XGBoost, CatBoost) **hanya dipilih** jika mampu mengungguli *Naive Baseline* secara terbukti ($>3\%$ perbaikan WAPE relatif).

| ID | Komoditas | Klaster Domain | Model Champion | Tipe | WAPE (%) | MAE (Rp) | PICP (80% CI) | Status Batas Performa |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| 38 | **Cabe Merah Besar** | Klaster A | Naive Last Value | Baseline | **13.91%** | Rp 5,111 | - | ⚠️ Batas Data Tercapai |
| 14 | **Daging Ayam Kampung** | Klaster B | Naive Last Value | Baseline | **0.01%** | Rp 8 | - | ✅ Optimal |
| 17 | **Telur Ayam Kampung** | Klaster B | Naive Last Value | Baseline | **1.23%** | Rp 568 | - | ✅ Optimal |
| 35 | **Indomie Rasa Kari Ayam** | Klaster C | Naive Last Value | Baseline | **0.00%** | Rp 0 | - | ✅ Optimal |
| 28 | **Garam Beryodium Halus** | Klaster C | XGBoost p50 | ML (GBDT) | **0.05%** | Rp 5 | 100.0% | ✅ Optimal |
| 21 | **Susu Kental Manis Merk Indomilk** | Klaster C | Naive Last Value | Baseline | **0.08%** | Rp 11 | - | ✅ Optimal |
| 96 | **Minyak Goreng MINYAKITA** | Klaster C | Naive Last Value | Baseline | **0.13%** | Rp 21 | - | ✅ Optimal |
| 20 | **Susu Kental Manis Merk Bendera** | Klaster C | Naive 7d SMA | Baseline | **0.20%** | Rp 25 | - | ✅ Optimal |
| 30 | **Terigu Protein Sedang (Kemasan)** | Klaster C | Naive Last Value | Baseline | **0.21%** | Rp 25 | - | ✅ Optimal |
| 43 | **KETELA POHON** | Klaster C | LightGBM p50 | ML (GBDT) | **0.29%** | Rp 18 | 78.9% | ✅ Optimal |
| 4 | **Beras Medium** | Klaster C | Naive Last Value | Baseline | **0.44%** | Rp 56 | - | ✅ Optimal |
| 32 | **Kedelai Impor** | Klaster C | Naive Last Value | Baseline | **0.65%** | Rp 101 | - | ✅ Optimal |
| 41 | **KACANG HIJAU** | Klaster C | Naive Last Value | Baseline | **1.02%** | Rp 254 | - | ✅ Optimal |
| 42 | **KACANG TANAH** | Klaster C | Naive Last Value | Baseline | **1.37%** | Rp 406 | - | ✅ Optimal |
| 92 | **Minyak Goreng Kemasan Premium** | Klaster C | Naive Last Value | Baseline | **1.70%** | Rp 313 | - | ✅ Optimal |
| 49 | **Bawang Putih Sinco/Honan** | Klaster C | Naive Last Value | Baseline | **4.56%** | Rp 1,572 | - | ⚠️ Batas Data Tercapai |
| 40 | **Ikan Asin Teri** | Klaster D | Naive Last Value | Baseline | **0.15%** | Rp 130 | - | ✅ Optimal |
| 25 | **Jagung Pipilan Kering** | Klaster D | Naive Last Value | Baseline | **0.27%** | Rp 30 | - | ✅ Optimal |
| 60 | **Ikan Tongkol** | Klaster D | Naive Last Value | Baseline | **1.29%** | Rp 533 | - | ✅ Optimal |
| 59 | **Ikan Kembung** | Klaster D | Naive Last Value | Baseline | **1.37%** | Rp 652 | - | ✅ Optimal |
| 62 | **Ikan Cakalang** | Klaster D | Naive Last Value | Baseline | **1.59%** | Rp 717 | - | ✅ Optimal |
| 58 | **Ikan Bandeng** | Klaster D | Naive Last Value | Baseline | **1.79%** | Rp 728 | - | ✅ Optimal |
| 61 | **Ikan Tuna** | Klaster D | Naive Last Value | Baseline | **1.84%** | Rp 870 | - | ✅ Optimal |

---

## 2. Analisis Mendalam per Klaster Domain

### Klaster A: Hortikultura Sayuran Volatil
*Perishable, high volatility, highly sensitive to Pasar Induk Keputran wholesale lead signals.*

Ambang Batas Derau Wajar (*Expected Noise Ceiling*): **WAPE $\le 12.0\%$**

#### **ID 38: Cabe Merah Besar**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **13.91%** | MAE **Rp 5,111** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 13.91%) selected. GBDT (CatBoost p50, WAPE 13.54%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `-192.6 Rp`, Deviasi Standar `7574 Rp`, Akurasi Arah `26.3%`
- **Diagnosis Batas Performa:** Batas Performa Tercapai: WAPE (13.91%) melebihi ambang batas wajar klaster (12.0%). Ketiadaan data volume fisik (truk masuk/stok) membatasi akurasi lebih lanjut.

### Klaster B: Protein Hewani & Musiman Lebaran
*Animal protein with structural price points, driven by Idulfitri/Ramadan demand surges.*

Ambang Batas Derau Wajar (*Expected Noise Ceiling*): **WAPE $\le 5.0\%$**

#### **ID 14: Daging Ayam Kampung**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **0.01%** | MAE **Rp 8** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 0.01%) selected. GBDT (CatBoost p50, WAPE 0.65%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+7.9 Rp`, Deviasi Standar `88 Rp`, Akurasi Arah `99.2%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 17: Telur Ayam Kampung**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **1.23%** | MAE **Rp 568** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 1.23%) selected. GBDT (LightGBM p50, WAPE 1.29%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+405.8 Rp`, Deviasi Standar `1858 Rp`, Akurasi Arah `89.9%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

### Klaster C: Pangan Pokok & Olahan Terpatok (Administered/HET)
*Inertial prices, government price ceiling (HET) or manufactured FMCG pricing.*

Ambang Batas Derau Wajar (*Expected Noise Ceiling*): **WAPE $\le 3.0\%$**

#### **ID 96: Minyak Goreng MINYAKITA**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **0.13%** | MAE **Rp 21** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 0.13%) selected. GBDT (CatBoost p50, WAPE 0.23%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+1.1 Rp`, Deviasi Standar `146 Rp`, Akurasi Arah `97.0%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 4: Beras Medium**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **0.44%** | MAE **Rp 56** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 0.44%) selected. GBDT (CatBoost p50, WAPE 1.30%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `-40.7 Rp`, Deviasi Standar `242 Rp`, Akurasi Arah `92.1%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 92: Minyak Goreng Kemasan Premium**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **1.70%** | MAE **Rp 313** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 1.70%) selected. GBDT (CatBoost p50, WAPE 1.95%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `-305.8 Rp`, Deviasi Standar `2070 Rp`, Akurasi Arah `92.8%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 28: Garam Beryodium Halus**
- **Champion Terpilih:** `XGBoost p50` (Machine Learning)
- **Akurasi Riil:** WAPE **0.05%** | MAE **Rp 5** | PICP **100.0%**
- **Rasional Pemilihan:** GBDT (XGBoost p50) outperformed Baseline (Naive Last Value) with 68.8% relative WAPE improvement.
- **Analisis Residual:** Bias Rata-rata `-4.2 Rp`, Deviasi Standar `30 Rp`, Akurasi Arah `58.0%`
- **Diagnosis Batas Performa:** Normal predictable dynamics.

#### **ID 20: Susu Kental Manis Merk Bendera**
- **Champion Terpilih:** `Naive 7d SMA` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **0.20%** | MAE **Rp 25** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive 7d SMA, WAPE 0.20%) selected. GBDT (LightGBM p50, WAPE 0.29%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+0.5 Rp`, Deviasi Standar `115 Rp`, Akurasi Arah `94.9%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 30: Terigu Protein Sedang (Kemasan)**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **0.21%** | MAE **Rp 25** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 0.21%) selected. GBDT (LightGBM p50, WAPE 0.24%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+3.6 Rp`, Deviasi Standar `153 Rp`, Akurasi Arah `97.1%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 21: Susu Kental Manis Merk Indomilk**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **0.08%** | MAE **Rp 11** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 0.08%) selected. GBDT (CatBoost p50, WAPE 0.30%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+3.6 Rp`, Deviasi Standar `74 Rp`, Akurasi Arah `97.8%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 32: Kedelai Impor**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **0.65%** | MAE **Rp 101** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 0.65%) selected. GBDT (CatBoost p50, WAPE 0.98%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `-14.5 Rp`, Deviasi Standar `496 Rp`, Akurasi Arah `94.9%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 42: KACANG TANAH**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **1.37%** | MAE **Rp 406** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 1.37%) selected. GBDT (CatBoost p50, WAPE 2.07%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `-115.9 Rp`, Deviasi Standar `1352 Rp`, Akurasi Arah `87.0%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 41: KACANG HIJAU**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **1.02%** | MAE **Rp 254** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 1.02%) selected. GBDT (CatBoost p50, WAPE 2.35%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `-79.7 Rp`, Deviasi Standar `799 Rp`, Akurasi Arah `88.4%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 43: KETELA POHON**
- **Champion Terpilih:** `LightGBM p50` (Machine Learning)
- **Akurasi Riil:** WAPE **0.29%** | MAE **Rp 18** | PICP **78.86%**
- **Rasional Pemilihan:** GBDT (LightGBM p50) outperformed Baseline (Naive Last Value) with 12.1% relative WAPE improvement.
- **Analisis Residual:** Bias Rata-rata `-14.8 Rp`, Deviasi Standar `108 Rp`, Akurasi Arah `38.2%`
- **Diagnosis Batas Performa:** Normal predictable dynamics.

#### **ID 49: Bawang Putih Sinco/Honan**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **4.56%** | MAE **Rp 1,572** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 4.56%) selected. GBDT (CatBoost p50, WAPE 4.52%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+224.6 Rp`, Deviasi Standar `2864 Rp`, Akurasi Arah `54.3%`
- **Diagnosis Batas Performa:** Batas Performa Tercapai: WAPE (4.56%) melebihi ambang batas wajar klaster (3.0%). Ketiadaan data volume fisik (truk masuk/stok) membatasi akurasi lebih lanjut.

#### **ID 35: Indomie Rasa Kari Ayam**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **0.00%** | MAE **Rp 0** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 0.00%) selected. GBDT (CatBoost p50, WAPE 0.02%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+0.0 Rp`, Deviasi Standar `0 Rp`, Akurasi Arah `100.0%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

### Klaster D: Perikanan & Hasil Laut
*Marine fisheries, seasonal monsoon waves, administrative recording gaps.*

Ambang Batas Derau Wajar (*Expected Noise Ceiling*): **WAPE $\le 7.0\%$**

#### **ID 58: Ikan Bandeng**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **1.79%** | MAE **Rp 728** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 1.79%) selected. GBDT (CatBoost p50, WAPE 2.35%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+110.3 Rp`, Deviasi Standar `1999 Rp`, Akurasi Arah `81.6%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 40: Ikan Asin Teri**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **0.15%** | MAE **Rp 130** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 0.15%) selected. GBDT (CatBoost p50, WAPE 0.78%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+30.0 Rp`, Deviasi Standar `943 Rp`, Akurasi Arah `98.0%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 60: Ikan Tongkol**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **1.29%** | MAE **Rp 533** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 1.29%) selected. GBDT (CatBoost p50, WAPE 2.66%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `-66.7 Rp`, Deviasi Standar `1672 Rp`, Akurasi Arah `87.5%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 61: Ikan Tuna**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **1.84%** | MAE **Rp 870** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 1.84%) selected. GBDT (CatBoost p50, WAPE 2.28%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `-87.0 Rp`, Deviasi Standar `2273 Rp`, Akurasi Arah `82.6%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 59: Ikan Kembung**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **1.37%** | MAE **Rp 652** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 1.37%) selected. GBDT (CatBoost p50, WAPE 2.55%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `+0.0 Rp`, Deviasi Standar `2331 Rp`, Akurasi Arah `91.3%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 62: Ikan Cakalang**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **1.59%** | MAE **Rp 717** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 1.59%) selected. GBDT (CatBoost p50, WAPE 1.97%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `-65.2 Rp`, Deviasi Standar `2131 Rp`, Akurasi Arah `87.0%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

#### **ID 25: Jagung Pipilan Kering**
- **Champion Terpilih:** `Naive Last Value` (Rule-Based Baseline)
- **Akurasi Riil:** WAPE **0.27%** | MAE **Rp 30** | PICP **None%**
- **Rasional Pemilihan:** Parsimony Rule: Baseline (Naive Last Value, WAPE 0.27%) selected. GBDT (CatBoost p50, WAPE 0.81%) did not show meaningful improvement.
- **Analisis Residual:** Bias Rata-rata `-20.0 Rp`, Deviasi Standar `186 Rp`, Akurasi Arah `97.0%`
- **Diagnosis Batas Performa:** Karakteristik inersial / HET regulasi: variasi harga minimal sehingga baseline Naive optimal.

---

## 3. Kejujuran Saintifik: Komoditas yang Mencapai Batas Data (*Performance Ceiling*)

Berikut komoditas yang **tidak dapat diturunkan lagi erornya** murni karena keterbatasan data fisik:
1. **Cabe Merah Besar (WAPE: 13.91%, MAE: Rp 5,111)**
   - *Penyebab Fundamental:* Volatilitas pasokan harian tinggi, ketiadaan data tonase truk masuk ke Surabaya, dan sifat komoditas yang cepat membusuk.
   - *Rekomendasi Satgas:* Gunakan **pita ketidakpastian ($p_10-p_90$)** dan arah pergerakan tren, bukan angka titik tunggal.

1. **Bawang Putih Sinco/Honan (WAPE: 4.56%, MAE: Rp 1,572)**
   - *Penyebab Fundamental:* Volatilitas pasokan harian tinggi, ketiadaan data tonase truk masuk ke Surabaya, dan sifat komoditas yang cepat membusuk.
   - *Rekomendasi Satgas:* Gunakan **pita ketidakpastian ($p_10-p_90$)** dan arah pergerakan tren, bukan angka titik tunggal.

---

## 4. Kesimpulan & Status Registry Model

- **Total Komoditas Diuji:** 23
- **Model Machine Learning Unggul (GBDT):** 2 komoditas
- **Model Baseline Unggul (Naive / Moving Average):** 21 komoditas
- Seluruh model champion telah disinkronkan ke `models/forecasting/registry.json`.