<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Frontend Engineering Guidelines — HargaWatch Web

Subdirectory rules for AI coding agents modifying code within `web/`.

## 1. Stack & Architecture

* **Framework:** Next.js 15.5 (App Router architecture).
* **UI & Styling:** React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), Material Symbols Outlined icons.
* **Maps & GIS:** Leaflet 1.9 with custom HTML/SVG market pins.
* **Backend Integration:** Supabase Client (`@supabase/supabase-js`) querying `fact_harga_pasar`, `fact_forecast`, `fact_early_warning`, and `dim_komoditas`.

---

## 2. Content Security Policy (CSP) & Header Safeguards

> [!CAUTION]
> **Strict CSP Whitelist Requirement:**
> When modifying `web/next.config.ts`, you **MUST NEVER** remove or restrict the following whitelisted domains:
> * `style-src`: must allow `https://fonts.googleapis.com`
> * `font-src`: must allow `https://fonts.gstatic.com`
> * `img-src`: must allow `https://*.openstreetmap.fr https://*.tile.openstreetmap.org https://*.hotosm.org https://unpkg.com https://*.leafletjs.com`
> * `connect-src`: must allow `https://*.supabase.co https://*.pooler.supabase.com https://fonts.googleapis.com https://fonts.gstatic.com`
>
> **Consequence of Violation:** Removing Google Fonts/Icons domains breaks the font ligature parser, causing all UI icons (pins, carts, delete, arrows) to render as broken raw text (e.g. `location_on`, `trending_down`, `add_shopping_cart`).

---

## 3. Supabase Client Conventions

* Located at `web/src/lib/supabase.ts`.
* Always prioritize `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
* Maintain safe client-side fallback to the public publishable anon key (`sb_publishable_...`) so preview deployments (e.g. Vercel Preview) and local dev remain functional.
* Never import or expose the Supabase `SERVICE_ROLE_KEY` inside client components.

---

## 4. Frontend Verification Commands

Execute before concluding any frontend task:

```bash
cd web

# 1. Verify production compilation and type integrity
npm run build

# 2. Verify dependency supply chain security
npm audit --audit-level=high
```
Both commands must pass with exit code 0.
