# Evaluasi Final Arsitektur Proyek: HargaWatch Surabaya

Evaluasi final ini disusun dengan melakukan audit menyeluruh terhadap kode, dokumen, dan hierarki folder. Parameter yang digunakan mengacu pada *Best Practices* standar industri untuk proyek gabungan antara *Software Engineering (Next.js)* dan *MLOps / Data Science (Python)*.

### Referensi & Kriteria Standar Industri
1. **Cookiecutter Data Science (CCDS):** Standar *de facto* untuk mengorganisasi proyek Data Science (pemisahan jelas antara `data/raw`, `data/processed`, `notebooks/`, dan `src/`).
2. **MLOps Separation of Concerns:** Memisahkan secara tegas kode modular (inti) dengan file eksekusi (*scripts/runners*).
3. **AI Context Engineering (Harness):** Menyederhanakan struktur folder agar AI *Agent* tidak kewalahan membaca *noise* (file yang tidak relevan).

---

## 1. Struktur Aktual Proyek Saat Ini

```text
hargawatch-surabaya/
├── PROJECT_RULES.md, ROADMAP.md, README.md, requirements.txt
├── data/ (raw, processed, external)
├── docs/ (archive, stitch, ARCHITECTURE.md, PRD_HargaWatch.md)
├── notebook/ (eda_pasar.ipynb, forecasting_experiments.ipynb, dll)
├── tests/ (conftest.py, test_ml_models.py, test_alerting.py, dll)
├── scripts/
│   ├── ml/ (features.py, models.py, early_warning.py)
│   ├── download_cuaca.py, download_inflasi_bps.py, scrape_data.py
│   ├── ingest_supabase.py, preprocessing_final.py
│   ├── run_forecasting.py, run_wandb_experiment.py
│   ├── setup_ml_tables.py, utils_alerting.py, update_harian.py
│   └── (skrip-skrip lainnya...)
└── web/
    ├── src/
    │   ├── app/ (early-warning, forecasting, peta)
    │   ├── components/ (CommodityCard, SmartShoppingBasket, dll)
    │   ├── data/ (mockData.ts)
    │   └── lib/ (supabase.ts)
    └── tests/ (comprehensive_test.js, dll)
```

---

## 2. Hasil Evaluasi Kritis (Final)

Secara keseluruhan, proyek ini berada di level **Sangat Maju (B+)** untuk ukuran tugas kuliah. Implementasi *unit testing* (`tests/`) dan komponen modular React (`web/src/`) sudah sangat mumpuni. Namun, ada beberapa **kelemahan fatal di layer Backend/Python** yang melanggar *best practice* murni:

### 🔴 Temuan 1: Penggunaan Nama Folder `scripts/` Menyalahi Konvensi
*   **Masalah:** Seluruh inti kecerdasan aplikasi (seperti modul `ml/models.py` dan algoritma *preprocessing*) disimpan di dalam folder bernama `scripts/`.
*   **Mengapa Ini Buruk:** Di dalam Python/Data Science, folder `scripts/` (atau `bin/`) dirancang HANYA untuk menampung file eksekusi pendek (*runner* atau *cron trigger* seperti `run_pipeline.sh`). Menaruh modul logika di dalam `scripts/` akan menyulitkan proses *importing* (`from scripts.ml.models import...` adalah *anti-pattern* Python).
*   **Rekomendasi (CCDS):** Pisahkan antara "Alat" dan "Tombol".
    *   Buat folder **`src/`** untuk menyimpan semua modul logika (misal: `src/ml/`, `src/etl/`, `src/db/`).
    *   Pertahankan folder **`scripts/`** namun bersihkan isinya agar HANYA berisi *file runner/trigger* (misal: `scripts/run_forecasting.py`, `scripts/update_harian.py`).

### 🔴 Temuan 2: *Dependency Hell* (Konflik Ketergantungan Ekosistem)
*   **Masalah:** Hanya ada satu file `requirements.txt` di root yang mencampur kebutuhan *scraper* ringan (`requests`, `beautifulsoup4`) dengan *library* raksasa ML (`lightgbm`, `scikit-learn`).
*   **Mengapa Ini Buruk:** Praktik MLOps mewajibkan *environment* yang terisolasi. Jika sistem *scraper* di-deploy secara mandiri di cloud/VPS kecil, server tersebut akan tercekik karena dipaksa mendownload dependensi ML bergiga-giga yang tidak terpakai.
*   **Rekomendasi:** Pecah menjadi dua file: `requirements-etl.txt` (khusus scraping) dan `requirements-ml.txt` (khusus forecasting).

### 🟡 Temuan 3: Duplikasi Logika Eksperimen vs Produksi
*   **Masalah:** Ditemukan duplikasi nama file antara `notebook/preprocessing_final.ipynb` dan `scripts/preprocessing_final.py`.
*   **Mengapa Ini Buruk:** Melanggar prinsip *Single Source of Truth*. AI (atau kolega manusia) bisa bingung membedakan file mana yang merupakan eksperimen usang dan mana file produksi berjalan.
*   **Rekomendasi:** Jadikan *notebook* murni sebagai alat eksperimen sekali pakai. Beri nomor/tanda pada *notebook* lama (misal: `01_archive_preprocessing.ipynb`).

### 🟡 Temuan 4: Duplikasi Area *Data Storage* (Risiko Pathing AI)
*   **Masalah:** Terdapat folder `notebook/data/` yang terbentuk secara redundan, berdampingan dengan folder utama `data/` di root.
*   **Mengapa Ini Buruk:** AI sering kali membuat *bug* akibat salah menentukan *Relative Path* penyimpanan file (`../data/` vs `./data/`).
*   **Rekomendasi:** Hapus `notebook/data/` secara permanen. Pastikan semua *notebook* di-hardcode agar mengarah ke root absolut `../data/`. Masukkan `notebook/data/` ke dalam file `.gitignore`.

### 🟢 Temuan 5: Ekosistem Frontend (`web/`) Sempurna
*   **Analisis:** Pemisahan struktur folder di dalam Next.js (`src/app`, `src/components`, `src/lib`, `src/data`) adalah implementasi arsitektur **Feature-Sliced/Modular** yang 100% sempurna dan *best practice*. Tidak perlu diubah.

---

## 3. Rekomendasi Restrukturisasi (Target: Level A / Enterprise-Grade)

Jika perbaikan ini dieksekusi, proyek akan bertransformasi menjadi arsitektur mutakhir:

```text
hargawatch-surabaya/
├── src/                <-- NEW: Semua logic murni pindah kesini
│   ├── etl/            (scrape_data.py, preprocessing_final.py)
│   ├── ml/             (features.py, models.py, early_warning.py)
│   ├── db/             (setup_ml_tables.py, ingest_supabase.py)
│   └── utils/          (utils_alerting.py)
├── scripts/            <-- REVISED: Hanya berisi file eksekusi
│   ├── run_pipeline.sh
│   ├── run_forecasting.py
│   └── update_harian.py
├── requirements-etl.txt  <-- NEW
├── requirements-ml.txt   <-- NEW
└── web/                <-- TETAP
```
