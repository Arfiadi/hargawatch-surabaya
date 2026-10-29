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
  50: {
    modelName: "XGBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 14.97,
    accuracy: 85.03,
    directionalAccuracy: 31.5,
    volatility: "Sangat Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Fitur autoregresif, transmisi Keputran, & kalender hari besar",
  },
  39: {
    modelName: "CatBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 8.02,
    accuracy: 91.98,
    directionalAccuracy: 65.2,
    volatility: "Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Transmisi Pasar Induk Keputran & dinamika pasokan Nganjuk",
  },
  38: {
    modelName: "XGBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 13.63,
    accuracy: 86.37,
    directionalAccuracy: 26.3,
    volatility: "Sangat Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Lead Pasar Keputran & autoregresif multi-step",
  },
  48: {
    modelName: "XGBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 9.57,
    accuracy: 90.43,
    directionalAccuracy: 61.4,
    volatility: "Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Lelang harian sayur & fluktuasi panen",
  },
  16: {
    modelName: "XGBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 3.04,
    accuracy: 96.96,
    directionalAccuracy: 74.2,
    volatility: "Cukup Volatil",
    confidenceNote: "Pita Risiko Kuantil 80% CI (p10-p90)",
    isNaive: false,
    featureDescription: "Dinamika populasi layer & pakan ternak Blitar",
  },
  43: {
    modelName: "LightGBM (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 0.29,
    accuracy: 99.71,
    directionalAccuracy: 38.2,
    volatility: "Stabil",
    confidenceNote: "Varians Terkendali (Pita Sempit)",
    isNaive: false,
    featureDescription: "Karakteristik umbi lokal pasar lingkungan",
  },
  28: {
    modelName: "XGBoost (p50)",
    modelType: "GBDT (Machine Learning)",
    wape: 0.05,
    accuracy: 99.95,
    directionalAccuracy: 58.0,
    volatility: "Stabil",
    confidenceNote: "Varians Terkendali",
    isNaive: false,
    featureDescription: "Variasi mikro kemasan beryodium",
  },
  2: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.10,
    accuracy: 99.90,
    directionalAccuracy: 98.5,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (HET Terkendali)",
    isNaive: true,
    featureDescription: "Baseline pasar stabil (benchmark resmi)",
  },
  4: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.44,
    accuracy: 99.56,
    directionalAccuracy: 92.1,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (SPHP Bulog)",
    isNaive: true,
    featureDescription: "Pasokan Bulog Jawa Timur",
  },
  7: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.62,
    accuracy: 99.38,
    directionalAccuracy: 93.4,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (HAP Bapanas)",
    isNaive: true,
    featureDescription: "Distribusi ritel stabil BUMN",
  },
  10: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.23,
    accuracy: 99.77,
    directionalAccuracy: 96.8,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (DMO Kemendag)",
    isNaive: true,
    featureDescription: "Pasokan DMO & HET pasar tradisional",
  },
  96: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.13,
    accuracy: 99.87,
    directionalAccuracy: 97.0,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (HET Minyakita)",
    isNaive: true,
    featureDescription: "HET resmi pemerintah",
  },
  13: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 2.00,
    accuracy: 98.00,
    directionalAccuracy: 84.2,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Ayam ras kemitraan broiler",
  },
  14: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.01,
    accuracy: 99.99,
    directionalAccuracy: 99.2,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan",
    isNaive: true,
    featureDescription: "Pasar ritel ayam kampung stabil",
  },
  12: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.69,
    accuracy: 99.31,
    directionalAccuracy: 91.5,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (Jangkar RPH Pegirikan)",
    isNaive: true,
    featureDescription: "Transmisi RPH Pegirikan Surabaya",
  },
  35: {
    modelName: "Naive Last Value",
    modelType: "Baseline Deret Waktu",
    wape: 0.00,
    accuracy: 100.0,
    directionalAccuracy: 100.0,
    volatility: "Stabil",
    confidenceNote: "Varians Konstan (Bandrol Pabrik)",
    isNaive: true,
    featureDescription: "Harga cetakan industri FMCG",
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
