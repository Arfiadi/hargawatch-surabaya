"""Unit tests for MarketPriceAnomalyDetector and RobustDataFetcher."""

import numpy as np
import pandas as pd
import pytest

from src.models.anomaly_detector import MarketPriceAnomalyDetector
from src.pipeline.fetcher import RobustDataFetcher


class TestMarketPriceAnomalyDetector:
    """Test suite for statistical price anomaly detection methods."""

    def setup_method(self):
        self.detector = MarketPriceAnomalyDetector(rolling_window=7, z_threshold=2.5, jump_threshold_pct=0.30)

    def test_detect_day_over_day_jump(self):
        # 10000, 10000, 15000 (+50% jump), 15000, 7500 (-50% drop)
        prices = pd.Series([10000, 10000, 15000, 15000, 7500])
        jumps = self.detector.detect_day_over_day_jump(prices)

        assert not jumps.iloc[0]
        assert not jumps.iloc[1]
        assert jumps.iloc[2]   # 10000 -> 15000 (+50% >= 30%)
        assert not jumps.iloc[3]
        assert jumps.iloc[4]   # 15000 -> 7500 (-50% >= 30%)

    def test_detect_rolling_zscore(self):
        # Steady series with an extreme sudden spike
        np.random.seed(42)
        base = [10000 + np.random.normal(0, 50) for _ in range(20)]
        base.append(35000)  # extreme spike
        base.extend([10000 for _ in range(5)])

        series = pd.Series(base)
        anomalies = self.detector.detect_rolling_zscore(series, window=7, threshold=2.5)

        # The spike at index 20 must be flagged
        assert anomalies.iloc[20]
        # Normal observations before spike must not be flagged
        assert not anomalies.iloc[5]
        assert not anomalies.iloc[10]

    def test_detect_iqr_outliers(self):
        series = pd.Series([10000, 10100, 10200, 10050, 10150, 10000, 50000, 10100])
        outliers = self.detector.detect_iqr_outliers(series, multiplier=1.5)

        assert outliers.iloc[6]   # 50000 is outlier
        assert not outliers.iloc[0]
        assert not outliers.iloc[1]

    def test_scan_dataframe(self):
        df = pd.DataFrame({
            "pasar_id": [1, 1, 1, 1, 1, 1, 1, 1],
            "komoditas_id": [50, 50, 50, 50, 50, 50, 50, 50],
            "harga": [20000, 20500, 20200, 20100, 20300, 20000, 45000, 20200]
        })

        res = self.detector.scan_dataframe(df, price_col="harga")

        assert "is_zscore_anomaly" in res.columns
        assert "is_iqr_outlier" in res.columns
        assert "is_jump_anomaly" in res.columns
        assert "is_price_anomaly" in res.columns
        assert res["is_price_anomaly"].iloc[6]  # Spike index 6 is flagged


class TestRobustDataFetcher:
    """Test suite for RobustDataFetcher session initialization and interface."""

    def test_fetcher_session_init(self):
        fetcher = RobustDataFetcher(max_retries=2, timeout=5)
        assert fetcher.session is not None
        assert fetcher.timeout == 5
        fetcher.close()

    def test_fetcher_context_manager(self):
        with RobustDataFetcher(max_retries=1, timeout=3) as fetcher:
            assert fetcher.session is not None
