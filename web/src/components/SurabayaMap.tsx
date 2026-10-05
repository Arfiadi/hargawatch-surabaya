"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarketItem {
  id: string;
  pasar_id: number;
  name: string;
  shortName: string;
  zone: string;
  role: string;
  price: number;
  latitude: number;
  longitude: number;
  address: string;
  characteristic: string;
}

interface SurabayaMapProps {
  markets: MapMarketItem[];
  selectedCommodityName: string;
  unit: string;
  selectedMarketId: string;
  onSelectMarket: (id: string) => void;
  selectedZone: string;
  minPrice: number;
  maxPrice: number;
  cityAvg: number;
}

export default function SurabayaMap({
  markets,
  selectedCommodityName,
  unit,
  selectedMarketId,
  onSelectMarket,
  selectedZone,
  minPrice,
  maxPrice,
  cityAvg,
}: SurabayaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map Instance once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered at Surabaya City Center
    const map = L.map(mapContainerRef.current, {
      center: [-7.282, 112.752],
      zoom: 12,
      minZoom: 11,
      maxZoom: 16,
      zoomControl: false,
    });

    // Official OpenStreetMap Tile Layer styled with Apple Maps calm pastel palette
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: "apple-maps-style-tile",
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers dynamically when commodity, prices, or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    markets.forEach((m) => {
      const isMin = m.price === minPrice && minPrice > 0;
      const isMax = m.price === maxPrice && maxPrice > 0;
      const isSelected = m.id === selectedMarketId;
      const inZone = selectedZone === "Semua" || m.zone === selectedZone;

      // Nike / Apple Maps Minimalist Marker Pin
      const pinColor = isSelected
        ? "#004328" // Brand Deep Pine Green
        : isMin
        ? "#059669" // Vibrant Emerald for cheapest
        : isMax
        ? "#DC2626" // Ruby for highest
        : "#0F172A"; // Sleek Rich Black like Nike pins

      const iconSymbol = isMin ? "local_mall" : isMax ? "priority_high" : "storefront";
      const opacity = inZone ? "1" : "0.35";
      const scale = isSelected ? "scale(1.15)" : "scale(1)";

      const html = `
        <div class="nike-pin-item" style="opacity: ${opacity}; transform: translate(-50%, -100%); cursor: pointer; display: flex; flex-direction: column; align-items: center; width: max-content; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">
          <!-- Sleek Teardrop Pin -->
          <div style="position: relative; width: 34px; height: 42px; transform: ${scale}; filter: drop-shadow(0 4px 8px rgba(15, 23, 42, 0.28)); transition: transform 0.2s ease;">
            <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 0C7.611 0 0 7.611 0 17C0 28.5 17 42 17 42C17 42 34 28.5 34 17C34 7.611 26.389 0 17 0Z" fill="${pinColor}"/>
              <circle cx="17" cy="17" r="13.5" fill="${pinColor}"/>
            </svg>
            <div style="position: absolute; top: 0; left: 0; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; color: #FFFFFF;">
              <span class="material-symbols-outlined" style="font-size: 16px; font-weight: 600;">${iconSymbol}</span>
            </div>
            ${
              isMin
                ? `<span style="position: absolute; top: -1px; right: -1px; width: 11px; height: 11px; background: #22C55E; border: 2.5px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></span>`
                : isMax
                ? `<span style="position: absolute; top: -1px; right: -1px; width: 11px; height: 11px; background: #EF4444; border: 2.5px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></span>`
                : ""
            }
          </div>

          <!-- Clean Minimal Label below Pin (Apple Maps style) -->
          <div style="display: flex; flex-direction: column; align-items: center; margin-top: 3px; pointer-events: none;">
            <span style="font-size: 11px; font-weight: 700; color: #0F172A; text-shadow: 0 1px 3px rgba(255,255,255,0.95), 0 0 5px #FFFFFF; letter-spacing: -0.01em; white-space: nowrap;">
              ${m.shortName}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: ${
              isMin ? "#059669" : isMax ? "#DC2626" : "#334155"
            }; background: rgba(255, 255, 255, 0.94); backdrop-filter: blur(4px); padding: 1.5px 7px; border-radius: 9999px; border: 1px solid rgba(226, 232, 240, 0.9); box-shadow: 0 1px 3px rgba(0,0,0,0.06); white-space: nowrap; margin-top: 1px;">
              Rp ${m.price.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-leaflet-market-pin",
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon: customIcon });

      // Interactive Popup
      const diffVsMin = m.price - minPrice;
      const diffVsAvg = m.price - cityAvg;

      const popupHtml = `
        <div style="padding: 4px; font-family: inherit; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #0F172A;">${m.name}</strong>
            <span style="font-size: 10px; background: #F1F5F9; padding: 2px 6px; border-radius: 999px; color: #475569; font-weight: 600;">${m.zone}</span>
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">${m.address}</div>
          
          <div style="background: #F8FAFC; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px;">
            <div style="font-size: 10px; color: #64748B;">Harga ${selectedCommodityName}:</div>
            <div style="font-size: 14px; font-weight: 800; color: ${isMin ? "#16A34A" : isMax ? "#DC2626" : "#0F172A"};">
              Rp ${m.price.toLocaleString("id-ID")} <span style="font-size: 10px; font-weight: 400; color: #64748B;">/${unit}</span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 3px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B;">vs Rerata Kota:</span>
              <strong style="color: ${diffVsAvg > 0 ? "#DC2626" : "#16A34A"};">${diffVsAvg >= 0 ? "+" : ""}Rp ${diffVsAvg.toLocaleString("id-ID")}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B;">vs Termurah:</span>
              <strong style="color: ${isMin ? "#16A34A" : "#DC2626"};">${isMin ? "Paling Murah" : `+Rp ${diffVsMin.toLocaleString("id-ID")}`}</strong>
            </div>
          </div>

          <div style="margin-top: 8px; font-size: 10px; color: #64748B; line-height: 1.35; border-top: 1px dashed #E2E8F0; padding-top: 6px;">
            <em>${m.role}</em>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        offset: [0, -42],
        closeButton: false,
      });

      marker.on("click", () => {
        onSelectMarket(m.id);
      });

      markersGroup.addLayer(marker);
    });
  }, [markets, selectedCommodityName, unit, selectedMarketId, selectedZone, minPrice, maxPrice, cityAvg, onSelectMarket]);

  // Adjust view when selectedZone or selectedMarketId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedZone !== "Semua") {
      const filtered = markets.filter((m) => m.zone === selectedZone);
      if (filtered.length > 0) {
        const bounds = L.latLngBounds(filtered.map((m) => [m.latitude, m.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        return;
      }
    }

    // If a market is clicked, pan smoothly to it
    const active = markets.find((m) => m.id === selectedMarketId);
    if (active) {
      map.panTo([active.latitude, active.longitude], { animate: true });
    }
  }, [selectedZone, selectedMarketId, markets]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const bounds = L.latLngBounds(markets.map((m) => [m.latitude, m.longitude]));
    map.fitBounds(bounds, { padding: [40, 40] });
  };

  return (
    <div className="relative w-full h-[580px] overflow-hidden select-none bg-surface-subtle rounded-2xl border border-border-subtle shadow-sm">
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Apple-Maps Style Zoom & Reset Controls in Bottom Right */}
      <div className="absolute bottom-5 right-5 z-20 pointer-events-auto">
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/90 overflow-hidden divide-y divide-slate-100">
          <button
            className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 text-slate-700 active:scale-90 transition-all cursor-pointer"
            title="Perbesar Peta"
            onClick={handleZoomIn}
          >
            <span className="material-symbols-outlined text-[19px]">add</span>
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 text-slate-700 active:scale-90 transition-all cursor-pointer"
            title="Perkecil Peta"
            onClick={handleZoomOut}
          >
            <span className="material-symbols-outlined text-[19px]">remove</span>
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 text-slate-700 active:scale-90 transition-all cursor-pointer"
            title="Reset Peta ke 6 Pasar"
            onClick={handleReset}
          >
            <span className="material-symbols-outlined text-[18px]">near_me</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Map Legend (Minimalist Pill) */}
      <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-sm z-20 flex flex-col gap-1 border border-slate-200/90">
        <span className="font-label-caps text-[10px] text-text-muted uppercase tracking-wider font-semibold">
          Deviasi {selectedCommodityName}
        </span>
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span className="text-status-normal font-bold">
            Rp {minPrice.toLocaleString("id-ID")}
          </span>
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-status-normal via-status-warning to-status-critical"></div>
          <span className="text-status-critical font-bold">
            Rp {maxPrice.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Scoped CSS for Apple-Maps look and smooth pin hover */}
      <style jsx global>{`
        .apple-maps-style-tile {
          filter: contrast(0.96) saturate(0.85) brightness(1.02);
        }
        .nike-pin-item:hover {
          transform: translate(-50%, -105%) scale(1.08) !important;
          z-index: 9999 !important;
        }
        .custom-leaflet-market-pin {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid rgba(226, 232, 240, 0.9) !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
