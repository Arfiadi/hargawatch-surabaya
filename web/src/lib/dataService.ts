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

export interface EarlyWarningStats {
  latestDate: string;
  formattedDate: string;
  totalRecords: number;
  highCount: number;
  warningCount: number;
  normalCount: number;
  maxScore: number;
  overallStatus: "SIAGA" | "WASPADA" | "NORMAL";
  focusText: string;
  subtitle: string;
  anomaliesCount: number;
  criticalCommodities: string[];
}

export interface ForecastHistoryPoint {
  tanggal: string;
  formattedDate: string;
  harga: number;
}

export interface ForecastDayItem {
  horizon: number;
  tanggal: string;
  formattedDate: string;
  weekday: string;
  harga_prediksi: number;
  batas_bawah: number;
  batas_atas: number;
  deltaPct: number;
  deltaRp: number;
  status: "Normal" | "Waspada" | "Tinggi";
  recom: string;
}

export interface CommodityForecastDetails {
  komoditas_id: number;
  nama_komoditas: string;
  satuan: string;
  currentPrice: number;
  latestDate: string;
  formattedLatestDate: string;
  history: ForecastHistoryPoint[];
  forecast: ForecastDayItem[];
  trendDirection: "naik" | "turun" | "stabil";
  trendPercentage: number;
  minForecast: number;
  maxForecast: number;
  peakDay?: string;
  peakPrice?: number;
}

export const FORECAST_COMMODITIES = [
  { id: 50, name: "Cabe Rawit Merah", unit: "kg" },
  { id: 39, name: "Bawang Merah", unit: "kg" },
  { id: 10, name: "Minyak Goreng Curah", unit: "kg" },
  { id: 2, name: "Beras Premium", unit: "kg" },
  { id: 13, name: "Daging Ayam Ras", unit: "kg" },
  { id: 16, name: "Telur Ayam Ras", unit: "kg" },
  { id: 7, name: "Gula Kristal Putih", unit: "kg" },
];


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
  latestDate?: string;
  formattedDate?: string;
}

// 0. Fetch live Food Stability Summary from fact_early_warning
export async function getLiveStabilitySummary(): Promise<FoodStabilitySummary | null> {
  if (!supabase) return null;

  try {
    // 1. Ambil tanggal terbaru di fact_early_warning
    const { data: latestDateRow } = await supabase
      .from("fact_early_warning")
      .select("tanggal")
      .order("tanggal", { ascending: false })
      .limit(1);

    const latestDate = latestDateRow?.[0]?.tanggal || "2026-10-10";

    const [komRes, pasarRes, ewsRes] = await Promise.all([
      supabase.from("dim_komoditas").select("komoditas_id, nama_komoditas"),
      supabase.from("dim_pasar").select("pasar_id, nama_pasar"),
      supabase
        .from("fact_early_warning")
        .select("*")
        .eq("tanggal", latestDate)
        .order("total_skor", { ascending: false })
    ]);

    if (!ewsRes.data || ewsRes.data.length === 0) return null;

    const komMap = new Map(komRes.data?.map(k => [k.komoditas_id, k.nama_komoditas]) || []);
    const pasarMap = new Map(pasarRes.data?.map(p => [p.pasar_id, p.nama_pasar]) || []);

    const total = ewsRes.data.length;
    const normalCount = ewsRes.data.filter(r => r.status_warning === "NORMAL").length;
    const warningItems = ewsRes.data.filter(r => r.status_warning !== "NORMAL");
    const alertCount = warningItems.length;
    const stabilityPct = ((normalCount / total) * 100).toFixed(1);

    let formattedDate = latestDate;
    try {
      const parts = latestDate.split("-");
      const monthNames: Record<string, string> = {
        "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mei", "06": "Jun",
        "07": "Jul", "08": "Agu", "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des"
      };
      if (parts.length === 3) {
        formattedDate = `${parseInt(parts[2], 10)} ${monthNames[parts[1]] || parts[1]} ${parts[0]}`;
      }
    } catch {
      formattedDate = latestDate;
    }

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
        bannerSubtitle: `Pemantauan EWS Terkini (${formattedDate})`,
        bannerMessage: `${komName} di ${pasarName} menunjukkan sinyal peningkatan dengan skor risiko ${top.total_skor}/100. Satgas pangan menyarankan pemantauan pasokan di pasar induk.`,
        hasAlert: true,
        latestDate,
        formattedDate,
      };
    } else {
      return {
        stabilityIndex: `${stabilityPct}%`,
        targetText: "Target Kota > 90%",
        isNormal: true,
        statusLabel: "Kondisi Stabil",
        normalCount,
        alertCount: 0,
        alertNote: "Semua Terkendali",
        bannerTitle: "Stabilitas Harga Pangan Terkendali",
        bannerSubtitle: `Pantauan 6 Pasar Resmi (${formattedDate})`,
        bannerMessage: `Seluruh 6 komoditas bahan pokok di 6 pasar Surabaya terpantau stabil dalam rentang harga wajar tanpa indikasi lonjakan harga ekstrem.`,
        hasAlert: false,
        latestDate,
        formattedDate,
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
export async function getLiveEarlyWarning(): Promise<{ items: EarlyWarningItem[]; stats: EarlyWarningStats } | null> {
  if (!supabase) return null;

  try {
    // 1. Dapatkan tanggal terbaru yang tersedia di fact_early_warning
    const { data: latestDateRows, error: dateErr } = await supabase
      .from("fact_early_warning")
      .select("tanggal")
      .order("tanggal", { ascending: false })
      .limit(1);

    if (dateErr || !latestDateRows || latestDateRows.length === 0) return null;

    const latestDate = latestDateRows[0].tanggal;

    // 2. Ambil data dimensi dan record EWS untuk tanggal terbaru tersebut
    const [komRes, pasarRes, ewsRes, hargaRes] = await Promise.all([
      supabase.from("dim_komoditas").select("komoditas_id, nama_komoditas"),
      supabase.from("dim_pasar").select("pasar_id, nama_pasar"),
      supabase
        .from("fact_early_warning")
        .select("*")
        .eq("tanggal", latestDate)
        .order("total_skor", { ascending: false }),
      supabase
        .from("fact_harga_pasar")
        .select("komoditas_id, pasar_id, harga_imputasi")
        .eq("tanggal", latestDate)
    ]);

    if (!ewsRes.data || ewsRes.data.length === 0) return null;

    const komMap = new Map(komRes.data?.map(k => [k.komoditas_id, k.nama_komoditas]) || []);
    const pasarMap = new Map(pasarRes.data?.map(p => [p.pasar_id, p.nama_pasar]) || []);

    const hargaMap = new Map<string, number>();
    if (hargaRes.data) {
      for (const h of hargaRes.data) {
        hargaMap.set(`${h.komoditas_id}_${h.pasar_id}`, Number(h.harga_imputasi));
      }
    }

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
      harga_terakhir: hargaMap.get(`${e.komoditas_id}_${e.pasar_id}`),
    }));

    const highCount = items.filter(i => i.status_warning === "TINGGI").length;
    const warningCount = items.filter(i => i.status_warning === "WASPADA").length;
    const normalCount = items.filter(i => i.status_warning === "NORMAL").length;
    const anomaliesCount = items.filter(i => (i.skor_anomali || 0) > 0).length;

    // Nama komoditas yang mengalami alert
    const alertCommodityNames = Array.from(
      new Set(items.filter(i => i.status_warning !== "NORMAL").map(i => i.nama_komoditas))
    );

    // Format tanggal Indonesia: misal "10 Okt 2026"
    let formattedDate = latestDate;
    try {
      const d = new Date(latestDate);
      formattedDate = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      formattedDate = latestDate;
    }

    let overallStatus: "SIAGA" | "WASPADA" | "NORMAL" = "NORMAL";
    let focusText = "Kondisi Terkendali di 6 Pasar";
    let subtitle = "Seluruh komoditas pokok di 6 pasar pantauan berada dalam rentang harga aman dan terkendali.";

    if (highCount > 0) {
      overallStatus = "SIAGA";
      focusText = `Fokus: ${alertCommodityNames.slice(0, 3).join(", ")}`;
      subtitle = `Terdeteksi lonjakan harga pada ${alertCommodityNames.slice(0, 2).join(" & ")}. Rekomendasi intervensi operasi pasar disiapkan.`;
    } else if (warningCount > 0) {
      overallStatus = "WASPADA";
      focusText = `Fokus: ${alertCommodityNames.slice(0, 3).join(", ")}`;
      subtitle = `Pantau pergerakan harga dan deviasi pasar untuk komoditas ${alertCommodityNames.slice(0, 2).join(" & ")}.`;
    }

    return {
      items,
      stats: {
        latestDate,
        formattedDate,
        totalRecords: items.length,
        highCount,
        warningCount,
        normalCount,
        maxScore: items.length > 0 ? items[0].total_skor : 0,
        overallStatus,
        focusText,
        subtitle,
        anomaliesCount,
        criticalCommodities: alertCommodityNames,
      }
    };
  } catch (err) {
    console.error("Failed to load live EWS data:", err);
    return null;
  }
}

// 3. Fetch comprehensive 14-day Forecasting & Historical Trajectory
export async function getLiveForecastDetails(komoditasId: number = 50): Promise<CommodityForecastDetails | null> {
  if (!supabase) return null;

  try {
    // 1. Ambil info komoditas
    const { data: komData } = await supabase
      .from("dim_komoditas")
      .select("komoditas_id, nama_komoditas, satuan")
      .eq("komoditas_id", komoditasId)
      .single();

    const matchedPreset = FORECAST_COMMODITIES.find((c) => c.id === komoditasId);
    const nama_komoditas = komData?.nama_komoditas || matchedPreset?.name || `Komoditas ${komoditasId}`;
    const satuan = komData?.satuan || matchedPreset?.unit || "kg";

    // 2. Ambil tanggal terbaru dari fact_harga_pasar
    const { data: latestDateRow } = await supabase
      .from("fact_harga_pasar")
      .select("tanggal")
      .order("tanggal", { ascending: false })
      .limit(1);

    const latestDate = latestDateRow?.[0]?.tanggal || "2026-10-10";

    // 3. Ambil data historis 14 hari terakhir sebelum/pada latestDate
    const { data: histData } = await supabase
      .from("fact_harga_pasar")
      .select("tanggal, harga_imputasi")
      .eq("komoditas_id", komoditasId)
      .lte("tanggal", latestDate)
      .order("tanggal", { ascending: false })
      .limit(90);

    const histByDate = new Map<string, number[]>();
    if (histData) {
      for (const row of histData) {
        if (!histByDate.has(row.tanggal)) histByDate.set(row.tanggal, []);
        histByDate.get(row.tanggal)!.push(Number(row.harga_imputasi));
      }
    }

    const sortedHistDates = Array.from(histByDate.keys()).sort().slice(-14);
    const history: ForecastHistoryPoint[] = sortedHistDates.map((tgl) => {
      const vals = histByDate.get(tgl)!;
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      const d = new Date(tgl);
      return {
        tanggal: tgl,
        formattedDate: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        harga: avg,
      };
    });

    const currentPrice = history.length > 0 ? history[history.length - 1].harga : 60000;

    // 4. Ambil proyeksi masa depan dari fact_forecast (tanggal > latestDate)
    const { data: fcData, error: fcErr } = await supabase
      .from("fact_forecast")
      .select("tanggal, harga_prediksi, batas_bawah, batas_atas")
      .eq("komoditas_id", komoditasId)
      .gt("tanggal", latestDate)
      .order("tanggal", { ascending: true });

    if (fcErr || !fcData || fcData.length === 0) return null;

    const fcByDate = new Map<string, { p: number[]; l: number[]; u: number[] }>();
    for (const row of fcData) {
      if (!fcByDate.has(row.tanggal)) {
        fcByDate.set(row.tanggal, { p: [], l: [], u: [] });
      }
      const entry = fcByDate.get(row.tanggal)!;
      entry.p.push(Number(row.harga_prediksi));
      entry.l.push(Number(row.batas_bawah));
      entry.u.push(Number(row.batas_atas));
    }

    const forecast: ForecastDayItem[] = [];
    let h = 1;
    let maxForecast = 0;
    let minForecast = Infinity;
    let peakDay: string | undefined = undefined;
    let peakPrice = 0;

    for (const [tgl, vals] of fcByDate.entries()) {
      if (h > 14) break;
      const avgPred = Math.round(vals.p.reduce((a, b) => a + b, 0) / vals.p.length);
      const avgLow = Math.round(vals.l.reduce((a, b) => a + b, 0) / vals.l.length);
      const avgHigh = Math.round(vals.u.reduce((a, b) => a + b, 0) / vals.u.length);

      const deltaRp = avgPred - currentPrice;
      const deltaPct = Number(((deltaRp / currentPrice) * 100).toFixed(1));

      if (avgPred > maxForecast) {
        maxForecast = avgPred;
        peakPrice = avgPred;
        peakDay = `H+${h}`;
      }
      if (avgPred < minForecast) {
        minForecast = avgPred;
      }

      let status: "Normal" | "Waspada" | "Tinggi" = "Normal";
      let recom = "Pasokan stabil dalam batas wajar";

      if (deltaPct >= 8) {
        status = "Tinggi";
        recom = "Waspada lonjakan harga, koordinasikan pemantauan pasokan";
      } else if (deltaPct >= 3) {
        status = "Waspada";
        recom = "Pantau kelancaran pasokan harian";
      }

      const d = new Date(tgl);
      const formattedDate = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const weekday = d.toLocaleDateString("id-ID", { weekday: "long" });

      forecast.push({
        horizon: h++,
        tanggal: tgl,
        formattedDate,
        weekday,
        harga_prediksi: avgPred,
        batas_bawah: avgLow,
        batas_atas: avgHigh,
        deltaPct,
        deltaRp,
        status,
        recom,
      });
    }

    const lastForecastPrice = forecast.length > 0 ? forecast[forecast.length - 1].harga_prediksi : currentPrice;
    const trendPercentage = Number((((lastForecastPrice - currentPrice) / currentPrice) * 100).toFixed(1));
    const trendDirection = trendPercentage >= 2 ? "naik" : trendPercentage <= -2 ? "turun" : "stabil";

    const dLatest = new Date(latestDate);
    const formattedLatestDate = dLatest.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      komoditas_id: komoditasId,
      nama_komoditas,
      satuan,
      currentPrice,
      latestDate,
      formattedLatestDate,
      history,
      forecast,
      trendDirection,
      trendPercentage,
      minForecast: minForecast === Infinity ? currentPrice : minForecast,
      maxForecast: maxForecast === 0 ? currentPrice : maxForecast,
      peakDay,
      peakPrice,
    };
  } catch (err) {
    console.error("Failed to load forecast details:", err);
    return null;
  }
}

export async function getLiveForecast(komoditasId: number = 50): Promise<ForecastDayItem[] | null> {
  const details = await getLiveForecastDetails(komoditasId);
  return details ? details.forecast : null;
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
  todayIndex: number;
  todayDate: string;
  formattedTodayDate: string;
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

    // 1. Dapatkan tanggal observasi riil terbaru dari fact_harga_pasar
    const { data: latestDateRow } = await supabase
      .from("fact_harga_pasar")
      .select("tanggal")
      .order("tanggal", { ascending: false })
      .limit(1);

    const latestDate = latestDateRow?.[0]?.tanggal || "2026-10-10";

    // 2. Ambil 7 hari data historis riil (<= latestDate) dari fact_harga_pasar
    let histQuery = supabase
      .from("fact_harga_pasar")
      .select("tanggal, komoditas_id, pasar_id, harga_imputasi")
      .in("komoditas_id", cids)
      .lte("tanggal", latestDate);

    if (pasarId && pasarId > 0) {
      histQuery = histQuery.eq("pasar_id", pasarId);
    }

    const { data: rawHist } = await histQuery
      .order("tanggal", { ascending: false })
      .limit(200);

    const histDates = Array.from(new Set(rawHist?.map(d => d.tanggal) || [])).sort().slice(-7);

    // 3. Ambil 7 hari proyeksi ke depan (> latestDate) dari fact_forecast
    let fcQuery = supabase
      .from("fact_forecast")
      .select("tanggal, komoditas_id, pasar_id, harga_prediksi")
      .in("komoditas_id", cids)
      .gt("tanggal", latestDate);

    if (pasarId && pasarId > 0) {
      fcQuery = fcQuery.eq("pasar_id", pasarId);
    }

    const { data: rawFc } = await fcQuery
      .order("tanggal", { ascending: true })
      .limit(200);

    const fcDates = Array.from(new Set(rawFc?.map(d => d.tanggal) || [])).sort().slice(0, 7);

    const dates = [...histDates, ...fcDates];
    if (dates.length === 0) return null;

    const todayIndex = dates.indexOf(latestDate) >= 0 ? dates.indexOf(latestDate) : Math.max(0, histDates.length - 1);

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
      const histRows = rawHist?.filter(d => d.komoditas_id === cfg.komoditas_id) || [];
      const fcRows = rawFc?.filter(d => d.komoditas_id === cfg.komoditas_id) || [];

      const points: TrendSeriesPoint[] = dates.map((dt, idx) => {
        let price = 0;
        if (dt <= latestDate) {
          const matching = histRows.filter(r => r.tanggal === dt);
          if (matching.length > 0) {
            price = Math.round(matching.reduce((a, b) => a + Number(b.harga_imputasi), 0) / matching.length);
          }
        } else {
          const matching = fcRows.filter(r => r.tanggal === dt);
          if (matching.length > 0) {
            price = Math.round(matching.reduce((a, b) => a + Number(b.harga_prediksi), 0) / matching.length);
          }
        }

        return {
          tanggal: dt,
          formattedDate: formattedDates[idx],
          price: price || 0,
        };
      });

      return {
        ...cfg,
        points,
      };
    });

    const formattedTodayDate = formattedDates[todayIndex]
      ? `${formattedDates[todayIndex]} 2026`
      : "10 Okt 2026";

    return {
      dates,
      formattedDates,
      todayIndex,
      todayDate: latestDate,
      formattedTodayDate,
      series,
      latestSyncDate: formattedTodayDate,
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
  tanggal?: string;
  formattedDate?: string;
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

    const monthNames: Record<string, string> = {
      "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mei", "06": "Jun",
      "07": "Jul", "08": "Agu", "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des"
    };
    const parts = latestDate.split("-");
    const formattedDate = parts.length === 3 ? `${parseInt(parts[2], 10)} ${monthNames[parts[1]] || parts[1]} ${parts[0]}` : latestDate;

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
        tanggal: latestDate,
        formattedDate,
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

    const latestDate = latestDateRow?.[0]?.tanggal || "2026-10-10";

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

