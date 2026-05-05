# Regional Trade — Investigation Notes & Parked State

**Status as of 2026-05-05:**
- **Singapore Trade tab — DONE.** The SG-dependence-on-ME-fuels story is
  built and live (6 wide cards, one per SITC code, each with a
  100%-stacked partner-share bar + a red ME-affected aggregate line).
  Sourced from `trade_singstat`. See `page_layouts.py` → `singapore`
  → `trade` tab.
- **Singapore Trade tab — EXPORTS section DONE (added 2026-05-05).**
  Three cards under one parent ("Singapore exports — regional
  dependence"): industrial chemicals (SITC 5 less 51 less 54), oil
  (SITC 3), refined petroleum products (SITC 334). Each pairs annual
  % shares (left) with monthly levels (right) over the 10 regional
  destinations + "Others" residual. Sourced from the SingStat sheet
  tabs `SG_Chemicals_DX`, `SG_TotalOil_DX`, `SG_Petroleum_DX`.
- **Regional Trade tab — CHEMICALS + REFINED PETROLEUM DONE.** Single
  view-selector section with two product views (refined petroleum is
  the default lead, chemicals is the secondary view). Each view shows:
  (1) cross-country `country_share_comparison` ranking by 2024 SG
  share; (2) 10 per-country monthly cards from
  `regional_{chem,fuel}_imports_from_sg_<iso2>`. Annual shares from
  Comtrade 2023+2024; monthly levels from SingStat. See `page_layouts.py`
  → `regional` → `trade` tab.
- **Regional Trade tab — ME-SUPPLIER DEPENDENCE TABLED.** The "regional
  countries' dependence on ME suppliers" story (the second half of the
  original D3 scope) is data-incomplete. Audit findings + decision:
  see §7d.

---

## 1. What we set out to build

Two complementary "exposure" stories on the dashboard's Trade tabs:

| Page | Story | Source(s) |
|---|---|---|
| Singapore Trade | SG's *dependence on the Middle East* for mineral fuels — what % of SG's mineral fuel imports come from each ME supplier | SingStat sheet (`SG_Annual_Imports`, `SG_Monthly_Imports` tabs) — already ingested into `trade_singstat` |
| Regional Trade | Each regional country's *dependence on Singapore* for chemicals + *dependence on the Middle East* for mineral fuels — what % of country X's chemical imports come from SG, and what % of country X's mineral-fuel imports come from ME | UN Comtrade — partial ingestion infrastructure built but not run |

The shared design pattern: **partner-share of imports**, computed as
`partner_value / world_value × 100` per (reporter, year, SITC code, partner).

---

## 2. Data we already have

### `trade_singstat` (populated, used by current dashboard cards)

3,832 rows across the three trade tabs of the colleagues' "dashboard data v2"
Google Sheet:

| Tab | Content | Rows |
|---|---|---|
| `SG_Annual_Imports` | SG mineral fuel imports by source country, annual 2023–25, with SITC sub-code breakdowns (3 / 333 / 334 / 335 / 343) | 935 |
| `SG_Monthly_Imports` | Same, but monthly (Apr 2025 onwards) | 2,081 |
| `SG_Chemicals_DX` | SG chemical exports (SITC 5) by destination country, hybrid annual 2023–25 + monthly 2026 | 816 |

Schema in `src/db.py` (lines around `CREATE TABLE trade_singstat`).
Columns: `period, frequency, flow, product_code, product_label,
partner_name, partner_iso2, partner_display, value_sgd_thou`.

The Regional Trade tab currently shows 10 per-country chemical-import
panels derived from `SG_Chemicals_DX` (we set this up before pivoting to
the dependence-ratio story).

The Singapore Trade tab now surfaces the `SG_Annual_Imports` and
`SG_Monthly_Imports` data via 6 wide cards (one per SITC code:
3 / 333 / 334 / 343 / 3346043 / 3431000), each with two side-by-side
subcharts: annual ME-supplier shares (UAE, Saudi, Qatar, Kuwait, Iraq,
Oman) on the left and monthly stacked levels on the right. Iran is
absent (sanctions; SG doesn't import from Iran). Tasks #41–43.

### `trade_comtrade_dep` (schema exists, table empty)

Created during this investigation, populated by zero ingest runs to date.
Schema:

```sql
CREATE TABLE trade_comtrade_dep (
    period          TEXT NOT NULL,    -- "YYYY-12-31" annual
    reporter_iso2   TEXT NOT NULL,
    partner_iso3    TEXT NOT NULL,    -- Comtrade ISO3, "W00" = World
    partner_name    TEXT NOT NULL,
    sitc_code       TEXT NOT NULL,    -- '5','51','54','3','333','334','343'
    value_usd       REAL NOT NULL,
    PRIMARY KEY (period, reporter_iso2, partner_iso3, sitc_code)
);
```

Plus indexes on reporter, partner, and sitc.

### Helpers in `src/db.py`

- `upsert_comtrade_dep_partition(conn, period, reporter_iso2, sitc_code, rows)`
  — wipes and rewrites one (period, reporter, sitc) partition. Idempotent.
- `comtrade_dep_partition_exists(conn, period, reporter_iso2, sitc_code)`
  — used by the ingestor's `only_stale` flag for resumable runs.

### Ingestor in `scripts/energy/update_data.py`

`fetch_comtrade_regional_dep(conn, only_stale=True)` — fetches
10 reporters × 7 SITC codes × 3 years = 210 calls with retry/backoff,
1.5s polite gaps, and resumable behaviour. The `[4b]` step in `main()`
that calls it is currently **commented out** — see `# [PARKED]` markers.

---

## 3. Investigation log — what we tried, what worked, what didn't

### Attempt 1: SingStat Table Builder for partner-level chemicals exports

**Hypothesis:** SingStat's M45xxxx tables would expose chemicals exports
broken down by partner country, monthly, going back to 2023.

**Probe:** `scripts/probe_singstat_chemicals.py`

**Finding:** The 9 working M45xxxx tables (M451001, 21, 31, 41, 51, 61,
71, 81, 91) all expose trade by *commodity* (SITC chapter / division /
group) but **none have a partner dimension**. SingStat organises trade
data either by commodity OR by country, never both at once.

**Implication:** SingStat alone can give us SG-aggregate chemical exports
by SITC chapter (M451041 specifically — Domestic Exports × 2-digit SITC,
1976→2026 monthly), but for the per-country breakdown we need a
different source.

This means the colleagues' `SG_Chemicals_DX` sheet must be aggregating
from a non-public-API source (probably TradeXplorer or an Enterprise
Singapore back-end). We can't replicate it ourselves from public APIs.

### Attempt 2: Comtrade SITC-Annual mode for regional dependence

**Hypothesis:** UN Comtrade has bilateral trade for the 10 regional
reporters (their imports broken down by partner), in SITC Rev 4 mode to
match the sheet's classification.

**Probe:** `scripts/probe_comtrade_regional_chem.py` (with multiple
revisions — see commits)

**Findings:**

1. **First run (SITC monthly, 2026 freshness check):** all reporters
   either returned `NO_DATA` or got rate-limited. Concluded that SITC
   monthly mode is patchy — many reporters only file monthly in HS, with
   SITC available only at annual frequency. Switched to SITC annual.

2. **Second run (SITC annual, sample years 2023/24/25):** values came
   back **mathematically impossible** (India 2024 SG share = 376%,
   Indonesia 2024 = 3,425,709%). Sensible values for some countries
   (China 2.82%, Japan 1.88%, Korea 2.49%).

3. **Diagnostic probe** (`scripts/probe_comtrade_world_aggregation.py`):
   Identified that `partnerCode=0` returns 173 rows for India 2024
   (instead of one "World" aggregate row) because Comtrade splits the
   response along the `partner2Code` dimension (secondary partner /
   re-routing classification). Our previous probe took `data[0]` which
   was an arbitrary row, not the World total. Sum across all 173 rows
   gave **$157.68B** = sensible India total chemical imports.

4. **Confirmed**: `isAggregate=True, aggrLevel=1, motCode=0,
   customsCode=C00` for all 173 rows — they're already chapter-level
   aggregates. Sum-all is the right strategy. SG share = $4.87B / $157.68B
   = **3.09%** for India 2024. Plausible.

### Attempt 3: All-partners-per-call ingest design

**Insight:** Querying with no `partnerCode` filter (plus
`partner2Code=0` to collapse the secondary-partner dimension) returns
one row per partner in a single call — much more quota-efficient than
per-partner queries.

- Quota math: 10 reporters × 7 SITC × 3 years = **210 calls** total
- Each call returns ~50–200 partner rows
- Final table size estimate: ~30k rows in `trade_comtrade_dep`

Schema designed to preserve raw partner detail so the renderer can
compute *any* share you want at chart time (ME aggregate / SG / China /
US / Other / etc.) without re-ingesting.

### Attempt 4: 2025 coverage check — the blocker

Earlier probe coverage at year-level showed:

| Reporter | 2023 | 2024 | 2025 |
|---|---|---|---|
| China | ✓ | ✓ | ∅ |
| India | ✓ | ✓ | ∅ |
| Indonesia | ✓ | ✓ | ✓ |
| Japan | ✓ | ✓ | ✓ |
| Malaysia | ✓ | ✓ | ✓ |
| Philippines | ✓ | ✓ | ∅ |
| South Korea | ✓ | ✓ | ∅ |
| Taiwan | ✓ | ✓ | ∅ |
| Thailand | ✓ | ✓ | ∅ |
| Vietnam | ✓ | ∅ | ∅ |

Only 3 of 10 countries had 2025 SITC-annual data published as of
2026-04-29. The 7 missing reporters publish on different lags; some
won't have 2025 in Comtrade until late 2026.

**This is what parked the work.** With only 3-of-10 coverage for 2025,
the dependence chart would render visually inconsistent (3 bars for
some countries, 2 for others), undermining the cross-country comparison
the dashboard is supposed to enable.

---

## 4. What was built — current state (post-resume, 2026-05-05)

### Schema

`trade_comtrade_dep` table + 3 indexes, created via `init_db()` in
`src/db.py`. **Populated** with ~10k rows: 10 reporters × 7 SITC ×
2 years (2023, 2024). Vietnam 2024 still empty — Comtrade hasn't
published; auto-retried on every pipeline run via `only_stale=True`.

### Helpers

`upsert_comtrade_dep_partition` and `comtrade_dep_partition_exists`
in `src/db.py`. Both used by the live ingestor.

### Ingestor — running in pipeline as `[4b]`

`fetch_comtrade_regional_dep(conn, only_stale=True)` in
`scripts/energy/update_data.py`. Behaviour:

- Iterates 10 reporters × 7 SITC × 2 years (2025 dropped at parking
  time; see §5.1)
- Per-call: query Comtrade with no partner filter + `partner2Code=0`,
  sum returned rows by partner_iso3, write to DB
- `only_stale=True`: skips (reporter, sitc, year) partitions already
  present in the DB → restartable across days when rate-limited
- **Empty responses are NOT marked as ingested** — important, because
  some reporters (e.g. Vietnam) publish late, so we want subsequent
  runs to retry the empties once Comtrade catches up
- Live progress printed per call (partner count, World total, SG share)
- **Coverage matrix** printed at end showing reporter × year completeness

### Derivations

In `src/derived_series.py`, called from `update_data.py` `[4c]`:

- `compute_regional_chem_share_from_sg(conn)` — emits
  `regional_chem_share_from_sg_<iso2>` (10 series, annual 2023-24)
- `compute_regional_fuel_share_from_sg(conn)` — emits
  `regional_fuel_share_from_sg_<iso2>` (10 series, annual 2023-24,
  SITC 334 only)

Plus monthly companion derivations in `[3c.b]` (sourced from
`trade_singstat`, not Comtrade):

- `compute_regional_chem_levels(conn)` →
  `regional_chem_imports_from_sg_<iso2>`
- `compute_regional_fuel_levels(conn)` →
  `regional_fuel_imports_from_sg_<iso2>`

### Renderer

The Regional Trade tab uses the existing `view_selector` +
`country_share_comparison` + `chart_grid` section types — no new
section type was needed. Decision recorded in §5.4: pre-derive ratios
as `time_series` rows.

### Documents

- `METHODOLOGY.md` — high-level project narrative
- `REGIONAL_TRADE_NOTES.md` — this file

### Probes (kept in `scripts/`)

- `probe_singstat_chemicals.py` — verified SingStat has no partner dim
- `probe_comtrade_regional_chem.py` — initial coverage probe (HS+SITC)
- `probe_comtrade_world_aggregation.py` — diagnosed the 173-row issue

### What's NOT done (and may stay that way)

- **ME-supplier dependence story** — see §7d. Data in
  `trade_comtrade_dep` supports it, but coverage is too patchy to ship.
- **2025 / 2026 data** — `COMTRADE_DEP_YEARS` is still
  `["2023", "2024"]`. Bump when Comtrade publishes.
- **HS-Annual ingest** as an alternative to SITC-Annual — never probed;
  may be worth revisiting if 2025 SITC coverage stays thin.

---

## 5. Open questions / known issues

### 5.1 The 2025 coverage gap

We resumed in 2026-04-30 by **dropping 2025 entirely** (option A
below) — `COMTRADE_DEP_YEARS = ["2023", "2024"]`. Bump when Comtrade
catches up; the ingest will fill new partitions on the next run.

Options that were considered:

- **A. Drop 2025 entirely** — show 2-bar baselines (2023, 2024) for all
  10 countries. Visually consistent; loses one data point. **Chosen.**
- **B. Probe Comtrade HS-Annual mode** — many reporters file faster in
  HS than SITC; ~30 min probe, may give us 2025 coverage for the
  missing 7 reporters. HS↔SITC mapping noise is small at chapter
  boundaries (SITC 5 ≈ HS 28-39, SITC 51 ≈ HS 29, SITC 54 ≈ HS 30;
  ~2-3% drift). **Not pursued; revisit if 2025 SITC coverage stays
  thin into late 2026.**
- **C. CEIC for fresher reporter-level aggregates** — CEIC often has
  reporter trade aggregates faster than Comtrade. But CEIC's
  *bilateral* coverage (X reports trade with Y) is patchier than its
  aggregate coverage; may not give us the partner detail we need.
  **Not pursued.**

### 5.2 SITC↔HS mapping if we go HS

(Reference table for option B, not currently in use.)

| SITC | HS chapter(s) |
|---|---|
| 5 (chemicals total) | 28–39 |
| 51 (organic) → exclude | 29 |
| 54 (pharma) → exclude | 30 |
| 5 less 51 less 54 | 28 + 31–39 |
| 3 (mineral fuels) | 27 |
| 333 (crude petroleum) | 2709 |
| 334 (refined petroleum) | 2710 |
| 343 (natural gas) | 2711 |

### 5.3 ME partner set

For the SG-dependence story (which is what shipped), the ME partner
set isn't directly used — the chart shows SG share as numerator and
World as denominator. The ME partner set is only relevant for the
ME-supplier dependence story tabled in §7d.

For that future work, the canonical 6-affected-countries set is:
**UAE, Saudi Arabia, Qatar, Iraq, Kuwait, Bahrain** (matches the
Singapore Trade tab's red-line aggregate). Oman and Iran can be
included for context; both have caveats — Oman is a smaller exporter,
Iran is sanctions-affected so most counterparties don't report it.
All partners are kept in `trade_comtrade_dep` so re-aggregating to a
different ME set is a renderer-only change.

### 5.4 Renderer pattern decision — RESOLVED

We chose to pre-derive ratios as `time_series` rows
(`regional_{chem,fuel}_share_from_sg_<iso2>`). The existing
`country_share_comparison` and `chart_grid` section types consume
them with no renderer changes. The alternative (`trade_dep_grid`
section type querying `trade_comtrade_dep` directly) is unbuilt and
no longer needed for the current scope; revisit if a future use case
requires runtime aggregation across partner sets.

---

## 6. Resume history (what was done after parking)

The resume plan above was executed in 2026-04-30 → 2026-05-05. For the
historical record:

1. **Comtrade HS-Annual probe** — not run; we accepted dropping 2025
   from `COMTRADE_DEP_YEARS` instead of switching classifications.
2. **`[4b]` re-enabled** in `update_data.py` 2026-04-30; runs every
   pipeline pass with `only_stale=True`.
3. **Ingest run** — produced ~10k rows in `trade_comtrade_dep` covering
   10 reporters × 7 SITC × 2 years (2023, 2024). Vietnam 2024 still
   missing as of 2026-05-05 (Comtrade hasn't published — auto-retries
   on every run).
4. **Derivations built**: `compute_regional_chem_share_from_sg`,
   `compute_regional_fuel_share_from_sg`, `compute_regional_chem_levels`,
   `compute_regional_fuel_levels` — all in `derived_series.py`, all
   running in steps `[3c.b]` and `[4c]` of the pipeline.
5. **Regional Trade tab wired** with the view-selector pattern: refined
   petroleum (default) + industrial chemicals. Annual share comparison
   on top of each view, 10-country monthly cards underneath.

See §7d for what was attempted after that and tabled.

---

## 7. Quota & runtime reference

- **Comtrade Plus free tier**: ~250 calls/day with API key
- **Full ingest runtime**: 210 calls × 1.5s polite gap + ~1-2s network ≈
  10-12 min when fresh; faster when most partitions are skipped via
  `only_stale`
- **DB size impact**: ~30k rows in `trade_comtrade_dep`, well under 1
  MB. No concerns.

---

## 7a. Upstream cleanup candidate — shipping nowcast JSON

While building the Singapore Shipping tab (2026-04-29) we discovered that
the `nowcast_results_s13.json` file exposes the per-port-call count under
both `country:<C>_imports_<vt>_calls` and `country:<C>_exports_<vt>_calls`
keys — and the values are bit-identical (verified
`max |export_actual - import_actual| = 0.0000` for tanker, container, and
dry_bulk). PortWatch's underlying data has only one calls statistic per
(port × day × vessel type); the upstream pipeline is duplicating it under
both labels for symmetry.

The existing shipping-nowcast dashboard handles this by canonicalising on
the exports key (see `_vps_pull/shipping-nowcast-pipeline/scripts/build_nowcast_dashboard.py`
line 2119). The Iran Monitor consumer-side fix does the same.

**Possible upstream cleanup**: have the nowcast pipeline emit calls under
ONE key (drop the `_imports_calls` duplicate). Trade-offs:
- Saves ~50% of the JSON's calls-related rows
- Risk: any other consumer using the `_imports_calls` key would break
- Need a coordinated rollout across consumers
- Out of scope for the Iran Monitor session — flagging here for whenever
  someone next touches the `shipping-nowcast-pipeline` codebase.

### 7a.1 Tanker tonnage naming quirk (related)

Initial assumption was that the JSON had no tanker tonnage data — wrong.
Tracing through `nowcast_pipeline.py:1821-1827`:

```python
for vt_key, vt_col in VESSEL_TYPES:
    tonnage_col = f"{import_or_export}_{vt_col}"   # "import_tanker"
    if tonnage_col in df.columns:
        agg_specs[f"{vt_key}_tonnage"] = (tonnage_col, "sum")
        label_suffix = "_tonnage" if vt_key == "tanker" else f"_{vt_key}_tonnage"
        metric_labels[f"{vt_key}_tonnage"] = f"{slug}{label_suffix}"
```

The `label_suffix` line short-circuits the suffix for tanker — so tanker
tonnage gets emitted under `country:singapore_<dir>_tonnage` (no
`_tanker_` infix) while all other vessel types use the suffixed
`country:singapore_<dir>_<vt>_tonnage` pattern. This is confusing because
the un-suffixed key reads like "total" when in fact it's tanker-only.

Verified by cross-check against raw CSV: sum of weekly actual values
≈ raw `sum(import_tanker)` ÷ 7 (weekly mean of daily port-summed values
× 7 days/week recovers the daily total). Numbers match within rounding,
confirming the un-suffixed key is genuinely tanker-specific.

The original shipping-nowcast dashboard already handles this in
`build_nowcast_dashboard.py:1992-1994` (special-cases tanker to use the
un-suffixed key). Iran Monitor's `derived_series.compute_singapore_shipping_nowcast`
matches that convention.

**Possible upstream cleanup**: rename the emitted key to
`country:<C>_<dir>_tanker_tonnage` for consistency with the other 4
vessel types. Same coordination caveats as 7a — any downstream
consumer expecting the un-suffixed key would break.

---

## 7b. Bug fixed — W00 double-counting in the dependence derivation

When `compute_regional_chem_share_from_sg` first ran (2026-04-30) it
produced shares that were ~half of what the Comtrade ingest log had
shown (e.g., Malaysia 2024 SITC 5: log said 11.74%, derivation said
5.67%).

**Cause:** `trade_comtrade_dep` stores BOTH the `W00` (Comtrade-supplied
"World" aggregate) row AND rows for every individual partner. The
individual partner values sum to the same total as W00, so summing
"all partner rows" double-counts the world.

**Fix:** the derivation now uses the `W00` row directly as the
denominator instead of summing `partner_industrial.values()`. See
`compute_regional_chem_share_from_sg` in `derived_series.py`.

**Watch for:** any future derivation that reads `trade_comtrade_dep`
and tries to compute totals must either (a) use the W00 row directly,
or (b) explicitly filter `partner_iso3 != 'W00'` when summing partners.
The redundancy is intentional — keeping both rows gives us flexibility
to compute partner-specific shares without re-fetching.

---

## 7c. Mineral fuels regional dependence — DONE (was §7c PARKED)

This was parked 2026-04-30 because the chemicals card pairs annual
Comtrade shares with monthly SingStat absolute imports, but no
`SG_Fuel_DX` equivalent existed for refined petroleum at parking time.

**Unblocked 2026-05-05.** The colleague's feed landed:
- `SG_Petroleum_DX` (SITC 334 — refined petroleum monthly exports by
  destination) was added.
- `SG_TotalOil_DX` (SITC 3 — total mineral-fuels-chapter monthly
  exports by destination) was added in the same batch.

`compute_regional_fuel_share_from_sg` + `compute_regional_fuel_levels`
were wired into the pipeline (`[3c.b]` and `[4c]`), and the Regional
Trade tab now shows refined petroleum as the default view of the
view-selector. SITC 3 versions exist in the DB but aren't displayed
on the Regional Trade tab today (only on the Singapore Trade tab's
exports section).

**Final SITC scoping decision:**
| SITC | What | Status on Regional Trade tab |
|---|---|---|
| 3   | Mineral fuels TOTAL | Available in DB; not displayed (refined petroleum tells the cleaner story) |
| 333 | Crude petroleum     | ≈0% across the board (SG has no crude output) — never displayed |
| 334 | Refined petroleum   | **Displayed.** Indonesia 53%, Malaysia 34%, others 6-10%. |
| 343 | Natural gas         | ≈0% across the board (SG isn't a gas exporter) — never displayed |

---

## 7d. ME-supplier dependence on regional side — TABLED (2026-05-05)

The original D3 scope had two halves:
1. Each regional country's dependence on Singapore for chemicals + fuels
   → DONE (§7c).
2. Each regional country's dependence on the **6 affected Middle East
   countries** (UAE, Saudi Arabia, Qatar, Iraq, Kuwait, Bahrain — plus
   Oman and Iran for context) for crude / refined petroleum / gas.
   → **TABLED.**

The data sits in `trade_comtrade_dep` already — every individual
partner row is stored, including the ME suppliers. So no new ingest
is needed; just a `compute_regional_fuel_share_from_me(conn)`
derivation and a new view in the existing view-selector. **But** the
data we have is too patchy to ship a credible cross-country, cross-SITC
view.

### Audit (run 2026-05-05 against `trade_comtrade_dep`)

**Years covered:** 2023 + 2024 only. No 2025 (Comtrade hadn't
published at parking time and the `COMTRADE_DEP_YEARS` constant still
lists `["2023","2024"]`); no 2026 (too early). Most recent data point
would already be ~16 months stale in any chart.

**Coverage holes by SITC:**

| Issue | Detail |
|---|---|
| **Vietnam 2024** | 0 rows across all SITC. Today's pipeline log still flagged 7 EMPTY responses for VN/2024 ("will retry on next run"). |
| **Indonesia + Malaysia natural gas (SITC 343)** | Zero rows for both reporters across both years. Both are net LNG exporters so their gas-import side is genuinely tiny / not reportable. |
| **SITC 343 broadly thin** | Only ARE, QAT, OMN show up consistently for the reporters that have any 343 data at all. PH/VN have nothing. |
| **Iran (IRN)** | Mostly absent — sanctions effect, most counterparties don't report Iranian crude / refined-petroleum trade. Only present for CN, IN, ID (totals) and sporadic SITC 334 cases. |
| **Bahrain crude (SITC 333)** | Sparse — most reporters don't break BHR out separately. |

**Per-SITC ship-ability:**
- **SITC 3** (mineral fuels chapter): 9/10 reporters, good ME-partner
  coverage → ship-able as a single annual snapshot.
- **SITC 333** (crude): only the major crude importers (CN, IN, JP,
  KR, TW, TH) have meaningful coverage; PH/VN don't import crude.
- **SITC 334** (refined petroleum): most reporters; IR mostly missing.
- **SITC 343** (natural gas): only CN/IN/JP/KR/TW/TH meaningful; the
  ASEAN gas exporters (ID/MY/PH/VN) have nothing.

### Decision — TABLED

We considered shipping a partial-coverage version (per-SITC card scoped
to reporters with reliable data + a "data limitations" note for
Vietnam 2024 / SITC 343 / Iran). Rejected because:

- The dashboard's overall framing is **monthly live monitoring**.
  An annual snapshot ending December 2024 would read as "old data" in
  context, even if labelled clearly.
- The cross-country comparison story breaks down with different
  reporter sets per SITC card (no consistent "10 economies" line-up).
- Gas (SITC 343), arguably the most policy-relevant ME-dependence
  story given Qatar's role, is the most data-incomplete SITC.

### To resume

1. **Wait for Comtrade 2025** to publish for at least 8/10 reporters.
   Estimated mid-to-late 2026.
2. Add `"2025"` (and probably `"2026"` annual once available) to
   `COMTRADE_DEP_YEARS` in `update_data.py`. Re-run ingest with
   `only_stale=True` — should be quick (just the new partitions).
3. **Re-audit Vietnam 2024 + 2025** before resuming. If still missing,
   either shrink the reporter set to 9 or accept VN as "no data" in
   the chart.
4. Build `compute_regional_fuel_share_from_me(conn)` in
   `derived_series.py` — sums rows for `partner_iso3 IN
   ('ARE','SAU','QAT','IRQ','KWT','BHR')` divided by the W00 row
   per (reporter, year, SITC). Emits
   `regional_{sitc}_share_from_me_<iso2>` series.
5. Add a 3rd view ("Middle East exposure") to the existing
   view-selector on `regional` → `trade`. Same `country_share_comparison`
   shape as the SG views; consider an additional stacked-by-ME-supplier
   card to show *which* ME partner dominates each reporter's exposure.

---

## 8. References

- Methodology doc: `METHODOLOGY.md` (sections 3 "Data sources", 5 "Key
  design decisions" cover trade-related infrastructure)
- DB schema: `src/db.py`
- Ingestor: `scripts/energy/update_data.py` →
  `fetch_comtrade_regional_dep`
- Investigation probes: `scripts/probe_singstat_chemicals.py`,
  `scripts/probe_comtrade_regional_chem.py`,
  `scripts/probe_comtrade_world_aggregation.py`
- Country mapping (SingStat names → ISO2): `src/country_mapping.py`
- Existing dashboard cards (chemical exports per country, from the
  SingStat sheet): see `regional` page in `src/page_layouts.py` →
  `trade` tab → "Chemical imports from Singapore" section
