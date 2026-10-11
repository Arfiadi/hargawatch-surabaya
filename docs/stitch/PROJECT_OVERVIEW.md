# Project Overview: HargaWatch Surabaya (Google Stitch Blueprint)
> **Platform Intelijen Harga Pangan dan Early Warning Kota Surabaya**  
> *Spesifikasi Desain & Master Prompt Context untuk Google Stitch Dashboard Generator*

---

## 1. Metadata Proyek & Visi Sistem

| Parameter | Nilai / Deskripsi Spesifikasi |
| :--- | :--- |
| **Nama Produk** | **HargaWatch** |
| **Komponen Utama** | HargaWatch — Surabaya Food Price Intelligence & Early Warning |
| **Judul Proyek** | HargaWatch — Platform Intelijen Harga Pangan dan Early Warning Kota Surabaya |
| **Wilayah Fokus** | **Kota Surabaya**, menjangkau 6 pasar tradisional & induk strategis: *Pasar Keputran (Induk), Pasar Wonokromo, Pasar Genteng, Pasar Pucang Anom, Pasar Tambahrejo, dan Pasar Soponyono*. |
| **User Utama** | 1. **Masyarakat Umum / Konsumen / Ibu Rumah Tangga**: Belanja harian, hemat anggaran dapur.<br>2. **Pedagang / UMKM Kuliner**: Perencanaan kulakan bahan baku, margin laba.<br>3. **Pemerintah Kota Surabaya & Stakeholder**: Dinas Perdagangan (Disperindag), Dinas Ketahanan Pangan dan Pertanian (DKPP), TPID, Satgas Pangan.<br>4. **Peneliti & Analis Pangan**: Eksplorasi data time-series, ekonometrika, dan pemodelan ML. |
| **Tujuan Utama** | Menyediakan harga pangan terkini, perbandingan harga antar pasar secara spasial, tren historis, prediksi harga 7–14 hari ke depan, dan deteksi dini (*Early Warning System*) lonjakan harga agar warga belanja lebih cerdas dan pemerintah dapat mengambil intervensi stabilisasi pasokan tepat sasaran. |
| **Komoditas Pantauan** | Beras (Medium & Premium), Gula Pasir, Minyak Goreng (Curah, Kemasan, Minyakita), Telur Ayam Ras, Daging Ayam Ras, Daging Sapi, Cabai Rawit Merah, Cabai Merah Besar, Bawang Merah, Bawang Putih, Sayuran Pokok, serta komoditas strategis lainnya. |
| **Sumber Data & Frekuensi** | **SISKAPERBAPO Disperindag Jatim** (scraping harian harga 6 pasar konsumen + harga produsen), **Open-Meteo** (cuaca harian, reanalysis ERA5), **BPS** (inflasi bulanan), plus kalender libur nasional/cuti bersama (pustaka `holidays` + SKB 3 Menteri). Riwayat kontinu sejak **Januari 2020** (±2.435 hari). |
| **Data Pendukung / Kovariat** | Curah hujan Open-Meteo untuk Surabaya & waktu diskrit menuju HBKN (Hari Besar Keagamaan Nasional: Ramadan, Idulfitri, Iduladha, Natal & Tahun Baru), inflasi bulanan BPS, dan harga produsen (PS Bendul Mrisi, RPH Pegirikan) sebagai indikator pasokan. |
| **Integritas Pipeline** | `Scrape/Ingest (SISKAPERBAPO, Open-Meteo, BPS)` → `Validation & Cleaning` → `Imputasi dual-price (harga_asli vs harga_imputasi, diberi flag)` → `Standardisasi Komoditas & Pasar` → `Supabase PostgreSQL (Silver Layer)` → `Analytics & ML Engine (Forecast + Early Warning)` → `Gold Layer` → `Dashboard / UI`. Update harian otomatis 07:00 via Windows Task Scheduler dengan mekanisme *catch-up* tanggal bolong (`scripts/update_catchup.py`, idempotent, jejak mundur maks. 400 hari). |

---

## 2. Arsitektur Informasi & Pengalaman Pengguna (Dual-Mode Interface)

Dashboard dirancang dengan pendekatan **Dual-Mode Switcher** di bagian navigasi atas, memberikan pengalaman yang tepat sesuai kebutuhan pengguna:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HARGAWATCH SURABAYA                           │
│  [Kota Surabaya]  ● Live API: Updated 10 Menit Lalu   [ Publik | Analis Pemkot ]│
└─────────────────────────────────────────────────────────────────────────────┘
          │                                                  │
          ▼                                                  ▼
┌───────────────────────────────┐          ┌──────────────────────────────────┐
│        PUBLIC DASHBOARD       │          │     GOVERNMENT / ANALYST VIEW    │
│  - Today's Price Ticker       │          │  - Multi-Criteria Early Warning  │
│  - Best Price Finder          │          │  - Commodity Risk Matrix         │
│  - Smart Shopping Basket      │          │  - Spatial Market Disparity Map  │
│  - Price Trend & Mini-Forecast│          │  - 7–14 Days ML Forecast + CI    │
│  - Public Surge Warning Badge │          │  - Anomaly & Volatility Analysis │
└───────────────────────────────┘          └──────────────────────────────────┘
```

### A. Persona Publik (Masyarakat & UMKM Kuliner)
- **Fokus**: Kecepatan pencarian harga, kemudahan navigasi, visualisasi perbandingan harga yang mudah dibaca awam, serta rekomendasi pasar paling hemat.
- **Tone**: Hangat, informatif, transparan, actionable (hemat biaya riil).

### B. Persona Analis & Pemerintah (Pemkot Surabaya & TPID)
- **Fokus**: Kepadatan data metrik (*cockpit/dense*), matriks risiko, batas ambang statistik ($Z\text{-Score}$ anomali), korelasi variabel cuaca, dan tombol disposisi kebijakan (misal: rekomendasi rilis *Gerakan Pangan Murah / Operasi Pasar*).
- **Tone**: Presisi, analitis, profesional, andal untuk pengambil keputusan.

---

## 3. Rincian Fitur Utama (Spesifikasi Fungsional)

### 1. Today's Price & KPI Snapshot
- Menampilkan kartu harga harian per kilogram/satuan resmi.
- Indikator selisih harga harian (*Day-over-Day / DoD*) dan mingguan (*Week-over-Week / WoW*) dengan penanda warna netral hijau (turun/hemat) dan merah lembut (naik).
- Rerata harga seluruh pasar Surabaya dibandingkan dengan *Harga Acuan Penjualan (HAP)* atau *Harga Eceran Tertinggi (HET)* pemerintah.

### 2. Market Comparison & Spatial Analytics (Peta Pasar Surabaya)
- Peta sebaran spasial interaktif 6 pasar utama Kota Surabaya (Wonokromo, Keputran, Genteng, Pucang Anom, Tambahrejo, Soponyono).
- Titik pasar memiliki indikator visual status harga (*Relatif Rendah / Rata-rata / Relatif Tinggi*).
- Tabel disparitas harga lintas pasar untuk komoditas yang sama: memperlihatkan perbedaan harga kulakan (Pasar Keputran) vs pasar eceran konsumen (Pasar Genteng).

### 3. Best Price Finder (Pencari Harga Terbaik)
- Dropdown pencarian komoditas cerdas.
- Seketika mengurutkan pasar dengan harga terendah ke tertinggi.
- Menampilkan selisih nominal penghematan dibanding rerata harga kota (misal: *"Pasar Wonokromo: Rp 48.000/kg — Hemat Rp 6.500 dibanding rerata kota"*).

### 4. Smart Shopping Basket (Kalkulator Keranjang Belanja Cerdas)
- Pengguna memilih kombinasi bahan belanja dapur (misal: 5 kg Beras Premium + 1 kg Telur + 0.5 kg Cabai Rawit + 0.5 kg Bawang Merah).
- Sistem menghitung simulasi estimasi total pengeluaran belanja pada masing-masing pasar di Surabaya.
- Memberikan rekomendasi pasar mana yang paling efisien untuk seluruh keranjang tersebut secara komprehensif.

### 5. Price Trend & Historical Analytics
- Visualisasi grafik tren deret waktu (Rentang: 7 Hari, 30 Hari, 90 Hari, 1 Tahun).
- Moving Average (MA-7 dan MA-30) untuk menghaluskan fluktuasi jangka pendek.
- Analisis metrik: Persentase perubahan harga harian/mingguan/bulanan, indeks volatilitas (*Standard Deviation & Coefficient of Variation*), dan dekomposisi musiman.

### 6. Price Volatility Index
- Pengelompokan komoditas: **Stabil** (Beras, Gula), **Moderat** (Daging Ayam, Telur), dan **Volatilitas Tinggi** (Cabai Rawit, Bawang Merah).
- Membantu konsumen mengatur jadwal belanja dan membantu analis mendeteksi komoditas rentan guncangan pasokan.

### 7. Time-Series Forecasting (7–14 Hari)
- Proyeksi harga jangka pendek (7 sampai 14 hari ke depan) menggunakan **Global Multi-Market LightGBM Quantile Regression** (ensemble lintas pasar/komoditas), dibandingkan dengan model baseline.
- Metrik eksperimen terukur: **WAPE 13.98%** (perlu verifikasi ulang pada backtest produksi).
- Dilengkapi **Confidence Intervals (80% & 95% Confidence Band)** yang transparan untuk menunjukkan rentang ketidakpastian prediksi harga.
- Menampilkan titik estimasi puncak (*peak price date*) untuk kewaspadaan intervensi.
- *Status implementasi: logika eksperimen di `notebook/forecasting_experiments.ipynb`; porting produksi ke `src/models/` + `scripts/run_forecasting.py` masih berjalan (draf). Lihat `ROADMAP.md`.*

### 8. External Variables & Covariates Explorer
- Panel pengujian korelasi variabel eksternal terhadap harga:
  - Curah hujan & cuaca harian Surabaya (Open-Meteo, reanalysis ERA5).
  - Kalender Hari Besar Keagamaan Nasional (HBKN: H-14 hingga H+7 Idulfitri, Iduladha, Natal/Tahun Baru).
  - Laju inflasi pangan lokal BPS.
- Disajikan secara metodologis sebagai faktor uji penjelas, bukan klaim kausalitas mutlak tanpa uji empiris.

### 9. Anomaly Detection & Price Surge Alert
- Mendeteksi lonjakan harga yang berada di luar ambang batas distribusi historis wajar ($Z\text{-Score} \ge 2.0\sigma$ atau kenaikan $>10\%$ dalam 48 jam).
- **Price Surge Alert Banner**: Notifikasi naratif yang jelas, contoh:  
  > *"PERINGATAN: Harga Cabai Rawit Merah meningkat +22.4% dalam 7 hari terakhir di 4 pasar utama (tertinggi di Pasar Genteng Rp 82.000/kg) dan diproyeksikan tetap tinggi hingga 5 hari ke depan."*
- **Early Warning System (EWS)** memakai skor risiko komposit 0–100 dari 4 sub-skor (0–25 tiap komponen): **skor_tren** (momentum harga 7 hari), **skor_volatilitas** (varians 14 hari vs baseline), **skor_anomali** (disparitas lintas pasar vs median kota), **skor_prediksi** (besaran lonjakan terproyeksi model forecasting). Klasifikasi: **NORMAL (< 40)**, **WASPADA (40–69)**, **TINGGI (>= 70)** — implementasi di `src/safety/early_warning.py`, output ke `fact_early_warning` (Gold Layer).

### 10. Commodity Risk Map & Early Warning Matrix
- Matriks tabular visual: **Komoditas (Baris) × Pasar (Kolom)**.
- Status risiko 3 tingkat yang transparan:
  - **NORMAL**: Pergerakan harga dalam rentang batas musiman wajar.
  - **WASPADA**: Terjadi percepatan kenaikan harga (WoW $>5\%$) atau peningkatan volatilitas.
  - **TINGGI / SIAGA**: Deviasi signifikan, anomali statistik terdeteksi, atau disparitas antar pasar melebihi batas toleransi.
- Dilengkapi ringkasan rekomendasi tindakan untuk Satgas Pangan / Pemkot (misal: Penjadwalan Operasi Pasar, Fasilitasi Distribusi).

### 11. Seasonal Insights
- Analisis pola siklus harga menjelang Ramadan, Idulfitri, dan Nataru berdasarkan data historis tahun-tahun sebelumnya.
- Memetakan waktu kapan harga biasanya mulai merangkak naik dan kapan harga kembali normal ke titik ekuilibrium.

---

## 4. Stitch Design System Specification (Semantic Design Rules)

File ini mengadopsi standar **Stitch Design Taste** untuk menjamin hasil generasi visual tidak terasa seperti template AI murahan:

### A. Atmosphere & Vibe
- **Mode Publik**: *Balanced & Clear* (Density 5/10, Variance 5/10, Motion 5/10). Tata letak lega, kontras tajam, teks sangat terbaca, ramah bagi ibu rumah tangga dan pelaku UMKM.
- **Mode Analis Pemkot**: *High-Precision Cockpit* (Density 8/10, Variance 6/10, Motion 4/10). Informasi terstruktur rapat, pemanfaatan font Monospace untuk nominal rupiah dan metrik statistik, tidak ada elemen dekoratif yang mubazir.

### B. Color Palette & Roles (Strict Calibration)
*Catatan: Dilarang menggunakan warna neon/glow ungu khas AI generik. Gunakan palet slate/zinc berpadu dengan aksen emerald andalan stabilisasi pangan.*

- **Canvas Background**: `Deep Slate Canvas` (`#0F172A`) atau `Pure Off-White` (`#F8FAFC`) untuk mode terang.
- **Surface & Cards**: `Subtle Slate Surface` (`#1E293B` pada dark / `#FFFFFF` pada light) dengan garis tepi *1px Whisper Border* (`#334155` / `#E2E8F0`).
- **Text Primary**: `Crisp Slate Light` (`#F1F5F9`) / `Charcoal Ink` (`#0F172A`).
- **Text Secondary & Muted**: `Muted Steel` (`#94A3B8`) / `Zinc Slate` (`#64748B`).
- **Primary Accent (Brand)**: `Emerald Pangan` (`#10B981`) — melambangkan kesegaran pangan, efisiensi harga, dan status aman.
- **Semantic Warning (Waspada)**: `Amber Harvest` (`#F59E0B`) — peringatan waspada, kenaikan harga moderat.
- **Semantic Danger / Surge (Tinggi)**: `Crimson Alert` (`#EF4444`) — lonjakan harga anomali, status siaga operasi pasar.
- **Semantic Secondary Accent**: `Cobalt Data` (`#3B82F6`) — untuk kurva proyeksi forecasting dan batas interval kepercayaan.

### C. Typography Rules
- **Display & Header**: `Geist` atau `Outfit` — *track-tight*, controlled scale, ketegasan melalui weight (semi-bold 600 / bold 700), bukan sekadar ukuran raksasa.
- **Body & Controls**: `Satoshi` atau `Geist` — jarak baris nyaman (*relaxed leading*), batas lebar kolom maksimal 65 karakter per baris.
- **Numbers, Prices, & Metrics**: `Geist Mono` atau `JetBrains Mono` — wajib digunakan pada semua harga Rupiah, persentase perubahan, tanggal, dan koordinat pasar agar angka tersusun rapi (*tabular lining*).
- **Aturan Terlarang**: Dilarang menggunakan font *Inter* standar dan dilarang menggunakan font *Serif* klasik (*Times New Roman*, *Garamond*) di antarmuka dashboard.

### D. Component Stylings
- **Cards**: Sudut lengkung terukur (`rounded-xl` atau `rounded-2xl`), bayangan halus terbaur (*diffused shadow*). Dilarang membuat kartu di dalam kartu bertingkat tiga (*nested cards anti-pattern*).
- **Buttons**: Bentuk solid bersih, feedback tactile (-1px translate saat active), kontras tinggi. Dilarang menggunakan *outer glow* atau gradien neon.
- **Badges Status**: Label status risiko (Normal, Waspada, Tinggi) menggunakan background tinted 10-15% opacity dengan teks kontras tinggi dan dot indikator berkedip halus.
- **Charts**: Garis grafik tipis dan tegas (stroke 2px), area fill gradien transparan sangat lembut (5% hingga 0% opacity), tooltip informatif berbasis card monokrom.
- **Loading & Empty States**: Skeletal shimmering yang mencerminkan layout kartu secara akurat, dilarang menampilkan spinner lingkaran berputar biasa.

### E. Explicit Anti-Patterns (Dilarang dalam Stitch)
1. **Dilarang menggunakan emoji** pada header, judul kartu, atau label status. Gunakan icon SVG minimalis (Lucide icons).
2. **Dilarang menggunakan warna hitam pekat** (`#000000`) — selalu gunakan `Off-Black` / `#0F172A`.
3. **Dilarang menggunakan efek neon purple glow** atau gradien ungu/pink khas AI klise.
4. **Dilarang menggunakan angka rekayasa klise** (seperti *99.9% Akurasi* atau *100% Realtime*). Gunakan angka realistis: *Rata-rata error MAPE: 4.2%*, *Update terakhir: 12 menit lalu*.
5. **Dilarang menggunakan susunan 3 kolom kartu identik yang membosankan** di seluruh halaman — buat variasi asimetris fungsional (misal: 8 kolom untuk visualisasi utama, 4 kolom untuk aksi cepat).

---

## 5. Blueprint Layar Dashboard untuk Google Stitch

Setiap layar di bawah dapat digenerate secara spesifik pada Google Stitch menggunakan panduan arsitektur berikut:

### Layar 1: Public Consumer Dashboard (`05_dashboard_publik.html`)
- **Tujuan**: Membantu ibu rumah tangga dan warga Surabaya mengetahui harga hari ini dan menemukan pasar paling murah dalam < 10 detik.
- **Struktur Halaman**:
  1. **Top Banner**: Informasi pembaruan data real-time, status API pasar Surabaya, dan toggle Switcher (Publik vs Analis).
  2. **Price Surge Alert Bar (Kondisional)**: Peringatan jika ada komoditas pangan pokok yang melonjak tajam hari ini.
  3. **Row 1 - KPI Ticker & Best Price Finder**:
     - *Kiri (8 Kolom)*: Grid komoditas utama (Beras, Minyak, Telur, Cabai, Daging) dengan harga hari ini, pasar termurah, dan perubahan DoD/WoW.
     - *Kanan (4 Kolom)*: Widget interaktif "Best Price Finder" — pilih komoditas langsung keluar urutan pasar termurah di Surabaya.
  4. **Row 2 - Smart Shopping Basket Simulator**:
     - Form input bahan belanja (misal: Beras 5 kg, Telur 2 kg, Minyak 2 L, Cabai 0.5 kg).
     - Hasil kalkulasi komparasi total biaya di 6 pasar (Wonokromo, Keputran, Genteng, Pucang Anom, Tambahrejo, Soponyono) dengan badge *"Pasar Paling Hemat"*.
  5. **Row 3 - Tren Singkat & Tips Warga**: Grafik pergerakan 14 hari terakhir untuk komoditas pilihan dan rekomendasi waktu kulakan terbaik.

### Layar 2: Market Comparison & Spatial Analytics (`06_peta_spasial.html`)
- **Tujuan**: Visualisasi geografis disparitas harga pangan di seluruh wilayah Kota Surabaya.
- **Struktur Halaman**:
  1. **Spatial Map Interactive View**: Peta Surabaya dengan marker interaktif pada 6 pasar strategis:
     - Pasar Keputran (Surabaya Pusat/Selatan - Pasar Induk Sayur & Cabai)
     - Pasar Wonokromo (Surabaya Selatan - Pasar Tradisional Besar)
     - Pasar Genteng (Surabaya Pusat - Pasar Strategis Bahan Pokok)
     - Pasar Pucang Anom (Surabaya Timur)
     - Pasar Tambahrejo (Surabaya Utara)
     - Pasar Soponyono (Surabaya Rungkut/Timur)
  2. **Market Detail Card (Flyout/Sidebar)**: Informasi detail pasar yang diklik (rata-rata harga komoditas, selisih vs rata-rata kota, jam operasional paling ramai).
  3. **Disparity Matrix Table**: Tabel perbandingan selisih harga komoditas antar pasar untuk melihat disparitas harga ekstrem antar kecamatan di Surabaya.

### Layar 3: Early Warning & Commodity Risk Matrix (`07_early_warning.html`)
- **Tujuan**: Pusat kendali Pemkot Surabaya (Disperindag, DKPP, Satgas Pangan) untuk memantau status kerawanan harga dan mengambil keputusan operasi pasar.
- **Struktur Halaman**:
  1. **Executive Summary KPI**: Total komoditas dipantau (37), Komoditas Status Normal, Status Waspada, Status Siaga/Tinggi (angka dinamis dari Gold Layer).
  2. **Price Surge Alert Panel**: Rekomendasi tindakan intervensi otomatis berbasis data (misal: Rilis Cadangan Beras SPHP, Koordinasi Distribusi Cabai dengan Blitar).
  3. **Commodity Risk Map (Heatmap)**: Matriks Komoditas × Pasar dengan pewarnaan transparan Hijau-Kuning-Merah berdasarkan skor deviasi gabungan.
  4. **Anomaly Inspector Table**: Daftar anomali harga yang terdeteksi dengan skor statistik $Z\text{-score}$, deviasi persentase, dan indikator dugaan penimbunan / hambatan pasokan.

### Layar 4: Advanced Forecasting & External Variables (`08_forecasting.html`)
- **Tujuan**: Analisis time-series mendalam dan prediksi harga 7–14 hari ke depan untuk akademisi, analis, dan perencana ketahanan pangan.
- **Struktur Halaman**:
  1. **Forecast Horizon Selector**: Pilihan proyeksi (7 Hari vs 14 Hari) dan pemilihan komoditas & pasar spesifik.
  2. **Main Time-Series Chart**:
     - Garis data historis aktual (solid line).
     - Garis proyeksi model ML (dashed cobalt line).
     - Pita rentang ketidakpastian (80% dan 95% Confidence Interval band).
     - Titik perbandingan dengan model baseline.
  3. **External Variables Correlation Panel**:
     - Widget data cuaca Open-Meteo (curah hujan, suhu, kelembapan, angin) & harga produsen sebagai indikator pasokan.
     - Indikator jarak kalender menuju Hari Besar Keagamaan Nasional (HBKN).
     - Skor korelasi empiris variabel eksternal terhadap perubahan harga.
  4. **Seasonal Insight Section**: Grafik siklus perulangan musiman tahunan (Ramadan, Idulfitri, Nataru) dari arsip data historis 3 tahun terakhir.

---

## 6. Prompt Siap Pakai untuk Google Stitch

Gunakan template prompt berikut saat memasukkan perintah ke Google Stitch (`labs.google/stitch`) untuk menghasilkan layar antarmuka yang presisi:

### Prompt A: Layar Utama Public Dashboard
```markdown
Create a high-end, responsive web dashboard screen for "HargaWatch Surabaya — Public Citizen Portal" using modern Tailwind CSS styles and semantic HTML. 

Context & Theme:
- A clean, modern food price monitoring application for citizens of Surabaya, Indonesia.
- Atmosphere: Balanced, trustworthy, accessible yet high-agency. 
- Colors: Slate canvas background (#0F172A), deep slate surfaces (#1E293B), emerald green accent (#10B981) for savings and price drops, subtle amber (#F59E0B) and crimson (#EF4444) for price surges. Text in crisp slate (#F8FAFC and #94A3B8).
- Typography: Sans-serif modern (Geist/Outfit style) for headlines, monospace font (Geist Mono style) for all Rupiah currency amounts and percentage changes.
- Anti-patterns: No emojis, no purple glowing buttons, no generic cards-inside-cards.

Key Sections to Render:
1. Top Navigation Bar: Product branding "HargaWatch Surabaya" with live indicator "SISKAPERBAPO & Pemkot Data Connected", timestamp "Updated 10 mins ago", and a Persona Toggle pill [Public Consumer | Government Analyst].
2. Alert Bar: An dismissible, elegant alert informing citizens about Cabai Rawit price trends.
3. Today's Prices Grid: 4-5 core commodities (Beras Medium, Minyak Goreng, Telur Ayam, Cabai Rawit, Bawang Merah) displaying current average price in Rp/kg, +/- DoD percentage with micro sparkline, and the cheapest market name in Surabaya.
4. Best Price Finder Component: Interactive filter where user selects a commodity and sees instant ranking of 6 Surabaya markets (Wonokromo, Keputran, Genteng, Pucang Anom, Tambahrejo, Soponyono) sorted from cheapest to most expensive with savings calculation.
5. Smart Shopping Basket Calculator: A simulated shopping cart allowing citizens to add staple items and compare total estimated receipt cost across the 6 Surabaya markets with a highlighted "Best Value Market" badge.
6. Footer: Methodology note, official data sources (SISKAPERBAPO Disperindag Jatim, Open-Meteo, BPS), and disclaimer.
```

### Prompt B: Layar Analis & Early Warning System (Government View)
```markdown
Create a high-precision, dense data cockpit dashboard screen for "HargaWatch Surabaya — Government & Analyst Early Warning Portal" using Tailwind CSS.

Context & Theme:
- Target audience: Surabaya City Government (Pemkot Surabaya), Disperindag, DKPP, and Regional Inflation Control Team (TPID).
- Atmosphere: Professional high-density command center (cockpit density 8/10).
- Visual Style: Slate-900 canvas, Slate-800 borders and cards, clear functional metrics, monospace data tables. Emerald (#10B981) for Normal, Amber (#F59E0B) for Waspada, Crimson (#EF4444) for Siaga/Tinggi.
- Strictly NO emojis, NO neon glows.

Key Sections to Render:
1. Top Command Header: Title "Pusat Kendali Dini Harga Pangan Kota Surabaya", current inflation metric, active alerts counter, and Export Report button (CSV/PDF).
2. Executive KPI Cards: 4 metric cards showing Monitored Commodities (37), Markets Covered (6 Strategic Markets), Anomaly Alerts Triggered (2 Active), and 14-Day Inflation Forecast Risk (Moderate).
3. Price Surge Alert & Actionable Interventions: An operational card highlighting severe price surges (e.g. Cabai Rawit +22.4% in Pasar Genteng) with suggested government actions (Rekomendasi Operasi Pasar Terarah, Koordinasi Suplai Antar Daerah).
4. Commodity Risk Matrix (Heatmap): A comprehensive table of Commodities (Rows) × 6 Surabaya Markets (Keputran, Wonokromo, Genteng, Pucang, Tambahrejo, Soponyono) displaying colored status badges (Normal, Waspada, Tinggi) based on statistical Z-scores.
5. 7-14 Days Time-Series Forecast & Anomaly Detection: Interactive multi-line chart showing historical data, Global Multi-Market LightGBM Quantile Regression forecast curve, 80% and 95% confidence intervals, and marked anomaly detection points.
6. External Covariates Explorer: Mini widgets showing correlation with Open-Meteo rainfall (Surabaya) and producer-price spread and Days until next Religious Holiday (HBKN Ramadan/Idulfitri).
```

---

## 7. Verifikasi Kepatuhan & Checklist Implementasi

- [x] **Sesuai Spesifikasi PRD**: Seluruh 17 komponen dari arahan dosen dan stakeholder telah dicakup secara eksplisit.
- [x] **Karakteristik Lokal Surabaya**: Menyebutkan secara akurat 6 pasar strategis (Keputran, Wonokromo, Genteng, Pucang Anom, Tambahrejo, Soponyono).
- [x] **Dual Persona**: Memisahkan kebutuhan konsumen awam (simpel & hemat) dengan pemerintah (analitis & intervensi).
- [x] **Desain Berstandar Anti-Slop**: Menghindari klise AI, menggunakan palet fungsional, tipografi monospace untuk angka keuangan, serta layout asimetris yang solid.
- [x] **Dukungan File Mockup**: Terkoneksi secara logis dengan artefak HTML yang tersedia di `docs/stitch/html/`.

---

## 8. Status Implementasi Aktual (Sinkronisasi Repo)

*Bagian ini di luar blueprint Stitch — cermin kondisi repo kini:*

- **Pipeline harian**: `src/pipeline/` (scrape_data, scrape_produsen, cleaner, preprocessing_final) + `scripts/update_catchup.py` (catch-up idempotent tanggal bolong, Task Scheduler 07:00, jejak mundur maks. 400 hari).
- **Silver Layer (Supabase PostgreSQL)**: `dim_pasar` (6), `dim_komoditas` (37), `dim_kalender` (2.439 hari, 2020–2026), `fact_harga_pasar` (±477 ribu baris), `fact_harga_produsen`, `fact_cuaca`, `fact_inflasi`. Skema dual-price: `harga_asli` (murni lapangan) vs `harga_imputasi` (kontinu, transparan via flag).
- **ML & EWS**: `src/analytics/` (features, metrics, seasonal), `src/models/` (forecast_engine draf, anomaly_detector, backtest), `src/safety/early_warning.py` (skor komposit 0–100, ambang 40/70); eksperimen acuan `notebook/forecasting_experiments.ipynb` (WAPE 13.98%); Gold Layer `fact_forecast`, `fact_early_warning` (DDL via `src/utils/setup_ml_tables.py`).
- **Frontend**: Next.js 15 App Router di `web/` — rute `/` (publik), `/peta`, `/early-warning`, `/forecasting`; komponen Header/Footer/CommodityCard/Sparkline/SmartShoppingBasket/PriceTrendChart; data via `@supabase/supabase-js` (`web/src/lib/supabase.ts`, read-only); mockup asal di `docs/stitch/html/` + screenshot `docs/stitch/images/`.
- **Uji & mutu**: `tests/` (pytest: pipeline, data quality, ML features/models, early warning, alerting); aturan AI di `PROJECT_RULES.md`; peta jalan di `ROADMAP.md` (Fase 3 ongoing: porting notebook ke batch produksi, DDL Gold Layer, migrasi cron ke cloud).
- Angka realistis mengikuti anti-pattern: klaim metrik (mis. WAPE 13.98%) wajib verifikasi ulang sebelum tampil di dashboard.
