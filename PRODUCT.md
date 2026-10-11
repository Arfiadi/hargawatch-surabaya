# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
1. **Masyarakat Umum & Konsumen Rumah Tangga Surabaya**: mencari harga bahan pokok termurah di 6 pasar utama untuk menghemat belanja harian.
2. **Pelaku Usaha Mikro & UMKM Kuliner**: merencanakan kulakan bahan baku, membandingkan harga pasar induk (Keputran) vs pasar eceran konsumen, mengamankan margin usaha.
3. **Tim Analis Pemkot Surabaya, TPID, & Satgas Pangan**: memantau disparitas spasial, mendeteksi sinyal anomali lonjakan harga (EWS), dan mengevaluasi intervensi operasi pasar murah.

## Product Purpose
Platform Intelijen Harga Pangan dan Sistem Peringatan Dini (Early Warning System) Kota Surabaya yang menyajikan harga harian transparan di 6 pasar induk & strategis (Keputran, Wonokromo, Genteng, Pucang Anom, Tambahrejo, Soponyono), proyeksi harga 14 hari ke depan dengan model peramalan deret waktu, dan deteksi dini lonjakan harga berbasis data riil.

## Positioning
Satu-satunya platform intelijen pangan Kota Surabaya yang memadukan data riil harga 6 pasar acuan (SISKAPERBAPO), deteksi dini multikriteria 4 pilar (tren 7 hari, volatilitas pasar, disparitas grosir-eceran, dan proyeksi model peramalan), serta kalkulator perbandingan keranjang belanja keluarga.

## Operating Context
- Web application responsive untuk perangkat mobile (konsumen di pasar) dan desktop cockpit (analis pemkot).
- Update data harian otomatis dari survei lapangan pasar resmi Jawa Timur & Kota Surabaya.

## Capabilities and Constraints
- **Dashboard Publik**: Best Price Finder, Smart Shopping Basket, dan perbandingan harga harian.
- **Peta & Disparitas Pasar**: Visualisasi spasial disparitas harga 6 pasar acuan Kota Surabaya.
- **Early Warning System**: Deteksi anomali harga dan alur rekomendasi operasi pasar murah.
- **Forecasting & Analisis Musiman**: Proyeksi harga 14 hari dengan interval kepercayaan p10/p50/p90.
- **Stack**: Next.js (App Router), TypeScript, Tailwind CSS, Supabase PostgreSQL.

## Brand Commitments
- **Nama**: HargaWatch Surabaya (Surabaya Food Intel)
- **Warna Utama**: Hijau Hutan Pangan (`#004328`), Container Hijau (`#0d5c3a`), Canvas (`#F8FAFC`)
- **Tipografi**: Plus Jakarta Sans (Headlines & Body), JetBrains Mono (Metrik angka & harga)
- **Tone**: Jelas, akurat, berwibawa, bebas dari jargon AI generik ("AI-slop").

## Evidence on Hand
- Riwayat harga pangan 6 pasar Surabaya kontinu sejak 2020 di Supabase (`fact_harga_pasar`).
- Hasil prediksi model time-series di `fact_forecast`.
- Skor Early Warning di `fact_early_warning`.
- Master dimensi pasar dan komoditas di `dim_pasar` dan `dim_komoditas`.

## Product Principles
1. **Kebenaran Data di Atas Asumsi**: Setiap angka harga berasal dari pencatatan resmi pasar.
2. **Tindakan Nyata bagi Warga**: Rekomendasi pasar termurah harus riil dan menghemat biaya belanja harian.
3. **Transparansi Risiko**: Tingkat ketidakpastian proyeksi dan disparitas antar pasar disajikan secara terbuka.
