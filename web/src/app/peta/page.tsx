"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLiveMarketComparison, getLiveMarketLocations } from "@/lib/dataService";

const SurabayaMap = dynamic(() => import("@/components/SurabayaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[580px] bg-surface-subtle flex flex-col items-center justify-center text-text-muted gap-2">
      <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
      <span className="text-sm font-medium">Memuat Peta Spasial Geografis Surabaya...</span>
    </div>
  ),
});

interface ComparisonRowItem {
  komoditas: string;
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

const DEFAULT_COMPARISON_ROWS: ComparisonRowItem[] = [
  {
    komoditas: "Cabai Rawit Merah",
    sub: "Hortikultura Segar",
    satuan: "1 kg",
    keputran: 40000,
    wonokromo: 65000,
    pucang: 68000,
    genteng: 78000,
    tambahrejo: 62000,
    soponyono: 70000,
    rerata: 63833,
    disparitasRp: 38000,
    disparitasPct: 95.0,
    statusClass: "text-status-critical",
    statusBadge: "95.0% (Tinggi)",
    badgeClass: "bg-status-critical-bg text-status-critical",
    dotClass: "bg-status-critical",
  },
  {
    komoditas: "Beras Premium",
    sub: "Setara IR64 / Bramo",
    satuan: "1 kg",
    keputran: 16000,
    wonokromo: 16500,
    pucang: 16500,
    genteng: 16500,
    tambahrejo: 16250,
    soponyono: 16500,
    rerata: 16375,
    disparitasRp: 500,
    disparitasPct: 3.1,
    statusClass: "text-status-normal",
    statusBadge: "3.1% (Stabil)",
    badgeClass: "bg-status-normal-bg text-status-normal",
    dotClass: "bg-status-normal",
  },
  {
    komoditas: "Gula Pasir Curah",
    sub: "Pabrik Gula Jatim",
    satuan: "1 kg",
    keputran: 16800,
    wonokromo: 17000,
    pucang: 17500,
    genteng: 17800,
    tambahrejo: 17200,
    soponyono: 17500,
    rerata: 17300,
    disparitasRp: 1000,
    disparitasPct: 5.9,
    statusClass: "text-status-normal",
    statusBadge: "5.9% (Terkendali)",
    badgeClass: "bg-status-normal-bg text-status-normal",
    dotClass: "bg-status-normal",
  },
  {
    komoditas: "Minyak Goreng Curah",
    sub: "Minyak Kelapa Sawit",
    satuan: "1 liter",
    keputran: 15700,
    wonokromo: 16000,
    pucang: 16500,
    genteng: 17200,
    tambahrejo: 16000,
    soponyono: 16500,
    rerata: 16310,
    disparitasRp: 1500,
    disparitasPct: 9.5,
    statusClass: "text-status-warning",
    statusBadge: "9.5% (Waspada)",
    badgeClass: "bg-status-warning-bg text-status-warning",
    dotClass: "bg-status-warning",
  },
  {
    komoditas: "Telur Ayam Ras",
    sub: "Peternak Blitar / Pare",
    satuan: "1 kg",
    keputran: 25000,
    wonokromo: 25500,
    pucang: 26000,
    genteng: 26500,
    tambahrejo: 25500,
    soponyono: 26000,
    rerata: 25750,
    disparitasRp: 1500,
    disparitasPct: 6.0,
    statusClass: "text-status-normal",
    statusBadge: "6.0% (Wajar)",
    badgeClass: "bg-status-normal-bg text-status-normal",
    dotClass: "bg-status-normal",
  },
  {
    komoditas: "Daging Sapi Murni",
    sub: "RPH Pegirian Surabaya",
    satuan: "1 kg",
    keputran: 118000,
    wonokromo: 117000,
    pucang: 122000,
    genteng: 126000,
    tambahrejo: 119000,
    soponyono: 123000,
    rerata: 120830,
    disparitasRp: 9000,
    disparitasPct: 7.7,
    statusClass: "text-status-normal",
    statusBadge: "7.7% (Sedang)",
    badgeClass: "bg-status-normal-bg text-status-normal",
    dotClass: "bg-status-normal",
  },
  {
    komoditas: "Bawang Merah Super",
    sub: "Probolinggo / Nganjuk",
    satuan: "1 kg",
    keputran: 28000,
    wonokromo: 31000,
    pucang: 32000,
    genteng: 35000,
    tambahrejo: 29000,
    soponyono: 32000,
    rerata: 31167,
    disparitasRp: 7000,
    disparitasPct: 25.0,
    statusClass: "text-status-critical",
    statusBadge: "25.0% (Tinggi)",
    badgeClass: "bg-status-critical-bg text-status-critical",
    dotClass: "bg-status-critical",
  },
  {
    komoditas: "Bawang Putih Honan",
    sub: "Impor Pelabuhan Tj. Perak",
    satuan: "1 kg",
    keputran: 36000,
    wonokromo: 37000,
    pucang: 38000,
    genteng: 39500,
    tambahrejo: 37000,
    soponyono: 38500,
    rerata: 37660,
    disparitasRp: 3500,
    disparitasPct: 9.7,
    statusClass: "text-status-warning",
    statusBadge: "9.7% (Sedang)",
    badgeClass: "bg-status-warning-bg text-status-warning",
    dotClass: "bg-status-normal",
  }
];

export default function SpatialMapPage() {
  const [selectedCommodityIdx, setSelectedCommodityIdx] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<string>("Semua");
  const [selectedMarketId, setSelectedMarketId] = useState<string>("genteng");
  const [comparisonRows, setComparisonRows] = useState<ComparisonRowItem[]>(DEFAULT_COMPARISON_ROWS);
  const [isSortedDesc, setIsSortedDesc] = useState<boolean>(true);
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

  useEffect(() => {
    getLiveMarketComparison().then((data) => {
      if (data && data.length > 0) {
        const mapped: ComparisonRowItem[] = data.map((d) => {
          const isHigh = d.disparitasPct >= 15;
          const isMed = d.disparitasPct >= 8 && d.disparitasPct < 15;
          return {
            komoditas: d.komoditas,
            sub: "Pantauan Harian 6 Pasar",
            satuan: d.satuan.startsWith("1") ? d.satuan : `1 ${d.satuan}`,
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
            badgeClass: isHigh ? "bg-status-critical-bg text-status-critical" : isMed ? "bg-status-warning-bg text-status-warning" : "bg-status-normal-bg text-status-normal",
            dotClass: isHigh ? "bg-status-critical" : isMed ? "bg-status-warning" : "bg-status-normal",
          };
        });
        setComparisonRows(mapped);
      }
    });
  }, []);

  const zones = ["Semua", "Pusat", "Selatan", "Timur", "Utara"];

  // Active selected commodity row
  const activeCommodity = comparisonRows[selectedCommodityIdx] || comparisonRows[0];

  // Dynamic Market Pin Setup with live Supabase GPS coordinates
  const markets = [
    {
      id: "keputran",
      pasar_id: 5,
      name: "Pasar Keputran",
      shortName: "Keputran",
      zone: "Pusat",
      role: "Pasar Induk Grosir Malam",
      price: activeCommodity.keputran,
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
      price: activeCommodity.genteng,
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
      price: activeCommodity.wonokromo,
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
      price: activeCommodity.pucang,
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
      price: activeCommodity.tambahrejo,
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
      price: activeCommodity.soponyono,
      latitude: marketCoords[146]?.lat || -7.3228,
      longitude: marketCoords[146]?.lng || 112.7744,
      address: "Jl. Rungkut Asri, Rungkut",
      characteristic: "Pasar ritel utama bagi sentra industri dan perumahan padat Rungkut & Tenggilis, dipengaruhi biaya angkut dari pusat kota.",
    },
  ];

  const validPrices = markets.map((m) => m.price).filter((p) => p > 0);
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

  const handleExportCSV = () => {
    const csvContent =
      "Komoditas Pokok,Satuan,Keputran (Induk),Wonokromo,Pucang Anom,Genteng,Tambahrejo,Soponyono,Rerata Kota,Disparitas Rp,Disparitas %\n" +
      comparisonRows
        .map(
          (r) =>
            `"${r.komoditas}","${r.satuan}","Rp ${r.keputran.toLocaleString("id-ID")}","Rp ${r.wonokromo.toLocaleString("id-ID")}","Rp ${r.pucang.toLocaleString("id-ID")}","Rp ${r.genteng.toLocaleString("id-ID")}","Rp ${r.tambahrejo.toLocaleString("id-ID")}","Rp ${r.soponyono.toLocaleString("id-ID")}","Rp ${r.rerata.toLocaleString("id-ID")}","Rp ${r.disparitasRp.toLocaleString("id-ID")}","${r.disparitasPct}%"`
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `matriks_disparitas_pasar_surabaya_${activeCommodity.komoditas.toLowerCase().replace(/\s+/g, "_")}.csv`);
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-normal/15 text-status-normal font-label-caps text-label-caps border border-status-normal/30 mb-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-status-normal animate-pulse"></span>
                    Pantauan Spasial 6 Pasar Kota Surabaya
                </div>
                <div className="flex flex-wrap items-baseline gap-space-xs">
                  <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                    Peta Disparitas Harga Antar-Pasar
                  </h1>
                </div>
                <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                  Analisis perbandingan harga bahan pokok secara geografis antara pasar induk grosir dan pasar ritel permukiman.
                </p>
              </div>

              {/* Dynamic Quick Telemetry Card */}
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
            </div>

            {/* 1. Spatial Control & Analytical Filter Bar */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm mb-space-lg border border-border-subtle/70">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
                {/* Commodity Select */}
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
                  <div className="relative">
                    <select
                      className="w-full h-10 appearance-none bg-surface-subtle text-text-primary font-body-md text-body-md pl-space-sm pr-9 rounded-lg focus:outline-none focus:bg-surface-card border border-border-subtle transition-all cursor-pointer font-title-md"
                      id="commodity-select"
                      value={selectedCommodityIdx}
                      onChange={(e) => setSelectedCommodityIdx(Number(e.target.value))}
                    >
                      {comparisonRows.map((row, idx) => (
                        <option key={idx} value={idx}>
                          {row.komoditas} ({row.satuan})
                        </option>
                      ))}
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
                    Filter Wilayah Surabaya:
                  </label>
                  <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-lg border border-border-subtle">
                    {zones.map((zone) => (
                      <button
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className={`flex-1 py-1.5 rounded-md font-label-caps text-label-caps transition-all cursor-pointer text-center ${
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
                <div
                  className={`md:col-span-3 rounded-lg p-space-sm flex items-start gap-space-xs ${
                    activeCommodity.disparitasPct >= 15
                      ? "bg-status-critical-bg text-status-critical border border-status-critical/30"
                      : activeCommodity.disparitasPct >= 8
                      ? "bg-status-warning-bg text-status-warning border border-status-warning/30"
                      : "bg-status-normal-bg text-status-normal border border-status-normal/30"
                  }`}
                >
                  <span className="material-symbols-outlined text-headline-sm mt-0.5 shrink-0">
                    {activeCommodity.disparitasPct >= 15 ? "warning" : activeCommodity.disparitasPct >= 8 ? "info" : "check_circle"}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-text-primary leading-snug">
                      {activeCommodity.disparitasPct >= 15
                        ? "Disparitas Tinggi"
                        : activeCommodity.disparitasPct >= 8
                        ? "Disparitas Sedang"
                        : "Disparitas Terkendali"}
                    </span>
                    <span className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                      Selisih antar-pasar mencapai <strong>Rp {activeCommodity.disparitasRp.toLocaleString("id-ID")}</strong> ({activeCommodity.disparitasPct}%).
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Geospatial Interactive Map & Real Market Inspector Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md mb-space-lg">
              {/* Real Spatial Viewport Container (Leaflet + OpenStreetMap) */}
              <div className="lg:col-span-8 bg-surface-card rounded-xl shadow-sm overflow-hidden flex flex-col relative min-h-[580px] border border-border-subtle/70">
                <SurabayaMap
                  markets={markets}
                  selectedCommodityName={activeCommodity.komoditas}
                  unit={activeCommodity.satuan}
                  selectedMarketId={selectedMarketId}
                  onSelectMarket={setSelectedMarketId}
                  selectedZone={selectedZone}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  cityAvg={activeCommodity.rerata}
                />
              </div>

              {/* Real Market Inspector & Disparity Diagnostics Panel (Beside Map) */}
              <div className="lg:col-span-4 flex flex-col gap-space-md">
                {/* Active Selected Market Inspector */}
                <div className="bg-surface-card p-space-md rounded-xl shadow-sm border border-border-subtle/70 flex flex-col">
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
              </div>
            </div>

            {/* 3. Panel Matriks Komparasi Multi-Pasar (Dynamic Table) */}
            <div className="bg-surface-card rounded-xl shadow-sm overflow-hidden mb-space-lg border border-border-subtle/70">
              <div className="p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-headline-md text-headline-md text-text-primary">
                      Matriks Komparasi 6 Pasar Tradisional
                    </h2>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-subtle text-text-secondary font-label-caps text-label-caps">
                      {comparisonRows.length} Komoditas Pokok
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                    Warna hijau menunjukkan pasar dengan harga termurah, sedangkan oranye/merah menunjukkan pasar tertinggi.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button
                    className="px-space-sm py-2 rounded-lg bg-surface-subtle hover:bg-surface-variant text-text-secondary font-body-sm text-body-sm flex items-center gap-1.5 transition-colors cursor-pointer border border-border-subtle"
                    onClick={handleExportCSV}
                    title="Unduh seluruh data komparasi dalam format CSV"
                  >
                    <span className="material-symbols-outlined text-body-md">file_download</span>
                    Export CSV
                  </button>
                  <button
                    className="px-space-sm py-2 rounded-lg bg-surface-subtle hover:bg-surface-variant text-text-secondary font-body-sm text-body-sm flex items-center gap-1.5 transition-colors cursor-pointer border border-border-subtle"
                    onClick={handleSortDisparitas}
                    title="Urutkan data berdasarkan disparitas persentase"
                  >
                    <span className="material-symbols-outlined text-body-md">sort</span>
                    Sort Disparitas {isSortedDesc ? "↓" : "↑"}
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
                    {comparisonRows.map((row, idx) => {
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
                          className="hover:bg-surface-subtle/50 transition-colors border-b border-surface-subtle/40"
                        >
                          <td className="py-3.5 px-space-md">
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
                    })}
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
