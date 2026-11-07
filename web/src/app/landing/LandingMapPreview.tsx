"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MapMarketItem } from "@/components/SurabayaMap";

// Real Leaflet Map dynamically imported
const SurabayaMap = dynamic(() => import("@/components/SurabayaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[360px] sm:min-h-[380px] bg-surface-subtle rounded-xl flex items-center justify-center text-text-muted text-xs animate-pulse">
      Memuat Peta Spasial Surabaya...
    </div>
  ),
});

const DEMO_MARKETS: MapMarketItem[] = [
  {
    id: "5",
    pasar_id: 5,
    name: "Pasar Keputran",
    shortName: "Keputran",
    zone: "Pusat",
    role: "Pasar Induk Grosir",
    price: 68000,
    latitude: -7.279,
    longitude: 112.744,
    address: "Jl. Keputran No. 1, Tegalsari",
    characteristic: "Sentra pasokan grosir malam hari dari Malang, Blitar, Kediri",
  },
  {
    id: "2",
    pasar_id: 2,
    name: "Pasar Wonokromo",
    shortName: "Wonokromo",
    zone: "Selatan",
    role: "Pasar Tradisional Strategis",
    price: 70000,
    latitude: -7.299,
    longitude: 112.738,
    address: "Jl. Stasiun Wonokromo, Jagir",
    characteristic: "Hub logistik transit selatan dan stasiun kereta komoditas",
  },
  {
    id: "3",
    pasar_id: 3,
    name: "Pasar Genteng",
    shortName: "Genteng",
    zone: "Pusat",
    role: "Pasar Konsumen & Kuliner",
    price: 74000,
    latitude: -7.258,
    longitude: 112.742,
    address: "Jl. Genteng Besar, Genteng",
    characteristic: "Pusat oleh-oleh dan pasar ritel kebutuhan kuliner premium",
  },
  {
    id: "4",
    pasar_id: 4,
    name: "Pasar Pucang Anom",
    shortName: "Pucang Anom",
    zone: "Timur",
    role: "Pasar Konsumen Menengah",
    price: 72000,
    latitude: -7.283,
    longitude: 112.757,
    address: "Jl. Pucang Anom, Gubeng",
    characteristic: "Pasar permukiman padat segmen konsumen rumah tangga",
  },
  {
    id: "1",
    pasar_id: 1,
    name: "Pasar Tambahrejo",
    shortName: "Tambahrejo",
    zone: "Utara",
    role: "Pasar Lingkungan Padat",
    price: 71000,
    latitude: -7.246,
    longitude: 112.760,
    address: "Jl. Kapas Krampung, Simokerto",
    characteristic: "Pusat belanja ritel padat koridor Surabaya Utara & Timur",
  },
  {
    id: "146",
    pasar_id: 146,
    name: "Pasar Soponyono",
    shortName: "Soponyono",
    zone: "Timur",
    role: "Pasar Lingkungan Rungkut",
    price: 76000,
    latitude: -7.324,
    longitude: 112.771,
    address: "Jl. Rungkut Asri, Rungkut",
    characteristic: "Pasar satelit permukiman modern kawasan Surabaya Timur",
  },
];

export default function LandingMapPreview() {
  const [selectedMarketId, setSelectedMarketId] = useState<string>("5");
  const activeMarket = DEMO_MARKETS.find((m) => m.id === selectedMarketId) || DEMO_MARKETS[0];
  const prices = DEMO_MARKETS.map((market) => market.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const cityAvg = Math.round(prices.reduce((total, price) => total + price, 0) / prices.length);

  return (
    <div className="w-full bg-surface-card rounded-2xl p-3 sm:p-4 shadow-sm border border-border-subtle">
      {/* Header bar matching peta/page.tsx */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-border-subtle/70">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-title-md">map</span>
          <div>
            <span className="font-headline-sm text-sm sm:text-base text-text-primary font-bold">
              Contoh perbandingan harga cabai
            </span>
            <span className="block text-[11px] text-text-muted">
              Ilustrasi enam pasar Surabaya · rupiah per kilogram
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Selisih pada contoh ini: Rp {(maxPrice - minPrice).toLocaleString("id-ID")} antarpasar
          </span>
          <Link
            href="/peta"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
          >
            <span>Lihat semua pasar</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Grid: Real Map Viewport + Real Market Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* Real Leaflet Map */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[360px] sm:min-h-[380px]">
          <SurabayaMap
            className="relative w-full h-full min-h-[360px] sm:min-h-[380px] overflow-hidden select-none bg-surface-subtle rounded-xl border border-border-subtle/80 shadow-2xs"
            markets={DEMO_MARKETS}
            selectedCommodityName="Cabai Rawit Merah"
            unit="kg"
            selectedMarketId={selectedMarketId}
            onSelectMarket={setSelectedMarketId}
            selectedZone="Semua"
            minPrice={minPrice}
            maxPrice={maxPrice}
            cityAvg={cityAvg}
          />
        </div>

        {/* Real Market Inspector Panel */}
        <div className="lg:col-span-4 bg-surface-canvas rounded-xl p-3 sm:p-3.5 border border-border-subtle/80 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border-subtle">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted block">
                  Pasar yang dipilih · {activeMarket.zone} Surabaya
                </span>
                <span className="font-headline-sm text-sm font-bold text-text-primary">
                  {activeMarket.name}
                </span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Dipilih
              </span>
            </div>

            {/* Price block */}
            <div className="bg-surface-card p-2 rounded-lg border border-border-subtle/60 mb-2">
              <span className="text-[10px] text-text-muted font-medium block">
                Harga cabai rawit
              </span>
              <div className="flex items-baseline gap-1 my-0.2">
                <span className="font-metric-display text-base sm:text-lg font-bold text-text-primary font-mono">
                  Rp {activeMarket.price.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-text-muted">/kg</span>
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  activeMarket.price < cityAvg
                    ? "text-status-normal"
                    : activeMarket.price > cityAvg
                    ? "text-status-warning"
                    : "text-text-muted"
                }`}
              >
                {activeMarket.price < cityAvg
                  ? `Rp ${(cityAvg - activeMarket.price).toLocaleString("id-ID")} di bawah rata-rata enam pasar`
                  : activeMarket.price > cityAvg
                  ? `Rp ${(activeMarket.price - cityAvg).toLocaleString("id-ID")} di atas rata-rata enam pasar`
                  : "Sama dengan rata-rata enam pasar"}
              </span>
            </div>

            {/* Market ranking list */}
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                Harga cabai per pasar
              </span>
              <div className="space-y-0.5">
                {DEMO_MARKETS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMarketId(m.id)}
                    type="button"
                    aria-pressed={m.id === selectedMarketId}
                    className={`w-full min-h-11 flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors text-left ${
                      m.id === selectedMarketId
                        ? "bg-primary text-on-primary font-bold shadow-xs"
                        : "hover:bg-surface-subtle text-text-primary"
                    }`}
                  >
                    <span className="truncate">{m.name}</span>
                    <span className="font-mono text-[10px] shrink-0 ml-1">
                      Rp {(m.price / 1000).toFixed(0)}.000
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
