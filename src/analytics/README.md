# Analytics & Feature Engineering (`src/analytics/`)

`src/analytics/` delivers feature engineering pipelines, Pasar Induk Keputran wholesale lead-price construction, Islamic calendar proximity calculations, and time-series error evaluation metrics for **HargaWatch Surabaya**.

---

## Overview

Paket analitik dan rekayasa fitur yang mentransformasikan data harga tabular harian menjadi dataset tersupervisi (*supervised learning tabular dataset*) yang siap dilatih:
- Pembentukan lag harga masa lalu ($t-1, t-2, t-3, t-7, t-14$).
- Perhitungan statistik bergerak left-aligned ($7d, 14d, 30d, 90d$).
- Ekstraksi sinyal lead grosir dari Pasar Induk Keputran untuk pasar-pasar satelit.
- Perhitungan jarak hari menuju Hari Raya Idulfitri (1 Syawal).
- Evaluasi metrik peramalan waktu (WAPE, MAE, RMSE, sMAPE, PICP, Directional Accuracy).

---

## Interface

### Feature Engineering Pipeline ([`features.py`](./features.py))
- `load_raw_datasets(force_db: bool = False) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]`: Mengembalikan `(df_harga, df_kal, df_cuaca)`. Mengutamakan cache CSV lokal; fallback ke database atau generator deterministik mock.
- `prepare_base_series(df_harga, komoditas_id=None, pasar_id=None) -> pd.DataFrame`: Menyiapkan panel data terurut kronologis.
- `build_lag_features(df: pd.DataFrame) -> pd.DataFrame`:
  - Fitur lag harga: `price_lag_1`, `price_lag_2`, `price_lag_3`, `price_lag_7`, `price_lag_14`.
  - Rolling statistics left-aligned: `rolling_mean_7d`, `rolling_std_7d`, `rolling_mean_14d`, `rolling_std_14d`, `rolling_mean_30d`, `rolling_std_30d`, `rolling_max_90d`.
  - Momentum: `pct_change_1d`, `pct_change_7d`, `volatility_ratio_7_30`.
- `calculate_days_to_idulfitri(date_series: pd.Series) -> pd.Series`: Menghitung jarak relatif hari menuju 1 Syawal terdekat (2020-2026).
- `build_keputran_lead_features(df: pd.DataFrame) -> pd.DataFrame`: Mengisolasi lag harga dari Pasar Induk Keputran (`pasar_id = 5`) dan menggabungkannya ke seluruh pasar eceran.
- `build_weather_features(df_cuaca: pd.DataFrame) -> pd.DataFrame`: Menghitung akumulasi curah hujan left-aligned (`rain_sum_7d`, `14d`, `30d`).
- `build_supervised_dataset(horizon=7, komoditas_id=None, include_weather=False, include_keputran=True, return_target_delta=False) -> pd.DataFrame`: Merakit dataset utuh untuk target peramalan multi-step direct $t+h$.
- `generate_mock_raw_datasets() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]`: Generator dataset sintetis deterministik untuk pengujian unit CI offline tanpa dependensi database.

### Evaluation Metrics Framework ([`metrics.py`](./metrics.py))
- `compute_wape(y_true, y_pred, eps=1e-5) -> float`: Weighted Absolute Percentage Error $\frac{\sum |y - \hat{y}|}{\sum y} \times 100$.
- `compute_mae(y_true, y_pred) -> float`: Mean Absolute Error (Rupiah).
- `compute_rmse(y_true, y_pred) -> float`: Root Mean Squared Error.
- `compute_smape(y_true, y_pred, eps=1e-5) -> float`: Symmetric Mean Absolute Percentage Error.
- `compute_picp(y_true, lower_bound, upper_bound) -> float`: Prediction Interval Coverage Percentage (target: 80%).
- `compute_directional_accuracy(y_true, y_pred, y_baseline) -> float`: Akurasi arah pergerakan harga.
- `compute_metrics(y_true, y_pred, y_baseline=None, lower_bound=None, upper_bound=None) -> Dict[str, float]`: Kartu skor metrik komprehensif.

### Exploratory Data Analysis Helpers ([`eda_helpers.py`](./eda_helpers.py))
- Fungsi bantu analisis tren, visualisasi dekomposisi musiman, dan matriks korelasi harga antar-pasar.

---

## Invariants

- **Strict Zero Lookahead Temporal Causality:** Semua jendela rolling (`rolling_mean`, `rolling_std`, `rolling_max`) wajib di-shift mundur satu langkah menggunakan `.shift(1)`. Observasi pada origin waktu $t$ dilarang masuk ke dalam ringkasan historis.
- **Keputran Lead Fallback:** Bila data Pasar Induk Keputran mengalami tanggal kosong, sistem melakukan fallback otomatis ke lag harga lokal pasar itu sendiri tanpa menghentikan inferensi.

---

## Side Effects

- **In-Memory Transformation:** Menjalankan manipulasi data frame pandas dan array numpy. Tidak melakukan mutasi disk atau jaringan secara mandiri.

---

## Verification

```bash
# Pengujian ekstraksi fitur dan metrik dalam rangkaian test forecast engine
pytest tests/test_forecast_engine.py -v
```
