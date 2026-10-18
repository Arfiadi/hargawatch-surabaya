"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CommodityIcon from "@/components/CommodityIcon";

export interface CommodityOption {
  id: number;
  name: string;
  unit: string;
  group: string;
}

interface CommoditySearchSelectProps {
  options: CommodityOption[];
  valueId: number;
  onChange: (id: number) => void;
  searchPlaceholder?: string;
  emptyNoun?: string;
  className?: string;
  panelClassName?: string;
}

/**
 * Search bar komoditas (Pola 2): tombol terpilih + panel berisi search input,
 * chip filter kategori, dan daftar komoditas ber-ikon.
 * Dipakai di beberapa halaman supaya perilaku pencarian konsisten.
 */
export default function CommoditySearchSelect({
  options,
  valueId,
  onChange,
  searchPlaceholder = "Cari dari 38 komoditas Surabaya...",
  emptyNoun = "komoditas",
  className = "",
  panelClassName = "w-full sm:w-84",
}: CommoditySearchSelectProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [group, setGroup] = useState<string>("Semua");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const groups = useMemo(
    () => ["Semua", ...Array.from(new Set(options.map((o) => o.group)))],
    [options]
  );

  const selected = options.find((o) => o.id === valueId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => {
      const matchesGroup = group === "Semua" || o.group === group;
      const matchesSearch =
        q === "" ||
        o.name.toLowerCase().includes(q) ||
        o.group.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [options, group, query]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={options.length === 0}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-surface-subtle border border-border-subtle hover:border-primary/40 shadow-xs transition-all cursor-pointer text-left disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CommodityIcon id={selected?.id ?? "default"} className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-text-primary font-bold block truncate leading-tight">
              {selected ? selected.name : "Tidak ada komoditas"}
            </span>
            <span className="text-[10px] text-text-muted font-normal block leading-tight">
              {selected
                ? `${selected.group} • per ${selected.unit}`
                : "Data belum tersedia"}
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-text-secondary text-lg shrink-0">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-border-subtle z-50 p-3 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${panelClassName}`}
        >
          {/* Search Input */}
          <div className="relative mb-2">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-base">
              search
            </span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-1.5 rounded-lg bg-surface-subtle text-xs border border-border-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-text-primary placeholder:text-text-muted"
              autoFocus
            />
          </div>

          {/* Group Filter Chips */}
          <div className="flex flex-wrap items-center gap-1 pb-1.5 mb-1.5 border-b border-border-subtle">
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 transition-all cursor-pointer ${
                  group === g
                    ? "bg-primary text-white"
                    : "bg-surface-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* List of Commodities */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-text-muted">
                Tidak ada {emptyNoun} &quot;{query}&quot;
              </div>
            ) : (
              filtered.map((c) => {
                const isCurrent = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onChange(c.id);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      isCurrent
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-surface-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-primary/5 text-primary">
                        <CommodityIcon id={c.id} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[10px] text-text-muted font-normal">
                        /{c.unit}
                      </span>
                      {isCurrent && (
                        <span className="material-symbols-outlined text-primary text-sm font-bold">
                          check
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
