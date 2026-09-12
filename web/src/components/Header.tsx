"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [selectedMarket, setSelectedMarket] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard Publik", href: "/" },
    { label: "Peta & Disparitas Pasar", href: "/peta" },
    { label: "Early Warning & Risiko", href: "/early-warning" },
    { label: "Forecasting & Tren", href: "/forecasting" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-card/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 w-full px-space-md lg:px-gutter-desktop flex items-center justify-between gap-space-md">
        {/* Logo & Subtitle */}
        <div className="flex items-center gap-space-md min-w-max">
          <Link href="/" className="flex items-center gap-space-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="HargaWatch Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WiZ8V1jVXZ1sU1_kf8Rny3lqf6Mezyyzf1ac0WfhnMnfLFShPPO7SDTRhwUVFtq3i37SKWPp4Tzy4I5PaEovQGtiVITOm1K9s7gv9ycCUwbVWmXXcSMrxBTLK7AKh2rU4Qhgmd-ElW41fMDDLA1Zy-hAd6BPDSYqI9a5y1t9EU3e7RkEdfjQWMFrp0NuNAVvXuwUcgfdRLRr4wky2XPBm3Zbvao6IkweWr0HSIR05qEzUkq2Vg-WfLAyA"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight leading-none">
                HargaWatch
              </span>
              <span className="font-label-caps text-label-caps text-text-secondary uppercase">
                Surabaya Food Intel
              </span>
            </div>
          </Link>

          <div className="hidden 2xl:flex items-center gap-space-xs pl-space-xs">
            <span className="inline-flex items-center px-space-xs py-space-2xs rounded-full bg-surface-subtle text-text-secondary font-label-caps text-label-caps">
              Pemantauan Resmi Pemkot
            </span>
            <span className="inline-flex items-center gap-1.5 px-space-xs py-space-2xs rounded-full bg-status-normal-bg text-status-normal font-label-caps text-label-caps">
              <span className="w-1.5 h-1.5 rounded-full bg-status-normal animate-pulse"></span>
              API: Update 10m Lalu
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-space-2xs">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-space-sm py-space-xs transition-colors rounded-lg ${
                  isActive
                    ? "bg-primary-container text-on-primary font-headline-sm"
                    : "font-body-md text-body-md text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-space-xs sm:gap-space-sm">
          <div className="hidden md:flex items-center bg-surface-subtle rounded-lg px-space-xs py-space-2xs">
            <span className="material-symbols-outlined text-text-muted text-body-lg mr-1.5">
              calendar_today
            </span>
            <span className="font-label-caps text-label-caps text-text-secondary">
              Hari Ini
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="appearance-none bg-surface-card text-on-surface font-body-sm text-body-sm pl-space-xs pr-7 py-space-2xs rounded-lg shadow-none focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Pasar (6)</option>
              <option value="wonokromo">Pasar Wonokromo</option>
              <option value="keputran">Pasar Keputran</option>
              <option value="pucanganom">Pasar Pucang Anom</option>
              <option value="genteng">Pasar Genteng</option>
              <option value="tambahrejo">Pasar Tambahrejo</option>
              <option value="soponyono">Pasar Soponyono</option>
            </select>
            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-body-md">
              expand_more
            </span>
          </div>

          <div className="flex items-center gap-space-xs pl-space-2xs">
            <div className="hidden lg:flex flex-col text-right">
              <span className="font-body-sm text-body-sm font-headline-sm text-on-surface leading-tight">
                Dinas Perdagangan
              </span>
              <span className="font-label-caps text-label-caps text-text-muted">
                Analis Ahli
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF0YukeXinIsrbLWvfBwaqY0-N7hCxTJZv7F1JDLRE4suzyIH3ZoQ5T-eHtDKDO9s5GSxq_kcukIeQrcK-5lGrXHGnnSnbl3CrkMWvWAxUKuLIwi2r0RCd98ImDFjzAGEpWhd2WHoEIek4EYUQcWY9JLC65oEzqYmobfsv4s65bWBtuaUtu2cV5oxLnML7xTZIsgFz3JJn0hIINKtw9uc5BS2RJBD-pkgiZReedC6sAhOKAF5HsA0L"
            />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-text-secondary hover:text-text-primary"
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined text-body-lg">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-surface-card border-b border-border-subtle px-space-md py-space-sm flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                pathname === item.href
                  ? "bg-primary-container text-on-primary"
                  : "text-text-secondary hover:bg-surface-subtle"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
