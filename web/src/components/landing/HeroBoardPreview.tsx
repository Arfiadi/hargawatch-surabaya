"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLiveCommodities, CommodityPrice } from "@/lib/dataService";

interface TickerCard {
  id: number;
  name: string;
  price: string;
  unit: string;
  marketName: string;
}

const DEFAULT_TICKER_CARDS: TickerCard[] = [
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
  const [cards, setCards] = useState<TickerCard[]>(DEFAULT_TICKER_CARDS);

  useEffect(() => {
    let isMounted = true;
    getLiveCommodities().then((data: CommodityPrice[] | null) => {
      if (!isMounted || !data || data.length === 0) return;

      const TARGET_IDS = [50, 39, 2, 16];
      const updated = TARGET_IDS.map((targetId) => {
        const found = data.find((c) => c.komoditas_id === targetId || c.id === String(targetId));
        if (found) {
          return {
            id: targetId,
            name: found.name,
            price: found.price,
            unit: found.unit.startsWith("/") ? found.unit : `/${found.unit}`,
            marketName: found.marketName || "Pasar Surabaya",
          };
        }
        return DEFAULT_TICKER_CARDS.find((d) => d.id === targetId)!;
      });

      setCards(updated);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-3 min-[30rem]:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard?search=${encodeURIComponent(item.name)}`}
            className="group relative flex min-w-0 flex-col gap-3 rounded-xl border border-border-subtle bg-surface-card p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:border-primary/50 sm:p-4"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="max-w-[calc(100%-1.75rem)] truncate text-sm font-semibold text-text-primary sm:text-[15px]">
                {item.name}
              </span>
              <span className="material-symbols-outlined shrink-0 text-[22px] text-text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                arrow_forward
              </span>
            </span>
            <span className="font-mono text-lg font-bold tracking-tight text-text-primary">
              {item.price}<span className="ml-1 font-sans text-[11px] font-medium text-text-secondary">{item.unit}</span>
            </span>
            <span className="flex min-h-9 min-w-0 items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2.5 text-xs text-emerald-900">
              <span className="material-symbols-outlined shrink-0 text-[19px] text-primary" aria-hidden="true">storefront</span>
              <span className="truncate">{item.marketName}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
