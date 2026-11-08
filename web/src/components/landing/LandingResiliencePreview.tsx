"use client";

import { useEffect, useState } from "react";
import {
  FoodStabilitySummary,
  getLiveStabilitySummary,
} from "@/lib/dataService";

export default function LandingResiliencePreview() {
  const [summary, setSummary] = useState<FoodStabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getLiveStabilitySummary()
      .then((liveSummary) => {
        if (!isMounted) return;
        setSummary(liveSummary);
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

  const stabilityNumber = summary ? parseFloat(summary.stabilityIndex) : 0;

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
        </div>
      ) : summary ? (
        <div className="flex flex-col justify-between h-full gap-3 sm:gap-4">
          {/* Header & Indeks Ketahanan Pangan */}
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

            <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-metric-display text-3xl sm:text-4xl font-bold tracking-tight text-primary leading-none">
                {summary.stabilityIndex}
              </span>
              <span className="text-xs font-semibold text-text-secondary">{summary.targetText}</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-2.5 w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border-subtle/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.isNormal ? "bg-primary" : "bg-status-warning"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, stabilityNumber))}%` }}
              />
            </div>
          </div>

          {/* 2 KPI Titik Terkendali & Pengawasan */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-card p-2.5 sm:p-3 border border-border-subtle/60 shadow-2xs">
            <div className="flex min-w-0 items-center gap-2">
              <span className="material-symbols-outlined grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-full bg-status-normal-bg text-status-normal text-[16px] sm:text-[18px]" aria-hidden="true">
                check_circle
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold leading-tight text-text-primary">
                  {summary.normalCount} titik
                </p>
                <p className="text-[10.5px] sm:text-[11px] leading-tight text-text-secondary mt-0.5 truncate">Terkendali</p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`material-symbols-outlined grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-full text-[16px] sm:text-[18px] ${
                  summary.alertCount > 0 ? "bg-status-warning-bg text-status-warning" : "bg-status-normal-bg text-status-normal"
                }`}
                aria-hidden="true"
              >
                {summary.alertCount > 0 ? "warning" : "verified"}
              </span>
              <div className="min-w-0">
                <p className={`text-xs sm:text-sm font-bold leading-tight ${summary.alertCount > 0 ? "text-status-warning" : "text-text-primary"}`}>
                  {summary.alertCount} titik
                </p>
                <p className="text-[10.5px] sm:text-[11px] leading-tight text-text-secondary mt-0.5 truncate">Pengawasan</p>
              </div>
            </div>
          </div>
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
