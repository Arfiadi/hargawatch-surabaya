"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
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
          <Link href="/" className="flex items-center gap-space-sm group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="HargaWatch Logo"
              width={40}
              height={40}
              style={{ width: "40px", height: "40px", minWidth: "40px" }}
              className="h-10 w-10 rounded-xl object-contain shadow-sm border border-primary/10 bg-white p-0.5 transition-transform group-hover:scale-105"
              src="/logo.png"
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
