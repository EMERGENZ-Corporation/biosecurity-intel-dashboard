# Implementation brief: CDC NWSS → host-city observation ingestion

**Audience:** an agent or developer picking this up cold. You do not need prior
conversation context — everything required is below.
**Status:** SPEC ONLY. Nothing in this document is built yet.
**Scope owner:** start by invoking `pipeline-router`, then this is primarily
`architecture-agent` (schema/validator contract) → `test-agent` →
`deployment-agent` (the scheduled workflow), with `source-integrity-agent` +
`content-standards-agent` sign-off on the writer contract.

---

## 1. Goal

The **FIFA 2026 / Host City BioSignals** page (`/host-cities`,
`src/pages/HostCityBioSignals.tsx`) currently shows 13 of 16 host cities as
*monitored* (CDC NWSS for the 11 US cities, PHAC for Toronto/Vancouver) but with
**zero observations**, so every domain renders "No current data". Per-city
status is **derived** from `publicDisplayAllowed:true` observations
(`src/utils/hostCityBioSignals.ts`).

This task: build a **deterministic, source-bound ingestion script** that reads
the public **CDC NWSS** API and produces real host-city observations so US tiles
show actual respiratory wastewater status (Normal / Elevated) instead of
"No current data" — **without fabricating anything** and **without breaking the
human review gate**.

## 2. Why a script is needed (and the hard constraint that shaped it)

The NWSS, WastewaterSCAN, and PHAC web dashboards are JS-rendered — `WebFetch`
returns only UI chrome, no values. CDC publishes the same NWSS data through a
**stable public Socrata API on `data.cdc.gov`**, which IS machine-readable. An
official API with a stable pattern is the legitimate ingestion path (it is not
the "scraper for sources without a stable public data pattern" that
`CONTENT-STANDARDS` / the original feature scope prohibits).

**Non-negotiable (CONTENT-STANDARDS §4.1/§4.2):** never fabricate. If the API
does not return a confident value for a state/week, **skip** that observation —
leave the domain at "No current data". A `null`/absent observation is always
preferable to a guessed status.

## 3. Read these first (existing code you must mirror, not reinvent)

| File | Why |
|---|---|
| `scripts/promote-news-to-timeline.mjs` | **THE pattern to copy.** It is the repo's only other automated curated-data writer. Mirror its contract: deterministic, provenance-tagged, append-only, strict allowlist, traceability fields, zero-result runs write nothing, bot-identity commit. |
| `CONTENT-STANDARDS.md` §3.4, §4.4, §4.6 | Curated-field rules + the existing auto-writer contract for the timeline. You will add an analogous §4.x for this writer. |
| `src/types.ts` (`HostCityObservation`) | The observation shape you must produce. |
| `src/utils/hostCityBioSignals.ts` | Derivation. Note `publicObservations()` filters `publicDisplayAllowed === true`; the status/severity mapping the rollup expects. |
| `scripts/validate-data.mjs` (host-city block) | You will extend it with `provenance` rules. |
| `scripts/test-validate-data.mjs` | Add regression tests here (the suite already has 11 host-city cases + auto-timeline cases to copy from). |
| `scripts/review-digest.mjs` (gate G21) | Already surfaces `publicDisplayAllowed:false` observations as "awaiting publish review" — your staged writes plug into this for free. |
| `src/data/host-city-biosurveillance.json` | Write target. |
| `src/data/signal-sources.json` (`cdc-nwss`) | The Tier 1 source every observation must cite. |

## 4. Data source

- **API:** Socrata — `https://data.cdc.gov/resource/<DATASET_ID>.json` with SoQL
  params (`$where`, `$select`, `$order`, `$limit`). JSON. An app token
  (`$$app_token`, env var, never committed) raises rate limits but is optional.
- **DATASET_ID — VERIFY BEFORE USE.** IDs/columns change. Confirm the current
  dataset from the NWSS "About Data" page (`https://www.cdc.gov/nwss/about-data.html`)
  and the `data.cdc.gov` catalog. Known candidates as of mid-2026 (treat as
  starting points, not gospel):
  - `2ew6-ywp6` — NWSS Public SARS-CoV-2 Wastewater Metric Data (site-level, continuous metric).
  - Search the catalog for the **state-level respiratory-virus "wastewater viral
    activity level"** dataset (the categorical very-low→very-high metric shown on
    the public dashboard) for SARS-CoV-2, Influenza A, and RSV. This categorical
    level is what you want — it maps cleanly to observation status.
- **Granularity:** NWSS public activity levels are **state-level**. Each US host
  city maps to its `regionOrState`. Data updates **weekly (Fridays)**.
- **Provenance:** the human-facing citation URL per observation is the state
  deep link, e.g. `https://www.cdc.gov/nwss/rv/COVID19-statetrend.html?stateval=Georgia`
  (and the InfluenzaA / RSV equivalents). Use these for `sourceUrl`.

## 5. What the script writes (observation shape)

For each US host city × tracked pathogen (SARS-CoV-2, Influenza A, RSV), emit
**at most one** observation for the latest data week:

```jsonc
{
  "id": "auto-nwss-<cityId>-<pathogenSlug>-<weekEndISO>",   // deterministic
  "hostCityId": "<cityId>",                  // must match parent city
  "domain": "respiratory",
  "pathogenOrSyndrome": "SARS-CoV-2 (wastewater)",          // / "Influenza A (wastewater)" / "RSV (wastewater)"
  "observationType": "wastewater",
  "status": "<derived, see §6>",
  "severity": "<derived, see §6>",
  "confidence": "official",                  // NWSS is Tier 1
  "sampleDate": "<NWSS data week end, ISO>",
  "reportDate": "<NWSS publish date if available, else week end>",
  "sourceId": "cdc-nwss",                    // must resolve in signal-sources.json
  "sourceUrl": "https://www.cdc.gov/nwss/rv/COVID19-statetrend.html?stateval=<State>",
  "lastVerified": "<run date, ISO>",
  "summary": "NWSS wastewater viral activity level for <State>: <level> (week of <date>).",
  "publicDisplayAllowed": false,             // STAGED — never auto-published
  "provenance": "auto-nwss"                  // NEW field, see §7
}
```

**Idempotency:** on each run, for every (city, pathogen), remove prior
`provenance:"auto-nwss"` observations and write only the latest week's. Never
touch observations without `provenance:"auto-nwss"` (those are curated/human).

## 6. Activity-level → status/severity mapping (tunable; get content-standards sign-off)

| NWSS viral activity level | `status` | `severity` |
|---|---|---|
| Very High | `elevated` | `concern` |
| High | `elevated` | `watch` |
| Moderate | `normal` | `monitor` |
| Low / Very Low / Minimal | `normal` | `monitor` |
| Limited/No Data | **skip the observation entirely** (leave domain "No current data") |

Conservative by design — only High/Very High raise a tile. Week-over-week
**trend** (`increasing`/`decreasing`) is an optional later enhancement (requires
pulling two consecutive weeks); v1 may use level→status only.

## 7. Governance: the automated-writer contract (mirror the timeline promoter)

`host-city-biosurveillance.json` is curated/human-write-only
(`CONTENT-STANDARDS.md §3.4`). This script becomes the **only** automated writer
permitted to append to it, under a strict contract analogous to
§4.6 (the news→timeline promoter):

- **Staged only.** Every auto observation has `publicDisplayAllowed: false`. The
  script **NEVER** sets it to `true`. A human reviews against the source and
  flips it (then the tile derives a real status). `review-digest.mjs` gate G21
  already lists these as "awaiting publish review".
- **Provenance required.** Add `provenance?: 'curated' | 'auto-nwss'` to
  `HostCityObservation` in `src/types.ts`. Absent = curated (default).
- **Tier 1 hard-resolve.** `sourceId` must be `cdc-nwss` and resolve to a Tier 1
  entry in `signal-sources.json`, or skip.
- **Never overwrites human curation.** Only replaces prior `auto-nwss`
  observations; never edits/deletes curated observations or any city identity
  field, `sourceIds`, or `sourceCoverageSummary`.
- **Deterministic, no AI.** Values are mapped verbatim from the API.
- **Fail-open / atomic.** On any API error, malformed payload, or unmapped
  value: write nothing for that item. A run that yields zero observations writes
  **no file change** and makes no commit (§4.4).
- **Bot identity.** The scheduled workflow commits as
  `EMERGENZ Data Bot <bot@emergenz.org>` (§3.1).
- **`id` prefix `auto-nwss-` required** (validated, like the timeline `auto-` prefix).

### Validator additions (`scripts/validate-data.mjs`, host-city block)

When `observation.provenance === 'auto-nwss'`, additionally require/enforce:
- `publicDisplayAllowed === false` (auto content can never be pre-published),
- `sourceId === 'cdc-nwss'` and it resolves to a Tier 1 source,
- `id` starts with `auto-nwss-`,
- `domain === 'respiratory'`, `observationType === 'wastewater'`,
- a valid `sampleDate` or `reportDate`.
Invalid `provenance` values rejected. Add regression tests mirroring the
`auto-event-*` timeline tests in `scripts/test-validate-data.mjs`.

### Docs

Add a `CONTENT-STANDARDS.md` §4.x ("Auto-ingested host-city observations
(deterministic)") stating the contract above, and note the writer in
`status.json automation.dataWriters` if `generate-status.mjs` enumerates writers.

## 8. Scheduling

Add `.github/workflows/ingest-nwss-host-cities.yml`: run weekly (e.g. Saturday,
after Friday NWSS update), `node scripts/ingest-nwss-host-cities.mjs`, then
`npm run validate:data`; commit only if the file changed, as the bot identity.
Provide a `--dry-run` flag that prints the diff without writing. Optional
`NWSS_APP_TOKEN` repo secret for rate limits.

## 9. Constraints (non-negotiable — restated)

1. Never fabricate or infer. Skip on missing/ambiguous values.
2. Never set `publicDisplayAllowed: true` — staging only; humans publish.
3. Never modify curated observations, city identity, `sourceIds`, or summaries.
4. Tier 1 (`cdc-nwss`) only. Verify the dataset/columns before relying on them.
5. Deterministic; no AI at ingestion time.
6. Zero-result/error runs change nothing.
7. US host cities only (state-level NWSS). PHAC/Canada and Mexico are out of scope
   here (different/absent APIs). WastewaterSCAN (site-level) is a possible separate
   follow-on.

## 10. Acceptance criteria

- `node scripts/ingest-nwss-host-cities.mjs` writes only `auto-nwss`,
  `publicDisplayAllowed:false` observations bound to `cdc-nwss` with a real
  `sourceUrl` + week date; never publishes.
- `npm run validate:data` and `npm run test:validators` pass, including new
  `auto-nwss` provenance tests.
- `node scripts/review-digest.mjs` lists the staged observations under
  "awaiting publish review" (gate G21).
- After a human flips one observation to `publicDisplayAllowed:true`, the
  corresponding US tile derives a real status (verify on `/host-cities`).
- `npm run build` passes; no fabricated values anywhere.
- `CONTENT-STANDARDS.md` updated; HANDOFF.md entry in the same commit.

## 11. Out of scope (do not build here)

A prediction model; any auto-publish path; WastewaterSCAN/PHAC/Mexico ingestion;
non-respiratory domains; editing the derivation/UI (staged observations are
already excluded from display by `publicObservations()` — no UI change needed).
