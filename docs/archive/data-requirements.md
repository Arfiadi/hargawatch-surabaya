# HargaWatch — Data Requirements Specification

> **Proyek**: HargaWatch — Platform Intelijen Harga Pangan dan Early Warning Kota Surabaya  
> **Versi**: 1.0  
> **Tanggal**: 31 Agustus 2026  
> **Status**: Draft — menunggu validasi teknis terhadap sumber data

---

## Daftar Isi

- [1. Ringkasan Data Architecture](#1-ringkasan-data-architecture)
- [2. Data Layer 1 — Core Price Data (Primary)](#2-data-layer-1--core-price-data-primary)
  - [2.1. DKPP Kota Surabaya](#21-dkpp-kota-surabaya)
  - [2.2. PD Pasar Surya](#22-pd-pasar-surya)
  - [2.3. SISKAPERBAPO Jawa Timur](#23-siskaperbapo-jawa-timur)
- [3. Data Layer 2 — Supporting / Exogenous Data](#3-data-layer-2--supporting--exogenous-data)
  - [3.1. Open-Meteo (Cuaca)](#31-open-meteo-cuaca)
  - [3.2. Kalender & Event](#32-kalender--event)
- [4. Data Layer 3 — Benchmark Data](#4-data-layer-3--benchmark-data)
  - [4.1. Badan Pangan Nasional (Bapanas)](#41-badan-pangan-nasional-bapanas)
  - [4.2. BPS Kota Surabaya](#42-bps-kota-surabaya)
- [5. Data Layer 4 — Validation Data](#5-data-layer-4--validation-data)
  - [5.1. Field Survey](#51-field-survey)
- [6. Data Layer 5 — Reference / Master Data](#6-data-layer-5--reference--master-data)
  - [6.1. Master Komoditas](#61-master-komoditas)
  - [6.2. Master Pasar](#62-master-pasar)
- [7. Database Schema](#7-database-schema)
- [8. Feature-to-Data Mapping](#8-feature-to-data-mapping)
- [9. Data Quality Rules](#9-data-quality-rules)
- [10. Data Collection Pipeline](#10-data-collection-pipeline)
- [11. MVP vs Advanced Data Scope](#11-mvp-vs-advanced-data-scope)
- [12. Data Volume Estimation](#12-data-volume-estimation)

---

## 1. Ringkasan Data Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DATA ARCHITECTURE                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1 — CORE PRICE DATA (Primary)                    │
│  ├── DKPP Surabaya       (harian, 8 pasar, ~20 item)   │
│  ├── PD Pasar Surya      (harian, 7 pasar, ~40 item)   │
│  └── SISKAPERBAPO Jatim  (harian, historis sejak 2011)  │
│                                                         │
│  Layer 2 — SUPPORTING / EXOGENOUS                       │
│  ├── Open-Meteo          (cuaca harian, API)            │
│  └── Kalender & Event    (hari libur, Ramadan, dll)     │
│                                                         │
│  Layer 3 — BENCHMARK                                    │
│  ├── Bapanas Panel Harga (harga city-level nasional)    │
│  └── BPS Surabaya        (CPI/inflasi bulanan)          │
│                                                         │
│  Layer 4 — VALIDATION                                   │
│  └── Field Survey        (ground-truth periodik)        │
│                                                         │
│  Layer 5 — REFERENCE / MASTER                           │
│  ├── Master Komoditas    (standardisasi nama & satuan)  │
│  └── Master Pasar        (nama, lokasi, koordinat)      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Data Layer 1 — Core Price Data (Primary)

### 2.1. DKPP Kota Surabaya

| Atribut | Detail |
|---|---|
| **Sumber** | Dinas Ketahanan Pangan dan Pertanian Kota Surabaya |
| **URL** | https://dkpp.surabaya.go.id/harga |
| **Metode Koleksi** | HTML scraping (parsing `<table>`) |
| **Frekuensi Update** | Harian (hari kerja, Senin–Jumat/Sabtu) |
| **Tipe Harga** | Harga rata-rata konsumen (retail) |
| **Satuan Harga** | Rupiah (Rp) |
| **Cakupan Historis** | Hanya harga terkini yang tampil di web; tidak ada arsip publik |
| **Prioritas** | Tier 1 — Essential |

#### Pasar yang Di-monitor (8 Pasar)

| No | Nama Pasar | Kecamatan |
|---|---|---|
| 1 | Pasar Tambahrejo | Simokerto |
| 2 | Pasar Pucang Anom | Gubeng |
| 3 | Pasar Wonokromo | Wonokromo |
| 4 | Pasar Genteng Baru | Genteng |
| 5 | Pasar Pabean | Pabean Cantian |
| 6 | Pasar Kembang | Krembangan |
| 7 | Pasar Balongsari | Tandes |
| 8 | Pasar Kendangsari | Tenggilis Mejoyo |

#### Komoditas yang Diharapkan (~20 item)

| Kategori | Komoditas | Satuan |
|---|---|---|
| Beras | Beras IR.64 Kualitas I (Premium) | kg |
| Beras | Beras IR.64 Kualitas II (Medium) | kg |
| Beras | Beras Premium | kg |
| Beras | Beras Medium | kg |
| Gula | Gula Pasir Lokal Curah | kg |
| Gula | Gula Merah | kg |
| Minyak Goreng | Minyak Goreng Curah (Bening) | liter |
| Minyak Goreng | Minyak Goreng Kemasan (Bimoli/Premium) | liter |
| Daging | Daging Sapi (Paha Belakang) | kg |
| Daging | Daging Ayam Broiler/Ras | kg |
| Daging | Daging Ayam Kampung | kg |
| Telur | Telur Ayam Broiler/Ras | kg |
| Telur | Telur Ayam Kampung | kg |
| Bumbu | Cabai Merah Besar | kg |
| Bumbu | Cabai Rawit Merah | kg |
| Bumbu | Bawang Merah | kg |
| Bumbu | Bawang Putih | kg |
| Ikan | Ikan Bandeng Segar | kg |
| Ikan | Ikan Tongkol | kg |
| Ikan | Udang | kg |
| Ikan | Ikan Lele | kg |

#### Fields yang Harus Di-extract

```
dkpp_raw:
  - tanggal_observasi          : DATE         -- tanggal harga berlaku
  - nama_komoditas_raw         : TEXT         -- nama komoditas persis dari sumber
  - satuan                     : TEXT         -- kg, liter, butir, dll
  - harga_pasar_tambahrejo     : INTEGER      -- harga dalam Rp (nullable)
  - harga_pasar_pucang_anom    : INTEGER      -- (nullable)
  - harga_pasar_wonokromo      : INTEGER      -- (nullable)
  - harga_pasar_genteng_baru   : INTEGER      -- (nullable)
  - harga_pasar_pabean         : INTEGER      -- (nullable)
  - harga_pasar_kembang        : INTEGER      -- (nullable)
  - harga_pasar_balongsari     : INTEGER      -- (nullable)
  - harga_pasar_kendangsari    : INTEGER      -- (nullable)
  - harga_rata_rata            : INTEGER      -- rata-rata kota (nullable)
  - scraped_at                 : TIMESTAMP    -- waktu scraper dijalankan
  - raw_html_hash              : TEXT         -- hash SHA-256 dari raw HTML
```

> **Catatan**: Setelah extract, data di-normalize ke format long (1 baris = 1 observasi harga untuk 1 komoditas di 1 pasar pada 1 tanggal).

---

### 2.2. PD Pasar Surya

| Atribut | Detail |
|---|---|
| **Sumber** | PD Pasar Surya (BUMD Kota Surabaya) |
| **URL** | https://pasarsurya.surabaya.go.id/index.php/harga-bahan-bahan-pokok/ |
| **Metode Koleksi** | HTML scraping (WordPress post) + PDF download + PDF table extraction |
| **Frekuensi Update** | Harian (hari kerja) |
| **Tipe Harga** | Harga retail konsumen |
| **Satuan Harga** | Rupiah (Rp) |
| **Cakupan Historis** | Arsip WordPress bisa di-crawl mundur (kedalaman belum diverifikasi) |
| **Prioritas** | Tier 1 — Essential |

#### Pasar yang Di-monitor (7 Pasar Sentinel)

| No | Nama Pasar | Zona |
|---|---|---|
| 1 | Pasar Tambahrejo | Cabang Utara |
| 2 | Pasar Pucang Anom | Cabang Timur |
| 3 | Pasar Wonokromo | Cabang Selatan |
| 4 | Pasar Genteng Baru | Cabang Utara |
| 5 | Pasar Kembang | Cabang Utara |
| 6 | Pasar Pabean | Cabang Utara |
| 7 | Pasar Balongsari | Cabang Selatan |

#### Komoditas yang Diharapkan (~35–45 item)

| Kategori | Komoditas | Satuan |
|---|---|---|
| **Beras** | Beras Premium | kg |
| | Beras Medium | kg |
| | Beras Bulog/SPHP | kg |
| | Beras Jagung | kg |
| | Beras Ketan Putih | kg |
| | Beras Ketan Hitam | kg |
| **Minyak & Gula** | Minyak Goreng Kemasan Premium | liter |
| | Minyak Goreng Curah | liter |
| | Minyakita | liter |
| | Gula Pasir DN | kg |
| **Daging & Unggas** | Daging Sapi Paha Belakang | kg |
| | Daging Sapi Murni | kg |
| | Daging Sapi Sandung Lamur | kg |
| | Daging Sapi Tetelan | kg |
| | Daging Ayam Broiler/Ras | kg |
| | Daging Ayam Kampung | kg |
| **Telur** | Telur Ayam Ras | kg |
| | Telur Ayam Kampung | butir |
| **Cabai** | Cabai Rawit Merah | kg |
| | Cabai Merah Besar | kg |
| | Cabai Merah Keriting | kg |
| | Cabai Hijau | kg |
| **Bawang** | Bawang Merah | kg |
| | Bawang Putih Honan | kg |
| | Bawang Putih Kating | kg |
| | Bawang Bombay | kg |
| **Ikan Segar** | Ikan Bandeng | kg |
| | Ikan Kembung | kg |
| | Ikan Tongkol | kg |
| | Ikan Mujair | kg |
| | Ikan Lele | kg |
| | Udang Basah | kg |
| **Sayur & Palawija** | Tomat | kg |
| | Kentang | kg |
| | Wortel | kg |
| | Kubis | kg |
| | Buncis | kg |
| | Kacang Tanah | kg |
| | Kacang Hijau | kg |
| **Lainnya** | Tepung Terigu Segitiga Biru | kg |
| | Tepung Terigu Cakra Kembar | kg |
| | Garam Beryodium | kg |
| | Gas LPG 3 kg | tabung |
| | Gas LPG 12 kg | tabung |

#### Fields yang Harus Di-extract

```
pasarsurya_raw:
  - tanggal_observasi          : DATE
  - nama_komoditas_raw         : TEXT
  - satuan                     : TEXT
  - harga_pasar_tambahrejo     : INTEGER      -- (nullable)
  - harga_pasar_pucang_anom    : INTEGER      -- (nullable)
  - harga_pasar_wonokromo      : INTEGER      -- (nullable)
  - harga_pasar_genteng_baru   : INTEGER      -- (nullable)
  - harga_pasar_kembang        : INTEGER      -- (nullable)
  - harga_pasar_pabean         : INTEGER      -- (nullable)
  - harga_pasar_balongsari     : INTEGER      -- (nullable)
  - harga_rata_rata            : INTEGER      -- (nullable)
  - perubahan                  : TEXT         -- keterangan perubahan (nullable)
  - source_type                : TEXT         -- 'html' atau 'pdf'
  - source_url                 : TEXT         -- URL post atau PDF
  - scraped_at                 : TIMESTAMP
  - raw_content_hash           : TEXT
```

---

### 2.3. SISKAPERBAPO Jawa Timur

| Atribut | Detail |
|---|---|
| **Sumber** | Dinas Perindustrian dan Perdagangan Provinsi Jawa Timur |
| **URL** | https://siskaperbapo.jatimprov.go.id |
| **Metode Koleksi** | HTML scraping (tabel terstruktur); kemungkinan ada AJAX/JSON endpoint |
| **Frekuensi Update** | Harian |
| **Tipe Harga** | Harga konsumen (retail) + Harga produsen (farmgate) |
| **Satuan Harga** | Rupiah (Rp) |
| **Cakupan Historis** | Sistem beroperasi sejak 2011 (kedalaman data accessible belum diverifikasi) |
| **Prioritas** | Tier 1 — Essential (terutama untuk historical backfill) |

#### Fitur Data yang Tersedia

| Fitur | Endpoint | Keterangan |
|---|---|---|
| Harga Konsumen per Area | `/harga/tabel` | Tabel harga per kab/kota, filter tanggal |
| Harga Konsumen per Komoditas | `/harga-komoditas` | Tabel per komoditas, lintas kab/kota |
| Harga Produsen | `/produsen/tabel` | Harga di tingkat petani/peternak |
| Grafik Harga Konsumen | `/harga/grafik` | Visualisasi tren |
| Grafik Harga Produsen | `/produsen/grafik` | Visualisasi tren produsen |
| Tren | `/tren` | Analisis tren bawaan |
| Profil Pasar | `/profilpasar` | Informasi pasar |

#### Fields yang Harus Di-extract

```
siskaperbapo_raw:
  - tanggal_observasi          : DATE
  - kabupaten_kota             : TEXT         -- filter: "Kota Surabaya"
  - nama_pasar                 : TEXT         -- (jika tersedia per pasar)
  - nama_komoditas_raw         : TEXT
  - satuan                     : TEXT
  - harga_konsumen             : INTEGER      -- harga retail (nullable)
  - harga_produsen             : INTEGER      -- harga farmgate (nullable)
  - scraped_at                 : TIMESTAMP
  - source_url                 : TEXT
  - raw_content_hash           : TEXT
```

#### Data yang Dibutuhkan untuk Historical Backfill

```
historical_backfill:
  - target_range               : 2020-01-01 sampai hari ini (minimum)
  - ideal_range                : 2015-01-01 sampai hari ini (jika tersedia)
  - maximum_range              : 2011-01-01 sampai hari ini (jika accessible)
  - filter_area                : "Kota Surabaya"
  - komoditas                  : semua yang tersedia
  - tipe_harga                 : konsumen + produsen
```

---

## 3. Data Layer 2 — Supporting / Exogenous Data

### 3.1. Open-Meteo (Cuaca)

| Atribut | Detail |
|---|---|
| **Sumber** | Open-Meteo (open-source weather API) |
| **URL** | https://open-meteo.com/en/docs/historical-weather-api |
| **Metode Koleksi** | REST API (JSON) — gratis, tanpa API key |
| **Frekuensi Update** | Batch harian (atau one-time historical download) |
| **Cakupan Historis** | 1940 – sekarang (lag ~5 hari) |
| **Koordinat Surabaya** | Latitude: -7.25, Longitude: 112.75 |
| **Prioritas** | Tier 2 — Highly Useful |

#### Fields yang Dibutuhkan (Daily Resolution)

```
weather_daily:
  - date                       : DATE         -- tanggal observasi
  - temperature_2m_max         : DECIMAL(5,2) -- suhu maksimum (°C)
  - temperature_2m_min         : DECIMAL(5,2) -- suhu minimum (°C)
  - temperature_2m_mean        : DECIMAL(5,2) -- suhu rata-rata (°C)
  - precipitation_sum          : DECIMAL(7,2) -- total curah hujan (mm)
  - rain_sum                   : DECIMAL(7,2) -- total hujan (mm, tanpa salju)
  - precipitation_hours        : DECIMAL(4,1) -- jam dengan hujan
  - wind_speed_10m_max         : DECIMAL(5,2) -- kecepatan angin maks (km/h)
  - wind_gusts_10m_max         : DECIMAL(5,2) -- hembusan angin maks (km/h)
  - wind_direction_10m_dominant: INTEGER       -- arah angin dominan (°)
  - relative_humidity_mean     : DECIMAL(5,2) -- kelembapan rata-rata (%)
  - sunshine_duration          : DECIMAL(7,2) -- durasi matahari (detik)
  - et0_fao_evapotranspiration : DECIMAL(5,2) -- evapotranspirasi referensi (mm)
  - source                     : TEXT         -- 'open-meteo'
  - fetched_at                 : TIMESTAMP    -- waktu data diambil
```

#### Contoh API Request

```
GET https://archive-api.open-meteo.com/v1/archive
  ?latitude=-7.25
  &longitude=112.75
  &start_date=2020-01-01
  &end_date=2026-08-31
  &daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,
         precipitation_sum,rain_sum,precipitation_hours,
         wind_speed_10m_max,wind_gusts_10m_max,
         wind_direction_10m_dominant,
         sunshine_duration,et0_fao_evapotranspiration
  &timezone=Asia/Jakarta
```

#### Derived Features (Dihitung dari Raw Data)

```
weather_derived:
  - is_heavy_rain              : BOOLEAN      -- precipitation_sum > 50mm
  - rain_last_3d               : DECIMAL      -- SUM curah hujan 3 hari terakhir
  - rain_last_7d               : DECIMAL      -- SUM curah hujan 7 hari terakhir
  - temp_anomaly               : DECIMAL      -- deviasi dari rata-rata 30 hari
  - is_extreme_weather         : BOOLEAN      -- curah hujan/angin di atas threshold
```

---

### 3.2. Kalender & Event

| Atribut | Detail |
|---|---|
| **Sumber** | Kurasi manual dari Kemenag, Keputusan Presiden, kalender resmi |
| **Metode Koleksi** | Dataset statis CSV/JSON, update tahunan |
| **Cakupan Historis** | 2011 – 2027+ (sesuai kebutuhan backfill) |
| **Prioritas** | Tier 2 — Highly Useful |

#### Fields yang Dibutuhkan

```
calendar_events:
  - date                       : DATE         -- tanggal event
  - event_name                 : TEXT         -- nama event
  - event_type                 : ENUM         -- lihat kategori di bawah
  - is_national_holiday        : BOOLEAN      -- apakah hari libur nasional
  - is_cuti_bersama            : BOOLEAN      -- apakah cuti bersama

calendar_seasonal:
  - date                       : DATE
  - is_ramadan                 : BOOLEAN      -- apakah dalam bulan Ramadan
  - ramadan_day                : INTEGER      -- hari ke-berapa Ramadan (1-30, null jika bukan)
  - days_before_eid_fitri      : INTEGER      -- hari sebelum Idulfitri (null jika > 45)
  - days_after_eid_fitri       : INTEGER      -- hari setelah Idulfitri (null jika > 14)
  - days_before_christmas      : INTEGER      -- hari sebelum Natal (null jika > 30)
  - days_before_new_year       : INTEGER      -- hari sebelum tahun baru (null jika > 30)
  - is_school_holiday          : BOOLEAN      -- periode libur sekolah
  - is_harvest_season_padi     : BOOLEAN      -- musim panen padi (perkiraan: Mar-Apr, Jul-Aug)
  - month                      : INTEGER      -- 1-12
  - day_of_week                : INTEGER      -- 0=Senin, 6=Minggu
  - week_of_year               : INTEGER      -- 1-53
  - is_weekend                 : BOOLEAN
  - is_market_day              : BOOLEAN      -- hari kerja (pasar buka)
```

#### Kategori Event Type

| event_type | Contoh |
|---|---|
| `religious_islam` | Ramadan, Idulfitri, Iduladha, Maulid Nabi, Isra Miraj, 1 Muharram |
| `religious_christian` | Natal, Jumat Agung, Kenaikan Isa Almasih, Paskah |
| `religious_hindu` | Nyepi, Galungan |
| `religious_buddha` | Waisak |
| `religious_konghucu` | Imlek |
| `national` | Hari Kemerdekaan, Hari Pancasila, Hari Buruh |
| `cuti_bersama` | Cuti bersama yang ditetapkan SKB Menteri |
| `seasonal` | Awal tahun ajaran, libur semester, musim hujan, musim kemarau |
| `local` | Event lokal Surabaya (Hari Jadi Surabaya, dll) |

#### Data Ramadan & Idulfitri (Contoh Historical)

| Tahun | 1 Ramadan | Idulfitri |
|---|---|---|
| 2020 | 24 April | 24-25 Mei |
| 2021 | 13 April | 13-14 Mei |
| 2022 | 2 April | 2-3 Mei |
| 2023 | 23 Maret | 22-23 April |
| 2024 | 12 Maret | 10-11 April |
| 2025 | 1 Maret | 31 Maret – 1 April |
| 2026 | 18 Februari | 20-21 Maret |

> **Catatan**: Tanggal pasti Ramadan/Idulfitri setiap tahun ditetapkan melalui sidang isbat Kemenag. Data di atas berdasarkan penetapan resmi.

---

## 4. Data Layer 3 — Benchmark Data

### 4.1. Badan Pangan Nasional (Bapanas)

| Atribut | Detail |
|---|---|
| **Sumber** | Badan Pangan Nasional |
| **URL** | https://panelharga.badanpangan.go.id/ (⚠️ sedang maintenance per 31/08/2026) |
| **Metode Koleksi** | Download CSV/Excel jika tersedia; internal API (undocumented) |
| **Frekuensi Update** | Harian (jika portal aktif) |
| **Tipe Harga** | Rata-rata harga retail city-level (Kota Surabaya) |
| **Cakupan Historis** | ~2022 – sekarang |
| **Prioritas** | Tier 2 — Benchmark (bukan primary) |

#### Fields yang Dibutuhkan

```
bapanas_benchmark:
  - tanggal_observasi          : DATE
  - kabupaten_kota             : TEXT         -- "Kota Surabaya"
  - provinsi                   : TEXT         -- "Jawa Timur"
  - nama_komoditas             : TEXT
  - harga_retail               : INTEGER      -- harga rata-rata Rp
  - harga_grosir               : INTEGER      -- (nullable)
  - harga_produsen             : INTEGER      -- (nullable)
  - satuan                     : TEXT
  - status_harga               : ENUM         -- hijau/kuning/merah (HAP/HET)
  - harga_acuan_pembelian      : INTEGER      -- HAP (nullable)
  - harga_eceran_tertinggi     : INTEGER      -- HET (nullable)
  - source                     : TEXT         -- 'bapanas_panel_harga'
  - fetched_at                 : TIMESTAMP
```

#### Komoditas Bapanas (20+ item)

| No | Komoditas | Satuan |
|---|---|---|
| 1 | Beras Premium | kg |
| 2 | Beras Medium | kg |
| 3 | Beras SPHP Bulog | kg |
| 4 | Jagung Pipilan Kering | kg |
| 5 | Tepung Terigu Curah | kg |
| 6 | Tepung Terigu Kemasan | kg |
| 7 | Daging Sapi Murni | kg |
| 8 | Daging Ayam Ras | kg |
| 9 | Telur Ayam Ras | kg |
| 10 | Bawang Merah | kg |
| 11 | Bawang Putih Bonggol | kg |
| 12 | Cabai Merah Keriting | kg |
| 13 | Cabai Rawit Merah | kg |
| 14 | Cabai Merah Besar | kg |
| 15 | Gula Konsumsi (Pasir) | kg |
| 16 | Minyak Goreng Curah | liter |
| 17 | Minyak Goreng Kemasan Sederhana | liter |
| 18 | Kedelai Biji Kering (Impor) | kg |
| 19 | Garam Halus Beryodium | kg |
| 20 | Ikan Kembung | kg |
| 21 | Ikan Tongkol | kg |
| 22 | Ikan Bandeng | kg |

---

### 4.2. BPS Kota Surabaya

| Atribut | Detail |
|---|---|
| **Sumber** | Badan Pusat Statistik Kota Surabaya |
| **URL** | https://surabayakota.bps.go.id/ |
| **API** | https://webapi.bps.go.id/ (domain=3578, perlu API key gratis) |
| **Metode Koleksi** | BPS Web API (JSON) atau download Excel/PDF |
| **Frekuensi Update** | Bulanan (CPI/inflasi) |
| **Prioritas** | Tier 3 — Optional benchmark |

#### Fields yang Dibutuhkan

```
bps_inflation:
  - tahun                      : INTEGER
  - bulan                      : INTEGER
  - ihk_umum                   : DECIMAL(8,2) -- Indeks Harga Konsumen umum
  - ihk_makanan                : DECIMAL(8,2) -- IHK kelompok makanan
  - inflasi_mtm                : DECIMAL(5,2) -- inflasi month-to-month (%)
  - inflasi_yoy                : DECIMAL(5,2) -- inflasi year-on-year (%)
  - inflasi_ytd                : DECIMAL(5,2) -- inflasi year-to-date (%)
  - inflasi_makanan_mtm        : DECIMAL(5,2) -- inflasi makanan MtM (%)
  - komoditas_penyumbang       : JSONB        -- daftar komoditas penyumbang inflasi
  - source                     : TEXT         -- 'bps_surabaya'
  - fetched_at                 : TIMESTAMP
```

---

## 5. Data Layer 4 — Validation Data

### 5.1. Field Survey

| Atribut | Detail |
|---|---|
| **Sumber** | Pengumpulan langsung di pasar |
| **Metode Koleksi** | KoboToolbox / Google Forms / observasi langsung |
| **Frekuensi** | Periodik (2–4 kali per semester) |
| **Tujuan** | Validasi akurasi data dari sumber digital |
| **Prioritas** | Tier 2 — Penting untuk kredibilitas ilmiah |

#### Fields yang Harus Dikumpulkan

```
field_survey:
  - survey_id                  : UUID
  - surveyor_name              : TEXT
  - survey_date                : DATE
  - survey_time                : TIME
  - market_name                : TEXT         -- nama pasar yang dikunjungi
  - vendor_name                : TEXT         -- nama pedagang (opsional/anonim)
  - vendor_type                : ENUM         -- pedagang_utama, pedagang_kecil, grosir
  - commodity_name             : TEXT
  - commodity_quality          : TEXT         -- kualitas/grade (jika relevan)
  - unit                       : TEXT         -- kg, liter, ikat, dll
  - price_asked                : INTEGER      -- harga yang ditawarkan pedagang
  - price_paid                 : INTEGER      -- harga yang dibayar (jika transaksi)
  - stock_availability         : ENUM         -- banyak, cukup, sedikit, kosong
  - notes                      : TEXT         -- catatan lapangan
  - photo_url                  : TEXT         -- foto papan harga / komoditas (opsional)
  - gps_latitude               : DECIMAL(10,7)
  - gps_longitude              : DECIMAL(10,7)
```

#### Protokol Field Survey

```
survey_protocol:
  - target_markets             : 3-5 pasar per survey session
  - target_commodities         : 10-15 komoditas strategis
  - target_vendors_per_market  : 2-3 pedagang per komoditas
  - timing                     : pagi hari (07:00-10:00 WIB) saat pasar ramai
  - frekuensi_minimum          : 2x per semester
  - perbandingan               : harga survey vs harga DKPP/Pasar Surya hari yang sama
```

---

## 6. Data Layer 5 — Reference / Master Data

### 6.1. Master Komoditas

```
master_commodities:
  - commodity_id               : UUID         -- primary key
  - commodity_code             : TEXT         -- kode internal (e.g. BERAS_PREMIUM)
  - commodity_name_std         : TEXT         -- nama standar HargaWatch
  - category                   : ENUM         -- beras, gula_minyak, daging, telur,
                                              --   bumbu, ikan, sayur, palawija, lainnya
  - subcategory                : TEXT         -- opsional (e.g. "daging_sapi", "cabai")
  - default_unit               : TEXT         -- satuan standar (kg, liter, butir)
  - is_strategic               : BOOLEAN      -- apakah komoditas strategis nasional
  - display_order              : INTEGER      -- urutan tampilan di dashboard
  - aliases                    : JSONB        -- daftar nama alternatif dari semua sumber
  - created_at                 : TIMESTAMP
  - updated_at                 : TIMESTAMP
```

#### Contoh Commodity Aliases Mapping

```json
{
  "commodity_code": "CABAI_RAWIT_MERAH",
  "commodity_name_std": "Cabai Rawit Merah",
  "category": "bumbu",
  "default_unit": "kg",
  "is_strategic": true,
  "aliases": [
    {"source": "dkpp", "name": "Cabai Rawit Merah"},
    {"source": "pasarsurya", "name": "Cabai Rawit Merah"},
    {"source": "siskaperbapo", "name": "Cabe Rawit"},
    {"source": "bapanas", "name": "Cabai Rawit Merah"}
  ]
}
```

---

### 6.2. Master Pasar

```
master_markets:
  - market_id                  : UUID         -- primary key
  - market_name_std            : TEXT         -- nama standar
  - market_type                : ENUM         -- tradisional, modern, grosir
  - managed_by                 : TEXT         -- "PD Pasar Surya", "Diskopumdag", dll
  - kecamatan                  : TEXT
  - kelurahan                  : TEXT
  - address                    : TEXT
  - latitude                   : DECIMAL(10,7)
  - longitude                  : DECIMAL(10,7)
  - cabang_pasar_surya         : TEXT         -- Utara / Selatan / Timur (nullable)
  - operating_hours            : TEXT         -- e.g. "04:00-14:00"
  - operating_days             : TEXT         -- e.g. "Senin-Sabtu"
  - in_dkpp_monitoring         : BOOLEAN      -- apakah di-monitor oleh DKPP
  - in_pasarsurya_monitoring   : BOOLEAN      -- apakah di-monitor oleh Pasar Surya
  - in_siskaperbapo            : BOOLEAN      -- apakah ada di SISKAPERBAPO
  - aliases                    : JSONB        -- nama alternatif per sumber
  - created_at                 : TIMESTAMP
  - updated_at                 : TIMESTAMP
```

#### Data Pasar yang Harus Dikurasi

| Nama Pasar | Kecamatan | Latitude | Longitude | DKPP | P. Surya | Status |
|---|---|---|---|:---:|:---:|---|
| Pasar Tambahrejo | Simokerto | _perlu diisi_ | _perlu diisi_ | ✅ | ✅ | Perlu verifikasi koordinat |
| Pasar Pucang Anom | Gubeng | _perlu diisi_ | _perlu diisi_ | ✅ | ✅ | Perlu verifikasi koordinat |
| Pasar Wonokromo | Wonokromo | _perlu diisi_ | _perlu diisi_ | ✅ | ✅ | Perlu verifikasi koordinat |
| Pasar Genteng Baru | Genteng | _perlu diisi_ | _perlu diisi_ | ✅ | ✅ | Perlu verifikasi koordinat |
| Pasar Pabean | Pabean Cantian | _perlu diisi_ | _perlu diisi_ | ✅ | ✅ | Perlu verifikasi koordinat |
| Pasar Kembang | Krembangan | _perlu diisi_ | _perlu diisi_ | ✅ | ✅ | Perlu verifikasi koordinat |
| Pasar Balongsari | Tandes | _perlu diisi_ | _perlu diisi_ | ✅ | ✅ | Perlu verifikasi koordinat |
| Pasar Kendangsari | Tenggilis M. | _perlu diisi_ | _perlu diisi_ | ✅ | ❌ | Perlu verifikasi koordinat |

> **Aksi**: Koordinat latitude/longitude harus dicari manual dari Google Maps untuk setiap pasar.

---

## 7. Database Schema

### Normalized Price Observation Table (Tabel Utama)

```
price_observations:
  - id                         : UUID         -- PK, auto-generated
  - source_id                  : ENUM         -- dkpp, pasarsurya, siskaperbapo,
                                              --   bapanas, field_survey
  - observation_date           : DATE         -- tanggal harga berlaku
  - commodity_id               : UUID         -- FK → master_commodities
  - commodity_raw_name         : TEXT         -- nama asli dari sumber (immutable)
  - market_id                  : UUID         -- FK → master_markets
  - market_raw_name            : TEXT         -- nama asli dari sumber (immutable)
  - price                      : INTEGER      -- harga dalam Rp
  - unit                       : TEXT         -- satuan (kg, liter, butir, dll)
  - price_type                 : ENUM         -- retail, wholesale, producer, average
  - price_level                : ENUM         -- actual, avg_market, avg_city
  - is_imputed                 : BOOLEAN      -- DEFAULT false
  - imputation_method          : TEXT         -- (nullable) metode jika is_imputed=true
  - scraped_at                 : TIMESTAMP    -- kapan data diambil dari sumber
  - created_at                 : TIMESTAMP    -- kapan record dibuat di database
  - raw_content_hash           : TEXT         -- hash dari raw source
  - UNIQUE(source_id, observation_date, commodity_raw_name, market_raw_name)
```

### Scraping Log Table

```
scraping_logs:
  - id                         : UUID         -- PK
  - source_id                  : TEXT
  - started_at                 : TIMESTAMP
  - finished_at                : TIMESTAMP
  - status                     : ENUM         -- success, partial, failed, no_update
  - records_extracted          : INTEGER
  - records_inserted           : INTEGER
  - records_skipped            : INTEGER      -- duplikat/sudah ada
  - error_message              : TEXT         -- (nullable)
  - raw_content_path           : TEXT         -- path ke raw HTML/PDF backup
  - response_status_code       : INTEGER
  - response_time_ms           : INTEGER
```

### Data Quality Log Table

```
data_quality_flags:
  - id                         : UUID         -- PK
  - observation_id             : UUID         -- FK → price_observations
  - flag_type                  : ENUM         -- missing_value, outlier, duplicate,
                                              --   unit_mismatch, negative_price,
                                              --   zero_price, spike, stale_data
  - flag_severity              : ENUM         -- info, warning, error
  - flag_message               : TEXT
  - is_resolved                : BOOLEAN      -- DEFAULT false
  - resolved_action            : TEXT         -- (nullable)
  - created_at                 : TIMESTAMP
```

---

## 8. Feature-to-Data Mapping

Setiap fitur HargaWatch membutuhkan data tertentu. Mapping berikut memastikan bahwa semua fitur dapat terpenuhi oleh data yang dikumpulkan.

| Fitur | Data Minimum yang Dibutuhkan | Sumber | Layer |
|---|---|---|---|
| **Harga Hari Ini** | `price_observations` hari ini, semua komoditas & pasar | DKPP + Pasar Surya | Primary |
| **Best Price Finder** | Harga per komoditas per pasar pada tanggal terkini | DKPP + Pasar Surya | Primary |
| **Smart Shopping Basket** | Harga semua komoditas basket di semua pasar pada tanggal sama | DKPP + Pasar Surya | Primary |
| **Price Trend** | `price_observations` historis (min 30 hari, ideal 1+ tahun) | DKPP + Pasar Surya + SISKAPERBAPO | Primary |
| **Price Change Analytics** (WoW/MoM) | Harga historis min 30 hari | DKPP + Pasar Surya + SISKAPERBAPO | Primary |
| **Price Volatility** | Harga historis min 90 hari | SISKAPERBAPO (backfill) + ongoing | Primary |
| **Spatial/Market Analytics** | `price_observations` + `master_markets` (koordinat) | Primary + Master | Primary + Reference |
| **Forecasting 7–14 hari** | Harga historis min 1 tahun + cuaca + kalender | SISKAPERBAPO + Open-Meteo + Kalender | Primary + Supporting |
| **Anomaly Detection** | Harga historis min 90 hari (ideal 1+ tahun) | SISKAPERBAPO (backfill) + ongoing | Primary |
| **Early Warning Status** | Anomaly + volatility + trend + forecast | Multi-source computed | Derived |
| **Price Surge Alert** | Perubahan harga 7 hari + threshold + forecast | Primary + Derived | Primary + Derived |
| **Commodity Risk Map** | Harga terkini + historis per komoditas × pasar | Primary | Primary |
| **Seasonal Insight** | Harga historis multi-tahun + kalender event | SISKAPERBAPO + Kalender | Primary + Supporting |
| **Benchmark Nasional** | Harga Bapanas city-level | Bapanas | Benchmark |
| **Validasi Inflasi** | CPI/IHK bulanan BPS | BPS | Benchmark |
| **Ground-truth Check** | Data field survey | Field Survey | Validation |

---

## 9. Data Quality Rules

### 9.1. Validation pada Saat Ingestion

| Rule ID | Rule | Severity | Aksi |
|---|---|---|---|
| `V001` | Harga harus > 0 | Error | Reject record, log flag |
| `V002` | Harga harus < Rp 500.000/kg (threshold reasonable) | Warning | Flag, masukkan tapi tandai |
| `V003` | Tanggal observasi tidak boleh di masa depan | Error | Reject record |
| `V004` | Tanggal observasi tidak boleh > 7 hari di masa lalu | Warning | Flag sebagai potentially stale |
| `V005` | Komoditas harus bisa di-map ke master_commodities | Warning | Masukkan dengan commodity_id = null, flag |
| `V006` | Pasar harus bisa di-map ke master_markets | Warning | Masukkan dengan market_id = null, flag |
| `V007` | Tidak boleh duplikat (source + date + commodity + market) | Error | Skip record jika sudah ada |
| `V008` | Harga tidak boleh berubah > 100% dari hari sebelumnya | Warning | Flag sebagai potential spike |
| `V009` | Satuan harus konsisten per komoditas | Warning | Flag unit mismatch |

### 9.2. Quality Monitoring Metrics

```
daily_quality_metrics:
  - date                       : DATE
  - source_id                  : TEXT
  - total_expected_records     : INTEGER      -- jumlah observasi yang diharapkan
  - total_actual_records       : INTEGER      -- jumlah observasi yang berhasil
  - completeness_rate          : DECIMAL(5,2) -- actual / expected * 100
  - missing_commodities        : JSONB        -- daftar komoditas yang hilang
  - missing_markets            : JSONB        -- daftar pasar yang hilang
  - outlier_count              : INTEGER      -- jumlah outlier terdeteksi
  - duplicate_count            : INTEGER      -- jumlah duplikat
  - scraping_success           : BOOLEAN      -- apakah scraping berhasil
```

---

## 10. Data Collection Pipeline

### 10.1. Pipeline Harian (Automated)

```
Schedule: Setiap hari kerja, jam 14:00 WIB (setelah data DKPP & Pasar Surya diupdate)

Step 1: SCRAPE
  ├── DKPP Surabaya          → dkpp_raw (staging)
  ├── PD Pasar Surya         → pasarsurya_raw (staging)
  └── SISKAPERBAPO Jatim     → siskaperbapo_raw (staging)

Step 2: VALIDATE
  ├── Apply rules V001-V009
  ├── Flag anomalies
  └── Log quality metrics

Step 3: CLEAN & STANDARDIZE
  ├── Map commodity_raw_name → commodity_id (via aliases)
  ├── Map market_raw_name → market_id (via aliases)
  ├── Normalize satuan
  └── Remove/flag duplicates

Step 4: LOAD
  └── INSERT INTO price_observations (normalized, long format)

Step 5: UPDATE SUPPORTING DATA
  ├── Open-Meteo cuaca hari ini  → weather_daily
  └── Calendar events             → (static, sudah ada)

Step 6: COMPUTE DERIVED METRICS
  ├── Daily change (vs yesterday)
  ├── 7-day moving average
  ├── Volatility (rolling 30-day std dev)
  ├── Anomaly score (Z-score vs 30-day window)
  └── Early warning status

Step 7: LOG
  └── INSERT INTO scraping_logs
```

### 10.2. Pipeline One-Time (Historical Backfill)

```
Target: SISKAPERBAPO historical data

Step 1: Determine accessible date range
Step 2: Scrape iteratively (1 day per request, with polite delay)
Step 3: Validate & clean
Step 4: Load into price_observations with source_id = 'siskaperbapo'
Step 5: Backfill weather data from Open-Meteo (batch API call)
Step 6: Verify completeness

Estimated volume: ~2000 hari × ~20 komoditas × ~5 pasar = ~200,000 records
```

### 10.3. Pipeline Periodik

```
Monthly:
  └── BPS inflation data (via Web API)

When available:
  └── Bapanas Panel Harga benchmark (jika portal kembali online)

Per semester (2-4x):
  └── Field survey data entry
```

### 10.4. Failure Handling

```
on_scraping_failure:
  - retry_count: 3
  - retry_delay: 300 seconds (5 menit)
  - on_final_failure:
      - log error ke scraping_logs
      - kirim notifikasi (email/webhook)
      - dashboard menampilkan "⚠ Data belum diperbarui hari ini"
      - gunakan harga terakhir yang tersedia + flag "last_updated: [tanggal]"
```

---

## 11. MVP vs Advanced Data Scope

### MVP (Semester 5)

| Data | Sumber | Effort | Status |
|---|---|---|---|
| ✅ Harga harian DKPP | HTML scraping | Medium | Harus dibangun |
| ✅ Harga harian Pasar Surya | HTML scraping | Medium | Harus dibangun |
| ✅ Historical backfill SISKAPERBAPO | HTML scraping (iteratif) | Medium-High | Harus dibangun |
| ✅ Cuaca harian | Open-Meteo API | Low | Harus dibangun |
| ✅ Kalender event | CSV statis | Low | Harus dikurasi |
| ✅ Master komoditas | CSV/JSON | Low | Harus dikurasi |
| ✅ Master pasar + koordinat | CSV/JSON + Google Maps | Low | Harus dikurasi |
| ✅ Field survey (min 2x) | Google Forms | Medium | Harus dilakukan |

### Advanced (Post-MVP)

| Data | Sumber | Effort | Kondisi |
|---|---|---|---|
| ⬜ Benchmark Bapanas | CSV/scraping | Medium | Setelah portal kembali online |
| ⬜ Inflasi BPS | BPS Web API | Low | Jika perlu validasi makro |
| ⬜ BMKG ground-truth weather | Manual download | Medium | Jika perlu validasi Open-Meteo |
| ⬜ Data FSVA | Open Data Surabaya | Low | Jika ada fitur spatial vulnerability |
| ⬜ Harga produsen SISKAPERBAPO | Scraping tambahan | Medium | Untuk analisis margin |
| ⬜ Neraca pangan Bapanas | Download | Medium | Jika ada fitur supply analysis |

---

## 12. Data Volume Estimation

### Per Hari (Ongoing)

| Sumber | Records/hari | Keterangan |
|---|---|---|
| DKPP | ~160 | 20 komoditas × 8 pasar |
| Pasar Surya | ~280 | 40 komoditas × 7 pasar |
| SISKAPERBAPO | ~100 | ~20 komoditas × ~5 pasar Surabaya |
| Open-Meteo | 1 | 1 record cuaca harian |
| Kalender | 1 | 1 record event harian |
| **Total/hari** | **~542** | |

### Per Tahun (Ongoing)

```
~542 records/hari × ~260 hari kerja/tahun = ~140,920 records/tahun
```

### Historical Backfill (One-time)

```
SISKAPERBAPO 2015-2026:
  ~11 tahun × 260 hari × 100 records = ~286,000 records

Open-Meteo 2015-2026:
  ~11 tahun × 365 hari × 1 record = ~4,015 records

Total backfill: ~290,000 records
```

### Total Database (Estimasi Tahun 1)

```
Backfill        : ~290,000 records
Ongoing Year 1  : ~140,920 records
Supporting      : ~4,400 records (cuaca + kalender)
Survey          : ~200 records (4 survey × 5 pasar × 10 komoditas)
────────────────────────────────────────
Total           : ~435,520 records

Storage (PostgreSQL): < 500 MB (sangat manageable)
```

---

> **Dokumen ini harus diperbarui** setelah verifikasi teknis terhadap SISKAPERBAPO (kedalaman historis aktual, struktur tabel, ketersediaan data per-pasar untuk Surabaya) dan cross-check independensi data DKPP vs Pasar Surya.
