"use client";

import React from "react";

interface CommodityIconProps {
  id: number | string;
  className?: string;
}

/**
 * Universal Monoline Vector Logo System for Surabaya Food Commodities.
 * Crafted according to professional logo-design principles:
 * - Scalable 24x24 viewBox (crisp at 14px, 16px, 24px, 32px+)
 * - Unified stroke geometry (strokeWidth="2", round linecap/join)
 * - Optical balancing & harmonic proportions across all 38 catalog commodities.
 */
export default function CommodityIcon({ id, className = "w-5 h-5" }: CommodityIconProps) {
  const numId = typeof id === "number" ? id : parseInt(id, 10);
  const strId = String(id || "").toLowerCase().trim();

  // Helper SVG Wrapper
  const wrap = (children: React.ReactNode, title?: string) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title || "Ikon Komoditas"}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );

  // 1. Cabe Merah Keriting (ID: 37)
  if (numId === 37 || strId === "cabai_keriting" || strId.includes("keriting")) {
    return wrap(
      <>
        <path d="M17 3c-.8 1.4-1.8 2-3.5 2.2" />
        <path d="M13 5c-.5.8-1 1-2 1" />
        <path d="M13.5 5.2c2.5 1 4 3 3.5 6-.5 3-3 4-3.5 6-.5 2 1 3 1.5 3.8-1.5.5-3-.5-4-1.5-1.5-1.5-1.5-3.5-1-5.5.5-2 2.5-3 3-5 .5-2-.5-3.5.5-3.8z" />
      </>,
      "Cabai Merah Keriting"
    );
  }

  // 2. Cabe Merah Besar (ID: 38)
  if (numId === 38 || strId === "cabai_besar" || strId.includes("merah besar")) {
    return wrap(
      <>
        <path d="M16 3c-.6 1.2-1.5 1.8-3 2" />
        <path d="M10 5h6" />
        <path d="M13 5c3 1.5 5 4.5 5 8.5 0 4-3.5 7.5-7.5 7.5S4 18 4 14C4 9.5 9 5 13 5z" />
        <path d="M10.5 10c2 1 3.5 3 3.5 5.5" opacity="0.6" strokeWidth="1.5" />
      </>,
      "Cabai Merah Besar"
    );
  }

  // 3. Cabai Rawit Merah (ID: 50)
  if (numId === 50 || strId === "cabai" || strId.includes("rawit") || strId.includes("cabe")) {
    return wrap(
      <>
        <path d="M17.5 3.5c-.8 1.4-1.8 2.2-3.5 2.5" />
        <path d="M13 5c-.5.8-1 1.2-2 1.2" />
        <path d="M14 6c3 1.5 5 4.5 5 8a8.5 8.5 0 0 1-13.5 7c-1.8-1.5-2.5-3.5-2.5-5.5 0-4.5 5.5-9.5 11-9.5z" />
        <path d="M11 11.5c1.5 1 2.5 3 2.5 5" opacity="0.6" strokeWidth="1.5" />
      </>,
      "Cabai Rawit Merah"
    );
  }

  // 4. Bawang Putih (ID: 49)
  if (numId === 49 || strId === "bawang_putih" || strId.includes("putih") || strId.includes("honan") || strId.includes("sinco")) {
    return wrap(
      <>
        <path d="M12 2v3.5" />
        <path d="M12 5.5C10.5 5.5 8 7 7 9c-1.5 3-1.2 6.5 0 9 1 2 3 2.5 5 2.5s4-.5 5-2.5c1.2-2.5 1.5-6 0-9-1-2-3.5-3.5-5-3.5z" />
        <path d="M12 5.5c-1.5 3.5-2 8-1 12" opacity="0.6" strokeWidth="1.5" />
        <path d="M12 5.5c1.5 3.5 2 8 1 12" opacity="0.6" strokeWidth="1.5" />
        <path d="M9.5 20h5" strokeWidth="2" />
      </>,
      "Bawang Putih"
    );
  }

  // 5. Bawang Merah (ID: 39)
  if (numId === 39 || strId === "bawang" || strId.includes("bawang merah")) {
    return wrap(
      <>
        <path d="M12 2v4" />
        <path d="M10 3.5c.6.8 1.4 1.5 2 1.5s1.4-.7 2-1.5" />
        <path d="M12 6c-4.5 1.5-7.5 5.5-7.5 9.5 0 4 3.3 6.5 7.5 6.5s7.5-2.5 7.5-6.5C19.5 11.5 16.5 7.5 12 6z" />
        <path d="M12 6c-2 3.5-3 7-3 10" opacity="0.6" strokeWidth="1.5" />
        <path d="M12 6c2 3.5 3 7 3 10" opacity="0.6" strokeWidth="1.5" />
      </>,
      "Bawang Merah"
    );
  }

  // 6. Jagung Pipilan Kering (ID: 25)
  if (numId === 25 || strId === "jagung" || strId.includes("jagung")) {
    return wrap(
      <>
        <path d="M9 3c3-1 6 0 7 3 1 3 0 7-2 11l-3 4c-.5-3-1-6-1-9 0-3 0-6-1-9z" />
        <path d="M8 12c-2 1-4 3.5-4 6.5 0 1.5 1 2.5 3 2.5" />
        <path d="M16 12c2 1 4 3.5 4 6.5 0 1.5-1 2.5-3 2.5" />
        <path d="M10.5 7h3" opacity="0.6" strokeWidth="1.5" />
        <path d="M10 10.5h4" opacity="0.6" strokeWidth="1.5" />
        <path d="M10 14h3" opacity="0.6" strokeWidth="1.5" />
      </>,
      "Jagung Pipilan"
    );
  }

  // 7. Tepung Terigu / Gandum (ID: 30)
  if (numId === 30 || strId === "terigu" || strId.includes("terigu") || strId.includes("tepung")) {
    return wrap(
      <>
        <path d="M7 7c2-1 8-1 10 0l2 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L7 7z" />
        <path d="M8 7c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5" />
        <path d="M12 11v6" opacity="0.7" strokeWidth="1.5" />
        <path d="M10 13l4-2" opacity="0.7" strokeWidth="1.5" />
        <path d="M14 15l-4-2" opacity="0.7" strokeWidth="1.5" />
      </>,
      "Tepung Terigu"
    );
  }

  // 8. Beras Premium / Medium (ID: 2, 4)
  if (numId === 2 || numId === 4 || strId === "beras" || strId.includes("beras")) {
    return wrap(
      <>
        <path d="M4 21c3-6 7-12 14-17" />
        <path d="M11 7c2-1 4.5 0 4.5 2s-1.5 3.5-3.5 3.5" />
        <path d="M15 10c2-1 4 0 4 2s-1.5 3-3.5 3" />
        <path d="M8 11c-1 2 0 4 2 4s3.5-1 3.5-3" />
        <path d="M12 14c-1 2 0 4 2 4s3-1 3-3" />
        <path d="M6 16c-1 1.8 0 3.5 1.8 3.5s2.7-1 2.7-2.7" />
      </>,
      "Beras"
    );
  }

  // 9. Minyak Goreng (ID: 10, 92, 96)
  if (numId === 10 || numId === 92 || numId === 96 || strId === "minyak" || strId.includes("minyak")) {
    return wrap(
      <>
        <path d="M10 2h4v3h-4z" />
        <path d="M10 5l-3 4v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9l-3-4z" />
        <path d="M12 12c-1.2 1.5-2 2.5-2 3.5a2 2 0 0 0 4 0c0-1-.8-2-2-3.5z" fill="currentColor" stroke="none" opacity="0.7" />
      </>,
      "Minyak Goreng"
    );
  }

  // 10. Gula Kristal Putih / Pasir (ID: 7)
  if (numId === 7 || strId === "gula" || strId.includes("gula")) {
    return wrap(
      <>
        <path d="M4 11h16v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-6z" />
        <path d="M4 11c1-4 4-7 8-7s7 3 8 7" />
        <path d="M17 3l3 4" strokeWidth="2.5" />
      </>,
      "Gula Pasir"
    );
  }

  // 11. Garam Beryodium Halus (ID: 28)
  if (numId === 28 || strId === "garam" || strId.includes("garam")) {
    return wrap(
      <>
        <path d="M9 4h6v2H9z" />
        <path d="M8 6h8l1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L8 6z" />
        <path d="M10 2.5h4" strokeWidth="2" />
        <circle cx="11" cy="4.5" r="0.5" fill="currentColor" stroke="none" />
        <circle cx="13" cy="4.5" r="0.5" fill="currentColor" stroke="none" />
        <path d="M10 13c1-1 3-1 4 0" opacity="0.6" strokeWidth="1.5" />
        <path d="M10.5 16.5c.8-.8 2.2-.8 3 0" opacity="0.6" strokeWidth="1.5" />
      </>,
      "Garam Halus"
    );
  }

  // 12. Telur Ayam Ras & Kampung (ID: 16, 17)
  if (numId === 16 || numId === 17 || strId === "telur" || strId.includes("telur")) {
    return wrap(
      <>
        <path d="M12 2C7.5 2 4 8 4 14.5 4 18.5 7.5 22 12 22s8-3.5 8-7.5C20 8 16.5 2 12 2z" />
        <path d="M8 12c0-3.5 1.5-6.5 4-8" opacity="0.5" strokeWidth="1.5" />
      </>,
      "Telur Ayam"
    );
  }

  // 13. Daging Ayam Ras & Kampung (ID: 13, 14)
  if (numId === 13 || numId === 14 || strId === "daging_ayam" || (strId.includes("ayam") && !strId.includes("telur"))) {
    return wrap(
      <>
        <path d="M15.5 4.5c2.5 1.5 4 4.5 3.5 7.5-.5 3-2.5 5-5 5.5l-4 4c-.6.6-1.5.6-2 0l-1-1c-.6-.6-.6-1.5 0-2l4-4c-.5-2.5.5-5 2-6.5 1-1 1.8-1.2 2.5-.5z" />
        <circle cx="5" cy="19" r="1.5" />
        <circle cx="7" cy="21" r="1.5" />
      </>,
      "Daging Ayam"
    );
  }

  // 14. Daging Sapi (ID: 12)
  if (numId === 12 || strId === "daging_sapi" || strId === "daging" || strId.includes("sapi")) {
    return wrap(
      <>
        <path d="M19 8c-1.5-2-4.5-3-8-2-4.5 1.5-7 5.5-7 9.5 0 3.5 2.5 5.5 6 5.5 4.5 0 8.5-3.5 9-8 .5-1.8.5-3.8 0-5z" />
        <circle cx="10" cy="14" r="2.5" />
      </>,
      "Daging Sapi"
    );
  }

  // 15. Ikan Asin Teri (ID: 40)
  if (numId === 40 || strId === "ikan_teri" || strId.includes("teri")) {
    return wrap(
      <>
        <path d="M3 8c2.5-2 6-2 9 0 1.5-1 2.5-1.2 3.5-1.2-.5 1.2 0 2 .2 2.7-.2.7-.7 1.5 0 2.5-.8 0-2-.2-3.5-1.2-3 1.5-6.5 1.5-9.2-2.8z" />
        <circle cx="10" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
        <path d="M5 16c2.5-2 6-2 9 0 1.5-1 2.5-1.2 3.5-1.2-.5 1.2 0 2 .2 2.7-.2.7-.7 1.5 0 2.5-.8 0-2-.2-3.5-1.2-3 1.5-6.5 1.5-9.2-2.8z" opacity="0.8" />
        <circle cx="12" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
      </>,
      "Ikan Asin Teri"
    );
  }

  // 16. Ikan Segar (Bandeng, Kembung, Tongkol, Tuna, Cakalang) (ID: 58, 59, 60, 61, 62)
  if (
    numId === 58 || numId === 59 || numId === 60 || numId === 61 || numId === 62 ||
    strId === "ikan" || strId.includes("bandeng") || strId.includes("kembung") ||
    strId.includes("tongkol") || strId.includes("tuna") || strId.includes("cakalang") || strId.includes("ikan")
  ) {
    return wrap(
      <>
        <path d="M2 12c3.5-4.5 9-6 15-3 2-2 4-2.5 5-2.5-1 2.5-.5 4.5 0 6-.5 1.5-1 3.5 0 6-1 0-3-.5-5-2.5-6 3-11.5 1.5-15-3z" />
        <circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" />
        <path d="M12 11c-.5 1.5-1.5 2.5-3 3" opacity="0.6" strokeWidth="1.5" />
      </>,
      "Ikan Segar"
    );
  }

  // 17. Tomat Merah (ID: 46)
  if (numId === 46 || strId === "tomat" || strId.includes("tomat")) {
    return wrap(
      <>
        <circle cx="12" cy="13.5" r="7.5" />
        <path d="M12 6V3" />
        <path d="M12 6c-1-1.5-2.5-2-4-2 1 1.5 1.5 2.5 2 3" />
        <path d="M12 6c1-1.5 2.5-2 4-2-1 1.5-1.5 2.5-2 3" />
        <path d="M9 13c0-2 1.5-4 3-4.5" opacity="0.5" strokeWidth="1.5" />
      </>,
      "Tomat Merah"
    );
  }

  // 18. Kentang (ID: 45)
  if (numId === 45 || strId === "kentang" || strId.includes("kentang")) {
    return wrap(
      <>
        <path d="M7.5 7.5C9.5 5.5 14 5 17 7s4 6 3 9.5-3.5 4.5-7.5 4.5-6-1.5-7.5-4.5c-1.5-3-.5-7 2.5-9z" />
        <circle cx="10" cy="10" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="15" cy="12" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="11" cy="16" r="0.75" fill="currentColor" stroke="none" />
      </>,
      "Kentang"
    );
  }

  // 19. Wortel (ID: 47)
  if (numId === 47 || strId === "wortel" || strId.includes("wortel")) {
    return wrap(
      <>
        <path d="M17 7L8 20c-1 1.5-2.5 1.5-3.5.5s-1-2.5.5-3.5L14 8" />
        <path d="M15 7c.5-1.5 1.5-2.5 3-3" />
        <path d="M16 8c1.5-.5 2.5-1.5 3-3" />
        <path d="M16 6c1.5.5 3 0 4-1" />
        <path d="M11 12l2.6 1.5" opacity="0.6" strokeWidth="1.5" />
        <path d="M8.4 15.5l2.6 1.5" opacity="0.6" strokeWidth="1.5" />
      </>,
      "Wortel"
    );
  }

  // 20. Kol / Kubis (ID: 44)
  if (numId === 44 || strId === "kol" || strId.includes("kol") || strId.includes("kubis")) {
    return wrap(
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M8 8c2.5 1 5.5 1 8 0" opacity="0.6" strokeWidth="1.5" />
        <path d="M7 14c3-1.5 7-1.5 10 0" opacity="0.6" strokeWidth="1.5" />
        <path d="M12 4c-1 3-1 13 0 16" opacity="0.6" strokeWidth="1.5" />
      </>,
      "Kol / Kubis"
    );
  }

  // 21. Buncis (ID: 48)
  if (numId === 48 || strId === "buncis" || strId.includes("buncis")) {
    return wrap(
      <>
        <path d="M5 19c3-4 6-7 13-14" />
        <path d="M18 5c1.5-1 2.5-1 3-1" />
        <path d="M6.5 17c2-3 5-5.5 10.5-10.5" />
        <circle cx="10" cy="13" r="1" fill="currentColor" stroke="none" />
        <circle cx="13" cy="10" r="1" fill="currentColor" stroke="none" />
      </>,
      "Buncis"
    );
  }

  // 22. Kedelai Impor (ID: 32)
  if (numId === 32 || strId === "kedelai" || strId.includes("kedelai")) {
    return wrap(
      <>
        <path d="M5 18c3-4 7-7 14-12" />
        <path d="M6 16c2-1.5 4.5-2 7-1" />
        <path d="M11 13c2-1.5 4.5-2 7-1" />
        <circle cx="8" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="13" cy="10" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="7" r="1.5" fill="currentColor" stroke="none" />
      </>,
      "Kedelai"
    );
  }

  // 23. Kacang Hijau (ID: 41)
  if (numId === 41 || strId === "kacang_hijau" || strId.includes("hijau")) {
    return wrap(
      <>
        <ellipse cx="8" cy="14" rx="3.5" ry="2.5" transform="rotate(-20 8 14)" />
        <ellipse cx="16" cy="14" rx="3.5" ry="2.5" transform="rotate(20 16 14)" />
        <ellipse cx="12" cy="7" rx="3.5" ry="2.5" />
        <path d="M11.5 6.5h1" strokeWidth="1.5" opacity="0.8" />
        <path d="M7.5 13.5h1" strokeWidth="1.5" opacity="0.8" />
        <path d="M15.5 13.5h1" strokeWidth="1.5" opacity="0.8" />
      </>,
      "Kacang Hijau"
    );
  }

  // 24. Kacang Tanah (ID: 42)
  if (numId === 42 || strId === "kacang_tanah" || strId === "kacang" || strId.includes("tanah")) {
    return wrap(
      <>
        <path d="M9 5c2-1 4-1 5 .5 1 1.5.5 3-.5 4.5 1.5 1.5 2 3.5 1 5s-3 3-5 2-3-.5-4-2 0-3.5 1.5-5C6 8.5 5.5 7 6.5 5.5 7.5 4 8 4 9 5z" />
        <path d="M8.5 7.5c1 .5 2 .5 3 0" opacity="0.6" strokeWidth="1.5" />
        <path d="M8 14.5c1.5.5 3 .5 4.5 0" opacity="0.6" strokeWidth="1.5" />
      </>,
      "Kacang Tanah"
    );
  }

  // 25. Ketela Pohon / Singkong (ID: 43)
  if (numId === 43 || strId === "singkong" || strId.includes("ketela") || strId.includes("singkong")) {
    return wrap(
      <>
        <path d="M5 19L17 5c1-1 2.5-1 3.5 0s1 2.5 0 3.5L8.5 20.5c-1 1-2.5 1-3.5 0s-1-2.5 0-3.5z" />
        <circle cx="7" cy="17" r="2" opacity="0.6" strokeWidth="1.5" />
        <path d="M12 10l2 2" opacity="0.6" strokeWidth="1.5" />
      </>,
      "Ketela Pohon"
    );
  }

  // 26. Susu Kental Manis (ID: 20, 21)
  if (numId === 20 || numId === 21 || strId === "susu" || strId.includes("susu")) {
    return wrap(
      <>
        <rect x="6.5" y="4" width="11" height="16" rx="2" />
        <ellipse cx="12" cy="4" rx="5.5" ry="1.5" />
        <ellipse cx="12" cy="20" rx="5.5" ry="1.5" />
        <path d="M6.5 10h11" opacity="0.5" strokeWidth="1.5" />
        <path d="M6.5 15h11" opacity="0.5" strokeWidth="1.5" />
        <path d="M12 11.5c-.8 1-1.5 1.8-1.5 2.5a1.5 1.5 0 0 0 3 0c0-.7-.7-1.5-1.5-2.5z" fill="currentColor" stroke="none" />
      </>,
      "Susu Kental Manis"
    );
  }

  // 27. Indomie / Mie Instan (ID: 35)
  if (numId === 35 || strId === "mie" || strId.includes("mie") || strId.includes("indomie")) {
    return wrap(
      <>
        <path d="M4 11h16c0 5-3.5 8-8 8s-8-3-8-8z" />
        <path d="M7 19h10" strokeWidth="2.5" />
        <path d="M13 3l8 4" strokeWidth="2" />
        <path d="M11 5l9 4" strokeWidth="2" />
        <path d="M7 11c0-2 1-3 2-3s2 1 2 3" opacity="0.7" strokeWidth="1.5" />
        <path d="M11 11c0-2 1-3 2-3s2 1 2 3" opacity="0.7" strokeWidth="1.5" />
        <path d="M15 11c0-2 1-3 2-3s2 1 2 3" opacity="0.7" strokeWidth="1.5" />
      </>,
      "Mie Instan"
    );
  }

  // Fallback icon for any general/unspecified commodity
  return wrap(
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M8 12h8" />
    </>,
    "Bahan Pangan"
  );
}
