"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua (6)");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const commodities = [
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

  const categories = [
    "Semua (6)",
    "Beras",
    "Minyak Goreng",
    "Daging Sapi",
    "Cabai",
    "Bawang",
    "Telur",
  ];

  const handleAddToBasket = (id: string) => {
    setAddedItems((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [id]: false }));
    }, 1500);
  };

  const handleShareToWhatsApp = () => {
    const text = encodeURIComponent(
      "Rincian Belanja Cerdas Pasar Surabaya Hari Ini (HargaWatch):\n\n" +
        "1. Beras Medium: Rp 13.200/kg (Pasar Tambahrejo)\n" +
        "2. Minyak Goreng Curah: Rp 15.500/L (Pasar Wonokromo)\n" +
        "3. Cabai Rawit: Rp 68.000/kg (Pasar Keputran)\n" +
        "4. Telur Ayam: Rp 27.500/kg (Pasar Soponyono)\n\n" +
        "Rekomendasi Paling Hemat: Pasar Wonokromo (Total Rp 178.500)!\n" +
        "Cek selengkapnya di https://hargawatch.surabaya.go.id"
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleDownloadList = () => {
    setResetMessage("Daftar Belanja Pasar Berhasil disiapkan untuk perangkat Anda.");
    setTimeout(() => setResetMessage(null), 3000);
  };

  const handleResetBasket = () => {
    setResetMessage("Simulasi keranjang belanja telah diatur ulang ke formula default konsumsi keluarga.");
    setTimeout(() => setResetMessage(null), 3000);
  };

  const filteredCommodities = commodities.filter((item) => {
    const matchCat =
      selectedCategory === "Semua (6)" || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

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
                  <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps mb-space-sm">
                    <span
                      className="material-symbols-outlined text-body-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      storefront
                    </span>
                    Layanan Warga &amp; Pelaku Usaha Mikro Surabaya
                  </div>
                  <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight mb-space-xs">
                    Pantau Harga Pangan Terkini &amp; Belanja Cerdas di Pasar Surabaya
                  </h1>
                  <p className="font-body-lg text-body-lg text-text-secondary leading-relaxed">
                    Perbandingan harga harian transparan di 6 pasar induk &amp; strategis. Temukan lokasi termurah, hitung total keranjang belanja keluarga, dan hemat pengeluaran dapur hari ini.
                  </p>
                </div>
                {/* Quick Health Summary Card */}
                <div className="w-full lg:w-auto min-w-[320px] bg-surface-canvas rounded-xl p-space-md shadow-sm">
                  <div className="flex items-center justify-between gap-space-sm mb-space-xs">
                    <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                      Indeks Stabilitas Pangan
                    </span>
                    <span className="inline-flex items-center gap-1 px-space-xs py-space-2xs rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-normal animate-pulse"></span>
                      Kondisi Stabil
                    </span>
                  </div>
                  <div className="flex items-baseline gap-space-xs mb-space-sm">
                    <span className="font-metric-display text-metric-display text-primary">94.2%</span>
                    <span className="font-label-caps text-label-caps text-text-muted">Target Kota &gt; 90%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs pt-space-xs bg-surface-card rounded-lg p-space-xs">
                    <div className="flex items-center gap-space-xs">
                      <div className="w-8 h-8 rounded-full bg-status-normal-bg flex items-center justify-center text-status-normal">
                        <span className="material-symbols-outlined text-body-md">check_circle</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-headline-sm text-text-primary">8 Bahan</span>
                        <span className="font-label-caps text-label-caps text-text-muted">Harga Normal</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <div className="w-8 h-8 rounded-full bg-status-warning-bg flex items-center justify-center text-status-warning">
                        <span className="material-symbols-outlined text-body-md">warning</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-headline-sm text-status-warning">2 Bahan</span>
                        <span className="font-label-caps text-label-caps text-text-muted">Cabai &amp; Bwg Merah</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Consumer Alert Banner */}
              <div className="mt-space-lg bg-status-warning-bg rounded-xl p-space-sm sm:p-space-md flex items-start sm:items-center justify-between gap-space-sm">
                <div className="flex items-start sm:items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-lg bg-status-warning text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-title-md">notifications_active</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="font-label-caps text-label-caps text-status-warning uppercase font-semibold">
                        Waspada Fluktuasi Pasar
                      </span>
                      <span className="font-body-sm text-body-sm text-text-muted hidden sm:inline">•</span>
                      <span className="font-label-caps text-label-caps text-text-secondary">
                        Update Pagi Pk 06.00 WIB
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-text-primary mt-0.5">
                      Cabai Rawit Merah naik rata-rata <strong>Rp 4.200/kg</strong> hari ini di{" "}
                      <span className="text-primary font-semibold">Pasar Keputran</span> &amp;{" "}
                      <span className="text-primary font-semibold">Pasar Genteng</span> akibat pasokan lereng Bromo tertahan hujan lebat.
                    </p>
                  </div>
                </div>
                <a
                  className="hidden md:inline-flex items-center gap-1 font-body-sm text-body-sm text-status-warning font-semibold hover:underline shrink-0"
                  href="#grafik-tren"
                >
                  Cek Grafik Tren
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
                        className={`w-full py-2 font-body-sm text-body-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                          addedItems[item.id]
                            ? "bg-primary text-on-primary"
                            : "bg-surface-subtle hover:bg-primary hover:text-on-primary text-text-primary"
                        }`}
                        onClick={() => handleAddToBasket(item.id)}
                      >
                        <span className="material-symbols-outlined text-body-md">
                          {addedItems[item.id] ? "check" : "add_shopping_cart"}
                        </span>
                        {addedItems[item.id] ? "Ditambahkan!" : "+ Masukkan Keranjang"}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Local Insight callout with imagery */}
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col sm:flex-row items-center gap-space-md mt-space-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Pasar Surabaya"
                    className="w-full sm:w-32 h-24 rounded-lg object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU4KGhZnWEhwLnkUcGkN7FfrjtTBmI7s9dDXzMdZBGDzk6UNil3-jRcsPlCiPzkQO3IQDWq9-t7N-LU1Yvib2THuq86ihHqTCmaKT79s0tNulOBcrLkQW1ZDUl77sbEjrxPLuhimAy2DiE1aaO8VZzkViHI3hMxRjuIQyMToJkZffRwOBWpuupknXOqXSi8ZOY1cMqmlH8ZZF6-hzHlTisiVkVQpBtZD7mOtKo9xgEjjbBRDhB1zGo"
                  />
                  <div className="flex-1">
                    <span className="font-label-caps text-label-caps text-primary uppercase">
                      Tips Cerdas Belanja Pangan
                    </span>
                    <h4 className="font-title-md text-title-md text-text-primary mb-1">
                      Kulakan Jam Dini Hari di Pasar Keputran
                    </h4>
                    <p className="font-body-sm text-body-sm text-text-secondary">
                      Untuk pembelian cabai dan sayuran segar skala UMKM, Pasar Keputran memiliki harga grosir 10-18% lebih terjangkau antara pukul 01.00 - 05.00 WIB sebelum didistribusikan ke pasar eceran kota.
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
                    >
                      <span className="material-symbols-outlined text-body-sm">restart_alt</span> Reset
                    </button>
                  </div>

                  {/* Basket Itemized List */}
                  <div className="space-y-2 mb-space-md">
                    <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-canvas text-body-sm font-body-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-body-md">inventory_2</span>
                        <span className="text-text-primary font-medium">Beras Premium</span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="px-2 py-0.5 rounded bg-surface-subtle font-metric-delta text-text-secondary">
                          5 kg
                        </span>
                        <span className="font-metric-value text-body-md text-text-primary">Rp 72.500</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-canvas text-body-sm font-body-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-body-md">water_drop</span>
                        <span className="text-text-primary font-medium">Minyak Goreng</span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="px-2 py-0.5 rounded bg-surface-subtle font-metric-delta text-text-secondary">
                          2 L
                        </span>
                        <span className="font-metric-value text-body-md text-text-primary">Rp 31.000</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-canvas text-body-sm font-body-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-body-md">egg</span>
                        <span className="text-text-primary font-medium">Telur Ayam Ras</span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="px-2 py-0.5 rounded bg-surface-subtle font-metric-delta text-text-secondary">
                          1 kg
                        </span>
                        <span className="font-metric-value text-body-md text-text-primary">Rp 27.500</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-canvas text-body-sm font-body-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-body-md">local_fire_department</span>
                        <span className="text-text-primary font-medium">Cabai Rawit Merah</span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="px-2 py-0.5 rounded bg-surface-subtle font-metric-delta text-text-secondary">
                          0.5 kg
                        </span>
                        <span className="font-metric-value text-body-md text-text-primary">Rp 34.000</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-canvas text-body-sm font-body-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-body-md">nutrition</span>
                        <span className="text-text-primary font-medium">Bawang Merah</span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="px-2 py-0.5 rounded bg-surface-subtle font-metric-delta text-text-secondary">
                          1 kg
                        </span>
                        <span className="font-metric-value text-body-md text-text-primary">Rp 32.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Market Ranking Comparison List */}
                  <div className="mb-space-md">
                    <div className="flex items-center justify-between mb-space-xs">
                      <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                        Ranking Total Belanja di 6 Pasar
                      </span>
                      <span className="font-label-caps text-label-caps text-text-muted">Real-Time Data</span>
                    </div>
                    <div className="space-y-2">
                      {/* Rank 1: Wonokromo (Paling Hemat) */}
                      <div className="p-space-xs rounded-lg bg-status-normal-bg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-status-normal text-white flex items-center justify-center font-metric-delta text-metric-delta">
                            #1
                          </span>
                          <div>
                            <span className="font-body-md text-body-md font-semibold text-text-primary">
                              Pasar Wonokromo
                            </span>
                            <span className="block font-label-caps text-label-caps text-status-normal">
                              Rekomendasi Terbaik • Termurah
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-metric-value text-metric-value text-status-normal">
                            Rp 178.500
                          </span>
                          <span className="block font-label-caps text-label-caps text-status-normal font-semibold">
                            Paling Hemat
                          </span>
                        </div>
                      </div>
                      {/* Rank 2: Keputran */}
                      <div className="p-space-xs rounded-lg bg-surface-canvas flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-surface-subtle text-text-secondary flex items-center justify-center font-metric-delta text-metric-delta">
                            #2
                          </span>
                          <div>
                            <span className="font-body-md text-body-md font-medium text-text-primary">
                              Pasar Keputran
                            </span>
                            <span className="block font-label-caps text-label-caps text-text-muted">
                              Surabaya Pusat
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-metric-value text-body-md text-text-primary">
                            Rp 182.000
                          </span>
                          <span className="block font-label-caps text-label-caps text-text-secondary">
                            +Rp 3.500
                          </span>
                        </div>
                      </div>
                      {/* Rank 3: Tambahrejo */}
                      <div className="p-space-xs rounded-lg bg-surface-canvas flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-surface-subtle text-text-secondary flex items-center justify-center font-metric-delta text-metric-delta">
                            #3
                          </span>
                          <div>
                            <span className="font-body-md text-body-md font-medium text-text-primary">
                              Pasar Tambahrejo
                            </span>
                            <span className="block font-label-caps text-label-caps text-text-muted">
                              Surabaya Utara
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-metric-value text-body-md text-text-primary">
                            Rp 184.200
                          </span>
                          <span className="block font-label-caps text-label-caps text-text-secondary">
                            +Rp 5.700
                          </span>
                        </div>
                      </div>
                      {/* Rank 4: Soponyono */}
                      <div className="p-space-xs rounded-lg bg-surface-canvas flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-surface-subtle text-text-secondary flex items-center justify-center font-metric-delta text-metric-delta">
                            #4
                          </span>
                          <div>
                            <span className="font-body-md text-body-md font-medium text-text-primary">
                              Pasar Soponyono
                            </span>
                            <span className="block font-label-caps text-label-caps text-text-muted">
                              Surabaya Timur
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-metric-value text-body-md text-text-primary">
                            Rp 188.000
                          </span>
                          <span className="block font-label-caps text-label-caps text-text-secondary">
                            +Rp 9.500
                          </span>
                        </div>
                      </div>
                      {/* Rank 5: Pucang Anom */}
                      <div className="p-space-xs rounded-lg bg-surface-canvas flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-surface-subtle text-text-secondary flex items-center justify-center font-metric-delta text-metric-delta">
                            #5
                          </span>
                          <div>
                            <span className="font-body-md text-body-md font-medium text-text-primary">
                              Pasar Pucang Anom
                            </span>
                            <span className="block font-label-caps text-label-caps text-text-muted">
                              Surabaya Tengah
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-metric-value text-body-md text-text-primary">
                            Rp 192.500
                          </span>
                          <span className="block font-label-caps text-label-caps text-status-warning">
                            +Rp 14.000
                          </span>
                        </div>
                      </div>
                      {/* Rank 6: Genteng */}
                      <div className="p-space-xs rounded-lg bg-surface-canvas flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-surface-subtle text-text-secondary flex items-center justify-center font-metric-delta text-metric-delta">
                            #6
                          </span>
                          <div>
                            <span className="font-body-md text-body-md font-medium text-text-primary">
                              Pasar Genteng
                            </span>
                            <span className="block font-label-caps text-label-caps text-text-muted">
                              Pusat Oleh-oleh
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-metric-value text-body-md text-text-primary">
                            Rp 196.000
                          </span>
                          <span className="block font-label-caps text-label-caps text-status-critical">
                            +Rp 17.500
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Savings Breakdown Card */}
                  <div className="bg-primary-fixed/25 rounded-xl p-space-sm mb-space-md flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-title-md">savings</span>
                    </div>
                    <div>
                      <span className="font-label-caps text-label-caps text-on-primary-fixed font-semibold uppercase">
                        Estimasi Penghematan Bulanan
                      </span>
                      <p className="font-body-sm text-body-sm text-on-primary-fixed-variant">
                        Belanja di Pasar Wonokromo vs Pasar Genteng menghemat hingga{" "}
                        <strong className="text-primary font-headline-sm">Rp 70.000/bulan</strong> untuk pola konsumsi 4x belanja keluarga.
                      </p>
                    </div>
                  </div>

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
                      Simpan Daftar Belanja (PDF / Catatan)
                    </button>
                  </div>
                </div>

                {/* Mini Citizen Testimonial Card */}
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex items-center gap-space-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Citizen Testimonial"
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBb1QiN7X1dW_q6Aq0j_ir3ERT1NElI6lWOu-4tLD_SDpSHwJ_qfxW2LeM7Q2GujeMnkgQE3OCARrTnrJIV9QIQqAxkzQV8_054SeQYN2tSQe04kwtpKsz3OQm3i8UYTUsML7OBask4MwkC1BuhDaPA9HAa2qCViz8-esHdoQwrsadOzqBP6SFTv08xugiq13nHGSb3JZQb8_hcwiQhgXtVsUS197lXQ-cabXZaQpBzCXWeyFdMzAAD"
                  />
                  <div className="flex-1">
                    <p className="font-body-sm text-body-sm text-text-secondary italic">
                      &quot;Sangat membantu usaha warung nasi saya. Setiap subuh cek HargaWatch dulu jadi tahu harus ambil cabai di Wonokromo atau Keputran.&quot;
                    </p>
                    <span className="font-label-caps text-label-caps text-text-muted mt-1 block">
                      — Ibu Siti Marhamah, Pelaku UMKM Rungkut
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Section: Grafik Tren Harga 14 Hari Konsumen */}
          <section className="max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop w-full mb-space-2xl" id="grafik-tren">
            <div className="bg-surface-card rounded-xl p-space-md lg:p-space-lg shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-sm mb-space-lg">
                <div>
                  <div className="flex items-center gap-space-xs mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                      Grafik Tren Konsumen (14 Hari Terakhir)
                    </span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-text-primary">
                    Dinamika Harga 4 Komoditas Pokok Utama
                  </h2>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Rata-rata tertimbang dari seluruh pasar pantauan di Surabaya per kilogram
                  </p>
                </div>
                {/* Legend Pills */}
                <div className="flex flex-wrap items-center gap-space-xs">
                  <span className="inline-flex items-center gap-1.5 px-space-xs py-1 rounded-full bg-surface-subtle font-label-caps text-label-caps text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Beras Medium
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-space-xs py-1 rounded-full bg-surface-subtle font-label-caps text-label-caps text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-critical"></span> Cabai Rawit
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-space-xs py-1 rounded-full bg-surface-subtle font-label-caps text-label-caps text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-warning"></span> Bawang Merah
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-space-xs py-1 rounded-full bg-surface-subtle font-label-caps text-label-caps text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> Telur Ayam
                  </span>
                </div>
              </div>

              {/* Multi-Line SVG Chart Canvas */}
              <div className="w-full h-64 sm:h-80 relative bg-surface-canvas rounded-xl p-space-md mb-space-md">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 240">
                  {/* Horizontal Grid Lines */}
                  <line stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" x1="40" x2="780" y1="30" y2="30"></line>
                  <line stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" x1="40" x2="780" y1="90" y2="90"></line>
                  <line stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" x1="40" x2="780" y1="150" y2="150"></line>
                  <line stroke="#CBD5E1" strokeWidth="1" x1="40" x2="780" y1="210" y2="210"></line>

                  {/* Y-Axis Labels */}
                  <text className="fill-[#94A3B8] font-metric-delta text-[10px]" x="5" y="34">
                    Rp 80k
                  </text>
                  <text className="fill-[#94A3B8] font-metric-delta text-[10px]" x="5" y="94">
                    Rp 50k
                  </text>
                  <text className="fill-[#94A3B8] font-metric-delta text-[10px]" x="5" y="154">
                    Rp 30k
                  </text>
                  <text className="fill-[#94A3B8] font-metric-delta text-[10px]" x="5" y="214">
                    Rp 10k
                  </text>

                  {/* Line 1: Cabai Rawit Merah (Volatile Rise - Red) */}
                  <path
                    d="M40,95 Q100,105 160,90 T280,85 T400,75 T520,60 T640,45 T780,38"
                    fill="none"
                    stroke="#DC2626"
                    strokeLinecap="round"
                    strokeWidth="3"
                  ></path>
                  {/* Line 2: Bawang Merah (Moderate Rise - Amber) */}
                  <path
                    d="M40,145 Q100,150 160,148 T280,140 T400,138 T520,132 T640,128 T780,125"
                    fill="none"
                    stroke="#D97706"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  ></path>
                  {/* Line 3: Telur Ayam Ras (Stable Flat - Secondary Gray/Blue) */}
                  <path
                    d="M40,165 Q100,163 160,166 T280,164 T400,165 T520,163 T640,165 T780,164"
                    fill="none"
                    stroke="#565E74"
                    strokeDasharray="6 2"
                    strokeLinecap="round"
                    strokeWidth="2"
                  ></path>
                  {/* Line 4: Beras Medium (Extremely Flat Stable - Primary Green) */}
                  <path
                    d="M40,198 Q100,198 160,197 T280,199 T400,198 T520,198 T640,197 T780,198"
                    fill="none"
                    stroke="#004328"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  ></path>
                  {/* Active Marker on Cabai Peak */}
                  <circle cx="780" cy="38" fill="#DC2626" r="5"></circle>
                </svg>

                {/* X-Axis Timeline Labels */}
                <div className="flex justify-between items-center text-text-muted font-label-caps text-label-caps pt-2 px-6">
                  <span>10 Feb</span>
                  <span>13 Feb</span>
                  <span>16 Feb</span>
                  <span>19 Feb</span>
                  <span>22 Feb</span>
                  <span className="text-primary font-bold">Hari Ini (Pk 12.00)</span>
                </div>
              </div>

              {/* Footer Metadata & Authority Assurance */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm pt-space-xs">
                <div className="flex items-center gap-space-xs text-text-secondary font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-status-normal text-body-md">
                    verified_user
                  </span>
                  <span>Data diverifikasi oleh enumerator lapangan SP2KP &amp; PD Pasar Surya Kota Surabaya.</span>
                </div>
                <div className="flex items-center gap-space-xs text-text-muted font-label-caps text-label-caps bg-surface-subtle px-space-sm py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-status-normal animate-ping"></span>
                  Sinkronisasi Server Terakhir: 10 menit lalu (24 Feb 2025, 12:00:15 WIB)
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
