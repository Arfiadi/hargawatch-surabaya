"""Unit tests untuk skoring komposit Early Warning System."""

import pytest
from src.safety.early_warning import compute_early_warning_scores


def test_early_warning_score_bounds_and_classification(sample_ews_inputs):
    """Menguji bahwa skor total berada di rentang 0-100 dan status sesuai aturan."""
    df_current, df_forecasts = sample_ews_inputs
    
    df_res = compute_early_warning_scores(df_current, df_forecasts)
    
    assert len(df_res) == 3
    assert set(["skor_tren", "skor_volatilitas", "skor_anomali", "skor_prediksi", "total_skor", "status_warning"]).issubset(df_res.columns)
    
    # Periksa batasan nilai
    assert (df_res["total_skor"] >= 0).all()
    assert (df_res["total_skor"] <= 100).all()
    
    # Periksa konsistensi status
    for _, row in df_res.iterrows():
        total = row["total_skor"]
        status = row["status_warning"]
        if total >= 70:
            assert status == "TINGGI"
        elif total >= 40:
            assert status == "WASPADA"
        else:
            assert status == "NORMAL"
            
    # Pasar ID 2 yang mengalami lonjakan tinggi dan volatilitas tinggi harus WASPADA atau TINGGI
    pasar_2 = df_res[df_res["pasar_id"] == 2].iloc[0]
    assert pasar_2["status_warning"] in ["WASPADA", "TINGGI"]
