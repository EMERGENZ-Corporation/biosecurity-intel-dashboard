# Dashboard Restoration Handoff Log

**Last updated:** 2026-05-21 (Tier 1 news feed hard alerts)
**Purpose:** Multi-session restoration of the biosecurity-intel-dashboard to the depth of the original hantavirus-intel-dashboard. If you are a new agent picking this up, start here.

> **Rule for any agent (including future-me):** Every change must be logged here in the same commit that ships the change. No exceptions — even one-line label renames. The user has explicitly asked that this file stay continuously current. If you forget, fix it in a follow-up commit immediately.

---

## How to maintain this file (read before editing the repo)

If you are an agent picking up work on this repo, follow these instructions every session.

### When you must update HANDOFF.md

**Before staging a commit, check whether HANDOFF.md needs an entry.** If your change:

- Adds, removes, or renames any file in `src/`, `scripts/`, `.github/workflows/`, or `public/`
- Modifies any data file (`signals.json`, `signal-sources.json`, `signal-timeline.json`, `news.json`)
- Changes any user-visible string (labels, copy, button text)
- Touches build configuration (`package.json`, `vite.config.ts`, `tsconfig.json`)
- Adds or modifies a TypeScript type, interface, or exported constant
- Updates a workflow URL, env var, schedule, or step
- Adds or removes a dependency

…then it requires a HANDOFF entry. Trivial whitespace/formatting cleanups do not.

### Where the entry goes

The file is organized as a reverse-chronological log. Add a new `## ✅ <Title> (commit <SHA-prefix>)` section immediately under the most recent shipped item. Move older items down — never delete them. Keep the **Outstanding work (backlog)** section as the tail.

### Entry structure

```markdown
## ✅ <Short title of what shipped> (commit <7-char-sha>)

<1–3 sentences describing what changed and why. Include the user's
original ask if applicable so future agents see the intent, not just
the implementation.>

**Files touched:**
- `src/path/to/file.tsx` — what changed
- `scripts/something.mjs` — what it does

<For larger shipments, add a bullet list of specifics — e.g. signal
names affected, marker counts, etc.>

**Verify:** <one-line description of how to confirm the change is live
in the browser or in test output, with an explicit path like `/map` or
a command like `npm run validate:data`>
```

### When you complete a backlog item

1. Move it from "Outstanding work (backlog)" into a new "✅ Shipped" section above (don't delete from the backlog — strike it through or rewrite as a completed item).
2. Cross-reference the commit SHA so future agents can find the diff.

### When you discover new outstanding work

Add it to the **Outstanding work (backlog)** section with:
- Why it matters (1 sentence)
- What's blocking it from being done now (if anything)
- Rough scope (small / medium / large)

### Update the timestamp

Edit the `**Last updated:**` line at the top of the file to reflect the most recent change. Format: `2026-MM-DD (short summary)`.

### Commit message convention for HANDOFF updates

When you ship a change, the commit message body should include a HANDOFF mention. Examples:

- `docs(handoff): log <feature> ship` — when HANDOFF is the only file changed (backfill)
- For combined commits, mention "HANDOFF.md updated" in the body, after the description of the code change

### What "current" means

The file should always represent the **state of main**, not work-in-progress. If you stage but don't commit, don't update HANDOFF yet. If you commit but don't push, update HANDOFF in the pending commit. The user reads this file to know what's actually deployed.

### Backfill discipline

If you discover an old commit that wasn't logged, backfill it as a separate `docs(handoff)` commit. Don't bundle backfills with new feature work.

### Stale check

At the start of every session, scan recent `git log` and compare against HANDOFF entries. If commits exist that aren't logged, backfill before starting new work.

```bash
git log --oneline -20  # check recent commits
# If any commits aren't reflected in HANDOFF.md, backfill before proceeding
```

---

---

## Background

The repository was migrated from a single-threat hantavirus dashboard to a multi-threat biosecurity scaffold in commits `f39f8a4`, `cfd08bb`, `90bd172`, and `f4ebe5c` (Mar–May 2026). The migration **stripped substantial depth** — news feed, deep clinical pages, source-attributed content blocks, US monitoring tables, EMS briefing cards, flight tracing, dark-mode map with typed markers, and a comprehensive About/Legal page.

The user wants the depth restored, **adapted for the broader multi-threat scope** (16 signals across 10 categories, not just hantavirus). All restoration work must adhere to [CONTENT-STANDARDS.md](CONTENT-STANDARDS.md).

### Deleted-content recovery points
The original hantavirus components and pages can be retrieved from git history:
- **`f4ebe5c^`** — last commit with old `scripts/update-data.mjs`, `src/components/*.tsx` (GlobalMap, USMonitoringTable, EMSBriefingCard, FlightTracingPanel, Timeline, SourceChip, ShareModal, MapLayerToggle, ContentBlock), and `src/data/*.json` (news, markers, ems-briefing, us-monitoring, flights, meta, timeline, protocols, sources, manual-overrides)
- **`90bd172^`** — last commit with old `src/pages/*.tsx` (About, Clinical, Dashboard, Genomics, News, PPE, Protocols, Sources)

To inspect: `git show <ref>:<path>` — example: `git show f4ebe5c^:src/data/news.json`

---

## Restoration plan (in order)

1. ✅ **News feed** — page + pipeline + workflow
2. ✅ **About & Legal page** — multi-threat adaptation
3. ✅ **Map** — dark CARTO + typed markers + seed data
4. ✅ **SignalDetail / ContentBlock** — per-block source attribution
5. ✅ **Overview page** — restored briefing/news/monitoring rails
6. ✅ **Sweep remaining tabs** — Timeline, Briefings, Sources, Resources, SignalCard

**All six restoration items shipped.** Future work is now polish, content deepening, or new features — see "Outstanding work" below for backlog ideas.

---

## ✅ Completed

## ✅ Tier 1 news feed hard alerts + refresh (commit pending)

Completed the intermittent-feed backlog item in line with
CONTENT-STANDARDS §6.1. The news updater now uses live official CDC, WHO, and
ECDC RSS endpoints as critical Tier 1 feeds; when any critical feed fails while
active signals exist, the script writes no `news.json`, emits
`update-news-result.json`, and exits non-zero so GitHub Actions can alert.
The update-news workflow now has `issues: write`, creates/reuses a
`news-pipeline` issue on failure, closes it on recovery, and only commits
`news.json` when the updater succeeds.

The local verification run fetched all three Tier 1 feeds successfully and
refreshed the checked-in static snapshot to 500 news items. One CBC News timeout
was recorded as a soft Tier 3 failure, which does not fail the pipeline.

**Files touched:**
- `scripts/update-news.mjs` — replaces dead WHO/ECDC feed URLs, marks WHO/ECDC critical, writes `update-news-result.json`, and exits before writing public data on critical Tier 1 failures.
- `.github/workflows/update-news.yml` — adds issue reconciliation for news pipeline failures and gates data commits on successful updater runs.
- `.gitignore` — ignores the local/workflow `update-news-result.json` diagnostic file.
- `src/data/news.json` — refreshed by `npm run update:news` after Tier 1 feed verification.
- `public/status.json` — regenerated after the news refresh.
- `HANDOFF.md` — logs the pipeline hard-alert backlog completion.

**Verify:** `npm run update:news`, `npm run generate:status`, `npm run validate:data`, `npm run build`, and `npm audit`. In the verification run, CDC/WHO/ECDC returned success and `update-news-result.json` had `criticalFailures: []`.

## ✅ Accessibility sweep: modal focus + filter semantics (commit d9ef47e)

Completed the next backlog item after the bundle split. The acknowledgment
modal now traps Tab focus inside the dialog, focuses the acceptance button on
open, returns focus on close, and handles Escape without dismissing the
required acknowledgment. Filter chip rows now expose grouped labels and pressed
state to assistive technologies across the primary filter-heavy pages.

**Files touched:**
- `src/components/AcknowledgmentModal.tsx` — adds focus trap, Escape handling, focus restoration, `aria-describedby`, and an explicit button type/ref.
- `src/pages/MapPage.tsx` — adds filter groups, button types, and `aria-pressed` to severity/category/marker-type filters.
- `src/pages/Signals.tsx` — adds filter groups and `aria-pressed` to severity/category chips.
- `src/pages/Briefings.tsx` — adds filter groups and `aria-pressed` to severity/category chips.
- `src/pages/TimelinePage.tsx` — adds filter groups and `aria-pressed` to severity/category chips.
- `src/pages/News.tsx` — adds filter group and `aria-pressed` to signal filter tabs.
- `src/pages/SourcesPage.tsx` — adds filter group and `aria-pressed` to tier filter chips.
- `HANDOFF.md` — logs the accessibility backlog completion.

**Verify:** `npm run validate:data` and `npm run build`. Manual browser follow-up: open a fresh session, Tab/Shift+Tab inside the acknowledgment modal, press Escape, and confirm filter chips announce pressed/unpressed state.

## ✅ Custom domain verification + bundle split (commit 6798844)

User reported the custom domain was resolved. Verified
`biosecurity-intel.emergenzsystems.org` now resolves to Vercel DNS, confirmed
`https://biosecurity-intel.emergenzsystems.org/status.json` returns HTTP 200,
and `npm run monitor:status` passes against the custom-domain status endpoint.

The bundle-size backlog item was addressed by lazy-loading the Overview route
and splitting React, Leaflet, signal data, and news data into stable Rollup
chunks. This reduced the app-shell entry chunk from **928.90 kB / 297.83 kB
gzip** to **18.23 kB / 6.39 kB gzip** and removed Vite's >500 kB chunk warning.

**Files touched:**
- `src/App.tsx` — lazy-loads the Overview route so large route/data imports stay out of the app shell.
- `vite.config.ts` — adds `manualChunks` for `react-vendor`, `map-vendor`, `signal-data`, and `news-data`.
- `HANDOFF.md` — logs the domain verification and bundle-size backlog completion.

**Verify:** `npm run validate:data`, `npm run build`, `STATUS_URL=https://biosecurity-intel.emergenzsystems.org/status.json MAX_STATUS_GENERATED_AGE_HOURS=24 npm run monitor:status`, and `npm audit`.

### 1. News feed (commit `b0c0753`)
- `src/pages/News.tsx` — multi-signal filter tabs, authority-color cards, signal tag chips
- `scripts/update-news.mjs` — RSS-only pipeline (17 global feeds + per-signal Google News queries), tags items with `signalIds[]`, deduplicates, caps at 200, no API keys
- `src/data/news.json` — seeded with 31 hantavirus items from history; ~200 after first pipeline run
- `.github/workflows/update-news.yml` — runs every 6h on schedule + on signal data changes
- `src/types.ts` — added `NewsItem` interface
- NavBar + App route + `update:news` script wired
- `fast-xml-parser` added as devDependency

**Verify:** `npm run update:news`, then `npm run dev` and visit `/news`.

### 2. About & Legal page (commit `0591b49`)
- `src/pages/AboutPage.tsx` — 12-card layout adapted from hantavirus version
- Cards: About This Dashboard (links CONTENT-STANDARDS.md), About EMERGENZ Corp (EIN 93-4070519, DE/CA), Who this is for, What it is not, Source provenance & tier system, Data currency & cadence, Resilience, Legal Disclaimer, Privacy, MIT License (full text), WHO Content Attribution Notice (CC BY-NC-SA 3.0 IGO), U.S. Government Content Notice (17 U.S.C. §105)
- GitHub URL updated to `biosecurity-intel-dashboard`
- Data currency clause updated for current cadence

**Verify:** visit `/about`.

### 3. Map (commit `8196828`)
- `src/types.ts` — `MarkerType` union (8 multi-threat categories), `MarkerSource`, expanded `SignalMapMarker`
- `src/utils/signals.ts` — `MARKER_TYPE_COLORS` palette, `markerRadius` helper
- `src/components/SignalsMap.tsx` — rewritten: dark CARTO tiles, CircleMarker, dark popup styling, source links in popup
- `src/pages/MapPage.tsx` — added marker-type filter row alongside severity and category, color-swatch chips, visible-marker count
- `scripts/seed-map-markers.mjs` — one-time seeder that wrote 103 typed markers across all 16 signals (hantavirus 15, Ebola 7, measles 8, mpox 7, H5 8, cholera 7, lassa 6, chikungunya 6, FIFA 8, wastewater 3–6 each, etc.)
- `src/data/signals.json` — markers field populated for all 16 signals

**Verify:** visit `/map`. Tile URL should contain `cartocdn.com/dark_all`. Marker counter shows "103 markers visible". Click marker → dark popup with type label and source links.

### 4. SignalDetail / ContentBlock (commit pending push)
- `src/types.ts` — added `SectionAttribution` interface; `SignalDetailSection` extended with optional `attribution`, `additionalAttributions[]`
- `src/components/ContentBlock.tsx` — new component: title + body paragraphs + per-block source-attribution footer with primary "Source:" row and "Also:" rows for additional sources, plus optional License badge and lastReviewed line
- `src/components/SourceChip.tsx` — restored from history; renders "Authority · Document title · Date ↗" chip
- `src/pages/SignalDetail.tsx` — `detailSections[]` now rendered via ContentBlock (was: plain `<Paragraph>` per `\n\n` split)
- `scripts/seed-section-attribution.mjs` — one-time seeder:
  - Hantavirus 5 existing sections: layered structured attribution (CDC HAN 528, NYC DOH HAN #8, NETEC, WHO DON601, etc.) onto unchanged bodyMarkdown
  - Other 15 signals: added a single "Operational guidance" / "Mass-gathering health preparedness" section with primary + 1-2 additional attributions sourced from CDC, WHO, USDA APHIS, WOAH, PAHO, ECDC, Africa CDC, WastewaterSCAN
- Total: 20 attributed sections (5 hantavirus + 15 new)

**Verify:** visit `/signals/andes-hantavirus-mv-hondius-2026` — 5 ContentBlocks each with Source: chip and Also: rows. Visit `/signals/avian-influenza-h5-2026` — Operational guidance ContentBlock with USDA APHIS source chip. `npm run validate:data` passes.

### 5. Overview page rails (commit pending push)
- `src/pages/Overview.tsx` — restructured with 7 sections plus stat strip:
  - Status strip adds **News items** stat chip alongside existing (active signals, highest severity, domains, stale signals)
  - **Active operational briefings** rail (NEW, EMERGENZ accent border) — pulls signals at severity >= concern, surfaces the `ems-specific` / `operational-guidance` / `protocols-and-guidance` section, shows severity chip, category, section title + authority, and a 2-sentence summary card. Top 3, sorted by severity rank. Each card links to the signal detail page.
  - Priority signal queue (preserved)
  - Threat domain coverage + Data currency (preserved, Data currency now also shows news item count)
  - **Latest authority & media coverage** (NEW) — 5 most-recent items from `news.json`, authority color stripe, signal chips, links external to source
  - Signal map preview (preserved, dark CARTO via SignalsMap rewrite)
  - Recent developments timeline (preserved)
- Authority color map + signal short-name map mirror the News page so chips render consistently.

**Verify:** visit `/`. Expect 7 section headers above; "Active operational briefings" shows hantavirus + concern-level signals; latest news rail shows 5 items with signal chips; mini-map renders dark tiles with 100+ markers.

---

### 6. Tab sweep (commit pending push)
- **Briefings (`/briefings`):** complete rebuild. Each signal at severity Watch+ rendered as a card surfacing its `ems-specific` / `operational-guidance` / `protocols-and-guidance` / `clinical-profile` section (whichever is present, in that priority). Card shows severity pill, category, geography, signal name link, operational relevance, a tinted preview box with section title and first 2 paragraphs + "Read full briefing →" link, and a footer SourceChip pulling from `section.attribution` (falls back to primarySourceId). Severity + category filters.
- **Timeline (`/timeline`):** event card `borderLeft` now uses the signal's severity color (was always blue). Each event includes a severity pill matching the signal. Source link replaced with a proper `SourceChip`. Added severity filter alongside category. Events grouped by month with EMERGENZ-accent month headers. Header shows event count and signal count.
- **SignalCard:** added depth indicators (markers / sections / news counts) rendered as small mono chips. Reads from `signal.mapMarkers`, `signal.detailSections`, and matches against `news.json` by `signalIds`. Counts surface signal depth at-a-glance on `/signals` and on Overview.
- **Sources (`/sources`):** added tier-breakdown summary grid at the top (Tier 1 / 2 / 3 / 4 with count and tier color); tier filter chips; per-source `borderLeft` colored by tier instead of primary/secondary; tier pill in card header. References CONTENT-STANDARDS.md §1 in the intro card.
- **Resources (`/resources`):** per-source `borderLeft` switched from primary/secondary (green/purple) to tier-colored. Result count shown in header ("N of M shown").
- **Tier color palette:** Tier 1 green, Tier 2 blue, Tier 3 yellow, Tier 4 orange. Defined identically in both SourcesPage.tsx and Resources.tsx.

**Verify:** `/briefings` shows 12 cards each with Source: footer; `/timeline` groups by month with severity stripes and SourceChip footers; `/signals` first card shows depth badges ("7 markers", "1 sections", "83 news"); `/sources` shows tier breakdown grid + tier filter (Tier 1: 19, Tier 2: 11, Tier 3: 4, Tier 4: 0); `/resources` borderLeft now tier-colored.

---

## ✅ Backlog bundle (commit pending push)

Shipped in a single safe bundle:

- **Custom domain workflows.** `status-monitor.yml` STATUS_URL and `update-data.yml` PRODUCTION_URL restored to `https://biosecurity-intel.emergenzsystems.org` now that DNS resolves.
- **RSS endpoints (`scripts/update-news.mjs`).** Removed 6 dead feeds (ProMED, Eurosurveillance, PHAC, RKI, AP News, CTV News). Added 3 known-working: CIDRAP (`cidrap.umn.edu/rss.xml` — Tier 2 institutional), NBC News health, CBC News (alt URL `webfeed/rss/rss-health`). Per-signal Google News queries already cover removed authorities. Authority-weight map updated.
- **Authority colors** synced in `News.tsx` and `Overview.tsx` so chips render consistently for the new feeds.
- **Zero-write skip (CONTENT-STANDARDS §4.4).** `update-news.mjs` now serializes the candidate output, compares byte-for-byte to existing `news.json`, and skips the write if identical. Prevents spurious commits and Vercel rebuilds.
- **Tier 4 sources added** (3 entries): bioRxiv Infectious Diseases, medRxiv Infectious Diseases, medRxiv Epidemiology. All carry `notes` explaining the not-peer-reviewed status per §1.
- **Status page depth.** `generate-status.mjs` now exposes `signals.totalMapMarkers` (103), `signals.totalDetailSections` (20), `sources.byTier` ({tier1: 19, tier2: 11, tier3: 4, tier4: 3}), and `news` ({total, newest}). Status.tsx renders a new "Dashboard depth" card and an extended source-registry section with per-tier counts.

**Verify:** `npm run generate:status` then visit `/status` — expect "Map markers 103 · Detail sections 20 · Timeline events 13 · News items 200" and a Tier 1–4 breakdown.

---

## ✅ Section deepening (commit pending push)

`scripts/deepen-signal-sections.mjs` added 2 attributed ContentBlock sections to each of the 15 non-hantavirus signals (30 new sections; total now 50). Hantavirus unchanged at 5.

Section themes per signal:
- **Ebola DRC**: Clinical profile · PPE & isolation
- **Measles US**: Clinical profile · Post-exposure prophylaxis
- **Mpox clade I**: Clinical profile · Infection prevention & vaccination
- **Avian flu H5**: Human clinical profile · Occupational exposure response
- **Cholera Africa**: Clinical management · Oral cholera vaccine deployment
- **Seasonal influenza**: Clinical management · Surveillance methods
- **COVID wastewater**: Surveillance methodology · Interpretation & limitations
- **Norovirus wastewater**: Clinical profile · Outbreak response
- **RSV wastewater**: Clinical profile · Prevention (nirsevimab, maternal & adult vaccines)
- **hMPV wastewater**: Clinical profile · Diagnostic testing
- **Lassa fever**: Clinical profile · PPE & isolation
- **Chikungunya**: Clinical profile · Vector control & vaccination (Ixchiq)
- **Candida auris**: Infection prevention in healthcare · Laboratory identification
- **Screwworm**: Animal detection & surveillance · Human myiasis
- **FIFA 2026**: Surveillance planning · EMS surge readiness

All sections carry: primary `attribution` + 1-2 `additionalAttributions` (pulled from `signal-sources.json`), `lastReviewed: 2026-05-20`. Bodies are factual, non-prescriptive per CONTENT-STANDARDS §7.1; clinical specifics cite the primary source inline so reviewers can verify.

**Verify:** any non-hantavirus signal detail page (e.g. `/signals/cholera-africa-2026`) shows 3 ContentBlocks each with Source: + Also: rows. `/status` shows "Detail sections: 50".

---

## ✅ Threat-category label rename (commit 497d6d1)

User request: friendlier display labels for the 10 threat categories.

Internal keys **unchanged** (vhf, respiratory, zoonotic, vaccine_preventable,
enteric, vector_borne, amr_fungal, environmental, mass_gathering, travel),
so no schema or data migration. Only `THREAT_CATEGORY_LABELS` in `src/types.ts`
updated. All filter chips, signal cards, map popups, briefing badges, and
About-page tier copy pick up the new labels automatically.

New labels:
- `respiratory` → "Respiratory Threats"
- `vhf` → "Hemorrhagic Threats"
- `enteric` → "Enteric / Waterborne"
- `vector_borne` → "Vector-Borne"
- `zoonotic` → "Zoonotic Spillover"
- `amr_fungal` → "Healthcare-Associated / AMR"
- `environmental` → "Environmental Surveillance"
- `mass_gathering` → "Mass Gatherings & Events"
- `travel` → "Travel & Importation"
- `vaccine_preventable` → "Vaccine Gaps"

**Verify:** visit `/map` — all 10 category chips render with the new labels.

---

## ✅ Risk badges + HCW alerts extended (commit be1a004 / 681b11b)

Risk-assessment badge strip now renders on **9 signals** total (added 8):
mpox (WHO PHEIC), lassa, ebola, avian flu H5, measles US, cholera, chikungunya, screwworm.

HCW alert callouts now render on **6 signals** total (added 5):
ebola, lassa, mpox, measles, candida auris.

`scripts/seed-risk-and-hcw.mjs`: one-time seeder. All risk badges link to
real published authority documents; HCW alerts cite the authority issuing
the operational guidance.

---

## ✅ Hantavirus-asset restoration (commit f4c4438)

Addresses gaps documented in [HANTAVIRUS-ASSET-AUDIT.md](HANTAVIRUS-ASSET-AUDIT.md).

**Types** (`src/types.ts`):
- `MarkerType` extended with `ship_route`, `us_state_monitoring`, `flight_tracing` — preserves original hantavirus dashboard semantics
- New interfaces: `RiskAssessment` (authority + label + description + url), `HcwAlert` (headline + body + source)
- `Signal` interface adds optional `riskAssessments[]` and `hcwAlert`

**Components** (new):
- `src/components/HcwAlertCard.tsx` — orange-accent alert callout with headline, body, source link, updated-at
- `src/components/AuthorityRiskBadges.tsx` — colored badge strip (WHO/CDC/ECDC etc.) with click-through to source

**SignalDetail** now renders, in this order: risk badges → HCW alert → summary → ...

**Data restored** (via `scripts/restore-hantavirus-assets.mjs`):
- **48 hantavirus markers** (was 15) — 6 ship-route waypoints, 11 US-state monitoring nodes, 4 flight-tracing markers, 7 specific case/death sites, Arrowe Park UK monitoring, Colorado Sin Nombre context, Rotterdam return destination
- **231 news items** (was 200) — 31 original hantavirus items (CDC HAN, WHO DON, ECDC, AP, BBC, etc.) re-seeded with `signalIds: ['andes-hantavirus-mv-hondius-2026']`
- **41 timeline events** (was 13) — 28 hantavirus events restored across April–May 2026
- **3 authority risk badges** for hantavirus (WHO LOW, CDC HAN 528, ECDC VERY LOW) wired through to source documents
- **HCW alert** on hantavirus signal citing NYC DOH HAN #8 and Radboud UMC HCW exposure event

**Pipeline fix** (`scripts/update-news.mjs` + `.github/workflows/update-news.yml`):
- `MAX_ITEMS` raised from 200 → 500 so authoritative seeded items survive the daily Google News flood
- Root cause documented: pipeline-generated IDs (`${authority}-${md5(link).slice(0,8)}`) don't collide with manually-seeded IDs, so without higher cap, sort-by-timestamp evicts older items

**Status counters** now read: 136 markers · 50 sections · 41 events · 231 news.

**Verify:** visit `/signals/andes-hantavirus-mv-hondius-2026` — expect risk-badge strip (WHO/CDC/ECDC), HCW alert callout, 48 markers on mini-map. `/status` shows updated counts. `/timeline` shows the restored hantavirus chronology.

---

## ⏳ Outstanding work (backlog)

- **Further deepening if desired.** Currently 3 sections per non-hantavirus signal vs 5 for hantavirus. Adding 1-2 more per signal would bring full parity. Diminishing-returns territory; only worth doing for signals that warrant deeper EMS-facing content.
- **~~Bundle size.~~** ✅ Addressed by lazy route loading + Rollup `manualChunks`. Entry chunk is now 18.23 kB (gzip 6.39 kB); heavy map/data/vendor chunks are split and cacheable.
- **~~Accessibility sweep.~~** ✅ Code-level sweep shipped: acknowledgment modal focus trap/Escape handling and grouped `aria-pressed` filter chips on Map, Signals, Briefings, Timeline, News, and Sources. Manual browser/axe pass still useful before a formal accessibility sign-off.
- **~~Intermittent feed failures.~~** ✅ Addressed for Tier 1 feeds: CDC, WHO, and ECDC now use live endpoints and hard-fail the news workflow during active monitoring. Soft Tier 2/3 feed failures remain tolerated and internal-only.
- **Marker deduplication (cosmetic).** The restoration left ~3 generic vs specific overlaps on the hantavirus signal (e.g. "France — confirmed case" generic + "Paris, France" specific from old data). Both at similar coords; functional but slightly redundant. Trim if desired.
- **~~HCW alert / risk badges on other signals.~~** ✅ Shipped. Risk badges now on 9 signals total (hantavirus + 8 others); HCW alerts on 6 signals total (hantavirus + 5 others). See `scripts/seed-risk-and-hcw.mjs`.

---

## Conventions & rules

### Commit style (per CONTENT-STANDARDS §8.1)
- `feat(scope): subject` — new feature
- `fix(scope): subject` — bug fix
- `chore(scope): subject` — pipeline / housekeeping
- All AI-assisted commits end with `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Pipeline-generated commits use `EMERGENZ Data Bot <bot@emergenz.org>`

### Push procedure
The `update-news` workflow may commit while you're working. If push is rejected:
```
git pull --rebase origin main && git push origin main
```

### Verification cadence
- After each implementation: `npm run validate:data` and `npm run build` (TypeScript + Vite)
- For observable UI: `npm run dev` and visit the affected route. Use `preview_eval` / `preview_snapshot` if the screenshot tool times out (known issue).

### Source attribution
- Tier 1 (WHO/CDC/ECDC) drives structured data
- Tier 2 (PHAC, UKHSA, RKI, journals) drives structured data
- Tier 3 (news outlets) → news feed only
- Tier 4 (preprints) must be labeled
- Per CONTENT-STANDARDS §4.1, never fabricate. Use `null` (rendered as `—` or `TBD`) when uncertain.

---

## Known issues / deferred

- **Vercel CLI auth** is invalid on this machine; deploy plumbing is owned by the user.
- **Several RSS feeds 404 or 403** (PHAC, RKI, AP News, CTV News, Eurosurveillance). The pipeline tolerates these — they're Tier 2/3 non-critical. Update the URLs in `scripts/update-news.mjs` `GLOBAL_FEEDS` when better endpoints are identified.

---

## Quick reference commands

```bash
# Run news fetch locally
npm run update:news

# Validate signals/sources/timeline
npm run validate:data

# Regenerate /public/status.json
npm run generate:status

# Type-check & build
npm run build

# Dev server
npm run dev

# View what was deleted in the multi-threat migration
git show f4ebe5c^:src/data/news.json | head
git show 90bd172^:src/pages/Clinical.tsx | head
```
