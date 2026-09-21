"""Forecasting models for HargaWatch Surabaya.

Includes:
1. NaiveLastValue: Persistence baseline (y_{t+h} = y_t)
2. NaiveSMA: 7-day Simple Moving Average baseline
3. LightGBMForecaster: Global multi-market regressor with Quantile Loss (p10, p50, p90)
"""

from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
import lightgbm as lgb


class NaiveLastValueForecaster:
    """Predicts future price as the most recent observed price at origin t."""
    def __init__(self):
        pass

    def fit(self, X: pd.DataFrame, y: pd.Series):
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return X["price_current"].values


class NaiveSMAForecaster:
    """Predicts future price as the 7-day moving average observed up to origin t."""
    def __init__(self):
        pass

    def fit(self, X: pd.DataFrame, y: pd.Series):
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if "rolling_mean_7d" in X.columns:
            return X["rolling_mean_7d"].fillna(X["price_current"]).values
        return X["price_current"].values


class LightGBMForecaster:
    """Multi-quantile LightGBM forecaster for point predictions and prediction intervals.
    
    Trains 3 quantile regressors:
    - alpha=0.10: lower bound (batas_bawah)
    - alpha=0.50: median point forecast (harga_prediksi)
    - alpha=0.90: upper bound (batas_atas)
    """
    def __init__(
        self,
        feature_cols: List[str],
        categorical_cols: Optional[List[str]] = None,
        params: Optional[Dict] = None
    ):
        self.feature_cols = feature_cols
        self.categorical_cols = categorical_cols or ["pasar_id"]
        
        base_params = {
            "objective": "quantile",
            "boosting_type": "gbdt",
            "n_estimators": 120,
            "learning_rate": 0.05,
            "num_leaves": 31,
            "min_child_samples": 20,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "verbose": -1,
            "n_jobs": -1
        }
        if params:
            base_params.update(params)
        self.base_params = base_params

        self.models: Dict[float, lgb.LGBMRegressor] = {}
        self.quantiles = [0.10, 0.50, 0.90]

    def fit(self, X: pd.DataFrame, y: pd.Series):
        """Fits 3 quantile models on feature matrix X and target series y."""
        X_feat = X[self.feature_cols].copy()
        
        # Ensure categorical types
        for cat_col in self.categorical_cols:
            if cat_col in X_feat.columns:
                X_feat[cat_col] = X_feat[cat_col].astype("category")

        for q in self.quantiles:
            q_params = dict(self.base_params)
            q_params["alpha"] = q
            model = lgb.LGBMRegressor(**q_params)
            model.fit(X_feat, y)
            self.models[q] = model
            
        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Generates point forecast (p50), lower bound (p10), and upper bound (p90)."""
        X_feat = X[self.feature_cols].copy()
        for cat_col in self.categorical_cols:
            if cat_col in X_feat.columns:
                X_feat[cat_col] = X_feat[cat_col].astype("category")

        preds = {}
        preds["batas_bawah"] = np.round(self.models[0.10].predict(X_feat)).astype(int)
        preds["harga_prediksi"] = np.round(self.models[0.50].predict(X_feat)).astype(int)
        preds["batas_atas"] = np.round(self.models[0.90].predict(X_feat)).astype(int)
        
        # Ensure logical ordering: batas_bawah <= harga_prediksi <= batas_atas
        preds["batas_bawah"] = np.minimum(preds["batas_bawah"], preds["harga_prediksi"])
        preds["batas_atas"] = np.maximum(preds["batas_atas"], preds["harga_prediksi"])
        
        return preds

    def get_feature_importances(self) -> pd.DataFrame:
        """Returns feature importance ranking for the median model."""
        if 0.50 not in self.models:
            return pd.DataFrame()
        model = self.models[0.50]
        return pd.DataFrame({
            "feature": self.feature_cols,
            "importance": model.feature_importances_
        }).sort_values("importance", ascending=False).reset_index(drop=True)
