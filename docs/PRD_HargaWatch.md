# AI-Actionable PRD: HargaWatch Surabaya
**Version:** 3.1 (Optimized AI Context)
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

## 2. Sequential Execution Plan (Agentic Workflow)

### Phase 1: Database Setup & Data Fetching Interface
- **Tugas:** Setup *Supabase client* di Next.js (`web/lib/supabase.ts`) dan Python (`src/utils/ingest_supabase.py`). Buat fungsi untuk menarik data mentah `fact_harga_pasar` (filter >= H-90 untuk mencegah penarikan >400k baris).
- **Kendali:** Gunakan arsitektur *Server Components* pada Next.js agar *fetching* Supabase terjadi di *backend* untuk keamanan dan performa.

### Phase 2: Machine Learning Batch Script (`scripts/run_forecasting.py`)
- **Tugas:** 
  1. *Fetch* data historis (menggunakan kolom `harga_imputasi` agar time-series tidak *bolong*).
  2. Latih model *Machine Learning / Time-Series* (berdasarkan algoritma terbaik dari eksperimen di folder `notebook/`) untuk *forecast* harian (H+1 sampai H+14).
  3. Hitung Z-Score volatilitas (30 hari terakhir).
  4. Agregasi *Composite Score* (Tren + Volatilitas + Anomali + Prediksi) untuk Early Warning.
  5. *Upsert* hasil ke tabel `fact_forecast` dan `fact_early_warning`.
- **Kendali:** Logika ML harus di-*porting* secara rapi dari eksplorasi di dalam folder `notebook/`.

### Phase 3: Next.js Frontend Development (`web/`)
- **Tugas:** Bangun UI web modern mengadaptasi kode HTML/CSS dari *Stitch mockups*.
  1. Ekstrak aset HTML dari folder `docs/stitch/html/` ke dalam bentuk komponen React (JSX/TSX) dan styling dengan Tailwind CSS.
  2. Integrasi UI *Smart Shopping Basket* dengan *state management* (React `useState`).
  3. Tampilkan *Metric Card* Early Warning menarik data dari `fact_early_warning`.
- **Kendali:** Pastikan desain *pixel-perfect* semirip mungkin dengan mockup Stitch. Hindari *hardcode* tanggal.

## 3. Agentic Acceptance Criteria (Syarat Kelulusan Biner)

Agen dilarang berpindah fase jika kriteria berikut memberikan respon `False`:

- **Phase 1 AC:** Koneksi Supabase dari Next.js *Server Component* berhasil mereturn data JSON harga tanpa error CORS atau koneksi. `(True/False)`
- **Phase 2 AC:** Skrip ML ketika dieksekusi via terminal berakhir dengan `exit code 0` dan merekam baris *insert* baru ke tabel `fact_forecast` di Supabase. `(True/False)`
- **Phase 3 AC:** Proyek web dapat di-*build* (`npm run build`) tanpa menimbulkan *TypeScript error* atau kegagalan *bundling*. Visualisasi data termuat minimal untuk satu komoditas secara sukses. `(True/False)`

## 4. Persyaratan Non-Fungsional & Aturan Domain Bisnis (Data Rules)
Untuk memastikan akurasi fitur-fitur di atas, pengembangan (terutama oleh AI) harus mematuhi logika domain pasar berikut:

### A. Konteks Pasar Keputran (Grosir vs Eceran)
- Sistem memantau 6 pasar. 5 di antaranya adalah pasar eceran (Tambahrejo, Wonokromo, Genteng, Pucang Anom, Soponyono).
- **Pasar Keputran adalah pasar GROSIR (Induk).**
- **Aturan:** Harga Keputran tidak boleh dibandingkan secara langsung (apple-to-apple) dengan 5 pasar eceran pada fitur *Best Price Finder* atau *Shopping Basket*, karena harga grosir secara alami selalu lebih murah. Keputran utamanya digunakan sebagai *leading signal* untuk model *Forecasting* dan *Early Warning System*.

### B. Filosofi Imputasi Data (Zero Lookahead Bias)
- Kolom `harga_asli` di tabel `fact_harga_pasar` adalah nilai murni observasi lapangan (berisi `NULL` pada hari libur/kosong). Nilai ini harus digunakan saat menampilkan data harga hari ini ke pengguna akhir.
- Kolom `harga_imputasi` adalah nilai kontinu yang diisi menggunakan **Forward-Fill Murni (maksimal 7 hari)** untuk keperluan *training* Machine Learning dan grafik *Time-Series*.
- **Aturan:** Dilarang keras menggunakan interpolasi linier untuk mengisi kekosongan data, karena hal ini membocorkan data masa depan ke masa lalu (*Lookahead Bias*).
- Sistem **tidak melakukan pemotongan outlier (Non-Winsorization)**. Lonjakan harga ekstrem dipertahankan karena merupakan sinyal anomali nyata yang justru dicari oleh model.
- Setiap pengambilan data (*query*) dari `fact_harga_pasar` **wajib di-filter berdasarkan tanggal** untuk mencegah *over-fetching* dari database.
