# Klasifikasi Performa Peramalan 37 Komoditas Pangan Surabaya

**Proyek:** HargaWatch Surabaya | **Metodologi:** Walk-Forward Backtesting (H+1 s/d H+14 Hari)  
**Metrik Utama:** WAPE (Eror Agregat), MAE (Eror Rupiah), DA Overall & Active (Akurasi Arah), PICP (Cakupan 80% CI $p_{10}-p_{90}$)

---

### 1. Ringkasan Kategori Performa & Strategi Produksi

| Kategori | Batasan WAPE | Rata-rata DA Overall | Cakupan PICP (80% CI) | Jumlah Komoditas | Strategi Produksi (Two-Tier Framework) |
|:---|:---:|:---:|:---:|:---:|:---|
| **1. Produk Industri FMCG** | **$< 0,2\%$** | **$94\% - 100\%$** | - | **3 (8%)** | **Naive Last Value / SMA**. Terikat bandrol harga pabrik (MSRP); bebas risiko inflasi agronomis. |
| **2. Presisi Tinggi & Inersial** | **$< 3,0\%$** | **$81\% - 99\%$** | Adaptive Cone | **23 (62%)** | **Naive Persistence + Diffusion Cone**. Dijaga HET pemerintah, stabilisasi SPHP, atau rantai pasok dingin. |
| **3. Moderat & Musiman** | **$3,0\% - 8,0\%$** | **54% – 78%** | **71% – 78%** | **6 (16%)** | **GBDT / Naive**. Cukup untuk membaca arah tren mingguan komoditas bersiklus panen/impor. |
| **4. Kritis & Volatil** | **$> 8,0\%$** | **26% – 65%** | **72% – 81%** | **5 (14%)** | **Dynamic Multi-Step GBDT**. Wajib memakai pita risiko ($p_{10}-p_{90}$), fitur kalender dinamis, dan EWS. |

---

### 2. Rincian per Kategori

#### Kategori Khusus: Komoditas Olahan Industri Pabrikan (FMCG Non-Volatil)
*Karakteristik:* Harga ditetapkan secara sepihak oleh produsen manufaktur pangan nasional (MSRP); tidak memiliki risiko fluktuasi cuaca harian dan tidak memerlukan intervensi Satgas Pangan. Dipisahkan dari tabel komoditas pertanian agar tidak mendistorsi statistik evaluasi.

| ID | Komoditas | Model Champion | WAPE | MAE | DA Overall (%) | DA Active (%) | Karakteristik Pasar |
|:---:|:---|:---|---:|---:|---:|:---:|:---|
| 35 | Indomie Kari Ayam | Naive Last Value | **0,00%** | Rp 0 | **100,0%** | 100,0% | Harga bandrol kardus pabrik konstan |
| 21 | Susu Kental Indomilk | Naive Last Value | **0,08%** | Rp 11 | **97,8%** | N/A* | Produk industri kaleng |
| 20 | Susu Kental Bendera | Naive 7d SMA | **0,20%** | Rp 25 | **94,9%** | N/A* | Moving average optimal untuk variasi toko |

*\*Catatan: Komoditas dengan label N/A tidak mengalami shock harga riil ($|\Delta| > 0,5\%$) selama periode evaluasi.*

---

#### Kategori 1: Presisi Tinggi & Pangan Inersial (WAPE $< 3,0\%$ | Eror $\le$ Rp 800/kg)
*Karakteristik:* Pasokan terjamin distributor besar, beras cadangan pemerintah (SPHP), atau pasokan Rumah Potong Hewan (RPH).

| ID | Komoditas | Model Champion | WAPE | MAE | DA Overall (%) | PICP (80% CI) | Karakteristik Pasar & Catatan Parsimony |
|:---:|:---|:---|---:|---:|---:|:---:|:---|
| 14 | Daging Ayam Kampung | Naive Last Value | **0,01%** | Rp 8 | **99,2%** | Adaptive | *Inersia survei*: Harga Rp 60.000–70.000 statis berbulan-bulan di pasar kota. |
| 28 | Garam Beryodium Halus | Naive Last Value | **0,16%** | Rp 15 | **85,0%** | Adaptive | *Parsimony*: Reverted dari ML; selisih eror < Rp 10 di bawah koin fisik. |
| 2 | Beras Premium | Naive Last Value | **0,10%** | Rp 15 | **98,5%** | Adaptive | Terjaga HET nasional dan stok penggilingan modern. |
| 96 | Minyakita | Naive Last Value | **0,13%** | Rp 21 | **97,0%** | Adaptive | Minyak goreng rakyat dengan pagu HET Bapanas. |
| 40 | Ikan Asin Teri | Naive Last Value | **0,15%** | Rp 130 | **98,0%** | Adaptive | Olahan kering awet tahan simpan bulanan. |
| 30 | Terigu Protein Sedang | Naive Last Value | **0,21%** | Rp 25 | **97,1%** | Adaptive | Rantai pasok distributor pabrik terigu Bogasari. |
| 10 | Minyak Goreng Curah | Naive Last Value | **0,23%** | Rp 45 | **96,8%** | Adaptive | Kebijakan pasokan DMO & HET pemerintah. |
| 25 | Jagung Pipilan Kering | Naive Last Value | **0,27%** | Rp 30 | **97,0%** | Adaptive | Pakan ternak/burung di kios unggas khusus. |
| 43 | Ketela Pohon | Naive Last Value | **0,45%** | Rp 28 | **82,5%** | Adaptive | *Parsimony*: Reverted dari ML; variasi mikro musiman cukup dicakup Naive. |
| 4 | Beras Medium | Naive Last Value | **0,44%** | Rp 56 | **92,1%** | Adaptive | Stabilisasi pasokan SPHP Bulog Jawa Timur. |
| 7 | Gula Kristal Putih | Naive Last Value | **0,62%** | Rp 92 | **93,4%** | Adaptive | Distribusi pabrik gula BUMN PTPN. |
| 32 | Kedelai Impor | Naive Last Value | **0,65%** | Rp 101 | **94,9%** | Adaptive | Pasokan stabil via importir Pelabuhan Tanjung Perak. |
| 12 | Daging Sapi Paha Belakang | Naive Last Value | **0,69%** | Rp 806 | **91,5%** | Adaptive | Terjangkar kuat pemotongan RPH Pegirikan ($r=0,75$). |
| 41 | Kacang Hijau | Naive Last Value | **1,02%** | Rp 254 | **88,4%** | Adaptive | Biji kering tahan simpan karungan. |
| 17 | Telur Ayam Kampung | Naive Last Value | **1,23%** | Rp 568 | **89,9%** | Adaptive | Pasar konsumsi jamu/khusus dengan volume kecil. |
| 60 | Ikan Tongkol | Naive Last Value | **1,29%** | Rp 533 | **87,5%** | Adaptive | *Rantai es*: Stabilisasi harga ikan beku pedagang besar. |
| 42 | Kacang Tanah | Naive Last Value | **1,37%** | Rp 406 | **87,0%** | Adaptive | Stok kering distributor gudang. |
| 59 | Ikan Kembung | Naive Last Value | **1,37%** | Rp 652 | **91,3%** | Adaptive | Pasokan distribusi ikan laut umum. |
| 62 | Ikan Cakalang | Naive Last Value | **1,59%** | Rp 717 | **87,0%** | Adaptive | Rantai pasok beku cold-storage industri. |
| 92 | Minyak Kemasan Premium | Naive Last Value | **1,70%** | Rp 313 | **92,8%** | Adaptive | Merk komersial prinsipal (Bimoli, Filma, SunCo). |
| 58 | Ikan Bandeng | Naive Last Value | **1,79%** | Rp 728 | **81,6%** | Adaptive | Tambak payau lokal Sidoarjo-Gresik (panen harian teratur). |
| 61 | Ikan Tuna | Naive Last Value | **1,84%** | Rp 870 | **82,6%** | Adaptive | Distribusi rantai beku pelabuhan perikanan. |
| 13 | Daging Ayam Ras | Naive Last Value | **2,00%** | Rp 705 | **84,2%** | Adaptive | Ayam broiler kemitraan skala besar dengan pasokan harian RPA. |

---

#### Kategori 2: Moderat & Musiman (WAPE $3,0\% - 8,0\%$ | Eror Rp 500 – Rp 1.500/kg)
*Penyebab:* Ada dinamika musiman panen/impor, tetapi komoditas tahan simpan berminggu-minggu (*buffer stock* gudang meredam gejolak).

| ID | Komoditas | Model Champion | WAPE | MAE | DA Overall (%) | PICP (80% CI) | Karakteristik Pasar |
|:---:|:---|:---|---:|---:|---:|:---:|:---|
| 16 | **Telur Ayam Ras** | **XGBoost p50** | **3,04%** | **Rp 842** | **74,2%** | **71,2%** | **ML Unggul.** Siklus pakan Blitar & transmisi Keputran |
| 3 | Bawang Putih | Naive Last Value | **3,62%** | Rp 1.100 | **76,8%** | Adaptive | Terikat kuota impor kontainer |
| 45 | Kentang | Naive Last Value | **3,63%** | Rp 580 | **78,5%** | Adaptive | Umbi tahan simpan 3–4 minggu |
| 49 | Bawang Putih Honan | Naive Last Value | **4,56%** | Rp 1.572 | **54,3%** | Adaptive | Impor Tiongkok via Tanjung Perak |
| 47 | Wortel | Naive Last Value | **5,77%** | Rp 804 | **71,4%** | Adaptive | Pasokan rutin harian lereng Bromo/Trawas |
| 44 | Kol / Kubis | Naive Last Value | **7,02%** | Rp 645 | **68,9%** | Adaptive | Panen rutin sayuran Malang/Batu |

---

#### Kategori 3: Kritis & Volatil (WAPE $> 8,0\%$ | Eror Rp 1.300 – Rp 6.200/kg)
*Penyebab:* Sayur bumbu cepat busuk (*ultra-perishable*), tanpa stok gudang (*zero-inventory*), sangat bergantung lelang fisik malam di Pasar Keputran.

| ID | Komoditas | Model Champion | WAPE | MAE | DA Overall (%) | PICP (80% CI) | Karakteristik Pasar & Batas Performa |
|:---:|:---|:---|---:|---:|---:|:---:|:---|
| 39 | **Bawang Merah** | **CatBoost p50** | **8,02%** | **Rp 3.015** | **65,2%** | **78,6%** | **ML Unggul.** Transmisi harian Keputran Nganjuk/Probolinggo |
| 48 | **BUNCIS** | **XGBoost p50** | **9,57%** | **Rp 1.390** | **61,4%** | **71,7%** | **ML Unggul.** Mudah layu, kulakan harian lelang Keputran |
| 46 | Tomat Merah | Naive Last Value | **11,97%** | Rp 1.609 | **48,5%** | Adaptive | Sayur lunak cepat busuk; variasi harian tinggi |
| 37 | Cabe Merah Keriting | Naive Last Value | **12,50%** | Rp 5.007 | **38,1%** | Adaptive | Batas data tercapai; pasokan Kediri liar |
| 38 | **CABE MERAH BESAR** | **XGBoost p50** | **13,63%** | **Rp 5.059** | **26,3%** | **76,1%** | **ML Unggul.** Tren tertangkap, meleset saat puncak shock |
| 50 | **CABE RAWIT MERAH** | **Dynamic GBDT / CatBoost** | **14,69%** | **Rp 6.200** | **31,5%** | **78,6% - 81,1%** | **Komoditas Terliar.** Sensitif jamur patek & spekulasi lelang |

---

### 3. Batas Data (*Data Ceiling*) pada Cabai & Hortikultura

Eror cabai rawit tertahan di level WAPE $14\% - 15\%$ dan DA rendah ($26\% - 38\%$) bukan karena kelemahan algoritma Machine Learning, melainkan karena **ketiadaan data fisik fundamental**:
1. Tidak ada data pencatatan **tonase/jumlah truk pasokan** yang masuk ke Pasar Keputran saat subuh.
2. Tidak ada sensor **tingkat kerusakan panen akibat jamur patek** di sentra petani saat musim hujan.
3. Cuaca hujan lokal di Kota Surabaya tidak relevan ($r = +0.17$); faktor penentu adalah cuaca ekstrem di **sentra hulu (Blitar, Kediri, Malang)** 2–4 minggu sebelumnya.

---

### 4. Definisi & Penafian Metrik Evaluasi

* **Directional Accuracy (DA Overall):** Menghitung akurasi arah perubahan harga (naik, turun, atau datar).
  > **[Penafian DA pada Komoditas Inersial]:** Skor DA $> 90\%$ pada model Naive di komoditas stabil (seperti Beras, Minyak, Mi Instan) disebabkan oleh dominasi hari tanpa perubahan harga ($\Delta = 0$). Karena model Naive selalu memprediksi $\hat{y} = y_0$ (arah $0$), dan harga pasar kebetulan tidak berubah ($0 == 0$), model memperoleh skor tinggi secara otomatis.
* **Active Directional Accuracy (`DA_active`):** Menguji ketepatan arah **khusus pada hari-hari di mana harga riil mengalami guncangan signifikan** ($|y_t - y_0| > \max(0,005 	imes y_0, 50)$). Jika model memprediksi datar saat terjadi guncangan pasar, model dinilai salah ($0$).
* **Prediction Interval Coverage Probability (PICP):** Persentase harga aktual yang masuk di dalam pita keyakinan 80% ($p_{10} - p_{90}$).
  * Pada model **GBDT (Jalur B)**: Dihasilkan langsung dari kuantil loss dengan jaminan *Monotone Rearrangement* ($p_{10} \le p_{50} \le p_{90}$).
  * Pada model **Naive (Jalur A)**: Dihasilkan melalui *Adaptive Uncertainty Cone* ber-skala waktu difusi ($\sqrt{h/7}$) dengan *variance floor* minimum agar lebar pita tidak kolaps menjadi garis nol di antarmuka web.
