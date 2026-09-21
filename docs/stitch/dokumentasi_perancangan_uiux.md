# Dokumen Desain Komprehensif UI/UX — HargaWatch Surabaya

Dokumen ini memetakan seluruh siklus perancangan produk HargaWatch: Platform Intelijen Harga Pangan dan Early Warning Kota Surabaya, dari tahap riset pengguna hingga artefak visual resolusi tinggi.

---

## 1. Riset dan Pengumpulan Informasi

### A. Kebutuhan dan Karakteristik Target Pengguna
1. **Masyarakat Umum & Ibu Rumah Tangga**:
   - **Karakteristik**: Berorientasi pada efisiensi anggaran belanja dapur bulanan/mingguan, menyukai informasi ringkas dan cepat.
   - **Pain Points**: Harga pangan di pasar basah sering berbeda drastis; tidak tahu pasar mana yang paling murah tanpa harus berkeliling.
   - **Kebutuhan**: *Best Price Finder* sekali klik dan kalkulator keranjang belanja (*Smart Shopping Basket*) untuk perbandingan 6 pasar utama.

2. **Pelaku Usaha Mikro & UMKM Kuliner (Warung, Katering, PKL)**:
   - **Karakteristik**: Membeli bahan baku segar dalam volume sedang hingga besar secara berkala (subuh hari di pasar induk).
   - **Pain Points**: Lonjakan mendadak pada cabai, telur, atau minyak memangkas marjin keuntungan drastis.
   - **Kebutuhan**: Tren harga 14 hari ke depan dan informasi jam kulakan terbaik di pasar induk (misal: Pasar Keputran pada pkl 01.00–05.00 WIB).

3. **Pemerintah Kota Surabaya (Dinas Perdagangan & TPID)**:
   - **Karakteristik**: Berfokus pada stabilitas makro, pencegahan inflasi daerah, dan ketersediaan pasokan strategis.
   - **Pain Points**: Laporan manual enumerator sering terlambat dan sulit mendeteksi anomali penimbunan atau hambatan distribusi antardaerah.
   - **Kebutuhan**: *Early Warning System*, matriks risiko komoditas real-time berambang batas statistik ($Z\text{-Score} \ge 2.0\sigma$), dan rekomendasi operasi pasar terarah.

4. **Peneliti, Akademisi & Analis Pangan**:
   - **Karakteristik**: Mengandalkan metodologi kuantitatif, analisis deret waktu (*time-series*), dan korelasi multivariat.
   - **Pain Points**: Data publik sering terisolasi tanpa korelasi variabel iklim, kalender HBKN, atau jalur logistik.
   - **Kebutuhan**: Model prediktif transparan (ARIMA + Prophet + LSTM), interval kepercayaan (80% & 95%), serta ekspor data terbuka (CSV/API).

### B. Analisis Kompetitor & Benchmark
| Dimensi | PIHPS Nasional / Info Pangan Jatim | Siskaperbapo Jatim | **HargaWatch Surabaya (Solusi Kami)** |
| --- | --- | --- | --- |
| **Fokus Wilayah** | Nasional / Provinsi | Provinsi Jawa Timur | **Mikro-spasial Kota Surabaya (6 pasar utama)** |
| **Pembaruan Data** | Harian statis | Tabel harian statis | **Real-time pipeline SP2KP + verifikasi lapangan terpadu** |
| **Fitur Konsumen** | Hanya daftar tabel harga | Daftar harga | **Best Price Finder + Smart Shopping Basket multi-komoditas** |
| **Deteksi Dini** | Tidak ada indikator risiko | Tidak ada | **Sistem peringatan dini (Normal, Waspada, Surge/Anomali)** |
| **Prediksi/Forecasting** | Tidak ada | Tidak ada | **Prediksi time-series AI 7–14 hari + interval kepercayaan** |
| **Integrasi Eksternal** | Tidak ada | Tidak ada | **Korelasi curah hujan BMKG & kalender hari raya (HBKN)** |

---

## 2. User Flow dan Arsitektur Informasi

### A. User Flow: Konsumen & UMKM (Citizen Journey)
```
[Buka Website] 
       │
       ▼
[Dashboard Publik] ──► [Cari Komoditas di 'Best Price Finder']
       │                             │
       │                             ▼
       │               [Lihat Pasar Termurah & Selisih vs Rerata Kota]
       │                             │
       ▼                             ▼
[Tambah ke 'Smart Shopping Basket'] ◄┘
       │
       ▼
[Pilih Pasar Terbaik (misal: Pasar Wonokromo Hemat Rp 70rb/bln)]
       │
       ▼
[Bagikan Estimasi Belanja ke WhatsApp / Unduh PDF]
```

### B. User Flow: Pemkot & Satgas Pangan (Government Early Warning Journey)
```
[Buka Portal Khusus Analis]
       │
       ▼
[Early Warning & Commodity Risk Matrix]
       │
       ├──► [Peringatan Status Kota: Waspada / Surge pada Cabai Rawit]
       │
       ├──► [Inspeksi Disparitas Pasar: Pasar Genteng vs Pasar Keputran]
       │
       ├──► [Cek Analisis Multivariabel: Hujan Ekstrem BMKG Blitar (-34% Pasokan)]
       │
       ▼
[Klik 'Rilis Operasi Pasar Serentak' / 'Eksekusi Tindakan Disposisi Kadis']
```

### C. User Flow: Perencana Stok & Peneliti (Forecasting Journey)
```
[Pilih Tab 'Forecasting & Tren']
       │
       ▼
[Konfigurasi Horizon Prediksi: 7 Hari vs 14 Hari]
       │
       ├──► [Pilih Model: ARIMA + Prophet + LSTM Ensemble]
       │
       ├──► [Inspeksi Confidence Band (80% CI / 95% CI) & Titik Puncak H+6]
       │
       ▼
[Unduh Matriks Prediksi CSV & Rekomendasi Jadwal Gerakan Pangan Murah (GPM)]
```

---

## 3. Wireframe Logis & Tata Letak (Low-to-Mid Fidelity Blueprint)

Struktur antarmuka dirancang modular dengan standar grid 12-kolom:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo HargaWatch]  [Dashboard Publik] [Peta Spasial] [Early Warning] [Forecast]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ BANNER ALERT / NOTIFIKASI KOTA: Indikator Stabilitas & Lonjakan Harga Pagi  │
├──────────────────────────────────────────────────────┬──────────────────────┤
│ KOLOM KIRI (8 Kolom):                                │ KOLOM KANAN (4 Kolom)│
│ • Best Price Finder / Risk Matrix Table              │ • Shopping Basket /  │
│   - Kartu Komoditas Beras, Minyak, Cabai, dll        │   Panel Korelasi BMKG│
│   - Label Termurah vs Tertinggi                      │ • Total Biaya Pasar  │
│ • Grafik Deret Waktu / Peta Disparitas Geospasial    │ • Action Button      │
├──────────────────────────────────────────────────────┴──────────────────────┤
│ FOOTER RESMI: Dinas Koperasi, UKM & Perdagangan Kota Surabaya (Hotline/Open)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Desain Visual (High-Fidelity Mockup)

Empat layar visual resolusi tinggi yang telah diproduksi dan tersedia di kanvas:
1. **Dashboard Publik & Best Price Finder** (`SCREEN_8`): Antarmuka ramah warga dengan kalkulator belanja keluarga, perbandingan harga 6 pasar, dan grafik tren 14 hari.
2. **Peta Spasial & Komparasi Pasar Surabaya** (`SCREEN_6`): Tampilan pemetaan spasial disparitas harga antarpasar, rute logistik masuk, dan matriks harga komprehensif.
3. **Early Warning & Commodity Risk Matrix Pemkot** (`SCREEN_4`): Dasbor taktis pengambil kebijakan dengan matriks risiko $Z\text{-score}$, alert feed real-time, korelasi curah hujan BMKG, serta tombol disposisi operasi pasar.
4. **Forecasting & Analisis Musiman Surabaya** (`SCREEN_2`): Visualisasi kurva proyeksi time-series ensemble dengan interval kepercayaan, estimasi puncak volatilitas, dan jadwal intervensi Gerakan Pangan Murah (GPM).

*Identitas Visual & Design System*:
- **Warna Utama**: Forest Emerald (`#0d5c3a`) melambangkan ketahanan pangan dan kestabilan ekonomi.
- **Warna Status**: Merah Coral/Crimson (`#ba1a1a` lonjakan/anomali), Amber Emas (`#e08a00` waspada), Emerald Mint (`#10b981` normal/termurah).
- **Tipografi**: Plus Jakarta Sans dengan keterbacaan tinggi pada angka dan tabel numerik.

---

## 5. Hubungan Interaksi & Prototipe (Prototyping Roadmap)

Setiap layar yang ada di kanvas memiliki arsitektur navigasi global terpadu yang saling terhubung:
1. **Navigasi Global Header**:
   - Tab **Dashboard Publik** mengarah ke `SCREEN_8`.
   - Tab **Peta & Disparitas Pasar** mengarah ke `SCREEN_6`.
   - Tab **Early Warning & Risiko** mengarah ke `SCREEN_4`.
   - Tab **Forecasting & Tren** mengarah ke `SCREEN_2`.
2. **Titik Interaksi Silang Antarlayar (Cross-link Interactions)**:
   - Dari banner alert di Dashboard Publik: tombol *"Cek Grafik Tren"* menghubungkan warga ke analitik tren dan forecasting.
   - Dari Peta Spasial: tombol *"Rancang Operasi Pasar"* langsung mengarahkan pengguna ke instrumen intervensi di matriks Early Warning.
   - Dari Matriks Early Warning: tombol *"Eksekusi Tindakan"* dan *"Setujui Rekomendasi"* memicu simulasi pasokan di layar Forecasting & Simulasi.
