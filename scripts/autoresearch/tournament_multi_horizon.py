"""Multi-Horizon Forecasting Tournament (H=1 to 14 Days) for HargaWatch Surabaya.

SCIENTIFIC & RIGOROUS EMPIRICAL TOURNAMENT:
Compares 3 distinct multi-step forecasting methodologies on identical walk-forward backtests:
1. Candidate 1: Recursive GBDT (CatBoost MultiQuantile, Step-by-Step Rolling Loop)
2. Candidate 2: Multi-Output TiDE (Deep Learning PyTorch, 14-Step Joint Quantile Output)
3. Candidate 3: Legacy Heuristic (Single H=7 Anchor with Linear Interpolation h/7)

Target Commodities:
- Cabe Rawit Merah (ID: 50) - Highly Volatile Perishable
- Bawang Merah (ID: 39) - Volatile Staple
"""

import argparse
import datetime
from pathlib import Path
import sys
import time
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import torch
import torch.nn as nn
import torch.optim as optim

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.analytics.features import (
    build_lag_features,
    build_keputran_lead_features,
    prepare_base_series,
    calculate_days_to_idulfitri,
)
from src.analytics.metrics import (
    compute_wape,
    compute_mae,
    compute_rmse,
    compute_picp,
    compute_directional_accuracy,
)
from src.models.models import CatBoostForecaster, HAS_CATBOOST


# =====================================================================
# CANDIDATE 2: MULTI-OUTPUT TiDE NETWORK (14 HORIZONS x 3 QUANTILES)
# =====================================================================

class MultiOutputTiDENetwork(nn.Module):
    """Dense Encoder-Decoder producing a joint vector output of 14 days x 3 quantiles."""
    def __init__(self, in_features: int, horizon_steps: int = 14, hidden_dim: int = 64, dropout: float = 0.1):
        super().__init__()
        self.horizon_steps = horizon_steps
        
        # Dense Encoder
        self.enc = nn.Linear(in_features, hidden_dim)
        self.ln_enc = nn.LayerNorm(hidden_dim)
        self.act_enc = nn.ReLU()
        self.drop = nn.Dropout(dropout)

        # Residual Block
        self.res_linear = nn.Linear(hidden_dim, hidden_dim)
        self.ln_res = nn.LayerNorm(hidden_dim)
        self.act_res = nn.ReLU()

        # Dense Decoder
        self.dec = nn.Linear(hidden_dim, hidden_dim)
        self.ln_dec = nn.LayerNorm(hidden_dim)
        self.act_dec = nn.ReLU()

        # Output Head: (horizon_steps * 3 quantiles)
        self.head = nn.Linear(hidden_dim, horizon_steps * 3)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = self.drop(self.act_enc(self.ln_enc(self.enc(x))))
        h = h + self.act_res(self.ln_res(self.res_linear(h)))
        d = self.act_dec(self.ln_dec(self.dec(h)))
        out = self.head(d)
        # Reshape to [batch_size, horizon_steps, 3]
        return out.view(-1, self.horizon_steps, 3)


class MultiOutputTiDEForecaster:
    """Trains a multi-output neural network optimizing Joint Pinball Loss across 14 steps."""
    def __init__(
        self,
        feature_cols: List[str],
        horizon_steps: int = 14,
        hidden_dim: int = 64,
        epochs: int = 25,
        lr: float = 0.008,
        batch_size: int = 128,
        quantiles: Tuple[float, float, float] = (0.07, 0.50, 0.93),
    ):
        self.feature_cols = feature_cols
        self.horizon_steps = horizon_steps
        self.hidden_dim = hidden_dim
        self.epochs = epochs
        self.lr = lr
        self.batch_size = batch_size
        self.quantiles = quantiles

        self.scaler_x = StandardScaler()
        self.y_mean: float = 0.0
        self.y_std: float = 1.0
        self.model: Optional[MultiOutputTiDENetwork] = None

    def _joint_pinball_loss(self, preds: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """Computes joint pinball loss over batch, 14 horizons, and 3 quantiles."""
        total_loss = 0.0
        for i, q in enumerate(self.quantiles):
            # targets is [batch, 14], preds is [batch, 14, 3]
            err = targets - preds[:, :, i]
            loss_q = torch.max(q * err, (q - 1.0) * err)
            total_loss += torch.mean(loss_q)
        return total_loss

    def fit(self, X: pd.DataFrame, Y_matrix: np.ndarray):
        torch.manual_seed(42)
        torch.set_num_threads(2)

        cols = [c for c in self.feature_cols if c in X.columns]
        X_mat = X[cols].fillna(0.0).values
        Y_vals = np.asarray(Y_matrix, dtype=float)

        self.scaler_x.fit(X_mat)
        X_norm = self.scaler_x.transform(X_mat)

        self.y_mean = float(np.nanmean(Y_vals))
        self.y_std = float(np.nanstd(Y_vals) + 1e-5)
        Y_norm = (Y_vals - self.y_mean) / self.y_std

        tensor_x = torch.tensor(X_norm, dtype=torch.float32)
        tensor_y = torch.tensor(Y_norm, dtype=torch.float32)
        N = len(tensor_x)

        self.model = MultiOutputTiDENetwork(
            in_features=len(cols),
            horizon_steps=self.horizon_steps,
            hidden_dim=self.hidden_dim,
        )
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
                loss = self._joint_pinball_loss(preds, by)
                loss.backward()
                optimizer.step()

        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Inference produces 14-day trajectory for [p10, p50, p90]."""
        if self.model is None:
            raise RuntimeError("TiDE model not fitted.")

        cols = [c for c in self.feature_cols if c in X.columns]
        X_mat = X[cols].fillna(0.0).values
        X_norm = self.scaler_x.transform(X_mat)

        self.model.eval()
        with torch.no_grad():
            tensor_x = torch.tensor(X_norm, dtype=torch.float32)
            preds_norm = self.model(tensor_x).numpy() # [N, 14, 3]

        p_low = preds_norm[:, :, 0] * self.y_std + self.y_mean
        p_med = preds_norm[:, :, 1] * self.y_std + self.y_mean
        p_high = preds_norm[:, :, 2] * self.y_std + self.y_mean

        # Monotonicity check
        p_low = np.maximum(0.0, p_low)
        p_med = np.maximum(p_low, p_med)
        p_high = np.maximum(p_med, p_high)

        return {
            "p50": p_med, # [N, 14]
            "p10": p_low, # [N, 14]
            "p90": p_high,# [N, 14]
        }


# =====================================================================
# DATASET BUILDER & MULTI-HORIZON TOURNAMENT HARNESS
# =====================================================================

def prepare_multi_horizon_data(komoditas_id: int = 50) -> Tuple[pd.DataFrame, pd.DataFrame, List[str]]:
    """Builds historical features and multi-step targets with zero leakage."""
    raw_harga_file = BASE_DIR / "data" / "processed" / "fact_harga_pasar.csv"
    kalender_file = BASE_DIR / "data" / "raw" / "dim_kalender.json"

    df_raw = pd.read_csv(raw_harga_file)
    df_base = prepare_base_series(df_raw, komoditas_id=komoditas_id)
    df_lags = build_lag_features(df_base)
    df_feats = build_keputran_lead_features(df_lags)

    # Calendar features
    df_kal = pd.read_json(kalender_file) if kalender_file.exists() else pd.DataFrame()
    if not df_kal.empty:
        df_kal["tanggal"] = pd.to_datetime(df_kal["tanggal"])
        df_feats = df_feats.merge(
            df_kal[["tanggal", "bulan", "is_weekend", "is_libur_nasional", "is_ramadan", "is_pra_ramadan"]],
            on="tanggal",
            how="left"
        )
        df_feats["target_hari_ke_idulfitri"] = calculate_days_to_idulfitri(df_feats["tanggal"])
        df_feats = df_feats.rename(columns={
            "bulan": "target_bulan",
            "is_weekend": "target_is_weekend",
            "is_libur_nasional": "target_is_libur_nasional",
            "is_ramadan": "target_is_ramadan",
            "is_pra_ramadan": "target_is_pra_ramadan",
        })

    # Domain features (Arbitrage & Volatility)
    if "keputran_price_lag_1" in df_feats.columns and "price_current" in df_feats.columns:
        df_feats["spread_keputran_ratio"] = (
            (df_feats["price_current"] - df_feats["keputran_price_lag_1"])
            / (df_feats["keputran_price_lag_1"] + 1e-5)
        ).clip(-1.0, 2.0)

    if "rolling_std_7d" in df_feats.columns and "rolling_std_14d" in df_feats.columns:
        df_feats["volatility_acceleration"] = (
            df_feats["rolling_std_7d"] / (df_feats["rolling_std_14d"] + 1e-5)
        ).clip(0.0, 5.0)

    if "price_lag_1" in df_feats.columns and "price_lag_3" in df_feats.columns:
        df_feats["momentum_ratio_3d"] = (
            (df_feats["price_current"] - df_feats["price_lag_3"])
            / (df_feats["price_lag_3"] + 1e-5)
        ).clip(-1.0, 1.0)

    feature_cols = [
        "pasar_id", "price_current", "price_lag_1", "price_lag_2", "price_lag_3",
        "price_lag_7", "price_lag_14", "rolling_mean_7d", "rolling_std_7d",
        "rolling_mean_14d", "rolling_std_14d", "pct_change_1d", "pct_change_7d",
        "target_bulan", "target_is_weekend", "target_is_libur_nasional",
        "target_is_ramadan", "target_is_pra_ramadan", "target_hari_ke_idulfitri",
        "keputran_price_lag_1", "keputran_price_lag_2", "keputran_price_lag_3",
        "spread_keputran_ratio", "volatility_acceleration", "momentum_ratio_3d"
    ]
    feature_cols = [c for c in feature_cols if c in df_feats.columns]

    return df_feats, df_kal, feature_cols


def run_tournament(komoditas_id: int = 50, test_start_date: str = "2025-01-01", step_days: int = 21):
    """Executes rolling walk-forward tournament comparing the 3 paradigms."""
    print(f"\n{'='*75}")
    print(f"  MULTI-HORIZON FORECASTING TOURNAMENT (H=1 to 14 Days)")
    print(f"  Target: Commodity {komoditas_id} | Test Start: {test_start_date} | Step: {step_days}d")
    print(f"{'='*75}\n")

    df_feats, df_kal, feature_cols = prepare_multi_horizon_data(komoditas_id)
    df_feats["tanggal"] = pd.to_datetime(df_feats["tanggal"])
    
    # Identify unique test origins
    all_dates = df_feats[df_feats["tanggal"] >= pd.Timestamp(test_start_date)]["tanggal"].drop_duplicates().sort_values().tolist()
    # Ensure origin has at least 14 days of ground truth following it
    max_date = df_feats["tanggal"].max()
    valid_origins = [d for d in all_dates if d + pd.Timedelta(days=14) <= max_date]
    test_origins = valid_origins[::step_days]

    print(f"[INFO] Evaluated across {len(test_origins)} rolling windows from {test_origins[0].date()} to {test_origins[-1].date()}.\n")

    # Metrics Accumulators: key = candidate_name, value = dict of lists
    results = {
        "Recursive GBDT": {"y_true": [], "p50": [], "p10": [], "p90": [], "h_true": {1:[], 3:[], 7:[], 14:[]}, "h_pred": {1:[], 3:[], 7:[], 14:[]}, "time": 0.0},
        "Multi-Output TiDE": {"y_true": [], "p50": [], "p10": [], "p90": [], "h_true": {1:[], 3:[], 7:[], 14:[]}, "h_pred": {1:[], 3:[], 7:[], 14:[]}, "time": 0.0},
        "Linear Heuristic": {"y_true": [], "p50": [], "p10": [], "p90": [], "h_true": {1:[], 3:[], 7:[], 14:[]}, "h_pred": {1:[], 3:[], 7:[], 14:[]}, "time": 0.0},
    }

    # Ground truth lookup table
    gt_table = df_feats.set_index(["tanggal", "pasar_id"])["price_current"].to_dict()

    for idx, origin in enumerate(test_origins):
        print(f"  Window {idx+1}/{len(test_origins)}: Origin {origin.date()}...")

        # Strict chronological split: train data <= origin
        train_df = df_feats[df_feats["tanggal"] <= origin].copy()
        origin_slice = df_feats[df_feats["tanggal"] == origin].copy()

        # Build ground truth matrix [6 markets, 14 days]
        pasars = sorted(origin_slice["pasar_id"].unique())
        y_true_14 = np.zeros((len(pasars), 14))
        for p_idx, p in enumerate(pasars):
            for h in range(1, 15):
                t_target = origin + pd.Timedelta(days=h)
                y_true_14[p_idx, h - 1] = gt_table.get((t_target, p), np.nan)

        # Skip if missing any ground truth
        if np.isnan(y_true_14).any():
            continue

        # -------------------------------------------------------------
        # 1. CANDIDATE 1: RECURSIVE GBDT (CatBoost MultiQuantile)
        # -------------------------------------------------------------
        t0 = time.time()
        # Train CatBoost on 1-step ahead
        # target is price next day
        train_df["target_1d"] = train_df.groupby("pasar_id")["price_current"].shift(-1)
        valid_train = train_df.dropna(subset=["target_1d", "price_lag_14"])

        cb_model = CatBoostForecaster(
            feature_cols=feature_cols,
            categorical_cols=["pasar_id"],
            params={
                "loss_function": "MultiQuantile:alpha=0.07,0.5,0.93",
                "iterations": 100,
                "learning_rate": 0.05,
                "depth": 5,
                "random_seed": 42,
                "verbose": False,
            }
        )
        cb_model.fit(valid_train[feature_cols], valid_train["target_1d"])

        # Recursive Multi-Step Roll forward
        curr_feat_df = origin_slice[feature_cols].copy().sort_values("pasar_id").reset_index(drop=True)
        rec_preds_50 = np.zeros((len(pasars), 14))
        rec_preds_10 = np.zeros((len(pasars), 14))
        rec_preds_90 = np.zeros((len(pasars), 14))

        for h in range(1, 15):
            target_dt = origin + pd.Timedelta(days=h)
            # update calendar features for target_dt
            curr_feat_df["target_bulan"] = target_dt.month
            curr_feat_df["target_is_weekend"] = int(target_dt.weekday() >= 5)
            curr_feat_df["target_hari_ke_idulfitri"] = calculate_days_to_idulfitri(pd.Series([target_dt])).iloc[0]

            out = cb_model.predict(curr_feat_df)
            p_pred = np.asarray(out["harga_prediksi"])
            p_low = np.asarray(out.get("batas_bawah", p_pred))
            p_high = np.asarray(out.get("batas_atas", p_pred))

            rec_preds_50[:, h - 1] = p_pred
            rec_preds_10[:, h - 1] = p_low
            rec_preds_90[:, h - 1] = p_high

            # Update autoregressive lags for step h+1
            curr_feat_df["price_lag_3"] = curr_feat_df["price_lag_2"]
            curr_feat_df["price_lag_2"] = curr_feat_df["price_lag_1"]
            curr_feat_df["price_lag_1"] = curr_feat_df["price_current"]
            curr_feat_df["price_current"] = p_pred
            # Update rolling mean 7d with smoothed recursive prediction
            curr_feat_df["rolling_mean_7d"] = 0.85 * curr_feat_df["rolling_mean_7d"] + 0.15 * p_pred

        results["Recursive GBDT"]["time"] += time.time() - t0

        # -------------------------------------------------------------
        # 2. CANDIDATE 2: MULTI-OUTPUT TiDE (14-Step Decoder)
        # -------------------------------------------------------------
        t0 = time.time()
        # Build 14-day target matrix for training
        tide_train = train_df.dropna(subset=["price_lag_14"]).copy()
        # Generate 14-day future targets
        y_cols = []
        for step in range(1, 15):
            col_name = f"target_h{step}"
            tide_train[col_name] = tide_train.groupby("pasar_id")["price_current"].shift(-step)
            y_cols.append(col_name)

        tide_train_clean = tide_train.dropna(subset=y_cols)
        tide_model = MultiOutputTiDEForecaster(
            feature_cols=feature_cols,
            horizon_steps=14,
            hidden_dim=64,
            epochs=20,
            lr=0.008,
            batch_size=128
        )
        tide_model.fit(tide_train_clean[feature_cols], tide_train_clean[y_cols].values)

        tide_out = tide_model.predict(origin_slice[feature_cols].sort_values("pasar_id"))
        tide_p50 = tide_out["p50"]
        tide_p10 = tide_out["p10"]
        tide_p90 = tide_out["p90"]

        results["Multi-Output TiDE"]["time"] += time.time() - t0

        # -------------------------------------------------------------
        # 3. CANDIDATE 3: LEGACY HEURISTIC (Linear Anchor h/7)
        # -------------------------------------------------------------
        t0 = time.time()
        # Train H=7 anchor model
        train_df["target_7d"] = train_df.groupby("pasar_id")["price_current"].shift(-7)
        valid_anchor = train_df.dropna(subset=["target_7d", "price_lag_14"])

        cb_anchor = CatBoostForecaster(
            feature_cols=feature_cols,
            categorical_cols=["pasar_id"],
            params={
                "loss_function": "MultiQuantile:alpha=0.07,0.5,0.93",
                "iterations": 100,
                "learning_rate": 0.05,
                "depth": 5,
                "random_seed": 42,
                "verbose": False,
            }
        )
        cb_anchor.fit(valid_anchor[feature_cols], valid_anchor["target_7d"])

        anchor_out = cb_anchor.predict(origin_slice[feature_cols].sort_values("pasar_id"))
        p50_7 = np.asarray(anchor_out["harga_prediksi"])
        p10_7 = np.asarray(anchor_out.get("batas_bawah", p50_7))
        p90_7 = np.asarray(anchor_out.get("batas_atas", p50_7))
        p_curr = origin_slice.sort_values("pasar_id")["price_current"].values

        lin_p50 = np.zeros((len(pasars), 14))
        lin_p10 = np.zeros((len(pasars), 14))
        lin_p90 = np.zeros((len(pasars), 14))

        for h in range(1, 15):
            ratio = h / 7.0
            sqrt_r = np.sqrt(ratio)
            lin_p50[:, h - 1] = p_curr + ratio * (p50_7 - p_curr)
            lin_p10[:, h - 1] = np.maximum(0, lin_p50[:, h - 1] - sqrt_r * (p50_7 - p10_7))
            lin_p90[:, h - 1] = lin_p50[:, h - 1] + sqrt_r * (p90_7 - p50_7)

        results["Linear Heuristic"]["time"] += time.time() - t0

        # -------------------------------------------------------------
        # ACCUMULATE COMPARATIVE METRICS
        # -------------------------------------------------------------
        candidates = [
            ("Recursive GBDT", rec_preds_50, rec_preds_10, rec_preds_90),
            ("Multi-Output TiDE", tide_p50, tide_p10, tide_p90),
            ("Linear Heuristic", lin_p50, lin_p10, lin_p90),
        ]

        for name, p_med, p_low, p_high in candidates:
            results[name]["y_true"].extend(y_true_14.flatten().tolist())
            results[name]["p50"].extend(p_med.flatten().tolist())
            results[name]["p10"].extend(p_low.flatten().tolist())
            results[name]["p90"].extend(p_high.flatten().tolist())

            for step in [1, 3, 7, 14]:
                results[name]["h_true"][step].extend(y_true_14[:, step - 1].tolist())
                results[name]["h_pred"][step].extend(p_med[:, step - 1].tolist())

    # =====================================================================
    # DISPLAY FINAL SCOREBOARD & REPORT
    # =====================================================================
    print(f"\n{'='*75}")
    print(f"  TOURNAMENT RESULTS SCOREBOARD (H=1 to 14 Days)")
    print(f"{'='*75}")

    summary_rows = []
    for name, data in results.items():
        y_t = np.array(data["y_true"])
        p_m = np.array(data["p50"])
        p_l = np.array(data["p10"])
        p_h = np.array(data["p90"])

        wape_14 = compute_wape(y_t, p_m)
        mae_14 = compute_mae(y_t, p_m)
        picp_14 = compute_picp(y_t, p_l, p_h)
        
        # Step-specific WAPE
        wape_h1 = compute_wape(np.array(data["h_true"][1]), np.array(data["h_pred"][1]))
        wape_h3 = compute_wape(np.array(data["h_true"][3]), np.array(data["h_pred"][3]))
        wape_h7 = compute_wape(np.array(data["h_true"][7]), np.array(data["h_pred"][7]))
        wape_h14 = compute_wape(np.array(data["h_true"][14]), np.array(data["h_pred"][14]))

        summary_rows.append({
            "Methodology": name,
            "WAPE_14d": wape_14,
            "MAE_14d": mae_14,
            "PICP_14d": picp_14,
            "WAPE_H1": wape_h1,
            "WAPE_H3": wape_h3,
            "WAPE_H7": wape_h7,
            "WAPE_H14": wape_h14,
            "Total_Time_s": round(data["time"], 2),
        })

    summary_df = pd.DataFrame(summary_rows)
    print(summary_df.to_string(index=False))

    return summary_df


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", type=int, default=50, help="Commodity ID to tournament (default: 50)")
    parser.add_argument("--start", type=str, default="2025-01-01", help="Test start date")
    parser.add_argument("--step", type=int, default=28, help="Rolling window step size in days")
    args = parser.parse_args()

    run_tournament(komoditas_id=args.id, test_start_date=args.start, step_days=args.step)
