"""Forecasting models for HargaWatch Surabaya.

Includes:
1. NaiveLastValueForecaster: Persistence baseline (y_{t+h} = y_t)
2. NaiveSMAForecaster: 7-day Simple Moving Average baseline
3. RidgeForecaster: Global pooled linear regression baseline with one-hot encoded markets
4. LightGBMForecaster: Global multi-market regressor with Quantile Loss (p10, p50, p90)
5. XGBoostForecaster: Global multi-market regressor with Quantile Loss (p10, p50, p90)
6. CatBoostForecaster: Global multi-market regressor with native categorical support and Quantile Loss
7. AutoARIMAForecaster: Local per-market AutoARIMA using StatsForecast with 80% CI
8. AutoETSForecaster: Local per-market AutoETS using StatsForecast with 80% CI
"""

import warnings
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler

# Defensive optional imports with sentinel flags
try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    xgb = None
    HAS_XGBOOST = False

try:
    import catboost as cb
    HAS_CATBOOST = True
except ImportError:
    cb = None
    HAS_CATBOOST = False

try:
    from statsforecast import StatsForecast
    from statsforecast.models import AutoARIMA as _SF_AutoARIMA, AutoETS as _SF_AutoETS, Naive as _SF_Naive
    HAS_STATSFORECAST = True
except ImportError:
    StatsForecast = None
    _SF_AutoARIMA = None
    _SF_AutoETS = None
    _SF_Naive = None
    HAS_STATSFORECAST = False


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


class RidgeForecaster:
    """Global Ridge Regression forecaster for tabular linear baseline (Tier 2).
    
    Features:
    - One-hot encoding for categorical variables (e.g. pasar_id)
    - Feature standardization with StandardScaler
    - Gaussian residual approximation for 80% prediction intervals (p10, p50, p90)
    """
    def __init__(
        self,
        feature_cols: List[str],
        categorical_cols: Optional[List[str]] = None,
        alpha: float = 1.0
    ):
        self.feature_cols = feature_cols
        self.categorical_cols = categorical_cols or ["pasar_id"]
        self.alpha = alpha
        self.model = Ridge(alpha=alpha, random_state=42)
        self.scaler = StandardScaler()
        self.dummy_columns_: List[str] = []
        self.categories_: Dict[str, List] = {}
        self.residual_std_: float = 0.0
        self.feature_means_: Optional[pd.Series] = None

    def _prepare_features(self, X: pd.DataFrame, is_training: bool = False) -> np.ndarray:
        cols = [c for c in self.feature_cols if c in X.columns]
        X_df = X[cols].copy()
        
        cat_present = [c for c in self.categorical_cols if c in X_df.columns]
        
        if is_training:
            self.categories_ = {}
            for col in cat_present:
                cats = sorted(X_df[col].dropna().unique().tolist())
                self.categories_[col] = cats
                X_df[col] = pd.Categorical(X_df[col], categories=cats)
                
            if cat_present:
                X_df = pd.get_dummies(X_df, columns=cat_present, drop_first=False, dtype=float)
                
            self.dummy_columns_ = list(X_df.columns)
            self.feature_means_ = X_df.mean(numeric_only=True)
            X_df = X_df.fillna(self.feature_means_).fillna(0.0)
            X_scaled = self.scaler.fit_transform(X_df)
        else:
            for col in cat_present:
                if col in self.categories_:
                    X_df[col] = pd.Categorical(X_df[col], categories=self.categories_[col])
                    
            if cat_present:
                X_df = pd.get_dummies(X_df, columns=cat_present, drop_first=False, dtype=float)
                
            X_df = X_df.reindex(columns=self.dummy_columns_, fill_value=0.0)
            if self.feature_means_ is not None:
                X_df = X_df.fillna(self.feature_means_).fillna(0.0)
            else:
                X_df = X_df.fillna(0.0)
            X_scaled = self.scaler.transform(X_df)
            
        return X_scaled

    def fit(self, X: pd.DataFrame, y: pd.Series):
        """Fits Ridge model and computes residual standard error for intervals."""
        X_scaled = self._prepare_features(X, is_training=True)
        y_vals = np.asarray(y, dtype=float)
        self.model.fit(X_scaled, y_vals)
        
        preds = self.model.predict(X_scaled)
        residuals = y_vals - preds
        self.residual_std_ = float(np.std(residuals, ddof=1 if len(residuals) > 1 else 0))
        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Generates point forecast (p50), lower bound (p10), and upper bound (p90)."""
        if not hasattr(self.model, "coef_"):
            raise RuntimeError("RidgeForecaster has not been fitted yet. Call fit() before predict().")

        if X.empty:
            return {
                "batas_bawah": np.array([], dtype=int),
                "harga_prediksi": np.array([], dtype=int),
                "batas_atas": np.array([], dtype=int)
            }

        X_scaled = self._prepare_features(X, is_training=False)
        point_pred = np.nan_to_num(self.model.predict(X_scaled), nan=0.0)
        
        z = 1.2816  # 80% coverage (10th and 90th percentiles for normal distribution)
        p50 = np.round(np.maximum(0, point_pred)).astype(int)
        p10 = np.round(np.maximum(0, point_pred - z * self.residual_std_)).astype(int)
        p90 = np.round(np.maximum(0, point_pred + z * self.residual_std_)).astype(int)
        
        p10 = np.minimum(p10, p50)
        p90 = np.maximum(p90, p50)
        
        return {
            "batas_bawah": p10,
            "harga_prediksi": p50,
            "batas_atas": p90
        }


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
        if not self.models:
            raise RuntimeError("LightGBMForecaster has not been fitted yet. Call fit() before predict().")

        if X.empty:
            return {
                "batas_bawah": np.array([], dtype=int),
                "harga_prediksi": np.array([], dtype=int),
                "batas_atas": np.array([], dtype=int)
            }

        X_feat = X[self.feature_cols].copy()
        for cat_col in self.categorical_cols:
            if cat_col in X_feat.columns:
                X_feat[cat_col] = X_feat[cat_col].astype("category")

        preds = {}
        preds["batas_bawah"] = np.round(np.nan_to_num(self.models[0.10].predict(X_feat), nan=0.0)).astype(int)
        preds["harga_prediksi"] = np.round(np.nan_to_num(self.models[0.50].predict(X_feat), nan=0.0)).astype(int)
        preds["batas_atas"] = np.round(np.nan_to_num(self.models[0.90].predict(X_feat), nan=0.0)).astype(int)
        
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


# =====================================================================
# XGBoost Forecaster
# =====================================================================

class XGBoostForecaster:
    """Multi-quantile XGBoost forecaster for point predictions and prediction intervals.
    
    Trains 3 quantile regressors using 'reg:quantileerror':
    - alpha=0.10: lower bound (batas_bawah)
    - alpha=0.50: median point forecast (harga_prediksi)
    - alpha=0.90: upper bound (batas_atas)
    
    Features:
    - Native categorical handling for pasar_id via enable_categorical=True and consistent category types
    - Monotonic boundary clipping (0 <= batas_bawah <= harga_prediksi <= batas_atas)
    - Feature importance ranking sorted descending
    """
    def __init__(
        self,
        feature_cols: List[str],
        categorical_cols: Optional[List[str]] = None,
        params: Optional[Dict] = None
    ):
        if not HAS_XGBOOST or xgb is None:
            raise ImportError("XGBoost is not installed. Please run: pip install xgboost")

        self.feature_cols = feature_cols
        self.categorical_cols = categorical_cols or ["pasar_id"]
        
        base_params = {
            "objective": "reg:quantileerror",
            "tree_method": "hist",
            "enable_categorical": True,
            "n_estimators": 120,
            "learning_rate": 0.05,
            "max_depth": 5,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "verbosity": 0,
            "n_jobs": -1
        }
        if params:
            base_params.update(params)
        self.base_params = base_params

        self.models: Dict[float, xgb.XGBRegressor] = {}
        self.quantiles = [0.10, 0.50, 0.90]
        self.categories_: Dict[str, List] = {}
        self.used_features_: List[str] = []

    def _prepare_features(self, X: pd.DataFrame, is_training: bool = False) -> pd.DataFrame:
        """Prepares features and guarantees consistent CategoricalDtype between train and test."""
        if is_training:
            self.used_features_ = [c for c in self.feature_cols if c in X.columns]
        cols = getattr(self, "used_features_", [c for c in self.feature_cols if c in X.columns])
        X_feat = X.reindex(columns=cols).copy()
        
        for cat_col in self.categorical_cols:
            if cat_col in X_feat.columns:
                if is_training:
                    cats = sorted(X_feat[cat_col].dropna().unique().tolist())
                    self.categories_[cat_col] = cats
                    X_feat[cat_col] = pd.Categorical(X_feat[cat_col], categories=cats)
                else:
                    cats = self.categories_.get(cat_col, None)
                    if cats is not None:
                        X_feat[cat_col] = pd.Categorical(X_feat[cat_col], categories=cats)
                    else:
                        X_feat[cat_col] = X_feat[cat_col].astype("category")
        return X_feat

    def fit(self, X: pd.DataFrame, y: pd.Series):
        """Fits 3 quantile XGBoost models on feature matrix X and target series y."""
        X_feat = self._prepare_features(X, is_training=True)
        y_vals = np.asarray(y, dtype=float)

        for q in self.quantiles:
            q_params = dict(self.base_params)
            q_params["quantile_alpha"] = q
            model = xgb.XGBRegressor(**q_params)
            model.fit(X_feat, y_vals)
            self.models[q] = model
            
        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Generates point forecast (p50), lower bound (p10), and upper bound (p90)."""
        if not self.models:
            raise RuntimeError("XGBoostForecaster has not been fitted yet. Call fit() before predict().")

        if X.empty:
            return {
                "batas_bawah": np.array([], dtype=int),
                "harga_prediksi": np.array([], dtype=int),
                "batas_atas": np.array([], dtype=int)
            }

        X_feat = self._prepare_features(X, is_training=False)

        raw_10 = np.nan_to_num(self.models[0.10].predict(X_feat), nan=0.0)
        raw_50 = np.nan_to_num(self.models[0.50].predict(X_feat), nan=0.0)
        raw_90 = np.nan_to_num(self.models[0.90].predict(X_feat), nan=0.0)

        preds = {
            "batas_bawah": np.round(np.maximum(0, raw_10)).astype(int),
            "harga_prediksi": np.round(np.maximum(0, raw_50)).astype(int),
            "batas_atas": np.round(np.maximum(0, raw_90)).astype(int)
        }
        
        # Enforce non-crossing monotonic boundary ordering: batas_bawah <= harga_prediksi <= batas_atas
        preds["batas_bawah"] = np.minimum(preds["batas_bawah"], preds["harga_prediksi"])
        preds["batas_atas"] = np.maximum(preds["batas_atas"], preds["harga_prediksi"])
        
        return preds

    def get_feature_importances(self) -> pd.DataFrame:
        """Returns feature importance ranking for the median model."""
        if 0.50 not in self.models:
            return pd.DataFrame(columns=["feature", "importance"])
        model = self.models[0.50]
        feats = getattr(self, "used_features_", self.feature_cols)
        return pd.DataFrame({
            "feature": feats,
            "importance": model.feature_importances_
        }).sort_values("importance", ascending=False).reset_index(drop=True)


# =====================================================================
# CatBoost Forecaster
# =====================================================================

class CatBoostForecaster:
    """Multi-quantile CatBoost forecaster using MultiQuantile loss.
    
    Jointly predicts quantiles [0.10, 0.50, 0.90]:
    - p10: lower bound (batas_bawah)
    - p50: median point forecast (harga_prediksi)
    - p90: upper bound (batas_atas)
    
    Features:
    - Native categorical handling for pasar_id via cat_features and integer/string conversion
    - Suppressed stdout logging via verbose=False
    - Monotonic boundary clipping (0 <= batas_bawah <= harga_prediksi <= batas_atas)
    - Feature importance ranking sorted descending
    """
    def __init__(
        self,
        feature_cols: List[str],
        categorical_cols: Optional[List[str]] = None,
        params: Optional[Dict] = None
    ):
        if not HAS_CATBOOST or cb is None:
            raise ImportError("CatBoost is not installed. Please run: pip install catboost")

        self.feature_cols = feature_cols
        self.categorical_cols = categorical_cols or ["pasar_id"]
        
        base_params = {
            "loss_function": "MultiQuantile:alpha=0.1,0.5,0.9",
            "iterations": 120,
            "learning_rate": 0.05,
            "depth": 6,
            "random_seed": 42,
            "verbose": False,
            "allow_writing_files": False,
            "thread_count": -1
        }
        if params:
            base_params.update(params)
        self.base_params = base_params

        self.model: Optional[cb.CatBoostRegressor] = None
        self.used_features_: List[str] = []

    def _prepare_features(self, X: pd.DataFrame, is_training: bool = False) -> Tuple[pd.DataFrame, List[str]]:
        """Prepares features and ensures cat_features are safely formatted as integers."""
        if is_training:
            self.used_features_ = [c for c in self.feature_cols if c in X.columns]
        cols = getattr(self, "used_features_", [c for c in self.feature_cols if c in X.columns])
        X_feat = X.reindex(columns=cols).copy()
        cat_present = [c for c in self.categorical_cols if c in X_feat.columns]
        
        for cat_col in cat_present:
            try:
                X_feat[cat_col] = X_feat[cat_col].fillna(-1).astype(int)
            except (ValueError, TypeError):
                X_feat[cat_col] = X_feat[cat_col].fillna("missing").astype(str)

        for col in X_feat.columns:
            if col not in cat_present and X_feat[col].dtype == "object":
                X_feat[col] = pd.to_numeric(X_feat[col], errors="coerce")

        return X_feat, cat_present

    def fit(self, X: pd.DataFrame, y: pd.Series):
        """Fits CatBoost MultiQuantile regressor."""
        X_feat, cat_present = self._prepare_features(X, is_training=True)
        y_vals = np.asarray(y, dtype=float)

        fit_params = dict(self.base_params)
        if cat_present:
            fit_params["cat_features"] = cat_present

        self.model = cb.CatBoostRegressor(**fit_params)
        self.model.fit(X_feat, y_vals, verbose=False)
        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Generates point forecast (p50), lower bound (p10), and upper bound (p90)."""
        if self.model is None:
            raise RuntimeError("CatBoostForecaster has not been fitted yet. Call fit() before predict().")

        if X.empty:
            return {
                "batas_bawah": np.array([], dtype=int),
                "harga_prediksi": np.array([], dtype=int),
                "batas_atas": np.array([], dtype=int)
            }

        X_feat, _ = self._prepare_features(X, is_training=False)
        raw_preds = self.model.predict(X_feat)
        
        # raw_preds shape is (n_samples, 3) corresponding to alpha=0.1, 0.5, 0.9
        if hasattr(raw_preds, "ndim") and raw_preds.ndim == 2 and raw_preds.shape[1] == 3:
            y_10 = raw_preds[:, 0]
            y_50 = raw_preds[:, 1]
            y_90 = raw_preds[:, 2]
        else:
            y_50 = np.asarray(raw_preds).flatten()
            y_10 = y_50
            y_90 = y_50

        preds = {
            "batas_bawah": np.round(np.maximum(0, np.nan_to_num(y_10, nan=0.0))).astype(int),
            "harga_prediksi": np.round(np.maximum(0, np.nan_to_num(y_50, nan=0.0))).astype(int),
            "batas_atas": np.round(np.maximum(0, np.nan_to_num(y_90, nan=0.0))).astype(int)
        }
        
        # Enforce non-crossing monotonic boundary ordering: batas_bawah <= harga_prediksi <= batas_atas
        preds["batas_bawah"] = np.minimum(preds["batas_bawah"], preds["harga_prediksi"])
        preds["batas_atas"] = np.maximum(preds["batas_atas"], preds["harga_prediksi"])
        
        return preds

    def get_feature_importances(self) -> pd.DataFrame:
        """Returns feature importance ranking."""
        if self.model is None:
            return pd.DataFrame(columns=["feature", "importance"])
        feats = getattr(self, "used_features_", self.feature_cols)
        return pd.DataFrame({
            "feature": feats,
            "importance": self.model.get_feature_importance()
        }).sort_values("importance", ascending=False).reset_index(drop=True)


# =====================================================================
# Statistical Forecasters (StatsForecast: AutoARIMA & AutoETS)
# =====================================================================

class _BaseStatsForecaster:
    """Base helper class for Nixtla StatsForecast panel formatting, alignment, and clipping."""
    def __init__(
        self,
        horizon: int = 7,
        season_length: int = 7,
        feature_cols: Optional[List[str]] = None,
        categorical_cols: Optional[List[str]] = None,
        n_jobs: int = 1,
        params: Optional[Dict] = None
    ):
        if not HAS_STATSFORECAST or StatsForecast is None:
            raise ImportError("StatsForecast is not installed. Please run: pip install statsforecast")

        self.horizon = horizon
        self.season_length = season_length
        self.feature_cols = feature_cols or []
        self.categorical_cols = categorical_cols or ["pasar_id"]
        self.n_jobs = n_jobs
        self.params = params or {}
        self.sf: Optional[StatsForecast] = None
        self.last_observed_price_: Dict[Union[int, str], float] = {}
        self.global_mean_price_: float = 30000.0

    def _prepare_panel_dataframe(self, X: pd.DataFrame, y: Optional[pd.Series] = None) -> pd.DataFrame:
        """Constructs standardized ['unique_id', 'ds', 'y'] panel for StatsForecast."""
        df = X.copy()
        
        # 1. Resolve unique_id (pasar_id)
        if "pasar_id" in df.columns:
            uid = df["pasar_id"]
        elif "unique_id" in df.columns:
            uid = df["unique_id"]
        else:
            uid = pd.Series(1, index=df.index)

        # 2. Resolve target series y
        if "price_current" in df.columns:
            target_y = df["price_current"]
        elif y is not None:
            target_y = y
        elif "target_price" in df.columns:
            target_y = df["target_price"]
        elif "y" in df.columns:
            target_y = df["y"]
        else:
            raise ValueError("Could not determine price series for StatsForecast panel.")

        # 3. Resolve timestamp ds
        if "tanggal" in df.columns:
            ds = pd.to_datetime(df["tanggal"])
        elif "ds" in df.columns:
            ds = pd.to_datetime(df["ds"])
        else:
            # Fallback for synthetic unindexed inputs: generate daily dates per unique_id
            ds_series = pd.Series(index=df.index, dtype="datetime64[ns]")
            for u in uid.unique():
                idx = df.index[uid == u]
                sub_dates = pd.date_range("2024-01-01", periods=len(idx), freq="D")
                ds_series.loc[idx] = sub_dates
            ds = ds_series

        panel = pd.DataFrame({
            "unique_id": uid,
            "ds": ds,
            "y": pd.to_numeric(target_y, errors="coerce")
        })

        # Clean NaN and duplicate timestamp records per market
        panel = panel.dropna(subset=["y", "ds"]).drop_duplicates(subset=["unique_id", "ds"])
        panel = panel.sort_values(["unique_id", "ds"]).reset_index(drop=True)

        # Store last price per market for fallback
        if not panel.empty:
            self.last_observed_price_ = panel.groupby("unique_id")["y"].last().to_dict()
            self.global_mean_price_ = float(panel["y"].mean())
        else:
            self.last_observed_price_ = {}
            self.global_mean_price_ = 30000.0

        return panel

    def _align_predictions(self, X: pd.DataFrame, fcst_df: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Aligns multi-step multi-market predictions back to X rows and applies monotonic clipping."""
        if "unique_id" not in fcst_df.columns:
            fcst_df = fcst_df.reset_index()

        # Identify output column names dynamically
        lo_cols = [c for c in fcst_df.columns if "-lo-" in c]
        hi_cols = [c for c in fcst_df.columns if "-hi-" in c]
        point_cols = [c for c in fcst_df.columns if c not in ("unique_id", "ds") and "-lo-" not in c and "-hi-" not in c]

        point_col = point_cols[0] if point_cols else fcst_df.columns[2]
        lo_col = lo_cols[0] if lo_cols else point_col
        hi_col = hi_cols[0] if hi_cols else point_col

        # Pick step h forecast per unique_id (last step in the horizon window)
        latest_fcst = fcst_df.groupby("unique_id").tail(1).set_index("unique_id")

        id_col = "pasar_id" if "pasar_id" in X.columns else ("unique_id" if "unique_id" in X.columns else None)
        
        preds_point = []
        preds_lo = []
        preds_hi = []

        for _, row in X.iterrows():
            uid = row[id_col] if id_col is not None else 1
            fcst_row = None
            if uid in latest_fcst.index:
                fcst_row = latest_fcst.loc[uid]
            elif str(uid) in latest_fcst.index:
                fcst_row = latest_fcst.loc[str(uid)]
            elif hasattr(uid, "item"):
                val = uid.item()
                if val in latest_fcst.index:
                    fcst_row = latest_fcst.loc[val]
                elif str(val) in latest_fcst.index:
                    fcst_row = latest_fcst.loc[str(val)]
            else:
                try:
                    int_uid = int(uid)
                    if int_uid in latest_fcst.index:
                        fcst_row = latest_fcst.loc[int_uid]
                except (ValueError, TypeError):
                    pass

            if fcst_row is not None:
                p50_val = fcst_row[point_col]
                lo_val = fcst_row[lo_col]
                hi_val = fcst_row[hi_col]
                if isinstance(p50_val, pd.Series):
                    p50_val = p50_val.iloc[0]
                if isinstance(lo_val, pd.Series):
                    lo_val = lo_val.iloc[0]
                if isinstance(hi_val, pd.Series):
                    hi_val = hi_val.iloc[0]
            else:
                fallback_val = (
                    self.last_observed_price_.get(uid) or
                    self.last_observed_price_.get(str(uid)) or
                    self.last_observed_price_.get(int(uid) if str(uid).isdigit() else None) or
                    self.global_mean_price_
                )
                p50_val = fallback_val
                lo_val = fallback_val * 0.95
                hi_val = fallback_val * 1.05

            preds_point.append(float(p50_val))
            preds_lo.append(float(lo_val))
            preds_hi.append(float(hi_val))

        p50 = np.round(np.maximum(0, np.nan_to_num(preds_point, nan=self.global_mean_price_))).astype(int)
        p10 = np.round(np.maximum(0, np.nan_to_num(preds_lo, nan=self.global_mean_price_))).astype(int)
        p90 = np.round(np.maximum(0, np.nan_to_num(preds_hi, nan=self.global_mean_price_))).astype(int)

        # Monotonic ordering enforcement: batas_bawah <= harga_prediksi <= batas_atas
        p10 = np.minimum(p10, p50)
        p90 = np.maximum(p90, p50)

        return {
            "batas_bawah": p10,
            "harga_prediksi": p50,
            "batas_atas": p90
        }

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Generates point forecast (p50), lower bound (p10), and upper bound (p90)."""
        if self.sf is None:
            raise RuntimeError(f"{self.__class__.__name__} has not been fitted yet. Call fit() before predict().")

        if X.empty:
            return {
                "batas_bawah": np.array([], dtype=int),
                "harga_prediksi": np.array([], dtype=int),
                "batas_atas": np.array([], dtype=int)
            }

        # Resolve prediction horizon
        if "target_date" in X.columns and "tanggal" in X.columns:
            try:
                h = max(1, int((pd.to_datetime(X["target_date"].iloc[0]) - pd.to_datetime(X["tanggal"].iloc[0])).days))
            except Exception:
                h = self.horizon
        else:
            h = self.horizon

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            fcst_df = self.sf.predict(h=h, level=[80])

        return self._align_predictions(X, fcst_df)

    def get_feature_importances(self) -> pd.DataFrame:
        """Returns empty DataFrame for univariate statistical models."""
        return pd.DataFrame(columns=["feature", "importance"])


class AutoARIMAForecaster(_BaseStatsForecaster):
    """Local per-market AutoARIMA forecaster using Nixtla StatsForecast with 80% CI.
    
    Optimized for rapid CPU training:
    - n_jobs=1: Avoids Windows multiprocessing spawn overhead and thread contention
    - stepwise=True & approximation=True: Fast greedy order selection
    - max_p=2, max_q=2, max_P=1, max_Q=1: Strict bounds preventing exponential search
    - season_length=7: Models weekly market cycles
    - fallback_model=Naive(): Safeguards against singular series
    """
    def __init__(
        self,
        horizon: int = 7,
        season_length: int = 7,
        feature_cols: Optional[List[str]] = None,
        categorical_cols: Optional[List[str]] = None,
        max_p: int = 2,
        max_q: int = 2,
        max_P: int = 1,
        max_Q: int = 1,
        max_d: int = 1,
        max_D: int = 1,
        stepwise: bool = True,
        approximation: bool = True,
        n_jobs: int = 1,
        params: Optional[Dict] = None,
        **kwargs
    ):
        if not HAS_STATSFORECAST or StatsForecast is None or _SF_AutoARIMA is None:
            raise ImportError("StatsForecast is not installed. Please run: pip install statsforecast")

        super().__init__(
            horizon=horizon,
            season_length=season_length,
            feature_cols=feature_cols,
            categorical_cols=categorical_cols,
            n_jobs=n_jobs,
            params=params
        )
        self.max_p = max_p
        self.max_q = max_q
        self.max_P = max_P
        self.max_Q = max_Q
        self.max_d = max_d
        self.max_D = max_D
        self.stepwise = stepwise
        self.approximation = approximation

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None):
        """Fits local AutoARIMA models per market using StatsForecast."""
        panel_df = self._prepare_panel_dataframe(X, y)
        
        arima_kwargs = {
            "season_length": self.season_length,
            "max_p": self.max_p,
            "max_q": self.max_q,
            "max_P": self.max_P,
            "max_Q": self.max_Q,
            "max_d": self.max_d,
            "max_D": self.max_D,
            "stepwise": self.stepwise,
            "approximation": self.approximation,
            "alias": "AutoARIMA"
        }
        if self.params:
            arima_kwargs.update(self.params)

        arima_model = _SF_AutoARIMA(**arima_kwargs)
        fallback = _SF_Naive() if _SF_Naive is not None else None
        self.sf = StatsForecast(
            models=[arima_model],
            freq="D",
            n_jobs=self.n_jobs,
            fallback_model=fallback,
            verbose=False
        )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.sf.fit(panel_df)
            
        return self


class AutoETSForecaster(_BaseStatsForecaster):
    """Local per-market AutoETS forecaster using Nixtla StatsForecast with 80% CI.
    
    Optimized for rapid CPU training:
    - n_jobs=1: Thread-safe single process execution
    - model='ZZZ': Automated AICc search over Error, Trend, and Seasonal components
    - season_length=7: Models weekly market cycles
    - fallback_model=Naive(): Safeguards against convergence issues
    """
    def __init__(
        self,
        horizon: int = 7,
        season_length: int = 7,
        model_type: str = "ZZZ",
        model: Optional[str] = None,
        feature_cols: Optional[List[str]] = None,
        categorical_cols: Optional[List[str]] = None,
        n_jobs: int = 1,
        params: Optional[Dict] = None,
        **kwargs
    ):
        if not HAS_STATSFORECAST or StatsForecast is None or _SF_AutoETS is None:
            raise ImportError("StatsForecast is not installed. Please run: pip install statsforecast")

        super().__init__(
            horizon=horizon,
            season_length=season_length,
            feature_cols=feature_cols,
            categorical_cols=categorical_cols,
            n_jobs=n_jobs,
            params=params
        )
        self.model_type = model or model_type

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None):
        """Fits local AutoETS models per market using StatsForecast."""
        panel_df = self._prepare_panel_dataframe(X, y)

        ets_kwargs = {
            "season_length": self.season_length,
            "model": self.model_type,
            "alias": "AutoETS"
        }
        if self.params:
            ets_kwargs.update(self.params)

        ets_model = _SF_AutoETS(**ets_kwargs)
        fallback = _SF_Naive() if _SF_Naive is not None else None
        self.sf = StatsForecast(
            models=[ets_model],
            freq="D",
            n_jobs=self.n_jobs,
            fallback_model=fallback,
            verbose=False
        )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.sf.fit(panel_df)

        return self


__all__ = [
    "NaiveLastValueForecaster",
    "NaiveSMAForecaster",
    "RidgeForecaster",
    "LightGBMForecaster",
    "XGBoostForecaster",
    "CatBoostForecaster",
    "AutoARIMAForecaster",
    "AutoETSForecaster",
    "HAS_XGBOOST",
    "HAS_CATBOOST",
    "HAS_STATSFORECAST",
]
