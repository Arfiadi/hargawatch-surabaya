/**
 * regulatoryData.ts — Sumber Acuan Regulasi Pemerintah Resmi (HAP Bapanas & HET Kemendag)
 * serta Metrik Evaluasi Model Champion Resmi (models/forecasting/registry.json & docs/klasifikasi_hasil_forecasting.md).
 * 
 * Satu sumber kebenaran (Single Source of Truth) untuk seluruh antarmuka HargaWatch Surabaya.
 */

export interface RegulatoryBenchmark {
  label: string;
  price: number;
  unit: string;
  displayPrice: string;
  note: string;
  source: string;
}

export interface ModelChampionMeta {
  modelName: string;
  modelType: string;
  wape: number;
  accuracy: number;
  directionalAccuracy: number;
  volatility: "Stabil" | "Cukup Volatil" | "Volatil" | "Sangat Volatil";
  confidenceNote: string;
  isNaive: boolean;
  featureDescription: string;
}

/**
 * Batas Acuan Regulasi Resmi Pemerintah (HAP Bapanas & HET Kemendag)
 * Diverifikasi berdasarkan Perbadan No. 11/2022, Perbadan No. 17/2023, & Permendag No. 18/2024.
 */
export const OFFICIAL_REGULATORY_BENCHMARKS: Record<number, RegulatoryBenchmark> = {
  // 50: Cabai Rawit Merah (Batas atas HAP konsumen Bapanas)
  50: {
    label: "HAP Bapanas",
    price: 57000,
    unit: "kg",
    displayPrice: "Rp 57.000 / kg",
    note: "Harga Acuan Penjualan Konsumen Nasional (Batas Atas)",
    source: "Badan Pangan Nasional (Bapanas)",
  },
  // 38: Cabai Merah Besar (Batas atas HAP konsumen Bapanas)
  38: {
    label: "HAP Bapanas",
    price: 55000,
    unit: "kg",
    displayPrice: "Rp 55.000 / kg",
    note: "Batas Atas HAP Konsumen Cabai Merah Besar",
    source: "Badan Pangan Nasional (Bapanas)",
  },
  // 37: Cabai Merah Keriting (Batas atas HAP konsumen Bapanas)
  37: {
    label: "HAP Bapanas",
    price: 55000,
    unit: "kg",
    displayPrice: "Rp 55.000 / kg",
    note: "Batas Atas HAP Konsumen Cabai Keriting",
    source: "Badan Pangan Nasional (Bapanas)",
  },
  // 39: Bawang Merah (Perbadan 11/2022: Batas atas konsumen)
  39: {
    label: "HAP Bapanas",
    price: 41500,
    unit: "kg",
    displayPrice: "Rp 41.500 / kg",
    note: "Batas Atas Harga Acuan Penjualan Konsumen",
    source: "Perbadan No. 11/2022",
  },
  // 16: Telur Ayam Ras (Perbadan 11/2022: Konsumen Jawa Timur)
  16: {
    label: "HAP Bapanas",
    price: 27000,
    unit: "kg",
    displayPrice: "Rp 27.000 / kg",
    note: "Harga Acuan Konsumen Telur Ayam Ras",
    source: "Perbadan No. 11/2022",
  },
  // 13: Daging Ayam Ras (Perbadan 11/2022)
  13: {
    label: "HAP Bapanas",
    price: 36750,
    unit: "kg",
    displayPrice: "Rp 36.750 / kg",
    note: "Harga Acuan Konsumen Daging Ayam Ras",
    source: "Perbadan No. 11/2022",
  },
  // 12: Daging Sapi Paha Belakang (Perbadan 11/2022)
  12: {
    label: "HAP Bapanas",
    price: 140000,
    unit: "kg",
    displayPrice: "Rp 140.000 / kg",
    note: "Harga Acuan Konsumen Daging Sapi Segar",
    source: "Perbadan No. 11/2022",
  },
  // 7: Gula Kristal Putih (Perbadan 17/2023)
  7: {
    label: "HAP Bapanas",
    price: 17500,
    unit: "kg",
    displayPrice: "Rp 17.500 / kg",
    note: "Harga Acuan Penjualan Ritel Konsumen",
    source: "Perbadan No. 17/2023",
  },
  // 2: Beras Premium (HET Zona 1 Jawa Timur)
  2: {
    label: "HET Beras Premium",
    price: 14900,
    unit: "kg",
    displayPrice: "Rp 14.900 / kg",
    note: "Harga Eceran Tertinggi Zona 1 Kemendag / Bapanas",
    source: "Kemendag / Bapanas",
  },
  // 4: Beras Medium (SPHP Bulog)
  4: {
    label: "HET Beras Medium",
    price: 12500,
    unit: "kg",
    displayPrice: "Rp 12.500 / kg",
    note: "Harga Eceran Tertinggi Beras SPHP Bulog",
    source: "Bapanas / Bulog",
  },
  // 10: Minyak Goreng Curah
  10: {
    label: "HET Minyak Curah",
    price: 15700,
    unit: "liter",
    displayPrice: "Rp 15.700 / liter",
    note: "Harga Eceran Tertinggi Minyak Curah (DMO)",
    source: "Kemendag",
  },
  // 96: Minyakita (Permendag 18/2024)
  96: {
    label: "HET Minyakita",
    price: 15700,
    unit: "liter",
    displayPrice: "Rp 15.700 / liter",
    note: "Harga Eceran Tertinggi Minyakita Resmi",
    source: "Permendag No. 18/2024",
  },
  // 25: Jagung Pipilan Kering (Kadar Air 15%)
  25: {
    label: "HAP Bapanas",
    price: 5800,
    unit: "kg",
    displayPrice: "Rp 5.800 / kg",
    note: "Harga Acuan Pembelian Jagung Pipilan Kering (KA 15%)",
    source: "Bapanas",
  },
  // 32: Kedelai Impor
  32: {
    label: "HAP Bapanas",
    price: 12000,
    unit: "kg",
    displayPrice: "Rp 12.000 / kg",
    note: "Harga Acuan Pembelian Kedelai Konsumen",
    source: "Bapanas",
  },
};

/**
 * Metadata Model Champion Resmi Hasil Walk-Forward Backtesting (H+7)
 * Selaras 100% dengan models/forecasting/registry.json dan docs/klasifikasi_hasil_forecasting.md.
 */
export const OFFICIAL_MODEL_CHAMPIONS: Record<number, ModelChampionMeta> = {
  // --- Kategori 1: Produk Industri FMCG ---
  35: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.01,
    accuracy: 99.99,
    directionalAccuracy: 99.7,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (Bandrol Pabrik)",
    isNaive: true,
    featureDescription: "Bandrol kardus pabrik konstan manufaktur",
  },
  21: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.07,
    accuracy: 99.93,
    directionalAccuracy: 98.2,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (Bandrol Industri)",
    isNaive: true,
    featureDescription: "Produk industri manufaktur ritel kaleng",
  },
  20: {
    modelName: "Naive 7d SMA",
    modelType: "Baseline Deret Waktu",
    wape: 0.19,
    accuracy: 99.81,
    directionalAccuracy: 96.5,
    volatility: "Stabil",
    confidenceNote: "Moving Average 7 Hari",
    isNaive: true,
    featureDescription: "Rata-rata bergulir meredam variasi antar-kios",
  },

  // --- Kategori 2: Presisi Tinggi & Inersial ---
  14: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.07,
    accuracy: 99.93,
    directionalAccuracy: 99.2,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Inersia harga survei pasar tradisional stabil",
  },
  40: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.10,
    accuracy: 99.90,
    directionalAccuracy: 98.5,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Olahan kering awet tahan simpan bulanan",
  },
  96: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.14,
    accuracy: 99.86,
    directionalAccuracy: 96.3,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (HET Minyakita)",
    isNaive: true,
    featureDescription: "Pagu HET Bapanas & rantai distribusi resmi",
  },
  2: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.16,
    accuracy: 99.84,
    directionalAccuracy: 95.0,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (HET Terkendali)",
    isNaive: true,
    featureDescription: "Stok beras penggilingan modern & stabilisasi pasar",
  },
  28: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.24,
    accuracy: 99.76,
    directionalAccuracy: 98.9,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Inersia harga kemasan beryodium ritel",
  },
  30: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.24,
    accuracy: 99.76,
    directionalAccuracy: 96.8,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Rantai pasok distributor pabrik kemasan Bogasari",
  },
  7: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.36,
    accuracy: 99.64,
    directionalAccuracy: 91.1,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (HAP Bapanas)",
    isNaive: true,
    featureDescription: "Distribusi pabrik gula BUMN PTPN & HAP",
  },
  25: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.36,
    accuracy: 99.64,
    directionalAccuracy: 96.6,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Distribusi kios pakan ternak & unggas terarah",
  },
  4: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.42,
    accuracy: 99.58,
    directionalAccuracy: 92.3,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (SPHP Bulog)",
    isNaive: true,
    featureDescription: "Stabilisasi pasokan beras SPHP Bulog Jawa Timur",
  },
  10: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.50,
    accuracy: 99.50,
    directionalAccuracy: 93.3,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (DMO Kemendag)",
    isNaive: true,
    featureDescription: "Pasokan DMO & HET pasar tradisional",
  },
  12: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.65,
    accuracy: 99.35,
    directionalAccuracy: 85.1,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (Jangkar RPH Pegirikan)",
    isNaive: true,
    featureDescription: "Transmisi pemotongan harian RPH Pegirikan Surabaya",
  },
  32: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.72,
    accuracy: 99.28,
    directionalAccuracy: 94.7,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (Jangkar Impor)",
    isNaive: true,
    featureDescription: "Pasokan distributor gudang Pelabuhan Tanjung Perak",
  },
  43: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.86,
    accuracy: 99.14,
    directionalAccuracy: 94.8,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Karakteristik umbi lokal pasar lingkungan pasokan rutin",
  },
  17: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.97,
    accuracy: 99.03,
    directionalAccuracy: 90.1,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Pasar ritel konsumsi khusus volume teratur",
  },
  92: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.99,
    accuracy: 99.01,
    directionalAccuracy: 94.0,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Merk komersial prinsipal ritel modern & pasar",
  },
  41: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 1.11,
    accuracy: 98.89,
    directionalAccuracy: 88.3,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Biji kering tahan simpan karungan pedagang grosir",
  },
  42: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 1.15,
    accuracy: 98.85,
    directionalAccuracy: 87.2,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Stok kering distributor gudang pasar sentral",
  },
  62: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 1.23,
    accuracy: 98.77,
    directionalAccuracy: 87.2,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Rantai pasok beku cold-storage distributor ikan",
  },
  60: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 1.50,
    accuracy: 98.50,
    directionalAccuracy: 85.0,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Rantai es & stabilisasi pedagang besar pelabuhan",
  },
  59: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 1.65,
    accuracy: 98.35,
    directionalAccuracy: 88.3,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Pasokan distribusi ikan laut harian pasar basah",
  },
  61: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 1.68,
    accuracy: 98.32,
    directionalAccuracy: 85.1,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Distribusi rantai beku pelabuhan perikanan samudera",
  },
  58: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 1.90,
    accuracy: 98.10,
    directionalAccuracy: 80.7,
    volatility: "Stabil",
    confidenceNote: "Adaptive Diffusion Cone (80% CI)",
    isNaive: true,
    featureDescription: "Tambak payau lokal Sidoarjo-Gresik panen harian",
  },

  // --- Kategori 3: Moderat & Musiman ---
  13: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 2.38,
    accuracy: 97.62,
    directionalAccuracy: 50.0,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Pasokan broiler kemitraan skala besar RPA",
  },
  16: {
    modelName: "XGBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 2.97,
    accuracy: 97.03,
    directionalAccuracy: 45.7,
    volatility: "Cukup Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Siklus pakan & sentra peternak layer Blitar",
  },
  45: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 3.11,
    accuracy: 96.89,
    directionalAccuracy: 69.9,
    volatility: "Stabil",
    confidenceNote: "Adaptive Diffusion Cone (80% CI)",
    isNaive: true,
    featureDescription: "Umbi tahan simpan 3-4 minggu gudang distributor",
  },
  49: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 4.03,
    accuracy: 95.97,
    directionalAccuracy: 57.8,
    volatility: "Cukup Volatil",
    confidenceNote: "Adaptive Diffusion Cone (80% CI)",
    isNaive: true,
    featureDescription: "Rantai pasok kontainer impor Pelabuhan Tanjung Perak",
  },
  44: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 5.80,
    accuracy: 94.20,
    directionalAccuracy: 70.6,
    volatility: "Cukup Volatil",
    confidenceNote: "Adaptive Diffusion Cone (80% CI)",
    isNaive: true,
    featureDescription: "Panen rutin sayuran dataran tinggi Malang & Pujon",
  },
  47: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 5.99,
    accuracy: 94.01,
    directionalAccuracy: 60.3,
    volatility: "Cukup Volatil",
    confidenceNote: "Adaptive Diffusion Cone (80% CI)",
    isNaive: true,
    featureDescription: "Pasokan sayuran harian lereng Bromo dan Trawas",
  },

  // --- Kategori 4: Kritis & Volatil ---
  39: {
    modelName: "CatBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 8.00,
    accuracy: 92.00,
    directionalAccuracy: 33.7,
    volatility: "Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Transmisi harian sentra Nganjuk & Probolinggo",
  },
  48: {
    modelName: "XGBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 10.42,
    accuracy: 89.58,
    directionalAccuracy: 42.5,
    volatility: "Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Sayur lunak lelang harian Pasar Induk Keputran",
  },
  46: {
    modelName: "XGBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 11.65,
    accuracy: 88.35,
    directionalAccuracy: 42.2,
    volatility: "Sangat Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Sayuran lunak cepat busuk & lelang subuh Keputran",
  },
  37: {
    modelName: "CatBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 13.61,
    accuracy: 86.39,
    directionalAccuracy: 39.0,
    volatility: "Sangat Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Autoregresif, lead Keputran, & pasokan Kediri/Blitar",
  },
  38: {
    modelName: "CatBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 13.39,
    accuracy: 86.61,
    directionalAccuracy: 48.2,
    volatility: "Sangat Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Transmisi Pasar Induk Keputran & dinamika pasokan",
  },
  50: {
    modelName: "XGBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 14.35,
    accuracy: 85.65,
    directionalAccuracy: 47.2,
    volatility: "Sangat Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Lead Pasar Keputran, autoregresif multi-step, & kalender",
  },
};

/**
 * Fallback metrik untuk komoditas stabil yang tidak memiliki record tersendiri
 */
export const DEFAULT_MODEL_METRIC: ModelChampionMeta = {
  modelName: "Naive Last Value",
  modelType: "Baseline Deret Waktu",
  wape: 1.25,
  accuracy: 98.75,
  directionalAccuracy: 88.0,
  volatility: "Stabil",
  confidenceNote: "Varians Terkendali Pasar Surabaya",
  isNaive: true,
  featureDescription: "Baseline persistensi harga pasar acuan",
};
