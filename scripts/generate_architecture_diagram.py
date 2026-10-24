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

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.network import Internet
from diagrams.generic.os import Windows
from diagrams.programming.language import Python
from diagrams.onprem.database import PostgreSQL
from diagrams.programming.framework import NextJs
from diagrams.saas.chat import Telegram
from diagrams.onprem.client import Users, User

# Graph canvas styling — 16:9 widescreen presentation optimized
graph_attr = {
    "fontsize": "22",
    "fontname": "Helvetica-Bold",
    "bgcolor": "#FFFFFF",
    "pad": "0.4",
    "nodesep": "0.55",
    "ranksep": "0.95",
    "splines": "spline",
}

node_attr = {
    "fontname": "Helvetica",
    "fontsize": "10",
    "fontcolor": "#0F172A",
    "width": "1.7",
    "height": "1.3",
}

edge_attr = {
    "fontname": "Helvetica",
    "fontsize": "8.5",
    "color": "#64748B",
    "fontcolor": "#334155",
}

def cluster_style(bg, pen, text):
    return {
        "bgcolor": bg,
        "pencolor": pen,
        "penwidth": "1.5",
        "fontname": "Helvetica-Bold",
        "fontsize": "11",
        "fontcolor": text,
        "margin": "16",
    }

output_path = project_root / "docs" / "hargawatch_architecture_mingrammer"

with Diagram(
    "HargaWatch Surabaya — End-to-End Enterprise System Architecture",
    filename=str(output_path),
    show=False,
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    # -------------------------------------------------------------
    # 1. Orchestration & Daily Runner
    # -------------------------------------------------------------
    with Cluster("1. Orchestrator", graph_attr=cluster_style("#F8FAFC", "#CBD5E1", "#334155")):
        sched = Windows("Task Scheduler\n(06:00 WIB Daily)")

    # -------------------------------------------------------------
    # 2. External Data Sources
    # -------------------------------------------------------------
    with Cluster("2. Data Sources", graph_attr=cluster_style("#F0F9FF", "#BAE6FD", "#0369A1")):
        src_pasar = Internet("SISKAPERBAPO Jatim\n(Web Scraper · 6 Pasar)")
        src_cuaca = Internet("Open-Meteo ERA5\n(Weather API · Suhu/Hujan)")
        src_macro = Internet("BPS & Kalender\n(Inflasi & Hari Libur)")

    # -------------------------------------------------------------
    # 3. Ingestion & Preprocessing Pipeline
    # -------------------------------------------------------------
    with Cluster("3. Ingestion & ETL", graph_attr=cluster_style("#ECFDF5", "#A7F3D0", "#065F46")):
        etl = Python("Python ETL Pipeline\n(Causal Forward-Fill)")

    # -------------------------------------------------------------
    # 4. Silver Lakehouse (Clean Historic Data)
    # -------------------------------------------------------------
    with Cluster("4. Silver DB", graph_attr=cluster_style("#EFF6FF", "#BFDBFE", "#1E40AF")):
        db_silver = PostgreSQL("Supabase Silver\n(Clean Historic DB)")

    # -------------------------------------------------------------
    # 5. AI Analytics & Decision Intelligence
    # -------------------------------------------------------------
    with Cluster("5. AI Intelligence", graph_attr=cluster_style("#FFFBEB", "#FDE68A", "#854D0E")):
        ai = Python("Quantile Forecaster\n(LightGBM / CatBoost)")
        ews = Python("EWS 4-Pillar Scorer\n(Composite Risk Index)")

    # -------------------------------------------------------------
    # 6. Gold Lakehouse (Curated Analytics & EWS Store)
    # -------------------------------------------------------------
    with Cluster("6. Gold DB", graph_attr=cluster_style("#FFF1F2", "#FECDD3", "#9F1239")):
        db_gold = PostgreSQL("Supabase Gold\n(Forecast & EWS Tables)")

    # -------------------------------------------------------------
    # 7. Serving, Alerting & Application Layer
    # -------------------------------------------------------------
    with Cluster("7. Delivery & UI", graph_attr=cluster_style("#F8FAFC", "#E2E8F0", "#0F172A")):
        bot = Telegram("Telegram Bot\n(Daily Push Alerts)")
        web = NextJs("Next.js 15 App Router\n(React 19 + Tailwind v4)")

    # -------------------------------------------------------------
    # 8. End Users & Stakeholders
    # -------------------------------------------------------------
    with Cluster("8. Stakeholders", graph_attr=cluster_style("#FAF5FF", "#E9D5FF", "#6B21A8")):
        gov = User("TPID & Satgas Pangan\n(Monitoring & Intervensi)")
        cit = Users("Warga & UMKM Surabaya\n(Belanja Cerdas Hemat)")

    # =============================================================
    # HORIZONTAL PIPELINE FLOW (Clean Linear DAG)
    # =============================================================
    # 1 -> 2: Orchestrator triggers extraction
    sched >> Edge(label="daily trigger", color="#059669") >> src_pasar
    sched >> Edge(color="#059669") >> src_cuaca
    sched >> Edge(color="#059669") >> src_macro

    # 2 -> 3: Scraped & fetched data streams into Python ETL
    src_pasar >> Edge(label="raw html", color="#0284C7") >> etl
    src_cuaca >> Edge(label="json api", color="#0284C7") >> etl
    src_macro >> Edge(label="csv/calendar", color="#0284C7") >> etl

    # 3 -> 4: Preprocessed data upserted to Silver Layer
    etl >> Edge(label="upserts clean series", color="#059669", style="bold") >> db_silver

    # 4 -> 5: AI Engine trains/predicts with historic lags
    db_silver >> Edge(label="time-series lags", color="#2563EB") >> ai
    ai >> Edge(label="14-day p10/p50/p90", color="#D97706", style="bold") >> ews

    # 5 -> 6: EWS scores and predictions saved to Gold Layer
    ews >> Edge(label="risk scores & status", color="#D97706", style="bold") >> db_gold

    # 6 -> 7: Gold Layer feeds Telegram alerts & Next.js dashboard
    db_gold >> Edge(label="status BAHAYA/WASPADA", color="#DC2626", style="bold") >> bot
    db_gold >> Edge(label="forecast & ews api", color="#2563EB") >> web
    db_silver >> Edge(label="historic prices", color="#64748B", style="dashed") >> web

    # 7 -> 8: Delivering value to stakeholders
    bot >> Edge(label="instant push notification", color="#DC2626", style="bold") >> gov
    web >> Edge(label="ews monitoring cockpit", color="#2563EB") >> gov
    web >> Edge(label="public dashboard & map", color="#2563EB") >> cit

print(f"HargaWatch Architecture diagram successfully generated at: {output_path}.png")
