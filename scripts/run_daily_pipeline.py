"""Master Daily Pipeline Orchestrator for HargaWatch Surabaya.

Executes the sequential daily production workflow:
  Step 1: Scrape & Ingest latest market & producer prices (`scripts/update_harian.py`)
  Step 2: Generate 14-day forecasts & EWS risk matrices (`scripts/run_forecasting.py --from-db`)

Designed to be invoked by Windows Task Scheduler (via run_pipeline.bat)
or Linux cron jobs.
"""

import argparse
import datetime
import os
import subprocess
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = BASE_DIR / "scripts"
PYTHON_EXE = sys.executable


def log(msg: str):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now}] {msg}", flush=True)


def run_step(step_name: str, cmd: list) -> bool:
    """Executes a subprocess step, streaming output in real-time."""
    log(f"--- STARTING: {step_name} ---")
    log(f"Command: {' '.join(cmd)}")
    start_time = time.time()

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    proc = subprocess.Popen(
        cmd,
        cwd=str(BASE_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )

    for line in iter(proc.stdout.readline, ""):
        print(f"  [{step_name}] {line.rstrip()}", flush=True)

    proc.stdout.close()
    return_code = proc.wait()
    duration = time.time() - start_time

    if return_code == 0:
        log(f"--- SUCCESS: {step_name} (completed in {duration:.1f}s) ---\n")
        return True
    else:
        log(f"--- ERROR: {step_name} failed with exit code {return_code} (took {duration:.1f}s) ---\n")
        return False


def main():
    parser = argparse.ArgumentParser(description="HargaWatch Surabaya - Daily Production Pipeline Runner")
    parser.add_argument("--tanggal", type=str, default=None, help="Target date YYYY-MM-DD for scraping (default: yesterday)")
    parser.add_argument("--skip-scrape", action="store_true", help="Skip the scraping step")
    parser.add_argument("--skip-forecast", action="store_true", help="Skip the forecasting step")
    parser.add_argument("--local-only", action="store_true", help="Do not upsert forecasting/EWS to Supabase")
    parser.add_argument("--horizon", type=int, default=14, help="Forecast horizon in days (default: 14)")
    args = parser.parse_args()

    overall_start = time.time()
    log("=================================================================")
    log("  HARGAWATCH SURABAYA - DAILY PRODUCTION PIPELINE EXECUTION")
    log("=================================================================")

    # Step 1: Scrape & Ingest Data
    if not args.skip_scrape:
        scrape_cmd = [PYTHON_EXE, str(SCRIPTS_DIR / "update_harian.py")]
        if args.tanggal:
            scrape_cmd.extend(["--tanggal", args.tanggal])

        success_scrape = run_step("DATA_SCRAPING", scrape_cmd)
        if not success_scrape:
            log("[FATAL] Data scraping failed. Aborting downstream forecasting to prevent stale predictions.")
            sys.exit(1)
    else:
        log("[INFO] Skipping data scraping step as requested (--skip-scrape).")

    # Step 2: Forecasting & Early Warning Scoring
    if not args.skip_forecast:
        forecast_cmd = [
            PYTHON_EXE,
            str(SCRIPTS_DIR / "run_forecasting.py"),
            "--horizon",
            str(args.horizon),
            "--from-db",
        ]
        if args.local_only:
            forecast_cmd.append("--local-only")

        success_forecast = run_step("FORECASTING_AND_EWS", forecast_cmd)
        if not success_forecast:
            log("[ERROR] Forecasting step encountered errors.")
            sys.exit(2)
    else:
        log("[INFO] Skipping forecasting step as requested (--skip-forecast).")

    # Step 3: Dispatch Telegram Alerts
    if not args.skip_forecast:  # Hanya dispatch jika forecasting berjalan atau ada data baru
        alert_cmd = [PYTHON_EXE, str(SCRIPTS_DIR / "generate_daily_alerts.py")]
        success_alert = run_step("DISPATCH_TELEGRAM_ALERTS", alert_cmd)
        if not success_alert:
            log("[WARNING] Alert dispatcher encountered errors (Non-fatal).")

    total_duration = time.time() - overall_start
    log("=================================================================")
    log(f"  ALL DAILY PIPELINE TASKS COMPLETED SUCCESSFULLY ({total_duration:.1f}s)")
    log("=================================================================")
    sys.exit(0)


if __name__ == "__main__":
    main()
