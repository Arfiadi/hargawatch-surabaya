# HargaWatch Surabaya — Frontend Web Application (`web/`)

Next.js 15 App Router web intelligence portal for **HargaWatch Surabaya**, presenting real-time food price monitoring, 6-market spatial price disparity analysis, 4-pillar Early Warning System (EWS) risk indices, and multi-step quantile price forecasts (H=1..14) for 37 strategic food commodities in the city of Surabaya.

---

## Overview

The `web/` package is the user-facing analytics and consumer decision-support layer of the HargaWatch Surabaya platform. It bridges backend data pipelines and ML models with public consumers and city government stakeholders (TPID Kota Surabaya).

### Core Capabilities:
- **Public Intelligence Dashboard (`/`):** Real-time city food stability summary, mini price ticker for top staples, Best Price Finder across Surabaya's 6 strategic markets, and an interactive Smart Shopping Basket simulation (calculating per-trip and monthly household savings for single-market vs. multi-market shopping).
- **Spatial Map & Price Disparity Engine (`/peta`):** Interactive Leaflet GIS visualization mapping the 6 municipal markets (Keputran, Wonokromo, Genteng, Pucang Anom, Tambahrejo, Soponyono), zone clustering (Pusat, Selatan, Timur, Utara), and dynamic inter-market price disparity calculation with commodity-specific risk thresholds.
- **Early Warning & Risk Matrix (`/early-warning`):** Real-time monitoring of TPID 4-pillar composite risk scores (Trend, Volatility, Anomaly, Forecast) with alert classification (`NORMAL`, `WASPADA`, `TINGGI`/`SIAGA`) and actionable market intervention recommendations.
- **Forecasting & Trajectory Viewer (`/forecasting`):** 14-day multi-step horizon price projections with LightGBM/CatBoost prediction intervals (P10/P90), official government benchmark comparisons (HAP Bapanas / HET Kemendag), and East Java agricultural supply corridor insights.

---

## Interface & Public Contracts

All data operations are centralized in [`src/lib/dataService.ts`](./src/lib/dataService.ts).

### Data Service Contracts

- `getLiveStabilitySummary()`: `() => Promise<FoodStabilitySummary | null>` — Computes aggregate city food stability index, normal vs alert point counts, and hero banner message from `fact_early_warning`, `dim_komoditas`, `dim_pasar`.
- `getLiveCommodities()`: `() => Promise<CommodityPrice[] | null>` — Computes lowest market price, city average, savings delta, and 7-day sparklines for priority commodities.
- `getLiveShoppingBasket(basketList: BasketItem[])`: `(basketList: BasketItem[]) => Promise<ShoppingBasketSimulation | null>` — Calculates basket totals across 6 markets, cheapest vs most expensive market, trip/monthly savings, and optimal multi-market split.
- `getLiveMarketComparison()`: `() => Promise<MarketComparisonRow[] | null>` — Aggregates price matrix across all 6 markets for 37 commodities; computes Rp and % price disparity.
- `getLiveMarketComparisonForCommodity(komoditasId: number)`: `(komoditasId: number) => Promise<MarketComparisonRow | null>` — Fetches 6-market price comparison for a single selected commodity.
- `getLiveMarketLocations()`: `() => Promise<MarketLocation[] | null>` — Fetches geographic coordinates (latitude, longitude) and market types from `dim_pasar`.
- `getLiveEarlyWarning()`: `() => Promise<{ items: EarlyWarningItem[]; stats: EarlyWarningStats } | null>` — Loads 4-pillar risk breakdown (Trend, Volatility, Anomaly, Forecast) for latest observation date.
- `getLiveForecastDetails(komoditasId: number, timeframe: TimeframeOption)`: `(komoditasId: number, timeframe: TimeframeOption) => Promise<CommodityForecastDetails | null>` — Retrieves 14-day projection trajectory, historical trend, confidence bounds, and peak days.
- `getLiveMarketComparisonTrends(komoditasId: number, timeframe: TimeframeOption)`: `(komoditasId: number, timeframe: TimeframeOption) => Promise<MarketTrendComparisonResult | null>` — Returns multi-line historical and 7-day future price trajectories per market.
- `formatCommodityName(name: string)`: `(name: string) => string` — Normalizes screaming caps and KBBI spellings (e.g. "Cabe" -> "Cabai").

### Core Component Contracts

- `SurabayaMap` ([`src/components/SurabayaMap.tsx`](./src/components/SurabayaMap.tsx)): Dynamic SSR-disabled Leaflet map rendering custom HTML marker pins colored by relative price tier with market popups.
- `CommodityIcon` ([`src/components/CommodityIcon.tsx`](./src/components/CommodityIcon.tsx)): Scalable 24x24 monoline vector system with unified 2px stroke across catalog food commodities.
- `CommoditySearchSelect` ([`src/components/CommoditySearchSelect.tsx`](./src/components/CommoditySearchSelect.tsx)): Popover select modal with instantaneous query filtering and commodity group filter chips.
- `TimeframeSelect` ([`src/components/TimeframeSelect.tsx`](./src/components/TimeframeSelect.tsx)): Accessible custom popover replacing native select for `7d`, `14d`, `30d`, `3m`, `6m`, `1y` timeframes.

---

## Invariants

- **Content Security Policy (CSP) Whitelist (CRITICAL):** Security headers in [`next.config.ts`](./next.config.ts) strictly whitelist `https://fonts.googleapis.com`, `https://fonts.gstatic.com`, `https://*.tile.openstreetmap.org`, `https://*.supabase.co`, and related API origins. Removing Google Fonts domains disables font ligature parsing, corrupting all UI iconography.
- **Client Key Isolation:** Frontend components use `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` or the fallback publishable anon key (`sb_publishable_...`).
- **Service Role Prohibition:** The PostgreSQL `SERVICE_ROLE_KEY` is strictly forbidden in client-side code to maintain Row-Level Security (RLS) guarantees.
- **Zero Lookahead Bias:** In historical data visualization (`dataService.ts`), missing data points carry forward strictly flat without backward-filling or lookahead interpolation.
- **Representative Market Check:** Disparity metrics require at least 3 of 6 markets reporting (`reportedCount >= 3`); otherwise marked non-representative.
- **Mock Fixture ID Space:** Static mock fixtures in [`src/data/mockData.ts`](./src/data/mockData.ts) define 8 sample commodities with synthetic sequential keys (IDs 1–8) for offline UI development and layout verification, distinct from the sparse production keys (up to ID 96) in Supabase.
- **Group-Specific Disparity Thresholds:**
  - Pangan Pokok Ber-HET (Beras, Minyak, Gula): High Disparity >= 6%, Med >= 3%.
  - Hortikultura Volatil (Cabai, Bawang): High Disparity >= 22%, Med >= 12%.
  - Protein Hewani (Ayam, Sapi, Telur): High Disparity >= 12%, Med >= 6%.
  - Komoditas Umum: High Disparity >= 15%, Med >= 8%.

---

## Side Effects

- **Supabase PostgreSQL Read Queries:** Real-time reads against `fact_harga_pasar`, `fact_forecast`, `fact_early_warning`, `dim_komoditas`, and `dim_pasar`.
- **Browser LocalStorage Access:** Reading and persisting user shopping basket selections across sessions.
- **Third-Party CDN Tile Loading:** Fetching map raster tiles from OpenStreetMap tile servers (`tile.openstreetmap.org`).
- **External Web Sharing:** Opening WhatsApp Web API (`https://api.whatsapp.com/send?text=...`) for sharing grocery basket shopping plans.

---

## Verification

```bash
# Development server
npm run dev

# Production build & static page compilation (Must compile 8/8 static pages)
npm run build

# Next.js ESLint verification
npm run lint

# Dependency audit (Must report 0 high/critical vulnerabilities)
npm audit --audit-level=high
```
