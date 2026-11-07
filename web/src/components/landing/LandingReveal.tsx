"use client";

import { useEffect } from "react";

/**
 * LandingReveal — scroll-reveal + hero entry + stat counters.
 *
 * Three behaviours, all degrade gracefully:
 * 1. Hero entry  — h1, lead, CTA stagger in on mount (translateY + fade).
 * 2. Scroll reveal — [data-reveal] blocks enter and exit as they cross the viewport.
 * 3. Stat counters — [data-count] numbers count up when first in view.
 *
 * All motion respects prefers-reduced-motion via the .js class gate.
 */
export default function LandingReveal() {
  useEffect(() => {
    document.documentElement.classList.add("js");

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ── 1. Hero entry stagger ─────────────────────────────────────── */
    if (!reduce) {
      const heroTargets = document.querySelectorAll<HTMLElement>("[data-hero-enter]");
      heroTargets.forEach((el, i) => {
        el.style.setProperty("--hero-i", String(i));
      });
    }

    /* ── 2. Scroll-reveal (IntersectionObserver) ───────────────────── */
    const revealIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("is-in", entry.isIntersecting);
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => revealIo.observe(el));

    /* ── 3. Stat counters ──────────────────────────────────────────── */
    function animateCount(el: HTMLElement, target: number, duration = 1200) {
      const start = performance.now();
      const update = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // ease-out quart
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = String(Math.round(eased * target));
        if (t < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    }

    const countIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = Number(el.dataset.count);
            if (!isNaN(target)) {
              if (reduce) {
                el.textContent = String(target);
              } else {
                animateCount(el, target);
              }
            }
            countIo.unobserve(el);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      // stash the real text as the target value and start from 0
      const val = Number(el.textContent?.trim());
      if (!isNaN(val) && val > 0) {
        el.dataset.count = String(val);
        if (!reduce) el.textContent = "0";
        countIo.observe(el);
      }
    });

    return () => {
      revealIo.disconnect();
      countIo.disconnect();
      document.documentElement.classList.remove("js");
    };
  }, []);

  return null;
}
