# Arsitektur Sistem HargaWatch Surabaya

Dokumen ini memetakan aliran data (*data flow*) dan batasan tanggung jawab (*separation of concerns*) untuk setiap peran dalam proyek HargaWatch.

## Diagram Arsitektur

`mermaid
flowchart TD
    subgraph Data Sources [Sumber Data Eksternal]
        S1[SISKAPERBAPO]
        S2[Open-Meteo API\nCuaca]
        S3[BPS Jatim\nInflasi]
    end

    subgraph DE [Data Engineering Pipeline\nPython ETL - Cron Job]
        E1(Scraper & Extractor)
        E2(Data Cleaner & Imputation)
    end

    subgraph DB [Supabase - PostgreSQL]
        D1[(Silver Layer:\nfact_harga_pasar)]
        D2[(Gold Layer:\nfact_forecast,\nfact_early_warning)]
    end

    subgraph ML [ML Batch Pipeline\nPython - Cron Job]
        M1(Data Fetcher)
        M2(LightGBM Forecasting)
        M3(Composite Scoring EWS)
    end

    subgraph Web [Frontend Application\nNext.js + Vercel]
        W1[UI Publik:\nDashboard & Peta]
        W2[UI Pemerintah:\nAnalitik & Alert]
    end

    U1((Masyarakat))
    U2((Pemkot / Analis))

    S1 -.->|HTTP POST| E1
    S2 -.->|REST API| E1
    S3 -.->|CSV| E1
    E1 --> E2
    E2 -->|Insert / Upsert| D1

    D1 ===>|Tarik Harga Historis| M1
    M1 --> M2
    M1 --> M3
    M2 -->|Simpan Prediksi H+14| D2
    M3 -->|Simpan Status Warning| D2

    D1 -.->|Fetch Real-time Data| W1
    D1 -.->|Fetch Analitik| W2
    D2 -.->|Fetch Forecast & Alert| W2
    D2 -.->|Fetch Forecast| W1

    W1 --- U1
    W2 --- U2
`

## Pembagian Tanggung Jawab (Separation of Concerns)

1. **Famos (Data Engineer):** Mengelola ekstraksi data dari sumber eksternal, membersihkan data yang kotor, dan menyimpannya ke tabel *Silver Layer* (act_harga_pasar).
2. **Arfi (Data Scientist / ML Engineer):** Murni membaca data historis dari *Silver Layer*, menjalankan komputasi *Forecasting* dan *Anomaly Detection*, lalu menyimpan hasilnya kembali ke *Gold Layer* (act_forecast, act_early_warning).
3. **Kayla (Data Analyst / Frontend Developer):** Merakit UI web menggunakan **Next.js** dan mengambil data (*read-only*) dari Supabase untuk visualisasi yang interaktif.

## Database Schema (Core Tables)

### Silver Layer
- dim_pasar: Data master 6 pasar (id, nama, lokasi).
- dim_komoditas: Data master 37 komoditas (id, nama, satuan).
- dim_kalender: Data dimensi waktu, libur nasional, dan bulan Ramadan.
- act_harga_pasar: Tabel harga harian (observasi aktual harga_asli dan harga_imputasi).

### Gold Layer (ML Targets)
- act_forecast: Menyimpan hasil ramalan harga jangka pendek (7-14 hari ke depan). Memiliki batas bawah, batas tengah, dan batas atas.
- act_early_warning: Menyimpan status anomali harga komposit (NORMAL, WASPADA, TINGGI).

## Struktur Direktori Proyek

```text
hargawatch-surabaya/
│
├── data/                           # 📂 Penyimpanan data lokal (diabaikan git)
│   ├── raw/                        # Data mentah dari API / scraping SISKAPERBAPO
│   ├── processed/                  # Data bersih & terstandardisasi (Silver Layer lokal)
│   └── external/                   # Data pendukung (cuaca, inflasi, kalender)
│
├── models/                         # 🤖 Artefak model ML yang sudah dilatih (.pkl / .pt)
│   ├── forecasting/                # Model prediksi time-series
│   └── anomaly_detection/          # Model deteksi anomali harga
│
├── notebook/                       # 🧪 Eksplorasi & prototyping (Jupyter Notebook)
│
├── src/                            # 💻 KODE INTI (Modul Python yang dapat diimpor)
│   ├── pipeline/                   # Data Pipeline: scraping, download, preprocessing
│   │   ├── scrape_data.py          # Scraper harga konsumen dari SISKAPERBAPO
│   │   ├── scrape_produsen.py      # Scraper harga produsen
│   │   ├── download_cuaca.py       # Pengambil data cuaca dari Open-Meteo
│   │   ├── download_inflasi_bps.py # Pengambil data inflasi dari BPS
│   │   ├── preprocessing_final.py  # Pembersih & normalizer data
│   │   ├── fetcher.py              # [Placeholder] API client dengan retry/timeout
│   │   └── cleaner.py              # [Placeholder] Penanganan missing values (ffill)
│   │
│   ├── analytics/                  # Logika Analitik & Feature Engineering
│   │   ├── features.py             # Feature engineering untuk time-series forecasting
│   │   ├── metrics.py              # [Placeholder] Kalkulasi WoW, MoM, volatilitas
│   │   └── seasonal.py             # [Placeholder] Analisis pola Ramadan/Nataru
│   │
│   ├── models/                     # Logika Pemodelan Machine Learning
│   │   ├── models.py               # LightGBM Quantile Forecaster + baseline models
│   │   ├── backtest.py             # Walk-forward rolling-origin backtesting engine
│   │   ├── forecast_engine.py      # [Placeholder] Wrapper training & prediksi
│   │   └── anomaly_detector.py     # [Placeholder] Deteksi lonjakan harga tidak wajar
│   │
│   ├── safety/                     # Sistem Peringatan Dini (Early Warning System)
│   │   ├── early_warning.py        # Composite scoring: Normal / Waspada / Tinggi
│   │   └── alert_generator.py      # [Placeholder] Pembuat teks otomatis Price Surge Alert
│   │
│   └── utils/                      # Fungsi Pembantu Umum
│       ├── ingest_supabase.py      # Koneksi & DDL Supabase PostgreSQL
│       ├── setup_ml_tables.py      # Setup tabel Gold Layer (fact_forecast, fact_early_warning)
│       ├── tambah_kalender.py      # Generator dim_kalender (libur, Ramadan)
│       ├── utils_alerting.py       # Kirim notifikasi Telegram
│       └── logger.py               # [Placeholder] Logging sistem untuk monitoring
│
├── scripts/                        # ⚙️ Entry Points / Eksekutor (Runner Scripts)
│   ├── update_harian.py            # Cron job harian: scrape + upsert ke Supabase
│   ├── update_catchup.py           # Isi tanggal bolong di database secara otomatis
│   ├── run_forecasting.py          # Pipeline forecasting & early warning
│   ├── run_wandb_experiment.py     # Tracker eksperimen ML ke Weights & Biases
│   ├── run_pipeline.sh             # Runner bash untuk Linux VPS / Cron
│   └── generate_daily_alerts.py    # [Placeholder] Evaluasi risiko & update peringatan dini
│
├── config/                         # 🛠️ Konfigurasi Sistem
│   ├── config.yaml                 # [Placeholder] Konfigurasi database & threshold
│   └── commodities.json            # [Placeholder] Pemetaan nama komoditas/pasar
│
├── tests/                          # 🧪 Pengujian Otomatis (Pytest)
│   ├── conftest.py                 # Fixtures & data sintetis untuk pengujian
│   ├── test_alerting.py            # Uji notifikasi Telegram
│   ├── test_data_quality.py        # Uji kualitas data (ffill, outlier)
│   ├── test_early_warning.py       # Uji logika status Normal/Waspada/Tinggi
│   ├── test_ml_features.py         # Uji feature engineering (zero lookahead bias)
│   ├── test_ml_models.py           # Uji model forecasting (baseline & LightGBM)
│   └── test_pipeline_integration.py # Uji koneksi Supabase & skema tabel
│
├── web/                            # 🌐 Frontend Dashboard (Next.js 14 + Tailwind CSS)
│   └── src/
│       ├── app/                    # Halaman: /, /early-warning, /forecasting, /peta
│       ├── components/             # UI: SmartShoppingBasket, PriceTrendChart, dll
│       ├── data/                   # Mock data untuk pengembangan
│       └── lib/                    # Supabase client (supabase.ts)
│
├── docs/                           # 📖 Dokumentasi Proyek
│   ├── ARCHITECTURE.md             # (File ini) Peta arsitektur & struktur direktori
│   ├── PRD_HargaWatch.md           # Product Requirements Document
│   └── Evaluasi_Struktur_Proyek.md # Catatan evaluasi sebelum restrukturisasi
│
├── PROJECT_RULES.md                # Aturan koding ketat untuk AI Agent
├── ROADMAP.md                      # Status proyek & backlog mendesak
├── requirements.txt                # Semua dependensi (backward compatibility)
├── requirements-pipeline.txt       # Dependensi khusus data pipeline
└── requirements-ml.txt             # Dependensi khusus machine learning
```
