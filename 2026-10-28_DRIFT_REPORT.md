# EGM Drift Report — HargaWatch Surabaya

> **Audit Date:** 2026-10-28  
> **Auditors:** Multi-Agent Antagonistic Review Swarm (`egm-zoom-out`, `egm-comprehension`, `egm-design`, `egm-structural`, `egm-style`)  
> **Scope:** Architectural Contracts & Production Codebase (`AGENTS.md`, `README.md`, `scripts/`, `src/`, `web/`)  
> **Baseline Contracts:** Production Supabase Database Schema, Model Registry, and Verified Operational Pipelines  

---

## 1. Executive Summary & Audit Scorecard

This audit report identifies discrepancies between the newly established Elephant-Goldfish Model (EGM) architectural contracts and the production implementation across the HargaWatch Surabaya platform.

### Audit Scorecard

| Scoped Module | Contract Path | Audit Status | Primary Observed Condition |
|---|---|---|---|
| **Root Governance** | [`AGENTS.md`](./AGENTS.md) | 🟡 **DRIFT** | Cites 38 commodities and outdated model registry path. |
| **Root Blueprint** | [`README.md`](./README.md) | 🟡 **DRIFT** | Diagram/text mentions 38 commodities; active catalog is 37. |
| **Scripts Layer** | [`scripts/README.md`](./scripts/README.md) | 🟡 **DRIFT** | Overview references 38 commodities; active catalog is 37. |
| **Pipeline Core** | [`src/pipeline/README.md`](./src/pipeline/README.md) | 🟢 **PASS** | 100% compliant with physical fetchers, scrapers, and DDL. |
| **Model Forecaster** | [`src/models/README.md`](./src/models/README.md) | 🟢 **PASS** | 100% compliant with quantile forecasters and backtesting. |
| **Safety / EWS** | [`src/safety/README.md`](./src/safety/README.md) | 🟢 **PASS** | 100% compliant with 4-pillar scoring and calibrated thresholds. |
| **Utilities** | [`src/utils/README.md`](./src/utils/README.md) | 🟢 **PASS** | 100% compliant with Supabase poolers and alerting redaction. |
| **Analytics** | [`src/analytics/README.md`](./src/analytics/README.md) | 🟢 **PASS** | 100% compliant with causal features and WAPE/PICP metrics. |
| **Frontend Web** | [`web/README.md`](./web/README.md) | 🟡 **DRIFT** | References 38 commodities; mock fixtures use sequential IDs 1–8. |

---

## 2. Audit Methodology & Baseline Contracts

Drift detection measures divergence between written documentation and actual source code behavior:
- **Database Truth:** Canonical tables in Supabase PostgreSQL (`dim_komoditas`, `dim_pasar`, `fact_harga_pasar`).
- **Safety Truth:** EWS calibration defined in [`src/safety/early_warning.py`](./src/safety/early_warning.py) (`NORMAL < 40`, `WASPADA 40–69`, `TINGGI >= 70`).
- **Model Truth:** Champion artifacts registered in [`models/forecasting/registry.json`](./models/forecasting/registry.json).

---

## 3. Verified Architectural Divergences

### 3.1 Commodity Catalog Count Ambiguity (37 Active vs. 38 Legacy References)
* **Severity:** Major
* **Affected Files:** [`AGENTS.md`](./AGENTS.md#L12), [`README.md`](./README.md#L22), [`scripts/README.md`](./scripts/README.md#L12), [`web/README.md`](./web/README.md#L3)
* **Observed Reality:**
  - The East Java provincial SISKAPERBAPO benchmark tracks **38 food commodities**, which includes two distinct garlic entries: generic Bawang Putih (ID 3) and imported Bawang Putih Sinco/Honan (ID 49).
  - In Surabaya's operational ingestion pipeline and production tables ([`data/processed/dim_komoditas.csv`](./data/processed/dim_komoditas.csv) and [`config/commodities.json`](./config/commodities.json)), generic ID 3 is filtered out, leaving exactly **37 active monitored commodities**.
  - Upstream commodity IDs are **sparse, non-sequential integers** ranging up to ID 96 (e.g., ID 50 = Cabai Rawit Merah, ID 96 = Minyakita).
* **Required Documentation Fix:** Update documentation and diagrams to state: *"37 active monitored food commodities (derived from the 38-commodity SISKAPERBAPO catalog subset by filtering unlisted generic garlic ID 3 in favor of ID 49; IDs are non-sequential up to ID 96)"*.

### 3.2 Frontend Mock Fixture ID Space Divergence
* **Severity:** Major
* **Affected Files:** [`web/src/data/mockData.ts`](./web/src/data/mockData.ts), [`web/README.md`](./web/README.md)
* **Observed Reality:**
  - [`web/src/data/mockData.ts`](./web/src/data/mockData.ts) defines **8 mock commodities** for offline UI development.
  - Mock commodities use synthetic sequential integers (`id: 1` through `id: 8`, where ID 1 = Cabai Rawit Merah). In production Supabase schemas, Cabai Rawit Merah is ID 50.
* **Required Documentation Fix:** Document that mock fixtures use an isolated, synthetic ID space for offline UI layout verification, distinct from the upstream SISKAPERBAPO production keys.

### 3.3 Model Registry Path Discrepancy in Root Governance
* **Severity:** Minor
* **Affected Files:** [`AGENTS.md`](./AGENTS.md#L27) vs. [`scripts/README.md`](./scripts/README.md#L18)
* **Observed Reality:**
  - [`AGENTS.md`](./AGENTS.md#L27) references `models/registry.json`.
  - The actual verified registry file path used by production forecasting inference ([`scripts/run_forecasting.py`](./scripts/run_forecasting.py#L38)) is [`models/forecasting/registry.json`](./models/forecasting/registry.json).
* **Required Documentation Fix:** Update [`AGENTS.md`](./AGENTS.md) line 27 to reference `models/forecasting/registry.json`.

---

## 4. Intentional Architectural Invariants (Not Drift)

These items were audited and confirmed as intentional system safeguards:

### 4.1 BPS Offline Inflation Staging (Cloudflare WAF Defense)
* **Scope:** [`src/pipeline/download_inflasi_bps.py`](./src/pipeline/download_inflasi_bps.py)
* **Architectural Invariant:** The BPS script writes raw inflation data to local CSV storage (`data/external/inflasi/`) rather than running automated headless database upserts. This boundary exists because `bps.go.id` endpoints enforce Cloudflare anti-bot verification and public APIs are unstable. Database loading is intentionally decoupled to [`src/utils/ingest_supabase.py`](./src/utils/ingest_supabase.py) via `muat_fact_inflasi()`.

### 4.2 Single-Purpose Ingestion Runner Scoping
* **Scope:** [`scripts/update_harian.py`](./scripts/update_harian.py)
* **Architectural Invariant:** `update_harian.py` is specifically a daily remote database upsert utility. It does not provide a `--local-only` CLI flag. Local execution and fallback caching are properly encapsulated at the orchestration levels: [`scripts/run_forecasting.py --local-only`](./scripts/run_forecasting.py) and [`scripts/run_daily_pipeline.py --local-only`](./scripts/run_daily_pipeline.py).

### 4.3 Early Warning System Calibrated Threshold Alignment
* **Scope:** [`src/safety/early_warning.py`](./src/safety/early_warning.py), [`docs/EWS_methodology.md`](./docs/EWS_methodology.md), [`src/safety/README.md`](./src/safety/README.md)
* **Architectural Invariant:** All canonical codebase implementations and technical specifications are unified on the calibrated 100-point composite risk scale:
  - 🟢 `NORMAL`: Total score $< 40$
  - 🟡 `WASPADA`: Total score $40 - 69$
  - 🔴 `TINGGI`: Total score $\ge 70$

---

## 5. Remediation Plan & Verification Checklist

- [x] **Task 1: Reconcile Commodity Count in Root Documents**  
  Update [`AGENTS.md`](./AGENTS.md), [`README.md`](./README.md), [`scripts/README.md`](./scripts/README.md), and [`web/README.md`](./web/README.md) to reference 37 active commodities with sparse IDs up to 96. *(Completed)*
- [x] **Task 2: Correct Model Registry Path in `AGENTS.md`**  
  Change `models/registry.json` to `models/forecasting/registry.json` in [`AGENTS.md`](./AGENTS.md#L27). *(Completed)*
- [x] **Task 3: Document Mock Fixture ID Space in `web/README.md`**  
  Add note clarifying the 8-item synthetic ID space (1–8) in [`web/src/data/mockData.ts`](./web/src/data/mockData.ts). *(Completed)*

### Verification Commands
```bash
# Verify backend unit and integration test suite
python -m pytest tests/ -v

# Verify Next.js frontend production build
cd web && npm run build
```
