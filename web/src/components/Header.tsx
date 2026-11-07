"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard Publik", href: "/dashboard" },
    { label: "Peta & Disparitas Pasar", href: "/peta" },
    { label: "Early Warning & Risiko", href: "/early-warning" },
    { label: "Forecasting & Tren", href: "/forecasting" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-card/95 backdrop-blur-md shadow-[0_1px_6px_rgba(0,0,0,0.04)] border-b border-border-subtle/40">
      <div className="h-16 w-full px-space-md lg:px-gutter-desktop flex items-center gap-space-md">
        {/* Logo & Subtitle */}
        <div className="flex items-center gap-space-md min-w-max">
          {/* Brand → beranda platform (landing); Dashboard Publik tetap di menu */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="HargaWatch Logo"
              width={36}
              height={36}
              style={{ width: "36px", height: "36px", minWidth: "36px" }}
              className="h-9 w-9 rounded-lg object-contain shadow-xs border border-primary/10 bg-white p-0.5 transition-transform group-hover:scale-105"
              src="/logo.svg"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-[17px] text-primary tracking-tight leading-none font-bold">
                HargaWatch
              </span>
              <span className="font-label-caps text-[10px] text-text-secondary uppercase tracking-wider mt-0.5">
                Surabaya Food Intel
              </span>
            </div>
          </Link>
        </div>

        {/* Right side: Navigation + Actions */}
        <div className="ml-auto flex items-center gap-space-md">
        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-[color,background-color,transform,box-shadow] duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] ${
                                  isActive
                                    ? "bg-primary-container text-on-primary font-semibold shadow-xs"
                                    : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium"
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
            className="xl:hidden p-2 text-text-secondary transition-colors duration-200 hover:text-text-primary"
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined text-body-lg">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        aria-hidden={!mobileMenuOpen}
        className={`xl:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-out ${mobileMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}
      >
        <nav className="min-h-0 overflow-hidden bg-surface-card border-b border-border-subtle px-space-md flex flex-col gap-2">
          <div className="py-space-sm flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={mobileMenuOpen ? 0 : -1}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-[color,background-color,transform] duration-200 hover:translate-x-0.5 active:scale-[0.99] ${
                  pathname === item.href
                    ? "bg-primary-container text-on-primary"
                    : "text-text-secondary hover:bg-surface-subtle"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
