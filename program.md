# Autoresearch Program: HargaWatch Surabaya

> **Paradigma:** Otonomi Eksperimen Machine Learning (Andrej Karpathy)  
> **Fokus:** Forecasting 7 Komoditas Kategori 3 (Kritis & Volatil)  
> **Target:** Menurunkan WAPE, menjaga PICP $\ge 80\%$, merebut dominasi dari Naive Baseline ke ML.

---

## 1. The 3-File Contract

Sistem ini beroperasi dengan batasan ketat pemisahan hak akses:

| Komponen | File Path | Status Hak Akses | Peran & Tanggung Jawab |
| :--- | :--- | :---: | :--- |
| **The Yardstick** | `scripts/autoresearch/evaluator.py` | **BEKU (READ-ONLY)** | Menjalankan *walk-forward rolling-origin backtest* (2025-01-01+, step 14 hari) di 16 core CPU. DILARANG diubah agar standar pengujian objektif. |
| **The Sandbox** | `src/models/autoresearch_sandbox.py` | **SANDBOX (MUTABLE)** | **Satu-satunya file** yang boleh dimodifikasi agen. Berisi arsitektur model (`CandidateForecaster`), hyperparameter, dan fitur baru. |
| **Scoreboard** | `experiments/autoresearch/results.tsv` | **APPEND-ONLY** | Catatan resmi riwayat seluruh eksperimen beserta metrik dan status kelulusan. |

---

## 2. Metrik & Aturan Kelulusan (*The Ratchet Rules*)

Setiap kali kode diubah, jalankan evaluator harness:
```bash
# Uji komoditas tunggal:
python scripts/autoresearch/evaluator.py --id <KOMODITAS_ID> --horizon 7

# Atau uji seluruh klaster 3 secara paralel (memakai 6 CPU worker):
python scripts/autoresearch/evaluator.py --cluster 3 --workers 6
```

### Kriteria Kelulusan Mutlak (*Hard Constraints*):
1. **WAPE Lebih Rendah:** Skor WAPE harus lebih rendah dari rekor terbaik saat ini di `results.tsv`.
2. **Interval Valid (Anti-Collapse):** $PICP \ge 75.0\%$ (target ideal $\ge 80.0\%$). Jika $PICP < 75.0\%$, model dinyatakan **GAGAL/REJECT** meskipun WAPE turun, karena pita risiko EWS runtuh.
3. **No Numerical Artifacts:** Prediksi tidak boleh menghasilkan nilai negatif, `NaN`, atau `Inf`.
4. **Time Budget:** Waktu eksekusi tidak boleh melebihi 120 detik per komoditas.

### Protokol Git Ratchet:
* **JIKA LOLOS (IMPROVED):**
  1. Catat hasil ke `experiments/autoresearch/results.tsv`.
  2. Lakukan Git Commit:
     ```bash
     git commit -am "exp(autoresearch): [ID <KOMODITAS_ID>] WAPE improved to <SKOR>% via <RINGKASAN_HIPOTESIS>"
     ```
* **JIKA GAGAL / MEMBURUK / CRASH:**
  1. Batalkan perubahan secara instan:
     ```bash
     git reset --hard HEAD
     ```
  2. Lanjutkan ke ide atau hipotesis berikutnya.

---

## 3. Papan Skor Rekor Saat Ini (Target to Beat)

Sebelum memulai eksperimen, ini adalah rekor *baseline* yang harus Anda kalahkan:

| ID | Komoditas | Champion Saat Ini | WAPE Baseline | PICP Baseline | Target Autoresearch |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **50** | **Cabe Rawit Merah** | XGBoost p50 | **14.97%** | 78.6% | Turunkan WAPE $< 13.5\%$, PICP $\ge 80\%$ |
| **39** | **Bawang Merah** | CatBoost p50 | **8.02%** | 78.6% | Turunkan WAPE $< 7.0\%$, PICP $\ge 80\%$ |
| **46** | **Tomat Merah** | XGBoost p50 | **11.45%** | 77.2% | Turunkan WAPE $< 11.0\%$, PICP $\ge 80\%$ |
| **37** | **Cabe Merah Keriting** | CatBoost p50 | **11.95%** | 78.2% | Turunkan WAPE $< 11.5\%$, PICP $\ge 80\%$ |
| **48** | **Buncis** | XGBoost p50 | **9.57%** | 71.7% | Naikkan PICP dari 71.7% ke $\ge 80.0\%$ |
| **38** | **Cabe Merah Besar** | CatBoost p50 | **13.39%** | 79.1% | Turunkan WAPE $< 12.0\%$, PICP $\ge 80\%$ |
| **16** | **Telur Ayam Ras** | XGBoost p50 | **3.19%** | 78.4% | Turunkan WAPE $< 3.0\%$, PICP $\ge 80\%$ |

---

## 4. Ruang Eksplorasi Hipotesis Ilmiah

Agen dipandu untuk menguji kombinasi dari 3 vektor berikut di dalam `src/models/autoresearch_sandbox.py`:

### Vektor 1: Feature Engineering Spasial & Volatilitas (`transform_features`)
* **Wholesale Spread Ratio:** Rasio selisih harga eceran pasar vs harga Pasar Induk Keputran:
  `spread_keputran_ratio = (price_current - keputran_price_lag_1) / (keputran_price_lag_1 + 1e-5)`
* **Volatilitas Terakselerasi:** Rasio deviasi standar jangka pendek terhadap jangka menengah:
  `volatility_acceleration = rolling_std_7d / (rolling_std_14d + 1e-5)`
* **Momentum Rasio:** Momentum perubahan harga 3 hari vs 7 hari.

### Vektor 2: Cross-Family Model Tournament
* **CatBoost MultiQuantile:** Gunakan `loss_function='MultiQuantile:alpha=0.1,0.5,0.9'` dengan tuning `l2_leaf_reg` (3.0 s.d 8.0) dan `depth` (4 s.d 7).
* **XGBoost Quantile:** Eksplorasi `subsample`, `colsample_bytree`, dan `learning_rate` (0.02 s.d 0.08).
* **LightGBM Quantile:** Uji `num_leaves` dan `min_data_in_leaf` untuk mencegah *overfitting* pada derau musiman.
* **Blended Ensemble:** Rata-rata tertimbang prediksi kuantil antara CatBoost dan XGBoost:
  `pred = 0.5 * catboost_pred + 0.5 * xgboost_pred`

### Vektor 3: Kalibrasi Asimetris & Kuantil
* Sesuaikan alpha kuantil jika PICP terlalu sempit (misal uji `alpha=0.08, 0.50, 0.92` untuk memperluas cakupan interval 80% CI).

---

## 5. Instruksi Siklus Loop bagi Agen

Saat menjalankan sesi eksperimen otonom:
1. Baca baris terakhir di `experiments/autoresearch/results.tsv`.
2. Pilih 1 komoditas target (misal: ID 50 Cabe Rawit Merah).
3. Buat 1 perubahan logis di `src/models/autoresearch_sandbox.py` (jangan ubah file lain).
4. Jalankan `python scripts/autoresearch/evaluator.py --id 50 --horizon 7`.
5. Jika hasil WAPE membaik dan PICP lolos $\ge 75\%$, lakukan `git commit` dan catat ke TSV.
6. Jika hasil memburuk atau gagal, lakukan `git reset --hard HEAD`.
7. Lanjutkan ke iterasi berikutnya hingga rekor terpenuhi.
