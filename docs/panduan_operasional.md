# Panduan Operasional & Standard Operating Procedure (SOP)
## Pipeline Produksi Harian HargaWatch Surabaya

Dokumen ini adalah **SOP resmi dan Runbook Operasional** untuk menjalankan, memonitor, dan memelihara pipeline data, peramalan harga pangan (*forecasting*), serta sistem peringatan dini (*Early Warning System*) Kota Surabaya.

---

## 1. Arsitektur & Alur Kerja Harian

Pipeline operasional berjalan setiap hari secara otomatis tanpa intervensi manual melalui skrip master **`run_pipeline.bat`** yang mengorkestrasi file **`scripts/run_daily_pipeline.py`**.

```mermaid
flowchart TD
    subgraph Eksekusi Pagi [Pukul 06:00 AM]
        Bat[run_pipeline.bat] --> PyMaster[scripts/run_daily_pipeline.py]
    end

    subgraph Tahap 1: Data Engineering
        PyMaster -->|Step 1| S1[scripts/update_harian.py]
        S1 -->|Scrape| Web[SISKAPERBAPO & OpenMeteo]
        S1 -->|Pembersihan & Ffill| Silver[(Supabase: fact_harga_pasar)]
    end

    subgraph Tahap 2: AI & Analytics
        PyMaster -->|Step 2| S2["scripts/run_forecasting.py --from-db"]
        S2 -->|Muat Model .pkl Lokal| ModelDir[models/forecasting/]
        S2 -->|Prediksi 14 Hari & EWS 20-20-20-40| Gold[(Supabase: fact_forecast & fact_early_warning)]
    end

    subgraph Tahap 3: Observability & Alerting
        PyMaster -->|Step 3| S3[scripts/generate_daily_alerts.py]
        S3 -->|Filter Status WASPADA & TINGGI| Telegram[Bot Telegram Satgas Pangan]
    end

    subgraph Monitoring
        PyMaster --> LogFile[(logs/daily_pipeline.log)]
    end
```

### Estimasi Waktu Eksekusi:
* **Step 1 (Scraping & Ingest):** ~30 – 45 detik
* **Step 2 (Forecasting & EWS):** ~10 – 15 detik *(karena model `.pkl` sudah siap pakai)*
* **Step 3 (Telegram Alerting):** ~2 – 5 detik
* **Total Waktu Pipeline:** **± 1 hingga 1,5 menit saja.**

---

## 2. Setup Awal Runner Baru (One-Time Setup)

Jika pipeline hendak dijalankan di laptop baru atau rekan tim baru mengambil alih peran runner, lakukan 3 langkah awal ini satu kali saja:

### Langkah 1: Siapkan Python Virtual Environment
Buka terminal PowerShell pada direktori proyek `hargawatch-surabaya`:
```powershell
# 1. Buat virtual environment
python -m venv .venv

# 2. Install seluruh dependencies yang dibutuhkan
.\.venv\Scripts\pip install -r requirements.txt
```

### Langkah 2: Konfigurasi File Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env` di folder utama proyek:
```powershell
copy .env.example .env
```
Buka file `.env` dan pastikan variabel-variabel kunci berikut terisi:
```env
# Koneksi Database Supabase (Wajib)
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJh...
SUPABASE_HOST=aws-0-ap-southeast-1.pooler.supabase.com
SUPABASE_PORT=6543
SUPABASE_USER=postgres.xxxxxxxxxxxx
SUPABASE_PASSWORD=password_database_anda
DATABASE_URL=postgresql://postgres.xxx:pass@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Notifikasi Telegram (Wajib jika ingin menerima alert krisis di HP)
TELEGRAM_BOT_TOKEN=token_bot_anda
TELEGRAM_CHAT_ID=id_grup_atau_channel_anda

# MLOps Weights & Biases (Opsional, sudah ada fallback lokal)
WANDB_API_KEY=kunci_api_wandb_anda
WANDB_PROJECT=hargawatch-surabaya
```

### Langkah 3: Ekspor Model Champion Lokal (Sangat Penting)
Agar proses forecasting harian berjalan instan tanpa perlu melatih ulang dari nol setiap pagi, jalankan perintah ini satu kali:
```powershell
.\.venv\Scripts\python scripts/export_champion_models.py
```
Perintah ini akan secara otomatis:
1. Melatih model juara (*LightGBM* dan *CatBoost*) pada data historis lengkap.
2. Menyimpan artefak model biner ke folder `models/forecasting/` (`lightgbm_50_h7.pkl`, `catboost_39_h7.pkl`, `catboost_16_h7.pkl`, `lightgbm_10_h7.pkl`).
3. Membuat master pemetaan di `models/forecasting/registry.json`.

---

## 3. Otomatisasi Harian dengan Windows Task Scheduler

Agar laptop menjalankan scraping dan peramalan secara otomatis setiap hari tanpa perlu membuka VSCode atau Terminal, ikuti konfigurasi resmi Windows Task Scheduler berikut:

### Langkah 1: Buka Task Scheduler
1. Tekan tombol **Windows + R** pada keyboard.
2. Ketik **`taskschd.msc`** lalu tekan **Enter**.

### Langkah 2: Buat Basic Task Baru
1. Pada panel sebelah kanan (*Actions*), klik **Create Basic Task...**
2. **Name:** `HargaWatch_Daily_Pipeline`
3. **Description:** `Otomatisasi scraping, forecasting, dan Telegram alerting HargaWatch Surabaya`
4. Klik **Next**.

### Langkah 3: Tentukan Jadwal (Trigger)
1. Pilih opsi **Daily** (Harian), lalu klik **Next**.
2. **Start Time:** Atur pada pukul **06:00:00 AM** (pagi hari, sebelum pasar buka dan data kemarin sudah lengkap di server provinsi).
3. **Recur every:** `1 days`.
4. Klik **Next**.

### Langkah 4: Tentukan Aksi Program (Action)
1. Pilih **Start a program**, lalu klik **Next**.
2. **Program/script:** Klik tombol **Browse...** dan pilih file batch:
   ```text
   D:\...\hargawatch-surabaya\run_pipeline.bat
   ```
3. **Start in (optional) — WAJIB DIISI:** Masukkan path absolut folder proyek Anda (tanpa tanda kutip), contohnya:
   ```text
   D:\ARFI\Kuliah\Project\project-semester5\hargawatch-surabaya
   ```
   *(Peringatan: Bagian ini wajib diisi agar Windows mengenali lokasi file log dan modul Python).*
4. Klik **Next**, lalu klik **Finish**.

### Langkah 5: Pengaturan Anti-Gagal (Sangat Direkomendasikan)
1. Pada daftar task, klik ganda task **`HargaWatch_Daily_Pipeline`** yang baru saja dibuat.
2. **Tab General:** Centang opsi **Run with highest privileges**.
3. **Tab Settings (Kunci Keandalan):**
   * Centang opsi: **`Run task as soon as possible after a scheduled start is missed`**.
   * *Manfaat:* Jika laptop mati pada jam 06:00 pagi dan baru dinyalakan jam 08:00, Windows akan **langsung otomatis mengejar eksekusi pipeline** detik itu juga!
4. **Tab Conditions:**
   * Di bagian *Network*, centang **Start only if the following network connection is available** dan pilih **Any connection**.
5. Klik **OK** untuk menyimpan perubahan.

---

## 4. Pengecekan Kesehatan Harian (Daily Health Check)

Setelah jam 06:00 pagi (atau setelah laptop dinyalakan), lakukan pengecekan sederhana untuk memastikan pipeline berjalan sempurna:

1. Buka folder **`logs/`** di proyek Anda.
2. Buka file **`daily_pipeline.log`** menggunakan Notepad / VSCode.
3. Gulir ke baris paling bawah. Pastikan terdapat teks keberhasilan:
   ```text
   =================================================================
     ALL DAILY PIPELINE TASKS COMPLETED SUCCESSFULLY (xx.xs)
   =================================================================
   [FINISHED] Exit code: 0 at ...
   ```
4. **Tanda Setiap Tahap Berhasil:**
   * `--- SUCCESS: DATA_SCRAPING ---` ➔ Data 6 pasar berhasil ditarik & di-upsert ke Supabase.
   * `--- SUCCESS: FORECASTING_AND_EWS ---` ➔ Prediksi 14 hari & skor EWS 20-20-20-40 terunggah.
   * `--- SUCCESS: DISPATCH_TELEGRAM_ALERTS ---` ➔ Evaluasi anomali selesai (mengirim alert jika ada status WASPADA/TINGGI).

---

## 5. Panduan Tanggap Darurat (Troubleshooting Runbook)

Jika terjadi kendala operasional, berikut adalah panduan tindakan cepatnya:

### Kasus A: Server SISKAPERBAPO Sedang Down / Timeout
* **Gejala:** Step scraping mengeluarkan log timeout atau gagal mengambil tanggal kemarin.
* **Solusi Otomatis:** Sistem menerapkan *bounded forward-fill* sehingga data tidak akan kosong.
* **Solusi Manual (Catch-Up):** Begitu server SISKAPERBAPO kembali pulih pada siang/sore hari, jalankan skrip pengisian tanggal tertinggal:
  ```powershell
  .\.venv\Scripts\python scripts/update_catchup.py
  ```

### Kasus B: Koneksi Internet Lambat / Supabase Timeout
* **Gejala:** Log mencetak kegagalan koneksi database.
* **Solusi:** Sistem telah dilengkapi *Local CSV Caching*. Prediksi forecasting akan otomatis menggunakan data cadangan lokal `data/processed/fact_harga_pasar.csv` tanpa menghentikan pipeline (*zero-downtime*).

### Kasus C: Notifikasi Telegram Gagal Terkirim
* **Gejala:** Log mencetak `[WARNING] Alert dispatcher encountered errors`.
* **Solusi:** 
  1. Periksa apakah `TELEGRAM_BOT_TOKEN` atau `TELEGRAM_CHAT_ID` di file `.env` sudah benar.
  2. Perlu diingat bahwa error Telegram bersifat **Non-Fatal**. Data prediksi dan EWS tetap aman tersimpan di Supabase dan web tetap berjalan normal.

### Kasus D: Uji Coba Manual Cepat (Sanity Check)
Jika Anda ingin mengetes apakah seluruh alur berjalan lancar tanpa menunggu jam 06:00 pagi:
* Cukup lakukan **klik ganda (*double-click*) pada file `run_pipeline.bat`**, atau jalankan di terminal:
  ```cmd
  run_pipeline.bat
  ```

---

## 6. Pemeliharaan Model AI Berkala (Periodic Retraining)

Dalam operasional harian, model `.pkl` yang sudah tersimpan **tidak perlu di-retrain setiap hari** karena model pohon (*GBDT*) bersifat *stateless* dan tetap menerima harga terbaru melalui *lag features*.

### Kapan Perlu Retraining Ulang?
* **Rekomendasi:** Cukup **1 bulan sekali** atau **3 bulan sekali**.
* **Kondisi Khusus:** Jika terjadi perubahan harga ekstrem yang mengubah struktur ekonomi (misalnya: kenaikan harga BBM nasional atau perubahan drastis HET pemerintah).

### Cara Melakukan Retraining & Update Model:
Cukup jalankan kembali skrip ekspor champion model di terminal:
```powershell
.\.venv\Scripts\python scripts/export_champion_models.py
```
Skrip ini akan secara otomatis menelan seluruh riwayat harga terbaru hingga hari itu, melatih model dengan bobot mutakhir, dan memperbarui file `.pkl` di folder `models/forecasting/`.

---

## 7. Rangkuman Perintah Cepat (Cheat Sheet)

| Kebutuhan | Perintah Terminal |
| :--- | :--- |
| **Menjalankan Pipeline Lengkap** | `run_pipeline.bat` |
| **Menjalankan Hanya Scraping** | `.\.venv\Scripts\python scripts/update_harian.py` |
| **Menjalankan Hanya Forecasting & EWS** | `.\.venv\Scripts\python scripts/run_forecasting.py --from-db` |
| **Menjalankan Hanya Kirim Alert Telegram** | `.\.venv\Scripts\python scripts/generate_daily_alerts.py` |
| **Memperbarui File Model .pkl Lokal** | `.\.venv\Scripts\python scripts/export_champion_models.py` |
| **Mengejar Tanggal Data yang Tertinggal** | `.\.venv\Scripts\python scripts/update_catchup.py` |
| **Menjalankan Seluruh Unit & Stress Tests** | `.\.venv\Scripts\pytest tests/` |
