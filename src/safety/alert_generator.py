"""Alert Generator: Automated text template builder for Price Surge Alerts."""

import pandas as pd
from typing import Dict, List, Optional
import datetime

def format_pilar_pemicu(row: pd.Series) -> str:
    """Mengidentifikasi pilar mana yang paling berkontribusi terhadap skor bahaya."""
    pilar = []
    if row.get("skor_prediksi", 0) >= 20:
        pilar.append("Proyeksi ML (Naik Tajam)")
    if row.get("skor_anomali", 0) >= 20:
        pilar.append("Disparitas Grosir (Stok Hulu Menipis)")
    if row.get("skor_volatilitas", 0) >= 18:
        pilar.append("Volatilitas Pasar")
    if row.get("skor_tren", 0) >= 18:
        pilar.append("Tren Harga Historis")
        
    if not pilar:
        pilar.append("Akumulasi Multi-Faktor")
        
    return ", ".join(pilar)


def generate_telegram_markdown_alert(
    df_ews_today: pd.DataFrame, 
    dict_komoditas: Dict[int, str], 
    dict_pasar: Dict[int, str]
) -> Optional[str]:
    """
    Menyusun teks Markdown berformat untuk dikirim ke bot Telegram.
    Hanya melaporkan status TINGGI dan WASPADA.
    Mengembalikan None jika semua NORMAL.
    """
    if df_ews_today.empty:
        return None

    # Filter hanya komoditas yang bermasalah
    df_alert = df_ews_today[df_ews_today["status_warning"].isin(["TINGGI", "WASPADA"])].copy()
    
    if df_alert.empty:
        return None
        
    # Urutkan dari skor bahaya tertinggi ke terendah
    df_alert = df_alert.sort_values(by="total_skor", ascending=False)
    
    # Ambil tanggal dari row pertama
    tanggal_str = df_alert["tanggal"].iloc[0]
    if isinstance(tanggal_str, pd.Timestamp):
        tanggal_str = tanggal_str.strftime("%d %B %Y")
        
    # Kumpulkan daftar status
    list_tinggi = df_alert[df_alert["status_warning"] == "TINGGI"]
    list_waspada = df_alert[df_alert["status_warning"] == "WASPADA"]

    lines = []
    lines.append("🚨 *HARGAWATCH: PERINGATAN DINI HARGA PANGAN* 🚨")
    lines.append(f"📅 *Tanggal:* {tanggal_str}")
    lines.append(f"\n⚠️ Terdeteksi *{len(df_alert)} anomali pasar* hari ini yang perlu dipantau:\n")

    if not list_tinggi.empty:
        lines.append("🔴 *STATUS TINGGI (BAHAYA)*")
        for _, row in list_tinggi.iterrows():
            kom_name = dict_komoditas.get(row["komoditas_id"], f"ID {row['komoditas_id']}")
            pas_name = dict_pasar.get(row["pasar_id"], f"Pasar {row['pasar_id']}")
            pemicu = format_pilar_pemicu(row)
            
            lines.append(f"• *{kom_name}* di *{pas_name}*")
            lines.append(f"  └ Skor: {int(row['total_skor'])}/100 | Pemicu utama: _{pemicu}_")
        lines.append("") # Spasi antar bagian

    if not list_waspada.empty:
        lines.append("🟡 *STATUS WASPADA*")
        # Jika terlalu banyak status waspada, batasi 5 teratas agar Telegram tidak spam/terlalu panjang
        limit = 5
        for _, row in list_waspada.head(limit).iterrows():
            kom_name = dict_komoditas.get(row["komoditas_id"], f"ID {row['komoditas_id']}")
            pas_name = dict_pasar.get(row["pasar_id"], f"Pasar {row['pasar_id']}")
            pemicu = format_pilar_pemicu(row)
            
            lines.append(f"• *{kom_name}* di *{pas_name}*")
            lines.append(f"  └ Skor: {int(row['total_skor'])}/100 | Pemicu utama: _{pemicu}_")
            
        if len(list_waspada) > limit:
            lines.append(f"  _...dan {len(list_waspada) - limit} peringatan waspada lainnya._")
        lines.append("")

    lines.append("💡 _Harap segera periksa dashboard internal HargaWatch untuk melihat detail prediksi dan intervensi pasar._")
    
    return "\n".join(lines)
