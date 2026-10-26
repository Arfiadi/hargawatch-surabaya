"""Real-time Terminal Observability Monitor for Autoresearch in HargaWatch Surabaya.

Polls and visualizes the live progress of ongoing multi-worker experiments
from `experiments/autoresearch/live_status.json` and `results.tsv`.

Usage:
    python scripts/autoresearch/monitor.py
    python scripts/autoresearch/monitor.py --refresh 1.5
"""

import argparse
import datetime
import json
import os
from pathlib import Path
import sys
import time

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STATUS_FILE = BASE_DIR / "experiments" / "autoresearch" / "live_status.json"
RESULTS_FILE = BASE_DIR / "experiments" / "autoresearch" / "results.tsv"


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def render_progress_bar(pct: float, width: int = 20) -> str:
    """Renders ASCII progress bar."""
    filled = int(width * pct / 100.0)
    bar = "█" * filled + "░" * (width - filled)
    return f"[{bar}] {pct:5.1f}%"


def load_live_status():
    if not STATUS_FILE.exists():
        return None
    try:
        with open(STATUS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def main():
    parser = argparse.ArgumentParser(description="Live Autoresearch Observability Monitor")
    parser.add_argument("--refresh", type=float, default=2.0, help="Refresh interval in seconds (default: 2.0)")
    args = parser.parse_args()

    try:
        while True:
            clear_screen()
            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print("=========================================================================================")
            print(f"  HARGAWATCH AUTORESEARCH - REAL-TIME OBSERVABILITY DASHBOARD  ({now_str})")
            print("=========================================================================================")

            status_data = load_live_status()

            if not status_data:
                print("\n  [INFO] Menunggu eksperimen dimulai... (live_status.json belum aktif)")
                print("  Jalankan eksperimen di terminal lain:")
                print("    python scripts/autoresearch/evaluator.py --cluster 3 --workers 6\n")
            else:
                updated_at = status_data.get("updated_at", "-")
                active_workers = status_data.get("active_workers", 0)
                overall_status = status_data.get("overall_status", "RUNNING")
                commodities = status_data.get("commodities", {})

                print(f"  Status Sesi    : {overall_status} | Active Workers: {active_workers} | Updated: {updated_at}")
                print("-----------------------------------------------------------------------------------------")
                print(f"  {'ID':<3} | {'Komoditas':<21} | {'Progres Jendela':<17} | {'Progress Bar':<28} | {'Status':<9}")
                print("-----------------------------------------------------------------------------------------")

                for cid_str, info in sorted(commodities.items(), key=lambda x: int(x[0])):
                    cid = int(cid_str)
                    name = info.get("name", f"Komoditas {cid}")[:21]
                    cur_win = info.get("current_window", 0)
                    tot_win = info.get("total_windows", 47)
                    pct = info.get("progress_pct", 0.0)
                    st = info.get("status", "IDLE")

                    bar_str = render_progress_bar(pct, width=18)
                    win_str = f"{cur_win}/{tot_win} windows"

                    print(f"  {cid:<3} | {name:<21} | {win_str:<17} | {bar_str:<28} | {st:<9}")

                print("-----------------------------------------------------------------------------------------")

                # Show completed scores if available
                completed_items = [v for v in commodities.values() if v.get("status") == "DONE"]
                if completed_items:
                    print("\n  [SCORECARD RECENT FINISHED]:")
                    for info in completed_items:
                        cname = info.get("name", "")
                        wape = info.get("wape_pct", "-")
                        picp = info.get("picp_pct", "-")
                        da = info.get("da_pct", "-")
                        sec = info.get("elapsed_sec", "-")
                        print(f"    * {cname:<22}: WAPE {wape}% | PICP {picp}% | DA {da}% | Time {sec}s")

            print("\n  Tekan Ctrl+C untuk keluar dari live monitor.")
            time.sleep(args.refresh)

    except KeyboardInterrupt:
        print("\n[INFO] Monitor ditutup.")
        sys.exit(0)


if __name__ == "__main__":
    main()
