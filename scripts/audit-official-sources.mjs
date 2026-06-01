// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import { readFileSync, writeFileSync } from 'fs'

const DATA_DIR = process.env.AUDIT_DATA_DIR || 'src/data'
const OUTPUT_PATH = process.env.OFFICIAL_SOURCE_AUDIT_OUTPUT || 'official-source-audit-result.json'
const MAX_VERIFIED_AGE_DAYS = Number.parseInt(process.env.MAX_SOURCE_VERIFIED_AGE_DAYS || '30', 10)
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.SOURCE_AUDIT_TIMEOUT_MS || '15000', 10)
const SKIP_NETWORK = process.env.OFFICIAL_SOURCE_AUDIT_SKIP_NETWORK === '1'
const STRICT = process.env.OFFICIAL_SOURCE_AUDIT_STRICT !== '0'
const SOURCE_TIERS = new Set([1, 2])
const HTTP_OK_MAX = 399

function parseDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function daysSince(date, now) {
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function failure(source, reason, extra = {}) {
  return {
    id: source?.id ?? null,
    authority: source?.authority ?? null,
    title: source?.title ?? null,
    url: source?.url ?? null,
    tier: source?.sourceTier ?? null,
    reason,
    ...extra,
  }
}

async function fetchWithTimeout(url, method) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'EMERGENZ official source audit (+https://biosecurity-intel.emergenzsystems.org)',
        Accept: 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function checkReachability(source) {
  if (!source.url || !/^https?:\/\//i.test(source.url)) {
    return failure(source, 'source URL is missing or not HTTP(S)')
  }

  try {
    let res = await fetchWithTimeout(source.url, 'HEAD')
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetchWithTimeout(source.url, 'GET')
    }

    if (res.status > HTTP_OK_MAX) {
      return failure(source, `HTTP ${res.status}`, { status: res.status })
    }
    return null
  } catch (error) {
    return failure(source, error.name === 'AbortError' ? 'request timed out' : error.message)
  }
}

// A source flagged knownBlocked is allowed to return HTTP 403 from automated
// reachability checks; we route that one specific failure shape to its own
// bucket so the audit log stays honest while signalling expected behaviour.
// Any other failure (timeout, 5xx, 404, etc.) is still a real failure even
// for known-blocked sources.
function isExpectedBlock(source, item) {
  return source.knownBlocked === true && item.status === 403
}

async function main() {
  const checkedAt = new Date()
  const sources = JSON.parse(readFileSync(`${DATA_DIR}/signal-sources.json`, 'utf8'))
  const officialSources = sources.filter((source) => SOURCE_TIERS.has(source.sourceTier))

  const staleSources = []
  const malformedSources = []

  for (const source of officialSources) {
    const verifiedAt = parseDate(source.lastVerified)
    if (!verifiedAt) {
      malformedSources.push(failure(source, 'lastVerified is missing or invalid'))
      continue
    }

    const ageDays = daysSince(verifiedAt, checkedAt)
    if (ageDays > MAX_VERIFIED_AGE_DAYS) {
      staleSources.push(failure(source, `lastVerified is ${ageDays} days old`, { ageDays }))
    }
  }

  const unreachableSources = []
  const knownBlockedSources = []
  if (!SKIP_NETWORK) {
    const checks = await Promise.all(
      officialSources.map(async (source) => ({ source, result: await checkReachability(source) })),
    )
    for (const { source, result } of checks) {
      if (!result) continue
      if (isExpectedBlock(source, result)) {
        knownBlockedSources.push({ ...result, knownBlockedReason: source.knownBlockedReason })
      } else {
        unreachableSources.push(result)
      }
    }
  }

  const failures = [...malformedSources, ...staleSources, ...unreachableSources]
  const byTier = officialSources.reduce((acc, source) => {
    const key = `tier${source.sourceTier}`
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const result = {
    ok: failures.length === 0,
    checkedAt: checkedAt.toISOString(),
    thresholds: {
      maxVerifiedAgeDays: MAX_VERIFIED_AGE_DAYS,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      networkSkipped: SKIP_NETWORK,
    },
    sources: {
      total: sources.length,
      audited: officialSources.length,
      knownBlocked: knownBlockedSources.length,
      byTier,
    },
    malformedSources,
    staleSources,
    unreachableSources,
    knownBlockedSources,
    failures,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n')

  const knownBlockedSuffix = knownBlockedSources.length > 0
    ? `, ${knownBlockedSources.length} known-blocked`
    : ''

  if (!result.ok) {
    const mode = STRICT ? 'FAILED' : 'REVIEW NEEDED'
    console.error(`[audit-official-sources] ${mode}`)
    for (const item of failures) {
      console.error(`- ${item.id ?? 'unknown'}: ${item.reason}`)
    }
    if (knownBlockedSources.length > 0) {
      console.error(`(${knownBlockedSources.length} known-blocked acknowledged — not counted as failures)`)
      for (const item of knownBlockedSources) {
        console.error(`- ${item.id ?? 'unknown'}: ${item.reason} (known-blocked: ${item.knownBlockedReason})`)
      }
    }
    if (STRICT) process.exitCode = 1
    return
  }

  if (knownBlockedSources.length > 0) {
    for (const item of knownBlockedSources) {
      console.log(`[audit-official-sources] known-blocked ${item.id}: ${item.reason}`)
    }
  }
  console.log(
    `[audit-official-sources] OK - audited ${officialSources.length} Tier 1/2 sources${knownBlockedSuffix}` +
      (SKIP_NETWORK ? ' (network skipped)' : ''),
  )
}

main().catch((error) => {
  const result = {
    ok: false,
    checkedAt: new Date().toISOString(),
    failures: [{ reason: error.message }],
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n')
  console.error('[audit-official-sources] FAILED:', error.message)
  process.exitCode = 1
})
