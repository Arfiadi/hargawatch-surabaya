"""Statistical and Market Price Anomaly Detection for HargaWatch Surabaya.

Provides robust statistical outlier and anomaly detectors:
1. Rolling Z-Score: Identifies deviations exceeding 3.0 sigma from a local moving window.
2. Interquartile Range (Tukey's Fences): Identifies values beyond Q1 - 1.5*IQR and Q3 + 1.5*IQR.
3. Day-over-Day Price Jump: Identifies sharp sudden daily swings (e.g. > 40%) characteristic of data entry errors.
"""

from typing import Dict, Optional, Tuple, Union
import numpy as np
import pandas as pd


class MarketPriceAnomalyDetector:
    """Statistical detector for price spikes, reporting anomalies, and supply shocks."""

    def __init__(
        self,
        rolling_window: int = 14,
        z_threshold: float = 3.0,
        jump_threshold_pct: float = 0.40,
        iqr_multiplier: float = 1.5
    ):
        self.rolling_window = rolling_window
        self.z_threshold = z_threshold
        self.jump_threshold_pct = jump_threshold_pct
        self.iqr_multiplier = iqr_multiplier

    def detect_rolling_zscore(
        self,
        series: pd.Series,
        window: Optional[int] = None,
        threshold: Optional[float] = None
    ) -> pd.Series:
        """Flags rows where absolute rolling z-score exceeds threshold.

        Uses shift(1) for zero lookahead bias when estimating the mean and std.
        """
        w = window or self.rolling_window
        th = threshold or self.z_threshold

        # Shift by 1 so the current observation does not inflate its own mean/std
        shifted = series.shift(1)
        r_mean = shifted.rolling(window=w, min_periods=max(3, w // 3)).mean()
        r_std = shifted.rolling(window=w, min_periods=max(3, w // 3)).std()

        # Handle zero standard deviation to prevent division by zero
        r_std_safe = r_std.replace(0.0, np.nan)
        z_score = (series - r_mean) / r_std_safe

        return z_score.abs() >= th

    def detect_iqr_outliers(
        self,
        series: pd.Series,
        multiplier: Optional[float] = None
    ) -> pd.Series:
        """Flags observations that fall outside Tukey's fences [Q1 - k*IQR, Q3 + k*IQR]."""
        k = multiplier or self.iqr_multiplier
        clean_s = series.dropna()
        if len(clean_s) < 5:
            return pd.Series(False, index=series.index)

        q25 = clean_s.quantile(0.25)
        q75 = clean_s.quantile(0.75)
        iqr = q75 - q25

        if iqr <= 0:
            return pd.Series(False, index=series.index)

        lower_bound = q25 - k * iqr
        upper_bound = q75 + k * iqr

        return (series < lower_bound) | (series > upper_bound)

    def detect_day_over_day_jump(
        self,
        series: pd.Series,
        threshold_pct: Optional[float] = None
    ) -> pd.Series:
        """Flags single-day percentage changes exceeding threshold_pct."""
        th = threshold_pct or self.jump_threshold_pct
        pct_change = series.pct_change(fill_method=None)
        return pct_change.abs() >= th

    def scan_dataframe(
        self,
        df: pd.DataFrame,
        price_col: str = "harga",
        group_cols: Optional[list] = None
    ) -> pd.DataFrame:
        """Runs multi-metric anomaly scan across panel/grouped time-series.

        Returns DataFrame with boolean anomaly columns and severity indicator.
        """
        out_df = df.copy()
        groups = group_cols or (["pasar_id", "komoditas_id"] if {"pasar_id", "komoditas_id"}.issubset(df.columns) else None)

        def _scan_group(s: pd.Series) -> pd.DataFrame:
            z_flag = self.detect_rolling_zscore(s)
            iqr_flag = self.detect_iqr_outliers(s)
            jump_flag = self.detect_day_over_day_jump(s)
            is_anomaly = z_flag | iqr_flag | jump_flag
            return pd.DataFrame({
                "is_zscore_anomaly": z_flag,
                "is_iqr_outlier": iqr_flag,
                "is_jump_anomaly": jump_flag,
                "is_price_anomaly": is_anomaly
            }, index=s.index)

        if groups:
            flags = out_df.groupby(groups, group_keys=False)[price_col].apply(_scan_group)
        else:
            flags = _scan_group(out_df[price_col])

        for col in flags.columns:
            out_df[col] = flags[col]

        return out_df
