# Audit Halaman Forecasting & Tren (`/forecasting`)

Tanggal: 2026-10-18 · Mode: audit read-only (tidak ada perubahan kode)
Target: `web/src/app/forecasting/page.tsx` (1061 baris), `web/src/lib/dataService.ts` (`getLiveForecastDetails`, baris 422–592), data Supabase `fact_forecast` / `fact_harga_pasar` / `dim_komoditas`.

Metode: baca kode penuh → probe DB read-only per komoditas → render nyata di Edge headless via CDP (desktop 1440×1400 & ponsel 390×844) → uji interaksi (ganti komoditas, toggle horizon, filter status, hover chart) → bandingkan angka layar dengan angka DB.

Status data saat audit: observasi terakhir `2026-10-17`; `fact_forecast` berisi 7 komoditas × 34 tanggal (14 tanggal masa depan). Tidak ada exception console di halaman ini.

---

## Ringkasan temuan

| # | Severity | Kategori | Temuan |
|---|---|---|---|
| 1 | **Tinggi** | Konten/Data | Kartu "Evaluasi Akurasi Model" hardcoded `94,6%` & WAPE `5,36%` untuk semua komoditas |
| 2 | **Tinggi** | Konten/Kebijakan | "Rekomendasi Satgas" & saran belanja hardcoded, bertentangan dengan badge di sebelahnya |
| 3 | **Tinggi** | Konten | Klaim "Pola Siklus Mingguan" dibantah data milik sistem sendiri |
| 4 | **Tinggi** | Data | Band prediksi lebar-nol (Beras Premium 14/14 hari, Daging Ayam 28/84) disajikan sebagai "Rentang Wajar" |
| 5 | **Tinggi** | Data/Konten | 2 dari 7 komoditas diprediksi datar identik dengan harga hari ini, tanpa disclosure model |
| 6 | **Sedang** | Logika/State | Jendela render salah: benchmark komoditas baru dipasangkan harga komoditas lama (`+277%`) |
| 7 | **Sedang** | Data/Tata kelola | `harga_imputasi` dipakai untuk label "Riwayat Riil Pasar" / "Basis data aktual", `is_imputed` diabaikan |
| 8 | **Sedang** | Visual/Responsif | `preserveAspectRatio="none"` → titik data jadi elips; di ponsel chart terhimpit 33% |
| 9 | **Sedang** | UX | Tooltip chart tidak pernah hilang (tidak ada `onMouseLeave`) dan posisinya mati di pojok |
| 10 | **Sedang** | Konten | Label benchmark hardcode `/kg`; badge selalu "Di Atas HAP" walau acuannya HET |
| 11 | **Sedang** | Aksesibilitas | Chart tanpa nama aksesibel & tanpa jalur keyboard; `th` tanpa `scope`; tombol tanpa `aria-pressed` |
| 12 | **Sedang** | Ketahanan | Tidak ada empty/error state: `getLiveForecastDetails` null → spinner "Memuat…" abadi |
| 13 | **Sedang** | Tata kelola | Tidak ada timestamp kapan model dijalankan; yang tampil hanya tanggal observasi |
| 14 | **Rendah** | Logika | Label "Prakiraan Hari ke-{horizon}" bisa menampilkan H+5 saat horizon 14 bila baris forecast < horizon |
| 15 | **Rendah** | Logika | Label sumbu X & subjudul chart hardcode "14 hari" / "14 Hari Lalu", tidak dihitung dari panjang data |
| 16 | **Rendah** | Kode mati | `trendDirection`, `trendPercentage`, `minForecast`, `maxForecast`, `peakDay`, `peakPrice`, `getLiveForecast()`, `getLiveMultiCommodityTrends()` dihitung tapi tak pernah dipakai |
| 17 | **Rendah** | Konfigurasi | `next lint` rusak (impor `eslint-config-next/core-web-vitals` tanpa `.js`) → gerbang lint di `next build` selalu gagal |
| 18 | **Rendah** | Keamanan/Konfig | `web/src/lib/supabase.ts` (perubahan belum di-commit) menghapus guard null dan menaruh kunci publishable sebagai fallback hardcoded |

---

## Detail temuan

### 1. Kartu akurasi model hardcoded — Tinggi
`web/src/app/forecasting/page.tsx:503-516` mencetak literal `94,6%` (Rerata Akurasi), `Tingkat error rata-rata (WAPE): 5,36%`, dan `Interval Keyakinan: 80% - 95%`. Tidak ada satu pun yang berasal dari data; tidak berubah saat komoditas diganti (terverifikasi untuk cid 50, 39, 10, 2, 13, 16, 7).

Angka ini juga bertentangan dengan hasil eksperimen internal. `docs/eksperimen_summary_report.md` mencatat WAPE per komoditas: Beras 0,10%, Daging Ayam 2,00%, Telur 3,22%, Bawang Merah 6,97%, **Cabai Rawit 13,50%** — sedangkan 5,36% adalah rata-rata agregat seluruh komoditas. Menampilkan satu angka "94,6% akurasi" untuk cabai (WAPE 13,5%) adalah klaim yang tidak dapat dipertahankan, terutama untuk halaman yang menyasar TPID/pemerintah.

### 2. Rekomendasi kebijakan hardcoded — Tinggi
`page.tsx:909` mencetak untuk SEMUA komoditas: *"Rekomendasi Satgas: Cukup pemantauan pasokan rutin dari daerah sentra (Kediri/Malang). Belum memerlukan subsidi operasi pasar darurat."*

Terverifikasi identik untuk cid 50, 10, 2, dan 13. Padahal pada komoditas yang sama badge di atasnya menampilkan:
- cid 10 (Minyak Goreng Curah): badge `Di Atas HAP (+34.8%)`, badan kartu *"Harga saat ini berada Rp 5467 di atas HET Pemerintah (Rp 15.700/kg)"*, namun rekomendasi tetap "belum perlu operasi pasar".
- cid 2 (Beras Premium): badge `Di Atas HAP (+9.6%)` (Rp 1.433 di atas HET) dengan rekomendasi yang sama.

Juga `page.tsx:898` hardcode *"Tren ke depan terpantau stabil tanpa lonjakan ekstrem."* — dicetak untuk semua komoditas apa pun bentuk kurvanya. Dan `page.tsx:859` hardcode *"Hari Selasa s/d Kamis harga pasar umumnya lebih stabil dibanding akhir pekan"* (lihat temuan 3).

### 3. Klaim "Pola Siklus Mingguan" dibantah data sendiri — Tinggi
`page.tsx:1040` mengklaim hortikultura (cabai, bawang) dan daging ayam naik **2%–5% pada Jumat–Minggu**. Diuji dari 24 tanggal observasi di `fact_harga_pasar` (rata-rata per tanggal, perubahan harian per hari-dalam-minggu):

| Komoditas | Jumat | Sabtu | Minggu |
|---|---|---|---|
| Cabe Rawit (50) | −2,24% | +3,86% | −0,01% |
| Bawang Merah (39) | −1,78% | +0,64% | +1,19% |
| Daging Ayam (13) | −0,48% | −0,08% | 0,00% |

Rata-rata pergerakan hari Jumat justru **negatif** untuk ketiga komoditas yang diklaim. Sebaliknya, pergerakan rata-rata terbesar cabai terjadi hari **Selasa (+6,86%)** — persis hari yang direkomendasikan `page.tsx:859` sebagai "lebih stabil". Halaman memberi saran belanja yang berlawanan dengan datanya sendiri.

*(Catatan: n=4 per hari-dalam-minggu, jadi ini indikasi kuat, bukan bukti statistik final — tapi cukup untuk menyimpulkan klaim 2–5% tanpa sitasi tidak didukung.)*

### 4. Band prediksi lebar-nol — Tinggi
`fact_forecast` cid 2 (Beras Premium): **84/84 baris** masa depan punya `batas_bawah == batas_atas == harga_prediksi` (lebar 0 di semua 6 pasar, semua 14 hari). cid 13 (Daging Ayam): 28/84 lebar 0 (seluruh pasar 5-Keputran dan 146-Soponyono).

Di UI ini muncul sebagai `page.tsx:440`: **"Rentang Wajar: Rp 16.333 s/d Rp 16.333"**, di samping kartu yang mengklaim "Interval Keyakinan: 80% - 95%". Poligon area toleransi (`ciPolygonPoints`) kolaps jadi garis. Untuk pengguna awam, "rentang batas toleransi" yang lebarnya nol adalah kontradiksi, bukan informasi. (Sebagai perbandingan wajar, cid 16 Telur melebar 412 → 3.778 Rp sepanjang 14 hari.)

### 5. Prediksi datar tanpa disclosure model — Tinggi
Dari `fact_forecast`: cid 2 (Beras) dan cid 13 (Daging Ayam) delta = **+0,0% untuk ke-14 hari**, harga_prediksi persis sama dengan rata-rata hari ini (Rp 16.333 dan Rp 37.333). Ini adalah ramalan naive last-value, sesuai `docs/eksperimen_summary_report.md` (model terbaik Beras = "Naive Last Value" WAPE 0,10%; Daging Ayam = "Naive Last Value" WAPE 2,00%).

Halaman menampilkan hasil naive ini dengan bobot visual yang sama dengan model ML untuk cabai, tanpa menyebut model mana yang dipakai, tanpa catatan bahwa 2 dari 7 komoditas adalah konstanta, dan tetap mencetak "Tren ke depan terpantau stabil" serta "Rerata Akurasi 94,6%". Untuk halaman berlabel "Proyeksi Harga Pangan" yang menyasar evaluasi kebijakan, ketiadaan atribusi model adalah celah disclosure yang material.

### 6. Jendela render salah saat ganti komoditas — Sedang
`benchmarkMeta` (`page.tsx:74-76`) diturunkan langsung dari `selectedCommodity`, sedangkan `forecastData` datang asinkron (`useEffect` baris 42-56). Di antara keduanya, `isAboveBenchmark`/`deltaHapPercent` (`page.tsx:273-283`) menghitung harga komoditas LAMA terhadap benchmark komoditas BARU.

Terukur di render nyata, pergantian cid 50 → 2, sampel pada t+800 ms:
```
badge : "Di Atas HAP (+277%)"
badan : "Harga saat ini berada Rp 41267 di atas HET Beras Premium (Rp 14.900/kg)"
kartu HARGA : masih "Rp 56.167"   (harga cabai, milik komoditas sebelumnya)
```
Setelah ~2,5 dtk nilainya benar (`+9.6%`, Rp 1.433, Rp 16.333). Tidak ada penjaga loading pada kartu Pemkot/TPID, jadi klaim regulasi salah sempat terlihat pengguna. Sumber presisi: `page.tsx:281`.

### 7. `harga_imputasi` dipakai untuk label "riil/aktual" — Sedang
Seluruh angka (riwayat, rata-rata, tabel) bersumber dari kolom `harga_imputasi` (`dataService.ts:449`), sementara UI mencetak *"Riwayat Riil Pasar"* (`page.tsx:537`) dan *"Basis data aktual Siskaperbapo"* (`page.tsx:415`). `is_imputed` dan `harga_asli` tidak pernah dibaca di seluruh `web/src/`.

Dokumentasi proyek sendiri (`docs/archive/panduan_supabase_konsumen.md:64-76`) menyatakan: untuk statistik pakai `harga_imputasi`, **tetapi untuk menampilkan harga "asli" pasar pakai `harga_asli` dan hormati `is_imputed`**. Baris `harga_imputasi` berasal dari forward-fill sampai 7 hari (`docs/PRD_HargaWatch.md:100`), sehingga sebagian titik pada grafik yang dilabeli "riil" adalah nilai isian.

### 8. Distorsi SVG & kerusakan chart di ponsel — Sedang
`page.tsx:583` memakai `preserveAspectRatio="none"` dengan `viewBox="0 0 920 340"` (`page.tsx:138-139`). Terukur:

| Viewport | Skala X | Skala Y | Titik data (r=3.5) |
|---|---|---|---|
| 1440×1400 | 1,265 | 1,029 | 8,9 × 7,2 px (elips) |
| 390×844 | **0,333** | 0,882 | 2,3 × 6,2 px (elips 2,7:1) |

Di ponsel, plot 920 unit dipadatkan ke 306 px (33%) sementara tinggi tetap penuh — 14 hari riwayat + 14 hari proyeksi menumpuk jadi satu gumpalan, dan penanda data menyusut ke 2,3 px lebar. Tidak ada overflow horizontal halaman (`scrollWidth == clientWidth == 390`), jadi ini murni distorsi, bukan masalah layout halaman.

### 9. Tooltip chart tidak pernah hilang — Sedang
`page.tsx:674` dan `page.tsx:696` hanya memasang `onMouseEnter` pada lingkaran data; **tidak ada `onMouseLeave`** di mana pun di berkas (diverifikasi dengan grep). Terukur di browser: setelah `mouseover` lalu dispatch `mouseout`, tooltip masih tertampil (`stillVisible: true`).

Tooltip juga ditempatkan statis di `top-4 right-4` (`page.tsx:562`) sehingga tidak menempel pada titik yang di-hover. Akibatnya angka riwayat terakhir bisa tertinggal di layar dan terbaca seolah merujuk titik lain.

### 10. Label benchmark hardcode `/kg` & badge selalu "HAP" walau acuannya HET — Sedang
`page.tsx:738` mencetak `Garis {benchmarkLabel}: Rp {harga}/kg` — satuan `/kg` literal, tidak memakai `satuan` komoditas. Bandingkan `page.tsx:898` yang memakai `activeCommodityMeta.unit`. Artinya untuk komoditas bersatuan non-kg label akan salah. Saat ini pun sudah inkonsisten: `dim_komoditas` mencatat cid 10 (`Minyak Goreng Curah`) bersatuan **`kg`**, sedangkan HET Minyakita/Curah berlaku per liter — halaman tetap mencetak `/kg`.

Selain itu badge di `page.tsx:884` selalu berbunyi `Di Atas HAP (+x%)` meskipun `benchmarkMeta.label` untuk cid 10 = "HET Pemerintah" dan cid 2 = "HET Beras Premium". Terverifikasi di render: label grafik "HET Pemerintah: Rp 15.700/kg" sementara badge "Di Atas HAP (+34.8%)".

### 11. Aksesibilitas chart & kontrol — Sedang
Terverifikasi di DOM: `svg[viewBox]` tanpa `role`, `aria-label`, maupun elemen `<title>`; 0 dari 28 lingkaran data bisa difokus keyboard (`circle[tabindex]` = 0); tooltip bukan live region; `table th[scope]` = 0; `table caption` tidak ada; `#select-commodity` tanpa `aria-label`; tombol "7 Hari"/"14 Hari"/"Semua (H)"/"Waspada / Perhatian" tanpa `type="button"` dan tanpa `aria-pressed`. Artinya seluruh isi chart hanya dapat diakses lewat mouse — tabel memang memuat angka yang sama, tapi chart adalah satu-satunya tempat band toleransi divisualkan.

### 12. Tidak ada empty/error state — Sedang
`dataService.ts:485`: bila `fact_forecast` tidak punya baris masa depan, fungsi `return null`. Di halaman, `forecastData` null membuat:
- kartu metrik menampilkan `-` (`page.tsx:403`, `427`, `440`),
- kartu arah menampilkan `0%`/`Stabil` (`page.tsx:464`, 475-479),
- chart jatuh ke cabang else dan mencetak **"Memuat visualisasi proyeksi..." selamanya** (`page.tsx:810`).

Tidak ada pesan "data tidak tersedia", tidak ada tombol coba lagi, tidak ada pembeda antara "sedang memuat" dan "gagal/kosong". `loading` sudah `false` di kondisi ini, jadi teks "Memuat" itu bohong.

### 13. Tidak ada timestamp kapan model dijalankan — Sedang
`formattedLatestDate` (`dataService.ts:562`) adalah tanggal **observasi terakhir**, dan ditampilkan sebagai "Data per 17 Okt 2026". Query forecast (`dataService.ts:480-483`) hanya mengambil `tanggal, harga_prediksi, batas_bawah, batas_atas` — kolom waktu pembuatan prediksi tidak diambil meski ada di tabel. Pengguna tidak bisa membedakan "proyeksi ini dibuat tadi pagi" dari "proyeksi ini dibuat sebulan lalu untuk tanggal besok".

### 14. Label "Prakiraan Hari ke-{horizon}" bisa tidak cocok — Rendah
`page.tsx:78-82`: `targetHorizonRow` diambil dengan indeks `Math.min(horizon, forecast.length) - 1`. Bila `forecast.length < horizon` (mis. hanya 5 tanggal tersedia di DB), indeks = 4 → baris H+5, tetapi label kartu (`page.tsx:422`) tetap mencetak "PRAKIRAAN HARI KE-14" dan callout chart (`page.tsx:765`) mencetak "H+14". Saat audit DB punya 14 tanggal sehingga belum terpicu, tapi tidak ada penjaga.

### 15. Label rentang waktu hardcoded — Rendah
`page.tsx:529` mencetak literal "Menampilkan 14 hari data transaksi riil sebelumnya"; `page.tsx:219` dan `page.tsx:225` mencetak literal `"14 Hari Lalu"` dan `"7 Hari Lalu"`. Riwayat diambil dengan `.limit(90)` lalu `.slice(-14)` (`dataService.ts:453`, `463`), sehingga jumlah hari bergantung pada berapa baris pasar per tanggal; bila hasilnya kurang dari 14 hari, semua label tersebut berbohong dan `getX()` merenggangkan sumbu.

### 16. Kode mati — Rendah
Dihitung setiap fetch tetapi tidak dirender di mana pun: `trendDirection`, `trendPercentage`, `minForecast`, `maxForecast`, `peakDay`, `peakPrice` (`dataService.ts:558-582`). Juga tidak ada pemanggil untuk `getLiveForecast()` (`dataService.ts:590-593`) dan `getLiveMultiCommodityTrends()` (`dataService.ts:617`) di seluruh `web/src/`.

### 17. Gerbang lint rusak — Rendah
`next lint` dan tahap lint di dalam `next build` gagal: `eslint.config.mjs` mengimpor `eslint-config-next/core-web-vitals` sementara paket menyediakan `.../core-web-vitals.js`. Ini sudah ada sebelum audit (bukan akibat perubahan ini), tapi artinya tidak ada lint yang benar-benar berjalan di CI maupun di `next build`.

### 18. Guard Supabase dihapus + kunci fallback hardcoded — Rendah
`git diff web/src/lib/supabase.ts` (perubahan belum di-commit) mengubah `supabase` dari nullable menjadi selalu terbuat, dengan kunci publishable sebagai fallback literal. Dampak: seluruh `if (!supabase) return null;` di `dataService.ts` menjadi kode mati, sehingga konfigurasi env yang salah **tidak lagi gagal-tertutup** melainkan diam-diam menembak proyek Supabase yang di-hardcode. Kunci `sb_publishable_*` memang dirancang publik (aman dibocorkan), jadi risikonya bukan kebocoran rahasia melainkan penyalahgunaan proyek bila URL/key fallback tidak diinginkan.

---

## Verifikasi yang dijalankan (perintah reproduksi)

```bash
# 1. Typecheck & build
cd web && npx tsc -p tsconfig.json --noEmit
node node_modules/next/dist/bin/next build

# 2. Server untuk uji render (build produksi TIDAK bisa dipakai: halaman kena 404
#    karena .next/BUILD_ID hilang; pakai dev server untuk uji interaktif)
node node_modules/next/dist/bin/next dev -p 3111

# 3. Browser headless + CDP (browser_exec menolak URL 127.0.0.1)
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new \
  --remote-debugging-port=9222 --user-data-dir="$LOCALAPPDATA/Temp/hw-edge-audit" about:blank
# lalu kendalikan via DevTools WebSocket: /json/list → Page.navigate,
# Runtime.evaluate, Emulation.setDeviceMetricsOverride, Page.captureScreenshot

# 4. Probe DB read-only (7 komoditas, band, offset benchmark, pola harian)
node -e '...'   # skrip probe sementara, lihat angka di tabel-tabel laporan ini
```

Hasil mentah: dominan disimpan di `$LOCALAPPDATA/Temp/hw-audit/` (teks DOM `forecasting-default.txt`, JSON multi-komoditas, log server). Skrip probe bersifat sementara dan sudah dihapus dari repo.

## Luaran audit

- Tidak ada perubahan kode. Semua temuan di atas dapat diverifikasi ulang dengan perintah di bagian sebelumnya.
- Satu temuan di luar halaman ini (`#18`, `web/src/lib/supabase.ts`) berasal dari perubahan yang belum di-commit; laporan hanya menandai, tidak mengubah.

## Prioritas perbaikan yang disarankan

1. Ganti angka akurasi hardcoded dengan metrik per komoditas dari hasil backtest, atau hapus kartu itu (temuan 1).
2. Jadikan rekomendasi TPID & saran belanja turunan dari pelanggaran benchmark + bentuk kurva, bukan string statis (temuan 2, 3).
3. Perbaiki band lebar-nol di `fact_forecast` untuk cid 2 dan cid 13 sebelum UI menyebutnya "interval keyakinan" (temuan 4).
4. Tambahkan atribusi model + timestamp run di UI, minimal sebagai catatan kecil (temuan 5, 13).
5. Turunkan prioritas: state kosong/error (12), tooltip & distorsi SVG (8, 9), aksesibilitas (11).
