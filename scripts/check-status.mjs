// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import { writeFileSync } from 'fs'

const STATUS_URL = process.env.STATUS_URL || 'https://biosecurity-intel.emergenzsystems.org/status.json'
const OUTPUT_PATH = process.env.STATUS_MONITOR_OUTPUT || 'status-monitor-result.json'
// Status Refresh currently runs once per day. Keep this threshold comfortably
// above 24h so the hourly monitor detects missed refresh/deploy cycles instead
// of alerting during normal daily cadence.
const MAX_GENERATED_AGE_HOURS = Number.parseInt(process.env.MAX_STATUS_GENERATED_AGE_HOURS || '30', 10)

// Hard vs soft failure model (added 2026-05-30):
//   HARD = production/deploy/contract is broken — page the maintainer (workflow
//          exits 1, GitHub emails "all jobs failed"). Examples: endpoint
//          unreachable, schemaVersion wrong, status.json generation stale
//          (deploy/refresh broken), or status === "critical".
//   SOFT = the dashboard is UP and serving, but the human signal-review cadence
//          has lapsed (status "degraded", stale signals, headline/official-source
//          age). This is review work, not an outage. The daily Human Review
//          Digest (review-digest issue) already surfaces it with the exact
//          action to clear each item, so the hourly monitor must NOT hard-fail
//          (and email) on soft conditions — that is the babysitting noise this
//          split removes. See RUNBOOK §2.4 and HANDOFF 2026-05-30.

function hoursSince(iso) {
  const age = (Date.now() - new Date(iso).getTime()) / 36e5
  return Number.isFinite(age) ? age : null
}

function addAgeFailure(failures, label, iso, maxAgeHours) {
  const age = hoursSince(iso)
  if (age === null) {
    failures.push(`${label} timestamp is missing or invalid`)
  } else if (age > maxAgeHours) {
    failures.push(`${label} is ${age.toFixed(1)}h old (max ${maxAgeHours}h)`)
  }
  return age
}

async function fetchStatus() {
  const url = new URL(STATUS_URL)
  url.searchParams.set('monitor', Date.now().toString())

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json,*/*',
      'Cache-Control': 'no-cache',
      'User-Agent': 'EMERGENZ-Status-Monitor/1.0',
    },
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${STATUS_URL}`)
  return res.json()
}

async function main() {
  const checkedAt = new Date().toISOString()
  const hardFailures = []
  const softFailures = []
  let status = null

  try {
    status = await fetchStatus()
  } catch (error) {
    // Endpoint unreachable / HTTP error / timeout — production is not serving.
    hardFailures.push(error.message)
  }

  if (status) {
    // ── HARD: contract + deploy integrity ────────────────────────────────
    if (status.schemaVersion !== 2) hardFailures.push(`Unsupported schemaVersion: ${status.schemaVersion}`)
    if (!['ok', 'degraded', 'critical'].includes(status.status)) {
      hardFailures.push(`Invalid status: ${status.status}`)
    }
    if (status.status === 'critical') hardFailures.push('Dashboard status is critical')
    // Stale generation means Status Refresh failed repeatedly OR Vercel is not
    // deploying the latest commit — a real production/deploy problem.
    addAgeFailure(hardFailures, 'status.json generation', status.generatedAt, MAX_GENERATED_AGE_HOURS)

    // ── SOFT: human-review-cadence lapses (tracked by the review-digest) ──
    if (status.status === 'degraded') softFailures.push('Dashboard status is degraded')

    const maxDataAge = Number(
      status.thresholds?.maxDataAgeHours ?? process.env.MAX_DATA_AGE_HOURS ?? 168
    )
    const maxOfficialAge = Number(
      status.thresholds?.maxOfficialCheckAgeHours ?? process.env.MAX_OFFICIAL_CHECK_AGE_HOURS ?? 168
    )
    if (status.dashboard?.lastUpdated) {
      addAgeFailure(softFailures, 'headline signal data', status.dashboard.lastUpdated, maxDataAge)
    }
    if (status.dashboard?.lastOfficialSourceCheck) {
      addAgeFailure(softFailures, 'last official source check', status.dashboard.lastOfficialSourceCheck, maxOfficialAge)
    }
    if (Array.isArray(status.signals?.staleSignalIds) && status.signals.staleSignalIds.length > 0) {
      softFailures.push(`Stale signals: ${status.signals.staleSignalIds.join(', ')}`)
    }
  }

  const failures = [...hardFailures, ...softFailures]
  const result = {
    ok: failures.length === 0,
    hardFail: hardFailures.length > 0,
    statusUrl: STATUS_URL,
    checkedAt,
    status: status?.status ?? null,
    generatedAt: status?.generatedAt ?? null,
    lastUpdated: status?.dashboard?.lastUpdated ?? null,
    lastChecked: status?.dashboard?.lastChecked ?? null,
    lastOfficialSourceCheck: status?.dashboard?.lastOfficialSourceCheck ?? null,
    activeSignals: status?.signals?.active ?? null,
    highestSeverity: status?.signals?.highestSeverity ?? null,
    hardFailures,
    softFailures,
    failures,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2))

  if (result.hardFail) {
    console.error('[monitor:status] HARD FAILURE — production health')
    for (const failure of hardFailures) console.error(`- ${failure}`)
    process.exitCode = 1
    return
  }

  if (softFailures.length > 0) {
    // Report-only: the dashboard is healthy; these are review items the daily
    // review-digest owns. Exit 0 so the hourly monitor does not page/email.
    console.warn('[monitor:status] REVIEW NEEDED (soft — not a production failure)')
    for (const failure of softFailures) console.warn(`- ${failure}`)
    console.log('[monitor:status] OK — production healthy; soft review items tracked by the daily review-digest.')
    return
  }

  console.log('[monitor:status] OK')
}

main().catch((error) => {
  // Unexpected script crash counts as a hard failure.
  console.error('[monitor:status] HARD FAILURE:', error.message)
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      { ok: false, hardFail: true, statusUrl: STATUS_URL, checkedAt: new Date().toISOString(), hardFailures: [error.message], softFailures: [], failures: [error.message] },
      null,
      2,
    ),
  )
  process.exitCode = 1
})
