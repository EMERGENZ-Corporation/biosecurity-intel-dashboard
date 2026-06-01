// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * EMERGENZ Biosecurity Intel Dashboard — Signal Data Refresh
 *
 * One-time script to update fast-moving signals with verified primary-source data
 * gathered on 2026-05-23. Separate from generate-status / generate-api because
 * it mutates signal content, not just status metadata.
 *
 * Sources used:
 *  - CDC Measles Data Research (cdc.gov/measles/data-research): 1,952 cases YTD,
 *    29 outbreaks, 40 jurisdictions, 92.5% kindergartener MMR coverage (May 21 2026)
 *  - Africa CDC epidemic intelligence (via Brown Pandemic Center Tracking Report,
 *    May 21 2026): 40,707 cholera cases Jan 1-May 14 2026, down 65% YOY
 *  - CDC H5 Avian Influenza Situation Summary (cdc.gov/bird-flu): 71 US human
 *    cases since Feb 2024, no deaths, current risk LOW (May 2026)
 *  - Ebola: WHO declaration + Africa CDC DRC/Uganda confirmation, specific case
 *    counts not independently verified at time of run (WHO DON pages timing out)
 *  - WastewaterSCAN (CC BY-NC 4.0 Stanford/Emory/Verily): tracker URL added to
 *    wastewater signal summaries as link-out fix for the "no concentration curves"
 *    UX gap
 *
 * Per CONTENT-STANDARDS.md:
 *  - Metrics only added when value sourced directly from a registered Tier 1/2 source
 *  - Narratives that cite a secondary-reported figure note the intermediary source
 *  - No fabrication; uncertain fields use null or descriptive text
 */

import { readFileSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const signals = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8'))

const NOW = '2026-05-23T00:00:00Z'
const NOW_CHECKED = '2026-05-23T12:00:00Z'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function patch(id, changes) {
  const idx = signals.findIndex(s => s.id === id)
  if (idx === -1) throw new Error(`Signal not found: ${id}`)
  signals[idx] = { ...signals[idx], ...changes }
  console.log(`  ✓ patched ${id}`)
}

// ---------------------------------------------------------------------------
// Bundle 1a — Measles US
// Source: CDC Measles Data Research, verified May 21 2026
// https://www.cdc.gov/measles/data-research/index.html
// ---------------------------------------------------------------------------
patch('measles-us-2026', {
  summary:
    'CDC confirmed 1,952 measles cases across 40 jurisdictions in 2026 (as of May 21), ' +
    'representing 29 outbreaks with 93% of cases outbreak-associated. No deaths reported ' +
    'in 2026. U.S. kindergartener MMR coverage has declined to 92.5% (from 95.2% in ' +
    '2019–2020), leaving approximately 286,000 kindergarteners unvaccinated — the ' +
    'structural driver of sustained outbreak activity.',
  currentSituation:
    'CDC confirmed 1,952 measles cases YTD as of May 21, 2026, across 40 jurisdictions ' +
    'in 29 discrete outbreaks. Ninety-three percent of cases are outbreak-associated; ' +
    '9 cases involved international visitors to the U.S. No measles deaths have been ' +
    'reported in 2026. National kindergartener MMR vaccine coverage declined to 92.5% ' +
    '(2024–2025 school year), with an estimated 286,000 unvaccinated kindergarteners ' +
    'representing the principal immunity gap driving ongoing outbreaks.',
  confidence: 'official',
  metrics: [
    {
      label: 'Confirmed US cases YTD (as of May 21, 2026)',
      value: 1952,
      sourceId: 'cdc-current-outbreaks',
    },
    {
      label: 'Active outbreaks',
      value: 29,
      sourceId: 'cdc-current-outbreaks',
    },
    {
      label: 'US jurisdictions with cases',
      value: 40,
      sourceId: 'cdc-current-outbreaks',
    },
  ],
  lastUpdated: NOW,
  lastChecked: NOW_CHECKED,
})

// ---------------------------------------------------------------------------
// Bundle 1b — Ebola Bundibugyo DRC/Uganda
// WHO declaration confirmed; specific case counts not independently verified
// (WHO DON pages returning 404 at time of run; Africa CDC homepage confirms
// DRC + Uganda spread). No fabricated metrics; narrative only.
// ---------------------------------------------------------------------------
patch('ebola-bundibugyo-drc-2026', {
  summary:
    'WHO has declared the Bundibugyo ebolavirus outbreak in the Democratic Republic of ' +
    'the Congo, with Africa CDC confirming active outbreak monitoring in both the DRC and ' +
    'Uganda. Multi-health-zone spread in eastern DRC continues; cross-border movement ' +
    'elevates geographic risk. Specific case and fatality counts require direct ' +
    'verification against the current WHO Disease Outbreak News (who.int/emergencies/' +
    'disease-outbreak-news) or Africa CDC epidemic intelligence report.',
  currentSituation:
    'WHO has declared the Bundibugyo ebolavirus outbreak across multiple health zones in ' +
    'the DRC. Africa CDC has confirmed outbreak monitoring in both DRC and Uganda, ' +
    'reflecting cross-border surveillance activation. No licensed vaccine specific to ' +
    'Bundibugyo virus is currently available. Current case and death totals should be ' +
    'verified against the latest WHO DON before operational briefing — WHO DON archive: ' +
    'who.int/emergencies/disease-outbreak-news.',
  geography: [
    'Democratic Republic of the Congo',
    'Uganda',
    'Ituri Province',
    'Bunia',
    'Mongwalu',
    'Rwampara',
  ],
  lastUpdated: NOW,
  lastChecked: NOW_CHECKED,
})

// ---------------------------------------------------------------------------
// Bundle 1c — Cholera Africa
// Source: Africa CDC epidemic intelligence (via Brown Pandemic Center Tracking
// Report, May 21 2026, which cited Africa CDC directly)
// KEY CHANGE: trend "increasing" → "decreasing" — 65% YOY decline confirmed
// ---------------------------------------------------------------------------
patch('cholera-africa-2026', {
  trend: 'decreasing',
  summary:
    'Africa CDC reported 40,707 cholera cases continent-wide from January 1 through ' +
    'May 14, 2026 — a 65% year-over-year decline compared to the same period in 2025. ' +
    'Despite the overall volume decrease, case fatality ratios remain elevated in ' +
    'conflict-affected and low-healthcare-access settings. Sudan, Ethiopia, Somalia, ' +
    'Mozambique, Malawi, and Zimbabwe continue reporting active transmission.',
  currentSituation:
    'Africa CDC epidemic intelligence recorded 40,707 cholera cases across the continent ' +
    'from January 1 through May 14, 2026, representing a 65% year-over-year decline from ' +
    'the same period in 2025 (Africa CDC; Brown Pandemic Center Tracking Report, May 21 ' +
    '2026). Despite declining case volume, case fatality ratios remain disproportionately ' +
    'high in settings with conflict, population displacement, and constrained WASH ' +
    'infrastructure. Active outbreak settings include Sudan (Khartoum conflict zone), ' +
    'Ethiopia, Somalia, Mozambique, Malawi, Zambia, and Zimbabwe.',
  metrics: [
    {
      label: 'Africa-wide cases (Jan 1–May 14, 2026)',
      value: 40707,
      sourceId: 'africa-cdc-outbreaks',
    },
  ],
  lastUpdated: NOW,
  lastChecked: NOW_CHECKED,
})

// ---------------------------------------------------------------------------
// Bundle 1d — Avian Influenza H5
// Source: CDC H5 Avian Influenza Situation Summary, verified May 2026
// https://www.cdc.gov/bird-flu/situation-summary/index.html
// Poultry trend from USDA APHIS via Brown Pandemic Center May 21 2026
// ---------------------------------------------------------------------------
patch('avian-influenza-h5-2026', {
  summary:
    'H5 avian influenza remains a One Health surveillance priority. CDC has confirmed ' +
    '71 U.S. human cases since February 2024, all exposure-linked (dairy and poultry ' +
    'workers), with no deaths and no sustained human-to-human transmission. Current CDC ' +
    'public health risk assessment: LOW. U.S. poultry detections are declining from the ' +
    'February 2026 peak (~11.4 million birds); approximately 140,000 birds affected in ' +
    'May 2026. Dairy cattle herd detections continue.',
  currentSituation:
    'CDC confirmed 71 U.S. human cases of H5 avian influenza since February 2024 through ' +
    'May 2026 — all with documented animal exposure, no deaths, no antiviral resistance ' +
    'in available human isolates, and no evidence of sustained human-to-human ' +
    'transmission. CDC current public health risk assessment remains LOW. Poultry ' +
    'detections have declined substantially from the February 2026 peak of approximately ' +
    '11.4 million birds affected to approximately 140,000 birds in May 2026 (USDA APHIS ' +
    'via Brown Pandemic Center Tracking Report, May 21 2026). Dairy cattle herd ' +
    'detections continue across multiple states. Influenza A indicators have plateaued ' +
    'for two consecutive weeks after a nine-week seasonal decline.',
  metrics: [
    {
      label: 'US human cases since February 2024 (no deaths)',
      value: 71,
      sourceId: 'cdc-current-outbreaks',
    },
  ],
  lastUpdated: NOW,
  lastChecked: NOW_CHECKED,
})

// ---------------------------------------------------------------------------
// Bundle 2 — WastewaterSCAN link-out fix
// Adds live tracker URL to summary of all 5 wastewater signals.
// Per CC BY-NC 4.0 attribution requirements; tracker URL verified reachable.
// ---------------------------------------------------------------------------
const wastewaterTrackerNote =
  ' Live nationwide concentration trends: data.wastewaterscan.org/tracker ' +
  '(WastewaterSCAN — Stanford/Emory/Verily, CC BY-NC 4.0).'

const wastewaterIds = [
  'covid-wastewater-2026',
  'norovirus-wastewater-2026',
  'rsv-wastewater-2026',
  'hmpv-wastewater-2026',
  'candida-auris-wastewater-2026',
]

for (const id of wastewaterIds) {
  const idx = signals.findIndex(s => s.id === id)
  if (idx === -1) { console.warn(`  ⚠ wastewater signal not found: ${id}`); continue }
  const s = signals[idx]
  // Only append if not already present
  if (!s.summary.includes('data.wastewaterscan.org')) {
    signals[idx] = {
      ...s,
      summary: s.summary.trimEnd() + wastewaterTrackerNote,
      lastChecked: NOW_CHECKED,
    }
    console.log(`  ✓ linked wastewaterscan tracker on ${id}`)
  } else {
    console.log(`  – tracker already linked on ${id}, skipping`)
  }
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
writeFileSync(SIGNALS_PATH, JSON.stringify(signals, null, 2) + '\n')
console.log(`\n[refresh-signal-data] done — wrote ${SIGNALS_PATH}`)
