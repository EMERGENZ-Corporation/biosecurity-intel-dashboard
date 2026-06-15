#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Deterministic auto-ingest of CDC NWSS wastewater viral activity levels into
 * host-city observations (`src/data/host-city-biosurveillance.json`).
 *
 * WHY THIS EXISTS
 * ---------------
 * The Host City BioSignals page registers CDC NWSS as the respiratory source
 * for the 11 US host cities but ships with zero observations, so every tile
 * reads "No current data". This script reads the official, machine-readable
 * CDC Socrata dataset and writes real, source-bound observations — without
 * fabricating anything and without requiring a human to re-key official data
 * every week.
 *
 * THE TRUST MODEL (read before changing the publish policy)
 * ---------------------------------------------------------
 * Every value written here is a CDC categorical activity level read VERBATIM
 * from the official Tier 1 API and mapped through a fixed lookup table. There
 * is no judgement a human reviewer could add by re-reading "CDC says Georgia
 * COVID wastewater = High this week" and clicking approve — only latency. So
 * for this narrow, deterministic, Tier-1 case the default policy is
 * `auto`: clean observations publish directly. Anything the script cannot map
 * confidently is SKIPPED (left as "No current data") — a missing tile is
 * always preferred over a guessed one (CONTENT-STANDARDS §4.1/§4.2).
 *
 * The publish policy is the ONE operator-facing knob:
 *   NWSS_PUBLISH_POLICY = 'auto'   (default) → publicDisplayAllowed: true  (live)
 *                       = 'staged'           → publicDisplayAllowed: false (review gate, gate G21)
 *                       = 'off'              → do nothing (kill switch)
 * It is set explicitly in .github/workflows/ingest-nwss-host-cities.yml so it
 * is version-controlled and visible; flipping it is a one-line workflow edit.
 *
 * STRUCTURAL SAFETY (why this needs no babysitting)
 * -------------------------------------------------
 *  - Deterministic: values mapped verbatim from the official enum; unknown /
 *    missing values are skipped, never guessed.
 *  - Severity is CAPPED at 'watch'. A single automated wastewater feed can
 *    raise a domain to "elevated" and a city to "watch", but reaching
 *    "concern"/"action" still requires human curation or multi-source
 *    convergence (see src/utils/hostCityBioSignals.ts). The loudest alarms are
 *    never tripped by this script alone.
 *  - Self-healing freshness: if this job silently stops, observations age past
 *    the freshness threshold and the UI degrades to "stale" then drops them —
 *    the dashboard never shows stale data dressed up as current.
 *  - Idempotent: each run REPLACES prior `provenance:"auto-nwss"` observations
 *    and never touches curated (human) observations or city identity fields.
 *  - Fail-open & atomic: any API/parse error for an item writes nothing for it;
 *    a run that yields zero observations makes no file change (§4.4).
 *
 * USAGE
 *   node scripts/ingest-nwss-host-cities.mjs            # fetch + write per policy
 *   node scripts/ingest-nwss-host-cities.mjs --dry-run  # print plan, write nothing
 *   NWSS_FIXTURE_PATH=fixture.json node ...             # read rows from a file (offline/testing)
 *   NWSS_APP_TOKEN=...                                  # optional Socrata token (rate limits)
 *
 * The fetch and the transform are separable: the pure transform functions are
 * exported and unit-tested in scripts/test-ingest-nwss-host-cities.mjs with a
 * synthetic fixture, so correctness does not depend on network access.
 */

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'

// ---------------------------------------------------------------------------
// Config — the maintenance surface. CDC rotates dataset IDs and columns; if the
// feed schema changes, fix it HERE in one place (verified live 2026-06-14).
// ---------------------------------------------------------------------------
const HOST_CITY_PATH = process.env.NWSS_HOST_CITY_PATH || 'src/data/host-city-biosurveillance.json'
const SOURCES_PATH = process.env.NWSS_SOURCES_PATH || 'src/data/signal-sources.json'
const OUTPUT_PATH = process.env.NWSS_OUTPUT_PATH || 'ingest-nwss-result.json'

// CDC "Wastewater Viral Activity Level for SARS-CoV-2, Influenza A and RSV".
const DATASET_ID = process.env.NWSS_DATASET_ID || 'atcp-73re'
const SOCRATA_BASE = `https://data.cdc.gov/resource/${DATASET_ID}.json`
// Always-valid, precisely-filterable human landing page for the dataset; cited
// as each observation's sourceUrl. (State-trend HTML pages are JS-rendered, so
// we do not ship per-state deep links that we cannot verify.)
const DATASET_PAGE_URL = `https://data.cdc.gov/d/${DATASET_ID}`

// The Tier 1 source every observation must cite (must resolve in signal-sources.json).
const SOURCE_ID = process.env.NWSS_SOURCE_ID || 'cdc-nwss'

// Socrata column names (verified live).
const COL = {
  state: 'state_territory',
  pathogen: 'pathogen_target',
  weekEnd: 'week_end',
  category: 'site_wval_category',
  updated: 'date_updated',
}

// The three tracked respiratory pathogens, with display + id-slug.
const PATHOGENS = [
  { target: 'SARS-CoV-2', display: 'SARS-CoV-2 (wastewater)', slug: 'sars-cov-2' },
  { target: 'Influenza A virus', display: 'Influenza A (wastewater)', slug: 'influenza-a' },
  { target: 'RSV', display: 'RSV (wastewater)', slug: 'rsv' },
]

// CDC categorical activity levels, ordered low→high. The max across a state's
// sites is the city's level for the week.
export const CATEGORY_RANK = {
  'Very Low': 0,
  Low: 1,
  Moderate: 2,
  High: 3,
  'Very High': 4,
}

// How many days back to pull so we reliably capture the latest weekly release.
const LOOKBACK_DAYS = Number.parseInt(process.env.NWSS_LOOKBACK_DAYS || '45', 10)
const FETCH_LIMIT = Number.parseInt(process.env.NWSS_FETCH_LIMIT || '50000', 10)

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing — no network, no fs).
// ---------------------------------------------------------------------------

/**
 * Map a CDC categorical level to observation status + severity.
 * Conservative by design: only High / Very High raise a tile to "elevated",
 * and severity is CAPPED at "watch" (auto data never trips concern/action).
 * Returns null for any unrecognized category → caller SKIPS (no fabrication).
 */
export function categoryToObservationFields(category) {
  const rank = CATEGORY_RANK[category]
  if (rank === undefined) return null
  if (rank >= CATEGORY_RANK.High) return { status: 'elevated', severity: 'watch' }
  return { status: 'normal', severity: 'monitor' }
}

/** ISO date (YYYY-MM-DD) or null. */
function isoDateOrNull(value) {
  if (!value) return null
  const s = String(value).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime()) ? s : null
}

/** US host cities only (state-level NWSS). Canada/Mexico are out of scope. */
export function usHostCities(doc) {
  return (doc.hostCities || []).filter((c) => c.country === 'United States')
}

/** Distinct US states present in the host-city file (drives the API filter). */
export function usStates(doc) {
  return [...new Set(usHostCities(doc).map((c) => c.regionOrState).filter(Boolean))]
}

/**
 * For one (state, pathogenTarget): from the supplied rows, find the most recent
 * week, then take the HIGHEST categorical level among that state's sites in that
 * week. Returns { category, weekEnd, dateUpdated, siteCount } or null.
 */
export function latestWeekRollup(rows, state, pathogenTarget) {
  const matching = rows.filter(
    (r) => r[COL.state] === state && r[COL.pathogen] === pathogenTarget && isoDateOrNull(r[COL.weekEnd]),
  )
  if (matching.length === 0) return null

  let latestWeek = null
  for (const r of matching) {
    const wk = isoDateOrNull(r[COL.weekEnd])
    if (latestWeek === null || wk > latestWeek) latestWeek = wk
  }

  const inWeek = matching.filter((r) => isoDateOrNull(r[COL.weekEnd]) === latestWeek)
  let bestRank = -1
  let bestCategory = null
  let dateUpdated = null
  for (const r of inWeek) {
    const cat = r[COL.category]
    const rank = CATEGORY_RANK[cat]
    if (rank === undefined) continue // unknown/limited categories are ignored
    if (rank > bestRank) {
      bestRank = rank
      bestCategory = cat
    }
    const upd = isoDateOrNull(r[COL.updated])
    if (upd && (dateUpdated === null || upd > dateUpdated)) dateUpdated = upd
  }
  if (bestCategory === null) return null // no mappable category this week → skip
  return { category: bestCategory, weekEnd: latestWeek, dateUpdated, siteCount: inWeek.length }
}

/** Build a single deterministic observation. Returns null if unmappable. */
export function buildObservation({ city, pathogen, rollup, runDateIso, publish }) {
  const fields = categoryToObservationFields(rollup.category)
  if (!fields) return null

  const sampleDate = rollup.weekEnd
  let reportDate
  let reportingLagDays
  if (rollup.dateUpdated && rollup.dateUpdated >= sampleDate) {
    reportDate = rollup.dateUpdated
    reportingLagDays = Math.round((new Date(reportDate).getTime() - new Date(sampleDate).getTime()) / 86400000)
  }

  const siteWord = rollup.siteCount === 1 ? 'monitoring site' : 'monitoring sites'
  const obs = {
    id: `auto-nwss-${city.id}-${pathogen.slug}-${rollup.weekEnd}`,
    hostCityId: city.id,
    domain: 'respiratory',
    pathogenOrSyndrome: pathogen.display,
    observationType: 'wastewater',
    status: fields.status,
    severity: fields.severity,
    confidence: 'official',
    sampleDate,
    sourceId: SOURCE_ID,
    sourceUrl: DATASET_PAGE_URL,
    lastVerified: runDateIso,
    summary:
      `CDC NWSS state-level wastewater viral activity for ${city.regionOrState}: ` +
      `${pathogen.display} at "${rollup.category}" (highest among ${rollup.siteCount} ${siteWord} ` +
      `for the week ending ${rollup.weekEnd}). Open the dataset for site-level detail.`,
    publicDisplayAllowed: publish === 'auto',
    provenance: 'auto-nwss',
  }
  if (reportDate) {
    obs.reportDate = reportDate
    obs.reportingLagDays = reportingLagDays
  }
  return obs
}

/**
 * Pure, idempotent transform. Strips prior auto-nwss observations from every
 * city, then appends freshly-derived ones. Never touches curated observations
 * or any city identity field. Returns the new doc + a report.
 */
export function applyIngestion({ doc, rows, runDateIso, publish }) {
  const next = JSON.parse(JSON.stringify(doc))
  const written = []
  const perCity = []

  for (const city of next.hostCities || []) {
    // Preserve everything that isn't ours.
    const curated = (city.observations || []).filter((o) => o.provenance !== 'auto-nwss')
    const auto = []

    if (city.country === 'United States') {
      for (const pathogen of PATHOGENS) {
        const rollup = latestWeekRollup(rows, city.regionOrState, pathogen.target)
        if (!rollup) continue
        const obs = buildObservation({ city, pathogen, rollup, runDateIso, publish })
        if (obs) {
          auto.push(obs)
          written.push(obs)
        }
      }
    }

    city.observations = [...curated, ...auto]
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
    if (existsSync(tmp)) {
      try { unlinkSync(tmp) } catch { /* best-effort cleanup */ }
    }
    throw error
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeResult(result) {
  atomicWriteFileSync(
    OUTPUT_PATH,
    JSON.stringify({ checkedAt: new Date().toISOString(), datasetId: DATASET_ID, ...result }, null, 2) + '\n',
  )
}

function lookbackCutoffIso(now) {
  return new Date(now.getTime() - LOOKBACK_DAYS * 86400000).toISOString().slice(0, 10)
}

function buildSocrataUrl(states, cutoff) {
  const quoted = states.map((s) => `'${String(s).replace(/'/g, "''")}'`).join(',')
  const params = new URLSearchParams()
  params.set('$select', `${COL.state},${COL.pathogen},${COL.weekEnd},${COL.category},${COL.updated}`)
  params.set('$where', `${COL.state} in(${quoted}) AND ${COL.weekEnd} >= '${cutoff}'`)
  params.set('$order', `${COL.weekEnd} DESC`)
  params.set('$limit', String(FETCH_LIMIT))
  return `${SOCRATA_BASE}?${params.toString()}`
}

async function fetchRows(states, now) {
  const cutoff = lookbackCutoffIso(now)
  const url = buildSocrataUrl(states, cutoff)
  const headers = { Accept: 'application/json' }
  if (process.env.NWSS_APP_TOKEN) headers['X-App-Token'] = process.env.NWSS_APP_TOKEN
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Socrata HTTP ${res.status} ${res.statusText}`)
  const rows = await res.json()
  if (!Array.isArray(rows)) throw new Error('Socrata response was not an array')
  if (rows.length === FETCH_LIMIT) {
    console.warn(`[ingest-nwss] WARNING: hit fetch limit (${FETCH_LIMIT}); some rows may be truncated.`)
  }
  return rows
}

async function main() {
  const policy = process.env.NWSS_PUBLISH_POLICY || 'auto'
  const dryRun = process.argv.includes('--dry-run')

  if (!['auto', 'staged', 'off'].includes(policy)) {
    console.error(`[ingest-nwss] invalid NWSS_PUBLISH_POLICY "${policy}" (expected auto|staged|off)`)
    process.exit(1)
  }
  if (policy === 'off') {
    console.log('[ingest-nwss] NWSS_PUBLISH_POLICY=off — kill switch engaged; nothing ingested.')
    if (!dryRun) writeResult({ ok: true, mode: 'off', wrote: false, observations: 0 })
    return
  }

  const doc = readJson(HOST_CITY_PATH)

  // Tier 1 source must resolve (fail loud — config error, not a data gap).
  const sources = readJson(SOURCES_PATH)
  const src = sources.find((s) => s.id === SOURCE_ID)
  if (!src) throw new Error(`source "${SOURCE_ID}" not found in ${SOURCES_PATH}`)
  if (src.sourceTier !== 1) throw new Error(`source "${SOURCE_ID}" must be Tier 1; got Tier ${src.sourceTier}`)

  const now = new Date()
  const runDateIso = now.toISOString().slice(0, 10)
  const states = usStates(doc)

  // Rows: live Socrata fetch, or a local fixture for offline/testing.
  let rows
  if (process.env.NWSS_FIXTURE_PATH) {
    rows = readJson(process.env.NWSS_FIXTURE_PATH)
    console.log(`[ingest-nwss] using fixture ${process.env.NWSS_FIXTURE_PATH} (${rows.length} rows)`)
  } else {
    try {
      rows = await fetchRows(states, now)
    } catch (error) {
      // Fail-open: a transient CDC outage must not break the dashboard or the
      // workflow. Existing observations stay; they age to "stale" on their own.
      console.error(`[ingest-nwss] fetch failed (fail-open, no changes): ${error.message}`)
      writeResult({ ok: false, mode: 'fetch-error', error: error.message, wrote: false, observations: 0 })
      return
    }
  }

  const { doc: nextDoc, written, perCity } = applyIngestion({ doc, rows, runDateIso, publish: policy })

  if (dryRun) {
    console.log(`[ingest-nwss] DRY RUN (policy=${policy}) — would write ${written.length} observation(s):`)
    for (const o of written) {
      console.log(`  ${o.hostCityId.padEnd(20)} ${o.pathogenOrSyndrome.padEnd(26)} ${o.status.padEnd(9)} ${o.summary.match(/"([^"]+)"/)?.[1] ?? ''}`)
    }
    return
  }

  const serialized = JSON.stringify(nextDoc, null, 2) + '\n'
  const current = readFileSync(HOST_CITY_PATH, 'utf8')
  if (serialized === current) {
    writeResult({ ok: true, mode: 'no-op-byte-identical', wrote: false, observations: written.length, perCity })
    console.log('[ingest-nwss] no change vs current file; nothing written.')
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
  console.log(`[ingest-nwss] wrote ${written.length} auto-nwss observation(s) to ${HOST_CITY_PATH} (policy=${policy})`)
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`[ingest-nwss] fatal: ${error.message}`)
    process.exit(1)
  })
}
