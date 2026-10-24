"""Early Warning System (EWS) Scoring and Classification Engine for HargaWatch.

Computes 4 composite risk sub-scores (total 0-100):
1. skor_tren (0-20): 7-day price momentum
2. skor_volatilitas (0-20): Short-term vs medium-term volatility ratio (std_7d / std_30d)
3. skor_anomali (0-20): Wholesale-retail margin collapse (Keputran vs retail markets)
4. skor_prediksi (0-40): ML projection severity (Logika A: median >=15%, Logika B: Q90 > 90-day high)

Classifies status:
- NORMAL (< 40)
- WASPADA (40 - 69)
- TINGGI (>= 70)
"""

from typing import Optional, Union, List, Dict
import numpy as np
import pandas as pd

# Cluster definitions for adaptive EWS threshold calibration
VOLATILE_KOMODITAS_IDS = {50, 38, 37, 39, 46, 48}       # Cabai, Bawang Merah, Tomat, Buncis
MODERATE_KOMODITAS_IDS = {16, 13, 17, 14, 3, 49, 45, 47, 44, 58, 59, 60, 61, 62} # Unggas, Telur, Umbi, Ikan
# All other commodities default to Staples / Administered Prices / FMCG


def compute_early_warning_scores(
    df_current_features: pd.DataFrame,
    df_forecasts: pd.DataFrame
) -> pd.DataFrame:
    """Calculates deterministic risk scores and warning status.
    
    Scoring weights aligned with docs/EWS_methodology.md:
    - Pilar 1 (Tren): 20 poin
    - Pilar 2 (Volatilitas): 20 poin
    - Pilar 3 (Disparitas Grosir): 20 poin
    - Pilar 4 (Proyeksi ML): 40 poin (Logika A: 20 + Logika B: 20)
    
    Parameters
    ----------
    df_current_features : pd.DataFrame
        Latest slice of features at date t with current prices, lags, and rolling stats.
        Required columns: ['tanggal', 'pasar_id', 'komoditas_id', 'price_current',
                           'price_lag_7', 'rolling_std_7d', 'rolling_std_14d']
    df_forecasts : pd.DataFrame
        Forecasted prices for future horizon.
        Required columns: ['pasar_id', 'komoditas_id', 'harga_prediksi']
        Optional columns: ['batas_atas'] (for Logika B extreme risk detection)
        
    Returns
    -------
    pd.DataFrame
        DataFrame matching public.fact_early_warning schema.
    """
    df = df_current_features.copy()
    
    # Merge future predictions — include batas_atas if available for Logika B
    forecast_cols = ["pasar_id", "komoditas_id"]
    if "harga_prediksi" in df_forecasts.columns and "harga_prediksi" not in df.columns:
        forecast_cols.append("harga_prediksi")
    if "batas_atas" in df_forecasts.columns and "batas_atas" not in df.columns:
        forecast_cols.append("batas_atas")
    
    if len(forecast_cols) > 2:
        merge_keys = ["pasar_id", "komoditas_id"]
        df_fc_subset = df_forecasts.copy()
        if "tanggal" in df.columns and "tanggal" in df_fc_subset.columns:
            try:
                # Harmonize tanggal formats
                df_tanggal_str = pd.to_datetime(df["tanggal"]).dt.strftime("%Y-%m-%d")
                fc_tanggal_str = pd.to_datetime(df_fc_subset["tanggal"]).dt.strftime("%Y-%m-%d")
                # If tanggal values overlap, include tanggal in merge keys
                if set(df_tanggal_str).intersection(set(fc_tanggal_str)):
                    df["tanggal"] = df_tanggal_str
                    df_fc_subset["tanggal"] = fc_tanggal_str
                    merge_keys = ["tanggal", "pasar_id", "komoditas_id"]
            except Exception:
                pass
        df = df.merge(
            df_fc_subset[list(set(merge_keys + forecast_cols))].drop_duplicates(subset=merge_keys),
            on=merge_keys,
            how="left"
        )
    
    # Identify commodity clusters
    komoditas_ids = df["komoditas_id"] if "komoditas_id" in df.columns else pd.Series(0, index=df.index)
    is_volatile = komoditas_ids.isin(VOLATILE_KOMODITAS_IDS)
    is_moderate = komoditas_ids.isin(MODERATE_KOMODITAS_IDS)
    is_staple = ~is_volatile & ~is_moderate

    # ===== PILAR 1: Skor Tren Historis Adaptif (0-20) =====
    # Ambang batas dinamis: Volatil (>=15%), Moderat (>=8%), Bahan Pokok/HET (>=4%)
    pct_change_7d = ((df["price_current"] - df["price_lag_7"]) / (df["price_lag_7"] + 1e-5)) * 100
    skor_tren = np.zeros(len(df), dtype=int)
    skor_tren = np.where(is_volatile & (pct_change_7d >= 15.0), 20,
                np.where(is_volatile & (pct_change_7d >= 8.0), 10, skor_tren))
    skor_tren = np.where(is_moderate & (pct_change_7d >= 8.0), 20,
                np.where(is_moderate & (pct_change_7d >= 4.0), 10, skor_tren))
    skor_tren = np.where(is_staple & (pct_change_7d >= 4.0), 20,
                np.where(is_staple & (pct_change_7d >= 2.0), 10, skor_tren))

    # ===== PILAR 2: Skor Volatilitas & Anti-Amnesia Plateau (0-20) =====
    # Dual-Trigger: Volatility Ratio ATAU Price-Level Z-score (mencegah amnesia saat plateau)
    if "rolling_std_30d" in df.columns:
        denominator = df["rolling_std_30d"]
    elif "rolling_std_14d" in df.columns:
        denominator = df["rolling_std_14d"]
    else:
        denominator = pd.Series(1.0, index=df.index)

    if "rolling_std_7d" in df.columns:
        vol_ratio = df["rolling_std_7d"] / (denominator + 1e-5)
    else:
        vol_ratio = pd.Series(0.0, index=df.index)

    skor_vol_ratio = np.select(
        [vol_ratio >= 1.5, vol_ratio >= 1.1],
        [20, 10],
        default=0
    )

    # Z-score level harga terhadap rata-rata 30 hari (menangkap harga plateau tinggi)
    if "rolling_mean_30d" in df.columns and "rolling_std_30d" in df.columns:
        r_mean = df["rolling_mean_30d"]
        r_std = df["rolling_std_30d"]
    elif "rolling_mean_14d" in df.columns and "rolling_std_14d" in df.columns:
        r_mean = df["rolling_mean_14d"]
        r_std = df["rolling_std_14d"]
    else:
        r_mean = df["price_current"]
        r_std = pd.Series(1.0, index=df.index)

    z_level = (df["price_current"] - r_mean) / (r_std.replace(0.0, np.nan).fillna(r_mean * 0.05) + 1e-5)
    skor_z_level = np.select(
        [z_level >= 2.0, z_level >= 1.2],
        [20, 10],
        default=0
    )

    skor_vol = np.maximum(skor_vol_ratio, skor_z_level)

    # ===== PILAR 3: Skor Disparitas Spasial Universal (0-20) =====
    # Hybrid: Marjin grosir Keputran jika ada; Disparitas Spasial Surabaya jika non-Keputran
    KEPUTRAN_ID = 5
    group_cols = ["komoditas_id"]
    if "tanggal" in df.columns:
        group_cols = ["tanggal", "komoditas_id"]

    # A. Cek margin Pasar Keputran vs Eceran
    keputran_sub = df[df["pasar_id"] == KEPUTRAN_ID].groupby(group_cols)["price_current"].first().rename("kep_p")
    eceran_sub = df[df["pasar_id"] != KEPUTRAN_ID].groupby(group_cols)["price_current"].mean().rename("ece_p")
    m_calc = pd.concat([keputran_sub, eceran_sub], axis=1)
    m_calc["calc_margin"] = ((m_calc["ece_p"] - m_calc["kep_p"]) / (m_calc["ece_p"] + 1e-5)) * 100

    # B. Cek Spread Harga Antar-Pasar Surabaya (Spatial Dispersion)
    p_max = df.groupby(group_cols)["price_current"].transform("max")
    p_min = df.groupby(group_cols)["price_current"].transform("min")
    p_mean = df.groupby(group_cols)["price_current"].transform("mean")
    spatial_spread_pct = ((p_max - p_min) / (p_mean + 1e-5)) * 100

    df_temp = df[group_cols].merge(m_calc[["calc_margin", "kep_p"]], on=group_cols, how="left")
    has_keputran = df_temp["kep_p"].notna() & (df_temp["kep_p"] > 0)
    margin_series = df_temp["calc_margin"].fillna(15.0).values

    skor_keputran = np.select(
        [margin_series < 5.0, margin_series <= 10.0],
        [20, 10],
        default=0
    )
    skor_spread = np.select(
        [spatial_spread_pct >= 15.0, spatial_spread_pct >= 8.0],
        [20, 10],
        default=0
    )
    skor_anomali = np.where(has_keputran, skor_keputran, skor_spread)

    # ===== PILAR 4: Skor Proyeksi Bahaya Masa Depan (0-40) =====
    # Logika A: Kenaikan Median Forecast H+7 terkalibrasi per klaster
    pred_increase_pct = ((df["harga_prediksi"] - df["price_current"]) / (df["price_current"] + 1e-5)) * 100
    skor_pred_a = np.zeros(len(df), dtype=int)
    skor_pred_a = np.where(is_volatile & (pred_increase_pct >= 15.0), 20,
                  np.where(is_volatile & (pred_increase_pct >= 8.0), 10, skor_pred_a))
    skor_pred_a = np.where(is_moderate & (pred_increase_pct >= 8.0), 20,
                  np.where(is_moderate & (pred_increase_pct >= 4.0), 10, skor_pred_a))
    skor_pred_a = np.where(is_staple & (pred_increase_pct >= 4.0), 20,
                  np.where(is_staple & (pred_increase_pct >= 2.0), 10, skor_pred_a))

    # Logika B: Batas Atas Kuantil 90 Menembus Rekor Tertinggi 90 Hari (Tail Risk)
    skor_pred_b = np.zeros(len(df), dtype=int)
    if "batas_atas" in df.columns and "rolling_max_90d" in df.columns:
        skor_pred_b = np.where(df["batas_atas"] > df["rolling_max_90d"], 20, 0)
    elif "batas_atas" in df.columns:
        pass

    skor_pred = skor_pred_a + skor_pred_b
    
    total_skor = skor_tren + skor_vol + skor_anomali + skor_pred
    
    status_warning = np.select(
        [total_skor >= 70, total_skor >= 40],
        ["TINGGI", "WASPADA"],
        default="NORMAL"
    )
    
    result = pd.DataFrame({
        "tanggal": df["tanggal"].dt.strftime("%Y-%m-%d") if pd.api.types.is_datetime64_any_dtype(df["tanggal"]) else df["tanggal"],
        "pasar_id": df["pasar_id"].astype(int),
        "komoditas_id": df["komoditas_id"].astype(int),
        "skor_tren": skor_tren.astype(int),
        "skor_volatilitas": skor_vol.astype(int),
        "skor_anomali": skor_anomali.astype(int),
        "skor_prediksi": skor_pred.astype(int),
        "total_skor": total_skor.astype(int),
        "status_warning": status_warning
    })
    
    return result


def generate_ews_summary_dataframe(df_predictions: pd.DataFrame) -> pd.DataFrame:
    """Transforms forecasting predictions into an EWS historical status summary.
    
    Processes predictions from walk-forward backtests (or production inference)
    and computes the 4 composite risk sub-scores and crisis warning statuses.
    
    Parameters
    ----------
    df_predictions : pd.DataFrame
        Must contain at least:
        - 'harga_prediksi'
        Optional columns:
        - 'tanggal', 'pasar_id', 'komoditas_id', 'harga_aktual',
          'price_current', 'price_lag_7', 'rolling_std_14d'
          
    Returns
    -------
    pd.DataFrame
        Clean, formatted DataFrame containing:
        - 'tanggal', 'pasar_id', 'nama_pasar', 'harga_prediksi',
          'skor_tren', 'skor_volatilitas', 'skor_anomali', 'skor_prediksi',
          'total_skor', 'status_warning'
    """
    expected_cols = [
        "tanggal", "pasar_id", "nama_pasar", "komoditas_id",
        "harga_aktual", "harga_prediksi", "skor_tren", "skor_volatilitas",
        "skor_anomali", "skor_prediksi", "total_skor", "status_warning"
    ]
    if df_predictions.empty:
        return pd.DataFrame(columns=expected_cols)

    df = df_predictions.copy()

    # Column fallbacks
    if "tanggal" not in df.columns:
        if "tanggal_origin" in df.columns:
            df["tanggal"] = df["tanggal_origin"]
        else:
            df["tanggal"] = pd.Timestamp.now().strftime("%Y-%m-%d")

    if "pasar_id" not in df.columns:
        df["pasar_id"] = 1
    if "komoditas_id" not in df.columns:
        df["komoditas_id"] = 50

    if "price_current" not in df.columns:
        if "harga_aktual" in df.columns:
            df["price_current"] = df["harga_aktual"]
        else:
            df["price_current"] = df["harga_prediksi"]

    if "price_lag_7" not in df.columns:
        if "harga_aktual" in df.columns and len(df) > 7:
            df_sorted = df.sort_values("tanggal")
            df["price_lag_7"] = df_sorted.groupby("pasar_id")["price_current"].shift(7).fillna(df["price_current"])
        else:
            df["price_lag_7"] = df["price_current"]

    if "rolling_std_7d" not in df.columns:
        if len(df) > 7:
            df_sorted = df.sort_values("tanggal")
            df["rolling_std_7d"] = df_sorted.groupby("pasar_id")["price_current"].transform(
                lambda s: s.rolling(7, min_periods=3).std()
            ).fillna(0.0)
        else:
            df["rolling_std_7d"] = 0.0

    if "rolling_std_14d" not in df.columns:
        if len(df) > 14:
            df_sorted = df.sort_values("tanggal")
            df["rolling_std_14d"] = df_sorted.groupby("pasar_id")["price_current"].transform(
                lambda s: s.rolling(14, min_periods=3).std()
            ).fillna(0.0)
        else:
            df["rolling_std_14d"] = 0.0

    if "rolling_std_30d" not in df.columns:
        if len(df) > 30:
            df_sorted = df.sort_values("tanggal")
            df["rolling_std_30d"] = df_sorted.groupby("pasar_id")["price_current"].transform(
                lambda s: s.rolling(30, min_periods=5).std()
            ).fillna(0.0)
        else:
            df["rolling_std_30d"] = df["rolling_std_14d"]

    # Ensure numeric types
    for col in ["price_current", "price_lag_7", "rolling_std_7d", "rolling_std_14d", "rolling_std_30d", "harga_prediksi"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    # Call compute_early_warning_scores directly (DRY compliance & 20-20-20-40 weighting)
    df_scores = compute_early_warning_scores(df_current_features=df, df_forecasts=df)

    skor_tren = df_scores["skor_tren"].values
    skor_vol = df_scores["skor_volatilitas"].values
    skor_anomali = df_scores["skor_anomali"].values
    skor_pred = df_scores["skor_prediksi"].values
    total_skor = df_scores["total_skor"].values
    status_warning = df_scores["status_warning"].values

    # Resolve market names from dim_pasar.csv if present
    from pathlib import Path
    dim_pasar_path = Path(__file__).resolve().parent.parent.parent / "data" / "processed" / "dim_pasar.csv"
    if dim_pasar_path.exists():
        try:
            df_pasar = pd.read_csv(dim_pasar_path)
            pasar_map = dict(zip(df_pasar["pasar_id"], df_pasar["nama_pasar"]))
            nama_pasar = df["pasar_id"].map(pasar_map).fillna(df["pasar_id"].astype(str))
        except Exception:
            nama_pasar = df["pasar_id"].astype(str)
    else:
        nama_pasar = df["pasar_id"].astype(str)

    # Date formatting
    if pd.api.types.is_datetime64_any_dtype(df["tanggal"]):
        tanggal_str = df["tanggal"].dt.strftime("%Y-%m-%d")
    else:
        tanggal_str = df["tanggal"].astype(str)

    res_dict = {
        "tanggal": tanggal_str,
        "pasar_id": df["pasar_id"].astype(int),
        "nama_pasar": nama_pasar,
        "komoditas_id": df["komoditas_id"].astype(int),
    }

    if "tanggal_origin" in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df["tanggal_origin"]):
            res_dict["tanggal_origin"] = df["tanggal_origin"].dt.strftime("%Y-%m-%d")
        else:
            res_dict["tanggal_origin"] = df["tanggal_origin"].astype(str)

    if "harga_aktual" in df.columns:
        res_dict["harga_aktual"] = np.round(df["harga_aktual"]).astype(int)

    if "price_current" in df.columns:
        res_dict["price_current"] = np.round(df["price_current"]).astype(int)

    res_dict["harga_prediksi"] = np.round(df["harga_prediksi"]).astype(int)
    res_dict["skor_tren"] = skor_tren.astype(int)
    res_dict["skor_volatilitas"] = skor_vol.astype(int)
    res_dict["skor_anomali"] = skor_anomali.astype(int)
    res_dict["skor_prediksi"] = skor_pred.astype(int)
    res_dict["total_skor"] = total_skor.astype(int)
    res_dict["status_warning"] = status_warning

    df_result = pd.DataFrame(res_dict)
    return df_result.sort_values(["tanggal", "pasar_id"]).reset_index(drop=True)


def evaluate_ews_performance(
    df_ews_summary: pd.DataFrame,
    spike_threshold_pct: float = 10.0,
    alarm_level: Union[str, List[str]] = "TINGGI",
    horizon_days: int = 7
) -> pd.DataFrame:
    """Evaluates EWS performance metrics (Recall, False Alarm Rate, Lead Time) against historical outcomes.

    Per Section 3 of docs/EWS_methodology.md:
    1. Ground Truth Crisis: Actual price realized at horizon increased >= spike_threshold_pct
       compared to base price (price_current).
    2. Alarm Triggered: System issued status_warning in alarm_level (default: 'TINGGI').

    Parameters
    ----------
    df_ews_summary : pd.DataFrame
        DataFrame from generate_ews_summary_dataframe containing 'harga_aktual', 'harga_prediksi',
        'status_warning', and ideally 'price_current'.
    spike_threshold_pct : float
        Percentage threshold for defining an actual price crisis (default: 10.0%).
    alarm_level : str or list of str
        Warning status level(s) considered as triggering an alert (default: 'TINGGI').
    horizon_days : int
        Forecasting horizon lead time in days (default: 7).

    Returns
    -------
    pd.DataFrame
        Performance scorecard including Recall, False Alarm Rate (FAR), Precision,
        and Lead Time with SOP target comparisons.
    """
    if df_ews_summary.empty:
        return pd.DataFrame(columns=["Metrik", "Nilai", "Target SOP", "Status"])

    df = df_ews_summary.copy()

    # Determine ground truth price movement
    if "price_current" in df.columns and "harga_aktual" in df.columns:
        actual_change_pct = ((df["harga_aktual"] - df["price_current"]) / (df["price_current"] + 1e-5)) * 100
    elif "harga_aktual" in df.columns:
        df_sorted = df.sort_values(["pasar_id", "tanggal"])
        actual_change_pct = df_sorted.groupby("pasar_id")["harga_aktual"].pct_change(1) * 100
        actual_change_pct = actual_change_pct.fillna(0.0)
    else:
        actual_change_pct = pd.Series(0.0, index=df.index)

    actual_crisis = actual_change_pct >= spike_threshold_pct

    alarm_set = {alarm_level} if isinstance(alarm_level, str) else set(alarm_level)
    predicted_alarm = df["status_warning"].isin(alarm_set)

    tp = int((predicted_alarm & actual_crisis).sum())
    fn = int((~predicted_alarm & actual_crisis).sum())
    fp = int((predicted_alarm & ~actual_crisis).sum())
    tn = int((~predicted_alarm & ~actual_crisis).sum())

    recall = (tp / (tp + fn) * 100) if (tp + fn) > 0 else (100.0 if fn == 0 and tp == 0 else 0.0)
    far = (fp / (tp + fp) * 100) if (tp + fp) > 0 else 0.0
    precision = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0.0

    recall_status = "MEMENUHI TARGET" if recall >= 90.0 else "PERLU PENYESUAIAN"
    far_status = "MEMENUHI TARGET" if far <= 20.0 else "PERLU PENYESUAIAN"
    lead_status = "MEMENUHI TARGET" if horizon_days >= 5 else "DI BAWAH TARGET"

    scorecard = [
        {"Metrik": "Recall (Sensitivitas Krisis)", "Nilai": f"{recall:.1f}%", "Target SOP": ">= 90.0%", "Status": recall_status},
        {"Metrik": "False Alarm Rate (FAR)", "Nilai": f"{far:.1f}%", "Target SOP": "<= 20.0%", "Status": far_status},
        {"Metrik": "Lead Time Peringatan", "Nilai": f"{horizon_days} Hari (H+{horizon_days})", "Target SOP": ">= 5 - 7 Hari", "Status": lead_status},
        {"Metrik": "Precision", "Nilai": f"{precision:.1f}%", "Target SOP": "N/A", "Status": "INFO"},
        {"Metrik": "True Positives (Krisis Terdeteksi)", "Nilai": str(tp), "Target SOP": "N/A", "Status": "INFO"},
        {"Metrik": "False Negatives (Krisis Luput)", "Nilai": str(fn), "Target SOP": "Minimal (0)", "Status": "INFO"},
        {"Metrik": "False Positives (Alarm Palsu)", "Nilai": str(fp), "Target SOP": "Minimal", "Status": "INFO"},
        {"Metrik": "Total Observasi Evaluasi", "Nilai": str(len(df)), "Target SOP": "N/A", "Status": "INFO"}
    ]

    return pd.DataFrame(scorecard)

