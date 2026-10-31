# Database Utilities & Infrastructure (`src/utils/`)

`src/utils/` provides centralized database connectivity, SQL DDL schema definitions, batch table loaders, data quality checkers, and credential-sanitized notification utilities for **HargaWatch Surabaya**.

---

## Overview

Paket utilitas fondasional yang mengelola:
- Manajemen pool koneksi PostgreSQL Supabase (Transaction Pooler port 6543 dan Session Pooler port 5432).
- Definisi skema tabel fakta dan dimensi database.
- Skrip migrasi dan batch loader data historis dari file CSV lokal ke Supabase.
- Validasi kualitas data (kelengkapan baris, anomali harga, sinkronisasi kalender).
- Pengiriman notifikasi Telegram dengan pembersihan kredensial otomatis.

---

## Interface

### Database Connection & DDL ([`ingest_supabase.py`](./ingest_supabase.py))
- `koneksi() -> psycopg2.extensions.connection`: Membuka koneksi PostgreSQL menggunakan `SUPABASE_DB_URL` atau parameter konfigurasi environment standard.
- `DDL`: Skema SQL untuk tabel `dim_pasar`, `dim_komoditas`, `dim_kalender`, `fact_harga_pasar`, `fact_harga_produsen`, `fact_cuaca`, dan `fact_inflasi`.
- Batch Loaders:
  - `muat_dim_pasar(conn) -> int`
  - `muat_dim_komoditas(conn) -> int`
  - `muat_dim_kalender(conn) -> int`
  - `muat_fact_harga_pasar(conn) -> int`
  - `muat_fact_harga_produsen(conn) -> int`
  - `muat_fact_cuaca(conn) -> int`
  - `muat_fact_inflasi(conn) -> int`

### ML Database Tables ([`setup_ml_tables.py`](./setup_ml_tables.py))
- DDL dan fungsi pembentuk tabel analitik machine learning: `fact_forecast` dan `fact_early_warning`.

### Data Quality Verification ([`data_quality.py`](./data_quality.py))
- Pengecekan konsistensi integritas referensial, persentase data hilang (*missingness*), serta batas nilai wajar sebelum data diumpankan ke model peramalan.

### Dimension & Calendar Synchronizers
- `tambah_kalender.py` ([`tambah_kalender.py`](./tambah_kalender.py)): Menambahkan rentang tanggal ke tabel `dim_kalender` termasuk atribut hari libur nasional dan perayaan keagamaan.
- `ingest_supabase.py` ([`ingest_supabase.py`](./ingest_supabase.py)): Sinkronisasi master komoditas (`muat_dim_komoditas`) dan pasar (`muat_dim_pasar`).

### Credential-Sanitized Telegram Dispatcher ([`utils_alerting.py`](./utils_alerting.py))
- `send_telegram_alert(pesan: str) -> bool`: Mengirim teks pesan Markdown ke bot Telegram Satgas Pangan. Mengembalikan `True` jika sukses (HTTP 200). Mengganti token bot pada log exception dengan `[REDACTED_BOT_TOKEN]`.

---

## Invariants

- **Credential Redaction Guarantee:** `TELEGRAM_BOT_TOKEN` dan password database tidak boleh dicetak ke stdout, stderr, exception stack trace, atau log file.
- **Referential Integrity Ordering:** Dimensi master (`dim_pasar`, `dim_komoditas`, `dim_kalender`) wajib dimuat dan terisi sebelum operasi penulisan pada tabel fakta (`fact_harga_pasar`, `fact_forecast`, `fact_early_warning`).
- **Connection Fallback:** Mencoba port 6543 (*Transaction Pooler*) terlebih dahulu dan beralih ke port 5432 (*Session Pooler*) bila terjadi connection timeout.

---

## Side Effects

- **PostgreSQL Database Mutations:** Menjalankan DDL migrasi skema dan batch insertion data ke Supabase.
- **Telegram HTTPS Requests:** Melakukan panggilan ke `https://api.telegram.org/bot.../sendMessage`.

---

## Verification

```bash
# Verifikasi konektivitas database dan kesiapan skema
python src/utils/ingest_supabase.py --verify

# Verifikasi kualitas data
python src/utils/data_quality.py
```
