import os
import sys
from pathlib import Path

# -------------------------------------------------------------------------
# Ensure portable Graphviz inside project .venv is found on Windows
# -------------------------------------------------------------------------
project_root = Path(__file__).resolve().parent.parent
local_graphviz_bin = project_root / ".venv" / "graphviz" / "Graphviz-12.2.1-win64" / "bin"

if local_graphviz_bin.exists():
    os.environ["PATH"] = str(local_graphviz_bin) + os.pathsep + os.environ.get("PATH", "")

from diagrams import Diagram
from diagrams.c4 import (
    Person,
    Container,
    Database,
    System,
    SystemBoundary,
    Relationship,
)

# Graphviz formatting for clean C4 Model presentation (16:9 widescreen layout)
graph_attr = {
    "fontsize": "20",
    "fontname": "Helvetica-Bold",
    "bgcolor": "#FFFFFF",
    "pad": "0.5",
    "nodesep": "0.8",
    "ranksep": "1.0",
    "splines": "spline",
}

output_path = project_root / "docs" / "hargawatch_c4_container_diagram"

with Diagram(
    "HargaWatch Surabaya — C4 Model (Level 2: Container Diagram)",
    filename=str(output_path),
    show=False,
    direction="TB",
    graph_attr=graph_attr,
):
    # -------------------------------------------------------------
    # 1. Stakeholders / People (Top Tier)
    # -------------------------------------------------------------
    citizens = Person(
        name="Warga & Pelaku UMKM",
        description="Masyarakat dan pedagang mikro yang mencari perbandingan harga termurah antar pasar di Surabaya.",
    )

    officers = Person(
        name="TPID & Satgas Pangan",
        description="Tim Pengendali Inflasi Daerah & Pemkot Surabaya yang memantau risiko kenaikan harga pangan.",
    )

    # -------------------------------------------------------------
    # 2. System Boundary (HargaWatch Surabaya)
    # -------------------------------------------------------------
    with SystemBoundary("HargaWatch Surabaya System"):
        web_app = Container(
            name="Web Application",
            technology="Next.js 15, React 19, Tailwind v4",
            description="Portal web interaktif: Dashboard tren harga, Peta Disparitas Spasial, dan Early Warning Cockpit.",
        )

        pipeline_worker = Container(
            name="Scheduled Pipeline & AI Engine",
            technology="Python 3.12, LightGBM, CatBoost",
            description="Otomasi harian 06:00 WIB: Web scraping, causal imputation, 14-day forecasting, & EWS 4-Pillar risk scoring.",
        )

        central_db = Database(
            name="Central Data Lakehouse",
            technology="Supabase PostgreSQL",
            description="Menyimpan Silver Layer (data historis bersih) dan Gold Layer (hasil forecast p10/p50/p90 & log alert).",
        )

    # -------------------------------------------------------------
    # 3. External Systems
    # -------------------------------------------------------------
    siskaperbapo = System(
        name="SISKAPERBAPO Jatim",
        description="Portal resmi Disperindag Jatim yang memuat data harga harian 6 pasar tradisional di Surabaya.",
        external=True,
    )

    open_meteo = System(
        name="Open-Meteo ERA5 API",
        description="Layanan cuaca historis & prakiraan harian (suhu dan curah hujan) untuk fitur machine learning.",
        external=True,
    )

    bps_macro = System(
        name="BPS & Kalender Nasional",
        description="Penyedia data statistik IHK bulanan, indikator makro, serta jadwal libur dan Ramadhan.",
        external=True,
    )

    telegram_api = System(
        name="Telegram Bot API",
        description="Platform pesan instan untuk dispatch push alert darurat (status WASPADA / BAHAYA) ke petugas.",
        external=True,
    )

    # -------------------------------------------------------------
    # 4. Relationships (C4 Standard with Protocols)
    # -------------------------------------------------------------
    # People to Web Application
    citizens >> Relationship("Mengakses dashboard & peta disparitas [HTTPS]") >> web_app
    officers >> Relationship("Menganalisis anomali & cockpit EWS [HTTPS]") >> web_app

    # Web App to Database
    web_app >> Relationship("Query agregasi harga & prediksi [HTTPS / Supabase Client]") >> central_db

    # Worker Ingestion from External Sources
    pipeline_worker >> Relationship("Scrape data harga 6 pasar [HTTPS / HTML]") >> siskaperbapo
    pipeline_worker >> Relationship("Fetch data cuaca & presipitasi [HTTPS / JSON]") >> open_meteo
    pipeline_worker >> Relationship("Sinkronisasi IHK & kalender libur [HTTPS / CSV]") >> bps_macro

    # Worker Database Interactions
    pipeline_worker >> Relationship("Upsert data Silver & baca lag fitur [PostgreSQL TCP / Port 5432]") >> central_db
    pipeline_worker >> Relationship("Menyimpan hasil forecast & status EWS [PostgreSQL TCP / Port 5432]") >> central_db

    # Alerting Flow
    pipeline_worker >> Relationship("Kirim pesan jika status BAHAYA [HTTPS / Bot API]") >> telegram_api
    telegram_api >> Relationship("Terima push alert instan [Telegram Mobile App]", constraint="false") >> officers

print(f"C4 Container diagram successfully generated at: {output_path}.png")
