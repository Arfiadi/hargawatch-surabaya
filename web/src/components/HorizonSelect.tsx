"use client";

import { useEffect, useRef, useState } from "react";

export interface HorizonOptionConfig {
  value: 7 | 14;
  label: string;
  sublabel: string;
  days: number;
}

export const HORIZON_OPTIONS: HorizonOptionConfig[] = [
  {
    value: 7,
    label: "Proyeksi: 7 Hari",
    sublabel: "H+1 s/d H+7 (Jangka Pendek)",
    days: 7,
  },
  {
    value: 14,
    label: "Proyeksi: 14 Hari",
    sublabel: "H+1 s/d H+14 (Jangka Penuh)",
    days: 14,
  },
];

interface HorizonSelectProps {
  value: 7 | 14;
  onChange: (value: 7 | 14) => void;
  className?: string;
  panelClassName?: string;
}

/**
 * Dropdown kustom horizon proyeksi (7 Hari / 14 Hari).
 * Selaras dengan TimeframeSelect dan Design System HargaWatch.
 */
export default function HorizonSelect({
  value,
  onChange,
  className = "",
  panelClassName = "w-60 right-0 left-auto",
}: HorizonSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectedItem =
    HORIZON_OPTIONS.find((opt) => opt.value === value) || HORIZON_OPTIONS[1];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="h-11 px-3 flex items-center justify-between gap-2.5 bg-white hover:bg-surface-subtle text-text-primary text-xs font-semibold rounded-xl border border-border-subtle hover:border-amber-500/40 shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20 select-none"
        title="Pilih horizon proyeksi ke depan"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[15px]">
              trending_up
            </span>
          </div>
          <span className="font-bold text-slate-900 whitespace-nowrap truncate">
            {selectedItem.label}
          </span>
        </div>
        <span
          className={`material-symbols-outlined text-text-secondary text-lg transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-amber-600" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Pilihan horizon proyeksi"
          className={`absolute top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-border-subtle z-50 p-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none ${panelClassName}`}
        >
          <div className="px-2.5 py-1.5 mb-1 border-b border-border-subtle/60 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-text-muted uppercase tracking-wider font-bold">
              Horizon Proyeksi
            </span>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
              H+{selectedItem.days}
            </span>
          </div>

          <div className="space-y-0.5">
            {HORIZON_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-50 text-amber-900 font-bold shadow-2xs"
                      : "text-text-primary hover:bg-surface-subtle font-medium"
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{opt.label}</span>
                    <span
                      className={`text-[10px] leading-tight ${
                        isSelected ? "text-amber-800" : "text-text-muted"
                      }`}
                    >
                      {opt.sublabel}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-base text-amber-600 shrink-0">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
