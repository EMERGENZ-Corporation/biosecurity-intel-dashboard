#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Offline unit tests for the CDC NWSS host-city ingestion transform. No network:
 * the pure functions are fed a synthetic Socrata-row fixture so correctness is
 * verified deterministically. Run: node scripts/test-ingest-nwss-host-cities.mjs
 */
import {
  categoryToObservationFields,
  latestWeekRollup,
  buildObservation,
  applyIngestion,
  usStates,
} from './ingest-nwss-host-cities.mjs'

let failures = 0
function assert(cond, msg) {
  if (!cond) {
    failures++
    console.error(`  ✗ ${msg}`)
  }
}
function eq(actual, expected, msg) {
  assert(actual === expected, `${msg} (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`)
}

// --- category mapping --------------------------------------------------------
eq(categoryToObservationFields('Very High')?.status, 'elevated', 'Very High → elevated')
eq(categoryToObservationFields('Very High')?.severity, 'watch', 'Very High severity capped at watch')
eq(categoryToObservationFields('High')?.status, 'elevated', 'High → elevated')
eq(categoryToObservationFields('Moderate')?.status, 'normal', 'Moderate → normal')
eq(categoryToObservationFields('Low')?.status, 'normal', 'Low → normal')
eq(categoryToObservationFields('Very Low')?.severity, 'monitor', 'Very Low → monitor')
eq(categoryToObservationFields('Limited'), null, 'unknown category → null (skip, no fabrication)')

// --- fixture -----------------------------------------------------------------
const rows = [
  // Georgia SARS-CoV-2, latest week: Very Low + High across sites → max = High
  { state_territory: 'Georgia', pathogen_target: 'SARS-CoV-2', week_end: '2026-06-06', site_wval_category: 'Very Low', date_updated: '2026-06-12 11:00' },
  { state_territory: 'Georgia', pathogen_target: 'SARS-CoV-2', week_end: '2026-06-06', site_wval_category: 'High', date_updated: '2026-06-12 11:00' },
  // Older week — must be ignored when a newer week exists.
  { state_territory: 'Georgia', pathogen_target: 'SARS-CoV-2', week_end: '2026-05-30', site_wval_category: 'Very High', date_updated: '2026-06-05 11:00' },
  // Georgia Influenza A, latest week: Low → normal
  { state_territory: 'Georgia', pathogen_target: 'Influenza A virus', week_end: '2026-06-06', site_wval_category: 'Low', date_updated: '2026-06-12 11:00' },
  // Georgia RSV, unmappable category → no observation
  { state_territory: 'Georgia', pathogen_target: 'RSV', week_end: '2026-06-06', site_wval_category: 'Limited', date_updated: '2026-06-12 11:00' },
  // A different state, should not leak into Georgia.
  { state_territory: 'Texas', pathogen_target: 'SARS-CoV-2', week_end: '2026-06-06', site_wval_category: 'Very High', date_updated: '2026-06-12 11:00' },
]

// --- rollup ------------------------------------------------------------------
const ga = latestWeekRollup(rows, 'Georgia', 'SARS-CoV-2')
eq(ga?.category, 'High', 'rollup takes max category in the latest week (not the older Very High week)')
eq(ga?.weekEnd, '2026-06-06', 'rollup selects the most recent week_end')
eq(ga?.siteCount, 2, 'rollup counts sites in the latest week')
eq(latestWeekRollup(rows, 'Georgia', 'RSV'), null, 'rollup returns null when no mappable category')
eq(latestWeekRollup(rows, 'Florida', 'SARS-CoV-2'), null, 'rollup returns null for a state with no rows')

// --- buildObservation --------------------------------------------------------
const city = { id: 'atlanta', country: 'United States', regionOrState: 'Georgia' }
const pathogen = { target: 'SARS-CoV-2', display: 'SARS-CoV-2 (wastewater)', slug: 'sars-cov-2' }
const obsAuto = buildObservation({ city, pathogen, rollup: ga, runDateIso: '2026-06-14', publish: 'auto' })
eq(obsAuto.id, 'auto-nwss-atlanta-sars-cov-2-2026-06-06', 'deterministic id format')
eq(obsAuto.provenance, 'auto-nwss', 'provenance tag')
eq(obsAuto.domain, 'respiratory', 'domain respiratory')
eq(obsAuto.observationType, 'wastewater', 'observationType wastewater')
eq(obsAuto.status, 'elevated', 'High → elevated status')
eq(obsAuto.severity, 'watch', 'severity capped at watch')
eq(obsAuto.publicDisplayAllowed, true, 'policy=auto → publicDisplayAllowed true')
eq(obsAuto.sampleDate, '2026-06-06', 'sampleDate = week end')
eq(obsAuto.reportDate, '2026-06-12', 'reportDate from date_updated')
eq(obsAuto.reportingLagDays, 6, 'reportingLagDays = report - sample')

const obsStaged = buildObservation({ city, pathogen, rollup: ga, runDateIso: '2026-06-14', publish: 'staged' })
eq(obsStaged.publicDisplayAllowed, false, 'policy=staged → publicDisplayAllowed false')

// --- applyIngestion: US-only, preserves curated, idempotent ------------------
const curatedObs = {
  id: 'curated-atlanta-1', hostCityId: 'atlanta', domain: 'enteric',
  pathogenOrSyndrome: 'Norovirus', observationType: 'clinical-surveillance', status: 'normal',
  severity: 'monitor', confidence: 'official', sampleDate: '2026-06-01', sourceId: 'cdc-nwss',
  sourceUrl: 'https://example.org', lastVerified: '2026-06-01', summary: 'human-authored',
  publicDisplayAllowed: true, provenance: 'curated',
}
const doc = {
  schemaVersion: 1, parentSignalId: 'fifa', lastReviewed: '2026-06-14',
  hostCities: [
    { id: 'atlanta', country: 'United States', regionOrState: 'Georgia', observations: [curatedObs] },
    { id: 'toronto', country: 'Canada', regionOrState: 'Ontario', observations: [] },
  ],
}

eq(usStates(doc).length, 1, 'usStates excludes Canada')
eq(usStates(doc)[0], 'Georgia', 'usStates returns Georgia')

const r1 = applyIngestion({ doc, rows, runDateIso: '2026-06-14', publish: 'auto' })
const atl = r1.doc.hostCities.find((c) => c.id === 'atlanta')
const tor = r1.doc.hostCities.find((c) => c.id === 'toronto')
const atlAuto = atl.observations.filter((o) => o.provenance === 'auto-nwss')
const atlCurated = atl.observations.filter((o) => o.provenance === 'curated')
eq(atlAuto.length, 2, 'Atlanta gets SARS-CoV-2 + Influenza A (RSV skipped, unmappable)')
eq(atlCurated.length, 1, 'curated observation preserved')
assert(atl.observations.some((o) => o.id === 'curated-atlanta-1'), 'curated obs untouched by ingestion')
eq(tor.observations.length, 0, 'Canada city gets no auto observations (US-only)')
eq(r1.written.length, 2, 'report counts written observations')

// Idempotency: re-running on the produced doc yields byte-identical output.
const r2 = applyIngestion({ doc: r1.doc, rows, runDateIso: '2026-06-14', publish: 'auto' })
eq(
  JSON.stringify(r2.doc),
  JSON.stringify(r1.doc),
  'idempotent: second run replaces prior auto-nwss obs, output unchanged',
)

if (failures > 0) {
  console.error(`[test-ingest-nwss] FAILED (${failures} assertion${failures === 1 ? '' : 's'})`)
  process.exit(1)
}
console.log('[test-ingest-nwss] OK')
