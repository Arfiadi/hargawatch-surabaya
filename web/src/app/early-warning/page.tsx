"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLiveEarlyWarning, EarlyWarningItem, EarlyWarningStats, formatCommodityName } from "@/lib/dataService";

const MARKET_CONFIGS = [
  { id: 2, name: "Wonokromo", shortName: "Wonokromo" },
  { id: 5, name: "Keputran", shortName: "Keputran" },
  { id: 4, name: "Pucang Anom", shortName: "Pucang" },
  { id: 3, name: "Genteng", shortName: "Genteng" },
  { id: 1, name: "Tambahrejo", shortName: "Tambahrejo" },
  { id: 146, name: "Soponyono", shortName: "Soponyono" },
];

const COMMODITY_METADATA: Record<number, { initials: string; hapRef: string }> = {
  50: { initials: "CR", hapRef: "HAP Bapanas: Rp 57.000 / kg" },
  39: { initials: "BM", hapRef: "HAP Bapanas: Rp 36.500 / kg" },
  2: { initials: "BP", hapRef: "HET Kemendag: Rp 14.900 / kg" },
  16: { initials: "TA", hapRef: "HAP Bapanas: Rp 28.500 / kg" },
  10: { initials: "MG", hapRef: "HET Kemendag: Rp 15.700 / liter" },
  7: { initials: "GP", hapRef: "HAP Bapanas: Rp 17.500 / kg" },
  13: { initials: "DA", hapRef: "HAP Bapanas: Rp 36.750 / kg" },
  25: { initials: "DS", hapRef: "HAP Bapanas: Rp 120.000 / kg" },
  38: { initials: "BP", hapRef: "HAP Bapanas: Rp 35.000 / kg" },
};

const CATEGORIES = [
  "Semua",
  "Beras",
  "Bumbu/Cabai",
  "Daging & Telur",
  "Minyak & Gula",
  "Sayur & Ikan",
] as const;

type CommodityCategory = (typeof CATEGORIES)[number];

function getCommodityCategory(nama: string): CommodityCategory {
  const n = (nama || "").toLowerCase();
  if (
    n.includes("beras") ||
    n.includes("jagung") ||
    n.includes("terigu") ||
    n.includes("kedelai") ||
    n.includes("indomie") ||
    n.includes("gandum")
  ) {
    return "Beras";
  }
  if (
    n.includes("cabe") ||
    n.includes("cabai") ||
    n.includes("bawang") ||
    n.includes("garam")
  ) {
    return "Bumbu/Cabai";
  }
  if (
    n.includes("daging") ||
    n.includes("ayam") ||
    n.includes("telur") ||
    n.includes("susu") ||
    n.includes("sapi")
  ) {
    return "Daging & Telur";
  }
  if (n.includes("minyak") || n.includes("gula")) {
    return "Minyak & Gula";
  }
  return "Sayur & Ikan";
}

export default function EarlyWarningPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [ewsData, setEwsData] = useState<EarlyWarningItem[]>([]);
  const [ewsStats, setEwsStats] = useState<EarlyWarningStats | null>(null);

  // Table UX States: Category Filter & Pagination (10 per page)
  const [selectedCategory, setSelectedCategory] = useState<CommodityCategory>("Semua");
  const [tableFilter, setTableFilter] = useState<"ALL" | "ACTION" | "NORMAL">("ALL");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  const loadData = async (showNotification = false) => {
    setIsRefreshing(true);
    setLoadError(false);
    try {
      const res = await getLiveEarlyWarning();
      if (res && res.items.length > 0) {
        setEwsData(res.items);
        setEwsStats(res.stats);
        setLoadError(false);
        if (showNotification) {
          showToast(`Sinkronisasi berhasil: Data per ${res.stats.formattedDate}`);
        }
      } else {
        setLoadError(true);
        if (showNotification) {
          showToast("Data pemantauan tidak tersedia.");
        }
      }
    } catch {
      setLoadError(true);
      showToast("Gagal menyinkronkan data pemantauan.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  // Pivot ewsData by commodity across 6 markets
  const pivotedRows = useMemo(() => {
    if (!ewsData || ewsData.length === 0) return [];

    const grouped: Record<number, {
      komoditas_id: number;
      nama_komoditas: string;
      category: CommodityCategory;
      initials: string;
      hapRef: string;
      markets: Record<number, EarlyWarningItem>;
      maxScore: number;
      worstStatus: "TINGGI" | "WASPADA" | "NORMAL";
      highestMarketName: string;
    }> = {};

    for (const item of ewsData) {
      if (!grouped[item.komoditas_id]) {
        const meta = COMMODITY_METADATA[item.komoditas_id] || {
          initials: item.nama_komoditas.slice(0, 2).toUpperCase(),
          hapRef: "Acuan Pantauan Pasar Surabaya",
        };
        grouped[item.komoditas_id] = {
          komoditas_id: item.komoditas_id,
          nama_komoditas: formatCommodityName(item.nama_komoditas),
          category: getCommodityCategory(item.nama_komoditas),
          initials: meta.initials,
          hapRef: meta.hapRef,
          markets: {},
          maxScore: 0,
          worstStatus: "NORMAL",
          highestMarketName: item.nama_pasar,
        };
      }

      grouped[item.komoditas_id].markets[item.pasar_id] = item;

      if ((item.total_skor || 0) > grouped[item.komoditas_id].maxScore) {
        grouped[item.komoditas_id].maxScore = item.total_skor;
        grouped[item.komoditas_id].highestMarketName = item.nama_pasar;
      }

      if (item.status_warning === "TINGGI") {
        grouped[item.komoditas_id].worstStatus = "TINGGI";
      } else if (item.status_warning === "WASPADA" && grouped[item.komoditas_id].worstStatus !== "TINGGI") {
        grouped[item.komoditas_id].worstStatus = "WASPADA";
      }
    }

    return Object.values(grouped).sort((a, b) => b.maxScore - a.maxScore);
  }, [ewsData]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: pivotedRows.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== "Semua") {
        counts[cat] = pivotedRows.filter((r) => r.category === cat).length;
      }
    });
    return counts;
  }, [pivotedRows]);

  // Filtered rows for the matrix table
  const filteredRows = useMemo(() => {
    return pivotedRows.filter((r) => {
      if (selectedCategory !== "Semua" && r.category !== selectedCategory) {
        return false;
      }
      const q = tableSearch.trim().toLowerCase();
      const matchSearch = q === "" || r.nama_komoditas.toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (tableFilter === "ACTION") return r.worstStatus === "TINGGI" || r.worstStatus === "WASPADA";
      if (tableFilter === "NORMAL") return r.worstStatus === "NORMAL";
      return true;
    });
  }, [pivotedRows, selectedCategory, tableFilter, tableSearch]);

  // Reset page to 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, tableFilter, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const exportMatrixCSV = () => {
    if (!filteredRows || filteredRows.length === 0) {
      showToast("Tidak ada data untuk diekspor.");
      return;
    }
    const headers = [
      "Komoditas",
      "Kategori",
      ...MARKET_CONFIGS.map((m) => `Pasar ${m.name}`),
      "Harga Terendah",
      "Harga Tertinggi",
      "Disparitas (Rp)",
      "Status EWS",
    ];
    const rows = filteredRows.map((r) => {
      const prices = MARKET_CONFIGS.map((m) => r.markets[m.id]?.harga_terakhir || 0);
      const validPrices = prices.filter((p) => p > 0);
      const min = validPrices.length > 0 ? Math.min(...validPrices) : 0;
      const max = validPrices.length > 0 ? Math.max(...validPrices) : 0;
      const disp = max - min;
      return [
        `"${r.nama_komoditas.replace(/"/g, '""')}"`,
        `"${r.category}"`,
        ...prices,
        min,
        max,
        disp,
        `"${r.worstStatus}"`,
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `HargaWatch_Matriks_Harga_${selectedCategory.replace(/[\s&/]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Matriks harga (${filteredRows.length} komoditas) berhasil diunduh.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="bg-surface-canvas text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Header />

      <main className="w-full pt-20 bg-surface-canvas min-h-screen">
        <div className="flex flex-col w-full">
          {/* Content Area Wrapper */}
          <div className="w-full max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop py-space-lg flex flex-col gap-space-xl">
            {/* 1. Header Halaman (Sesuai Standar Halaman Lain Tanpa Breadcrumb) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xs">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                  Early Warning &amp; Risiko Pangan
                </h1>
                <p className="font-body-sm text-body-sm text-text-secondary mt-1 max-w-3xl">
                  Sistem pemantauan risiko dan deteksi anomali harga berbasis model komposit 4 pilar di 6 pasar utama Kota Surabaya untuk mitigasi cepat gejolak inflasi pangan daerah.
                </p>
              </div>
            </div>

            {/* Executive Alert Banner */}
            {isRefreshing && !ewsStats ? (
              <div className="relative overflow-hidden rounded-xl bg-surface-card shadow-sm p-space-md lg:p-space-lg border border-border-subtle/70 animate-pulse">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
                  <div className="flex items-start gap-space-md">
                    <div className="w-12 h-12 rounded-xl bg-surface-subtle shrink-0"></div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-48 h-5 bg-surface-subtle rounded-full"></div>
                        <div className="w-36 h-5 bg-surface-subtle rounded-full"></div>
                      </div>
                      <div className="w-72 h-6 bg-surface-subtle rounded"></div>
                      <div className="w-96 max-w-full h-4 bg-surface-subtle rounded"></div>
                    </div>
                  </div>
                  <div className="w-48 h-10 bg-surface-subtle rounded-xl shrink-0"></div>
                </div>
              </div>
            ) : (
              <div
                className={`relative overflow-hidden rounded-xl bg-gradient-to-r transition-colors duration-300 ${
                  ewsStats?.overallStatus === "SIAGA"
                    ? "from-status-critical-bg via-surface-card to-surface-card"
                    : ewsStats?.overallStatus === "WASPADA"
                    ? "from-status-warning-bg via-surface-card to-surface-card"
                    : "from-status-normal-bg/40 via-surface-card to-surface-card"
                } shadow-sm p-space-md lg:p-space-lg border border-border-subtle/70`}
              >
                <div
                  className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
                    ewsStats?.overallStatus === "SIAGA"
                      ? "bg-status-critical/10"
                      : ewsStats?.overallStatus === "WASPADA"
                      ? "bg-status-warning/10"
                      : "bg-status-normal/10"
                  }`}
                ></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
                  <div className="flex items-start gap-space-md">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        ewsStats?.overallStatus === "SIAGA"
                          ? "bg-status-critical/20 text-status-critical"
                          : ewsStats?.overallStatus === "WASPADA"
                          ? "bg-status-warning/20 text-status-warning"
                          : "bg-status-normal-bg text-status-normal"
                      }`}
                    >
                      <span className="material-symbols-outlined text-headline-lg">
                        {ewsStats?.overallStatus === "SIAGA"
                          ? "crisis_alert"
                          : ewsStats?.overallStatus === "WASPADA"
                          ? "warning"
                          : "verified_user"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-space-2xs">
                      <div className="flex flex-wrap items-center gap-space-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-space-xs py-space-2xs rounded-full text-on-primary font-label-caps text-label-caps font-bold tracking-wide ${
                            ewsStats?.overallStatus === "SIAGA"
                              ? "bg-status-critical"
                              : ewsStats?.overallStatus === "WASPADA"
                              ? "bg-status-warning"
                              : "bg-status-normal"
                          }`}
                        >
                          <span className="material-symbols-outlined text-body-sm">
                            {ewsStats?.overallStatus === "SIAGA"
                              ? "emergency"
                              : ewsStats?.overallStatus === "WASPADA"
                              ? "warning"
                              : "check_circle"}
                          </span>
                          STATUS PERINGATAN DINI: {ewsStats?.overallStatus || "NORMAL"}
                        </span>
                        <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded-full bg-surface-subtle text-text-secondary">
                          {ewsStats?.focusText || "Kondisi Terkendali di 6 Pasar"}
                        </span>
                      </div>
                      <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                        Status Peringatan &amp; Indeks Risiko Pasar
                      </h2>
                      <p className="font-body-md text-body-md text-text-secondary max-w-3xl">
                        {ewsStats?.subtitle || "Pantau kenaikan harga, titik anomali, dan faktor yang memengaruhi pasokan secara real-time."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3 Key Executive Analytical KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
              {/* KPI 1: Indeks Stabilitas */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                    Indeks Stabilitas Pangan
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center text-text-secondary">
                    <span className="material-symbols-outlined text-body-lg">show_chart</span>
                  </span>
                </div>
                <div className="flex flex-col gap-space-2xs">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-metric-display text-metric-display text-on-surface">100.0%</span>
                    <span className="font-label-caps text-label-caps text-status-normal font-semibold">
                      Target &gt; 90%
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Toleransi Batas Aman Pemkot Surabaya
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                  <div className="h-full bg-status-normal rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>

              {/* KPI 2: Komoditas Risiko Tinggi */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                    Komoditas Risiko Tinggi
                  </span>
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      (ewsStats?.highCount || 0) > 0
                        ? "bg-status-critical-bg text-status-critical"
                        : "bg-status-normal-bg text-status-normal"
                    }`}
                  >
                    <span className="material-symbols-outlined text-body-lg">
                      {(ewsStats?.highCount || 0) > 0 ? "emergency_home" : "verified"}
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-space-2xs">
                  <div className="flex items-baseline gap-space-xs">
                    <span
                      className={`font-metric-display text-metric-display ${
                        (ewsStats?.highCount || 0) > 0 ? "text-status-critical" : "text-status-normal"
                      }`}
                    >
                      {ewsStats ? ewsStats.highCount : 0}
                    </span>
                    <span className="font-title-md text-title-md text-text-secondary">Komoditas</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ewsStats && ewsStats.criticalCommodities.length > 0 ? (
                      ewsStats.criticalCommodities.map((c) => (
                        <span
                          key={c}
                          className="px-space-xs py-0.5 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="px-space-xs py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
                        Semua Terkendali
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-text-muted">
                  {ewsStats && ewsStats.highCount > 0 ? "Perlu mitigasi segera" : "Tidak ada komoditas di zona bahaya"}
                </span>
              </div>

              {/* KPI 3: Titik Anomali Pasar */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                    Titik Anomali Pasar
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center text-status-normal">
                    <span className="material-symbols-outlined text-body-lg">radar</span>
                  </span>
                </div>
                <div className="flex flex-col gap-space-2xs">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-metric-display text-metric-display text-status-normal">
                      {ewsStats ? ewsStats.anomaliesCount : 0} Titik
                    </span>
                    <span className="font-label-caps text-label-caps text-text-muted">Outlier Deviasi</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-text-secondary">
                    Seluruh pasar selaras dalam toleransi
                  </span>
                </div>
                <div className="flex items-center gap-space-xs text-status-normal font-label-caps text-label-caps font-semibold">
                  <span className="material-symbols-outlined text-body-sm">check_circle</span>
                  <span>Akurasi prediksi: WAPE 5,36%</span>
                </div>
              </div>
            </div>

            {/* Main Section: Dynamic Commodity Risk Matrix (6 Markets x Commodities) */}
            <div className="flex flex-col gap-space-md">
              {/* Section Header & Filter Controls */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                    Matriks Disparitas &amp; Risiko Komoditas
                  </h2>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Pemantauan risiko terintegrasi dari basis data EWS 4 pilar di 6 pasar utama Kota Surabaya.
                  </p>
                </div>
              </div>

              {/* Interactive Matrix Table Card */}
              <div className="bg-surface-card rounded-xl shadow-sm overflow-hidden border border-border-subtle/70">
                {/* Table Filter & Search Toolbar */}
                <div className="p-space-md flex flex-col gap-space-sm border-b border-border-subtle/40 bg-surface-subtle/30">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
                    {/* Category Filter Pills (Semua, Beras, Bumbu/Cabai, Daging & Telur, Minyak & Gula, Sayur & Ikan) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                      {CATEGORIES.map((cat) => {
                        const count = categoryCounts[cat] || 0;
                        const isSelected = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg font-label-caps text-label-caps font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                              isSelected
                                ? "bg-primary text-on-primary shadow-xs"
                                : "bg-surface-card hover:bg-surface-subtle text-text-secondary border border-border-subtle/80 hover:text-text-primary"
                            }`}
                          >
                            <span>{cat}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected ? "bg-white/20 text-white" : "bg-surface-subtle text-text-muted"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Search Filter for Table */}
                    <div className="relative w-full lg:w-64 shrink-0">
                      <input
                        type="text"
                        placeholder="Cari komoditas..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        className="w-full h-9 bg-surface-card text-text-primary placeholder-text-muted font-body-sm text-body-sm pl-8 pr-7 rounded-lg border border-border-subtle focus:outline-none focus:border-primary transition-colors"
                      />
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[17px] pointer-events-none">
                        search
                      </span>
                      {tableSearch && (
                        <button
                          onClick={() => setTableSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[13px] w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                          title="Hapus pencarian"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Swipe Affordance Banner */}
                <div className="sm:hidden px-space-md py-2 bg-surface-subtle/80 text-text-secondary text-[11px] font-medium flex items-center justify-between border-b border-border-subtle/60">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-primary">swipe</span> Geser tabel untuk melihat 6 pasar
                  </span>
                  <span className="text-primary font-bold text-xs">&rarr;</span>
                </div>

                {/* Data Table Container with Sticky Commodity Column */}
                <div className="overflow-x-auto relative">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-surface-subtle text-text-secondary font-label-caps text-label-caps uppercase tracking-wider">
                        <th className="py-space-sm px-space-md min-w-[220px] sticky left-0 bg-surface-subtle z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                          Komoditas Pantau
                        </th>
                        {MARKET_CONFIGS.map((m) => (
                          <th key={m.id} className="py-space-sm px-space-sm text-center min-w-[110px]">
                            Pasar {m.shortName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-subtle font-body-sm text-body-sm text-on-surface">
                      {isRefreshing && ewsData.length === 0 ? (
                        Array.from({ length: 8 }).map((_, idx) => (
                          <tr key={idx} className="border-b border-surface-subtle/40 animate-pulse">
                            <td className="py-space-md px-space-md sticky left-0 bg-surface-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                              <div className="flex items-center gap-space-xs">
                                <div className="w-9 h-9 rounded-lg bg-surface-subtle shrink-0"></div>
                                <div className="space-y-1">
                                  <div className="w-32 h-4 bg-surface-subtle rounded"></div>
                                  <div className="w-20 h-2.5 bg-surface-subtle rounded"></div>
                                </div>
                              </div>
                            </td>
                            {Array.from({ length: 6 }).map((_, cIdx) => (
                              <td key={cIdx} className="py-space-md px-space-sm text-center">
                                <div className="w-20 h-6 bg-surface-subtle rounded-md mx-auto"></div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : loadError && ewsData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center">
                            <div className="max-w-md mx-auto flex flex-col items-center gap-2 text-text-secondary">
                              <span className="material-symbols-outlined text-3xl text-status-warning">cloud_off</span>
                              <span className="font-semibold text-text-primary">Data pemantauan tidak tersedia</span>
                              <p className="text-xs text-text-secondary">Gagal memuat data sistem peringatan dini. Silakan periksa koneksi atau coba sinkronkan ulang.</p>
                              <button
                                onClick={() => loadData(true)}
                                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-primary-container transition shadow-xs cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">refresh</span>
                                Coba Lagi
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-text-muted">
                            <span className="material-symbols-outlined text-title-lg block mb-1">search_off</span>
                            Tidak ada komoditas yang cocok dengan filter atau kategori ini.
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row, rowIndex) => {
                          const isRowCritical = row.worstStatus === "TINGGI";
                          const isRowWarning = row.worstStatus === "WASPADA";
                          const isTopRow = rowIndex < 2;
                          const tooltipPosClass = isTopRow ? "top-full mt-2" : "bottom-full mb-2";

                          // Extract valid prices across markets to determine cheapest, highest, and moderate
                          const rowPrices = MARKET_CONFIGS.map((m) => row.markets[m.id]?.harga_terakhir || 0).filter((p) => p > 0);
                          const minPrice = rowPrices.length > 0 ? Math.min(...rowPrices) : 0;
                          const maxPrice = rowPrices.length > 0 ? Math.max(...rowPrices) : 0;
                          const hasSpread = minPrice < maxPrice;

                          return (
                            <tr
                              key={row.komoditas_id}
                              className={`transition-colors ${
                                isRowCritical
                                  ? "bg-status-critical-bg/25 hover:bg-status-critical-bg/40"
                                  : isRowWarning
                                  ? "bg-status-warning-bg/15 hover:bg-status-warning-bg/30"
                                  : "hover:bg-surface-subtle/50"
                              }`}
                            >
                              {/* Sticky Column: Commodity Info */}
                              <td className="py-space-md px-space-md sticky left-0 bg-surface-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                                <div className="flex items-center gap-space-xs">
                                  <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                                      isRowCritical
                                        ? "bg-status-critical/10 text-status-critical"
                                        : isRowWarning
                                        ? "bg-status-warning/10 text-status-warning"
                                        : "bg-surface-subtle text-text-secondary"
                                    }`}
                                  >
                                    {row.initials}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-headline-sm text-body-md text-on-surface font-semibold truncate">
                                      {row.nama_komoditas}
                                    </span>
                                    <span className="font-label-caps text-label-caps text-text-muted truncate">
                                      {row.hapRef}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 6 Market Data Cells with Color-Coded Pricing */}
                              {MARKET_CONFIGS.map((m) => {
                                const marketItem = row.markets[m.id];
                                if (!marketItem) {
                                  return (
                                    <td key={m.id} className="py-space-md px-space-sm text-center text-text-muted text-xs">
                                      -
                                    </td>
                                  );
                                }

                                const price = marketItem.harga_terakhir || 0;
                                const isMin = hasSpread && price === minPrice;
                                const isMax = hasSpread && price === maxPrice;
                                const isModerate = hasSpread && !isMin && !isMax;

                                const score = marketItem.total_skor || 0;
                                const isCellHovered = activeTooltip === `${row.komoditas_id}-${m.id}`;

                                // Determine price tier visual styles
                                let cellBgClass = "";
                                let priceTextClass = "text-text-primary font-semibold";
                                let badgeClass = "bg-surface-subtle text-text-secondary";
                                let badgeLabel = "Seragam";

                                if (isMax) {
                                  cellBgClass = "bg-rose-50/70 hover:bg-rose-100/60";
                                  priceTextClass = "text-rose-700 font-bold";
                                  badgeClass = "bg-rose-100/90 text-rose-700 border border-rose-200/80 font-bold";
                                  badgeLabel = "Tertinggi";
                                } else if (isMin) {
                                  cellBgClass = "bg-emerald-50/70 hover:bg-emerald-100/60";
                                  priceTextClass = "text-emerald-700 font-bold";
                                  badgeClass = "bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 font-bold";
                                  badgeLabel = "Termurah";
                                } else if (isModerate) {
                                  cellBgClass = "bg-amber-50/40 hover:bg-amber-100/50";
                                  priceTextClass = "text-amber-800 font-semibold";
                                  badgeClass = "bg-amber-100/70 text-amber-800 border border-amber-200/60 font-medium";
                                  badgeLabel = "Sedang";
                                }

                                return (
                                  <td
                                    key={m.id}
                                    className={`py-space-md px-space-sm text-center relative transition-colors ${cellBgClass}`}
                                    onMouseEnter={() => setActiveTooltip(`${row.komoditas_id}-${m.id}`)}
                                    onMouseLeave={() => setActiveTooltip(null)}
                                  >
                                    <div className="flex flex-col items-center">
                                      <span className={`font-metric-value text-body-md ${priceTextClass}`}>
                                        Rp {(price || 0).toLocaleString("id-ID")}
                                      </span>
                                      <span
                                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-label-caps text-[10px] mt-1 ${badgeClass}`}
                                      >
                                        {badgeLabel}
                                      </span>
                                    </div>

                                    {/* Tooltip: Market Detail Breakdown (White Card theme, no clipping) */}
                                    {isCellHovered && (
                                      <div
                                        className={`absolute z-50 ${tooltipPosClass} left-1/2 -translate-x-1/2 w-56 p-3 bg-white text-text-primary rounded-xl shadow-xl border border-border-subtle text-left pointer-events-none text-xs`}
                                      >
                                        <div className="font-bold text-text-primary mb-1.5 border-b border-border-subtle/80 pb-1.5 flex justify-between items-center">
                                          <span className="font-semibold text-text-primary">{m.name}</span>
                                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${badgeClass}`}>
                                            {badgeLabel}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center py-0.5">
                                          <span className="text-text-muted text-[11px]">Harga Pasar:</span>
                                          <span className="font-bold text-text-primary">
                                            Rp {price.toLocaleString("id-ID")}
                                          </span>
                                        </div>
                                        {hasSpread && (
                                          <div className="flex justify-between items-center py-0.5">
                                            <span className="text-text-muted text-[11px]">Selisih vs Termurah:</span>
                                            <span
                                              className={`font-bold text-[11px] ${
                                                price === minPrice ? "text-emerald-600" : "text-rose-600"
                                              }`}
                                            >
                                              {price === minPrice
                                                ? "Harga Terendah"
                                                : `+Rp ${(price - minPrice).toLocaleString("id-ID")}`}
                                            </span>
                                          </div>
                                        )}
                                        {score > 0 && (
                                          <div className="mt-2 pt-1.5 border-t border-border-subtle/80 flex justify-between items-center font-bold">
                                            <span className="text-text-muted text-[11px]">Skor Risiko EWS:</span>
                                            <span
                                              className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${
                                                score >= 60
                                                  ? "bg-rose-100 text-rose-700"
                                                  : score >= 35
                                                  ? "bg-amber-100 text-amber-800"
                                                  : "bg-emerald-100 text-emerald-800"
                                              }`}
                                            >
                                              {score}/100
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Actions: Pagination & Export */}
                <div className="p-space-md bg-surface-subtle/30 flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-border-subtle/40">
                  <div className="flex items-center gap-space-xs text-body-sm text-text-secondary">
                    <span>
                      Menampilkan{" "}
                      <strong className="text-on-surface font-bold">
                        {filteredRows.length === 0
                          ? 0
                          : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                        –
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length)}
                      </strong>{" "}
                      dari <strong className="text-on-surface font-bold">{filteredRows.length}</strong> komoditas
                    </span>
                  </div>

                  {/* Pagination Controls & Green Export Button */}
                  <div className="flex flex-wrap items-center gap-2">
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-border-subtle shadow-xs">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-2.5 py-1 rounded-lg text-body-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-subtle cursor-pointer flex items-center gap-1 text-text-secondary hover:text-text-primary"
                          title="Halaman Sebelumnya"
                        >
                          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                          <span className="hidden sm:inline">Sebelumnya</span>
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg font-headline-sm text-body-sm font-bold transition-all cursor-pointer ${
                              currentPage === page
                                ? "bg-primary text-on-primary shadow-xs"
                                : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-2.5 py-1 rounded-lg text-body-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-subtle cursor-pointer flex items-center gap-1 text-text-secondary hover:text-text-primary"
                          title="Halaman Berikutnya"
                        >
                          <span className="hidden sm:inline">Berikutnya</span>
                          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </button>
                      </div>
                    )}

                    <button
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-headline-sm text-body-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                      onClick={exportMatrixCSV}
                      title="Unduh matriks perbandingan harga komoditas dalam format CSV"
                    >
                      <span className="material-symbols-outlined text-body-md">download</span>
                      <span>Ekspor Matrix (.CSV)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        <div
          className={`fixed bottom-6 right-6 z-50 bg-surface-card text-on-surface p-space-md rounded-xl shadow-xl flex items-center gap-space-sm transform transition-[transform,opacity] duration-300 border border-border-subtle toast-slide ${
            toastMessage
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-28 opacity-0 pointer-events-none"
          }`}
          id="dispatch-toast"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-headline-sm">check</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-body-md font-bold">Pemberitahuan</span>
            <span className="font-body-sm text-body-sm text-text-secondary" id="toast-message">
              {toastMessage}
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
