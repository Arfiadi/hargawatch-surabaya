"use client";

import { Commodity, MARKETS } from "@/data/mockData";

export interface BasketItem {
  commodity: Commodity;
  qty: number;
}

interface Props {
  items: BasketItem[];
  onUpdateQty: (commodityId: number, newQty: number) => void;
  onRemoveItem: (commodityId: number) => void;
  onClearBasket: () => void;
}

export default function SmartShoppingBasket({
  items,
  onUpdateQty,
  onRemoveItem,
  onClearBasket,
}: Props) {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Calculate totals per market
  const marketTotals = MARKETS.map((market) => {
    const total = items.reduce((acc, item) => {
      const price = item.commodity.marketPrices[market.id] || item.commodity.averagePrice;
      return acc + price * item.qty;
    }, 0);
    return {
      market,
      total,
    };
  }).sort((a, b) => a.total - b.total);

  // Average city total for comparison
  const cityAverageTotal = items.reduce((acc, item) => {
    return acc + item.commodity.averagePrice * item.qty;
  }, 0);

  const cheapest = marketTotals[0];
  const savings = cityAverageTotal - (cheapest?.total || 0);

  return (
    <div className="bg-white rounded-xl border border-border-subtle p-5 shadow-sm sticky top-24">
      {/* Basket Header */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-border-subtle mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">shopping_basket</span>
          </div>
          <div>
            <h3 className="font-headline-sm font-bold text-text-primary">
              Smart Shopping Basket
            </h3>
            <span className="font-body-sm text-xs text-text-secondary">
              Kalkulator Belanja Termurah
            </span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={onClearBasket}
            className="text-xs text-text-muted hover:text-status-critical font-label-caps transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="py-8 text-center text-text-muted">
          <span className="material-symbols-outlined text-4xl text-border-strong mb-2">
            shopping_cart_checkout
          </span>
          <p className="text-sm font-body-md text-text-secondary">
            Keranjang belanja masih kosong.
          </p>
          <p className="text-xs text-text-muted mt-1">
            Klik tombol &quot;+ Tambah ke Keranjang&quot; pada komoditas di sebelah kiri untuk membandingkan total belanja antar-pasar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Item List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 no-scrollbar">
            {items.map((item) => (
              <div
                key={item.commodity.id}
                className="flex items-center justify-between gap-2 bg-surface-canvas p-2.5 rounded-lg border border-border-subtle text-xs"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-text-primary truncate">
                    {item.commodity.name}
                  </h4>
                  <span className="text-text-muted font-label-caps">
                    {formatRupiah(item.commodity.averagePrice)} / {item.commodity.unit}
                  </span>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-1.5 bg-white border border-border-subtle rounded-md px-1 py-0.5">
                  <button
                    onClick={() => onUpdateQty(item.commodity.id, item.qty - 1)}
                    className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold px-1">{item.qty}</span>
                  <button
                    onClick={() => onUpdateQty(item.commodity.id, item.qty + 1)}
                    className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => onRemoveItem(item.commodity.id)}
                  className="text-text-muted hover:text-status-critical p-1"
                  title="Hapus"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ))}
          </div>

          {/* Market Recommendation Banner */}
          {cheapest && (
            <div className="bg-primary-fixed/30 border border-primary/20 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-label-caps uppercase font-bold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Pasar Paling Hemat
                </span>
                <span className="font-label-caps text-xs px-2 py-0.5 rounded-full bg-status-normal text-white font-bold">
                  Hemat {formatRupiah(Math.max(0, savings))}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-headline-sm font-bold text-text-primary">
                  {cheapest.market.name}
                </span>
                <span className="font-metric-display text-xl text-primary font-bold">
                  {formatRupiah(cheapest.total)}
                </span>
              </div>
              <span className="text-[11px] text-text-secondary block">
                {cheapest.market.type} • {cheapest.market.address}
              </span>
            </div>
          )}

          {/* Breakdown Table for all 6 markets */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-label-caps uppercase text-text-muted block">
              Perbandingan 6 Pasar Surabaya:
            </span>
            <div className="space-y-1">
              {marketTotals.map(({ market, total }, idx) => (
                <div
                  key={market.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    idx === 0
                      ? "bg-status-normal-bg border border-status-normal-border font-bold text-status-normal"
                      : "bg-surface-canvas text-text-secondary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[10px] w-3">{idx + 1}.</span>
                    <span>{market.name}</span>
                  </span>
                  <span className="font-label-caps font-semibold">
                    {formatRupiah(total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Share & Download Actions */}
          <div className="pt-2 border-t border-border-subtle flex gap-2">
            <button
              onClick={() => {
                alert(`Daftar belanja Anda di ${cheapest?.market.name} berhasil disalin!`);
              }}
              className="flex-1 py-2 rounded-lg border border-border-subtle hover:bg-surface-subtle text-xs font-semibold text-text-primary flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              Bagikan
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="py-2 px-3 rounded-lg border border-border-subtle hover:bg-surface-subtle text-xs font-semibold text-text-primary flex items-center justify-center gap-1 transition-colors"
              title="Cetak Ringkasan"
            >
              <span className="material-symbols-outlined text-sm">print</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
