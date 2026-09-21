# HargaWatch - AI Coding Rules (SOP)

## 1. Arsitektur & Peran (Decoupled)
Sistem ini menggunakan *Decoupled Architecture*:
- **Data Engineering (Hulu):** Scraping dan pembersihan data ke *Silver Layer* Supabase.
- **Machine Learning (Tengah):** Tarik data historis dari *Silver Layer*, jalankan model prediksi, simpan ke *Gold Layer*.
- **Frontend Next.js (Hilir):** Hanya *query* data (read-only) dari Supabase untuk ditampilkan ke Dashboard. Dilarang melakukan komputasi ML atau transformasi data berat di Frontend.

## 2. Tech Stack & Aturan Backend (Python/ML)
- **Library:** Wajib menggunakan pandas (manipulasi data), scikit-learn, dan lightgbm (untuk ML/Forecasting).
- **Style:** 
  - Gunakan **Type Hints** pada setiap fungsi Python baru.
  - Jangan gunakan print() untuk production, gunakan modul logging bawaan Python.
  - Jangan lakukan interpolasi linier pada deret waktu.
- **Database Client:** Gunakan supabase (supabase-py). Jangan menyimpan *Service Role Key* di dalam kode. Selalu gunakan *environment variables* (.env).

## 3. Tech Stack & Aturan Frontend (Next.js)
- **Framework:** Next.js 14+ menggunakan **App Router** (pp/).
- **Styling:** Wajib menggunakan **Tailwind CSS**. Desain harus meniru *mockup* HTML yang ada di docs/stitch/html/. Dilarang menulis CSS inline atau membuat file CSS kustom tanpa alasan kuat.
- **Data Fetching:** Terapkan **React Server Components (RSC)**. Gunakan @supabase/ssr untuk membaca data dari Supabase di *server-side*.
- **Write Operations:** Kredensial Frontend (Anon Key) dilarang melakukan operasi INSERT/UPDATE/DELETE. Akses adalah *read-only*.

## 4. Keamanan Infrastruktur
- Kredensial Supabase (SUPABASE_URL, SUPABASE_KEY) tidak boleh pernah di-commit ke repositori (tercantum di .gitignore).
- Dilarang menjadwalkan *cron job production* menggunakan Windows Task Scheduler lokal. Arahkan arsitektur untuk *deploy* ke VPS Linux / Serverless Cloud.
