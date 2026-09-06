# HargaWatch — Project Charter
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
| Government/Analyst View | Tampilan lebih dal |

---

## 2. Roadmap 4 Fase

| Fase | Fokus | Output |
|---|---|---|
| **0. Validasi Data** | Cek apakah data dari SISKAPERBAPO (dan sumber cadangan) benar-benar bisa ditarik secara sistematis, untuk pasar-pasar target | Kepastian sumber data + daftar pasar final |
| **1. Fondasi** | Pipeline data dasar + fitur inti: Harga Hari Ini, Best Price Finder, Price Trend | Data pipeline berjalan + dashboard MVP |
| **2. Analitik** | Price Change Analytics, Price Volatility, Smart Shopping Basket | Fitur analitik di atas data historis yang terkumpul |
| **3. ML & Peringatan Dini** | Forecasting, Anomaly Detection, Early Warning, Price Surge Alert | Model prediksi + sistem status peringatan |

**Prinsip urutan**: Fase 0 harus tuntas sebelum tim berkomitmen ke fitur di fase berikutnya. Forecasting & Anomaly Detection (Fase 3) baru masuk akal setelah data historis cukup panjang — jangan dipaksakan di awal.

---

## 3. Pemilihan Pasar *(masih didiskusikan — belum final)*

### Status saat ini
Daftar pasar awal diambil dari **SISKAPERBAPO** (siskaperbapo.jatimprov.go.id) — sistem resmi Dinas Perindustrian dan Perdagangan Provinsi Jawa Timur, mencakup 38 kabupaten/kota termasuk Surabaya.

### Kandidat pasar (sementara)
| Pasar | Kecamatan | Catatan |
|---|---|---|
| Tambahrejo | Simokerto | Kios TPID (pemantauan harga resmi Pemkot) |
| Wonokromo | Wonokromo | Kios TPID, salah satu pasar terbesar Surabaya |
| Genteng | Genteng | Kios TPID, pasar tertua di Surabaya |
| Pucang Anom | Gubeng | Kios TPID |
| Keputran | Tegalsari | **Pasar induk/grosir** — beda jenis dari pasar eceran lain, perlu perlakuan analitis terpisah |
| Soponyono | Rungkut | Pasar besar di Surabaya Timur |

### Yang masih perlu diputuskan
- Apakah keenam pasar ini benar-benar punya data yang konsisten tersedia di SISKAPERBAPO (perlu dicek langsung di halaman Tabel/Profil Pasar mereka)
- Apakah perlu menambah pasar di wilayah Surabaya Utara & Barat (saat ini belum terwakili)
- Bagaimana memperlakukan Keputran secara berbeda (grosir vs eceran) dalam skema data
- Pemilihan final akan menyesuaikan dengan hasil validasi ketersediaan data di Fase 0 — daftar di atas adalah kandidat dari SISKAPERBAPO, bukan keputusan final

---

## 4. Pembagian Role

| Nama | Role | Fokus Utama |
|---|---|---|
| **Famos** | Data Engineer | Pipeline data, validasi & cleaning, integrasi sumber data, dll |
| **Kayla** | Data Analyst | Analitik harga (trend, volatility, change analytics,dll), pembangunan dashboard (visualisasi & storytelling data) |
| **Arfi** | Data Scientist / ML Engineer | Forecasting, anomaly detection, early warning, API serving untuk model ML,dll |

---

## 5. System Design *(belum final — bagian ini untuk didiskusikan bersama)*

### Masih perlu didiskusikan bersama tim
1. **Sumber data**: SISKAPERBAPO — perlu dicek apakah bisa ditarik otomatis/scraping dan coba mencari sumber data lainnya serta pendekatan lainnya. 
2. **Skema database**: struktur tabel, granularitas (harian/per pasar/per komoditas), belum dirancang sampai sumber data tervalidasi
3. **Tech stack yang disepakati**: mulai dari eksperimen (notebook/model ML) hingga pengembangan web/dashboard dan deployment
4. **Kontrak API** antara model ML  dan dashboard — endpoint, format data
5. **Strategi data historis**: berapa lama sistem perlu mengumpulkan data sebelum forecasting/anomaly detection layak dijalankan
6. **Pembagian data eceran vs grosir** (khusus Keputran) dalam desain sistem ????

*Bagian ini akan diisi detail setelah Fase 0 (validasi data) selesai dan sumber data sudah final.*

---

*Dokumen ini adalah living document — akan diperbarui seiring progres tim. Update terakhir mengikuti hasil diskusi tim.*
