# Pipeline & Data Ingestion (`src/pipeline/`)

`src/pipeline/` manages raw data acquisition, resilient HTTP communications, Silver-layer preprocessing, and automated database upsert routines for **HargaWatch Surabaya**.

---

## Overview

Lapisan ingesti dan pemrosesan data mentah yang bertanggung jawab:
- Menarik data harga harian 6 pasar strategis Surabaya dan titik pantau produsen Jawa Timur dari portal SISKAPERBAPO.
- Mengakuisisi data meteorologi harian (curah hujan, suhu, kelembaban, kecepatan angin) dari Open-Meteo ERA5 Reanalysis API.
- Membersihkan dan menormalisasi data (Silver layer) dengan imputasi causal `ffill(limit=7)`.
- Melakukan batch upsert idempotent ke PostgreSQL Supabase.

---

## Interface

### Resilient HTTP Fetcher
- `RobustDataFetcher` ([`fetcher.py`](./fetcher.py)): Client HTTP berbasis `requests.Session` dengan exponential backoff retry dan rotasi User-Agent.
  - `get(url: str, params: Optional[Dict] = None, headers: Optional[Dict] = None, timeout: Optional[int] = None) -> requests.Response`
  - `post(url: str, data: Optional[Union[Dict, str]] = None, json: Optional[Dict] = None, headers: Optional[Dict] = None, timeout: Optional[int] = None) -> requests.Response`
  - Mendukung context manager `with RobustDataFetcher() as fetcher:`.

### Scrapers & Ingestion Routines
- `scrape_pasar(tgl: date, valid_ids: Set[int], pasar_list: Optional[list] = None, jeda: float = 0.5) -> Tuple[List[tuple], bool]` ([`ingestion.py`](./ingestion.py)): Mengambil harga konsumen 6 pasar strategis untuk tanggal target.
- `scrape_produsen(tgl: date) -> Tuple[List[tuple], bool]` ([`ingestion.py`](./ingestion.py)): Mengambil harga produsen/petani tingkat Jawa Timur.
- `imputasi_pasar_missing(cur, tgl: date, rows_scraped: List[tuple]) -> List[tuple]` ([`ingestion.py`](./ingestion.py)): Imputasi data bolong dengan forward-fill lookback 7 hari (`harga_asli = NULL`, `harga_imputasi = prev`, `is_imputed = True`).
- `imputasi_produsen_missing(cur, tgl: date, rows_scraped: List[tuple]) -> List[tuple]` ([`ingestion.py`](./ingestion.py)): Imputasi data produsen lookback 7 hari.
- `upsert(cur, sql: str, records: List[tuple]) -> int` ([`ingestion.py`](./ingestion.py)): Batch execute via `psycopg2.extras.execute_values` dengan `page_size=1000`.
- `ambil_komoditas_valid(cur) -> Set[int]` ([`ingestion.py`](./ingestion.py)): Mengambil ID komoditas aktif dari `dim_komoditas`.
- `target_tanggal(opsi: Optional[str] = None) -> datetime.date` ([`ingestion.py`](./ingestion.py)): Resolusi tanggal target scraping (default: kemarin WIB).
- `periksa_anomali(rows: List[tuple], harga_idx: int, label: str) -> None` ([`ingestion.py`](./ingestion.py)): Peringatan dini harga tak wajar (> Rp 10.000.000).

### Preprocessing & Weather Integration
- `preprocessing_final.py` ([`preprocessing_final.py`](./preprocessing_final.py)): Script pembersih master CSV lokal, memotong null awal, dan menyinkronkan dimensi.
- `download_cuaca.py` ([`download_cuaca.py`](./download_cuaca.py)): Pengunduh data cuaca Open-Meteo ERA5 Reanalysis untuk koordinat Surabaya (-7.2458, 112.7378).
- `download_inflasi_bps.py` ([`download_inflasi_bps.py`](./download_inflasi_bps.py)): Pengunduh data inflasi bulanan BPS Jawa Timur / Kota Surabaya.

---

## Invariants

- **Execution Sovereignty (Cloudflare WAF Guard):** Server SISKAPERBAPO memblokir IP datacenter cloud (HTTP 403 Forbidden). Scraping wajib dijalankan On-Premise via Windows Task Scheduler.
- **Zero Lookahead Bias:** Imputasi hanya diperbolehkan searah maju (forward-fill) maksimal 7 hari berturut-turut (`ffill(limit=7)`). Backward-fill (`bfill`) dan interpolasi terlarang keras.
- **Strategic Market Mapping:** Mengenali secara pasti 6 pasar Surabaya: Pasar Tambahrejo (ID 1), Pasar Wonokromo (ID 2), Pasar Genteng (ID 3), Pasar Pucang Anom (ID 4), Pasar Induk Keputran (ID 5), dan Pasar Soponyono (ID 146).
- **Politeness Delay:** Panggilan antar-pasar ke portal SISKAPERBAPO wajib diberi jeda minimal `0.5` detik (`JEDA_ANTAR_PASAR = 0.5`).
- **Idempotent Upserts:** Seluruh mutasi database wajib menggunakan klausa `ON CONFLICT (...) DO UPDATE`.

---

## Side Effects

- **Network Requests:** Melakukan panggilan HTTP ke portal SISKAPERBAPO, Open-Meteo API, dan BPS.
- **Database Writes:** Menyimpan data mentah dan silver ke Supabase PostgreSQL (`fact_harga_pasar`, `fact_harga_produsen`, `fact_cuaca`, `fact_inflasi`).
- **Local Mirror Writes:** Menyimpan snapshot data olahan ke `data/processed/*.csv`.

---

## Verification

```bash
# Smoke test scraping harian (dry-run)
python scripts/update_harian.py --tanggal 2026-03-01

# Jalankan test suite ingestion dan data quality
pytest tests/test_anomaly_detector.py -v
```
