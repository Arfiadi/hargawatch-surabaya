# Arsitektur Sistem HargaWatch Surabaya

Dokumen ini memetakan aliran data (*data flow*) dan batasan tanggung jawab (*separation of concerns*) untuk setiap peran dalam proyek HargaWatch.

## Diagram Arsitektur

```mermaid
flowchart TD
    %% Eksternal Data Sources
    subgraph Data Sources [Sumber Data Eksternal]
        S1[SISKAPERBAPO]
        S2[Open-Meteo API\nCuaca]
        S3[BPS Jatim\nInflasi]
    end

    %% Data Engineering Pipeline (Famos)
    subgraph DE [Data Engineering Pipeline\nPython ETL - Cron Job]
        E1(Scraper & Extractor)
        E2(Data Cleaner & Imputation)
    end

    %% Database (Supabase)
    subgraph DB [Supabase - PostgreSQL]
        D1[(Silver Layer:\nfact_harga_pasar)]
        D2[(Gold Layer:\nfact_forecast,\nfact_early_warning)]
    end

    %% Machine Learning Pipeline (Arfi)
    subgraph ML [ML Batch Pipeline\nPython - Cron Job]
        M1(Data Fetcher)
        M2(Prophet / XGBoost\nForecasting)
        M3(Composite Scoring\nEarly Warning)
    end

    %% Web App (Kayla)
    subgraph Web [Frontend Application\nNext.js + Vercel]
        W1[UI Publik:\nDashboard & Peta]
        W2[UI Pemerintah:\nAnalitik & Alert]
    end

    %% End Users
    U1((Masyarakat))
    U2((Pemkot / Analis))

    %% Relasi Data Engineering
    S1 -.->|HTTP POST| E1
    S2 -.->|REST API| E1
    S3 -.->|CSV| E1
    E1 --> E2
    E2 -->|Insert / Upsert| D1

    %% Relasi Machine Learning
    D1 ===>|Tarik Harga Historis| M1
    M1 --> M2
    M1 --> M3
    M2 -->|Simpan Prediksi H+14| D2
    M3 -->|Simpan Status Warning| D2

    %% Relasi Web App
    D1 -.->|Fetch Real-time Data| W1
    D1 -.->|Fetch Analitik| W2
    D2 -.->|Fetch Forecast & Alert| W2
    D2 -.->|Fetch Forecast| W1

    %% Relasi User
    W1 --- U1
    W2 --- U2

    %% Styling
    classDef source fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef de fill:#d4edda,stroke:#28a745,stroke-width:2px;
    classDef ml fill:#cce5ff,stroke:#007bff,stroke-width:2px;
    classDef db fill:#fff3cd,stroke:#ffc107,stroke-width:2px;
    classDef web fill:#f8d7da,stroke:#dc3545,stroke-width:2px;

    class S1,S2,S3 source;
    class E1,E2 de;
    class M1,M2,M3 ml;
    class D1,D2 db;
    class W1,W2 web;
```

## Pembagian Tanggung Jawab (Separation of Concerns)

Berdasarkan arsitektur di atas, proyek ini menggunakan pendekatan **Decoupled Architecture** (tidak saling mengunci). Jika salah satu komponen mati, komponen lain tetap hidup.

### 1. 🟢 Famos (Data Engineer)
- **Fokus:** Mengelola blok hijau (`Data Engineering Pipeline`).
- **Tugas:** Menulis skrip ekstraksi data dari sumber-sumber eksternal, membersihkan data yang kotor, dan memastikannya tersimpan ke tabel *Silver Layer* (`fact_harga_pasar`) di Supabase setiap hari.

### 2. 🔵 Arfi (Data Scientist / ML Engineer)
- **Fokus:** Mengelola blok biru (`ML Batch Pipeline`).
- **Tugas:** Anda **tidak perlu peduli** bagaimana Famos mendapatkan data, dan Anda **tidak perlu peduli** bagaimana Kayla menampilkan data Anda. Tugas Anda murni membaca data historis dari *Silver Layer*, menjalankan komputasi *Forecasting* dan *Anomaly Detection*, lalu menyimpan hasilnya kembali ke *Gold Layer* (`fact_forecast`).

### 3. 🔴 Kayla (Data Analyst / Frontend Developer)
- **Fokus:** Mengelola blok merah (`Frontend Application`).
- **Tugas:** Merakit UI web menggunakan **Next.js** dan mengambil data (*query*) secara aman dari Supabase menggunakan API bawaan Supabase (`@supabase/ssr`). Kayla tidak perlu menjalankan perhitungan ML atau parsing HTML yang berat, cukup fokus pada visualisasi yang mulus untuk pengguna.
