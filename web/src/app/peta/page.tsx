"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CommoditySearchSelect from "@/components/CommoditySearchSelect";
import {
  getLiveMarketComparison,
  getLiveMarketComparisonForCommodity,
  getLiveMarketLocations,
  ALL_CATALOG_COMMODITIES,
  MarketComparisonRow,
} from "@/lib/dataService";

const SurabayaMap = dynamic(() => import("@/components/SurabayaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[580px] bg-surface-subtle rounded-xl border border-border-subtle relative overflow-hidden animate-pulse flex flex-col justify-between p-6 select-none">
      <div className="flex items-center justify-between">
        <div className="h-5 w-48 bg-surface-card rounded" />
        <div className="h-8 w-32 bg-surface-card rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-8 opacity-40">
        <div className="h-24 bg-surface-card rounded-xl" />
        <div className="h-32 bg-surface-card rounded-xl mt-6" />
        <div className="h-20 bg-surface-card rounded-xl" />
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <div className="h-4 w-40 bg-surface-card rounded" />
        <div className="h-4 w-28 bg-surface-card rounded" />
      </div>
    </div>
  ),
});

interface ComparisonRowItem {
  komoditas_id: number;
  komoditas: string;
  group: string;
  sub: string;
  satuan: string;
  keputran: number;
  wonokromo: number;
  pucang: number;
  genteng: number;
  tambahrejo: number;
  soponyono: number;
  rerata: number;
  disparitasRp: number;
  disparitasPct: number;
  statusClass: string;
  statusBadge: string;
  badgeClass: string;
  dotClass: string;
}

const ORDERED_GROUPS = [
  "Semua",
  "Cabai & Bumbu",
  "Beras & Gandum",
  "Minyak & Gula",
  "Daging & Telur",
  "Ikan Segar",
  "Sayur Mayur",
  "Palawija & Lainnya",
];

const catalogGroupOf = (komoditasId: number): string =>
  ALL_CATALOG_COMMODITIES.find((c) => c.id === komoditasId)?.group ||
  "Palawija & Lainnya";

function mapApiRow(d: MarketComparisonRow): ComparisonRowItem {
  const isHigh = d.disparitasPct >= 15;
  const isMed = d.disparitasPct >= 8 && d.disparitasPct < 15;
  const rawSatuan = d.satuan || "kg";
  const formattedSatuan = rawSatuan.match(/^\d/) ? rawSatuan : `1 ${rawSatuan}`;
  return {
    komoditas_id: d.komoditas_id,
    komoditas: d.komoditas,
    group: catalogGroupOf(d.komoditas_id),
    sub: "Pantauan Harian 6 Pasar",
    satuan: formattedSatuan,
    keputran: d.keputran,
    wonokromo: d.wonokromo,
    pucang: d.pucang,
    genteng: d.genteng,
    tambahrejo: d.tambahrejo,
    soponyono: d.soponyono,
    rerata: d.rerata,
    disparitasRp: d.disparitasRp,
    disparitasPct: d.disparitasPct,
    statusClass: isHigh ? "text-status-critical" : isMed ? "text-status-warning" : "text-status-normal",
    statusBadge: `${d.disparitasPct}% (${isHigh ? "Tinggi" : isMed ? "Sedang" : "Wajar"})`,
    badgeClass: isHigh
      ? "bg-status-critical-bg text-status-critical"
      : isMed
      ? "bg-status-warning-bg text-status-warning"
      : "bg-status-normal-bg text-status-normal",
    dotClass: isHigh ? "bg-status-critical" : isMed ? "bg-status-warning" : "bg-status-normal",
  };
}

export default function SpatialMapPage() {
  const [selectedCommodityId, setSelectedCommodityId] = useState<number>(50);
  const [selectedZone, setSelectedZone] = useState<string>("Semua");
  const [selectedMarketId, setSelectedMarketId] = useState<string>("genteng");
  const [comparisonRows, setComparisonRows] = useState<ComparisonRowItem[]>([]);
  const [loadingTable, setLoadingTable] = useState<boolean>(true);
  const [errorTable, setErrorTable] = useState<boolean>(false);
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [isSortedDesc, setIsSortedDesc] = useState<boolean>(true);
  const [tableSearchQuery, setTableSearchQuery] = useState<string>("");
  const [tableGroupFilter, setTableGroupFilter] = useState<string>("Semua");
  const [marketCoords, setMarketCoords] = useState<Record<number, { lat: number; lng: number }>>({
    1: { lat: -7.2472, lng: 112.7631 }, // Tambahrejo
    2: { lat: -7.3005, lng: 112.7388 }, // Wonokromo
    3: { lat: -7.2575, lng: 112.7431 }, // Genteng
    4: { lat: -7.2831, lng: 112.7554 }, // Pucang Anom
    5: { lat: -7.2753, lng: 112.7441 }, // Keputran
    146: { lat: -7.3228, lng: 112.7744 }, // Soponyono
  });

  // Fetch coordinates directly from dim_pasar in Supabase
  useEffect(() => {
    getLiveMarketLocations().then((locs) => {
      if (locs && locs.length > 0) {
        const coordsMap: Record<number, { lat: number; lng: number }> = {};
        for (const l of locs) {
          if (l.latitude && l.longitude) {
            coordsMap[l.pasar_id] = { lat: l.latitude, lng: l.longitude };
          }
        }
        setMarketCoords((prev) => ({ ...prev, ...coordsMap }));
      }
    });
  }, []);

  const loadTableData = () => {
    setLoadingTable(true);
    setErrorTable(false);
    getLiveMarketComparison()
      .then((data) => {
        if (data && data.length > 0) {
          if (data[0]?.tanggal) {
            setLatestDate(data[0].tanggal);
          }
          setComparisonRows(data.map(mapApiRow));
          setErrorTable(false);
        } else {
          setErrorTable(true);
        }
      })
      .catch(() => setErrorTable(true))
      .finally(() => setLoadingTable(false));
  };

  useEffect(() => {
    loadTableData();
  }, []);

  // Ganti komoditas dari search dropdown: tarik baris riil komoditas tsb,
  // lalu sinkronkan baris aktif di tabel + peta tanpa menimpa seluruh matriks.
  useEffect(() => {
    let isMounted = true;
    getLiveMarketComparisonForCommodity(selectedCommodityId).then((row) => {
      if (!isMounted || !row) return;
      if (row.tanggal) setLatestDate(row.tanggal);
      const mapped = mapApiRow(row);
      setComparisonRows((prev) => {
        const idx = prev.findIndex((r) => r.komoditas_id === row.komoditas_id);
        // Komoditas baru (belum ada di matriks 8 baris) -> taruh di baris teratas
        if (idx === -1) return [mapped, ...prev];
        const next = [...prev];
        next[idx] = { ...mapped, sub: prev[idx].sub };
        return next;
      });
    });
    return () => {
      isMounted = false;
    };
  }, [selectedCommodityId]);

  const zones = ["Semua", "Pusat", "Selatan", "Timur", "Utara"];

  // Baris komoditas aktif mengikuti pilihan di search dropdown
  const activeCommodity = useMemo(() => {
    if (comparisonRows.length === 0) return null;
    return (
      comparisonRows.find((r) => r.komoditas_id === selectedCommodityId) ||
      comparisonRows[0] ||
      null
    );
  }, [comparisonRows, selectedCommodityId]);

  // Dynamic Market Pin Setup with live Supabase GPS coordinates
  const markets = useMemo(() => [
    {
      id: "keputran",
      pasar_id: 5,
      name: "Pasar Keputran",
      shortName: "Keputran",
      zone: "Pusat",
      role: "Pasar Induk Grosir Malam",
      price: activeCommodity?.keputran || 0,
      latitude: marketCoords[5]?.lat || -7.2753,
      longitude: marketCoords[5]?.lng || 112.7441,
      address: "Jl. Keputran No. 45, Tegalsari",
      characteristic: "Pusat pasokan sayur & bumbu yang langsung menerima pasokan dari sentra pertanian (Kediri, Malang). Menjadi patokan harga grosir terendah.",
    },
    {
      id: "genteng",
      pasar_id: 3,
      name: "Pasar Genteng",
      shortName: "Genteng",
      zone: "Pusat",
      role: "Pasar Ritel Pusat Kota",
      price: activeCommodity?.genteng || 0,
      latitude: marketCoords[3]?.lat || -7.2575,
      longitude: marketCoords[3]?.lng || 112.7431,
      address: "Jl. Genteng Besar, Genteng",
      characteristic: "Pasar ritel sentral komersial dengan segmen konsumen menengah-atas di pusat kota Surabaya. Sering mencatat selisih harga eceran tertinggi.",
    },
    {
      id: "wonokromo",
      pasar_id: 2,
      name: "Pasar Wonokromo",
      shortName: "Wonokromo",
      zone: "Selatan",
      role: "Sentra Ritel Surabaya Selatan",
      price: activeCommodity?.wonokromo || 0,
      latitude: marketCoords[2]?.lat || -7.3005,
      longitude: marketCoords[2]?.lng || 112.7388,
      address: "Jl. Wonokromo (Depan Stasiun)",
      characteristic: "Pasar ritel dan semi-grosir dengan volume protein hewani (daging sapi, ayam, telur) yang besar dan harga bersaing.",
    },
    {
      id: "pucang",
      pasar_id: 4,
      name: "Pasar Pucang Anom",
      shortName: "Pucang Anom",
      zone: "Timur",
      role: "Ritel Permukiman Timur",
      price: activeCommodity?.pucang || 0,
      latitude: marketCoords[4]?.lat || -7.2831,
      longitude: marketCoords[4]?.lng || 112.7554,
      address: "Jl. Pucang Anom, Gubeng",
      characteristic: "Pasar bahan pokok segar yang melayani kawasan perumahan Surabaya Timur dan Tengah dengan rantai distribusi harian.",
    },
    {
      id: "tambahrejo",
      pasar_id: 1,
      name: "Pasar Tambahrejo",
      shortName: "Tambahrejo",
      zone: "Utara",
      role: "Pasar Semi-Grosir Utara",
      price: activeCommodity?.tambahrejo || 0,
      latitude: marketCoords[1]?.lat || -7.2472,
      longitude: marketCoords[1]?.lng || 112.7631,
      address: "Jl. Kapas Krampung, Simokerto",
      characteristic: "Pasar semi-grosir efisien untuk komoditas kering (beras, minyak goreng, gula) di wilayah Surabaya Utara.",
    },
    {
      id: "soponyono",
      pasar_id: 146,
      name: "Pasar Soponyono",
      shortName: "Soponyono",
      zone: "Timur",
      role: "Sentra Konsumsi Rungkut",
      price: activeCommodity?.soponyono || 0,
      latitude: marketCoords[146]?.lat || -7.3228,
      longitude: marketCoords[146]?.lng || 112.7744,
      address: "Jl. Rungkut Asri, Rungkut",
      characteristic: "Pasar ritel utama bagi sentra industri dan perumahan padat Rungkut & Tenggilis, dipengaruhi biaya angkut dari pusat kota.",
    },
  ], [activeCommodity, marketCoords]);

  const validPrices = useMemo(() => markets.map((m) => m.price).filter((p) => p > 0), [markets]);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
  const minMarket = markets.find((m) => m.price === minPrice) || markets[0];
  const maxMarket = markets.find((m) => m.price === maxPrice) || markets[1];
  const selectedMarket = markets.find((m) => m.id === selectedMarketId) || markets[1];

  // Dynamic Disparity Sorting
  const handleSortDisparitas = () => {
    const nextDesc = !isSortedDesc;
    setIsSortedDesc(nextDesc);
    setComparisonRows((prev) =>
      [...prev].sort((a, b) =>
        nextDesc ? b.disparitasPct - a.disparitasPct : a.disparitasPct - b.disparitasPct
      )
    );
  };

  const filteredTableRows = comparisonRows.filter((r) => {
    const matchesGroup = tableGroupFilter === "Semua" || r.group === tableGroupFilter;
    if (!matchesGroup) return false;
    if (!tableSearchQuery.trim()) return true;
    const q = tableSearchQuery.trim().toLowerCase();
    return r.komoditas.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q);
  });

  const handleExportCSV = () => {
    const csvContent =
      "Komoditas Pokok,Satuan,Keputran (Induk),Wonokromo,Pucang Anom,Genteng,Tambahrejo,Soponyono,Rerata Kota,Disparitas Rp,Disparitas %\n" +
      filteredTableRows
        .map(
          (r) =>
            `"${r.komoditas}","${r.satuan}","Rp ${r.keputran.toLocaleString("id-ID")}","Rp ${r.wonokromo.toLocaleString("id-ID")}","Rp ${r.pucang.toLocaleString("id-ID")}","Rp ${r.genteng.toLocaleString("id-ID")}","Rp ${r.tambahrejo.toLocaleString("id-ID")}","Rp ${r.soponyono.toLocaleString("id-ID")}","Rp ${r.rerata.toLocaleString("id-ID")}","Rp ${r.disparitasRp.toLocaleString("id-ID")}","${r.disparitasPct}%"`
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `matriks_disparitas_pasar_surabaya_${activeCommodity?.komoditas ? activeCommodity.komoditas.toLowerCase().replace(/\s+/g, "_") : "pantauan"}.csv`);
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
            {/* Header Context & Dynamic Quick Metrics Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                  Peta Disparitas Harga Antar-Pasar
                </h1>
                <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                  Pantauan spasial 6 pasar Kota Surabaya untuk analisis perbandingan harga bahan pokok antara pasar induk grosir dan pasar ritel permukiman.
                </p>
              </div>

              {/* Dynamic Quick Telemetry Card */}
              {loadingTable || !activeCommodity ? (
                <div className="flex items-center gap-space-sm bg-surface-card p-space-sm rounded-xl shadow-sm border border-border-subtle/70 animate-pulse">
                  <div className="flex flex-col pr-space-sm space-y-1.5">
                    <div className="w-24 h-3 bg-surface-subtle rounded"></div>
                    <div className="w-16 h-6 bg-surface-subtle rounded"></div>
                  </div>
                  <div className="w-px h-8 bg-border-subtle"></div>
                  <div className="flex flex-col pl-space-xs space-y-1.5">
                    <div className="w-32 h-3 bg-surface-subtle rounded"></div>
                    <div className="w-28 h-5 bg-surface-subtle rounded"></div>
                    <div className="w-20 h-3 bg-surface-subtle rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-space-sm bg-surface-card p-space-sm rounded-xl shadow-sm border border-border-subtle/70">
                  <div className="flex flex-col pr-space-sm">
                    <span className="font-label-caps text-label-caps text-text-muted uppercase">
                      Disparitas {activeCommodity.komoditas}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`font-metric-display text-metric-display ${
                          activeCommodity.disparitasPct >= 15
                            ? "text-status-critical"
                            : activeCommodity.disparitasPct >= 8
                            ? "text-status-warning"
                            : "text-status-normal"
                        }`}
                      >
                        {activeCommodity.disparitasPct}%
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps ${activeCommodity.badgeClass}`}
                      >
                        {activeCommodity.disparitasPct >= 15 ? "Tinggi" : activeCommodity.disparitasPct >= 8 ? "Waspada" : "Wajar"}
                      </span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-border-subtle"></div>
                  <div className="flex flex-col pl-space-xs">
                    <span className="font-label-caps text-label-caps text-text-muted uppercase">
                      Selisih Ekstrem (Max - Min)
                    </span>
                    <span className="font-metric-value text-metric-value text-text-primary font-bold">
                      Rp {activeCommodity.disparitasRp.toLocaleString("id-ID")}
                    </span>
                    <span className="font-body-sm text-body-sm text-text-secondary">
                      {maxMarket.shortName} vs {minMarket.shortName}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 1. Spatial Control & Analytical Filter Bar */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm mb-space-lg border border-border-subtle/70">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
                {/* Commodity Search Select */}
                <div className="md:col-span-5 flex flex-col gap-1.5">
                  <label
                    className="font-label-caps text-label-caps text-text-secondary uppercase flex items-center gap-1"
                    htmlFor="commodity-select"
                  >
                    <span className="material-symbols-outlined text-body-md text-primary">
                      nutrition
                    </span>
                    Pilih Komoditas Pokok:
                  </label>
                  <CommoditySearchSelect
                    options={ALL_CATALOG_COMMODITIES}
                    valueId={selectedCommodityId}
                    onChange={setSelectedCommodityId}
                    searchPlaceholder="Cari dari 38 komoditas Surabaya..."
                    emptyNoun="komoditas"
                    className="h-10"
                    panelClassName="w-full sm:w-96 md:w-[26rem]"
                  />
                </div>

                {/* Zone Selector */}
                <div className="md:col-span-4 flex flex-col gap-1.5">
                  <label className="font-label-caps text-label-caps text-text-secondary uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-body-md text-primary">hub</span>
                    Filter Wilayah Surabaya:
                  </label>
                  <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-lg border border-border-subtle h-10">
                    {zones.map((zone) => (
                      <button
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className={`flex-1 h-full rounded-md font-label-caps text-label-caps transition-all cursor-pointer text-center flex items-center justify-center ${
                          selectedZone === zone
                            ? "bg-primary text-on-primary font-bold shadow-xs"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Disparity Summary Indicator */}
                {loadingTable || !activeCommodity ? (
                  <div className="md:col-span-3 rounded-lg px-3 py-2 flex items-center gap-2 self-end h-10 bg-surface-subtle animate-pulse border border-border-subtle">
                    <div className="w-5 h-5 rounded-full bg-border-subtle shrink-0"></div>
                    <div className="flex-1 space-y-1">
                      <div className="w-24 h-3 bg-border-subtle rounded"></div>
                      <div className="w-16 h-2 bg-border-subtle rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`md:col-span-3 rounded-lg px-3 py-2 flex items-center gap-2 self-end h-10 ${
                      activeCommodity.disparitasPct >= 15
                        ? "bg-status-critical-bg text-status-critical border border-status-critical/30"
                        : activeCommodity.disparitasPct >= 8
                        ? "bg-status-warning-bg text-status-warning border border-status-warning/30"
                        : "bg-status-normal-bg text-status-normal border border-status-normal/30"
                    }`}
                  >
                    <span className="material-symbols-outlined text-body-md shrink-0">
                      {activeCommodity.disparitasPct >= 15 ? "warning" : activeCommodity.disparitasPct >= 8 ? "info" : "check_circle"}
                    </span>
                    <div className="flex flex-wrap items-baseline gap-x-1 min-w-0">
                      <span className="font-headline-sm text-body-sm text-text-primary font-bold leading-none truncate">
                        {activeCommodity.disparitasPct >= 15
                          ? "Disparitas Tinggi"
                          : activeCommodity.disparitasPct >= 8
                          ? "Disparitas Sedang"
                          : "Disparitas Wajar"}
                      </span>
                      <span className="font-body-sm text-xs text-text-secondary font-medium">
                        Rp {activeCommodity.disparitasRp.toLocaleString("id-ID")} ({activeCommodity.disparitasPct}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Geospatial Interactive Map & Real Market Inspector Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md mb-space-lg">
              {/* Real Spatial Viewport Container (Leaflet + OpenStreetMap) */}
              <div className="lg:col-span-8 bg-surface-card rounded-xl shadow-sm overflow-hidden flex flex-col relative min-h-[580px] border border-border-subtle/70">
                <SurabayaMap
                  markets={markets}
                  selectedCommodityName={activeCommodity?.komoditas || "Komoditas Pokok"}
                  unit={activeCommodity?.satuan || "kg"}
                  selectedMarketId={selectedMarketId}
                  onSelectMarket={setSelectedMarketId}
                  selectedZone={selectedZone}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  cityAvg={activeCommodity?.rerata || 0}
                />
              </div>

              {/* Real Market Inspector & Disparity Diagnostics Panel (Beside Map) */}
              <div className="lg:col-span-4 flex flex-col gap-space-md">
                {/* Active Selected Market Inspector */}
                {loadingTable || !activeCommodity ? (
                  <div id="market-inspector" className="bg-surface-card p-space-md rounded-xl shadow-sm border border-border-subtle/70 flex flex-col scroll-mt-24 animate-pulse">
                    <div className="flex items-start justify-between pb-space-sm mb-space-sm border-b border-border-subtle">
                      <div className="space-y-1.5">
                        <div className="w-36 h-5 bg-surface-subtle rounded"></div>
                        <div className="w-48 h-3 bg-surface-subtle rounded"></div>
                      </div>
                      <div className="w-16 h-5 bg-surface-subtle rounded-full"></div>
                    </div>
                    <div className="space-y-space-sm mb-space-md">
                      <div className="p-space-xs rounded-lg bg-surface-subtle h-16"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-space-xs rounded-lg bg-surface-subtle h-12"></div>
                        <div className="p-space-xs rounded-lg bg-surface-subtle h-12"></div>
                      </div>
                    </div>
                    <div className="bg-surface-subtle p-space-sm rounded-lg mb-space-md h-24"></div>
                    <div className="mt-auto">
                      <div className="w-24 h-3 bg-surface-subtle rounded mb-2"></div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="h-7 bg-surface-subtle rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div id="market-inspector" className="bg-surface-card p-space-md rounded-xl shadow-sm border border-border-subtle/70 flex flex-col scroll-mt-24">
                    <div className="flex items-start justify-between pb-space-sm mb-space-sm border-b border-border-subtle">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-headline-sm">
                            storefront
                          </span>
                          <h2 className="font-headline-sm text-headline-sm text-text-primary">
                            {selectedMarket.name}
                          </h2>
                        </div>
                        <span className="text-xs text-text-secondary mt-0.5 block">
                          {selectedMarket.address} &bull; Surabaya {selectedMarket.zone}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps font-bold ${
                          selectedMarket.price === minPrice
                            ? "bg-status-normal-bg text-status-normal"
                            : selectedMarket.price === maxPrice
                            ? "bg-status-critical-bg text-status-critical"
                            : "bg-surface-subtle text-text-secondary"
                        }`}
                      >
                        {selectedMarket.price === minPrice
                          ? "Termurah"
                          : selectedMarket.price === maxPrice
                          ? "Tertinggi"
                          : "Rata-rata"}
                      </span>
                    </div>

                    {/* Price Comparison Metric for Selected Commodity */}
                    <div className="space-y-space-sm mb-space-md">
                      <div className="p-space-xs rounded-lg bg-surface-subtle flex flex-col gap-1">
                        <span className="text-xs text-text-secondary">
                          Harga {activeCommodity.komoditas}:
                        </span>
                        <div className="flex items-baseline justify-between">
                          <span className="font-metric-value text-headline-sm text-text-primary font-bold">
                            Rp {selectedMarket.price.toLocaleString("id-ID")}
                          </span>
                          <span className="text-xs text-text-muted">
                            /{activeCommodity.satuan}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-space-xs rounded-lg bg-surface-subtle flex flex-col">
                          <span className="text-text-muted">Rerata Kota:</span>
                          <strong className="text-text-primary mt-0.5">
                            Rp {activeCommodity.rerata.toLocaleString("id-ID")}
                          </strong>
                        </div>
                        <div className="p-space-xs rounded-lg bg-surface-subtle flex flex-col">
                          <span className="text-text-muted">Selisih vs Termurah:</span>
                          <strong
                            className={
                              selectedMarket.price === minPrice
                                ? "text-status-normal mt-0.5"
                                : "text-status-critical mt-0.5"
                            }
                          >
                            {selectedMarket.price === minPrice
                              ? "Acuan Termurah"
                              : `+Rp ${(selectedMarket.price - minPrice).toLocaleString("id-ID")}`}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Market Logistics Characteristics */}
                    <div className="bg-surface-subtle p-space-sm rounded-lg mb-space-md">
                      <div className="flex items-center gap-1.5 text-primary text-xs font-semibold mb-1">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Peran Distribusi &amp; Karakter Pasar:
                      </div>
                      <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                        {selectedMarket.characteristic}
                      </p>
                    </div>

                    {/* Market Selector Quick Buttons */}
                    <div className="mt-auto">
                      <span className="text-xs text-text-muted block mb-1.5 font-label-caps uppercase">
                        Pilih Pasar Lain:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {markets.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setSelectedMarketId(m.id)}
                            className={`py-1 px-1.5 rounded text-xs font-medium transition-all text-center truncate ${
                              selectedMarketId === m.id
                                ? "bg-primary text-on-primary font-bold shadow-xs"
                                : "bg-surface-subtle text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            {m.shortName}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Panel Matriks Komparasi Multi-Pasar (Dynamic Table) */}
            <div className="bg-surface-card rounded-xl shadow-sm overflow-hidden mb-space-lg border border-border-subtle/70">
              <div className="p-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-sm border-b border-border-subtle/40">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-headline-md text-headline-md text-text-primary">
                      Matriks Komparasi 6 Pasar Tradisional
                    </h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                    Warna hijau menunjukkan pasar dengan harga termurah, sedangkan oranye/merah menunjukkan pasar tertinggi.{latestDate ? ` • Pantauan: ${new Date(latestDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : ""}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* Search Filter for Table */}
                  <div className="relative w-full sm:w-56">
                    <input
                      type="text"
                      placeholder="Cari komoditas..."
                      value={tableSearchQuery}
                      onChange={(e) => setTableSearchQuery(e.target.value)}
                      className="w-full h-9 bg-surface-subtle text-text-primary placeholder-text-muted font-body-sm text-body-sm pl-8 pr-7 rounded-lg border border-border-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[17px] pointer-events-none">
                      search
                    </span>
                    {tableSearchQuery && (
                      <button
                        onClick={() => setTableSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[13px] w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                        title="Hapus filter pencarian"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 sm:flex-initial px-space-sm py-2 rounded-lg bg-surface-subtle hover:bg-surface-variant text-text-secondary font-body-sm text-body-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-border-subtle"
                      onClick={handleExportCSV}
                      title="Unduh seluruh data komparasi dalam format CSV"
                    >
                      <span className="material-symbols-outlined text-body-md">file_download</span>
                      Export CSV
                    </button>
                    <button
                      className="flex-1 sm:flex-initial px-space-sm py-2 rounded-lg bg-surface-subtle hover:bg-surface-variant text-text-secondary font-body-sm text-body-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-border-subtle"
                      onClick={handleSortDisparitas}
                      title="Urutkan data berdasarkan disparitas persentase"
                    >
                      <span className="material-symbols-outlined text-body-md">sort</span>
                      Sort {isSortedDesc ? "↓" : "↑"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Group Filter Chips (pola terstruktur & rapi) */}
              <div className="px-space-md py-3 bg-surface-subtle/30 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-border-subtle/60">
                {ORDERED_GROUPS.filter((g) => g === "Semua" || comparisonRows.some((r) => r.group === g)).map((g) => {
                  const count =
                    g === "Semua"
                      ? comparisonRows.length
                      : comparisonRows.filter((r) => r.group === g).length;
                  const isActive = tableGroupFilter === g;

                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setTableGroupFilter(g)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all duration-150 cursor-pointer inline-flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-card text-text-secondary hover:text-text-primary hover:bg-surface-subtle border border-border-subtle/80'
                      }`}
                    >
                      <span>{g}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-tight ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-subtle text-text-muted'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Horizontal Scroll Affordance Banner */}
              <div className="sm:hidden px-space-md py-2 bg-surface-subtle/80 text-text-secondary text-[11px] font-medium flex items-center justify-between border-b border-border-subtle/60">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-primary">swipe</span> Geser tabel untuk melihat seluruh 6 pasar
                </span>
                <span className="text-primary font-bold text-xs">&rarr;</span>
              </div>

              {/* Data Table Container with Horizontal Overflow */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-surface-subtle text-text-secondary font-label-caps text-label-caps uppercase tracking-wider">
                      <th className="py-3 px-space-md sticky left-0 bg-surface-subtle z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">Komoditas Pokok</th>
                      <th className="py-3 px-space-xs">Satuan</th>
                      <th className="py-3 px-space-sm">Keputran (Induk)</th>
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
                    {loadingTable ? (
                      Array.from({ length: 7 }).map((_, idx) => (
                        <tr key={idx} className="border-b border-surface-subtle/40 animate-pulse">
                          <td className="py-3.5 px-space-md sticky left-0 bg-surface-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center gap-space-xs">
                              <div className="w-2.5 h-2.5 rounded-full bg-surface-subtle shrink-0"></div>
                              <div className="space-y-1">
                                <div className="w-32 h-4 bg-surface-subtle rounded"></div>
                                <div className="w-20 h-2.5 bg-surface-subtle rounded"></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-space-xs">
                            <div className="w-8 h-3.5 bg-surface-subtle rounded"></div>
                          </td>
                          {Array.from({ length: 6 }).map((_, cIdx) => (
                            <td key={cIdx} className="py-3.5 px-space-sm">
                              <div className="w-16 h-4 bg-surface-subtle rounded"></div>
                            </td>
                          ))}
                          <td className="py-3.5 px-space-sm">
                            <div className="w-16 h-4 bg-surface-subtle rounded"></div>
                          </td>
                          <td className="py-3.5 px-space-md text-right">
                            <div className="w-20 h-5 bg-surface-subtle rounded ml-auto"></div>
                          </td>
                        </tr>
                      ))
                    ) : errorTable ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center">
                          <div className="max-w-md mx-auto flex flex-col items-center gap-2 text-text-secondary">
                            <span className="material-symbols-outlined text-3xl text-status-warning">cloud_off</span>
                            <span className="font-semibold text-text-primary">Data matriks disparitas tidak tersedia</span>
                            <p className="text-xs text-text-secondary">Gagal memuat matriks perbandingan 6 pasar. Silakan periksa koneksi atau coba muat ulang.</p>
                            <button
                              onClick={() => loadTableData()}
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-xs cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">refresh</span>
                              Coba Lagi
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTableRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-text-muted">
                          <span className="material-symbols-outlined text-title-lg block mb-1">search_off</span>
                          Komoditas &quot;{tableSearchQuery}&quot; tidak ditemukan dalam matriks komparasi.
                        </td>
                      </tr>
                    ) : (
                      filteredTableRows.map((row, idx) => {
                      const prices = [
                        row.keputran,
                        row.wonokromo,
                        row.pucang,
                        row.genteng,
                        row.tambahrejo,
                        row.soponyono,
                      ];
                      const rowMin = Math.min(...prices);
                      const rowMax = Math.max(...prices);

                      const renderCell = (price: number) => {
                        const isMin = price === rowMin;
                        const isMax = price === rowMax;
                        return (
                          <td
                            className={`py-3.5 px-space-sm font-metric-value ${
                              isMin
                                ? "bg-status-normal-bg text-status-normal font-semibold"
                                : isMax
                                ? "bg-status-critical-bg text-status-critical font-semibold"
                                : ""
                            }`}
                          >
                            Rp {price.toLocaleString("id-ID")}
                            {isMin && (
                              <span className="text-label-caps font-label-caps block font-normal text-status-normal/80">
                                Min
                              </span>
                            )}
                            {isMax && (
                              <span className="text-label-caps font-label-caps block font-normal text-status-critical/80">
                                Max
                              </span>
                            )}
                          </td>
                        );
                      };

                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedCommodityId(row.komoditas_id)}
                          className={`transition-colors border-b border-surface-subtle/40 cursor-pointer ${
                            row.komoditas_id === selectedCommodityId
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "hover:bg-surface-subtle/50"
                          }`}
                          title="Klik untuk melihat perbandingan spasial komoditas ini pada peta"
                        >
                          <td className="py-3.5 px-space-md sticky left-0 bg-surface-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center gap-space-xs">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.dotClass}`}
                              ></span>
                              <div className="flex flex-col">
                                <span className="font-title-md text-body-md text-text-primary font-semibold">
                                  {row.komoditas}
                                </span>
                                <span className="text-text-muted font-label-caps text-label-caps">
                                  {row.sub}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-space-xs text-text-secondary font-label-caps">
                            {row.satuan}
                          </td>
                          {renderCell(row.keputran)}
                          {renderCell(row.wonokromo)}
                          {renderCell(row.pucang)}
                          {renderCell(row.genteng)}
                          {renderCell(row.tambahrejo)}
                          {renderCell(row.soponyono)}
                          <td className="py-3.5 px-space-sm font-metric-value text-text-secondary">
                            Rp {row.rerata.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-space-md text-right">
                            <div className="flex flex-col items-end">
                              <span
                                className={`font-metric-delta text-body-sm font-bold ${row.statusClass}`}
                              >
                                Rp {row.disparitasRp.toLocaleString("id-ID")}
                              </span>
                              <span
                                className={`px-space-2xs py-0.5 rounded-full font-label-caps text-label-caps ${row.badgeClass}`}
                              >
                                {row.statusBadge}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Meta */}
              <div className="p-space-md bg-surface-subtle/40 flex flex-col sm:flex-row items-center justify-between gap-space-xs font-body-sm text-body-sm text-text-secondary">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-body-md text-status-normal">
                    verified_user
                  </span>
                  <span>Data perbandingan harga riil 6 pasar pantauan Kota Surabaya terintegrasi dari basis data pantauan harian.</span>
                </div>
                <div className="flex items-center gap-space-xs font-label-caps text-label-caps">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-normal-bg border border-status-normal inline-block"></span>{" "}
                  Harga Termurah (Acuan)
                  <span className="w-2.5 h-2.5 rounded-full bg-status-critical-bg border border-status-critical inline-block ml-2"></span>{" "}
                  Harga Tertinggi (Anomali)
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
