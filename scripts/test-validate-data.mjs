#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Regression tests for scripts/validate-data.mjs. These tests run the real
 * validator against temporary copies of the production data and mutate one
 * risky field at a time so validator coverage cannot quietly regress.
 */

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { spawnSync } from 'child_process'

const root = process.cwd()
const tempRoot = mkdtempSync(join(tmpdir(), 'emergenz-validate-data-'))

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
}

function makeCaseDir(name) {
  const caseRoot = join(tempRoot, name)
  const dataDir = join(caseRoot, 'data')
  const publicDir = join(caseRoot, 'public')
  mkdirSync(publicDir, { recursive: true })
  cpSync(join(root, 'src', 'data'), dataDir, { recursive: true })
  cpSync(join(root, 'public', 'status.json'), join(publicDir, 'status.json'))
  return {
    dataDir,
    publicDir,
    signalsPath: join(dataDir, 'signals.json'),
    signalSourcesPath: join(dataDir, 'signal-sources.json'),
    signalTimelinePath: join(dataDir, 'signal-timeline.json'),
  }
}

function runValidator(dataDir, publicDir) {
  return spawnSync(process.execPath, ['scripts/validate-data.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      VALIDATE_DATA_DIR: dataDir,
      VALIDATE_PUBLIC_DIR: publicDir,
    },
    encoding: 'utf8',
  })
}

function expectPass(name) {
  const { dataDir, publicDir } = makeCaseDir(name)
  const result = runValidator(dataDir, publicDir)
  if (result.status !== 0) {
    throw new Error(`${name}: expected pass, got failure\n${result.stderr}${result.stdout}`)
  }
}

function expectFailure(name, mutate, expectedText) {
  const { dataDir, publicDir, signalsPath } = makeCaseDir(name)
  const signals = readJson(signalsPath)
  mutate(signals)
  writeJson(signalsPath, signals)

  const result = runValidator(dataDir, publicDir)
  const output = `${result.stderr}\n${result.stdout}`
  if (result.status === 0) {
    throw new Error(`${name}: expected failure, got pass`)
  }
  if (!output.includes(expectedText)) {
    throw new Error(`${name}: expected output to include "${expectedText}"\n${output}`)
  }
}

function expectSourcesFailure(name, mutate, expectedText) {
  const { dataDir, publicDir, signalSourcesPath } = makeCaseDir(name)
  const sources = readJson(signalSourcesPath)
  mutate(sources)
  writeJson(signalSourcesPath, sources)

  const result = runValidator(dataDir, publicDir)
  const output = `${result.stderr}\n${result.stdout}`
  if (result.status === 0) {
    throw new Error(`${name}: expected failure, got pass`)
  }
  if (!output.includes(expectedText)) {
    throw new Error(`${name}: expected output to include "${expectedText}"\n${output}`)
  }
}

function expectTimelineFailure(name, mutate, expectedText) {
  const { dataDir, publicDir, signalTimelinePath } = makeCaseDir(name)
  const timeline = readJson(signalTimelinePath)
  mutate(timeline)
  writeJson(signalTimelinePath, timeline)

  const result = runValidator(dataDir, publicDir)
  const output = `${result.stderr}\n${result.stdout}`
  if (result.status === 0) {
    throw new Error(`${name}: expected failure, got pass`)
  }
  if (!output.includes(expectedText)) {
    throw new Error(`${name}: expected output to include "${expectedText}"\n${output}`)
  }
}

function expectTimelinePass(name, mutate) {
  const { dataDir, publicDir, signalTimelinePath } = makeCaseDir(name)
  const timeline = readJson(signalTimelinePath)
  mutate(timeline)
  writeJson(signalTimelinePath, timeline)

  const result = runValidator(dataDir, publicDir)
  if (result.status !== 0) {
    throw new Error(`${name}: expected pass, got failure\n${result.stderr}${result.stdout}`)
  }
}

// Tier 1 sourceId lookup for the well-formed auto-event test.
function firstTier1SourceIdForCdc(signalSourcesPath) {
  const sources = readJson(signalSourcesPath)
  const cdc = sources.find((s) => s.sourceTier === 1 && s.authority === 'CDC')
  if (!cdc) throw new Error('test fixture: expected at least one Tier 1 CDC source in signal-sources.json')
  return cdc.id
}

try {
  expectPass('baseline-valid-data')

  expectFailure(
    'unknown-related-signal',
    (signals) => {
      signals[0].relatedSignals = [{
        signalId: 'not-a-real-signal',
        relationship: 'Intentional invalid relationship for validator regression coverage',
        type: 'shared-context',
      }]
    },
    'not-a-real-signal',
  )

  expectFailure(
    'invalid-hypothesis-disposition',
    (signals) => {
      const signal = signals.find((item) => Array.isArray(item.alternativeHypotheses))
      signal.alternativeHypotheses[0].disposition = 'maybe'
    },
    'invalid disposition "maybe"',
  )

  expectFailure(
    'stale-triage-card',
    (signals) => {
      const signal = signals.find((item) => item.triageCard)
      signal.triageCard.lastReviewed = '2020-01-01'
    },
    'clinical content must be re-verified',
  )

  expectFailure(
    'triage-card-exact-dose',
    (signals) => {
      const signal = signals.find((item) => item.triageCard)
      signal.triageCard.treatmentSummary = 'Give exampledrug 75 mg BID from this printable card.'
    },
    'must not include exact drug doses',
  )

  expectFailure(
    'invalid-risk-assessment-url',
    (signals) => {
      const signal = signals.find((item) => Array.isArray(item.riskAssessments))
      signal.riskAssessments[0].url = 'not-a-url'
    },
    'url must be valid',
  )

  // Briefings-priority coverage — every signal must have at least one section
  // whose id is in src/utils/briefings-priority.json, so /briefings always
  // has an operationally-actionable section to surface without falling through
  // to an arbitrary first section.
  expectFailure(
    'signal-without-briefings-priority-section',
    (signals) => {
      // Rename every detailSection id on the first signal so none match any
      // priority list entry. This simulates a future signal that ships with
      // only signal-specific section ids (e.g. only 'epidemiology' + 'history')
      // and lacks any of the operationally-actionable canonical ids.
      const signal = signals[0]
      signal.detailSections = signal.detailSections.map((section, i) => ({
        ...section,
        id: `non-priority-fixture-${i}`,
      }))
    },
    'detailSections lacks any briefings-priority section',
  )

  // operationalLenses discipline — cross-cutting domains must remain typed,
  // and travel evidence must not become invisible in domain filters.
  expectFailure(
    'invalid-operational-lens',
    (signals) => {
      signals[0].operationalLenses = ['not-a-domain']
    },
    'invalid operational lens "not-a-domain"',
  )

  expectFailure(
    'travel-route-marker-without-travel-lens',
    (signals) => {
      const signal = signals.find((item) =>
        Array.isArray(item.mapMarkers) && item.mapMarkers.some((marker) => marker.type === 'ship_route'),
      )
      signal.operationalLenses = []
    },
    'ship_route/flight_tracing markers require operationalLenses to include "travel"',
  )

  expectFailure(
    'travel-domain-evidence-without-exposed-signals',
    (signals) => {
      signals.forEach((signal) => {
        signal.operationalLenses = (signal.operationalLenses ?? []).filter((lens) => lens !== 'travel')
      })
    },
    'travel domain has source or marker evidence but no signals expose category/operationalLenses "travel"',
  )

  // knownBlocked discipline — flagging a source as known-blocked without a
  // reason is forbidden so the bypass can be re-audited later.
  expectSourcesFailure(
    'known-blocked-without-reason',
    (sources) => {
      const source = sources[0]
      source.knownBlocked = true
      delete source.knownBlockedReason
    },
    'knownBlocked=true requires a non-empty knownBlockedReason',
  )

  expectSourcesFailure(
    'known-blocked-empty-reason',
    (sources) => {
      const source = sources[0]
      source.knownBlocked = true
      source.knownBlockedReason = '   '
    },
    'knownBlocked=true requires a non-empty knownBlockedReason',
  )

  expectSourcesFailure(
    'known-blocked-wrong-type',
    (sources) => {
      const source = sources[0]
      source.knownBlocked = 'yes'
    },
    'knownBlocked must be boolean',
  )

  // Timeline provenance discipline — auto-promoted events must carry full
  // traceability so the structured-data writer contract cannot be silently
  // weakened (CONTENT-STANDARDS §1, §2.1).
  const cdcTier1SourceId = firstTier1SourceIdForCdc(join(root, 'src', 'data', 'signal-sources.json'))
  const tier2SourceId = (() => {
    const sources = readJson(join(root, 'src', 'data', 'signal-sources.json'))
    const tier2 = sources.find((s) => s.sourceTier === 2)
    if (!tier2) throw new Error('test fixture: expected at least one Tier 2 source')
    return tier2.id
  })()

  expectTimelinePass(
    'well-formed-auto-event',
    (timeline) => {
      const baseline = timeline.find((e) => e.provenance === undefined)
      timeline.push({
        id: 'auto-test-fixture-1',
        signalId: baseline.signalId,
        date: '2026-05-24',
        title: 'CDC test news item title',
        description: 'CDC test news item description',
        sourceId: cdcTier1SourceId,
        category: baseline.category,
        provenance: 'auto-news-tier1',
        newsId: 'test-fixture-1',
        authority: 'CDC',
        link: 'https://www.cdc.gov/example',
        promotedAt: '2026-05-24T12:00:00.000Z',
      })
    },
  )

  expectTimelineFailure(
    'auto-event-missing-newsId',
    (timeline) => {
      const baseline = timeline.find((e) => e.provenance === undefined)
      timeline.push({
        id: 'auto-missing-newsId',
        signalId: baseline.signalId,
        date: '2026-05-24',
        title: 'CDC test',
        description: 'desc',
        sourceId: cdcTier1SourceId,
        category: baseline.category,
        provenance: 'auto-news-tier1',
        authority: 'CDC',
        link: 'https://www.cdc.gov/example',
        promotedAt: '2026-05-24T12:00:00.000Z',
      })
    },
    'missing newsId',
  )

  expectTimelineFailure(
    'auto-event-non-tier1-authority',
    (timeline) => {
      const baseline = timeline.find((e) => e.provenance === undefined)
      timeline.push({
        id: 'auto-bad-authority',
        signalId: baseline.signalId,
        date: '2026-05-24',
        title: 'NPR test',
        description: 'desc',
        sourceId: cdcTier1SourceId,
        category: baseline.category,
        provenance: 'auto-news-tier1',
        newsId: 'bad-authority',
        authority: 'NPR',
        link: 'https://www.npr.org/example',
        promotedAt: '2026-05-24T12:00:00.000Z',
      })
    },
    'authority must be Tier 1',
  )

  expectTimelineFailure(
    'auto-event-tier2-sourceId',
    (timeline) => {
      const baseline = timeline.find((e) => e.provenance === undefined)
      timeline.push({
        id: 'auto-tier2-source',
        signalId: baseline.signalId,
        date: '2026-05-24',
        title: 'CDC test',
        description: 'desc',
        sourceId: tier2SourceId,
        category: baseline.category,
        provenance: 'auto-news-tier1',
        newsId: 'tier2-source',
        authority: 'CDC',
        link: 'https://www.cdc.gov/example',
        promotedAt: '2026-05-24T12:00:00.000Z',
      })
    },
    'auto-promoted sourceId must reference a Tier 1 source',
  )

  expectTimelineFailure(
    'auto-event-wrong-id-prefix',
    (timeline) => {
      const baseline = timeline.find((e) => e.provenance === undefined)
      timeline.push({
        id: 'no-prefix-fixture',
        signalId: baseline.signalId,
        date: '2026-05-24',
        title: 'CDC test',
        description: 'desc',
        sourceId: cdcTier1SourceId,
        category: baseline.category,
        provenance: 'auto-news-tier1',
        newsId: 'no-prefix',
        authority: 'CDC',
        link: 'https://www.cdc.gov/example',
        promotedAt: '2026-05-24T12:00:00.000Z',
      })
    },
    'must use the "auto-" id prefix',
  )

  expectTimelineFailure(
    'auto-event-invalid-provenance',
    (timeline) => {
      const baseline = timeline.find((e) => e.provenance === undefined)
      timeline.push({
        id: 'auto-bad-provenance',
        signalId: baseline.signalId,
        date: '2026-05-24',
        title: 'CDC test',
        description: 'desc',
        sourceId: cdcTier1SourceId,
        category: baseline.category,
        provenance: 'bogus',
      })
    },
    'invalid provenance',
  )

  expectTimelineFailure(
    'auto-event-promotedAt-before-date',
    (timeline) => {
      const baseline = timeline.find((e) => e.provenance === undefined)
      timeline.push({
        id: 'auto-time-travel',
        signalId: baseline.signalId,
        date: '2026-05-24',
        title: 'CDC test',
        description: 'desc',
        sourceId: cdcTier1SourceId,
        category: baseline.category,
        provenance: 'auto-news-tier1',
        newsId: 'time-travel',
        authority: 'CDC',
        link: 'https://www.cdc.gov/example',
        promotedAt: '2026-05-20T12:00:00.000Z',
      })
    },
    'promotedAt must be on or after date',
  )

  expectTimelineFailure(
    'auto-event-invalid-link',
    (timeline) => {
      const baseline = timeline.find((e) => e.provenance === undefined)
      timeline.push({
        id: 'auto-bad-link',
        signalId: baseline.signalId,
        date: '2026-05-24',
        title: 'CDC test',
        description: 'desc',
        sourceId: cdcTier1SourceId,
        category: baseline.category,
        provenance: 'auto-news-tier1',
        newsId: 'bad-link',
        authority: 'CDC',
        link: 'not-a-url',
        promotedAt: '2026-05-24T12:00:00.000Z',
      })
    },
    'link must be valid URL',
  )

  // ── Host-city biosurveillance ────────────────────────────────────────────
  // Per-domain status / overall severity / freshness are DERIVED in the UI, not
  // stored, so an "elevated city with no backing observation" is unrepresentable.
  // These tests lock the raw-observation invariants that keep that derivation
  // safe: attribution, freshness-derivability, referential integrity, enums.
  function makeHostCityCaseDir(name) {
    const { dataDir, publicDir } = makeCaseDir(name)
    return { dataDir, publicDir, hostCityPath: join(dataDir, 'host-city-biosurveillance.json') }
  }

  function runHostCity(name, mutate) {
    const { dataDir, publicDir, hostCityPath } = makeHostCityCaseDir(name)
    const doc = readJson(hostCityPath)
    mutate(doc, dataDir)
    writeJson(hostCityPath, doc)
    return runValidator(dataDir, publicDir)
  }

  function expectHostCityFailure(name, mutate, expectedText) {
    const result = runHostCity(name, mutate)
    const output = `${result.stderr}\n${result.stdout}`
    if (result.status === 0) throw new Error(`${name}: expected failure, got pass`)
    if (!output.includes(expectedText)) {
      throw new Error(`${name}: expected output to include "${expectedText}"\n${output}`)
    }
  }

  function expectHostCityPass(name, mutate) {
    const result = runHostCity(name, mutate)
    if (result.status !== 0) {
      throw new Error(`${name}: expected pass, got failure\n${result.stderr}${result.stdout}`)
    }
  }

  // A valid, publicly-displayable observation built from a real registered source.
  function validObservation(dataDir, cityId, overrides = {}) {
    const sources = readJson(join(dataDir, 'signal-sources.json'))
    const src = sources[0]
    return {
      id: `obs-fixture-${cityId}`,
      hostCityId: cityId,
      domain: 'respiratory',
      pathogenOrSyndrome: 'Influenza A (wastewater)',
      observationType: 'wastewater',
      status: 'elevated',
      severity: 'watch',
      confidence: 'official',
      sampleDate: '2026-06-10',
      reportDate: '2026-06-13',
      reportingLagDays: 3,
      sourceId: src.id,
      sourceUrl: 'https://www.cdc.gov/nwss/example',
      lastVerified: '2026-06-14',
      summary: 'Fixture observation for validator regression coverage.',
      publicDisplayAllowed: true,
      ...overrides,
    }
  }

  // A well-formed, source-backed public observation must validate.
  expectHostCityPass('host-city-valid-public-observation', (doc, dataDir) => {
    doc.hostCities[0].observations.push(validObservation(dataDir, doc.hostCities[0].id))
  })

  // A public observation must be able to derive freshness from a date.
  expectHostCityFailure(
    'host-city-public-observation-missing-date',
    (doc, dataDir) => {
      const obs = validObservation(dataDir, doc.hostCities[0].id)
      delete obs.sampleDate
      delete obs.reportDate
      delete obs.reportingLagDays
      doc.hostCities[0].observations.push(obs)
    },
    'public observation must have reportDate or sampleDate',
  )

  // Required attribution: a public observation cannot lack its source URL.
  expectHostCityFailure(
    'host-city-public-observation-missing-attribution',
    (doc, dataDir) => {
      doc.hostCities[0].observations.push(validObservation(dataDir, doc.hostCities[0].id, { sourceUrl: '' }))
    },
    'public observation must have sourceId and sourceUrl',
  )

  // Referential integrity: observation sourceId must resolve in signal-sources.json.
  expectHostCityFailure(
    'host-city-observation-unknown-source',
    (doc, dataDir) => {
      doc.hostCities[0].observations.push(validObservation(dataDir, doc.hostCities[0].id, { sourceId: 'not-a-real-source' }))
    },
    'not in signal-sources.json',
  )

  // An observation cannot be filed under a city it does not belong to.
  expectHostCityFailure(
    'host-city-observation-city-mismatch',
    (doc, dataDir) => {
      doc.hostCities[0].observations.push(
        validObservation(dataDir, doc.hostCities[0].id, { hostCityId: 'some-other-city' }),
      )
    },
    'does not match parent city',
  )

  // Enum discipline on observation domain.
  expectHostCityFailure(
    'host-city-observation-invalid-domain',
    (doc, dataDir) => {
      doc.hostCities[0].observations.push(validObservation(dataDir, doc.hostCities[0].id, { domain: 'not-a-domain' }))
    },
    'invalid domain "not-a-domain"',
  )

  // City sourceIds must resolve in the registry.
  expectHostCityFailure(
    'host-city-unknown-source-ref',
    (doc) => {
      doc.hostCities[0].sourceIds = ['not-a-real-source']
    },
    'sourceIds references unknown "not-a-real-source"',
  )

  // The parent signal must exist (binds the layer to the FIFA umbrella).
  expectHostCityFailure(
    'host-city-invalid-parent-signal',
    (doc) => {
      doc.parentSignalId = 'not-a-real-signal'
    },
    'parentSignalId "not-a-real-signal" not in signals.json',
  )

  // Observation ids must be globally unique across cities.
  expectHostCityFailure(
    'host-city-duplicate-observation-id',
    (doc, dataDir) => {
      doc.hostCities[0].observations.push(validObservation(dataDir, doc.hostCities[0].id, { id: 'dup-obs' }))
      doc.hostCities[1].observations.push(
        validObservation(dataDir, doc.hostCities[1].id, { id: 'dup-obs', hostCityId: doc.hostCities[1].id }),
      )
    },
    'observation ids: duplicate',
  )

  // reportingLagDays must equal reportDate - sampleDate.
  expectHostCityFailure(
    'host-city-reporting-lag-mismatch',
    (doc, dataDir) => {
      doc.hostCities[0].observations.push(validObservation(dataDir, doc.hostCities[0].id, { reportingLagDays: 99 }))
    },
    'reportingLagDays (99)',
  )

  // Country enum discipline.
  expectHostCityFailure(
    'host-city-invalid-country',
    (doc) => {
      doc.hostCities[0].country = 'Atlantis'
    },
    'invalid country "Atlantis"',
  )

  console.log('[test-validate-data] OK')
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
