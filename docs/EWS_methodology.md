# Metodologi Early Warning System (EWS) - HargaWatch Surabaya

Dokumen ini menjabarkan arsitektur logika dan metodologi *Early Warning System* (Sistem Peringatan Dini) yang berjalan di atas hasil prediksi Model Machine Learning Terpilih.

Tujuan EWS bukan untuk memprediksi angka pasti (Rp/kg), melainkan **menerjemahkan rentang prediksi ke dalam sinyal peringatan bahaya (NORMAL, WASPADA, TINGGI)** yang mudah dipahami oleh Dinas Perdagangan dan Satgas Pangan untuk pengambilan keputusan Operasi Pasar.

---

## 1. Konsep Dasar EWS Berbasis Komposit (Composite Scoring)

Sebuah peringatan tidak boleh hanya bergantung pada satu variabel. Lonjakan harga cabai 10% di bulan Desember (musim hujan) memiliki makna bahaya yang berbeda dengan lonjakan 10% di bulan tenang.

Oleh karena itu, EWS HargaWatch menggunakan **Sistem Skor Komposit dengan skala 0 hingga 100 poin**, yang diekstraksi dari 4 pilar utama: Tren, Volatilitas, Disparitas, dan Proyeksi Masa Depan.

### Pilar 1: Skor Tren Historis (Bobot 20 Poin)
Mengukur momentum pergerakan harga murni ke belakang (*backward-looking*).
*   **Logika:** Berapa persen kenaikan harga hari ini dibandingkan tepat 7 hari yang lalu (`pct_change_7d`)?
*   **Threshold:**
    *   Kenaikan $\ge$ 10% $\rightarrow$ **20 poin**
    *   Kenaikan 5% s.d. 9.9% $\rightarrow$ **10 poin**
    *   Kenaikan < 5% atau harga turun $\rightarrow$ **0 poin**

### Pilar 2: Skor Volatilitas / Kepanikan Pasar (Bobot 20 Poin)
Mengukur apakah pasar sedang stabil atau sedang panik (pergerakan harga liar).
*   **Logika:** Membandingkan volatilitas jangka pendek (`rolling_std_7d`) dengan volatilitas jangka menengah (`rolling_std_30d`). Jika volatilitas 7 hari tiba-tiba melesat jauh melebihi rata-rata 30 hari, berarti terjadi guncangan pasokan (*supply shock*).
*   **Threshold:**
    *   Rasio (Std 7d / Std 30d) $\ge$ 1.5 $\rightarrow$ **20 poin**
    *   Rasio (Std 7d / Std 30d) 1.1 s.d. 1.49 $\rightarrow$ **10 poin**
    *   Rasio $\le$ 1.0 $\rightarrow$ **0 poin**

### Pilar 3: Skor Disparitas Pasar Grosir vs Eceran (Bobot 20 Poin)
Memanfaatkan arsitektur *Multi-Market* HargaWatch Surabaya.
*   **Logika:** Pasar Induk Keputran adalah pusat grosir. Biasanya, Keputran memiliki selisih (margin) yang lebar dan lebih murah dari pasar eceran (seperti Wonokromo). Jika harga Keputran tiba-tiba meroket dan menyamai harga Wonokromo, itu adalah **indikator absolut bahwa stok dari petani sedang kosong**.
*   **Threshold:**
    *   Margin Keputran vs Rata-rata Eceran menipis drastis (< 5%) $\rightarrow$ **20 poin**
    *   Margin menipis menengah (5% - 10%) $\rightarrow$ **10 poin**
    *   Margin normal (> 10%) $\rightarrow$ **0 poin**

### Pilar 4: Skor Proyeksi Bahaya Masa Depan (Bobot 40 Poin)
Ini adalah jantung EWS. Menggunakan *output* dari mesin *Machine Learning* (Model Machine Learning Quantile Regression) untuk melihat 7 hari ke depan.
*   **Logika A - Prediksi Utama (20 Poin):** Jika median tebakan ML (Kuantil 50) memprediksi harga minggu depan akan lebih mahal 15% dari harga hari ini.
*   **Logika B - Risiko Ekstrem (20 Poin):** Jika Batas Atas prediksi ML (Kuantil 90) menembus harga rekor tertinggi 3 bulan terakhir (*All-Time 90-Day High*). Ini mendeteksi ancaman pecah rekor harga.

---

## 2. Klasifikasi Status Peringatan

Setelah keempat pilar dijumlahkan (Total Maksimal = 100 poin), skor dikonversi menjadi 3 status peringatan warna:

| Status | Total Skor | Arti & Rekomendasi Tindakan (SOP) |
| :---: | :---: | :--- |
| 🟢 **NORMAL** | **0 – 39** | Pasokan aman. Dinamika harga wajar harian. Tidak diperlukan intervensi pasar. |
| 🟡 **WASPADA** | **40 – 69** | Terindikasi adanya ketidakstabilan pasokan atau panik beli (*panic buying*). Dinas Perdagangan harus meningkatkan pemantauan stok fisik di Pasar Keputran. |
| 🔴 **TINGGI / BAHAYA** | **70 – 100** | Krisis harga (*price shock*) tervalidasi oleh historis dan proyeksi masa depan. Sinyal kuat untuk segera menggelar **Operasi Pasar Murah (OPM)**. |

---

## 3. Metrik Evaluasi Kinerja EWS

Untuk membuktikan bahwa sistem EWS ini layak beroperasi, EWS dievaluasi (Backtesting) pada data historis masa lalu menggunakan metrik *Anomaly Detection*:

1.  **Recall (Sensitivity / True Positive Rate):**
    *   Mengukur berapa persentase krisis nyata di dunia nyata (contoh: Krisis Cabai Pra-Ramadan 2024) yang **berhasil dinyalakan alarmnya (Tinggi)** oleh sistem HargaWatch.
    *   Target: **$\ge$ 90%** (Kita tidak boleh kecolongan/gagal mendeteksi krisis).
2.  **False Alarm Rate (FAR / Precision Drop):**
    *   Mengukur seberapa sering sistem meneriakkan status "TINGGI", padahal seminggu kemudian pasar aman dan harga stabil.
    *   Target: **$\le$ 20%** (Untuk menghindari kelumpuhan kewaspadaan / *boy who cried wolf syndrome*).
3.  **Lead Time (Waktu Jeda Peringatan):**
    *   Jarak hari antara **pertama kali alarm TINGGI berbunyi** hingga **hari puncak harga ekstrem terjadi**.
    *   Target: **Minimal 5 hingga 7 Hari**. Jika alarm baru berbunyi pada hari yang sama dengan puncak krisis, itu adalah sistem pelaporan (berita), bukan Peringatan Dini.

---
*Dokumen ini merupakan kerangka kerja algoritmik EWS. Implementasi kodenya berada di dalam `src/safety/early_warning.py`.*
