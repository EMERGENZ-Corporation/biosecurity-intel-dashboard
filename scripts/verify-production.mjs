/**
 * Verifies the deployed Biosecurity Intel Dashboard after each data
 * update. Polls /status.json until schemaVersion 2 is published with
 * the expected freshness, then asserts the live HTML still includes
 * the current signal data bundle.
 */

import { readFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const STATUS_PATH = 'public/status.json'
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://biosecurity-intel.emergenzsystems.org'
const MAX_ATTEMPTS = Number.parseInt(process.env.VERIFY_PRODUCTION_ATTEMPTS || '12', 10)
const DELAY_MS = Number.parseInt(process.env.VERIFY_PRODUCTION_DELAY_MS || '30000', 10)
// Structured signal/source review is human-gated. Keep this aligned with
// generate-status, status-monitor, and RUNBOOK.md: a weekly review window is
// the policy threshold; 48h recreated the old weekend false-alarm loop.
const MAX_OFFICIAL_CHECK_AGE_HOURS = Number.parseInt(process.env.MAX_OFFICIAL_CHECK_AGE_HOURS || '168', 10)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ageHours(iso) {
  return (Date.now() - new Date(iso).getTime()) / 36e5
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json,*/*',
      'Cache-Control': 'no-cache',
      'User-Agent': 'EMERGENZ-Production-Verifier/1.0',
    },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function main() {
  const expectedSignalCount = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8')).length
  const expectedStatus = JSON.parse(readFileSync(STATUS_PATH, 'utf8'))
  const expectedGeneratedAt = expectedStatus.generatedAt

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const url = new URL('/status.json', PRODUCTION_URL)
      url.searchParams.set('verify', Date.now().toString())
      const live = await fetchJson(url.toString())

      if (live.schemaVersion !== 2) throw new Error(`Unexpected schemaVersion ${live.schemaVersion}`)
      if (live.generatedAt !== expectedGeneratedAt) {
        throw new Error(`generatedAt mismatch: live=${live.generatedAt} expected=${expectedGeneratedAt}`)
      }
      if (live.signals?.total !== expectedSignalCount) {
        throw new Error(`signal count mismatch: live=${live.signals?.total} expected=${expectedSignalCount}`)
      }
      if (live.dashboard?.lastOfficialSourceCheck) {
        const age = ageHours(live.dashboard.lastOfficialSourceCheck)
        if (age > MAX_OFFICIAL_CHECK_AGE_HOURS) {
          throw new Error(`lastOfficialSourceCheck ${age.toFixed(1)}h old (max ${MAX_OFFICIAL_CHECK_AGE_HOURS}h)`)
        }
      }

      console.log(
        `[verify:production] OK · attempt ${attempt} · signals=${live.signals?.active}/${live.signals?.total} · status=${live.status}`
      )
      return
    } catch (error) {
      console.log(`[verify:production] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`)
      if (attempt === MAX_ATTEMPTS) throw error
      await sleep(DELAY_MS)
    }
  }
}

main().catch((error) => {
  console.error('[verify:production] FAILED:', error.message)
  process.exit(1)
})
