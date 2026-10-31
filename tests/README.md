# Test Suite

Pytest tests for HargaWatch Surabaya. All configuration lives in `conftest.py` so the
repository root stays untouched.

## Quick start

```powershell
# Fast feedback loop (skips heavy model-training tests)
.\.venv\Scripts\python.exe -m pytest tests -m "not slow"

# Full suite
.\.venv\Scripts\python.exe -m pytest tests
```

## Markers

| Marker | Meaning | How to enable |
| --- | --- | --- |
| `slow` | Heavy model training / stress tests (GBDT, StatsForecast) | Always collected; deselect with `-m "not slow"` |
| `requires_data` | Needs `data/processed/fact_harga_pasar.csv` | Skipped automatically when the file is absent; run the preprocessing pipeline first |
| `integration` | Talks to real infrastructure (Supabase) | Opt-in: `RUN_INTEGRATION=1` |

## Performance assertions

Timing limits are checked through the `assert_perf` fixture and are **not enforced by
default**, because shared CI machines are noisy. Enable them explicitly:

```powershell
$env:HARGAWATCH_PERF_ASSERT = "1"
.\.venv\Scripts\python.exe -m pytest tests\test_statistical_models_stress.py
```

Functional assertions (bounds, shapes, monotonicity) always run regardless of this flag.

## Conventions

- Network calls and Telegram/Supabase access are mocked or gated; the default `pytest`
  run must not touch live services.
- Tests call production code paths (`preprocessing_final`, `scrape_data.main`,
  `ForecastEngine`, ...) rather than re-implementing their logic, so regressions are
  actually detected.
- Random data uses a local `np.random.default_rng(seed)` instead of mutating the global
  NumPy seed.
