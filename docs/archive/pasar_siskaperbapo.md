Pasar Wonokromo confirmed in Kecamatan Wonokromo, Surabaya Selatan gate. Continuing with the rest.Confirmed: Keputran = Kecamatan Tegalsari. Now Pasar Pucang Anom and Pasar Soponyono.Confirmed Pucang Anom = Kelurahan Pucang Sewu, Kecamatan Gubeng. Now checking Pasar Soponyono.## Jawaban Langsung

Pilihan 6 pasar ini **jauh lebih kuat** daripada skema "1 pasar random per kecamatan" — 4 dari 6 pasar ini ternyata sudah menjadi **kios TPID (Tim Pengendali Inflasi Daerah)** resmi milik Pemkot Surabaya, artinya sudah rutin dipantau harganya oleh pemerintah untuk keperluan stabilisasi harga. Ini kabar bagus soal ketersediaan data. Tapi ada satu pasar (Keputran) yang secara fungsi **berbeda kelas** dari yang lain — perlu perlakuan analitis khusus.

## Analisis per Pasar

| Pasar | Kecamatan | Wilayah Surabaya | Yang Diwakili | Status Data |
|---|---|---|---|---|
| **Tambahrejo** | Simokerto | Pusat | Pasar kelas utama, serba-ada (sembako, daging, sayur, kebutuhan rumah tangga) — representasi pasar rakyat "generalis" padat penduduk | ✅ Kios TPID resmi |
| **Wonokromo** | Wonokromo | Selatan (gerbang selatan kota) | Salah satu pasar terbesar & paling ramai di Surabaya, satu kompleks dengan DTC — representasi pasar besar/hub ekonomi | ✅ Kios TPID resmi |
| **Genteng (Baru)** | Genteng | Pusat | Pasar tertua (1910), lantai 1 sembako/sayur/ikan, tapi identik dengan elektronik & oleh-oleh — representasi pasar campuran pusat kota dengan fungsi wisata | ✅ Kios TPID resmi |
| **Pucang Anom** | Gubeng | Tengah-Timur | Dikenal sebagai pasar buah + sembako, melayani kawasan permukiman kelas menengah Gubeng | ✅ Kios TPID resmi |
| **Keputran** | Tegalsari | Pusat | **Pasar INDUK/grosir sayur-mayur** — bukan pasar eceran biasa, ini titik distribusi grosir yang memasok pasar-pasar kecil se-Surabaya | ⚠️ Beda jenis data (grosir, bukan eceran) |
| **Soponyono** | Rungkut | Timur | Pasar tradisional besar di Surabaya Timur, cukup signifikan sampai pernah dikunjungi Presiden untuk cek harga & stok | Kemungkinan dipantau, tidak eksplisit masuk daftar TPID di atas |

## Analisis Lebih Dalam

**1. Kekuatan pilihan ini: representasi TPID**
Empat pasar (Tambahrejo, Wonokromo, Genteng, Pucang Anom) resmi disebut sebagai lokasi kios TPID tempat distribusi beras SPHP dan pemantauan harga bahan pokok oleh Dinkopdag. Ini artinya kemungkinan besar **inilah pasar-pasar yang datanya paling konsisten tersedia** di DKPP/panelharga, karena sudah jadi bagian dari program stabilisasi harga aktif pemerintah — bukan cuma pasar biasa yang kebetulan kamu pilih.

**2. Masalah: Keputran itu bukan "pasar eceran" seperti yang lain**
Ini poin krusial yang gampang terlewat. Keputran adalah **pasar induk/grosir** (kulakan), beroperasi malam hari (18.00–06.00), memasok pedagang kecil se-Surabaya. Kalau kamu treat Keputran sejajar dengan 5 pasar eceran lainnya di fitur "Best Price Finder" atau "bandingkan harga antar pasar", itu **membandingkan hal yang tidak sepadan** — harga grosir di Keputran secara alami lebih rendah dari harga eceran di pasar lain, bukan karena "lebih murah untuk konsumen", tapi karena beda titik rantai pasok.
   - Justru ini **peluang analitis yang bagus** kalau diposisikan dengan benar: harga Keputran bisa jadi **leading indicator** — kalau harga cabai naik di Keputran hari ini, harga eceran di 5 pasar lain kemungkinan menyusul naik dalam beberapa hari. Ini fitur canggih untuk Early Warning kamu, tapi butuh pemisahan label "grosir" vs "eceran" di skema datamu sejak awal, bukan digabung rata.

**3. Cakupan spasial: bagus di 3 dari 5 wilayah, kosong di 2**
- Pusat: Tambahrejo (Simokerto), Genteng (Genteng), Keputran (Tegalsari) — 3 pasar
- Selatan: Wonokromo — 1 pasar
- Timur: Pucang Anom (Gubeng), Soponyono (Rungkut) — 2 pasar
- **Utara dan Barat: 0 pasar** — ini gap nyata. Kalau proyek kamu klaim representasi seluruh kota, dua wilayah ini akan hilang sama sekali dari cerita kamu.

## Perspektif Alternatif

- **Kalau tujuanmu fokus ke pusat ekonomi kota** (bukan klaim representasi merata se-kota): 6 pasar ini sudah solid apa adanya — mereka mewakili pasar-pasar dengan volume transaksi & signifikansi ekonomi tertinggi, yang justru paling relevan untuk Early Warning skala kota.
- **Kalau kamu tetap mau klaim representasi spasial penuh**: tambahkan minimal 1 pasar di Surabaya Utara (misalnya Pasar Pabean di Pabean Cantian, terkenal ikan segar) dan 1 di Surabaya Barat, supaya kelima wilayah terwakili.
- **Kalau kamu mau desain paling jujur secara metodologis**: pisahkan 6 pasar ini jadi dua kelompok analitis — "5 pasar eceran" (Tambahrejo, Wonokromo, Genteng, Pucang Anom, Soponyono) untuk fitur konsumen (Best Price Finder, Shopping Basket), dan "Keputran sebagai indikator grosir/leading signal" untuk fitur forecasting & early warning saja.

## Ringkasan Praktis

1. **Pertahankan** 4 pasar TPID (Tambahrejo, Wonokromo, Genteng, Pucang Anom) sebagai inti — ini paling mungkin datanya konsisten karena sudah dipantau resmi.
2. **Pisahkan Keputran** secara eksplisit di skema database-mu dengan flag `tipe_pasar: grosir`, jangan campur dengan harga eceran di perbandingan konsumen.
3. **Putuskan sikap soal Utara/Barat**: tambah 1-2 pasar lagi untuk klaim representasi kota penuh, atau reframe proyekmu sebagai "pasar-pasar strategis kota" (lebih jujur dan tetap kuat).
4. Validasi langsung ke dkpp.surabaya.go.id/harga — cek apakah keenam nama pasar ini muncul persis di filter dropdown mereka, supaya kamu tahu pasti mana yang datanya benar-benar bisa ditarik.