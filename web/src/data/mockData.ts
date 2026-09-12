export interface Market {
  id: number;
  slug: string;
  name: string;
  zone: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
}

export const MARKETS: Market[] = [
  { id: 2, slug: "wonokromo", name: "Pasar Wonokromo", zone: "Selatan", type: "Pasar Tradisional & Kios TPID", lat: -7.3015, lng: 112.7388, address: "Jl. Stasiun Wonokromo No.1" },
  { id: 5, slug: "keputran", name: "Pasar Keputran", zone: "Pusat", type: "Pasar Induk Grosir", lat: -7.2798, lng: 112.7441, address: "Jl. Keputran No.12, Tegalsari" },
  { id: 4, slug: "pucanganom", name: "Pasar Pucang Anom", zone: "Timur", type: "Pasar Tradisional & Kios TPID", lat: -7.2834, lng: 112.7562, address: "Jl. Pucang Anom, Gubeng" },
  { id: 3, slug: "genteng", name: "Pasar Genteng", zone: "Pusat", type: "Pasar Ritel & Oleh-oleh", lat: -7.2589, lng: 112.7412, address: "Jl. Genteng Besar, Genteng" },
  { id: 1, slug: "tambahrejo", name: "Pasar Tambahrejo", zone: "Utara", type: "Pasar Tradisional & Kios TPID", lat: -7.2435, lng: 112.7591, address: "Jl. Kapas Krampung, Simokerto" },
  { id: 146, slug: "soponyono", name: "Pasar Soponyono", zone: "Timur", type: "Pasar Ritel Modern", lat: -7.3204, lng: 112.7754, address: "Jl. Rungkut Asri, Rungkut" },
];

export interface Commodity {
  id: number;
  name: string;
  category: "beras" | "cabai-bawang" | "daging" | "minyak-gula" | "telur";
  unit: string;
  averagePrice: number;
  deltaPercent: number;
  warningStatus: "NORMAL" | "WASPADA" | "TINGGI";
  cheapestMarketId: number;
  cheapestPrice: number;
  highestMarketId: number;
  highestPrice: number;
  marketPrices: Record<number, number>;
  sparkline: number[];
  forecastH7: { date: string; price: number; lower: number; upper: number }[];
  volatilityZScore: number;
}

export const COMMODITIES: Commodity[] = [
  {
    id: 1,
    name: "Cabai Rawit Merah",
    category: "cabai-bawang",
    unit: "kg",
    averagePrice: 52000,
    deltaPercent: 8.8,
    warningStatus: "TINGGI",
    cheapestMarketId: 5, // Keputran
    cheapestPrice: 46000,
    highestMarketId: 3, // Genteng
    highestPrice: 57500,
    marketPrices: {
      1: 53000,
      2: 51500,
      3: 57500,
      4: 52000,
      5: 46000,
      146: 52000,
    },
    sparkline: [43000, 44500, 45000, 47800, 49500, 50000, 52000],
    forecastH7: [
      { date: "H+1", price: 53500, lower: 51000, upper: 55800 },
      { date: "H+2", price: 54800, lower: 52000, upper: 57500 },
      { date: "H+3", price: 56000, lower: 53100, upper: 59200 },
      { date: "H+4", price: 56500, lower: 53000, upper: 60100 },
      { date: "H+5", price: 55200, lower: 51500, upper: 59000 },
      { date: "H+6", price: 54000, lower: 50000, upper: 58000 },
      { date: "H+7", price: 53000, lower: 48500, upper: 57200 },
    ],
    volatilityZScore: 2.34,
  },
  {
    id: 2,
    name: "Beras Premium",
    category: "beras",
    unit: "kg",
    averagePrice: 15400,
    deltaPercent: -0.6,
    warningStatus: "NORMAL",
    cheapestMarketId: 5,
    cheapestPrice: 14800,
    highestMarketId: 146,
    highestPrice: 15800,
    marketPrices: {
      1: 15300,
      2: 15200,
      3: 15600,
      4: 15500,
      5: 14800,
      146: 15800,
    },
    sparkline: [15600, 15500, 15500, 15400, 15450, 15400, 15400],
    forecastH7: [
      { date: "H+1", price: 15400, lower: 15200, upper: 15600 },
      { date: "H+2", price: 15350, lower: 15150, upper: 15550 },
      { date: "H+3", price: 15300, lower: 15100, upper: 15500 },
      { date: "H+4", price: 15300, lower: 15050, upper: 15550 },
      { date: "H+5", price: 15250, lower: 15000, upper: 15500 },
      { date: "H+6", price: 15200, lower: 14950, upper: 15450 },
      { date: "H+7", price: 15200, lower: 14900, upper: 15500 },
    ],
    volatilityZScore: 0.42,
  },
  {
    id: 3,
    name: "Beras Medium",
    category: "beras",
    unit: "kg",
    averagePrice: 13300,
    deltaPercent: 0.0,
    warningStatus: "NORMAL",
    cheapestMarketId: 2,
    cheapestPrice: 12900,
    highestMarketId: 3,
    highestPrice: 13600,
    marketPrices: {
      1: 13200,
      2: 12900,
      3: 13600,
      4: 13400,
      5: 13000,
      146: 13500,
    },
    sparkline: [13300, 13300, 13300, 13300, 13300, 13300, 13300],
    forecastH7: [
      { date: "H+1", price: 13300, lower: 13100, upper: 13500 },
      { date: "H+2", price: 13300, lower: 13100, upper: 13500 },
      { date: "H+3", price: 13300, lower: 13050, upper: 13550 },
      { date: "H+4", price: 13250, lower: 13000, upper: 13500 },
      { date: "H+5", price: 13250, lower: 13000, upper: 13500 },
      { date: "H+6", price: 13200, lower: 12950, upper: 13450 },
      { date: "H+7", price: 13200, lower: 12900, upper: 13500 },
    ],
    volatilityZScore: 0.18,
  },
  {
    id: 4,
    name: "Bawang Merah Super",
    category: "cabai-bawang",
    unit: "kg",
    averagePrice: 34500,
    deltaPercent: 4.5,
    warningStatus: "WASPADA",
    cheapestMarketId: 5,
    cheapestPrice: 30000,
    highestMarketId: 146,
    highestPrice: 38000,
    marketPrices: {
      1: 35000,
      2: 34000,
      3: 36000,
      4: 34500,
      5: 30000,
      146: 38000,
    },
    sparkline: [31000, 32000, 32500, 33000, 33500, 34000, 34500],
    forecastH7: [
      { date: "H+1", price: 35200, lower: 33500, upper: 37000 },
      { date: "H+2", price: 35900, lower: 34000, upper: 38000 },
      { date: "H+3", price: 36400, lower: 34200, upper: 38800 },
      { date: "H+4", price: 36800, lower: 34500, upper: 39500 },
      { date: "H+5", price: 36500, lower: 34000, upper: 39200 },
      { date: "H+6", price: 36000, lower: 33500, upper: 38800 },
      { date: "H+7", price: 35500, lower: 33000, upper: 38200 },
    ],
    volatilityZScore: 1.48,
  },
  {
    id: 5,
    name: "Minyakita Kemasan",
    category: "minyak-gula",
    unit: "liter",
    averagePrice: 15500,
    deltaPercent: 0.0,
    warningStatus: "NORMAL",
    cheapestMarketId: 2,
    cheapestPrice: 15000,
    highestMarketId: 4,
    highestPrice: 16000,
    marketPrices: {
      1: 15500,
      2: 15000,
      3: 15700,
      4: 16000,
      5: 15200,
      146: 15600,
    },
    sparkline: [15500, 15500, 15500, 15500, 15500, 15500, 15500],
    forecastH7: [
      { date: "H+1", price: 15500, lower: 15200, upper: 15800 },
      { date: "H+2", price: 15500, lower: 15200, upper: 15800 },
      { date: "H+3", price: 15500, lower: 15150, upper: 15850 },
      { date: "H+4", price: 15500, lower: 15100, upper: 15900 },
      { date: "H+5", price: 15500, lower: 15100, upper: 15900 },
      { date: "H+6", price: 15500, lower: 15000, upper: 16000 },
      { date: "H+7", price: 15500, lower: 15000, upper: 16000 },
    ],
    volatilityZScore: 0.25,
  },
  {
    id: 6,
    name: "Daging Ayam Broiler",
    category: "daging",
    unit: "kg",
    averagePrice: 34500,
    deltaPercent: 1.2,
    warningStatus: "NORMAL",
    cheapestMarketId: 1,
    cheapestPrice: 33000,
    highestMarketId: 146,
    highestPrice: 36000,
    marketPrices: {
      1: 33000,
      2: 34000,
      3: 35000,
      4: 34500,
      5: 33500,
      146: 36000,
    },
    sparkline: [33800, 34000, 34000, 34200, 34300, 34400, 34500],
    forecastH7: [
      { date: "H+1", price: 34700, lower: 33800, upper: 35600 },
      { date: "H+2", price: 34900, lower: 33900, upper: 35900 },
      { date: "H+3", price: 35100, lower: 34000, upper: 36200 },
      { date: "H+4", price: 35000, lower: 33800, upper: 36200 },
      { date: "H+5", price: 34800, lower: 33500, upper: 36000 },
      { date: "H+6", price: 34600, lower: 33200, upper: 35800 },
      { date: "H+7", price: 34500, lower: 33000, upper: 35700 },
    ],
    volatilityZScore: 0.65,
  },
  {
    id: 7,
    name: "Telur Ayam Ras",
    category: "telur",
    unit: "kg",
    averagePrice: 27500,
    deltaPercent: -1.8,
    warningStatus: "NORMAL",
    cheapestMarketId: 2,
    cheapestPrice: 26500,
    highestMarketId: 4,
    highestPrice: 28500,
    marketPrices: {
      1: 27500,
      2: 26500,
      3: 28000,
      4: 28500,
      5: 27000,
      146: 28000,
    },
    sparkline: [28500, 28200, 28000, 27800, 27600, 27500, 27500],
    forecastH7: [
      { date: "H+1", price: 27400, lower: 26800, upper: 28000 },
      { date: "H+2", price: 27300, lower: 26600, upper: 28000 },
      { date: "H+3", price: 27200, lower: 26500, upper: 27900 },
      { date: "H+4", price: 27200, lower: 26400, upper: 28000 },
      { date: "H+5", price: 27100, lower: 26200, upper: 28000 },
      { date: "H+6", price: 27000, lower: 26000, upper: 28000 },
      { date: "H+7", price: 27000, lower: 25900, upper: 28100 },
    ],
    volatilityZScore: 0.54,
  },
  {
    id: 8,
    name: "Daging Sapi Murni",
    category: "daging",
    unit: "kg",
    averagePrice: 116000,
    deltaPercent: 0.0,
    warningStatus: "NORMAL",
    cheapestMarketId: 5,
    cheapestPrice: 112000,
    highestMarketId: 3,
    highestPrice: 120000,
    marketPrices: {
      1: 115000,
      2: 115000,
      3: 120000,
      4: 118000,
      5: 112000,
      146: 118000,
    },
    sparkline: [116000, 116000, 116000, 116000, 116000, 116000, 116000],
    forecastH7: [
      { date: "H+1", price: 116000, lower: 114000, upper: 118000 },
      { date: "H+2", price: 116000, lower: 114000, upper: 118000 },
      { date: "H+3", price: 116500, lower: 114000, upper: 119000 },
      { date: "H+4", price: 116500, lower: 113500, upper: 119500 },
      { date: "H+5", price: 117000, lower: 114000, upper: 120000 },
      { date: "H+6", price: 117000, lower: 113800, upper: 120500 },
      { date: "H+7", price: 117000, lower: 113500, upper: 121000 },
    ],
    volatilityZScore: 0.12,
  },
];

export const EARLY_WARNING_ALERTS = [
  {
    id: 1,
    commodity: "Cabai Rawit Merah",
    status: "TINGGI",
    reason: "Lonjakan harga +8.8% dalam 48 jam terakhir. Z-Score 2.34 (ambang batas > 2.0). Pasokan lereng Gunung Bromo tertahan cuaca ekstrem.",
    affectedMarkets: ["Pasar Keputran", "Pasar Genteng", "Pasar Wonokromo"],
    recommendation: "Intervensi TPID: Operasi Pasar Terarah & subsidi angkut dari sentra Blitar/Kediri.",
    timestamp: "Update 10m Lalu",
  },
  {
    id: 2,
    commodity: "Bawang Merah Super",
    status: "WASPADA",
    reason: "Kenaikan harga mingguan sebesar +4.5%. Fluktuasi di tingkat distributor Nganjuk meningkat.",
    affectedMarkets: ["Pasar Soponyono", "Pasar Genteng"],
    recommendation: "Pantau pasokan di gudang distributor lini 2 Surabaya.",
    timestamp: "Update 45m Lalu",
  },
  {
    id: 3,
    commodity: "Beras Premium & Medium",
    status: "NORMAL",
    reason: "Stok Bulog Cabang Surabaya aman (kecukupan 3.4 bulan). Harga stabil dalam batas HET.",
    affectedMarkets: ["Semua Pasar"],
    recommendation: "Pertahankan penyaluran rutin SPHP ke Kios TPID.",
    timestamp: "Update 2j Lalu",
  },
];
