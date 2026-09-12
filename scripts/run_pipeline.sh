#!/usr/bin/env bash
# ==============================================================================
# Runner Pipeline Harian HargaWatch Surabaya untuk Linux VPS / Cron
# ==============================================================================
# Penggunaan di Crontab (misal jalan jam 05:00 WIB setiap hari):
# 0 5 * * * /bin/bash /path/to/hargawatch-surabaya/scripts/run_pipeline.sh >> /path/to/hargawatch-surabaya/cron_output.log 2>&1
# ==============================================================================

set -e

# Pindah ke direktori root repository
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Memulai Pipeline Harian HargaWatch"
echo "Direktori Kerja: $PROJECT_DIR"

# Aktifkan virtual environment jika ada
if [ -d ".venv" ]; then
    echo "Mengaktifkan virtual environment (.venv)..."
    source .venv/bin/activate
elif [ -d "venv" ]; then
    echo "Mengaktifkan virtual environment (venv)..."
    source venv/bin/activate
else
    echo "[!] Peringatan: Virtual environment tidak ditemukan, menggunakan python sistem."
fi

# Pastikan dependensi terbaru terpasang jika diperlukan
export PYTHONUNBUFFERED=1

# Jalankan skrip update harian
echo "Menjalankan update_harian.py..."
python scripts/update_harian.py

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pipeline Harian Selesai."
echo "=================================================="
