"""Master production forecasting and early warning pipeline for HargaWatch Surabaya.

Generates 7-14 day forecasts (p10, p50, p90) and computes daily Early Warning risk scores.
Supports saving locally to data/processed/ or upserting directly to Supabase.

Integrates with:
- Champion Model Registry (models/forecasting/registry.json and W&B Model Registry)
- Smart Dynamic Feature Routing (Weather dropped by default; Calendar for Cabai only)
- Champion strategy dispatch: Naive baseline for stable commodities, GBDT for volatile ones.
"""

import argparse
import json
import os
import pickle
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.analytics.features import (
    load_raw_datasets, prepare_base_series, build_lag_features,
    build_weather_features, build_supervised_dataset,
    build_keputran_lead_features, calculate_days_to_idulfitri,
    DATA_PROCESSED
)
from src.models.models import (
    LightGBMForecaster, CatBoostForecaster, XGBoostForecaster,
    HAS_CATBOOST, HAS_XGBOOST
)
from src.safety.early_warning import compute_early_warning_scores

MODEL_DIR = BASE_DIR / "models" / "forecasting"
REGISTRY_FILE = MODEL_DIR / "registry.json"

# Strategic priority commodities identified in EDA
PRIORITY_KOMODITAS_IDS = [
    50,  # Cabe Rawit Merah (Most Volatile -> LightGBM + Calendar)
    39,  # Bawang Merah (High Volatility -> CatBoost)
    2,   # Beras Premium (Strategic Staple -> Naive Last Value)
    13,  # Daging Ayam Ras (Stable -> Naive Last Value)
    16,  # Telur Ayam Ras (Medium Volatility -> CatBoost)
    10,  # Minyak Goreng Curah
    7    # Gula Kristal Putih
]


def load_champion_from_registry(
    komoditas_id: int,
    horizon: int = 7
) -> Tuple[Optional[str], Optional[any], Optional[List[str]]]:
    """Retrieves champion model metadata from local registry or W&B Artifacts."""
    if not REGISTRY_FILE.exists():
        return None, None, None

    try:
        with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
            registry = json.load(f)
    except Exception:
        return None, None, None

    key = f"{komoditas_id}_h{horizon}"
    entry = registry.get(key)
    if not entry:
        return None, None, None

    model_name = entry.get("model_name", "")
    model_path_str = entry.get("model_path")
    features = entry.get("features", [])

    if "naive" in model_name.lower():
        return "naive", None, features

    model_obj = None
    resolved_path = None
    if model_path_str:
        p = Path(model_path_str)
        if p.exists():
            resolved_path = p
        elif (MODEL_DIR / p.name).exists():
            resolved_path = MODEL_DIR / p.name

    if resolved_path and resolved_path.exists():
        try:
            with open(resolved_path, "rb") as f:
                model_obj = pickle.load(f)
            return model_name, model_obj, features
        except Exception as e:
            print(f"  [WARN] Failed to load local model {resolved_path}: {e}")

    # Fallback to W&B Model Registry if available
    try:
        import wandb
        api = wandb.Api()
        project = os.getenv("WANDB_PROJECT", "hargawatch-surabaya")
        artifact_path = f"{project}/forecast-model-{komoditas_id}-h{horizon}:production"
        artifact = api.artifact(artifact_path)
        download_dir = artifact.download()
        pkl_files = list(Path(download_dir).glob("*.pkl"))
        if pkl_files:
            with open(pkl_files[0], "rb") as f:
                model_obj = pickle.load(f)
            return model_name, model_obj, features
    except Exception:
        pass

    return model_name, None, features


def train_and_forecast_commodity(
    komoditas_id: int,
    commodity_name: str,
    horizon_days: int = 14,
    include_weather: bool = False,
    force_db: bool = False
) -> pd.DataFrame:
    """Generates multi-step direct quantile forecasts using champion architectures."""
    df_harga, df_kal, df_cuaca = load_raw_datasets(force_db=force_db)
    df_base = prepare_base_series(df_harga, komoditas_id=komoditas_id)
    df_lags = build_lag_features(df_base)
    # Ensure wholesale lead features from Pasar Induk Keputran are present (eliminates feature skew)
    df_lags = build_keputran_lead_features(df_lags)

    origin_date = df_lags["tanggal"].max()
    slice_origin = df_lags[df_lags["tanggal"] == origin_date].copy()
    # Filter out markets where commodity has been absent >7 days (price_current is NaN)
    slice_origin = slice_origin[slice_origin["price_current"].notna()].copy()

    if slice_origin.empty:
        return pd.DataFrame()

    c_lower = commodity_name.lower()
    is_cabai = "cabai" in c_lower or "cabe" in c_lower

    # Feature routing
    weather_feats = build_weather_features(df_cuaca) if include_weather else pd.DataFrame()
    if not weather_feats.empty:
        slice_origin = slice_origin.merge(weather_feats, on="tanggal", how="left")

    base_feature_cols = [
        "pasar_id", "price_current", "price_lag_1", "price_lag_2", "price_lag_3",
        "price_lag_7", "price_lag_14", "rolling_mean_7d", "rolling_std_7d",
        "rolling_mean_14d", "rolling_std_14d", "pct_change_1d", "pct_change_7d"
    ]
    if is_cabai:
        calendar_cols = [
            "target_bulan", "target_is_weekend", "target_is_libur_nasional",
            "target_is_ramadan", "target_is_pra_ramadan"
        ]
        base_feature_cols += calendar_cols

    if include_weather and not weather_feats.empty:
        w_cols = ["curah_hujan_mm", "rain_sum_7d", "rain_sum_14d", "rain_lag_28d"]
        base_feature_cols += [c for c in w_cols if c in weather_feats.columns]

    # Check champion strategy from Registry for H7
    champ_name, champ_model_h7, champ_features = load_champion_from_registry(komoditas_id, horizon=7)

    # If stable commodity with Naive champion strategy (Beras, Bawang Putih, Daging Ayam)
    # or if commodity is strategic staple known to be Naive-dominated
    is_naive_champion = (champ_name and "naive" in champ_name.lower()) or (
        komoditas_id in [2, 13, 3] and not is_cabai
    )

    all_forecasts = []
    origin_dt = pd.to_datetime(origin_date)

    # Dynamic multi-step rolling state per market
    state_df = slice_origin.copy()

    for h in range(1, horizon_days + 1):
        target_date = origin_dt + pd.Timedelta(days=int(h))

        # 1. Update calendar features dynamically for target_date
        kal_target = df_kal[df_kal["tanggal"] == target_date]
        if kal_target.empty:
            state_df["target_bulan"] = target_date.month
            state_df["target_is_weekend"] = int(target_date.weekday() >= 5)
            state_df["target_is_libur_nasional"] = 0
            state_df["target_is_ramadan"] = 0
            state_df["target_is_pra_ramadan"] = 0
        else:
            state_df["target_bulan"] = kal_target["bulan"].iloc[0]
            state_df["target_is_weekend"] = kal_target["is_weekend"].iloc[0]
            state_df["target_is_libur_nasional"] = kal_target["is_libur_nasional"].iloc[0]
            state_df["target_is_ramadan"] = kal_target["is_ramadan"].iloc[0]
            state_df["target_is_pra_ramadan"] = kal_target["is_pra_ramadan"].iloc[0]

        state_df["target_hari_ke_idulfitri"] = calculate_days_to_idulfitri(pd.Series([target_date])).iloc[0]

        if is_naive_champion or champ_model_h7 is None:
            # Naive Last Value Persistence baseline with square-root diffusion uncertainty cone
            p_curr = slice_origin["price_current"].values
            std_7d = slice_origin["rolling_std_7d"].fillna(slice_origin["price_current"] * 0.02).values
            # Adaptive variance floor to prevent zero-width confidence band for sticky commodities
            variance_floor = np.maximum(p_curr * 0.015, 100.0)
            std_effective = np.maximum(std_7d, variance_floor)
            diffusion_scale = np.sqrt(h / 7.0)
            p50 = np.round(p_curr).astype(int)
            p10 = np.maximum(0, np.round(p_curr - 1.28 * std_effective * diffusion_scale)).astype(int)
            p90 = np.round(p_curr + 1.28 * std_effective * diffusion_scale).astype(int)
            preds = {
                "harga_prediksi": p50,
                "batas_bawah": p10,
                "batas_atas": p90
            }
        else:
            # Dynamic Machine Learning Inference (Step-by-Step without linear heuristic)
            expected_cols = getattr(champ_model_h7, "feature_cols", champ_features or base_feature_cols)
            for col in expected_cols:
                if col not in state_df.columns:
                    state_df[col] = 0.0

            try:
                out = champ_model_h7.predict(state_df)
                raw_pred = np.asarray(out["harga_prediksi"], dtype=float)
                raw_low = np.asarray(out.get("batas_bawah", raw_pred), dtype=float)
                raw_high = np.asarray(out.get("batas_atas", raw_pred), dtype=float)

                # Calibrated diffusion interval: expands dynamically with horizon to prevent interval collapse
                base_spread = np.maximum((raw_high - raw_low) / 2.0, raw_pred * 0.03)
                diffusion_factor = np.sqrt(h / 7.0)
                calibrated_spread = base_spread * diffusion_factor

                p50 = np.round(raw_pred).astype(int)
                p10 = np.maximum(0, np.round(raw_pred - calibrated_spread)).astype(int)
                p90 = np.round(raw_pred + calibrated_spread).astype(int)

                # Monotonic non-crossing guardrail: 0 <= p10 <= p50 <= p90
                p10 = np.minimum(p10, p50)
                p90 = np.maximum(p90, p50)

                preds = {
                    "harga_prediksi": p50,
                    "batas_bawah": p10,
                    "batas_atas": p90
                }

                # Dynamic state roll for step h+1
                if "price_lag_2" in state_df.columns and "price_lag_3" in state_df.columns:
                    state_df["price_lag_3"] = state_df["price_lag_2"]
                if "price_lag_1" in state_df.columns and "price_lag_2" in state_df.columns:
                    state_df["price_lag_2"] = state_df["price_lag_1"]
                if "price_current" in state_df.columns and "price_lag_1" in state_df.columns:
                    state_df["price_lag_1"] = state_df["price_current"]
                if "price_current" in state_df.columns:
                    state_df["price_current"] = raw_pred
                if "rolling_mean_7d" in state_df.columns:
                    state_df["rolling_mean_7d"] = 0.85 * state_df["rolling_mean_7d"] + 0.15 * raw_pred

            except Exception as e:
                print(f"  [WARN] Dynamic inference error at step h={h} for {commodity_name}: {e}. Fallback to persistence.")
                p_curr = slice_origin["price_current"].values
                p50 = np.round(p_curr).astype(int)
                preds = {"harga_prediksi": p50, "batas_bawah": p50, "batas_atas": p50}

        step_df = pd.DataFrame({
            "tanggal": target_date.strftime("%Y-%m-%d"),
            "pasar_id": slice_origin["pasar_id"].astype(int).values,
            "komoditas_id": komoditas_id,
            "harga_prediksi": preds["harga_prediksi"],
            "batas_bawah": preds["batas_bawah"],
            "batas_atas": preds["batas_atas"]
        })
        all_forecasts.append(step_df)

    if not all_forecasts:
        return pd.DataFrame()

    return pd.concat(all_forecasts, ignore_index=True)


def upsert_to_supabase(df_forecast: pd.DataFrame, df_ews: pd.DataFrame):
    """Upserts forecasts and early warning scores to Supabase."""
    try:
        from src.utils.ingest_supabase import koneksi
        from psycopg2.extras import execute_values

        conn = koneksi()
        cur = conn.cursor()

        # 1. Upsert fact_forecast
        sql_forecast = """
            INSERT INTO public.fact_forecast (tanggal, pasar_id, komoditas_id, harga_prediksi, batas_bawah, batas_atas)
            VALUES %s
            ON CONFLICT (tanggal, pasar_id, komoditas_id) DO UPDATE
            SET harga_prediksi = EXCLUDED.harga_prediksi,
                batas_bawah = EXCLUDED.batas_bawah,
                batas_atas = EXCLUDED.batas_atas,
                created_at = CURRENT_TIMESTAMP;
        """
        rows_forecast = [
            (r.tanggal, r.pasar_id, r.komoditas_id, r.harga_prediksi, r.batas_bawah, r.batas_atas)
            for r in df_forecast.itertuples()
        ]
        execute_values(cur, sql_forecast, rows_forecast, page_size=500)

        # 2. Upsert fact_early_warning
        sql_ews = """
            INSERT INTO public.fact_early_warning 
            (tanggal, pasar_id, komoditas_id, skor_tren, skor_volatilitas, skor_anomali, skor_prediksi, total_skor, status_warning)
            VALUES %s
            ON CONFLICT (tanggal, pasar_id, komoditas_id) DO UPDATE
            SET skor_tren = EXCLUDED.skor_tren,
                skor_volatilitas = EXCLUDED.skor_volatilitas,
                skor_anomali = EXCLUDED.skor_anomali,
                skor_prediksi = EXCLUDED.skor_prediksi,
                total_skor = EXCLUDED.total_skor,
                status_warning = EXCLUDED.status_warning,
                created_at = CURRENT_TIMESTAMP;
        """
        rows_ews = [
            (r.tanggal, r.pasar_id, r.komoditas_id, r.skor_tren, r.skor_volatilitas,
             r.skor_anomali, r.skor_prediksi, r.total_skor, r.status_warning)
            for r in df_ews.itertuples()
        ]
        execute_values(cur, sql_ews, rows_ews, page_size=500)

        conn.commit()
        cur.close()
        conn.close()
        print(f"[SUCCESS] Upserted {len(rows_forecast)} forecast rows & {len(rows_ews)} EWS rows to Supabase!")

    except Exception as e:
        print(f"[ERROR] Failed to upsert to Supabase: {e}")


def main():
    parser = argparse.ArgumentParser(description="HargaWatch Forecasting Pipeline Runner")
    parser.add_argument("--horizon", type=int, default=14, help="Forecast horizon in days (default: 14)")
    parser.add_argument("--all-commodities", action="store_true", help="Run across all 37 commodities")
    parser.add_argument("--use-weather", action="store_true", help="Force inclusion of weather features")
    parser.add_argument("--local-only", action="store_true", help="Export to local CSV only")
    parser.add_argument("--from-db", action="store_true", help="Force loading fresh data from Supabase DB rather than local CSV")
    args = parser.parse_args()

    df_harga, _, _ = load_raw_datasets(force_db=args.from_db)
    latest_date = df_harga["tanggal"].max()
    print(f"\n========================================================")
    print(f"  HARGAWATCH FORECASTING & EARLY WARNING RUNNER")
    print(f"  Latest Data Date: {latest_date.date()} | Horizon: {args.horizon} Days")
    print(f"  Weather Exogenous: {args.use_weather}")
    print(f"========================================================")

    if args.all_commodities:
        target_ids = df_harga["komoditas_id"].unique().tolist()
    else:
        target_ids = PRIORITY_KOMODITAS_IDS

    if (DATA_PROCESSED / "dim_komoditas.csv").exists():
        df_kom = pd.read_csv(DATA_PROCESSED / "dim_komoditas.csv")
    else:
        from src.utils.ingest_supabase import koneksi
        _conn = koneksi()
        df_kom = pd.read_sql("SELECT * FROM dim_komoditas", _conn)
        _conn.close()
        df_kom.to_csv(DATA_PROCESSED / "dim_komoditas.csv", index=False)

    col_k = "nama_komoditas" if "nama_komoditas" in df_kom.columns else "komoditas"
    if "komoditas" not in df_kom.columns:
        df_kom["komoditas"] = df_kom[col_k]
    name_map = dict(zip(df_kom["komoditas_id"], df_kom["komoditas"]))

    all_forecast_dfs = []
    print(f"\n[INFO] Generating forecasts for {len(target_ids)} target commodities...")
    for cid in target_ids:
        cname = name_map.get(cid, f"ID_{cid}")
        print(f"  -> Forecasting {cname} (ID: {cid})...")
        fc_df = train_and_forecast_commodity(
            komoditas_id=cid,
            commodity_name=cname,
            horizon_days=args.horizon,
            include_weather=args.use_weather,
            force_db=args.from_db
        )
        if not fc_df.empty:
            all_forecast_dfs.append(fc_df)

    if not all_forecast_dfs:
        print("[ERROR] No forecasts were generated.")
        return

    df_final_forecasts = pd.concat(all_forecast_dfs, ignore_index=True)

    # Generate Early Warning Scores at latest_date using day-7 forecast
    print("\n[INFO] Computing Early Warning Risk Matrix...")
    df_base_all = prepare_base_series(df_harga)
    df_lags_all = build_lag_features(df_base_all)
    slice_latest = df_lags_all[
        (df_lags_all["tanggal"] == latest_date) &
        (df_lags_all["komoditas_id"].isin(target_ids))
    ].copy()

    # Match with day-7 forecast
    latest_dt = pd.to_datetime(latest_date)
    day7_date = (latest_dt + pd.Timedelta(days=7)).strftime("%Y-%m-%d")
    fc_day7 = df_final_forecasts[df_final_forecasts["tanggal"] == day7_date]
    if fc_day7.empty:
        fc_day7 = df_final_forecasts.drop_duplicates(subset=["pasar_id", "komoditas_id"])

    # Drop tanggal from forecast slice so merge aligns each market/commodity to current origin t
    fc_day7_clean = fc_day7.drop(columns=["tanggal"], errors="ignore")
    df_final_ews = compute_early_warning_scores(slice_latest, fc_day7_clean)

    # Save to local CSV
    out_fc_path = DATA_PROCESSED / "fact_forecast.csv"
    out_ews_path = DATA_PROCESSED / "fact_early_warning.csv"
    df_final_forecasts.to_csv(out_fc_path, index=False)
    df_final_ews.to_csv(out_ews_path, index=False)
    print(f"\n[OUTPUT] Saved {len(df_final_forecasts)} rows to {out_fc_path}")
    print(f"[OUTPUT] Saved {len(df_final_ews)} rows to {out_ews_path}")

    # Display EWS Sample Table
    print("\n=== SAMPLE EARLY WARNING RISK MATRIX ===")
    df_display = df_final_ews.merge(df_kom[["komoditas_id", "komoditas"]], on="komoditas_id")
    if (DATA_PROCESSED / "dim_pasar.csv").exists():
        df_pasar = pd.read_csv(DATA_PROCESSED / "dim_pasar.csv")
    else:
        from src.utils.ingest_supabase import koneksi
        _conn = koneksi()
        df_pasar = pd.read_sql("SELECT * FROM dim_pasar", _conn)
        _conn.close()
        df_pasar.to_csv(DATA_PROCESSED / "dim_pasar.csv", index=False)
    df_display = df_display.merge(df_pasar[["pasar_id", "nama_pasar"]], on="pasar_id")
    cols_show = ["nama_pasar", "komoditas", "total_skor", "status_warning", "skor_tren", "skor_volatilitas", "skor_anomali", "skor_prediksi"]
    print(df_display[cols_show].head(15).to_string(index=False))

    # Ingest to Supabase if requested
    if not args.local_only:
        print("\n[INFO] Upserting to Supabase database...")
        upsert_to_supabase(df_final_forecasts, df_final_ews)

    print("\n[SUCCESS] Pipeline execution finished successfully!\n")


if __name__ == "__main__":
    main()
