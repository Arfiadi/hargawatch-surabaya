"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLiveCommodities, CommodityPrice } from "@/lib/dataService";

interface TickerCard {
  id: number;
  name: string;
  fullName: string;
  price: string;
  unit: string;
  marketName: string;
}

const DEFAULT_TICKER_CARDS: TickerCard[] = [
  {
    id: 50,
    name: "Cabai Rawit",
    fullName: "Cabai Rawit Merah",
    price: "Rp 50.000",
    unit: "/kg",
    marketName: "Pasar Keputran",
  },
  {
    id: 16,
    name: "Telur Ayam",
    fullName: "Telur Ayam Ras",
    price: "Rp 22.000",
    unit: "/kg",
    marketName: "Pasar Tambahrejo",
  },
  {
    id: 2,
    name: "Beras Premium",
    fullName: "Beras Premium",
    price: "Rp 15.000",
    unit: "/kg",
    marketName: "Pasar Soponyono",
  },
  {
    id: 39,
    name: "Bawang",
    fullName: "Bawang Merah",
    price: "Rp 25.000",
    unit: "/kg",
    marketName: "Pasar Wonokromo",
  },
];

export default function HeroBoardPreview() {
  const [cards, setCards] = useState<TickerCard[]>(DEFAULT_TICKER_CARDS);

  useEffect(() => {
    let isMounted = true;
    getLiveCommodities().then((data: CommodityPrice[] | null) => {
      if (!isMounted || !data || data.length === 0) return;

      const TARGET_IDS = [50, 16, 2, 39];
      const updated = TARGET_IDS.map((targetId) => {
        const found = data.find((c) => c.komoditas_id === targetId || c.id === String(targetId));
        const defaultItem = DEFAULT_TICKER_CARDS.find((d) => d.id === targetId)!;
        if (found) {
          const shortName = found.name.replace(/(Merah|Ras|Kuning)$/i, "").trim() || found.name;
          return {
            id: targetId,
            name: shortName,
            fullName: found.name,
            price: found.price,
            unit: found.unit.startsWith("/") ? found.unit : `/${found.unit}`,
            marketName: found.marketName || defaultItem.marketName,
          };
        }
        return defaultItem;
      });

      setCards(updated);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {cards.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard?search=${encodeURIComponent(item.fullName || item.name)}`}
            className="group relative flex min-w-0 flex-col justify-between gap-2 rounded-xl border border-border-subtle bg-surface-card p-2.5 sm:p-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:border-primary/50"
          >
            <span className="flex items-start justify-between gap-1">
              <span className="max-w-[calc(100%-1.25rem)] truncate text-xs sm:text-[13px] font-semibold text-text-primary">
                {item.name}
              </span>
              <span className="material-symbols-outlined shrink-0 text-[16px] sm:text-[18px] text-text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                arrow_forward
              </span>
            </span>
            <span className="font-mono text-sm sm:text-base font-bold tracking-tight text-text-primary">
              {item.price}<span className="ml-1 font-sans text-[10px] sm:text-[11px] font-medium text-text-secondary">{item.unit}</span>
            </span>
            <span className="flex min-h-7 sm:min-h-7.5 min-w-0 items-center gap-1 rounded-lg border border-emerald-200/80 bg-emerald-50 px-1.5 sm:px-2 text-[10px] sm:text-[11px] text-emerald-900">
              <span className="material-symbols-outlined shrink-0 text-[14px] sm:text-[16px] text-primary" aria-hidden="true">storefront</span>
              <span className="truncate">{item.marketName}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
