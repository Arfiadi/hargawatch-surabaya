"""Ingestion HargaWatch ke Supabase (PostgreSQL).

Alur:
  1. Baca kredensial dari .env
  2. Buat tabel sesuai DDL (panduan_persiapan_database_hargawatch.md §4B)
  3. Muat 5 file dari data/processed/ (dim dulu, lalu fact)
  4. Verifikasi jumlah baris + integritas

Pemakaian:
  python ingest_supabase.py              # buat tabel (if not exists) + muat data
  python ingest_supabase.py --drop       # drop semua tabel dulu (HATI-HATI)
  python ingest_supabase.py --verify     # hanya verifikasi, tanpa muat
"""

import argparse
import os
import sys
import time
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED = BASE_DIR / "data" / "processed"

DDL = """
CREATE TABLE IF NOT EXISTS dim_pasar (
    pasar_id       INTEGER PRIMARY KEY,
    nama_pasar     VARCHAR(100) NOT NULL,
    tipe_pasar     VARCHAR(30)  NOT NULL,
    latitude       DECIMAL(9, 6),
    longitude      DECIMAL(9, 6),
    sumber_koordinat VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS dim_komoditas (
    komoditas_id  INTEGER PRIMARY KEY,
    nama_komoditas VARCHAR(100) NOT NULL,
    grup           VARCHAR(50) NOT NULL,
    satuan         VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS dim_kalender (
    tanggal           DATE PRIMARY KEY,
    tahun             INTEGER NOT NULL,
    bulan             INTEGER NOT NULL,
    hari_nama         VARCHAR(15) NOT NULL,
    is_weekend        INTEGER NOT NULL,
    is_libur_nasional INTEGER NOT NULL,
    nama_libur        VARCHAR(100),
    is_ramadan        INTEGER NOT NULL,
    is_pra_ramadan    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS fact_harga_pasar (
    tanggal        DATE NOT NULL REFERENCES dim_kalender(tanggal),
    pasar_id       INTEGER NOT NULL REFERENCES dim_pasar(pasar_id),
    komoditas_id   INTEGER NOT NULL REFERENCES dim_komoditas(komoditas_id),
    harga_asli     NUMERIC(12, 2),
    harga_imputasi NUMERIC(12, 2) NOT NULL,
    is_imputed     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tanggal, pasar_id, komoditas_id)
);

CREATE TABLE IF NOT EXISTS fact_harga_produsen (
    tanggal        DATE NOT NULL REFERENCES dim_kalender(tanggal),
    komoditas      VARCHAR(50) NOT NULL,
    titik_pantau   VARCHAR(100) NOT NULL,
    kabupaten      VARCHAR(50) NOT NULL,
    satuan         VARCHAR(30) NOT NULL,
    harga_asli     NUMERIC(12, 2),
    harga_imputasi NUMERIC(12, 2) NOT NULL,
    is_imputed     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tanggal, komoditas, titik_pantau)
);

CREATE TABLE IF NOT EXISTS fact_cuaca (
    tanggal            DATE PRIMARY KEY REFERENCES dim_kalender(tanggal),
    curah_hujan_mm     NUMERIC(8, 2),
    jam_hujan          NUMERIC(6, 1),
    hari_hujan         INTEGER,
    suhu_mean_c        NUMERIC(5, 2),
    suhu_max_c         NUMERIC(5, 2),
    suhu_min_c         NUMERIC(5, 2),
    kelembapan_mean_pct NUMERIC(5, 2),
    angin_max_kmh      NUMERIC(5, 2)
);

CREATE TABLE IF NOT EXISTS fact_inflasi (
    tahun       INTEGER NOT NULL,
    bulan       INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    inflasi_pct NUMERIC(6, 2),
    PRIMARY KEY (tahun, bulan)
);

-- Indeks performa analitik & dashboard
CREATE INDEX IF NOT EXISTS idx_fact_harga_pasar_komoditas ON fact_harga_pasar (komoditas_id, pasar_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_fact_harga_pasar_tanggal ON fact_harga_pasar (tanggal);
CREATE INDEX IF NOT EXISTS idx_fact_harga_produsen_komoditas ON fact_harga_produsen (komoditas, titik_pantau, tanggal);

-- Row Level Security (RLS) & Public Read-Only Policies
ALTER TABLE dim_pasar ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_komoditas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_kalender ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_harga_pasar ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_harga_produsen ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_cuaca ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_inflasi ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_pasar' AND policyname = 'Public read-only dim_pasar') THEN
        CREATE POLICY "Public read-only dim_pasar" ON dim_pasar FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_komoditas' AND policyname = 'Public read-only dim_komoditas') THEN
        CREATE POLICY "Public read-only dim_komoditas" ON dim_komoditas FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_kalender' AND policyname = 'Public read-only dim_kalender') THEN
        CREATE POLICY "Public read-only dim_kalender" ON dim_kalender FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fact_harga_pasar' AND policyname = 'Public read-only fact_harga_pasar') THEN
        CREATE POLICY "Public read-only fact_harga_pasar" ON fact_harga_pasar FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fact_harga_produsen' AND policyname = 'Public read-only fact_harga_produsen') THEN
        CREATE POLICY "Public read-only fact_harga_produsen" ON fact_harga_produsen FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fact_cuaca' AND policyname = 'Public read-only fact_cuaca') THEN
        CREATE POLICY "Public read-only fact_cuaca" ON fact_cuaca FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fact_inflasi' AND policyname = 'Public read-only fact_inflasi') THEN
        CREATE POLICY "Public read-only fact_inflasi" ON fact_inflasi FOR SELECT TO anon, authenticated USING (true);
    END IF;
END $$;
"""

# (file csv, nama tabel) - urutan dim dulu karena fact punya FK
TABEL = [
    ("dim_pasar.csv", "dim_pasar"),
    ("dim_komoditas.csv", "dim_komoditas"),
    ("dim_kalender.csv", "dim_kalender"),
    ("fact_harga_pasar.csv", "fact_harga_pasar"),
    ("fact_harga_produsen.csv", "fact_harga_produsen"),
    ("fact_cuaca.csv", "fact_cuaca"),
    ("fact_inflasi.csv", "fact_inflasi"),
]

KOLOM = {
    "dim_pasar": ["pasar_id", "nama_pasar", "tipe_pasar", "latitude", "longitude", "sumber_koordinat"],
    "dim_komoditas": ["komoditas_id", "nama_komoditas", "grup", "satuan"],
    "dim_kalender": ["tanggal", "tahun", "bulan", "hari_nama", "is_weekend",
                     "is_libur_nasional", "nama_libur", "is_ramadan", "is_pra_ramadan"],
    "fact_harga_pasar": ["tanggal", "pasar_id", "komoditas_id", "harga_asli",
                         "harga_imputasi", "is_imputed"],
    "fact_harga_produsen": ["tanggal", "komoditas", "titik_pantau", "kabupaten",
                            "satuan", "harga_asli", "harga_imputasi", "is_imputed"],
    "fact_cuaca": ["tanggal", "curah_hujan_mm", "jam_hujan", "hari_hujan",
                   "suhu_mean_c", "suhu_max_c", "suhu_min_c",
                   "kelembapan_mean_pct", "angin_max_kmh"],
    "fact_inflasi": ["tahun", "bulan", "inflasi_pct"],
}


def koneksi(retry=3):
    load_dotenv(BASE_DIR / ".env")
    host = os.getenv("SUPABASE_HOST")
    if not host:
        raise SystemExit("Kredensial belum ada. Buat file .env (lihat .env.example) "
                         "lalu isi SUPABASE_HOST/PORT/DB/USER/PASSWORD.")
    port_utama = os.getenv("SUPABASE_PORT", "6543")
    # Fallback: kalau port utama (6543 transaction pooler) macet, coba 5432 (session pooler)
    kandidat_port = [port_utama] + (["5432"] if port_utama != "5432" else [])

    param_dasar = dict(
        host=host, dbname=os.getenv("SUPABASE_DB", "postgres"),
        user=os.getenv("SUPABASE_USER"), password=os.getenv("SUPABASE_PASSWORD"),
        sslmode="require", connect_timeout=30,
    )
    last_err = None
    for port in kandidat_port:
        for percobaan in range(1, retry + 1):
            try:
                return psycopg2.connect(**{**param_dasar, "port": port})
            except psycopg2.OperationalError as e:
                last_err = e
                print(f"  [!] koneksi gagal (port {port}, percobaan {percobaan}/{retry}): {e}")
                if percobaan < retry:
                    time.sleep(5 * percobaan)
    # last_err selalu terisi di sini: OperationalError ter-catch di setiap iterasi
    # (exception tipe lain dilempar langsung, bukan di-telan loop).
    assert last_err is not None
    raise last_err


def bersihkan(df, tabel):
    """Sesuaikan kolom & tipe CSV -> skema tabel."""
    rename = {"lat": "latitude", "lon": "longitude", "sumber": "sumber_koordinat"}
    if tabel == "dim_komoditas":
        # CSV memakai 'komoditas', DDL dim_komoditas memakai 'nama_komoditas'
        rename["komoditas"] = "nama_komoditas"
    df = df.rename(columns=rename).copy()
    df = df[[c for c in KOLOM[tabel] if c in df.columns]]

    for c in ("tanggal",):
        if c in df.columns:
            df[c] = pd.to_datetime(df[c]).dt.date
    if "is_imputed" in df.columns:
        df["is_imputed"] = df["is_imputed"].astype(bool)
    if "harga_asli" in df.columns:  # NaN -> None (NULL)
        df["harga_asli"] = df["harga_asli"].where(df["harga_asli"].notna(), None)
    if "latitude" in df.columns:
        df["latitude"] = df["latitude"].where(df["latitude"].notna(), None)
    if "longitude" in df.columns:
        df["longitude"] = df["longitude"].where(df["longitude"].notna(), None)
    if "sumber_koordinat" in df.columns:
        df["sumber_koordinat"] = df["sumber_koordinat"].where(df["sumber_koordinat"].notna(), None)
    if tabel in ("fact_cuaca", "fact_inflasi"):  # NaN -> None (NULL)
        df = df.where(df.notna(), None)
    return df


def muat(cur, tabel, df):
    """Muat cepat: kemas ratusan baris per INSERT (execute_values)."""
    kolom = list(df.columns)
    records = list(df.itertuples(index=False, name=None))
    execute_values(cur, f"INSERT INTO {tabel} ({','.join(kolom)}) VALUES %s",
                   records, page_size=1000)
    return len(records)


def verifikasi(cur):
    print("\n=== Verifikasi database ===")
    for _, tabel in TABEL:
        cur.execute(f"SELECT COUNT(*) FROM {tabel}")
        print(f"  {tabel:<22} {cur.fetchone()[0]:>8} baris")

    cur.execute("""
        SELECT
          (SELECT COUNT(*) FROM fact_harga_pasar WHERE harga_imputasi IS NULL),
          (SELECT COUNT(*) FROM fact_harga_pasar WHERE harga_asli = 0),
          (SELECT COUNT(*) FROM fact_harga_pasar f
             LEFT JOIN dim_komoditas k USING (komoditas_id) WHERE k.komoditas_id IS NULL),
          (SELECT COUNT(*) FROM fact_cuaca),
          (SELECT COUNT(*) FROM fact_cuaca c
             LEFT JOIN dim_kalender k USING (tanggal) WHERE k.tanggal IS NULL),
          (SELECT COUNT(*) FROM fact_inflasi WHERE inflasi_pct IS NOT NULL),
          (SELECT COUNT(*) FROM dim_pasar WHERE latitude IS NULL)
    """)
    n_null, n_zero, n_orphan, n_cuaca, n_cuaca_orphan, n_inflasi, n_pasar_no_coord = cur.fetchone()
    print(f"\n  harga_imputasi NULL : {n_null} (harus 0)")
    print(f"  harga_asli = 0      : {n_zero} (harus 0)")
    print(f"  FK orphan           : {n_orphan} (harus 0)")
    print(f"  fact_cuaca          : {n_cuaca} baris | FK orphan: {n_cuaca_orphan} (harus 0)")
    print(f"  fact_inflasi terisi : {n_inflasi} bulan (sisanya NULL = belum terbit)")
    print(f"  pasar tanpa koord   : {n_pasar_no_coord} (harus 0)")


def main():
    app = argparse.ArgumentParser(description="Ingest CSV HargaWatch ke Supabase")
    app.add_argument("--drop", action="store_true", help="drop tabel dulu (destructive)")
    app.add_argument("--verify", action="store_true", help="verifikasi saja")
    args = app.parse_args()

    conn = koneksi()
    try:
        with conn.cursor() as cur:
            if args.drop:
                print("Drop tabel (urutan fact dulu)...")
                cur.execute("DROP TABLE IF EXISTS fact_harga_pasar, fact_harga_produsen, "
                            "fact_cuaca, fact_inflasi, "
                            "dim_kalender, dim_komoditas, dim_pasar CASCADE")

            print("Buat tabel & terapkan indeks/RLS (IF NOT EXISTS)...")
            cur.execute(DDL)
            conn.commit()

            # Selalu sinkronkan master dimensi pasar & komoditas (upsert idempotent)
            # agar koordinat pasar dan perubahan master segera terisi di database
            if (PROCESSED / "dim_pasar.csv").exists():
                df_psr = bersihkan(pd.read_csv(PROCESSED / "dim_pasar.csv"), "dim_pasar")
                execute_values(cur, """
                    INSERT INTO dim_pasar (pasar_id, nama_pasar, tipe_pasar, latitude, longitude, sumber_koordinat)
                    VALUES %s
                    ON CONFLICT (pasar_id) DO UPDATE
                    SET nama_pasar = EXCLUDED.nama_pasar,
                        tipe_pasar = EXCLUDED.tipe_pasar,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude,
                        sumber_koordinat = EXCLUDED.sumber_koordinat
                """, list(df_psr.itertuples(index=False, name=None)))
                conn.commit()
                print("dim_pasar              sinkron (koordinat & metadata diperbarui)")

            if (PROCESSED / "dim_komoditas.csv").exists():
                df_kom = bersihkan(pd.read_csv(PROCESSED / "dim_komoditas.csv"), "dim_komoditas")
                execute_values(cur, """
                    INSERT INTO dim_komoditas (komoditas_id, nama_komoditas, grup, satuan)
                    VALUES %s
                    ON CONFLICT (komoditas_id) DO UPDATE
                    SET nama_komoditas = EXCLUDED.nama_komoditas,
                        grup = EXCLUDED.grup,
                        satuan = EXCLUDED.satuan
                """, list(df_kom.itertuples(index=False, name=None)))
                conn.commit()
                print("dim_komoditas          sinkron (metadata diperbarui)")

            if args.verify:
                verifikasi(cur)
                return 0

            for file, tabel in TABEL:
                cur.execute(f"SELECT COUNT(*) FROM {tabel}")
                ada = cur.fetchone()[0]
                if ada > 0:
                    print(f"{tabel:<22} sudah berisi {ada} baris, lewati (pakai --drop untuk reset)")
                    continue
                df = bersihkan(pd.read_csv(PROCESSED / file), tabel)
                n = muat(cur, tabel, df)
                conn.commit()
                print(f"{tabel:<22} {n:>8} baris dimuat")

            conn.commit()
            verifikasi(cur)
    except psycopg2.Error as e:
        conn.rollback()
        raise SystemExit(f"DB error: {e}")
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
