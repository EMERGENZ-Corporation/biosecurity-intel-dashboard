# Source Drift Triage — 2026-05-24

**Audit run:** `npm run audit:source-drift` 2026-05-24 (this is the second post-2026-05-23 forensic audit; 8 originally flagged + 5 new since).

**Purpose:** Document the current Tier 1/2 source-page drift surface and bucket each finding so the operator can act with minimal risk. SME availability is the gating constraint; this triage scopes what is and is not safe to handle without one.

**Source-of-truth registry:** `src/data/signal-sources.json`.

---

## Bucket A — rotating / index / dashboard pages (safe to refresh `lastVerified` after eyes-on)

These pages are designed to rotate: their URLs are stable but their content changes by design (new alerts published, new dashboard tiles, new featured items). Fingerprint drift is expected. Substantive risk is low **provided the page still serves on-topic content** — a 30-second visual check is sufficient before refreshing `lastVerified`.

| sourceId | URL | Tier | Signals it backs | Drift fields |
|---|---|---|---|---|
| `africa-cdc-outbreaks` | https://africacdc.org | 2 | `ebola-bundibugyo-drc-2026`, `mpox-africa-clade-i-2026` (primary), `cholera-africa-2026` (primary), `lassa-fever-2026` (primary) | contentHash |
| `paho-epi-alerts` | https://www.paho.org/en/epidemiological-alerts-and-updates | 2 | `measles-us-2026`, `chikungunya-2026` (primary), `fifa-world-cup-2026-prep` | contentHash, etag, lastModified |
| `fda-safety-alerts` | https://www.fda.gov/news-events/public-health-focus | 1 | (none — used for general context) | contentHash, etag, lastModified |
| `wastewaterscan` | https://data.wastewaterscan.org/ | 2 | `covid-wastewater-2026`, `norovirus-wastewater-2026` (primary), `rsv-wastewater-2026`, `hmpv-wastewater-2026` (primary), `candida-auris-wastewater-2026` | contentHash, etag |

**Recommended action:** open each URL in a browser; confirm the page still serves the expected type of content (alert index, dashboard, advisory feed). If yes, update `lastVerified` to `2026-05-24` for these four entries in `src/data/signal-sources.json` in a single commit. If no — escalate to bucket B.

**Important:** for the bucket A sources that are `primary: true` for one or more signals (`africa-cdc-outbreaks` for cholera/mpox/lassa; `paho-epi-alerts` for chikungunya; `wastewaterscan` for norovirus/hmpv), the `lastVerified` refresh confirms the *registry source still exists and points at the right page*. It does NOT confirm the structured numbers on the dashboard are still supported. That is bucket B's job and remains SME-gated.

---

## Bucket B — structured-data-backing pages (requires SME)

These pages are the cited authority for specific structured fields (case counts, deaths, risk levels, response levels). The drift could mean a substantive update to the document, including changes to numbers the dashboard claims. **Do not refresh `lastVerified` without an SME comparing the current page against the structured fields it backs.**

| sourceId | URL | Tier | Signal | Structured fields likely backed |
|---|---|---|---|---|
| `ecdc-andes-surveillance` | https://www.ecdc.europa.eu/en/infectious-disease-topics/hantavirus-infection/surveillance-and-updates/andes-hantavirus-outbreak | 1 | `andes-hantavirus-mv-hondius-2026` (primary) | `confirmed`, `deaths`, `countries`, EU/EEA risk rating |
| `ecdc-andes-rra` | https://www.ecdc.europa.eu/en/publications-data/hantavirus-associated-cluster-illness-cruise-ship-ecdc-assessment-and | 1 | `andes-hantavirus-mv-hondius-2026` | EU/EEA risk rating, response posture |
| `who-andes-rra-v2` | https://www.who.int/publications/m/item/who-rapid-risk-assessment---hantavirus-outbreak-caused-by-andes-virus--global-v.2 | 1 | `andes-hantavirus-mv-hondius-2026` | Global risk rating |
| `who-don601` | https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON601 | 1 | `andes-hantavirus-mv-hondius-2026` | `confirmed`, `deaths`, `countries` |

`ecdc-andes-surveillance` saw all four fingerprint fields change including `pageTitle` — that is the loudest signal of substantive change in the audit run. Prioritize SME review of this one.

**Recommended action:** schedule SME review with a hantavirus subject-matter expert. For each of the 4 sources, the SME walks through the current structured fields on the signal detail page (`/signals/andes-hantavirus-mv-hondius-2026`) and confirms each one is still supported by what the source page currently says. If supported → refresh `lastVerified`. If diverged → open a structured-data update PR (humans-only write per CONTENT-STANDARDS §3.4 — `confirmed`, `deaths`, `countries` are in the curated-fields list).

**Blocked on:** SME availability.

---

## Bucket C — reference / guidance pages (light review, low structured-data risk)

These pages provide clinical guidance, PPE matrices, lab resources, or methodology — they're cited but don't drive structured numerics. Drift is moderate-risk: the guidance itself could have been updated, but it doesn't affect counts/risk-levels the dashboard displays.

| sourceId | URL | Tier | Signal / Use | Drift fields | Notes |
|---|---|---|---|---|---|
| `netec-vhf-ppe-matrix` | https://repository.netecweb.org/items/show/1693 | 2 | `andes-hantavirus-mv-hondius-2026` — PPE reference | contentHash | Operational guidance; review for any major PPE-class change. |
| `netec-hantavirus-lab-resources` | https://repository.netecweb.org/exhibits/show/hantavirus/hantavirus | 2 | `andes-hantavirus-mv-hondius-2026` — lab references | contentHash | Reference exhibit; review for new resources or removals. |
| `phac-andes-media-update` | https://www.canada.ca/en/public-health/news/2026/05/media-update-on-andes-hantavirus-situation1.html | 2 | `andes-hantavirus-mv-hondius-2026` — Canadian context | lastModified only | Drift was `lastModified` ONLY — strong signal that this is a cosmetic header timestamp update, not body content. Light review. |
| `ecdc-cdtr` | https://www.ecdc.europa.eu/en/publications-data/communicable-disease-threats-report-9-13-may-2026-week-20 | 1 | (none — used for general context) | contentHash, etag, lastModified | Specific week-20 publication URL; ECDC may update the page post-publication. Light review. |
| `who-mass-gatherings` | https://www.who.int/activities/managing-health-risks-during-mass-gatherings | 1 | `fifa-world-cup-2026-prep` (primary) | contentHash, lastModified | Guidance page for FIFA prep; primary source so refresh requires confirming the page still backs the structured FIFA prep claims. Moderate priority. |

**Recommended action:** light review by a curator (not necessarily an SME): confirm the page still discusses the same topic and the dashboard's framing isn't contradicted by visible changes. Refresh `lastVerified` if okay; flag for SME if anything looks structurally different.

`phac-andes-media-update` is the lowest-risk in this bucket and can almost certainly be refreshed after a single-paragraph eyeball.

---

## Known-blocked source — separate path

| sourceId | URL | Tier | Note |
|---|---|---|---|
| `cdc-han` | (CDC HAN page) | 1 | Persistent HTTP 403 to identified audit user-agents. Allowlisted via `knownBlocked: true` (see HANDOFF entry "knownBlocked source-audit allowlist"). Re-verify quarterly. |

Not in this drift surface; bypass is working as designed.

---

## Recommended next actions (ordered)

1. **Operator (today, ~10 minutes):** open each Bucket A URL, eyeball, then update `lastVerified: "2026-05-24"` for `africa-cdc-outbreaks`, `paho-epi-alerts`, `fda-safety-alerts`, `wastewaterscan` in `src/data/signal-sources.json`. Single commit, HANDOFF entry referencing this triage doc.
2. **Operator (this week):** light review of Bucket C — start with `phac-andes-media-update` (lowest risk), then `who-mass-gatherings` (primary source, moderate). Refresh as appropriate.
3. **SME (when available):** Bucket B review against current structured fields for the Andes hantavirus signal. Update structured data via PR if diverged; refresh `lastVerified` if not.
4. **Next `audit:source-drift` workflow run** will re-baseline fingerprint cache automatically after the `lastVerified` updates land.

---

## Why this triage was done by the dashboard maintainer, not an agent

The source-integrity-agent was dispatched twice during this session but the agent transcripts were truncated before the bucketing tables surfaced. The classification rules are mechanical (URL shape + drift-field pattern + signal references), so the main session executed them directly. CONTENT-STANDARDS §4.1 means I did NOT update `lastVerified` myself — that requires eyes-on confirmation that this doc explicitly delegates to the operator.
