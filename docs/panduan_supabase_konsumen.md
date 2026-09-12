# Panduan Supabase HargaWatch — untuk Konsumen Data

Dokumen ini untuk anggota tim yang ingin **membaca data HargaWatch dari database Supabase**
(dashboard, analisis, API, dll). Database sudah terisi penuh dan ter-update otomatis setiap hari.

---

## 1. Kredensial

Buat file `.env` di folder proyekmu berisi:

```
SUPABASE_URL=https://ylzcvgmkaciawvfhbxvn.supabase.co
SUPABASE_KEY=<minta key publishable ke Nicolaus / lihat chat>
```

> Kedua nilai ini ada di Supabase Dashboard → Project Settings → Data API (Project URL + publishable/anon key).
> **Jangan pernah** memakai/meminta `service_role` key — itu akses penuh tanpa batasan.

Install library:

```bash
pip install supabase python-dotenv
```

---

## 2. Skema Database

Semua tabel ada di schema `public`. Gambaran besar:

```
dim_pasar ──┐
dim_komoditas ──┼──< fact_harga_pasar >── dim_kalender
dim (produsen) ─┴──< fact_harga_produsen >
```

### dim_pasar (6 baris)
| Kolom | Keterangan |
|---|---|
| `pasar_id` | PK — 1 Tambahrejo, 2 Wonokromo, 3 Genteng, 4 Pucang Anom, 5 Keputran, 146 Soponyono |
| `nama_pasar`, `tipe_pasar` | nama & jenis pasar |
| `latitude`, `longitude` | koordinat (untuk peta) |

### dim_komoditas (37 baris)
| Kolom | Keterangan |
|---|---|
| `komoditas_id` | PK (mis. 2 = Beras Premium, 16 = Telur Ayam Ras) |
| `nama_komoditas`, `grup`, `satuan` | nama, kelompok (BERAS/CABE/…), satuan (kg/ekor/…) |

### dim_kalender (±2.440 baris, 2020–2026)
| Kolom | Keterangan |
|---|---|
| `tanggal` | PK (DATE) |
| `hari_nama`, `is_weekend` | Senin–Minggu, flag Sabtu/Minggu |
| `is_libur_nasional`, `nama_libur` | libur nasional & cuti bersama |
| `is_ramadan`, `is_pra_ramadan` | periode Ramadan & 14 hari sebelumnya |

### fact_harga_pasar (±477 ribu baris) ⭐ tabel utama
| Kolom | Keterangan |
|---|---|
| `tanggal` + `pasar_id` + `komoditas_id` | **PK gabungan** — 1 harga per pasar×komoditas×hari |
| `harga_asli` | harga murni hasil pencatatan; **NULL** bila hari itu tidak ada entri |
| `harga_imputasi` | harga kontinu untuk grafik/model (gap ≤3 hari diisi ffill, rupiah bulat) — **NOT NULL** |
| `is_imputed` | TRUE = nilai `harga_imputasi` itu hasil estimasi, bukan data lapangan |

### fact_harga_produsen (±4.900 baris)
Harga di tingkat produsen/supplier: `tanggal, komoditas, titik_pantau, kabupaten, satuan, harga_asli, harga_imputasi, is_imputed`.
Titik pantau Surabaya: **PS Bendul Mrisi** (Beras) & **RPH Pegirikan** (Daging Sapi).

---

## 3. Aturan Emas Saat Query

1. **Selalu filter `tanggal`** — `fact_harga_pasar` berisi 477 ribu baris. Query tanpa filter akan lambat/di-throttle.
2. **Untuk statistik/analitik** pakai `harga_imputasi`; **untuk menampilkan harga "asli" pasar** pakai `harga_asli` (bisa NULL) dan hormati `is_imputed`.
3. `harga` dalam **rupiah bulat** (integer), satuan mengikuti `dim_komoditas.satuan`.

---

## 4. Contoh Kode (Python)

```python
import os
from flask import Flask
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY"),
)

# ── Harga terakhir semua komoditas di satu tanggal (join otomatis via FK) ──
def harga_hari(tanggal="2026-09-03"):
    r = (supabase.table("fact_harga_pasar")
         .select("tanggal, harga_asli, harga_imputasi, is_imputed, "
                 "dim_pasar(nama_pasar), dim_komoditas(nama_komoditas, satuan, grup)")
         .eq("tanggal", tanggal)
         .execute())
    return r.data

# ── Perbandingan antar pasar utk 1 komoditas (Best Price Finder) ──
def bandingkan_pasar(komoditas_id=2, tanggal="2026-09-03"):
    r = (supabase.table("fact_harga_pasar")
         .select("harga_imputasi, dim_pasar(nama_pasar)")
         .eq("tanggal", tanggal).eq("komoditas_id", komoditas_id)
         .order("harga_imputasi")
         .execute())
    return r.data   # urut dari termurah

# ── Tren 30 hari satu komoditas di satu pasar ──
def tren(komoditas_id=2, pasar_id=1, hari=30):
    r = (supabase.table("fact_harga_pasar")
         .select("tanggal, harga_asli, harga_imputasi")
         .eq("komoditas_id", komoditas_id).eq("pasar_id", pasar_id)
         .gte("tanggal", "2026-08-05").lte("tanggal", "2026-09-03")
         .order("tanggal")
         .execute())
    return r.data
```

Cara cepat tanpa Flask (skrip biasa):

```python
data = harga_hari()
for d in data[:10]:
    print(d["tanggal"], d["dim_komoditas"]["nama_komoditas"],
          d["dim_pasar"]["nama_pasar"], d["harga_imputasi"])
```

---

## 5. Akses Alternatif (tanpa Python)

**REST API langsung** (mudah untuk frontend/JS):

```
GET https://ylzcvgmkaciawvfhbxvn.supabase.co/rest/v1/fact_harga_pasar
    ?tanggal=eq.2026-09-03
    &select=tanggal,harga_imputasi,dim_pasar(nama_pasar),dim_komoditas(nama_komoditas)
Headers:
    apikey: <SUPABASE_KEY>
    Authorization: Bearer <SUPABASE_KEY>
```

**Table Editor** — buka Supabase Dashboard → Table Editor → pilih tabel (visual, tanpa kode).

**SQL Editor** di dashboard untuk analisis cepat:

```sql
SELECT k.nama_komoditas, p.nama_pasar, f.harga_imputasi
FROM fact_harga_pasar f
JOIN dim_komoditas k USING (komoditas_id)
JOIN dim_pasar p USING (pasar_id)
WHERE f.tanggal = '2026-09-03'
ORDER BY k.nama_komoditas, p.nama_pasar;
```

---

## 6. Update Otomatis

Data di-refresh **otomatis setiap hari** (target: tanggal kemarin, terisi pagi).
Baris untuk hari berjalan biasanya belum ada sampai malam — selalu query sampai **kemarin**.
Indikator masalah: tanggal kemarin tidak punya baris sama sekali → pipeline sedang bermasalah, hubungi pengelola.

## 7. Hal yang TIDAK Boleh

- ❌ INSERT/UPDATE/DELETE dari sisi klien — kalian hanya butuh **baca**
- ❌ Share `service_role` key ke siapa pun
- ❌ Query tanpa filter tanggal pada fact table (loop semua baris)
- ❌ Upload data ini ke repo publik lain tanpa izin

Pertanyaan/temuan data aneh? Laporkan ke pengelola database (Nicolaus).
