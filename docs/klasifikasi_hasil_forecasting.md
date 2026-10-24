# Klasifikasi Performa Peramalan 38 Komoditas Pangan Surabaya

**Proyek:** HargaWatch Surabaya | **Metodologi:** Walk-Forward Backtesting (H+7 Hari)  
**Metrik:** WAPE (Eror Agregat), MAE (Eror Rupiah), DA (Akurasi Arah Naik/Turun/Datar), PICP (Cakupan 80% CI $p_{10}-p_{90}$)

---

### 1. Ringkasan 3 Kategori Performa

| Kategori | Batasan WAPE | Rata-rata DA | Cakupan PICP (ML) | Jumlah Komoditas | Rekomendasi Satgas Pangan |
|:---|:---:|:---:|:---:|:---:|:---|
| **1. Presisi Tinggi** | **$< 3,0\%$** | **$> 90\%$** | **78% – 100%** | **26 (68%)** | Sangat aman memakai angka nominal pasti (*point forecast*). |
| **2. Moderat & Musiman** | **$3,0\% - 8,0\%$** | **54% – 78%** | **71%** | **6 (16%)** | Cukup untuk membaca arah tren mingguan. |
| **3. Kritis & Volatil** | **$> 8,0\%$** | **26% – 65%** | **72% – 79%** | **6 (16%)** | **Dilarang pakai angka tunggal**. Wajib pakai pita risiko ($p_{10}-p_{90}$) & EWS. |

---

### 2. Rincian per Kategori

#### Kategori 1: Presisi Tinggi (WAPE $< 3,0\%$ | Eror $\le$ Rp 800/kg)
*Karakteristik:* Terikat HET pemerintah, harga bandrol pabrik (FMCG), pasokan RPH, atau rantai dingin.

| ID | Komoditas | Model Champion | WAPE | MAE | DA (%) | PICP (80% CI) | Karakteristik Pasar |
|:---:|:---|:---|---:|---:|---:|:---:|:---|
| 35 | Indomie Kari Ayam | Naive Last Value | **0,00%** | Rp 0 | **100,0%** | - | Harga cetakan pabrik konstan |
| 14 | Daging Ayam Kampung | Naive Last Value | **0,01%** | Rp 8 | **99,2%** | - | Harga eceran sangat stabil |
| 28 | Garam Beryodium Halus | **XGBoost p50** | **0,05%** | **Rp 5** | **58,0%** | **100,0%** | Variasi mikro kemasan tertangkap ML |
| 21 | Susu Kental Indomilk | Naive Last Value | **0,08%** | Rp 11 | **97,8%** | - | FMCG industri |
| 2 | Beras Premium | Naive Last Value | **0,10%** | Rp 15 | **98,5%** | - | HET nasional stabil |
| 96 | Minyakita | Naive Last Value | **0,13%** | Rp 21 | **97,0%** | - | Terjaga HET pemerintah |
| 40 | Ikan Asin Teri | Naive Last Value | **0,15%** | Rp 130 | **98,0%** | - | Olahan kering tahan lama |
| 20 | Susu Kental Bendera | Naive 7d SMA | **0,20%** | Rp 25 | **94,9%** | - | Moving average optimal |
| 30 | Terigu Protein Sedang | Naive Last Value | **0,21%** | Rp 25 | **97,1%** | - | Terikat distributor |
| 10 | Minyak Goreng Curah | Naive Last Value | **0,23%** | Rp 45 | **96,8%** | - | Pasokan DMO & HET |
| 25 | Jagung Pipilan Kering | Naive Last Value | **0,27%** | Rp 30 | **97,0%** | - | Pakan ternak kering |
| 43 | Ketela Pohon | **LightGBM p50** | **0,29%** | **Rp 18** | **38,2%** | **78,9%** | Pola lokal tertangkap ML |
| 4 | Beras Medium | Naive Last Value | **0,44%** | Rp 56 | **92,1%** | - | SPHP Bulog Jawa Timur |
| 7 | Gula Kristal Putih | Naive Last Value | **0,62%** | Rp 92 | **93,4%** | - | Distribusi pabrik gula BUMN |
| 32 | Kedelai Impor | Naive Last Value | **0,65%** | Rp 101 | **94,9%** | - | Impor Pelabuhan Perak |
| 12 | Daging Sapi Paha Belakang | Naive Last Value | **0,69%** | Rp 806 | **91,5%** | - | Terjangkar RPH Pegirikan ($r=0,75$) |
| 41 | Kacang Hijau | Naive Last Value | **1,02%** | Rp 254 | **88,4%** | - | Biji kering tahan simpan |
| 17 | Telur Ayam Kampung | Naive Last Value | **1,23%** | Rp 568 | **89,9%** | - | Pasar konsumsi khusus |
| 60 | Ikan Tongkol | Naive Last Value | **1,29%** | Rp 533 | **87,5%** | - | Rantai es TPI Brondong |
| 42 | Kacang Tanah | Naive Last Value | **1,37%** | Rp 406 | **87,0%** | - | Stok karung gudang |
| 59 | Ikan Kembung | Naive Last Value | **1,37%** | Rp 652 | **91,3%** | - | Ikan tangkapan laut umum |
| 62 | Ikan Cakalang | Naive Last Value | **1,59%** | Rp 717 | **87,0%** | - | Pasokan beku industri |
| 92 | Minyak Kemasan Premium | Naive Last Value | **1,70%** | Rp 313 | **92,8%** | - | Brand komersial (Bimoli/Filma) |
| 58 | Ikan Bandeng | Naive Last Value | **1,79%** | Rp 728 | **81,6%** | - | Tambak lokal Sidoarjo-Gresik |
| 61 | Ikan Tuna | Naive Last Value | **1,84%** | Rp 870 | **82,6%** | - | Rantai dingin industri |
| 13 | Daging Ayam Ras | Naive Last Value | **2,00%** | Rp 705 | **84,2%** | - | Ayam broiler kemitraan |

---

#### Kategori 2: Moderat & Musiman (WAPE $3,0\% - 8,0\%$ | Eror Rp 500 – Rp 1.500/kg)
*Penyebab:* Ada dinamika musiman panen/impor, tetapi komoditas tahan simpan berminggu-minggu (*buffer stok* gudang meredam gejolak).

| ID | Komoditas | Model Champion | WAPE | MAE | DA (%) | PICP (80% CI) | Karakteristik Pasar |
|:---:|:---|:---|---:|---:|---:|:---:|:---|
| 16 | **Telur Ayam Ras** | **XGBoost p50** | **3,04%** | **Rp 842** | **74,2%** | **71,2%** | **ML Unggul.** Siklus pakan Blitar & Keputran |
| 3 | Bawang Putih | Naive Last Value | **3,62%** | Rp 1.100 | **76,8%** | - | Musiman pasokan impor |
| 45 | Kentang | Naive Last Value | **3,63%** | Rp 580 | **78,5%** | - | Umbi tahan simpan 3–4 minggu |
| 49 | Bawang Putih Honan | Naive Last Value | **4,56%** | Rp 1.572 | **54,3%** | - | Impor kontainer Tiongkok |
| 47 | Wortel | Naive Last Value | **5,77%** | Rp 804 | **71,4%** | - | Pasokan rutin lereng Bromo |
| 44 | Kol / Kubis | Naive Last Value | **7,02%** | Rp 645 | **68,9%** | - | Panen Malang/Batu rutin |

---

#### Kategori 3: Kritis & Volatil (WAPE $> 8,0\%$ | Eror Rp 1.300 – Rp 6.200/kg)
*Penyebab:* Sayur bumbu cepat busuk (*ultra-perishable*), tanpa stok gudang (*zero-inventory*), bergantung lelang fisik malam di Pasar Keputran.

| ID | Komoditas | Model Champion | WAPE | MAE | DA (%) | PICP (80% CI) | Karakteristik Pasar & Batas Performa |
|:---:|:---|:---|---:|---:|---:|:---:|:---|
| 39 | **Bawang Merah** | **CatBoost p50** | **8,02%** | **Rp 3.015** | **65,2%** | **78,6%** | **ML Unggul.** Transmisi Keputran Nganjuk/Probolinggo |
| 48 | **BUNCIS** | **XGBoost p50** | **9,57%** | **Rp 1.390** | **61,4%** | **71,7%** | **ML Unggul.** Mudah layu, kulakan harian Keputran |
| 46 | Tomat Merah | Naive Last Value | **11,97%** | Rp 1.609 | **48,5%** | - | Cepat busuk; variasi harian tinggi |
| 37 | Cabe Merah Keriting | Naive Last Value | **12,50%** | Rp 5.007 | **38,1%** | - | ⚠️ Batas data tercapai; pasokan Kediri liar |
| 38 | **CABE MERAH BESAR** | **XGBoost p50** | **13,63%** | **Rp 5.059** | **26,3%** | **76,1%** | ⚠️ **ML Unggul.** Tren tertangkap, meleset di puncak |
| 50 | **CABE RAWIT MERAH** | **XGBoost p50** | **14,97%** | **Rp 6.200** | **31,5%** | **78,6%** | ⚠️ **Komoditas Terliar.** Sensitif jamur patek & spekulasi |

---

### 3. Batas Data (*Data Ceiling*) pada Cabai

Eror cabai tertahan di level WAPE $12\% - 15\%$ dan DA rendah ($26\% - 38\%$) bukan karena kelemahan model, melainkan karena **ketiadaan data fisik fundamental**:
1. Tidak ada data **tonase/jumlah truk** pasokan yang masuk ke Pasar Keputran subuh hari.
2. Tidak ada data **laju pembusukan (jamur patek)** pasca-panen di musim hujan.
3. Cuaca hujan di Surabaya tidak relevan; yang menentukan adalah cuaca ekstrem di **sentra hulu (Blitar/Kediri)** 2–4 minggu sebelumnya.

---

### 4. Definisi Metrik Tambahan
- **DA (Directional Accuracy):** Persentase akurasi model dalam memprediksi arah perubahan harga (naik, turun, atau stabil). Pada komoditas stabil, nilai tinggi (>85%) menunjukkan ketepatan memprediksi persistensi harga.
- **PICP (Prediction Interval Coverage Probability):** Persentase harga aktual yang berada di dalam pita ketidakpastian 80% CI ($p_{10} - p_{90}$). Khusus model ML (GBDT) yang mengestimasi risiko, sedangkan model *baseline* hanya menghasilkan prediksi titik (*point forecast*).

