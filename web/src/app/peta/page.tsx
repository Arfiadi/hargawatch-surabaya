"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SpatialMapPage() {
  const [selectedCommodity, setSelectedCommodity] = useState<string>("cabai-rawit");
  const [selectedZone, setSelectedZone] = useState<string>("Semua");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeTooltip, setActiveTooltip] = useState<string>("genteng");

  const zones = ["Semua", "Pusat", "Selatan", "Timur", "Utara"];

  const handleExportCSV = () => {
    const csvContent =
      "Komoditas Pokok,Satuan,Keputran (Induk),Wonokromo,Pucang Anom,Genteng,Tambahrejo,Soponyono,Rerata Kota,Disparitas Rp,Disparitas %\n" +
      "Cabai Rawit Merah,1 kg,Rp 66.500,Rp 70.000,Rp 74.000,Rp 78.000,Rp 71.500,Rp 75.000,Rp 72.500,Rp 11.500,17.3%\n" +
      "Beras Medium,1 kg,Rp 12.500,Rp 12.700,Rp 13.000,Rp 13.200,Rp 12.800,Rp 13.000,Rp 12.860,Rp 700,5.6%\n" +
      "Gula Pasir Curah,1 kg,Rp 16.800,Rp 17.000,Rp 17.500,Rp 17.800,Rp 17.200,Rp 17.500,Rp 17.300,Rp 1.000,5.9%\n" +
      "Minyakita (HET Rp 15.700),1 liter,Rp 15.700,Rp 16.000,Rp 16.500,Rp 17.200,Rp 16.000,Rp 16.500,Rp 16.310,Rp 1.500,9.5%\n" +
      "Telur Ayam Ras,1 kg,Rp 27.200,Rp 27.500,Rp 28.000,Rp 29.000,Rp 27.800,Rp 28.500,Rp 28.000,Rp 1.800,6.6%\n" +
      "Daging Sapi Murni,1 kg,Rp 118.000,Rp 117.000,Rp 122.000,Rp 126.000,Rp 119.000,Rp 123.000,Rp 120.830,Rp 9.000,7.7%\n" +
      "Bawang Merah Super,1 kg,Rp 34.000,Rp 36.000,Rp 37.500,Rp 41.000,Rp 36.000,Rp 38.500,Rp 37.160,Rp 7.000,20.5%\n" +
      "Bawang Putih Honan,1 kg,Rp 36.000,Rp 37.000,Rp 38.000,Rp 39.500,Rp 37.000,Rp 38.500,Rp 37.660,Rp 3.500,9.7%\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "matriks_komparasi_pasar_surabaya.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-surface-canvas text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Header />

      <main className="w-full pt-20 bg-surface-canvas min-h-screen">
        <div className="flex flex-col w-full">
          <section className="w-full px-space-md lg:px-gutter-desktop py-space-md max-w-[80rem] mx-auto">
            {/* Header Context & Quick Metrics Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
              <div>
                <div className="flex items-center gap-space-xs mb-1">
                  <span className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-surface-subtle text-primary font-label-caps text-label-caps uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-status-normal animate-ping"></span>
                    Geointel Pangan SP2KP
                  </span>
                  <span className="text-text-muted text-body-sm font-body-sm">•</span>
                  <span className="text-text-secondary font-label-caps text-label-caps uppercase">
                    Surabaya Regional Grid
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-space-xs">
                  <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                    Peta Disparitas Harga Antar-Pasar
                  </h1>
                  <span className="font-body-md text-body-md text-text-secondary">
                    Kota Surabaya (6 Pasar Acuan)
                  </span>
                </div>
              </div>
              {/* Quick Telemetry Card */}
              <div className="flex items-center gap-space-sm bg-surface-card p-space-sm rounded-xl shadow-sm">
                <div className="flex flex-col pr-space-sm">
                  <span className="font-label-caps text-label-caps text-text-muted uppercase">
                    Koefisien Variasi
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-metric-display text-metric-display text-status-warning">
                      12.4%
                    </span>
                    <span className="px-space-2xs py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-label-caps">
                      Tinggi
                    </span>
                  </div>
                </div>
                <div className="w-px h-8 bg-border-subtle"></div>
                <div className="flex flex-col pl-space-xs">
                  <span className="font-label-caps text-label-caps text-text-muted uppercase">
                    Anomali Terbuka
                  </span>
                  <span className="font-metric-value text-metric-value text-status-critical">
                    Rp 11.500/kg
                  </span>
                  <span className="font-body-sm text-body-sm text-text-secondary">
                    Genteng vs Keputran
                  </span>
                </div>
              </div>
            </div>

            {/* 1. Spatial Control & Analytical Filter Bar */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm mb-space-lg">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
                {/* Commodity Select */}
                <div className="md:col-span-4 flex flex-col gap-1.5">
                  <label
                    className="font-label-caps text-label-caps text-text-secondary uppercase flex items-center gap-1"
                    htmlFor="commodity-select"
                  >
                    <span className="material-symbols-outlined text-body-md text-primary">
                      nutrition
                    </span>
                    Komoditas Terpilih
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-10 appearance-none bg-surface-subtle text-text-primary font-body-md text-body-md pl-space-sm pr-9 rounded-lg focus:outline-none focus:bg-surface-card transition-all cursor-pointer font-title-md"
                      id="commodity-select"
                      value={selectedCommodity}
                      onChange={(e) => setSelectedCommodity(e.target.value)}
                    >
                      <option value="cabai-rawit">Cabai Rawit Merah (Hortikultura)</option>
                      <option value="beras-medium">Beras Medium (Pangan Pokok)</option>
                      <option value="minyakita">Minyakita Botol (Minyak Goreng)</option>
                      <option value="telur-ayam">Telur Ayam Ras (Protein)</option>
                      <option value="daging-ayam">Daging Ayam Broiler</option>
                      <option value="bawang-merah">Bawang Merah Brebes Super</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-body-md">
                      expand_more
                    </span>
                  </div>
                </div>
                {/* Zone Selector */}
                <div className="md:col-span-4 flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps text-text-secondary uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-body-md text-primary">hub</span>
                    Filter Zonasi Pasar
                  </label>
                  <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-lg">
                    {zones.map((zone) => (
                      <button
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className={`px-space-xs py-1.5 rounded-lg font-label-caps text-label-caps transition-all cursor-pointer ${
                          selectedZone === zone
                            ? "bg-primary-container text-on-primary"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Status Disparity Summary Indicator */}
                <div className="md:col-span-4 bg-status-warning-bg rounded-lg p-space-sm flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-status-warning text-headline-sm mt-0.5">
                    warning
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-text-primary leading-snug">
                      Disparitas Hortikultura Tinggi
                    </span>
                    <span className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                      Selisih harga antarpasar mencapai{" "}
                      <strong className="text-status-critical font-label-caps">17.3%</strong>.
                      Direkomendasikan operasi pasokan dari Keputran ke Genteng.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Geospatial Interactive Map Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md mb-space-lg">
              {/* Spatial Viewport Container */}
              <div className="lg:col-span-8 bg-surface-card rounded-xl shadow-sm overflow-hidden flex flex-col relative min-h-[580px]">
                {/* Map Overlay Action Header */}
                <div className="absolute top-space-md left-space-md right-space-md z-20 flex flex-wrap items-center justify-between gap-space-xs pointer-events-none">
                  <div className="pointer-events-auto bg-surface-card/95 backdrop-blur-md px-space-sm py-1.5 rounded-lg shadow-sm flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-body-md">
                      layers
                    </span>
                    <span className="font-label-caps text-label-caps text-text-primary uppercase font-bold">
                      Heatmap Layer: Spasial Disparitas
                    </span>
                    <span className="text-text-muted text-body-sm">•</span>
                    <span className="font-label-caps text-label-caps text-status-normal font-semibold">
                      6 Node Sinkron
                    </span>
                  </div>
                  <div className="pointer-events-auto flex items-center gap-1.5 bg-surface-card/95 backdrop-blur-md p-1 rounded-lg shadow-sm">
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-text-secondary transition-colors cursor-pointer"
                      title="Zoom In"
                      onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.45))}
                    >
                      <span className="material-symbols-outlined text-body-lg">add</span>
                    </button>
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-text-secondary transition-colors cursor-pointer"
                      title="Zoom Out"
                      onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
                    >
                      <span className="material-symbols-outlined text-body-lg">remove</span>
                    </button>
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-text-secondary transition-colors cursor-pointer"
                      title="Reset Map"
                      onClick={() => setZoomLevel(1)}
                    >
                      <span className="material-symbols-outlined text-body-lg">my_location</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Interactive Map Canvas */}
                <div
                  className="relative w-full h-[580px] bg-[#E8EFF6] overflow-hidden select-none"
                  id="spatial-canvas"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    transition: "transform 0.25s ease-out",
                  }}
                >
                  {/* Stylized Surabaya Waterways & Coastlines (SVG) */}
                  <svg
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-45"
                    fill="none"
                    viewBox="0 0 900 650"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Madura Strait Coastline (North/East) */}
                    <path
                      d="M 50 20 C 220 70 380 95 520 150 C 660 210 770 340 880 430 L 900 650 L 0 650 Z"
                      fill="#D8E5F3"
                      opacity="0.8"
                    ></path>
                    <path
                      d="M 680 20 C 720 120 790 220 890 310"
                      stroke="#CBD5E1"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                      strokeWidth="4"
                    ></path>
                    {/* Kali Mas River branching */}
                    <path
                      d="M 460 650 C 470 540 440 450 430 380 C 415 290 470 200 480 90"
                      stroke="#93C5FD"
                      strokeLinecap="round"
                      strokeWidth="12"
                    ></path>
                    <path
                      d="M 430 380 C 370 340 310 320 200 310"
                      stroke="#BFDBFE"
                      strokeLinecap="round"
                      strokeWidth="6"
                    ></path>
                    <path
                      d="M 445 420 C 510 420 570 470 650 490"
                      stroke="#BFDBFE"
                      strokeLinecap="round"
                      strokeWidth="7"
                    ></path>
                    {/* Major Arterials (Jalan Protokol) */}
                    <path d="M 400 650 L 400 50" stroke="#CBD5E1" strokeWidth="3"></path>
                    <path d="M 410 490 L 220 510" stroke="#CBD5E1" strokeWidth="2"></path>
                    <path d="M 400 370 L 670 410" stroke="#CBD5E1" strokeWidth="2.5"></path>
                    <path d="M 280 220 L 580 250" stroke="#CBD5E1" strokeWidth="2.5"></path>
                    {/* Grid Lines */}
                    <circle
                      cx="430"
                      cy="380"
                      fill="none"
                      r="180"
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    ></circle>
                    <circle
                      cx="430"
                      cy="380"
                      fill="none"
                      r="320"
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    ></circle>
                  </svg>

                  {/* Heatmap Dispersion Overlay */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-multiply"
                    fill="none"
                    viewBox="0 0 900 650"
                  >
                    <defs>
                      <radialGradient
                        cx="440"
                        cy="240"
                        gradientUnits="userSpaceOnUse"
                        id="heat-genteng"
                        r="140"
                      >
                        <stop offset="0%" stopColor="#DC2626" stopOpacity="0.75"></stop>
                        <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.35"></stop>
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"></stop>
                      </radialGradient>
                      <radialGradient
                        cx="420"
                        cy="370"
                        gradientUnits="userSpaceOnUse"
                        id="heat-keputran"
                        r="150"
                      >
                        <stop offset="0%" stopColor="#16A34A" stopOpacity="0.8"></stop>
                        <stop offset="60%" stopColor="#16A34A" stopOpacity="0.2"></stop>
                        <stop offset="100%" stopColor="#16A34A" stopOpacity="0"></stop>
                      </radialGradient>
                      <radialGradient
                        cx="390"
                        cy="490"
                        gradientUnits="userSpaceOnUse"
                        id="heat-wonokromo"
                        r="120"
                      >
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5"></stop>
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"></stop>
                      </radialGradient>
                      <radialGradient
                        cx="640"
                        cy="510"
                        gradientUnits="userSpaceOnUse"
                        id="heat-soponyono"
                        r="130"
                      >
                        <stop offset="0%" stopColor="#DC2626" stopOpacity="0.55"></stop>
                        <stop offset="100%" stopColor="#DC2626" stopOpacity="0"></stop>
                      </radialGradient>
                    </defs>
                    <circle cx="440" cy="240" fill="url(#heat-genteng)" r="140"></circle>
                    <circle cx="420" cy="370" fill="url(#heat-keputran)" r="150"></circle>
                    <circle cx="390" cy="490" fill="url(#heat-wonokromo)" r="120"></circle>
                    <circle cx="640" cy="510" fill="url(#heat-soponyono)" r="130"></circle>
                  </svg>

                  {/* PIN 1: Pasar Keputran (Induk Benchmark) */}
                  <div
                    className="absolute left-[44%] top-[56%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-30 transition-transform duration-200 hover:scale-110"
                    onClick={() => setActiveTooltip("keputran")}
                  >
                    <div className="flex flex-col items-center">
                      <div className="bg-surface-card px-space-xs py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-status-normal"></span>
                        <span className="font-headline-sm text-body-sm text-text-primary">
                          Keputran
                        </span>
                        <span className="font-metric-delta text-label-caps text-status-normal">
                          Rp 66.500
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-status-normal text-on-primary flex items-center justify-center -mt-1 shadow-lg shadow-status-normal/40 ring-4 ring-status-normal-bg">
                        <span className="material-symbols-outlined text-body-sm font-bold">
                          anchor
                        </span>
                      </div>
                      <div className="px-space-2xs py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps mt-1">
                        BENCHMARK
                      </div>
                    </div>
                  </div>

                  {/* PIN 2: Pasar Genteng (Surabaya Pusat - Tertinggi) with EXPANDED Active Tooltip */}
                  <div
                    className="absolute left-[47%] top-[34%] -translate-x-1/2 -translate-y-1/2 z-40 group cursor-pointer"
                    onClick={() => setActiveTooltip("genteng")}
                  >
                    <div className="flex flex-col items-center relative">
                      {/* Pinned Market Node */}
                      <div className="bg-surface-card px-space-xs py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-status-critical animate-ping"></span>
                        <span className="font-headline-sm text-body-sm text-text-primary">
                          Genteng
                        </span>
                        <span className="font-metric-delta text-label-caps text-status-critical">
                          Rp 78.000
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-status-critical text-on-primary flex items-center justify-center -mt-1 shadow-lg shadow-status-critical/40 ring-4 ring-status-critical-bg">
                        <span className="material-symbols-outlined text-body-md font-bold">
                          priority_high
                        </span>
                      </div>

                      {/* ACTIVE TOOLTIP POPUP (Required in Stitch) */}
                      {activeTooltip === "genteng" && (
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 bg-surface-card rounded-xl p-space-sm shadow-xl z-50 pointer-events-auto">
                          <div className="flex items-center justify-between pb-space-xs mb-space-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-title-md text-title-md text-text-primary">
                                Pasar Genteng
                              </span>
                              <span className="px-space-2xs py-0.2 rounded-full bg-surface-subtle text-text-secondary font-label-caps text-label-caps">
                                Pusat
                              </span>
                            </div>
                            <span className="px-space-xs py-0.5 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps">
                              Tertinggi
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between font-body-sm text-body-sm">
                              <span className="text-text-secondary">Harga Cabai Rawit:</span>
                              <span className="font-metric-value text-body-md text-status-critical font-bold">
                                Rp 78.000/kg
                              </span>
                            </div>
                            <div className="flex items-center justify-between font-body-sm text-body-sm">
                              <span className="text-text-secondary">Selisih vs Keputran:</span>
                              <span className="font-metric-delta text-label-caps text-status-critical font-bold">
                                +Rp 11.500 (+17.3%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between font-body-sm text-body-sm">
                              <span className="text-text-secondary">Est. Margin Logistik:</span>
                              <span className="font-metric-delta text-label-caps text-text-primary">
                                Rp 4.200/kg (Tinggi)
                              </span>
                            </div>
                          </div>
                          <div className="mt-space-xs pt-space-xs bg-surface-subtle p-space-xs rounded-lg flex items-center gap-space-2xs text-text-secondary">
                            <span className="material-symbols-outlined text-body-md text-status-warning">
                              info
                            </span>
                            <span className="font-body-sm text-body-sm leading-tight">
                              Biaya sewa lapak &amp; rantai pasok lapis ke-3 menaikkan harga eceran.
                            </span>
                          </div>
                          {/* Triangle Tip */}
                          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-surface-card"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PIN 3: Pasar Wonokromo (Surabaya Selatan) */}
                  <div
                    className="absolute left-[39%] top-[72%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-30 transition-transform duration-200 hover:scale-110"
                    onClick={() => setActiveTooltip("wonokromo")}
                  >
                    <div className="flex flex-col items-center">
                      <div className="bg-surface-card px-space-xs py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-status-warning"></span>
                        <span className="font-headline-sm text-body-sm text-text-primary">
                          Wonokromo
                        </span>
                        <span className="font-metric-delta text-label-caps text-status-warning">
                          Rp 70.000
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-status-warning text-on-primary flex items-center justify-center -mt-1 shadow-md ring-4 ring-status-warning-bg">
                        <span className="material-symbols-outlined text-body-sm">storefront</span>
                      </div>
                      <div className="px-space-2xs py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-label-caps mt-1">
                        Waspada Ringan
                      </div>
                    </div>
                  </div>

                  {/* PIN 4: Pasar Pucang Anom (Surabaya Timur) */}
                  <div
                    className="absolute left-[58%] top-[54%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-30 transition-transform duration-200 hover:scale-110"
                    onClick={() => setActiveTooltip("pucanganom")}
                  >
                    <div className="flex flex-col items-center">
                      <div className="bg-surface-card px-space-xs py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        <span className="font-headline-sm text-body-sm text-text-primary">
                          Pucang Anom
                        </span>
                        <span className="font-metric-delta text-label-caps text-text-secondary">
                          Rp 74.000
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center -mt-1 shadow-md ring-4 ring-surface-subtle">
                        <span className="material-symbols-outlined text-body-sm">storefront</span>
                      </div>
                      <div className="px-space-2xs py-0.5 rounded-full bg-surface-subtle text-text-secondary font-label-caps text-label-caps mt-1">
                        Sedang (+11.2%)
                      </div>
                    </div>
                  </div>

                  {/* PIN 5: Pasar Tambahrejo (Surabaya Timur / Utara) */}
                  <div
                    className="absolute left-[62%] top-[30%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-30 transition-transform duration-200 hover:scale-110"
                    onClick={() => setActiveTooltip("tambahrejo")}
                  >
                    <div className="flex flex-col items-center">
                      <div className="bg-surface-card px-space-xs py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-status-normal"></span>
                        <span className="font-headline-sm text-body-sm text-text-primary">
                          Tambahrejo
                        </span>
                        <span className="font-metric-delta text-label-caps text-status-normal">
                          Rp 71.500
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center -mt-1 shadow-md ring-4 ring-status-normal-bg">
                        <span className="material-symbols-outlined text-body-sm">storefront</span>
                      </div>
                      <div className="px-space-2xs py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps mt-1">
                        Stabil (+7.5%)
                      </div>
                    </div>
                  </div>

                  {/* PIN 6: Pasar Soponyono (Rungkut / Surabaya Timur) */}
                  <div
                    className="absolute left-[73%] top-[74%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-30 transition-transform duration-200 hover:scale-110"
                    onClick={() => setActiveTooltip("soponyono")}
                  >
                    <div className="flex flex-col items-center">
                      <div className="bg-surface-card px-space-xs py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-status-warning"></span>
                        <span className="font-headline-sm text-body-sm text-text-primary">
                          Soponyono
                        </span>
                        <span className="font-metric-delta text-label-caps text-status-warning">
                          Rp 75.000
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-status-warning text-on-primary flex items-center justify-center -mt-1 shadow-md ring-4 ring-status-warning-bg">
                        <span className="material-symbols-outlined text-body-sm">storefront</span>
                      </div>
                      <div className="px-space-2xs py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-label-caps mt-1">
                        Waspada (+12.7%)
                      </div>
                    </div>
                  </div>

                  {/* Bottom Floating Map Legend */}
                  <div className="absolute bottom-space-md left-space-md bg-surface-card/95 backdrop-blur-md p-space-sm rounded-xl shadow-sm z-20 flex flex-col gap-1.5">
                    <span className="font-label-caps text-label-caps text-text-muted uppercase">
                      Spektrum Deviasi Harga
                    </span>
                    <div className="flex items-center gap-2 text-label-caps font-label-caps">
                      <span className="text-status-normal">Keputran (Termurah)</span>
                      <div className="w-28 h-2 rounded-full bg-gradient-to-r from-status-normal via-status-warning to-status-critical"></div>
                      <span className="text-status-critical">Genteng (Tertinggi)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spatial Analytics Breakdown Panel (Beside Map) */}
              <div className="lg:col-span-4 flex flex-col gap-space-md">
                {/* Regional Inflow Diagnostics */}
                <div className="bg-surface-card p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-headline-sm">
                        route
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-text-primary">
                        Koridor Pasokan
                      </h2>
                    </div>
                    <span className="font-label-caps text-label-caps text-text-muted">
                      Real-time GPS Satgas
                    </span>
                  </div>
                  <div className="space-y-space-sm">
                    <div className="p-space-xs rounded-lg bg-surface-subtle flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-title-md text-body-md text-text-primary">
                          Kediri / Blitar → Keputran
                        </span>
                        <span className="font-label-caps text-label-caps text-status-normal font-semibold">
                          Lancar (14 Ton)
                        </span>
                      </div>
                      <div className="w-full bg-border-subtle rounded-full h-1.5 overflow-hidden">
                        <div className="bg-status-normal h-full rounded-full w-[85%]"></div>
                      </div>
                      <span className="font-body-sm text-body-sm text-text-secondary">
                        Waktu tempuh rata-rata: 2 jam 40 menit via Tol Sumo.
                      </span>
                    </div>
                    <div className="p-space-xs rounded-lg bg-surface-subtle flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-title-md text-body-md text-text-primary">
                          Keputran → Genteng
                        </span>
                        <span className="font-label-caps text-label-caps text-status-critical font-semibold">
                          Bottleneck +17%
                        </span>
                      </div>
                      <div className="w-full bg-border-subtle rounded-full h-1.5 overflow-hidden">
                        <div className="bg-status-critical h-full rounded-full w-[35%]"></div>
                      </div>
                      <span className="font-body-sm text-body-sm text-text-secondary">
                        Penetapan harga peritel pasar kelas menengah-atas di pusat kota.
                      </span>
                    </div>
                    <div className="p-space-xs rounded-lg bg-surface-subtle flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-title-md text-body-md text-text-primary">
                          Keputran → Soponyono
                        </span>
                        <span className="font-label-caps text-label-caps text-status-warning font-semibold">
                          Transit Sub-Hub
                        </span>
                      </div>
                      <div className="w-full bg-border-subtle rounded-full h-1.5 overflow-hidden">
                        <div className="bg-status-warning h-full rounded-full w-[60%]"></div>
                      </div>
                      <span className="font-body-sm text-body-sm text-text-secondary">
                        Konsumsi tinggi klaster perumahan Surabaya Timur &amp; Rungkut.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Intervention Suggestion Card */}
                <div className="bg-surface-card p-space-md rounded-xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-space-xs text-primary mb-space-xs">
                    <span className="material-symbols-outlined text-headline-sm">policy</span>
                    <span className="font-title-md text-title-md text-text-primary">
                      Rekomendasi Satgas Pangan
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary mb-space-sm leading-relaxed">
                    Disparitas Cabai Rawit sebesar <strong>Rp 11.500/kg</strong> melampaui batas toleransi kewajaran daerah (maks. Rp 7.500/kg). Disarankan subsidi ongkos angkut (SOA) atau drop supply langsung ke pedagang Pasar Genteng &amp; Soponyono.
                  </p>
                  <div className="flex items-center gap-space-xs mt-auto">
                    <button
                      className="flex-1 py-2.5 px-space-sm bg-primary-container hover:bg-primary text-on-primary rounded-lg font-headline-sm text-body-sm transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      onClick={() => alert("Perintah Perancangan Operasi Pasar telah diteruskan ke tim logistik Dinas Perdagangan.")}
                    >
                      <span className="material-symbols-outlined text-body-md">local_shipping</span>
                      Rancang Operasi Pasar
                    </button>
                    <button
                      className="p-2.5 bg-surface-subtle hover:bg-surface-variant text-text-secondary rounded-lg transition-colors cursor-pointer"
                      title="Cetak Disposisi Kebijakan"
                      onClick={() => window.print()}
                    >
                      <span className="material-symbols-outlined text-body-md">print</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Panel Matriks Komparasi Multi-Pasar (Dynamic Table) */}
            <div className="bg-surface-card rounded-xl shadow-sm overflow-hidden mb-space-lg">
              <div className="p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-headline-md text-headline-md text-text-primary">
                      Matriks Komparasi 6 Pasar Strategis
                    </h2>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-subtle text-text-secondary font-label-caps text-label-caps">
                      8 Komoditas Pangan Pokok
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                    Data sinkronisasi harian per pukul 06.00 WIB. Warna hijau menunjukkan pasar terendah; oranye/merah menunjukkan pasar tertinggi.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button
                    className="px-space-sm py-2 rounded-lg bg-surface-subtle hover:bg-surface-variant text-text-secondary font-body-sm text-body-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    onClick={handleExportCSV}
                  >
                    <span className="material-symbols-outlined text-body-md">file_download</span>
                    Export CSV
                  </button>
                  <button
                    className="px-space-sm py-2 rounded-lg bg-surface-subtle hover:bg-surface-variant text-text-secondary font-body-sm text-body-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    onClick={() => alert("Data diurutkan berdasarkan disparitas tertinggi ke terendah.")}
                  >
                    <span className="material-symbols-outlined text-body-md">filter_alt</span>
                    Sort Disparitas
                  </button>
                </div>
              </div>
              {/* Data Table Container with Horizontal Overflow */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-surface-subtle text-text-secondary font-label-caps text-label-caps uppercase tracking-wider">
                      <th className="py-3 px-space-md">Komoditas Pokok</th>
                      <th className="py-3 px-space-xs">Satuan</th>
                      <th className="py-3 px-space-sm bg-primary/5 text-primary">Keputran (Induk)</th>
                      <th className="py-3 px-space-sm">Wonokromo</th>
                      <th className="py-3 px-space-sm">Pucang Anom</th>
                      <th className="py-3 px-space-sm">Genteng</th>
                      <th className="py-3 px-space-sm">Tambahrejo</th>
                      <th className="py-3 px-space-sm">Soponyono</th>
                      <th className="py-3 px-space-sm">Rerata Kota</th>
                      <th className="py-3 px-space-md text-right">Disparitas (Max-Min)</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-primary">
                    {/* Row 1: Cabai Rawit Merah */}
                    <tr className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-status-critical"></span>
                          <div className="flex flex-col">
                            <span className="font-title-md text-body-md text-text-primary font-semibold">
                              Cabai Rawit Merah
                            </span>
                            <span className="text-text-muted font-label-caps text-label-caps">
                              Hortikultura Segar
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-xs text-text-secondary font-label-caps">1 kg</td>
                      <td className="py-3.5 px-space-sm bg-status-normal-bg text-status-normal font-metric-value font-semibold">
                        Rp 66.500{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-normal/80">
                          Min
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 70.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 74.000</td>
                      <td className="py-3.5 px-space-sm bg-status-critical-bg text-status-critical font-metric-value font-semibold">
                        Rp 78.000{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-critical/80">
                          Max
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 71.500</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 75.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value text-text-secondary">
                        Rp 72.500
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-metric-delta text-body-sm text-status-critical font-bold">
                            Rp 11.500
                          </span>
                          <span className="px-space-2xs py-0.5 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps">
                            17.3% (Tinggi)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Row 2: Beras Medium */}
                    <tr className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-status-normal"></span>
                          <div className="flex flex-col">
                            <span className="font-title-md text-body-md text-text-primary font-semibold">
                              Beras Medium
                            </span>
                            <span className="text-text-muted font-label-caps text-label-caps">
                              Bulog / Setara IR64
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-xs text-text-secondary font-label-caps">1 kg</td>
                      <td className="py-3.5 px-space-sm bg-status-normal-bg text-status-normal font-metric-value font-semibold">
                        Rp 12.500{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-normal/80">
                          Min
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 12.700</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 13.000</td>
                      <td className="py-3.5 px-space-sm bg-status-warning-bg text-status-warning font-metric-value font-semibold">
                        Rp 13.200{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-warning/80">
                          Max
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 12.800</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 13.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value text-text-secondary">
                        Rp 12.860
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-metric-delta text-body-sm text-status-normal font-bold">
                            Rp 700
                          </span>
                          <span className="px-space-2xs py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
                            5.6% (Stabil)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Row 3: Gula Pasir Curah */}
                    <tr className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-status-normal"></span>
                          <div className="flex flex-col">
                            <span className="font-title-md text-body-md text-text-primary font-semibold">
                              Gula Pasir Curah
                            </span>
                            <span className="text-text-muted font-label-caps text-label-caps">
                              Pabrik Gula Jatim
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-xs text-text-secondary font-label-caps">1 kg</td>
                      <td className="py-3.5 px-space-sm bg-status-normal-bg text-status-normal font-metric-value font-semibold">
                        Rp 16.800{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-normal/80">
                          Min
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 17.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 17.500</td>
                      <td className="py-3.5 px-space-sm bg-status-warning-bg text-status-warning font-metric-value font-semibold">
                        Rp 17.800{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-warning/80">
                          Max
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 17.200</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 17.500</td>
                      <td className="py-3.5 px-space-sm font-metric-value text-text-secondary">
                        Rp 17.300
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-metric-delta text-body-sm text-status-normal font-bold">
                            Rp 1.000
                          </span>
                          <span className="px-space-2xs py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
                            5.9% (Terkendali)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Row 4: Minyakita Botol */}
                    <tr className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-status-warning"></span>
                          <div className="flex flex-col">
                            <span className="font-title-md text-body-md text-text-primary font-semibold">
                              Minyakita (HET Rp 15.700)
                            </span>
                            <span className="text-text-muted font-label-caps text-label-caps">
                              Minyak Kelapa Sawit
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-xs text-text-secondary font-label-caps">1 liter</td>
                      <td className="py-3.5 px-space-sm bg-status-normal-bg text-status-normal font-metric-value font-semibold">
                        Rp 15.700{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-normal/80">
                          Sesuai HET
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 16.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 16.500</td>
                      <td className="py-3.5 px-space-sm bg-status-critical-bg text-status-critical font-metric-value font-semibold">
                        Rp 17.200{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-critical/80">
                          Di Atas HET
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 16.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 16.500</td>
                      <td className="py-3.5 px-space-sm font-metric-value text-text-secondary">
                        Rp 16.310
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-metric-delta text-body-sm text-status-warning font-bold">
                            Rp 1.500
                          </span>
                          <span className="px-space-2xs py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-label-caps">
                            9.5% (Waspada)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Row 5: Telur Ayam Ras */}
                    <tr className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-status-normal"></span>
                          <div className="flex flex-col">
                            <span className="font-title-md text-body-md text-text-primary font-semibold">
                              Telur Ayam Ras
                            </span>
                            <span className="text-text-muted font-label-caps text-label-caps">
                              Peternak Blitar / Pare
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-xs text-text-secondary font-label-caps">1 kg</td>
                      <td className="py-3.5 px-space-sm bg-status-normal-bg text-status-normal font-metric-value font-semibold">
                        Rp 27.200{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-normal/80">
                          Min
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 27.500</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 28.000</td>
                      <td className="py-3.5 px-space-sm bg-status-warning-bg text-status-warning font-metric-value font-semibold">
                        Rp 29.000{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-warning/80">
                          Max
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 27.800</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 28.500</td>
                      <td className="py-3.5 px-space-sm font-metric-value text-text-secondary">
                        Rp 28.000
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-metric-delta text-body-sm text-status-normal font-bold">
                            Rp 1.800
                          </span>
                          <span className="px-space-2xs py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
                            6.6% (Wajar)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Row 6: Daging Sapi Murni */}
                    <tr className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-status-normal"></span>
                          <div className="flex flex-col">
                            <span className="font-title-md text-body-md text-text-primary font-semibold">
                              Daging Sapi Murni
                            </span>
                            <span className="text-text-muted font-label-caps text-label-caps">
                              RPH Pegirian Surabaya
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-xs text-text-secondary font-label-caps">1 kg</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 118.000</td>
                      <td className="py-3.5 px-space-sm bg-status-normal-bg text-status-normal font-metric-value font-semibold">
                        Rp 117.000{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-normal/80">
                          Min
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 122.000</td>
                      <td className="py-3.5 px-space-sm bg-status-warning-bg text-status-warning font-metric-value font-semibold">
                        Rp 126.000{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-warning/80">
                          Max
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 119.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 123.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value text-text-secondary">
                        Rp 120.830
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-metric-delta text-body-sm text-status-warning font-bold">
                            Rp 9.000
                          </span>
                          <span className="px-space-2xs py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-label-caps">
                            7.7% (Sedang)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Row 7: Bawang Merah Super */}
                    <tr className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-status-warning"></span>
                          <div className="flex flex-col">
                            <span className="font-title-md text-body-md text-text-primary font-semibold">
                              Bawang Merah Super
                            </span>
                            <span className="text-text-muted font-label-caps text-label-caps">
                              Probolinggo / Nganjuk
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-xs text-text-secondary font-label-caps">1 kg</td>
                      <td className="py-3.5 px-space-sm bg-status-normal-bg text-status-normal font-metric-value font-semibold">
                        Rp 34.000{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-normal/80">
                          Min
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 36.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 37.500</td>
                      <td className="py-3.5 px-space-sm bg-status-critical-bg text-status-critical font-metric-value font-semibold">
                        Rp 41.000{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-critical/80">
                          Max
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 36.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 38.500</td>
                      <td className="py-3.5 px-space-sm font-metric-value text-text-secondary">
                        Rp 37.160
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-metric-delta text-body-sm text-status-critical font-bold">
                            Rp 7.000
                          </span>
                          <span className="px-space-2xs py-0.5 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps">
                            20.5% (Kritis)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Row 8: Bawang Putih Honan */}
                    <tr className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-status-normal"></span>
                          <div className="flex flex-col">
                            <span className="font-title-md text-body-md text-text-primary font-semibold">
                              Bawang Putih Honan
                            </span>
                            <span className="text-text-muted font-label-caps text-label-caps">
                              Impor Tanjung Perak
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-xs text-text-secondary font-label-caps">1 kg</td>
                      <td className="py-3.5 px-space-sm bg-status-normal-bg text-status-normal font-metric-value font-semibold">
                        Rp 36.000{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-normal/80">
                          Min
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 37.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 38.000</td>
                      <td className="py-3.5 px-space-sm bg-status-warning-bg text-status-warning font-metric-value font-semibold">
                        Rp 39.500{" "}
                        <span className="text-label-caps font-label-caps block font-normal text-status-warning/80">
                          Max
                        </span>
                      </td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 37.000</td>
                      <td className="py-3.5 px-space-sm font-metric-value">Rp 38.500</td>
                      <td className="py-3.5 px-space-sm font-metric-value text-text-secondary">
                        Rp 37.660
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-metric-delta text-body-sm text-status-normal font-bold">
                            Rp 3.500
                          </span>
                          <span className="px-space-2xs py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
                            9.7% (Sedang)
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Table Pagination / Footer Meta */}
              <div className="p-space-md bg-surface-subtle/40 flex flex-col sm:flex-row items-center justify-between gap-space-xs font-body-sm text-body-sm text-text-secondary">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-body-md text-status-normal">
                    verified_user
                  </span>
                  <span>Sampling harga diverifikasi petugas pencatat SP2KP pada 5 pedagang per pasar.</span>
                </div>
                <div className="flex items-center gap-space-xs font-label-caps text-label-caps">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-normal-bg border border-status-normal inline-block"></span>{" "}
                  Harga Termurah (Acuan)
                  <span className="w-2.5 h-2.5 rounded-full bg-status-critical-bg border border-status-critical inline-block ml-2"></span>{" "}
                  Harga Tertinggi (Anomali)
                </div>
              </div>
            </div>

            {/* 4. Health Monitor API & Data Ingestion Pipelines */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                {/* Pipeline Overview */}
                <div className="flex flex-col gap-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-headline-sm">
                      monitoring
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-text-primary">
                      Pipeline &amp; Sinkronisasi Node Pasar
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                    Data feed diintegrasikan langsung dari sistem IoT Timbangan Digital &amp; Input Lapangan Satgas Dinas Koperasi UKM dan Perdagangan Kota Surabaya.
                  </p>
                </div>
                {/* Metric Grid Telemetry */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm flex-1">
                  <div className="p-space-xs bg-surface-subtle rounded-lg flex flex-col">
                    <span className="font-label-caps text-label-caps text-text-muted uppercase">
                      Node Pasar
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-status-normal"></span>
                      <span className="font-metric-value text-metric-value text-text-primary">
                        6 / 6
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-status-normal mt-0.5">
                      Sinkron Aktif
                    </span>
                  </div>
                  <div className="p-space-xs bg-surface-subtle rounded-lg flex flex-col">
                    <span className="font-label-caps text-label-caps text-text-muted uppercase">
                      Uptime Server
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-status-normal"></span>
                      <span className="font-metric-value text-metric-value text-text-primary">
                        99.8%
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                      Diskominfo Sby
                    </span>
                  </div>
                  <div className="p-space-xs bg-surface-subtle rounded-lg flex flex-col">
                    <span className="font-label-caps text-label-caps text-text-muted uppercase">
                      Latensi Rata-rata
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-metric-value text-metric-value text-text-primary">
                        120 ms
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-status-normal mt-0.5">
                      Optimal Edge
                    </span>
                  </div>
                  <div className="p-space-xs bg-surface-subtle rounded-lg flex flex-col">
                    <span className="font-label-caps text-label-caps text-text-muted uppercase">
                      Outlier Detection
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="material-symbols-outlined text-body-md text-status-normal">
                        check_circle
                      </span>
                      <span className="font-metric-value text-metric-value text-text-primary">
                        Aktif
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                      Z-Score ±2.5σ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
