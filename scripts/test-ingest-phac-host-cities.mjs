#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Offline unit tests for the PHAC host-city ingestion transform. No network:
 * the pure functions are fed CSV fixtures matching the CURRENT PHAC
 * /src/data/wastewater/wastewater_trend.csv schema.
 * Run: node scripts/test-ingest-phac-host-cities.mjs
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import {
  levelToObservationFields,
  parseCsv,
  rollupCityPathogen,
  buildObservation,
  applyIngestion,
  canadaHostCities,
  isStale,
} from './ingest-phac-host-cities.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const currentRows = parseCsv(readFileSync(join(here, 'fixtures', 'phac-wastewater-trend-current.csv'), 'utf8'))
const staleRows = parseCsv(readFileSync(join(here, 'fixtures', 'phac-wastewater-trend-stale.csv'), 'utf8'))

let failures = 0
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`  ✗ ${msg}`) }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`)
}

// --- level mapping (current PHAC value set) ----------------------------------
eq(levelToObservationFields('High')?.status, 'elevated', 'High → elevated')
eq(levelToObservationFields('High')?.severity, 'watch', 'High severity capped at watch')
eq(levelToObservationFields('Moderate')?.status, 'normal', 'Moderate → normal (conservative)')
eq(levelToObservationFields('Low')?.status, 'normal', 'Low → normal')
eq(levelToObservationFields('Non-detect')?.status, 'normal', 'Non-detect → normal')
eq(levelToObservationFields('NA2'), null, 'NA2 → null (skip, no fabrication)')
eq(levelToObservationFields(''), null, 'blank → null')

// --- CSV parse: real header is read correctly --------------------------------
assert(currentRows.length > 0 && 'Viral_Activity_Level' in currentRows[0] && 'weekStart' in currentRows[0],
  'parseCsv reads the current PHAC header (Viral_Activity_Level, weekStart)')

// --- rollup: prefers PHAC city-aggregate, falls back to site-max -------------
const torCov = rollupCityPathogen(currentRows, 'Toronto', 'covN2')
eq(torCov?.level, 'High', 'Toronto covN2 uses the City-aggregate row (High), not the Low site row')
eq(torCov?.basis, 'city-aggregate', 'Toronto covN2 basis is city-aggregate')
eq(torCov?.weekStart, '2026-05-31', 'rollup picks the latest week and ignores the NA2 prior week')

const vanFlu = rollupCityPathogen(currentRows, 'Metro Vancouver', 'fluA')
eq(vanFlu?.level, 'High', 'Vancouver fluA has no City row → site-max (High)')
eq(vanFlu?.basis, 'site-max', 'Vancouver fluA basis is site-max fallback')

eq(rollupCityPathogen(currentRows, 'Metro Vancouver', 'rsv'), null, 'Vancouver rsv absent → null (skip)')
eq(rollupCityPathogen(currentRows, 'Calgary', 'covN2'), null, 'unknown city → null')

// --- buildObservation: category preserved, capped, dated, provenance ---------
const city = { id: 'toronto', country: 'Canada', displayName: 'Toronto' }
const pathogen = { measureid: 'covN2', display: 'SARS-CoV-2 (wastewater)', slug: 'sars-cov-2' }
const obs = buildObservation({ city, pathogen, rollup: torCov, runDateIso: '2026-06-15', publish: 'auto' })
eq(obs.id, 'auto-phac-toronto-sars-cov-2-2026-05-31', 'deterministic id with weekStart')
eq(obs.provenance, 'auto-phac', 'provenance auto-phac')
eq(obs.sourceId, 'phac-nwmp', 'cites PHAC source')
eq(obs.status, 'elevated', 'High → elevated')
eq(obs.severity, 'watch', 'severity capped at watch')
eq(obs.publicDisplayAllowed, true, 'policy=auto → public')
eq(obs.sampleDate, '2026-05-31', 'sampleDate = weekStart')
assert(obs.summary.includes('"High"'), 'PHAC category preserved verbatim in summary')

// --- staleness guard ---------------------------------------------------------
eq(isStale('2026-05-31', '2026-06-15'), false, 'recent weekStart is not stale')
eq(isStale('2024-06-23', '2026-06-15'), true, 'frozen 2024 weekStart is stale')
const torStale = rollupCityPathogen(staleRows, 'Toronto', 'covN2')
eq(buildObservation({ city, pathogen, rollup: torStale, runDateIso: '2026-06-15', publish: 'auto' }), null,
  'stale weekStart → no observation built (honest "No current data")')

// --- applyIngestion: current fixture publishes; stale fixture does not --------
const doc = {
  schemaVersion: 1, parentSignalId: 'fifa', lastReviewed: '2026-06-15',
  hostCities: [
    { id: 'toronto', country: 'Canada', displayName: 'Toronto', regionOrState: 'Ontario', observations: [] },
    { id: 'vancouver', country: 'Canada', displayName: 'Vancouver', regionOrState: 'British Columbia', observations: [] },
    { id: 'dallas', country: 'United States', displayName: 'Dallas', regionOrState: 'Texas', observations: [
      { id: 'auto-nwss-dallas-x', hostCityId: 'dallas', provenance: 'auto-nwss', domain: 'respiratory',
        pathogenOrSyndrome: 'x', observationType: 'wastewater', status: 'normal', severity: 'monitor',
        confidence: 'official', sampleDate: '2026-06-06', sourceId: 'cdc-nwss', sourceUrl: 'https://x',
        lastVerified: '2026-06-06', summary: 's', publicDisplayAllowed: true },
    ] },
  ],
}
eq(canadaHostCities(doc).length, 2, 'canadaHostCities finds Toronto + Vancouver')

const r = applyIngestion({ doc, rows: currentRows, runDateIso: '2026-06-15', publish: 'auto' })
const tor = r.doc.hostCities.find((c) => c.id === 'toronto')
const van = r.doc.hostCities.find((c) => c.id === 'vancouver')
const dallas = r.doc.hostCities.find((c) => c.id === 'dallas')
eq(tor.observations.filter((o) => o.provenance === 'auto-phac').length, 3, 'Toronto: covN2 + fluA + rsv published')
eq(van.observations.filter((o) => o.provenance === 'auto-phac').length, 2, 'Vancouver: covN2 + fluA (rsv absent)')
assert(tor.observations.some((o) => o.id === 'auto-phac-toronto-sars-cov-2-2026-05-31' && o.status === 'elevated'),
  'Toronto SARS-CoV-2 published as elevated')
eq(dallas.observations.length, 1, 'US city untouched (auto-nwss preserved, no auto-phac added)')
assert(dallas.observations[0].provenance === 'auto-nwss', 'PHAC writer never clobbers NWSS data')

// stale fixture → zero observations, honest "No current data"
const rStale = applyIngestion({ doc, rows: staleRows, runDateIso: '2026-06-15', publish: 'auto' })
eq(rStale.written.length, 0, 'stale PHAC feed publishes no observations')

// malformed rows (missing weekStart / missing level / unknown city) → no publish
const malformed = parseCsv(
  'Location,measureid,grouping,city,country,Viral_Activity_Level,weekStart\n' +
  'Toronto,covN2,City,Toronto,Canada,High,\n' +          // missing weekStart
  'Toronto,covN2,City,Toronto,Canada,,2026-05-31\n' +    // missing level
  'Nowhere,covN2,City,Nowhere,Canada,High,2026-05-31',   // unknown city
)
const rBad = applyIngestion({ doc, rows: malformed, runDateIso: '2026-06-15', publish: 'auto' })
eq(rBad.written.length, 0, 'malformed/dateless/levelless/unknown-city rows publish nothing')

// idempotency
const r2 = applyIngestion({ doc: r.doc, rows: currentRows, runDateIso: '2026-06-15', publish: 'auto' })
eq(JSON.stringify(r2.doc), JSON.stringify(r.doc), 'idempotent: re-run replaces only auto-phac, output unchanged')

// staged policy
const rStaged = applyIngestion({ doc, rows: currentRows, runDateIso: '2026-06-15', publish: 'staged' })
eq(rStaged.written[0].publicDisplayAllowed, false, 'policy=staged → publicDisplayAllowed false')

if (failures > 0) {
  console.error(`[test-ingest-phac] FAILED (${failures} assertion${failures === 1 ? '' : 's'})`)
  process.exit(1)
}
console.log('[test-ingest-phac] OK')
