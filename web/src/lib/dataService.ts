import { supabase } from "./supabase";

export interface CommodityPrice {
  id: string;
  komoditas_id?: number;
  category: string;
  tag: string;
  name: string;
  status: string;
  isCritical: boolean;
  isWarning: boolean;
  cheapestBadge: string;
  cheapestSub: string;
  marketName: string;
  marketSub: string;
  price: string;
  numericPrice?: number;
  unit: string;
  cityAvg: string;
  numericCityAvg?: number;
  delta: string;
  deltaIcon: string;
  deltaClass: string;
  sparkPath: string;
  sparkClass: string;
  basketItemName: string;
  basketItemPrice: number;
}

export interface EarlyWarningItem {
  komoditas_id: number;
  nama_komoditas: string;
  pasar_id: number;
  nama_pasar: string;
  total_skor: number;
  status_warning: "NORMAL" | "WASPADA" | "TINGGI";
  skor_tren: number;
  skor_volatilitas: number;
  skor_anomali: number;
  skor_prediksi: number;
  harga_terakhir?: number;
}

export interface ForecastDayItem {
  horizon: number;
  tanggal: string;
  harga_prediksi: number;
  batas_bawah: number;
  batas_atas: number;
  status: string;
}

export interface FoodStabilitySummary {
  stabilityIndex: string;
  targetText: string;
  isNormal: boolean;
  statusLabel: string;
  normalCount: number;
  alertCount: number;
  alertNote: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerMessage: string;
  hasAlert: boolean;
}

// 0. Fetch live Food Stability Summary from fact_early_warning
export async function getLiveStabilitySummary(): Promise<FoodStabilitySummary | null> {
  if (!supabase) return null;

  try {
    const [komRes, pasarRes, ewsRes] = await Promise.all([
      supabase.from("dim_komoditas").select("komoditas_id, nama_komoditas"),
      supabase.from("dim_pasar").select("pasar_id, nama_pasar"),
      supabase.from("fact_early_warning").select("*").order("total_skor", { ascending: false })
    ]);

    if (!ewsRes.data || ewsRes.data.length === 0) return null;

    const komMap = new Map(komRes.data?.map(k => [k.komoditas_id, k.nama_komoditas]) || []);
    const pasarMap = new Map(pasarRes.data?.map(p => [p.pasar_id, p.nama_pasar]) || []);

    const total = ewsRes.data.length;
    const normalCount = ewsRes.data.filter(r => r.status_warning === "NORMAL").length;
    const warningItems = ewsRes.data.filter(r => r.status_warning !== "NORMAL");
    const alertCount = warningItems.length;
    const stabilityPct = ((normalCount / total) * 100).toFixed(1);

    if (alertCount > 0) {
      const top = warningItems[0];
      const komName = komMap.get(top.komoditas_id) || "Komoditas Pangan";
      const pasarName = pasarMap.get(top.pasar_id) || "Pasar Acuan";
      return {
        stabilityIndex: `${stabilityPct}%`,
        targetText: "Target Kota > 90%",
        isNormal: false,
        statusLabel: "Waspada",
        normalCount,
        alertCount,
        alertNote: komName,
        bannerTitle: "Waspada Fluktuasi Pasar",
        bannerSubtitle: `Pemantauan EWS Terkini (${top.tanggal || "Hari Ini"})`,
        bannerMessage: `${komName} di ${pasarName} menunjukkan sinyal peningkatan dengan skor risiko ${top.total_skor}/100. Satgas pangan menyarankan pemantauan pasokan di pasar induk.`,
        hasAlert: true,
      };
    } else {
      const highest = ewsRes.data[0];
      const topKomName = komMap.get(highest.komoditas_id) || "Pangan Pokok";
      const topPasarName = pasarMap.get(highest.pasar_id) || "Pasar Acuan";
      return {
        stabilityIndex: `${stabilityPct}%`,
        targetText: "Target Kota > 90%",
        isNormal: true,
        statusLabel: "Kondisi Stabil",
        normalCount,
        alertCount: 0,
        alertNote: "Semua Terkendali",
        bannerTitle: "Stabilitas Harga Pangan Terkendali",
        bannerSubtitle: `Pantauan 6 Pasar Resmi (${highest.tanggal || "Hari Ini"})`,
        bannerMessage: `Seluruh 6 komoditas bahan pokok di 6 pasar Surabaya terpantau stabil dalam rentang harga wajar tanpa indikasi lonjakan harga ekstrem.`,
        hasAlert: false,
      };
    }
  } catch (err) {
    console.error("Failed to fetch stability summary:", err);
    return null;
  }
}

// 1. Fetch live commodity cards for Public Dashboard
export async function getLiveCommodities(): Promise<CommodityPrice[] | null> {
  if (!supabase) return null;

  try {
    const priorityIds = [2, 10, 50, 16, 39, 13]; // Beras, Minyak, Cabai, Telur, Bawang, Ayam

    const [komRes, pasarRes, priceRes] = await Promise.all([
      supabase.from("dim_komoditas").select("komoditas_id, nama_komoditas, grup, satuan"),
      supabase.from("dim_pasar").select("pasar_id, nama_pasar"),
      supabase
        .from("fact_harga_pasar")
        .select("komoditas_id, pasar_id, harga_imputasi, tanggal")
        .in("komoditas_id", priorityIds)
        .not("harga_imputasi", "eq", "NaN")
        .order("tanggal", { ascending: false })
        .limit(60)
    ]);

    if (!komRes.data || !pasarRes.data || !priceRes.data || priceRes.data.length === 0) {
      return null;
    }

    const komMap = new Map(komRes.data.map(k => [k.komoditas_id, k]));
    const pasarMap = new Map(pasarRes.data.map(p => [p.pasar_id, p.nama_pasar]));

    // Find latest date in data
    const latestDate = priceRes.data[0].tanggal;
    const latestPrices = priceRes.data.filter(p => p.tanggal === latestDate && !isNaN(Number(p.harga_imputasi)));

    const result: CommodityPrice[] = [];

    for (const cid of priorityIds) {
      const komMeta = komMap.get(cid);
      if (!komMeta) continue;
      if (!komMeta) continue;

      const items = latestPrices.filter(p => p.komoditas_id === cid && Number(p.harga_imputasi) > 0);
      if (items.length === 0) continue;

      // Find cheapest market
      items.sort((a, b) => Number(a.harga_imputasi) - Number(b.harga_imputasi));
      const cheapest = items[0];
      const cheapestPrice = Number(cheapest.harga_imputasi);
      const marketName = pasarMap.get(cheapest.pasar_id) || "Pasar Surabaya";

      // Calculate city average
      const sum = items.reduce((acc, curr) => acc + Number(curr.harga_imputasi), 0);
      const avg = Math.round(sum / items.length);

      const diff = avg - cheapestPrice;
      const isCritical = cid === 50 && cheapestPrice > 60000;
      const isWarning = cid === 39 && cheapestPrice > 35000;

      result.push({
        id: `kom_${cid}`,
        komoditas_id: cid,
        category: komMeta.grup || "Pangan Pokok",
        tag: komMeta.grup || "Pangan Strategis",
        name: komMeta.nama_komoditas,
        status: isCritical ? "Kritis" : isWarning ? "Waspada" : "Normal",
        isCritical,
        isWarning,
        cheapestBadge: "Termurah di Surabaya",
        cheapestSub: diff > 0 ? `Hemat Rp ${diff.toLocaleString("id-ID")}/${komMeta.satuan || "kg"}` : "Harga Terkendali",
        marketName: marketName,
        marketSub: "Kota Surabaya",
        price: `Rp ${cheapestPrice.toLocaleString("id-ID")}`,
        numericPrice: cheapestPrice,
        unit: `/${komMeta.satuan || "kg"}`,
        cityAvg: `Rp ${avg.toLocaleString("id-ID")}`,
        numericCityAvg: avg,
        delta: diff > 0 ? `-${Math.round((diff / avg) * 100)}%` : "0.0%",
        deltaIcon: diff > 0 ? "trending_down" : "horizontal_rule",
        deltaClass: isCritical ? "text-status-critical" : "text-status-normal",
        sparkPath: "M0,24 L30,22 L60,25 L100,18 L140,16 L170,12 L200,10",
        sparkClass: isCritical ? "text-status-critical" : "text-status-normal",
        basketItemName: komMeta.nama_komoditas,
        basketItemPrice: cheapestPrice,
      });
    }

    return result.length > 0 ? result : null;
  } catch (err) {
    console.error("Failed to load live commodities from Supabase:", err);
    return null;
  }
}

// 2. Fetch live Early Warning Risk Matrix
export async function getLiveEarlyWarning(): Promise<{ items: EarlyWarningItem[]; stats: any } | null> {
  if (!supabase) return null;

  try {
    const [komRes, pasarRes, ewsRes] = await Promise.all([
      supabase.from("dim_komoditas").select("komoditas_id, nama_komoditas"),
      supabase.from("dim_pasar").select("pasar_id, nama_pasar"),
      supabase
        .from("fact_early_warning")
        .select("*")
        .order("total_skor", { ascending: false })
    ]);

    if (!ewsRes.data || ewsRes.data.length === 0) return null;

    const komMap = new Map(komRes.data?.map(k => [k.komoditas_id, k.nama_komoditas]) || []);
    const pasarMap = new Map(pasarRes.data?.map(p => [p.pasar_id, p.nama_pasar]) || []);

    const items: EarlyWarningItem[] = ewsRes.data.map(e => ({
      komoditas_id: e.komoditas_id,
      nama_komoditas: komMap.get(e.komoditas_id) || `Komoditas ${e.komoditas_id}`,
      pasar_id: e.pasar_id,
      nama_pasar: pasarMap.get(e.pasar_id) || `Pasar ${e.pasar_id}`,
      total_skor: e.total_skor || 0,
      status_warning: e.status_warning || "NORMAL",
      skor_tren: e.skor_tren || 0,
      skor_volatilitas: e.skor_volatilitas || 0,
      skor_anomali: e.skor_anomali || 0,
      skor_prediksi: e.skor_prediksi || 0,
    }));

    const highCount = items.filter(i => i.status_warning === "TINGGI").length;
    const warningCount = items.filter(i => i.status_warning === "WASPADA").length;
    const normalCount = items.filter(i => i.status_warning === "NORMAL").length;

    return {
      items,
      stats: {
        totalRecords: items.length,
        highCount,
        warningCount,
        normalCount,
        maxScore: items.length > 0 ? items[0].total_skor : 0
      }
    };
  } catch (err) {
    console.error("Failed to load live EWS data:", err);
    return null;
  }
}

// 3. Fetch live 14-day Forecasting Trajectory
export async function getLiveForecast(komoditasId: number = 50): Promise<ForecastDayItem[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("fact_forecast")
      .select("tanggal, harga_prediksi, batas_bawah, batas_atas")
      .eq("komoditas_id", komoditasId)
      .order("tanggal", { ascending: true });

    if (error || !data || data.length === 0) return null;

    // Aggregate by date (average across markets for city-wide forecast)
    const byDate = new Map<string, { p: number[]; l: number[]; u: number[] }>();
    for (const row of data) {
      if (!byDate.has(row.tanggal)) {
        byDate.set(row.tanggal, { p: [], l: [], u: [] });
      }
      const entry = byDate.get(row.tanggal)!;
      entry.p.push(Number(row.harga_prediksi));
      entry.l.push(Number(row.batas_bawah));
      entry.u.push(Number(row.batas_atas));
    }

    const result: ForecastDayItem[] = [];
    let h = 1;
    for (const [tgl, vals] of byDate.entries()) {
      const avgPred = Math.round(vals.p.reduce((a, b) => a + b, 0) / vals.p.length);
      const avgLow = Math.round(vals.l.reduce((a, b) => a + b, 0) / vals.l.length);
      const avgHigh = Math.round(vals.u.reduce((a, b) => a + b, 0) / vals.u.length);

      result.push({
        horizon: h++,
        tanggal: tgl,
        harga_prediksi: avgPred,
        batas_bawah: avgLow,
        batas_atas: avgHigh,
        status: avgPred > 65000 ? "Kritis" : avgPred > 55000 ? "Waspada" : "Normal"
      });
      if (h > 14) break;
    }

    return result.length > 0 ? result : null;
  } catch (err) {
    console.error("Failed to load live forecast data:", err);
    return null;
  }
}

export interface TrendSeriesPoint {
  tanggal: string;
  formattedDate: string;
  price: number;
}

export interface MultiCommodityTrendSeries {
  id: string;
  komoditas_id: number;
  name: string;
  color: string;
  strokeDash?: string;
  points: TrendSeriesPoint[];
}

export interface MultiCommodityTrendResult {
  dates: string[];
  formattedDates: string[];
  series: MultiCommodityTrendSeries[];
  latestSyncDate: string;
}

export async function getLiveMultiCommodityTrends(pasarId?: number): Promise<MultiCommodityTrendResult | null> {
  if (!supabase) return null;

  try {
    const configs = [
      { id: "beras", komoditas_id: 2, name: "Beras Premium", color: "#004328" },
      { id: "cabai", komoditas_id: 50, name: "Cabai Rawit", color: "#DC2626" },
      { id: "bawang", komoditas_id: 39, name: "Bawang Merah", color: "#D97706" },
      { id: "telur", komoditas_id: 16, name: "Telur Ayam", color: "#4F46E5", strokeDash: "5 3" },
    ];

    const cids = configs.map(c => c.komoditas_id);
    let query = supabase
      .from("fact_forecast")
      .select("tanggal, komoditas_id, pasar_id, harga_prediksi")
      .in("komoditas_id", cids);

    if (pasarId && pasarId > 0) {
      query = query.eq("pasar_id", pasarId);
    }

    const { data, error } = await query.order("tanggal", { ascending: true });

    if (error || !data || data.length === 0) return null;

    const dates = Array.from(new Set(data.map(d => d.tanggal))).slice(0, 14);

    const monthNames: Record<string, string> = {
      "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mei", "06": "Jun",
      "07": "Jul", "08": "Agu", "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des"
    };

    const formattedDates = dates.map(dt => {
      const parts = dt.split("-");
      if (parts.length === 3) {
        return `${parts[2]} ${monthNames[parts[1]] || parts[1]}`;
      }
      return dt;
    });

    const series: MultiCommodityTrendSeries[] = configs.map(cfg => {
      const rows = data.filter(d => d.komoditas_id === cfg.komoditas_id);
      const byDate: Record<string, number[]> = {};
      for (const r of rows) {
        if (!byDate[r.tanggal]) byDate[r.tanggal] = [];
        byDate[r.tanggal].push(Number(r.harga_prediksi));
      }

      const points: TrendSeriesPoint[] = dates.map((dt, idx) => {
        const arr = byDate[dt] || [];
        const avg = arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        return {
          tanggal: dt,
          formattedDate: formattedDates[idx],
          price: avg
        };
      });

      return {
        ...cfg,
        points
      };
    });

    return {
      dates,
      formattedDates,
      series,
      latestSyncDate: dates.includes("2026-10-04") ? "04 Okt 2026" : formattedDates[formattedDates.length - 1]
    };
  } catch (err) {
    console.error("Failed to load multi-commodity trends:", err);
    return null;
  }
}

export interface MarketComparisonRow {
  komoditas: string;
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
}

export async function getLiveMarketComparison(): Promise<MarketComparisonRow[] | null> {
  if (!supabase) return null;

  try {
    const [komRes, priceRes] = await Promise.all([
      supabase.from("dim_komoditas").select("komoditas_id, nama_komoditas, satuan"),
      supabase
        .from("fact_harga_pasar")
        .select("komoditas_id, pasar_id, harga_imputasi, tanggal")
        .order("tanggal", { ascending: false })
        .limit(300)
    ]);

    if (!komRes.data || !priceRes.data || priceRes.data.length === 0) return null;

    const latestDate = priceRes.data[0].tanggal;
    const latestPrices = priceRes.data.filter(p => p.tanggal === latestDate && !isNaN(Number(p.harga_imputasi)));

    const komMap = new Map(komRes.data.map(k => [k.komoditas_id, k]));
    const targetCids = [50, 2, 7, 10, 16, 12, 39, 41]; // Cabai, Beras, Gula, Minyak, Telur, Sapi, Bawang Merah, Bawang Putih

    const rows: MarketComparisonRow[] = [];

    for (const cid of targetCids) {
      const kMeta = komMap.get(cid);
      if (!kMeta) continue;

      const pMap: Record<number, number> = {};
      const cPrices = latestPrices.filter(p => p.komoditas_id === cid && Number(p.harga_imputasi) > 0);
      for (const p of cPrices) {
        pMap[p.pasar_id] = Number(p.harga_imputasi);
      }

      const validPrices = Object.values(pMap);
      if (validPrices.length === 0) continue;

      const rerata = Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length);
      const minPrice = Math.min(...validPrices);
      const maxPrice = Math.max(...validPrices);
      const dispRp = maxPrice - minPrice;
      const dispPct = Math.round((dispRp / (minPrice || 1)) * 100);

      // Pasar IDs: 1: Tambahrejo, 2: Wonokromo, 3: Genteng, 4: Pucang, 5: Keputran, 146: Soponyono
      rows.push({
        komoditas: kMeta.nama_komoditas,
        satuan: kMeta.satuan || "kg",
        keputran: pMap[5] || rerata,
        wonokromo: pMap[2] || rerata,
        pucang: pMap[4] || rerata,
        genteng: pMap[3] || rerata,
        tambahrejo: pMap[1] || rerata,
        soponyono: pMap[146] || rerata,
        rerata,
        disparitasRp: dispRp,
        disparitasPct: dispPct,
      });
    }

    return rows.length > 0 ? rows : null;
  } catch (err) {
    console.error("Failed to load market comparison data:", err);
    return null;
  }
}

export interface MarketLocation {
  pasar_id: number;
  nama_pasar: string;
  tipe_pasar: string;
  latitude: number;
  longitude: number;
  sumber_koordinat?: string;
}

export async function getLiveMarketLocations(): Promise<MarketLocation[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("dim_pasar")
      .select("pasar_id, nama_pasar, tipe_pasar, latitude, longitude, sumber_koordinat")
      .order("pasar_id", { ascending: true });

    if (error || !data || data.length === 0) return null;
    return data.map((d) => ({
      pasar_id: d.pasar_id,
      nama_pasar: d.nama_pasar,
      tipe_pasar: d.tipe_pasar,
      latitude: Number(d.latitude),
      longitude: Number(d.longitude),
      sumber_koordinat: d.sumber_koordinat,
    }));
  } catch (err) {
    console.error("Failed to load market locations:", err);
    return null;
  }
}

// 5. Live Smart Shopping Basket Calculation
export interface BasketItem {
  id: string;
  komoditas_id: number;
  name: string;
  icon: string;
  qty: number;
  unit: string;
}

export interface MarketBasketRank {
  rank: number;
  pasar_id: number;
  nama_pasar: string;
  wilayah: string;
  totalBelanja: number;
  selisih: number;
  isCheapest: boolean;
}

export interface ShoppingBasketSimulation {
  tanggal: string;
  items: Array<BasketItem & { itemTotal: number }>;
  rankings: MarketBasketRank[];
  monthlySaving: number;
  cheapestMarket: string;
  mostExpensiveMarket: string;
}

export const COMMODITY_BASKET_META: Record<number, { icon: string; unit: string; defaultQty: number; name: string }> = {
  2: { icon: "inventory_2", unit: "kg", defaultQty: 5, name: "Beras Premium" },
  4: { icon: "inventory_2", unit: "kg", defaultQty: 5, name: "Beras Medium" },
  10: { icon: "water_drop", unit: "L", defaultQty: 2, name: "Minyak Goreng Curah" },
  16: { icon: "egg", unit: "kg", defaultQty: 1, name: "Telur Ayam Ras" },
  50: { icon: "local_fire_department", unit: "kg", defaultQty: 0.5, name: "Cabai Rawit Merah" },
  39: { icon: "nutrition", unit: "kg", defaultQty: 1, name: "Bawang Merah" },
  13: { icon: "set_meal", unit: "kg", defaultQty: 1, name: "Daging Ayam Ras" },
  12: { icon: "lunch_dining", unit: "kg", defaultQty: 1, name: "Daging Sapi" },
  7: { icon: "cookie", unit: "kg", defaultQty: 1, name: "Gula Pasir" },
  41: { icon: "nutrition", unit: "kg", defaultQty: 1, name: "Bawang Putih" },
};

export const DEFAULT_BASKET_ITEMS: BasketItem[] = [
  { id: "beras", komoditas_id: 2, name: "Beras Premium", icon: "inventory_2", qty: 5, unit: "kg" },
  { id: "minyak", komoditas_id: 10, name: "Minyak Goreng", icon: "water_drop", qty: 2, unit: "L" },
  { id: "telur", komoditas_id: 16, name: "Telur Ayam Ras", icon: "egg", qty: 1, unit: "kg" },
  { id: "cabai", komoditas_id: 50, name: "Cabai Rawit Merah", icon: "local_fire_department", qty: 0.5, unit: "kg" },
  { id: "bawang", komoditas_id: 39, name: "Bawang Merah", icon: "nutrition", qty: 1, unit: "kg" },
];

export async function getLiveShoppingBasket(basketList: BasketItem[] = DEFAULT_BASKET_ITEMS): Promise<ShoppingBasketSimulation | null> {
  if (!supabase || basketList.length === 0) return null;

  try {
    const cids = Array.from(new Set(basketList.map(b => b.komoditas_id)));
    
    // Get latest date from database
    const { data: latestDateRow } = await supabase
      .from("fact_harga_pasar")
      .select("tanggal")
      .order("tanggal", { ascending: false })
      .limit(1);

    const latestDate = latestDateRow?.[0]?.tanggal || "2026-10-04";

    const [pasarRes, priceRes] = await Promise.all([
      supabase.from("dim_pasar").select("pasar_id, nama_pasar"),
      supabase
        .from("fact_harga_pasar")
        .select("komoditas_id, pasar_id, harga_imputasi, tanggal")
        .eq("tanggal", latestDate)
        .in("komoditas_id", cids)
        .not("harga_imputasi", "eq", "NaN")
    ]);

    if (!pasarRes.data || !priceRes.data || priceRes.data.length === 0) return null;

    const latestPrices = priceRes.data;

    const marketRegion: Record<number, string> = {
      1: "Surabaya Utara",
      2: "Surabaya Selatan",
      3: "Surabaya Pusat",
      4: "Surabaya Tengah",
      5: "Surabaya Pusat (Induk)",
      146: "Surabaya Timur"
    };

    const marketMap: Record<number, { pasar_id: number; nama_pasar: string; wilayah: string; totalBelanja: number }> = {};
    for (const m of pasarRes.data) {
      marketMap[m.pasar_id] = {
        pasar_id: m.pasar_id,
        nama_pasar: m.nama_pasar,
        wilayah: marketRegion[m.pasar_id] || "Kota Surabaya",
        totalBelanja: 0
      };
    }

    const avgPrices: Record<number, number> = {};
    for (const item of basketList) {
      const valid = latestPrices.filter(p => p.komoditas_id === item.komoditas_id && Number(p.harga_imputasi) > 0);
      avgPrices[item.komoditas_id] = valid.length > 0 
        ? Math.round(valid.reduce((acc, curr) => acc + Number(curr.harga_imputasi), 0) / valid.length)
        : 15000;
    }

    for (const pid in marketMap) {
      let total = 0;
      for (const item of basketList) {
        const match = latestPrices.find(p => p.pasar_id === Number(pid) && p.komoditas_id === item.komoditas_id);
        const price = match && Number(match.harga_imputasi) > 0 ? Number(match.harga_imputasi) : avgPrices[item.komoditas_id];
        total += price * item.qty;
      }
      marketMap[pid].totalBelanja = Math.round(total);
    }

    const sorted = Object.values(marketMap).filter(m => m.totalBelanja > 0).sort((a, b) => a.totalBelanja - b.totalBelanja);
    if (sorted.length === 0) return null;

    const minTotal = sorted[0].totalBelanja;
    const maxTotal = sorted[sorted.length - 1].totalBelanja;
    const monthlySaving = (maxTotal - minTotal) * 4;

    const rankings: MarketBasketRank[] = sorted.map((m, idx) => ({
      rank: idx + 1,
      pasar_id: m.pasar_id,
      nama_pasar: m.nama_pasar,
      wilayah: m.wilayah,
      totalBelanja: m.totalBelanja,
      selisih: m.totalBelanja - minTotal,
      isCheapest: idx === 0
    }));

    const itemized = basketList.map(item => ({
      ...item,
      itemTotal: Math.round((avgPrices[item.komoditas_id] || 15000) * item.qty)
    }));

    return {
      tanggal: latestDate,
      items: itemized,
      rankings,
      monthlySaving,
      cheapestMarket: sorted[0].nama_pasar,
      mostExpensiveMarket: sorted[sorted.length - 1].nama_pasar
    };
  } catch (err) {
    console.error("Failed to calculate live basket:", err);
    return null;
  }
}

