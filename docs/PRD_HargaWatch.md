# AI-Actionable PRD: HargaWatch Surabaya
**Version:** 3.0 (Next.js Frontend + ML Batch Pipeline Integration)
**Target:** Next.js (React) + Tailwind CSS + Python ML Batch Pipeline

**Platform Intelijen Harga Pangan dan Early Warning Kota Surabaya**

---

## 1. Visi & Overview Produk

### Visi
HargaWatch bukan sekadar dashboard harga pasar. Sistem ini dibangun untuk menjawab tiga pertanyaan inti bagi masyarakat, pedagang, dan pemerintah Surabaya:

1. **Harga hari ini** — di pasar mana harga suatu komoditas paling murah?
2. **Tren ke depan** — apakah harga suatu komoditas cenderung naik atau turun?
3. **Peringatan dini** — kalau ada lonjakan harga tidak wajar, kita tahu lebih awal, bukan setelah harga sudah tinggi.

Kami tidak membangun semua fitur sekaligus. Kami mulai dari fondasi data yang bisa dipercaya dari beberapa pasar strategis, baru naik bertahap ke analitik dan prediksi.

### Gambaran Produk
Produk berbentuk web dashboard dengan dua sisi tampilan:
- **Publik**: untuk masyarakat/konsumen — cek harga, bandingkan pasar, lihat tren
- **Pemerintah/Analis**: tampilan lebih dalam untuk Dinas terkait, pengelola pasar, dan peneliti

### Target User
Masyarakat/konsumen, Pemkot Surabaya, dinas terkait, pengelola pasar, pedagang/UMKM, peneliti. **Catatan penting**: proyek ini adalah tugas mata kuliah dengan syarat produk harus dapat diakses oleh user nyata — bukan hanya demo lokal.

### Spesifikasi Detail Produk
Tabel berikut adalah spesifikasi produk sesuai brief dari dosen, disalin apa adanya.

| Komponen | HargaWatch — Surabaya Food Price Intelligence & Early Warning |
| --- | --- |
| Nama Produk | HargaWatch |
| Judul Proyek | HargaWatch — Platform Intelijen Harga Pangan dan Early Warning Kota Surabaya |
| Wilayah | Kota Surabaya, dengan analisis harga pada berbagai pasar yang tersedia dalam sumber data |
| User Utama | Masyarakat/konsumen, Pemkot Surabaya, Dinas terkait, pengelola pasar, pedagang/UMKM, peneliti, dan stakeholder pangan |
| Tujuan Utama | Menyediakan harga pangan terkini, perbandingan harga antar pasar, tren harga, prediksi, dan peringatan dini perubahan harga agar masyarakat dapat mengambil keputusan belanja dan pemerintah memperoleh insight untuk pemantauan harga |
| Komoditas | Beras, gula, minyak goreng, telur, daging ayam, daging sapi, cabai, bawang merah, bawang putih, sayuran, dan komoditas strategis lain sesuai ketersediaan data |
| Sumber Data Utama | Data harga pangan pasar di Surabaya dari API/open data resmi yang tersedia, ditambah historical data untuk membangun analitik dan forecasting |
| Update Data | Otomatis melalui API dengan timestamp last updated. Sistem menyimpan data historis sehingga setiap pembaruan memperkaya time series |
| Data Pendukung | Cuaca, curah hujan, hari libur, Ramadan/Idulfitri/Natal-Tahun Baru, kalender, inflasi pangan, produksi/pasokan apabila tersedia, serta variabel lain yang secara metodologis relevan |
| Data Pipeline | API → validation → cleaning → standardisasi komoditas/pasar → database → analytics → dashboard/app. Sistem memberikan indikator jika API gagal atau data belum diperbarui |
| Best Price Finder | User memilih komoditas → sistem menampilkan harga dan pasar yang tersedia serta urutan harga berdasarkan data terbaru |
| Smart Shopping Basket | User membuat keranjang, misalnya beras + telur + cabai + bawang → sistem menghitung estimasi total biaya keranjang pada masing-masing pasar |
| Price Trend | Grafik perubahan harga harian/mingguan/bulanan per komoditas dan pasar |
| Price Change Analytics | Persentase kenaikan/penurunan harga, moving average, volatilitas, perubahan WoW/MoM, dan pola musiman |
| Price Volatility | Mengidentifikasi komoditas yang harganya relatif stabil dan yang memiliki fluktuasi tinggi |
| Spatial/Market Analytics | Peta pasar Kota Surabaya dengan harga komoditas, perubahan harga, dan indikator kondisi harga masing-masing pasar |
| Forecasting | Prediksi harga jangka pendek, misalnya 7–14 hari, menggunakan time-series/ML yang sesuai dan dibandingkan dengan baseline |
| Variabel Eksternal | Menguji apakah cuaca, hari besar, musim, inflasi, atau variabel pasokan membantu meningkatkan kemampuan prediksi; tidak otomatis diasumsikan sebagai penyebab |
| Anomaly Detection | Mendeteksi perubahan harga yang tidak biasa dibanding pola historis suatu komoditas/pasar |
| Early Warning | Status sederhana seperti Normal – Waspada – Tinggi berdasarkan kombinasi kenaikan harga, volatilitas, anomaly, dan forecast; aturan harus transparan |
| Price Surge Alert | Peringatan seperti: "Harga cabai merah meningkat signifikan dalam 7 hari terakhir pada beberapa pasar dan diperkirakan masih berada pada level tinggi." |
| Commodity Risk Map | Matriks komoditas × pasar untuk menunjukkan komoditas/pasar yang sedang mengalami kenaikan atau volatilitas tinggi |
| Seasonal Insight | Menganalisis pola harga menjelang Ramadan, Idulfitri, Natal/Tahun Baru atau periode tertentu berdasarkan historical data |
| Public Dashboard | Tampilan sederhana untuk masyarakat: Harga Hari Ini → Cari Komoditas → Bandingkan Pasar → Tren → Prediksi → Alert |
| Government/Analyst View | Tampilan lebih dalam untuk Dinas terkait, pengelola pasar, dan peneliti |

---

## 2. Strict Tech Stack & Dependencies
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

## 3. Database Schema (DDL) Extension
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

## 4. Repository File Structure (Target State)
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

## 5. Sequential Execution Plan (Agentic Workflow)

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

## 6. Agentic Acceptance Criteria (Syarat Kelulusan Biner)

Agen dilarang berpindah fase jika kriteria berikut memberikan respon `False`:

- **Phase 1 AC:** Koneksi Supabase dari Next.js *Server Component* berhasil mereturn data JSON harga tanpa error CORS atau koneksi. `(True/False)`
- **Phase 2 AC:** `ml_pipeline.py` ketika dieksekusi via terminal berakhir dengan `exit code 0` dan merekam baris *insert* baru ke tabel `fact_forecast`. `(True/False)`
- **Phase 3 AC:** Proyek web dapat di-*build* (`npm run build`) tanpa menimbulkan *TypeScript error* atau kegagalan *bundling*. Visualisasi data termuat minimal untuk satu komoditas secara sukses. `(True/False)`
