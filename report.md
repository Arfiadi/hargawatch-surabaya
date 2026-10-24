# Laporan Audit Realtime HargaWatch

Tanggal: 2026-10-12
Branch aktual: feat/uiux-optimization (bukan development)
Metode: 4 verifier paralel read-only (frontend, pipeline, infra, klaim-vs-realita), semua temuan dicek ulang via rg langsung di repo.
Kesimpulan: BELUM realtime. Pola aktual = fetch-on-load sekali + fallback statis + batch harian T-1 jam 07:00 di laptop lokal.

## Ringkasan verdict

| Subsistem | Hasil |
|---|---|
| Frontend (7 klaim) | Semua SEBAGIAN — getLive* ada tapi tanpa refresh, fallback diam-diam |
| Infra realtime | TIDAK ADA — nol channel/subscribe, nol polling/SWR, nol revalidate |
| Pipeline | Batch harian OTOMATIS (bukan realtime), jam 07:00 bukan 06:00, target T-1 |
| Klaim vs realita (14 klaim) | 1 TERBUKTI, 6 SEBAGIAN, 7 TIDAK TERBUKTI |

## Frontend: SEBAGIAN semua

Fungsi live ada, dipanggil sekali saat mount atau ganti seleksi:

- web/src/lib/dataService.ts:122 getLiveStabilitySummary
- web/src/lib/dataService.ts:185 getLiveCommodities
- web/src/lib/dataService.ts:274 getLiveEarlyWarning
- web/src/lib/dataService.ts:391 getLiveForecastDetails
- web/src/lib/dataService.ts:559 getLiveForecast
- web/src/lib/dataService.ts:586 getLiveMultiCommodityTrends
- web/src/lib/dataService.ts:676 getLiveMarketComparison
- web/src/lib/dataService.ts:750 getLiveMarketLocations
- web/src/lib/dataService.ts:823 getLiveShoppingBasket

Fallback statis yang masih dipakai diam-diam:

- web/src/app/page.tsx:20 DEFAULT_COMMODITIES, dipakai :166
- web/src/app/page.tsx:167 isLive dideklarasi, :205 set true, nol render di JSX
- web/src/app/page.tsx:1149 fallbackSeries, :1186 seriesToRender pakai fallback
- web/src/app/peta/page.tsx:38 DEFAULT_COMPARISON_ROWS, dipakai :189
- web/src/app/forecasting/page.tsx:297,410 fallback "10 Okt 2026"

## Infra: TIDAK ADA

- Supabase client ADA — web/src/lib/supabase.ts:1
- channel/subscribe/postgres_changes di web/src: nol hit (hanya dep transitif di package-lock)
- setInterval/useSWR/refreshInterval/router.refresh: nol hit
- revalidate/dynamic/no-store/Cache-Control: nol hit; next.config.ts kosong; tanpa app/api
- Sinkron Ulang SEBAGIAN — tombol ada early-warning/page.tsx:796, onClick cuma toast :794 tanpa refetch
- Live badge TIDAK ADA — isLive mati

## Pipeline: batch harian, bukan realtime

- Scheduler aktif jam 07:00 + AtLogOn — scripts/setup_task_scheduler.ps1:20,:33 (klaim 06:00 hanya di docs)
- Target data = kemarin T-1 — scripts/update_harian.py:118-119
- Scraper Siskaperbapo ADA — src/pipeline/scrape_data.py:3,:27
- SP2KP: nol integrasi kode, hanya toast UI + docs blueprint
- Forecast 14 hari OTOMATIS — scripts/run_forecasting.py:300
- EWS OTOMATIS batch harian — scripts/run_daily_pipeline.py:4-6
- Log 2026-10-12 SUKSES, EWS 2026-10-11 42 record NORMAL
- .github/workflows tidak ada; dua orkestrator paralel (run_pipeline.bat vs update_catchup_task.cmd) rawan divergen

## Klaim vs realita

| # | Klaim | Lokasi | Verdict |
|---|---|---|---|
| 1 | Data diperbarui setiap pagi dari Siskaperbapo | early-warning/page.tsx:353 | SEBAGIAN (aslinya T-1 jam 07:00, butuh laptop nyala) |
| 2 | Sinkronisasi SP2KP berhasil + Sinkron Ulang | early-warning/page.tsx:794,796 | TIDAK TERBUKTI (toast tanpa fetch) |
| 3 | Disposisi otomatis ke Kabid | early-warning/page.tsx:888 | TIDAK TERBUKTI (span statis) |
| 4 | Disposisi Kadis disahkan | early-warning/page.tsx:1072 | TIDAK TERBUKTI (toast lokal) |
| 5 | Rilis Resmi 06.00 WIB | forecasting/page.tsx:295-297 | TIDAK TERBUKTI (scheduler 07:00, fallback hardcode) |
| 6 | Basis data aktual Siskaperbapo | forecasting/page.tsx:415 | SEBAGIAN (tanggal terbaru DB, bisa kemarin) |
| 7 | Pantauan 6 Pasar Resmi Terkini | page.tsx:177 | SEBAGIAN (isLive tak dirender) |
| 8 | Data agregasi riil 6 pasar | page.tsx:1447 | SEBAGIAN (pakai harga_imputasi ffill) |
| 9 | Pantauan spasial + terintegrasi basis harian | peta/page.tsx:386,797 | SEBAGIAN (default tampil sebelum live, tanpa tanggal) |
| 10 | Live API Updated 10 Menit Lalu | docs/stitch/PROJECT_OVERVIEW.md:31,233 | TIDAK TERBUKTI (blueprint, bukan produksi) |
| 11 | Real-time pipeline SP2KP | design.md:34 | TIDAK TERBUKTI |
| 12 | Update harian otomatis survei lapangan | PRODUCT.md:22 | SEBAGIAN (aslinya scraping web) |
| 13 | Footer basis data harian 6 pasar | Footer.tsx:17 | TERBUKTI |
| 14 | Ekspor Matrix XLSX + Ubah Parameter | early-warning/page.tsx:787,1079 | TIDAK TERBUKTI (alert mock) |

## Perintah re-verifikasi

Jalankan dari root repo:

```
git branch --show-current
rg -n "getLive" web/src/lib/dataService.ts
rg -n "DEFAULT_COMMODITIES|DEFAULT_COMPARISON_ROWS|fallbackSeries|isLive|setIsLive" web/src
rg -n "channel\(|\.subscribe|postgres_changes|setInterval|useSWR|revalidate" web/src || echo NONE
rg -n "07:00|StartWhenAvailable" scripts/setup_task_scheduler.ps1
rg -n "BASE_URL|tabel.nodesign" src/pipeline/scrape_data.py
rg -n "SP2KP|Sinkron Ulang|Disposisi otomatis|Disposisi Kepala Dinas|Rilis Resmi|alert\(" web/src/app/early-warning/page.tsx web/src/app/forecasting/page.tsx
tail -5 logs/catchup_2026-10-12.log
ls .github/workflows
```

## Checklist perbaikan

- [ ] Ganti copy "06.00 / Rilis Resmi / Hari Ini / Terkini" dengan "Data per {tanggal DB}"
- [ ] Sinkron Ulang lakukan refetch nyata + tampilkan timestamp terakhir
- [ ] Render isLive / status Terputus; bedakan visual fallback vs live
- [ ] Hapus klaim SP2KP / disposisi otomatis / Ekspor XLSX mock, atau implementasi beneran
- [ ] Tambah polling 60s / SWR / Supabase channel bila klaim realtime dipertahankan
- [ ] Selaraskan jam scheduler 06:00 vs 07:00; dokumentasikan T-1 + ketergantungan laptop nyala
- [ ] Tandai docs Stitch/design sebagai blueprint, bukan status produksi
