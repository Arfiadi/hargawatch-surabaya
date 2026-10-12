# Daftar Master Komoditas HargaWatch

Dokumen ini berisi daftar lengkap **37 komoditas pangan** yang dipantau oleh sistem HargaWatch. Data ini diekstraksi (di-scraping) dari sumber resmi (seperti SISKAPERBAPO Jawa Timur) dan tersimpan di tabel `dim_komoditas` pada database Supabase.

Data ini mencakup berbagai kelompok pangan, mulai dari bahan pokok strategis (beras, gula, minyak goreng) hingga kelompok sayuran dan perikanan.

## 🌾 Kelompok Pangan Pokok & Strategis
Kelompok ini merupakan kebutuhan dasar dengan bobot konsumsi tertinggi, yang pergerakannya sangat dijaga oleh pemerintah (sering diintervensi melalui Harga Eceran Tertinggi/HET dan Operasi Pasar).
* Beras Medium
* Beras Premium
* Gula Kristal Putih
* Minyak Goreng Curah
* Minyak Goreng Kemasan Premium
* Minyak Goreng MINYAKITA
* Terigu Protein Sedang (Kemasan)
* Jagung Pipilan Kering

## 🥩 Kelompok Protein Hewani
Sangat dipengaruhi oleh biaya pakan (jagung/kedelai), cuaca ekstrem, dan lonjakan permintaan pada hari raya (Ramadan, Idul Fitri, Nataru).
* Daging Ayam Ras *(Target Eksperimen)*
* Daging Ayam Kampung
* Daging Sapi Paha Belakang
* Telur Ayam Ras *(Target Eksperimen)*
* Telur Ayam Kampung

## 🐟 Kelompok Perikanan
Suplai komoditas ini bergantung pada kondisi cuaca maritim (gelombang tinggi, badai) dan pasokan solar untuk nelayan.
* Ikan Asin Teri
* Ikan Bandeng
* Ikan Cakalang
* Ikan Kembung
* Ikan Tongkol
* Ikan Tuna

## 🌶️ Kelompok Sayuran & Bumbu Dapur (Hortikultura)
Kelompok **paling bergejolak (Volatile Foods)**. Sangat rentan terhadap anomali cuaca (banjir, La Nina, kemarau panjang) dan umur simpannya yang pendek (mudah busuk). Sering menjadi penyumbang utama inflasi/deflasi.
* Cabe Rawit Merah *(Target Eksperimen Utama)*
* Cabe Merah Besar
* Cabe Merah Keriting
* Bawang Merah *(Target Eksperimen)*
* Bawang Putih Sinco/Honan *(Target Eksperimen)*
* Tomat Merah
* BUNCIS
* KENTANG
* KOL/KUBIS
* WORTEL

## 🥜 Kelompok Kacang-kacangan & Umbi
* Kedelai Impor
* KACANG HIJAU
* KACANG TANAH
* KETELA POHON

## 🥛 Kelompok Barang Pabrikan (FMCG)
Kelompok ini cenderung stabil dan harganya ditentukan oleh produsen besar serta rantai logistik nasional.
* Susu Kental Manis Merk Bendera
* Susu Kental Manis Merk Indomilk
* Indomie Rasa Kari Ayam
* Garam Beryodium Halus

---

### Catatan Penggunaan ML
Meskipun sistem menarik 37 komoditas, model eksperimen *Forecasting & Early Warning System* (EWS) akan difokuskan secara khusus pada kelompok **Protein Hewani** dan **Hortikultura** karena karakteristik volatilitasnya yang tinggi dan dampak signifikannya terhadap inflasi harian masyarakat Surabaya.
