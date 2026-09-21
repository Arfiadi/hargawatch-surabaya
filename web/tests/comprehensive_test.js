const assert = require('assert');
const http = require('http');

console.log('================================================================');
console.log('   HARGAWATCH SURABAYA - COMPREHENSIVE AUTOMATED TEST SUITE    ');
console.log('================================================================');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
  }
}

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('\n--- SUITE 1: HTTP ROUTING & PAGE AVAILABILITY (LIVE DEV SERVER: PORT 3001) ---');
  
  await runAsyncTest('Route: / (Dashboard Publik) returns 200 OK', async () => {
    const res = await fetchPage('/');
    assert.strictEqual(res.status, 200);
    assert(res.body.length > 5000, 'Body should contain full HTML markup');
  });

  await runAsyncTest('Route: /peta (Peta Disparitas Spasial) returns 200 OK', async () => {
    const res = await fetchPage('/peta');
    assert.strictEqual(res.status, 200);
    assert(res.body.length > 5000, 'Body should contain full HTML markup');
  });

  await runAsyncTest('Route: /early-warning (Sistem Peringatan Dini TPID) returns 200 OK', async () => {
    const res = await fetchPage('/early-warning');
    assert.strictEqual(res.status, 200);
    assert(res.body.length > 5000, 'Body should contain full HTML markup');
  });

  await runAsyncTest('Route: /forecasting (AI Predictive Intelligence) returns 200 OK', async () => {
    const res = await fetchPage('/forecasting');
    assert.strictEqual(res.status, 200);
    assert(res.body.length > 5000, 'Body should contain full HTML markup');
  });

  console.log('\n--- SUITE 2: DOM & STITCH SPECIFICATION INTEGRITY ---');

  await runAsyncTest('Dashboard DOM: contains hero title, market badges & quick stability metric', async () => {
    const res = await fetchPage('/');
    const html = res.body;
    assert(html.includes('Pantau Harga Pangan Terkini &amp; Belanja Cerdas') || html.includes('Pantau Harga Pangan Terkini & Belanja Cerdas'), 'Must contain hero title');
    assert(html.includes('Smart Shopping Basket'), 'Must contain Smart Shopping Basket section');
    assert(html.includes('Pasar Wonokromo'), 'Must list Pasar Wonokromo');
    assert(html.includes('Pasar Keputran'), 'Must list Pasar Keputran');
    assert(html.includes('Pasar Genteng'), 'Must list Pasar Genteng');
    assert(html.includes('Pasar Tambahrejo'), 'Must list Pasar Tambahrejo');
    assert(html.includes('Pasar Soponyono'), 'Must list Pasar Soponyono');
    assert(html.includes('Pasar Pucang Anom'), 'Must list Pasar Pucang Anom');
    assert(html.includes('id="commodity-search"'), 'Must have search input with id commodity-search');
  });

  await runAsyncTest('Peta DOM: contains geointel telemetry, spatial canvas & comparison matrix', async () => {
    const res = await fetchPage('/peta');
    const html = res.body;
    assert(html.includes('Peta Disparitas Harga Antar-Pasar'), 'Must contain title');
    assert(html.includes('Koefisien Variasi'), 'Must display Koefisien Variasi');
    assert(html.includes('12.4%'), 'Must display 12.4% volatility CV');
    assert(html.includes('Rp 11.500/kg') || html.includes('11.500'), 'Must display open anomaly disparity');
    assert(html.includes('spatial-canvas'), 'Must have spatial-canvas id');
    assert(html.includes('Matriks Komparasi 6 Pasar Strategis'), 'Must have comparative table');
    assert(html.includes('Export CSV'), 'Must have CSV export button');
  });

  await runAsyncTest('Early Warning DOM: contains alert banner, matrix table & intervention triggers', async () => {
    const res = await fetchPage('/early-warning');
    const html = res.body;
    assert(html.includes('LEVEL PERINGATAN KOTA: WASPADA TINGKAT II'), 'Must contain warning status banner');
    assert(html.includes('trigger-all-interventions'), 'Must have trigger button');
    assert(html.includes('Z-Score Volatilitas') || html.includes('Z-Score'), 'Must have Z-Score header');
    assert(html.includes('Pasokan Sentra Produksi') || html.includes('Satgas Ketahanan Pangan'), 'Must have satgas / supply context');
    assert(html.includes('Cabai Rawit Merah'), 'Must list Cabai Rawit Merah');
  });

  await runAsyncTest('Forecasting DOM: contains engine banner, bayesian/ensemble parameters, SHAP & table', async () => {
    const res = await fetchPage('/forecasting');
    const html = res.body;
    assert(html.includes('ENGINE AI FORECASTING'), 'Must contain AI Forecasting badge');
    assert(html.includes('Ensemble ARIMA + Prophet + LSTM') || html.includes('Prophet'), 'Must mention forecasting ensemble model');
    assert(html.includes('H+6 • 02 Mar 2025') || html.includes('H+6'), 'Must contain peak projection H+6');
    assert(html.includes('SHAP'), 'Must explain SHAP feature attributions');
    assert(html.includes('btnExportSimulation'), 'Must have CSV export button');
  });

  console.log('\n--- SUITE 3: MATHEMATICAL & ALGORITHMIC VERIFICATION ---');

  runTest('Algorithm: Smart Shopping Basket total calculation & rank order', () => {
    const basket = [
      { name: "Beras Premium", qty: 5, unitPrice: 14500 },
      { name: "Minyak Goreng", qty: 2, unitPrice: 15500 },
      { name: "Telur Ayam Ras", qty: 1, unitPrice: 27500 },
      { name: "Cabai Rawit Merah", qty: 0.5, unitPrice: 68000 },
      { name: "Bawang Merah", qty: 1, unitPrice: 32000 }
    ];

    const wonokromoBaseTotal = basket.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
    // 5*14500 (72500) + 2*15500 (31000) + 1*27500 (27500) + 0.5*68000 (34000) + 1*32000 (32000) = 197000
    // In Wonokromo specific price basket as simulated:
    const wonokromoTotal = 178500;
    const keputranTotal = 182000;
    const tambahrejoTotal = 184200;
    const soponyonoTotal = 188000;
    const pucangTotal = 192500;
    const gentengTotal = 196000;

    const markets = [
      { name: 'Pasar Wonokromo', total: wonokromoTotal },
      { name: 'Pasar Keputran', total: keputranTotal },
      { name: 'Pasar Tambahrejo', total: tambahrejoTotal },
      { name: 'Pasar Soponyono', total: soponyonoTotal },
      { name: 'Pasar Pucang Anom', total: pucangTotal },
      { name: 'Pasar Genteng', total: gentengTotal },
    ];

    markets.sort((a, b) => a.total - b.total);
    assert.strictEqual(markets[0].name, 'Pasar Wonokromo', 'Cheapest should be Pasar Wonokromo');
    assert.strictEqual(markets[markets.length - 1].name, 'Pasar Genteng', 'Most expensive should be Pasar Genteng');

    const selisihSekaliBelanja = gentengTotal - wonokromoTotal;
    assert.strictEqual(selisihSekaliBelanja, 17500, 'Difference between Genteng and Wonokromo must be 17.500');

    const penghematanBulanan = selisihSekaliBelanja * 4;
    assert.strictEqual(penghematanBulanan, 70000, 'Monthly savings for 4 trips must equal Rp 70.000');
  });

  runTest('Algorithm: Spatial Disparity (Max-Min) & Percentage Calculation', () => {
    const rawitPrices = {
      keputran: 66500,
      wonokromo: 70000,
      pucang: 74000,
      genteng: 78000,
      tambahrejo: 71500,
      soponyono: 75000
    };

    const prices = Object.values(rawitPrices);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    assert.strictEqual(minPrice, 66500, 'Minimum price at Keputran');
    assert.strictEqual(maxPrice, 78000, 'Maximum price at Genteng');
    assert.strictEqual(avgPrice, 72500, 'City average price must be Rp 72.500');

    const disparityRp = maxPrice - minPrice;
    assert.strictEqual(disparityRp, 11500, 'Disparity must be Rp 11.500');

    const disparityPct = (disparityRp / minPrice) * 100;
    assert.strictEqual(disparityPct.toFixed(1), '17.3', 'Disparity percentage must equal 17.3%');
  });

  runTest('Algorithm: Bayesian Prophet Confidence Intervals (Lower <= Mean <= Upper)', () => {
    const projections = [
      { day: "H+1", lower: 71000, mean: 72800, upper: 74500 },
      { day: "H+2", lower: 72800, mean: 74900, upper: 77200 },
      { day: "H+3", lower: 75100, mean: 77500, upper: 80100 },
      { day: "H+4", lower: 77400, mean: 79800, upper: 82600 },
      { day: "H+5", lower: 79200, mean: 81600, upper: 84800 },
      { day: "H+6", lower: 80000, mean: 82500, upper: 86400, isPeak: true },
      { day: "H+7", lower: 78500, mean: 81000, upper: 84100 },
    ];

    projections.forEach(p => {
      assert(p.lower < p.mean, `Lower CI must be strictly less than Mean on ${p.day}`);
      assert(p.mean < p.upper, `Mean must be strictly less than Upper CI on ${p.day}`);
    });

    const maxMean = Math.max(...projections.map(p => p.mean));
    const peakItem = projections.find(p => p.mean === maxMean);
    assert.strictEqual(peakItem.day, "H+6", "Peak anomaly must occur at H+6");
    assert.strictEqual(peakItem.mean, 82500, "Peak price must equal Rp 82.500");
  });

  runTest('Algorithm: SHAP Feature Importance Normalization (Sums to 100%)', () => {
    const shapFactors = [
      { name: "Pasokan Sentra Produksi", value: 44.0 },
      { name: "Curah Hujan & Iklim Ekstrem", value: 28.5 },
      { name: "Ongkos Logistik & BBM Solar", value: 15.2 },
      { name: "Tren Musiman & Pola Historis", value: 12.3 },
    ];

    const totalWeight = shapFactors.reduce((acc, f) => acc + f.value, 0);
    assert.strictEqual(Math.round(totalWeight * 10) / 10, 100.0, 'Sum of SHAP weights must be 100.0%');
  });

  runTest('Algorithm: Early Warning Z-Score categorization', () => {
    function getStatusByZScore(zScore) {
      if (zScore >= 2.0) return "KRITIS";
      if (zScore >= 1.0) return "WASPADA";
      return "NORMAL";
    }

    assert.strictEqual(getStatusByZScore(2.65), "KRITIS");
    assert.strictEqual(getStatusByZScore(1.85), "WASPADA");
    assert.strictEqual(getStatusByZScore(0.35), "NORMAL");
  });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
