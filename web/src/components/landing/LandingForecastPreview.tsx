"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  OFFICIAL_MODEL_CHAMPIONS,
  OFFICIAL_REGULATORY_BENCHMARKS,
} from "@/lib/regulatoryData";
import CommoditySearchSelect from "@/components/CommoditySearchSelect";
import {
  getLiveForecastDetails,
  ALL_CATALOG_COMMODITIES,
  formatCommodityName,
} from "@/lib/dataService";

interface ForecastScenario {
  id: number;
  name: string;
  unit: string;
  currentPrice: number;
  historical: number[];
  p10: number[];
  p50: number[];
  p90: number[];
}

const FORECAST_DATA: ForecastScenario[] = [
  {
    id: 50,
    name: "Cabai Rawit Merah",
    unit: "kg",
    currentPrice: 72000,
    historical: [64000, 66000, 65000, 68000, 70000, 71000, 72000],
    p10: [70000, 68000, 67000, 65000, 64000, 63000, 62000],
    p50: [72500, 71000, 69500, 68000, 67000, 66000, 65000],
    p90: [75000, 76000, 75500, 74000, 73500, 72000, 71000],
  },
  {
    id: 39,
    name: "Bawang Merah",
    unit: "kg",
    currentPrice: 38000,
    historical: [35000, 36000, 35500, 37000, 37500, 38000, 38000],
    p10: [37500, 37000, 36500, 36000, 35500, 35000, 34500],
    p50: [38500, 38800, 39000, 39500, 39800, 40000, 40200],
    p90: [40000, 41000, 41500, 42000, 42500, 43000, 43500],
  },
  {
    id: 16,
    name: "Telur Ayam Ras",
    unit: "kg",
    currentPrice: 28500,
    historical: [27500, 27800, 28000, 28200, 28000, 28300, 28500],
    p10: [28200, 28000, 27800, 27600, 27500, 27400, 27200],
    p50: [28700, 28800, 28900, 29000, 29100, 29000, 28900],
    p90: [29200, 29500, 29800, 30000, 30200, 30400, 30500],
  },
];

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export default function LandingForecastPreview() {
  const [activeId, setActiveId] = useState<number>(50);
  const [liveData, setLiveData] = useState<Record<number, ForecastScenario>>({});

  useEffect(() => {
    let isMounted = true;
    getLiveForecastDetails(activeId, "7d").then((details) => {
      if (!isMounted || !details || !details.history?.length || !details.forecast?.length) return;

      const hist = details.history.slice(-7).map((h) => h.harga);
      const p10 = details.forecast.slice(0, 7).map((f) => f.batas_bawah);
      const p50 = details.forecast.slice(0, 7).map((f) => f.harga_prediksi);
      const p90 = details.forecast.slice(0, 7).map((f) => f.batas_atas);

      setLiveData((prev) => ({
        ...prev,
        [activeId]: {
          id: activeId,
          name: details.nama_komoditas,
          unit: details.satuan,
          currentPrice: details.currentPrice || hist[hist.length - 1],
          historical: hist,
          p10,
          p50,
          p90,
        },
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [activeId]);

  const fallbackCommodity = ALL_CATALOG_COMMODITIES.find((c) => c.id === activeId);
  const data = liveData[activeId] || FORECAST_DATA.find((item) => item.id === activeId) || {
    id: activeId,
    name: fallbackCommodity ? formatCommodityName(fallbackCommodity.name) : "Komoditas",
    unit: fallbackCommodity?.unit || "kg",
    currentPrice: FORECAST_DATA[0].currentPrice,
    historical: FORECAST_DATA[0].historical,
    p10: FORECAST_DATA[0].p10,
    p50: FORECAST_DATA[0].p50,
    p90: FORECAST_DATA[0].p90,
  };
  const chartId = useId().replace(/:/g, "");
  const benchmark = OFFICIAL_REGULATORY_BENCHMARKS[data.id];
  const champion = OFFICIAL_MODEL_CHAMPIONS[data.id];

  const width = 800;
  const height = 260;
  const padLeft = 66;
  const padRight = 18;
  const padTop = 24;
  const padBottom = 38;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const forecastHorizon = data.p50.length;
  const lastIndex = data.historical.length - 1 + forecastHorizon;
  const allValues = [
    ...data.historical,
    ...data.p10,
    ...data.p50,
    ...data.p90,
    ...(benchmark ? [benchmark.price] : []),
  ];
  const computedMin = Math.floor((Math.min(...allValues) - 5000) / 10000) * 10000 + 5000;
  const computedMax = Math.ceil((Math.max(...allValues) - 5000) / 10000) * 10000 + 5000;
  const minValue = Math.max(0, computedMin);
  const maxValue = computedMax <= minValue ? minValue + 10000 : computedMax;
  const tickStep = maxValue - minValue >= 20000 ? 10000 : 5000;
  const yTicks = Array.from(
    { length: Math.floor((maxValue - minValue) / tickStep) + 1 },
    (_, index) => minValue + index * tickStep,
  );

  const getX = (index: number) => padLeft + (index / lastIndex) * chartW;
  const getY = (value: number) => padTop + chartH - ((value - minValue) / (maxValue - minValue)) * chartH;
  const historicalPoints = data.historical.map((value, index) => ({ x: getX(index), y: getY(value) }));
  const todayPoint = historicalPoints[historicalPoints.length - 1];
  const forecastPoints = Array.from({ length: forecastHorizon }, (_, index) => ({
    x: getX(data.historical.length + index),
    low: getY(data.p10[index]),
    median: getY(data.p50[index]),
    high: getY(data.p90[index]),
  }));
  const historicalPath = historicalPoints.map((point, index) => `${index ? "L" : "M"} ${point.x},${point.y}`).join(" ");
  const medianPath = [todayPoint, ...forecastPoints.map((point) => ({ x: point.x, y: point.median }))]
    .map((point, index) => `${index ? "L" : "M"} ${point.x},${point.y}`)
    .join(" ");
  const upperPath = [todayPoint, ...forecastPoints.map((point) => ({ x: point.x, y: point.high }))]
    .map((point, index) => `${index ? "L" : "M"} ${point.x},${point.y}`)
    .join(" ");
  const lowerPath = [todayPoint, ...forecastPoints.map((point) => ({ x: point.x, y: point.low }))]
    .map((point, index) => `${index ? "L" : "M"} ${point.x},${point.y}`)
    .join(" ");
  const ribbonPath = `${upperPath} ${[todayPoint, ...forecastPoints.map((point) => ({ x: point.x, y: point.low }))]
    .reverse()
    .map((point) => `L ${point.x},${point.y}`)
    .join(" ")} Z`;
  const benchmarkDifference = benchmark ? data.currentPrice - benchmark.price : null;
  const benchmarkDifferencePercent = benchmark
    ? (Math.abs(data.currentPrice - benchmark.price) / benchmark.price) * 100
    : null;

  return (
    <div className="lw-forecast-card">
      <div className="lw-forecast-toolbar relative z-30">
        <div className="flex items-center gap-2 min-w-0 flex-1 max-w-xs sm:max-w-sm">
          <CommoditySearchSelect
            options={ALL_CATALOG_COMMODITIES}
            valueId={activeId}
            onChange={setActiveId}
            searchPlaceholder="Cari dari 37 komoditas Surabaya..."
            emptyNoun="komoditas"
            className="w-full"
            panelClassName="w-[calc(100vw-2.5rem)] max-w-sm sm:w-96"
          />
        </div>
        <Link
          href="/forecasting"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-xs transition-all active:scale-[0.98] shrink-0"
        >
          <span>Buka Halaman Perkiraan</span>
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>

      <div className="lw-forecast-summary">
        <div>
          <span className="lw-forecast-eyebrow">Perkiraan harga berbasis data</span>
          <div className="lw-forecast-price-line">
            <strong>{formatRupiah(data.currentPrice)}<span>/{data.unit}</span></strong>
            {benchmark && benchmarkDifference !== null && benchmarkDifferencePercent !== null && (
              <span className={`lw-forecast-premium${benchmarkDifference < 0 ? " is-below" : ""}`}>
                {benchmarkDifference === 0
                  ? `Sama dengan batas Bapanas (${formatRupiah(benchmark.price)})`
                  : `${benchmarkDifference > 0 ? "▲" : "▼"} ${benchmarkDifferencePercent.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% ${benchmarkDifference > 0 ? "di atas" : "di bawah"} batas Bapanas (${formatRupiah(benchmark.price)})`}
              </span>
            )}
          </div>
        </div>
        <span className="lw-forecast-wape">Rata-rata selisih perkiraan 7 hari <strong>{champion ? `${champion.wape.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%` : "—"}</strong></span>
      </div>

      <div className="lw-forecast-legend" aria-label="Keterangan grafik">
        <span><i className="lw-legend-actual" />Harga yang tercatat</span>
        <span><i className="lw-legend-median" />Perkiraan utama</span>
        <span><i className="lw-legend-band" />Kisaran harga yang mungkin</span>
        {benchmark && <span><i className="lw-legend-benchmark" />Batas Bapanas</span>}
      </div>

      <div className="lw-forecast-chart">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Harga historis dan kisaran proyeksi tujuh hari untuk ${data.name}`}>
          <defs>
            <linearGradient id={`band-${chartId}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {yTicks.map((value) => {
            const y = getY(value);
            return (
              <g key={value}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} className="lw-chart-gridline" />
                <text x={padLeft - 10} y={y + 4} className="lw-chart-axis-label" textAnchor="end">
                  {Math.round(value / 1000)}k
                </text>
              </g>
            );
          })}

          {benchmark && (
            <>
              <line x1={padLeft} y1={getY(benchmark.price)} x2={width - padRight} y2={getY(benchmark.price)} className="lw-chart-hap-line" />
              <text x={width - padRight - 2} y={getY(benchmark.price) - 6} className="lw-chart-hap-label" textAnchor="end">
                Batas Bapanas {formatRupiah(benchmark.price)}
              </text>
            </>
          )}

          <path d={ribbonPath} fill={`url(#band-${chartId})`} />
          <path d={upperPath} className="lw-chart-bound" />
          <path d={lowerPath} className="lw-chart-bound" />
          <path d={medianPath} className="lw-chart-median" />
          <path d={historicalPath} className="lw-chart-actual" />

          {historicalPoints.map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r={index === historicalPoints.length - 1 ? 4.5 : 3} className="lw-chart-point" />
          ))}

          <line x1={todayPoint.x} y1={padTop} x2={todayPoint.x} y2={padTop + chartH} className="lw-chart-today-line" />
          <text x={todayPoint.x} y={height - 7} className="lw-chart-axis-label lw-chart-today-label" textAnchor="middle">Hari ini</text>
          <text x={padLeft} y={height - 7} className="lw-chart-axis-label" textAnchor="start">6 hari lalu</text>
          <text x={width - padRight} y={height - 7} className="lw-chart-axis-label lw-chart-end-label" textAnchor="end">7 hari lagi</text>
        </svg>
      </div>
      <p className="lw-forecast-footnote">Perkiraan harga 7 hari ke depan menampilkan kisaran kemungkinan (harga terendah hingga tertinggi). Rata-rata selisih dihitung dari hasil pengujian prediksi sebelumnya terhadap harga riil di pasar.</p>
    </div>
  );
}
