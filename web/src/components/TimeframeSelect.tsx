"use client";

import { useEffect, useRef, useState } from "react";
import { TIMEFRAME_CONFIG, TimeframeOption } from "@/lib/dataService";

interface TimeframeSelectProps {
  value: TimeframeOption;
  onChange: (value: TimeframeOption) => void;
  className?: string;
  panelClassName?: string;
}

/**
 * Dropdown kustom rentang waktu historis (7 Hari s/d 1 Tahun).
 * Menggantikan elemen native <select> dengan popover card modern yang
 * selaras dengan CommoditySearchSelect dan Design System HargaWatch.
 */
export default function TimeframeSelect({
  value,
  onChange,
  className = "",
  panelClassName = "w-56 right-0 left-auto",
}: TimeframeSelectProps) {
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
    TIMEFRAME_CONFIG.find((tf) => tf.id === value) || TIMEFRAME_CONFIG[1];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="w-full h-11 px-3 flex items-center justify-between gap-2.5 bg-white hover:bg-surface-subtle text-text-primary text-xs font-semibold rounded-xl border border-border-subtle hover:border-primary/40 shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 select-none"
        title="Pilih rentang waktu data historis"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[15px]">
              calendar_month
            </span>
          </div>
          <span className="font-bold text-slate-900 whitespace-nowrap truncate">
            Riwayat: {selectedItem.label}
          </span>
        </div>
        <span
          className={`material-symbols-outlined text-text-secondary text-lg transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Pilihan rentang waktu historis"
          className={`absolute top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-border-subtle z-50 p-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none ${panelClassName}`}
        >
          <div className="px-2.5 py-1.5 mb-1 border-b border-border-subtle/60 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-text-muted uppercase tracking-wider font-bold">
              Rentang Waktu
            </span>
            <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
              {selectedItem.days} Hari
            </span>
          </div>

          <div className="space-y-0.5">
            {TIMEFRAME_CONFIG.map((tf) => {
              const isSelected = tf.id === value;
              return (
                <button
                  key={tf.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(tf.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-primary/10 text-primary font-bold shadow-2xs"
                      : "text-slate-700 hover:text-slate-900 hover:bg-surface-subtle"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        isSelected ? "bg-primary" : "bg-slate-300"
                      }`}
                    />
                    <span>Riwayat: {tf.label}</span>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-base text-primary">
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
