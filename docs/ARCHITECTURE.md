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
