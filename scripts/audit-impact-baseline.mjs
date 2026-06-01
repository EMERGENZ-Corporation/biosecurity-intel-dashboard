#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * audit-impact-baseline — emit a point-in-time, artifact-based snapshot of
 * the dashboard for impact / grant reporting.
 *
 * Why this exists: the dashboard publicly promises "no cookies, tracking
 * pixels, or analytics tools" (see src/pages/AboutPage.tsx Privacy section).
 * Behavioral tracking would reverse that promise. Instead, impact reporting
 * pairs Vercel's server-side request logs (no client code) with this
 * artifact snapshot, which counts what the dashboard actually publishes:
 * signals tracked, sources cited, news aggregated, content depth, freshness.
 *
 * This script is intentionally read-only and produces no network traffic.
 * Outputs are gitignored. See docs/IMPACT-REPORTING.md for the operator
 * procedure that uses these outputs alongside the Vercel logs export.
 */

import { readFileSync, writeFileSync } from 'fs'

const DATA_DIR = process.env.AUDIT_DATA_DIR || 'src/data'
const JSON_OUTPUT = process.env.IMPACT_BASELINE_JSON || 'impact-baseline-result.json'
const MD_OUTPUT = process.env.IMPACT_BASELINE_MD || 'impact-baseline-result.md'
const NOW = new Date()

const SIGNAL_CATEGORY_LABELS = {
  respiratory: 'Respiratory Threats',
  vhf: 'Hemorrhagic Threats',
  enteric: 'Enteric / Waterborne',
  vector_borne: 'Vector-Borne',
  zoonotic: 'Zoonotic Spillover',
  amr_fungal: 'Healthcare-Associated / AMR',
  environmental: 'Environmental Surveillance',
  mass_gathering: 'Mass Gatherings & Events',
  travel: 'Travel & Importation',
  vaccine_preventable: 'Vaccine Gaps',
}

const SOURCE_TIER_LABELS = {
  1: 'Tier 1 — Official / authoritative',
  2: 'Tier 2 — Peer-reviewed / academic',
  3: 'Tier 3 — Reputable secondary',
  4: 'Tier 4 — Other primary',
}

function readJson(name) {
  return JSON.parse(readFileSync(`${DATA_DIR}/${name}`, 'utf8'))
}

function tally(items, key) {
  const out = {}
  for (const item of items) {
    const value = typeof key === 'function' ? key(item) : item[key]
    if (value == null) continue
    out[value] = (out[value] || 0) + 1
  }
  return out
}

function pct(numerator, denominator) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

function buildSignalsSection(signals) {
  const byCategory = tally(signals, 'category')
  const bySeverity = tally(signals, 'severity')
  const byConfidence = tally(signals, 'confidence')
  const byStatus = tally(signals, 'status')

  const distinctCountries = new Set()
  for (const signal of signals) {
    for (const place of signal.geography || []) distinctCountries.add(place)
  }

  const totalMapMarkers = signals.reduce((n, s) => n + (s.mapMarkers?.length ?? 0), 0)
  const totalDetailSections = signals.reduce((n, s) => n + (s.detailSections?.length ?? 0), 0)
  const withPrimarySource = signals.filter((s) => s.primarySourceId).length

  // Freshness vs. the documented 168h source-review cadence
  const STALE_THRESHOLD_MS = 168 * 60 * 60 * 1000
  let freshCount = 0
  let staleCount = 0
  let unknownCount = 0
  for (const signal of signals) {
    const checked = new Date(signal.lastChecked).getTime()
    if (Number.isNaN(checked)) {
      unknownCount += 1
      continue
    }
    if (NOW.getTime() - checked <= STALE_THRESHOLD_MS) freshCount += 1
    else staleCount += 1
  }

  return {
    total: signals.length,
    byCategory,
    bySeverity,
    byConfidence,
    byStatus,
    distinctGeographyEntries: distinctCountries.size,
    totalMapMarkers,
    totalDetailSections,
    primarySourceCoveragePct: pct(withPrimarySource, signals.length),
    freshness: {
      windowHours: 168,
      fresh: freshCount,
      stale: staleCount,
      unknown: unknownCount,
      freshPct: pct(freshCount, signals.length),
    },
  }
}

function buildSourcesSection(sources) {
  const byTier = tally(sources, 'sourceTier')
  const byType = tally(sources, 'sourceType')
  const primaryCount = sources.filter((s) => s.primary).length
  const tier1Or2 = sources.filter((s) => s.sourceTier === 1 || s.sourceTier === 2).length

  return {
    total: sources.length,
    byTier,
    byType,
    primaryCount,
    tier1Or2Count: tier1Or2,
    tier1Or2Pct: pct(tier1Or2, sources.length),
  }
}

function buildNewsSection(news) {
  // news.json is a rolling window — older items are rotated out by update:news.
  // Reporting "last 30 days" against the live file is misleading. Instead, we
  // report the actual span of the current window and the daily rate within it.
  const byAuthority = {}
  let linkedToSignal = 0
  let minTs = Infinity
  let maxTs = -Infinity
  for (const item of news) {
    const ts = Number(item.timestamp) || new Date(item.pubDate).getTime()
    if (Number.isFinite(ts)) {
      if (ts < minTs) minTs = ts
      if (ts > maxTs) maxTs = ts
    }
    if (item.authority) byAuthority[item.authority] = (byAuthority[item.authority] || 0) + 1
    if (Array.isArray(item.signalIds) && item.signalIds.length > 0) linkedToSignal += 1
  }
  const topAuthorities = Object.entries(byAuthority)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([authority, count]) => ({ authority, count }))

  const windowHours =
    Number.isFinite(minTs) && Number.isFinite(maxTs)
      ? Math.round(((maxTs - minTs) / (60 * 60 * 1000)) * 10) / 10
      : null
  const dailyRate = windowHours && windowHours > 0
    ? Math.round((news.length / (windowHours / 24)) * 10) / 10
    : null

  return {
    total: news.length,
    windowStart: Number.isFinite(minTs) ? new Date(minTs).toISOString() : null,
    windowEnd: Number.isFinite(maxTs) ? new Date(maxTs).toISOString() : null,
    windowHours,
    dailyRateWithinWindow: dailyRate,
    signalLinkedPct: pct(linkedToSignal, news.length),
    topAuthoritiesByVolume: topAuthorities,
    note: 'news.json is a rolling live window — for cumulative quarter-over-quarter news volume, use git log on src/data/news.json.',
  }
}

function buildTimelineSection(timeline) {
  if (!Array.isArray(timeline)) return { total: 0 }
  return {
    total: timeline.length,
    distinctSignals: new Set(timeline.map((entry) => entry.signalId).filter(Boolean)).size,
  }
}

function quarterLabel(date) {
  const q = Math.floor(date.getUTCMonth() / 3) + 1
  return `${date.getUTCFullYear()}-Q${q}`
}

function renderMarkdown(snapshot) {
  const { generatedAt, quarter, signals, sources, news, timeline } = snapshot
  const lines = []
  lines.push(`# Dashboard Impact Baseline — ${quarter}`)
  lines.push('')
  lines.push(`_Generated: ${generatedAt}_`)
  lines.push('')
  lines.push(
    'Artifact-based snapshot of what the EMERGENZ biosecurity-intel-dashboard publishes ' +
      'at this moment. Pair with the Vercel server-side request-log export ' +
      '(see `docs/IMPACT-REPORTING.md`) for a complete quarterly impact report. ' +
      'This dashboard does **not** use client-side analytics — by design and by ' +
      'public commitment in the About / Privacy section.',
  )
  lines.push('')

  lines.push('## Signals tracked')
  lines.push('')
  lines.push(`- **Total signals:** ${signals.total}`)
  lines.push(`- **Distinct geographies covered:** ${signals.distinctGeographyEntries}`)
  lines.push(`- **Total map markers:** ${signals.totalMapMarkers}`)
  lines.push(`- **Total curated detail sections:** ${signals.totalDetailSections}`)
  lines.push(
    `- **Primary-source attribution:** ${signals.primarySourceCoveragePct}% of signals cite a registered primary source`,
  )
  lines.push(
    `- **Freshness (168h review cadence):** ${signals.freshness.fresh} fresh / ${signals.freshness.stale} stale / ${signals.freshness.unknown} unknown — ${signals.freshness.freshPct}% within review window`,
  )
  lines.push('')
  lines.push('### By category')
  for (const [key, count] of Object.entries(signals.byCategory).sort((a, b) => b[1] - a[1])) {
    const label = SIGNAL_CATEGORY_LABELS[key] || key
    lines.push(`- ${label}: ${count}`)
  }
  lines.push('')
  lines.push('### By severity')
  for (const [key, count] of Object.entries(signals.bySeverity).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${key}: ${count}`)
  }
  lines.push('')

  lines.push('## Sources registered')
  lines.push('')
  lines.push(`- **Total registered sources:** ${sources.total}`)
  lines.push(`- **Tier 1 + Tier 2 (official / peer-reviewed):** ${sources.tier1Or2Count} (${sources.tier1Or2Pct}%)`)
  lines.push(`- **Sources flagged as primary:** ${sources.primaryCount}`)
  lines.push('')
  lines.push('### By tier')
  for (const [tier, count] of Object.entries(sources.byTier).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const label = SOURCE_TIER_LABELS[tier] || `Tier ${tier}`
    lines.push(`- ${label}: ${count}`)
  }
  lines.push('')

  lines.push('## News aggregation (live window)')
  lines.push('')
  lines.push(`- **Items currently in live window:** ${news.total}`)
  if (news.windowStart && news.windowEnd) {
    lines.push(`- **Window span:** ${news.windowStart} → ${news.windowEnd} (${news.windowHours}h)`)
    if (news.dailyRateWithinWindow != null) {
      lines.push(`- **Ingest rate within window:** ${news.dailyRateWithinWindow} items / day`)
    }
  }
  lines.push(`- **Items linked to a tracked signal:** ${news.signalLinkedPct}%`)
  lines.push('')
  lines.push(
    `_${news.note} Cumulative quarter-over-quarter counts are not derivable from this snapshot alone._`,
  )
  lines.push('')
  lines.push('### Top 10 source authorities in current window')
  for (const { authority, count } of news.topAuthoritiesByVolume) {
    lines.push(`- ${authority}: ${count}`)
  }
  lines.push('')

  if (timeline) {
    lines.push('## Signal timeline')
    lines.push('')
    lines.push(`- **Timeline entries:** ${timeline.total}`)
    lines.push(`- **Distinct signals with timeline:** ${timeline.distinctSignals}`)
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push(
    '**Pair with:** Vercel project Observability → request logs (date-filtered for the ' +
      'reporting quarter). Together these give artifact coverage + reach without violating the ' +
      'dashboard\'s no-client-analytics commitment.',
  )
  lines.push('')

  return lines.join('\n')
}

function main() {
  const signals = readJson('signals.json')
  const sources = readJson('signal-sources.json')
  const news = readJson('news.json')
  let timeline = null
  try {
    timeline = readJson('signal-timeline.json')
  } catch {
    // Optional file — older deployments may not have it.
  }

  const snapshot = {
    generatedAt: NOW.toISOString(),
    quarter: quarterLabel(NOW),
    signals: buildSignalsSection(signals),
    sources: buildSourcesSection(sources),
    news: buildNewsSection(news),
    timeline: timeline ? buildTimelineSection(timeline) : null,
  }

  writeFileSync(JSON_OUTPUT, JSON.stringify(snapshot, null, 2))
  writeFileSync(MD_OUTPUT, renderMarkdown(snapshot))
  console.log(`[audit-impact-baseline] wrote ${JSON_OUTPUT} and ${MD_OUTPUT}`)
  console.log(
    `  signals=${snapshot.signals.total} · sources=${snapshot.sources.total} (${snapshot.sources.tier1Or2Pct}% Tier1/2) · news=${snapshot.news.total} in ${snapshot.news.windowHours ?? '?'}h window`,
  )
}

main()
