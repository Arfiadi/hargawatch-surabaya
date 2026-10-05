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

    // Official OpenStreetMap Tile Layer (100% Free, Open Source, No API Key Required)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

      // Color coding & badge
      const dotColor = isMin ? "#16A34A" : isMax ? "#DC2626" : "#D97706";
      const iconBg = isMin
        ? "background-color: #16A34A; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);"
        : isMax
        ? "background-color: #DC2626; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);"
        : "background-color: #475569; box-shadow: 0 4px 10px rgba(71, 85, 105, 0.3);";

      const iconSymbol = isMin ? "anchor" : isMax ? "priority_high" : "storefront";
      const badgeText = isMin ? "TERMURAH" : isMax ? "TERTINGGI" : m.zone;
      const badgeBg = isMin
        ? "background: #DCFCE7; color: #16A34A; font-weight: 700;"
        : isMax
        ? "background: #FEE2E2; color: #DC2626; font-weight: 700;"
        : "background: #F1F5F9; color: #475569; font-weight: 600;";

      const ringStyle = isSelected
        ? "border: 2px solid #004328; box-shadow: 0 0 0 4px rgba(0, 67, 40, 0.25);"
        : "border: 1px solid #CBD5E1;";

      const opacity = inZone ? "1" : "0.35";

      const html = `
        <div style="opacity: ${opacity}; transition: all 0.2s ease; transform: translate(-50%, -100%); cursor: pointer; display: flex; flex-direction: column; items-center; align-items: center; width: max-content;">
          <!-- Top Price Pill -->
          <div style="background: #FFFFFF; padding: 4px 10px; border-radius: 9999px; ${ringStyle} display: flex; align-items: center; gap: 6px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
            <span style="width: 7px; height: 7px; border-radius: 9999px; background: ${dotColor};"></span>
            <span style="font-size: 11px; font-weight: 700; color: #0F172A;">${m.shortName}</span>
            <span style="font-size: 11px; font-weight: 800; color: ${isMin ? "#16A34A" : isMax ? "#DC2626" : "#0F172A"};">Rp ${m.price.toLocaleString("id-ID")}</span>
          </div>

          <!-- Center Pin Icon Bubble -->
          <div style="width: 28px; height: 28px; border-radius: 9999px; ${iconBg} color: #FFFFFF; display: flex; align-items: center; justify-content: center; margin-top: -3px; border: 2.5px solid #FFFFFF;">
            <span class="material-symbols-outlined" style="font-size: 15px; font-weight: 700;">${iconSymbol}</span>
          </div>

          <!-- Bottom Status Badge -->
          <div style="padding: 1px 8px; border-radius: 9999px; font-size: 9px; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; ${badgeBg}">
            ${badgeText}
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
        offset: [0, -38],
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
    <div className="relative w-full h-[580px] overflow-hidden select-none bg-surface-subtle">
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Controller */}
      <div className="absolute top-space-md right-space-md z-20 flex items-center justify-end gap-space-xs pointer-events-none">

        <div className="pointer-events-auto flex items-center gap-1 bg-surface-card/95 backdrop-blur-md p-1 rounded-lg shadow-sm border border-border-subtle">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-text-secondary transition-colors cursor-pointer"
            title="Perbesar Peta"
            onClick={handleZoomIn}
          >
            <span className="material-symbols-outlined text-body-md">add</span>
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-text-secondary transition-colors cursor-pointer"
            title="Perkecil Peta"
            onClick={handleZoomOut}
          >
            <span className="material-symbols-outlined text-body-md">remove</span>
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-text-secondary transition-colors cursor-pointer"
            title="Reset Peta ke 6 Pasar"
            onClick={handleReset}
          >
            <span className="material-symbols-outlined text-body-md">my_location</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Map Legend */}
      <div className="absolute bottom-space-md left-space-md bg-surface-card/95 backdrop-blur-md p-space-sm rounded-xl shadow-sm z-20 flex flex-col gap-1.5 border border-border-subtle">
        <span className="font-label-caps text-label-caps text-text-muted uppercase">
          Deviasi Harga {selectedCommodityName}
        </span>
        <div className="flex items-center gap-2 text-label-caps font-label-caps">
          <span className="text-status-normal font-bold">
            Termurah (Rp {minPrice.toLocaleString("id-ID")})
          </span>
          <div className="w-24 h-2 rounded-full bg-gradient-to-r from-status-normal via-status-warning to-status-critical"></div>
          <span className="text-status-critical font-bold">
            Tertinggi (Rp {maxPrice.toLocaleString("id-ID")})
          </span>
        </div>
      </div>
    </div>
  );
}
