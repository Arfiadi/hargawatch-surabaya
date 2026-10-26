"""Candidate Forecaster (The Sandbox) for Autoresearch in HargaWatch Surabaya.

MUTABLE / EDITABLE SANDBOX:
This is the ONLY file where the AI Coding Agent explores, mutates, and tests new hypotheses.
The agent is encouraged to:
1. Switch model families (CatBoost, XGBoost, LightGBM, Ridge, Blended Ensembles).
2. Tune hyperparameters (learning rates, tree depths, regularizations, iterations).
3. Engineer new feature transformations (spread ratios, volatility acceleration, price momentum).
4. Calibrate quantile loss objectives to ensure PICP >= 80% coverage.

The evaluation harness (`scripts/autoresearch/evaluator.py`) automatically imports
`CandidateForecaster` from this file and tests it across walk-forward backtest splits.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

from src.models.models import (
    CatBoostForecaster,
    LightGBMForecaster,
    RidgeForecaster,
    XGBoostForecaster,
    HAS_CATBOOST,
    HAS_XGBOOST,
)


class CandidateForecaster:
    """The experimental candidate forecaster under autonomous optimization.
    
    Standard Interface required by `evaluator.py`:
    - `__init__(komoditas_id, horizon, feature_cols)`
    - `transform_features(df)` -> (df_augmented, list_of_new_feature_names) [Optional]
    - `fit(X, y)`
    - `predict(X)` -> Dict containing {"pred": np.ndarray, "low": np.ndarray, "high": np.ndarray}
    """

    def __init__(
        self,
        komoditas_id: int = 50,
        horizon: int = 7,
        feature_cols: Optional[List[str]] = None,
    ):
        self.komoditas_id = komoditas_id
        self.horizon = horizon
        self.feature_cols = feature_cols or []
        
        # -------------------------------------------------------------
        # 1. SMART COMMODITY-AWARE MODEL ROUTING (MUTABLE)
        # -------------------------------------------------------------
        # Komoditas 48 (Buncis) performs best on XGBoost
        # Komoditas 37 (Cabe Keriting) uses a Shrinkage Blend to beat Naive
        # Komoditas 50, 39, 46, 38 excel on CatBoost MultiQuantile
        if self.komoditas_id == 48:
            self.model_family = "XGBoost Quantile (Calibrated)"
        elif self.komoditas_id == 37:
            self.model_family = "CatBoost Shrinkage Blend"
        else:
            self.model_family = "CatBoost MultiQuantile (Calibrated)"

        self.include_weather = False  # Weather disabled (consumer-city noise)
        self.include_calendar = True  # Calendar enabled for festival/Ramadan

        # -------------------------------------------------------------
        # 2. CALIBRATED HYPERPARAMETERS CONFIGURATION (MUTABLE)
        # Widened alphas [0.07, 0.93] to guarantee PICP >= 78% - 82% coverage
        # -------------------------------------------------------------
        self.catboost_params = {
            "loss_function": "MultiQuantile:alpha=0.07,0.5,0.93",
            "iterations": 160,
            "learning_rate": 0.04,
            "depth": 6,
            "l2_leaf_reg": 4.5,
            "random_seed": 42,
            "verbose": False,
            "allow_writing_files": False,
            "thread_count": -1,
        }

        self.xgboost_params = {
            "n_estimators": 140,
            "learning_rate": 0.04,
            "max_depth": 5,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "n_jobs": -1,
        }

        # Internal forecaster instance
        self.forecaster: Optional[Any] = None

    def transform_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """Hook for dynamic feature engineering before model training.
        
        Constructs spatial arbitrage and volatility features strictly at origin t.
        """
        new_cols: List[str] = []
        df_out = df.copy()

        # Vektor A1: Wholesale-Retail Spread Ratio (Keputran Wholesale Lead)
        if "keputran_price_lag_1" in df_out.columns and "price_current" in df_out.columns:
            df_out["spread_keputran_ratio"] = (
                (df_out["price_current"] - df_out["keputran_price_lag_1"])
                / (df_out["keputran_price_lag_1"] + 1e-5)
            ).clip(-1.0, 2.0)
            new_cols.append("spread_keputran_ratio")

        # Vektor A2: Volatility Acceleration Ratio (Short vs Medium term)
        if "rolling_std_7d" in df_out.columns and "rolling_std_14d" in df_out.columns:
            df_out["volatility_acceleration"] = (
                df_out["rolling_std_7d"] / (df_out["rolling_std_14d"] + 1e-5)
            ).clip(0.0, 5.0)
            new_cols.append("volatility_acceleration")

        # Vektor A3: Short-term Momentum Ratio
        if "price_lag_1" in df_out.columns and "price_lag_3" in df_out.columns:
            df_out["momentum_ratio_3d"] = (
                (df_out["price_current"] - df_out["price_lag_3"])
                / (df_out["price_lag_3"] + 1e-5)
            ).clip(-1.0, 1.0)
            new_cols.append("momentum_ratio_3d")

        return df_out, new_cols

    def fit(self, X: pd.DataFrame, y: pd.Series):
        """Fits the chosen underlying model architecture on the training fold."""
        self.feature_cols = [c for c in self.feature_cols if c in X.columns]

        if "xgboost" in self.model_family.lower() and HAS_XGBOOST:
            self.forecaster = XGBoostForecaster(
                feature_cols=self.feature_cols,
                categorical_cols=["pasar_id"],
                params=self.xgboost_params,
            )
            # Custom quantiles for XGBoost to ensure PICP >= 78%
            self.forecaster.quantiles = [0.07, 0.50, 0.93]
            self.forecaster.fit(X, y)
        elif "catboost" in self.model_family.lower() and HAS_CATBOOST:
            self.forecaster = CatBoostForecaster(
                feature_cols=self.feature_cols,
                categorical_cols=["pasar_id"],
                params=self.catboost_params,
            )
            self.forecaster.fit(X, y)
        else:
            self.forecaster = LightGBMForecaster(
                feature_cols=self.feature_cols,
                categorical_cols=["pasar_id"],
            )
            self.forecaster.fit(X, y)

        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Generates point forecast (pred/p50) and prediction interval (low/p10, high/p90)."""
        if self.forecaster is None:
            raise RuntimeError("CandidateForecaster must be fitted before calling predict.")

        raw_preds = self.forecaster.predict(X)

        if "harga_prediksi" in raw_preds:
            pred = np.asarray(raw_preds["harga_prediksi"], dtype=float)
            low = np.asarray(raw_preds.get("batas_bawah", pred), dtype=float)
            high = np.asarray(raw_preds.get("batas_atas", pred), dtype=float)
        elif "pred" in raw_preds:
            pred = np.asarray(raw_preds["pred"], dtype=float)
            low = np.asarray(raw_preds.get("low", pred), dtype=float)
            high = np.asarray(raw_preds.get("high", pred), dtype=float)
        else:
            pred = np.asarray(raw_preds, dtype=float)
            low = pred
            high = pred

        # Special Shrinkage Blend for Cabe Keriting (ID 37) to beat Naive baseline:
        # Anchors 40% to current price persistence and 60% to GBDT direction
        if self.komoditas_id == 37 and "price_current" in X.columns:
            curr_price = X["price_current"].values
            pred = 0.40 * curr_price + 0.60 * pred
            low = np.minimum(low, pred * 0.90)
            high = np.maximum(high, pred * 1.10)

        # Enforce non-negativity and logical monotonicity: 0 <= low <= pred <= high
        low = np.maximum(low, 0.0)
        pred = np.maximum(pred, low)
        high = np.maximum(high, pred)

        return {
            "pred": pred,
            "low": low,
            "high": high,
        }
