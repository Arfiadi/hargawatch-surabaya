"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MapMarketItem } from "@/components/SurabayaMap";
import CommoditySearchSelect from "@/components/CommoditySearchSelect";
import {
  getLiveMarketComparisonForCommodity,
  ALL_CATALOG_COMMODITIES,
  formatCommodityName,
} from "@/lib/dataService";

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
    role: "Pasar Induk Grosir Malam",
    price: 50000,
    latitude: -7.2753,
    longitude: 112.7441,
    address: "Jl. Keputran No. 45, Tegalsari",
    characteristic: "Pusat pasokan sayur & bumbu yang langsung menerima pasokan dari sentra pertanian (Kediri, Malang). Menjadi patokan harga grosir terendah.",
  },
  {
    id: "2",
    pasar_id: 2,
    name: "Pasar Wonokromo",
    shortName: "Wonokromo",
    zone: "Selatan",
    role: "Sentra Ritel Surabaya Selatan",
    price: 55000,
    latitude: -7.3005,
    longitude: 112.7388,
    address: "Jl. Wonokromo (Depan Stasiun)",
    characteristic: "Pasar ritel dan semi-grosir dengan volume protein hewani (daging sapi, ayam, telur) yang besar dan harga bersaing.",
  },
  {
    id: "3",
    pasar_id: 3,
    name: "Pasar Genteng",
    shortName: "Genteng",
    zone: "Pusat",
    role: "Pasar Ritel Pusat Kota",
    price: 50000,
    latitude: -7.2575,
    longitude: 112.7431,
    address: "Jl. Genteng Besar, Genteng",
    characteristic: "Pasar ritel sentral komersial dengan segmen konsumen menengah-atas di pusat kota Surabaya. Sering mencatat selisih harga eceran tertinggi.",
  },
  {
    id: "4",
    pasar_id: 4,
    name: "Pasar Pucang Anom",
    shortName: "Pucang Anom",
    zone: "Timur",
    role: "Ritel Permukiman Timur",
    price: 55000,
    latitude: -7.2831,
    longitude: 112.7554,
    address: "Jl. Pucang Anom, Gubeng",
    characteristic: "Pasar bahan pokok segar yang melayani kawasan perumahan Surabaya Timur dan Tengah dengan rantai distribusi harian.",
  },
  {
    id: "1",
    pasar_id: 1,
    name: "Pasar Tambahrejo",
    shortName: "Tambahrejo",
    zone: "Utara",
    role: "Pasar Semi-Grosir Utara",
    price: 55000,
    latitude: -7.2472,
    longitude: 112.7631,
    address: "Jl. Kapas Krampung, Simokerto",
    characteristic: "Pasar semi-grosir efisien untuk komoditas kering (beras, minyak goreng, gula) di wilayah Surabaya Utara.",
  },
  {
    id: "146",
    pasar_id: 146,
    name: "Pasar Soponyono",
    shortName: "Soponyono",
    zone: "Timur",
    role: "Sentra Konsumsi Rungkut",
    price: 67000,
    latitude: -7.3228,
    longitude: 112.7744,
    address: "Jl. Rungkut Asri, Rungkut",
    characteristic: "Pasar ritel utama bagi sentra industri dan perumahan padat Rungkut & Tenggilis, dipengaruhi biaya angkut dari pusat kota.",
  },
];

export default function LandingMapPreview() {
  const [selectedCommodityId, setSelectedCommodityId] = useState<number>(50);
  const [markets, setMarkets] = useState<MapMarketItem[]>(DEMO_MARKETS);
  const [selectedMarketId, setSelectedMarketId] = useState<string>("5");

  const selectedCommodity =
    ALL_CATALOG_COMMODITIES.find((c) => c.id === selectedCommodityId) ||
    ALL_CATALOG_COMMODITIES[0];

  useEffect(() => {
    let isMounted = true;
    getLiveMarketComparisonForCommodity(selectedCommodityId).then((row) => {
      if (!isMounted || !row) return;

      const priceMap: Record<number, number> = {
        5: row.keputran,
        2: row.wonokromo,
        3: row.genteng,
        4: row.pucang,
        1: row.tambahrejo,
        146: row.soponyono,
      };

      setMarkets((prev) =>
        prev.map((m) => {
          const livePrice = priceMap[m.pasar_id];
          if (livePrice && livePrice > 0) {
            return { ...m, price: livePrice };
          }
          return m;
        })
      );
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCommodityId]);

  const activeMarket = markets.find((m) => m.id === selectedMarketId) || markets[0];
  const prices = markets.map((market) => market.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const cityAvg = Math.round(prices.reduce((total, price) => total + price, 0) / prices.length);
  const commodityDisplayName = formatCommodityName(selectedCommodity.name);

  return (
    <div className="w-full bg-surface-card rounded-2xl p-3 sm:p-4 shadow-sm border border-border-subtle">
      {/* Header bar: Commodity selector dropdown on the left + Action link on the right */}
      <div className="relative z-30 flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-border-subtle/70">
        <div className="min-w-0 flex-1 sm:max-w-xs md:max-w-sm">
          <CommoditySearchSelect
            options={ALL_CATALOG_COMMODITIES}
            valueId={selectedCommodityId}
            onChange={setSelectedCommodityId}
            searchPlaceholder="Cari dari 37 komoditas Surabaya..."
            emptyNoun="komoditas"
            className="w-full"
            panelClassName="w-[calc(100vw-2.5rem)] max-w-sm sm:w-96"
          />
        </div>

        <div className="shrink-0">
          <Link
            href="/peta"
            className="h-11 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-xs transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <span>Lihat Semua Pasar</span>
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Grid: Real Map Viewport + Real Market Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* Real Leaflet Map */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[360px] sm:min-h-[380px]">
          <SurabayaMap
            className="relative w-full h-full min-h-[360px] sm:min-h-[380px] overflow-hidden select-none bg-surface-subtle rounded-xl border border-border-subtle/80 shadow-2xs"
            markets={markets}
            selectedCommodityName={commodityDisplayName}
            unit={selectedCommodity.unit}
            selectedMarketId={selectedMarketId}
            onSelectMarket={setSelectedMarketId}
            selectedZone="Semua"
            minPrice={minPrice}
            maxPrice={maxPrice}
            cityAvg={cityAvg}
          />
        </div>

        {/* Real Market Inspector Panel matching /peta */}
        <div className="lg:col-span-4 bg-surface-card rounded-xl p-3 sm:p-4 border border-border-subtle shadow-xs flex flex-col justify-between h-full">
          <div>
            {/* Header: Market Name + Address + Status Badge */}
            <div className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-border-subtle gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base sm:text-lg shrink-0">
                    storefront
                  </span>
                  <h3 className="font-headline-sm text-sm sm:text-base font-bold text-text-primary truncate">
                    {activeMarket.name}
                  </h3>
                </div>
                <span
                  className="text-[11px] sm:text-xs text-text-secondary mt-0.5 block whitespace-nowrap truncate"
                  title={`${activeMarket.address} • Surabaya ${activeMarket.zone}`}
                >
                  {activeMarket.address} &bull; Surabaya {activeMarket.zone}
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-xs font-bold whitespace-nowrap shrink-0 ${
                  activeMarket.price === minPrice
                    ? "bg-status-normal-bg text-status-normal border border-emerald-200"
                    : activeMarket.price === maxPrice
                    ? "bg-status-critical-bg text-status-critical border border-rose-200"
                    : "bg-surface-subtle text-text-secondary border border-border-subtle"
                }`}
              >
                {activeMarket.price === minPrice
                  ? "Termurah"
                  : activeMarket.price === maxPrice
                  ? "Tertinggi"
                  : "Rata-rata"}
              </span>
            </div>

            {/* Price block */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-surface-subtle flex flex-col gap-0.5 mb-2 border border-border-subtle/50">
              <span className="text-[11px] sm:text-xs text-text-secondary">
                Harga {commodityDisplayName}:
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-metric-value text-base sm:text-lg text-text-primary font-bold">
                  Rp {activeMarket.price.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-text-muted">
                  /{selectedCommodity.unit}
                </span>
              </div>
            </div>

            {/* 2-Column Submetrics: Rerata Kota & Selisih vs Termurah */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
              <div className="p-2 rounded-lg bg-surface-subtle flex flex-col border border-border-subtle/50">
                <span className="text-text-muted text-[10.5px] sm:text-[11px]">Rerata Kota:</span>
                <strong className="text-text-primary mt-0.5 text-xs sm:text-[13px]">
                  Rp {cityAvg.toLocaleString("id-ID")}
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-surface-subtle flex flex-col border border-border-subtle/50">
                <span className="text-text-muted text-[10.5px] sm:text-[11px]">Selisih vs Termurah:</span>
                <strong
                  className={`mt-0.5 text-xs sm:text-[13px] ${
                    activeMarket.price === minPrice
                      ? "text-status-normal font-bold"
                      : "text-status-critical font-bold"
                  }`}
                >
                  {activeMarket.price === minPrice
                    ? "Acuan Termurah"
                    : `+Rp ${(activeMarket.price - minPrice).toLocaleString("id-ID")}`}
                </strong>
              </div>
            </div>

            {/* Role & Characteristics */}
            <div className="bg-surface-subtle p-2 sm:p-2.5 rounded-lg mb-2.5 border border-border-subtle/50">
              <div className="flex items-center gap-1.5 text-primary text-xs font-semibold mb-1">
                <span className="material-symbols-outlined text-[15px]">info</span>
                <span>Peran Distribusi &amp; Karakter Pasar:</span>
              </div>
              <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed">
                {activeMarket.characteristic}
              </p>
            </div>
          </div>

          {/* Quick Market Selector (3 Columns) */}
          <div className="mt-auto pt-1">
            <span className="text-[10px] sm:text-[11px] text-text-muted block mb-1.5 font-bold uppercase tracking-wider">
              PILIH PASAR LAIN:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {markets.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMarketId(m.id)}
                  className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all text-center truncate cursor-pointer ${
                    selectedMarketId === m.id
                      ? "bg-primary text-white font-bold shadow-xs"
                      : "bg-surface-subtle text-text-secondary hover:text-text-primary hover:bg-slate-200/60 border border-border-subtle/40"
                  }`}
                >
                  {m.shortName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
