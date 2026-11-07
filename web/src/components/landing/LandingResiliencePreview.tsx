"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_BASKET_ITEMS,
  FoodStabilitySummary,
  ShoppingBasketSimulation,
  getLiveShoppingBasket,
  getLiveStabilitySummary,
} from "@/lib/dataService";

export default function LandingResiliencePreview() {
  const [summary, setSummary] = useState<FoodStabilitySummary | null>(null);
  const [basket, setBasket] = useState<ShoppingBasketSimulation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getLiveStabilitySummary(), getLiveShoppingBasket(DEFAULT_BASKET_ITEMS)])
      .then(([liveSummary, liveBasket]) => {
        if (!isMounted) return;
        setSummary(liveSummary);
        setBasket(liveBasket);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const statusTone =
    summary?.statusLabel === "Siaga" || summary?.statusLabel === "Kritis"
      ? "bg-rose-50 text-rose-700"
      : summary?.statusLabel === "Waspada"
      ? "bg-status-warning-bg text-status-warning"
      : "bg-status-normal-bg text-status-normal";

  return (
    <section
      aria-labelledby="landing-resilience-title"
      className="h-full flex flex-col justify-between rounded-2xl border border-border-subtle bg-gradient-to-br from-emerald-50/70 via-surface-canvas to-surface-card p-4 sm:p-5 shadow-sm"
    >
      {loading ? (
        <div className="animate-pulse flex flex-col justify-between h-full" role="status" aria-label="Memuat ringkasan ketahanan pangan">
          <div>
            <div className="h-3 w-32 rounded bg-surface-subtle" />
            <div className="mt-2 h-5 w-44 rounded bg-surface-subtle" />
            <div className="mt-4 h-9 w-28 rounded bg-surface-subtle" />
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="h-16 rounded-xl bg-surface-card" />
              <div className="h-16 rounded-xl bg-surface-card" />
            </div>
          </div>
          <div className="mt-4 h-9 rounded-lg bg-surface-card" />
        </div>
      ) : summary ? (
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Status pasokan kota · TPID
                </p>
                <h2 id="landing-resilience-title" className="mt-0.5 text-base font-bold leading-tight text-text-primary">
                  Indeks Ketahanan Pangan
                </h2>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${statusTone}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {summary.statusLabel}
              </span>
            </div>

            <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-metric-display text-4xl sm:text-[42px] font-bold tracking-tight text-primary leading-none">
                {summary.stabilityIndex}
              </span>
              <span className="text-xs font-semibold text-text-secondary">{summary.targetText}</span>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5 rounded-xl bg-surface-card p-2.5 sm:p-3 border border-border-subtle/60 shadow-2xs">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="material-symbols-outlined grid h-8 w-8 shrink-0 place-items-center rounded-full bg-status-normal-bg text-status-normal text-[18px]" aria-hidden="true">
                  check_circle
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight text-text-primary">
                    {summary.normalCount} titik
                  </p>
                  <p className="text-[11px] leading-tight text-text-secondary mt-0.5">Harga terkendali</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`material-symbols-outlined grid h-8 w-8 shrink-0 place-items-center rounded-full text-[18px] ${
                    summary.alertCount > 0 ? "bg-status-warning-bg text-status-warning" : "bg-status-normal-bg text-status-normal"
                  }`}
                  aria-hidden="true"
                >
                  {summary.alertCount > 0 ? "warning" : "verified"}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-bold leading-tight ${summary.alertCount > 0 ? "text-status-warning" : "text-text-primary"}`}>
                    {summary.alertCount} titik
                  </p>
                  <p className="text-[11px] leading-tight text-text-secondary mt-0.5">Dalam pengawasan</p>
                </div>
              </div>
            </div>
          </div>

          {basket ? (
            <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              <span className="material-symbols-outlined shrink-0 text-[18px] text-primary" aria-hidden="true">storefront</span>
              <span className="min-w-0 text-xs">Termurah keranjang: <strong>{basket.cheapestMarket}</strong></span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex h-full min-h-36 flex-col justify-center">
          <p className="text-sm font-semibold text-text-primary">Ringkasan belum tersedia</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            Data terbaru belum dapat dimuat.
          </p>
        </div>
      )}
    </section>
  );
}
