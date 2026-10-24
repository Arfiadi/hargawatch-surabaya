# Metodologi Early Warning System (EWS) Adaptif — HargaWatch Surabaya

Dokumen ini menjabarkan arsitektur logika dan metodologi **Early Warning System (EWS) Adaptif** yang beroperasi di atas hasil proyeksi peramalan deret waktu dan dinamika spasial pasar di Kota Surabaya.

Tujuan EWS bukan untuk memprediksi angka pasti (Rp/kg), melainkan **menerjemahkan rentang prediksi dan anomali pasar ke dalam sinyal peringatan bahaya (NORMAL, WASPADA, TINGGI)** yang adil dan objektif bagi seluruh 38 komoditas pangan Kota Surabaya.

---

## 1. Konsep Dasar EWS Berbasis Komposit Adaptif (0 – 100 Poin)

Sistem menggunakan **Sistem Skor Komposit dengan skala 0 hingga 100 poin** yang diekstraksi dari 4 pilar utama dengan pembobotan tetap:
- **Pilar 1 (Tren):** 20 Poin
- **Pilar 2 (Volatilitas):** 20 Poin
- **Pilar 3 (Disparitas Spasial):** 20 Poin
- **Pilar 4 (Proyeksi Kuantil Risiko ML):** 40 Poin

---

### Pilar 1: Skor Tren Historis Adaptif (Bobot 20 Poin)
Mengukur momentum kenaikan harga 7 hari terakhir (`pct_change_7d`). Ambang batas disesuaikan secara dinamis menurut koefisien variasi (*Coefficient of Variation - CV*) dan elastisitas komoditas:

| Klaster Komoditas | Cakupan Komoditas | Ambang 20 Poin | Ambang 10 Poin | Rasional Domain |
|:---|:---|:---:|:---:|:---|
| **Volatil (Hortikultura)** | Cabai Rawit, Cabe Besar, Keriting, Bawang Merah, Tomat, Buncis | **$\ge 15.0\%$** | **$\ge 8.0\%$** | Mencegah *alarm fatigue* pada komoditas sayuran yang wajar berfluktuasi harian. |
| **Moderat & Musiman** | Telur Ayam Ras, Daging Ayam, Bawang Putih, Kentang, Wortel, Ikan | **$\ge 8.0\%$** | **$\ge 4.0\%$** | Cukup peka terhadap gangguan pasokan pakan ternak atau siklus panen. |
| **Bahan Pokok / HET / FMCG** | Beras Medium/Premium, Minyakita, Gula Pasir, Daging Sapi, Garam | **$\ge 4.0\%$** | **$\ge 2.0\%$** | Pangan pokok sangat inelastis; kenaikan beras 4% ($\approx$ Rp 600/kg) sudah berdampak krisis daya beli warga. |

---

### Pilar 2: Skor Volatilitas & Anti-Amnesia Plateau (Bobot 20 Poin)
Menggabungkan **Rasio Volatilitas Dinamis** dengan **Z-Score Level Harga Historis** (*Dual-Trigger*) untuk mencegah *Amnesia Krisis* saat harga bertahan mahal berminggu-minggu di puncak krisis (*plateau*):

$$\text{Ratio}_{\text{vol}} = \frac{\sigma_{7d}}{\sigma_{30d} + \epsilon}, \quad Z_{\text{level}} = \frac{P_t - \mu_{30d}}{\sigma_{30d} + \epsilon}$$

*   **Skor 20 Poin:** Terpenuhi jika $\text{Ratio}_{\text{vol}} \ge 1.5$ **ATAU** $Z_{\text{level}} \ge 2.0\sigma$.
*   **Skor 10 Poin:** Terpenuhi jika $\text{Ratio}_{\text{vol}} \ge 1.1$ **ATAU** $Z_{\text{level}} \ge 1.2\sigma$.
*   *Keunggulan:* Pada awal lonjakan krisis, rasio volatilitas menyala. Ketika krisis berkepanjangan dan harga flat tinggi di puncak, $Z_{\text{level}}$ tetap menyala menjaga alarm tetap aktif sampai harga benar-benar turun ke batas normal.

---

### Pilar 3: Skor Disparitas Spasial Universal (Bobot 20 Poin)
Menghilangkan ketergantungan eksklusif pada Pasar Keputran sehingga aktif untuk seluruh 38 komoditas melalui pendekatan hibrida:

1. **Untuk Komoditas yang Tercatat di Pasar Keputran (Pasar Induk Sayur):**
   * Mengukur penipisan marjin grosir Keputran terhadap rata-rata pasar eceran:
     $$\text{Margin} = \frac{P_{\text{eceran}} - P_{\text{keputran}}}{P_{\text{eceran}}} \times 100\%$$
   * Margin $< 5.0\% \to$ **20 poin**; Margin $\le 10.0\% \to$ **10 poin**.
2. **Untuk Komoditas Non-Keputran (Beras, Daging, Minyak, Ikan, Garam, dll.):**
   * Mengukur **Disparitas Spasial Antar-Pasar Surabaya (*Spatial Price Spread*)**:
     $$\text{Spread} = \frac{P_{\text{max}} - P_{\text{min}}}{P_{\text{mean}}} \times 100\%$$
   * Spread $\ge 15.0\% \to$ **20 poin**; Spread $\ge 8.0\% \to$ **10 poin**. Menandakan adanya fragmentasi distribusi atau penimbunan lokal.

---

### Pilar 4: Skor Proyeksi Bahaya Masa Depan (Bobot 40 Poin)
Menggabungkan proyeksi titik median model peramalan dengan evaluasi risiko ekstrem batas atas kuantil $p_{90}$:

*   **Logika A — Kenaikan Tren Masa Depan (20 Poin):**
    *   Volatil: Median forecast $H+7$ diproyeksikan naik $\ge 15.0\%$ (20 pt) atau $\ge 8.0\%$ (10 pt).
    *   Moderat: Median forecast $H+7$ diproyeksikan naik $\ge 8.0\%$ (20 pt) atau $\ge 4.0\%$ (10 pt).
    *   Pokok/HET: Median forecast $H+7$ diproyeksikan naik $\ge 4.0\%$ (20 pt) atau $\ge 2.0\%$ (10 pt).
*   **Logika B — Tail-Risk Rekor Tertinggi 90 Hari (20 Poin):**
    *   Jika Batas Atas estimasi kuantil $p_{90}$ menembus rekor harga tertinggi 3 bulan terakhir ($p_{90} > \text{Max}_{90d}$).

---

## 2. Klasifikasi Status Peringatan & Standar Operasional (SOP)

Total skor komposit ($0 - 100$) diklasifikasikan ke dalam 3 status:

| Status | Total Skor | Arti Operasional | Rekomendasi Tindakan Satgas Pangan & TPID |
| :---: | :---: | :---| :---|
| 🟢 **NORMAL** | **0 – 39** | Pasokan stabil, fluktuasi harian wajar. | Pemantauan rutin; tidak diperlukan intervensi pasar. |
| 🟡 **WASPADA** | **40 – 69** | Terindikasi adanya ketidakstabilan pasokan atau disparitas antar-pasar. | **High-Recall Screening:** Verifikasi stok fisik di distributor/Pasar Keputran; siapkan stok cadangan Bulog/BUMD. |
| 🔴 **TINGGI** | **70 – 100** | Krisis harga terkonfirmasi multi-pilar (level harga ekstrem & tren masa depan). | **High-Precision Alert:** Segera gelar **Operasi Pasar Murah (OPM)** terarah pada pasar dengan harga tertinggi. |

---

## 3. Metrik Evaluasi Kinerja EWS (Backtesting SOP)

Sistem EWS dievaluasi secara berkala menggunakan metrik deteksi anomali:
1. **Recall (Sensitivitas Krisis):** Target **$\ge 90\%$** pada status WASPADA.
2. **False Alarm Rate (FAR):** Target **$\le 25\%$** pada status TINGGI untuk mencegah alarm palsu.
3. **Lead Time Peringatan:** Target **Minimal 5 hingga 7 Hari (H+7)** sebelum puncak krisis terjadi.

---
*Implementasi teknis: [`src/safety/early_warning.py`](file:///d:/ARFI/Kuliah/Project/project-semester5/hargawatch-surabaya/src/safety/early_warning.py).*
