"""Fetches historical daily weather for East Java agricultural production hubs.

Upstream production hubs:
1. Kediri: Primary production hub for Cabai (Chili) and vegetables.
2. Blitar: Major production hub for Cabai and Poultry/Eggs.
3. Nganjuk: Major production hub for Bawang Merah (Shallots).
4. Malang (Pujon): High-altitude production hub for Tomat (Tomatoes) and perishables.

Data Source: Open-Meteo Historical Archive API (ERA5 reanalysis, free, no key required).
Output: `data/external/cuaca_sentra_produksi.csv`

Usage:
    python scripts/autoresearch/fetch_upstream_weather.py
"""

from datetime import date, datetime, timedelta
from pathlib import Path
import sys
import time
from typing import Dict, List, Optional

import pandas as pd
import requests

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = BASE_DIR / "data" / "external"
OUTPUT_FILE = OUTPUT_DIR / "cuaca_sentra_produksi.csv"

API_URL = "https://archive-api.open-meteo.com/v1/archive"

# Geographic coordinates for key East Java sentra produksi
HUBS = {
    "kediri": {"lat": -7.848, "lon": 112.017, "desc": "Sentra Cabai & Sayur"},
    "blitar": {"lat": -8.098, "lon": 112.168, "desc": "Sentra Cabai & Telur"},
    "nganjuk": {"lat": -7.604, "lon": 111.904, "desc": "Sentra Bawang Merah"},
    "malang": {"lat": -7.871, "lon": 112.527, "desc": "Sentra Tomat & Sayuran Pujon"},
}


def fetch_hub_weather(
    hub_name: str,
    lat: float,
    lon: float,
    start_date: str = "2020-01-01",
    end_date: Optional[str] = None,
    retry: int = 3,
) -> pd.DataFrame:
    """Fetches daily rain_sum and temperature_2m_mean for a coordinate."""
    if end_date is None:
        end_date = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "rain_sum,temperature_2m_mean",
        "timezone": "Asia/Jakarta",
    }

    print(f"  [FETCH] Downloading weather for {hub_name} ({lat}, {lon}) from {start_date} to {end_date}...")

    for attempt in range(1, retry + 1):
        try:
            r = requests.get(API_URL, params=params, timeout=60)
            r.raise_for_status()
            data = r.json()
            if "daily" not in data:
                raise ValueError(f"Response missing 'daily' field: {data}")

            daily = data["daily"]
            df = pd.DataFrame({
                "tanggal": daily["time"],
                f"{hub_name}_rain_mm": daily["rain_sum"],
                f"{hub_name}_temp_c": daily["temperature_2m_mean"],
            })
            df["tanggal"] = pd.to_datetime(df["tanggal"])
            print(f"  [OK] {hub_name}: Downloaded {len(df)} rows.")
            return df

        except Exception as e:
            if attempt == retry:
                raise
            backoff = 2 ** attempt
            print(f"  [WARN] {hub_name} attempt {attempt} failed ({e}). Retrying in {backoff}s...")
            time.sleep(backoff)

    return pd.DataFrame()


def main():
    print("=================================================================")
    print("  AUTORESEARCH: UPSTREAM PRODUCTION HUBS WEATHER FETCHER")
    print("=================================================================")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    start_date = "2020-01-01"
    end_date = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")

    dfs: List[pd.DataFrame] = []

    for hub_name, meta in HUBS.items():
        df_hub = fetch_hub_weather(
            hub_name=hub_name,
            lat=meta["lat"],
            lon=meta["lon"],
            start_date=start_date,
            end_date=end_date,
        )
        dfs.append(df_hub)
        time.sleep(1.0)  # Gentle rate limit

    if not dfs:
        print("[ERROR] No data downloaded.")
        sys.exit(1)

    # Merge on tanggal
    df_merged = dfs[0]
    for df_next in dfs[1:]:
        df_merged = df_merged.merge(df_next, on="tanggal", how="outer")

    df_merged = df_merged.sort_values("tanggal").reset_index(drop=True)
    df_merged.to_csv(OUTPUT_FILE, index=False)

    print(f"\n[SUCCESS] Saved {len(df_merged)} rows to {OUTPUT_FILE}")
    print(f"Columns: {list(df_merged.columns)}")
    print("=================================================================\n")


if __name__ == "__main__":
    main()
