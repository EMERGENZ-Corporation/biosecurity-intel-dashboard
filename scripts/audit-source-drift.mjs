// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import { createHash } from 'crypto'
import { dirname } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

const DATA_DIR = process.env.AUDIT_DATA_DIR || 'src/data'
const BASELINE_PATH = process.env.SOURCE_DRIFT_BASELINE || '.source-fingerprints/official-source-fingerprints.json'
const OUTPUT_PATH = process.env.SOURCE_DRIFT_OUTPUT || 'official-source-drift-result.json'
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.SOURCE_DRIFT_TIMEOUT_MS || '15000', 10)
const SKIP_NETWORK = process.env.OFFICIAL_SOURCE_DRIFT_SKIP_NETWORK === '1'
const STRICT = process.env.OFFICIAL_SOURCE_DRIFT_STRICT !== '0'
const SOURCE_TIERS = new Set([1, 2])
const HTTP_OK_MAX = 399

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeText(value) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTitle(value) {
  const match = value.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? normalizeText(match[1]) : null
}

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return null
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  } catch {
    return null
  }
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

async function fetchWithTimeout(source) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(source.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'EMERGENZ official source drift audit (+https://biosecurity-intel.emergenzsystems.org)',
        Accept: 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function fingerprintSource(source) {
  if (!source.url || !/^https?:\/\//i.test(source.url)) {
    return { source, error: failure(source, 'source URL is missing or not HTTP(S)') }
  }

  try {
    const res = await fetchWithTimeout(source)
    if (res.status > HTTP_OK_MAX) {
      return { source, error: failure(source, `HTTP ${res.status}`, { status: res.status }) }
    }

    const raw = await res.text()
    const normalized = normalizeText(raw)
    return {
      source,
      fingerprint: {
        id: source.id,
        authority: source.authority,
        title: source.title,
        url: source.url,
        tier: source.sourceTier,
        lastVerified: source.lastVerified,
        status: res.status,
        etag: res.headers.get('etag'),
        lastModified: res.headers.get('last-modified'),
        pageTitle: extractTitle(raw),
        contentLength: normalized.length,
        contentHash: sha256(normalized),
      },
    }
  } catch (error) {
    return {
      source,
      error: failure(source, error.name === 'AbortError' ? 'request timed out' : error.message),
    }
  }
}

function describeChange(previous, current) {
  const fields = []
  for (const key of ['contentHash', 'etag', 'lastModified', 'pageTitle']) {
    if ((previous?.[key] ?? null) !== (current?.[key] ?? null)) fields.push(key)
  }
  return fields
}

// A source flagged knownBlocked is allowed to return HTTP 403 from the
// drift fingerprint fetch; route that to a known-blocked bucket rather than
// counting it as unreadable. See audit-official-sources.mjs for the
// matching contract on the reachability audit.
function isExpectedBlock(source, error) {
  return source.knownBlocked === true && error?.status === 403
}

async function main() {
  const checkedAt = new Date()
  const sources = JSON.parse(readFileSync(`${DATA_DIR}/signal-sources.json`, 'utf8'))
  const officialSources = sources.filter((source) => SOURCE_TIERS.has(source.sourceTier))
  const baseline = loadBaseline()
  const previousById = new Map((baseline?.fingerprints ?? []).map((item) => [item.id, item]))

  const fingerprints = []
  const changedSources = []
  const unreadableSources = []
  const knownBlockedSources = []

  if (!SKIP_NETWORK) {
    const results = await Promise.all(officialSources.map((source) => fingerprintSource(source)))
    for (const result of results) {
      if (result.error) {
        if (isExpectedBlock(result.source, result.error)) {
          knownBlockedSources.push({
            ...result.error,
            knownBlockedReason: result.source.knownBlockedReason,
          })
        } else {
          unreadableSources.push(result.error)
        }
        continue
      }

      const current = result.fingerprint
      fingerprints.push(current)
      const previous = previousById.get(current.id)
      if (!previous) continue

      const changedFields = describeChange(previous, current)
      if (changedFields.length > 0) {
        changedSources.push({
          id: current.id,
          authority: current.authority,
          title: current.title,
          url: current.url,
          tier: current.tier,
          changedFields,
          previous: {
            etag: previous.etag,
            lastModified: previous.lastModified,
            pageTitle: previous.pageTitle,
            contentHash: previous.contentHash,
          },
          current: {
            etag: current.etag,
            lastModified: current.lastModified,
            pageTitle: current.pageTitle,
            contentHash: current.contentHash,
          },
        })
      }
    }
  }

  const currentBaseline = {
    generatedAt: checkedAt.toISOString(),
    fingerprints,
  }
  mkdirSync(dirname(BASELINE_PATH), { recursive: true })
  writeFileSync(BASELINE_PATH, JSON.stringify(currentBaseline, null, 2) + '\n')

  const result = {
    ok: changedSources.length === 0 && unreadableSources.length === 0,
    checkedAt: checkedAt.toISOString(),
    baselineLoaded: Boolean(baseline),
    thresholds: {
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      networkSkipped: SKIP_NETWORK,
    },
    sources: {
      total: sources.length,
      audited: officialSources.length,
      fingerprinted: fingerprints.length,
      knownBlocked: knownBlockedSources.length,
    },
    changedSources,
    unreadableSources,
    knownBlockedSources,
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n')

  const knownBlockedSuffix = knownBlockedSources.length > 0
    ? `, ${knownBlockedSources.length} known-blocked`
    : ''

  if (!result.ok) {
    const mode = STRICT ? 'FAILED' : 'REVIEW NEEDED'
    console.error(`[audit-source-drift] ${mode}`)
    for (const item of changedSources) {
      console.error(`- ${item.id}: changed ${item.changedFields.join(', ')}`)
    }
    for (const item of unreadableSources) {
      console.error(`- ${item.id}: ${item.reason}`)
    }
    if (knownBlockedSources.length > 0) {
      console.error(`(${knownBlockedSources.length} known-blocked acknowledged — not counted as failures)`)
      for (const item of knownBlockedSources) {
        console.error(`- ${item.id}: ${item.reason} (known-blocked: ${item.knownBlockedReason})`)
      }
    }
    if (STRICT) process.exitCode = 1
    return
  }

  if (knownBlockedSources.length > 0) {
    for (const item of knownBlockedSources) {
      console.log(`[audit-source-drift] known-blocked ${item.id}: ${item.reason}`)
    }
  }
  const baselineNote = baseline ? '' : ' (new baseline)'
  console.log(
    `[audit-source-drift] OK - fingerprinted ${fingerprints.length} Tier 1/2 sources${knownBlockedSuffix}${baselineNote}` +
      (SKIP_NETWORK ? ' (network skipped)' : ''),
  )
}

main().catch((error) => {
  const result = {
    ok: false,
    checkedAt: new Date().toISOString(),
    baselineLoaded: false,
    changedSources: [],
    unreadableSources: [{ reason: error.message }],
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n')
  console.error('[audit-source-drift] FAILED:', error.message)
  process.exitCode = 1
})
