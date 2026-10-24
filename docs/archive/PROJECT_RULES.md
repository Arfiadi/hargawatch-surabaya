# HargaWatch - AI Coding Rules (SOP)

## 1. Arsitektur & Peran (Hub-and-Spoke 5 Layer)
Sistem ini memusatkan seluruh lalu lintas data di **Supabase (Central Hub)**:
- **Layer 2 (Data Pipeline):** *Web Scraping* dan *Data Cleaning* (tanpa *lookahead bias*) disimpan ke Supabase.
- **Layer 3 (AI & Analytics Engine):** *Script* Python (ML) menarik data historis dari Supabase, mengeksekusi komputasi berat, dan **menyimpan kembali** hasil prediksi & status EWS ke tabel Supabase.
- **Layer 4 (Application Frontend):** Web Next.js **HANYA** melakukan *query (read-only)* data historis dan prediksi langsung dari Supabase. Dilarang membangun/memanggil REST API Python khusus untuk Web.

## 2. Tech Stack & Aturan Backend (Python/ML)
- **Model:** Wajib menggunakan pendekatan *Global Tabular ML* via `lightgbm` (bukan ARIMA/Lokal). Prediksi harus mencakup *Quantile Regression* (Bawah, Median, Atas).
- **Style:** 
  - Gunakan **Type Hints** pada setiap fungsi Python baru.
  - Jangan gunakan `print()` untuk production, gunakan modul logging.
  - Dilarang melakukan interpolasi linier pada *time series* (gunakan *Forward-fill*).
- **Database Client:** Gunakan `supabase-py`. Rahasiakan *Service Role Key* via `.env`.

## 3. Tech Stack & Aturan Frontend (Next.js)
- **Framework:** **Next.js 15+** (App Router) dengan **React 19**.
- **Styling & Grafik (SANGAT KRUSIAL):** 
  - Wajib menggunakan **Tailwind CSS v4**. 
  - **DILARANG KERAS** menginstal *library* grafik pihak ketiga (*Chart.js, Recharts, D3*). 
  - Semua grafik visual (*Sparklines, Bar Charts*) **WAJIB** dirender secara *native* menggunakan elemen HTML DOM murni (contoh: `<div style={{ height: ... }}>`) dikombinasikan dengan Tailwind untuk memastikan performa *loading* < 3 detik.
- **Data Fetching:** Gunakan `@supabase/supabase-js` untuk mengambil data langsung dari Hub Supabase. 
- **Security:** Kredensial Frontend (Anon Key) dilarang melakukan operasi INSERT/UPDATE/DELETE.

## 4. Keamanan Infrastruktur
- Kredensial Supabase (`SUPABASE_URL`, `SUPABASE_KEY`) dilarang di-commit (wajib di `.gitignore`).
- Otomatisasi (Cron) harus tangguh terhadap *downtime* (memiliki mekanisme *catch-up* tanggal).
