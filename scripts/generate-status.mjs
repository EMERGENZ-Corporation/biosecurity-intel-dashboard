/**
 * EMERGENZ Biosecurity Intel Dashboard — status generator
 *
 * Reads the static signal/source data and writes public/status.json
 * with a multi-signal health contract. This is the only autonomous
 * data writer in the MVP; richer source-specific extractors can be
 * added incrementally without changing this contract.
 *
 * Exits non-zero only when required inputs are missing or malformed.
 */

import { readFileSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const SOURCES_PATH = 'src/data/signal-sources.json'
const TIMELINE_PATH = 'src/data/signal-timeline.json'
const STATUS_PATH = 'public/status.json'

const MAX_DATA_AGE_HOURS = Number.parseInt(process.env.MAX_DATA_AGE_HOURS || '168', 10)
const MAX_OFFICIAL_CHECK_AGE_HOURS = Number.parseInt(process.env.MAX_OFFICIAL_CHECK_AGE_HOURS || '48', 10)
const MAX_SIGNAL_STALE_HOURS = Number.parseInt(process.env.MAX_SIGNAL_STALE_HOURS || '168', 10)

const SEVERITY_RANK = { monitor: 0, watch: 1, concern: 2, action: 3 }

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function ageHours(iso) {
  return (Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000)
}

function highestSeverity(signals) {
  if (signals.length === 0) return null
  return signals.reduce((acc, s) => (SEVERITY_RANK[s.severity] > SEVERITY_RANK[acc] ? s.severity : acc), 'monitor')
}

function categoryCounts(signals) {
  const counts = {}
  for (const s of signals) counts[s.category] = (counts[s.category] ?? 0) + 1
  return counts
}

function main() {
  const signals = readJson(SIGNALS_PATH)
  const sources = readJson(SOURCES_PATH)
  const timeline = readJson(TIMELINE_PATH)

  if (!Array.isArray(signals) || signals.length === 0) {
    throw new Error('signals.json must be a non-empty array')
  }
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error('signal-sources.json must be a non-empty array')
  }

  const generatedAt = new Date().toISOString()
  const activeSignals = signals.filter((s) => s.status === 'active')

  const staleSignalIds = signals
    .filter((s) => ageHours(s.lastChecked) > MAX_SIGNAL_STALE_HOURS)
    .map((s) => s.id)

  const latestSignalUpdate = signals
    .map((s) => new Date(s.lastUpdated).getTime())
    .reduce((max, t) => (Number.isFinite(t) ? Math.max(max, t) : max), 0)
  const latestSourceCheck = signals
    .map((s) => new Date(s.lastChecked).getTime())
    .reduce((max, t) => (Number.isFinite(t) ? Math.max(max, t) : max), 0)

  const dataAgeHours = latestSignalUpdate ? (Date.now() - latestSignalUpdate) / 36e5 : null
  const officialCheckAgeHours = latestSourceCheck ? (Date.now() - latestSourceCheck) / 36e5 : null

  const staleReasons = []
  if (staleSignalIds.length > 0) staleReasons.push(`${staleSignalIds.length} signal(s) older than ${MAX_SIGNAL_STALE_HOURS}h`)
  if (dataAgeHours !== null && dataAgeHours > MAX_DATA_AGE_HOURS) staleReasons.push(`Headline data ${dataAgeHours.toFixed(1)}h old`)
  if (officialCheckAgeHours !== null && officialCheckAgeHours > MAX_OFFICIAL_CHECK_AGE_HOURS) {
    staleReasons.push(`Last source check ${officialCheckAgeHours.toFixed(1)}h old`)
  }

  const status = staleReasons.length === 0 ? 'ok' : 'degraded'

  const out = {
    schemaVersion: 2,
    status,
    generatedAt,
    thresholds: {
      maxDataAgeHours: MAX_DATA_AGE_HOURS,
      maxOfficialCheckAgeHours: MAX_OFFICIAL_CHECK_AGE_HOURS,
      maxSignalStaleHours: MAX_SIGNAL_STALE_HOURS,
    },
    dashboard: {
      lastUpdated: latestSignalUpdate ? new Date(latestSignalUpdate).toISOString() : null,
      lastChecked: latestSourceCheck ? new Date(latestSourceCheck).toISOString() : null,
      lastOfficialSourceCheck: latestSourceCheck ? new Date(latestSourceCheck).toISOString() : null,
      dataAgeHours,
      officialCheckAgeHours,
    },
    signals: {
      total: signals.length,
      active: activeSignals.length,
      highestSeverity: highestSeverity(activeSignals),
      byCategory: categoryCounts(signals),
      staleSignalIds,
      timelineEvents: timeline.length,
    },
    sources: {
      total: sources.length,
      primary: sources.filter((s) => s.primary).length,
      secondary: sources.filter((s) => !s.primary).length,
    },
    pipeline: {
      extractionStatus: 'static-seed',
      failedFeeds: [],
      criticalFeedFailures: [],
      officialSourceFailures: [],
      officialSourcesOk: sources.filter((s) => s.primary).length,
      officialSourcesTotal: sources.filter((s) => s.primary).length,
    },
    staleReasons,
    runbook:
      'Update signals.json, signal-timeline.json, and signal-sources.json as primary authorities (WHO, CDC, ECDC, Africa CDC, PAHO, PHAC, USDA APHIS, WOAH, CDC NWSS, WastewaterSCAN) publish new information. Run npm run validate:data and npm run generate:status before committing. See BIOSECURITY-MONITORING-BUILD-PACKET.md.',
  }

  writeFileSync(STATUS_PATH, JSON.stringify(out, null, 2) + '\n')
  console.log(`[generate-status] wrote ${STATUS_PATH} · status=${out.status} · signals=${out.signals.active}/${out.signals.total}`)
}

try {
  main()
} catch (error) {
  console.error('[generate-status] FAILED:', error.message)
  process.exit(1)
}
