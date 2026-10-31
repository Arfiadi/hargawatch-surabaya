import pytest
from src.utils.ingest_supabase import koneksi

# Tandai modul ini sebagai integration test (hanya jalan jika RUN_INTEGRATION=1)
pytestmark = pytest.mark.integration


def test_supabase_connection_and_schema():
    """Menguji koneksi langsung ke Supabase dan ketersediaan tabel fact_forecast & fact_early_warning."""
    try:
        conn = koneksi()
    except (Exception, SystemExit) as e:
        pytest.skip(f"Koneksi Supabase tidak tersedia pada environment saat ini: {e}")

    try:
        with conn.cursor() as cur:
            # 1. Pastikan tabel fact_forecast ada
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'fact_forecast';
            """)
            forecast_cols = {row[0]: row[1] for row in cur.fetchall()}
            
            # Wajib ada kolom-kolom utama
            required_forecast_cols = ['tanggal_prediksi', 'horizon_hari', 'harga_prediksi', 'batas_bawah', 'batas_atas', 'wape_historis']
            for col in required_forecast_cols:
                assert col in forecast_cols, f"Kolom {col} hilang di tabel fact_forecast Supabase"

            # 2. Pastikan tabel fact_early_warning ada
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'fact_early_warning';
            """)
            warning_cols = {row[0]: row[1] for row in cur.fetchall()}
            
            # Wajib ada kolom-kolom status risiko
            required_warning_cols = ['tanggal_evaluasi', 'skor_komposit', 'status_peringatan', 'rekomendasi_aksi']
            for col in required_warning_cols:
                assert col in warning_cols, f"Kolom {col} hilang di tabel fact_early_warning Supabase"

    finally:
        conn.close()
