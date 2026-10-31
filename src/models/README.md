# Machine Learning Models & Forecasting Engine (`src/models/`)

`src/models/` contains machine learning forecasting architectures, walk-forward validation harnesses, experiment orchestration engines, and statistical price anomaly detectors for **HargaWatch Surabaya**.

---

## Overview

Modul pemodelan prediktif dan deteksi anomali harga yang mencakup:
- Peramalan multi-step trajectory ($H=1..14$ hari ke depan).
- Estimasi kuantil ketidakpastian ($p_{10}$ lower bound, $p_{50}$ median expectation, $p_{90}$ upper bound / tail risk).
- Strategi routing champion terverifikasi: Naive Last Value / SMA untuk komoditas stabil ber-HET, dan Gradient Boosted Decision Trees (LightGBM/CatBoost) untuk komoditas volatil.
- Validasi walk-forward rolling-origin tanpa data leakage masa depan.
- Deteksi anomali statistik berbasis left-aligned Z-score, Tukey IQR fences, dan day-over-day price jump.

---

## Interface

### Forecaster Architectures ([`models.py`](./models.py))

Semua model mengimplementasikan interface standar:
- `fit(X: pd.DataFrame, y: pd.Series) -> self`
- `predict(X: pd.DataFrame) -> Dict[str, np.ndarray]` atau `np.ndarray`

Implementasi kelas:
- `LightGBMForecaster`: 3 regressor kuantil (`alpha=0.10, 0.50, 0.90`) dengan jaminan batas monotonik `batas_bawah <= harga_prediksi <= batas_atas`. Fitur penting via `get_feature_importances()`.
- `CatBoostForecaster`: Mendukung native categorical features untuk `pasar_id` dengan loss `Quantile:alpha=...`.
- `XGBoostForecaster`: Regresi kuantil XGBoost dengan objective quantile.
- `RidgeForecaster`: Regresi linear baseline dengan one-hot encoding pasar dan batas interval Gaussian 80% CI.
- `NaiveLastValueForecaster`: Persistence baseline membawa nilai terakhir yang diamati.
- `NaiveSMAForecaster`: Moving average 7-hari sebagai baseline perataan tren.
- `AutoARIMAForecaster` & `AutoETSForecaster`: Implementasi benchmark statistik univariat via StatsForecast.

### Walk-Forward Backtesting Engine ([`backtest.py`](./backtest.py))
- `resolve_commodity(commodity_name: Union[str, int]) -> Tuple[int, str]`: Normalisasi penamaan dan pencarian ID komoditas.
- `run_walk_forward_backtest(...) -> Tuple[pd.DataFrame, pd.DataFrame]`: Menjalankan evaluasi rolling-origin window maju. Mengembalikan `(df_summary, df_predictions)`.

### High-Level Experiment Runner ([`forecast_engine.py`](./forecast_engine.py))
- `ForecastEngine` & `run_experiment()`: Mengatur perbandingan multi-model, ablasi fitur (Keputran lead, kalender Islam, cuaca), dan logging eksperimen ke Weights & Biases (W&B).

### Statistical Price Anomaly Detector ([`anomaly_detector.py`](./anomaly_detector.py))
- `MarketPriceAnomalyDetector`:
  - `detect_rolling_zscore(series, window, threshold) -> pd.Series`: Left-aligned ($t-1$) rolling Z-score.
  - `detect_iqr_outliers(series, multiplier) -> pd.Series`: Tukey's IQR fences.
  - `detect_day_over_day_jump(series, threshold_pct) -> pd.Series`: Mendeteksi lonjakan persentase harian ekstrem (default: 40%).
  - `scan_dataframe(df, price_col, group_cols) -> pd.DataFrame`: Menghasilkan kolom flag boolean `is_zscore_anomaly`, `is_iqr_outlier`, `is_jump_anomaly`, dan `is_price_anomaly`.

---

## Invariants

- **Quantile Monotonicity Constraint:** Output kuantil wajib memenuhi $\text{batas\_bawah} \le \text{harga\_prediksi} \le \text{batas\_atas}$. Bila terjadi quantile crossing, dilakukan koreksi monotonik otomatis via clipping.
- **Strict Temporal Origin Isolation:** Evaluasi walk-forward hanya melatih model menggunakan data dengan tanggal sebelum titik $t$.
- **Graceful Optional Dependency Handling:** Library eksternal non-inti (`xgboost`, `catboost`, `statsforecast`) diproteksi dengan guard boolean (`HAS_XGBOOST`, dll.) sehingga sistem tetap berjalan stabil dengan model alternatif.

---

## Side Effects

- **CPU / GPU Parallelism:** Pelatihan model GBDT menggunakan thread multi-core lokal.
- **Model Deserialization / Serialization:** Membaca dan menulis file blob `.pkl` di `models/forecasting/`.
- **W&B Cloud Telemetry:** Mengirim metrik evaluasi eksperimen ke dashboard Weights & Biases bila token aktif.

---

## Verification

```bash
# Pengujian unit regresi kuantil dan engine forecasting
pytest tests/test_forecast_engine.py -v

# Pengujian unit detektor anomali statistik
pytest tests/test_anomaly_detector.py -v
```
