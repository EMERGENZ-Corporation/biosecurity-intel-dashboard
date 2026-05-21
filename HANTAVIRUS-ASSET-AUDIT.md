# Hantavirus Asset Audit

**Question:** What original hantavirus dashboard data did not make it into the multi-threat dashboard?
**Audit date:** 2026-05-20
**Recovery commits:** `f4ebe5c^` (data files), `90bd172^` (page components)

---

## Summary

| Asset class | Original | Current | Status |
|---|---|---|---|
| Map markers (hantavirus signal) | 38 | 15 | **23 missing** |
| News items (hantavirus-tagged) | 31 | 0 | **31 missing** (root cause: pipeline bug) |
| Timeline events (hantavirus) | 29 | 6 | **23 missing** |
| US Monitoring states | 11 (own file) | 0 | **entire file dropped** |
| Flight tracing | 3 flights (own file) | 0 | **entire file dropped** |
| Risk badges (WHO/CDC/ECDC) | structured in meta.json | absent | **lost structurally** |
| EMS briefing bullets | own file | folded into 1 section | partially preserved |
| Protocols.json | 14 entries | folded into sections | partially preserved |
| Manual overrides | own file | absent | **entire file dropped** |

---

## 1. Map markers (23 missing of 38)

The current hantavirus signal has 15 markers vs the original 38. Specific gaps:

### Ship route trail (6 waypoints missing)
Lost the MV Hondius cruise itinerary — only Ushuaia departure and one Antarctic waypoint are present.
- South Georgia Island
- Tristan da Cunha
- Saint Helena
- Ascension Island
- Praia, Cape Verde
- Tenerife, Canary Islands

### Return destination (1)
- Rotterdam, Netherlands (port of return)

### Deaths — specific events (3 of 4 missing)
Only 3 generic "Fatality 1–3" markers are present. The original had specific events:
- MV Hondius — Case 1 Death (South Atlantic)
- Johannesburg, South Africa — Case 2 (Death)
- MV Hondius — Case 4 Death (approaching Cape Verde)
- Colorado — Sin Nombre Virus Death (clinical context, distinct strain)

### Confirmed cases (7 missing)
- Johannesburg, South Africa — Case 3 (ICU)
- Zurich, Switzerland
- Leiden UMC, Netherlands
- Radboud UMC, Nijmegen (the HCW exposure site — present as `exposure_event` only)
- Amsterdam UMC, Netherlands
- Paris, France (present in current as generic "France — confirmed case")
- Madrid, Spain

### Monitoring facilities (1 missing)
- Arrowe Park Hospital, Wirral, UK

### US state monitoring (11 missing)
The entire US state monitoring layer was dropped. Original states tracked:
- Arizona (Phoenix), California (Sacramento), Georgia (Atlanta), Kansas (Topeka)
- Maryland (Annapolis), Nebraska (Lincoln), New Jersey (Trenton), Texas (Austin)
- Virginia (Richmond), Washington (Olympia), New York (Albany)

### Flight tracing (4 missing)
The entire flight tracing layer was dropped:
- Saint Helena — Airlink Flight Origin
- Johannesburg — KLM KL592 Origin
- Amsterdam — KLM KL592 Destination
- Offutt AFB, Omaha — U.S. Repatriation Flight Destination

---

## 2. News items (31/31 dropped)

**Status:** All 31 originally-seeded news items are gone from current `news.json`.

**Root cause** (confirmed in code):
1. The seeder I wrote in `b0c0753` preserved original item IDs (e.g., `rss-1779233093624-nioya`, `ap-cdc-quarantine-orders-may19`)
2. The pipeline (`scripts/update-news.mjs`) generates NEW IDs in the format `${authority}-${md5(link).slice(0,8)}`
3. When the pipeline ran, fresh items did not collide with the seeded items (different ID schemes)
4. The pipeline sorts by timestamp newest-first and caps at `MAX_ITEMS = 200`
5. 16 signals × ~100 Google News items each = ~1600 candidate items per run, all timestamped same-day
6. Same-day items completely filled the 200-item slot, pushing the seeded May 16–19 items off the list

**Verification:**
```
$ node -e "const n=JSON.parse(require('fs').readFileSync('src/data/news.json'));
  const buckets={}; n.forEach(x=>{const d=new Date(x.timestamp).toISOString().slice(0,10); buckets[d]=(buckets[d]||0)+1});
  console.log(buckets);"
{ '2026-05-20': 192, '2026-05-21': 8 }
```

Every item in the current 200-item news.json is from the past ~24 hours.

**Dropped items include** (sample):
- CDC HAN 528 announcement
- WHO DON601 (Disease Outbreak News)
- WHO Rapid Risk Assessment v2
- ECDC Andes Hantavirus surveillance update
- PHAC Canada first-case confirmation
- BBC Health Canadian case
- Scientific American series (4 pieces on hantavirus context, vaccine development, misinformation)
- Harvard HSPH explainer
- Detroit Free Press preparedness piece
- 22 other contextual pieces from CDC, ECDC, AP, Reuters, ABC, etc.

**Fix options:**
1. Increase `MAX_ITEMS` (e.g., to 500) so older seeded items aren't crowded out
2. Reserve quota for highest-tier authority items (always keep N most-recent from each Tier 1 authority)
3. Re-seed the 31 items after each pipeline run

---

## 3. Timeline events (23/29 missing)

The original `timeline.json` had 29 hantavirus-specific events spanning April 1 – May 19, 2026. The current `signal-timeline.json` has 13 total events across all 16 signals, with only 6 for the hantavirus signal.

**Lost events** likely included intermediate situation updates, individual case confirmations, and per-country authority responses. The original timeline was the chronological spine of the outbreak narrative.

---

## 4. US Monitoring (entire file dropped)

`src/data/us-monitoring.json` is gone. It contained per-state structured monitoring data:

```json
{
  "state": "Nebraska",
  "personsMonitored": 15,
  "exposureCategory": "Repatriated passengers (UNMC)",
  "confirmedCases": 0,
  "confirmedCasesNote": "Biocontainment patient confirmed NEGATIVE May 15...",
  "sourceUrl": "https://dhhs.ne.gov/Pages/Hantavirus.aspx"
}
```

11 states had entries. The `USMonitoringTable` component that rendered this is also gone.

This data has **not** been re-encoded anywhere in the multi-threat schema. The closest current equivalent is the `us_state_monitoring` marker type — but those markers were never added for the hantavirus signal.

---

## 5. Flight tracing (entire file dropped)

`src/data/flights.json` is gone. It contained 3 flights with route, date, and contact-tracing details:

```json
{
  "id": "flight-airlink-apr25",
  "flightNumber": "Airlink (unspecified)",
  "operator": "Airlink",
  "route": "Saint Helena → Johannesburg, South Africa",
  "date": "April 25, 2026",
  "passengersTraced": "82 passengers..."
}
```

The `FlightTracingPanel` component is also gone. No equivalent in the multi-threat schema.

---

## 6. Risk badges (structurally lost)

The old `meta.json` had structured risk-level fields:
- `whoGlobalRisk: "LOW"` + `whoGlobalRiskUrl`
- `cdcResponseLevel: "HAN 528 — Health Alert"` + `cdcResponseLevelUrl`
- `ecdcRisk: "VERY LOW"` + `ecdcRiskUrl`

These rendered as authoritative risk badges on the Dashboard. In the multi-threat schema, this concept is folded into the signal's `severity` (a synthesized field) and `confidence`. The original explicit authority-source risk labels are not displayed anywhere.

---

## 7. EMS Briefing (partially preserved)

The old `ems-briefing.json` was a curated set of bullet points sourced from CDC HAN 528 + ECDC RRA + NYC DOH HAN #8. It rendered in a prominent EMS Briefing Card.

Current state: the content is folded into the hantavirus signal's `ems-specific` detailSection (paragraph form, not bullets). The dedicated card treatment on the Dashboard/Overview is lost — the Overview now surfaces operational guidance in the briefing rail but in a different shape.

---

## 8. Protocols (partially preserved)

The old `protocols.json` had 14 structured protocol entries (clinical thresholds, EMS procedures, lab handling, decon, post-exposure response, etc.) that rendered on the dedicated Protocols page.

Current state: protocols content is folded into the hantavirus `ppe-and-ipc`, `genomics-and-diagnostics`, and `protocols-and-guidance` detailSections. The structured protocol-by-protocol breakdown is not visible.

---

## 9. Manual overrides (entire file dropped)

`src/data/manual-overrides.json` held human-verified overrides for automated pipeline outputs, including:
- `metrics` overrides (case counts, deaths)
- `riskLevels` overrides (WHO/CDC/ECDC risk)
- `hcwAlert` content (healthcare-worker alert callout)
- `expiresAt` for time-limited overrides

This mechanism doesn't exist in the multi-threat schema. All signal data is now manually authored directly into `signals.json`, so the override pattern is no longer necessary — but the `hcwAlert` callout (a prominent HCW-facing warning on the Dashboard) is not currently surfaced anywhere.

---

## Recommendation: priority fixes

If we want to restore the depth, in order of impact:

1. **Fix the news pipeline** so seeded historical items survive. Either bump `MAX_ITEMS` to 500 or reserve authority quotas. ETA: small.
2. **Re-seed hantavirus map markers** to bring the count back from 15 to ~38. Use `scripts/seed-map-markers.mjs` pattern. ETA: medium.
3. **Restore timeline events** — re-seed the missing 23 hantavirus timeline events. ETA: medium.
4. **Re-add the US state monitoring markers** (11 typed `us_state_monitoring`-equivalent markers). Note: I removed `us_state_monitoring` from the multi-threat MarkerType union; we'd either add it back or use `monitoring_site`. ETA: small.
5. **Re-add flight tracing markers** (4 typed exposure_event markers). ETA: trivial.
6. **HCW alert callout** on Overview/SignalDetail when a signal carries an HCW-relevant warning. ETA: small UI add.
7. **Authority risk badges** — restore `whoRisk` / `cdcResponseLevel` / `ecdcRisk` fields on the Signal interface with linked sources, render as a badge strip on signal detail. ETA: medium.
