const assert = require('assert');

const MARKETS = [
  { id: 2, name: "Pasar Wonokromo" },
  { id: 5, name: "Pasar Keputran" },
  { id: 4, name: "Pasar Pucang Anom" },
  { id: 3, name: "Pasar Genteng" },
  { id: 1, name: "Pasar Tambahrejo" },
  { id: 146, name: "Pasar Soponyono" },
];

const COMMODITIES = [
  {
    id: 1,
    name: "Cabai Rawit Merah",
    averagePrice: 52000,
    marketPrices: { 1: 53000, 2: 51500, 3: 57500, 4: 52000, 5: 46000, 146: 52000 },
    forecastH7: [
      { date: "H+1", price: 53500, lower: 51000, upper: 55800 },
      { date: "H+2", price: 54800, lower: 52000, upper: 57500 },
      { date: "H+3", price: 56000, lower: 53100, upper: 59200 },
      { date: "H+4", price: 56500, lower: 53000, upper: 60100 },
      { date: "H+5", price: 55200, lower: 51500, upper: 59000 },
      { date: "H+6", price: 54000, lower: 50000, upper: 58000 },
      { date: "H+7", price: 53000, lower: 48500, upper: 57200 },
    ],
    volatilityZScore: 2.34
  },
  {
    id: 2,
    name: "Beras Premium",
    averagePrice: 15400,
    marketPrices: { 1: 15300, 2: 15200, 3: 15600, 4: 15500, 5: 14800, 146: 15800 },
    forecastH7: [
      { date: "H+1", price: 15400, lower: 15200, upper: 15600 }
    ],
    volatilityZScore: 0.42
  }
];

function testSmartShoppingBasket() {
  console.log('[TEST] Running Smart Shopping Basket calculation test...');
  const basket = [
    { commodity: COMMODITIES[0], qty: 2 }, // 2 kg Cabai
    { commodity: COMMODITIES[1], qty: 5 }, // 5 kg Beras
  ];

  const marketTotals = MARKETS.map(m => {
    const total = basket.reduce((acc, item) => {
      const price = item.commodity.marketPrices[m.id] || item.commodity.averagePrice;
      return acc + (price * item.qty);
    }, 0);
    return { market: m.name, total };
  }).sort((a, b) => a.total - b.total);

  // Expected: Pasar Keputran is cheapest (2 * 46000 + 5 * 14800 = 92000 + 74000 = 166000)
  assert.strictEqual(marketTotals[0].market, "Pasar Keputran");
  assert.strictEqual(marketTotals[0].total, 166000);

  // Expected: Pasar Genteng is most expensive (2 * 57500 + 5 * 15600 = 115000 + 78000 = 193000)
  const mostExpensive = marketTotals[marketTotals.length - 1];
  assert.strictEqual(mostExpensive.market, "Pasar Genteng");
  assert.strictEqual(mostExpensive.total, 193000);

  console.log('✓ Smart Shopping Basket calculation: PASSED (Cheapest: Pasar Keputran Rp 166.000 vs Highest: Pasar Genteng Rp 193.000)');
}

function testForecastingConfidenceIntervals() {
  console.log('[TEST] Running Forecasting bounds verification...');
  COMMODITIES[0].forecastH7.forEach(f => {
    assert(f.lower < f.price, `Lower bound should be < price at ${f.date}`);
    assert(f.price < f.upper, `Price should be < upper bound at ${f.date}`);
  });
  console.log('✓ Confidence interval consistency (lower < price < upper): PASSED');
}

function testDisparityMetrics() {
  console.log('[TEST] Running Disparity & Z-Score verification...');
  const prices = Object.values(COMMODITIES[0].marketPrices);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  assert.strictEqual(min, 46000);
  assert.strictEqual(max, 57500);
  const disparityRp = max - min;
  assert.strictEqual(disparityRp, 11500);
  console.log('✓ Disparity metrics: PASSED (Max disparity Rp 11.500)');
}

testSmartShoppingBasket();
testForecastingConfidenceIntervals();
testDisparityMetrics();
console.log('--- ALL LOGIC UNIT TESTS PASSED ---');
