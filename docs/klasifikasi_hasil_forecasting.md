# Klasifikasi Performa Peramalan 37 Komoditas Pangan Surabaya
## Laporan Hasil Walk-Forward Backtesting Terpadu (Data Terkalenderisasi & Bebas Kebocoran)

> **Status Dokumen:** Produksi / Aktif  
> **Ruang Lingkup:** Seluruh 37 Komoditas Pangan Aktif di 6 Pasar Tradisional Kota Surabaya  
> **Pembaruan Terakhir:** November 2026 (Hasil Benchmark Terpadu Pasca-Kalenderisasi & Monotone Rearrangement)  
> **Protokol Validasi:** Walk-Forward Rolling-Origin (Horizon H+7, Jendela Uji 2025–2026, Step 14 Hari)

---

### 1. Ringkasan Kategori Performa & Strategi Produksi

Berdasarkan hasil pengujian empiris *walk-forward rolling-origin* pada dataset terkalenderisasi kontinu tanpa bias masa depan, seluruh 37 komoditas pangan aktif diklasifikasikan ke dalam 4 kategori performa:

| Kategori | Rentang WAPE | DA Overall (%) | DA Active (%) | Cakupan PICP (80% CI) | Jumlah Komoditas | Strategi Produksi (Two-Tier Framework) |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **1. Produk Industri FMCG** | **$< 0,25\%$** | **$96\% - 100\%$** | $0\% - 14\%$ | Adaptive Cone | **3 (8%)** | **Naive Last Value / SMA**. Terikat bandrol harga produsen pabrikan (MSRP); bebas risiko agronomis. |
| **2. Presisi Tinggi & Inersial** | **$< 2,0\%$** | **$80\% - 99\%$** | $0,0\%$ | Adaptive Cone | **22 (60%)** | **Naive Persistence + Diffusion Cone**. Dijaga HET pemerintah, stabilisasi Bulog, atau pasokan RPH. |
| **3. Moderat & Musiman** | **$2,0\% - 6,0\%$** | **$45\% - 71\%$** | $0\% - 54\%$ | **70,2% / Adaptive** | **6 (16%)** | **GBDT (Telur) / Naive (Sayur Awet)**. Membaca arah tren musiman komoditas bersiklus panen/impor. |
| **4. Kritis & Volatil** | **$8,0\% - 14,5\%$** | **$33\% - 49\%$** | **$43\% - 61\%$** | **$70\% - 79\%$** | **6 (16%)** | **Dynamic Multi-Step GBDT**. Wajib memakai pita risiko kuantil ($p_{10}-p_{90}$), kalender maju, dan EWS. |

---

### 2. Rincian Metrik Evaluasi per Kategori

#### Kategori 1: Komoditas Olahan Industri Pabrikan (FMCG Non-Volatil)
*Karakteristik:* Harga ditetapkan secara sepihak oleh produsen manufaktur pangan nasional (*Manufacturer Suggested Retail Price - MSRP*); tidak memiliki risiko fluktuasi cuaca harian dan tidak memerlukan intervensi pasar fisik.

| ID | Komoditas | Model Champion | WAPE | MAE | DA Overall (%) | DA Active (%) | Karakteristik Pasar |
|:---:|:---|:---|---:|---:|---:|---:|:---|
| 35 | Indomie Rasa Kari Ayam | Naive Last Value | **0,01%** | Rp 0 | **99,7%** | 0,0% | Bandrol kardus pabrik konstan |
| 21 | Susu Kental Manis Merk Indomilk | Naive Last Value | **0,07%** | Rp 9 | **98,2%** | 0,0% | Produk industri kaleng |
| 20 | Susu Kental Manis Merk Bendera | Naive 7d SMA | **0,19%** | Rp 25 | **96,5%** | **14,3%** | Moving average meredam variasi antar-kios |

---

#### Kategori 2: Presisi Tinggi & Pangan Inersial (WAPE $< 2,0\%$ | Eror $\le$ Rp 800/kg)
*Karakteristik:* Pasokan terjamin distributor besar, beras cadangan pemerintah (SPHP), atau pasokan pemotongan Rumah Potong Hewan (RPH). Fluktuasi harga mikro tertahan oleh HET dan batas transaksi fisik.

| ID | Komoditas | Model Champion | WAPE | MAE | DA Overall (%) | PICP (80% CI) | Karakteristik Pasar & Catatan Parsimony |
|:---:|:---|:---|---:|---:|---:|:---:|:---|
| 14 | Daging Ayam Kampung | Naive Last Value | **0,07%** | Rp 42 | **99,2%** | Adaptive | *Inersia survei*: Harga Rp 60.000–70.000 statis berbulan-bulan di pasar kota. |
| 40 | Ikan Asin Teri | Naive Last Value | **0,10%** | Rp 87 | **98,5%** | Adaptive | Olahan kering awet tahan simpan bulanan. |
| 96 | Minyak Goreng MINYAKITA | Naive Last Value | **0,14%** | Rp 23 | **96,3%** | Adaptive | Minyak goreng rakyat dengan pagu HET Bapanas. |
| 2 | Beras Premium | Naive Last Value | **0,16%** | Rp 26 | **95,0%** | Adaptive | Terjaga HET nasional dan stok penggilingan modern. |
| 28 | Garam Beryodium Halus | Naive Last Value | **0,24%** | Rp 21 | **98,9%** | Adaptive | *Parsimony*: Reverted dari ML; selisih eror < Rp 10 di bawah koin fisik. |
| 30 | Terigu Protein Sedang (Kemasan) | Naive Last Value | **0,24%** | Rp 30 | **96,8%** | Adaptive | Rantai pasok distributor pabrik terigu Bogasari. |
| 7 | Gula Kristal Putih | Naive Last Value | **0,36%** | Rp 62 | **91,1%** | Adaptive | Distribusi pabrik gula BUMN PTPN. |
| 25 | Jagung Pipilan Kering | Naive Last Value | **0,36%** | Rp 39 | **96,6%** | Adaptive | Pakan ternak/unggas di kios pakan khusus. |
| 4 | Beras Medium | Naive Last Value | **0,42%** | Rp 54 | **92,3%** | Adaptive | Stabilisasi pasokan beras SPHP Bulog Jawa Timur. |
| 10 | Minyak Goreng Curah | Naive Last Value | **0,50%** | Rp 99 | **93,3%** | Adaptive | Kebijakan pasokan DMO & subsidi HET pemerintah. |
| 12 | Daging Sapi Paha Belakang | Naive Last Value | **0,65%** | Rp 752 | **85,1%** | Adaptive | Terjangkar kuat pemotongan harian RPH Pegirikan ($r=0,75$). |
| 32 | Kedelai Impor | Naive Last Value | **0,72%** | Rp 113 | **94,7%** | Adaptive | Pasokan stabil via importir Pelabuhan Tanjung Perak. |
| 43 | KETELA POHON | Naive Last Value | **0,86%** | Rp 54 | **94,8%** | Adaptive | *Parsimony*: Variasi mikro musiman cukup dicakup Naive. |
| 17 | Telur Ayam Kampung | Naive Last Value | **0,97%** | Rp 448 | **90,1%** | Adaptive | Pasar konsumsi jamu/khusus dengan volume transaksi kecil. |
| 92 | Minyak Goreng Kemasan Premium | Naive Last Value | **0,99%** | Rp 182 | **94,0%** | Adaptive | Merk komersial prinsipal (Bimoli, Filma, SunCo). |
| 41 | KACANG HIJAU | Naive Last Value | **1,11%** | Rp 277 | **88,3%** | Adaptive | Biji kering tahan simpan karungan. |
| 42 | KACANG TANAH | Naive Last Value | **1,15%** | Rp 344 | **87,2%** | Adaptive | Stok kering distributor gudang. |
| 62 | Ikan Cakalang | Naive Last Value | **1,23%** | Rp 553 | **87,2%** | Adaptive | Rantai pasok beku *cold-storage* industri. |
| 60 | Ikan Tongkol | Naive Last Value | **1,50%** | Rp 622 | **85,0%** | Adaptive | *Rantai es*: Stabilisasi harga pedagang besar pelabuhan. |
| 59 | Ikan Kembung | Naive Last Value | **1,65%** | Rp 798 | **88,3%** | Adaptive | Pasokan distribusi ikan laut harian. |
| 61 | Ikan Tuna | Naive Last Value | **1,68%** | Rp 798 | **85,1%** | Adaptive | Distribusi rantai beku pelabuhan perikanan. |
| 58 | Ikan Bandeng | Naive Last Value | **1,90%** | Rp 775 | **80,7%** | Adaptive | Tambak payau lokal Sidoarjo-Gresik (panen harian teratur). |

---

#### Kategori 3: Moderat & Musiman (WAPE $2,0\% - 6,0\%$ | Eror Rp 500 – Rp 1.400/kg)
*Karakteristik:* Mengalami dinamika siklus pakan, musim panen, atau kuota impor kontainer, namun komoditas memiliki ketahanan simpan berminggu-minggu (*buffer stock* meredam gejolak harian).

| ID | Komoditas | Model Champion | WAPE | MAE | DA Overall (%) | DA Active (%) | PICP (80% CI) | Karakteristik Pasar |
|:---:|:---|:---|---:|---:|---:|---:|:---:|:---|
| 13 | Daging Ayam Ras | Naive Last Value | **2,38%** | Rp 844 | **50,0%** | 0,0% | Adaptive | Pasokan broiler kemitraan skala besar RPA |
| 16 | **Telur Ayam Ras** | **XGBoost p50** | **2,97%** | **Rp 816** | **45,7%** | **54,1%** | **70,2%** | **ML Unggul.** Siklus pakan Blitar & deteksi arah shock |
| 45 | KENTANG | Naive Last Value | **3,11%** | Rp 496 | **69,9%** | 0,0% | Adaptive | Umbi tahan simpan 3–4 minggu gudang |
| 49 | Bawang Putih Sinco/Honan | Naive Last Value | **4,03%** | Rp 1.387 | **57,8%** | 0,0% | Adaptive | Impor kontainer Tiongkok via Tanjung Perak |
| 44 | KOL/KUBIS | Naive Last Value | **5,80%** | Rp 532 | **70,6%** | 0,0% | Adaptive | Panen rutin sayuran dataran tinggi Malang |
| 47 | WORTEL | Naive Last Value | **5,99%** | Rp 833 | **60,3%** | 0,0% | Adaptive | Pasokan harian lereng Bromo/Trawas |

---

#### Kategori 4: Kritis & Volatil (WAPE $8,0\% - 14,5\%$ | Eror Rp 1.400 – Rp 7.500/kg)
*Karakteristik:* Sayur bumbu cepat busuk (*ultra-perishable*), tanpa cadangan gudang (*zero-inventory*), sangat sensitif terhadap lelang subuh di Pasar Induk Keputran. Pada komoditas ini, **model GBDT wajib digunakan** karena berhasil memprediksi arah pergerakan harga saat terjadi *shock* pasar (**DA Active 43% – 61%**), sementara model Naive selalu buta arah (DA Active 0%).

| ID | Komoditas | Model Champion | WAPE | MAE | DA Overall (%) | DA Active (%) | PICP (80% CI) | Karakteristik Pasar & Keunggulan ML |
|:---:|:---|:---|---:|---:|---:|---:|:---:|:---|
| 39 | **Bawang Merah** | **CatBoost p50** | **8,00%** | **Rp 2.971** | **33,7%** | **42,9%** | **73,4%** | **ML Aktif.** Menangkap transmisi harian Nganjuk/Probolinggo |
| 48 | **BUNCIS** | **XGBoost p50** | **10,42%** | **Rp 1.517** | **42,5%** | **49,3%** | **72,0%** | **ML Aktif.** Sayuran lunak, kulakan harian lelang Keputran |
| 46 | **Tomat Merah** | **XGBoost p50** | **11,65%** | **Rp 1.544** | **42,2%** | **56,2%** | **70,2%** | **ML Aktif.** Sayur lunak cepat busuk; deteksi arah shock 56,2% |
| 37 | **Cabe Merah Keriting** | **CatBoost p50** | **13,61%** | **Rp 5.431** | **39,0%** | **51,0%** | **75,9%** | **ML Aktif.** Deteksi arah kenaikan pasokan Kediri/Blitar |
| 38 | **Cabe Merah Besar** | **CatBoost p50** | **13,39%** | **Rp 4.927** | **48,2%** | **59,5%** | **79,1%** | **ML Aktif.** Menangkap pembalikan tren dan shock pasar |
| 50 | **Cabe Rawit Merah** | **XGBoost p50** | **14,35%** | **Rp 7.485** | **47,2%** | **61,4%** | **71,3%** | **Komoditas Paling Volatil.** Deteksi lonjakan ekstrem (DA Act 61,4%) |

---

### 3. Analisis Trade-off Saintifik: WAPE vs Active Directional Accuracy

Temuan eksperimental menunjukkan fenomena penting dalam peramalan deret waktu harga pangan:
1. **Trade-off Eror Nominal vs Arah Shock:**
   * Model *Naive Last Value* menghasilkan WAPE yang sedikit lebih rendah pada hari-hari pasar normal karena inersia harga pasar eceran (harga tidak berubah).
   * Namun, saat terjadi lonjakan/penurunan harga riil ($|\Delta| > \tau_t$), model Naive **gagal total** (`DA Active = 0,0%`) karena selalu memproyeksikan harga datar.
   * Model GBDT (XGBoost/CatBoost) memiliki WAPE sedikit lebih tinggi pada hari flat (akibat variasi mikro prediksi pohon), namun memberikan nilai strategis yang sangat tinggi untuk EWS karena berhasil menebak arah shock dengan benar pada **50% hingga 61,4% kasus**.
2. **Batas Data (*Data Ceiling*) pada Cabai:**
   Eror cabai rawit tertahan di kisaran WAPE $14\%$ bukan akibat kelemahan algoritma Machine Learning, melainkan karena **ketiadaan variabel eksogen pasokan fisik**:
   * Tidak ada sensor volume tonase harian truk bongkar muat Pasar Induk Keputran.
   * Tidak ada data tingkat serangan hama patek di tingkat petani sentra Jawa Timur secara harian.
   * Oleh karena itu, pendekatan **Two-Tier Framework** (mengombinasikan prediksi median GBDT dengan pita kuantil $p_{10}-p_{90}$ dan skor risiko EWS) merupakan solusi paling realistis dan dapat dipertahankan secara akademis.

---

### 4. Definisi & Penafian Metrik Evaluasi

* **WAPE (Weighted Absolute Percentage Error):** Mengukur deviasi absolut terbobot terhadap total nilai pasar aktual.
* **Directional Accuracy (DA Overall):** Menghitung kecocokan arah prediksi secara keseluruhan. 
  > **[Penafian DA pada Komoditas Inersial]:** Skor DA $> 90\%$ pada model Naive di komoditas stabil (seperti Beras, Minyak, Mi Instan) adalah artefak dari dominasi hari tanpa perubahan harga ($\Delta = 0$). Karena model Naive selalu memprediksi $\Delta = 0$, model otomatis mendapat skor benar saat pasar tidak bergerak.
* **Active Directional Accuracy (`DA_active`):** Menguji ketepatan arah **khusus pada hari-hari di mana harga riil mengalami guncangan signifikan** ($|\Delta y| > \max(0,005 \times y_0, 50)$). Jika model memprediksi datar saat terjadi guncangan pasar, model dinilai salah ($0$).
* **Prediction Interval Coverage Probability (PICP):** Persentase harga aktual yang berada di dalam pita keyakinan 80% ($p_{10} - p_{90}$).
  * Model GBDT (Jalur B) dijamin secara deterministik memenuhi $p_{10} \le p_{50} \le p_{90}$ berkat *Monotone Rearrangement* (Chernozhukov et al., 2010), mencapai cakupan empiris **70% – 79%**.
  * Model Naive (Jalur A) menggunakan *Adaptive Diffusion Cone* yang melebar proporsional terhadap waktu ($\sqrt{h/7}$) dengan batas varians minimum.