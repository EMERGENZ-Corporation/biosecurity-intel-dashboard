import { writeFileSync } from 'fs'

const STATUS_URL = process.env.STATUS_URL || 'https://biosecurity-intel.emergenzsystems.org/status.json'
const OUTPUT_PATH = process.env.STATUS_MONITOR_OUTPUT || 'status-monitor-result.json'
const MAX_GENERATED_AGE_HOURS = Number.parseInt(process.env.MAX_STATUS_GENERATED_AGE_HOURS || '8', 10)

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
  const failures = []
  let status = null

  try {
    status = await fetchStatus()
  } catch (error) {
    failures.push(error.message)
  }

  if (status) {
    if (status.schemaVersion !== 2) failures.push(`Unsupported schemaVersion: ${status.schemaVersion}`)
    if (!['ok', 'degraded', 'critical'].includes(status.status)) failures.push(`Invalid status: ${status.status}`)
    if (status.status !== 'ok') failures.push(`Dashboard status is ${status.status}`)

    addAgeFailure(failures, 'status.json generation', status.generatedAt, MAX_GENERATED_AGE_HOURS)

    const maxDataAge = Number(
      status.thresholds?.maxDataAgeHours ?? process.env.MAX_DATA_AGE_HOURS ?? 168
    )
    const maxOfficialAge = Number(
      status.thresholds?.maxOfficialCheckAgeHours ?? process.env.MAX_OFFICIAL_CHECK_AGE_HOURS ?? 48
    )
    if (status.dashboard?.lastUpdated) {
      addAgeFailure(failures, 'headline signal data', status.dashboard.lastUpdated, maxDataAge)
    }
    if (status.dashboard?.lastOfficialSourceCheck) {
      addAgeFailure(failures, 'last official source check', status.dashboard.lastOfficialSourceCheck, maxOfficialAge)
    }

    if (Array.isArray(status.signals?.staleSignalIds) && status.signals.staleSignalIds.length > 0) {
      failures.push(`Stale signals: ${status.signals.staleSignalIds.join(', ')}`)
    }
    if (Array.isArray(status.pipeline?.officialSourceFailures) && status.pipeline.officialSourceFailures.length > 0) {
      failures.push(`Failed official sources: ${status.pipeline.officialSourceFailures.join(', ')}`)
    }
  }

  const result = {
    ok: failures.length === 0,
    statusUrl: STATUS_URL,
    checkedAt,
    status: status?.status ?? null,
    generatedAt: status?.generatedAt ?? null,
    lastUpdated: status?.dashboard?.lastUpdated ?? null,
    lastChecked: status?.dashboard?.lastChecked ?? null,
    lastOfficialSourceCheck: status?.dashboard?.lastOfficialSourceCheck ?? null,
    extractionStatus: status?.pipeline?.extractionStatus ?? null,
    activeSignals: status?.signals?.active ?? null,
    highestSeverity: status?.signals?.highestSeverity ?? null,
    failures,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2))

  if (!result.ok) {
    console.error('[monitor:status] FAILED')
    for (const failure of failures) console.error(`- ${failure}`)
    process.exit(1)
  }

  console.log('[monitor:status] OK')
}

main().catch((error) => {
  console.error('[monitor:status] FAILED:', error.message)
  writeFileSync(OUTPUT_PATH, JSON.stringify({ ok: false, statusUrl: STATUS_URL, checkedAt: new Date().toISOString(), failures: [error.message] }, null, 2))
  process.exit(1)
})
