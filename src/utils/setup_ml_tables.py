"""Skrip Setup Tabel Machine Learning & Early Warning ke Supabase.
Mengeksekusi DDL untuk membuat tabel `fact_forecast` dan `fact_early_warning`
serta mengaktifkan Row Level Security (RLS) dan Public Read-Only Policies.
"""

import os
import sys
from pathlib import Path
import psycopg2
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# DDL untuk tabel hasil Machine Learning
DDL_ML = """
-- Tabel untuk menyimpan hasil prediksi 7-14 hari ke depan
CREATE TABLE IF NOT EXISTS public.fact_forecast (
    tanggal DATE NOT NULL,          
    pasar_id INT NOT NULL REFERENCES public.dim_pasar(pasar_id),
    komoditas_id INT NOT NULL REFERENCES public.dim_komoditas(komoditas_id),
    harga_prediksi INT NOT NULL,
    batas_bawah INT,
    batas_atas INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tanggal, pasar_id, komoditas_id)
);

-- Tabel untuk menyimpan hasil sistem skoring komposit Early Warning
CREATE TABLE IF NOT EXISTS public.fact_early_warning (
    tanggal DATE NOT NULL,          
    pasar_id INT NOT NULL REFERENCES public.dim_pasar(pasar_id),
    komoditas_id INT NOT NULL REFERENCES public.dim_komoditas(komoditas_id),
    skor_tren INT DEFAULT 0,
    skor_volatilitas INT DEFAULT 0,
    skor_anomali INT DEFAULT 0,
    skor_prediksi INT DEFAULT 0,
    total_skor INT NOT NULL,
    status_warning VARCHAR(20) NOT NULL CHECK (status_warning IN ('NORMAL', 'WASPADA', 'TINGGI')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tanggal, pasar_id, komoditas_id)
);

-- Row Level Security (RLS) & Public Read-Only Policies
ALTER TABLE public.fact_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_early_warning ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fact_forecast' AND policyname = 'Public read-only fact_forecast') THEN
        CREATE POLICY "Public read-only fact_forecast" ON public.fact_forecast FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fact_early_warning' AND policyname = 'Public read-only fact_early_warning') THEN
        CREATE POLICY "Public read-only fact_early_warning" ON public.fact_early_warning FOR SELECT TO anon, authenticated USING (true);
    END IF;
END $$;
"""

def koneksi(retry=3):
    load_dotenv(BASE_DIR / ".env")
    host = os.getenv("SUPABASE_HOST")
    if not host:
        raise SystemExit("Kredensial belum ada. Pastikan file .env sudah diisi.")
    
    port_utama = os.getenv("SUPABASE_PORT", "6543")
    kandidat_port = [port_utama] + (["5432"] if port_utama != "5432" else [])

    param_dasar = dict(
        host=host, dbname=os.getenv("SUPABASE_DB", "postgres"),
        user=os.getenv("SUPABASE_USER"), password=os.getenv("SUPABASE_PASSWORD"),
        sslmode="require", connect_timeout=30,
    )
    
    import time
    last_err = None
    for port in kandidat_port:
        for percobaan in range(1, retry + 1):
            try:
                return psycopg2.connect(**{**param_dasar, "port": port})
            except psycopg2.OperationalError as e:
                last_err = e
                print(f"  [!] koneksi gagal (port {port}, percobaan {percobaan}/{retry}): {e}")
                if percobaan < retry:
                    time.sleep(2 ** percobaan)
    raise last_err

def main():
    print("Menghubungkan ke Supabase...")
    conn = koneksi()
    try:
        with conn.cursor() as cur:
            print("Mengeksekusi DDL pembuatan tabel & RLS fact_forecast & fact_early_warning...")
            cur.execute(DDL_ML)
            conn.commit()
            
            # Verifikasi
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('fact_forecast', 'fact_early_warning')")
            tabel_terbuat = [r[0] for r in cur.fetchall()]
            
            print("\nSetup Berhasil!")
            print(f"Tabel yang tersedia: {', '.join(tabel_terbuat)}")
            print("Row Level Security (RLS) & Public read-only policies aktif.")
            
    except psycopg2.Error as e:
        conn.rollback()
        raise SystemExit(f"Database Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    sys.exit(main())
