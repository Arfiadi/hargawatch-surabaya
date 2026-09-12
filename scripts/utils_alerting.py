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
