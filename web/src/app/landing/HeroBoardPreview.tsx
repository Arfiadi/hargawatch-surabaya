"use client";

import Link from "next/link";

interface TickerCard {
  id: number;
  name: string;
  price: string;
  unit: string;
  marketName: string;
}

const TICKER_CARDS: TickerCard[] = [
  {
    id: 50,
    name: "Cabai Rawit Merah",
    price: "Rp 50.000",
    unit: "/kg",
    marketName: "Pasar Keputran",
  },
  {
    id: 39,
    name: "Bawang Merah",
    price: "Rp 25.000",
    unit: "/kg",
    marketName: "Pasar Wonokromo",
  },
  {
    id: 2,
    name: "Beras Premium",
    price: "Rp 15.000",
    unit: "/kg",
    marketName: "Pasar Soponyono",
  },
  {
    id: 16,
    name: "Telur Ayam Ras",
    price: "Rp 22.000",
    unit: "/kg",
    marketName: "Pasar Tambahrejo",
  },
];

export default function HeroBoardPreview() {
  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-lg transition-all duration-300">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle/80 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="HargaWatch"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain shadow-xs border border-primary/10 bg-white p-0.5 shrink-0"
            />
            <div>
              <span className="block text-sm font-bold leading-none text-text-primary sm:text-base">
                Perbandingan harga
              </span>
              <span className="mt-1 block text-xs text-text-secondary">
                Enam pasar Surabaya
              </span>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            Data contoh
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
          {TICKER_CARDS.map((item) => (
            <Link
              key={item.id}
              href={`/?search=${encodeURIComponent(item.name)}`}
              className="group relative flex min-w-0 flex-col gap-2.5 rounded-xl border border-border-subtle bg-surface-canvas p-3 transition-colors hover:border-primary/30 hover:bg-white focus-visible:border-primary/50 sm:p-3.5"
            >
              <span className="material-symbols-outlined absolute right-3 top-3 text-[22px] text-text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                arrow_forward
              </span>
              <span className="max-w-[calc(100%-1.75rem)] truncate text-sm font-semibold text-text-primary">
                {item.name}
              </span>
              <span className="font-mono text-base font-bold tracking-tight text-text-primary">
                {item.price}<span className="ml-1 font-sans text-xs font-medium text-text-secondary">{item.unit}</span>
              </span>
              <span className="flex min-h-9 min-w-0 items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2 text-xs text-emerald-900">
                <span className="material-symbols-outlined shrink-0 text-[19px] text-primary" aria-hidden="true">storefront</span>
                <span className="truncate">{item.marketName}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="flex justify-end border-t border-emerald-200/80 bg-emerald-50/80 px-4 py-2 sm:px-5">
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-primary underline underline-offset-2">
            Lihat harga terbaru <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
