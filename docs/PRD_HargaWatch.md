# AI-Actionable PRD: HargaWatch Surabaya
**Version:** 3.0 (Next.js Frontend + ML Batch Pipeline Integration)
**Target:** Next.js (React) + Tailwind CSS + Python ML Batch Pipeline

## 1. Strict Tech Stack & Dependencies
Eksekusi pengembangan harus dibatasi pada pustaka dan versi berikut untuk menjamin stabilitas integrasi sistem.

**Konfigurasi Environment Backend (`.env`):**
```env
SUPABASE_URL=https://ylzcvgmkaciawvfhbxvn.supabase.co
SUPABASE_KEY=<SERVICE_ROLE_KEY_FOR_ML_WRITE>
```

**Konfigurasi Environment Frontend (`web/.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ylzcvgmkaciawvfhbxvn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY_DARI_FAMOS>
```

**`requirements.txt` (Hanya untuk Machine Learning):**
```text
plotly>=5.18.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
prophet>=1.1.5       # Untuk model baseline Time-Series Forecasting
supabase>=2.3.0      # Harus menggunakan versi 2+ untuk API terbaru
```

**Frontend Stack (`web/package.json`):**
- Framework: **Next.js 14+** (App Router, React, TypeScript)
- Styling: **Tailwind CSS** (Sesuai dengan HTML Stitch)
- Database Client: `@supabase/ssr` dan `@supabase/supabase-js`
- Charting: `recharts` atau library sejenis

## 2. Database Schema (DDL) Extension
Di samping tabel *Silver Layer* yang sudah ada (`dim_pasar`, `dim_komoditas`, `dim_kalender`, `fact_harga_pasar`), agen AI harus mengeksekusi DDL berikut di Supabase untuk menampung hasil Machine Learning:

```sql
-- Tabel untuk menyimpan hasil prediksi 7-14 hari ke depan
CREATE TABLE IF NOT EXISTS public.fact_forecast (
    tanggal DATE NOT NULL,          -- Tanggal prediksi di masa depan
    pasar_id INT NOT NULL REFERENCES public.dim_pasar(pasar_id),
    komoditas_id INT NOT NULL REFERENCES public.dim_komoditas(komoditas_id),
    harga_prediksi INT NOT NULL,
    batas_bawah INT,
    batas_atas INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tanggal, pasar_id, komoditas_id)
);

-- Tabel untuk menyimpan hasil sistem skoring komposit Early Warning
CREATE TABLE IF NOT EXISTS public.fact_early_warning (
    tanggal DATE NOT NULL,          -- Tanggal analisis berjalan (hari ini)
    pasar_id INT NOT NULL REFERENCES public.dim_pasar(pasar_id),
    komoditas_id INT NOT NULL REFERENCES public.dim_komoditas(komoditas_id),
    skor_tren INT DEFAULT 0,
    skor_volatilitas INT DEFAULT 0,
    skor_anomali INT DEFAULT 0,
    skor_prediksi INT DEFAULT 0,
    total_skor INT NOT NULL,
    status_warning VARCHAR(20) NOT NULL CHECK (status_warning IN ('NORMAL', 'WASPADA', 'TINGGI')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tanggal, pasar_id, komoditas_id)
);
```

## 3. Repository File Structure (Target State)
Agen harus membangun atau memperbarui file dengan mematuhi hierarki berikut:

```text
hargawatch-surabaya/
├── data/                       # (Existing)
├── scripts/                    # (Existing)
│   ├── update_catchup.py
│   └── ml_pipeline.py          # [NEW] Skrip utama ML Batch Job
├── web/                        # [NEW] Direktori web Next.js
│   ├── package.json            # [NEW] Dependensi Next.js & React
│   ├── app/                    # [NEW] App Router Next.js
│   │   ├── page.tsx            # [NEW] Landing & Dashboard Publik (Best Price Finder)
│   │   └── dashboard/          # [NEW] Dashboard Pemerintah (Early Warning, Analitik)
│   │       └── page.tsx        
│   ├── components/             # [NEW] UI Components dari mockups Stitch HTML/CSS
│   └── lib/                    # [NEW] Supabase client utils (@supabase/ssr)
├── requirements.txt            # Python dependencies (ML)
└── .env                        # Python env vars
```

## 4. Sequential Execution Plan (Agentic Workflow)

### Phase 1: Database Setup & Data Fetching Interface
- **Tugas:** Setup *Supabase client* di Next.js (`web/lib/supabase.ts`) dan Python (`scripts/utils.py`). Buat fungsi untuk menarik data mentah `fact_harga_pasar` (filter >= H-90 untuk mencegah penarikan >400k baris).
- **Kendali:** Gunakan arsitektur *Server Components* pada Next.js agar *fetching* Supabase terjadi di *backend* untuk keamanan dan performa.

### Phase 2: Machine Learning Batch Script (`scripts/ml_pipeline.py`)
- **Tugas:** 
  1. *Fetch* data historis (menggunakan kolom `harga_imputasi` agar time-series tidak *bolong*).
  2. Latih model `Prophet` untuk *forecast* harian (H+1 sampai H+7).
  3. Hitung Z-Score volatilitas (30 hari terakhir).
  4. Agregasi *Composite Score* (Sesuai PRD: Tren + Volatilitas + Anomali + Prediksi).
  5. *Upsert* hasil ke tabel `fact_forecast` dan `fact_early_warning`.
- **Kendali:** Loop *training* dibatasi hanya pada komoditas utama (beras, gula, minyak, cabai, telur, daging) terlebih dahulu untuk memvalidasi *pipeline*.

### Phase 3: Next.js Frontend Development (`web/`)
- **Tugas:** Bangun UI web modern mengadaptasi kode HTML/CSS dari *Stitch mockups*.
  1. Ekstrak aset HTML dari folder `docs/stitch/html/` ke dalam bentuk komponen React (JSX/TSX) dan styling dengan Tailwind CSS.
  2. Integrasi UI *Smart Shopping Basket* dengan *state management* (React `useState`).
  3. Tampilkan *Metric Card* Early Warning menarik data dari `fact_early_warning`.
- **Kendali:** Pastikan desain *pixel-perfect* semirip mungkin dengan mockup Stitch. Hindari *hardcode* tanggal.

## 5. Agentic Acceptance Criteria (Syarat Kelulusan Biner)

Agen dilarang berpindah fase jika kriteria berikut memberikan respon `False`:

- **Phase 1 AC:** Koneksi Supabase dari Next.js *Server Component* berhasil mereturn data JSON harga tanpa error CORS atau koneksi. `(True/False)`
- **Phase 2 AC:** `ml_pipeline.py` ketika dieksekusi via terminal berakhir dengan `exit code 0` dan merekam baris *insert* baru ke tabel `fact_forecast`. `(True/False)`
- **Phase 3 AC:** Proyek web dapat di-*build* (`npm run build`) tanpa menimbulkan *TypeScript error* atau kegagalan *bundling*. Visualisasi data termuat minimal untuk satu komoditas secara sukses. `(True/False)`
