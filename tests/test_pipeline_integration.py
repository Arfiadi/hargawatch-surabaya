"""Integration tests untuk memverifikasi koneksi database Supabase dan skema ML."""

import os
import psycopg2
import pytest
from src.utils.ingest_supabase import koneksi


def test_supabase_connection_and_schema():
    """Menguji koneksi langsung ke Supabase dan ketersediaan tabel fact_forecast & fact_early_warning."""
    try:
        conn = koneksi()
    except Exception as e:
        pytest.skip(f"Koneksi Supabase tidak tersedia pada environment saat ini: {e}")

    try:
        with conn.cursor() as cur:
            # Periksa apakah tabel ML tersedia di Supabase
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                  AND table_name IN ('fact_forecast', 'fact_early_warning');
            """)
            tables = {row[0] for row in cur.fetchall()}
            assert "fact_forecast" in tables, "Tabel fact_forecast belum terpasang di Supabase!"
            assert "fact_early_warning" in tables, "Tabel fact_early_warning belum terpasang di Supabase!"
            
            # Verifikasi kolom kunci di fact_forecast
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'fact_forecast';
            """)
            cols_forecast = {row[0] for row in cur.fetchall()}
            assert set(["tanggal", "pasar_id", "komoditas_id", "harga_prediksi", "batas_bawah", "batas_atas"]).issubset(cols_forecast)
    finally:
        conn.close()
