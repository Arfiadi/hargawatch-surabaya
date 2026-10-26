"""Candidate Forecaster (The Sandbox) for Autoresearch in HargaWatch Surabaya.

MUTABLE / EDITABLE SANDBOX:
This file contains the experimental forecasting models under autonomous optimization.

Supported Architectures:
1. TiDE (Time-series Dense Encoder - Das et al. 2023): Deep MLP Neural Network with Pinball Loss.
2. Deep-GBDT Hybrid Ensemble: Blending CatBoost MultiQuantile, XGBoost, and TiDE Deep Learning.
3. Feature Engineering: Keputran Wholesale Disparity, Multi-Scale Momentum, 28d Upstream Weather.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).resolve().parent.parent.parent

import torch
import torch.nn as nn
import torch.optim as optim

from src.models.models import (
    CatBoostForecaster,
    LightGBMForecaster,
    RidgeForecaster,
    XGBoostForecaster,
    HAS_CATBOOST,
    HAS_XGBOOST,
)


# =====================================================================
# DEEP LEARNING: TiDE (Time-series Dense Encoder - Das et al. 2023)
# =====================================================================

class TiDENetwork(nn.Module):
    """Dense Encoder-Decoder with residual connections and multi-quantile output."""
    def __init__(self, in_features: int, hidden_dim: int = 64, dropout: float = 0.1):
        super().__init__()
        # Dense Encoder with LayerNorm and Residual Connection
        self.enc = nn.Linear(in_features, hidden_dim)
        self.ln_enc = nn.LayerNorm(hidden_dim)
        self.act_enc = nn.ReLU()
        self.drop = nn.Dropout(dropout)

        self.res_linear = nn.Linear(hidden_dim, hidden_dim)
        self.ln_res = nn.LayerNorm(hidden_dim)
        self.act_res = nn.ReLU()

        # Dense Decoder
        self.dec = nn.Linear(hidden_dim, hidden_dim // 2)
        self.ln_dec = nn.LayerNorm(hidden_dim // 2)
        self.act_dec = nn.ReLU()

        # 3 Quantiles Output: p10, p50, p90
        self.head = nn.Linear(hidden_dim // 2, 3)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = self.drop(self.act_enc(self.ln_enc(self.enc(x))))
        # Residual addition
        h = h + self.act_res(self.ln_res(self.res_linear(h)))
        # Decoder
        d = self.act_dec(self.ln_dec(self.dec(h)))
        return self.head(d)


class TiDEQuantileForecaster:
    """CPU-efficient PyTorch Deep Learning Forecaster using TiDE architecture.
    
    Optimizes joint Pinball Loss for quantiles [0.07, 0.50, 0.93].
    Uses high-speed vectorized tensor mini-batching without Python DataLoader overhead.
    """
    def __init__(
        self,
        feature_cols: List[str],
        hidden_dim: int = 64,
        epochs: int = 20,
        lr: float = 0.008,
        batch_size: int = 256,
        quantiles: Tuple[float, float, float] = (0.07, 0.50, 0.93),
    ):
        self.feature_cols = feature_cols
        self.hidden_dim = hidden_dim
        self.epochs = epochs
        self.lr = lr
        self.batch_size = batch_size
        self.quantiles = quantiles

        self.scaler_x = StandardScaler()
        self.y_mean: float = 0.0
        self.y_std: float = 1.0
        self.model: Optional[TiDENetwork] = None

    def _pinball_loss(self, preds: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        total_loss = 0.0
        for i, q in enumerate(self.quantiles):
            err = targets - preds[:, i]
            loss_q = torch.max(q * err, (q - 1.0) * err)
            total_loss += torch.mean(loss_q)
        return total_loss

    def fit(self, X: pd.DataFrame, y: pd.Series):
        torch.manual_seed(42)
        torch.set_num_threads(2)

        cols = [c for c in self.feature_cols if c in X.columns]
        X_mat = X[cols].fillna(0.0).values
        y_vals = np.asarray(y, dtype=float)

        self.scaler_x.fit(X_mat)
        X_norm = self.scaler_x.transform(X_mat)

        self.y_mean = float(np.mean(y_vals))
        self.y_std = float(np.std(y_vals) + 1e-5)
        y_norm = (y_vals - self.y_mean) / self.y_std

        tensor_x = torch.tensor(X_norm, dtype=torch.float32)
        tensor_y = torch.tensor(y_norm, dtype=torch.float32)
        N = len(tensor_x)

        self.model = TiDENetwork(in_features=len(cols), hidden_dim=self.hidden_dim)
        optimizer = optim.AdamW(self.model.parameters(), lr=self.lr, weight_decay=1e-4)

        self.model.train()
        for epoch in range(self.epochs):
            perm = torch.randperm(N)
            for i in range(0, N, self.batch_size):
                idx = perm[i : i + self.batch_size]
                bx = tensor_x[idx]
                by = tensor_y[idx]

                optimizer.zero_grad()
                preds = self.model(bx)
                loss = self._pinball_loss(preds, by)
                loss.backward()
                optimizer.step()

        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        if self.model is None:
            raise RuntimeError("TiDE model has not been fitted.")

        cols = [c for c in self.feature_cols if c in X.columns]
        X_mat = X[cols].fillna(0.0).values
        X_norm = self.scaler_x.transform(X_mat)

        self.model.eval()
        with torch.no_grad():
            tensor_x = torch.tensor(X_norm, dtype=torch.float32)
            preds_norm = self.model(tensor_x).numpy()

        # Unscale back to nominal Rupiah
        p_low = preds_norm[:, 0] * self.y_std + self.y_mean
        p_med = preds_norm[:, 1] * self.y_std + self.y_mean
        p_high = preds_norm[:, 2] * self.y_std + self.y_mean

        # Enforce boundary logic
        p_low = np.maximum(0.0, p_low)
        p_med = np.maximum(p_low, p_med)
        p_high = np.maximum(p_med, p_high)

        return {
            "harga_prediksi": p_med,
            "batas_bawah": p_low,
            "batas_atas": p_high,
        }


# =====================================================================
# CANDIDATE FORECASTER (AUTORESEARCH PLAYGROUND)
# =====================================================================

class CandidateForecaster:
    """The experimental candidate forecaster under autonomous optimization."""

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
        # MODEL FAMILY SELECTION: Deep-GBDT Blended Ensemble
        # -------------------------------------------------------------
        self.model_family = "Deep-GBDT Ensemble (CatBoost + TiDE + XGBoost)"
        self.include_weather = False
        self.include_calendar = True

        # Hyperparameters
        self.catboost_params = {
            "loss_function": "MultiQuantile:alpha=0.07,0.5,0.93",
            "iterations": 130,
            "learning_rate": 0.04,
            "depth": 6,
            "l2_leaf_reg": 4.5,
            "random_seed": 42,
            "verbose": False,
            "allow_writing_files": False,
            "thread_count": -1,
        }

        self.xgboost_params = {
            "n_estimators": 100,
            "learning_rate": 0.04,
            "max_depth": 5,
            "subsample": 0.85,
            "colsample_bytree": 0.85,
            "random_state": 42,
            "n_jobs": -1,
        }

        # Sub-models for Ensemble
        self.cb_model: Optional[CatBoostForecaster] = None
        self.xgb_model: Optional[XGBoostForecaster] = None
        self.tide_model: Optional[TiDEQuantileForecaster] = None

    def transform_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """Constructs spatial arbitrage, volatility, and momentum features."""
        new_cols: List[str] = []
        df_out = df.copy()

        # Vektor A1: Wholesale-Retail Spread Ratio (Keputran Wholesale Lead)
        if "keputran_price_lag_1" in df_out.columns and "price_current" in df_out.columns:
            df_out["spread_keputran_ratio"] = (
                (df_out["price_current"] - df_out["keputran_price_lag_1"])
                / (df_out["keputran_price_lag_1"] + 1e-5)
            ).clip(-1.0, 2.0)
            new_cols.append("spread_keputran_ratio")

        # Vektor A2: 3-Day Wholesale Momentum
        if "keputran_price_lag_1" in df_out.columns and "keputran_price_lag_3" in df_out.columns:
            df_out["keputran_momentum_3d"] = (
                (df_out["keputran_price_lag_1"] - df_out["keputran_price_lag_3"])
                / (df_out["keputran_price_lag_3"] + 1e-5)
            ).clip(-1.0, 1.0)
            new_cols.append("keputran_momentum_3d")

        # Vektor A3: Volatility Acceleration Ratio
        if "rolling_std_7d" in df_out.columns and "rolling_std_14d" in df_out.columns:
            df_out["volatility_acceleration"] = (
                df_out["rolling_std_7d"] / (df_out["rolling_std_14d"] + 1e-5)
            ).clip(0.0, 5.0)
            new_cols.append("volatility_acceleration")

        # Vektor A4: Short-term Momentum Ratio
        if "price_lag_1" in df_out.columns and "price_lag_3" in df_out.columns:
            df_out["momentum_ratio_3d"] = (
                (df_out["price_current"] - df_out["price_lag_3"])
                / (df_out["price_lag_3"] + 1e-5)
            ).clip(-1.0, 1.0)
            new_cols.append("momentum_ratio_3d")

        # Vektor A5: Price vs 7d Moving Average (Mean-Reversion Signal)
        if "price_current" in df_out.columns and "rolling_mean_7d" in df_out.columns:
            df_out["price_vs_rolling_7d"] = (
                (df_out["price_current"] - df_out["rolling_mean_7d"])
                / (df_out["rolling_mean_7d"] + 1e-5)
            ).clip(-1.0, 1.0)
            new_cols.append("price_vs_rolling_7d")

        # Vektor A6: Day of Week Cyclicality
        if "tanggal" in df_out.columns:
            df_out["day_of_week"] = pd.to_datetime(df_out["tanggal"]).dt.dayofweek.astype(float)
            new_cols.append("day_of_week")

        # Vektor B: Sinyal Hulu Eksternal (Cuaca Sentra Produksi Jatim - 28d Lagged CCF)
        weather_file = BASE_DIR / "data" / "external" / "cuaca_sentra_produksi.csv"
        if weather_file.exists() and "tanggal" in df_out.columns:
            try:
                df_w = pd.read_csv(weather_file)
                df_w["tanggal"] = pd.to_datetime(df_w["tanggal"])
                df_w = df_w.sort_values("tanggal").reset_index(drop=True)

                # 28-day lagged rainfall (CCF harvest shock signal from methodology doc)
                df_w["kediri_rain_lag_28d"] = df_w["kediri_rain_mm"].shift(28).rolling(7, min_periods=1).sum()
                df_w["blitar_rain_lag_28d"] = df_w["blitar_rain_mm"].shift(28).rolling(7, min_periods=1).sum()
                df_w["nganjuk_rain_lag_28d"] = df_w["nganjuk_rain_mm"].shift(28).rolling(7, min_periods=1).sum()

                w_cols = ["tanggal", "kediri_rain_lag_28d", "blitar_rain_lag_28d", "nganjuk_rain_lag_28d"]
                df_out = df_out.merge(df_w[w_cols], on="tanggal", how="left")
                for c in w_cols[1:]:
                    df_out[c] = df_out[c].fillna(0.0)
                    new_cols.append(c)
            except Exception:
                pass

        return df_out, new_cols

    def fit(self, X: pd.DataFrame, y: pd.Series):
        """Fits CatBoost, XGBoost, and TiDE Deep Learning model in parallel."""
        self.feature_cols = [c for c in self.feature_cols if c in X.columns]

        # 1. Fit CatBoost
        if HAS_CATBOOST:
            self.cb_model = CatBoostForecaster(
                feature_cols=self.feature_cols,
                categorical_cols=["pasar_id"],
                params=self.catboost_params,
            )
            self.cb_model.fit(X, y)

        # 2. Fit XGBoost
        if HAS_XGBOOST:
            self.xgb_model = XGBoostForecaster(
                feature_cols=self.feature_cols,
                categorical_cols=["pasar_id"],
                params=self.xgboost_params,
            )
            self.xgb_model.fit(X, y)

        # 3. Fit TiDE Deep Learning (PyTorch)
        self.tide_model = TiDEQuantileForecaster(
            feature_cols=self.feature_cols,
            hidden_dim=64,
            epochs=20,
            lr=0.008,
            batch_size=256,
        )
        self.tide_model.fit(X, y)

        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Blends predictions from CatBoost (45%), XGBoost (35%), and TiDE Deep Learning (20%)."""
        preds_list = []
        lows_list = []
        highs_list = []
        weights = []

        # CatBoost
        if self.cb_model is not None:
            cb_res = self.cb_model.predict(X)
            preds_list.append(np.asarray(cb_res["harga_prediksi"], dtype=float))
            lows_list.append(np.asarray(cb_res.get("batas_bawah", cb_res["harga_prediksi"]), dtype=float))
            highs_list.append(np.asarray(cb_res.get("batas_atas", cb_res["harga_prediksi"]), dtype=float))
            weights.append(0.45)

        # XGBoost
        if self.xgb_model is not None:
            xgb_res = self.xgb_model.predict(X)
            preds_list.append(np.asarray(xgb_res["harga_prediksi"], dtype=float))
            lows_list.append(np.asarray(xgb_res.get("batas_bawah", xgb_res["harga_prediksi"]), dtype=float))
            highs_list.append(np.asarray(xgb_res.get("batas_atas", xgb_res["harga_prediksi"]), dtype=float))
            weights.append(0.35)

        # TiDE Deep Learning
        if self.tide_model is not None:
            tide_res = self.tide_model.predict(X)
            preds_list.append(np.asarray(tide_res["harga_prediksi"], dtype=float))
            lows_list.append(np.asarray(tide_res.get("batas_bawah", tide_res["harga_prediksi"]), dtype=float))
            highs_list.append(np.asarray(tide_res.get("batas_atas", tide_res["harga_prediksi"]), dtype=float))
            weights.append(0.20)

        # Normalized weighted average
        w_arr = np.array(weights) / sum(weights)
        pred = sum(w * p for w, p in zip(w_arr, preds_list))
        low = sum(w * l for w, l in zip(w_arr, lows_list))
        high = sum(w * h for w, h in zip(w_arr, highs_list))

        # Enforce non-negativity and logical monotonicity: 0 <= low <= pred <= high
        low = np.maximum(low, 0.0)
        pred = np.maximum(pred, low)
        high = np.maximum(high, pred)

        return {
            "pred": pred,
            "low": low,
            "high": high,
        }
