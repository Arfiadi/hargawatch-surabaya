# Panduan Deployment On-Premise Windows (Task Scheduler)

Dokumen ini adalah panduan lengkap untuk mengatur eksekusi otomatis pipeline harian **HargaWatch Surabaya** di laptop/PC Windows tanpa memerlukan Docker.

---

## 1. Arsitektur Deployment

Pipeline berjalan secara otomatis setiap hari dengan urutan:
1. **Scraping Data:** Menjalankan `scripts/update_harian.py` untuk mengambil data harga pangan kemarin dari SISKAPERBAPO Jawa Timur & cuaca OpenMeteo, lalu meng-upsert ke tabel `fact_harga_pasar` dan `fact_harga_produsen` di Supabase.
2. **Forecasting & EWS:** Menjalankan `scripts/run_forecasting.py --from-db` untuk menarik data terbaru dari Supabase, memuat *champion model* dari W&B Registry / lokal, menghasilkan prediksi harga 14 hari ke depan (p10, p50, p90), menghitung skor matriks Early Warning System (EWS), dan menyimpannya ke Supabase.
3. **Pencatatan Log:** Seluruh output dan riwayat eksekusi disimpan ke file `logs/daily_pipeline.log`.

---

## 2. Prasyarat (Satu Kali Setup)

Pastikan langkah-langkah ini sudah selesai di laptop yang bertindak sebagai runner:

1. **Virtual Environment & Dependencies:**
   Buka terminal PowerShell di folder proyek dan pastikan dependencies sudah terinstal:
   ```powershell
   # Buat venv jika belum ada
   python -m venv .venv

   # Install dependencies
   .\.venv\Scripts\pip install -r requirements.txt
   ```

2. **Konfigurasi `.env`:**
   Pastikan file `.env` sudah ada di *root* direktori proyek dan berisi:
   ```env
   # Database Supabase
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_KEY=eyJh...
   DATABASE_URL=postgresql://postgres:...@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

   # MLOps Weights & Biases (Opsional, ada fallback lokal)
   WANDB_API_KEY=kunci_api_wandb_anda
   WANDB_PROJECT=hargawatch-surabaya
   ```

---

## 3. Uji Coba Manual

Sebelum mengatur otomatisasi, uji coba apakah script batch dapat berjalan dengan benar:

1. Buka File Explorer dan masuk ke folder proyek `hargawatch-surabaya`.
2. Klik ganda (*double-click*) file **`run_pipeline.bat`**, atau jalankan melalui terminal:
   ```cmd
   run_pipeline.bat
   ```
3. Buka folder `logs/` dan periksa isi file `daily_pipeline.log`. Pastikan terdapat baris:
   ```
   [FINISHED] Exit code: 0 at ...
   ```

---

## 4. Setup Otomatisasi dengan Windows Task Scheduler

Ikuti langkah-langkah berikut untuk menjadwalkan eksekusi otomatis setiap hari:

### Langkah 1: Buka Task Scheduler
1. Tekan tombol **Windows + R** pada keyboard.
2. Ketik `taskschd.msc` lalu tekan **Enter**.

### Langkah 2: Buat Basic Task
1. Di panel sebelah kanan (*Actions*), klik **Create Basic Task...**
2. **Name:** Masukkan `HargaWatch_Daily_Pipeline`
3. **Description:** `Otomatisasi scraping dan forecasting harian HargaWatch Surabaya`
4. Klik **Next**.

### Langkah 3: Atur Jadwal (Trigger)
1. Pilih **Daily** (Harian), lalu klik **Next**.
2. **Start:** Tentukan jam eksekusi, disarankan **06:00:00 AM** (karena data hari kemarin sudah lengkap terisi dan sebelum jam kerja dimulai).
3. **Recur every:** `1 days`.
4. Klik **Next**.

### Langkah 4: Tentukan Aksi (Action)
1. Pilih **Start a program**, lalu klik **Next**.
2. **Program/script:** Klik tombol **Browse...** dan arahkan ke file:
   `D:\...\hargawatch-surabaya\run_pipeline.bat`
3. **Start in (optional):** Masukkan path folder proyek Anda (tanpa tanda kutip), misalnya:
   `D:\ARFI\Kuliah\Project\project-semester5\hargawatch-surabaya`
   *(Sangat disarankan diisi agar Windows mengetahui direktori kerja script)*.
4. Klik **Next**, lalu klik **Finish**.

### Langkah 5: Pengaturan Tambahan (Opsional tapi Direkomendasikan)
1. Di Task Scheduler Library, klik ganda task **HargaWatch_Daily_Pipeline** yang baru dibuat.
2. Pada tab **General**:
   - Centang opsi **Run with highest privileges** (opsional, untuk memastikan akses file lancar).
3. Pada tab **Conditions**:
   - Di bagian *Power*, Anda bisa mencentang **Wake the computer to run this task** jika ingin laptop otomatis bangun dari mode *sleep* saat jam 06:00 pagi.
   - Di bagian *Network*, centang **Start only if the following network connection is available** dan pilih **Any connection** (agar tidak berjalan jika laptop tidak ada internet).
4. Pada tab **Settings**:
   - Centang **Run task as soon as possible after a scheduled start is missed** (jika laptop mati jam 06:00 pagi dan baru dinyalakan jam 08:00, script akan langsung mengejar ketinggalan saat laptop menyala).
5. Klik **OK** untuk menyimpan.

---

## 5. Pemantauan & Troubleshooting

### Melihat Riwayat Eksekusi
Buka file `logs/daily_pipeline.log` untuk melihat riwayat eksekusi setiap harinya. Setiap sesi diawali dengan banner tanggal dan waktu, diikuti log detail dari scraper dan forecasting.

### Kode Keluar (Exit Codes)
- **`0`**: Sukses penuh (Scraping dan forecasting berhasil 100%).
- **`1`**: Kegagalan pada tahap scraping (misal koneksi internet mati atau SISKAPERBAPO sedang *down*). Downstream forecasting otomatis dihentikan agar tidak membuat prediksi berbasis data yang belum ter-update.
- **`2`**: Kegagalan pada tahap forecasting.

### Menjalankan Opsi Khusus Secara Manual
Anda juga dapat menjalankan runner Python secara manual dengan argumen khusus:
```powershell
# Hanya jalankan forecasting (lewati scraping)
.\.venv\Scripts\python.exe scripts/run_daily_pipeline.py --skip-scrape

# Scraping tanggal tertentu (misal untuk catchup data yang terlewat)
.\.venv\Scripts\python.exe scripts/run_daily_pipeline.py --tanggal 2026-09-25

# Uji coba lokal tanpa mengunggah hasil ke Supabase
.\.venv\Scripts\python.exe scripts/run_daily_pipeline.py --local-only
```
