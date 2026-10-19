"""EDA Helper Functions for HargaWatch Surabaya.

Provides standardized, modular data audit, statistical testing, time-series decomposition,
and visualization utilities to support decision-driven exploratory data analysis across all
commodity groups without code duplication (DRY Principle).
"""

import warnings
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.stattools import adfuller, kpss, acf, pacf
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.seasonal import seasonal_decompose

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PROCESSED = BASE_DIR / "data" / "processed"
DATA_EXTERNAL = BASE_DIR / "data" / "external"


# =============================================================================
# 1. DATA LOADING & ENRICHMENT
# =============================================================================

def load_cleaned_market_data(
    include_calendar: bool = True,
    include_weather: bool = False
) -> pd.DataFrame:
    """Loads fact_harga_pasar enriched with dim_pasar and dim_komoditas.
    
    Optionally joins dim_kalender and fact_cuaca.
    """
    path_harga = DATA_PROCESSED / "fact_harga_pasar.csv"
    path_pasar = DATA_PROCESSED / "dim_pasar.csv"
    path_kom = DATA_PROCESSED / "dim_komoditas.csv"
    path_kal = DATA_PROCESSED / "dim_kalender.csv"
    path_cuaca = DATA_PROCESSED / "fact_cuaca.csv"
    if not path_cuaca.exists():
        path_cuaca = DATA_EXTERNAL / "cuaca" / "cuaca_surabaya.csv"

    if not path_harga.exists():
        raise FileNotFoundError(f"Processed price data not found at {path_harga}")

    df_harga = pd.read_csv(path_harga, parse_dates=["tanggal"])
    
    # Merge dim_pasar
    if path_pasar.exists():
        df_pasar = pd.read_csv(path_pasar)
        # Rename lat/lon if needed
        cols_p = {c: c for c in df_pasar.columns}
        if "lat" in df_pasar.columns:
            cols_p["lat"] = "latitude"
        if "lon" in df_pasar.columns:
            cols_p["lon"] = "longitude"
        df_pasar = df_pasar.rename(columns=cols_p)
        df_merged = df_harga.merge(df_pasar, on="pasar_id", how="left")
    else:
        df_merged = df_harga.copy()

    # Merge dim_komoditas
    if path_kom.exists():
        df_kom = pd.read_csv(path_kom)
        col_k = "nama_komoditas" if "nama_komoditas" in df_kom.columns else "komoditas"
        if "nama_komoditas" not in df_kom.columns:
            df_kom["nama_komoditas"] = df_kom[col_k]
        df_merged = df_merged.merge(df_kom, on="komoditas_id", how="left")

    # Merge calendar
    if include_calendar and path_kal.exists():
        df_kal = pd.read_csv(path_kal, parse_dates=["tanggal"])
        df_merged = df_merged.merge(df_kal, on="tanggal", how="left")

    # Merge weather
    if include_weather and path_cuaca.exists():
        df_cuaca = pd.read_csv(path_cuaca, parse_dates=["tanggal"])
        df_merged = df_merged.merge(df_cuaca, on="tanggal", how="left")

    return df_merged


# =============================================================================
# 2. DATA QUALITY AUDIT FUNCTIONS (FASE 0 / D1, D2, D3)
# =============================================================================

def audit_imputation_streaks(df: pd.DataFrame) -> Dict[str, Any]:
    """Audits consecutive runs of is_imputed == True per (pasar_id, komoditas_id).
    
    Validates whether the 7-day bounded forward-fill limit holds (Decision D1).
    """
    df_sorted = df.sort_values(by=["pasar_id", "komoditas_id", "tanggal"]).copy()
    
    streak_records = []
    for (pid, cid), group in df_sorted.groupby(["pasar_id", "komoditas_id"]):
        is_imp = group["is_imputed"].values
        # Compute streak lengths of True
        streak = 0
        for val in is_imp:
            if val:
                streak += 1
            else:
                if streak > 0:
                    streak_records.append({"pasar_id": pid, "komoditas_id": cid, "streak_length": streak})
                    streak = 0
        if streak > 0:
            streak_records.append({"pasar_id": pid, "komoditas_id": cid, "streak_length": streak})
            
    df_streaks = pd.DataFrame(streak_records)
    if df_streaks.empty:
        return {
            "total_imputed_streaks": 0,
            "max_streak_length": 0,
            "streaks_exceeding_7d": 0,
            "is_zombie_free": True,
            "distribution": pd.Series(dtype=int),
            "df_streaks": pd.DataFrame()
        }
    
    max_len = int(df_streaks["streak_length"].max())
    exceeding = int((df_streaks["streak_length"] > 7).sum())
    dist = df_streaks["streak_length"].value_counts().sort_index()

    return {
        "total_imputed_streaks": len(df_streaks),
        "max_streak_length": max_len,
        "streaks_exceeding_7d": exceeding,
        "is_zombie_free": exceeding == 0,
        "distribution": dist,
        "df_streaks": df_streaks
    }


def audit_market_completeness(df: pd.DataFrame) -> pd.DataFrame:
    """Computes reporting completeness, raw vs imputed counts per market (Decision D2)."""
    records = []
    
    total_dates = df["tanggal"].nunique()
    total_commodities = df["komoditas_id"].nunique()
    expected_per_market = total_dates * total_commodities

    for pid, group in df.groupby("pasar_id"):
        nama_pasar = group["nama_pasar"].iloc[0] if "nama_pasar" in group.columns else f"Pasar_{pid}"
        total_rows = len(group)
        raw_valid = int(group["harga_asli"].notna().sum())
        imputed = int(group["is_imputed"].sum())
        imputed_pct = (imputed / total_rows * 100) if total_rows > 0 else 0.0
        active_commodities = group["komoditas_id"].nunique()
        date_min = group["tanggal"].min().strftime("%Y-%m-%d")
        date_max = group["tanggal"].max().strftime("%Y-%m-%d")

        records.append({
            "pasar_id": pid,
            "nama_pasar": nama_pasar,
            "rentang_tanggal": f"{date_min} s/d {date_max}",
            "komoditas_aktif": active_commodities,
            "total_baris": total_rows,
            "harga_asli_valid": raw_valid,
            "harga_imputasi": imputed,
            "persentase_imputasi (%)": round(imputed_pct, 2),
            "kelengkapan_vs_maks (%)": round(total_rows / expected_per_market * 100, 2)
        })

    return pd.DataFrame(records).sort_values("pasar_id").reset_index(drop=True)


def audit_commodity_sparsity(df: pd.DataFrame) -> pd.DataFrame:
    """Analyzes data availability per commodity across all markets (Decision D3)."""
    records = []
    total_dates = df["tanggal"].nunique()
    total_markets = df["pasar_id"].nunique()
    max_possible = total_dates * total_markets

    for cid, group in df.groupby("komoditas_id"):
        nama = group["nama_komoditas"].iloc[0] if "nama_komoditas" in group.columns else f"Komoditas_{cid}"
        grup = group["grup"].iloc[0] if "grup" in group.columns else "Unknown"
        total_rows = len(group)
        raw_valid = int(group["harga_asli"].notna().sum())
        imputed = int(group["is_imputed"].sum())
        imputed_pct = (imputed / total_rows * 100) if total_rows > 0 else 0.0
        coverage_pct = (total_rows / max_possible * 100) if max_possible > 0 else 0.0

        records.append({
            "komoditas_id": cid,
            "nama_komoditas": nama,
            "grup": grup,
            "total_observasi": total_rows,
            "harga_asli_valid": raw_valid,
            "imputasi_count": imputed,
            "imputasi_pct (%)": round(imputed_pct, 2),
            "cakupan_pasar_waktu (%)": round(coverage_pct, 2),
            "status_rekomendasi": "DROP (>90% kosong)" if coverage_pct < 10.0 else "RETAIN (Aktif)"
        })

    return pd.DataFrame(records).sort_values("cakupan_pasar_waktu (%)", ascending=False).reset_index(drop=True)


def audit_commodity_missing_table(df: pd.DataFrame) -> pd.DataFrame:
    """Generates an exhaustive table of missing raw prices, percentages, and imputation
    statistics for each of the 37 commodities.
    """
    records = []
    for cid, group in df.groupby("komoditas_id"):
        nama = group["nama_komoditas"].iloc[0] if "nama_komoditas" in group.columns else f"Komoditas_{cid}"
        grup = group["grup"].iloc[0] if "grup" in group.columns else "Unknown"
        total_rows = len(group)
        missing_raw = int(group["harga_asli"].isna().sum())
        missing_pct = (missing_raw / total_rows * 100) if total_rows > 0 else 0.0
        imputed_count = int(group["is_imputed"].sum())
        imputed_pct = (imputed_count / total_rows * 100) if total_rows > 0 else 0.0
        valid_raw = total_rows - missing_raw
        
        records.append({
            "komoditas_id": cid,
            "nama_komoditas": nama,
            "kelompok_pangan": grup,
            "total_observasi": total_rows,
            "harga_asli_valid": valid_raw,
            "jumlah_missing_asli": missing_raw,
            "persentase_missing (%)": round(missing_pct, 2),
            "jumlah_diimputasi": imputed_count,
            "persentase_imputasi (%)": round(imputed_pct, 2),
            "status_kualitas": "Sangat Lengkap (<1% Missing)" if missing_pct < 1.0 else ("Baik (<10% Missing)" if missing_pct < 10.0 else "Perhatian (>10% Missing)")
        })

    return pd.DataFrame(records).sort_values("persentase_missing (%)", ascending=False).reset_index(drop=True)


def detect_price_anomalies(
    df: pd.DataFrame,
    max_price: float = 500_000,
    daily_spike_threshold: float = 0.50
) -> Dict[str, Any]:
    """Detects invalid prices, negative prices, extreme high values, and sudden spikes."""
    df_c = df.copy()
    
    # 1. Non-positive price
    non_positive = df_c[df_c["harga_imputasi"] <= 0]
    
    # 2. Extreme prices
    extreme_high = df_c[df_c["harga_imputasi"] > max_price]
    
    # 3. Daily jump > 50%
    df_c = df_c.sort_values(by=["pasar_id", "komoditas_id", "tanggal"])
    df_c["prev_price"] = df_c.groupby(["pasar_id", "komoditas_id"])["harga_imputasi"].shift(1)
    df_c["pct_change"] = (df_c["harga_imputasi"] - df_c["prev_price"]) / (df_c["prev_price"] + 1e-5)
    
    sudden_spikes = df_c[df_c["pct_change"].abs() > daily_spike_threshold]

    return {
        "non_positive_count": len(non_positive),
        "extreme_high_count": len(extreme_high),
        "sudden_spikes_count": len(sudden_spikes),
        "non_positive_samples": non_positive[["tanggal", "pasar_id", "komoditas_id", "harga_imputasi"]].head(5),
        "extreme_high_samples": extreme_high[["tanggal", "pasar_id", "komoditas_id", "harga_imputasi"]].head(5),
        "sudden_spikes_samples": sudden_spikes[["tanggal", "pasar_id", "komoditas_id", "harga_imputasi", "prev_price", "pct_change"]].head(5),
        "clean_status": (len(non_positive) == 0 and len(extreme_high) == 0)
    }


# =============================================================================
# 3. STATISTICAL & TIME-SERIES ANALYSIS FUNCTIONS
# =============================================================================

def calculate_summary_stats(
    df: pd.DataFrame,
    group_col: str = "nama_komoditas",
    value_col: str = "harga_imputasi"
) -> pd.DataFrame:
    """Calculates standardized statistical profile: Mean, Median, Std, CV, Skewness, Min, Max.
    
    Sorted by Coefficient of Variation (CV) descending to clearly segment volatile vs sticky goods.
    """
    records = []
    for grp_val, grp_df in df.groupby(group_col):
        vals = grp_df[value_col].dropna().values
        if len(vals) == 0:
            continue
        m = float(np.mean(vals))
        s = float(np.std(vals, ddof=1)) if len(vals) > 1 else 0.0
        cv = (s / m * 100) if m > 0 else 0.0
        med = float(np.median(vals))
        p25, p75 = np.percentile(vals, [25, 75])
        skew = float(pd.Series(vals).skew())
        
        records.append({
            group_col: grp_val,
            "Count": len(vals),
            "Mean (Rp)": round(m, 0),
            "Median (Rp)": round(med, 0),
            "Std (Rp)": round(s, 0),
            "CV (%)": round(cv, 2),
            "IQR (Rp)": round(p75 - p25, 0),
            "Skewness": round(skew, 2),
            "Min (Rp)": round(float(np.min(vals)), 0),
            "Max (Rp)": round(float(np.max(vals)), 0),
        })

    return pd.DataFrame(records).sort_values("CV (%)", ascending=False).reset_index(drop=True)


def test_stationarity(series: pd.Series, maxlag: Optional[int] = 14) -> Dict[str, Any]:
    """Runs automated ADF (Augmented Dickey-Fuller) and KPSS tests on a price series."""
    clean_series = series.dropna()
    if len(clean_series) < 20:
        return {"status": "INSUFFICIENT_DATA"}

    # ADF Test (H0: unit root present / non-stationary)
    adf_res = adfuller(clean_series, maxlag=maxlag, autolag="AIC")
    adf_stat, adf_p = adf_res[0], adf_res[1]

    # KPSS Test (H0: stationary around constant or deterministic trend)
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore")
        kpss_res = kpss(clean_series, regression="c", nlags="auto")
    kpss_stat, kpss_p = kpss_res[0], kpss_res[1]

    # Classification
    is_adf_stat = adf_p < 0.05
    is_kpss_stat = kpss_p >= 0.05

    if is_adf_stat and is_kpss_stat:
        conclusion = "STATIONARY (No differencing needed)"
    elif not is_adf_stat and not is_kpss_stat:
        conclusion = "NON-STATIONARY (Unit root, differencing d=1 required)"
    elif is_adf_stat and not is_kpss_stat:
        conclusion = "DIFFERENCE-STATIONARY (Possible structural break)"
    else:
        conclusion = "TREND-STATIONARY (Detrending required)"

    return {
        "adf_stat": round(adf_stat, 4),
        "adf_pvalue": round(adf_p, 4),
        "is_adf_stationary": is_adf_stat,
        "kpss_stat": round(kpss_stat, 4),
        "kpss_pvalue": round(kpss_p, 4),
        "is_kpss_stationary": is_kpss_stat,
        "conclusion": conclusion
    }


def compute_lead_lag_cross_corr(
    df: pd.DataFrame,
    komoditas_id: int,
    lead_market_id: int = 5,
    lag_market_id: Optional[int] = None,
    max_lags: int = 14
) -> pd.DataFrame:
    """Computes cross-correlation function (CCF) between wholesale (Keputran, ID 5)
    and retail market price changes (pct_change_1d) across lags -max_lags to +max_lags (Decision D15).
    """
    df_k = df[df["komoditas_id"] == komoditas_id].copy()
    
    # Pivot to date x market
    pivot_p = df_k.pivot(index="tanggal", columns="pasar_id", values="harga_imputasi")
    
    if lead_market_id not in pivot_p.columns:
        return pd.DataFrame()

    lead_series = pivot_p[lead_market_id].pct_change().dropna()

    if lag_market_id is not None:
        target_series = pivot_p[lag_market_id].pct_change().dropna()
        label = f"Pasar_{lag_market_id}"
    else:
        # Average of all other retail markets
        other_cols = [c for c in pivot_p.columns if c != lead_market_id]
        target_series = pivot_p[other_cols].mean(axis=1).pct_change().dropna()
        label = "Rata2_Pasar_Ritel"

    common_idx = lead_series.index.intersection(target_series.index)
    s_lead = lead_series.loc[common_idx]
    s_target = target_series.loc[common_idx]

    records = []
    for lag in range(-max_lags, max_lags + 1):
        if lag > 0:
            # Lead series shifted backward: lead(t - lag) vs target(t) -> Keputran leads
            c = s_lead.iloc[:-lag].corr(s_target.iloc[lag:])
        elif lag < 0:
            c = s_lead.iloc[-lag:].corr(s_target.iloc[:lag])
        else:
            c = s_lead.corr(s_target)
        records.append({"lag_days": lag, "correlation": round(c, 4), "pair": f"Keputran vs {label}"})

    return pd.DataFrame(records)


def calculate_ramadan_impact(
    df: pd.DataFrame,
    komoditas_ids: Optional[List[int]] = None
) -> pd.DataFrame:
    """Measures price percentage increases during baseline, pra-Ramadan, and Ramadan (Decision D5)."""
    df_c = df.copy()
    if komoditas_ids is not None:
        df_c = df_c[df_c["komoditas_id"].isin(komoditas_ids)]

    records = []
    for cid, group in df_c.groupby("komoditas_id"):
        cname = group["nama_komoditas"].iloc[0] if "nama_komoditas" in group.columns else f"ID_{cid}"
        
        # Ramadan vs non-Ramadan
        p_ramadan = group[group["is_ramadan"] == 1]["harga_imputasi"].mean()
        p_pra_ramadan = group[group["is_pra_ramadan"] == 1]["harga_imputasi"].mean()
        p_normal = group[(group["is_ramadan"] == 0) & (group["is_pra_ramadan"] == 0)]["harga_imputasi"].mean()

        delta_pra = ((p_pra_ramadan - p_normal) / p_normal * 100) if p_normal > 0 else 0.0
        delta_ramadan = ((p_ramadan - p_normal) / p_normal * 100) if p_normal > 0 else 0.0

        records.append({
            "komoditas_id": cid,
            "nama_komoditas": cname,
            "harga_normal_avg": round(p_normal, 0),
            "harga_pra_ramadan_avg": round(p_pra_ramadan, 0),
            "kenaikan_pra_ramadan (%)": round(delta_pra, 2),
            "harga_ramadan_avg": round(p_ramadan, 0),
            "kenaikan_ramadan (%)": round(delta_ramadan, 2),
            "dampak_keagamaan": "TINGGI (>5%)" if max(delta_pra, delta_ramadan) > 5.0 else "RENDAH/STABIL"
        })

    return pd.DataFrame(records).sort_values("kenaikan_ramadan (%)", ascending=False).reset_index(drop=True)


# =============================================================================
# 4. STANDARDIZED PLOTTING UTILITIES
# =============================================================================

def set_eda_style():
    """Sets a clean, publication-grade styling for EDA plots."""
    sns.set_theme(style="whitegrid", font="sans-serif")
    plt.rcParams["figure.figsize"] = (12, 6)
    plt.rcParams["axes.titlesize"] = 14
    plt.rcParams["axes.labelsize"] = 12
    plt.rcParams["xtick.labelsize"] = 10
    plt.rcParams["ytick.labelsize"] = 10


def plot_commodity_time_series(
    df: pd.DataFrame,
    komoditas_id: int,
    market_id: Optional[int] = None,
    ax: Optional[plt.Axes] = None,
    show_rolling: bool = True
) -> plt.Axes:
    """Plots clean time-series trend of price with 30-day moving average."""
    if ax is None:
        fig, ax = plt.subplots(figsize=(14, 5))

    sub = df[df["komoditas_id"] == komoditas_id]
    cname = sub["nama_komoditas"].iloc[0] if "nama_komoditas" in sub.columns else f"Komoditas {komoditas_id}"

    if market_id is not None:
        sub = sub[sub["pasar_id"] == market_id]
        pname = sub["nama_pasar"].iloc[0] if "nama_pasar" in sub.columns else f"Pasar {market_id}"
        title_suffix = f" di {pname}"
    else:
        # City average
        sub = sub.groupby("tanggal")["harga_imputasi"].mean().reset_index()
        title_suffix = " (Rata-rata Kota Surabaya)"

    sub = sub.sort_values("tanggal")
    ax.plot(sub["tanggal"], sub["harga_imputasi"], label="Harga Harian", color="#1f77b4", alpha=0.55, linewidth=1.2)

    if show_rolling:
        sub["ma_30d"] = sub["harga_imputasi"].rolling(30, min_periods=7).mean()
        ax.plot(sub["tanggal"], sub["ma_30d"], label="Tren 30-Hari (Rolling MA)", color="#d62728", linewidth=2.0)

    ax.set_title(f"Tren Harga Historis: {cname}{title_suffix}", fontweight="bold")
    ax.set_xlabel("Tanggal")
    ax.set_ylabel("Harga (Rp)")
    ax.legend(loc="upper left")
    return ax


def plot_market_spread_boxplot(
    df: pd.DataFrame,
    komoditas_id: int,
    ax: Optional[plt.Axes] = None
) -> plt.Axes:
    """Plots grouped boxplot comparing price distribution across the 6 Surabaya markets."""
    if ax is None:
        fig, ax = plt.subplots(figsize=(10, 5))

    sub = df[df["komoditas_id"] == komoditas_id]
    cname = sub["nama_komoditas"].iloc[0] if "nama_komoditas" in sub.columns else f"Komoditas {komoditas_id}"

    market_order = sub.groupby("nama_pasar")["harga_imputasi"].median().sort_values().index

    sns.boxplot(
        data=sub,
        x="nama_pasar",
        y="harga_imputasi",
        order=market_order,
        palette="Blues_r",
        ax=ax,
        fliersize=2
    )

    ax.set_title(f"Sebaran Harga Antar Pasar: {cname} (Urutan Termurah -> Termahal)", fontweight="bold")
    ax.set_xlabel("Pasar")
    ax.set_ylabel("Harga (Rp)")
    ax.tick_params(axis="x", rotation=25)
    return ax


def plot_acf_pacf_analysis(
    series: pd.Series,
    nlags: int = 30,
    title_prefix: str = "Deret Waktu"
) -> Tuple[plt.Figure, pd.DataFrame]:
    """Plots standardized side-by-side ACF and PACF and returns tabular lag values."""
    clean_series = series.dropna()
    fig, axes = plt.subplots(1, 2, figsize=(15, 4.5))

    plot_acf(clean_series, lags=nlags, ax=axes[0], alpha=0.05, color="#1f77b4")
    axes[0].set_title(f"Autocorrelation Function (ACF): {title_prefix}", fontweight="bold")
    axes[0].set_xlabel("Lag (Hari)")
    axes[0].set_ylabel("Autokorelasi")

    plot_pacf(clean_series, lags=nlags, ax=axes[1], alpha=0.05, color="#ff7f0e", method="ywm")
    axes[1].set_title(f"Partial Autocorrelation Function (PACF): {title_prefix}", fontweight="bold")
    axes[1].set_xlabel("Lag (Hari)")
    axes[1].set_ylabel("Korelasi Parsial")

    plt.tight_layout()

    acf_vals = acf(clean_series, nlags=nlags)
    pacf_vals = pacf(clean_series, nlags=nlags, method="ywm")
    df_lags = pd.DataFrame({
        "Lag": range(nlags + 1),
        "ACF": np.round(acf_vals, 4),
        "PACF": np.round(pacf_vals, 4)
    })

    return fig, df_lags


def plot_time_series_decomposition(
    series: pd.Series,
    model: str = "additive",
    period: int = 365,
    title_prefix: str = "Dekomposisi Deret Waktu"
) -> plt.Figure:
    """Performs classical seasonal decomposition (Observed, Trend, Seasonal, Residual)."""
    clean_series = series.dropna().asfreq("D")
    if clean_series.isna().any():
        clean_series = clean_series.interpolate(method="time")

    decomp = seasonal_decompose(clean_series, model=model, period=period)

    fig, axes = plt.subplots(4, 1, figsize=(14, 9), sharex=True)

    axes[0].plot(decomp.observed.index, decomp.observed.values, color="#1f77b4", linewidth=1.2)
    axes[0].set_title(f"{title_prefix} — Observed (Deret Asli)", fontweight="bold", fontsize=11)
    axes[0].set_ylabel("Observed")

    axes[1].plot(decomp.trend.index, decomp.trend.values, color="#d62728", linewidth=1.8)
    axes[1].set_title(f"Trend Component (Siklus Jangka Panjang Bebas Fluktuasi Musiman)", fontweight="bold", fontsize=11)
    axes[1].set_ylabel("Trend")

    axes[2].plot(decomp.seasonal.index, decomp.seasonal.values, color="#2ca02c", linewidth=1.0)
    axes[2].set_title(f"Seasonal Component (Pola Musiman Siklikal, Period = {period} Hari)", fontweight="bold", fontsize=11)
    axes[2].set_ylabel("Seasonal")

    axes[3].scatter(decomp.resid.index, decomp.resid.values, color="#7f7f7f", alpha=0.4, s=6)
    axes[3].axhline(0, color="black", linestyle="--", linewidth=0.8)
    axes[3].set_title(f"Residual / Irregular Component (Supply Shocks & Noise Tak Terduga)", fontweight="bold", fontsize=11)
    axes[3].set_ylabel("Residual")
    axes[3].set_xlabel("Tanggal")

    plt.tight_layout()
    return fig

