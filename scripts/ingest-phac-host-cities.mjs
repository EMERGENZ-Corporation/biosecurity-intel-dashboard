#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Deterministic auto-ingest of PHAC (Public Health Agency of Canada) wastewater
 * viral activity levels into host-city observations for the Canadian host cities
 * (Toronto, Vancouver).
 *
 * Counterpart to scripts/ingest-nwss-host-cities.mjs (US/CDC). Same trust model
 * and structural safety: deterministic verbatim mapping, severity capped at
 * `watch`, anti-stale guard, fail-open, idempotent. PHAC specifics:
 *
 *  - Source: PHAC National Wastewater Monitoring (Health Infobase), Tier 2,
 *    provenance `auto-phac`.
 *  - Reads ONE file: the current trend table at /src/data/wastewater/
 *    `wastewater_trend.csv`. It is self-contained — each row carries PHAC's own
 *    categorical `Viral_Activity_Level` AND a `weekStart` date, so no second
 *    (aggregate) fetch is needed for dating. (The legacy `covidLive/...` path is
 *    RETIRED — it froze at 2024-06 — and must not be used for live status.)
 *  - PHAC publishes a city-level aggregate row (`grouping == "City"`); we use it
 *    verbatim rather than re-aggregating sites ourselves. If a city has only
 *    site rows for a pathogen, we fall back to the highest site level.
 *  - Pathogens: covN2 → SARS-CoV-2, fluA → Influenza A, rsv → RSV (parity with
 *    the NWSS writer; fluB is not surfaced).
 *  - The continuous `min`/`max` metrics are NOT used — only PHAC's categorical
 *    level, mapped verbatim (turning a continuous value into a status would be a
 *    computed epidemiological judgement reserved for humans, CONTENT-STANDARDS
 *    §7.2).
 *
 * Publish policy knob: PHAC_PUBLISH_POLICY = 'auto' (default) | 'staged' | 'off'.
 *
 * USAGE
 *   node scripts/ingest-phac-host-cities.mjs            # fetch + write per policy
 *   node scripts/ingest-phac-host-cities.mjs --dry-run  # print plan, write nothing
 *   PHAC_TREND_FIXTURE=path.csv node ...                # local CSV (offline/testing)
 */

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'

// ---------------------------------------------------------------------------
// Config — the maintenance surface (verified live 2026-06-15).
// ---------------------------------------------------------------------------
const HOST_CITY_PATH = process.env.PHAC_HOST_CITY_PATH || 'src/data/host-city-biosurveillance.json'
const SOURCES_PATH = process.env.PHAC_SOURCES_PATH || 'src/data/signal-sources.json'
const OUTPUT_PATH = process.env.PHAC_OUTPUT_PATH || 'ingest-phac-result.json'

// Current PHAC National Wastewater Monitoring trend table. Self-contained
// (categorical level + weekStart). Configurable; do NOT hardcode in logic.
const TREND_URL =
  process.env.PHAC_TREND_URL ||
  'https://health-infobase.canada.ca/src/data/wastewater/wastewater_trend.csv'
// The aggregate table (historical/site detail) exists at the same directory
// (`wastewater_aggregate.csv`) but is NOT needed: the trend rows already carry
// weekStart. Kept here for reference / future detail use.
const AGGREGATE_URL =
  process.env.PHAC_AGGREGATE_URL ||
  'https://health-infobase.canada.ca/src/data/wastewater/wastewater_aggregate.csv'
// Always-valid human landing page cited as each observation's sourceUrl.
const DASHBOARD_URL = 'https://health-infobase.canada.ca/wastewater/'

const SOURCE_ID = process.env.PHAC_SOURCE_ID || 'phac-nwmp'

// measureid → display + id-slug. Parity with the NWSS writer (3 respiratory
// pathogens). fluB is present in the feed but intentionally not surfaced.
const PATHOGENS = [
  { measureid: 'covN2', display: 'SARS-CoV-2 (wastewater)', slug: 'sars-cov-2' },
  { measureid: 'fluA', display: 'Influenza A (wastewater)', slug: 'influenza-a' },
  { measureid: 'rsv', display: 'RSV (wastewater)', slug: 'rsv' },
]

// PHAC's own categorical viral activity levels, ordered quiet→high. "NA2"/blank
// and any unrecognized value are excluded (→ skip; no fabrication).
export const PHAC_LEVEL_RANK = { 'Non-detect': 0, Low: 1, Moderate: 2, High: 3 }

// cityId → PHAC `city` value (verified live). Configurable for future renames.
const PHAC_CITY_BY_ID = { toronto: 'Toronto', vancouver: 'Metro Vancouver' }

// Anti-stale guard — see the NWSS writer. If the newest usable weekStart is
// older than this, the observation is skipped (→ honest "No current data")
// rather than published as current. (The legacy covidLive feed froze in 2024;
// this is what keeps a dormant feed from showing stale data as live.)
const MAX_DATA_AGE_DAYS = Number.parseInt(process.env.PHAC_MAX_DATA_AGE_DAYS || '45', 10)

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing — no network, no fs).
// ---------------------------------------------------------------------------

/**
 * Map PHAC's categorical level to observation status + severity. Conservative,
 * matching the NWSS writer: only High raises a tile to "elevated"; severity
 * capped at "watch". Unknown level → null (skip, no fabrication).
 */
export function levelToObservationFields(level) {
  const rank = PHAC_LEVEL_RANK[level]
  if (rank === undefined) return null
  if (rank >= PHAC_LEVEL_RANK.High) return { status: 'elevated', severity: 'watch' }
  return { status: 'normal', severity: 'monitor' }
}

/** Minimal CSV parse for PHAC's well-formed files (no embedded commas/quotes). */
export function parseCsv(text) {
  const lines = String(text).replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    const row = {}
    header.forEach((h, i) => { row[h] = (cells[i] ?? '').trim() })
    return row
  })
}

function isoDateOrNull(value) {
  if (!value) return null
  const s = String(value).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime()) ? s : null
}

/** True when `sampleDate` is older than maxAgeDays relative to runDateIso. */
export function isStale(sampleDate, runDateIso, maxAgeDays = MAX_DATA_AGE_DAYS) {
  if (!sampleDate) return true
  const ageDays = (new Date(runDateIso).getTime() - new Date(sampleDate).getTime()) / 86400000
  return ageDays > maxAgeDays
}

export function canadaHostCities(doc) {
  return (doc.hostCities || []).filter((c) => c.country === 'Canada')
}

/**
 * Resolve one (city, pathogen) to its current PHAC level + date. Prefers PHAC's
 * own city-level aggregate row (`grouping == "City"`); falls back to the highest
 * level among site rows. Returns { level, trend, weekStart, basis, siteCount }
 * or null when there is no mappable, dated row.
 */
export function rollupCityPathogen(rows, phacCity, measureid) {
  const matching = rows.filter(
    (r) =>
      r.city === phacCity &&
      r.measureid === measureid &&
      PHAC_LEVEL_RANK[r.Viral_Activity_Level] !== undefined &&
      isoDateOrNull(r.weekStart),
  )
  if (matching.length === 0) return null

  const cityRows = matching.filter((r) => r.grouping === 'City')
  const pool = cityRows.length > 0 ? cityRows : matching
  const basis = cityRows.length > 0 ? 'city-aggregate' : 'site-max'

  let latestWeek = null
  for (const r of pool) {
    const wk = isoDateOrNull(r.weekStart)
    if (latestWeek === null || wk > latestWeek) latestWeek = wk
  }
  const inWeek = pool.filter((r) => isoDateOrNull(r.weekStart) === latestWeek)

  let best = null
  for (const r of inWeek) {
    const rank = PHAC_LEVEL_RANK[r.Viral_Activity_Level]
    if (best === null || rank > PHAC_LEVEL_RANK[best.Viral_Activity_Level]) best = r
  }
  return {
    level: best.Viral_Activity_Level,
    trend: best.latestTrend || null,
    weekStart: latestWeek,
    basis,
    siteCount: inWeek.length,
  }
}

/** Build one deterministic PHAC observation, or null if unmappable / stale. */
export function buildObservation({ city, pathogen, rollup, runDateIso, publish }) {
  const fields = levelToObservationFields(rollup.level)
  if (!fields) return null
  if (isStale(rollup.weekStart, runDateIso)) return null

  const basisText =
    rollup.basis === 'city-aggregate'
      ? 'PHAC city-level aggregate'
      : `highest of ${rollup.siteCount} site${rollup.siteCount === 1 ? '' : 's'}`
  const trendText = rollup.trend ? `; trend: ${rollup.trend}` : ''
  return {
    id: `auto-phac-${city.id}-${pathogen.slug}-${rollup.weekStart}`,
    hostCityId: city.id,
    domain: 'respiratory',
    pathogenOrSyndrome: pathogen.display,
    observationType: 'wastewater',
    status: fields.status,
    severity: fields.severity,
    confidence: 'official',
    sampleDate: rollup.weekStart,
    sourceId: SOURCE_ID,
    sourceUrl: DASHBOARD_URL,
    lastVerified: runDateIso,
    summary:
      `PHAC National Wastewater Monitoring for ${city.displayName}: ` +
      `${pathogen.display} viral activity level "${rollup.level}" ` +
      `(week of ${rollup.weekStart}; ${basisText}${trendText}).`,
    publicDisplayAllowed: publish === 'auto',
    provenance: 'auto-phac',
  }
}

/** Pure, idempotent transform: replaces only auto-phac obs; never touches others. */
export function applyIngestion({ doc, rows, runDateIso, publish }) {
  const next = JSON.parse(JSON.stringify(doc))
  const written = []
  const perCity = []

  for (const city of next.hostCities || []) {
    const others = (city.observations || []).filter((o) => o.provenance !== 'auto-phac')
    const auto = []

    if (city.country === 'Canada') {
      const phacCity = PHAC_CITY_BY_ID[city.id] || city.displayName
      for (const pathogen of PATHOGENS) {
        const rollup = rollupCityPathogen(rows, phacCity, pathogen.measureid)
        if (!rollup) continue
        const obs = buildObservation({ city, pathogen, rollup, runDateIso, publish })
        if (obs) { auto.push(obs); written.push(obs) }
      }
    }

    city.observations = [...others, ...auto]
    perCity.push({ cityId: city.id, autoObservations: auto.length })
  }
  return { doc: next, written, perCity }
}

// ---------------------------------------------------------------------------
// I/O (only reached when run directly).
// ---------------------------------------------------------------------------

function atomicWriteFileSync(path, content) {
  const tmp = `${path}.tmp.${process.pid}`
  writeFileSync(tmp, content)
  try {
    renameSync(tmp, path)
  } catch (error) {
    if (existsSync(tmp)) { try { unlinkSync(tmp) } catch { /* best-effort */ } }
    throw error
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeResult(result) {
  atomicWriteFileSync(
    OUTPUT_PATH,
    JSON.stringify({ checkedAt: new Date().toISOString(), source: SOURCE_ID, trendUrl: TREND_URL, ...result }, null, 2) + '\n',
  )
}

async function fetchCsv(url) {
  // canada.ca sits behind Akamai, which intermittently resets connections from
  // datacenter/CI IPs and challenges non-browser User-Agents. A descriptive
  // browser-style UA + a few retries with backoff makes the fetch reliable
  // without misrepresenting who we are. Fail-open still applies if all fail.
  const headers = {
    Accept: 'text/csv,*/*',
    'User-Agent':
      'Mozilla/5.0 (compatible; EMERGENZ-biosecurity-dashboard/1.0; +https://github.com/EMERGENZ-Corporation/biosecurity-intel-dashboard)',
  }
  const attempts = Number.parseInt(process.env.PHAC_FETCH_ATTEMPTS || '4', 10)
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, { headers, redirect: 'follow' })
      if (!res.ok) throw new Error(`PHAC HTTP ${res.status} ${res.statusText} for ${url}`)
      return parseCsv(await res.text())
    } catch (error) {
      lastError = error
      const cause = error.cause ? ` (cause: ${error.cause.code || error.cause.message || error.cause})` : ''
      console.warn(`[ingest-phac] fetch attempt ${attempt}/${attempts} failed: ${error.message}${cause}`)
      if (attempt < attempts) await new Promise((r) => setTimeout(r, attempt * 2500))
    }
  }
  throw lastError
}

async function main() {
  const policy = process.env.PHAC_PUBLISH_POLICY || 'auto'
  const dryRun = process.argv.includes('--dry-run')

  if (!['auto', 'staged', 'off'].includes(policy)) {
    console.error(`[ingest-phac] invalid PHAC_PUBLISH_POLICY "${policy}" (expected auto|staged|off)`)
    process.exit(1)
  }
  if (policy === 'off') {
    console.log('[ingest-phac] PHAC_PUBLISH_POLICY=off — kill switch engaged; nothing ingested.')
    if (!dryRun) writeResult({ ok: true, mode: 'off', wrote: false, observations: 0 })
    return
  }

  const doc = readJson(HOST_CITY_PATH)
  const sources = readJson(SOURCES_PATH)
  const src = sources.find((s) => s.id === SOURCE_ID)
  if (!src) throw new Error(`source "${SOURCE_ID}" not found in ${SOURCES_PATH}`)
  if (src.sourceTier > 2) throw new Error(`source "${SOURCE_ID}" must be Tier 1 or 2; got Tier ${src.sourceTier}`)

  const now = new Date()
  const runDateIso = now.toISOString().slice(0, 10)

  let rows
  try {
    rows = process.env.PHAC_TREND_FIXTURE ? parseCsv(readFileSync(process.env.PHAC_TREND_FIXTURE, 'utf8')) : await fetchCsv(TREND_URL)
  } catch (error) {
    console.error(`[ingest-phac] fetch failed (fail-open, no changes): ${error.message}`)
    if (!dryRun) writeResult({ ok: false, mode: 'fetch-error', error: error.message, wrote: false, observations: 0 })
    return
  }

  const { doc: nextDoc, written, perCity } = applyIngestion({ doc, rows, runDateIso, publish: policy })

  if (dryRun) {
    console.log(`[ingest-phac] DRY RUN (policy=${policy}) — would write ${written.length} observation(s):`)
    for (const o of written) {
      console.log(`  ${o.hostCityId.padEnd(12)} ${o.pathogenOrSyndrome.padEnd(26)} ${o.status.padEnd(9)} ${o.summary.match(/"([^"]+)"/)?.[1] ?? ''} (${o.sampleDate})`)
    }
    return
  }

  const serialized = JSON.stringify(nextDoc, null, 2) + '\n'
  const current = readFileSync(HOST_CITY_PATH, 'utf8')
  if (serialized === current) {
    writeResult({ ok: true, mode: 'no-op-byte-identical', wrote: false, observations: written.length, perCity })
    console.log('[ingest-phac] no change vs current file; nothing written.')
    return
  }

  atomicWriteFileSync(HOST_CITY_PATH, serialized)
  writeResult({
    ok: true,
    mode: written.length > 0 ? 'ingested' : 'cleared',
    policy,
    wrote: true,
    observations: written.length,
    perCity,
    written: written.map((o) => ({ id: o.id, hostCityId: o.hostCityId, status: o.status, sampleDate: o.sampleDate })),
  })
  console.log(`[ingest-phac] wrote ${written.length} auto-phac observation(s) to ${HOST_CITY_PATH} (policy=${policy})`)
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`[ingest-phac] fatal: ${error.message}`)
    process.exit(1)
  })
}
