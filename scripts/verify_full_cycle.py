"""End-to-end verification script for HargaWatch forecasting engine & error analysis toolkit."""

import sys
from pathlib import Path
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for script execution
import matplotlib.pyplot as plt

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.models.forecast_engine import run_experiment, ForecastEngine
from src.analytics.metrics import (
    compute_wape, compute_mae, compute_picp, compute_directional_accuracy,
    calculate_bias, analyze_directional_errors, plot_residual_diagnostics
)
from src.safety.early_warning import generate_ews_summary_dataframe


def main():
    print("\n=======================================================")
    print(" 1. Testing run_experiment with 'Cabai Rawit Merah' (LGBM)")
    print("=======================================================")
    df_sum, df_pred = run_experiment(
        komoditas="Cabai Rawit Merah",
        model_type="lightgbm",
        horizon=7,
        test_start_date="2026-01-01",
        window_step_days=14,
        use_weather=True,
        use_calendar=True,
        verbose=True
    )

    print("\n[VERIFY] Summary table shape:", df_sum.shape)
    print(df_sum)
    assert not df_sum.empty, "df_sum is empty!"

    print("\n[VERIFY] Predictions table shape:", df_pred.shape)
    print(df_pred.head(4))
    assert not df_pred.empty, "df_pred is empty!"
    for col in ["tanggal", "harga_aktual", "harga_prediksi", "batas_bawah", "batas_atas"]:
        assert col in df_pred.columns, f"Missing required column: {col}"

    print("\n=======================================================")
    print(" 2. Testing Error Analysis Toolkit")
    print("=======================================================")
    bias_res = calculate_bias(df_pred["harga_aktual"], df_pred["harga_prediksi"])
    print("\n[Bias Analysis]:")
    for k, v in bias_res.items():
        print(f"  {k}: {v}")

    dir_res = analyze_directional_errors(
        df_pred["harga_aktual"],
        df_pred["harga_prediksi"],
        df_pred["price_current"]
    )
    print("\n[Directional Error Breakdown]:")
    for k, v in dir_res.items():
        print(f"  {k}: {v}")

    print("\n=======================================================")
    print(" 3. Testing Residual Diagnostics Plotting")
    print("=======================================================")
    fig = plot_residual_diagnostics(df_pred)
    assert fig is not None
    plt.close(fig)
    print("  [SUCCESS] plot_residual_diagnostics generated successfully.")

    print("\n=======================================================")
    print(" 4. Testing generate_ews_summary_dataframe")
    print("=======================================================")
    df_ews = generate_ews_summary_dataframe(df_pred)
    print("\n[EWS Summary Table Shape]:", df_ews.shape)
    print(df_ews.head(6))
    for col in ["tanggal", "pasar_id", "nama_pasar", "total_skor", "status_warning"]:
        assert col in df_ews.columns, f"Missing required EWS column: {col}"
    print(f"  [SUCCESS] EWS status distribution:\n{df_ews['status_warning'].value_counts()}")

    print("\n=======================================================")
    print(" 5. Testing Feature Ablation (Weather=False, Calendar=False)")
    print("=======================================================")
    df_sum_abl, df_pred_abl = run_experiment(
        komoditas="Cabai Rawit Merah",
        model_type="ridge",
        horizon=7,
        test_start_date="2026-01-01",
        window_step_days=14,
        use_weather=False,
        use_calendar=False,
        verbose=True
    )
    print(df_sum_abl)
    assert not df_sum_abl.empty

    print("\n=======================================================")
    print(" 6. Testing ForecastEngine OOP Interface & Ablation Study")
    print("=======================================================")
    engine = ForecastEngine("Cabai Rawit Merah", horizon=7, test_start_date="2026-02-01", window_step_days=14)
    df_ablation = engine.run_ablation_study(model_type="lightgbm", verbose=False)
    print(df_ablation.to_string(index=False))
    assert len(df_ablation) == 4, "Ablation study did not return 4 scenarios!"

    print("\n=======================================================")
    print(" ALL VERIFICATION CHECKS PASSED PERFECTLY! ")
    print("=======================================================\n")


if __name__ == "__main__":
    main()
