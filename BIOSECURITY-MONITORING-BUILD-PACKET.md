# Biosecurity Monitoring Dashboard Build Packet

Prepared for: Claude Code implementation
Prepared by: Codex engineering workshop
Date: 2026-05-19
Source inputs:
- Public and expert biosecurity source context
- Existing repository: `EMERGENZ-Corporation/hantavirus-intel-dashboard`

## 1. Executive Recommendation

Build the broader biosecurity monitoring tool as a separate cloned project, not as a direct refactor of the live hantavirus dashboard.

Recommended new project name: `biosecurity-intel-dashboard`

Rationale:
- The current dashboard is a live incident-specific public health product with working automation, data validation, production freshness checks, and status monitoring. Refactoring it in place would risk breaking the active hantavirus workflow.
- The new product needs a generalized taxonomy, generalized data models, different navigation, multi-threat triage logic, and a broader source ingestion strategy.
- The existing repo is valuable as a hardened template. Clone it, then generalize names, data contracts, and views in the clone.
- Keep the original hantavirus dashboard as an incident vertical. The broader dashboard can later link to or embed incident-specific verticals.

Safe approach:
1. Clone the current repo into a new repository.
2. Rename product, package, metadata, domain, and status URLs in the clone.
3. Preserve the resilience machinery: status endpoint, data validation, parser tests, production verification, stale-data alerts, and status monitor.
4. Replace the disease-specific data schema with a generalized biosecurity event schema.
5. Keep the current repo untouched except for future links to the new project.

## 2. System Summary

Create an operational biosecurity monitoring dashboard for public health, EMS, emergency management, healthcare preparedness, and nonprofit situational awareness users.

The dashboard should monitor multiple biological threat domains, summarize current signals, preserve source provenance, and give users a scan-first operational view of what is happening, what changed, what matters, and where to verify it.

This is not a clinical decision system, not a prediction engine, and not a replacement for official public health guidance. It is a source-backed situational awareness and triage dashboard.

## 3. Initial Monitoring Domains

The initial source context points to a broader monitoring scope than a single outbreak:

| Domain | Example signal | Operational reason to monitor |
|---|---|---|
| Viral hemorrhagic fevers | Ebola/Bundibugyo outbreak in DRC; cross-border concern with Uganda and South Sudan | High severity, cross-border surveillance, limited countermeasures for some species |
| Hantavirus / zoonotic respiratory threats | Andes virus MV Hondius cluster | Long incubation, travel-linked exposure, healthcare worker protection |
| Vaccine-preventable disease | US measles increase; PAHO elimination status concern | Outbreak acceleration, immunity gaps, school/community implications |
| Orthopoxviruses | Mpox declines in Africa but South Sudan surge; Connecticut clade I case | Clade tracking, travel and importation risk, lab and clinical readiness |
| Avian influenza / zoonotic flu | H5N6 death in China; H5 cat-to-human serology signal in Los Angeles; poultry trends | Human spillover, animal-human interface, food/agriculture impacts |
| Enteric/waterborne disease | Cholera increases in Africa and Republic of Congo fatality concerns | WASH conditions, cross-border river movement, humanitarian risk |
| Seasonal respiratory viruses | Influenza, COVID-19, RSV, human metapneumovirus | Healthcare load, EMS demand, wastewater signal utility |
| Wastewater / environmental surveillance | WastewaterSCAN and CDC NWSS signals; norovirus, RSV, hMPV, Candida auris | Early signal detection and regional trend monitoring |
| Vector-borne disease | Chikungunya outbreaks in 18 countries, Brazil high burden | Travel-related risk and regional outbreak tracking |
| High-consequence endemic disease | Lassa fever among Africa CDC top outbreaks | Persistent high-burden threat requiring regional tracking |
| Fungal / AMR healthcare threats | Candida auris wastewater detections in multiple US states | Healthcare preparedness, infection control, antifungal resistance |
| Agricultural / One Health biosecurity | New World screwworm active cases and sterile fly dispersal zone | Human-animal interface, livestock risk, border preparedness |
| Mass-gathering preparedness | FIFA World Cup disease tracking concern and movement mapping | Event-based surveillance, mobility-aware risk monitoring |

## 4. Resource List

### Expert Source Context

| Resource | Use |
|---|---|
| Pandemic Center Tracking Report, May 14, 2026 | Inform topic taxonomy and initial monitored threat domains |
| Pandemic Center Special Report: Ebola Outbreak in the DRC, May 15, 2026 | Inform special-report pattern for high-priority acute events |
| Pandemic Center Tracking Report Archive | Candidate source for a curated weekly intelligence feed |

### Core Official / Primary Sources To Support

Claude should implement these as configurable source records, not hard-coded one-off UI text.

| Source | Suggested URL | Monitored domains |
|---|---|---|
| WHO Disease Outbreak News | `https://www.who.int/emergencies/disease-outbreak-news` | Outbreak notices, global assessments |
| WHO Emergencies / Disease Outbreaks | `https://www.who.int/emergencies/disease-outbreaks` | Global emergency updates |
| Africa CDC Epidemic Intelligence / Outbreaks | `https://africacdc.org` | VHF, mpox, cholera, Lassa, regional Africa signals |
| CDC Current Outbreaks | `https://www.cdc.gov/outbreaks/` | US and global outbreak notices |
| CDC Health Alert Network | `https://www.cdc.gov/han/` | US clinical/public health advisories |
| CDC National Wastewater Surveillance System | `https://www.cdc.gov/nwss/` | US wastewater trends |
| WastewaterSCAN | `https://data.wastewaterscan.org/` | Wastewater pathogen signals |
| PAHO Epidemiological Alerts | `https://www.paho.org/en/epidemiological-alerts-and-updates` | Americas measles, arboviruses, cholera, regional alerts |
| ECDC Communicable Disease Threats Reports | `https://www.ecdc.europa.eu/en/publications-data/communicable-disease-threats-report` | EU/EEA weekly threat reporting |
| ECDC disease pages | `https://www.ecdc.europa.eu/en` | Disease-specific European surveillance |
| CDC FluView | `https://www.cdc.gov/fluview/` | Seasonal influenza |
| CDC COVID Data / respiratory illness | `https://www.cdc.gov/respiratory-viruses/data/` | COVID, flu, RSV respiratory trend context |
| USDA APHIS HPAI | `https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza` | Avian influenza animal interface |
| WOAH WAHIS | `https://wahis.woah.org/` | Animal health and zoonotic event surveillance |
| ProMED | `https://promedmail.org/` | Early unofficial signals, must be labeled non-official |
| CIDRAP | `https://www.cidrap.umn.edu/` | Expert public health reporting, secondary source |
| Brown Pandemic Center | `https://pandemics.sph.brown.edu/` | Tracking Report context, preparedness analysis |

### Initial Threat Categories

Use this taxonomy in the data model:

- `vhf`: Viral hemorrhagic fever
- `respiratory`: Respiratory viruses
- `zoonotic`: Zoonotic / One Health
- `vaccine_preventable`: Vaccine-preventable disease
- `enteric`: Enteric / waterborne disease
- `vector_borne`: Vector-borne disease
- `amr_fungal`: AMR / fungal / healthcare-associated
- `environmental`: Wastewater / environmental surveillance
- `mass_gathering`: Event-based / mass-gathering preparedness
- `travel`: Travel-linked exposure or importation risk

## 5. Product Scope

### MVP Goal

Convert the current single-outbreak dashboard into a static, source-backed multi-threat biosecurity dashboard that can:

- Display multiple active biosecurity signals.
- Rank them by severity, confidence, geography, and freshness.
- Provide source-backed summaries and verification links.
- Preserve automation resilience.
- Allow future pathogen-specific detail pages.

### In Scope

- Generalized dashboard shell and navigation.
- Multi-threat overview cards.
- Threat/event data model.
- Source registry and provenance display.
- Map grouped by event category and geography.
- Timeline of major developments across all monitored domains.
- Signal detail page or drawer for each monitored threat.
- Resource library grouped by source type and monitored domain.
- Public `status.json` adapted to the broader dashboard.
- Validation script for new generalized data files.
- Parser/test structure ready for source-specific extractors.
- Claude Code implementation in a cloned project.

### Out of Scope For MVP

- Authenticated user accounts.
- Real-time backend database.
- User-submitted reports.
- Predictive modeling.
- Automated official parser coverage for every source on day one.
- Clinical treatment guidance for every pathogen.
- Alert delivery through SMS, Teams, Slack, or email.
- Classified, restricted, or non-public intelligence handling.

## 6. Users And Roles

| User | Need | MVP support |
|---|---|---|
| EMS / emergency management user | Fast awareness of emerging biological threats and operational relevance | Overview, priority signals, source links, briefings |
| Public health analyst | Source-backed monitoring and triage across domains | Source registry, event detail, timeline, provenance |
| Healthcare preparedness user | Readiness implications and infection-control flags | category filters, severity indicators, resource links |
| EMERGENZ maintainer | Safe autonomous operation and easy data updates | validation, status endpoint, monitor workflow, source schema |
| Public visitor | Understand broad situation without overclaiming | disclaimers, plain source labels, confidence states |

No role-based permissions are required in the MVP because this remains a static public dashboard.

## 7. UI/UX Redesign Requirements

The current UI is incident-specific. The broader product needs an information architecture built for repeated scanning across many signals.

### Navigation

Replace current nav:

- Dashboard
- Clinical
- PPE
- Genomics
- Protocols
- News
- Sources
- About

With:

- Overview
- Signals
- Map
- Timeline
- Briefings
- Resources
- Sources
- Status
- About

Do not keep disease-specific tabs like `Clinical`, `PPE`, and `Genomics` as top-level nav. Those can become optional detail sections when a signal has relevant guidance.

### Overview Screen

The first screen should be a dense operational dashboard, not a landing page.

Required regions:

- Global status strip: last update, source health, automation status, number of active signals.
- Priority signal queue: top 5 signals ranked by severity and confidence.
- Threat domain grid: counts by domain and trend state.
- Map preview: active signal locations and regions.
- Freshness panel: official sources checked, failed/degraded feeds, status endpoint health.
- Recent developments: latest cross-domain timeline entries.

### Signal Card Design

Each signal card should show:

- Threat name
- Category
- Geography
- Severity: `monitor`, `watch`, `concern`, `action`
- Confidence: `official`, `corroborated`, `emerging`, `unverified`
- Trend: `increasing`, `stable`, `decreasing`, `unknown`
- Last updated
- Primary source
- One-sentence operational relevance

### Signal Detail View

Use a route like `/signals/:id` or a drawer if the build stays simple.

Required sections:

- Summary
- Current situation
- Why it matters
- Geography
- Metrics
- Timeline
- Sources and provenance
- Operational notes
- Data quality / confidence

### Map UX

The map must support:

- Category filters
- Severity filters
- Region grouping
- Marker detail popovers
- Source links from marker details

Do not overload map markers with every wastewater or case signal. Use regional aggregation for broad signals.

### Resources UX

Resource library should be filterable by:

- Domain
- Source authority
- Geography
- Resource type: official advisory, surveillance dashboard, weekly report, technical guidance, academic/expert analysis
- Primary vs secondary source

### Status UX

Create a human-readable Status page backed by `/status.json`.

Show:

- Overall system status
- Last data update
- Last source check
- Failing feeds
- Official source freshness
- Monitor status
- Known limitations

## 8. Data Model

Replace the current hantavirus-specific `meta.json`, `markers.json`, and related types with generalized records.

### `src/data/signals.json`

```json
[
  {
    "id": "ebola-bundibugyo-drc-2026",
    "name": "Ebola disease - Bundibugyo virus, DRC",
    "category": "vhf",
    "pathogen": "Bundibugyo virus",
    "geography": ["Democratic Republic of the Congo", "Ituri", "Bunia", "Mongwalu", "Rwampara"],
    "severity": "action",
    "confidence": "official",
    "trend": "increasing",
    "status": "active",
    "summary": "Short source-backed situation summary.",
    "operationalRelevance": "Why public health, EMS, or healthcare preparedness users should care.",
    "metrics": [
      { "label": "Suspected cases", "value": 246, "sourceId": "pandemic-center-special-report-2026-05-15" },
      { "label": "Deaths", "value": 65, "sourceId": "pandemic-center-special-report-2026-05-15" }
    ],
    "primarySourceId": "pandemic-center-special-report-2026-05-15",
    "lastUpdated": "2026-05-15T00:00:00Z",
    "lastChecked": "2026-05-19T00:00:00Z"
  }
]
```

### `src/data/signal-timeline.json`

```json
[
  {
    "id": "t-20260515-ebola-drc-africa-cdc",
    "signalId": "ebola-bundibugyo-drc-2026",
    "date": "2026-05-15",
    "title": "Africa CDC reports suspected Ebola outbreak in Ituri",
    "description": "Short factual description.",
    "sourceId": "pandemic-center-special-report-2026-05-15",
    "category": "vhf"
  }
]
```

### `src/data/sources.json`

Keep the existing source registry pattern, but generalize fields:

```json
[
  {
    "id": "pandemic-center-tracking-report-2026-05-14",
    "authority": "Brown Pandemic Center",
    "title": "Tracking Report - May 14, 2026",
    "sourceType": "expert-weekly-report",
    "primary": false,
    "url": "source URL or official/expert report reference",
    "publicationDate": "2026-05-14",
    "lastVerified": "2026-05-19",
    "domains": ["zoonotic", "vaccine_preventable", "respiratory", "environmental"],
    "notes": "Verify against primary or expert source before publication."
  }
]
```

### `src/data/status.json` Or `public/status.json`

Preserve the current public status contract, but generalize fields:

- active signal count
- highest severity
- degraded sources
- stale signals
- failed official sources
- generatedAt
- lastSuccessfulRun
- staleReasons

## 9. Automation Requirements

Preserve these current resilience patterns:

- `npm run validate:data`
- parser regression tests
- public `/status.json`
- production freshness verification
- stale-data issue automation
- pipeline-failure issue automation
- independent status monitor workflow
- `npm audit` clean state

Initial MVP automation can use curated static records plus a source registry. Do not require full automated ingestion of all sources for the first Claude Code build. Add source-specific parsers incrementally after the UI and data model are stable.

## 10. Build Phases For Claude Code

### Phase 1 - Clone And Rename

- Clone the current repo into a new project directory/repo.
- Rename project to `biosecurity-intel-dashboard`.
- Replace user-facing Hantavirus-specific names with Biosecurity Intelligence Dashboard language.
- Update package name, README, status URL placeholders, and metadata.
- Keep the existing Vite/React/static architecture.

### Phase 2 - Generalize Data Model

- Add `signals.json`, `signal-timeline.json`, generalized `sources.json`, and generalized `status.json`.
- Update TypeScript types.
- Build data validation for generalized schemas.
- Keep existing hantavirus data only as one optional signal record, not the whole app model.

### Phase 3 - Rebuild UI Information Architecture

- Replace nav with Overview, Signals, Map, Timeline, Briefings, Resources, Sources, Status, About.
- Build dense Overview page.
- Build Signals list and signal detail route/drawer.
- Build Resources page filters.
- Build Status page backed by `public/status.json`.

### Phase 4 - Add Initial Monitored Signals

- Add initial monitored signals from verified public or expert sources:
  - Andes virus/hantavirus MV Hondius
  - Ebola/Bundibugyo in DRC
  - Measles US
  - Mpox Africa/South Sudan/Connecticut clade I
  - Avian influenza H5/H5N6
  - Cholera Africa/Republic of Congo
  - Seasonal influenza
  - COVID wastewater
  - Norovirus wastewater
  - RSV wastewater
  - Human metapneumovirus wastewater
  - Lassa fever
  - Chikungunya
  - Candida auris wastewater
  - New World screwworm
  - FIFA World Cup preparedness
- Mark Pandemic Center records as secondary/expert source unless a direct official source is added.

### Phase 5 - Preserve And Adapt Resilience

- Update validation to check generalized data.
- Update status generation to report multi-signal health.
- Update production verifier to check new status fields.
- Keep status monitor workflow.
- Ensure `npm run build`, `npm run validate:data`, and `npm audit` pass.

## 11. Claude Code Prompt

Use this prompt with Claude Code:

```text
You are working in a cloned copy of the existing EMERGENZ hantavirus-intel-dashboard repository. Your task is to convert the clone into a broader static Biosecurity Intelligence Dashboard while preserving the current resilience patterns.

Read BIOSECURITY-MONITORING-BUILD-PACKET.md completely before editing.

Primary objective:
Build a static Vite/React biosecurity monitoring dashboard that supports multiple biological threat signals instead of one hantavirus incident.

Implementation rules:
- Do not modify the original hantavirus repo. Work only in the cloned biosecurity project.
- Keep the app static. Do not add a backend, database, authentication, or serverless API routes.
- Preserve the existing resilience concepts: data validation, public status endpoint, production verifier, parser test pattern, stale-data alerts, pipeline-failure alerts, and status monitor.
- Replace disease-specific UI and data structures with generalized multi-threat structures.
- Keep the UI operational and dense. Do not create a marketing landing page.
- Use source provenance everywhere. No unsourced facts.
- Label Pandemic Center records as secondary/expert-source context unless a primary official source is also added.
- Avoid overbuilding. Build the MVP described in the packet, not a full intelligence platform.

Required deliverables:
1. Generalized data model:
   - src/data/signals.json
   - src/data/signal-timeline.json
   - generalized src/data/sources.json
   - public/status.json updated for multi-signal health
   - TypeScript types for these records

2. UI:
   - Overview page with priority signal queue, domain grid, freshness/status panel, map preview, and recent developments.
   - Signals list page.
   - Signal detail route or drawer.
   - Map page with category/severity filters.
   - Timeline page for cross-domain events.
   - Briefings page for generated/static operational summaries.
   - Resources page with filters by domain, source authority, geography, resource type, and primary/secondary source.
   - Sources page preserving evidence registry behavior.
   - Status page backed by public/status.json.
   - About page updated for the biosecurity product.

3. Automation:
   - Update validate-data script for generalized schemas.
   - Update status generation or static status file for multi-signal state.
   - Keep monitor:status working.
   - Keep build passing.
   - Keep npm audit clean.

4. Initial content:
   Initial monitored signals from verified public or expert sources:
   - Andes virus / hantavirus MV Hondius
   - Ebola / Bundibugyo virus in DRC
   - Measles US
   - Mpox Africa / South Sudan / Connecticut clade I
   - Avian influenza H5/H5N6
   - Cholera Africa / Republic of Congo
   - Seasonal influenza
   - COVID-19 wastewater
   - Norovirus wastewater
   - RSV wastewater
   - Human metapneumovirus wastewater
   - Lassa fever
   - Chikungunya
   - Candida auris wastewater
   - New World screwworm
   - FIFA World Cup preparedness

Acceptance criteria:
- npm run build passes.
- npm run validate:data passes.
- npm run monitor:status passes against local or configured status endpoint.
- npm audit reports 0 vulnerabilities.
- No Hantavirus-specific branding remains in global navigation, app title, README, status monitor, or About page.
- Hantavirus remains only as one signal among many.
- Every signal has source provenance.
- UI supports scanning many threats without requiring users to open every detail page.
- No new runtime API dependency is introduced.

After implementation:
- Provide a concise change summary.
- List files changed.
- List assumptions made.
- List any unfinished work or source URLs that need manual verification.
```

## 12. Codex Review And Hardening Plan After Claude Code

After Claude Code builds the clone, Codex should review and harden it in this order:

1. Run `git diff` and inspect for scope creep, new dependencies, accidental backend/API additions, or unsourced claims.
2. Run `npm audit`, `npm run build`, `npm run validate:data`, and `npm run monitor:status`.
3. Review data schemas and source provenance.
4. Test UI flows:
   - Overview scan
   - signal list to detail
   - map filtering
   - resources filtering
   - source registry links
   - status page
5. Review accessibility and mobile layout.
6. Harden automation and status contracts.
7. Remove unused old hantavirus-specific files or convert them into generalized signal content.
8. Commit only after the build is stable and the dashboard is coherent.

## 13. Known Risks

- Some expert reports may contain indirect or redirected source links. Claude should verify primary source URLs before presenting official claims.
- Broad biosecurity scope can sprawl quickly. MVP must stay focused on monitoring, triage, provenance, and status.
- Wastewater and animal-health signals vary in geography and cadence; do not force all signals into a case-count model.
- Multi-threat severity is not the same as clinical severity. It should reflect operational monitoring priority.
- If the new dashboard is deployed publicly, disclaimers must be updated to reflect broad situational awareness rather than disease-specific guidance.
