"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getLiveCommodities,
  getLiveStabilitySummary,
  getLiveShoppingBasket,
  getLiveMultiCommodityTrends,
  DEFAULT_BASKET_ITEMS,
  COMMODITY_BASKET_META,
  CommodityPrice,
  FoodStabilitySummary,
  BasketItem,
  ShoppingBasketSimulation,
  MultiCommodityTrendResult,
} from "@/lib/dataService";

const DEFAULT_COMMODITIES: CommodityPrice[] = [
    {
      id: "beras",
      category: "Beras",
      tag: "Pangan Pokok",
      name: "Beras Medium",
      status: "Normal",
      isCritical: false,
      isWarning: false,
      cheapestBadge: "Termurah di Surabaya",
      cheapestSub: "Hemat Rp 600/kg",
      marketName: "Pasar Tambahrejo",
      marketSub: "Simokerto, Surabaya Utara",
      price: "Rp 13.200",
      unit: "/kg",
      cityAvg: "Rp 13.800",
      delta: "-1.5%",
      deltaIcon: "trending_down",
      deltaClass: "text-status-normal",
      sparkPath: "M0,28 L30,24 L60,26 L100,18 L140,16 L170,12 L200,8",
      sparkClass: "text-status-normal",
      basketItemName: "Beras Premium",
      basketItemPrice: 14500,
    },
    {
      id: "minyak",
      category: "Minyak Goreng",
      tag: "Minyak Nabati",
      name: "Minyak Goreng Curah",
      status: "Stabil",
      isCritical: false,
      isWarning: false,
      cheapestBadge: "Termurah di Surabaya",
      cheapestSub: "Harga Terkendali",
      marketName: "Pasar Wonokromo",
      marketSub: "Wonokromo, Surabaya Selatan",
      price: "Rp 15.500",
      unit: "/liter",
      cityAvg: "Rp 16.200",
      delta: "0.0%",
      deltaIcon: "horizontal_rule",
      deltaClass: "text-status-normal",
      sparkPath: "M0,16 L40,16 L80,18 L120,16 L160,15 L200,16",
      sparkClass: "text-status-normal",
      basketItemName: "Minyak Goreng",
      basketItemPrice: 16000,
    },
    {
      id: "telur",
      category: "Telur",
      tag: "Protein Unggas",
      name: "Telur Ayam Ras",
      status: "Stabil",
      isCritical: false,
      isWarning: false,
      cheapestBadge: "Termurah di Surabaya",
      cheapestSub: "Pasokan Aman",
      marketName: "Pasar Soponyono",
      marketSub: "Rungkut, Surabaya Timur",
      price: "Rp 27.500",
      unit: "/kg",
      cityAvg: "Rp 28.400",
      delta: "Stabil",
      deltaIcon: "trending_flat",
      deltaClass: "text-status-normal",
      sparkPath: "M0,20 L35,18 L70,22 L110,19 L150,20 L200,18",
      sparkClass: "text-status-normal",
      basketItemName: "Telur Ayam",
      basketItemPrice: 27500,
    },
    {
      id: "cabai",
      category: "Cabai",
      tag: "Disparitas Tinggi",
      name: "Cabai Rawit Merah",
      status: "Waspada",
      isCritical: true,
      isWarning: false,
      cheapestBadge: "Termurah: Keputran",
      cheapestSub: "Selisih Rp 8.000!",
      marketName: "Pasar Keputran",
      marketSub: "Genteng: Rp 76.000/kg",
      price: "Rp 68.000",
      unit: "/kg",
      cityAvg: "Rp 72.500",
      delta: "+6.5%",
      deltaIcon: "trending_up",
      deltaClass: "text-status-critical",
      sparkPath: "M0,28 L40,24 L80,22 L120,18 L160,8 L200,4",
      sparkClass: "text-status-critical",
      basketItemName: "Cabai Rawit",
      basketItemPrice: 68000,
    },
    {
      id: "daging",
      category: "Daging Sapi",
      tag: "Peternakan",
      name: "Daging Sapi Murni",
      status: "Normal",
      isCritical: false,
      isWarning: false,
      cheapestBadge: "Termurah di Surabaya",
      cheapestSub: "Harga RPH Terjaga",
      marketName: "Pasar Pucang Anom",
      marketSub: "Gubeng, Surabaya Tengah",
      price: "Rp 118.000",
      unit: "/kg",
      cityAvg: "Rp 122.500",
      delta: "0.0%",
      deltaIcon: "trending_flat",
      deltaClass: "text-status-normal",
      sparkPath: "M0,18 L50,18 L90,16 L140,16 L175,18 L200,16",
      sparkClass: "text-status-normal",
      basketItemName: "Daging Sapi",
      basketItemPrice: 118000,
    },
    {
      id: "bawang",
      category: "Bawang",
      tag: "Hortikultura",
      name: "Bawang Merah",
      status: "Waspada",
      isCritical: false,
      isWarning: true,
      cheapestBadge: "Termurah di Surabaya",
      cheapestSub: "Grosir Keputran",
      marketName: "Pasar Keputran",
      marketSub: "Tegalsari, Surabaya Pusat",
      price: "Rp 32.000",
      unit: "/kg",
      cityAvg: "Rp 35.800",
      delta: "+3.8%",
      deltaIcon: "trending_up",
      deltaClass: "text-status-warning",
      sparkPath: "M0,24 L45,22 L90,20 L135,14 L170,10 L200,8",
      sparkClass: "text-status-warning",
      basketItemName: "Bawang Merah",
      basketItemPrice: 32000,
    },
  ];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [commodities, setCommodities] = useState<CommodityPrice[]>(DEFAULT_COMMODITIES);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [stabilitySummary, setStabilitySummary] = useState<FoodStabilitySummary>({
    stabilityIndex: "100.0%",
    targetText: "Target Kota > 90%",
    isNormal: true,
    statusLabel: "Kondisi Stabil",
    normalCount: 42,
    alertCount: 0,
    alertNote: "Semua Terkendali",
    bannerTitle: "Stabilitas Harga Pangan Terkendali",
    bannerSubtitle: "Pantauan 6 Pasar Resmi Terkini",
    bannerMessage: "Seluruh 6 komoditas bahan pokok di 6 pasar Surabaya terpantau stabil dalam rentang harga wajar tanpa indikasi lonjakan harga ekstrem.",
    hasAlert: false,
  });

  // Dynamic Real Shopping Basket State
  const [basketList, setBasketList] = useState<BasketItem[]>(DEFAULT_BASKET_ITEMS);
  const [basketSim, setBasketSim] = useState<ShoppingBasketSimulation | null>(null);
  const [isBasketLoading, setIsBasketLoading] = useState<boolean>(false);

  // Multi-Commodity 14-Day Trajectory State
  const [trendPasarId, setTrendPasarId] = useState<number>(0);
  const [trendsData, setTrendsData] = useState<MultiCommodityTrendResult | null>(null);
  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({
    beras: true,
    cabai: true,
    bawang: true,
    telur: true,
  });
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      getLiveCommodities(),
      getLiveStabilitySummary(),
    ]).then(([liveData, liveSummary]) => {
      if (liveData && liveData.length > 0) {
        setCommodities(liveData);
        setIsLive(true);
      }
      if (liveSummary) {
        setStabilitySummary(liveSummary);
      }
    });
  }, []);

  // Fetch live 14-day forecast trends for all markets or selected market
  useEffect(() => {
    getLiveMultiCommodityTrends(trendPasarId).then((liveTrends) => {
      if (liveTrends) {
        setTrendsData(liveTrends);
      }
    });
  }, [trendPasarId]);

  // Compute live basket simulation from Supabase on basketList change
  useEffect(() => {
    let isMounted = true;
    setIsBasketLoading(true);
    getLiveShoppingBasket(basketList).then((sim) => {
      if (isMounted) {
        if (sim) setBasketSim(sim);
        setIsBasketLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [basketList]);

  const categories = [
    "Semua",
    "Beras",
    "Minyak Goreng",
    "Cabai",
    "Bawang",
    "Telur",
    "Daging",
  ];

  const handleAddToBasket = (item: CommodityPrice) => {
    const fallbackIdMap: Record<string, number> = {
      beras: 2,
      minyak: 10,
      cabai: 50,
      telur: 16,
      ayam: 13,
      bawang: 39,
    };
    const cid: number = item.komoditas_id || fallbackIdMap[item.id] || 2;
    const meta = COMMODITY_BASKET_META[cid] || {
      icon: "shopping_basket",
      unit: item.unit.replace("/", "") || "kg",
      defaultQty: 1,
      name: item.name,
    };

    setBasketList((prev) => {
      const idx = prev.findIndex((b) => b.komoditas_id === cid);
      if (idx >= 0) {
        const updated = [...prev];
        const step = cid === 50 ? 0.5 : 1;
        updated[idx] = {
          ...updated[idx],
          qty: Number((updated[idx].qty + step).toFixed(1)),
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `item_${cid}`,
            komoditas_id: cid,
            name: item.name,
            icon: meta.icon,
            qty: meta.defaultQty || 1,
            unit: meta.unit,
          },
        ];
      }
    });

    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);

    setResetMessage(`"${item.name}" berhasil ditambahkan ke Keranjang Belanja.`);
    setTimeout(() => setResetMessage(null), 3000);
  };

  const handleUpdateQty = (komoditasId: number, delta: number) => {
    setBasketList((prev) => {
      return prev
        .map((item) => {
          if (item.komoditas_id === komoditasId) {
            const step = item.komoditas_id === 50 ? 0.5 : 1;
            const newQty = Number((item.qty + delta * step).toFixed(1));
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as BasketItem[];
    });
  };

  const handleRemoveItem = (komoditasId: number) => {
    setBasketList((prev) => prev.filter((item) => item.komoditas_id !== komoditasId));
  };

  const handleResetBasket = () => {
    setBasketList(DEFAULT_BASKET_ITEMS);
    setResetMessage("Simulasi keranjang belanja telah diatur ulang ke formula default konsumsi keluarga.");
    setTimeout(() => setResetMessage(null), 3000);
  };

  const handleShareToWhatsApp = () => {
    if (!basketSim) return;
    const itemsText = basketSim.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.name} (${it.qty} ${it.unit}) ~ Rp ${it.itemTotal.toLocaleString("id-ID")}`
      )
      .join("\n");

    const rankText = basketSim.rankings
      .map(
        (r) =>
          `#${r.rank}. ${r.nama_pasar} — Rp ${r.totalBelanja.toLocaleString("id-ID")}${
            r.selisih > 0 ? ` (+Rp ${r.selisih.toLocaleString("id-ID")})` : " (Paling Hemat ⭐)"
          }`
      )
      .join("\n");

    const text = encodeURIComponent(
      `🛒 *Simulasi Belanja Cerdas — HargaWatch Surabaya*\n` +
        `📅 Tanggal Pantauan: ${basketSim.tanggal}\n\n` +
        `*Daftar Belanja:*\n${itemsText}\n\n` +
        `*Ranking Total Belanja di 6 Pasar Tradisional:*\n${rankText}\n\n` +
        `💡 *Estimasi Hemat:* Belanja di *${basketSim.cheapestMarket}* vs *${basketSim.mostExpensiveMarket}* menghemat hingga *Rp ${basketSim.monthlySaving.toLocaleString(
          "id-ID"
        )}/bulan* (pola 4x belanja keluarga).\n\n` +
        `Akses data harga pangan riil Surabaya: https://hargawatch.surabaya.go.id`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleDownloadList = () => {
    if (!basketSim) return;
    const itemsText = basketSim.items
      .map((it, idx) => `${idx + 1}. ${it.name} (${it.qty} ${it.unit}) ~ Rp ${it.itemTotal.toLocaleString("id-ID")}`)
      .join("\n");

    const rankText = basketSim.rankings
      .map(
        (r) =>
          `#${r.rank} ${r.nama_pasar} (${r.wilayah}): Rp ${r.totalBelanja.toLocaleString("id-ID")}${
            r.selisih > 0 ? ` (+Rp ${r.selisih.toLocaleString("id-ID")})` : " [REKOMENDASI TERMURAH]"
          }`
      )
      .join("\n");

    const content =
      `=======================================================\n` +
      `HARGAWATCH SURABAYA - SIMULASI BELANJA PASAR TRADISIONAL\n` +
      `Tanggal Observasi: ${basketSim.tanggal}\n` +
      `=======================================================\n\n` +
      `RINCIAN ITEM BELANJA:\n${itemsText}\n\n` +
      `RANKING TOTAL BELANJA DI 6 PASAR:\n${rankText}\n\n` +
      `ESTIMASI PENGHEMATAN BULANAN (4x Belanja):\n` +
      `Rp ${basketSim.monthlySaving.toLocaleString("id-ID")} / bulan\n` +
      `(Selisih ${basketSim.cheapestMarket} vs ${basketSim.mostExpensiveMarket})\n` +
      `=======================================================\n` +
      `Platform Intelijen Harga Pangan Kota Surabaya\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daftar-belanja-hargawatch-${basketSim.tanggal}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setResetMessage("Daftar belanja berhasil disalin & diunduh ke perangkat Anda.");
    setTimeout(() => setResetMessage(null), 3000);
  };

  const filteredCommodities = commodities.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      q === "" ||
      item.name.toLowerCase().includes(q) ||
      item.marketName.toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q) ||
      (item.tag || "").toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (selectedCategory === "Semua") return true;

    const catLow = selectedCategory.toLowerCase();
    const itemCatLow = (item.category || "").toLowerCase();
    const itemNameLow = (item.name || "").toLowerCase();
    const itemTagLow = (item.tag || "").toLowerCase();

    return (
      itemCatLow.includes(catLow) ||
      itemNameLow.includes(catLow) ||
      itemTagLow.includes(catLow) ||
      (catLow === "cabai" && (itemCatLow.includes("cabe") || itemNameLow.includes("cabe"))) ||
      (catLow === "daging" && (itemCatLow.includes("ayam") || itemNameLow.includes("ayam") || itemNameLow.includes("sapi")))
    );
  });

  const highestSavingItem = [...commodities].sort((a, b) => {
    const diffA = (a.numericCityAvg || 0) - (a.numericPrice || 0);
    const diffB = (b.numericCityAvg || 0) - (b.numericPrice || 0);
    return diffB - diffA;
  })[0] || commodities[0];

  return (
    <div className="bg-surface-canvas text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Header />

      {resetMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-4 py-3 rounded-lg shadow-xl font-body-md flex items-center gap-2">
          <span className="material-symbols-outlined text-body-md">check</span>
          {resetMessage}
        </div>
      )}

      <main className="w-full pt-20 bg-surface-canvas min-h-screen">
        <div className="flex flex-col w-full">
          {/* Sub-Hero Section */}
          <section className="relative w-full bg-surface-card shadow-sm overflow-hidden mb-space-lg">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-fixed/20 blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-surface-variant/30 blur-2xl pointer-events-none"></div>
            <div className="max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop py-space-xl relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg">
                <div className="flex-1 max-w-2xl">
                  <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight mb-space-xs">
                    Pantau Harga Pangan Harian &amp; Belanja Lebih Hemat di Surabaya
                  </h1>
                  <p className="font-body-lg text-body-lg text-text-secondary leading-relaxed">
                    Bandingkan harga harian di 6 pasar tradisional, temukan pasar termurah, dan hitung estimasi pengeluaran dapur hari ini.
                  </p>
                </div>
                {/* Quick Health Summary Card */}
                <div className="w-full lg:w-auto min-w-[320px] bg-surface-canvas rounded-xl p-space-md shadow-sm">
                  <div className="flex items-center justify-between gap-space-sm mb-space-xs">
                    <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                      Indeks Stabilitas Pangan
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-space-xs py-space-2xs rounded-full font-label-caps text-label-caps ${
                        stabilitySummary.isNormal
                          ? "bg-status-normal-bg text-status-normal"
                          : "bg-status-warning-bg text-status-warning"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          stabilitySummary.isNormal
                            ? "bg-status-normal animate-pulse"
                            : "bg-status-warning animate-pulse"
                        }`}
                      ></span>
                      {stabilitySummary.statusLabel}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mb-space-sm">
                    <span className="font-metric-display text-metric-display text-primary">
                      {stabilitySummary.stabilityIndex}
                    </span>
                    <span className="font-label-caps text-label-caps text-text-muted">
                      {stabilitySummary.targetText}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs pt-space-xs bg-surface-card rounded-lg p-space-xs">
                    <div className="flex items-center gap-space-xs">
                      <div className="w-8 h-8 rounded-full bg-status-normal-bg flex items-center justify-center text-status-normal">
                        <span className="material-symbols-outlined text-body-md">check_circle</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-headline-sm text-text-primary">
                          {stabilitySummary.normalCount} Titik
                        </span>
                        <span className="font-label-caps text-label-caps text-text-muted">
                          Harga Normal
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          stabilitySummary.alertCount > 0
                            ? "bg-status-warning-bg text-status-warning"
                            : "bg-status-normal-bg text-status-normal"
                        }`}
                      >
                        <span className="material-symbols-outlined text-body-md">
                          {stabilitySummary.alertCount > 0 ? "warning" : "verified"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`font-headline-sm text-headline-sm ${
                            stabilitySummary.alertCount > 0
                              ? "text-status-warning"
                              : "text-status-normal"
                          }`}
                        >
                          {stabilitySummary.alertCount > 0
                            ? `${stabilitySummary.alertCount} Titik`
                            : "0 Titik"}
                        </span>
                        <span className="font-label-caps text-label-caps text-text-muted truncate max-w-[110px]">
                          {stabilitySummary.alertNote}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Consumer Alert Banner */}
              <div
                className={`mt-space-lg rounded-xl p-space-sm sm:p-space-md flex items-start sm:items-center justify-between gap-space-sm ${
                  stabilitySummary.hasAlert ? "bg-status-warning-bg" : "bg-status-normal-bg/60 border border-status-normal/20"
                }`}
              >
                <div className="flex items-start sm:items-center gap-space-sm">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      stabilitySummary.hasAlert
                        ? "bg-status-warning text-white"
                        : "bg-status-normal text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-title-md">
                      {stabilitySummary.hasAlert ? "notifications_active" : "verified"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span
                        className={`font-label-caps text-label-caps uppercase font-semibold ${
                          stabilitySummary.hasAlert ? "text-status-warning" : "text-status-normal"
                        }`}
                      >
                        {stabilitySummary.bannerTitle}
                      </span>
                      <span className="font-body-sm text-body-sm text-text-muted hidden sm:inline">•</span>
                      <span className="font-label-caps text-label-caps text-text-secondary">
                        {stabilitySummary.bannerSubtitle}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-text-primary mt-0.5">
                      {stabilitySummary.bannerMessage}
                    </p>
                  </div>
                </div>
                <a
                  className={`hidden md:inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold hover:underline shrink-0 ${
                    stabilitySummary.hasAlert ? "text-status-warning" : "text-status-normal"
                  }`}
                  href={stabilitySummary.hasAlert ? "/early-warning" : "#grafik-tren"}
                >
                  {stabilitySummary.hasAlert ? "Cek Detail Risiko EWS" : "Cek Tren Harga"}
                  <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
                </a>
              </div>
            </div>
          </section>

          {/* Main Content 2-Column Split: Best Price Finder (60%) vs Smart Shopping Basket (40%) */}
          <section className="max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop w-full mb-space-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* LEFT COLUMN: Best Price Finder (lg:col-span-7) */}
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                {/* Filter & Search Toolbar */}
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                    <div>
                      <h2 className="font-headline-md text-headline-md text-text-primary">Best Price Finder</h2>
                      <p className="font-body-sm text-body-sm text-text-secondary">
                        Rekomendasi pasar paling hemat se-Surabaya hari ini
                      </p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <input
                        className="w-full h-10 bg-surface-subtle text-text-primary placeholder-text-muted font-body-sm text-body-sm pl-9 pr-3 rounded-md focus:outline-none focus:bg-surface-card"
                        id="commodity-search"
                        placeholder="Cari bahan pokok..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-body-md">
                        search
                      </span>
                    </div>
                  </div>
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-space-2xs overflow-x-auto pb-1 no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-space-sm py-space-2xs rounded-full font-body-sm text-body-sm whitespace-nowrap transition-colors ${
                          selectedCategory === cat
                            ? "bg-primary-container text-on-primary active-category"
                            : "bg-surface-subtle text-text-secondary hover:bg-surface-variant/40"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commodity Cards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md" id="commodity-grid">
                  {filteredCommodities.map((item) => (
                    <div
                      key={item.id}
                      className="bg-surface-card rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                    >
                      {item.isCritical && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-status-critical"></div>
                      )}
                      <div>
                        <div className="flex items-start justify-between gap-space-xs mb-space-xs">
                          <div>
                            <span
                              className={`font-label-caps text-label-caps uppercase ${
                                item.isCritical
                                  ? "text-status-critical font-semibold"
                                  : item.isWarning
                                  ? "text-status-warning font-semibold"
                                  : "text-text-muted"
                              }`}
                            >
                              {item.tag}
                            </span>
                            <h3 className="font-title-md text-title-md text-text-primary">{item.name}</h3>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-space-xs py-space-2xs rounded-full font-label-caps text-label-caps ${
                              item.isCritical
                                ? "bg-status-critical-bg text-status-critical"
                                : item.isWarning
                                ? "bg-status-warning-bg text-status-warning"
                                : "bg-status-normal-bg text-status-normal"
                            }`}
                          >
                            {item.isCritical ? (
                              <span className="material-symbols-outlined text-body-sm">warning</span>
                            ) : (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.isWarning ? "bg-status-warning" : "bg-status-normal"
                                }`}
                              ></span>
                            )}
                            {item.status}
                          </span>
                        </div>
                        <div
                          className={`rounded-lg p-space-xs mb-space-sm ${
                            item.isCritical ? "bg-status-warning-bg" : "bg-surface-subtle"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-label-caps text-label-caps text-text-secondary">
                              {item.cheapestBadge}
                            </span>
                            <span
                              className={`font-label-caps text-label-caps font-semibold ${
                                item.isCritical ? "text-status-critical" : "text-status-normal"
                              }`}
                            >
                              {item.cheapestSub}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="font-body-md text-body-md font-semibold text-primary">
                                {item.marketName}
                              </span>
                              <p
                                className={`font-label-caps text-label-caps ${
                                  item.isCritical ? "text-status-critical" : "text-text-muted"
                                }`}
                              >
                                {item.marketSub}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-metric-value text-metric-value text-text-primary">
                                {item.price}
                              </span>
                              <span className="font-body-sm text-body-sm text-text-muted">{item.unit}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-text-secondary font-body-sm text-body-sm mb-space-sm pt-1">
                          <span>
                            Rata-rata Kota:{" "}
                            <strong className="font-metric-delta text-text-primary">{item.cityAvg}</strong>
                          </span>
                          <span
                            className={`inline-flex items-center font-metric-delta text-metric-delta ${item.deltaClass}`}
                          >
                            <span className="material-symbols-outlined text-body-sm mr-0.5">
                              {item.deltaIcon}
                            </span>
                            {item.delta}
                          </span>
                        </div>
                        {/* Sparkline Visual */}
                        <div className="w-full h-8 mb-space-sm">
                          <svg
                            className={`w-full h-full ${item.sparkClass}`}
                            preserveAspectRatio="none"
                            viewBox="0 0 200 32"
                          >
                            <path
                              d={item.sparkPath}
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeWidth="2"
                            ></path>
                          </svg>
                        </div>
                      </div>
                      <button
                        className={`w-full py-2 font-body-sm text-body-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          addedItems[item.id]
                            ? "bg-primary text-on-primary"
                            : "bg-surface-subtle hover:bg-primary hover:text-on-primary text-text-primary"
                        }`}
                        onClick={() => handleAddToBasket(item)}
                      >
                        <span className="material-symbols-outlined text-body-md">
                          {addedItems[item.id] ? "check" : "add_shopping_cart"}
                        </span>
                        {addedItems[item.id] ? "Ditambahkan!" : "+ Masukkan Keranjang"}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Data-Driven Strategic Buying Insight */}
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col sm:flex-row items-center gap-space-md mt-space-xs border border-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Aktivitas Pasar Tradisional Surabaya"
                    className="w-full sm:w-36 h-28 rounded-lg object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU4KGhZnWEhwLnkUcGkN7FfrjtTBmI7s9dDXzMdZBGDzk6UNil3-jRcsPlCiPzkQO3IQDWq9-t7N-LU1Yvib2THuq86ihHqTCmaKT79s0tNulOBcrLkQW1ZDUl77sbEjrxPLuhimAy2DiE1aaO8VZzkViHI3hMxRjuIQyMToJkZffRwOBWpuupknXOqXSi8ZOY1cMqmlH8ZZF6-hzHlTisiVkVQpBtZD7mOtKo9xgEjjbBRDhB1zGo"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-normal"></span>
                        Disparitas Tertinggi: {highestSavingItem.name}
                      </span>
                      <span className="font-label-caps text-label-caps text-text-muted">
                        {highestSavingItem.cheapestSub}
                      </span>
                    </div>
                    <h4 className="font-title-md text-title-md text-text-primary mb-1">
                      Strategi Belanja Cerdas di {highestSavingItem.marketName}
                    </h4>
                    <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                      {highestSavingItem.marketName} saat ini mencatat harga terendah {highestSavingItem.price}{highestSavingItem.unit} dibanding rata-rata kota ({highestSavingItem.cityAvg}). Sebagai pusat kulakan utama Surabaya, aktivitas transaksi dini hari (00.00 – 05.00 WIB) saat truk pasokan tani tiba memberikan selisih harga paling menguntungkan sebelum didistribusikan ke pasar ritel lingkungan.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Smart Shopping Basket (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-space-md sticky top-24">
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm">
                  {/* Basket Header */}
                  <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-subtle -mx-space-md -mt-space-md p-space-md rounded-t-xl">
                    <div className="flex items-center gap-space-xs">
                      <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-title-md">shopping_basket</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-text-primary">Smart Shopping Basket</h3>
                        <p className="font-label-caps text-label-caps text-text-secondary">
                          Kalkulator Simulasi Belanja Keluarga
                        </p>
                      </div>
                    </div>
                    <button
                      className="font-label-caps text-label-caps text-text-muted hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
                      onClick={handleResetBasket}
                      title="Atur ulang simulasi keranjang"
                    >
                      <span className="material-symbols-outlined text-body-sm">restart_alt</span> Reset
                    </button>
                  </div>

                  {/* Basket Itemized List */}
                  {basketList.length === 0 ? (
                    <div className="p-4 text-center bg-surface-canvas rounded-lg mb-space-md">
                      <span className="material-symbols-outlined text-text-muted text-title-lg block mb-1">remove_shopping_cart</span>
                      <p className="font-body-sm text-text-muted mb-2">Keranjang belanja kosong.</p>
                      <button
                        onClick={handleResetBasket}
                        className="px-3 py-1 bg-primary text-on-primary rounded text-label-caps font-semibold cursor-pointer"
                      >
                        Muat Ulang Keranjang Default
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-space-md">
                      {(basketSim?.items || basketList.map((b) => ({ ...b, itemTotal: 0 }))).map((item) => (
                        <div
                          key={item.id || item.komoditas_id}
                          className="flex items-center justify-between p-space-xs rounded-lg bg-surface-canvas text-body-sm font-body-sm hover:bg-surface-subtle/70 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-text-muted text-body-md shrink-0">
                              {item.icon}
                            </span>
                            <span className="text-text-primary font-medium truncate">{item.name}</span>
                          </div>

                          <div className="flex items-center gap-space-xs shrink-0">
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-surface-subtle rounded border border-border-subtle">
                              <button
                                onClick={() => handleUpdateQty(item.komoditas_id, -1)}
                                className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-variant/40 rounded-l cursor-pointer text-body-sm font-bold"
                                title="Kurangi"
                              >
                                -
                              </button>
                              <span className="px-1.5 py-0.5 font-metric-delta text-text-secondary text-xs min-w-[42px] text-center">
                                {item.qty} {item.unit}
                              </span>
                              <button
                                onClick={() => handleUpdateQty(item.komoditas_id, 1)}
                                className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-variant/40 rounded-r cursor-pointer text-body-sm font-bold"
                                title="Tambah"
                              >
                                +
                              </button>
                            </div>

                            {/* Estimated subtotal across city */}
                            {item.itemTotal > 0 && (
                              <span className="font-metric-value text-body-md text-text-primary w-20 text-right">
                                Rp {item.itemTotal.toLocaleString("id-ID")}
                              </span>
                            )}

                            {/* Delete button */}
                            <button
                              onClick={() => handleRemoveItem(item.komoditas_id)}
                              className="text-text-muted hover:text-error transition-colors p-1 cursor-pointer"
                              title="Hapus dari keranjang"
                            >
                              <span className="material-symbols-outlined text-body-sm">close</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Market Ranking Comparison List */}
                  <div className="mb-space-md">
                    <div className="flex items-center justify-between gap-1 mb-space-xs">
                      <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                        Ranking Total Belanja di 6 Pasar
                      </span>
                    </div>

                    {isBasketLoading ? (
                      <div className="space-y-2 py-4 text-center text-text-muted text-body-sm">
                        <span className="material-symbols-outlined animate-spin align-middle mr-1">sync</span>
                        Menghitung simulasi 6 pasar...
                      </div>
                    ) : basketSim?.rankings && basketSim.rankings.length > 0 ? (
                      <div className="space-y-2">
                        {basketSim.rankings.map((m) => {
                          const isFirst = m.rank === 1;
                          return (
                            <div
                              key={m.pasar_id}
                              className={`p-space-xs rounded-lg flex items-center justify-between transition-all ${
                                isFirst
                                  ? "bg-status-normal-bg border border-status-normal/30 shadow-xs"
                                  : "bg-surface-canvas"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center font-metric-delta text-metric-delta ${
                                    isFirst
                                      ? "bg-status-normal text-white"
                                      : "bg-surface-subtle text-text-secondary"
                                  }`}
                                >
                                  #{m.rank}
                                </span>
                                <div>
                                  <span
                                    className={`font-body-md text-body-md ${
                                      isFirst ? "font-semibold text-text-primary" : "font-medium text-text-primary"
                                    }`}
                                  >
                                    {m.nama_pasar}
                                  </span>
                                  <span
                                    className={`block font-label-caps text-label-caps ${
                                      isFirst ? "text-status-normal font-semibold" : "text-text-muted"
                                    }`}
                                  >
                                    {isFirst ? "Rekomendasi Terbaik • Termurah" : m.wilayah}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`font-metric-value ${
                                    isFirst
                                      ? "text-metric-value text-status-normal"
                                      : "text-body-md text-text-primary"
                                  }`}
                                >
                                  Rp {m.totalBelanja.toLocaleString("id-ID")}
                                </span>
                                <span
                                  className={`block font-label-caps text-label-caps ${
                                    isFirst
                                      ? "text-status-normal font-semibold"
                                      : m.rank === basketSim.rankings.length
                                      ? "text-status-critical"
                                      : "text-text-secondary"
                                  }`}
                                >
                                  {isFirst ? "Paling Hemat" : `+Rp ${m.selisih.toLocaleString("id-ID")}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-text-muted text-body-sm text-center py-2">
                        Pilih item untuk melihat ranking pasar.
                      </div>
                    )}
                  </div>

                  {/* Monthly Savings Breakdown Card */}
                  {basketSim && basketSim.monthlySaving > 0 && (
                    <div className="bg-primary-fixed/25 rounded-xl p-space-sm mb-space-md flex items-center gap-space-sm border border-primary/20">
                      <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-title-md">savings</span>
                      </div>
                      <div>
                        <span className="font-label-caps text-label-caps text-on-primary-fixed font-semibold uppercase">
                          Estimasi Penghematan Bulanan
                        </span>
                        <p className="font-body-sm text-body-sm text-on-primary-fixed-variant">
                          Belanja di <strong>{basketSim.cheapestMarket}</strong> vs <strong>{basketSim.mostExpensiveMarket}</strong> menghemat hingga{" "}
                          <strong className="text-primary font-headline-sm">
                            Rp {basketSim.monthlySaving.toLocaleString("id-ID")}/bulan
                          </strong>{" "}
                          untuk pola konsumsi 4x belanja keluarga.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      className="w-full py-3 bg-[#25D366] text-white rounded-lg font-body-md text-body-md font-semibold flex items-center justify-center gap-2 hover:opacity-95 shadow-sm transition-opacity cursor-pointer"
                      onClick={handleShareToWhatsApp}
                    >
                      <span className="material-symbols-outlined text-title-md">share</span>
                      Bagikan Rincian Belanja ke WhatsApp
                    </button>
                    <button
                      className="w-full py-2 bg-surface-subtle hover:bg-surface-variant/50 text-text-secondary rounded-lg font-body-sm text-body-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      onClick={handleDownloadList}
                    >
                      <span className="material-symbols-outlined text-body-md">download_for_offline</span>
                      Simpan Daftar Belanja (Catatan)
                    </button>
                  </div>
                </div>

                {/* Real Market Distribution & Logistics Profile */}
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-title-md">storefront</span>
                    <div>
                      <h4 className="font-title-sm text-title-sm text-text-primary">Struktur Logistik 6 Pasar Pantauan</h4>
                      <p className="font-label-caps text-label-caps text-text-muted">Profil Jalur Pasokan Komoditas Surabaya</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-body-sm text-text-secondary">
                    <div className="p-2 rounded bg-surface-canvas flex items-start gap-2">
                      <span className="material-symbols-outlined text-status-normal text-body-md mt-0.5">local_shipping</span>
                      <div>
                        <strong className="text-text-primary block text-xs">Pasar Induk Keputran (Pusat Sayur Dini Hari)</strong>
                        <span className="text-[11px] leading-tight block">Menerima pasokan sayur &amp; cabai langsung dari petani Jatim pukul 00.00 – 05.00 WIB dengan harga grosir terendah.</span>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-surface-canvas flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary text-body-md mt-0.5">inventory_2</span>
                      <div>
                        <strong className="text-text-primary block text-xs">Pasar Tambahrejo &amp; Soponyono (Bahan Kering)</strong>
                        <span className="text-[11px] leading-tight block">Titik efisiensi harga terbaik untuk beras medium/premium, minyak goreng, dan bawang merah di wilayah utara dan timur.</span>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-surface-canvas flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-body-md mt-0.5">egg</span>
                      <div>
                        <strong className="text-text-primary block text-xs">Wonokromo, Genteng &amp; Pucang Anom (Ritel Sentral)</strong>
                        <span className="text-[11px] leading-tight block">Pasar sentral konsumen akhir dengan pasokan protein (daging sapi, ayam, telur) lengkap dan stabil.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Section: Grafik Tren Harga 14 Hari Konsumen */}
          <section className="max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop w-full mb-space-2xl" id="grafik-tren">
            <div className="bg-surface-card rounded-xl p-space-md lg:p-space-lg shadow-sm">
              {/* Header: Title & Market Selector */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-space-md mb-space-md">
                <div>
                  <div className="flex items-center gap-space-xs mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                      Grafik Tren Harga (14 Hari: Observasi &amp; Model Proyeksi)
                    </span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-text-primary">
                    Dinamika Harga Komoditas Pokok
                  </h2>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                    {trendPasarId === 0
                      ? "Rata-rata harga riil & trajektori model dari seluruh 6 pasar pantauan di Surabaya per kilogram"
                      : `Data harga riil & trajektori model spesifik untuk ${
                          trendPasarId === 5 ? "Pasar Keputran (Grosir Induk)" :
                          trendPasarId === 1 ? "Pasar Tambahrejo" :
                          trendPasarId === 2 ? "Pasar Wonokromo" :
                          trendPasarId === 4 ? "Pasar Pucang Anom" :
                          trendPasarId === 3 ? "Pasar Genteng" : "Pasar Soponyono (Rungkut)"
                        }`}
                  </p>
                </div>

                {/* Market Selector Filter */}
                <div className="flex items-center gap-2 bg-surface-subtle px-3 py-1.5 rounded-lg border border-border-subtle self-start sm:self-auto shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-text-secondary text-base">storefront</span>
                  <select
                    value={trendPasarId}
                    onChange={(e) => setTrendPasarId(Number(e.target.value))}
                    className="bg-transparent text-xs font-semibold text-text-primary focus:outline-none cursor-pointer pr-1"
                    title="Pilih pasar untuk melihat trajektori harga spesifik"
                  >
                    <option value={0}>Semua Pasar (Rata-rata Surabaya)</option>
                    <option value={5}>Pasar Keputran (Grosir)</option>
                    <option value={1}>Pasar Tambahrejo</option>
                    <option value={2}>Pasar Wonokromo</option>
                    <option value={4}>Pasar Pucang Anom</option>
                    <option value={3}>Pasar Genteng</option>
                    <option value={146}>Pasar Soponyono (Rungkut)</option>
                  </select>
                </div>
              </div>

              {/* Sub-toolbar: Clean Commodity Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md pt-space-xs border-t border-border-subtle/60">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-label-caps text-[11px] text-text-muted uppercase tracking-wider">
                    Filter:
                  </span>
                  {[
                    { id: "beras", name: "Beras Premium", color: "#004328" },
                    { id: "cabai", name: "Cabai Rawit", color: "#DC2626" },
                    { id: "bawang", name: "Bawang Merah", color: "#D97706" },
                    { id: "telur", name: "Telur Ayam", color: "#4F46E5" },
                  ].map((s) => {
                    const isActive = activeSeries[s.id];
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveSeries((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? "bg-surface-subtle text-text-primary shadow-xs border border-border-subtle hover:bg-surface-card"
                            : "bg-surface-subtle/30 text-text-muted opacity-40 line-through border border-transparent"
                        }`}
                        title={`Klik untuk ${isActive ? "menyembunyikan" : "menampilkan"} ${s.name}`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        ></span>
                        <span>{s.name}</span>
                      </button>
                    );
                  })}
                </div>

                <span className="text-[11px] text-text-muted hidden sm:inline-block">
                  Sumbu harga menyesuaikan otomatis
                </span>
              </div>

              {/* Dynamic Multi-Line SVG Chart Canvas */}
              {(() => {
                const dates = trendsData?.dates || [
                  "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01",
                  "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05",
                  "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09",
                  "2026-10-10", "2026-10-11"
                ];
                const formattedDates = trendsData?.formattedDates || [
                  "28 Sep", "29 Sep", "30 Sep", "01 Okt",
                  "02 Okt", "03 Okt", "04 Okt", "05 Okt",
                  "06 Okt", "07 Okt", "08 Okt", "09 Okt",
                  "10 Okt", "11 Okt"
                ];

                const fallbackSeries = [
                  {
                    id: "beras",
                    name: "Beras Premium",
                    color: "#004328",
                    points: dates.map((dt) => ({ tanggal: dt, price: 16375 })),
                  },
                  {
                    id: "cabai",
                    name: "Cabai Rawit",
                    color: "#DC2626",
                    points: dates.map((dt, idx) => ({
                      tanggal: dt,
                      price: [60288, 60295, 59442, 59446, 59664, 58676, 57988, 58401, 58087, 57475, 55918, 53739, 52726, 52305][idx] || 60000,
                    })),
                  },
                  {
                    id: "bawang",
                    name: "Bawang Merah",
                    color: "#D97706",
                    points: dates.map((dt, idx) => ({
                      tanggal: dt,
                      price: [30565, 30540, 30284, 30243, 30447, 30418, 30579, 30603, 30520, 30472, 30586, 30685, 30693, 30714][idx] || 30500,
                    })),
                  },
                  {
                    id: "telur",
                    name: "Telur Ayam",
                    color: "#4F46E5",
                    strokeDash: "6 3",
                    points: dates.map((dt, idx) => ({
                      tanggal: dt,
                      price: [25647, 25654, 25641, 25628, 25655, 25619, 25649, 25655, 25674, 25749, 25656, 25712, 25765, 25778][idx] || 25600,
                    })),
                  },
                ];

                const seriesToRender = (trendsData?.series || fallbackSeries).map((s) => ({
                  ...s,
                  points: s.points.map((pt, i) => ({
                    ...pt,
                    formattedDate: formattedDates[i] || pt.tanggal,
                  })),
                }));

                const totalPoints = dates.length;
                const getX = (idx: number) => 60 + (idx / Math.max(1, totalPoints - 1)) * 710;

                // Dynamic Y-Scale calculated from active visible series to show real patahan & nuances
                const activePoints = seriesToRender
                  .filter((s) => activeSeries[s.id])
                  .flatMap((s) => s.points.map((p) => p.price))
                  .filter((p) => p > 0);

                const dataMin = activePoints.length > 0 ? Math.min(...activePoints) : 15000;
                const dataMax = activePoints.length > 0 ? Math.max(...activePoints) : 65000;
                const rawRange = Math.max(1500, dataMax - dataMin);
                const pad = Math.round(rawRange * 0.12);
                const yMin = Math.max(0, Math.floor((dataMin - pad) / 1000) * 1000);
                const yMax = Math.ceil((dataMax + pad) / 1000) * 1000;
                const yRange = Math.max(1000, yMax - yMin);

                const getY = (price: number) => {
                  const clamped = Math.max(yMin, Math.min(yMax, price));
                  return 190 - ((clamped - yMin) / yRange) * 160;
                };

                const gridLevels = [
                  { y: 30, val: yMax },
                  { y: 83, val: Math.round(yMin + yRange * 0.67) },
                  { y: 137, val: Math.round(yMin + yRange * 0.33) },
                  { y: 190, val: yMin },
                ];

                const formatY = (val: number) => {
                  if (val >= 1000) {
                    const k = val / 1000;
                    return `Rp ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
                  }
                  return `Rp ${val}`;
                };

                const todayIdx = dates.indexOf("2026-10-04") >= 0 ? dates.indexOf("2026-10-04") : 6;
                const todayX = getX(todayIdx);

                const activeHoverPoint = hoveredPointIndex !== null ? {
                  idx: hoveredPointIndex,
                  x: getX(hoveredPointIndex),
                  dateStr: formattedDates[hoveredPointIndex],
                  isForecast: hoveredPointIndex > todayIdx,
                  prices: seriesToRender
                    .filter((s) => activeSeries[s.id])
                    .map((s) => ({
                      id: s.id,
                      name: s.id === "beras" ? "Beras" : s.id === "cabai" ? "Cabai" : s.id === "bawang" ? "Bawang" : "Telur",
                      color: s.color,
                      price: s.points[hoveredPointIndex]?.price || 0,
                      y: getY(s.points[hoveredPointIndex]?.price || 0),
                    })),
                } : null;

                return (
                  <div className="w-full relative bg-surface-canvas rounded-xl p-space-md mb-space-md select-none">
                    {/* Hover Tooltip Box */}
                    {activeHoverPoint && (
                      <div
                        className="absolute z-20 pointer-events-none bg-surface-card/95 backdrop-blur-md border border-border-subtle p-2.5 rounded-lg shadow-lg text-xs"
                        style={{
                          left: `${Math.min(78, Math.max(8, (activeHoverPoint.x / 800) * 100))}%`,
                          top: "12px",
                        }}
                      >
                        <div className="font-semibold text-text-primary flex items-center gap-1.5 mb-1 pb-1 border-b border-border-subtle">
                          <span>{activeHoverPoint.dateStr}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] ${
                              activeHoverPoint.isForecast
                                ? "bg-primary-container text-on-primary"
                                : "bg-status-normal-bg text-status-normal"
                            }`}
                          >
                            {activeHoverPoint.isForecast ? "Prediksi Model" : "Observasi Riil"}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {activeHoverPoint.prices.map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-3 text-text-secondary">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                                {p.name}:
                              </span>
                              <strong className="text-text-primary">Rp {p.price.toLocaleString("id-ID")}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div
                      className="w-full h-64 sm:h-80 cursor-crosshair"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const mouseX = e.clientX - rect.left;
                        const svgX = (mouseX / rect.width) * 800;
                        if (svgX >= 50 && svgX <= 780) {
                          const idx = Math.round(((svgX - 60) / 710) * (totalPoints - 1));
                          const clamped = Math.max(0, Math.min(totalPoints - 1, idx));
                          setHoveredPointIndex(clamped);
                        }
                      }}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    >
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 240">
                        {/* Dynamic Horizontal Grid Lines & Y-Labels */}
                        {gridLevels.map((lvl, idx) => (
                          <g key={idx}>
                            <line
                              stroke="#E2E8F0"
                              strokeDasharray={idx === 3 ? undefined : "4 4"}
                              strokeWidth="1"
                              x1="55"
                              x2="780"
                              y1={lvl.y}
                              y2={lvl.y}
                            />
                            <text
                              className="fill-[#94A3B8] font-metric-delta text-[10px]"
                              x="8"
                              y={lvl.y + 3.5}
                            >
                              {formatY(lvl.val)}
                            </text>
                          </g>
                        ))}

                        {/* Vertical Indicator Line for Today (04 Okt) */}
                        <line
                          stroke="#10B981"
                          strokeDasharray="4 3"
                          strokeWidth="1.5"
                          x1={todayX}
                          x2={todayX}
                          y1="18"
                          y2="190"
                        ></line>
                        <text
                          className="fill-status-normal font-label-caps text-[9px] font-bold"
                          textAnchor="middle"
                          x={todayX}
                          y="14"
                        >
                          Observasi Terkini (04 Okt)
                        </text>

                        {/* Trajectory Polyline Paths & Node Markers (Titik Penanda) */}
                        {seriesToRender.map((s) => {
                          if (!activeSeries[s.id]) return null;
                          const pathString = s.points
                            .map((pt, i) => `${i === 0 ? "M" : "L"}${getX(i).toFixed(1)},${getY(pt.price).toFixed(1)}`)
                            .join(" ");

                          return (
                            <g key={s.id}>
                              {/* Refined segmented line path for realistic slope breaks (patahan) */}
                              <path
                                d={pathString}
                                fill="none"
                                stroke={s.color}
                                strokeDasharray={s.strokeDash}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.75"
                              ></path>

                              {/* Data Markers (Titik Penanda) on Every Single Date */}
                              {s.points.map((pt, i) => {
                                const isToday = i === todayIdx;
                                const isForecast = i > todayIdx;
                                const cx = getX(i);
                                const cy = getY(pt.price);
                                return (
                                  <g key={i}>
                                    {isToday && (
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r="6"
                                        fill={s.color}
                                        opacity="0.2"
                                      />
                                    )}
                                    <circle
                                      cx={cx}
                                      cy={cy}
                                      r={isToday ? 4 : 2.5}
                                      fill={isForecast ? "#FFFFFF" : s.color}
                                      stroke={s.color}
                                      strokeWidth={isForecast ? 1.5 : 1}
                                      className="cursor-pointer transition-all"
                                    >
                                      <title>{`${s.name} (${pt.formattedDate}): Rp ${pt.price.toLocaleString("id-ID")}`}</title>
                                    </circle>
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })}

                        {/* Interactive Tracking Hover Line & Dots */}
                        {activeHoverPoint && (
                          <g>
                            <line
                              stroke="#64748B"
                              strokeDasharray="2 2"
                              strokeWidth="1"
                              x1={activeHoverPoint.x}
                              x2={activeHoverPoint.x}
                              y1="22"
                              y2="190"
                            ></line>
                            {activeHoverPoint.prices.map((p) => (
                              <circle
                                key={p.id}
                                cx={activeHoverPoint.x}
                                cy={p.y}
                                fill={p.color}
                                r="5"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                              ></circle>
                            ))}
                          </g>
                        )}
                      </svg>
                    </div>

                    {/* X-Axis Timeline Labels */}
                    <div className="flex justify-between items-center text-text-muted font-label-caps text-label-caps pt-2 px-6 overflow-hidden">
                      <span>{formattedDates[0]}</span>
                      <span>{formattedDates[2]}</span>
                      <span>{formattedDates[4]}</span>
                      <span className="text-status-normal font-bold">
                        {formattedDates[todayIdx]} (Hari Ini)
                      </span>
                      <span>{formattedDates[8]}</span>
                      <span>{formattedDates[10]}</span>
                      <span>{formattedDates[totalPoints - 1]} (Proyeksi)</span>
                    </div>
                  </div>
                );
              })()}

              {/* Clean Footer Metadata & Source Integrity (Badge Supabase removed as requested) */}
              <div className="flex items-center gap-space-xs pt-space-xs text-text-secondary font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-status-normal text-body-md">
                  verified_user
                </span>
                <span>Data agregasi riil dari 6 pasar tradisional Kota Surabaya (Tambahrejo, Wonokromo, Genteng, Pucang Anom, Keputran, Soponyono).</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
