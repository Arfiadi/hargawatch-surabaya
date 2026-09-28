"""Forecasting Experiment Orchestrator and Engine for HargaWatch Surabaya.

Provides:
1. `run_experiment()`: High-level function to execute baseline comparisons (Naive, Ridge, LightGBM)
   and feature ablation studies (weather, calendar) with a single call, with optional W&B tracking.
2. `ForecastEngine`: Object-oriented experiment orchestrator for automated multi-scenario benchmarking
   and seamless experiment tracking from Jupyter Notebooks to Weights & Biases (W&B).
"""

import os
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

from src.models.backtest import run_walk_forward_backtest, resolve_commodity


def _init_wandb_session(
    project_name: Optional[str] = None,
    run_name: Optional[str] = None,
    config: Optional[Dict] = None,
    tags: Optional[List[str]] = None,
    notes: Optional[str] = None
) -> Tuple[Optional[any], bool]:
    """Helper to defensively initialize W&B session with offline fallback."""
    try:
        import wandb
    except ImportError:
        print("[WARN] 'wandb' package is not installed. Experiment tracking disabled.")
        return None, False

    api_key = os.getenv("WANDB_API_KEY")
    project = project_name or os.getenv("WANDB_PROJECT", "hargawatch-surabaya")
    entity = os.getenv("WANDB_ENTITY") or None
    is_offline = False

    if api_key and api_key.strip() and api_key != "kunci-api-wandb-anda":
        try:
            wandb.login(key=api_key.strip(), relogin=True)
        except Exception as e:
            print(f"[WARN] W&B login with provided API key failed ({e}). Falling back to offline mode.")
            is_offline = True
    else:
        if not wandb.api.api_key:
            print("[INFO] WANDB_API_KEY is not configured or placeholder. Running W&B in offline mode.")
            is_offline = True

    mode = "offline" if is_offline else "online"

    try:
        run = wandb.init(
            project=project,
            entity=entity,
            name=run_name,
            config=config or {},
            tags=tags or ["notebook"],
            notes=notes,
            mode=mode,
            reinit=True
        )
        return run, True
    except Exception as e:
        print(f"[WARN] Failed to initialize W&B run: {e}")
        return None, False


def run_experiment(
    komoditas: str = "Cabe Rawit Merah",
    model_type: str = "lightgbm",
    horizon: int = 7,
    test_start_date: str = "2025-01-01",
    window_step_days: int = 14,
    use_weather: bool = True,
    use_calendar: bool = True,
    model_params: Optional[Dict] = None,
    verbose: bool = True,
    commodity_name: Optional[str] = None,
    track_wandb: bool = False,
    project_name: Optional[str] = None,
    run_name: Optional[str] = None
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Runs a standardized forecasting experiment with model and feature ablation toggles.
    
    This function wraps walk-forward backtesting to support:
    - Baseline comparisons (E1-E4): Naive Last Value, Naive SMA, Ridge Regression, GBDT models.
    - Feature Ablation studies (E5): Toggling external weather and future calendar features.
    - Direct MLOps experiment tracking to Weights & Biases (W&B) via `track_wandb=True`.
    
    Parameters
    ----------
    komoditas : str
        Commodity name (e.g., 'Cabe Rawit Merah', 'Cabai Rawit Merah', 'Bawang Merah').
    model_type : str
        Target model architecture (e.g. 'lightgbm', 'xgboost', 'catboost', 'ridge', 'sanity', 'gbdt', 'all').
    horizon : int
        Forecasting horizon in days (default: 7).
    test_start_date : str
        Start date for test evaluation period (default: '2025-01-01').
    window_step_days : int
        Rolling origin step size in days (default: 14).
    use_weather : bool
        Whether to include weather features.
    use_calendar : bool
        Whether to include future calendar features.
    model_params : Optional[Dict]
        Hyperparameter overrides for the underlying model.
    verbose : bool
        Whether to print backtest execution logs and tables.
    commodity_name : Optional[str]
        Alias for komoditas parameter.
    track_wandb : bool
        Whether to log this specific experiment run to Weights & Biases (default: False).
    project_name : Optional[str]
        W&B project name override.
    run_name : Optional[str]
        W&B run name override.
        
    Returns
    -------
    Tuple[pd.DataFrame, pd.DataFrame]
        df_summary : DataFrame
            Evaluation metrics table (WAPE, MAE, RMSE, sMAPE, DA, PICP).
        df_predictions : DataFrame
            Detailed test predictions with actual prices and interval bounds.
    """
    target_commodity = commodity_name or komoditas
    komoditas_id, canonical_name = resolve_commodity(target_commodity)

    df_summary, df_predictions = run_walk_forward_backtest(
        commodity_name=canonical_name,
        horizon=horizon,
        test_start_date=test_start_date,
        window_step_days=window_step_days,
        include_weather=use_weather,
        include_calendar=use_calendar,
        model_type=model_type,
        model_params=model_params,
        verbose=verbose
    )

    if track_wandb and not df_summary.empty:
        r_name = run_name or f"Exp-{canonical_name.replace(' ', '_')}-{model_type}-H{horizon}"
        config = {
            "commodity": canonical_name,
            "komoditas_id": komoditas_id,
            "model_type": model_type,
            "horizon_days": horizon,
            "window_step_days": window_step_days,
            "use_weather": use_weather,
            "use_calendar": use_calendar,
            "test_start_date": test_start_date
        }
        run, enabled = _init_wandb_session(
            project_name=project_name,
            run_name=r_name,
            config=config,
            tags=["experiment", model_type]
        )
        if enabled and run:
            import wandb
            # Log metrics per model
            for _, row in df_summary.iterrows():
                m_name = row["Model"]
                m_dict = row.drop("Model").to_dict()
                prefixed = {f"{m_name}/{k}": v for k, v in m_dict.items() if pd.notna(v)}
                run.log(prefixed)

            # Log summary table
            run.log({"Backtest Summary Table": wandb.Table(dataframe=df_summary)})
            run.finish()
            print(f"[W&B] Logged experiment '{r_name}' to Weights & Biases successfully.")

    return df_summary, df_predictions


class ForecastEngine:
    """Forecasting experimentation, benchmarking, and W&B logging engine."""
    
    def __init__(
        self,
        commodity_name: str = "Cabe Rawit Merah",
        horizon: int = 7,
        test_start_date: str = "2025-01-01",
        window_step_days: int = 14
    ):
        self.commodity_name = commodity_name
        self.horizon = horizon
        self.test_start_date = test_start_date
        self.window_step_days = window_step_days
        self.komoditas_id, self.canonical_name = resolve_commodity(commodity_name)

    def run(
        self,
        model_type: str = "lightgbm",
        use_weather: bool = True,
        use_calendar: bool = True,
        model_params: Optional[Dict] = None,
        verbose: bool = True,
        track_wandb: bool = False,
        run_name: Optional[str] = None
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Runs a single experiment configuration."""
        return run_experiment(
            komoditas=self.canonical_name,
            model_type=model_type,
            horizon=self.horizon,
            test_start_date=self.test_start_date,
            window_step_days=self.window_step_days,
            use_weather=use_weather,
            use_calendar=use_calendar,
            model_params=model_params,
            verbose=verbose,
            track_wandb=track_wandb,
            run_name=run_name
        )

    def run_ablation_study(
        self,
        model_type: str = "lightgbm",
        verbose: bool = False
    ) -> pd.DataFrame:
        """Runs a 4-way feature ablation study on the commodity.
        
        Configurations tested:
        1. Full Features (Price + Calendar + Weather)
        2. No Weather (Price + Calendar)
        3. No Calendar (Price + Weather)
        4. Minimal Baseline (Price Lags Only)
        
        Returns
        -------
        pd.DataFrame
            Comparison summary of WAPE, MAE, DA, and PICP across feature subsets.
        """
        configurations = [
            ("Full Features (Price + Calendar + Weather)", True, True),
            ("Ablation: Without Weather", False, True),
            ("Ablation: Without Calendar", True, False),
            ("Minimal (Price Lags Only)", False, False)
        ]

        ablation_rows = []
        for label, use_w, use_c in configurations:
            df_sum, _ = self.run(
                model_type=model_type,
                use_weather=use_w,
                use_calendar=use_c,
                verbose=verbose
            )
            clean_m = model_type.lower().strip()
            if clean_m in ["all", "lightgbm", "lgb", "lgbm"]:
                pattern = "LightGBM"
            elif clean_m in ["ridge", "linear"]:
                pattern = "Ridge"
            elif "catboost" in clean_m:
                pattern = "CatBoost"
            elif "xgboost" in clean_m:
                pattern = "XGBoost"
            elif "sma" in clean_m:
                pattern = "SMA"
            elif "naive" in clean_m:
                pattern = "Naive"
            else:
                pattern = model_type

            target_rows = df_sum[df_sum["Model"].str.contains(pattern, case=False, regex=True)]
            if not target_rows.empty:
                row_dict = target_rows.iloc[0].to_dict()
            elif not df_sum.empty:
                row_dict = df_sum.iloc[-1].to_dict()
            else:
                row_dict = {}

            row_dict["Configuration"] = label
            row_dict["Weather"] = "Yes" if use_w else "No"
            row_dict["Calendar"] = "Yes" if use_c else "No"
            ablation_rows.append(row_dict)

        df_ablation = pd.DataFrame(ablation_rows)
        first_cols = ["Configuration", "Weather", "Calendar", "WAPE (%)", "MAE (Rp)", "Directional Accuracy (%)", "PICP (%)"]
        existing = [c for c in first_cols if c in df_ablation.columns]
        remaining = [c for c in df_ablation.columns if c not in existing and c != "Model"]
        return df_ablation[existing + remaining]

    def log_notebook_experiment(
        self,
        df_summary_gbdt: Optional[pd.DataFrame] = None,
        df_ablation: Optional[pd.DataFrame] = None,
        scorecard_ews: Optional[pd.DataFrame] = None,
        df_predictions: Optional[pd.DataFrame] = None,
        feat_imp: Optional[pd.DataFrame] = None,
        project_name: Optional[str] = None,
        run_name: Optional[str] = None,
        tags: Optional[List[str]] = None,
        notes: Optional[str] = None
    ) -> Optional[any]:
        """Logs comprehensive results of a commodity forecasting notebook (E1-E6) to Weights & Biases.
        
        Parameters
        ----------
        df_summary_gbdt : Optional[DataFrame]
            Summary metrics table from GBDT comparison (E4).
        df_ablation : Optional[DataFrame]
            Ablation study summary table (E5).
        scorecard_ews : Optional[DataFrame]
            EWS anomaly detection scorecard (E6).
        df_predictions : Optional[DataFrame]
            Detailed predictions table with actual prices and bounds.
        feat_imp : Optional[DataFrame]
            Feature importance DataFrame with 'feature' and 'importance' columns.
        project_name : Optional[str]
            Weights & Biases project name.
        run_name : Optional[str]
            Run name (defaults to 'Notebook-<Commodity>-H<horizon>').
        tags : Optional[List[str]]
            Custom tags for W&B filtering.
        notes : Optional[str]
            Free-text notes for the run.
            
        Returns
        -------
        run : Optional[wandb.Run]
            The completed W&B run object, or None if disabled.
        """
        r_name = run_name or f"Notebook-{self.canonical_name.replace(' ', '_')}-H{self.horizon}"
        run_tags = tags or ["notebook", self.canonical_name.lower().replace(" ", "_")]

        config = {
            "commodity": self.canonical_name,
            "komoditas_id": self.komoditas_id,
            "horizon_days": self.horizon,
            "window_step_days": self.window_step_days,
            "test_start_date": self.test_start_date,
            "source": "jupyter_notebook"
        }

        run, enabled = _init_wandb_session(
            project_name=project_name,
            run_name=r_name,
            config=config,
            tags=run_tags,
            notes=notes
        )

        if not enabled or run is None:
            print("[INFO] W&B logging skipped or unavailable.")
            return None

        import wandb

        # 1. Log GBDT Summary Metrics & Champion Details
        if df_summary_gbdt is not None and not df_summary_gbdt.empty:
            for _, row in df_summary_gbdt.iterrows():
                m_name = row["Model"]
                m_dict = row.drop("Model").to_dict()
                prefixed = {f"{m_name}/{k}": v for k, v in m_dict.items() if pd.notna(v)}
                run.log(prefixed)

            # Determine champion model (lowest WAPE)
            if "WAPE (%)" in df_summary_gbdt.columns:
                best_row = df_summary_gbdt.sort_values("WAPE (%)").iloc[0]
                run.summary["champion_model"] = str(best_row["Model"])
                run.summary["champion_wape"] = float(best_row["WAPE (%)"])
                if "MAE (Rp)" in best_row and pd.notna(best_row["MAE (Rp)"]):
                    run.summary["champion_mae"] = float(best_row["MAE (Rp)"])
                if "Directional Accuracy (%)" in best_row and pd.notna(best_row["Directional Accuracy (%)"]):
                    run.summary["champion_da"] = float(best_row["Directional Accuracy (%)"])
                if "PICP (%)" in best_row and pd.notna(best_row["PICP (%)"]):
                    run.summary["champion_picp"] = float(best_row["PICP (%)"])

            run.log({"GBDT Benchmark Table": wandb.Table(dataframe=df_summary_gbdt)})

        # 2. Log Feature Ablation Study
        if df_ablation is not None and not df_ablation.empty:
            run.log({"Feature Ablation Table": wandb.Table(dataframe=df_ablation)})

        # 3. Log EWS Performance Scorecard
        if scorecard_ews is not None and not scorecard_ews.empty:
            run.log({"EWS Performance Scorecard": wandb.Table(dataframe=scorecard_ews)})

            # Extract key EWS metrics to summary if available
            try:
                rec_row = scorecard_ews[scorecard_ews["Metrik"].str.contains("Recall", case=False, na=False)]
                if not rec_row.empty:
                    val_str = str(rec_row.iloc[0]["Nilai"]).replace("%", "").strip()
                    run.summary["ews_recall_pct"] = float(val_str)

                far_row = scorecard_ews[scorecard_ews["Metrik"].str.contains("False Alarm", case=False, na=False)]
                if not far_row.empty:
                    val_str = str(far_row.iloc[0]["Nilai"]).replace("%", "").strip()
                    run.summary["ews_far_pct"] = float(val_str)
            except Exception:
                pass

        # 4. Log Sample Predictions Table
        if df_predictions is not None and not df_predictions.empty:
            sample_size = min(200, len(df_predictions))
            cols_to_log = [c for c in ["tanggal", "pasar_id", "harga_aktual", "harga_prediksi", "batas_bawah", "batas_atas"] if c in df_predictions.columns]
            sample_df = df_predictions[cols_to_log].head(sample_size) if cols_to_log else df_predictions.head(sample_size)
            run.log({"Sample Predictions Table": wandb.Table(dataframe=sample_df)})

        # 5. Log Feature Importance Chart
        if feat_imp is not None and not feat_imp.empty:
            try:
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_file:
                    tmp_path = tmp_file.name

                plt.figure(figsize=(9, 6))
                top_n = min(15, len(feat_imp))
                subset = feat_imp.head(top_n).iloc[::-1]
                plt.barh(subset["feature"], subset["importance"], color="#2563EB", edgecolor="none")
                plt.title(f"Top {top_n} Feature Importance — {self.canonical_name}", fontsize=12, fontweight="bold")
                plt.xlabel("Importance Score", fontsize=10)
                plt.tight_layout()
                plt.savefig(tmp_path, dpi=150)
                plt.close()

                run.log({"Feature Importance": wandb.Image(tmp_path)})
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
            except Exception as e:
                print(f"[WARN] Failed to log feature importance plot: {e}")

        run.finish()
        print("\n" + "=" * 65)
        print(f"  [SUCCESS] Notebook experiment for {self.canonical_name} logged to W&B!")
        print(f"  Run Name : {r_name}")
        print("=" * 65 + "\n")
        return run
