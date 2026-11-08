"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLiveEarlyWarning, EarlyWarningItem } from "@/lib/dataService";

interface StrategicMarketCell {
  price: string;
  status: "normal" | "warning" | "critical";
}

interface EwsMatrixRow {
  id: number;
  komoditas: string;
  rerata: string;
  keputran: StrategicMarketCell;
  wonokromo: StrategicMarketCell;
  genteng: StrategicMarketCell;
  soponyono: StrategicMarketCell;
  skorRisiko: number;
  statusLabel: "Aman" | "Waspada" | "Siaga";
}

const DEFAULT_EWS_ROWS: EwsMatrixRow[] = [
  {
    id: 16,
    komoditas: "Telur Ayam Ras",
    rerata: "Rp 28.500",
    keputran: { price: "Rp 27.500", status: "normal" },
    wonokromo: { price: "Rp 28.000", status: "normal" },
    genteng: { price: "Rp 29.500", status: "warning" },
    soponyono: { price: "Rp 31.000", status: "critical" },
    skorRisiko: 70,
    statusLabel: "Siaga",
  },
  {
    id: 50,
    komoditas: "Cabai Rawit Merah",
    rerata: "Rp 72.000",
    keputran: { price: "Rp 68.000", status: "normal" },
    wonokromo: { price: "Rp 70.000", status: "normal" },
    genteng: { price: "Rp 74.000", status: "warning" },
    soponyono: { price: "Rp 76.000", status: "warning" },
    skorRisiko: 58,
    statusLabel: "Waspada",
  },
  {
    id: 39,
    komoditas: "Bawang Merah",
    rerata: "Rp 38.000",
    keputran: { price: "Rp 36.000", status: "normal" },
    wonokromo: { price: "Rp 38.000", status: "normal" },
    genteng: { price: "Rp 39.000", status: "normal" },
    soponyono: { price: "Rp 39.000", status: "normal" },
    skorRisiko: 42,
    statusLabel: "Waspada",
  },
  {
    id: 2,
    komoditas: "Beras Premium",
    rerata: "Rp 15.000",
    keputran: { price: "Rp 14.800", status: "normal" },
    wonokromo: { price: "Rp 15.000", status: "normal" },
    genteng: { price: "Rp 15.200", status: "normal" },
    soponyono: { price: "Rp 15.000", status: "normal" },
    skorRisiko: 25,
    statusLabel: "Aman",
  },
];

export default function LandingEwsPreview() {
  const [rows, setRows] = useState<EwsMatrixRow[]>(DEFAULT_EWS_ROWS);
  const [hotspot, setHotspot] = useState<{
    title: string;
    score: number;
    status: string;
    desc: string;
  }>({
    title: "Fokus Perhatian: Harga Telur",
    score: 70,
    status: "Siaga",
    desc: "Harga telur di Soponyono Rp 31.000/kg, sekitar 14,8% di atas batas acuan Bapanas Rp 27.000. Ringkasan ini membantu TPID Surabaya menentukan pasar yang perlu dicek lebih dulu.",
  });

  useEffect(() => {
    let isMounted = true;
    getLiveEarlyWarning().then((res) => {
      if (!isMounted || !res || !res.items || res.items.length === 0) return;

      const items = res.items;
      // Cari komoditas dengan skor risiko tertinggi
      const sorted = [...items].sort((a, b) => (b.total_skor || 0) - (a.total_skor || 0));
      const top = sorted[0];

      if (top) {
        const statusLabel =
          top.status_warning === "TINGGI" ? "Siaga" : top.status_warning === "WASPADA" ? "Waspada" : "Aman";
        const priceStr = top.harga_terakhir ? `Rp ${top.harga_terakhir.toLocaleString("id-ID")}` : "tercatat bergejolak";

        setHotspot({
          title: `Fokus Perhatian: ${top.nama_komoditas}`,
          score: top.total_skor,
          status: statusLabel,
          desc: `Harga ${top.nama_komoditas} di ${top.nama_pasar} (${priceStr}) memerlukan pemantauan ketat (skor risiko ${top.total_skor}/100). Ringkasan ini memandu prioritas intervensi pasokan TPID Surabaya.`,
        });
      }

      // Update skor risiko komoditas di tabel
      setRows((prevRows) =>
        prevRows.map((r) => {
          const match = items.find((i) => i.komoditas_id === r.id);
          if (match) {
            const label: "Aman" | "Waspada" | "Siaga" =
              match.status_warning === "TINGGI" ? "Siaga" : match.status_warning === "WASPADA" ? "Waspada" : "Aman";
            return {
              ...r,
              skorRisiko: match.total_skor,
              statusLabel: label,
            };
          }
          return r;
        })
      );
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const getCellBadge = (status: "normal" | "warning" | "critical") => {
    if (status === "critical") {
      return "bg-rose-50 text-rose-800 border-rose-200/80 font-semibold";
    }
    if (status === "warning") {
      return "bg-amber-50 text-amber-800 border-amber-200/80 font-semibold";
    }
    return "bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium";
  };

  const getRiskScoreBadge = (status: "Aman" | "Waspada" | "Siaga") => {
    if (status === "Siaga") {
      return "bg-rose-100 text-rose-900 border-rose-300 font-bold";
    }
    if (status === "Waspada") {
      return "bg-amber-100 text-amber-900 border-amber-300 font-bold";
    }
    return "bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold";
  };

  return (
    <div className="w-full bg-surface-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border-subtle">
      {/* Executive Alert Banner: Focused Hotspot + Actionable Context */}
      <div className="rounded-xl p-3.5 sm:p-4 bg-amber-50/90 border border-amber-200/90 flex items-start gap-3 mb-3.5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-800 mt-0.5">
          <span className="material-symbols-outlined text-[18px]">warning</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs uppercase text-amber-900 tracking-wider">
              {hotspot.title}
            </span>
            <span className="text-xs font-bold bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full border border-rose-200">
              {hotspot.status} · {hotspot.score}/100
            </span>
          </div>
          <p className="text-xs text-text-primary mt-1 leading-snug">
            {hotspot.desc}
          </p>
        </div>
      </div>

      {/* Visual Legend Bar: Clear Definition of Colors */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-border-subtle text-xs text-text-secondary">
        <span className="font-semibold text-text-primary">
          Harga dan tingkat perhatian di empat pasar
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Normal (di bawah 40)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>Waspada (40–69)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>Siaga (70 ke atas)</span>
          </span>
        </div>
      </div>

      {/* 4 Strategic Markets Representative Table */}
      <div
        className="overflow-x-auto rounded-xl border border-border-subtle/80 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        role="region"
        aria-label="Harga empat bahan pangan di empat pasar"
        tabIndex={0}
      >
        <table className="w-full min-w-[640px] text-xs text-left font-sans">
          <caption className="sr-only">Harga dan tingkat perhatian untuk empat bahan pangan di empat pasar Surabaya</caption>
          <thead className="bg-surface-canvas text-text-secondary uppercase text-[10px] font-bold tracking-wider border-b border-border-subtle">
            <tr className="align-middle">
              <th scope="col" className="py-2.5 px-3 whitespace-nowrap">Bahan Pangan</th>
              <th scope="col" className="py-2.5 px-3 text-right whitespace-nowrap">Rata-rata</th>
              <th scope="col" className="py-2.5 px-2 text-center whitespace-nowrap">Keputran</th>
              <th scope="col" className="py-2.5 px-2 text-center whitespace-nowrap">Wonokromo</th>
              <th scope="col" className="py-2.5 px-2 text-center whitespace-nowrap">Genteng</th>
              <th scope="col" className="py-2.5 px-2 text-center whitespace-nowrap">Soponyono</th>
              <th scope="col" className="py-2.5 px-3 text-right whitespace-nowrap">Perhatian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/50">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-surface-canvas/60 transition-colors align-middle">
                <th scope="row" className="py-2.5 px-3 font-semibold text-text-primary whitespace-nowrap">
                  {row.komoditas}
                </th>
                <td className="py-2.5 px-3 text-right font-semibold text-text-primary whitespace-nowrap tabular-nums">
                  {row.rerata}
                </td>
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  <span className={`inline-block px-2 py-0.5 rounded border text-[11px] tabular-nums ${getCellBadge(row.keputran.status)}`}>
                    {row.keputran.price}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  <span className={`inline-block px-2 py-0.5 rounded border text-[11px] tabular-nums ${getCellBadge(row.wonokromo.status)}`}>
                    {row.wonokromo.price}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  <span className={`inline-block px-2 py-0.5 rounded border text-[11px] tabular-nums ${getCellBadge(row.genteng.status)}`}>
                    {row.genteng.price}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  <span className={`inline-block px-2 py-0.5 rounded border text-[11px] tabular-nums ${getCellBadge(row.soponyono.status)}`}>
                    {row.soponyono.price}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] tabular-nums ${getRiskScoreBadge(row.statusLabel)}`}>
                    <span>{row.skorRisiko}</span>
                    <span className="text-[10px] opacity-80">({row.statusLabel})</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clean Single Bottom Link */}
      <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-end">
        <Link
          href="/early-warning"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-xs transition-all active:scale-[0.98] shrink-0"
        >
          <span>Lihat Semua Pasar dan Bahan Pangan</span>
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
