"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ForecastingPage() {
  const [horizon, setHorizon] = useState<number>(14);
  const [selectedCommodity, setSelectedCommodity] = useState<string>("cabai-rawit");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [dispatched, setDispatched] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  const projectionRows = [
    {
      day: "H+1 • 25 Feb 2025",
      sub: "Besok",
      lower: "Rp 71.000",
      mean: "Rp 72.800",
      upper: "Rp 74.500",
      delta: "+2.25%",
      status: "WASPADA",
      statusClass: "bg-status-warning-bg text-status-warning",
      recom: "Pengecekan stok gudang distributor Osowilangun",
      isCritical: false,
      isPeak: false,
    },
    {
      day: "H+2 • 26 Feb 2025",
      sub: "Rabu",
      lower: "Rp 72.800",
      mean: "Rp 74.900",
      upper: "Rp 77.200",
      delta: "+5.20%",
      status: "WASPADA",
      statusClass: "bg-status-warning-bg text-status-warning",
      recom: "Monitoring arus masuk truk antarkota Tol Waru",
      isCritical: false,
      isPeak: false,
    },
    {
      day: "H+3 • 27 Feb 2025",
      sub: "Kamis",
      lower: "Rp 75.100",
      mean: "Rp 77.500",
      upper: "Rp 80.100",
      delta: "+8.85%",
      status: "TINGGI",
      statusClass: "bg-status-critical-bg text-status-critical",
      recom: "Aktivasi koordinasi BUMD Surya Kencana subsidi transpor",
      isCritical: true,
      isPeak: false,
    },
    {
      day: "H+4 • 28 Feb 2025",
      sub: "Jumat",
      lower: "Rp 77.400",
      mean: "Rp 79.800",
      upper: "Rp 82.600",
      delta: "+12.08%",
      status: "TINGGI",
      statusClass: "bg-status-critical-bg text-status-critical",
      recom: "Pemberitahuan dini pedagang Pasar Wonokromo & Keputran",
      isCritical: true,
      isPeak: false,
    },
    {
      day: "H+5 • 01 Mar 2025",
      sub: "Sabtu (Weekend)",
      lower: "Rp 79.200",
      mean: "Rp 81.600",
      upper: "Rp 84.800",
      delta: "+14.61%",
      status: "KRITIS",
      statusClass: "bg-status-critical-bg text-status-critical",
      recom: "Gelar Gerakan Pangan Murah (GPM) Tahap I di 10 Titik",
      isCritical: true,
      isPeak: false,
    },
    {
      day: "H+6 • 02 Mar 2025",
      sub: "ESTIMASI TITIK PUNCAK",
      lower: "Rp 80.000",
      mean: "Rp 82.500",
      upper: "Rp 86.400",
      delta: "+15.87%",
      status: "PUNCAK ANOMALI",
      statusClass: "bg-status-critical text-on-error",
      recom: "Intervensi Penetrasi Pasokan 15 Ton Cabai Petani Binaan",
      isCritical: true,
      isPeak: true,
    },
    {
      day: "H+7 • 03 Mar 2025",
      sub: "Senin",
      lower: "Rp 78.500",
      mean: "Rp 81.000",
      upper: "Rp 84.100",
      delta: "+13.76%",
      status: "KRITIS",
      statusClass: "bg-status-critical-bg text-status-critical",
      recom: "Fasilitasi distribusi lanjutan antarpasar sekunder",
      isCritical: true,
      isPeak: false,
    },
    {
      day: "H+10 • 06 Mar 2025",
      sub: "Kamis",
      lower: "Rp 72.000",
      mean: "Rp 75.200",
      upper: "Rp 79.000",
      delta: "+5.62%",
      status: "WASPADA",
      statusClass: "bg-status-warning-bg text-status-warning",
      recom: "Penerimaan pasokan panen raya Blitar & Kediri",
      isCritical: false,
      isPeak: false,
    },
    {
      day: "H+14 • 10 Mar 2025",
      sub: "Senin",
      lower: "Rp 65.500",
      mean: "Rp 69.400",
      upper: "Rp 74.000",
      delta: "-2.53%",
      status: "NORMALISASI",
      statusClass: "bg-status-normal-bg text-status-normal",
      recom: "Pasar kembali ke ekuilibrium normal awal Ramadan",
      isCritical: false,
      isPeak: false,
    },
  ];

  const filteredRows = projectionRows.filter((r) => {
    if (filterRisk === "critical") {
      return r.isCritical;
    }
    return true;
  });

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const csvContent =
        "Hari/Tanggal,Batas Bawah (80% CI),Proyeksi Rata-rata,Batas Atas (95% CI),Delta vs Hari Ini,Status,Rekomendasi Aksi\n" +
        projectionRows
          .map(
            (r) =>
              `"${r.day}","${r.lower}","${r.mean}","${r.upper}","${r.delta}","${r.status}","${r.recom}"`
          )
          .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "simulasi_forecasting_hargawatch.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(false);
    }, 800);
  };

  const handleDispatch = () => {
    setDispatched(true);
    setTimeout(() => {
      setDispatched(false);
    }, 3000);
  };

  return (
    <div className="bg-surface-canvas text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Header />

      <main className="w-full pt-20 bg-surface-canvas min-h-screen">
        <div className="flex flex-col w-full">
          <div className="w-full max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop py-space-lg flex flex-col gap-space-xl">
            {/* Context Indicator & Top Metadata */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-space-2xs">
                <div className="flex items-center gap-space-xs">
                  <span className="inline-flex items-center gap-1.5 px-space-xs py-space-2xs rounded-full bg-surface-container text-primary font-label-caps text-label-caps">
                    <span className="material-symbols-outlined text-body-sm text-primary">insights</span>
                    ENGINE AI FORECASTING V3.2
                  </span>
                  <span className="inline-flex items-center px-space-xs py-space-2xs rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
                    MAPE MODEL: 3.82% (VALIDASI HISTORIS TINGGI)
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-space-sm gap-y-1">
                  <span className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                    Time-Series &amp; Proyeksi Musiman Pangan
                  </span>
                  <span className="font-body-sm text-body-sm text-text-secondary">
                    Basis Integrasi SP2KP, BMKG Maritim Perak &amp; BPS Surabaya
                  </span>
                </div>
              </div>
              {/* Quick Action Stats Strip */}
              <div className="flex items-center gap-space-sm bg-surface-card p-space-xs rounded-xl shadow-sm">
                <div className="flex flex-col px-space-xs">
                  <span className="font-label-caps text-label-caps text-text-muted">STATUS MODEL</span>
                  <span className="font-headline-sm text-headline-sm text-status-normal flex items-center gap-1">
                    Konvergen
                    <span className="material-symbols-outlined text-body-sm">check_circle</span>
                  </span>
                </div>
                <div className="w-px h-8 bg-surface-container"></div>
                <div className="flex flex-col px-space-xs">
                  <span className="font-label-caps text-label-caps text-text-muted">ESTIMASI PUNCAK</span>
                  <span className="font-headline-sm text-headline-sm text-status-critical">
                    H+6 (Rp 82.500)
                  </span>
                </div>
                <div className="w-px h-8 bg-surface-container"></div>
                <button
                  className="flex items-center gap-1.5 px-space-sm py-space-xs rounded-lg bg-primary text-on-primary font-headline-sm text-body-sm hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                  id="btnExportSimulation"
                  onClick={handleExport}
                >
                  <span className="material-symbols-outlined text-body-md">
                    {exporting ? "sync" : "download"}
                  </span>
                  <span>{exporting ? "Mengunduh..." : "Unduh Matriks CSV"}</span>
                </button>
              </div>
            </div>

            {/* Parameter Filter Control Matrix */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-sm">
                <div>
                  <span className="font-title-md text-title-md text-text-primary block">
                    Parameter Simulasi &amp; Prediktif
                  </span>
                  <span className="font-body-sm text-body-sm text-text-secondary">
                    Konfigurasikan model ensemble, horizon waktu, dan kovariat eksternal
                  </span>
                </div>
                <div className="flex items-center gap-space-xs bg-surface-subtle p-1 rounded-lg">
                  <button
                    className={`px-space-sm py-1.5 rounded-lg text-body-sm font-headline-sm transition-all cursor-pointer ${
                      horizon === 7
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    id="horizon7"
                    onClick={() => setHorizon(7)}
                  >
                    7 Hari
                  </button>
                  <button
                    className={`px-space-sm py-1.5 rounded-lg text-body-sm font-headline-sm transition-all cursor-pointer ${
                      horizon === 14
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    id="horizon14"
                    onClick={() => setHorizon(14)}
                  >
                    14 Hari (Rekomendasi)
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md pt-space-xs">
                {/* Commodity Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps text-text-secondary">
                    KOMODITAS UTAMA
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-surface-subtle text-text-primary font-body-md text-body-md px-space-sm py-2.5 rounded-lg appearance-none focus:outline-none cursor-pointer"
                      id="commoditySelect"
                      value={selectedCommodity}
                      onChange={(e) => setSelectedCommodity(e.target.value)}
                    >
                      <option value="cabai-rawit">Cabai Rawit Merah (Rp/Kg)</option>
                      <option value="beras-premium">Beras Premium Bengawan (Rp/Kg)</option>
                      <option value="minyak-goreng">Minyak Goreng Curah / Kita (Rp/Liter)</option>
                      <option value="bawang-merah">Bawang Merah Probolinggo (Rp/Kg)</option>
                      <option value="daging-sapi">Daging Sapi Paha Belakang (Rp/Kg)</option>
                      <option value="telur-ayam">Telur Ayam Ras (Rp/Kg)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                      keyboard_arrow_down
                    </span>
                  </div>
                </div>
                {/* ML Model Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps text-text-secondary">
                    ARSITEKTUR PREDIKTIF
                  </label>
                  <div className="relative">
                    <select className="w-full bg-surface-subtle text-text-primary font-body-md text-body-md px-space-sm py-2.5 rounded-lg appearance-none focus:outline-none cursor-pointer">
                      <option>Ensemble ARIMA + Prophet + LSTM</option>
                      <option>DeepAR Recurrent Network</option>
                      <option>Vector Autoregression (VAR Multi-Pasar)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                      tune
                    </span>
                  </div>
                </div>
                {/* Confidence Band Range */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps text-text-secondary">
                    RENTANG INTERVAL KEPERCAYAAN
                  </label>
                  <div className="flex items-center justify-between bg-surface-subtle px-space-sm py-2 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer font-body-sm text-body-sm text-text-primary">
                      <input defaultChecked className="w-4 h-4 accent-primary rounded" type="checkbox" />
                      <span>CI 80%</span>
                    </label>
                    <div className="w-px h-5 bg-surface-container"></div>
                    <label className="flex items-center gap-2 cursor-pointer font-body-sm text-body-sm text-text-primary">
                      <input defaultChecked className="w-4 h-4 accent-primary rounded" type="checkbox" />
                      <span>CI 95%</span>
                    </label>
                    <div className="w-px h-5 bg-surface-container"></div>
                    <span className="font-label-caps text-label-caps text-status-normal font-bold">
                      OPTIMAL
                    </span>
                  </div>
                </div>
                {/* Baseline Comparison Threshold */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps text-text-secondary">
                    BENCHMARK REGULASI
                  </label>
                  <div className="flex items-center justify-between bg-surface-subtle px-space-sm py-2 rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-status-critical font-bold">
                        HAP BAPANAS
                      </span>
                      <span className="font-metric-value text-metric-value text-text-primary">
                        Rp 57.000
                      </span>
                    </div>
                    <span className="px-space-xs py-1 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps">
                      DEVIASI +44.7%
                    </span>
                  </div>
                </div>
              </div>
              {/* External Factor Overlays */}
              <div className="pt-space-xs flex flex-wrap items-center gap-space-sm">
                <span className="font-label-caps text-label-caps text-text-secondary">OVERLAY KOVARIAT:</span>
                <label className="inline-flex items-center gap-2 px-space-sm py-1 rounded-full bg-surface-subtle hover:bg-surface-container transition-colors cursor-pointer">
                  <input defaultChecked className="w-3.5 h-3.5 accent-primary rounded" type="checkbox" />
                  <span className="material-symbols-outlined text-body-sm text-secondary">cloud</span>
                  <span className="font-body-sm text-body-sm text-text-primary">
                    Curah Hujan BMKG (Jawa Timur Sentra)
                  </span>
                </label>
                <label className="inline-flex items-center gap-2 px-space-sm py-1 rounded-full bg-surface-subtle hover:bg-surface-container transition-colors cursor-pointer">
                  <input defaultChecked className="w-3.5 h-3.5 accent-primary rounded" type="checkbox" />
                  <span className="material-symbols-outlined text-body-sm text-status-warning">
                    calendar_month
                  </span>
                  <span className="font-body-sm text-body-sm text-text-primary">
                    Kalender Ramadan &amp; Cuti Bersama
                  </span>
                </label>
                <label className="inline-flex items-center gap-2 px-space-sm py-1 rounded-full bg-surface-subtle hover:bg-surface-container transition-colors cursor-pointer">
                  <input defaultChecked className="w-3.5 h-3.5 accent-primary rounded" type="checkbox" />
                  <span className="material-symbols-outlined text-body-sm text-primary">trending_up</span>
                  <span className="font-body-sm text-body-sm text-text-primary">
                    Indeks Inflasi Transportasi BPS
                  </span>
                </label>
                <div className="ml-auto font-label-caps text-label-caps text-text-muted">
                  Sinkronisasi Model Terakhir: 10 menit lalu
                </div>
              </div>
            </div>

            {/* MAIN FORECASTING VISUALIZATION BENTO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
              {/* Chart Area: 9 Cols */}
              <div className="lg:col-span-9 bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline-md text-headline-md text-text-primary">
                        Trayektori Cabai Rawit Merah
                      </span>
                      <span className="px-space-xs py-0.5 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps">
                        FASE LONJAKAN H-7
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                      30 Hari Historis Rata-rata 6 Pasar Induk Surabaya + 14 Hari Model Prediktif Bayesian Ensemble
                    </p>
                  </div>
                  {/* Chart Legend */}
                  <div className="flex flex-wrap items-center gap-space-sm text-body-sm font-label-caps text-label-caps">
                    <span className="flex items-center gap-1 text-text-primary">
                      <span className="w-3 h-0.5 bg-primary rounded-full"></span> Data Riil
                    </span>
                    <span className="flex items-center gap-1 text-status-warning">
                      <span className="w-3 h-0.5 border-b-2 border-dashed border-status-warning"></span> Proyeksi AI
                    </span>
                    <span className="flex items-center gap-1 text-primary-container">
                      <span className="w-2.5 h-2.5 rounded bg-primary-container/20"></span> Confidence Band
                    </span>
                    <span className="flex items-center gap-1 text-status-critical">
                      <span className="w-3 h-0.5 bg-status-critical"></span> HAP Rp 57k
                    </span>
                  </div>
                </div>

                {/* SVG Forecast Canvas Container */}
                <div className="w-full relative h-[360px] sm:h-[400px] flex items-end bg-surface-subtle/50 rounded-lg p-space-sm overflow-hidden select-none">
                  {/* Peak Callout Annotation Badge (Day +6 peak) */}
                  <div className="absolute top-10 right-[28%] sm:right-[32%] z-20 flex flex-col items-center pointer-events-none animate-bounce">
                    <div className="bg-status-critical text-on-error px-space-xs py-1 rounded-md shadow-md text-center">
                      <span className="font-label-caps text-label-caps uppercase tracking-wider block">
                        PUNCAK VOLATILITAS
                      </span>
                      <span className="font-metric-value text-metric-value leading-none">Rp 82.500</span>
                      <span className="font-body-sm text-body-sm block text-[10px] opacity-90">
                        Hari ke-6 (H-2 Ramadan)
                      </span>
                    </div>
                    <div className="w-2 h-2 bg-status-critical rotate-45 -mt-1"></div>
                  </div>
                  {/* Panen Raya Inflow Callout */}
                  <div className="absolute bottom-16 right-4 sm:right-8 z-20 bg-surface-card/90 backdrop-blur-sm p-space-xs rounded-lg shadow-sm max-w-[180px]">
                    <div className="flex items-center gap-1 text-status-normal font-label-caps text-label-caps">
                      <span className="material-symbols-outlined text-body-sm">agriculture</span>
                      <span>PASOKAN MASUK</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-[11px] text-text-secondary leading-tight mt-1">
                      Panen raya Kediri &amp; Malang meredam kenaikan pada Hari 8-14.
                    </p>
                  </div>

                  {/* Interactive Responsive SVG Vector Visualizer */}
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    <defs>
                      <linearGradient id="ciGradient95" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0d5c3a" stopOpacity="0.18"></stop>
                        <stop offset="100%" stopColor="#0d5c3a" stopOpacity="0.02"></stop>
                      </linearGradient>
                      <linearGradient id="ciGradient80" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0d5c3a" stopOpacity="0.30"></stop>
                        <stop offset="100%" stopColor="#0d5c3a" stopOpacity="0.06"></stop>
                      </linearGradient>
                      <linearGradient id="historicalArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#004328" stopOpacity="0.22"></stop>
                        <stop offset="100%" stopColor="#004328" stopOpacity="0.00"></stop>
                      </linearGradient>
                    </defs>
                    {/* Horizontal Gridlines & Price Level References */}
                    <line opacity="0.5" stroke="#CBD5E1" strokeDasharray="3 3" x1="0" x2="1000" y1="50" y2="50"></line>
                    <text className="font-label-caps" fill="#94A3B8" fontSize="11" x="8" y="46">
                      Rp 90.000
                    </text>
                    <line opacity="0.5" stroke="#CBD5E1" strokeDasharray="3 3" x1="0" x2="1000" y1="120" y2="120"></line>
                    <text className="font-label-caps" fill="#94A3B8" fontSize="11" x="8" y="116">
                      Rp 80.000
                    </text>
                    <line opacity="0.5" stroke="#CBD5E1" strokeDasharray="3 3" x1="0" x2="1000" y1="190" y2="190"></line>
                    <text className="font-label-caps" fill="#94A3B8" fontSize="11" x="8" y="186">
                      Rp 70.000
                    </text>
                    <line opacity="0.5" stroke="#CBD5E1" strokeDasharray="3 3" x1="0" x2="1000" y1="260" y2="260"></line>
                    <text className="font-label-caps" fill="#94A3B8" fontSize="11" x="8" y="256">
                      Rp 60.000
                    </text>
                    {/* Red Critical Reference Threshold: HAP Bapanas (Rp 57.000 / ~y:280) */}
                    <line stroke="#DC2626" strokeDasharray="6 4" strokeWidth="1.8" x1="0" x2="1000" y1="281" y2="281"></line>
                    <text className="font-label-caps" fill="#DC2626" fontSize="11" fontWeight="700" x="560" y="275">
                      GARIS HAP BAPANAS: Rp 57.000/Kg
                    </text>
                    {/* Division Line: Today */}
                    <line opacity="0.4" stroke="#0F172A" strokeDasharray="4 2" strokeWidth="1.5" x1="550" x2="550" y1="20" y2="380"></line>
                    <text className="font-label-caps" fill="#0F172A" fontSize="11" fontWeight="600" x="500" y="30">
                      HARI INI
                    </text>
                    <text className="font-label-caps" fill="#0D5C3A" fontSize="11" fontWeight="700" x="560" y="30">
                      AREA PROYEKSI +14 HARI →
                    </text>
                    {/* Confidence Interval 95% Polygon */}
                    <polygon
                      fill="url(#ciGradient95)"
                      points="550,205 600,165 650,110 700,75 750,105 800,140 850,170 920,185 1000,195 1000,310 920,285 850,260 800,230 750,200 700,180 650,210 600,240 550,205"
                    ></polygon>
                    {/* Confidence Interval 80% Polygon */}
                    <polygon
                      fill="url(#ciGradient80)"
                      points="550,205 600,180 650,135 700,92 750,122 800,158 850,185 920,198 1000,205 1000,285 920,265 850,245 800,215 750,185 700,160 650,185 600,225 550,205"
                    ></polygon>
                    {/* Historical Fill Area */}
                    <polygon
                      fill="url(#historicalArea)"
                      points="20,380 20,290 80,280 140,295 200,270 260,285 320,250 380,245 440,225 500,215 550,205 550,380"
                    ></polygon>
                    {/* Historical Solid Trajectory Curve */}
                    <path
                      d="M 20,290 C 50,285 60,280 80,280 C 110,280 120,295 140,295 C 170,295 180,270 200,270 C 230,270 240,285 260,285 C 290,285 300,250 320,250 C 350,250 360,245 380,245 C 410,245 420,225 440,225 C 470,225 480,215 500,215 C 525,215 535,205 550,205"
                      fill="none"
                      stroke="#004328"
                      strokeLinecap="round"
                      strokeWidth="3"
                    ></path>
                    {/* Historical Data Points */}
                    <circle cx="200" cy="270" fill="#004328" r="3.5"></circle>
                    <circle cx="320" cy="250" fill="#004328" r="3.5"></circle>
                    <circle cx="440" cy="225" fill="#004328" r="3.5"></circle>
                    <circle cx="550" cy="205" fill="#004328" r="5" stroke="#ffffff" strokeWidth="2"></circle>
                    {/* Forecast Projection Curve (Dashed) */}
                    <path
                      d="M 550,205 C 575,190 590,165 620,150 C 650,135 670,105 700,102 C 730,99 745,130 770,145 C 800,165 830,195 870,210 C 920,225 960,230 1000,235"
                      fill="none"
                      stroke="#D97706"
                      strokeDasharray="6 5"
                      strokeLinecap="round"
                      strokeWidth="3"
                    ></path>
                    {/* Peak Projected Point (Day 6) */}
                    <circle className="cursor-pointer" cx="700" cy="102" fill="#DC2626" r="7" stroke="#ffffff" strokeWidth="2"></circle>
                    <circle className="animate-pulse" cx="700" cy="102" fill="#DC2626" opacity="0.25" r="14"></circle>
                    {/* End Projection Point (Day 14) */}
                    <circle cx="1000" cy="235" fill="#D97706" r="4.5"></circle>
                    {/* X-Axis Date Reference Labels */}
                    <text className="font-label-caps" fill="#94A3B8" fontSize="10" x="30" y="395">
                      30 Hari Lalu
                    </text>
                    <text className="font-label-caps" fill="#94A3B8" fontSize="10" x="280" y="395">
                      15 Hari Lalu
                    </text>
                    <text className="font-label-caps" fill="#0F172A" fontSize="10" fontWeight="700" x="535" y="395">
                      Hari Ini
                    </text>
                    <text className="font-label-caps" fill="#DC2626" fontSize="10" fontWeight="700" x="680" y="395">
                      +6 Hari
                    </text>
                    <text className="font-label-caps" fill="#94A3B8" fontSize="10" x="830" y="395">
                      +10 Hari
                    </text>
                    <text className="font-label-caps" fill="#94A3B8" fontSize="10" x="940" y="395">
                      +14 Hari
                    </text>
                  </svg>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-xs bg-surface-subtle p-space-sm rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-status-warning text-headline-sm">
                      warning_amber
                    </span>
                    <span className="font-body-sm text-body-sm text-text-primary">
                      <strong>Peringatan Dini Satgas:</strong> Potensi lonjakan menembus Rp 80.000 diprediksi berdurasi 3 hari (H+5 s.d H+7). Intervensi logistik subsidi ongkir disarankan diaktifkan pada H+3.
                    </span>
                  </div>
                  <button
                    className="shrink-0 text-primary font-headline-sm text-body-sm hover:underline flex items-center gap-1 cursor-pointer"
                    onClick={() => alert("Simulasi operasi pasar dibuka.")}
                  >
                    Simulasikan Operasi Pasar
                    <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Right Side Bento: Metrics & ML Explainability: 3 Cols */}
              <div className="lg:col-span-3 flex flex-col gap-space-md">
                {/* Today Price Highlight Card */}
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps text-text-muted">
                        HARGA RATA-RATA RIIL HARI INI
                      </span>
                      <span className="px-space-xs py-0.5 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps">
                        SIAGA
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-space-xs">
                      <span className="font-metric-display text-metric-display text-text-primary tracking-tight">
                        Rp 71.200
                      </span>
                      <span className="font-label-caps text-label-caps text-text-secondary">/ kg</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-status-critical font-metric-delta text-metric-delta">
                      <span className="material-symbols-outlined text-body-md">arrow_upward</span>
                      <span>+4.25% vs Kemarin</span>
                    </div>
                  </div>
                  <div className="mt-space-sm pt-space-xs border-t-0 bg-surface-subtle p-space-xs rounded-lg flex flex-col gap-1">
                    <div className="flex justify-between font-label-caps text-label-caps text-text-secondary">
                      <span>Pasar Terendah (Keputran):</span>
                      <span className="text-text-primary font-bold">Rp 68.000</span>
                    </div>
                    <div className="flex justify-between font-label-caps text-label-caps text-text-secondary">
                      <span>Pasar Tertinggi (Genteng):</span>
                      <span className="text-status-critical font-bold">Rp 75.000</span>
                    </div>
                  </div>
                </div>

                {/* ML Feature Attribution Weights */}
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="font-title-md text-title-md text-text-primary">
                      Faktor Pendorong Model
                    </span>
                    <span className="material-symbols-outlined text-text-muted text-body-md">
                      network_intelligence
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Bobot Shapley Value (SHAP) dalam proyeksi kenaikan 14 hari:
                  </p>
                  <div className="flex flex-col gap-space-sm mt-1">
                    <div>
                      <div className="flex justify-between text-body-sm font-label-caps text-label-caps mb-1">
                        <span className="text-text-primary">Permintaan H-7 Ramadan</span>
                        <span className="font-bold text-status-critical">44.0%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-status-critical rounded-full" style={{ width: "44%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-body-sm font-label-caps text-label-caps mb-1">
                        <span className="text-text-primary">Curah Hujan Tinggi Sentra (Banyuwangi/Kediri)</span>
                        <span className="font-bold text-status-warning">28.5%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-status-warning rounded-full" style={{ width: "28.5%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-body-sm font-label-caps text-label-caps mb-1">
                        <span className="text-text-primary">Biaya Logistik &amp; Solar BPS</span>
                        <span className="font-bold text-primary">15.2%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "15.2%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-body-sm font-label-caps text-label-caps mb-1">
                        <span className="text-text-primary">Siklus Autoregressive Historis</span>
                        <span className="font-bold text-text-secondary">12.3%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "12.3%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto bg-surface-container/60 p-space-xs rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-body-md">verified_user</span>
                    <span className="font-body-sm text-body-sm text-text-primary text-[11px]">
                      Tervalidasi model kalibrasi Backtesting Walk-Forward 90 hari.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PROJECTION DAILY TABLE (DAY 1 TO 14) */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <span className="font-headline-sm text-headline-sm text-text-primary">
                    Matriks Rincian Harian Simulasi (Day 1 - Day 14)
                  </span>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Rentang proyeksi pessimistik, median model, dan rekomendasi intervensi logistik Dinas UKM &amp; Perdagangan
                  </p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-caps text-label-caps text-text-muted">FILTER LEVEL RISIKO:</span>
                  <button
                    className={`px-space-xs py-1 rounded font-label-caps text-label-caps transition-colors cursor-pointer ${
                      filterRisk === "all"
                        ? "bg-primary text-on-primary"
                        : "bg-surface-subtle text-text-primary hover:bg-surface-container"
                    }`}
                    onClick={() => setFilterRisk("all")}
                  >
                    SEMUA (14)
                  </button>
                  <button
                    className={`px-space-xs py-1 rounded font-label-caps text-label-caps transition-colors cursor-pointer ${
                      filterRisk === "critical"
                        ? "bg-status-critical text-on-error"
                        : "bg-status-critical-bg text-status-critical hover:bg-status-critical/20"
                    }`}
                    onClick={() => setFilterRisk("critical")}
                  >
                    KRITIS &gt; 80K (3)
                  </button>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-subtle font-label-caps text-label-caps text-text-secondary uppercase">
                      <th className="py-3 px-4 rounded-l-lg">Hari / Tanggal</th>
                      <th className="py-3 px-4">Batas Bawah (80% CI)</th>
                      <th className="py-3 px-4">Proyeksi Rata-rata</th>
                      <th className="py-3 px-4">Batas Atas (95% CI)</th>
                      <th className="py-3 px-4">Delta vs Hari Ini</th>
                      <th className="py-3 px-4">Status &amp; Sensitivitas</th>
                      <th className="py-3 px-4 rounded-r-lg">Rekomendasi Aksi Pasar</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md divide-y divide-surface-subtle">
                    {filteredRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          row.isPeak
                            ? "bg-status-critical-bg/40 hover:bg-status-critical-bg/60"
                            : "hover:bg-surface-subtle/60"
                        }`}
                      >
                        <td
                          className={`py-3 px-4 font-headline-sm text-body-md ${
                            row.isPeak ? "text-status-critical" : "text-text-primary"
                          }`}
                        >
                          {row.day}
                          <span
                            className={`block ${
                              row.isPeak
                                ? "font-label-caps text-label-caps text-status-critical font-bold"
                                : "font-body-sm text-body-sm text-text-muted"
                            }`}
                          >
                            {row.sub}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-metric-value text-body-md text-text-secondary">
                          {row.lower}
                        </td>
                        <td
                          className={`py-3 px-4 font-metric-value text-body-md font-bold ${
                            row.isPeak ? "text-status-critical" : "text-text-primary"
                          }`}
                        >
                          {row.mean}
                        </td>
                        <td className="py-3 px-4 font-metric-value text-body-md text-text-secondary">
                          {row.upper}
                        </td>
                        <td
                          className={`py-3 px-4 font-metric-delta text-metric-delta ${
                            row.isPeak
                              ? "text-status-critical font-bold"
                              : row.delta.startsWith("+")
                              ? "text-status-critical"
                              : "text-status-normal"
                          }`}
                        >
                          {row.delta}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-space-xs py-0.5 rounded-full font-label-caps text-label-caps ${row.statusClass}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 font-body-sm text-body-sm ${
                            row.isPeak ? "text-status-critical font-bold" : "text-text-secondary"
                          }`}
                        >
                          {row.recom}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEASONAL CYCLICAL INSIGHTS & HISTORICAL PATTERNS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
              {/* Multi-year Comparison Card: 7 Cols */}
              <div className="lg:col-span-7 bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline-md text-headline-md text-text-primary">
                        Komparasi Siklus Musiman (2023 - 2025)
                      </span>
                      <span className="material-symbols-outlined text-primary text-body-md">
                        calendar_clock
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-secondary">
                      Pola deviasi volatilitas pada window H-14 s.d H+14 Ramadan &amp; Idulfitri di Surabaya
                    </p>
                  </div>
                  <div className="flex items-center gap-space-xs text-body-sm font-label-caps text-label-caps">
                    <span className="flex items-center gap-1 text-text-muted">
                      <span className="w-2.5 h-2.5 rounded-full bg-text-muted"></span> 2023
                    </span>
                    <span className="flex items-center gap-1 text-secondary">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> 2024
                    </span>
                    <span className="flex items-center gap-1 text-primary">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> 2025 (Kini)
                    </span>
                  </div>
                </div>

                {/* Cyclical Curve SVG Visualization */}
                <div className="w-full h-64 bg-surface-subtle/60 rounded-lg p-space-sm relative flex items-end overflow-hidden">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 700 220">
                    {/* Grid Lines */}
                    <line stroke="#E2E8F0" strokeDasharray="2 2" x1="0" x2="700" y1="40" y2="40"></line>
                    <line stroke="#E2E8F0" strokeDasharray="2 2" x1="0" x2="700" y1="90" y2="90"></line>
                    <line stroke="#E2E8F0" strokeDasharray="2 2" x1="0" x2="700" y1="140" y2="140"></line>
                    <line stroke="#E2E8F0" x1="0" x2="700" y1="190" y2="190"></line>
                    {/* Highlight Ramadan & Lebaran phases */}
                    <rect fill="#0D5C3A" height="170" opacity="0.04" rx="4" width="160" x="220" y="20"></rect>
                    <text className="font-label-caps" fill="#0D5C3A" fontSize="10" fontWeight="700" x="240" y="32">
                      WINDOW RAMADAN
                    </text>
                    <rect fill="#DC2626" height="170" opacity="0.04" rx="4" width="130" x="490" y="20"></rect>
                    <text className="font-label-caps" fill="#DC2626" fontSize="10" fontWeight="700" x="505" y="32">
                      H-3 IDULFITRI
                    </text>
                    {/* 2023 Curve */}
                    <path
                      d="M 20,160 Q 150,155 240,110 T 380,140 T 520,60 T 680,150"
                      fill="none"
                      opacity="0.7"
                      stroke="#94A3B8"
                      strokeWidth="2"
                    ></path>
                    {/* 2024 Curve */}
                    <path
                      d="M 20,150 Q 150,145 250,95 T 390,130 T 530,50 T 680,140"
                      fill="none"
                      opacity="0.8"
                      stroke="#565e74"
                      strokeWidth="2"
                    ></path>
                    {/* 2025 Prediction Trajectory */}
                    <path
                      d="M 20,140 Q 150,135 250,85 T 390,120 T 530,35 T 680,135"
                      fill="none"
                      stroke="#004328"
                      strokeWidth="3.5"
                    ></path>
                    <circle cx="250" cy="85" fill="#004328" r="4.5"></circle>
                    <circle cx="530" cy="35" fill="#DC2626" r="5"></circle>
                  </svg>
                  {/* Label markers */}
                  <div className="absolute bottom-1.5 left-space-sm right-space-sm flex justify-between font-label-caps text-label-caps text-text-muted">
                    <span>H-14 Ramadan</span>
                    <span>H-2 Ramadan (Puncak I)</span>
                    <span>Pertengahan</span>
                    <span>H-3 Lebaran (Puncak II)</span>
                    <span>H+10 Deflasi</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  <div className="bg-surface-subtle p-space-sm rounded-lg flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-status-warning font-headline-sm text-body-md">
                      <span className="material-symbols-outlined text-body-md">trending_up</span>
                      <span>Pola Kenaikan Menjelang Ramadan</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                      Secara konsisten dalam 3 tahun terakhir, kenaikan +15% s.d +22% selalu terpicu pada{" "}
                      <strong>H-7 s.d H-2 Ramadan</strong> akibat lonjakan konsumsi rumah tangga &amp; tradisi Megengan.
                    </p>
                  </div>
                  <div className="bg-surface-subtle p-space-sm rounded-lg flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-status-normal font-headline-sm text-body-md">
                      <span className="material-symbols-outlined text-body-md">trending_down</span>
                      <span>Titik Deflasi Pasca Lebaran</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                      Pasar mengalami <strong>koreksi penurunan harga tajam pada H+7 s.d H+10 Idulfitri</strong> seiring normalisasi konsumsi dan pembukaan kembali jalur distribusi logistik regional.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actionable Municipal Timeline: 5 Cols */}
              <div className="lg:col-span-5 bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-headline-md text-headline-md text-text-primary">
                      Timeline Operasi &amp; Mitigasi
                    </span>
                    <span className="px-space-xs py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps font-bold">
                      31 KECAMATAN
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                    Rencana Jadwal Gerakan Pangan Murah (GPM) Keliling Pemkot Surabaya
                  </p>
                </div>
                {/* Visual Timeline Stack */}
                <div className="flex flex-col gap-space-md relative pl-6 border-l-0 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container">
                  {/* Phase 1 */}
                  <div className="relative flex flex-col gap-1">
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-status-critical ring-4 ring-status-critical-bg"></div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-body-md text-text-primary">
                        GPM Gelombang 1 (Fokus Cabai &amp; Daging)
                      </span>
                      <span className="font-label-caps text-label-caps text-status-critical font-bold">
                        28 Feb - 02 Mar
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-secondary">
                      Lokasi sasaran: Wonokromo, Sawahan, Tambaksari, Semampir (zona padat penduduk dengan disparitas pasar tertinggi).
                    </p>
                    <span className="inline-flex items-center gap-1 font-label-caps text-label-caps text-primary">
                      <span className="material-symbols-outlined text-body-sm">local_shipping</span> Kuota: 12 Ton Cabai &amp; 8 Ton Beras SPHP
                    </span>
                  </div>
                  {/* Phase 2 */}
                  <div className="relative flex flex-col gap-1">
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-status-warning ring-4 ring-status-warning-bg"></div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-body-md text-text-primary">
                        GPM Gelombang 2 (Sembako Lengkap)
                      </span>
                      <span className="font-label-caps text-label-caps text-status-warning font-bold">
                        12 Mar - 18 Mar
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-secondary">
                      Pertengahan Ramadan serentak di Kantor Kecamatan Rungkut, Sukolilo, Kenjeran, dan Tandes.
                    </p>
                    <span className="inline-flex items-center gap-1 font-label-caps text-label-caps text-text-secondary">
                      <span className="material-symbols-outlined text-body-sm">inventory_2</span> Subsidi Minyak Goreng &amp; Gula Pasir
                    </span>
                  </div>
                  {/* Phase 3 */}
                  <div className="relative flex flex-col gap-1">
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-surface-container"></div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-body-md text-text-primary">
                        Stabilisasi H-5 Idulfitri (Pasar Induk)
                      </span>
                      <span className="font-label-caps text-label-caps text-primary font-bold">
                        25 Mar - 29 Mar
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-secondary">
                      Fasilitasi distribusi langsung dari kelompok tani dampingan Jawa Timur ke Pasar Keputran &amp; Wonokromo.
                    </p>
                  </div>
                </div>

                {/* Municipal Operator Action Trigger */}
                <div className="bg-surface-subtle p-space-sm rounded-lg flex items-center justify-between gap-space-xs">
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-body-sm text-text-primary">
                      Disposisi Tim Pengendali Inflasi (TPID)
                    </span>
                    <span className="font-body-sm text-body-sm text-[11px] text-text-secondary">
                      Dokumen SK Penugasan Logistik GPM Keliling No. 420/2025
                    </span>
                  </div>
                  <button
                    className={`px-space-sm py-2 rounded-lg font-headline-sm text-body-sm transition-all whitespace-nowrap shadow-sm cursor-pointer ${
                      dispatched
                        ? "bg-status-normal text-on-primary"
                        : "bg-primary text-on-primary hover:bg-primary-container"
                    }`}
                    id="btnDispatchTPID"
                    onClick={handleDispatch}
                  >
                    {dispatched ? "Disposisi Terkirim ✓" : "Disposisi Satgas"}
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Photographic Context: Field Monitoring & Sentra Produksi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              <div className="bg-surface-card rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-44 w-full relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Kediri Supply Center"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDxhsu5Vf1rwGURAamc3RJHHc2GBt8UELMK_vCl3CcgOgNt30HhvLFeRAYDCoORvIHklWpO3zFgGdpux0PWxqerpBrS_pThu-vLwXe6uEZIaMawyXt3nXCEsXMBk5uPRZkJ5WQg_89sOWdnYe6vQQ55K35RGaOHRKBMlkrY8Nho8edosED31t-qn1NFk2dukSusFW7Za5tRfF_orJGBj9Cz47CrH2LEyGu27-A7l9i2LZVvxaU6sKW"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent to-transparent"></div>
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-surface-card/90 font-label-caps text-label-caps text-text-primary">
                    SENTRA PASOKAN KEDIRI
                  </span>
                </div>
                <div className="p-space-sm flex flex-col gap-1">
                  <span className="font-headline-sm text-body-md text-text-primary">
                    Kesiapan Panen Daerah Mitra
                  </span>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Perjanjian Antardaerah (KAD) menjamin alokasi 40 ton cabai siap kirim ke Surabaya jika harga menembus batas atas Rp 80.000.
                  </p>
                </div>
              </div>

              <div className="bg-surface-card rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-44 w-full relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Keputran Real Survey"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGLia0eFdJ8HvBY1arnvbt0qYvdBHMLvxDggHABxp04MC3nlX0R4-GRWqOel82TOLdgQ0fQydoF84l657SgO56_qdW1QIgYWVOXVZVLgNSX97dpHgdmN35ZLp8DA2le3H0y71SBbIcaMZR1OHTtaiO34DuzXEQE2Xot6Gtv2oTHusKt9m1gAe0zfpw8MYoF-tvtW13g3l9X2ZPXUZwfVnrX9mhqgcrhKOArq927f2iDoNx2UXyDtJ4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent to-transparent"></div>
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-surface-card/90 font-label-caps text-label-caps text-text-primary">
                    SURVEI RIIL PASAR KEPUTRAN
                  </span>
                </div>
                <div className="p-space-sm flex flex-col gap-1">
                  <span className="font-headline-sm text-body-md text-text-primary">
                    Validasi Data Lapangan Harian
                  </span>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Pencacah harga Dinas Perdagangan memverifikasi harga riil 2 kali sehari untuk meminimalisasi error proyeksi model time-series.
                  </p>
                </div>
              </div>

              <div className="bg-surface-card rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-44 w-full relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Osowilangun Cold Storage"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIHVVODMx62E0Grh8kwWhQQR2FDPMuelTpbhv5_KpduUIiIkJyy-brQNJgD9-smORYZY4yIn521fwMHr_VkioGb_tBpJ3qwzoKVsC4k0ZNwMmBvnpVEpPKtiJAwe-vepX-VODP-Mp9ycKM31LXSqJwAHavz8dPADNJKCobtTvtYY4Ot8VuuqPIhW0-38WZJmWXw5CdbNrDoue9ffsrQzkSqCyGWU3aEjIbjnO1aAHAzElx0DW1myut"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent to-transparent"></div>
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-surface-card/90 font-label-caps text-label-caps text-text-primary">
                    COLD STORAGE OSOWILANGUN
                  </span>
                </div>
                <div className="p-space-sm flex flex-col gap-1">
                  <span className="font-headline-sm text-body-md text-text-primary">
                    Buffer Stock Controlled Atmosphere
                  </span>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Fasilitas pendingin penyerap kelebihan pasokan saat panen siap mengalirkan stok cadangan untuk meredam lonjakan Ramadan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
