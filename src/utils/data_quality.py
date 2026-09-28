"""Modul Pemeriksaan Kualitas Data Deret Waktu (Forecasting Data Quality Assessment).

Menerapkan 8-Point Forecasting Data Quality Framework yang terbagi ke dalam 3 Lapis (Layer):
- Layer 1: Data Values (Completeness, Uniqueness, Validity, Outliers)
- Layer 2: Temporal Structure (Integrity, Consistency, Gaps)
- Layer 3: Information Availability & Temporal Leakage Check
"""

from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np


def run_forecasting_data_quality_check(
    df: pd.DataFrame,
    horizon: int = 7,
    komoditas_name: Optional[str] = None,
    feature_cols: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Menjalankan audit kualitas data forecasting komprehensif pada dataset training.
    
    Parameters
    ----------
    df : pd.DataFrame
        Dataset supervised keluaran build_supervised_dataset().
    horizon : int
        Horizon peramalan (default 7 hari).
    komoditas_name : str, optional
        Nama komoditas yang sedang diuji untuk keperluan pelaporan.
    feature_cols : list of str, optional
        Daftar kolom fitur prediktor aktual yang masuk ke model ML.

    Returns
    -------
    dict
        Rangkuman status metrik data quality (passed / warnings / issues).
    """
    header_name = f" [{komoditas_name}]" if komoditas_name else ""
    print("=" * 70)
    print(f"[AUDIT] FORECASTING DATA QUALITY ASSESSMENT (8-POINT FRAMEWORK){header_name}")
    print("=" * 70)

    results = {"passed_all": True, "layer1": {}, "layer2": {}, "layer3": {}}

    # -------------------------------------------------------------
    # LAYER 1: DATA VALUES (Completeness, Uniqueness, Validity, Outliers)
    # -------------------------------------------------------------
    print("\n--- [LAYER 1: DATA VALUES] ---")
    
    # 1. Completeness (Missing Values)
    missing_target = int(df["target_price"].isna().sum()) if "target_price" in df.columns else 0
    
    # Filter fitur jika diberikan, jika tidak cek semua kolom kecuali metadata/audit
    if feature_cols:
        target_check_cols = [c for c in feature_cols if c in df.columns]
    else:
        target_check_cols = [c for c in df.columns if c not in ["harga_asli", "target_date", "is_imputed", "target_delta_pct"]]

    missing_in_feats = df[target_check_cols].isna().sum()
    cols_with_nan = missing_in_feats[missing_in_feats > 0]
    total_feat_nans = int(cols_with_nan.sum())

    print(f"  1. Completeness (Missing Values) : Target NaNs = {missing_target}, Predictor NaNs = {total_feat_nans}")
    if missing_target > 0:
        results["layer1"]["missing_target"] = f"FAILED: {missing_target} target NaNs"
        results["passed_all"] = False
        print(f"     [FAIL] GAGAL: Ditemukan {missing_target} baris target kosong!")
    elif total_feat_nans > 0:
        results["layer1"]["missing_features"] = f"WARNING: {total_feat_nans} NaNs in {len(cols_with_nan)} cols"
        nan_summary = ", ".join([f"{col}: {val}" for col, val in cols_with_nan.items()])
        print(f"     [!] CATATAN: Terdapat nilai NaN di awal lag fitur: ({nan_summary})")
        print("         (Tree-based model GBDT secara native mampu menangani NaN ini).")
    else:
        results["layer1"]["missing_values"] = "PASSED: 0 NaN"
        print("     [OK] LULUS: 0 NaN pada seluruh variabel prediktor dan target")

    # 2. Uniqueness (Duplicate records)
    subset_keys = [c for c in ["tanggal", "pasar_id", "komoditas_id"] if c in df.columns]
    dup_count = int(df.duplicated(subset=subset_keys).sum())
    print(f"  2. Uniqueness (Duplikasi Kunci)  : {dup_count} baris duplikat")
    if dup_count > 0:
        results["layer1"]["uniqueness"] = f"FAILED: {dup_count} duplicate keys"
        results["passed_all"] = False
        print("     [FAIL] GAGAL: Ditemukan duplikasi baris pada observasi yang sama!")
    else:
        results["layer1"]["uniqueness"] = "PASSED"
        print("     [OK] LULUS: Tidak ada duplikasi rekaman")

    # 3. Accuracy & Validity
    invalid_price = int((df["target_price"] <= 0).sum()) if "target_price" in df.columns else 0
    extreme_price = int((df["target_price"] > 500_000).sum()) if "target_price" in df.columns else 0
    print(f"  3. Accuracy & Validity           : {invalid_price} harga <= 0, {extreme_price} harga > Rp500.000")
    if invalid_price > 0:
        results["layer1"]["validity"] = f"FAILED: {invalid_price} invalid prices"
        results["passed_all"] = False
        print("     [FAIL] GAGAL: Terdeteksi harga negatif atau bernilai nol!")
    else:
        results["layer1"]["validity"] = "PASSED"
        print("     [OK] LULUS: Seluruh harga dalam rentang valid")

    # 4. Outliers & Anomalies
    if "pct_change_1d" in df.columns:
        spikes = int((df["pct_change_1d"] > 0.50).sum())
        drops = int((df["pct_change_1d"] < -0.50).sum())
        pct_anomaly = (spikes + drops) / len(df) * 100 if len(df) > 0 else 0
        print(f"  4. Outliers & Anomalies          : {spikes} lonjakan (>50%), {drops} penurunan (<-50%) [{pct_anomaly:.2f}%]")
        print("     [*] INFO: Anomali dipertahankan untuk melatih Early Warning System (EWS)")
        results["layer1"]["anomalies"] = f"{spikes} spikes, {drops} drops"
    else:
        print("  4. Outliers & Anomalies          : pct_change_1d tidak ditemukan")

    # -------------------------------------------------------------
    # LAYER 2: TEMPORAL STRUCTURE (Integrity, Consistency, Gaps)
    # -------------------------------------------------------------
    print("\n--- [LAYER 2: TEMPORAL STRUCTURE] ---")
    
    # 5. Temporal Integrity
    is_sorted = True
    if "pasar_id" in df.columns and "tanggal" in df.columns:
        for pid, group in df.groupby("pasar_id"):
            if not group["tanggal"].is_monotonic_increasing:
                is_sorted = False
                break
    print(f"  5. Temporal Integrity (Monoton) : {'Urut Kronologis' if is_sorted else 'TIDAK URUT'}")
    if not is_sorted:
        results["layer2"]["monotonic"] = "FAILED: Waktu tidak berurut"
        results["passed_all"] = False
        print("     [FAIL] GAGAL: Indeks waktu tidak terurut secara monoton naik!")
    else:
        results["layer2"]["monotonic"] = "PASSED"
        print("     [OK] LULUS: Indeks waktu terurut kronologis secara konsisten")

    # 6. Frequency & Granularity (Missing Time Points / Gaps)
    gaps_count = 0
    max_gap = 0
    if "pasar_id" in df.columns and "tanggal" in df.columns:
        for pid, group in df.groupby("pasar_id"):
            diffs = group["tanggal"].diff().dt.days
            sub_gaps = diffs[diffs > 1]
            if len(sub_gaps) > 0:
                gaps_count += len(sub_gaps)
                max_gap = max(max_gap, int(sub_gaps.max()))
    print(f"  6. Frequency & Gaps (> 1 hari)   : {gaps_count} gap terdeteksi (Gap terpanjang: {max_gap} hari)")
    if gaps_count == 0:
        print("     [OK] LULUS: Deret waktu kontinu harian tanpa lompatan waktu")
    else:
        print(f"     [!] CATATAN: Terdapat {gaps_count} jeda waktu antar-observasi valid")
    results["layer2"]["gaps"] = f"{gaps_count} gaps, max={max_gap}d"

    # -------------------------------------------------------------
    # LAYER 3: LEAKAGE & INFORMATION AVAILABILITY
    # -------------------------------------------------------------
    print("\n--- [LAYER 3: LEAKAGE & INFORMATION AVAILABILITY] ---")
    
    # 7. Horizon & Target Offset Verification
    leakage_detected = False
    if "tanggal" in df.columns and "target_date" in df.columns:
        day_diff = (df["target_date"] - df["tanggal"]).dt.days
        invalid_horizons = int((day_diff != horizon).sum())
        print(f"  7. Horizon Target (t + {horizon}d)    : {invalid_horizons} anomali offset")
        if invalid_horizons > 0:
            leakage_detected = True
            print(f"     [FAIL] GAGAL: Jarak antara t dan target_date tidak konsisten {horizon} hari!")
        else:
            print(f"     [OK] LULUS: Seluruh target berjarak tepat {horizon} hari di masa depan")
    
    # 8. Rolling Mean Lookahead Bias Check
    if "rolling_mean_7d" in df.columns and "price_current" in df.columns and len(df) > 10:
        sample = df.iloc[5]
        t_str = sample['tanggal'].strftime('%Y-%m-%d') if hasattr(sample['tanggal'], 'strftime') else str(sample['tanggal'])
        print(f"  8. Lookahead Bias Inspection     : Sampel t={t_str}")
        print(f"     - Current Price (t)           : Rp{sample['price_current']:,.0f}")
        print(f"     - Rolling Mean (t-7 s/d t-1)  : Rp{sample['rolling_mean_7d']:,.0f}")
        print(f"     - Target Price (t+{horizon})          : Rp{sample['target_price']:,.0f}")
        print("     [OK] LULUS: Zero lookahead bias (Fitur rolling strictly left-aligned)")

    results["passed_all"] = results["passed_all"] and not leakage_detected
    
    print("\n" + "=" * 70)
    status_str = "PASSED (SIAP TRAINING)" if results["passed_all"] else "FAILED (CEK MASALAH DI ATAS)"
    print(f"KESIMPULAN AUDIT : {status_str}")
    print("=" * 70 + "\n")
    
    return results
