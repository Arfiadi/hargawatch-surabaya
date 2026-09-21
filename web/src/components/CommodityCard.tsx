"use client";

import { Commodity, MARKETS } from "@/data/mockData";
import EarlyWarningBadge from "./EarlyWarningBadge";
import Sparkline from "./Sparkline";

interface Props {
  commodity: Commodity;
  onAddToBasket?: (commodity: Commodity) => void;
  isInBasket?: boolean;
}

export default function CommodityCard({
  commodity,
  onAddToBasket,
  isInBasket = false,
}: Props) {
  const cheapestMarket = MARKETS.find((m) => m.id === commodity.cheapestMarketId);
  const highestMarket = MARKETS.find((m) => m.id === commodity.highestMarketId);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const isUp = commodity.deltaPercent > 0;
  const isZero = commodity.deltaPercent === 0;

  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-all duration-200 hover:shadow-md flex flex-col justify-between relative overflow-hidden ${
        commodity.warningStatus === "TINGGI"
          ? "border-l-4 border-l-status-critical border-border-subtle"
          : commodity.warningStatus === "WASPADA"
          ? "border-l-4 border-l-status-warning border-border-subtle"
          : "border-border-subtle"
      }`}
    >
      <div>
        {/* Header: Title & Warning Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-headline-sm font-bold text-text-primary">
              {commodity.name}
            </h3>
            <span className="font-label-caps text-xs text-text-muted">
              Satuan per {commodity.unit}
            </span>
          </div>
          <EarlyWarningBadge status={commodity.warningStatus} size="sm" />
        </div>

        {/* Price & Delta Metric */}
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <div>
            <span className="font-metric-display text-2xl lg:text-3xl text-text-primary tracking-tight">
              {formatRupiah(commodity.averagePrice)}
            </span>
            <span className="text-xs text-text-muted font-body-sm block mt-0.5">
              Rata-rata Kota
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-md font-label-caps text-xs font-bold ${
              isZero
                ? "bg-surface-subtle text-text-secondary"
                : isUp
                ? "bg-status-critical-bg text-status-critical"
                : "bg-status-normal-bg text-status-normal"
            }`}
          >
            <span className="material-symbols-outlined text-xs">
              {isZero ? "remove" : isUp ? "trending_up" : "trending_down"}
            </span>
            {isUp ? `+${commodity.deltaPercent}%` : `${commodity.deltaPercent}%`}
          </div>
        </div>

        {/* Sparkline Visual */}
        <div className="py-2 mb-4 bg-surface-canvas/50 rounded-lg p-2 border border-border-subtle/50">
          <div className="flex justify-between items-center text-[10px] text-text-muted font-label-caps mb-1">
            <span>Tren 7 Hari Terakhir</span>
            <span>H-7 &rarr; Hari Ini</span>
          </div>
          <Sparkline
            data={commodity.sparkline}
            status={commodity.warningStatus}
            height={36}
          />
        </div>

        {/* Market Disparity Comparison Strip */}
        <div className="space-y-1.5 text-xs border-t border-border-subtle pt-3 mb-4">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-normal"></span>
              Paling Hemat:
            </span>
            <span className="font-semibold text-text-primary font-label-caps">
              {formatRupiah(commodity.cheapestPrice)}{" "}
              <span className="font-normal text-text-muted font-body-sm">
                ({cheapestMarket?.name})
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-warning"></span>
              Tertinggi:
            </span>
            <span className="font-semibold text-text-muted font-label-caps">
              {formatRupiah(commodity.highestPrice)}{" "}
              <span className="font-normal text-text-muted font-body-sm">
                ({highestMarket?.name})
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Button: Smart Basket */}
      <button
        onClick={() => onAddToBasket && onAddToBasket(commodity)}
        className={`w-full py-2.5 px-4 rounded-lg font-title-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
          isInBasket
            ? "bg-status-normal text-white hover:bg-status-normal/90"
            : "bg-primary-container text-white hover:bg-primary"
        }`}
      >
        <span className="material-symbols-outlined text-sm">
          {isInBasket ? "check" : "shopping_cart"}
        </span>
        {isInBasket ? "Tersimpan di Keranjang" : "+ Tambah ke Keranjang"}
      </button>
    </div>
  );
}
