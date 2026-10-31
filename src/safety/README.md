# Early Warning System & Alerting (`src/safety/`)

`src/safety/` implements the adaptive 4-pillar Early Warning System (EWS), plateau amnesia resilience, spatial disparity calculations, and automated emergency notification dispatching for **HargaWatch Surabaya**.

---

## Overview

Modul keselamatan dan deteksi dini krisis pangan yang menghitung matriks risiko gabungan (skala 0 - 100 poin) untuk 37 komoditas pangan aktif di seluruh pasar Kota Surabaya:
- **Pilar 1 (Tren Historis Adaptif - 20 Poin):** Mengukur momentum kenaikan harga 7 hari berdasarkan cluster volatilitas komoditas.
- **Pilar 2 (Volatilitas Pasar & Anti-Amnesia Plateau - 20 Poin):** Mendeteksi gejolak jangka pendek terhadap jangka panjang ($std_{7d}/std_{30d}$) dengan Z-score fallback ($Z \ge 2.0$) untuk mencegah kelemahan saat harga bertahan di plateau tinggi.
- **Pilar 3 (Disparitas Spasial Universal - 20 Poin):** Mengevaluasi disparitas margin Pasar Induk Keputran untuk komoditas hortikultura, serta dispersi spasial antar 5 pasar satelit untuk komoditas non-hortikultura.
- **Pilar 4 (Proyeksi Bahaya Machine Learning - 40 Poin):** Mengevaluasi proyeksi kenaikan harga median ($p_{50}$) dan tail risk kuantil atas ($p_{90}$) terhadap batas historis 90 hari.

Kategori Status:
- 🟢 `NORMAL`: Skor $< 40$
- 🟡 `WASPADA`: Skor $40 - 69$
- 🔴 `TINGGI` (Siaga Tinggi): Skor $\ge 70$

---

## Interface

### EWS Scoring Engine ([`early_warning.py`](./early_warning.py))
- `compute_early_warning_scores(df_current_features: pd.DataFrame, df_forecasts: pd.DataFrame) -> pd.DataFrame`: Menghitung skor masing-masing dari 4 pilar, menjumlahkan total skor risiko, dan menentukan status warning untuk setiap pasangan pasar-komoditas.
- `generate_ews_summary_dataframe(df_predictions: pd.DataFrame) -> pd.DataFrame`: Memformat output prediksi menjadi ringkasan tabular EWS dengan nama pasar dan komoditas terbaca manusia.
- `evaluate_ews_performance(df_ews_summary, spike_threshold_pct=10.0, alarm_level="TINGGI", horizon_days=7) -> pd.DataFrame`: Mengevaluasi performa historis sinyal bahaya (Recall $\ge 90\%$, False Alarm Rate $\le 20\%$, Lead Time $\ge 5-7$ hari).

### Emergency Alert Generator ([`alert_generator.py`](./alert_generator.py))
- `generate_telegram_markdown_alert(df_ews_today, dict_komoditas, dict_pasar) -> Optional[str]`: Memfilter status `TINGGI` dan `WASPADA`, menyusun pesan Markdown terstruktur yang memuat nama pasar, besaran kenaikan harga, pilar pemicu utama, dan rekomendasi aksi TPID. Mengembalikan `None` jika seluruh komoditas berstatus `NORMAL`.
- `format_pilar_pemicu(row: pd.Series) -> str`: Mengidentifikasi pilar pemicu dominan yang menyumbang $\ge 18-20$ poin pada skor bahaya.

---

## Invariants

- **Anti-Amnesia Plateau Resilience:** Saat krisis berkepanjangan di mana harga tertahan di puncak ekstrem, rasio standar deviasi $std_{7d}/std_{30d}$ bisa mengecil mendekati 0. Sistem mengaktifkan trigger Z-score ($Z \ge 2.0$) agar Pilar 2 tetap memberikan 20 poin penuh dan mencegah false normal.
- **Universal Spatial Coverage:** Untuk komoditas non-Keputran (Beras, Minyak Goreng, Daging Sapi), Pilar 3 mengevaluasi dispersi harga antar 5 pasar satelit sehingga pilar disparitas spasial tetap beroperasi secara universal.
- **Alert Fatigue Prevention:** Komoditas berstatus `NORMAL` tidak pernah dimasukkan ke dalam siaran notifikasi darurat Telegram.

---

## Side Effects

- **Telegram Bot Dispatch:** Mengirim pesan krisis ke grup Satgas Pangan via HTTPS API Telegram.
- **Database Upsert:** Menulis rekaman skor risiko harian ke tabel Supabase `fact_early_warning`.

---

## Verification

```bash
# Jalankan test suite adaptif EWS dan pencegahan amnesia plateau
pytest tests/test_ews_adaptive.py -v
```
