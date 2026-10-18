"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CommoditySearchSelect from "@/components/CommoditySearchSelect";
import {
  getLiveForecastDetails,
  CommodityForecastDetails,
  FORECAST_COMMODITIES,
  ALL_CATALOG_COMMODITIES,
} from "@/lib/dataService";

// Batas acuan regulasi resmi pemerintah (HAP Bapanas / HET Kemendag)
const REGULATORY_BENCHMARKS: Record<
  number,
  { label: string; price: number; note: string }
> = {
  50: { label: "HAP Bapanas", price: 57000, note: "Harga Acuan Penjualan Konsumen Nasional" },
  39: { label: "HAP Bapanas", price: 41500, note: "Harga Acuan Penjualan Konsumen Nasional" },
  10: { label: "HET Minyakita / Curah", price: 15700, note: "Harga Eceran Tertinggi Kemendag" },
  2: { label: "HET Beras Premium", price: 14900, note: "Harga Eceran Tertinggi Zona 1 Kemendag" },
  13: { label: "HAP Bapanas", price: 36750, note: "Harga Acuan Daging Ayam Ras Segar" },
  16: { label: "HAP Bapanas", price: 27000, note: "Harga Acuan Telur Ayam Ras Konsumsi" },
  7: { label: "HAP Bapanas", price: 17500, note: "Harga Acuan Gula Konsumsi Ritel" },
};

// Karakteristik & Jalur Pasokan Faktual Sentra Jawa Timur per Komoditas (Dinamis)
interface CommoditySupplyInsight {
  characteristics: string;
  distribution: string;
}

const COMMODITY_SUPPLY_INSIGHTS: Record<number, CommoditySupplyInsight> = {
  50: {
    characteristics:
      "Komoditas hortikultura (cabai rawit merah) tergolong cepat busuk (perishable) dan sangat sensitif terhadap gangguan anomali cuaca serta curah hujan di sentra Jawa Timur, sehingga model Machine Learning (LightGBM/CatBoost) menyertakan toleransi variansi lebih adaptif dibanding pangan pokok bersubsidi.",
    distribution:
      "Stabilitas harga pasar di Surabaya ditopang arus bongkar muat harian dari sentra Kediri, Malang, Probolinggo, dan Blitar yang masuk melalui Pasar Induk Keputran dan Pasar Osowilangun sebelum didistribusikan ke pasar-pasar lingkungan.",
  },
  39: {
    characteristics:
      "Bawang merah rentan terhadap kelembapan tinggi saat musim hujan yang memicu pembusukan di gudang simpan petani, sehingga pemantauan curah hujan dan siklus tanam sentra menjadi indikator vital stabilitas harga.",
    distribution:
      "Pasokan utama mengalir lancar dari sentra Nganjuk, Probolinggo, dan Demak melalui jalur logistik darat Pantura dan arteri Jatim menuju pasar induk grosir Surabaya.",
  },
  2: {
    characteristics:
      "Beras merupakan komoditas pangan pokok strategis dengan ketahanan simpan tinggi, dipengaruhi masa panen raya gadu/rendeng serta ketersediaan stok cadangan beras pemerintah (CBP) di gudang Bulog Jatim.",
    distribution:
      "Didukung sentra lumbung padi Jawa Timur seperti Lamongan, Ngawi, Bojonegoro, dan Sidoarjo melalui jaringan distributor beras grosir dan ritel modern/tradisional Surabaya.",
  },
  10: {
    characteristics:
      "Minyak goreng curah dan Minyakita merupakan produk industri turunan kelapa sawit yang sangat dipengaruhi pasokan DMO (Domestic Market Obligation) produsen dan kepatuhan pagu HET Kemendag.",
    distribution:
      "Didistribusikan dari kawasan industri pengolahan minyak nabati di kawasan Rungkut dan Gresik melalui distributor D1/D2 ke pedagang pasar tradisional di Surabaya.",
  },
  13: {
    characteristics:
      "Daging ayam ras memiliki siklus budidaya broiler pendek (30-35 hari), dengan fluktuasi biaya produksi yang sangat dipengaruhi komponen harga pakan ternak (jagung dan konsentrat) serta bibit DOC.",
    distribution:
      "Disuplai dari peternakan kemitraan di Blitar, Jombang, Mojokerto, dan Lamongan, dipotong di Rumah Potong Unggas (RPU) resmi sebelum dipasok pagi hari ke pasar basah Surabaya.",
  },
  16: {
    characteristics:
      "Telur ayam ras memiliki masa simpan optimal 14-21 hari pada suhu ruang. Harga sangat ditentukan oleh stabilitas populasi ayam petelur (layer) aktif dan produktivitas harian di tingkat peternak.",
    distribution:
      "Sekitar 70% pasokan telur Surabaya dipasok harian dari sentra peternakan Blitar dan Tulungagung melalui armada logistik darat ke agen grosir pasar kota.",
  },
  7: {
    characteristics:
      "Gula pasir konsumsi dipengaruhi musim giling tebu pabrik gula (PG) Jawa Timur pada periode Mei-Oktober serta alokasi impor raw sugar untuk menjaga ketersediaan stok penyangga.",
    distribution:
      "Dipasok dari pabrik gula di Sidoarjo, Mojokerto, Madiun, dan pergudangan logistik penyangga di koridor Margomulyo dan Tanjung Perak Surabaya.",
  },
};

// Metadata evaluasi performa model per komoditas berbasis eksperimen backtesting (docs/eksperimen_summary_report.md)
interface ModelEvaluationMeta {
  modelName: string;
  modelType: "GBDT (Machine Learning)" | "Baseline Deret Waktu";
  wape: number; // Weighted Absolute Percentage Error (%)
  accuracy: number; // 100 - wape (%)
  directionalAccuracy: number; // Directional Accuracy (%)
  volatility: "Sangat Volatil" | "Volatil" | "Cukup Volatil" | "Stabil";
  confidenceNote: string;
  isNaive: boolean;
  featureDescription: string;
}

const COMMODITY_MODEL_METRICS: Record<number, ModelEvaluationMeta> = {
  50: {
    modelName: "LightGBM (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 13.5,
    accuracy: 86.5,
    directionalAccuracy: 54.55,
    volatility: "Sangat Volatil",
    confidenceNote: "Pita Toleransi 80% - 95% (p10-p90)",
    isNaive: false,
    featureDescription: "Harga historis lag + fitur kalender hari raya",
  },
  39: {
    modelName: "CatBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 6.97,
    accuracy: 93.03,
    directionalAccuracy: 33.33,
    volatility: "Volatil",
    confidenceNote: "Pita Toleransi 80% - 95% (p10-p90)",
    isNaive: false,
    featureDescription: "Autoregresif deret waktu murni",
  },
  16: {
    modelName: "CatBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 3.22,
    accuracy: 96.78,
    directionalAccuracy: 43.94,
    volatility: "Cukup Volatil",
    confidenceNote: "Pita Toleransi 80% - 95% (p10-p90)",
    isNaive: false,
    featureDescription: "Autoregresif deret waktu murni",
  },
  2: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.1,
    accuracy: 99.9,
    directionalAccuracy: 95.45,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (Fluktuasi < 0.1%)",
    isNaive: true,
    featureDescription: "Baseline pasar stabil (benchmark resmi)",
  },
  13: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 2.0,
    accuracy: 98.0,
    directionalAccuracy: 56.06,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (Fluktuasi < 2.0%)",
    isNaive: true,
    featureDescription: "Baseline pasar stabil out-of-sample",
  },
  10: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 3.62,
    accuracy: 96.38,
    directionalAccuracy: 60.61,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (Terikat HET Kemendag)",
    isNaive: true,
    featureDescription: "Ekuilibrium pasokan terikat HET",
  },
  7: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 1.5,
    accuracy: 98.5,
    directionalAccuracy: 88.0,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (Terikat HAP Bapanas)",
    isNaive: true,
    featureDescription: "Distribusi ritel stabil",
  },
};

export default function ForecastingPage() {
  const [selectedCommodity, setSelectedCommodity] = useState<number>(50);
  const [horizon, setHorizon] = useState<7 | 14>(14);
  const [statusFilter, setStatusFilter] = useState<"all" | "alert">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [forecastData, setForecastData] = useState<CommodityForecastDetails | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    label: string;
    price: number;
    lower?: number;
    upper?: number;
    isForecast: boolean;
    screenX?: number;
    screenY?: number;
  } | null>(null);
  const [exportState, setExportState] = useState<"idle" | "downloading" | "success">("idle");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getLiveForecastDetails(selectedCommodity).then((res) => {
      if (isMounted) {
        setForecastData(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCommodity]);

  // Sinkronisasi data guard: memastikan data forecast benar-benar milik komoditas aktif
  const isDataInSync = useMemo(() => {
    return !loading && forecastData !== null && forecastData.komoditas_id === selectedCommodity;
  }, [loading, forecastData, selectedCommodity]);

  const activeCommodityMeta = useMemo(() => {
    return (
      ALL_CATALOG_COMMODITIES.find((c) => c.id === selectedCommodity) ||
      FORECAST_COMMODITIES.find((c) => c.id === selectedCommodity) ||
      ALL_CATALOG_COMMODITIES[0]
    );
  }, [selectedCommodity]);

  const benchmarkMeta = useMemo(() => {
    return REGULATORY_BENCHMARKS[selectedCommodity];
  }, [selectedCommodity]);

  const modelMeta = useMemo(() => {
    return (
      COMMODITY_MODEL_METRICS[selectedCommodity] || {
        modelName: "GBDT Pipeline",
        modelType: "GBDT (Machine Learning)" as const,
        wape: 5.36,
        accuracy: 94.64,
        directionalAccuracy: 57.0,
        volatility: "Stabil" as const,
        confidenceNote: "Pita Toleransi 80% - 95%",
        isNaive: false,
        featureDescription: "Model deret waktu harga pangan",
      }
    );
  }, [selectedCommodity]);

  const activeForecastRows = useMemo(() => {
    if (!isDataInSync || !forecastData) return [];
    const sliced = forecastData.forecast.slice(0, horizon);
    if (statusFilter === "alert") {
      return sliced.filter((r) => r.status !== "Normal");
    }
    return sliced;
  }, [isDataInSync, forecastData, horizon, statusFilter]);

  const targetHorizonRow = useMemo(() => {
    if (!isDataInSync || !forecastData || forecastData.forecast.length === 0) return null;
    const idx = Math.min(horizon, forecastData.forecast.length) - 1;
    return forecastData.forecast[idx];
  }, [isDataInSync, forecastData, horizon]);

  const actualHorizon = useMemo(() => {
    return targetHorizonRow?.horizon || horizon;
  }, [targetHorizonRow, horizon]);

  // Evaluasi status harga vs benchmark pemerintah (hanya jika data sudah sinkron)
  const isAboveBenchmark = useMemo(() => {
    if (!isDataInSync || !forecastData || !benchmarkMeta) return false;
    return forecastData.currentPrice > benchmarkMeta.price;
  }, [isDataInSync, forecastData, benchmarkMeta]);

  const deltaHapPercent = useMemo(() => {
    if (!isDataInSync || !forecastData || !benchmarkMeta) return 0;
    return Number(
      (((forecastData.currentPrice - benchmarkMeta.price) / benchmarkMeta.price) * 100).toFixed(1)
    );
  }, [isDataInSync, forecastData, benchmarkMeta]);

  // Rekomendasi Satgas TPID dinamis berbasis status regulasi dan tren proyeksi
  const satgasRecommendation = useMemo(() => {
    if (!benchmarkMeta) {
      return "Pasokan terpantau seimbang dalam mekanisme pasar. Tetap lakukan pemantauan berkala.";
    }
    const deltaProj = targetHorizonRow?.deltaPct || 0;
    const benchmarkShortLabel = benchmarkMeta.label.split(" ")[0] || "HAP";

    if (isAboveBenchmark && deltaHapPercent >= 20) {
      return `Harga saat ini telah melampaui ${benchmarkShortLabel} sebesar +${deltaHapPercent}%. Direkomendasikan koordinasi Satgas Pangan untuk Operasi Pasar Terfokus dan audit distribusi pasokan dari sentra produksi.`;
    } else if (isAboveBenchmark) {
      return `Harga berada di atas ${benchmarkShortLabel} (+${deltaHapPercent}%). Direkomendasikan fasilitasi kelancaran logistik antar-daerah dan pengawasan margin pedagang eceran.`;
    } else if (deltaProj >= 6) {
      return `Harga saat ini aman di bawah ${benchmarkShortLabel}, namun diproyeksikan melonjak +${deltaProj}% dalam ${actualHorizon} hari. Tingkatkan pemantauan volume masuk di Pasar Induk Keputran & Osowilangun.`;
    } else {
      return `Harga aman di bawah acuan ${benchmarkMeta.label} dan tren proyeksi terpantau terkendali. Cukup pemantauan pasokan rutin tanpa alokasi intervensi pasar darurat.`;
    }
  }, [isAboveBenchmark, deltaHapPercent, benchmarkMeta, targetHorizonRow, actualHorizon]);

  // Saran belanja konsumen & UMKM dinamis
  const consumerAdvice = useMemo(() => {
    const deltaProj = targetHorizonRow?.deltaPct || 0;
    if (deltaProj >= 5) {
      return `Harga diproyeksikan cenderung naik (+${deltaProj}%). Konsumen disarankan berbelanja sesuai kebutuhan wajar dan membandingkan harga antar-pasar di halaman Peta untuk menemukan pasar termurah.`;
    } else if (deltaProj <= -5) {
      return `Harga diproyeksikan mengalami penurunan (${deltaProj}%). Pasokan berangsur normal, waktu yang baik untuk belanja berkala bagi kebutuhan rumah tangga dan UMKM.`;
    } else {
      return "Harga diproyeksikan relatif stabil dalam rentang normal. Konsumen dan pelaku usaha kuliner dapat berbelanja secara wajar sesuai kebutuhan harian.";
    }
  }, [targetHorizonRow]);

  // Karakteristik & Jalur Pasokan Sentra Dinamis per Komoditas
  const supplyInsight = useMemo(() => {
    if (COMMODITY_SUPPLY_INSIGHTS[selectedCommodity]) {
      return COMMODITY_SUPPLY_INSIGHTS[selectedCommodity];
    }
    return {
      characteristics: `Komoditas ${activeCommodityMeta.name} dipantau stabilitas harganya berdasarkan keseimbangan pasokan musiman di wilayah sentra Jawa Timur dan fluktuasi konsumsi harian masyarakat di Kota Surabaya.`,
      distribution: `Rantai pasok ${activeCommodityMeta.name} mengalir dari wilayah sentra produksi Jawa Timur melalui jaringan pasar induk grosir sebelum disalurkan ke pasar-pasar pantauan utama TPID Surabaya.`,
    };
  }, [selectedCommodity, activeCommodityMeta.name]);

  // Export CSV riil berdasarkan data aktif
  const handleExportCSV = () => {
    if (!forecastData || !isDataInSync) return;
    setExportState("downloading");

    setTimeout(() => {
      const rows = forecastData.forecast.slice(0, horizon);
      const csvHeader =
        "Horizon,Tanggal,Hari,Batas Bawah (Rp),Proyeksi Rata-rata (Rp),Batas Atas (Rp),Perubahan (%),Status,Catatan Pemantauan\n";
      const csvBody = rows
        .map(
          (r) =>
            `"H+${r.horizon}","${r.tanggal}","${r.weekday}","${r.batas_bawah}","${r.harga_prediksi}","${r.batas_atas}","${r.deltaPct}%","${r.status}","${r.recom}"`
        )
        .join("\n");

      const blob = new Blob([csvHeader + csvBody], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `proyeksi_harga_${activeCommodityMeta.name.toLowerCase().replace(/\s+/g, "_")}_${horizon}hari.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportState("success");
      setTimeout(() => setExportState("idle"), 2000);
    }, 600);
  };

  // Kalkulasi koordinat SVG Chart secara matematis dari data riil
  const chartMetrics = useMemo(() => {
    if (!isDataInSync || !forecastData || forecastData.history.length === 0) return null;

    const historyPoints = forecastData.history;
    const forecastPoints = forecastData.forecast.slice(0, horizon);

    const benchmark = REGULATORY_BENCHMARKS[selectedCommodity];

    const allPrices = [
      ...historyPoints.map((h) => h.harga),
      ...forecastPoints.flatMap((f) => [f.harga_prediksi, f.batas_bawah, f.batas_atas]),
      ...(benchmark ? [benchmark.price] : []),
    ];

    const rawMin = Math.min(...allPrices);
    const rawMax = Math.max(...allPrices);
    const padding = (rawMax - rawMin) * 0.12 || 1000;
    const minY = Math.floor((rawMin - padding) / 500) * 500;
    const maxY = Math.ceil((rawMax + padding) / 500) * 500;

    const svgWidth = 920;
    const svgHeight = 270;
    const padX = 64;
    const padTop = 36;
    const padBottom = 44;
    const plotWidth = svgWidth - padX * 2;
    const plotHeight = svgHeight - padTop - padBottom;

    const totalSteps = historyPoints.length + forecastPoints.length - 1;

    const getX = (index: number) => {
      return padX + (index / totalSteps) * plotWidth;
    };

    const getY = (val: number) => {
      return svgHeight - padBottom - ((val - minY) / (maxY - minY)) * plotHeight;
    };

    // Koordinat historis
    const histCoords = historyPoints.map((h, i) => ({
      x: getX(i),
      y: getY(h.harga),
      data: h,
    }));

    const todayIdx = historyPoints.length - 1;
    const todayCoord = histCoords[todayIdx];

    // Cek apakah terdapat rentang variansi nyata pada forecast (batas_bawah !== batas_atas)
    const hasSpread = forecastPoints.some((f) => f.batas_atas > f.batas_bawah);

    // Koordinat proyeksi
    const fcCoords = forecastPoints.map((f, i) => ({
      x: getX(todayIdx + 1 + i),
      y: getY(f.harga_prediksi),
      yLow: getY(Math.max(f.batas_bawah, forecastData.currentPrice * 0.7)),
      yHigh: getY(f.batas_atas),
      data: f,
    }));

    // Path kurva histori
    const histPath = histCoords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`;
    }, "");

    const histArea = `${histPath} L ${todayCoord.x},${svgHeight - padBottom} L ${padX},${
      svgHeight - padBottom
    } Z`;

    // Path kurva proyeksi
    const fcPath = [todayCoord, ...fcCoords].reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`;
    }, "");

    // Path Batas Toleransi (Shaded Band) - hanya dibuat bila hasSpread true
    let ciPolygonPoints = "";
    if (hasSpread) {
      const upperPoints = [todayCoord, ...fcCoords.map((c) => ({ x: c.x, y: c.yHigh }))];
      const lowerPointsReversed = [
        ...fcCoords.map((c) => ({ x: c.x, y: c.yLow })),
        todayCoord,
      ].reverse();

      ciPolygonPoints = [
        ...upperPoints.map((p) => `${p.x},${p.y}`),
        ...lowerPointsReversed.map((p) => `${p.x},${p.y}`),
      ].join(" ");
    }

    // Grid garis referensi harga horizontal
    const midPrice = Math.round((minY + maxY) / 2);
    const gridLines = [
      { price: maxY, y: getY(maxY) },
      { price: midPrice, y: getY(midPrice) },
      { price: minY, y: getY(minY) },
    ];

    // Garis benchmark HAP pemerintah jika ada
    const benchmarkY = benchmark ? getY(benchmark.price) : null;

    // 5 Penanda label sumbu X (Timeline Dinamis Berbasis Data Aktual)
    const histLen = historyPoints.length;
    const midHistIdx = Math.floor(histLen / 2);
    const midFcIdx = Math.floor(forecastPoints.length / 2);

    const xLabels = [
      {
        x: histCoords[0]?.x || padX,
        title: `${histLen} Hari Lalu`,
        sub: historyPoints[0]?.formattedDate || "",
        anchor: "start",
      },
      {
        x: histCoords[midHistIdx]?.x || getX(midHistIdx),
        title: `${histLen - 1 - midHistIdx} Hari Lalu`,
        sub: historyPoints[midHistIdx]?.formattedDate || "",
        anchor: "middle",
      },
      {
        x: todayCoord.x,
        title: "Hari Ini",
        sub: forecastData.formattedLatestDate,
        anchor: "middle",
        isToday: true,
      },
      {
        x: fcCoords[midFcIdx]?.x || getX(todayIdx + 1 + midFcIdx),
        title: `H+${forecastPoints[midFcIdx]?.horizon || Math.round(horizon / 2)}`,
        sub: forecastPoints[midFcIdx]?.formattedDate.slice(0, 6) || "",
        anchor: "middle",
      },
      {
        x: fcCoords[fcCoords.length - 1]?.x || svgWidth - padX,
        title: `H+${forecastPoints[forecastPoints.length - 1]?.horizon || horizon}`,
        sub: forecastPoints[forecastPoints.length - 1]?.formattedDate.slice(0, 6) || "",
        anchor: "end",
      },
    ];

    return {
      svgWidth,
      svgHeight,
      padX,
      padBottom,
      minY,
      maxY,
      histCoords,
      todayCoord,
      fcCoords,
      histPath,
      histArea,
      fcPath,
      ciPolygonPoints,
      hasSpread,
      gridLines,
      benchmarkY,
      benchmarkLabel: benchmark?.label,
      benchmarkPrice: benchmark?.price,
      xLabels,
    };
  }, [isDataInSync, forecastData, horizon, selectedCommodity]);

  return (
    <div className="bg-surface-canvas text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Header />

      <main className="w-full pt-20 bg-surface-canvas min-h-screen">
        <div className="flex flex-col w-full">
          <div className="w-full max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop py-space-md flex flex-col gap-space-lg">
            {/* 1. Header & Konteks Halaman */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-1">
                <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                  Proyeksi Harga Pangan &amp; Tren Pasar
                </h1>
                <p className="font-body-sm text-body-sm text-text-secondary max-w-2xl">
                  Prakiraan harga 7 hingga 14 hari ke depan di pasar Kota Surabaya untuk panduan belanja masyarakat dan bahan evaluasi kebijakan TPID.
                </p>
              </div>

              {/* Tombol Unduh CSV */}
              <div className="flex items-center gap-space-xs shrink-0">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={loading || !isDataInSync}
                  className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-headline-sm text-body-sm hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-body-md">
                    {exportState === "downloading"
                      ? "sync"
                      : exportState === "success"
                      ? "check"
                      : "download"}
                  </span>
                  <span>
                    {exportState === "downloading"
                      ? "Menyiapkan CSV..."
                      : exportState === "success"
                      ? "Berhasil Diunduh"
                      : `Unduh CSV (${activeCommodityMeta.name})`}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Panel Pilihan Komoditas & Jangka Waktu */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                {/* Pilih Komoditas */}
                <div className="flex flex-col gap-1.5 flex-1 max-w-md">
                  <label
                    className="font-label-caps text-label-caps text-text-secondary uppercase flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-body-md text-primary">
                      nutrition
                    </span>
                    Pilih Komoditas Pokok:
                  </label>
                  <CommoditySearchSelect
                    options={ALL_CATALOG_COMMODITIES}
                    valueId={selectedCommodity}
                    onChange={(id) => {
                      setSelectedCommodity(id);
                      setHoveredPoint(null);
                    }}
                    searchPlaceholder="Cari dari 38 komoditas Surabaya..."
                    emptyNoun="komoditas"
                    className="w-full"
                    panelClassName="w-full sm:w-96 md:w-[26rem]"
                  />
                </div>

                {/* Toggle Horizon Waktu */}
                <div className="flex items-center gap-space-xs self-start md:self-auto">
                  <span className="font-label-caps text-label-caps text-text-secondary uppercase mr-1">
                    Jangka Waktu:
                  </span>
                  <div className="inline-flex bg-surface-subtle p-1 rounded-lg border border-border-subtle/80" role="group" aria-label="Pilihan Horizon Waktu">
                    <button
                      type="button"
                      aria-pressed={horizon === 7}
                      onClick={() => setHorizon(7)}
                      className={`px-3 py-1.5 rounded-md text-body-sm font-semibold transition-all cursor-pointer ${
                        horizon === 7
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      7 Hari
                    </button>
                    <button
                      type="button"
                      aria-pressed={horizon === 14}
                      onClick={() => setHorizon(14)}
                      className={`px-3 py-1.5 rounded-md text-body-sm font-semibold transition-all cursor-pointer ${
                        horizon === 14
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      14 Hari
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Ringkasan Metrik Cepat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {/* Metrik 1: Harga Riil Saat Ini */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                  Harga Rata-rata Terkini
                </span>
                <div className="my-1">
                  {loading || !isDataInSync || !forecastData ? (
                    <div className="space-y-1.5 animate-pulse">
                      <div className="w-28 h-7 bg-surface-subtle rounded"></div>
                      <div className="w-36 h-3 bg-surface-subtle rounded"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="font-metric-display text-metric-display text-text-primary font-bold">
                          Rp {forecastData.currentPrice.toLocaleString("id-ID")}
                        </span>
                        <span className="font-body-sm text-body-sm text-text-secondary">
                          /{activeCommodityMeta.unit}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-text-muted">
                        Rata-rata 6 pasar per {forecastData.formattedLatestDate}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Metrik 2: Estimasi Akhir Periode */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                  Prakiraan Hari ke-{actualHorizon}
                </span>
                <div className="my-1">
                  {loading || !isDataInSync || !targetHorizonRow ? (
                    <div className="space-y-1.5 animate-pulse">
                      <div className="w-28 h-7 bg-surface-subtle rounded"></div>
                      <div className="w-32 h-3 bg-surface-subtle rounded"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="font-metric-display text-metric-display text-text-primary font-bold">
                          Rp {targetHorizonRow.harga_prediksi.toLocaleString("id-ID")}
                        </span>
                        <span className="font-body-sm text-body-sm text-text-secondary">
                          /{activeCommodityMeta.unit}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-text-muted">
                        {targetHorizonRow.weekday}, {targetHorizonRow.formattedDate}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Metrik 3: Arah Tren Perubahan */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                  Arah Perubahan Harga
                </span>
                <div className="my-1">
                  {loading || !isDataInSync || !targetHorizonRow ? (
                    <div className="space-y-1.5 animate-pulse">
                      <div className="w-32 h-7 bg-surface-subtle rounded"></div>
                      <div className="w-40 h-3 bg-surface-subtle rounded"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-metric-display text-metric-display font-bold ${
                            targetHorizonRow.deltaPct >= 3
                              ? "text-status-warning"
                              : targetHorizonRow.deltaPct <= -3
                              ? "text-status-normal"
                              : "text-text-primary"
                          }`}
                        >
                          {targetHorizonRow.deltaPct >= 0 ? "+" : ""}{targetHorizonRow.deltaPct}%
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps font-semibold ${
                            targetHorizonRow.deltaPct >= 3
                              ? "bg-status-warning-bg text-status-warning"
                              : targetHorizonRow.deltaPct <= -3
                              ? "bg-status-normal-bg text-status-normal"
                              : "bg-surface-subtle text-text-secondary"
                          }`}
                        >
                          {targetHorizonRow.deltaPct >= 3
                            ? "Cenderung Naik"
                            : targetHorizonRow.deltaPct <= -3
                            ? "Cenderung Turun"
                            : "Stabil"}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-text-muted">
                        Selisih Rp {Math.abs(targetHorizonRow.deltaRp).toLocaleString("id-ID")} dibanding saat ini
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Metrik 4: Akurasi & Model */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between">
                <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                  Model &amp; Akurasi
                </span>
                <div className="my-auto py-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-metric-display text-metric-display text-status-normal font-bold">
                      {modelMeta.accuracy.toFixed(1)}%
                    </span>
                    <span className="font-label-caps text-label-caps text-text-secondary">
                      Akurasi Backtest
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Grafik Riwayat 14 Hari & Proyeksi Mendatang */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">
                    Grafik Riwayat &amp; Proyeksi: {activeCommodityMeta.name}
                  </h2>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                    Menampilkan {forecastData?.history.length || 14} hari data historis transaksi pasar dan {actualHorizon} hari proyeksi ke depan.
                  </p>
                </div>

                {/* Legenda Grafik */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-label-caps font-label-caps">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></span>
                    <span className="text-text-primary">Rata-rata Pasar Harian</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-warning shrink-0"></span>
                    <span className="text-status-warning font-semibold">Proyeksi Model</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 border border-amber-500/50 shrink-0"></span>
                    <span className="text-text-secondary">
                      {chartMetrics?.hasSpread ? "Rentang Batas Toleransi" : "Varians Proyeksi Stabil"}
                    </span>
                  </div>
                  {chartMetrics?.benchmarkPrice && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-status-critical shrink-0"></span>
                      <span className="text-status-critical font-bold">
                        {chartMetrics.benchmarkLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Area SVG Visualizer */}
              <div
                className="w-full relative bg-surface-subtle/60 rounded-xl p-2 sm:p-3 border border-border-subtle/50 select-none overflow-hidden"
                role="region"
                aria-label="Grafik Tren dan Proyeksi Harga Pangan"
                onMouseLeave={() => setHoveredPoint(null)}
              >

                {/* Tooltip Hover Display Dinamis Mengikuti Titik */}
                {hoveredPoint && (
                  <div
                    className="absolute z-30 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-border-subtle text-left pointer-events-none transition-all duration-75 text-xs"
                    style={{
                      left: hoveredPoint.screenX ? `${Math.min(Math.max(hoveredPoint.screenX, 100), 820)}px` : undefined,
                      top: hoveredPoint.screenY ? `${Math.max(hoveredPoint.screenY - 70, 10)}px` : undefined,
                      right: !hoveredPoint.screenX ? "16px" : undefined,
                      transform: hoveredPoint.screenX ? "translateX(-50%)" : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-semibold text-text-muted text-[11px]">
                        {hoveredPoint.label}
                      </span>
                      <span className="text-[10px] text-text-muted font-medium">
                        {hoveredPoint.date}
                      </span>
                    </div>
                    <div className="font-bold text-text-primary text-sm">
                      Rp {hoveredPoint.price.toLocaleString("id-ID")}
                      <span className="text-xs font-normal text-text-secondary">/{activeCommodityMeta.unit}</span>
                    </div>
                    {hoveredPoint.lower !== undefined && hoveredPoint.upper !== undefined && (
                      <div className="mt-1 pt-1 border-t border-border-subtle/80 text-[11px] text-text-secondary">
                        {hoveredPoint.lower === hoveredPoint.upper ? (
                          <span className="text-emerald-700 font-medium">Rentang Toleransi: Stabil (Varians 0%)</span>
                        ) : (
                          <span>
                            Rentang Wajar: Rp {hoveredPoint.lower.toLocaleString("id-ID")} - {hoveredPoint.upper.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {loading ? (
                  <div className="relative w-full h-[240px] sm:h-[260px] animate-pulse select-none flex flex-col justify-between py-2">
                    <svg className="w-full h-[200px]" viewBox="0 0 1000 200" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="60" y1="30" x2="940" y2="30" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                      <line x1="60" y1="85" x2="940" y2="85" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                      <line x1="60" y1="140" x2="940" y2="140" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                      <line x1="60" y1="185" x2="940" y2="185" stroke="currentColor" strokeOpacity="0.12" />

                      {/* Today divider */}
                      <line x1="500" y1="15" x2="500" y2="185" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />

                      {/* Simulated Historical & Projection Wave */}
                      <path
                        d="M 60,120 Q 180,95 320,115 T 500,90 Q 650,75 780,82 T 940,65"
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity="0.25"
                        strokeWidth="3"
                      />
                      {/* Simulated Confidence Band Area */}
                      <path
                        d="M 500,90 Q 650,55 780,62 T 940,45 L 940,95 Q 780,105 650,100 T 500,90 Z"
                        fill="currentColor"
                        fillOpacity="0.08"
                      />
                    </svg>
                    {/* Bottom Date Labels Skeleton */}
                    <div className="flex justify-between px-6 pt-1">
                      <div className="w-16 h-3 bg-surface-subtle rounded"></div>
                      <div className="w-16 h-3 bg-surface-subtle rounded"></div>
                      <div className="w-20 h-3 bg-surface-subtle rounded"></div>
                      <div className="w-16 h-3 bg-surface-subtle rounded"></div>
                      <div className="w-16 h-3 bg-surface-subtle rounded"></div>
                    </div>
                  </div>
                ) : !isDataInSync || !chartMetrics ? (
                  <div className="h-[280px] flex flex-col items-center justify-center gap-3 text-text-muted text-center p-6">
                    <span className="material-symbols-outlined text-4xl text-status-warning">error_outline</span>
                    <div className="max-w-md">
                      <h3 className="font-headline-sm text-text-primary text-base">Data Proyeksi Belum Tersedia</h3>
                      <p className="text-body-sm text-text-secondary mt-1">
                        Model belum menghasilkan data forecast aktif untuk komoditas {activeCommodityMeta.name}. Silakan pilih komoditas lain.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLoading(true);
                        getLiveForecastDetails(selectedCommodity).then((res) => {
                          setForecastData(res);
                          setLoading(false);
                        });
                      }}
                      className="mt-1 px-4 py-2 rounded-lg bg-primary text-on-primary font-headline-sm text-body-sm hover:bg-primary-container transition-colors cursor-pointer"
                    >
                      Muat Ulang
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-[240px] sm:h-[260px]">
                    {/* 1. Vector Graph Canvas */}
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox={`0 0 ${chartMetrics.svgWidth} ${chartMetrics.svgHeight}`}
                      preserveAspectRatio="none"
                      role="img"
                      aria-label={`Grafik Tren dan Proyeksi Harga ${activeCommodityMeta.name}`}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                        <title>Grafik Proyeksi Harga {activeCommodityMeta.name}</title>
                        <defs>
                          <linearGradient id="histAreaGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#004328" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#004328" stopOpacity="0.01" />
                          </linearGradient>
                          <linearGradient id="ciBandGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#d97706" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#d97706" stopOpacity="0.04" />
                          </linearGradient>
                        </defs>

                        {/* Garis Grid Horizontal */}
                        {chartMetrics.gridLines.map((gl, i) => (
                          <line
                            key={`gl-line-${i}`}
                            x1={chartMetrics.padX}
                            x2={chartMetrics.svgWidth - chartMetrics.padX}
                            y1={gl.y}
                            y2={gl.y}
                            stroke="#CBD5E1"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                            opacity="0.6"
                          />
                        ))}

                        {/* Garis Acuan Regulasi Pemerintah (HAP / HET Bapanas) */}
                        {chartMetrics.benchmarkY !== null && chartMetrics.benchmarkPrice && (
                          <line
                            x1={chartMetrics.padX}
                            x2={chartMetrics.svgWidth - chartMetrics.padX}
                            y1={chartMetrics.benchmarkY}
                            y2={chartMetrics.benchmarkY}
                            stroke="#DC2626"
                            strokeDasharray="6 4"
                            strokeWidth="1.6"
                            opacity="0.85"
                          />
                        )}

                        {/* Shading Rentang Batas Toleransi (hanya jika ada spread variasi) */}
                        {chartMetrics.hasSpread && chartMetrics.ciPolygonPoints && (
                          <polygon fill="url(#ciBandGrad)" points={chartMetrics.ciPolygonPoints} />
                        )}

                        {/* Shading Area Histori */}
                        <path d={chartMetrics.histArea} fill="url(#histAreaGrad)" />

                        {/* Garis Histori Riil */}
                        <path
                          d={chartMetrics.histPath}
                          fill="none"
                          stroke="#004328"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                        />

                        {/* Garis Proyeksi (Dashed) */}
                        <path
                          d={chartMetrics.fcPath}
                          fill="none"
                          stroke="#D97706"
                          strokeWidth="2.8"
                          strokeDasharray="6 4"
                          strokeLinecap="round"
                        />

                        {/* Garis Vertikal Pembatas: Hari Ini */}
                        <line
                          x1={chartMetrics.todayCoord.x}
                          x2={chartMetrics.todayCoord.x}
                          y1={24}
                          y2={chartMetrics.svgHeight - chartMetrics.padBottom}
                          stroke="#0F172A"
                          strokeDasharray="4 3"
                          strokeWidth="1.5"
                          opacity="0.5"
                        />

                        {/* Titik-titik data historis */}
                        {chartMetrics.histCoords.map((pt, i) => (
                          <circle
                            key={`hist-${i}`}
                            cx={pt.x}
                            cy={pt.y}
                            r={i === chartMetrics.histCoords.length - 1 ? 5.5 : 3.5}
                            fill="#004328"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="cursor-pointer transition-transform hover:scale-125"
                            onMouseEnter={() =>
                              setHoveredPoint({
                                date: pt.data.formattedDate,
                                label:
                                  i === chartMetrics.histCoords.length - 1
                                    ? "Hari Ini (Terkini)"
                                    : pt.data.isImputed
                                    ? "Estimasi Pasar (Forward-fill)"
                                    : "Observasi Pasar",
                                price: pt.data.harga,
                                isForecast: false,
                                screenX: pt.x,
                                screenY: pt.y,
                              })
                            }
                          />
                        ))}

                        {/* Titik-titik proyeksi */}
                        {chartMetrics.fcCoords.map((pt, i) => (
                          <circle
                            key={`fc-${i}`}
                            cx={pt.x}
                            cy={pt.y}
                            r={i === chartMetrics.fcCoords.length - 1 ? 5 : 4}
                            fill="#D97706"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="cursor-pointer transition-transform hover:scale-125"
                            onMouseEnter={() =>
                              setHoveredPoint({
                                date: `${pt.data.weekday}, ${pt.data.formattedDate}`,
                                label: `Proyeksi H+${pt.data.horizon}`,
                                price: pt.data.harga_prediksi,
                                lower: pt.data.batas_bawah,
                                upper: pt.data.batas_atas,
                                isForecast: true,
                                screenX: pt.x,
                                screenY: pt.y,
                              })
                            }
                          />
                        ))}
                      </svg>

                      {/* 2. HTML Typography Overlay */}

                      {/* Label Sumbu Y (Tingkat Harga) */}
                      {chartMetrics.gridLines.map((gl, i) => (
                        <div
                          key={`gl-lbl-${i}`}
                          className="absolute -translate-y-1/2 text-[11px] font-medium text-slate-500 tabular-nums pointer-events-none select-none font-sans"
                          style={{
                            left: 0,
                            top: `${(gl.y / chartMetrics.svgHeight) * 100}%`,
                            width: `${(chartMetrics.padX / chartMetrics.svgWidth) * 100}%`,
                            paddingRight: "8px",
                            textAlign: "right",
                          }}
                        >
                          Rp {gl.price.toLocaleString("id-ID")}
                        </div>
                      ))}

                      {/* Label Garis Acuan Regulasi Pemerintah (HAP / HET) */}
                      {chartMetrics.benchmarkY !== null && chartMetrics.benchmarkPrice && (
                        <div
                          className="absolute -translate-y-full -mt-1 text-[11px] font-bold text-status-critical pointer-events-none select-none font-sans"
                          style={{
                            right: `${(chartMetrics.padX / chartMetrics.svgWidth) * 100}%`,
                            top: `${(chartMetrics.benchmarkY / chartMetrics.svgHeight) * 100}%`,
                          }}
                        >
                          Garis {chartMetrics.benchmarkLabel}: Rp {chartMetrics.benchmarkPrice.toLocaleString("id-ID")}/{activeCommodityMeta.unit}
                        </div>
                      )}

                      {/* Callout Badge: Hari Ini */}
                      <div
                        className="absolute -translate-x-1/2 -translate-y-full -mt-2.5 pointer-events-none select-none z-10 transition-all duration-150"
                        style={{
                          left: `${(chartMetrics.todayCoord.x / chartMetrics.svgWidth) * 100}%`,
                          top: `${(chartMetrics.todayCoord.y / chartMetrics.svgHeight) * 100}%`,
                        }}
                      >
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary text-on-primary text-[11px] font-bold shadow-md whitespace-nowrap font-sans">
                          Rp {forecastData ? forecastData.currentPrice.toLocaleString("id-ID") : ""}
                        </div>
                      </div>

                      {/* Callout Badge: Titik Akhir Proyeksi */}
                      {chartMetrics.fcCoords.length > 0 && targetHorizonRow && (
                        <div
                          className="absolute -translate-x-1/2 -translate-y-full -mt-2.5 pointer-events-none select-none z-10 transition-all duration-150"
                          style={{
                            left: `${(chartMetrics.fcCoords[chartMetrics.fcCoords.length - 1].x / chartMetrics.svgWidth) * 100}%`,
                            top: `${(chartMetrics.fcCoords[chartMetrics.fcCoords.length - 1].y / chartMetrics.svgHeight) * 100}%`,
                          }}
                        >
                          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-status-warning text-white text-[11px] font-bold shadow-md whitespace-nowrap font-sans">
                            H+{actualHorizon}: Rp {targetHorizonRow.harga_prediksi.toLocaleString("id-ID")}
                          </div>
                        </div>
                      )}

                      {/* Label Sumbu X Dinamis */}
                      <div className="absolute left-0 right-0 bottom-1 pointer-events-none select-none">
                        {chartMetrics.xLabels.map((lbl, idx) => (
                          <div
                            key={`xlbl-${idx}`}
                            className={`absolute text-center ${
                              lbl.anchor === "start"
                                ? "translate-x-0"
                                : lbl.anchor === "end"
                                ? "-translate-x-full"
                                : "-translate-x-1/2"
                            }`}
                            style={{
                              left: `${(lbl.x / chartMetrics.svgWidth) * 100}%`,
                            }}
                          >
                            <span
                              className={`block text-[11px] leading-tight font-sans ${
                                lbl.isToday
                                  ? "text-text-primary font-bold"
                                  : "text-text-secondary font-semibold"
                              }`}
                            >
                              {lbl.title}
                            </span>
                            <span
                              className={`block text-[10px] leading-tight mt-0.5 font-sans ${
                                lbl.isToday
                                  ? "text-primary font-bold"
                                  : "text-text-muted font-normal"
                              }`}
                            >
                              {lbl.sub}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                )}
              </div>
            </div>

            {/* 5. Kotak Panduan Interpretasi Praktis bagi Stakeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Card 1: Bagi Masyarakat & Konsumen */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-body-lg">shopping_basket</span>
                    </span>
                    <span className="font-headline-sm text-body-md text-text-primary">
                      Panduan bagi Masyarakat &amp; UMKM
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps font-semibold ${
                      (targetHorizonRow?.deltaPct || 0) >= 5
                        ? "bg-status-warning-bg text-status-warning"
                        : "bg-status-normal-bg text-status-normal"
                    }`}
                  >
                    {(targetHorizonRow?.deltaPct || 0) >= 5
                      ? "Perlu Perhatian"
                      : "Kondisi Belanja Aman"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                    Harga {activeCommodityMeta.name} diprediksi{" "}
                    <strong>
                      {(targetHorizonRow?.deltaPct || 0) >= 3
                        ? `mengalami kenaikan sekitar +${targetHorizonRow?.deltaPct}%`
                        : (targetHorizonRow?.deltaPct || 0) <= -3
                        ? `mengalami penurunan sekitar ${targetHorizonRow?.deltaPct}%`
                        : "relatif stabil di kisaran harga saat ini"}
                    </strong>{" "}
                    dalam {actualHorizon} hari ke depan.
                  </p>
                  <div className="bg-surface-subtle p-2.5 rounded-lg flex items-start gap-2 text-text-primary font-body-sm text-body-sm border border-border-subtle/50">
                    <span className="material-symbols-outlined text-primary text-body-md shrink-0 mt-0.5">
                      lightbulb
                    </span>
                    <span>
                      <strong>Saran Belanja:</strong> {consumerAdvice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Bagi Pemerintah Kota Surabaya & TPID */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col justify-between gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-status-warning-bg text-status-warning flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-body-lg">account_balance</span>
                    </span>
                    <span className="font-headline-sm text-body-md text-text-primary">
                      Panduan bagi Pemkot Surabaya &amp; TPID
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps font-semibold ${
                      isAboveBenchmark
                        ? "bg-status-critical-bg text-status-critical"
                        : "bg-status-normal-bg text-status-normal"
                    }`}
                  >
                    {benchmarkMeta
                      ? isAboveBenchmark
                        ? `Di Atas ${benchmarkMeta.label.split(" ")[0]} (+${deltaHapPercent}%)`
                        : `Sesuai ${benchmarkMeta.label.split(" ")[0]}`
                      : "Stabil"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                    {benchmarkMeta && isDataInSync && forecastData ? (
                      <>
                        Harga rata-rata pasar saat ini berada{" "}
                        <strong>
                          {isAboveBenchmark
                            ? `Rp ${(forecastData.currentPrice - benchmarkMeta.price).toLocaleString("id-ID")} di atas ${benchmarkMeta.label}`
                            : `dalam batas aman regulasi ${benchmarkMeta.label}`}
                        </strong>{" "}
                        (Rp {benchmarkMeta.price.toLocaleString("id-ID")}/{activeCommodityMeta.unit}).
                      </>
                    ) : (
                      "Harga komoditas berada dalam koridor ekuilibrium pasar yang terpantau terkendali."
                    )}
                  </p>
                  <div className="bg-surface-subtle p-2.5 rounded-lg flex items-start gap-2 text-text-primary font-body-sm text-body-sm border border-border-subtle/50">
                    <span className="material-symbols-outlined text-status-warning text-body-md shrink-0 mt-0.5">
                      policy
                    </span>
                    <span>
                      <strong>Rekomendasi Satgas:</strong> {satgasRecommendation}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Tabel Rincian Proyeksi Harian */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">
                    Rincian Proyeksi Harian (H+1 s/d H+{actualHorizon})
                  </h2>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-0.5">
                    Taksiran harga rata-rata, rentang toleransi, dan catatan pemantauan harian.
                  </p>
                </div>

                {/* Filter Status Tabel */}
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-caps text-label-caps text-text-muted mr-1">Status:</span>
                  <button
                    type="button"
                    aria-pressed={statusFilter === "all"}
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 rounded-md font-label-caps text-label-caps transition-colors cursor-pointer ${
                      statusFilter === "all"
                        ? "bg-primary text-on-primary"
                        : "bg-surface-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Semua ({actualHorizon})
                  </button>
                  <button
                    type="button"
                    aria-pressed={statusFilter === "alert"}
                    onClick={() => setStatusFilter("alert")}
                    className={`px-3 py-1 rounded-md font-label-caps text-label-caps transition-colors cursor-pointer ${
                      statusFilter === "alert"
                        ? "bg-status-warning text-on-primary"
                        : "bg-surface-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Waspada / Perhatian
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-subtle font-label-caps text-label-caps text-text-secondary uppercase">
                      <th scope="col" className="py-3 px-4 rounded-l-lg">Horizon</th>
                      <th scope="col" className="py-3 px-4">Tanggal</th>
                      <th scope="col" className="py-3 px-4">Batas Bawah</th>
                      <th scope="col" className="py-3 px-4">Proyeksi Rata-rata</th>
                      <th scope="col" className="py-3 px-4">Batas Atas</th>
                      <th scope="col" className="py-3 px-4">Perubahan vs Saat Ini</th>
                      <th scope="col" className="py-3 px-4">Status</th>
                      <th scope="col" className="py-3 px-4 rounded-r-lg">Catatan Pemantauan</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm divide-y divide-surface-subtle">
                    {loading ? (
                      Array.from({ length: 7 }).map((_, idx) => (
                        <tr key={idx} className="border-b border-surface-subtle/40 animate-pulse">
                          <td className="py-3 px-4">
                            <div className="w-10 h-4 bg-surface-subtle rounded"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="w-16 h-3.5 bg-surface-subtle rounded"></div>
                              <div className="w-20 h-2.5 bg-surface-subtle rounded"></div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-20 h-4 bg-surface-subtle rounded"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-20 h-4 bg-surface-subtle rounded"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-20 h-4 bg-surface-subtle rounded"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-14 h-4 bg-surface-subtle rounded"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-16 h-5 bg-surface-subtle rounded-full"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-48 h-4 bg-surface-subtle rounded"></div>
                          </td>
                        </tr>
                      ))
                    ) : activeForecastRows.length > 0 ? (
                      activeForecastRows.map((row) => (
                        <tr key={row.horizon} className="hover:bg-surface-subtle/50 transition-colors">
                          <td className="py-3 px-4 font-headline-sm text-body-md text-text-primary">
                            H+{row.horizon}
                          </td>
                          <td className="py-3 px-4 text-text-secondary">
                            <span className="font-semibold text-text-primary block">
                              {row.weekday}
                            </span>
                            <span className="text-[12px] text-text-muted">{row.formattedDate}</span>
                          </td>
                          <td className="py-3 px-4 text-text-secondary">
                            Rp {row.batas_bawah.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 font-semibold text-text-primary">
                            Rp {row.harga_prediksi.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-text-secondary">
                            Rp {row.batas_atas.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-semibold ${
                                row.deltaPct >= 3
                                  ? "text-status-warning"
                                  : row.deltaPct <= -3
                                  ? "text-status-normal"
                                  : "text-text-secondary"
                              }`}
                            >
                              {row.deltaPct >= 0 ? `+${row.deltaPct}%` : `${row.deltaPct}%`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-label-caps font-semibold ${
                                row.status === "Tinggi"
                                  ? "bg-status-critical-bg text-status-critical"
                                  : row.status === "Waspada"
                                  ? "bg-status-warning-bg text-status-warning"
                                  : "bg-status-normal-bg text-status-normal"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-secondary max-w-xs">{row.recom}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-text-muted">
                          Tidak ada baris yang memenuhi kriteria filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. Karakteristik Komoditas & Jalur Pasokan (Faktual Dinamis Sesuai Temuan Riset & Komoditas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary font-headline-sm text-body-md">
                  <span className="material-symbols-outlined text-body-lg">insights</span>
                  <span>Karakteristik &amp; Sensitivitas Pasokan</span>
                </div>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  {supplyInsight.characteristics}
                </p>
              </div>

              <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-subtle/70 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary font-headline-sm text-body-md">
                  <span className="material-symbols-outlined text-body-lg">local_shipping</span>
                  <span>Jalur Distribusi Sentra ke Surabaya</span>
                </div>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  {supplyInsight.distribution}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
