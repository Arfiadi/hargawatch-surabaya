# HargaWatch — Surabaya Food Price Intelligence & Early Warning

Platform intelijen harga pangan dan peringatan dini Kota Surabaya: harga harian per pasar,
perbandingan antar pasar, tren, volatilitas, margin produsen-konsumen, hingga dasar
forecasting dan early warning.

## Sumber Data

| Sumber | Isi | Frekuensi | Cara |
|---|---|---|---|
| [SISKAPERBAPO Jatim](https://siskaperbapo.jatimprov.go.id/harga/tabel) | Harga konsumen 6 pasar Surabaya × 37 komoditas pangan | Harian | Scraping (endpoint AJAX internal) |
| SISKAPERBAPO Jatim | Harga produsen (titik pantau Surabaya) | Harian | Scraping |
| [Open-Meteo Archive](https://archive-api.open-meteo.com/) | Curah hujan, suhu, kelembapan Surabaya | Harian | API publik |
| [BPS](https://www.bps.go.id/id/statistics-table) | Inflasi bulanan (M-to-M) per kota + nasional | Bulanan | Unduh manual → `data/external/inflasi/` |
| Kalender Indonesia (`holidays`) | Libur nasional, cuti bersama, Ramadan | Statis | Dihitung saat preprocessing |

## Struktur Proyek

```
├── data/
│   ├── external/          # cuaca (API), inflasi (manual), koordinat pasar
│   ├── raw/               # hasil scraping mentah (tidak di-commit, regenerable)
│   └── processed/         # silver layer: dim_* & fact_* (tidak di-commit)
├── notebook/
│   ├── eda_pasar.ipynb            # EDA data mentah pasar
│   ├── eda_produsen.ipynb         # EDA data mentah produsen
│   ├── eda_silver.ipynb           # EDA data bersih: tren, volatilitas, margin, Ramadan
│   └── preprocessing_final.ipynb  # pipeline preprocessing (6 temuan audit terpecahkan)
├── scripts/
│   ├── scrape_data.py         # scraper harga konsumen per pasar
│   ├── scrape_produsen.py     # scraper harga produsen
│   ├── download_cuaca.py      # unduh cuaca historis (Open-Meteo)
│   ├── tambah_kalender.py     # enrich kolom kalender/libur/Ramadan
│   ├── preprocessing_final.py # raw → silver layer (dim_* + fact_*)
│   └── ingest_supabase.py     # muat silver layer ke Supabase (PostgreSQL)
└── .env.example               # template kredensial Supabase
```

## Dataset (Silver Layer)

| Tabel | Isi | Baris |
|---|---|---|
| `dim_pasar` | 6 pasar + koordinat (lat/lon) | 6 |
| `dim_komoditas` | komoditas pangan + grup + satuan | 37 |
| `dim_kalender` | kalender + libur + Ramadan | 2.439 |
| `fact_harga_pasar` | harga harian per pasar × komoditas | 477.097 |
| `fact_harga_produsen` | harga produsen titik pantau Surabaya | 4.872 |

Periode: **2020-01-01 s.d. hari ini**. Desain mengikuti prinsip *dual-price column*:
`harga_asli` (NULL bila tidak ada pencatatan) berdampingan dengan `harga_imputasi`
(ffill murni, rupiah bulat, NOT NULL) + flag `is_imputed` — tanpa lookahead bias.

## Cara Menjalankan Ulang Pipeline

```bash
# 1. Scrape harga (resume otomatis — hanya tanggal baru yang diambil)
python scripts/scrape_data.py
python scripts/scrape_produsen.py

# 2. Cuaca
python scripts/download_cuaca.py

# 3. Raw → silver layer
python scripts/preprocessing_final.py

# 4. Muat ke Supabase (butuh .env, lihat .env.example)
python scripts/ingest_supabase.py
```

## Branch

- **`main`** — ringkasan proyek & pipeline stabil
- **`development`** — pekerjaan aktif (migrasi Supabase); lihat README development di branch tersebut

## Lisensi & Atribusi

Data harga: SISKAPERBAPO (Disperindag Jatim). Cuaca: Open-Meteo / ERA5.
Inflasi: BPS. Gunakan sesuai ketentuan masing-masing sumber.
