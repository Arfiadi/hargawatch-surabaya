"""Daily alert generator: evaluates risk status and updates early warning text."""

import argparse
import sys
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from src.safety.alert_generator import generate_telegram_markdown_alert
from src.utils.utils_alerting import send_telegram_alert

def main():
    parser = argparse.ArgumentParser(description="HargaWatch Telegram Alert Dispatcher")
    parser.add_argument("--date", type=str, help="Specific date to evaluate YYYY-MM-DD. Defaults to latest.")
    args = parser.parse_args()

    # Lokasi data
    ews_path = BASE_DIR / "data" / "processed" / "fact_early_warning.csv"
    dim_kom_path = BASE_DIR / "data" / "processed" / "dim_komoditas.csv"
    dim_pasar_path = BASE_DIR / "data" / "processed" / "dim_pasar.csv"
    
    if not ews_path.exists():
        print(f"[Alerting] Tidak ada data EWS di {ews_path}. Batal mengeksekusi.")
        return

    df_ews = pd.read_csv(ews_path)
    if args.date:
        df_today = df_ews[df_ews["tanggal"] == args.date].copy()
    else:
        # Ambil tanggal terbaru yang tersedia di tabel
        latest_date = df_ews["tanggal"].max()
        df_today = df_ews[df_ews["tanggal"] == latest_date].copy()

    if df_today.empty:
        print("[Alerting] Tidak ada record EWS untuk tanggal yang diminta.")
        return

    # Load dimensi untuk nama komoditas dan pasar
    df_kom = pd.read_csv(dim_kom_path) if dim_kom_path.exists() else pd.DataFrame(columns=["komoditas_id", "komoditas"])
    df_pas = pd.read_csv(dim_pasar_path) if dim_pasar_path.exists() else pd.DataFrame(columns=["pasar_id", "nama_pasar"])
    
    dict_komoditas = dict(zip(df_kom["komoditas_id"], df_kom["komoditas"]))
    dict_pasar = dict(zip(df_pas["pasar_id"], df_pas["nama_pasar"]))

    print(f"[Alerting] Mengevaluasi {len(df_today)} record EWS untuk tanggal {df_today['tanggal'].iloc[0]}...")
    
    markdown_text = generate_telegram_markdown_alert(df_today, dict_komoditas, dict_pasar)
    
    if markdown_text:
        print("[Alerting] Ditemukan status WASPADA/TINGGI. Mempersiapkan pengiriman ke Telegram...")
        success = send_telegram_alert(markdown_text)
        if success:
            print("[Alerting] [SUCCESS] Notifikasi Telegram berhasil dikirim!")
        else:
            print("[Alerting] [FAILED] Gagal mengirim notifikasi Telegram. Cek kredensial di .env.")
    else:
        print("[Alerting] [SUCCESS] Semua komoditas aman (NORMAL). Tidak ada notifikasi yang dikirim.")

if __name__ == "__main__":
    main()
