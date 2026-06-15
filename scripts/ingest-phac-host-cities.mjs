#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Deterministic auto-ingest of PHAC (Public Health Agency of Canada) wastewater
 * viral activity levels into host-city observations for the Canadian host cities
 * (Toronto, Vancouver).
 *
 * Counterpart to scripts/ingest-nwss-host-cities.mjs (US/CDC). Same trust model,
 * same structural safety (deterministic verbatim mapping, severity capped at
 * `watch`, self-healing freshness, fail-open, idempotent). Differences:
 *
 *  - Source is PHAC (Tier 2), provenance `auto-phac` (not `auto-nwss`).
 *  - PHAC publishes TWO CSVs at stable URLs:
 *      • trend file — per-site `latestLevel` (Low/Medium/High/New) + `latestTrend`
 *        (PHAC's OWN categorical classification — we map it verbatim, exactly as
 *        we map CDC's. The raw `viral_load` file is continuous and is NOT used,
 *        because turning a continuous load into a status would require inventing
 *        thresholds — a computed epidemiological judgement reserved for humans,
 *        CONTENT-STANDARDS §7.2.)
 *      • main file — historical rows with a real `Date`, used only to date the
 *        observation (the trend file is an undated "latest" snapshot). Dating the
 *        observation from real data — not the ingest date — is what lets the UI
 *        degrade to "stale" if PHAC stops updating (self-healing).
 *  - COVID-19 only (`measureid: covN2`). PHAC's flu/RSV are in a separate program
 *    feed not yet wired; the respiratory tile reflects SARS-CoV-2 wastewater and
 *    the summary says so. (Documented follow-on.)
 *
 * Publish policy knob (identical semantics to the NWSS writer):
 *   PHAC_PUBLISH_POLICY = 'auto' (default) | 'staged' | 'off'
 *
 * USAGE
 *   node scripts/ingest-phac-host-cities.mjs            # fetch + write per policy
 *   node scripts/ingest-phac-host-cities.mjs --dry-run  # print plan, write nothing
 *   PHAC_TREND_FIXTURE / PHAC_MAIN_FIXTURE              # local CSV files (offline/testing)
 */

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'

// ---------------------------------------------------------------------------
// Config — the maintenance surface (verified live 2026-06-15).
// ---------------------------------------------------------------------------
const HOST_CITY_PATH = process.env.PHAC_HOST_CITY_PATH || 'src/data/host-city-biosurveillance.json'
const SOURCES_PATH = process.env.PHAC_SOURCES_PATH || 'src/data/signal-sources.json'
const OUTPUT_PATH = process.env.PHAC_OUTPUT_PATH || 'ingest-phac-result.json'

const TREND_URL =
  process.env.PHAC_TREND_URL ||
  'https://health-infobase.canada.ca/src/data/covidLive/wastewater/covid19-wastewater-trend.csv'
const MAIN_URL =
  process.env.PHAC_MAIN_URL ||
  'https://health-infobase.canada.ca/src/data/covidLive/wastewater/covid19-wastewater.csv'
// Always-valid human landing page cited as each observation's sourceUrl
// (the interactive dashboard is JS-rendered, so no fragile per-city deep link).
const DASHBOARD_URL = 'https://health-infobase.canada.ca/wastewater/'

const SOURCE_ID = process.env.PHAC_SOURCE_ID || 'phac-nwmp'
const COVID_MEASURE_ID = 'covN2'
const PATHOGEN = { display: 'SARS-CoV-2 (wastewater)', slug: 'sars-cov-2' }

// PHAC's own categorical levels, ordered low→high. "New" = newly-onboarded site
// with insufficient history → skipped (no confident level; no fabrication).
export const PHAC_LEVEL_RANK = { Low: 0, Medium: 1, High: 2 }

// cityId → PHAC `region` value. Defaults to the city displayName (Toronto/
// Vancouver match PHAC region names exactly); override here if PHAC renames.
const PHAC_REGION_BY_CITY = { toronto: 'Toronto', vancouver: 'Vancouver' }

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing — no network, no fs).
// ---------------------------------------------------------------------------

/**
 * Map PHAC's categorical level to observation status + severity. Conservative,
 * matching the NWSS writer: only High raises a tile to "elevated", severity
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

export function canadaHostCities(doc) {
  return (doc.hostCities || []).filter((c) => c.country === 'Canada')
}

/**
 * Highest PHAC level among a region's COVID sites in the trend snapshot.
 * Returns { level, trend, siteCount } or null.
 */
export function rollupRegionLevel(trendRows, region) {
  const sites = trendRows.filter(
    (r) => r.region === region && r.measureid === COVID_MEASURE_ID && PHAC_LEVEL_RANK[r.latestLevel] !== undefined,
  )
  if (sites.length === 0) return null
  let bestRank = -1
  let bestLevel = null
  const trends = new Set()
  for (const s of sites) {
    const rank = PHAC_LEVEL_RANK[s.latestLevel]
    if (rank > bestRank) { bestRank = rank; bestLevel = s.latestLevel }
    if (s.latestTrend) trends.add(s.latestTrend)
  }
  const trend = trends.size === 1 ? [...trends][0] : 'varies across sites'
  return { level: bestLevel, trend, siteCount: sites.length }
}

/** Latest COVID sample date for a region from the dated main file, or null. */
export function latestRegionDate(mainRows, region) {
  let latest = null
  for (const r of mainRows) {
    if (r.region !== region) continue
    if (r.measureid && r.measureid !== COVID_MEASURE_ID) continue
    const d = isoDateOrNull(r.Date)
    if (d && (latest === null || d > latest)) latest = d
  }
  return latest
}

/** Build one deterministic PHAC observation, or null if unmappable / undated. */
export function buildObservation({ city, rollup, sampleDate, runDateIso, publish }) {
  const fields = levelToObservationFields(rollup.level)
  if (!fields || !sampleDate) return null
  const siteWord = rollup.siteCount === 1 ? 'site' : 'sites'
  return {
    id: `auto-phac-${city.id}-${PATHOGEN.slug}-${sampleDate}`,
    hostCityId: city.id,
    domain: 'respiratory',
    pathogenOrSyndrome: PATHOGEN.display,
    observationType: 'wastewater',
    status: fields.status,
    severity: fields.severity,
    confidence: 'official',
    sampleDate,
    sourceId: SOURCE_ID,
    sourceUrl: DASHBOARD_URL,
    lastVerified: runDateIso,
    summary:
      `PHAC wastewater respiratory surveillance for Metro ${city.displayName}: ` +
      `SARS-CoV-2 viral activity level "${rollup.level}" (highest among ${rollup.siteCount} ${siteWord}; ` +
      `trend: ${rollup.trend}; data to ${sampleDate}). COVID-19 only — PHAC influenza/RSV not yet ingested.`,
    publicDisplayAllowed: publish === 'auto',
    provenance: 'auto-phac',
  }
}

/** Pure, idempotent transform: replaces only auto-phac obs; never touches others. */
export function applyIngestion({ doc, trendRows, mainRows, runDateIso, publish }) {
  const next = JSON.parse(JSON.stringify(doc))
  const written = []
  const perCity = []

  for (const city of next.hostCities || []) {
    const others = (city.observations || []).filter((o) => o.provenance !== 'auto-phac')
    const auto = []

    if (city.country === 'Canada') {
      const region = PHAC_REGION_BY_CITY[city.id] || city.displayName
      const rollup = rollupRegionLevel(trendRows, region)
      if (rollup) {
        const sampleDate = latestRegionDate(mainRows, region)
        const obs = buildObservation({ city, rollup, sampleDate, runDateIso, publish })
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
    JSON.stringify({ checkedAt: new Date().toISOString(), source: SOURCE_ID, ...result }, null, 2) + '\n',
  )
}

async function fetchCsv(url) {
  const res = await fetch(url, { headers: { Accept: 'text/csv' } })
  if (!res.ok) throw new Error(`PHAC HTTP ${res.status} ${res.statusText} for ${url}`)
  return parseCsv(await res.text())
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

  let trendRows
  let mainRows
  try {
    trendRows = process.env.PHAC_TREND_FIXTURE ? parseCsv(readFileSync(process.env.PHAC_TREND_FIXTURE, 'utf8')) : await fetchCsv(TREND_URL)
    mainRows = process.env.PHAC_MAIN_FIXTURE ? parseCsv(readFileSync(process.env.PHAC_MAIN_FIXTURE, 'utf8')) : await fetchCsv(MAIN_URL)
  } catch (error) {
    console.error(`[ingest-phac] fetch failed (fail-open, no changes): ${error.message}`)
    if (!dryRun) writeResult({ ok: false, mode: 'fetch-error', error: error.message, wrote: false, observations: 0 })
    return
  }

  const { doc: nextDoc, written, perCity } = applyIngestion({ doc, trendRows, mainRows, runDateIso, publish: policy })

  if (dryRun) {
    console.log(`[ingest-phac] DRY RUN (policy=${policy}) — would write ${written.length} observation(s):`)
    for (const o of written) {
      console.log(`  ${o.hostCityId.padEnd(12)} ${o.status.padEnd(9)} ${o.summary.match(/"([^"]+)"/)?.[1] ?? ''} (${o.sampleDate})`)
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
