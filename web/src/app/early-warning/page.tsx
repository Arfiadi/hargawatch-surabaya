"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function EarlyWarningPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCommodity, setModalCommodity] = useState("Cabai Rawit Merah");
  const [modalTarget, setModalTarget] = useState("Pasar Genteng");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openOperasiModal = (commodity: string, market: string) => {
    setModalCommodity(commodity);
    setModalTarget(market);
    setModalOpen(true);
  };

  const closeOperasiModal = () => {
    setModalOpen(false);
  };

  const confirmDispatch = () => {
    setModalOpen(false);
    showToast("Armada Operasi Pasar Murah BUMD Surya Kencana telah dimobilisasi.");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="bg-surface-canvas text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Header />

      <main className="w-full pt-20 bg-surface-canvas min-h-screen">
        <div className="flex flex-col w-full">
          {/* Content Area Wrapper */}
          <div className="w-full max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop py-space-lg flex flex-col gap-space-xl">
            {/* Top Breadcrumb & Live Dispatch Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-xs">
              <div className="flex items-center gap-space-xs text-text-secondary font-label-caps text-label-caps uppercase tracking-wider">
                <span className="inline-flex items-center gap-1 text-primary font-bold">
                  <span className="material-symbols-outlined text-body-md">shield_with_heart</span>
                  Satgas Ketahanan Pangan
                </span>
                <span>/</span>
                <span className="text-text-muted">Early Warning Matrix</span>
                <span>/</span>
                <span className="text-on-surface">Surabaya Real-Time Feed</span>
              </div>
              <div className="flex items-center gap-space-sm font-label-caps text-label-caps text-text-secondary">
                <span className="inline-flex items-center gap-1.5 bg-surface-card px-space-xs py-space-2xs rounded-full shadow-sm text-text-secondary">
                  <span className="w-2 h-2 rounded-full bg-status-critical animate-ping"></span>
                  Pemindaian SP2KP: Aktif (Interval 15m)
                </span>
                <span className="hidden md:inline text-text-muted">ID Sesi: SBY-EWS-8921-H</span>
              </div>
            </div>

            {/* Executive Alert Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-status-warning-bg via-surface-card to-surface-card shadow-sm p-space-md lg:p-space-lg">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-status-warning/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
                <div className="flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-status-warning/20 flex items-center justify-center text-status-warning shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-headline-lg">crisis_alert</span>
                  </div>
                  <div className="flex flex-col gap-space-2xs">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className="inline-flex items-center gap-1 px-space-xs py-space-2xs rounded-full bg-status-warning text-on-primary font-label-caps text-label-caps font-bold tracking-wide">
                        <span className="material-symbols-outlined text-body-sm">warning</span>
                        LEVEL PERINGATAN KOTA: WASPADA TINGKAT II
                      </span>
                      <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded-full bg-surface-subtle text-text-secondary">
                        Fokus Sektor: Hortikultura &amp; Dapur
                      </span>
                    </div>
                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                      Anomali Distribusi Hortikultura: Kenaikan Agresif Terdeteksi di Pasar Koridor Timur &amp; Tengah
                    </h1>
                    <p className="font-body-md text-body-md text-text-secondary max-w-3xl">
                      Model komputasi TPID Surabaya mengonfirmasi kenaikan di atas ambang 8% pada komoditas Cabai Rawit &amp; Bawang Merah. Protokol pra-stabilisasi otomatis disiapkan untuk koordinasi Dinas Perdagangan dan PD Pasar Surya.
                    </p>
                  </div>
                </div>
                {/* Quick Action Trigger Header */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-space-xs shrink-0 w-full lg:w-auto">
                  <button
                    className="w-full inline-flex items-center justify-center gap-space-xs px-space-md py-space-xs rounded-xl bg-primary text-on-primary font-headline-sm text-body-md shadow-md hover:bg-primary-container transition-all cursor-pointer"
                    id="trigger-all-interventions"
                    onClick={() =>
                      openOperasiModal(
                        "Komoditas Hortikultura Serentak",
                        "Pasar Genteng, Soponyono & Wonokromo"
                      )
                    }
                  >
                    <span className="material-symbols-outlined text-body-lg">local_shipping</span>
                    <span>Rilis Operasi Pasar Serentak</span>
                  </button>
                  <div className="flex items-center justify-between lg:justify-end gap-space-xs text-text-muted font-label-caps text-label-caps">
                    <span>SK Walikota No. 41/2025</span>
                    <span>•</span>
                    <span className="text-status-normal font-semibold">Siap Salur 100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Key Executive Analytical KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {/* KPI 1 */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                    Indeks Volatilitas Pangan
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center text-text-secondary">
                    <span className="material-symbols-outlined text-body-lg">show_chart</span>
                  </span>
                </div>
                <div className="flex flex-col gap-space-2xs">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-metric-display text-metric-display text-on-surface">3.42</span>
                    <span className="inline-flex items-center text-status-critical font-metric-delta text-metric-delta">
                      <span className="material-symbols-outlined text-body-sm">arrow_upward</span>
                      +0.8 WoW
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-text-secondary">
                    Batas Aman Pemkot: ≤ 2.50
                  </span>
                </div>
                {/* Micro sparkline SVG */}
                <div className="w-full h-8 pt-1">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 24">
                    <path
                      d="M0,18 L15,17 L30,19 L45,14 L60,15 L75,9 L90,5 L100,2"
                      fill="none"
                      stroke="#DC2626"
                      strokeLinecap="round"
                      strokeWidth="2.2"
                    ></path>
                    <path
                      d="M0,18 L15,17 L30,19 L45,14 L60,15 L75,9 L90,5 L100,2 L100,24 L0,24 Z"
                      fill="url(#kpiGradRed)"
                      opacity="0.12"
                    ></path>
                    <defs>
                      <linearGradient id="kpiGradRed" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#DC2626"></stop>
                        <stop offset="100%" stopColor="#DC2626" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                    Komoditas Risiko Tinggi
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-status-critical-bg text-status-critical flex items-center justify-center">
                    <span className="material-symbols-outlined text-body-lg">emergency_home</span>
                  </span>
                </div>
                <div className="flex flex-col gap-space-2xs">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-metric-display text-metric-display text-status-critical">2</span>
                    <span className="font-title-md text-title-md text-text-secondary">Komoditas</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-space-xs py-0.5 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps">
                      Cabai Rawit
                    </span>
                    <span className="px-space-xs py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-label-caps">
                      Bw. Merah
                    </span>
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-text-muted">
                  Kenaikan akumulatif 7-hari &gt; 9.4%
                </span>
              </div>

              {/* KPI 3 */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                    Deteksi Anomali Aktif
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-status-warning-bg text-status-warning flex items-center justify-center">
                    <span className="material-symbols-outlined text-body-lg">radar</span>
                  </span>
                </div>
                <div className="flex flex-col gap-space-2xs">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-metric-display text-metric-display text-status-warning">3 Titik</span>
                    <span className="font-label-caps text-label-caps text-text-secondary">Outlier Deviasi</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Pasar Genteng, Soponyono &amp; Pucang Anom
                  </p>
                </div>
                <div className="flex items-center gap-1 text-text-secondary font-label-caps text-label-caps">
                  <span className="material-symbols-outlined text-body-sm text-status-warning">speed</span>
                  Confidence Score AI: 94.8%
                </div>
              </div>

              {/* KPI 4 */}
              <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                    Cadangan Pangan Pemkot
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-status-normal-bg text-status-normal flex items-center justify-center">
                    <span className="material-symbols-outlined text-body-lg">warehouse</span>
                  </span>
                </div>
                <div className="flex flex-col gap-space-2xs">
                  <div className="flex flex-col">
                    <div className="flex items-baseline justify-between">
                      <span className="font-metric-value text-metric-value text-on-surface">1.450 Ton</span>
                      <span className="font-label-caps text-label-caps text-status-normal font-semibold">
                        Beras Aman
                      </span>
                    </div>
                    <div className="w-full bg-surface-subtle h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-status-normal h-full rounded-full" style={{ width: "82%" }}></div>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="font-metric-value text-metric-value text-on-surface">22 Ton</span>
                    <span className="font-label-caps text-label-caps text-status-normal font-semibold">
                      Minyak Goreng
                    </span>
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-text-muted">
                  Stok Bulog Divre Jatim &amp; BUMD
                </span>
              </div>
            </div>

            {/* Main Section: Commodity Risk Matrix (6 Markets x Commodities) */}
            <div className="flex flex-col gap-space-md">
              {/* Section Header & Filter Controls */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                      Matriks Disparitas &amp; Risiko Komoditas
                    </h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Pemetaan komprehensif 6 pasar induk &amp; strategis Surabaya. Diperbarui otomatis dari survei harian lapangan &amp; sistem kasir digital.
                  </p>
                </div>
                {/* Risk Legend / Status Guide */}
                <div className="flex flex-wrap items-center gap-space-xs bg-surface-card px-space-sm py-space-xs rounded-xl shadow-sm">
                  <span className="font-label-caps text-label-caps text-text-muted mr-1">STATUS:</span>
                  <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-normal"></span> Normal (&lt;2%)
                  </span>
                  <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-label-caps">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning"></span> Waspada (2%-8%)
                  </span>
                  <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-pulse"></span> Surge (&gt;8%)
                  </span>
                </div>
              </div>

              {/* Interactive Matrix Table */}
              <div className="bg-surface-card rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-subtle text-text-secondary font-label-caps text-label-caps uppercase tracking-wider">
                        <th className="py-space-sm px-space-md min-w-[200px]">Komoditas Pantau</th>
                        <th className="py-space-sm px-space-sm text-center">Pasar Wonokromo</th>
                        <th className="py-space-sm px-space-sm text-center">Pasar Keputran</th>
                        <th className="py-space-sm px-space-sm text-center">Pasar Pucang Anom</th>
                        <th className="py-space-sm px-space-sm text-center">Pasar Genteng</th>
                        <th className="py-space-sm px-space-sm text-center">Pasar Tambahrejo</th>
                        <th className="py-space-sm px-space-sm text-center">Pasar Soponyono</th>
                        <th className="py-space-sm px-space-md text-right min-w-[190px]">
                          Tindakan Stabilisasi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-subtle font-body-sm text-body-sm text-on-surface">
                      {/* Row 1: Cabai Rawit Merah (CRITICAL) */}
                      <tr className="bg-status-critical-bg/30 hover:bg-status-critical-bg/50 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-xs">
                            <div className="w-9 h-9 rounded-lg bg-status-critical/10 text-status-critical flex items-center justify-center font-bold shrink-0">
                              CR
                            </div>
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                                Cabai Rawit Merah
                              </span>
                              <span className="font-label-caps text-label-caps text-text-muted">
                                HAP Bapanas: Rp 57.000 / kg
                              </span>
                            </div>
                          </div>
                        </td>
                        {/* Wonokromo */}
                        <td className="py-space-md px-space-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-warning">
                              Rp 71.000
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-[10px]">
                              WASPADA (+5.2%)
                            </span>
                          </div>
                        </td>
                        {/* Keputran */}
                        <td className="py-space-md px-space-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-on-surface font-semibold">
                              Rp 65.000
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface-subtle text-text-secondary font-label-caps text-[10px]">
                              MODERAT (+3.0%)
                            </span>
                          </div>
                        </td>
                        {/* Pucang Anom */}
                        <td className="py-space-md px-space-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-warning">
                              Rp 72.500
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-[10px]">
                              WASPADA (+6.1%)
                            </span>
                          </div>
                        </td>
                        {/* Genteng (SURGE) */}
                        <td className="py-space-md px-space-sm text-center bg-status-critical-bg/60">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-critical font-bold">
                              Rp 78.000
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-critical text-on-primary font-label-caps text-[10px] animate-pulse">
                              SURGE (+12.5%)
                            </span>
                          </div>
                        </td>
                        {/* Tambahrejo */}
                        <td className="py-space-md px-space-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-warning">
                              Rp 71.800
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-[10px]">
                              WASPADA (+4.8%)
                            </span>
                          </div>
                        </td>
                        {/* Soponyono (SURGE) */}
                        <td className="py-space-md px-space-sm text-center bg-status-critical-bg/60">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-critical font-bold">
                              Rp 76.500
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-critical text-on-primary font-label-caps text-[10px] animate-pulse">
                              SURGE (+10.1%)
                            </span>
                          </div>
                        </td>
                        {/* Action Button */}
                        <td className="py-space-md px-space-md text-right">
                          <button
                            className="inline-flex items-center gap-1 px-space-sm py-space-xs rounded-lg bg-status-critical text-on-primary font-headline-sm text-body-sm shadow hover:opacity-90 transition-opacity cursor-pointer"
                            onClick={() =>
                              openOperasiModal(
                                "Cabai Rawit Merah",
                                "Genteng & Soponyono"
                              )
                            }
                          >
                            <span className="material-symbols-outlined text-body-md">campaign</span>
                            <span>Picu Operasi Pasar</span>
                          </button>
                        </td>
                      </tr>

                      {/* Row 2: Bawang Merah (WARNING) */}
                      <tr className="bg-status-warning-bg/20 hover:bg-status-warning-bg/40 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-xs">
                            <div className="w-9 h-9 rounded-lg bg-status-warning/10 text-status-warning flex items-center justify-center font-bold shrink-0">
                              BM
                            </div>
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                                Bawang Merah Allium
                              </span>
                              <span className="font-label-caps text-label-caps text-text-muted">
                                HAP Bapanas: Rp 36.500 / kg
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-warning">
                              Rp 41.500
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-[10px]">
                              WASPADA (+6.2%)
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-normal">
                              Rp 37.000
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-[10px]">
                              NORMAL (+1.2%)
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-warning">
                              Rp 42.000
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-[10px]">
                              WASPADA (+7.1%)
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-on-surface">
                              Rp 39.500
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface-subtle text-text-secondary font-label-caps text-[10px]">
                              MODERAT (+3.5%)
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-normal">
                              Rp 38.000
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-[10px]">
                              NORMAL (+1.8%)
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-warning">
                              Rp 40.500
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-[10px]">
                              WASPADA (+4.5%)
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <button
                            className="inline-flex items-center gap-1 px-space-sm py-space-xs rounded-lg bg-status-warning text-on-primary font-headline-sm text-body-sm shadow hover:opacity-90 transition-opacity cursor-pointer"
                            onClick={() =>
                              openOperasiModal(
                                "Bawang Merah",
                                "Wonokromo & Pucang Anom"
                              )
                            }
                          >
                            <span className="material-symbols-outlined text-body-md">local_shipping</span>
                            <span>Intervensi Pasokan</span>
                          </button>
                        </td>
                      </tr>

                      {/* Row 3: Beras Medium SPPHP (NORMAL) */}
                      <tr className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-xs">
                            <div className="w-9 h-9 rounded-lg bg-status-normal-bg text-status-normal flex items-center justify-center font-bold shrink-0">
                              BM
                            </div>
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                                Beras Medium SPPHP
                              </span>
                              <span className="font-label-caps text-label-caps text-text-muted">
                                HET Bulog: Rp 12.500 / kg
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 12.500</span>
                          <span className="block text-[10px] text-text-muted font-label-caps">STABIL</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 12.400</span>
                          <span className="block text-[10px] text-text-muted font-label-caps">STABIL</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 12.500</span>
                          <span className="block text-[10px] text-text-muted font-label-caps">STABIL</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 12.500</span>
                          <span className="block text-[10px] text-text-muted font-label-caps">STABIL</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 12.500</span>
                          <span className="block text-[10px] text-text-muted font-label-caps">STABIL</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 12.500</span>
                          <span className="block text-[10px] text-text-muted font-label-caps">STABIL</span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <span className="inline-flex items-center gap-1 px-space-xs py-1 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps font-semibold">
                            <span className="material-symbols-outlined text-body-sm">verified</span>
                            Terkendali Optimal
                          </span>
                        </td>
                      </tr>

                      {/* Row 4: Telur Ayam Ras (WASPADA GENTENG) */}
                      <tr className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-xs">
                            <div className="w-9 h-9 rounded-lg bg-surface-subtle text-text-secondary flex items-center justify-center font-bold shrink-0">
                              TA
                            </div>
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                                Telur Ayam Ras
                              </span>
                              <span className="font-label-caps text-label-caps text-text-muted">
                                HAP Bapanas: Rp 28.500 / kg
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 29.000</span>
                          <span className="block text-[10px] text-status-normal font-label-caps">+1.0%</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 28.200</span>
                          <span className="block text-[10px] text-status-normal font-label-caps">-0.4%</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 29.500</span>
                          <span className="block text-[10px] text-status-warning font-label-caps">+2.2%</span>
                        </td>
                        {/* Genteng Waspada */}
                        <td className="py-space-md px-space-sm text-center bg-status-warning-bg/30">
                          <div className="flex flex-col items-center">
                            <span className="font-metric-value text-metric-value text-status-warning font-bold">
                              Rp 31.000
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-[10px]">
                              WASPADA (+5.8%)
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 29.200</span>
                          <span className="block text-[10px] text-status-normal font-label-caps">+1.1%</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 29.800</span>
                          <span className="block text-[10px] text-status-warning font-label-caps">+2.9%</span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <button
                            className="inline-flex items-center gap-1 px-space-xs py-1 rounded-lg bg-surface-subtle hover:bg-border-subtle text-on-surface font-body-sm text-body-sm transition-colors cursor-pointer"
                            onClick={() =>
                              openOperasiModal(
                                "Telur Ayam Ras",
                                "Pasar Genteng"
                              )
                            }
                          >
                            <span className="material-symbols-outlined text-body-sm">tune</span>
                            Monitoring Ketat
                          </button>
                        </td>
                      </tr>

                      {/* Row 5: Minyakita (NORMAL) */}
                      <tr className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-xs">
                            <div className="w-9 h-9 rounded-lg bg-status-normal-bg text-status-normal flex items-center justify-center font-bold shrink-0">
                              MK
                            </div>
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                                Minyakita Kemasan 1L
                              </span>
                              <span className="font-label-caps text-label-caps text-text-muted">
                                HET Kemendag: Rp 15.700 / liter
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 15.700</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 15.500</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 15.700</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 15.800</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 15.700</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-status-normal">Rp 15.700</span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <span className="inline-flex items-center gap-1 px-space-xs py-1 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
                            Normal Pasokan
                          </span>
                        </td>
                      </tr>

                      {/* Row 6: Daging Ayam Ras (NORMAL) */}
                      <tr className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-xs">
                            <div className="w-9 h-9 rounded-lg bg-surface-subtle text-text-secondary flex items-center justify-center font-bold shrink-0">
                              DA
                            </div>
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                                Daging Ayam Broiler
                              </span>
                              <span className="font-label-caps text-label-caps text-text-muted">
                                HAP Bapanas: Rp 36.750 / kg
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 35.800</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 34.500</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 36.000</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 36.500</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 35.500</span>
                        </td>
                        <td className="py-space-md px-space-sm text-center">
                          <span className="font-metric-value text-metric-value text-on-surface">Rp 36.000</span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <span className="inline-flex items-center gap-1 px-space-xs py-1 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
                            Stok Stabil
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-space-md py-space-sm bg-surface-subtle/40 flex flex-col sm:flex-row items-center justify-between gap-space-xs text-text-muted font-label-caps text-label-caps">
                  <span>Formula: Z-Score Outlier &gt; 2.0 Sigma • Ambang batas surge Pemkot Surabaya: 8.00%</span>
                  <div className="flex items-center gap-space-sm">
                    <button
                      className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                      onClick={() => alert("Mengunduh Early Warning Matrix...")}
                    >
                      <span className="material-symbols-outlined text-body-md">download</span> Ekspor Matrix (.XLSX)
                    </button>
                    <span>•</span>
                    <button
                      className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                      onClick={() => showToast("Sinkronisasi data lapangan SP2KP berhasil diperbarui.")}
                    >
                      <span className="material-symbols-outlined text-body-md">refresh</span> Sinkron Ulang
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Asymmetric Dual Split: Incident Feed (Left) & Multi-Factor Intelligence (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              {/* Left Column (7 cols): Anomaly Detection & Incident Audit Log */}
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-headline-sm">
                      notification_important
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      Log Deteksi Anomali &amp; Price Surge Alert Feed
                    </h3>
                  </div>
                  <span className="font-label-caps text-label-caps bg-surface-card px-space-xs py-0.5 rounded-full shadow-sm text-text-secondary">
                    Auto-Generated Satgas AI
                  </span>
                </div>
                <div className="flex flex-col gap-space-sm">
                  {/* Alert Item 1: CRITICAL GENTENG */}
                  <div className="bg-surface-card rounded-xl p-space-md shadow-sm border-l-4 border-status-critical flex flex-col gap-space-xs relative overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-space-2xs">
                      <div className="flex items-center gap-space-xs">
                        <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps font-bold">
                          <span className="material-symbols-outlined text-body-sm">bolt</span>
                          08:30 WIB • CRITICAL
                        </span>
                        <span className="font-headline-sm text-body-md text-on-surface font-semibold">
                          Pasar Genteng: Lonjakan Ekstrem Cabai Rawit
                        </span>
                      </div>
                      <span className="font-label-caps text-label-caps text-text-muted">ID: EVT-9921</span>
                    </div>
                    <p className="font-body-md text-body-md text-text-secondary">
                      Cabai Rawit Merah melompat tajam ke{" "}
                      <span className="font-metric-value text-metric-value text-status-critical font-bold">
                        Rp 78.000/kg
                      </span>{" "}
                      (<span className="text-status-critical font-semibold">+12.5% dalam 48 jam</span>). Anomali terkonfirmasi deviasi statistik{" "}
                      <span className="font-metric-delta text-metric-delta bg-status-critical-bg px-1 rounded text-status-critical">
                        +2.4 sigma
                      </span>{" "}
                      dari rata-rata pergerakan 30 hari kota.
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-space-xs pt-space-xs bg-surface-subtle/50 p-space-xs rounded-lg">
                      <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-text-secondary">
                        <span className="material-symbols-outlined text-body-md text-status-critical">
                          report
                        </span>
                        <span>Rekomendasi: Dropping 2.5 Ton Cabai dari Gapoktan Blitar.</span>
                      </div>
                      <button
                        className="px-space-xs py-1 rounded bg-status-critical text-on-primary font-label-caps text-label-caps hover:bg-opacity-90 transition-opacity cursor-pointer"
                        onClick={() =>
                          openOperasiModal(
                            "Cabai Rawit",
                            "Pasar Genteng"
                          )
                        }
                      >
                        Eksekusi Tindakan
                      </button>
                    </div>
                  </div>

                  {/* Alert Item 2: WARNING SOPONYONO */}
                  <div className="bg-surface-card rounded-xl p-space-md shadow-sm border-l-4 border-status-warning flex flex-col gap-space-xs">
                    <div className="flex flex-wrap items-center justify-between gap-space-2xs">
                      <div className="flex items-center gap-space-xs">
                        <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-label-caps font-bold">
                          <span className="material-symbols-outlined text-body-sm">schedule</span>
                          07:15 WIB • WARNING
                        </span>
                        <span className="font-headline-sm text-body-md text-on-surface font-semibold">
                          Pasar Soponyono: Pelanggaran Disparitas Telur Ras
                        </span>
                      </div>
                      <span className="font-label-caps text-label-caps text-text-muted">ID: EVT-9918</span>
                    </div>
                    <p className="font-body-md text-body-md text-text-secondary">
                      Disparitas komoditas Telur Ayam Ras melebihi batas toleransi Pemkot Surabaya (+Rp 2.500 di atas HAP Badan Pangan Nasional). Penjual ritel mengindikasikan kelangkaan pasokan petelur mandiri asal Kabupaten Blitar.
                    </p>
                    <div className="flex items-center gap-space-xs text-text-muted font-label-caps text-label-caps pt-1">
                      <span className="material-symbols-outlined text-body-md text-status-warning">
                        info
                      </span>
                      <span>Disposisi otomatis diteruskan ke Kabid Distribusi Dinas Ketahanan Pangan</span>
                    </div>
                  </div>

                  {/* Alert Item 3: RESOLVED WONOKROMO */}
                  <div className="bg-surface-card rounded-xl p-space-md shadow-sm border-l-4 border-status-normal flex flex-col gap-space-xs opacity-90">
                    <div className="flex flex-wrap items-center justify-between gap-space-2xs">
                      <div className="flex items-center gap-space-xs">
                        <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps font-bold">
                          <span className="material-symbols-outlined text-body-sm">check_circle</span>
                          Kemarin 16:40 • RESOLVED
                        </span>
                        <span className="font-headline-sm text-body-md text-on-surface font-semibold">
                          Pasar Wonokromo: Stabilisasi Minyak Curah Berhasil
                        </span>
                      </div>
                      <span className="font-label-caps text-label-caps text-text-muted">ID: EVT-9870</span>
                    </div>
                    <p className="font-body-md text-body-md text-text-secondary">
                      Pasokan Minyak Goreng Curah stabil pasca distribusi 4.200 liter oleh BUMD Pasar Surya. Rerata harga terkoreksi kembali ke harga acuan Rp 15.700/liter di seluruh pedagang semi-grosir Wonokromo.
                    </p>
                    <div className="flex items-center justify-between text-text-muted font-label-caps text-label-caps pt-1">
                      <span>Status: Kasus Selesai &amp; Ditutup</span>
                      <span className="text-status-normal font-semibold">Efektivitas Intervensi: 100%</span>
                    </div>
                  </div>
                </div>

                {/* Field Photo Feed for Verification */}
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-title-md text-title-md text-on-surface">
                      Dokumentasi Petugas Enumerator Pasar
                    </span>
                    <span className="font-label-caps text-label-caps text-text-muted">
                      Terverifikasi Geotagging GPS
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <div className="relative rounded-lg overflow-hidden bg-surface-subtle group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Pasar Genteng Inspection"
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXymg_UvoBjHVfuBVrYtuBi1zA15h49hIMdSwbnf9yGBfQrzbH_xLy7A5kDGLqxfKvPLtO57Nzvg_GiDrjn6YOiFNydyfBpHPSS0LXhgE_I0Ktwoq-mplId2Rr-WItBYMUpClfkxoIlxP5ctK9HyAbbK6YzmmxWy_gd16vc151UVOXXQ2wd5VpXmxhRI6Sjlp40QrVHc9ElM-h2gmosONcYEeCKZtlrPfQUH4s-KiLb_WUSTtjpmgj"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2 left-2 right-2 text-on-primary flex justify-between items-end">
                        <div>
                          <span className="font-label-caps text-label-caps block">Pasar Genteng • Lapak 14B</span>
                          <span className="font-body-sm text-body-sm font-semibold">Pengecekan Timbangan Cabai</span>
                        </div>
                        <span className="font-label-caps text-label-caps bg-surface-card/20 backdrop-blur-md px-1.5 py-0.5 rounded">
                          08:15 WIB
                        </span>
                      </div>
                    </div>
                    <div className="relative rounded-lg overflow-hidden bg-surface-subtle group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Bulog Inspection"
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN3fLQ3GWHc1o00zrqNYTxvcpKOZppEyfSvkVcosuP7_4kfjjYtEEfN5gk88s2hGaxCnr8sKFZQNZzGGLS00AcyAIQ9RijqEuy7k34Q6jJcaX11jA6UqtkV8WETKz1xLgrQUe_opin9l0dyJuIKmFMjl1VK5aX2YGrjdTR1MlXEDDmcKBh4KfYlQHKXnL6mbT5JWL0hJYV_1eWIcAoxz8tj5wvhgG_UBHtQBoLUmhtLWfTDJJz1b8g"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2 left-2 right-2 text-on-primary flex justify-between items-end">
                        <div>
                          <span className="font-label-caps text-label-caps block">Gudang Bulog • Buduran</span>
                          <span className="font-body-sm text-body-sm font-semibold">Audit Kesiapan Beras SPHP</span>
                        </div>
                        <span className="font-label-caps text-label-caps bg-surface-card/20 backdrop-blur-md px-1.5 py-0.5 rounded">
                          06:50 WIB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Multi-Factor Analysis & Policy Engine */}
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-headline-sm">hub</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    Analisis Variabel Eksternal (Multi-Factor)
                  </h3>
                </div>
                {/* Factor 1: Weather & Climate Risk */}
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs text-text-secondary">
                      <span className="material-symbols-outlined text-body-lg text-primary">rainy</span>
                      <span className="font-headline-sm text-body-md font-semibold text-on-surface">
                        Korelasi Cuaca &amp; Logistik BMKG
                      </span>
                    </div>
                    <span className="px-space-xs py-0.5 rounded-full bg-status-critical-bg text-status-critical font-label-caps text-label-caps font-bold">
                      RISIKO TINGGI
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-text-secondary">
                    <strong className="text-on-surface">Curah Hujan Ekstrem di Sentra Produksi Kediri &amp; Blitar (Curah 180mm/hari):</strong> Menyebabkan keterlambatan panen dan jalur logistik jalan tol/arteri terhambat. Pasokan truk cabai ke Pasar Induk Keputran turun <strong className="text-status-critical">-34%</strong> dibandingkan rata-rata normal harian.
                  </p>
                  <div className="flex items-center gap-space-sm pt-space-xs">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-text-muted">Kediri Rainfall</span>
                      <span className="font-metric-value text-metric-value text-on-surface">180 mm</span>
                    </div>
                    <div className="w-px h-8 bg-surface-subtle"></div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-text-muted">Penurunan Truk</span>
                      <span className="font-metric-value text-metric-value text-status-critical">-34%</span>
                    </div>
                    <div className="w-px h-8 bg-surface-subtle"></div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-text-muted">Waktu Tiba</span>
                      <span className="font-metric-value text-metric-value text-status-warning">+4.5 Jam</span>
                    </div>
                  </div>
                </div>

                {/* Factor 2: Seasonal Calendar & Ramadan Surge */}
                <div className="bg-surface-card rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs text-text-secondary">
                      <span className="material-symbols-outlined text-body-lg text-primary">event_upcoming</span>
                      <span className="font-headline-sm text-body-md font-semibold text-on-surface">
                        Kalender Musiman &amp; Siklus HBKN
                      </span>
                    </div>
                    <span className="px-space-xs py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label-caps text-label-caps font-bold">
                      FAKTOR PENGALI
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-text-secondary">
                    <strong className="text-on-surface">D-28 Menjelang Ramadan 1446 H:</strong> Indeks permintaan konsumsi rumah tangga dan UMKM kuliner Surabaya meningkat <strong className="text-status-warning">+14%</strong>. Akumulasi belanja stok (pre-emptive purchasing) mulai terjadi di pasar semi-grosir.
                  </p>
                  <div className="w-full bg-surface-subtle rounded-lg p-space-xs flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-body-md text-text-secondary">calendar_month</span>
                      <span className="font-body-sm text-body-sm text-text-secondary">Fase Puncak Permintaan:</span>
                    </div>
                    <span className="font-label-caps text-label-caps text-on-surface font-bold">12 Hari Lagi</span>
                  </div>
                </div>

                {/* Automated AI Policy Recommendation Card */}
                <div className="bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl p-space-md shadow-md flex flex-col gap-space-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-headline-sm text-primary-fixed">psychology</span>
                      <span className="font-headline-sm text-headline-sm text-primary-fixed">
                        Rekomendasi Intervensi Kebijakan
                      </span>
                    </div>
                    <span className="font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-on-primary/10 text-on-primary">
                      Mesin Preskriptif Satgas
                    </span>
                  </div>
                  <div className="flex flex-col gap-space-xs font-body-sm text-body-sm leading-relaxed">
                    <div className="flex items-start gap-space-xs">
                      <span className="material-symbols-outlined text-body-md text-primary-fixed shrink-0">check_circle</span>
                      <p>
                        <strong className="text-on-primary font-semibold">Tindakan 1:</strong> Terbitkan Surat Perintah Mobilisasi Pasokan BUMD Surya Kencana untuk 5 Ton Cabai Rawit ke Pasar Genteng &amp; Soponyono dalam 24 jam.
                      </p>
                    </div>
                    <div className="flex items-start gap-space-xs">
                      <span className="material-symbols-outlined text-body-md text-primary-fixed shrink-0">check_circle</span>
                      <p>
                        <strong className="text-on-primary font-semibold">Tindakan 2:</strong> Aktifkan Operasi Pasar Mandiri Bersubsidi Ongkos Angkut (BTT APBD Surabaya) untuk mengunci harga eceran di batas Rp 62.000/kg.
                      </p>
                    </div>
                    <div className="flex items-start gap-space-xs">
                      <span className="material-symbols-outlined text-body-md text-primary-fixed shrink-0">check_circle</span>
                      <p>
                        <strong className="text-on-primary font-semibold">Tindakan 3:</strong> Koordinasi dengan Polda Jatim / Satgas Pangan untuk inspeksi dugaan penimbunan di gudang distributor perbatasan Kalianak.
                      </p>
                    </div>
                  </div>
                  <div className="pt-space-xs flex gap-space-xs">
                    <button
                      className="flex-1 py-space-xs px-space-sm rounded-lg bg-surface-card text-primary font-headline-sm text-body-sm font-semibold shadow hover:bg-surface-canvas transition-colors text-center cursor-pointer"
                      id="approve-recommendations"
                      onClick={() =>
                        showToast("Disposisi Kepala Dinas disahkan: 3 Tindakan Kebijakan diterbitkan.")
                      }
                    >
                      Setujui Rekomendasi (Disposisi Kadis)
                    </button>
                    <button
                      className="px-space-sm py-space-xs rounded-lg bg-on-primary/10 hover:bg-on-primary/20 text-on-primary font-body-sm text-body-sm transition-colors cursor-pointer"
                      onClick={() => alert("Form pengubahan parameter kebijakan dibuka.")}
                    >
                      Ubah Parameter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Modal: Trigger Operasi Pasar Murah */}
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-space-md ${
            modalOpen ? "" : "hidden"
          }`}
          id="operasi-modal"
        >
          <div className="bg-surface-card w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-primary text-on-primary px-space-md py-space-sm flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-headline-sm">campaign</span>
                  <h4 className="font-headline-sm text-headline-sm">Pemicu Operasi Pasar Murah Cepat</h4>
                </div>
                <button
                  className="text-on-primary/80 hover:text-on-primary cursor-pointer"
                  onClick={closeOperasiModal}
                >
                  <span className="material-symbols-outlined text-headline-sm">close</span>
                </button>
              </div>
              <div className="p-space-md flex flex-col gap-space-md">
                <div className="bg-status-warning-bg p-space-sm rounded-lg text-on-surface font-body-sm text-body-sm flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-status-warning text-headline-sm shrink-0">
                    warning
                  </span>
                  <div>
                    <span className="font-semibold text-on-surface block">Peringatan Stabilisasi Segera</span>
                    Tindakan ini akan mengesahkan distribusi armada mobil pasar murah Pemkot Surabaya dan memotong alur pasokan ritel bermasalah.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm font-body-sm text-body-sm">
                  <div className="bg-surface-subtle p-space-xs rounded">
                    <span className="text-text-muted font-label-caps text-label-caps block">Komoditas Sasaran</span>
                    <span className="font-headline-sm text-body-md text-on-surface font-bold" id="modal-commodity">
                      {modalCommodity}
                    </span>
                  </div>
                  <div className="bg-surface-subtle p-space-xs rounded">
                    <span className="text-text-muted font-label-caps text-label-caps block">Pasar Prioritas</span>
                    <span className="font-headline-sm text-body-md text-on-surface font-bold" id="modal-target">
                      {modalTarget}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-2xs">
                  <label className="font-label-caps text-label-caps text-text-secondary uppercase">
                    Alokasi Volume Intervensi
                  </label>
                  <div className="grid grid-cols-3 gap-space-xs">
                    <label className="flex items-center gap-1.5 p-space-xs bg-surface-subtle rounded-lg cursor-pointer hover:bg-surface-variant/30 text-body-sm">
                      <input defaultChecked className="text-primary focus:ring-0" name="volume" type="radio" />
                      <span>1.500 Kg</span>
                    </label>
                    <label className="flex items-center gap-1.5 p-space-xs bg-surface-subtle rounded-lg cursor-pointer hover:bg-surface-variant/30 text-body-sm">
                      <input className="text-primary focus:ring-0" name="volume" type="radio" />
                      <span>3.000 Kg</span>
                    </label>
                    <label className="flex items-center gap-1.5 p-space-xs bg-surface-subtle rounded-lg cursor-pointer hover:bg-surface-variant/30 text-body-sm">
                      <input className="text-primary focus:ring-0" name="volume" type="radio" />
                      <span>5.000 Kg</span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-space-2xs">
                  <label className="font-label-caps text-label-caps text-text-secondary uppercase">
                    Harga Jual Subsidi Operasi (Rp/Kg)
                  </label>
                  <input
                    className="w-full bg-surface-subtle text-on-surface px-space-sm py-2 rounded-lg font-metric-value text-metric-value focus:outline-none"
                    defaultValue="Rp 58.000 / kg (HAP Acuan)"
                    type="text"
                  />
                </div>
                <div className="flex items-center justify-end gap-space-xs pt-space-xs">
                  <button
                    className="px-space-md py-space-xs rounded-lg text-text-secondary hover:bg-surface-subtle font-body-md text-body-md cursor-pointer"
                    onClick={closeOperasiModal}
                  >
                    Batal
                  </button>
                  <button
                    className="px-space-md py-space-xs rounded-lg bg-status-critical text-on-primary font-headline-sm text-body-md shadow hover:bg-opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
                    onClick={confirmDispatch}
                  >
                    <span className="material-symbols-outlined text-body-md">send</span>
                    Kirim Perintah Operasi Sekarang
                  </button>
                </div>
              </div>
          </div>
        </div>

        {/* Notification Toast for Dispatch */}
        {toastMessage && (
          <div
            className="fixed bottom-6 right-6 z-50 bg-surface-card text-on-surface p-space-md rounded-xl shadow-xl flex items-center gap-space-sm pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-300"
            id="dispatch-toast"
          >
            <div className="w-10 h-10 rounded-full bg-status-normal-bg text-status-normal flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-headline-sm">check</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-body-md font-bold">Instruksi Intervensi Terkirim</span>
              <span className="font-body-sm text-body-sm text-text-secondary" id="toast-message">
                {toastMessage}
              </span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
