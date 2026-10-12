"""Evaluation metrics and error analysis toolkit for HargaWatch Surabaya.

Provides:
1. Core Evaluation Metrics: WAPE, MAE, RMSE, sMAPE, PICP, Directional Accuracy.
2. Error Analysis Toolkit: Directional error breakdown and bias/asymmetry calculations.
3. Residual Diagnostics: Matplotlib plotting utilities for error distribution and autocorrelation.
"""

from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


# =====================================================================
# 1. CORE EVALUATION METRICS
# =====================================================================

def compute_wape(
    y_true: Union[np.ndarray, pd.Series, List[float]],
    y_pred: Union[np.ndarray, pd.Series, List[float]],
    eps: float = 1e-5
) -> float:
    """Computes Weighted Absolute Percentage Error (WAPE).
    
    Formula: WAPE = (sum(|y_true - y_pred|) / (sum(y_true) + eps)) * 100
    
    Parameters
    ----------
    y_true : array-like
        Ground truth commodity prices.
    y_pred : array-like
        Forecasted commodity prices.
    eps : float
        Numerical epsilon to prevent zero division.
        
    Returns
    -------
    float
        WAPE percentage (e.g., 8.45).
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) == 0:
        return 0.0
    return round(float(np.sum(np.abs(yt - yp)) / (np.sum(yt) + eps) * 100), 2)


def compute_mae(
    y_true: Union[np.ndarray, pd.Series, List[float]],
    y_pred: Union[np.ndarray, pd.Series, List[float]]
) -> float:
    """Computes Mean Absolute Error (MAE) in currency units (Rupiah).
    
    Formula: MAE = mean(|y_true - y_pred|)
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) == 0:
        return 0.0
    return round(float(np.mean(np.abs(yt - yp))), 2)


def compute_rmse(
    y_true: Union[np.ndarray, pd.Series, List[float]],
    y_pred: Union[np.ndarray, pd.Series, List[float]]
) -> float:
    """Computes Root Mean Squared Error (RMSE) in currency units (Rupiah).
    
    Formula: RMSE = sqrt(mean((y_true - y_pred)^2))
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) == 0:
        return 0.0
    return round(float(np.sqrt(np.mean((yt - yp) ** 2))), 2)


def compute_smape(
    y_true: Union[np.ndarray, pd.Series, List[float]],
    y_pred: Union[np.ndarray, pd.Series, List[float]],
    eps: float = 1e-5
) -> float:
    """Computes Symmetric Mean Absolute Percentage Error (sMAPE).
    
    Formula: sMAPE = mean(|y_true - y_pred| / ((|y_true| + |y_pred|)/2 + eps)) * 100
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) == 0:
        return 0.0
    denominator = (np.abs(yt) + np.abs(yp)) / 2.0 + eps
    return round(float(np.mean(np.abs(yt - yp) / denominator) * 100), 2)


def compute_picp(
    y_true: Union[np.ndarray, pd.Series, List[float]],
    lower: Union[np.ndarray, pd.Series, List[float]],
    upper: Union[np.ndarray, pd.Series, List[float]]
) -> float:
    """Computes Prediction Interval Coverage Probability (PICP).
    
    Measures the empirical percentage of actual values falling inside [lower, upper].
    Target coverage for 80% intervals (p10 to p90) is ideally ~80%.
    
    Parameters
    ----------
    y_true : array-like
        Actual prices.
    lower : array-like
        Lower bound predictions (e.g. p10).
    upper : array-like
        Upper bound predictions (e.g. p90).
        
    Returns
    -------
    float
        Coverage percentage (0.0 to 100.0).
    """
    yt = np.asarray(y_true, dtype=float)
    low = np.asarray(lower, dtype=float)
    high = np.asarray(upper, dtype=float)
    if len(yt) == 0:
        return 0.0
    covered = np.sum((yt >= low) & (yt <= high))
    return round(float((covered / len(yt)) * 100), 2)


def compute_directional_accuracy(
    y_true: Union[np.ndarray, pd.Series, List[float]],
    y_pred: Union[np.ndarray, pd.Series, List[float]],
    y_origin: Optional[Union[np.ndarray, pd.Series, List[float]]] = None
) -> float:
    """Computes Directional Accuracy (DA) relative to origin price.
    
    Formula: DA = mean(sign(y_true - y_origin) == sign(y_pred - y_origin)) * 100
    If y_origin is not provided, uses lag-1 of y_true.
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) == 0:
        return 0.0
        
    if y_origin is None:
        if len(yt) > 1:
            yo = np.empty_like(yt)
            yo[0] = yt[0]
            yo[1:] = yt[:-1]
        else:
            yo = yt.copy()
    else:
        yo = np.asarray(y_origin, dtype=float)

    actual_dir = np.sign(yt - yo)
    pred_dir = np.sign(yp - yo)
    return round(float(np.mean(actual_dir == pred_dir) * 100), 2)


def compute_metrics(
    y_true: Union[np.ndarray, pd.Series, List[float]],
    y_pred: Union[np.ndarray, pd.Series, List[float]],
    y_origin: Optional[Union[np.ndarray, pd.Series, List[float]]] = None,
    lower: Optional[Union[np.ndarray, pd.Series, List[float]]] = None,
    upper: Optional[Union[np.ndarray, pd.Series, List[float]]] = None
) -> Dict[str, float]:
    """Computes comprehensive time-series forecasting metrics dictionary."""
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)

    metrics = {
        "MAE (Rp)": compute_mae(yt, yp),
        "RMSE (Rp)": compute_rmse(yt, yp),
        "WAPE (%)": compute_wape(yt, yp),
        "sMAPE (%)": compute_smape(yt, yp)
    }

    if y_origin is not None:
        yo = np.asarray(y_origin, dtype=float)
        metrics["Directional Accuracy (%)"] = compute_directional_accuracy(yt, yp, yo)

    if lower is not None and upper is not None:
        metrics["PICP (%)"] = compute_picp(yt, lower, upper)

    return metrics


# =====================================================================
# 2. ERROR ANALYSIS & ASYMMETRY TOOLKIT
# =====================================================================

def calculate_bias(
    y_true: Union[np.ndarray, pd.Series, List[float]],
    y_pred: Union[np.ndarray, pd.Series, List[float]],
    eps: float = 1e-5
) -> Dict[str, Union[float, str]]:
    """Calculates forecast bias and asymmetry indicators.
    
    Evaluates whether the model exhibits systematic under-prediction
    (y_pred < y_true) or over-prediction (y_pred > y_true).
    
    Returns
    -------
    Dict[str, Union[float, str]]
        - mean_bias: Mean forecast error (y_pred - y_true) in Rupiah.
        - median_bias: Median forecast error in Rupiah.
        - under_predict_pct: % of observations where forecast was lower than actual.
        - over_predict_pct: % of observations where forecast was higher than actual.
        - exact_pct: % of observations where forecast matched actual exactly.
        - mpe_pct: Mean Percentage Error ((y_pred - y_true) / y_true) * 100.
        - bias_tendency: Diagnostic summary ("Under-predicting", "Over-predicting", "Balanced").
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    n = len(yt)
    if n == 0:
        return {
            "mean_bias": 0.0,
            "median_bias": 0.0,
            "under_predict_pct": 0.0,
            "over_predict_pct": 0.0,
            "exact_pct": 0.0,
            "mpe_pct": 0.0,
            "bias_tendency": "No data"
        }

    errors = yp - yt  # Positive = over-predicted, Negative = under-predicted
    under_count = int(np.sum(yp < yt))
    over_count = int(np.sum(yp > yt))
    exact_count = int(np.sum(yp == yt))

    under_pct = round((under_count / n) * 100, 2)
    over_pct = round((over_count / n) * 100, 2)
    exact_pct = round((exact_count / n) * 100, 2)

    mean_bias = round(float(np.mean(errors)), 2)
    median_bias = round(float(np.median(errors)), 2)
    mpe = round(float(np.mean(errors / (np.abs(yt) + eps) * 100)), 2)

    if under_pct >= 55.0:
        tendency = "Under-predicting"
    elif over_pct >= 55.0:
        tendency = "Over-predicting"
    else:
        tendency = "Balanced"

    return {
        "mean_bias": mean_bias,
        "median_bias": median_bias,
        "under_predict_pct": under_pct,
        "over_predict_pct": over_pct,
        "exact_pct": exact_pct,
        "mpe_pct": mpe,
        "bias_tendency": tendency
    }


def analyze_directional_errors(
    y_true: Union[np.ndarray, pd.Series, List[float]],
    y_pred: Union[np.ndarray, pd.Series, List[float]],
    y_origin: Optional[Union[np.ndarray, pd.Series, List[float]]] = None
) -> Dict[str, Union[float, int]]:
    """Analyzes directional accuracy and asymmetric error patterns.
    
    Categorizes movements into UP, DOWN, and FLAT, and calculates
    conditional accuracy rates and false alarm rates.
    If y_origin is not provided, defaults to lag-1 of y_true.
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    n = len(yt)

    if n == 0:
        return {
            "total_samples": 0,
            "directional_accuracy_pct": 0.0,
            "up_accuracy_pct": 0.0,
            "down_accuracy_pct": 0.0,
            "actual_up_count": 0,
            "actual_down_count": 0,
            "actual_flat_count": 0,
            "false_alarm_up_count": 0,
            "missed_up_count": 0
        }

    if y_origin is None:
        if n > 1:
            yo = np.empty_like(yt)
            yo[0] = yt[0]
            yo[1:] = yt[:-1]
        else:
            yo = yt.copy()
    else:
        yo = np.asarray(y_origin, dtype=float)

    actual_diff = yt - yo
    pred_diff = yp - yo

    actual_up = actual_diff > 0
    actual_down = actual_diff < 0
    actual_flat = actual_diff == 0

    pred_up = pred_diff > 0
    pred_down = pred_diff < 0
    pred_flat = pred_diff == 0

    da_pct = compute_directional_accuracy(yt, yp, yo)

    up_count = int(np.sum(actual_up))
    down_count = int(np.sum(actual_down))
    flat_count = int(np.sum(actual_flat))

    up_acc = round(float(np.sum(actual_up & pred_up) / max(up_count, 1) * 100), 2)
    down_acc = round(float(np.sum(actual_down & pred_down) / max(down_count, 1) * 100), 2)

    # False alarm UP: Predicted UP but actual was FLAT or DOWN
    false_alarm_up = int(np.sum(pred_up & (~actual_up)))
    # Missed UP: Actual was UP but predicted was FLAT or DOWN
    missed_up = int(np.sum(actual_up & (~pred_up)))

    return {
        "total_samples": n,
        "directional_accuracy_pct": da_pct,
        "up_accuracy_pct": up_acc,
        "down_accuracy_pct": down_acc,
        "actual_up_count": up_count,
        "actual_down_count": down_count,
        "actual_flat_count": flat_count,
        "false_alarm_up_count": false_alarm_up,
        "missed_up_count": missed_up
    }


# =====================================================================
# 3. RESIDUAL DIAGNOSTICS PLOTTING
# =====================================================================

def plot_residual_diagnostics(
    df_predictions: pd.DataFrame,
    figsize: Tuple[int, int] = (14, 5)
) -> plt.Figure:
    """Plots residual diagnostics (distribution & autocorrelation).
    
    Parameters
    ----------
    df_predictions : pd.DataFrame
        Must contain 'harga_aktual' and 'harga_prediksi' (or 'y_true' and 'y_pred' or 'actual' and 'predicted').
    figsize : Tuple[int, int]
        Figure size in inches (default: (14, 5)).
        
    Returns
    -------
    matplotlib.figure.Figure
        Configured matplotlib Figure ready for display in Jupyter.
    """
    df = df_predictions.copy()
    if "harga_aktual" in df.columns and "harga_prediksi" in df.columns:
        yt = df["harga_aktual"].values
        yp = df["harga_prediksi"].values
    elif "y_true" in df.columns and "y_pred" in df.columns:
        yt = df["y_true"].values
        yp = df["y_pred"].values
    elif "actual" in df.columns and "predicted" in df.columns:
        yt = df["actual"].values
        yp = df["predicted"].values
    else:
        raise ValueError("df_predictions must contain 'harga_aktual' and 'harga_prediksi' columns.")

    residuals = yt - yp  # Actual - Predicted
    n = len(residuals)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=figsize)

    if n == 0:
        ax1.text(0.5, 0.5, "Data Prediksi Kosong", ha="center", va="center", transform=ax1.transAxes)
        ax2.text(0.5, 0.5, "Data Prediksi Kosong", ha="center", va="center", transform=ax2.transAxes)
        ax1.set_title("Distribusi Galat Residual", fontsize=12, fontweight="bold")
        ax2.set_title("Autokorelasi Residual (ACF)", fontsize=12, fontweight="bold")
        plt.tight_layout()
        return fig

    mean_res = float(np.mean(residuals))
    std_res = float(np.std(residuals))

    # 1. Residual Distribution Histogram
    num_bins = min(30, max(5, n // 5)) if n >= 5 else max(2, n)
    counts, bins, _ = ax1.hist(
        residuals,
        bins=num_bins,
        color="#2b5c8f",
        edgecolor="white",
        alpha=0.8,
        density=True if n >= 5 else False
    )
    
    # Normal curve overlay
    if std_res > 0 and n >= 5:
        x_norm = np.linspace(residuals.min(), residuals.max(), 200)
        p_norm = (1.0 / (std_res * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x_norm - mean_res) / std_res) ** 2)
        ax1.plot(x_norm, p_norm, color="#e6550d", lw=2, label=f"Normal Fit (σ={std_res:.0f})")

    ax1.axvline(0, color="red", linestyle="--", lw=1.5, label="Zero Error")
    ax1.axvline(mean_res, color="gold", linestyle=":", lw=1.5, label=f"Mean Error ({mean_res:+.0f})")
    ax1.set_title("Distribusi Galat Residual (Aktual - Prediksi)", fontsize=12, fontweight="bold")
    ax1.set_xlabel("Galat Residual (Rp)", fontsize=10)
    ax1.set_ylabel("Kerapatan (Density)" if n >= 5 else "Frekuensi", fontsize=10)
    ax1.legend(loc="upper right", frameon=True)
    ax1.grid(True, linestyle="--", alpha=0.5)

    # 2. Residual Autocorrelation (ACF)
    # If panel multi-market data, aggregate by evaluation date to preserve time structure
    df["_res"] = residuals
    if "tanggal" in df.columns:
        if "pasar_id" in df.columns and df["pasar_id"].nunique() > 1:
            df_date = df.groupby("tanggal", as_index=False)["_res"].mean().sort_values("tanggal")
            res_series = df_date["_res"].values
        else:
            df_sorted = df.sort_values("tanggal")
            res_series = df_sorted["_res"].values
    else:
        res_series = residuals

    n_time = len(res_series)
    if n_time < 3:
        ax2.text(0.5, 0.5, f"Observasi temporal tidak cukup untuk ACF (N={n_time} < 3)", ha="center", va="center", transform=ax2.transAxes)
        ax2.set_title("Autokorelasi Residual (ACF)", fontsize=12, fontweight="bold")
    else:
        max_lags = min(15, max(1, n_time // 2))
        lags = np.arange(1, max_lags + 1)
        autocorrs = []
        
        res_centered = res_series - np.mean(res_series)
        denom = np.sum(res_centered ** 2) + 1e-10

        for lag in lags:
            r = np.sum(res_centered[:-lag] * res_centered[lag:]) / denom
            autocorrs.append(float(r))

        ax2.bar(lags, autocorrs, color="#3182bd", width=0.4, alpha=0.85, label="Autokorelasi (r_k)")
        ax2.axhline(0, color="black", lw=1)

        # 95% Bartlett confidence bands: +/- 1.96 / sqrt(N_time)
        conf_band = 1.96 / np.sqrt(max(n_time, 1))
        ax2.axhline(conf_band, color="red", linestyle="--", lw=1.2, label=f"95% CI (±{conf_band:.2f})")
        ax2.axhline(-conf_band, color="red", linestyle="--", lw=1.2)

        ax2.set_title("Autokorelasi Residual (ACF)", fontsize=12, fontweight="bold")
        ax2.set_xlabel("Lag Deret Waktu (Jeda Evaluasi)", fontsize=10)
        ax2.set_ylabel("Nilai Autokorelasi", fontsize=10)
        ax2.set_ylim(-1.05, 1.05)
        ax2.legend(loc="upper right", frameon=True)
        ax2.grid(True, linestyle="--", alpha=0.5)

    plt.tight_layout()
    return fig
