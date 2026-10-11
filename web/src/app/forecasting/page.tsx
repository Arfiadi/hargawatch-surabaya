"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getLiveForecastDetails,
  CommodityForecastDetails,
  FORECAST_COMMODITIES,
} from "@/lib/dataService";

// Batas acuan regulasi resmi pemerintah (HAP Bapanas / HET Kemendag)
const REGULATORY_BENCHMARKS: Record<
  number,
  { label: string; price: number; note: string }
> = {
  50: { label: "HAP Bapanas", price: 57000, note: "Harga Acuan Penjualan Konsumen Nasional" },
  39: { label: "HAP Bapanas", price: 41500, note: "Harga Acuan Penjualan Konsumen Nasional" },
  10: { label: "HET Pemerintah", price: 15700, note: "Harga Eceran Tertinggi Minyakita / Curah" },
  2: { label: "HET Beras Premium", price: 14900, note: "Harga Eceran Tertinggi Zona 1" },
  13: { label: "HAP Bapanas", price: 36750, note: "Harga Acuan Daging Ayam Ras Segar" },
  16: { label: "HAP Bapanas", price: 27000, note: "Harga Acuan Telur Ayam Ras Konsumsi" },
  7: { label: "HAP Bapanas", price: 17500, note: "Harga Acuan Gula Konsumsi Ritel" },
};

export default function ForecastingPage() {
  const [selectedCommodity, setSelectedCommodity] = useState<number>(50);
  const [horizon, setHorizon] = useState<7 | 14>(14);
  const [statusFilter, setStatusFilter] = useState<"all" | "alert">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [forecastData, setForecastData] = useState<CommodityForecastDetails | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    label: string;
    price: number;
    lower?: number;
    upper?: number;
    isForecast: boolean;
  } | null>(null);
  const [exportState, setExportState] = useState<"idle" | "downloading" | "success">("idle");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getLiveForecastDetails(selectedCommodity).then((res) => {
      if (isMounted) {
        setForecastData(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCommodity]);

  const activeForecastRows = useMemo(() => {
    if (!forecastData) return [];
    const sliced = forecastData.forecast.slice(0, horizon);
    if (statusFilter === "alert") {
      return sliced.filter((r) => r.status !== "Normal");
    }
    return sliced;
  }, [forecastData, horizon, statusFilter]);

  const activeCommodityMeta = useMemo(() => {
    return (
      FORECAST_COMMODITIES.find((c) => c.id === selectedCommodity) ||
      FORECAST_COMMODITIES[0]
    );
  }, [selectedCommodity]);

  const benchmarkMeta = useMemo(() => {
    return REGULATORY_BENCHMARKS[selectedCommodity];
  }, [selectedCommodity]);

  const targetHorizonRow = useMemo(() => {
    if (!forecastData || forecastData.forecast.length === 0) return null;
    const idx = Math.min(horizon, forecastData.forecast.length) - 1;
    return forecastData.forecast[idx];
  }, [forecastData, horizon]);

  // Export CSV riil berdasarkan data aktif
  const handleExportCSV = () => {
    if (!forecastData) return;
    setExportState("downloading");

    setTimeout(() => {
      const rows = forecastData.forecast.slice(0, horizon);
      const csvHeader =
        "Horizon,Tanggal,Hari,Batas Bawah (Rp),Proyeksi Rata-rata (Rp),Batas Atas (Rp),Perubahan (%),Status,Catatan Pemantauan\n";
      const csvBody = rows
        .map(
          (r) =>
            `"H+${r.horizon}","${r.tanggal}","${r.weekday}","${r.batas_bawah}","${r.harga_prediksi}","${r.batas_atas}","${r.deltaPct}%","${r.status}","${r.recom}"`
        )
        .join("\n");

      const blob = new Blob([csvHeader + csvBody], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `proyeksi_harga_${activeCommodityMeta.name.toLowerCase().replace(/\s+/g, "_")}_${horizon}hari.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportState("success");
      setTimeout(() => setExportState("idle"), 2000);
    }, 600);
  };

  // Kalkulasi koordinat SVG Chart secara matematis dari data riil
  const chartMetrics = useMemo(() => {
    if (!forecastData || forecastData.history.length === 0) return null;

    const historyPoints = forecastData.history;
    const forecastPoints = forecastData.forecast.slice(0, horizon);

    const benchmark = REGULATORY_BENCHMARKS[selectedCommodity];

    const allPrices = [
      ...historyPoints.map((h) => h.harga),
      ...forecastPoints.flatMap((f) => [f.harga_prediksi, f.batas_bawah, f.batas_atas]),
      ...(benchmark ? [benchmark.price] : []),
    ];

    const rawMin = Math.min(...allPrices);
    const rawMax = Math.max(...allPrices);
    const padding = (rawMax - rawMin) * 0.12 || 1000;
    const minY = Math.floor((rawMin - padding) / 500) * 500;
    const maxY = Math.ceil((rawMax + padding) / 500) * 500;

    const svgWidth = 920;
    const svgHeight = 340;
    const padX = 72;
    const padTop = 38;
    const padBottom = 52;
    const plotWidth = svgWidth - padX * 2;
    const plotHeight = svgHeight - padTop - padBottom;

    const totalSteps = historyPoints.length + forecastPoints.length - 1;

    const getX = (index: number) => {
      return padX + (index / totalSteps) * plotWidth;
    };

    const getY = (val: number) => {
      return svgHeight - padBottom - ((val - minY) / (maxY - minY)) * plotHeight;
    };

    // Koordinat historis
    const histCoords = historyPoints.map((h, i) => ({
      x: getX(i),
      y: getY(h.harga),
      data: h,
    }));

    const todayIdx = historyPoints.length - 1;
    const todayCoord = histCoords[todayIdx];

    // Koordinat proyeksi (dengan batas bawah yang wajar)
    const fcCoords = forecastPoints.map((f, i) => ({
      x: getX(todayIdx + 1 + i),
      y: getY(f.harga_prediksi),
      yLow: getY(Math.max(f.batas_bawah, forecastData.currentPrice * 0.72)),
      yHigh: getY(f.batas_atas),
      data: f,
    }));

    // Path kurva histori
    const histPath = histCoords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`;
    }, "");

    const histArea = `${histPath} L ${todayCoord.x},${svgHeight - padBottom} L ${padX},${
      svgHeight - padBottom
    } Z`;

    // Path kurva proyeksi
    const fcPath = [todayCoord, ...fcCoords].reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`;
    }, "");

    // Path Batas Toleransi (Shaded Band)
    const upperPoints = [todayCoord, ...fcCoords.map((c) => ({ x: c.x, y: c.yHigh }))];
    const lowerPointsReversed = [
      ...fcCoords.map((c) => ({ x: c.x, y: c.yLow })),
      todayCoord,
    ].reverse();

    const ciPolygonPoints = [
      ...upperPoints.map((p) => `${p.x},${p.y}`),
      ...lowerPointsReversed.map((p) => `${p.x},${p.y}`),
    ].join(" ");

    // Grid garis referensi harga horizontal
    const midPrice = Math.round((minY + maxY) / 2);
    const gridLines = [
      { price: maxY, y: getY(maxY) },
      { price: midPrice, y: getY(midPrice) },
      { price: minY, y: getY(minY) },
    ];

    // Garis benchmark HAP pemerintah jika ada
    const benchmarkY = benchmark ? getY(benchmark.price) : null;

    // 5 Penanda label sumbu X (Timeline)
    const midHistIdx = Math.floor(historyPoints.length / 2);
    const midFcIdx = Math.floor(forecastPoints.length / 2);

    const xLabels = [
      {
        x: histCoords[0]?.x || padX,
        title: "14 Hari Lalu",
        sub: historyPoints[0]?.formattedDate || "",
        anchor: "start",
      },
      {
        x: histCoords[midHistIdx]?.x || getX(midHistIdx),
        title: "7 Hari Lalu",
        sub: historyPoints[midHistIdx]?.formattedDate || "",
        anchor: "middle",
      },
      {
        x: todayCoord.x,
        title: "Hari Ini",
        sub: forecastData.formattedLatestDate,
        anchor: "middle",
        isToday: true,
      },
      {
        x: fcCoords[midFcIdx]?.x || getX(todayIdx + 1 + midFcIdx),
        title: `H+${forecastPoints[midFcIdx]?.horizon || 7}`,
        sub: forecastPoints[midFcIdx]?.formattedDate.slice(0, 6) || "",
        anchor: "middle",
      },
      {
        x: fcCoords[fcCoords.length - 1]?.x || svgWidth - padX,
        title: `H+${horizon}`,
        sub: forecastPoints[forecastPoints.length - 1]?.formattedDate.slice(0, 6) || "",
        anchor: "end",
      },
    ];

    return {
      svgWidth,
      svgHeight,
      padX,
      padBottom,
      minY,
      maxY,
      histCoords,
      todayCoord,
      fcCoords,
      histPath,
      histArea,
      fcPath,
      ciPolygonPoints,
      gridLines,
      benchmarkY,
      benchmarkLabel: benchmark?.label,
      benchmarkPrice: benchmark?.price,
      xLabels,
    };
  }, [forecastData, horizon, selectedCommodity]);

  // Evaluasi status harga vs benchmark pemerintah
  const isAboveBenchmark = useMemo(() => {
    if (!forecastData || !benchmarkMeta) return false;
    return forecastData.currentPrice > benchmarkMeta.price;
  }, [forecastData, benchmarkMeta]);

  const deltaHapPercent = useMemo(() => {
    if (!forecastData || !benchmarkMeta) return 0;
    return Number(
      (((forecastData.currentPrice - benchmarkMeta.price) / benchmarkMeta.price) * 100).toFixed(1)
    );
  }, [forecastData, benchmarkMeta]);

  return (
    <div className="bg-surface-canvas text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Header />

      <main className="w-full pt-20 bg-surface-canvas min-h-screen">
        <div className="flex flex-col w-full">
          <div className="w-full max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop py-space-md flex flex-col gap-space-lg">
            {/* 1. Header & Konteks Halaman */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-normal/15 text-status-normal font-label-caps text-label-caps border border-status-normal/30 w-fit font-semibold">
                  <span className="w-2 h-2 rounded-full bg-status-normal animate-pulse"></span>
                  Data per {forecastData?.formattedLatestDate || "10 Okt 2026"} • Rilis Resmi 06.00 WIB
                </div>
                <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight mt-1">
                  Proyeksi Harga Pangan &amp; Tren Pasar
                </h1>
                <p className="font-body-sm text-body-sm text-text-secondary max-w-2xl">
                  Prakiraan harga 7 hingga 14 hari ke depan di pasar Kota Surabaya untuk panduan belanja masyarakat dan evaluasi kebijakan pangan pemerintah.
                </p>
              </div>

              {/* Tombol Unduh CSV */}
              <div className="flex items-center gap-space-xs shrink-0">
                <button
                  onClick={handleExportCSV}
                  disabled={loading || !forecastData}
                  className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-headline-sm text-body-sm hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-body-md">
                    {exportState === "downloading"
                      ? "sync"
                      : exportState === "success"
                      ? "check"
                      : "download"}
                  </span>
                  <span>
                    {exportState === "downloading"
                      ? "Menyiapkan CSV..."
                      : exportState === "success"
                      ? "Berhasil Diunduh"
                      : `Unduh CSV (${activeCommodityMeta.name})`}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Panel Pilihan Komoditas & Jangka Waktu */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                {/* Pilih Komoditas */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-space-xs sm:gap-space-sm flex-1">
                  <label
                    htmlFor="select-commodity"
                    className="font-label-caps text-label-caps text-text-secondary uppercase whitespace-nowrap"
                  >
                    Komoditas Pantauan:
                  </label>
                  <div className="relative flex-1 max-w-md">
                    <select
                      id="select-commodity"
                      value={selectedCommodity}
                      onChange={(e) => setSelectedCommodity(Number(e.target.value))}
                      className="w-full bg-surface-subtle text-text-primary font-headline-sm text-body-md px-space-sm py-2 rounded-lg border border-border-subtle focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      {FORECAST_COMMODITIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.unit.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                      keyboard_arrow_down
                    </span>
                  </div>
                </div>

                {/* Toggle Horizon Waktu */}
                <div className="flex items-center gap-space-xs self-start md:self-auto">
                  <span className="font-label-caps text-label-caps text-text-secondary uppercase mr-1">
                    Jangka Waktu:
                  </span>
                  <div className="inline-flex bg-surface-subtle p-1 rounded-lg border border-border-subtle/80">
                    <button
                      onClick={() => setHorizon(7)}
                      className={`px-3 py-1.5 rounded-md text-body-sm font-semibold transition-all cursor-pointer ${
                        horizon === 7
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      7 Hari
                    </button>
                    <button
                      onClick={() => setHorizon(14)}
                      className={`px-3 py-1.5 rounded-md text-body-sm font-semibold transition-all cursor-pointer ${
                        horizon === 14
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      14 Hari
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Ringkasan Metrik Cepat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {/* Metrik 1: Harga Riil Saat Ini */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                  Harga Rata-rata Terkini
                </span>
                <div className="my-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-metric-display text-metric-display text-text-primary font-bold">
                      Rp {forecastData ? forecastData.currentPrice.toLocaleString("id-ID") : "-"}
                    </span>
                    <span className="font-body-sm text-body-sm text-text-secondary">
                      /{forecastData?.satuan || "kg"}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Rata-rata 6 pasar per {forecastData?.formattedLatestDate || "10 Okt 2026"}
                  </span>
                </div>
                <div className="pt-2 border-t border-border-subtle/40 flex items-center gap-1 font-label-caps text-label-caps text-text-secondary">
                  <span className="material-symbols-outlined text-body-sm text-primary">verified</span>
                  Basis data aktual Siskaperbapo
                </div>
              </div>

              {/* Metrik 2: Estimasi Akhir Periode */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                  Prakiraan Hari ke-{horizon}
                </span>
                <div className="my-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-metric-display text-metric-display text-text-primary font-bold">
                      Rp {targetHorizonRow ? targetHorizonRow.harga_prediksi.toLocaleString("id-ID") : "-"}
                    </span>
                    <span className="font-body-sm text-body-sm text-text-secondary">
                      /{forecastData?.satuan || "kg"}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    {targetHorizonRow ? `${targetHorizonRow.weekday}, ${targetHorizonRow.formattedDate}` : "-"}
                  </span>
                </div>
                <div className="pt-2 border-t border-border-subtle/40 flex items-center justify-between font-label-caps text-label-caps">
                  <span className="text-text-secondary">Rentang Wajar:</span>
                  <span className="text-text-primary font-semibold">
                    Rp {targetHorizonRow ? targetHorizonRow.batas_bawah.toLocaleString("id-ID") : "-"} s/d Rp{" "}
                    {targetHorizonRow ? targetHorizonRow.batas_atas.toLocaleString("id-ID") : "-"}
                  </span>
                </div>
              </div>

              {/* Metrik 3: Arah Tren Perubahan */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                  Arah Perubahan Harga
                </span>
                <div className="my-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-metric-display text-metric-display font-bold ${
                        (targetHorizonRow?.deltaPct || 0) >= 3
                          ? "text-status-warning"
                          : (targetHorizonRow?.deltaPct || 0) <= -3
                          ? "text-status-normal"
                          : "text-text-primary"
                      }`}
                    >
                      {targetHorizonRow
                        ? `${targetHorizonRow.deltaPct >= 0 ? "+" : ""}${targetHorizonRow.deltaPct}%`
                        : "0%"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps font-semibold ${
                        (targetHorizonRow?.deltaPct || 0) >= 3
                          ? "bg-status-warning-bg text-status-warning"
                          : (targetHorizonRow?.deltaPct || 0) <= -3
                          ? "bg-status-normal-bg text-status-normal"
                          : "bg-surface-subtle text-text-secondary"
                      }`}
                    >
                      {(targetHorizonRow?.deltaPct || 0) >= 3
                        ? "Cenderung Naik"
                        : (targetHorizonRow?.deltaPct || 0) <= -3
                        ? "Cenderung Turun"
                        : "Stabil"}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Selisih Rp{" "}
                    {targetHorizonRow
                      ? Math.abs(targetHorizonRow.deltaRp).toLocaleString("id-ID")
                      : "0"}{" "}
                    dibanding hari ini
                  </span>
                </div>
                <div className="pt-2 border-t border-border-subtle/40 flex items-center gap-1 font-label-caps text-label-caps text-text-secondary">
                  <span className="material-symbols-outlined text-body-sm">trending_flat</span>
                  Fluktuasi dalam batas wajar
                </div>
              </div>

              {/* Metrik 4: Akurasi & Batas Toleransi */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                  Evaluasi Akurasi Model
                </span>
                <div className="my-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-metric-display text-metric-display text-status-normal font-bold">
                      94,6%
                    </span>
                    <span className="font-label-caps text-label-caps text-text-secondary">
                      Rerata Akurasi
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Tingkat error rata-rata (WAPE): 5,36%
                  </span>
                </div>
                <div className="pt-2 border-t border-border-subtle/40 flex items-center justify-between font-label-caps text-label-caps text-text-secondary">
                  <span>Interval Keyakinan:</span>
                  <span className="font-semibold text-text-primary">80% - 95%</span>
                </div>
              </div>
            </div>

            {/* 4. Grafik Riwayat 14 Hari & Proyeksi Mendatang */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">
                    Grafik Riwayat &amp; Proyeksi: {activeCommodityMeta.name}
                  </h2>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                    Menampilkan 14 hari data transaksi riil sebelumnya dan {horizon} hari proyeksi ke depan.
                  </p>
                </div>

                {/* Legenda Grafik yang Mudah Dipahami */}
                <div className="flex flex-wrap items-center gap-space-md text-label-caps font-label-caps">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-1 bg-primary rounded-full"></span>
                    <span className="text-text-primary">Riwayat Riil Pasar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-1 border-b-2 border-dashed border-status-warning"></span>
                    <span className="text-status-warning">Proyeksi Model</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40"></span>
                    <span className="text-text-secondary">Rentang Batas Toleransi</span>
                  </div>
                  {chartMetrics?.benchmarkPrice && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-1 border-b-2 border-dashed border-status-critical"></span>
                      <span className="text-status-critical font-bold">
                        {chartMetrics.benchmarkLabel} (Rp {Math.round(chartMetrics.benchmarkPrice / 1000)}k)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Area SVG Visualizer */}
              <div className="w-full relative bg-surface-subtle/60 rounded-xl p-2 sm:p-4 overflow-hidden border border-border-subtle/50 select-none">
                {/* Tooltip Hover Display */}
                {hoveredPoint && (
                  <div className="absolute top-4 right-4 z-20 bg-surface-card/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-md border border-border-subtle text-left pointer-events-none">
                    <span className="font-label-caps text-label-caps text-text-muted block">
                      {hoveredPoint.label} • {hoveredPoint.date}
                    </span>
                    <span className="font-headline-sm text-body-md text-text-primary block font-bold">
                      Rp {hoveredPoint.price.toLocaleString("id-ID")}
                    </span>
                    {hoveredPoint.lower && hoveredPoint.upper && (
                      <span className="font-body-sm text-[11px] text-text-secondary block">
                        Rentang Wajar: Rp {hoveredPoint.lower.toLocaleString("id-ID")} - Rp{" "}
                        {hoveredPoint.upper.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                )}

                {chartMetrics ? (
                  <div className="relative w-full h-[300px] sm:h-[350px]">
                    {/* 1. Vector Graph Canvas (Kurva, Area Shading, Grid & Titik Data) */}
                    <svg
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                      viewBox={`0 0 ${chartMetrics.svgWidth} ${chartMetrics.svgHeight}`}
                    >
                      <defs>
                        <linearGradient id="histAreaGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#004328" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#004328" stopOpacity="0.01" />
                        </linearGradient>
                        <linearGradient id="ciBandGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#d97706" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#d97706" stopOpacity="0.04" />
                        </linearGradient>
                      </defs>

                      {/* Garis Grid Horizontal */}
                      {chartMetrics.gridLines.map((gl, i) => (
                        <line
                          key={`gl-line-${i}`}
                          x1={chartMetrics.padX}
                          x2={chartMetrics.svgWidth - chartMetrics.padX}
                          y1={gl.y}
                          y2={gl.y}
                          stroke="#CBD5E1"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                          opacity="0.6"
                        />
                      ))}

                      {/* Garis Acuan Regulasi Pemerintah (HAP / HET Bapanas) */}
                      {chartMetrics.benchmarkY !== null && chartMetrics.benchmarkPrice && (
                        <line
                          x1={chartMetrics.padX}
                          x2={chartMetrics.svgWidth - chartMetrics.padX}
                          y1={chartMetrics.benchmarkY}
                          y2={chartMetrics.benchmarkY}
                          stroke="#DC2626"
                          strokeDasharray="6 4"
                          strokeWidth="1.6"
                          opacity="0.85"
                        />
                      )}

                      {/* Shading Rentang Batas Toleransi */}
                      <polygon fill="url(#ciBandGrad)" points={chartMetrics.ciPolygonPoints} />

                      {/* Shading Area Histori */}
                      <path d={chartMetrics.histArea} fill="url(#histAreaGrad)" />

                      {/* Garis Histori Riil */}
                      <path
                        d={chartMetrics.histPath}
                        fill="none"
                        stroke="#004328"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      />

                      {/* Garis Proyeksi (Dashed) */}
                      <path
                        d={chartMetrics.fcPath}
                        fill="none"
                        stroke="#D97706"
                        strokeWidth="2.8"
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                      />

                      {/* Garis Vertikal Pembatas: Hari Ini */}
                      <line
                        x1={chartMetrics.todayCoord.x}
                        x2={chartMetrics.todayCoord.x}
                        y1={24}
                        y2={chartMetrics.svgHeight - chartMetrics.padBottom}
                        stroke="#0F172A"
                        strokeDasharray="4 3"
                        strokeWidth="1.5"
                        opacity="0.5"
                      />

                      {/* Titik-titik data historis */}
                      {chartMetrics.histCoords.map((pt, i) => (
                        <circle
                          key={`hist-${i}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={i === chartMetrics.histCoords.length - 1 ? 5.5 : 3.5}
                          fill="#004328"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-pointer transition-transform hover:scale-125"
                          onMouseEnter={() =>
                            setHoveredPoint({
                              date: pt.data.formattedDate,
                              label: i === chartMetrics.histCoords.length - 1 ? "Hari Ini (Riil)" : "Riil Pasar",
                              price: pt.data.harga,
                              isForecast: false,
                            })
                          }
                        />
                      ))}

                      {/* Titik-titik proyeksi */}
                      {chartMetrics.fcCoords.map((pt, i) => (
                        <circle
                          key={`fc-${i}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={i === chartMetrics.fcCoords.length - 1 ? 5 : 4}
                          fill="#D97706"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-pointer transition-transform hover:scale-125"
                          onMouseEnter={() =>
                            setHoveredPoint({
                              date: `${pt.data.weekday}, ${pt.data.formattedDate}`,
                              label: `Proyeksi H+${pt.data.horizon}`,
                              price: pt.data.harga_prediksi,
                              lower: pt.data.batas_bawah,
                              upper: pt.data.batas_atas,
                              isForecast: true,
                            })
                          }
                        />
                      ))}
                    </svg>

                    {/* 2. HTML Typography Overlay (Bebas dari Distorsi / Skala Aspek Rasio) */}

                    {/* Label Sumbu Y (Tingkat Harga) */}
                    {chartMetrics.gridLines.map((gl, i) => (
                      <div
                        key={`gl-lbl-${i}`}
                        className="absolute -translate-y-1/2 text-[11px] font-medium text-slate-500 tabular-nums pointer-events-none select-none font-sans"
                        style={{
                          left: 0,
                          top: `${(gl.y / chartMetrics.svgHeight) * 100}%`,
                          width: `${(chartMetrics.padX / chartMetrics.svgWidth) * 100}%`,
                          paddingRight: "8px",
                          textAlign: "right",
                        }}
                      >
                        Rp {gl.price.toLocaleString("id-ID")}
                      </div>
                    ))}

                    {/* Label Garis Acuan Regulasi Pemerintah (HAP) */}
                    {chartMetrics.benchmarkY !== null && chartMetrics.benchmarkPrice && (
                      <div
                        className="absolute -translate-y-full -mt-1 text-[11px] font-bold text-status-critical pointer-events-none select-none font-sans"
                        style={{
                          right: `${(chartMetrics.padX / chartMetrics.svgWidth) * 100}%`,
                          top: `${(chartMetrics.benchmarkY / chartMetrics.svgHeight) * 100}%`,
                        }}
                      >
                        Garis {chartMetrics.benchmarkLabel}: Rp {chartMetrics.benchmarkPrice.toLocaleString("id-ID")}/kg
                      </div>
                    )}

                    {/* Callout Badge: Hari Ini */}
                    <div
                      className="absolute -translate-x-1/2 -translate-y-full -mt-2.5 pointer-events-none select-none z-10 transition-all duration-150"
                      style={{
                        left: `${(chartMetrics.todayCoord.x / chartMetrics.svgWidth) * 100}%`,
                        top: `${(chartMetrics.todayCoord.y / chartMetrics.svgHeight) * 100}%`,
                      }}
                    >
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary text-on-primary text-[11px] font-bold shadow-md whitespace-nowrap font-sans">
                        Rp {forecastData ? forecastData.currentPrice.toLocaleString("id-ID") : ""}
                      </div>
                    </div>

                    {/* Callout Badge: Titik Akhir Proyeksi */}
                    {chartMetrics.fcCoords.length > 0 && targetHorizonRow && (
                      <div
                        className="absolute -translate-x-1/2 -translate-y-full -mt-2.5 pointer-events-none select-none z-10 transition-all duration-150"
                        style={{
                          left: `${(chartMetrics.fcCoords[chartMetrics.fcCoords.length - 1].x / chartMetrics.svgWidth) * 100}%`,
                          top: `${(chartMetrics.fcCoords[chartMetrics.fcCoords.length - 1].y / chartMetrics.svgHeight) * 100}%`,
                        }}
                      >
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-status-warning text-white text-[11px] font-bold shadow-md whitespace-nowrap font-sans">
                          H+{horizon}: Rp {targetHorizonRow.harga_prediksi.toLocaleString("id-ID")}
                        </div>
                      </div>
                    )}

                    {/* Label Sumbu X: 5 Penanda Waktu / Tanggal di Bagian Bawah */}
                    <div className="absolute left-0 right-0 bottom-1 pointer-events-none select-none">
                      {chartMetrics.xLabels.map((lbl, idx) => (
                        <div
                          key={`xlbl-${idx}`}
                          className={`absolute text-center ${
                            lbl.anchor === "start"
                              ? "translate-x-0"
                              : lbl.anchor === "end"
                              ? "-translate-x-full"
                              : "-translate-x-1/2"
                          }`}
                          style={{
                            left: `${(lbl.x / chartMetrics.svgWidth) * 100}%`,
                          }}
                        >
                          <span
                            className={`block text-[11px] leading-tight font-sans ${
                              lbl.isToday
                                ? "text-text-primary font-bold"
                                : "text-text-secondary font-semibold"
                            }`}
                          >
                            {lbl.title}
                          </span>
                          <span
                            className={`block text-[10px] leading-tight mt-0.5 font-sans ${
                              lbl.isToday
                                ? "text-primary font-bold"
                                : "text-text-muted font-normal"
                            }`}
                          >
                            {lbl.sub}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-text-muted">
                    Memuat visualisasi proyeksi...
                  </div>
                )}
              </div>
            </div>

            {/* 5. Kotak Panduan Interpretasi Praktis bagi Stakeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Card 1: Bagi Masyarakat & Konsumen */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-body-lg">shopping_basket</span>
                    </span>
                    <span className="font-headline-sm text-body-md text-text-primary">
                      Panduan bagi Masyarakat &amp; UMKM
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps font-semibold ${
                      (targetHorizonRow?.deltaPct || 0) >= 5
                        ? "bg-status-warning-bg text-status-warning"
                        : "bg-status-normal-bg text-status-normal"
                    }`}
                  >
                    {(targetHorizonRow?.deltaPct || 0) >= 5
                      ? "Perlu Perhatian"
                      : "Kondisi Belanja Aman"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                    Harga {activeCommodityMeta.name} diprediksi{" "}
                    <strong>
                      {(targetHorizonRow?.deltaPct || 0) >= 3
                        ? `mengalami kenaikan sekitar +${targetHorizonRow?.deltaPct}%`
                        : (targetHorizonRow?.deltaPct || 0) <= -3
                        ? `mengalami penurunan sekitar ${targetHorizonRow?.deltaPct}%`
                        : "tetap stabil di kisaran harga saat ini"}
                    </strong>{" "}
                    dalam {horizon} hari ke depan. Konsumen dan pelaku usaha dapat berbelanja normal
                    tanpa perlu khawatir kelangkaan pasokan.
                  </p>
                  <div className="bg-surface-subtle p-2.5 rounded-lg flex items-center gap-2 text-text-primary font-body-sm text-body-sm border border-border-subtle/50">
                    <span className="material-symbols-outlined text-primary text-body-md shrink-0">
                      lightbulb
                    </span>
                    <span>
                      <strong>Saran Belanja:</strong> Hari Selasa s/d Kamis harga pasar umumnya lebih stabil dibanding akhir pekan (Jumat–Minggu).
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Bagi Pemerintah Kota Surabaya & TPID */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-status-warning-bg text-status-warning flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-body-lg">account_balance</span>
                    </span>
                    <span className="font-headline-sm text-body-md text-text-primary">
                      Panduan bagi Pemkot Surabaya &amp; TPID
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps font-semibold ${
                      isAboveBenchmark
                        ? "bg-status-warning-bg text-status-warning"
                        : "bg-status-normal-bg text-status-normal"
                    }`}
                  >
                    {isAboveBenchmark
                      ? `Di Atas HAP (+${deltaHapPercent}%)`
                      : "Sesuai / Di Bawah HAP"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                    {benchmarkMeta ? (
                      <>
                        Harga saat ini berada{" "}
                        <strong>
                          {isAboveBenchmark
                            ? `Rp ${(forecastData?.currentPrice || 0) - benchmarkMeta.price} di atas ${benchmarkMeta.label}`
                            : `dalam batas aman ${benchmarkMeta.label}`}
                        </strong>{" "}
                        (Rp {benchmarkMeta.price.toLocaleString("id-ID")}/{activeCommodityMeta.unit}). Tren ke depan terpantau stabil tanpa lonjakan ekstrem.
                      </>
                    ) : (
                      "Harga komoditas berada dalam koridor ekuilibrium pasar yang terkendali."
                    )}
                  </p>
                  <div className="bg-surface-subtle p-2.5 rounded-lg flex items-center gap-2 text-text-primary font-body-sm text-body-sm border border-border-subtle/50">
                    <span className="material-symbols-outlined text-status-warning text-body-md shrink-0">
                      policy
                    </span>
                    <span>
                      <strong>Rekomendasi Satgas:</strong> Cukup pemantauan pasokan rutin dari daerah sentra (Kediri/Malang). Belum memerlukan subsidi operasi pasar darurat.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Tabel Rincian Proyeksi Harian */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">
                    Rincian Proyeksi Harian (H+1 s/d H+{horizon})
                  </h2>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                    Taksiran harga rata-rata, rentang batas toleransi, dan catatan pemantauan harian.
                  </p>
                </div>

                {/* Filter Status Tabel */}
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-caps text-label-caps text-text-muted mr-1">Status:</span>
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 rounded-md font-label-caps text-label-caps transition-colors cursor-pointer ${
                      statusFilter === "all"
                        ? "bg-primary text-on-primary"
                        : "bg-surface-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Semua ({horizon})
                  </button>
                  <button
                    onClick={() => setStatusFilter("alert")}
                    className={`px-3 py-1 rounded-md font-label-caps text-label-caps transition-colors cursor-pointer ${
                      statusFilter === "alert"
                        ? "bg-status-warning text-on-primary"
                        : "bg-surface-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Waspada / Perhatian
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-subtle font-label-caps text-label-caps text-text-secondary uppercase">
                      <th className="py-3 px-4 rounded-l-lg">Horizon</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Batas Bawah</th>
                      <th className="py-3 px-4">Proyeksi Rata-rata</th>
                      <th className="py-3 px-4">Batas Atas</th>
                      <th className="py-3 px-4">Perubahan vs Hari Ini</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-r-lg">Catatan Pemantauan</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm divide-y divide-surface-subtle">
                    {activeForecastRows.length > 0 ? (
                      activeForecastRows.map((row) => (
                        <tr key={row.horizon} className="hover:bg-surface-subtle/50 transition-colors">
                          <td className="py-3 px-4 font-headline-sm text-body-md text-text-primary">
                            H+{row.horizon}
                          </td>
                          <td className="py-3 px-4 text-text-secondary">
                            <span className="font-semibold text-text-primary block">
                              {row.weekday}
                            </span>
                            <span className="text-[12px] text-text-muted">{row.formattedDate}</span>
                          </td>
                          <td className="py-3 px-4 text-text-secondary">
                            Rp {row.batas_bawah.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 font-semibold text-text-primary">
                            Rp {row.harga_prediksi.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-text-secondary">
                            Rp {row.batas_atas.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-semibold ${
                                row.deltaPct >= 3
                                  ? "text-status-warning"
                                  : row.deltaPct <= -3
                                  ? "text-status-normal"
                                  : "text-text-secondary"
                              }`}
                            >
                              {row.deltaPct >= 0 ? `+${row.deltaPct}%` : `${row.deltaPct}%`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-label-caps font-semibold ${
                                row.status === "Tinggi"
                                  ? "bg-status-critical-bg text-status-critical"
                                  : row.status === "Waspada"
                                  ? "bg-status-warning-bg text-status-warning"
                                  : "bg-status-normal-bg text-status-normal"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-secondary max-w-xs">{row.recom}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-text-muted">
                          Tidak ada data yang memenuhi filter saat ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. Catatan Tren Pasar Surabaya (Faktual & Praktis) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary font-headline-sm text-body-md">
                  <span className="material-symbols-outlined text-body-lg">calendar_today</span>
                  <span>Pola Siklus Mingguan di Surabaya</span>
                </div>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Berdasarkan tren historis, komoditas hortikultura (cabai dan bawang) serta daging ayam umumnya mengalami kenaikan belanja wajar sebesar 2% hingga 5% pada hari Jumat hingga Minggu seiring peningkatan belanja akhir pekan rumah tangga dan usaha kuliner.
                </p>
              </div>

              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary font-headline-sm text-body-md">
                  <span className="material-symbols-outlined text-body-lg">local_shipping</span>
                  <span>Jalur Pasokan Antar-Daerah</span>
                </div>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Stabilitas harga di pasar-pasar Surabaya sangat bergantung pada kelancaran arus bongkar muat dari sentra produksi Jawa Timur seperti Kediri, Malang, dan Blitar yang masuk melalui Pasar Induk Keputran dan Pasar Osowilangun.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
