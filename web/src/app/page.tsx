"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getLiveCommodities,
  getLiveStabilitySummary,
  getLiveShoppingBasket,
  getLiveMarketComparisonTrends,
  DEFAULT_BASKET_ITEMS,
  COMMODITY_BASKET_META,
  CommodityPrice,
  FoodStabilitySummary,
  BasketItem,
  ShoppingBasketSimulation,
  MarketTrendComparisonResult,
  TREND_MARKET_CONFIGS,
  AVAILABLE_TREND_COMMODITIES,
  ALL_CATALOG_COMMODITIES,
  CatalogCommodity,
} from "@/lib/dataService";
import CommodityIcon from "@/components/CommodityIcon";
import CommoditySearchSelect from "@/components/CommoditySearchSelect";

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
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [loadingCommodities, setLoadingCommodities] = useState<boolean>(true);
  const [errorCommodities, setErrorCommodities] = useState<boolean>(false);
  const [stabilitySummary, setStabilitySummary] = useState<FoodStabilitySummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);

  // Dynamic Real Shopping Basket State
  const [basketList, setBasketList] = useState<BasketItem[]>(DEFAULT_BASKET_ITEMS);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [basketSim, setBasketSim] = useState<ShoppingBasketSimulation | null>(null);
  const [isBasketLoading, setIsBasketLoading] = useState<boolean>(false);
  const [showFloatingBasket, setShowFloatingBasket] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const activeBasketList = useMemo(() => {
    return basketList.filter((b) => checkedItems[b.komoditas_id] !== false);
  }, [basketList, checkedItems]);

  // Multi-Commodity 14-Day Trajectory State
  // Per-Market 14-Day Trajectory Comparison for Selected Commodity
  const [trendCommodityId, setTrendCommodityId] = useState<number>(50); // Default: Cabai Rawit Merah
  const [marketTrendsData, setMarketTrendsData] = useState<MarketTrendComparisonResult | null>(null);
  const [loadingTrends, setLoadingTrends] = useState<boolean>(true);
  const [errorTrends, setErrorTrends] = useState<boolean>(false);
  const [activeMarkets, setActiveMarkets] = useState<Record<string, boolean>>({
    keputran: true,
    wonokromo: true,
    genteng: true,
    pucanganom: true,
    tambahrejo: true,
    soponyono: true,
  });
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [highlightedMarketId, setHighlightedMarketId] = useState<string | null>(null);

  const loadMainData = async () => {
    setLoadingCommodities(true);
    setLoadingSummary(true);
    setErrorCommodities(false);
    try {
      const [liveData, liveSummary] = await Promise.all([
        getLiveCommodities(),
        getLiveStabilitySummary(),
      ]);
      if (liveData && liveData.length > 0) {
        setCommodities(liveData);
        setIsLive(true);
        setErrorCommodities(false);
      } else {
        setErrorCommodities(true);
      }
      if (liveSummary) {
        setStabilitySummary(liveSummary);
      }
    } catch {
      setErrorCommodities(true);
    } finally {
      setLoadingCommodities(false);
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadMainData();
  }, []);

  // Monitor scroll: floating basket appears only when truly inside Best Price Finder and disappears once scrolled past
  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById("best-price-finder-section");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Baru muncul saat benar-benar masuk ke area Best Price Finder (bagian atas mendekati atas layar)
      // dan otomatis menghilang saat sudah melewati bagian bawahnya
      const hasEntered = rect.top <= 220;
      const hasPassed = rect.bottom <= 120;
      setShowFloatingBasket(hasEntered && !hasPassed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Fetch live 14-day forecast trends comparing all 6 markets for the selected commodity
  const loadTrends = (commodityId: number) => {
    setLoadingTrends(true);
    setErrorTrends(false);
    getLiveMarketComparisonTrends(commodityId)
      .then((liveTrends) => {
        if (liveTrends && liveTrends.series && liveTrends.series.length > 0) {
          setMarketTrendsData(liveTrends);
          setErrorTrends(false);
        } else {
          setErrorTrends(true);
        }
      })
      .catch(() => setErrorTrends(true))
      .finally(() => setLoadingTrends(false));
  };

  useEffect(() => {
    loadTrends(trendCommodityId);
  }, [trendCommodityId]);

  // Compute live basket simulation from Supabase on activeBasketList change
  useEffect(() => {
    let isMounted = true;
    if (activeBasketList.length === 0) {
      setBasketSim(null);
      setIsBasketLoading(false);
      return;
    }
    setIsBasketLoading(true);
    getLiveShoppingBasket(activeBasketList).then((sim) => {
      if (isMounted) {
        if (sim) setBasketSim(sim);
        setIsBasketLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeBasketList]);

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

    setCheckedItems((prev) => ({ ...prev, [cid]: true }));
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);

    setResetMessage(`"${item.name}" berhasil ditambahkan ke Keranjang Belanja.`);
    setTimeout(() => setResetMessage(null), 3000);
  };

  const allChecked =
    basketList.length > 0 && basketList.every((b) => checkedItems[b.komoditas_id] !== false);

  const handleToggleCheck = (komoditasId: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [komoditasId]: prev[komoditasId] === false ? true : false,
    }));
  };

  const handleToggleAll = () => {
    const nextVal = !allChecked;
    const newChecked: Record<number, boolean> = {};
    basketList.forEach((b) => {
      newChecked[b.komoditas_id] = nextVal;
    });
    setCheckedItems(newChecked);
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
    setCheckedItems({});
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

  const highestSavingItem = useMemo(() => {
    if (commodities.length === 0) return null;
    return [...commodities].sort((a, b) => {
      const diffA = (a.numericCityAvg || 0) - (a.numericPrice || 0);
      const diffB = (b.numericCityAvg || 0) - (b.numericPrice || 0);
      return diffB - diffA;
    })[0] || null;
  }, [commodities]);

  const selectedCommodityMeta =
    ALL_CATALOG_COMMODITIES.find((c) => c.id === trendCommodityId) ||
    AVAILABLE_TREND_COMMODITIES[0];

  return (
    <div className="bg-surface-canvas text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Header />

      {resetMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-4 py-3 rounded-lg shadow-xl font-body-md flex items-center gap-2">
          <span className="material-symbols-outlined text-body-md">check</span>
          {resetMessage}
        </div>
      )}

      <main className="w-full pt-20 bg-surface-canvas flex-1">
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
                {loadingSummary || !stabilitySummary ? (
                  <div className="w-full lg:w-auto min-w-[320px] bg-surface-canvas rounded-xl p-space-md shadow-sm border border-border-subtle/50 animate-pulse">
                    <div className="flex items-center justify-between gap-space-sm mb-space-xs">
                      <div className="h-3.5 w-36 bg-surface-subtle rounded" />
                      <div className="h-5 w-24 bg-surface-subtle rounded-full" />
                    </div>
                    <div className="h-9 w-28 bg-surface-subtle rounded my-1" />
                    <div className="grid grid-cols-2 gap-space-xs pt-space-xs bg-surface-card rounded-lg p-space-xs mt-2">
                      <div className="flex items-center gap-space-xs">
                        <div className="w-8 h-8 rounded-full bg-surface-subtle shrink-0" />
                        <div className="space-y-1">
                          <div className="h-4 w-16 bg-surface-subtle rounded" />
                          <div className="h-3 w-12 bg-surface-subtle rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <div className="w-8 h-8 rounded-full bg-surface-subtle shrink-0" />
                        <div className="space-y-1">
                          <div className="h-4 w-16 bg-surface-subtle rounded" />
                          <div className="h-3 w-12 bg-surface-subtle rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
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
                          <span className="font-label-caps text-[11px] sm:text-label-caps text-text-muted whitespace-nowrap">
                            {stabilitySummary.alertNote}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Consumer Alert Banner */}
              {loadingSummary || !stabilitySummary ? (
                <div className="mt-space-lg rounded-xl p-space-sm sm:p-space-md bg-surface-card border border-border-subtle/60 flex items-center justify-between gap-space-sm animate-pulse">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-surface-subtle shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-36 bg-surface-subtle rounded" />
                      <div className="h-4 w-72 bg-surface-subtle rounded" />
                    </div>
                  </div>
                </div>
              ) : (
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
                      </div>
                      <p className="font-body-md text-body-md text-text-primary mt-0.5 text-justify">
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
              )}
            </div>
          </section>

          {/* Main Content 2-Column Split: Best Price Finder (60%) vs Smart Shopping Basket (40%) */}
          <section className="max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop w-full mb-space-lg sm:mb-space-xl lg:mb-space-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* LEFT COLUMN: Best Price Finder (lg:col-span-7) */}
              <div className="lg:col-span-7 flex flex-col gap-space-md" id="best-price-finder-section">
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
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-space-md" id="commodity-grid">
                  {loadingCommodities ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={`commodity-skel-${i}`}
                        className="bg-surface-card rounded-xl p-2.5 sm:p-space-md shadow-sm border border-border-subtle/50 flex flex-col justify-between animate-pulse"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5 sm:gap-space-xs mb-1.5 sm:mb-space-xs">
                            <div className="flex items-center gap-1.5 sm:gap-space-xs min-w-0">
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-surface-subtle shrink-0" />
                              <div className="space-y-1 min-w-0">
                                <div className="h-2.5 sm:h-3 w-12 sm:w-16 bg-surface-subtle rounded" />
                                <div className="h-3.5 sm:h-5 w-20 sm:w-32 bg-surface-subtle rounded" />
                              </div>
                            </div>
                            <div className="h-4 sm:h-5 w-10 sm:w-16 bg-surface-subtle rounded-full shrink-0" />
                          </div>
                          <div className="p-2 sm:p-space-xs rounded-lg bg-surface-subtle/60 mb-1.5 sm:mb-space-xs">
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                              <div className="h-2.5 sm:h-3 w-16 sm:w-28 bg-surface-subtle rounded" />
                              <div className="h-2.5 sm:h-3 w-12 sm:w-20 bg-surface-subtle rounded" />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                              <div className="h-4 sm:h-5 w-20 sm:w-32 bg-surface-subtle rounded" />
                              <div className="h-5 sm:h-6 w-16 sm:w-24 bg-surface-subtle rounded" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-0.5 sm:pt-1 mb-1.5 sm:mb-space-sm">
                            <div className="h-3 sm:h-4 w-16 sm:w-32 bg-surface-subtle rounded" />
                            <div className="h-3 sm:h-4 w-10 sm:w-14 bg-surface-subtle rounded" />
                          </div>
                          <div className="w-full h-5 sm:h-8 bg-surface-subtle/40 rounded mb-1.5 sm:mb-space-sm" />
                        </div>
                        <div className="w-full h-7 sm:h-9 bg-surface-subtle rounded-lg mt-1" />
                      </div>
                    ))
                  ) : errorCommodities ? (
                    <div className="col-span-full bg-surface-card rounded-xl p-8 border border-border-subtle/80 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-status-warning-bg flex items-center justify-center text-status-warning">
                        <span className="material-symbols-outlined text-2xl">cloud_off</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-text-primary text-base">Data Pasar Tidak Tersedia</h3>
                        <p className="font-body-sm text-text-secondary mt-1 max-w-md">
                          Gagal menyinkronkan data pantauan harga pasar dari server. Silakan periksa koneksi internet Anda atau coba lagi.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={loadMainData}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-headline-sm text-body-sm hover:bg-primary-container transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-body-sm">refresh</span>
                        Coba Lagi
                      </button>
                    </div>
                  ) : filteredCommodities.length === 0 ? (
                    <div className="col-span-full bg-surface-card rounded-xl p-8 border border-border-subtle/80 text-center text-text-muted">
                      <span className="material-symbols-outlined text-3xl block mb-2">search_off</span>
                      <p className="font-body-md text-text-secondary">Tidak ada komoditas yang cocok dengan pencarian.</p>
                    </div>
                  ) : (
                    filteredCommodities.map((item) => (
                      <div
                        key={item.id}
                        className="bg-surface-card rounded-xl p-2.5 sm:p-space-md shadow-sm hover:shadow-md transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 flex flex-col justify-between relative overflow-hidden group border border-border-subtle/40 will-change-transform"
                      >
                        {item.isCritical && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-status-critical"></div>
                        )}
                        <div>
                          {/* Top Meta: Icon + Category Tag on Left, Status Pill on Right */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <CommodityIcon id={item.komoditas_id || item.id} className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <span
                                className={`text-[10px] sm:text-label-caps uppercase tracking-wider truncate font-bold ${
                                  item.isCritical
                                    ? "text-status-critical"
                                    : item.isWarning
                                    ? "text-status-warning"
                                    : "text-slate-500"
                                }`}
                              >
                                {item.tag}
                              </span>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] sm:text-label-caps shrink-0 font-medium ${
                                item.isCritical
                                  ? "bg-status-critical-bg text-status-critical border border-rose-200"
                                  : item.isWarning
                                  ? "bg-status-warning-bg text-status-warning border border-amber-200"
                                  : "bg-status-normal-bg text-status-normal border border-emerald-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.isCritical
                                    ? "bg-status-critical"
                                    : item.isWarning
                                    ? "bg-status-warning"
                                    : "bg-status-normal"
                                }`}
                              ></span>
                              <span>{item.status}</span>
                            </span>
                          </div>

                          {/* Full-width Commodity Name (Never gets truncated by status pill!) */}
                          <h3
                            className="font-bold text-xs sm:text-sm text-slate-900 leading-tight line-clamp-1 mb-2"
                            title={item.name}
                          >
                            {item.name}
                          </h3>

                          {/* Price & Market Focus Box (Shopee-style) */}
                          <div
                            className={`rounded-lg p-2 sm:p-space-xs mb-1.5 sm:mb-space-sm ${
                              item.isCritical ? "bg-rose-50/70 border border-rose-100" : "bg-surface-subtle"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1 gap-1">
                              <span className="text-[10px] sm:text-label-caps text-slate-500 font-medium truncate">
                                <span className="sm:hidden">Termurah</span>
                                <span className="hidden sm:inline">{item.cheapestBadge}</span>
                              </span>
                              <span
                                className={`text-[10px] sm:text-label-caps font-bold shrink-0 ${
                                  item.isCritical ? "text-rose-600" : "text-emerald-700"
                                }`}
                              >
                                {item.cheapestSub.replace("/kg", "")}
                              </span>
                            </div>

                            {/* Responsive layout: mobile stacked (Price prominent, Market below), sm+ side-by-side */}
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-2">
                              <div className="order-1 sm:order-2 sm:text-right">
                                <span className="font-extrabold text-sm sm:text-metric-value text-slate-900">
                                  {item.price}
                                </span>
                                <span className="text-[10px] sm:text-body-sm text-slate-500 ml-0.5">{item.unit}</span>
                              </div>
                              <div className="order-2 sm:order-1 min-w-0">
                                <span className="font-semibold text-xs sm:text-body-md text-primary truncate flex items-center gap-1" title={item.marketName}>
                                  <span className="material-symbols-outlined text-[13px] sm:text-[15px] shrink-0 text-primary">
                                    location_on
                                  </span>
                                  <span className="truncate">{item.marketName.replace("Pasar ", "")}</span>
                                </span>
                                <p
                                  className={`text-[9.5px] sm:text-label-caps truncate ${
                                    item.isCritical ? "text-rose-600" : "text-slate-500"
                                  }`}
                                >
                                  {item.marketSub}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* City Average & Trend */}
                          <div className="flex items-center justify-between text-text-secondary text-[10px] sm:text-body-sm mb-1.5 sm:mb-space-sm pt-0.5">
                            <span className="truncate mr-1">
                              <span className="hidden sm:inline">Rata-rata Kota: </span>
                              <span className="sm:hidden">Rerata: </span>
                              <strong className="font-semibold text-text-primary">{item.cityAvg}</strong>
                            </span>
                            <span
                              className={`inline-flex items-center font-medium shrink-0 ${item.deltaClass}`}
                            >
                              <span className="material-symbols-outlined text-[11px] sm:text-body-sm mr-0.5">
                                {item.deltaIcon}
                              </span>
                              {item.delta}
                            </span>
                          </div>

                          {/* Sparkline Visual */}
                          <div className="w-full h-5 sm:h-8 mb-1.5 sm:mb-space-sm">
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

                        {/* Button Masukkan Keranjang */}
                        <button
                          className={`w-full py-1.5 sm:py-2 text-xs sm:text-body-sm font-semibold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer ${
                            addedItems[item.id]
                              ? "bg-primary text-on-primary"
                              : "bg-surface-subtle hover:bg-primary hover:text-on-primary text-text-primary"
                          }`}
                          onClick={() => handleAddToBasket(item)}
                        >
                          <span className="material-symbols-outlined text-sm sm:text-body-md">
                            {addedItems[item.id] ? "check" : "add_shopping_cart"}
                          </span>
                          <span className="hidden sm:inline">
                            {addedItems[item.id] ? "Ditambahkan!" : "+ Masukkan Keranjang"}
                          </span>
                          <span className="sm:hidden">
                            {addedItems[item.id] ? "Ditambahkan" : "+ Keranjang"}
                          </span>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Data-Driven Strategic Buying Insight (Diposisikan di Bawah Grid Kartu Komoditas) */}
                {loadingCommodities || !highestSavingItem ? (
                  <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col sm:flex-row items-start gap-space-md border border-border-subtle/50 animate-pulse">
                    <div className="w-full sm:w-28 h-24 rounded-lg bg-surface-subtle shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-44 bg-surface-subtle rounded" />
                      <div className="h-5 w-60 bg-surface-subtle rounded" />
                      <div className="h-3.5 w-full bg-surface-subtle rounded" />
                      <div className="h-3.5 w-4/5 bg-surface-subtle rounded" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col sm:flex-row items-start gap-space-md border border-primary/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Aktivitas Pasar Tradisional Surabaya"
                      className="w-full sm:w-28 h-24 rounded-lg object-cover shrink-0"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU4KGhZnWEhwLnkUcGkN7FfrjtTBmI7s9dDXzMdZBGDzk6UNil3-jRcsPlCiPzkQO3IQDWq9-t7N-LU1Yvib2THuq86ihHqTCmaKT79s0tNulOBcrLkQW1ZDUl77sbEjrxPLuhimAy2DiE1aaO8VZzkViHI3hMxRjuIQyMToJkZffRwOBWpuupknXOqXSi8ZOY1cMqmlH8ZZF6-hzHlTisiVkVQpBtZD7mOtKo9xgEjjbBRDhB1zGo"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-normal"></span>
                          Disparitas Tertinggi: {highestSavingItem.name}
                        </span>
                        <span className="font-label-caps text-label-caps text-text-muted">
                          {highestSavingItem.cheapestSub}
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-body-md text-text-primary font-bold mb-1">
                        Strategi Belanja Cerdas di {highestSavingItem.marketName}
                      </h4>
                      <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed text-justify">
                        {highestSavingItem.marketName} saat ini mencatat harga terendah untuk {highestSavingItem.name} sebesar <strong className="text-text-primary font-semibold">{highestSavingItem.price}{highestSavingItem.unit}</strong> dibanding rata-rata Surabaya ({highestSavingItem.cityAvg}). Memilih belanja di {highestSavingItem.marketName} memberikan efisiensi anggaran paling signifikan hari ini dengan potensi penghematan hingga <strong className="text-status-normal font-semibold">{highestSavingItem.cheapestSub.replace("Hemat ", "")}</strong>.
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT COLUMN: Smart Shopping Basket (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-space-md" id="smart-shopping-basket">
                <div className="bg-surface-card rounded-2xl p-3.5 sm:p-5 shadow-sm border border-border-subtle/80 transition-all">
                  {/* Basket Header (Shopee Style) */}
                  <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-3 border-b border-border-subtle/60 gap-2">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs shrink-0">
                        <span className="material-symbols-outlined text-[19px] sm:text-[22px]">shopping_bag</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-headline-sm text-sm sm:text-base text-text-primary font-bold truncate">Smart Shopping Basket</h3>
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-bold font-label-caps shrink-0">
                            SIMULASI
                          </span>
                        </div>
                        <p className="font-label-caps text-[10.5px] sm:text-xs text-text-secondary truncate">
                          Kalkulator 6 Pasar Tradisional Surabaya
                        </p>
                      </div>
                    </div>
                    <button
                      className="font-label-caps text-[11px] sm:text-xs text-text-muted hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-rose-50 shrink-0"
                      onClick={handleResetBasket}
                      title="Atur ulang simulasi keranjang"
                    >
                      <span className="material-symbols-outlined text-sm">restart_alt</span> Reset
                    </button>
                  </div>

                  {/* Select All Checkbox Bar (Ala Shopee Cart Header) */}
                  {basketList.length > 0 && (
                    <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface-subtle/80 rounded-xl mb-3 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={handleToggleAll}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-primary accent-primary cursor-pointer focus:ring-primary"
                        />
                        <span className="font-bold text-slate-800 text-xs">
                          Pilih Semua ({activeBasketList.length}/{basketList.length})
                        </span>
                      </label>
                      <span className="text-slate-500 text-[10.5px] sm:text-[11px]">
                        {activeBasketList.length === 0 ? "Semua nonaktif" : "Dihitung di ranking"}
                      </span>
                    </div>
                  )}

                  {/* Basket Itemized List */}
                  {basketList.length === 0 ? (
                    <div className="p-6 text-center bg-surface-canvas rounded-xl mb-space-md border border-dashed border-border-subtle">
                      <span className="material-symbols-outlined text-text-muted text-3xl block mb-2">remove_shopping_cart</span>
                      <p className="font-body-sm text-text-muted mb-3">Keranjang belanja kosong.</p>
                      <button
                        onClick={handleResetBasket}
                        className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold shadow-xs hover:bg-primary-container transition-all cursor-pointer"
                      >
                        Muat Ulang Keranjang Default
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2 mb-3.5 sm:mb-4">
                      {basketList.map((item) => {
                        const isChecked = checkedItems[item.komoditas_id] !== false;
                        const simItem = basketSim?.items.find((si) => si.komoditas_id === item.komoditas_id);
                        const itemSubtotal = simItem?.itemTotal || 0;

                        return (
                          <div
                            key={item.id || item.komoditas_id}
                            className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all ${
                              isChecked
                                ? "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                                : "bg-slate-50/70 border-slate-200/50 opacity-60"
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-1 flex-1">
                              {/* Checkbox item */}
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCheck(item.komoditas_id)}
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-primary accent-primary cursor-pointer shrink-0"
                                title="Sertakan dalam simulasi"
                              />
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface-subtle flex items-center justify-center shrink-0 text-text-secondary">
                                <span className="material-symbols-outlined text-base sm:text-lg">
                                  {item.icon}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-slate-900 font-semibold text-xs sm:text-sm truncate block" title={item.name}>
                                  {item.name}
                                </span>
                                {itemSubtotal > 0 && isChecked && (
                                  <span className="text-[10.5px] sm:text-[11px] font-bold text-primary block">
                                    Rp {itemSubtotal.toLocaleString("id-ID")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              {/* Stepper Touch-Friendly Ala Shopee */}
                              <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 p-0.5">
                                <button
                                  onClick={() => handleUpdateQty(item.komoditas_id, -1)}
                                  className="w-5.5 h-5.5 sm:w-6 sm:h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-md cursor-pointer text-xs font-bold transition-colors shadow-2xs"
                                  title="Kurangi"
                                >
                                  -
                                </button>
                                <span className="px-1 sm:px-2 py-0.5 font-semibold text-slate-800 text-[11px] sm:text-xs min-w-[34px] sm:min-w-[42px] text-center">
                                  {item.qty} {item.unit}
                                </span>
                                <button
                                  onClick={() => handleUpdateQty(item.komoditas_id, 1)}
                                  className="w-5.5 h-5.5 sm:w-6 sm:h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-md cursor-pointer text-xs font-bold transition-colors shadow-2xs"
                                  title="Tambah"
                                >
                                  +
                                </button>
                              </div>

                              {/* Delete button */}
                              <button
                                onClick={() => handleRemoveItem(item.komoditas_id)}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Hapus dari keranjang"
                              >
                                <span className="material-symbols-outlined text-[16px] sm:text-sm">delete_outline</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Market Ranking Comparison List (Ala Pilihan Toko / Kurir Shopee) */}
                  <div className="mb-3.5 sm:mb-4">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-label-caps text-[11px] sm:text-xs text-text-secondary uppercase tracking-wider font-bold truncate">
                        Ranking Belanja 6 Pasar
                      </span>
                      {activeBasketList.length > 0 && (
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium shrink-0">
                          {activeBasketList.length} item aktif
                        </span>
                      )}
                    </div>

                    {isBasketLoading ? (
                      <div className="space-y-2 py-6 text-center text-text-muted text-xs bg-surface-canvas rounded-xl">
                        <span className="material-symbols-outlined animate-spin text-lg align-middle mr-1.5 text-primary">sync</span>
                        Menghitung simulasi harga 6 pasar...
                      </div>
                    ) : activeBasketList.length === 0 ? (
                      <div className="text-text-muted text-xs text-center py-4 bg-surface-canvas rounded-xl">
                        Centang minimal 1 barang di atas untuk melihat perbandingan pasar.
                      </div>
                    ) : basketSim?.rankings && basketSim.rankings.length > 0 ? (
                      <div className="space-y-2">
                        {/* Winner Store (#1 Keputran) - Shopee Recommendation Style */}
                        {(() => {
                          const winner = basketSim.rankings[0];
                          const mostExp = basketSim.rankings[basketSim.rankings.length - 1];
                          const maxSaving = mostExp ? mostExp.totalBelanja - winner.totalBelanja : 0;
                          const cleanWilayah = winner.wilayah.replace(/^Surabaya\s+/i, "");
                          return (
                            <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/80 shadow-xs relative overflow-hidden">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-emerald-600 text-white text-[9.5px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
                                    <span className="material-symbols-outlined text-[12px] sm:text-[13px]">verified</span> Paling Hemat
                                  </span>
                                  <span className="text-emerald-900 font-bold text-xs">Pilihan Terbaik</span>
                                </div>
                                <span className="font-extrabold text-base sm:text-lg text-emerald-700 tracking-tight shrink-0">
                                  Rp {winner.totalBelanja.toLocaleString("id-ID")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs gap-2">
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">
                                    {winner.nama_pasar}
                                  </span>
                                  <span className="text-slate-500 text-[10.5px] sm:text-[11px] truncate block">
                                    Surabaya {cleanWilayah} • Pasar Grosir
                                  </span>
                                </div>
                                {maxSaving > 0 && (
                                  <span className="text-[10.5px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                                    Hemat Rp {maxSaving.toLocaleString("id-ID")}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Other Markets (#2 to #6) */}
                        <div className="space-y-1.5 pt-1">
                          {basketSim.rankings.slice(1).map((m) => {
                            const isMostExp = m.rank === basketSim.rankings.length;
                            const cleanWil = m.wilayah.replace(/^Surabaya\s+/i, "");
                            return (
                              <div
                                key={m.pasar_id}
                                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center justify-between text-xs border transition-colors ${
                                  isMostExp
                                    ? "bg-rose-50/40 border-rose-200/60"
                                    : "bg-surface-canvas border-slate-200/70"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-1">
                                  <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-surface-subtle text-text-secondary flex items-center justify-center font-bold text-[9.5px] sm:text-[10px] shrink-0">
                                    #{m.rank}
                                  </span>
                                  <div className="min-w-0 flex items-center gap-1">
                                    <span className="font-semibold text-slate-800 text-xs truncate">
                                      {m.nama_pasar}
                                    </span>
                                    <span className="hidden sm:inline text-slate-400 text-[10px] shrink-0">
                                      {cleanWil}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right flex items-center gap-1.5 sm:gap-2 shrink-0">
                                  <span className="font-semibold text-slate-900 text-xs">
                                    Rp {m.totalBelanja.toLocaleString("id-ID")}
                                  </span>
                                  <span
                                    className={`text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                      isMostExp
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    +{m.selisih > 0 ? `Rp ${m.selisih.toLocaleString("id-ID")}` : "-"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-text-muted text-xs text-center py-2">
                        Pilih item untuk melihat ranking pasar.
                      </div>
                    )}
                  </div>

                  {/* Monthly Savings Ticket / Voucher Card (Shopee Voucher Style) */}
                  {basketSim && basketSim.monthlySaving > 0 && (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3.5 sm:px-6 sm:py-4 mb-3.5 sm:mb-4 shadow-sm">
                      {/* Symmetrical Ticket cutouts decoration */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface-card"></div>
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface-card"></div>

                      <div className="flex items-center gap-3 sm:gap-3.5 pl-1 pr-1">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 shadow-2xs">
                          <span className="material-symbols-outlined text-2xl text-emerald-200">savings</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9.5px] uppercase tracking-wider font-extrabold bg-emerald-950/40 text-emerald-200 px-2 py-0.5 rounded-full inline-block">
                              POTENSI HEMAT BULANAN
                            </span>
                          </div>
                          <div className="text-base sm:text-lg font-extrabold tracking-tight text-white mt-0.5">
                            Rp {basketSim.monthlySaving.toLocaleString("id-ID")}{" "}
                            <span className="text-[11px] font-normal text-emerald-100">/ bulan</span>
                          </div>
                          <p className="text-[10.5px] sm:text-[11px] text-emerald-100/90 leading-tight mt-0.5">
                            Belanja di <strong>{basketSim.cheapestMarket}</strong> vs <strong>{basketSim.mostExpensiveMarket}</strong> (estimasi 4x belanja/bulan).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      className="w-full py-2.5 sm:py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                      onClick={handleShareToWhatsApp}
                    >
                      <span className="material-symbols-outlined text-base sm:text-lg">share</span>
                      Bagikan Rincian Belanja ke WhatsApp
                    </button>
                    <button
                      className="w-full py-2 sm:py-2.5 bg-surface-subtle hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      onClick={handleDownloadList}
                    >
                      <span className="material-symbols-outlined text-sm sm:text-base">download_for_offline</span>
                      Simpan Catatan Belanja
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Bottom Section: Komparasi Harga Antar-Pasar 14 Hari Konsumen */}
          <section className="max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop w-full mb-space-lg sm:mb-space-xl lg:mb-space-2xl" id="grafik-tren">
            <div className="bg-surface-card rounded-2xl p-space-md lg:p-space-lg shadow-sm border border-border-subtle/80 transition-all">
              {/* Header: Title & Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                      Komparasi 6 Pasar Surabaya
                    </span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                    Dinamika Harga {marketTrendsData?.nama_komoditas || "Komoditas Pangan"}
                  </h2>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                    Perbandingan pergerakan harga riil &amp; trajektori model di 6 pasar Surabaya per {marketTrendsData?.satuan || "kg"}
                  </p>
                </div>
              </div>

              {/* Pola 2: Searchable Dropdown for All 38 Commodities + Strategic Quick Chips */}
              <div className="mb-6 flex flex-col lg:flex-row lg:items-start justify-start gap-8 bg-surface-subtle/50 p-3 rounded-2xl border border-border-subtle/70">
                {/* Left: Searchable Dropdown for 38 Commodities */}
                <div className="w-full lg:w-72 shrink-0">
                  <div className="mb-1.5">
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      Pilih dari 38 Komoditas:
                    </span>
                  </div>
                  <CommoditySearchSelect
                    options={ALL_CATALOG_COMMODITIES}
                    valueId={trendCommodityId}
                    onChange={(id) => {
                      setTrendCommodityId(id);
                      setHighlightedMarketId(null);
                    }}
                    searchPlaceholder="Cari dari 38 komoditas Surabaya..."
                    emptyNoun="komoditas"
                    panelClassName="w-full sm:w-96 lg:w-[26rem]"
                  />
                </div>

                {/* Right: Quick Chips (Pangan Pokok Strategis) */}
                <div className="w-full lg:flex-1 min-w-0">
                  <div className="mb-1.5 pl-1.5">
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      Pangan Pokok Strategis:
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar px-1.5 py-1 -mt-1 pr-8">
                    {AVAILABLE_TREND_COMMODITIES.map((c) => {
                      const isSelected = trendCommodityId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setTrendCommodityId(c.id);
                            setHighlightedMarketId(null);
                          }}
                          className={`h-11 inline-flex items-center justify-center gap-2 px-3.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white shadow-sm shadow-primary/30 ring-2 ring-primary/40 font-bold"
                              : "bg-white hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border-subtle hover:border-primary/20 shadow-xs"
                          }`}
                        >
                          <CommodityIcon id={c.id} className="w-4 h-4 shrink-0" />
                          <span>{c.shortName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic SVG Comparison Chart Canvas with Executive Metrics & Focus Toolbar */}
              {(() => {
                if (loadingTrends) {
                  return (
                    <div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={`trend-sum-skel-${i}`} className="bg-surface-canvas border border-border-subtle/80 rounded-xl p-3 shadow-xs">
                            <div className="h-3 w-20 bg-surface-subtle rounded mb-2" />
                            <div className="h-5 w-28 bg-surface-subtle rounded mb-1" />
                            <div className="h-3 w-16 bg-surface-subtle rounded" />
                          </div>
                        ))}
                      </div>
                      <div className="w-full h-72 sm:h-84 bg-surface-card border border-border-subtle/60 rounded-2xl p-6 flex flex-col justify-between animate-pulse mb-space-md">
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-40 bg-surface-subtle rounded" />
                          <div className="h-4 w-28 bg-surface-subtle rounded" />
                        </div>
                        <div className="space-y-4">
                          <div className="h-[1px] w-full bg-border-subtle/60 border-b border-dashed border-border-subtle" />
                          <div className="h-[1px] w-full bg-border-subtle/60 border-b border-dashed border-border-subtle" />
                          <div className="h-[1px] w-full bg-border-subtle/60 border-b border-dashed border-border-subtle" />
                        </div>
                        <div className="flex justify-between">
                          {Array.from({ length: 7 }).map((_, i) => (
                            <div key={`trend-x-skel-${i}`} className="h-3 w-10 bg-surface-subtle rounded" />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (errorTrends || !marketTrendsData || !marketTrendsData.series || marketTrendsData.series.length === 0) {
                  return (
                    <div className="bg-surface-card rounded-2xl p-8 border border-border-subtle/80 flex flex-col items-center justify-center text-center gap-3 mb-space-md">
                      <div className="w-12 h-12 rounded-full bg-status-warning-bg flex items-center justify-center text-status-warning">
                        <span className="material-symbols-outlined text-2xl">timeline</span>
                      </div>
                      <div>
                        <h4 className="font-headline-sm text-text-primary text-base">Data Tren Pasar Belum Tersedia</h4>
                        <p className="font-body-sm text-text-secondary mt-1 max-w-md">
                          Gagal memuat dinamika perbandingan harga 14 hari 6 pasar untuk komoditas ini.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadTrends(trendCommodityId)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-headline-sm text-body-sm hover:bg-primary-container transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-body-sm">refresh</span>
                        Muat Ulang Tren
                      </button>
                    </div>
                  );
                }

                const dates = marketTrendsData.dates;
                const formattedDates = marketTrendsData.formattedDates;
                const seriesToRender = marketTrendsData.series.map((s) => ({
                  ...s,
                  points: s.points.map((pt, i) => ({
                    ...pt,
                    formattedDate: formattedDates[i] || pt.tanggal,
                  })),
                }));

                const totalPoints = dates.length;
                const todayIdx = marketTrendsData?.splitIndex !== undefined ? marketTrendsData.splitIndex : Math.min(6, totalPoints - 1);
                
                // SVG dimensions & coordinate transforms
                const chartLeft = 65;
                const chartRight = 790;
                const chartTop = 38;
                const chartBottom = 175;
                const chartWidth = chartRight - chartLeft;
                const chartHeight = chartBottom - chartTop;

                const getX = (idx: number) => chartLeft + (idx / Math.max(1, totalPoints - 1)) * chartWidth;

                // Today stats across active markets
                const todayMarketStats = seriesToRender
                  .map((s) => ({
                    id: s.id,
                    name: s.name,
                    color: s.color,
                    price: s.points[todayIdx]?.price || 0,
                    isActive: !!activeMarkets[s.id],
                  }))
                  .filter((m) => m.price > 0);

                const visibleTodayStats = todayMarketStats.filter((m) => m.isActive);
                const cheapestToday = visibleTodayStats.length > 0
                  ? [...visibleTodayStats].sort((a, b) => a.price - b.price)[0]
                  : null;
                const highestToday = visibleTodayStats.length > 0
                  ? [...visibleTodayStats].sort((a, b) => b.price - a.price)[0]
                  : null;

                const spreadToday = highestToday && cheapestToday ? highestToday.price - cheapestToday.price : 0;
                const spreadTodayPct = cheapestToday && cheapestToday.price > 0
                  ? ((spreadToday / cheapestToday.price) * 100).toFixed(1)
                  : "0";
                const avgToday = visibleTodayStats.length > 0
                  ? Math.round(visibleTodayStats.reduce((acc, m) => acc + m.price, 0) / visibleTodayStats.length)
                  : 0;

                // Dynamic tight Y-Scale from active visible markets
                const activePrices = seriesToRender
                  .filter((s) => activeMarkets[s.id])
                  .flatMap((s) => s.points.map((p) => p.price))
                  .filter((p) => p > 0);

                const dataMin = activePrices.length > 0 ? Math.min(...activePrices) : 25000;
                const dataMax = activePrices.length > 0 ? Math.max(...activePrices) : 38000;
                const rawRange = Math.max(2000, dataMax - dataMin);
                const pad = Math.round(rawRange * 0.08);
                const yMin = Math.max(0, Math.floor((dataMin - pad) / 500) * 500);
                const yMax = Math.ceil((dataMax + pad) / 500) * 500;
                const yRange = Math.max(1000, yMax - yMin);

                const getY = (price: number) => {
                  const clamped = Math.max(yMin, Math.min(yMax, price));
                  return chartBottom - ((clamped - yMin) / yRange) * chartHeight;
                };

                const gridLevels = [
                  { y: chartTop, val: yMax },
                  { y: chartTop + chartHeight * 0.33, val: Math.round(yMin + yRange * 0.67) },
                  { y: chartTop + chartHeight * 0.67, val: Math.round(yMin + yRange * 0.33) },
                  { y: chartBottom, val: yMin },
                ];

                const formatY = (val: number) => {
                  if (val >= 1000) {
                    const k = val / 1000;
                    return `Rp ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
                  }
                  return `Rp ${val}`;
                };

                const todayX = getX(todayIdx);

                // Helper for Catmull-Rom cubic spline
                const getCurvedPath = (pts: { x: number; y: number }[]) => {
                  if (pts.length === 0) return "";
                  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
                  if (pts.length === 2) return `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)}`;

                  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
                  for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[i === 0 ? 0 : i - 1];
                    const p1 = pts[i];
                    const p2 = pts[i + 1];
                    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

                    const cp1x = p1.x + (p2.x - p0.x) / 6;
                    const cp1y = p1.y + (p2.y - p0.y) / 6;
                    const cp2x = p2.x - (p3.x - p1.x) / 6;
                    const cp2y = p2.y - (p3.y - p1.y) / 6;

                    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
                  }
                  return d;
                };

                // Envelope corridor between min and max lines across all active markets
                const corridorMinPts: { x: number; y: number }[] = [];
                const corridorMaxPts: { x: number; y: number }[] = [];
                for (let i = 0; i < totalPoints; i++) {
                  const dayPrices = seriesToRender
                    .filter((s) => activeMarkets[s.id])
                    .map((s) => s.points[i]?.price || 0)
                    .filter((p) => p > 0);
                  if (dayPrices.length > 0) {
                    corridorMinPts.push({ x: getX(i), y: getY(Math.min(...dayPrices)) });
                    corridorMaxPts.push({ x: getX(i), y: getY(Math.max(...dayPrices)) });
                  }
                }

                let envelopeD = "";
                if (corridorMinPts.length > 1 && corridorMaxPts.length > 1) {
                  const topPath = getCurvedPath(corridorMaxPts);
                  const revMin = [...corridorMinPts].reverse();
                  const bottomPoints = revMin.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                  envelopeD = `${topPath} ${bottomPoints} Z`;
                }

                // Active hover point calculations
                const activeHoverPoint = hoveredPointIndex !== null ? {
                  idx: hoveredPointIndex,
                  x: getX(hoveredPointIndex),
                  dateStr: formattedDates[hoveredPointIndex],
                  isForecast: hoveredPointIndex > todayIdx,
                  prices: seriesToRender
                    .filter((s) => activeMarkets[s.id])
                    .map((s) => ({
                      id: s.id,
                      name: s.name,
                      color: s.color,
                      price: s.points[hoveredPointIndex]?.price || 0,
                      y: getY(s.points[hoveredPointIndex]?.price || 0),
                    }))
                    .sort((a, b) => a.price - b.price),
                } : null;

                const baseCheapestPrice = activeHoverPoint && activeHoverPoint.prices.length > 0
                  ? activeHoverPoint.prices[0].price
                  : 0;

                return (
                  <div>
                    {/* Executive Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                      <div className="bg-surface-canvas border border-border-subtle/90 rounded-xl p-3 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                          <span>Pasar Termurah</span>
                          <span className="text-status-normal font-semibold text-[11px]">Rekomendasi</span>
                        </div>
                        <div className="text-sm sm:text-base font-bold text-text-primary mt-1 truncate">
                          {cheapestToday?.name || "-"}
                        </div>
                        <div className="text-xs text-status-normal font-bold font-metric-value mt-0.5">
                          Rp {cheapestToday?.price.toLocaleString("id-ID") || "0"}
                          <span className="text-[10px] font-normal text-text-muted ml-1">/ {marketTrendsData?.satuan || "kg"}</span>
                        </div>
                      </div>

                      <div className="bg-surface-canvas border border-border-subtle/90 rounded-xl p-3 shadow-xs">
                        <div className="text-xs font-medium text-text-secondary">
                          Pasar Tertinggi
                        </div>
                        <div className="text-sm sm:text-base font-bold text-text-primary mt-1 truncate">
                          {highestToday?.name || "-"}
                        </div>
                        <div className="text-xs text-status-danger font-bold font-metric-value mt-0.5">
                          Rp {highestToday?.price.toLocaleString("id-ID") || "0"}
                          <span className="text-[10px] font-normal text-text-muted ml-1">/ {marketTrendsData?.satuan || "kg"}</span>
                        </div>
                      </div>

                      <div className="bg-surface-canvas border border-border-subtle/90 rounded-xl p-3 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                          <span>Disparitas Harga</span>
                          <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{spreadTodayPct}%</span>
                        </div>
                        <div className="text-sm sm:text-base font-bold text-text-primary mt-1 font-metric-value">
                          Rp {spreadToday.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[11px] text-text-secondary mt-0.5">
                          Selisih tertinggi vs termurah
                        </div>
                      </div>

                      <div className="bg-surface-canvas border border-border-subtle/90 rounded-xl p-3 shadow-xs">
                        <div className="text-xs font-medium text-text-secondary">
                          Rata-rata 6 Pasar
                        </div>
                        <div className="text-sm sm:text-base font-bold text-text-primary mt-1 font-metric-value">
                          Rp {avgToday.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[11px] text-text-secondary mt-0.5">
                          {formattedDates[todayIdx] || "Hari Ini"} (Surabaya)
                        </div>
                      </div>
                    </div>

                    {/* Interactive Focus Toolbar: Market Chips */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-2.5 px-3 bg-surface-canvas/60 rounded-xl border border-border-subtle/80 mb-3">
                      {/* Mobile Header: Label & Action */}
                      <div className="flex items-center justify-between md:hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-text-secondary">
                            Fokus Pasar:
                          </span>
                          {highlightedMarketId && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold animate-pulse">
                              Fokus Aktif
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const allVisible = TREND_MARKET_CONFIGS.reduce((acc, m) => ({ ...acc, [m.id]: true }), {});
                            setActiveMarkets(allVisible);
                            setHighlightedMarketId(null);
                          }}
                          className="text-[11px] text-primary hover:text-primary-dark hover:underline font-semibold cursor-pointer shrink-0"
                        >
                          Tampilkan Semua
                        </button>
                      </div>

                      {/* Market Chips: 2-Col Grid on Mobile, Flex on Desktop */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-xs font-semibold text-text-secondary mr-1 hidden md:inline">
                          Fokus Pasar:
                        </span>
                        {TREND_MARKET_CONFIGS.map((m) => {
                          const isVisible = !!activeMarkets[m.id];
                          const isHovered = highlightedMarketId === m.id;

                          return (
                            <button
                              key={m.id}
                              type="button"
                              onMouseEnter={() => setHighlightedMarketId(m.id)}
                              onMouseLeave={() => setHighlightedMarketId(null)}
                              onClick={() => setActiveMarkets((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                              className={`group inline-flex items-center justify-center md:justify-start gap-1.5 px-2.5 py-1.5 md:py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer select-none border ${
                                !isVisible
                                  ? "opacity-35 bg-surface-subtle/50 text-text-muted line-through border-transparent"
                                  : isHovered
                                  ? "bg-surface-card text-text-primary shadow-sm scale-[1.02] md:scale-105 border-primary/50 ring-2 ring-primary/20"
                                  : "bg-surface-card hover:bg-surface-card/90 text-text-secondary hover:text-text-primary border-border-subtle shadow-xs"
                              }`}
                              title={`Klik untuk on/off. Sorot kursor untuk isolasi grafik ${m.name}`}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                                style={{ backgroundColor: m.color }}
                              />
                              <span className="truncate">{m.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Desktop Right Actions */}
                      <div className="hidden md:flex items-center gap-2">
                        {highlightedMarketId && (
                          <span className="text-[11px] text-primary font-semibold hidden sm:inline animate-pulse">
                            Mode Fokus Aktif
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const allVisible = TREND_MARKET_CONFIGS.reduce((acc, m) => ({ ...acc, [m.id]: true }), {});
                            setActiveMarkets(allVisible);
                            setHighlightedMarketId(null);
                          }}
                          className="text-[11px] text-primary hover:text-primary-dark hover:underline font-semibold cursor-pointer shrink-0"
                        >
                          Tampilkan Semua
                        </button>
                      </div>
                    </div>

                    {/* Chart Container Canvas */}
                    <div className="w-full relative bg-surface-card rounded-2xl p-3 sm:p-5 mb-space-md select-none border border-border-subtle/60">
                      {/* Mobile Swipe Affordance */}
                      <div className="sm:hidden flex items-center justify-between text-text-muted text-[11px] font-medium mb-2.5 pb-2 border-b border-border-subtle/50">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-primary">swipe</span> Geser grafik untuk melihat pergerakan 14 hari
                        </span>
                        <span className="text-primary font-bold text-xs">&rarr;</span>
                      </div>

                      {/* Scrollable Container on Mobile with ample min-width */}
                      <div className="w-full overflow-x-auto no-scrollbar">
                        <div className="min-w-[680px] sm:min-w-full relative">
                          {/* Floating Ranking Leaderboard Tooltip */}
                          {activeHoverPoint && (
                            <div
                              className="absolute z-30 pointer-events-none bg-surface-card/95 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-xl text-xs min-w-[240px] transition-opacity duration-150 will-change-transform"
                              style={{
                                left: `${Math.min(70, Math.max(8, (activeHoverPoint.x / 820) * 100))}%`,
                                top: "16px",
                              }}
                            >
                              <div className="font-semibold text-text-primary flex items-center justify-between gap-1.5 mb-2 pb-1.5 border-b border-border-subtle">
                                <span className="font-bold">{activeHoverPoint.dateStr}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    activeHoverPoint.isForecast
                                      ? "bg-primary-container text-on-primary"
                                      : "bg-status-normal-bg text-status-normal"
                                  }`}
                                >
                                  {activeHoverPoint.isForecast ? "Proyeksi model" : "Observasi"}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {activeHoverPoint.prices.map((p, rankIdx) => {
                                  const diffVsCheapest = p.price - baseCheapestPrice;
                                  const isFocus = highlightedMarketId === p.id;
                                  return (
                                    <div
                                      key={p.id}
                                      className={`flex items-center justify-between gap-2 px-1.5 py-0.5 rounded ${
                                        isFocus ? "bg-primary/10 font-bold" : "text-text-secondary"
                                      } text-[11px]`}
                                    >
                                      <span className="flex items-center gap-1.5 truncate">
                                        <span className="text-[9px] font-mono text-text-muted font-bold w-3 text-center">
                                          #{rankIdx + 1}
                                        </span>
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }}></span>
                                        <span className={`truncate ${isFocus ? "text-primary font-bold" : "text-text-primary"}`}>
                                          {p.name}
                                        </span>
                                      </span>
                                      <div className="text-right shrink-0">
                                        <span className="font-bold text-text-primary font-metric-value">
                                          Rp {p.price.toLocaleString("id-ID")}
                                        </span>
                                        {rankIdx > 0 && diffVsCheapest > 0 && (
                                          <span className="block text-[9px] text-text-muted font-mono leading-none">
                                            +{diffVsCheapest.toLocaleString("id-ID")}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* SVG Canvas - Tight, responsive, no vertical dead space */}
                          <div
                            className="w-full cursor-crosshair relative"
                            onMouseMove={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const mouseX = e.clientX - rect.left;
                              const svgX = (mouseX / rect.width) * 820;
                              if (svgX >= chartLeft - 15 && svgX <= chartRight + 15) {
                                const idx = Math.round(((svgX - chartLeft) / chartWidth) * (totalPoints - 1));
                                const clamped = Math.max(0, Math.min(totalPoints - 1, idx));
                                setHoveredPointIndex(clamped);
                              }
                            }}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                          >
                            <svg className="w-full h-auto block" viewBox="0 0 820 215">
                          <defs>
                            <linearGradient id="forecastAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#004328" stopOpacity="0.05" />
                              <stop offset="100%" stopColor="#004328" stopOpacity="0.01" />
                            </linearGradient>
                            <linearGradient id="disparityBandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#004328" stopOpacity="0.08" />
                              <stop offset="100%" stopColor="#004328" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>

                          {/* Shaded Forecast Region */}
                          <rect
                            x={todayX}
                            y={chartTop}
                            width={chartRight - todayX}
                            height={chartHeight}
                            fill="url(#forecastAreaGrad)"
                            rx="4"
                          />

                          {/* Forecast Pill Header in Top Clearance Zone (Bebas tabrakan dari kurva data) */}
                          <rect
                            x={(todayX + chartRight) / 2 - 76}
                            y="10"
                            width="152"
                            height="20"
                            rx="10"
                            fill="#F0FDF4"
                            stroke="#BBF7D0"
                            strokeWidth="1"
                          />
                          <text
                            x={(todayX + chartRight) / 2}
                            y="24"
                            textAnchor="middle"
                            className="fill-[#166534] font-label-caps text-[10px] font-bold tracking-wide select-none pointer-events-none"
                          >
                            Proyeksi 7 hari ke depan
                          </text>

                          {/* Dynamic Horizontal Grid Lines & Y-Labels */}
                          {gridLevels.map((lvl, idx) => (
                            <g key={idx}>
                              <line
                                stroke="#E2E8F0"
                                strokeDasharray={idx === 3 ? undefined : "4 4"}
                                strokeWidth="1"
                                x1={chartLeft - 10}
                                x2={chartRight}
                                y1={lvl.y}
                                y2={lvl.y}
                              />
                              <text
                                className="fill-[#64748B] font-metric-delta text-[10px] font-medium"
                                x="10"
                                y={lvl.y + 3.5}
                              >
                                {formatY(lvl.val)}
                              </text>
                            </g>
                          ))}

                          {/* Disparity Envelope Band Shading */}
                          {envelopeD && (
                            <path
                              d={envelopeD}
                              fill="url(#disparityBandGrad)"
                              className="transition-opacity duration-300 pointer-events-none"
                              opacity={highlightedMarketId ? 0.05 : 0.14}
                            />
                          )}

                          {/* Vertical Indicator Line for Today / Split Date */}
                          <line
                            stroke="#004328"
                            strokeDasharray="4 3"
                            strokeWidth="1.5"
                            x1={todayX}
                            x2={todayX}
                            y1={chartTop}
                            y2={chartBottom}
                          />
                          <text
                            className="fill-[#004328] font-label-caps text-[10px] font-extrabold select-none pointer-events-none"
                            textAnchor="middle"
                            x={todayX}
                            y="24"
                          >
                            Data {formattedDates[todayIdx] || "terkini"}
                          </text>

                          {/* Trajectory Paths & Markers for Each Market */}
                          {seriesToRender.map((s) => {
                            if (!activeMarkets[s.id]) return null;
                            const pts = s.points.map((pt, i) => ({ x: getX(i), y: getY(pt.price) }));
                            const histPts = pts.slice(0, todayIdx + 1);
                            const forecastPts = pts.slice(todayIdx);
                            const histPathString = getCurvedPath(histPts);
                            const forecastPathString = forecastPts.length > 1 ? getCurvedPath(forecastPts) : "";

                            const isHighlighted = highlightedMarketId === s.id;
                            const isDimmed = highlightedMarketId !== null && !isHighlighted;

                            return (
                              <g key={s.id}>
                                {/* Observasi Riil: Solid Line */}
                                {histPathString && (
                                  <path
                                    d={histPathString}
                                    fill="none"
                                    stroke={s.color}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={isHighlighted ? "3" : "2"}
                                    opacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.85}
                                    className="trend-path cursor-pointer"
                                    onMouseEnter={() => setHighlightedMarketId(s.id)}
                                    onMouseLeave={() => setHighlightedMarketId(null)}
                                  />
                                )}

                                {/* Proyeksi Masa Depan: Garis Putus-putus (Dashed Line) */}
                                {forecastPathString && (
                                  <path
                                    d={forecastPathString}
                                    fill="none"
                                    stroke={s.color}
                                    strokeDasharray="6 4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={isHighlighted ? "3" : "2"}
                                    opacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.85}
                                    className="trend-path cursor-pointer"
                                    onMouseEnter={() => setHighlightedMarketId(s.id)}
                                    onMouseLeave={() => setHighlightedMarketId(null)}
                                  />
                                )}

                                {/* Data Markers on Key Dates */}
                                {s.points.map((pt, i) => {
                                  const isToday = i === todayIdx;
                                  const isForecast = i > todayIdx;
                                  const cx = getX(i);
                                  const cy = getY(pt.price);

                                  return (
                                    <g key={i}>
                                      {/* Static subtle halo on today's cheapest market point */}
                                      {isToday && s.id === cheapestToday?.id && (
                                        <circle
                                          cx={cx}
                                          cy={cy}
                                          r="7"
                                          fill={s.color}
                                          opacity="0.25"
                                        />
                                      )}
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r={isHighlighted ? (isToday ? 5 : 3.5) : (isToday ? 4 : 2.5)}
                                        fill={isForecast ? "#FFFFFF" : s.color}
                                        stroke={s.color}
                                        strokeWidth={isForecast ? 1.5 : 1}
                                        opacity={isDimmed ? 0.2 : 1}
                                        className="trend-dot cursor-pointer"
                                        onMouseEnter={() => setHighlightedMarketId(s.id)}
                                        onMouseLeave={() => setHighlightedMarketId(null)}
                                      >
                                        <title>{`${s.name} (${pt.formattedDate}): Rp ${pt.price.toLocaleString("id-ID")}`}</title>
                                      </circle>
                                    </g>
                                  );
                                })}
                              </g>
                            );
                          })}

                          {/* Invisible Interactive Hit-Test Columns for each Date */}
                          {dates.map((_, i) => {
                            const colWidth = chartWidth / Math.max(1, totalPoints - 1);
                            const xStart = i === 0 ? chartLeft - 15 : getX(i) - colWidth / 2;
                            const w = i === 0 || i === totalPoints - 1 ? colWidth / 2 + 15 : colWidth;
                            return (
                              <rect
                                key={`hit-${i}`}
                                x={xStart}
                                y="0"
                                width={w}
                                height={chartBottom}
                                fill="transparent"
                                className="cursor-crosshair"
                                onMouseEnter={() => setHoveredPointIndex(i)}
                                onClick={() => setHoveredPointIndex(i)}
                              />
                            );
                          })}

                          {/* Interactive Tracking Hover Crosshair & Dots */}
                          {activeHoverPoint && (
                            <g>
                              <line
                                stroke="#475569"
                                strokeDasharray="3 3"
                                strokeWidth="1"
                                x1={activeHoverPoint.x}
                                x2={activeHoverPoint.x}
                                y1={chartTop - 5}
                                y2={chartBottom}
                              />
                              {activeHoverPoint.prices.map((p) => {
                                const isFocus = highlightedMarketId === p.id;
                                return (
                                  <circle
                                    key={p.id}
                                    cx={activeHoverPoint.x}
                                    cy={p.y}
                                    fill={p.color}
                                    r={isFocus ? "6" : "4.5"}
                                    stroke="#FFFFFF"
                                    strokeWidth="2"
                                    className="transition-[r] duration-150"
                                  />
                                );
                              })}
                            </g>
                          )}

                          {/* X-Axis Timeline Labels inside SVG: perfectly aligned and zero dead whitespace */}
                          <g className="font-label-caps text-[10px] select-none pointer-events-none">
                            <text x={getX(0)} y="196" textAnchor="start" className="fill-[#64748B] font-medium">
                              {formattedDates[0]}
                            </text>
                            <text x={getX(2)} y="196" textAnchor="middle" className="fill-[#64748B] font-medium">
                              {formattedDates[2]}
                            </text>
                            <text x={getX(4)} y="196" textAnchor="middle" className="fill-[#64748B] font-medium">
                              {formattedDates[4]}
                            </text>
                            <text x={todayX} y="196" textAnchor="middle" className="fill-[#16A34A] font-bold">
                              {formattedDates[todayIdx]} (Hari Ini)
                            </text>
                            <text x={getX(8)} y="196" textAnchor="middle" className="fill-[#64748B] font-medium">
                              {formattedDates[8]}
                            </text>
                            <text x={getX(10)} y="196" textAnchor="middle" className="fill-[#64748B] font-medium">
                              {formattedDates[10]}
                            </text>
                            <text x={getX(totalPoints - 1)} y="196" textAnchor="end" className="fill-[#64748B] font-medium">
                              {formattedDates[totalPoints - 1]} (Proyeksi)
                            </text>
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
              })()}


            </div>
          </section>
        </div>
      </main>

      {/* Floating Sticky Cart Bar (Portal langsung ke document.body agar tidak terjebak container transform, otomatis menghilang saat scroll lewat Best Price Finder) */}
      {isMounted && typeof document !== "undefined" && basketList.length > 0 && createPortal(
        <aside
          aria-label="Keranjang Belanja Mengambang"
          className={`fixed bottom-5 left-0 right-0 mx-auto w-[calc(100%-24px)] max-w-md z-[9999] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] transform ${
            showFloatingBasket
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-8 pointer-events-none"
          }`}
        >
          <div className="bg-white/95 text-slate-900 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-slate-900/25 border border-slate-200/90 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                </div>
                {activeBasketList.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                    {activeBasketList.length}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Termurah:</span>
                  <span className="font-extrabold text-sm text-slate-900">
                    {basketSim && basketSim.rankings.length > 0
                      ? `Rp ${basketSim.rankings[0].totalBelanja.toLocaleString("id-ID")}`
                      : "Rp 0"}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium truncate flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-emerald-600">verified</span>
                  {basketSim && basketSim.rankings.length > 0
                    ? `${basketSim.rankings[0].nama_pasar} (Paling Hemat)`
                    : "Pilih komoditas"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const el = document.getElementById("smart-shopping-basket");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  el.classList.add("ring-4", "ring-primary/40");
                  setTimeout(() => el.classList.remove("ring-4", "ring-primary/40"), 1800);
                }
              }}
              className="px-3.5 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>Lihat Keranjang</span>
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
            </button>
          </div>
        </aside>,
        document.body
      )}

      <Footer />
    </div>
  );
}
