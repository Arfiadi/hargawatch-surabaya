# Laporan Audit HargaWatch Surabaya

**File:** `audit_freebuff.md`  
**Tanggal audit:** 29 Oktober 2026  
**Mode:** read-only; tidak ada perubahan pada aplikasi, database, model, atau konfigurasi.  
**Branch/revisi saat audit:** `main` / `8c6de3c`  
**Data live diperiksa:** Supabase melalui public/publishable key untuk query `SELECT` saja. Nilai kredensial tidak dicatat di laporan.

---

## 1. Ringkasan eksekutif

Jalur utama frontend terhubung ke tabel Supabase yang benar: dashboard (`/`), Early Warning (`/early-warning`), Forecasting (`/forecasting`), dan Peta (`/peta`) membaca data melalui `web/src/lib/dataService.ts`. Dimensi master live berisi **37 komoditas dan 6 pasar**, sesuai cakupan HargaWatch. Pemeriksaan tidak menemukan ID harga yang tidak dikenal atau duplikasi primary-key pada CSV fakta lokal yang diperiksa.

Namun, ada masalah material pada integritas informasi yang ditampilkan:

1. **Tren beranda dapat menyajikan proyeksi sintetis seolah proyeksi model.** Query forecast memilih baris tertua terlebih dahulu, membatasi hasil 100 baris, lalu mencari tanggal setelah observasi terbaru. Pada data live 29 Okt 2026, tidak ada forecast setelah tanggal jangkar di hasil query tersebut; kode kemudian membuat tanggal sendiri, mengisi kurva pasar dengan carry-forward, dan memakai harga acuan hardcoded untuk band kota.
2. **EWS berpotensi mengubah status yang tidak tersedia menjadi NORMAL.** Pada 29 Okt 2026 terdapat 7 pasangan harga tanpa skor EWS. `getLiveEarlyWarning` memberi `total_skor=0` dan `status_warning="NORMAL"` untuk pasangan tersebut. Tujuh pasangan lainnya tidak mempunyai baris harga maupun EWS dan tidak ditampilkan. Dengan demikian, status dan persentase stabilitas tidak sepenuhnya merepresentasikan cakupan lengkap 37×6.
3. **Metrik akurasi dan identitas model pada halaman Forecasting berbeda dari champion registry.** Perbedaan meliputi model Cabai Rawit, Bawang Merah, Telur, serta WAPE Minyak Curah dan Gula. Kartu EWS juga menampilkan WAPE tetap 5,36% tanpa mengikat angka itu ke komoditas/horizon.
4. **Acuan regulasi antarhalaman tidak konsisten.** HAP Bawang Merah dan Telur mempunyai angka berbeda di halaman EWS dan Forecasting. Satuan Minyak Goreng Curah juga tidak konsisten antara master komoditas (kg) dan keterangan EWS (/liter). Audit ini membuktikan inkonsistensi internal; validitas angka terhadap ketentuan pemerintah terkini belum diverifikasi dari dokumen resmi eksternal.
5. **Ada fallback yang dapat menghasilkan angka non-sumber.** Grafik tren menggunakan baseline tetap, offset pasar tetap, harga rata-rata 15.000 saat komoditas tidak tersedia pada kalkulasi keranjang, dan data sintetis otomatis untuk pipeline ML bila DB/CSV lokal tidak tersedia. Sebagian fallback diberi tanda estimasi; sebagian lain tidak.
6. **Snapshot lokal dan live berbeda.** Snapshot CSV lokal terbaru bertanggal 29 Okt 2026, tetapi memiliki 7 pasangan harga tanpa nilai imputasi dan EWS 208 baris. Live Supabase pada tanggal yang sama memiliki 215 pasangan harga (7 di antaranya diimputasi) dan 208 baris EWS. Snapshot `fact_forecast.csv` lokal berisi 2.912 baris proyeksi 14 hari yang sebagian komoditasnya tidak mencakup keenam pasar; live DB mempunyai 4.422 baris total dan memiliki 588 baris forecast masa depan untuk tujuh komoditas prioritas.

**Kesimpulan:** struktur koneksi antarpages sudah ada dan dimensi inti konsisten, tetapi angka tertentu di UI tidak seluruhnya berasal dari observasi/forecast live yang sesuai. Halaman utama tren dan EWS perlu diprioritaskan sebelum angka dipakai sebagai dasar keputusan operasional. Audit ini tidak mengubah apa pun.

---

## 2. Cakupan, metode, dan batasan

### Cakupan yang diperiksa

- Status working tree/branch, arahan repository, dan peta berkas.
- Frontend aktif: `/`, `/early-warning`, `/forecasting`, `/peta`.
- Adapter data frontend (`web/src/lib/dataService.ts`), katalog frontend, konstanta/regulatory references, dan modul mock lama.
- Backend ingestion, feature engineering, EWS, runner forecasting harian, skema ML dan registry champion.
- CSV lokal `fact_harga_pasar`, `fact_forecast`, `fact_early_warning`, `dim_komoditas`, `dim_pasar`, konfigurasi dan artefak eksperimen.
- Query read-only terhadap Supabase live untuk dimensi, tanggal terbaru, cakupan harga/EWS, dan forecast.
- Tes backend, build/lint frontend, serta audit dependency frontend.

### Metode

- Penelusuran statis pemanggil fungsi dan alur data.
- Rekonsiliasi jumlah baris, tanggal, pasangan `(komoditas_id, pasar_id)`, missing values, status EWS, rentang forecast dan band kuantil.
- Perbandingan model/WAPE UI dengan `models/forecasting/registry.json`.
- Tidak menjalankan scraper, training, upsert, alert dispatch, atau mutasi database.

### Batasan penting

- Akses live menggunakan peran baca frontend. Tidak ada verifikasi independen terhadap sumber asli SISKAPERBAPO untuk setiap harga, dan tidak ada pembandingan dengan seluruh dokumen hukum Bapanas/Kemendag terkini. Jadi “harga live” berarti nilai yang tersedia di DB saat query, bukan validasi audit eksternal bahwa setiap angka adalah harga sumber yang benar.
- Baris data yang berubah setelah audit bisa mengubah hitungan. Angka live di bawah ini berlaku untuk snapshot **29 Okt 2026**.
- Audit tidak melakukan pemeriksaan visual browser. Keberhasilan build/type-check dan inspeksi kode/DOM statis bukan bukti pengujian visual/responsif menyeluruh.

---

## 3. Peta aliran data

| Halaman | Sumber data utama | Fungsi yang dipanggil | Catatan |
|---|---|---|---|
| Dashboard `/` | `fact_harga_pasar`, `fact_early_warning`, `fact_forecast`, dimensi pasar/komoditas | `getLiveCommodities`, `getLiveStabilitySummary`, `getLiveShoppingBasket`, `getLiveMarketComparisonTrends` | Kartu harga dan ringkasan berasal dari DB. Tren memiliki fallback sintetis; keranjang punya fallback harga. |
| Early Warning `/early-warning` | `fact_early_warning`, `fact_harga_pasar`, `dim_komoditas`, `dim_pasar` | `getLiveEarlyWarning` | Membuat matriks komoditas × pasar; baris yang kehilangan skor EWS diperlakukan NORMAL. |
| Forecasting `/forecasting` | `fact_harga_pasar`, `fact_forecast`, `dim_komoditas` | `getLiveForecastDetails` | Riwayat dan proyeksi diagregasi sebagai rerata lintas pasar. Metrik model/HAP berasal dari konstanta frontend, bukan query registry. |
| Peta `/peta` | `fact_harga_pasar`, `dim_komoditas`, `dim_pasar` | `getLiveMarketComparison`, `getLiveMarketComparisonForCommodity`, `getLiveMarketLocations` | Harga pasar terbaru; untuk pasar tanpa laporan, adapter mengisi rerata kota dan menandai estimasi. Koordinat live tersedia. |

Katalog frontend di `ALL_CATALOG_COMMODITIES` berisi 37 ID yang sama dengan master komoditas live. Enam ID pasar (1, 2, 3, 4, 5, 146) konsisten dengan master live. Tidak ditemukan foreign ID pada `fact_harga_pasar` lokal terhadap master tersebut. Sebagian teks UI masih menyebut “38 komoditas” (contoh placeholder pencarian), tidak sesuai katalog proyek yang telah dideduplikasi menjadi 37.

---

## 4. Temuan audit

### F-01 — Tinggi: Kurva tren beranda memakai fallback sintetis saat forecast model live tidak terjangkau query

**Lokasi:** `web/src/lib/dataService.ts`, `getLiveMarketComparisonTrends` (sekitar baris 1050–1254), khususnya query forecast sekitar 1067–1096, pemilihan tanggal sekitar 1108–1137, baseline sekitar 1164–1196, dan carry-forward sekitar 1206–1235. Halaman pemanggil: `web/src/app/page.tsx:151–173`.

Query meminta `fact_forecast` dalam urutan tanggal menaik dan membatasi hasil paling banyak 100 baris untuk horizon pendek. Fungsi baru setelah itu menyaring tanggal yang lebih besar dari `anchorDate` (tanggal historis paling baru). Pemeriksaan live khusus Cabai Rawit mendapatkan jangkar `2026-10-29`, sementara 100 baris yang dikembalikan memiliki tanggal forecast awal 28 Sep–14 Okt 2026; tidak ada tanggal setelah jangkar. Padahal query terpisah menemukan **588 baris future forecast** untuk tujuh komoditas prioritas (84 per komoditas, 14 tanggal × 6 pasar) dari 30 Okt–12 Nov.

Ketika daftar tanggal forecast kosong, fungsi membuat tujuh tanggal kalender sendiri. Harga per pasar yang tidak ditemukan diisi dengan harga terakhir (flat carry-forward); band kota menggunakan `basePrices` hardcoded dan ±6% jika tidak ada hasil forecast untuk tanggal tersebut. Ini bukan angka hasil model yang disimpan di `fact_forecast`, meskipun visualisasi menyajikannya dalam seri dengan label proyeksi. Pada snapshot live yang diperiksa, jalur ini dapat terpicu karena paging query mengembalikan rentang lama terlebih dahulu.

**Dampak:** garis proyeksi pada tren beranda tidak selalu identik dengan keluaran model. Baseline harga, bentuk yang datar dan rentang band dapat memberi kesan bahwa model memproyeksikan angka tersebut.

**Saran:** query forecast harus dibatasi tanggal setelah jangkar dan mengambil data paling relevan secara eksplisit; bila data tidak tersedia, tampilkan state kosong, bukan membuat kurva/band harga. Beri label sumber/jenis estimasi untuk setiap fallback bila fallback memang sengaja dipertahankan.

### F-02 — Tinggi: Record harga tanpa EWS ditampilkan berstatus NORMAL

**Lokasi:** `web/src/lib/dataService.ts:464–552`, terutama default `status_warning: e?.status_warning || "NORMAL"` sekitar baris 526; ringkasan dashboard `:210–280`; UI matriks `web/src/app/early-warning/page.tsx:146–154, 675–744`.

Data live 29 Okt 2026:

- Master mengharapkan 37 × 6 = **222** pasangan komoditas/pasar.
- `fact_harga_pasar`: **215** pasangan (7 tidak mempunyai baris).
- `fact_early_warning`: **208** baris (14 pasangan tidak mempunyai baris EWS).
- 7 dari 215 pasangan harga tidak memiliki record EWS; adapter memasukkan record tersebut dengan skor 0, seluruh skor pilar 0, dan status `NORMAL`.
- 7 pasangan lainnya tidak memiliki record harga ataupun EWS dan tidak dimasukkan ke item list.
- Tidak ditemukan record EWS tanpa pasangan harga pada tanggal tersebut.

Pasangan harga tanpa EWS yang menjadi default NORMAL: Ikan Kembung–Tambahrejo, Ikan Kembung–Wonokromo, Ikan Tuna–Tambahrejo, Ikan Tuna–Wonokromo, Ikan Tuna–Keputran, Ikan Cakalang–Tambahrejo, dan Ikan Cakalang–Wonokromo. Pasangan yang tidak ada pada kedua fakta meliputi Ikan Kembung–Genteng/Keputran, Ikan Tuna–Genteng, Ikan Cakalang–Genteng/Keputran, Jagung Pipilan Kering–Soponyono, dan Ikan Asin Teri–Keputran.

Karena itu, denominator ringkasan dashboard bisa mencampur 208 status bersumber dengan 7 status default, sedangkan 7 pasangan kosong dihilangkan. Untuk 208 baris EWS mentah, ada 139 NORMAL (**66,8%**); setelah tujuh missing-EWS diubah menjadi NORMAL, data hasil adapter berjumlah 215 dan 146 NORMAL (**67,9%**). UI tidak mengungkap bahwa status sebagian pasangan adalah default.

**Dampak:** statistik stabilitas, jumlah normal, dan matriks risiko dapat terlihat lebih aman/lebih lengkap daripada bukti skor yang tersedia. “Tidak ada skor” tidak sama dengan “risiko normal”.

**Saran:** jadikan status missing sebagai `UNKNOWN`/data belum tersedia; jangan hitung sebagai NORMAL. Cantumkan coverage numerator/denominator (contoh 208/222) dan tampilkan indikator missing pada matriks.

### F-03 — Tinggi: Nilai WAPE dan pilihan model di Forecasting tidak cocok dengan champion registry

**Lokasi:** `web/src/app/forecasting/page.tsx:95–171, 233–245, 710–722`; registry `models/forecasting/registry.json`; angka WAPE umum EWS `web/src/app/early-warning/page.tsx:571`.

Perbandingan untuk horizon H+7 yang diperiksa:

| ID | UI Forecasting | Registry champion | Hasil |
|---:|---|---|---|
| 50 Cabai Rawit | LightGBM, WAPE 13,50% | XGBoost p50, 14,97% | Tidak cocok |
| 39 Bawang Merah | CatBoost, 6,97% | CatBoost p50, 8,02% | Tidak cocok |
| 16 Telur Ayam | CatBoost, 3,22% | XGBoost p50, 3,04% | Tidak cocok |
| 2 Beras Premium | Naive, 0,10% | Naive, 0,10% | Cocok |
| 13 Daging Ayam | Naive, 2,00% | Naive, 2,00% | Cocok |
| 10 Minyak Curah | Naive, 3,62% | Naive, 0,23% | Tidak cocok |
| 7 Gula | Naive, 1,50% | Naive, 0,62% | Tidak cocok |

Kartu halaman menampilkan `accuracy = 100 − WAPE` seolah “Akurasi Backtest”; fallback komoditas lain mengasumsikan WAPE 5,36% / akurasi 94,64%. EWS juga menampilkan “Akurasi prediksi: WAPE 5,36%” statis. Tidak terlihat pengambilan nilai dari registry maupun label yang memperjelas cakupan angka 5,36% (agregat, model, horizon atau periode evaluasi).

**Dampak:** klaim performa dan atribusi model pada halaman analitik tidak dapat direkonsiliasi dengan registry yang dipakai runner produksi.

**Saran:** gunakan satu sumber evaluasi/registry yang terversi untuk UI; tampilkan horizon, periode backtest, model champion dan metrik dengan nama yang tepat. Bila metrik aggregate, nyatakan jelas komoditas/periode yang dihitung.

### F-04 — Tinggi: Acuan HAP/HET berbeda antarhalaman dan satuan komoditas tidak seragam

**Lokasi:** `web/src/app/early-warning/page.tsx:17–26`; `web/src/app/forecasting/page.tsx:17–28`; `data/processed/dim_komoditas.csv` dan katalog `web/src/lib/dataService.ts`.

Perbedaan internal yang terlihat:

- Bawang Merah (ID 39): halaman EWS menyebut HAP Rp36.500/kg, Forecasting memakai Rp41.500/kg.
- Telur Ayam Ras (ID 16): halaman EWS menyebut Rp28.500/kg, Forecasting memakai Rp27.000/kg.
- Minyak Goreng Curah (ID 10): master/katalog menyebut satuan `kg`; EWS mencetak HET Rp15.700/liter. Forecasting mengikat satuan tampilan benchmark pada unit komoditas sehingga menyebut `/kg`.
- Label acuan pada Early Warning bersifat hardcoded per sebagian kecil ID; ID lain hanya mendapat teks generik “Acuan Pantauan Pasar Surabaya”.

Audit ini mengonfirmasi perbedaan antarhalaman dan antar-master, **bukan** menetapkan angka resmi yang benar. Tidak dilakukan validasi eksternal atas peraturan terbaru.

**Dampak:** pembaca dapat menerima harga pembanding/kepatuhan yang berbeda bergantung halaman; konversi kg/liter berisiko menyesatkan.

**Saran:** sentralisasikan referensi resmi dalam satu katalog dengan sumber, tanggal berlaku, komoditas/kelas mutu, zona, dan satuan eksplisit; sembunyikan acuan yang belum diverifikasi.

### F-05 — Tinggi: Forecasting menampilkan proyeksi historis jika tidak ada forecast setelah tanggal harga terbaru

**Lokasi:** `web/src/lib/dataService.ts:610–815`; pemilihan forecast sekitar `:704–710`.

Fungsi mengambil tanggal terbaru dari `fact_harga_pasar`, lalu meminta forecast dengan syarat `tanggal > latestDate`. Jika query menghasilkan kosong/error, fungsi mengembalikan `null` (bukan proyeksi lama). Akan tetapi, live DB memiliki 588 baris forecast masa depan (84 baris per setiap 7 komoditas, mencakup enam pasar dan 14 tanggal). Audit menghitung total live `fact_forecast` **4.422** baris dan hanya mengambil sebagian halaman via public REST; query khusus masa depan menunjukkan rentang 30 Okt–12 Nov serta 84 baris untuk masing-masing ID 2, 7, 10, 13, 16, 39, 50.

Sebaliknya, CSV lokal `data/processed/fact_forecast.csv` berisi **2.912** baris dari 30 Okt–12 Nov dengan cakupan pasar tidak lengkap untuk ID 25 (5 pasar), 40 (5), 59 (2), 61 (2), dan 62 (2). Artinya file lokal dan tabel live tidak bisa diasumsikan salinan keadaan yang sama.

**Dampak:** operasi offline atau fallback ke CSV dapat menghasilkan proyeksi dengan coverage berbeda dari UI yang membaca live DB. Pembaca bisa keliru menganggap keenam pasar tersedia untuk semua komoditas.

**Saran:** tampilkan jumlah pasar cakupan dan tanggal run pada hasil forecast; validasi hasil pipeline/upsert serta lakukan rekonsiliasi DB vs CSV berdasarkan tanggal, ID, dan primary key.

### F-06 — Sedang: Harga estimasi dapat masuk ke statistik harga dan keranjang tanpa cukup pemisahan sumber

**Lokasi:** `web/src/lib/dataService.ts:294–450` (kartu harga), `:610–695` (riwayat forecast), `:1050–1235` (tren), `:1350–1385` (matriks peta), `:1533–1635` (keranjang); UI peta `web/src/app/peta/page.tsx:980–1017`.

Pada 29 Okt, ada **7** baris pasar dengan `harga_asli=NULL`, `harga_imputasi` tersedia, `is_imputed=true`; adapter peta menandainya dengan `~`/`Est`, dan jalur tren membawa `is_imputed`. Namun kartu harga beranda dan keranjang menggunakan `harga_imputasi`, sementara query tersebut tidak memilih/menampilkan flag imputasi. Riwayat Forecasting memakai `harga_asli || harga_imputasi`, menghitung rata-rata historis, lalu hanya menandai satu tanggal sebagai imputed bila lebih dari separuh barisnya diimputasi. Dengan agregasi lintas pasar ini, satu pasar imputasi bisa tidak tercermin sebagai label tanggal imputasi.

Pada snapshot lokal keseluruhan, terdapat **18.502** nilai `harga_asli` kosong dari 489.740 baris (3,78%); 761 di antaranya mempunyai nilai imputasi yang ditandai, sementara 245 ditandai `is_imputed=true` tetapi nilai imputasi juga kosong. Kebijakan ingestion sendiri membatasi forward-fill ke tujuh hari (`src/pipeline/ingestion.py:175–190`).

Keranjang mengganti harga komoditas/pasar yang tak ditemukan dengan rerata yang tersedia; jika tidak ada harga komoditas sama sekali, rerata fallback adalah **Rp15.000**. Ini dapat mengubah ranking dan angka penghematan tanpa label estimasi. Peta lebih transparan: harga pasar missing diganti rerata kota, dengan daftar `missingMarkets` dan tanda estimasi.

**Dampak:** nilai imputasi/fallback berpotensi dibaca sebagai observasi pasar langsung atau mengubah perbandingan murah/mahal.

**Saran:** pertahankan `harga_asli`, `harga_imputasi`, dan `is_imputed` sampai lapisan UI; pisahkan statistik observed vs imputed; jangan masukkan fallback Rp15.000 ke ranking sebagai harga aktual; jelaskan coverage data.

### F-07 — Sedang: Pipeline ML dapat diam-diam memakai dataset mock jika koneksi gagal dan CSV lokal tidak ada

**Lokasi:** `src/analytics/features.py:20–116`; pemanggil produksi `scripts/run_forecasting.py:35–45, 345–420`; orkestrasi `scripts/run_daily_pipeline.py:69–111`.

`load_raw_datasets` mengutamakan CSV lokal, mencoba database bila perlu, lalu memanggil `generate_mock_raw_datasets()` ketika database gagal dan `fact_harga_pasar.csv` tidak tersedia. Generator membuat data sintetis deterministik hanya untuk tiga komoditas (ID 2, 50, 39), lima pasar (1–5), pola sinus dan cuaca konstan. Runner forecasting produksi memanggil fungsi ini; runner harian meminta `--from-db`, tetapi kegagalan DB tetap dapat mencapai jalur mock bila file lokal tidak tersedia.

**Dampak:** lingkungan tanpa kredensial/DB dan tanpa cache lokal dapat menghasilkan forecast/EWS dari data sintetis; ini berbahaya bila output disangka forecast produksi. Pada audit ini, CSV lokal ada dan live DB dapat diakses; tidak ada bukti bahwa forecast live yang diperiksa dibuat dari mock.

**Saran:** tambahkan guard produksi yang menggagalkan pipeline bila sumber bukan DB/CSV produksi. Jadikan mock hanya opt-in eksplisit untuk test/CI dan sertakan metadata provenance di artefak output.

### F-08 — Sedang: Kegagalan simulasi keranjang dapat meninggalkan hasil lama di layar

**Lokasi:** `web/src/app/page.tsx:176–197`.

Pada perubahan item keranjang, state lama tidak segera dibersihkan. Promise hanya memanggil `setBasketSim(sim)` jika hasil baru truthy. Jika permintaan baru gagal atau mengembalikan `null`, hasil simulasi item sebelumnya dapat tetap ditampilkan, sementara daftar item sudah berubah.

**Dampak:** total belanja, ranking, dan rekomendasi bisa tidak cocok dengan pilihan basket yang sedang aktif ketika request gagal.

**Saran:** kosongkan/invalidasi hasil lama saat input berubah dan tampilkan error/empty state yang berbeda dari hasil sukses.

### F-09 — Sedang: Header status EWS menganggap data kosong/loading sebagai kondisi aman

**Lokasi:** `web/src/app/early-warning/page.tsx:430–489`.

Kartu stabilitas memakai `100.0%` sebagai nilai default sebelum `ewsStats` tersedia; status banner juga memiliki cabang default NORMAL. Ada error-state tabel, tetapi KPI/header utama tetap dapat menampilkan sinyal aman saat fetch belum selesai atau hasil tidak tersedia.

**Dampak:** ketika data tidak tersedia, indikator tingkat atas berpotensi terbaca sebagai kondisi aman meski belum ada bukti data.

**Saran:** tampilkan skeleton saat loading dan “data tidak tersedia” bila gagal; hindari default 100%/NORMAL pada status risiko.

### F-10 — Sedang: Snapshot CSV lokal mempunyai perbedaan cakupan dari Supabase live

**Lokasi:** `data/processed/fact_harga_pasar.csv`, `fact_forecast.csv`, `fact_early_warning.csv`; loader `src/analytics/features.py:65–116`.

CSV harga lokal memiliki 489.740 baris, tanggal 2020-01-01–2026-10-29, 37 komoditas × 6 pasar dan tanpa duplicate key. Pada tanggal terbaru lokal terdapat 215 pasangan, 7 dengan `harga_asli` dan `harga_imputasi` kosong. Live pada tanggal sama memiliki 215 pasangan, tetapi ketujuh pasangan tersebut sudah mempunyai harga imputasi dan penanda `is_imputed=true`. Jadi local cache tidak identik dengan live pada record terbaru meski tanggal maksimalnya sama.

CSV EWS lokal memiliki 208 baris untuk tanggal 29 Okt, persis sebanyak baris EWS live saat diperiksa. Sementara forecast lokal 2.912 baris memiliki coverage yang disebut pada F-05; tabel live total 4.422 baris.

**Dampak:** hasil offline/training yang membaca cache lokal dan UI yang membaca Supabase dapat memakai observasi imputasi/forecast yang berbeda. Karena loader mengutamakan file lokal secara default, audit reproducibility memerlukan provenance dan timestamp sinkronisasi.

**Saran:** simpan waktu ekspor/sinkronisasi dan checksum/sumber data; sediakan pemeriksaan kualitas dan laporan perbedaan sebelum cache dipakai untuk training atau evaluasi.

### F-11 — Rendah: Modul mock lama masih ada tetapi tidak terhubung ke route aktif

**Lokasi:** `web/src/data/mockData.ts`; komponen `PriceTrendChart.tsx`, `CommodityCard.tsx`, `SmartShoppingBasket.tsx`.

Ketiga komponen lama mengimpor `COMMODITIES`/`MARKETS` dari mock data, dan `mockData.ts` berisi `EARLY_WARNING_ALERTS` statis. Pencarian pemakaian menunjukkan tidak ada route aktif yang merender komponen tersebut; halaman utama aktif menggunakan implementasi Supabase langsung. Jadi ini **bukan bukti bahwa halaman publik saat ini menampilkan seluruh mock data**, tetapi modul dorman dapat menimbulkan kebingungan atau kembali digunakan kelak.

**Saran:** hapus/arsipkan hanya setelah dipastikan tidak dipakai, atau beri nama/dokumentasi yang jelas sebagai fixture demo.

### F-12 — Rendah: Metadata komoditas UI tidak seluruhnya satu sumber

**Lokasi:** `web/src/lib/dataService.ts:147–160, 220+`; `web/src/components/CommoditySearchSelect.tsx:27`; `web/src/app/peta/page.tsx` katalog/threshold; halaman EWS/Forecasting.

Katalog dashboard/peta/forecast mempunyai konfigurasi terpisah, metadata HAP dan threshold juga hardcoded pada tiap halaman. Placeholder pencarian berbunyi “Cari dari 38 komoditas Surabaya...”, padahal master dan katalog proyek mempunyai 37 komoditas. Satuan beberapa produk berbeda format pada CSV dimensi dan katalog UI (contoh Minyakita, susu, mie) sehingga teks unit perlu divalidasi sebelum disatukan dengan harga.

**Dampak:** label dapat tertinggal atau berbeda antarhalaman ketika master komoditas berubah.

**Saran:** pakai master yang terversi sebagai sumber metadata tunggal, dengan pemetaan alias dan satuan display yang diverifikasi.

### F-13 — Rendah: Tahun sinkronisasi di grafik hardcoded

**Lokasi:** `web/src/lib/dataService.ts:1240`.

`latestSyncDate` menambahkan literal `2026` pada tanggal format tanpa tahun. Untuk data sesudah 2026, label menjadi salah; jalur `getLiveMultiCommodityTrends` yang tidak terpakai juga memiliki special case tanggal `2026-10-04`.

**Saran:** format tanggal dari nilai penuh (`tanggal`) alih-alih meng-hardcode tahun.

---

## 5. Temuan yang tidak terbukti sebagai masalah live saat audit

- **Koneksi tiap route utama:** kode aktif semuanya menggunakan adapter Supabase dan live query berhasil; tidak ditemukan fallback ke dataset mock lama pada route aktif.
- **Master data:** 37 komoditas, 6 pasar, ID unik; tidak ada ID fakta harga di luar dimensi live.
- **Duplikasi harga lokal:** tidak ditemukan duplikasi `(tanggal, pasar_id, komoditas_id)` di `fact_harga_pasar.csv`.
- **Jumlah komponen EWS:** pada 208 baris EWS live, jumlah empat skor sama dengan `total_skor` untuk semua baris. Status live saat diperiksa: NORMAL 139, WASPADA 65, TINGGI 4.
- **Forecast prioritas masa depan:** ketujuh prioritas mempunyai 14 tanggal × 6 pasar (84 baris/komoditas) untuk 30 Okt–12 Nov. Tidak ada band invalid (`batas_bawah > p50` atau `p50 > batas_atas`) maupun band lebar nol pada set forecast masa depan yang diperiksa.
- **Koordinat live:** enam pasar tersedia di `dim_pasar` dengan latitude/longitude; koordinat yang dikembalikan cocok dengan fallback awal halaman peta.
- **Temuan lama terkait band nol:** CSV lokal hasil sebelumnya memang pernah menunjukkan nilai band nol pada pemeriksaan awal, tetapi query Supabase terbaru untuk proyeksi masa depan menunjukkan 0 band nol. Temuan lama tersebut tidak diperlakukan sebagai masalah live saat ini.

---

## 6. Hasil verifikasi

### Perintah yang dijalankan

```bash
pytest tests/ -q -rs
# 62 passed, 17 skipped in 24.53s

cd web && npm run build
# Compiled successfully; static pages 8/8; lint/type validity passed

cd web && npm run lint
# No ESLint warnings or errors (Next.js memberi peringatan bahwa `next lint` deprecated)

cd web && npm audit --audit-level=high
# found 0 vulnerabilities
```

17 tes yang dilewati dilaporkan `StatsForecast not installed` pada `tests/test_statistical_models_stress.py`; tidak ada tes yang dinonaktifkan atau assertion yang diubah.

Selain itu dilakukan skrip Python read-only untuk memeriksa CSV lokal, registry dan coverage ID/duplikasi/missingness; serta skrip Node read-only memakai Supabase JS untuk query tabel live. Query live berhasil dan tidak mencetak URL/key/secret.

### Hasil Git

- Branch: `main` (tracking `upstream/main`)
- HEAD: `8c6de3c`
- Tidak ada perubahan aplikasi pada saat audit awal; laporan ini adalah satu-satunya file yang diminta untuk ditambahkan.
- Tidak ada commit atau push yang dilakukan.

---

## 7. Urutan perbaikan yang disarankan

1. **Perbaiki tren forecast beranda (F-01):** buang fallback angka sintetis dari jalur produksi atau tandai secara eksplisit; query future forecast dengan paging/filter yang benar.
2. **Perbaiki semantik missing EWS (F-02, F-09):** bedakan `UNKNOWN` dari `NORMAL`, tampilkan coverage, dan jangan tampilkan aman ketika data belum tersedia.
3. **Satukan metrik dan regulatory reference (F-03, F-04):** satu sumber bertanggal dan terversi, disertai horizon/backtest/model/unit/source.
4. **Tingkatkan provenance serta kualitas snapshot (F-05, F-06, F-10):** audit freshness, perbandingan live-vs-local, penanda imputasi dan coverage per pasar.
5. **Fail closed pada pipeline produksi (F-07):** data sintetis hanya melalui opt-in test/CI.
6. **Perbaiki ketahanan state & metadata (F-08, F-11–F-13):** jangan biarkan simulasi lama tampil; rapikan mock dorman, placeholder 38, dan tahun literal.

---

## 8. Penutup

Audit ini menunjukkan bahwa alur integrasi antarpages pada dasarnya sudah terpasang, tetapi “semua data terhubung” tidak berarti setiap pasangan data lengkap atau setiap angka yang tampak live memang berasal dari sumber live yang sama. Paling berisiko saat ini adalah **kurva tren sintetis yang dapat tampil sebagai proyeksi model** dan **EWS yang menganggap record skor hilang sebagai NORMAL**. Angka performa model serta acuan regulasi juga memerlukan satu sumber resmi dan provenance sebelum dipakai untuk pelaporan kebijakan.
