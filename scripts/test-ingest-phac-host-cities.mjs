#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Offline unit tests for the PHAC host-city ingestion transform. No network:
 * the pure functions are fed synthetic trend + main CSV-row fixtures.
 * Run: node scripts/test-ingest-phac-host-cities.mjs
 */
import {
  levelToObservationFields,
  parseCsv,
  rollupRegionLevel,
  latestRegionDate,
  buildObservation,
  applyIngestion,
  canadaHostCities,
  isStale,
} from './ingest-phac-host-cities.mjs'

let failures = 0
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`  ✗ ${msg}`) }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`)
}

// --- level mapping -----------------------------------------------------------
eq(levelToObservationFields('High')?.status, 'elevated', 'High → elevated')
eq(levelToObservationFields('High')?.severity, 'watch', 'High severity capped at watch')
eq(levelToObservationFields('Medium')?.status, 'normal', 'Medium → normal (conservative)')
eq(levelToObservationFields('Low')?.status, 'normal', 'Low → normal')
eq(levelToObservationFields('New'), null, '"New" site → null (skip)')
eq(levelToObservationFields('Bogus'), null, 'unknown level → null (no fabrication)')

// --- CSV parse ---------------------------------------------------------------
const parsed = parseCsv('region,Location,measureid,latestLevel,latestTrend\nToronto,Toronto Humber,covN2,High,Increasing')
eq(parsed.length, 1, 'parseCsv yields one row')
eq(parsed[0].latestLevel, 'High', 'parseCsv maps columns by header')

// --- fixtures ----------------------------------------------------------------
const trendRows = [
  { region: 'Toronto', Location: 'Toronto Ashbridges Bay', measureid: 'covN2', latestLevel: 'Low', latestTrend: 'No change' },
  { region: 'Toronto', Location: 'Toronto Humber', measureid: 'covN2', latestLevel: 'High', latestTrend: 'Increasing' },
  { region: 'Vancouver', Location: 'Vancouver Iona Island', measureid: 'covN2', latestLevel: 'New', latestTrend: 'No change' },
  { region: 'Winnipeg', Location: 'Winnipeg West End', measureid: 'covN2', latestLevel: 'High', latestTrend: 'Increasing' },
]
const mainRows = [
  { Date: '2026-06-01', region: 'Toronto', measureid: 'covN2' },
  { Date: '2026-06-08', region: 'Toronto', measureid: 'covN2' },
  { Date: '2026-05-31', region: 'Vancouver', measureid: 'covN2' },
]

// --- rollup ------------------------------------------------------------------
const tor = rollupRegionLevel(trendRows, 'Toronto')
eq(tor?.level, 'High', 'Toronto rollup takes max level across sites')
eq(tor?.siteCount, 2, 'Toronto rollup counts sites')
eq(tor?.trend, 'varies across sites', 'mixed trends collapse to "varies across sites"')
eq(rollupRegionLevel(trendRows, 'Vancouver'), null, 'Vancouver has only a "New" site → null (skip)')
eq(rollupRegionLevel(trendRows, 'Calgary'), null, 'no rows for region → null')
eq(latestRegionDate(mainRows, 'Toronto'), '2026-06-08', 'latestRegionDate picks max date')

// --- buildObservation --------------------------------------------------------
const city = { id: 'toronto', country: 'Canada', displayName: 'Toronto', regionOrState: 'Ontario' }
const obs = buildObservation({ city, rollup: tor, sampleDate: '2026-06-08', runDateIso: '2026-06-15', publish: 'auto' })
eq(obs.id, 'auto-phac-toronto-sars-cov-2-2026-06-08', 'deterministic id format')
eq(obs.provenance, 'auto-phac', 'provenance tag')
eq(obs.sourceId, 'phac-nwmp', 'cites PHAC source')
eq(obs.status, 'elevated', 'High → elevated')
eq(obs.severity, 'watch', 'severity capped at watch')
eq(obs.publicDisplayAllowed, true, 'policy=auto → public')
eq(obs.sampleDate, '2026-06-08', 'sampleDate from dated main file')
eq(
  buildObservation({ city, rollup: tor, sampleDate: null, runDateIso: '2026-06-15', publish: 'auto' }),
  null,
  'no date → no observation (self-healing freshness depends on a real date)',
)

// --- applyIngestion: Canada-only, preserves other provenance, idempotent -----
const nwssObs = {
  id: 'auto-nwss-toronto-x', hostCityId: 'toronto', provenance: 'auto-nwss', domain: 'respiratory',
  pathogenOrSyndrome: 'x', observationType: 'wastewater', status: 'normal', severity: 'monitor',
  confidence: 'official', sampleDate: '2026-06-01', sourceId: 'cdc-nwss', sourceUrl: 'https://x',
  lastVerified: '2026-06-01', summary: 's', publicDisplayAllowed: true,
}
const doc = {
  schemaVersion: 1, parentSignalId: 'fifa', lastReviewed: '2026-06-15',
  hostCities: [
    { id: 'toronto', country: 'Canada', displayName: 'Toronto', regionOrState: 'Ontario', observations: [nwssObs] },
    { id: 'dallas', country: 'United States', displayName: 'Dallas', regionOrState: 'Texas', observations: [] },
  ],
}
eq(canadaHostCities(doc).length, 1, 'canadaHostCities excludes US')

const r1 = applyIngestion({ doc, trendRows, mainRows, runDateIso: '2026-06-15', publish: 'auto' })
const torCity = r1.doc.hostCities.find((c) => c.id === 'toronto')
const dallas = r1.doc.hostCities.find((c) => c.id === 'dallas')
eq(torCity.observations.filter((o) => o.provenance === 'auto-phac').length, 1, 'Toronto gets one auto-phac obs')
assert(torCity.observations.some((o) => o.id === 'auto-nwss-toronto-x'), 'auto-nwss obs preserved (writers do not clobber each other)')
eq(dallas.observations.length, 0, 'US city untouched by PHAC writer')

const r2 = applyIngestion({ doc: r1.doc, trendRows, mainRows, runDateIso: '2026-06-15', publish: 'auto' })
eq(JSON.stringify(r2.doc), JSON.stringify(r1.doc), 'idempotent: re-run replaces only auto-phac, output unchanged')

// --- staleness guard: PHAC's frozen feed yields no observations --------------
eq(isStale('2026-06-08', '2026-06-15'), false, 'recent data is not stale')
eq(isStale('2024-06-23', '2026-06-15'), true, 'frozen 2024 feed is stale')
// mainRows here date to 2026-06-08; from a 2026-09 run they are all stale.
const rStale = applyIngestion({ doc, trendRows, mainRows, runDateIso: '2026-09-01', publish: 'auto' })
eq(rStale.written.length, 0, 'stale PHAC feed writes no observations (honest "No current data")')

if (failures > 0) {
  console.error(`[test-ingest-phac] FAILED (${failures} assertion${failures === 1 ? '' : 's'})`)
  process.exit(1)
}
console.log('[test-ingest-phac] OK')
