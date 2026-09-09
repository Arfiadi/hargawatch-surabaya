"use client";

import { useState } from "react";
import { COMMODITIES } from "@/data/mockData";

export default function PriceTrendChart() {
  const [selectedCommodityId, setSelectedCommodityId] = useState<number>(1);
  const commodity = COMMODITIES.find((c) => c.id === selectedCommodityId) || COMMODITIES[0];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const dates = ["H-6", "H-5", "H-4", "H-3", "H-2", "H-1", "Hari Ini"];
  const min = Math.min(...commodity.sparkline);
  const max = Math.max(...commodity.sparkline);
  const range = max - min || 1;

  return (
    <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-caps text-xs uppercase text-primary font-bold">
              Time-Series Analytics
            </span>
          </div>
          <h3 className="font-headline-md font-bold text-text-primary">
            Grafik Tren Perubahan Harga Harian
          </h3>
          <p className="font-body-sm text-xs text-text-secondary">
            Pergerakan rata-rata harga pasar Surabaya selama 7 hari terakhir
          </p>
        </div>

        {/* Commodity Selector Dropdown */}
        <div className="relative">
          <select
            value={selectedCommodityId}
            onChange={(e) => setSelectedCommodityId(Number(e.target.value))}
            className="appearance-none bg-surface-subtle border border-border-subtle text-text-primary text-sm font-semibold pl-3 pr-9 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {COMMODITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.unit})
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-sm">
            expand_more
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface-canvas p-3 rounded-lg border border-border-subtle">
          <span className="text-[11px] font-label-caps uppercase text-text-muted block">
            Harga Hari Ini
          </span>
          <span className="font-metric-display text-lg text-text-primary">
            {formatRupiah(commodity.averagePrice)}
          </span>
        </div>
        <div className="bg-surface-canvas p-3 rounded-lg border border-border-subtle">
          <span className="text-[11px] font-label-caps uppercase text-text-muted block">
            Perubahan 24 Jam
          </span>
          <span
            className={`font-metric-display text-lg ${
              commodity.deltaPercent > 0
                ? "text-status-critical"
                : commodity.deltaPercent < 0
                ? "text-status-normal"
                : "text-text-secondary"
            }`}
          >
            {commodity.deltaPercent > 0 ? `+${commodity.deltaPercent}%` : `${commodity.deltaPercent}%`}
          </span>
        </div>
        <div className="bg-surface-canvas p-3 rounded-lg border border-border-subtle">
          <span className="text-[11px] font-label-caps uppercase text-text-muted block">
            Harga Terendah (H-7)
          </span>
          <span className="font-metric-display text-lg text-status-normal">
            {formatRupiah(min)}
          </span>
        </div>
        <div className="bg-surface-canvas p-3 rounded-lg border border-border-subtle">
          <span className="text-[11px] font-label-caps uppercase text-text-muted block">
            Harga Tertinggi (H-7)
          </span>
          <span className="font-metric-display text-lg text-status-critical">
            {formatRupiah(max)}
          </span>
        </div>
      </div>

      {/* Interactive SVG Bar/Line Chart */}
      <div className="h-64 w-full relative pt-6 pb-2">
        <div className="flex items-end justify-between h-48 gap-2 sm:gap-4 border-b border-border-subtle px-2">
          {commodity.sparkline.map((price, idx) => {
            const heightPercent = Math.max(15, Math.round(((price - min) / range) * 80 + 15));
            const isToday = idx === commodity.sparkline.length - 1;
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-text-primary text-white text-[11px] px-2 py-1 rounded font-mono shadow-md pointer-events-none whitespace-nowrap z-20">
                  {formatRupiah(price)}
                </div>

                {/* Bar element */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 relative ${
                    isToday
                      ? "bg-primary shadow-sm ring-2 ring-primary-fixed"
                      : "bg-surface-variant hover:bg-primary-fixed"
                  }`}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-text-secondary font-semibold hidden sm:block">
                    {Math.round(price / 1000)}k
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between px-2 pt-2 text-xs font-label-caps text-text-muted">
          {dates.map((d, i) => (
            <span
              key={i}
              className={i === dates.length - 1 ? "font-bold text-primary" : ""}
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
