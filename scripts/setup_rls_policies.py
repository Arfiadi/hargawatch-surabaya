import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.utils.ingest_supabase import koneksi

conn = koneksi()
cur = conn.cursor()

# Enable Row Level Security (RLS) & Public read-only policies for ML tables
cur.execute("""
ALTER TABLE IF EXISTS public.fact_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fact_early_warning ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fact_forecast' AND policyname = 'Public read-only fact_forecast') THEN
        CREATE POLICY "Public read-only fact_forecast" ON fact_forecast FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fact_early_warning' AND policyname = 'Public read-only fact_early_warning') THEN
        CREATE POLICY "Public read-only fact_early_warning" ON fact_early_warning FOR SELECT TO anon, authenticated USING (true);
    END IF;
END $$;
""")

conn.commit()
cur.close()
conn.close()
print("Success: Policies configured with RLS enabled!")
