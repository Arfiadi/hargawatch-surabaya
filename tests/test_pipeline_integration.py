"""Integration test untuk memverifikasi koneksi database Supabase dan skema ML.

Test ini menyentuh infrastruktur nyata, sehingga tidak dijalankan secara default.
Aktifkan dengan:

    RUN_INTEGRATION=1 pytest tests/test_pipeline_integration.py
"""

import pytest

from src.utils.ingest_supabase import koneksi

pytestmark = pytest.mark.integration


def test_supabase_connection_and_schema():
    """Menguji koneksi langsung ke Supabase dan ketersediaan tabel fact_forecast & fact_early_warning."""
    conn = koneksi()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN ('fact_forecast', 'fact_early_warning');
                """
            )
            tables = {row[0] for row in cur.fetchall()}
            assert "fact_forecast" in tables, "Tabel fact_forecast belum terpasang di Supabase!"
            assert "fact_early_warning" in tables, "Tabel fact_early_warning belum terpasang di Supabase!"

            cur.execute(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'fact_forecast';
                """
            )
            cols_forecast = {row[0] for row in cur.fetchall()}
            assert set(
                ["tanggal", "pasar_id", "komoditas_id", "harga_prediksi", "batas_bawah", "batas_atas"]
            ).issubset(cols_forecast)

            cur.execute(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'fact_early_warning';
                """
            )
            cols_ews = {row[0] for row in cur.fetchall()}
            assert set(
                ["tanggal", "pasar_id", "komoditas_id", "total_skor", "status_warning"]
            ).issubset(cols_ews)
    finally:
        conn.close()
