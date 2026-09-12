# Evaluasi & Audit Infrastruktur Data Engineering

**Proyek:** HargaWatch Surabaya  
**Tanggal Audit:** September 2026  
**Referensi Standar:** *Fundamentals of Data Engineering* (Joe Reis & Matt Housley, O'Reilly Media, 2022) & *The Data Warehouse Toolkit* (Ralph Kimball)  

---

## 1. Ringkasan Eksekutif (Executive Summary)
Secara keseluruhan, fondasi *Data Engineering* pada proyek HargaWatch berada pada **tingkat kematangan yang sangat baik untuk ukuran proyek akademis (Skor: 8.0/10)**, terutama dalam hal pemodelan data (arsitektur database) dan rekayasa perangkat lunak (idempotensi).

Namun, jika diukur menggunakan metrik kesiapan operasional **Production-Grade (Skor: 5.5/10)**, sistem ini memiliki risiko **SPOF (Single Point of Failure)** yang kritis pada sisi orkestrasi dan observabilitas yang harus segera diselesaikan sebelum peluncuran ke publik.

---

## 2. Evaluasi Berdasarkan "Data Engineering Lifecycle"

### A. Ekstraksi & Penarikan Data (Data Generation & Ingestion)
- **Implementasi Saat Ini:** Menggunakan Python (`requests`, `BeautifulSoup`, `ThreadPoolExecutor`) untuk menarik data dari *endpoint* tersembunyi SISKAPERBAPO.
- **Kelebihan (Kriteria: Skalabilitas & Efisiensi):** Penggunaan *multithreading* untuk memproses beberapa pasar sekaligus sangat efisien. Teknik *header spoofing* berhasil melewati blokir Cloudflare.
- **Risiko (Kriteria: Reliabilitas Sumber):** *Fragility* (Kerapuhan) tinggi. Sistem bergantung pada struktur DOM HTML (`span.price-tooltip-enabled`). Jika antarmuka SISKAPERBAPO berubah, *pipeline* akan langsung hancur (*breaking change*).

### B. Penyimpanan & Arsitektur Data (Storage & Architecture)
- **Implementasi Saat Ini:** PostgreSQL *Managed* (Supabase) dengan port *transaction pooler* (6543).
- **Kelebihan (Kriteria: Kimball Dimensional Modeling):** Sangat luar biasa. Data tidak disimpan dalam format *flat table* yang denormalisasi. Penggunaan **Star Schema** (`fact_harga_pasar`, `dim_pasar`, `dim_komoditas`, `dim_kalender`) adalah standar industri terbaik untuk OLAP/Analitik dan mempermudah kerja *Machine Learning*.
- **Risiko (Kriteria: Keamanan):** Row Level Security (RLS) di Supabase berpotensi belum dikonfigurasi ketat, sehingga API terekspos untuk operasi tulis (*write*) jika kunci terekspos.

### C. Transformasi & Kualitas Data (Transformation & Data Quality)
- **Implementasi Saat Ini:** Pemrosesan *batch* harian menggunakan Pandas.
- **Kelebihan (Kriteria: Data Lineage):** Memisahkan kolom `harga_asli` dan `harga_imputasi` adalah praktik **Data Quality** kelas atas. Sistem tidak menimpa data asli yang kosong dengan data buatan, sehingga *Data Scientist* masih bisa mengetahui histori keaslian data.
- **Risiko (Kriteria: Akurasi Data):** Fungsi `forward-fill` (`.ffill()`) digunakan tanpa batas (`limit`). Jika sumber data mati selama 3 bulan, sistem akan mencatat harga tetap sama selama 3 bulan (menciptakan *zombie data*). Dimensi kalender (hari libur/Ramadan) juga di- *hardcode* hanya sampai tahun 2026.

---

## 3. Evaluasi Berdasarkan "The Undercurrents" (Arus Bawah / Fondasi)

### A. DataOps, Orkestrasi, & Penjadwalan (Orchestration)
- **Kondisi:** Skrip dijalankan via **Windows Task Scheduler** di laptop lokal milik developer.
- **Evaluasi 🔴 (KRITIS):** Ini adalah pelanggaran fundamental *production deployment*. Orkestrasi bergantung pada perangkat fisik yang rentan mati listrik, hilang koneksi internet, atau masuk mode *sleep*.
- **Rekomendasi:** Pindahkan eksekusi ke *Cloud Serverless Cron* atau VPS Linux yang hidup 24/7.

### B. Observabilitas & Alerting (Observability)
- **Kondisi:** Pencatatan (*logging*) hanya dilakukan menggunakan `print()` ke terminal.
- **Evaluasi 🟡 (PERINGATAN):** Prinsip *Data Downtime* tidak terpenuhi. Jika *scraper* gagal hari ini, tidak ada anggota tim yang menyadarinya sampai data di dashboard terlihat basi.
- **Rekomendasi:** Integrasikan notifikasi sistem. Jika terjadi *exception* di Python, skrip harus memicu peringatan ke grup Telegram/Slack tim.

### C. Rekayasa Perangkat Lunak (Software Engineering Practices)
- **Kondisi:** Penggunaan `INSERT ... ON CONFLICT DO UPDATE` dalam skrip `update_harian.py`.
- **Evaluasi 🟢 (SANGAT BAIK):** Telah mengadopsi prinsip **Idempotency** secara sempurna. Menjalankan *pipeline* berulang kali pada hari yang sama tidak akan merusak basis data atau menghasilkan entri ganda.

---

## 4. Rencana Aksi & Rekomendasi Perbaikan (Actionable Recommendations)

Tim (*khususnya Data Engineer*) direkomendasikan untuk mengeksekusi perbaikan berikut sebelum sistem memasuki fase *Beta Release*:

| Prioritas | Komponen | Rekomendasi Perbaikan Teknis | Estimasi Waktu |
|---|---|---|---|
| **P1 (High)** | Orkestrasi | Migrasi eksekusi cron dari Windows Task Scheduler lokal ke VPS Linux (Contoh: DigitalOcean/AWS EC2) atau platform PaaS (Render Cron). | 1 Hari |
| **P1 (High)** | Observabilitas | Tambahkan *webhook* Telegram di blok `except` Python untuk mengirim pesan otomatis jika *scraper* gagal mengurai HTML. | 2-3 Jam |
| **P2 (Medium)** | Transformasi Data | Tambahkan argumen `limit=7` pada method `.ffill()` di Pandas. Jika harga tidak di-update lebih dari 7 hari, biarkan menjadi *NULL* agar ML tidak salah belajar dari harga stagnan. | 1 Jam |
| **P3 (Low)** | Skalabilitas Kalender| Ubah generasi tanggal hari libur agar dinamis (tidak di- *hardcode* berakhir di tahun 2026). | 2 Jam |
| **P3 (Low)** | Keamanan | Aktifkan Row Level Security (RLS) di Supabase: Izinkan *SELECT* untuk anonim, batasi *INSERT/UPDATE* hanya untuk `service_role`. | 2 Jam |

---
*Dokumen ini dibuat otomatis oleh AI Systems Architect sebagai landasan perbaikan teknis dan referensi ilmiah laporan.*
