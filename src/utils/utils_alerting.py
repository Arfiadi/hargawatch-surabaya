"""Utility Alerting Telegram untuk HargaWatch Pipeline.

Membaca TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID dari environment / .env.
Jika kredensial belum diatur, fungsi akan mencatat log tanpa menghentikan program.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


def send_telegram_alert(pesan: str) -> bool:
    """Mengirim pesan notifikasi / error alert ke channel/chat Telegram.
    
    Args:
        pesan: Teks pesan yang ingin dikirimkan.
        
    Returns:
        bool: True jika berhasil terkirim, False jika gagal atau kredensial kosong.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN") or TELEGRAM_BOT_TOKEN
    chat_id = os.getenv("TELEGRAM_CHAT_ID") or TELEGRAM_CHAT_ID

    if not token or not chat_id or token == "isi_token_bot_telegram_di_sini":
        print(f"  [Alerting] Telegram credentials belum diset. Alert ditampung di log:\n  >>> {pesan}")
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": pesan,
        "parse_mode": "Markdown"
    }

    try:
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code == 200:
            print("  [Alerting] Notifikasi Telegram berhasil dikirim.")
            return True
        else:
            print(f"  [Alerting] Gagal kirim Telegram (Status {resp.status_code}): {resp.text}")
            return False
    except Exception as e:
        print(f"  [Alerting] Exception saat menghubungi Telegram API: {e}")
        return False


if __name__ == "__main__":
    import time

    print("\n--- [SIMULASI 1: NOTIFIKASI BERHASIL] ---")
    pesan_sukses = (
        "✅ *[HargaWatch Update - BERHASIL]*\n\n"
        "📅 *Tanggal Target:* 2026-09-20\n"
        "📊 *Status Pipeline:*\n"
        "  • Fact Harga Pasar: 180 baris tersimpan\n"
        "  • Fact Harga Produsen: 45 baris tersimpan\n"
        "  • Imputasi & Validasi: Lolos\n\n"
        "✨ Semua data komoditas Surabaya berhasil diperbarui."
    )
    send_telegram_alert(pesan_sukses)

    print("\nMenunggu 2 detik...")
    time.sleep(2)

    print("\n--- [SIMULASI 2: NOTIFIKASI GAGAL / ALERT] ---")
    pesan_gagal = (
        "🚨 *[HargaWatch Alert - GAGAL SCRAPING]*\n\n"
        "📅 *Tanggal Target:* 2026-09-20\n"
        "⚠️ *Detail Masalah:*\n"
        "  • 2 sumber data gagal dihubungi (Pasar Genteng, Pasar Pabean)\n"
        "  • Error: `Connection timed out to SISKAPERBAPO`\n\n"
        "🔄 *Tindakan:* Sistem akan mencoba otomatis (retry) pada jadwal berikutnya."
    )
    send_telegram_alert(pesan_gagal)

    print("\n>> [SELESAI] Silakan cek grup Telegram 'HargaWatch' untuk melihat tampilan kedua simulasi!")
