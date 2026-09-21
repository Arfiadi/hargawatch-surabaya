const assert = require('assert');
const http = require('http');

console.log('========================================================================');
console.log('   HARGAWATCH SURABAYA - EXHAUSTIVE STITCH SPEC & FEATURE TEST SUITE    ');
console.log('========================================================================\n');

let total = 0;
let passed = 0;
let failed = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`           ${e.message}`);
  }
}

async function asyncTest(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`           ${e.message}`);
  }
}

function fetchHtml(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- TEST GROUP 1: GLOBAL LAYOUT, BRANDING & NAVIGATION ---');
  
  const pages = ['/', '/peta', '/early-warning', '/forecasting'];
  for (const p of pages) {
    await asyncTest(`Global: Page ${p} loads with HTTP 200 and full HTML document`, async () => {
      const res = await fetchHtml(p);
      assert.strictEqual(res.status, 200, `Page ${p} must respond 200 OK`);
      assert(res.html.includes('HargaWatch'), 'Must contain HargaWatch title');
      assert(res.html.includes('Surabaya Food Intel'), 'Must contain Surabaya Food Intel subtitle');
      assert(res.html.includes('Pemantauan Resmi Pemkot'), 'Must have official monitoring badge');
      assert(res.html.includes('API: Update 10m Lalu'), 'Must have API latency indicator');
      assert(res.html.includes('Dinas Perdagangan'), 'Must include Dinas Perdagangan profile');
      assert(res.html.includes('Terverifikasi SP2KP &amp; TPID Kota Surabaya') || res.html.includes('Terverifikasi SP2KP & TPID Kota Surabaya'), 'Must have footer accreditation');
      assert(res.html.includes('0800-1-987-987'), 'Must contain Satgas Pangan hotline');
    });
  }

  console.log('\n--- TEST GROUP 2: DASHBOARD PUBLIK (05_dashboard_publik.html) ---');

  await asyncTest('Dashboard: Sub-Hero & Quick Health Summary Metrics', async () => {
    const res = await fetchHtml('/');
    const html = res.html;
    assert(html.includes('Pantau Harga Pangan Terkini &amp; Belanja Cerdas di Pasar Surabaya') || html.includes('Pantau Harga Pangan Terkini & Belanja Cerdas di Pasar Surabaya'));
    assert(html.includes('94.2%'), 'Indeks Stabilitas must be 94.2%');
    assert(html.includes('8 Bahan'), 'Must display 8 Bahan Normal');
    assert(html.includes('2 Bahan'), 'Must display 2 Bahan Fluktuatif');
    assert(html.includes('Cabai &amp; Bwg Merah') || html.includes('Cabai & Bwg Merah'));
    assert(html.includes('Waspada Fluktuasi Pasar'), 'Must include alert banner');
  });

  await asyncTest('Dashboard: 6 Commodities and Best Price Finder Cards', async () => {
    const res = await fetchHtml('/');
    const html = res.html;
    assert(html.includes('Beras Medium'), 'Card 1: Beras Medium');
    assert(html.includes('Rp 13.200'), 'Beras Medium price Rp 13.200');
    assert(html.includes('Pasar Tambahrejo'), 'Beras cheapest at Pasar Tambahrejo');

    assert(html.includes('Minyak Goreng Curah'), 'Card 2: Minyak Goreng Curah');
    assert(html.includes('Rp 15.500'), 'Minyak Curah price Rp 15.500');
    assert(html.includes('Pasar Wonokromo'), 'Minyak cheapest at Pasar Wonokromo');

    assert(html.includes('Telur Ayam Ras'), 'Card 3: Telur Ayam Ras');
    assert(html.includes('Rp 27.500'), 'Telur Ayam price Rp 27.500');
    assert(html.includes('Pasar Soponyono'), 'Telur cheapest at Pasar Soponyono');

    assert(html.includes('Cabai Rawit Merah'), 'Card 4: Cabai Rawit Merah');
    assert(html.includes('Rp 68.000'), 'Cabai Rawit price Rp 68.000');
    assert(html.includes('Pasar Keputran'), 'Cabai cheapest at Pasar Keputran');
    assert(html.includes('Disparitas Tinggi'), 'Cabai has Disparitas Tinggi tag');

    assert(html.includes('Daging Sapi Murni'), 'Card 5: Daging Sapi Murni');
    assert(html.includes('Rp 118.000'), 'Daging Sapi price Rp 118.000');
    assert(html.includes('Pasar Pucang Anom'), 'Daging cheapest at Pasar Pucang Anom');

    assert(html.includes('Bawang Merah'), 'Card 6: Bawang Merah');
    assert(html.includes('Rp 32.000'), 'Bawang Merah price Rp 32.000');
  });

  await asyncTest('Dashboard: Smart Shopping Basket Ranking & Monthly Savings', async () => {
    const res = await fetchHtml('/');
    const html = res.html;
    assert(html.includes('Smart Shopping Basket'), 'Section exists');
    assert(html.includes('Rp 178.500'), 'Rank 1 Wonokromo Rp 178.500');
    assert(html.includes('Rp 182.000'), 'Rank 2 Keputran Rp 182.000');
    assert(html.includes('Rp 184.200'), 'Rank 3 Tambahrejo Rp 184.200');
    assert(html.includes('Rp 188.000'), 'Rank 4 Soponyono Rp 188.000');
    assert(html.includes('Rp 192.500'), 'Rank 5 Pucang Anom Rp 192.500');
    assert(html.includes('Rp 196.000'), 'Rank 6 Genteng Rp 196.000');
    assert(html.includes('Rp 70.000/bulan'), 'Monthly savings Rp 70.000/bulan');
    assert(html.includes('Bagikan Rincian Belanja ke WhatsApp'), 'WhatsApp share button exists');
  });

  await asyncTest('Dashboard: 14-Day Consumer Price Dynamics Multi-Line Chart', async () => {
    const res = await fetchHtml('/');
    const html = res.html;
    assert(html.includes('Dinamika Harga 4 Komoditas Pokok Utama'));
    assert(html.includes('Rp 80k') && html.includes('Rp 50k') && html.includes('Rp 30k') && html.includes('Rp 10k'));
    assert(html.includes('Hari Ini (Pk 12.00)'));
  });

  console.log('\n--- TEST GROUP 3: PETA DISPARITAS SPASIAL (06_peta_spasial.html) ---');

  await asyncTest('Peta: Header Telemetry & Analytical Filter Controls', async () => {
    const res = await fetchHtml('/peta');
    const html = res.html;
    assert(html.includes('Peta Disparitas Harga Antar-Pasar'));
    assert(html.includes('12.4%'), 'Koefisien variasi 12.4%');
    assert(html.includes('Rp 11.500/kg'), 'Anomali terbuka Rp 11.500/kg');
    assert(html.includes('commodity-select'), 'Commodity select dropdown exists');
    assert(html.includes('Filter Zonasi Pasar'), 'Zone filter exists');
  });

  await asyncTest('Peta: Spatial Map Canvas & Active Pin Tooltip for Genteng', async () => {
    const res = await fetchHtml('/peta');
    const html = res.html;
    assert(html.includes('spatial-canvas'), 'Canvas container exists');
    assert(html.includes('Heatmap Layer: Spasial Disparitas'));
    assert(html.includes('Pasar Genteng'), 'Genteng node exists');
    assert(html.includes('BENCHMARK'), 'Keputran benchmark badge exists');
    assert(html.includes('Selisih vs Keputran:'), 'Tooltip differential row exists');
    assert(html.includes('Est. Margin Logistik:'), 'Tooltip logistics margin row exists');
    assert(html.includes('Rp 4.200/kg (Tinggi)'), 'Margin logistik value exists');
  });

  await asyncTest('Peta: Koridor Pasokan GPS & Satgas Recommendation', async () => {
    const res = await fetchHtml('/peta');
    const html = res.html;
    assert(html.includes('Koridor Pasokan'));
    assert(html.includes('Kediri / Blitar → Keputran') || html.includes('Kediri/Blitar'));
    assert(html.includes('Bottleneck +17%'));
    assert(html.includes('Transit Sub-Hub'));
    assert(html.includes('Rekomendasi Satgas Pangan'));
    assert(html.includes('Rancang Operasi Pasar'));
  });

  await asyncTest('Peta: Matriks Komparasi 6 Pasar (8 Komoditas Pokok)', async () => {
    const res = await fetchHtml('/peta');
    const html = res.html;
    assert(html.includes('Matriks Komparasi 6 Pasar Strategis'));
    assert(html.includes('Cabai Rawit Merah'));
    assert(html.includes('Beras Medium'));
    assert(html.includes('Gula Pasir Curah'));
    assert(html.includes('Minyakita'));
    assert(html.includes('Telur Ayam Ras'));
    assert(html.includes('Daging Sapi Murni'));
    assert(html.includes('Bawang Merah Super'));
    assert(html.includes('Bawang Putih Honan'));
    assert(html.includes('Pipeline &amp; Sinkronisasi Node Pasar') || html.includes('Pipeline & Sinkronisasi Node Pasar'));
    assert(html.includes('99.8%'), 'Uptime 99.8%');
  });

  console.log('\n--- TEST GROUP 4: EARLY WARNING SYSTEM (07_early_warning.html) ---');

  await asyncTest('Early Warning: Executive Warning Banner Level II & 4 KPI Cards', async () => {
    const res = await fetchHtml('/early-warning');
    const html = res.html;
    assert(html.includes('LEVEL PERINGATAN KOTA: WASPADA TINGKAT II'));
    assert(html.includes('Anomali Distribusi Hortikultura'));
    assert(html.includes('trigger-all-interventions'), 'Intervention trigger button exists');
    assert(html.includes('Indeks Volatilitas Pangan'));
    assert(html.includes('3.42'), 'Volatilitas 3.42');
    assert(html.includes('1.450 Ton'), 'Beras cadangan 1.450 Ton');
    assert(html.includes('22 Ton'), 'Minyak cadangan 22 Ton');
  });

  await asyncTest('Early Warning: 6x6 Risk Matrix & Outlier Actions', async () => {
    const res = await fetchHtml('/early-warning');
    const html = res.html;
    assert(html.includes('Matriks Disparitas &amp; Risiko Komoditas') || html.includes('Matriks Disparitas & Risiko Komoditas'));
    assert(html.includes('Rp 78.000'), 'Genteng Cabai Rp 78.000');
    assert(html.includes('Picu Operasi Pasar'), 'Action button exists');
    assert(html.includes('Intervensi Pasokan'), 'Action button exists');
    assert(html.includes('Log Deteksi Anomali &amp; Price Surge Alert Feed') || html.includes('Log Deteksi Anomali & Price Surge Alert Feed'));
    assert(html.includes('Dokumentasi Petugas Enumerator Pasar'));
  });

  await asyncTest('Early Warning: Prescriptive Intervention Modal (#operasi-modal)', async () => {
    const res = await fetchHtml('/early-warning');
    const html = res.html;
    assert(html.includes('id="operasi-modal"'), 'Must contain operasi-modal element');
    assert(html.includes('Pemicu Operasi Pasar Murah Cepat'));
    assert(html.includes('Alokasi Volume Intervensi'));
    assert(html.includes('1.500 Kg'));
    assert(html.includes('3.000 Kg'));
    assert(html.includes('5.000 Kg'));
    assert(html.includes('Kirim Perintah Operasi Sekarang'));
    assert(html.includes('id="dispatch-toast"'), 'Must contain toast notification element');
  });

  console.log('\n--- TEST GROUP 5: FORECASTING & TREN AI (08_forecasting.html) ---');

  await asyncTest('Forecasting: Engine AI V3.2 Metadata & Horizon Toggle Controls', async () => {
    const res = await fetchHtml('/forecasting');
    const html = res.html;
    assert(html.includes('ENGINE AI FORECASTING V3.2'));
    assert(html.includes('MAPE MODEL: 3.82%'));
    assert(html.includes('ESTIMASI PUNCAK'));
    assert(html.includes('H+6 (Rp 82.500)'));
    assert(html.includes('id="horizon7"'), '7 Hari toggle button exists');
    assert(html.includes('id="horizon14"'), '14 Hari toggle button exists');
    assert(html.includes('id="btnExportSimulation"'), 'CSV Export button exists');
  });

  await asyncTest('Forecasting: Predictive Trajectory Canvas with H+6 Peak Callout', async () => {
    const res = await fetchHtml('/forecasting');
    const html = res.html;
    assert(html.includes('Trayektori Cabai Rawit Merah'));
    assert(html.includes('Rp 71.200'), 'Harga rata-rata riil hari ini Rp 71.200');
    assert(html.includes('PUNCAK VOLATILITAS'), 'Peak callout exists');
    assert(html.includes('Rp 82.500'), 'Peak price value exists');
    assert(html.includes('PASOKAN MASUK'), 'PASOKAN MASUK callout exists');
    assert(html.includes('Panen raya Kediri &amp; Malang') || html.includes('Panen raya Kediri & Malang'), 'Panen raya message exists');
  });

  await asyncTest('Forecasting: SHAP Feature Attribution Analysis', async () => {
    const res = await fetchHtml('/forecasting');
    const html = res.html;
    assert(html.includes('Faktor Pendorong Model'));
    assert(html.includes('Shapley Value (SHAP)') || html.includes('SHAP'));
    assert(html.includes('44.0%'), 'Permintaan Ramadan 44.0%');
    assert(html.includes('28.5%'), 'Curah Hujan 28.5%');
    assert(html.includes('15.2%'), 'Biaya Logistik 15.2%');
    assert(html.includes('12.3%'), 'Siklus Historis 12.3%');
  });

  await asyncTest('Forecasting: Multi-Year Seasonal Wave & Municipal Mitigation Timeline', async () => {
    const res = await fetchHtml('/forecasting');
    const html = res.html;
    assert(html.includes('Komparasi Siklus Musiman (2023 – 2025)') || html.includes('Komparasi Siklus Musiman (2023 - 2025)'));
    assert(html.includes('Timeline Operasi &amp; Mitigasi') || html.includes('Timeline Operasi & Mitigasi'));
    assert(html.includes('31 KECAMATAN'));
    assert(html.includes('GPM Gelombang 1 (Fokus Cabai &amp; Daging)') || html.includes('GPM Gelombang 1 (Fokus Cabai & Daging)'));
    assert(html.includes('btnDispatchTPID'), 'TPID dispatch button exists');
    assert(html.includes('SENTRA PASOKAN KEDIRI'));
    assert(html.includes('SURVEI RIIL PASAR KEPUTRAN'));
    assert(html.includes('COLD STORAGE OSOWILANGUN'));
  });

  console.log('\n========================================================================');
  console.log(`EXHAUSTIVE TEST RESULTS: ${passed}/${total} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
