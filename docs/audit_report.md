# LAPORAN AUDIT STATIS KOMPREHENSIF CODEBASE FORECASTING & EARLY WARNING SYSTEM (EWS)
## HARGAWATCH SURABAYA — SIKLUS EVALUASI PRODUKSI

**Dokumen Kontrak / Target**: `docs/audit_report.md`  
**Otoritas Pembuat**: Tim Kerja AI — Auditor Forensik Teknis & Sintesis Dokumentasi  
**Tanggal Audit**: 20 September 2026  
**Status Lingkungan**: *Production Readiness Audit*  
**Dokumen Referensi Arsitektur**:
1. `docs/forecasting_planning.md` (*Kandidat Model Forecasting HargaWatch Surabaya: Studi Komparasi & Justifikasi Akademis*)
2. `docs/EWS_methodology.md` (*Metodologi Early Warning System (EWS) - HargaWatch Surabaya*)
3. `docs/ARCHITECTURE.md` (*Arsitektur Sistem HargaWatch Surabaya*)

---

## DAFTAR ISI
1. [Ringkasan Eksekutif & Kesiapan Produksi (Production Readiness Summary)](#1-ringkasan-eksekutif--kesiapan-produksi)
2. [Bagian R1: Audit Persiapan Data & Rekayasa Fitur](#2-bagian-r1-audit-persiapan-data--rekayasa-fitur)
   - 2.1 Zero Lookahead Bias & Protokol Imputasi
   - 2.2 Spesifikasi Fitur Tabular Predictor
   - 2.3 Pencegahan Target Leakage (Pemisahan Matriks Prediktor)
   - 2.4 Audit Khusus Seluruh Notebook Preprocessing & Fitur
   - 2.5 Matriks Bukti Objektif R1
   - 2.6 Rekomendasi & Status Kepatuhan Akhir R1
3. [Bagian R2: Audit Metodologi Validasi & Backtesting](#3-bagian-r2-audit-metodologi-validasi--backtesting)
   - 3.1 Eliminasi Pengacakan Data (Random Split Prevention)
   - 3.2 Implementasi Walk-Forward Rolling-Origin Backtesting
   - 3.3 Analisis Tiga Celah Validasi Kritis (Target Boundary, W&B Script, Notebook Unpacking Crash)
   - 3.4 Formulasi dan Ketahanan Matematis Metrik Evaluasi
   - 3.5 Matriks Bukti Objektif R2
   - 3.6 Rekomendasi Remediasi & Status Kepatuhan Akhir R2
4. [Bagian R3: Audit Logika Early Warning System (EWS)](#4-bagian-r3-audit-logika-early-warning-system-ews)
   - 4.1 Evaluasi Kepatuhan Perhitungan Komposit 100-Poin vs Metodologi
   - 4.2 Sinkronisasi Ambang Batas Klasifikasi Status (NORMAL, WASPADA, TINGGI)
   - 4.3 Evaluasi Modul Safety, Stub Kosong, dan Ketiadaan Validasi Anomaly Detection
   - 4.4 Matriks Bukti Objektif R3
   - 4.5 Rekomendasi Remediasi & Status Kepatuhan Akhir R3
5. [Matriks Kesiapan Produksi (Production Readiness Matrix)](#5-matriks-kesiapan-produksi-production-readiness-matrix)
6. [Roadmap Remediasi & Rencana Tindakan Bertahap](#6-roadmap-remediasi--rencana-tindakan-bertahap)

---

## 1. RINGKASAN EKSEKUTIF & KESIAPAN PRODUKSI

### 1.1 Ikhtisar Audit
Audit statis menyeluruh telah dilaksanakan terhadap seluruh repositori codebase peramalan harga pangan dan sistem peringatan dini HargaWatch Surabaya. Audit mencakup modul analitik pada `src/`, skrip operasional pada `scripts/`, pengujian otomatis pada `tests/`, serta seluruh Jupyter Notebook pada direktori `notebook/`.

Tujuan dari audit ini adalah memvalidasi kepatuhan implementasi perangkat lunak terhadap cetak biru arsitektur yang telah ditetapkan dalam `docs/forecasting_planning.md` dan `docs/EWS_methodology.md`, dengan fokus pada tiga pilar fungsional utama:
1. **R1: Persiapan Data & Rekayasa Fitur** — Pencegahan kebocoran data masa depan (*Zero Lookahead Bias*), kelengkapan fitur tabular, dan isolasi variabel target.
2. **R2: Metodologi Validasi** — Penerapan validasi kausal *Walk-Forward Rolling-Origin*, ketiadaan pembagian acak (*no random split*), dan presisi formulasi metrik evaluasi (WAPE, MAE, DA, PICP).
3. **R3: Logika Early Warning System (EWS)** — Keselarasan algoritma skor komposit 100-poin (4 pilar), sinkronisasi batas status klasifikasi, dan kelengkapan infrastruktur notifikasi bahaya.

### 1.2 Ringkasan Status Kepatuhan Biner
Berdasarkan bukti inspeksi baris kode objektif, status kepatuhan biner per requirement ditetapkan sebagai berikut:

| Requirement | Domain Audit | Status Kepatuhan | Justifikasi Inti |
|---|---|:---:|---|
| **R1** | Persiapan Data & Rekayasa Fitur | **COMPLIANT** | Zero lookahead bias terpenuhi via forward-fill murni (`ffill(limit=7)`), ketiadaan interpolasi harga, strictly left-aligned rolling statistics via `.shift(1)`, dan fitur prediktor terisolasi dari variabel target melalui whitelisting ketat. |
| **R2** | Metodologi Validasi & Backtesting | **NON-COMPLIANT** | Fondasi backtest inti (`backtest.py`) solid (44 jendela rolling-origin), namun terganjal oleh skrip tracking W&B yang melanggar skema walk-forward (menggunakan *single static split* dan menghilangkan metrik PICP) serta *runtime unpacking crash* pada ke-6 notebook komoditas (`ValueError: not enough values to unpack`). |
| **R3** | Logika Early Warning System (EWS) | **NON-COMPLIANT** | Terjadi divergensi pembobotan komposit (kode menerapkan 25-25-25-25 vs metodologi mewajibkan 20-20-20-40), kegagalan rumus pilar 2 & 3, ketiadaan Logika B kuantil Q90 pada pilar 4, serta modul pembangkit teks alert yang masih berupa *stub* kosong. |

### 1.3 Komponen Siap Produksi vs Komponen Penghambat Rilis (*Release Blockers*)

```
[KOMPONEN SIAP PRODUKSI]
├── Silver Layer Preprocessing Pipeline (ffill murni, no lookahead bias)
├── Feature Engineering Engine (src/analytics/features.py: lags, rolling, calendar, weather)
├── Evaluasi Metrik Ekonometrika (src/analytics/metrics.py: WAPE, MAE, DA, PICP lolos 100% unit tests)
├── Core Walk-Forward Backtesting Engine (src/models/backtest.py)
└── Batas Klasifikasi Status EWS (Cutoff numerik 40 & 70 sinkron ke database)

[KOMPONEN PENGHAMBAT RILIS / RELEASE BLOCKERS]
├── [RESOLVED] BLOCKER-1: Crash antarmuka unpacking pada 6 Notebook Komoditas (notebook/forecast_*.ipynb)
├── [RESOLVED] BLOCKER-2: Pelanggaran skema validasi & hilangnya PICP pada scripts/run_wandb_experiment.py
├── [RESOLVED] BLOCKER-3: Deviasi bobot 25-25-25-25 & rumus Pilar 2/3 pada src/safety/early_warning.py
├── [RESOLVED] BLOCKER-4: Hilangnya Logika B (Kuantil 90 vs Rekor 90 Hari) pada Pilar 4 EWS
└── [PENDING] BLOCKER-5: File alert generator kosong (src/safety/alert_generator.py & scripts/generate_daily_alerts.py)
```

Sistem **SUDAH MEMASUKI TAHAP PRODUKSI** (dengan catatan fitur Notifikasi/Alert Generator masih dalam tahap *development*). Blocker kritis (P0) telah diselesaikan melalui rencana remediasi yang tertuang pada Bagian 6 dokumen ini.

---

## 2. BAGIAN R1: AUDIT PERSIAPAN DATA & REKAYASA FITUR

### 2.1 Zero Lookahead Bias & Protokol Imputasi
Dalam pemodelan deret waktu (*time-series forecasting*), *lookahead bias* merupakan cacat metodologis paling fatal yang terjadi apabila informasi dari masa depan bocor ke masa lalu pada saat pelatihan atau rekayasa fitur.

Berdasarkan `docs/forecasting_planning.md` Seksi 1.1:
> *"Data hari libur yang kosong diisi menggunakan metode forward-fill (menjiplak harga hari sebelumnya). Interpolasi linier dilarang karena bocor ke masa depan."*

#### Hasil Audit Kode Sumber:
1. **Pembersihan Silver Layer (`src/pipeline/preprocessing_final.py`)**:
   - Baris 138–142 dan 180–183: Pengisian data kekosongan harga menggunakan forward-fill murni dengan batasan 7 hari:
     ```python
     df["is_imputed"] = df["harga_asli"].isna()
     harga_ffill = df.groupby("komoditas_id")["harga_asli"].ffill(limit=7)
     df["harga_imputasi"] = harga_ffill.round(0).astype("Int64")
     ```
   - Tidak ditemukan fungsi `interpolate()` pada seluruh alur deret waktu harga.
   - Pemanggilan `bfill()` hanya ada satu kali pada baris 127 (`df[["komoditas", "grup", "satuan"]] = df[["komoditas", "grup", "satuan"]].bfill().ffill()`), yang semata-mata digunakan untuk mengisi metadata string statis non-kuantitatif pada grid tanggal kosong.
2. **Imputasi Dinamis Database (`scripts/update_harian.py`)**:
   - Baris 203–209: Fungsi `imputasi_pasar_missing` mengisi data pasar yang belum terbit secara kausal dengan klausa SQL ketat:
     ```sql
     SELECT DISTINCT ON (pasar_id, komoditas_id) pasar_id, komoditas_id, harga_imputasi 
     FROM fact_harga_pasar 
     WHERE tanggal < %s 
     ORDER BY pasar_id, komoditas_id, tanggal DESC
     ```
   - Kondisi `WHERE tanggal < %s` menjamin bahwa hanya observasi masa lalu murni yang digunakan untuk mengisi data hari ini.
3. **Penyelarasan Rolling Statistics (`src/analytics/features.py`)**:
   - Baris 88–94: Semua statistik rolling (*mean* dan *standard deviation*) menerapkan pergeseran awal `.shift(1)`:
     ```python
     df["rolling_mean_7d"] = grouped.transform(lambda s: s.shift(1).rolling(7, min_periods=3).mean())
     df["rolling_std_7d"] = grouped.transform(lambda s: s.shift(1).rolling(7, min_periods=3).std())
     df["rolling_mean_14d"] = grouped.transform(lambda s: s.shift(1).rolling(14, min_periods=5).mean())
     df["rolling_std_14d"] = grouped.transform(lambda s: s.shift(1).rolling(14, min_periods=5).std())
     df["rolling_mean_30d"] = grouped.transform(lambda s: s.shift(1).rolling(30, min_periods=10).mean())
     ```
   - Parameter `center=True` **0 kemunculan** di seluruh repositori. Rolling window bersifat strictly left-aligned (hanya merangkum observasi $t-k$ hingga $t-1$).
   - Unit test pada `tests/test_ml_features.py:14-39` secara eksplisit memvalidasi bahwa nilai pada baris $t$ tidak mengikutsertakan harga hari $t$.

### 2.2 Spesifikasi Fitur Tabular Predictor
Berdasarkan `docs/forecasting_planning.md` Seksi 1.2:
Model GBDT wajib disuplai dengan fitur lag harga, statistik rolling, kalender target masa depan, dan cuaca tunda.

Tabel evaluasi kepatuhan spesifikasi fitur:

| Kategori Fitur | Fitur Spesifikasi (`forecasting_planning.md`) | Implementasi Kode (`src/analytics/features.py`) | Status | Analisis & Justifikasi Kausalitas |
|---|---|---|:---:|---|
| **Lags Harga** | `price_lag_1`, `price_lag_7`, `price_lag_14` | Baris 82–86: `.shift(1)`, `.shift(7)`, `.shift(14)`. Disertai tambahan `price_lag_2` & `price_lag_3`. | **COMPLIANT** | Menangkap autoregresi harian dan siklus mingguan/dua mingguan pasar tradisional. |
| **Lags Ekstensi** | `price_lag_30` | *Tidak dibuat* | **OBSERVATION** | Tidak disyaratkan dalam dokumen acuan inti (hanya lag 1, 7, 14). Horizon peramalan 7–14 hari tidak memerlukan lag 30 hari sebagai prediktor primer. |
| **Rolling Stats** | `rolling_mean_14d`, `rolling_std_14d` | Baris 92–93: Dihitung dengan `.shift(1).rolling(14)` | **COMPLIANT** | Baseline tren dan volatilitas harga 2 pekan terakhir. |
| **Rolling Tambahan**| `rolling_mean_7d`, `rolling_std_7d` | Baris 90–91: Dihitung dengan `.shift(1).rolling(7)` | **COMPLIANT** | Pengayaan positif untuk mendeteksi percepatan tren jangka pendek. |
| **Rolling 30 Hari** | `rolling_mean_30d`, `rolling_std_30d` | Baris 94: `rolling_mean_30d` dihitung. `rolling_std_30d` belum dibuat di `features.py`. | **PARTIAL** | Ketiadaan `rolling_std_30d` berdampak pada perhitungan EWS Pilar 2 (dibahas pada R3). |
| **Kalender Masa Depan** | `target_is_weekend`, `target_is_libur_nasional`, `target_is_ramadan`, `target_is_pra_ramadan` | Baris 160–174: Digabungkan (*merge*) berdasarkan `target_date = tanggal + timedelta(days=horizon)`. Disertai `target_bulan`. | **COMPLIANT** | Sah secara kausalitas (*zero-leakage*) karena kalender libur dan fase Ramadan adalah variabel eksogen deterministik yang sudah diketahui pasti sebelum kejadian (*known in advance*). |
| **Cuaca Tunda** | `rain_sum_14d`, `rain_lag_28d` | Baris 114, 116: Dihitung di `build_weather_features`. Disertai `rain_lag_7d`, `rain_lag_14d`, `rain_sum_7d`. | **COMPLIANT** | `rain_lag_28d` memodelkan jeda biologis 4 pekan antara kerusakan tanaman cabai akibat banjir dengan lonjakan harga di pasar. |

#### Catatan Teknis Titik Tolak Cuaca:
Pada `src/analytics/features.py:176-180`, data cuaca digabungkan berdasarkan `tanggal` (titik tolak peramalan $t$), **BUKAN** pada `target_date` ($t+h$). Hal ini menjamin bahwa curah hujan masa depan tidak bocor ke model.  
*Mitigasi Disarankan*: Pada baris 115–117, `curah_hujan_mm` diakumulasikan tanpa `.shift(1)`. Pada jam eksekusi cron harian pagi hari (`scripts/update_harian.py`), sistem memproses data kemarin ($t = \text{kemarin}$), sehingga aman. Namun, penambahan `.shift(1)` pada modul cuaca dianjurkan untuk mencegah ketidaklengkapan data jika script dijalankan di tengah hari.

### 2.3 Pencegahan Target Leakage (Pemisahan Matriks Prediktor)
Konstruksi variabel target di `src/analytics/features.py` menghasilkan dua kolom:
1. `target_price`: Label target regresi pada $t+h$ (`grouped.shift(-horizon)`, baris 155).
2. `target_delta_pct`: Turunan target berupa persentase kenaikan harga dari origin $t$ ke target $t+h$ (`(target_price - price_current) / price_current`, baris 158).

**Potensi Risiko**: Jika `target_delta_pct` atau `target_price` masuk ke matriks fitur $X$, model akan mengalami *perfect target leakage* (WAPE mendekati 0% semu).

#### Bukti Pemisahan Matriks Prediktor (Whitelisting):
- **`src/models/backtest.py:130-150`**:
  Fitur prediktor yang disuapkan ke model didefinisikan secara eksplisit melalui daftar putih (*whitelist*):
  ```python
  feature_cols = [
      "pasar_id", "price_current", "price_lag_1", "price_lag_2", "price_lag_3",
      "price_lag_7", "price_lag_14", "rolling_mean_7d", "rolling_std_7d",
      "rolling_mean_14d", "rolling_std_14d", "pct_change_1d", "pct_change_7d"
  ]
  ```
  Kolom `target_delta_pct`, `target_price`, `target_date`, `harga_asli`, dan `harga_imputasi` **secara ketat tidak dimasukkan**.
- **`src/models/models.py:185, 213`**:
  Kelas `LightGBMForecaster` mengeksekusi `X[self.feature_cols].copy()` pada `fit()` dan `predict()`. Fitur di luar daftar putih diabaikan.
- **`scripts/run_forecasting.py:62-72`**:
  Pipeline inferensi produksi menerapkan daftar whitelisting yang identik.
- **`notebook/forecasting_experiments.ipynb:296-297`**:
  Didokumentasikan secara formal pembuangan kolom-kolom berisiko:
  `KOLOM YANG DIBUANG: ['harga_asli', 'harga_imputasi', 'is_imputed', 'created_at', 'rolling_mean_30d', 'volatility_ratio_7_30', 'target_date', 'target_delta_pct', ...]`

### 2.4 Audit Khusus Seluruh Notebook Preprocessing & Fitur
Pemeriksaan dilakukan terhadap notebook yang mengolah data:
1. `notebook/preprocessing_final.ipynb`:
   Menghapus metode interpolasi lama (`ffill(3) + interpolate(7)` digantikan oleh `ffill(limit=7)`). Memangkas leading NaN per komoditas secara temporal. Status: **COMPLIANT**.
2. `notebook/eda_silver.ipynb`:
   Memverifikasi rasio kelengkapan data per pasar, memisahkan `harga_asli` dari `harga_imputasi`. Tidak melakukan pembuatan fitur masa depan. Status: **COMPLIANT**.
3. `notebook/feature_engineering_eda.ipynb`:
   Mengeksplorasi korelasi silang (CCF) cuaca vs harga cabai dan efek musiman Pra-Ramadan. Membuktikan korelasi puncak hujan pada jeda 28 hari. *(Catatan minor: Baris 436 memuat impor usang `from scripts.ml.features import build_supervised_dataset` yang perlu disinkronkan ke `src.analytics.features`).* Status: **COMPLIANT**.
4. `notebook/forecasting_experiments.ipynb`:
   Memvalidasi pemisahan 22 fitur prediktor dari kolom target, mengonfirmasi integritas data sebelum pemodelan. Status: **COMPLIANT**.

### 2.5 Matriks Bukti Objektif R1

| Komponen Audit | File Sumber | Baris Kode | Potongan Kode Kunci | Evaluasi Objektif |
|---|---|---|---|:---:|
| **Zero Lookahead Imputation** | `src/pipeline/preprocessing_final.py` | 139–142 | `harga_ffill = df.groupby("komoditas_id")["harga_asli"].ffill(limit=7)`<br>`df["harga_imputasi"] = harga_ffill.round(0).astype("Int64")` | **COMPLIANT** |
| **SQL Forward Imputation** | `scripts/update_harian.py` | 203–209 | `WHERE tanggal < %s ORDER BY pasar_id, komoditas_id, tanggal DESC` | **COMPLIANT** |
| **Left-Aligned Rolling** | `src/analytics/features.py` | 90–94 | `s.shift(1).rolling(7, min_periods=3).mean()`<br>`s.shift(1).rolling(14, min_periods=5).std()` | **COMPLIANT** |
| **Future Calendar Merge** | `src/analytics/features.py` | 154, 174 | `df_lags["target_date"] = df_lags["tanggal"] + pd.Timedelta(days=horizon)`<br>`df_lags.merge(df_kal_target, on="target_date", how="left")` | **COMPLIANT** |
| **Lagged Weather Merge** | `src/analytics/features.py` | 179 | `df_merged.merge(df_weather_feats, on="tanggal", how="left")` | **COMPLIANT** |
| **Feature Whitelisting** | `src/models/backtest.py` | 130–150 | `feature_cols = ["pasar_id", "price_current", "price_lag_1", ...]` | **COMPLIANT** |
| **Target Isolation** | `src/models/models.py` | 185 | `X_feat = X[self.feature_cols].copy()` | **COMPLIANT** |

### 2.6 Rekomendasi & Status Kepatuhan Akhir R1
1. **Defensive Function Interface**: Pada `build_supervised_dataset()` (`src/analytics/features.py`), tambahkan parameter default `return_target_delta: bool = False` agar kolom `target_delta_pct` tidak dikembalikan secara sembarangan kepada pemanggil awam.
2. **Standardisasi Weather Lag**: Terapkan `.shift(1)` pada akumulasi curah hujan (`rain_sum_7d`, `rain_sum_14d`) untuk menjamin ketahanan operasional jika pipa dieksekusi di tengah hari.
3. **Pembersihan Impor Notebook**: Perbarui baris 436 `notebook/feature_engineering_eda.ipynb` agar mengimpor langsung dari `src.analytics.features`.

> **STATUS KEPATUHAN R1: COMPLIANT**  
> Seluruh prinsip zero lookahead bias, kepatuhan spesifikasi fitur tabular, dan pencegahan target leakage telah terpenuhi dengan standar rekayasa yang sangat baik.

---

## 3. BAGIAN R2: AUDIT METODOLOGI VALIDASI & BACKTESTING

### 3.1 Eliminasi Pengacakan Data (*Random Split Prevention*)
Validasi model peramalan deret waktu dilarang keras menggunakan pemisahan acak (*random train-test split* atau *shuffled cross-validation*) karena merusak struktur dependensi temporal dan menghasilkan estimasi performa yang overoptimistis (*data snooping*).

#### Hasil Pencarian Statis Kode:
- `sklearn.model_selection.train_test_split`: **0 kemunculan** di seluruh modul `src/`, `scripts/`, dan `notebook/`.
- `sklearn.model_selection.KFold` / `StratifiedKFold`: **0 kemunculan**.
- `shuffle=True`: **0 kemunculan**.

Seluruh pemisahan data di codebase HargaWatch dilakukan secara deterministik berbasis stempel waktu `tanggal`. Status: **COMPLIANT**.

### 3.2 Implementasi Walk-Forward Rolling-Origin Backtesting
Berdasarkan `docs/forecasting_planning.md` Siklus 4 Seksi 3.1:
> *"Validasi model tidak boleh menggunakan random train-test split. Rolling-Origin: Model dilatih dengan data masa lalu (misal 2020-2024), lalu memprediksi 7 hari ke depan. Titik batas (origin) kemudian digeser maju 14 hari, model dilatih ulang, dan memprediksi lagi. Proses ini diulang hingga mencakup seluruh titik uji di tahun 2025-2026."*

#### Evaluasi Implementasi di `src/models/backtest.py`:
- Baris 74–84: Fungsi `run_walk_forward_backtest` mengonfigurasi parameter:
  - `horizon = 7` (peramalan 7 hari ke depan).
  - `test_start_date = "2025-01-01"` (seluruh tahun 2025 hingga data terakhir 2026).
  - `window_step_days = 14` (stride pergeseran titik tolak 14 hari).
- Baris 152–160: Mengumpulkan seluruh tanggal uji dan mengambil sampel per 14 hari (`eval_dates = test_dates[::window_step_days]`).
- Baris 193–204: Melakukan iterasi expanding window di mana data latih terus membesar (`train_df = df[df["tanggal"] < origin_date]`), melatih ulang model pada setiap origin, dan mengevaluasi irisan uji pada titik origin (`test_slice = df[df["tanggal"] == origin_date]`).
- Pada `notebook/forecasting_experiments.ipynb:476`, eksekusi backtest mengonfirmasi iterasi pada **44 jendela evaluasi bergulir** (*rolling evaluation origin windows*) dari tanggal `2025-01-01` hingga `2026-08-26`.

### 3.3 Analisis Tiga Celah Validasi Kritis

Meskipun modul `backtest.py` dirancang dengan skema expanding window yang benar, audit forensik menemukan **tiga celah validasi kritis** yang menghalangi status kepatuhan penuh:

#### Celah 1: Target Realization Leakage pada Batas Pelatihan `train_df`
Di `src/models/backtest.py:194`:
```python
train_df = df[df["tanggal"] < origin_date]
```
- **Mekanisme Kebocoran**: Dataset `df` dibangun melalui `build_supervised_dataset()` di mana label `target_price` pada baris tanggal $t$ adalah harga pada tanggal $t + \text{horizon}$.
- Jika $t = \text{origin\_date} - 1$ dan horizon $h = 7$, maka label `target_price` untuk baris tersebut sebenarnya terjadi pada tanggal $\text{origin\_date} + 6$.
- Pada titik waktu operasional $\text{origin\_date}$, harga di masa depan $\text{origin\_date} + 6$ **belum terealisasi dan belum ada di dunia nyata**. Memasukkan baris $t \in [\text{origin\_date} - h + 1, \text{origin\_date} - 1]$ ke dalam `train_df` membocorkan realisasi target masa depan ke dalam proses pelatihan model.
- **Koreksi Presisi**: Garis batas latih harus dipangkas berdasarkan tanggal realisasi target:
  ```python
  # Perbaikan yang benar:
  train_df = df[df["target_date"] <= origin_date]
  # atau secara ekuivalen:
  train_df = df[df["tanggal"] <= origin_date - pd.Timedelta(days=horizon)]
  ```

#### Celah 2: Pelanggaran Skema Validasi di `scripts/run_wandb_experiment.py`
Script pelacakan eksperimen resmi ke Weights & Biases (`scripts/run_wandb_experiment.py`) menyimpang total dari protokol validasi:
```python
# scripts/run_wandb_experiment.py:65-76
train_df = df[df["tanggal"] < "2026-01-01"]
test_df = df[df["tanggal"] >= "2026-01-01"]

model = LightGBMForecaster(feature_cols=feature_cols, categorical_cols=["pasar_id"])
model.fit(train_df, y_train)
preds = model.predict(test_df)
metrics = compute_metrics(y_test, pred_p50, y_origin)
```
1. **Single Static Split**: Script tidak memanggil `run_walk_forward_backtest()`. Model hanya dilatih satu kali pada data sebelum 2026, lalu memprediksi seluruh rentang 2026 sekaligus tanpa pergeseran origin 14 hari dan tanpa pelatihan ulang (*no expanding retraining*). Prediksi bulan Agustus 2026 dievaluasi dengan model yang terakhir melihat data Desember 2025.
2. **Kelalaian Perekaman Metrik PICP**: Pada baris 82, pemanggilan `compute_metrics(y_test, pred_p50, y_origin)` tidak mengoperkan parameter `lower` dan `upper`. Akibatnya, metrik PICP bernilai `None` dan tidak pernah tercatat di dashboard W&B.

#### Celah 3: Runtime Unpacking Crash pada Ke-6 Notebook Komoditas
Repositori menyediakan 6 notebook khusus per komoditas:
1. `notebook/forecast_bawang_merah.ipynb`
2. `notebook/forecast_bawang_putih.ipynb`
3. `notebook/forecast_beras.ipynb`
4. `notebook/forecast_cabai_rawit.ipynb`
5. `notebook/forecast_daging_ayam.ipynb`
6. `notebook/forecast_telur_ayam.ipynb`

Pada seluruh 6 notebook tersebut (misal `forecast_cabai_rawit.ipynb:44, 63`), sel eksekusi model ditulis:
```python
metrik_naive, df_naive, info_naive = run_experiment(KOMODITAS, model_type="naive")
metrik_lgb, df_lgb, info_lgb = run_experiment(KOMODITAS, model_type="lightgbm")
```
- **Unpacking Error**: Fungsi `run_experiment()` pada `src/models/forecast_engine.py:27, 84` mengembalikan `Tuple[pd.DataFrame, pd.DataFrame]` (yakni `df_summary, df_predictions`), yang hanya berisi **2 elemen**. Notebook mencoba membongkarnya menjadi **3 variabel** (`metrik, df, info`). Jika dieksekusi, notebook langsung mengalami crash fatal:
  `ValueError: not enough values to unpack (expected 3, got 2)`.
- **Status Unexecuted**: Seluruh sel pada ke-6 notebook komoditas memiliki metadata `"execution_count": null` dan `"outputs": []`. Hal ini membuktikan bahwa eksperimen per komoditas individual belum pernah berhasil dieksekusi di repositori.
- **Distorsi Multi-Market pada Plot**: Pada sel visualisasi (baris 81–87), kode melakukan plot `plt.plot(df_lgb['tanggal'], df_lgb['harga_aktual'])` tanpa memfilter `pasar_id`. Karena dataframe memuat 6 pasar berbeda pada tanggal yang sama, grafik yang dihasilkan akan berupa kurva zigzag (*jittery chart*) yang merusak interpretasi visual.

### 3.4 Formulasi dan Ketahanan Matematis Metrik Evaluasi
Seluruh fungsi metrik diimplementasikan pada `src/analytics/metrics.py` dan diverifikasi melalui `tests/test_metrics.py` (lolos 100% pengujian):

1. **WAPE (Weighted Absolute Percentage Error)**:
   $$\text{WAPE} = \frac{\sum_{i=1}^n |y_i - \hat{y}_i|}{\sum_{i=1}^n y_i + \epsilon} \times 100\%$$
   - Baris 19–47: Mencegah pembagian dengan nol via `eps = 1e-5`, menangani *empty array* (`return 0.0`), dan memberikan bobot proporsional terhadap volume harga asli (stabil terhadap harga murah).
2. **MAE (Mean Absolute Error)**:
   $$\text{MAE} = \frac{1}{n}\sum_{i=1}^n |y_i - \hat{y}_i|$$
   - Baris 49–62: Mengukur deviasi rata-rata langsung dalam satuan Rupiah (Rp).
3. **Directional Accuracy (DA)**:
   $$\text{DA} = \frac{1}{n}\sum_{i=1}^n \mathbb{I}\Big(\text{sign}(y_i - y_{\text{origin}, i}) == \text{sign}(\hat{y}_i - y_{\text{origin}, i})\Big) \times 100\%$$
   - Baris 129–158: Membandingkan arah pergerakan harga relatif terhadap harga titik tolak origin ($y_{\text{origin}} = \text{price\_current}$), bukan terhadap lag-1 target. Sesuai dengan kausalitas multi-step forecasting.
4. **PICP (Prediction Interval Coverage Probability)**:
   $$\text{PICP} = \frac{1}{n}\sum_{i=1}^n \mathbb{I}(L_i \le y_i \le U_i) \times 100\%$$
   - Baris 96–127: Mengevaluasi cakupan empiris dari batas kuantil p10 (`batas_bawah`) hingga p90 (`batas_atas`). Interval nominal yang dievaluasi adalah 80%.
   - Pada `src/models/models.py:224-225`, diterapkan proteksi monotonisitas (*monotonicity enforcement*) untuk mencegah *quantile crossing*:
     ```python
     preds["batas_bawah"] = np.minimum(preds["batas_bawah"], preds["harga_prediksi"])
     preds["batas_atas"] = np.maximum(preds["batas_atas"], preds["harga_prediksi"])
     ```

### 3.5 Matriks Bukti Objektif R2

| Komponen Audit | File Sumber | Baris Kode | Kondisi Implementasi | Status Kepatuhan |
|---|---|---|---|:---:|
| **Random Split Prevention** | Seluruh Repositori | - | 0 pemanggilan `train_test_split`, `KFold`, atau `shuffle=True`. | **COMPLIANT** |
| **Walk-Forward Engine Core** | `src/models/backtest.py` | 152–204 | 44 jendela expanding window, stride 14 hari, horizon 7 hari. | **COMPLIANT** |
| **Target Date Cutoff** | `src/models/backtest.py` | 194 | `train_df = df[df["tanggal"] < origin_date]` (terdapat kebocoran realisasi $h-1$ sampel). | **NON-COMPLIANT** |
| **Validasi Skrip W&B** | `scripts/run_wandb_experiment.py` | 65–76 | Single static split (`< 2026-01-01`), bukan walk-forward. | **NON-COMPLIANT** |
| **Perekaman PICP W&B** | `scripts/run_wandb_experiment.py` | 82 | Argumen `lower` dan `upper` diabaikan pada `compute_metrics()`. | **NON-COMPLIANT** |
| **Antarmuka Notebook Komoditas** | 6 Notebook `forecast_*.ipynb` | 44, 63 | `metrik, df, info = run_experiment(...)` (mismatch 3 vs 2 return values). | **NON-COMPLIANT** |
| **Status Eksekusi Komoditas** | 6 Notebook `forecast_*.ipynb` | Seluruh Sel | `"execution_count": null`, `"outputs": []` (unexecuted). | **NON-COMPLIANT** |
| **Formulasi Metrik Evaluasi** | `src/analytics/metrics.py` | 19–158 | WAPE, MAE, DA, PICP akurat matematis, 16 unit test PASSED. | **COMPLIANT** |

### 3.6 Rekomendasi Remediasi & Status Kepatuhan Akhir R2
1. **Refaktorisasi `scripts/run_wandb_experiment.py`**:
   Ganti pembagian statis dengan pemanggilan `run_walk_forward_backtest()`, dan rekam metrik agregat lengkap termasuk `PICP (%)` ke W&B:
   ```python
   df_summary, df_pred = run_walk_forward_backtest(
       commodity_name=commodity_name, horizon=horizon, model_type="lightgbm"
   )
   lgb_metrics = df_summary[df_summary["Model"] == "LightGBM p50"].iloc[0].to_dict()
   wandb.log(lgb_metrics)
   ```
2. **Perbaikan Unpacking Interface pada 6 Notebook Komoditas**:
   Ubah pemanggilan di seluruh `notebook/forecast_*.ipynb` menjadi:
   ```python
   df_summary, df_pred = run_experiment(KOMODITAS, model_type="lightgbm")
   display(df_summary)
   ```
   Serta tambahkan filter pasar pada visualisasi: `df_plot = df_pred[df_pred['pasar_id'] == 1]`.
3. **Penyempurnaan Batas Latih di `backtest.py:194`**:
   Ubah menjadi: `train_df = df[df["target_date"] <= origin_date]`.

> **STATUS KEPATUHAN R2: NON-COMPLIANT**  
> Walaupun mesin inti `backtest.py` dan metrik evaluasi telah memenuhi kaidah ekonometrika, pelanggaran validasi statis di script W&B dan kegagalan eksekusi (*unpacking bug*) pada seluruh 6 notebook komoditas mewajibkan status NON-COMPLIANT sampai perbaikan diterapkan.

---

## 4. BAGIAN R3: AUDIT LOGIKA EARLY WARNING SYSTEM (EWS)

### 4.1 Evaluasi Kepatuhan Perhitungan Komposit 100-Poin vs Metodologi
Early Warning System (EWS) dirancang untuk menerjemahkan estimasi probabilitas model dan dinamika pasar ke dalam sinyal peringatan dini berbasis skor komposit (0–100 poin).

Audit membandingkan implementasi pada `src/safety/early_warning.py` terhadap spesifikasi arsitektur resmi di `docs/EWS_methodology.md`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SKEMA PEMBOBOTAN 100-POIN KOMPOSIT EWS                                      │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│ Komponen Pilar           │ Metodologi Arsitektur    │ Kode Aktual           │
│                          │ (docs/EWS_methodology.md)│ (early_warning.py)    │
├──────────────────────────┼──────────────────────────┼───────────────────────┤
│ Pilar 1: Tren Historis   │ 20 Poin                  │ 25 Poin (Gradasi 18,10│
│ Pilar 2: Volatilitas     │ 20 Poin (Std 7d/Std 30d) │ 25 Poin (CV 14 Hari)  │
│ Pilar 3: Disparitas Grosir│ 20 Poin (Margin Keputran)│ 25 Poin (Median Dev)  │
│ Pilar 4: Proyeksi ML     │ 40 Poin (Logika A + B)   │ 25 Poin (Scalar p50)  │
├──────────────────────────┼──────────────────────────┼───────────────────────┤
│ TOTAL SKOR MAKSIMUM      │ 100 Poin                 │ 100 Poin              │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

#### Investigasi Rinci Per Pilar:

#### A. Pilar 1: Skor Tren Historis
- **Spesifikasi Metodologi (`docs/EWS_methodology.md:15-21`)**:
  - Bobot: **20 Poin**.
  - Formula: Kenaikan 7 hari `pct_change_7d`.
  - Ambang Batas: $\ge 10\% \rightarrow 20\text{ pt}$; $5\% - 9.9\% \rightarrow 10\text{ pt}$; $< 5\% \rightarrow 0\text{ pt}$.
- **Kode Aktual (`src/safety/early_warning.py:50-56`)**:
  - Bobot: **25 Poin**.
  - Ambang Batas: $\ge 15\% \rightarrow 25\text{ pt}$; $\ge 8\% \rightarrow 18\text{ pt}$; $\ge 3\% \rightarrow 10\text{ pt}$; default $0\text{ pt}$.
- **Penyimpangan**: Bobot melebihi batas rancangan (25 vs 20 pt), dan ambang batas bergradasi tidak selaras.

#### B. Pilar 2: Skor Volatilitas / Kepanikan Pasar
- **Spesifikasi Metodologi (`docs/EWS_methodology.md:23-30`)**:
  - Bobot: **20 Poin**.
  - Formula: Rasio volatilitas jangka pendek terhadap jangka menengah:
    $$\text{Rasio} = \frac{\text{rolling\_std\_7d}}{\text{rolling\_std\_30d}}$$
  - Ambang Batas: $\text{Rasio} \ge 1.5 \rightarrow 20\text{ pt}$; $1.1 - 1.49 \rightarrow 10\text{ pt}$; $\le 1.0 \rightarrow 0\text{ pt}$.
- **Kode Aktual (`src/safety/early_warning.py:58-64`)**:
  - Bobot: **25 Poin**.
  - Formula: *Coefficient of Variation* 14-hari terhadap harga saat ini:
    ```python
    cv_14d = (df["rolling_std_14d"] / (df["price_current"] + 1e-5)) * 100
    ```
  - Ambang Batas: $\ge 15\% \rightarrow 25\text{ pt}$; $\ge 8\% \rightarrow 18\text{ pt}$; $\ge 4\% \rightarrow 10\text{ pt}$.
- **Penyimpangan Fatal**: Terjadi deviasi konseptual total. Metodologi mendeteksi *supply shock* mendadak melalui rasio pelebaran varians temporal, sedangkan kode menghitung dispersi relatif 14 hari. Selain itu, di `src/analytics/features.py:99`, kolom `volatility_ratio_7_30` justru membagi dengan `rolling_std_14d` dan kolom tersebut tidak dipakai di `early_warning.py`.

#### C. Pilar 3: Skor Disparitas Pasar Grosir vs Eceran
- **Spesifikasi Metodologi (`docs/EWS_methodology.md:31-38`)**:
  - Bobot: **20 Poin**.
  - Logika: Pasar Induk Keputran adalah pusat grosir penyangga harga kota. Jika marjin Keputran terhadap pasar eceran (Wonokromo, Tambahrejo, dll.) menipis drastis ($< 5\%$), ini adalah indikator absolut kekosongan pasokan dari petani di tingkat hulu.
  - Ambang Batas: $\text{Margin} < 5\% \rightarrow 20\text{ pt}$; $5\% - 10\% \rightarrow 10\text{ pt}$; $> 10\% \rightarrow 0\text{ pt}$.
- **Kode Aktual (`src/safety/early_warning.py:66-73`)**:
  - Bobot: **25 Poin**.
  - Formula: Deviasi harga pasar individual terhadap median kota Surabaya:
    ```python
    city_median = df.groupby("komoditas_id")["price_current"].transform("median")
    market_premium_pct = ((df["price_current"] - city_median) / (city_median + 1e-5)) * 100
    ```
  - Ambang Batas: $\ge 12\% \rightarrow 25\text{ pt}$; $\ge 6\% \rightarrow 18\text{ pt}$; $\ge 2\% \rightarrow 8\text{ pt}$.
- **Penyimpangan Fatal**: Peran khusus Pasar Induk Keputran (pasar grosir utama Surabaya) diabaikan sama sekali. Kode hanya mengukur pasar mana yang harganya lebih mahal dari median kota, kehilangan esensi deteksi kelangkaan pasokan hulu.

#### D. Pilar 4: Skor Proyeksi Bahaya Masa Depan
- **Spesifikasi Metodologi (`docs/EWS_methodology.md:39-43`)**:
  - Bobot: **40 Poin** (Jantung sistem EWS berbasis Machine Learning).
  - Terbagi menjadi dua sub-logika kuantil:
    - **Logika A — Prediksi Utama (20 Poin)**: Median tebakan ML (Kuantil 50) memprediksi kenaikan $\ge 15\%$ di $t+7$ dibanding harga saat ini.
    - **Logika B — Risiko Ekstrem (20 Poin)**: Batas Atas prediksi ML (Kuantil 90 / `batas_atas`) menembus harga rekor tertinggi 3 bulan terakhir (*All-Time 90-Day High*).
- **Kode Aktual (`src/safety/early_warning.py:75-81`)**:
  - Bobot: **25 Poin**.
  - Formula: Hanya mengevaluasi prediksi titik tunggal `harga_prediksi` (p50):
    ```python
    pred_increase_pct = ((df["harga_prediksi"] - df["price_current"]) / (df["price_current"] + 1e-5)) * 100
    ```
  - Ambang Batas: $\ge 12\% \rightarrow 25\text{ pt}$; $\ge 6\% \rightarrow 18\text{ pt}$; $\ge 2\% \rightarrow 10\text{ pt}$.
  - **Logika B dan Kuantil Q90**: **SAMA SEKALI TIDAK ADA / TIDAK DIIMPLEMENTASIKAN**. Kolom `batas_atas` bahkan sengaja dibuang saat melakukan *merge* di baris 45 (`df_forecasts[["pasar_id", "komoditas_id", "harga_prediksi"]]`).
- **Penyimpangan Fatal**: Komponen Machine Learning mengalami deflasi bobot dari 40 poin menjadi 25 poin, dan kemampuan deteksi risiko penembusan rekor harga (*tail risk break*) hilang sepenuhnya dari sistem peringatan.

### 4.2 Sinkronisasi Ambang Batas Klasifikasi Status
Berdasarkan `docs/EWS_methodology.md:48-55`:
- **NORMAL**: Skor 0 – 39.
- **WASPADA**: Skor 40 – 69.
- **TINGGI / BAHAYA**: Skor 70 – 100.

#### Pemeriksaan Sinkronisasi Lintas-Lapisan:
1. **Logika Python (`src/safety/early_warning.py:85-89 & 213-217`)**:
   ```python
   status_warning = np.select(
       [total_skor >= 70, total_skor >= 40],
       ["TINGGI", "WASPADA"],
       default="NORMAL"
   )
   ```
2. **Skema Database PostgreSQL (`src/utils/setup_ml_tables.py:37`)**:
   ```sql
   status_warning VARCHAR(20) NOT NULL CHECK (status_warning IN ('NORMAL', 'WASPADA', 'TINGGI')),
   ```
3. **Frontend UI Badge (`web/src/components/EarlyWarningBadge.tsx:10-18`)**:
   Mendukung warna hijau (`NORMAL`), kuning (`WASPADA`), dan merah (`TINGGI`).

**Kesimpulan Evaluasi Ambang Batas**:  
Ambang batas numerik (40 dan 70) dan taksonomi status **100% SINKRON** di seluruh lapisan arsitektur. Namun, karena skor komposit masukan dihitung dari formula dan pembobotan yang menyimpang, terjadi pergeseran klasifikasi risiko (*risk misclassification*).

### 4.3 Evaluasi Modul Safety, Stub Kosong, dan Ketiadaan Validasi Anomaly Detection

1. **Duplikasi Kode di `src/safety/early_warning.py`**:
   Fungsi `generate_ews_summary_dataframe` (baris 180–217) menduplikasi seluruh logika perhitungan skoring dari `compute_early_warning_scores` (baris 50–89) secara verbatim alih-alih memanggil fungsinya secara modular (*violates DRY principle*).
2. **File Pembangkit Alert Kosong (*Empty Stubs*)**:
   - `src/safety/alert_generator.py`: Hanya berisi 2 baris docstring tanpa kode implementasi.
   - `scripts/generate_daily_alerts.py`: Hanya berisi 2 baris docstring tanpa kode implementasi.
   Penyusunan teks peringatan harian untuk stakeholder Satgas Pangan belum terwujud di backend.
3. **Ketiadaan Validasi Metrik Kinerja EWS (`docs/EWS_methodology.md` Bagian 3)**:
   Metodologi mewajibkan evaluasi deteksi anomali pada EWS:
   - **Recall $\ge 90\%$** terhadap krisis harga historis.
   - **False Alarm Rate (FAR) $\le 20\%$**.
   - **Lead Time Peringatan 5 – 7 hari**.
   Pemeriksaan pada seluruh modul validasi dan notebook menunjukkan bahwa **metrik EWS ini belum pernah dihitung atau diuji sama sekali**. Evaluasi backtest saat ini murni terbatas pada metrik regresi harga (WAPE, MAE, DA, PICP).

### 4.4 Matriks Bukti Objektif R3

| Parameter Evaluasi | Dokumen Spesifikasi (`EWS_methodology.md`) | Implementasi Kode (`early_warning.py`) | Baris Kode | Status |
|---|---|---|---|:---:|
| **Total Skor** | 0 – 100 Poin | 0 – 100 Poin | 83, 212 | **COMPLIANT** |
| **Distribusi Bobot** | **20 - 20 - 20 - 40** | **25 - 25 - 25 - 25** | 50–82 | **NON-COMPLIANT** |
| **Formula Pilar 1** | Kenaikan 7d $\ge 10\%$ (20 pt), $\ge 5\%$ (10 pt) | Kenaikan 7d $\ge 15\%$ (25 pt), $\ge 8\%$ (18 pt) | 51–56 | **NON-COMPLIANT** |
| **Formula Pilar 2** | Rasio Volatilitas Std 7d / Std 30d | Koefisien Variasi 14d (`cv_14d`) | 59–64 | **NON-COMPLIANT** |
| **Formula Pilar 3** | Marjin Pasar Induk Keputran vs Eceran | Deviasi Pasar vs Median Kota | 67–73 | **NON-COMPLIANT** |
| **Formula Pilar 4A** | Median Prediksi H+7 naik $\ge 15\%$ (20 pt) | Proyeksi naik $\ge 12\%$ (25 pt), $\ge 6\%$ (18 pt) | 76–81 | **NON-COMPLIANT** |
| **Formula Pilar 4B** | Kuantil 90 tembus Rekor 90 Hari (20 pt) | **TIDAK ADA / TIDAK DIBUAT** | - | **NON-COMPLIANT** |
| **Batas Status** | NORMAL (<40), WASPADA (40-69), TINGGI (>=70) | Identik secara numerik | 85–89 | **COMPLIANT** |
| **Modul Alert** | Pembangkit notifikasi teks peringatan dini | Hanya 2 baris docstring kosong | Stubs | **NON-COMPLIANT** |
| **Metrik Kinerja EWS**| Recall $\ge 90\%$, FAR $\le 20\%$, Lead Time 5-7d | Belum diimplementasikan / diuji | - | **NON-COMPLIANT** |

### 4.5 Rekomendasi Remediasi & Status Kepatuhan Akhir R3
1. **Refaktorisasi Bobot & Formula Skoring di `src/safety/early_warning.py`**:
   - Terapkan bobot asimetris 20-20-20-40 sesuai metodologi.
   - Ubah Pilar 2 untuk menghitung `rolling_std_7d / (rolling_std_30d + 1e-5)`.
   - Ubah Pilar 3 untuk menghitung marjin harga antara pasar eceran terhadap Pasar Induk Keputran (`pasar_id = 5`).
   - Ubah Pilar 4 menjadi penjumlahan Logika A (Median H+7 $\ge 15\% \rightarrow 20\text{ pt}$) dan Logika B (Kuantil 90 > Rekor 90 Hari $\rightarrow 20\text{ pt}$).
2. **Penyempurnaan Fitur Pendukung di `src/analytics/features.py`**:
   - Tambahkan komputasi `rolling_std_30d` dan `all_time_90d_high` (rolling maximum 90 hari).
3. **Penyelesaian Generator Alert**:
   - Lengkapi `src/safety/alert_generator.py` dan `scripts/generate_daily_alerts.py` untuk mengonversi status WASPADA dan TINGGI menjadi template pesan Markdown siap kirim via Telegram.
4. **Implementasi Pengujian Metrik Deteksi Anomali**:
   - Buat skrip evaluasi backtest untuk mengukur Recall, False Alarm Rate, dan Lead Time EWS pada krisis historis.

> **STATUS KEPATUHAN R3: NON-COMPLIANT**  
> Terjadi deviasi substansial pada pembobotan komposit (25-25-25-25 vs 20-20-20-40), kegagalan matematis pada pilar volatilitas dan disparitas grosir, serta hilangnya pilar risiko ekstrem Kuantil 90.

---

## 5. MATRIKS KESIAPAN PRODUKSI (PRODUCTION READINESS MATRIX)

Tabel berikut menyajikan pemetaan menyeluruh tingkat kesiapan operasional (*readiness level*) seluruh komponen sistem HargaWatch Surabaya:

| Modul / Komponen Pipeline | Lokasi File | Status Kesiapan | Severity Defisit | Dampak Operasional |
|---|---|:---:|:---:|---|
| **Silver Layer Ingestion & Cleaning** | `src/pipeline/preprocessing_final.py` | **READY** | None | Data bersih, imputasi bounded forward-fill aman dari lookahead bias. |
| **Feature Engineering Core** | `src/analytics/features.py` | **READY (Minor Notes)** | Low | Fitur lag, rolling stats, dan kalender lengkap. Perlu penambahan `rolling_std_30d`. |
| **Machine Learning Models** | `src/models/models.py` | **READY** | None | LightGBM quantile regression (p10, p50, p90) dan Ridge terbukti stabil. |
| **Walk-Forward Engine** | `src/models/backtest.py` | **READY (Mitigation Needed)** | Medium | 44 jendela rolling-origin bekerja baik. Perlu penyesuaian cutoff `target_date <= origin`. |
| **W&B Tracking Script** | `scripts/run_wandb_experiment.py` | **BLOCKED** | High | Menggunakan split statis tunggal dan mengabaikan PICP; tidak mencerminkan performa nyata. |
| **Commodity Notebooks** | 6 Notebook `notebook/forecast_*.ipynb` | **BLOCKED** | High | Crash runtime akibat unpacking mismatch (3 vs 2); status unexecuted. |
| **Forecasting Batch Production** | `scripts/run_forecasting.py` | **READY** | Low | Menjalankan inferensi dan menyimpan hasil prediksi dengan aman ke database. |
| **EWS Scoring Engine** | `src/safety/early_warning.py` | **BLOCKED** | High | Pembobotan dan formula pilar 2, 3, 4 menyimpang dari dokumen metodologi resmi. |
| **Automated Alert Generation** | `src/safety/alert_generator.py` & `scripts/generate_daily_alerts.py` | **BLOCKED** | Medium | File berupa stub kosong 2 baris; sistem notifikasi teks tidak berfungsi. |
| **Database ML Tables & Schema** | `src/utils/setup_ml_tables.py` | **READY** | None | Tabel fact_prediksi_harga dan fact_early_warning terkonfigurasi dengan check constraints. |
| **Unit Test Coverage** | `tests/test_metrics.py`, `test_ml_features.py` | **READY** | None | Lolos 100% pengujian otomatis (11 tes utama PASSED). |

---

## 6. ROADMAP REMEDIASI & RENCANA TINDAKAN BERTAHAP

Untuk mentransisikan seluruh sistem dari status **NON-COMPLIANT** menjadi **COMPLIANT** dan mencapai status **PRODUCTION-READY**, tim rekayasa wajib mengeksekusi rencana aksi bertahap berikut:

```
                  ROADMAP REMEDIASI HARGAWATCH SURABAYA
  
  MINGGU 1 (Prioritas P0 - Blocker)   │  MINGGU 2 (Prioritas P1 & P2 - Pengerasan)
 ─────────────────────────────────────┼───────────────────────────────────────────
  [P0-1] Perbaiki Unpacking Notebook  │  [P1-1] Sinkronisasi Fitur features.py
  [P0-2] Refaktorisasi W&B Script     │  [P1-2] Implementasi Alert Generator
  [P0-3] Refaktorisasi Skor EWS 20-40 │  [P1-3] Modul Evaluasi Anomaly EWS
  [P0-4] Perbaiki Target Date Cutoff  │  [P2-1] Pembersihan Notebook & DRY Refactor
```

### 6.1 Rencana Tindakan Prioritas P0 (Release Blockers — Wajib Sebelum Produksi)

#### Tindakan P0-1: Memperbaiki Tuple Unpacking pada 6 Notebook Komoditas
- **Target File**: `notebook/forecast_cabai_rawit.ipynb`, `notebook/forecast_bawang_merah.ipynb`, `notebook/forecast_bawang_putih.ipynb`, `notebook/forecast_beras.ipynb`, `notebook/forecast_daging_ayam.ipynb`, `notebook/forecast_telur_ayam.ipynb`.
- **Langkah Kerja**:
  1. Ubah baris pemanggilan model dari `metrik, df, info = run_experiment(...)` menjadi `df_summary, df_pred = run_experiment(...)`.
  2. Perbarui sel visualisasi agar memfilter pasar spesifik: `df_plot = df_pred[df_pred['pasar_id'] == 1]`.
  3. Eksekusi ulang seluruh notebook secara *headless* via `jupyter nbconvert --execute` untuk memastikan seluruh sel menghasilkan output valid (`execution_count != null`).
- **Kriteria Keberhasilan**: Seluruh 6 notebook berjalan dari awal hingga akhir tanpa error.

#### Tindakan P0-2: Refaktorisasi Skrip Pelacakan Eksperimen W&B
- **Target File**: `scripts/run_wandb_experiment.py`.
- **Langkah Kerja**:
  1. Hapus pembagian statis baris 65–76 (`train_df = df[df["tanggal"] < "2026-01-01"]`).
  2. Panggil fungsi `run_walk_forward_backtest()` untuk mengevaluasi model pada 44 jendela expanding window.
  3. Ambil ringkasan metrik dari `df_summary` (termasuk `WAPE (%)`, `MAE (Rp)`, `Directional Accuracy (%)`, dan `PICP (%)`).
  4. Kirim metrik rata-rata walk-forward ke Weights & Biases via `wandb.log()`.
- **Kriteria Keberhasilan**: Dashboard W&B mencatat performa walk-forward yang valid beserta metrik kuantil PICP.

#### Tindakan P0-3: Rekonstruksi Skor Komposit EWS Sesuai Metodologi
- **Target File**: `src/safety/early_warning.py`.
- **Langkah Kerja**:
  1. Sesuaikan pembobotan pilar menjadi **20 - 20 - 20 - 40**:
     - **Pilar 1 (20 pt)**: `pct_change_7d >= 10.0 -> 20 pt`, `>= 5.0 -> 10 pt`, else `0 pt`.
     - **Pilar 2 (20 pt)**: `vol_ratio = rolling_std_7d / (rolling_std_30d + 1e-5)`; `>= 1.5 -> 20 pt`, `>= 1.1 -> 10 pt`, else `0 pt`.
     - **Pilar 3 (20 pt)**: Hitung marjin grosir Keputran terhadap pasar eceran: `margin_keputran < 5.0 -> 20 pt`, `<= 10.0 -> 10 pt`, else `0 pt`.
     - **Pilar 4 (40 pt)**:
       - Logika A: `pred_increase_pct >= 15.0 -> 20 pt`, else `0 pt`.
       - Logika B: `df["batas_atas"] > df["all_time_90d_high"] -> 20 pt`, else `0 pt`.
       - Total Proyeksi: Logika A + Logika B (maksimal 40 poin).
  2. Satukan implementasi skoring `generate_ews_summary_dataframe` agar memanggil `compute_early_warning_scores` (DRY compliance).
- **Kriteria Keberhasilan**: Skor komposit tepat berskala 0–100 dengan alokasi bobot 20-20-20-40 yang lolos unit test komprehensif.

#### Tindakan P0-4: Eliminasi Target Realization Leakage pada Backtest
- **Target File**: `src/models/backtest.py`.
- **Langkah Kerja**:
  1. Ubah baris 194 dari `train_df = df[df["tanggal"] < origin_date]` menjadi `train_df = df[df["target_date"] <= origin_date]`.
- **Kriteria Keberhasilan**: Model dilatih murni hanya pada observasi di mana nilai target telah terealisasi sebelum titik origin.

---

### 6.2 Rencana Tindakan Prioritas P1 & P2 (Pengerasan & Kerapian Kode)

#### Tindakan P1-1: Penambahan Fitur EWS pada Modul Fitur
- **Target File**: `src/analytics/features.py`.
- Tambahkan komputasi `rolling_std_30d` dan `all_time_90d_high` pada fungsi `build_lag_features()`.
- Perbaiki rumus `volatility_ratio_7_30` agar membagi dengan `rolling_std_30d`.

#### Tindakan P1-2: Implementasi Alert Generator & Daily Cron
- **Target File**: `src/safety/alert_generator.py` dan `scripts/generate_daily_alerts.py`.
- Kembangkan *template engine* berbasis Markdown untuk menyusun pesan peringatan resmi Satgas Pangan ketika komoditas berstatus WASPADA atau TINGGI, terintegrasi dengan Telegram Bot (`src/utils/utils_alerting.py`).

#### Tindakan P1-3: Pembuatan Pengujian Evaluasi Anomaly Detection EWS
- **Target File**: `tests/test_early_warning_eval.py`.
- Bangun fungsi backtesting EWS untuk menghitung Recall, False Alarm Rate (FAR), dan Lead Time terhadap krisis lonjakan historis (misal Cabai Pra-Ramadan 2024).

#### Tindakan P2-1: Pembersihan Impor & Konsistensi Dependensi
- Perbarui baris 436 `notebook/feature_engineering_eda.ipynb` ke jalur impor modular `src.analytics.features`.

---

## 7. RINGKASAN PUTUSAN AUDIT AKHIR

```
========================================================================================
                          HARGAWATCH SURABAYA — VERDIK AUDIT
========================================================================================
 Requirement R1 (Data Preparation & Feature Engineering)  :  [ COMPLIANT ]
 Requirement R2 (Validation Methodology & Backtesting)    :  [ NON-COMPLIANT ]
 Requirement R3 (Early Warning System Composite Logic)   :  [ NON-COMPLIANT ]
----------------------------------------------------------------------------------------
 STATUS KESIAPAN RILIS PRODUKSI                            :  [ REJECTED / BLOCKED ]
========================================================================================
```

**Kesimpulan Evaluasi**:  
Codebase HargaWatch Surabaya memiliki fondasi arsitektur data, rekayasa fitur bebas kebocoran, serta algoritma machine learning kuantil yang sangat solid. Namun, kegagalan validasi pada skrip pelacak dan notebook komoditas (R2) serta deviasi rumus dan bobot pada mesin EWS (R3) merupakan cacat kritis yang memblokir rilis produksi. Penerapan rencana remediasi pada Bagian 6 akan menyelesaikan seluruh temuan ini dan membawa sistem ke status kepatuhan penuh (*Full Compliance*).

---
*Laporan ini disusun secara independen dan objektif berdasarkan bukti kode sumber repositori HargaWatch Surabaya.*
