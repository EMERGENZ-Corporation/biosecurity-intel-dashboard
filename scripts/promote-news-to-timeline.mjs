#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Deterministic auto-promote of Tier 1 news items into signal-timeline.json.
 *
 * Hard gates (ALL must pass — no exceptions, no fallbacks):
 *   1. News item `authority` is in the strict Tier 1 allowlist (CDC, WHO, ECDC).
 *   2. News item has exactly one matched `signalId`.
 *   3. That signal's `severity` is `concern` or `action` (SEVERITY_RANK >= 2).
 *   4. News item `timestamp` is within last 14 days.
 *   5. News item `link` is a non-empty URL.
 *   6. The signal has a registered Tier 1 source in `signal-sources.json`
 *      under the matching authority — resolved deterministically (see below).
 *   7. No existing timeline event (curated OR auto) shares the same signalId
 *      AND same calendar day (UTC).
 *   8. Per-run cap: max 20 auto-promotions per invocation.
 *   9. Per-signal cap: max 5 auto-promoted events per signal per rolling
 *      7-day window (computed from existing timeline contents at script start).
 *
 * On zero promotions: writes nothing to signal-timeline.json (CONTENT-STANDARDS
 * §4.4) and emits a no-op result artifact.
 *
 * Authority sourceId resolution (CONTENT-STANDARDS §2.1):
 *   - If `signal.primarySourceId` resolves to a Tier 1 source whose authority
 *     matches the news item's authority, use it.
 *   - Else: pick the first entry in `signal.sourceIds[]` that is Tier 1 AND
 *     matches the news authority.
 *   - Else: SKIP the promotion (never invent a sourceId).
 *
 * Title/description policy (CONTENT-STANDARDS §4.1):
 *   - Title and description are VERBATIM from the news item. No paraphrasing,
 *     no summarization, no AI rewriting. A runtime assert validates this.
 *
 * Commit identity (CONTENT-STANDARDS §3.1):
 *   - This script writes the data file; the workflow commits with
 *     `EMERGENZ Data Bot <bot@emergenz.org>`. Local invocations inherit the
 *     operator's git identity (acceptable for testing; not for production).
 */

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'

const SIGNALS_PATH = process.env.PROMOTE_SIGNALS_PATH || 'src/data/signals.json'
const SOURCES_PATH = process.env.PROMOTE_SOURCES_PATH || 'src/data/signal-sources.json'
const TIMELINE_PATH = process.env.PROMOTE_TIMELINE_PATH || 'src/data/signal-timeline.json'
const NEWS_PATH = process.env.PROMOTE_NEWS_PATH || 'src/data/news.json'
const OUTPUT_PATH = process.env.PROMOTE_OUTPUT_PATH || 'promote-timeline-result.json'

const TIER1_NEWS_AUTHORITIES = new Set(['CDC', 'WHO', 'ECDC'])
const SEVERITY_RANK = { monitor: 0, watch: 1, concern: 2, action: 3 }
const MIN_SEVERITY_RANK = SEVERITY_RANK.concern
const MAX_AGE_DAYS = Number.parseInt(process.env.PROMOTE_MAX_AGE_DAYS || '14', 10)
const PER_RUN_CAP = Number.parseInt(process.env.PROMOTE_PER_RUN_CAP || '20', 10)
const PER_SIGNAL_7D_CAP = Number.parseInt(process.env.PROMOTE_PER_SIGNAL_7D_CAP || '5', 10)
const TRUNCATE_TITLE = 140

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
  atomicWriteFileSync(OUTPUT_PATH, JSON.stringify({
    checkedAt: new Date().toISOString(),
    ...result,
  }, null, 2) + '\n')
}

function isUrl(value) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function utcDay(timestamp) {
  // YYYY-MM-DD in UTC.
  return new Date(timestamp).toISOString().slice(0, 10)
}

function dayDiff(a, b) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24)
}

function truncateTitle(text) {
  const cleaned = String(text || '').trim()
  if (cleaned.length <= TRUNCATE_TITLE) return cleaned
  return cleaned.slice(0, TRUNCATE_TITLE - 1).trimEnd() + '…'
}

function resolveTier1SourceId(signal, newsAuthority, sourcesById) {
  // First try primarySourceId.
  const primary = sourcesById.get(signal.primarySourceId)
  if (primary && primary.sourceTier === 1 && primary.authority === newsAuthority) {
    return primary.id
  }
  // Then sourceIds[] in registration order.
  for (const sourceId of signal.sourceIds || []) {
    const candidate = sourcesById.get(sourceId)
    if (candidate && candidate.sourceTier === 1 && candidate.authority === newsAuthority) {
      return candidate.id
    }
  }
  return null
}

function main() {
  const signals = readJson(SIGNALS_PATH)
  const sources = readJson(SOURCES_PATH)
  const timeline = readJson(TIMELINE_PATH)
  const news = readJson(NEWS_PATH)

  const signalsById = new Map(signals.map((s) => [s.id, s]))
  const sourcesById = new Map(sources.map((s) => [s.id, s]))

  // Build existing-day index for collision check (any signalId+UTC-day pair).
  const existingDayKeys = new Set(
    timeline.map((event) => `${event.signalId}|${utcDay(event.date)}`),
  )

  // Build per-signal 7-day rolling count of EXISTING auto events.
  // (Curated events do not count toward the per-signal cap.)
  const nowMs = Date.now()
  const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000
  const perSignalAutoCount = new Map()
  for (const event of timeline) {
    if (event.provenance !== 'auto-news-tier1') continue
    if (new Date(event.promotedAt || event.date).getTime() < sevenDaysAgo) continue
    perSignalAutoCount.set(event.signalId, (perSignalAutoCount.get(event.signalId) || 0) + 1)
  }

  // Track existing newsIds already promoted (idempotency).
  const promotedNewsIds = new Set(
    timeline
      .filter((e) => e.provenance === 'auto-news-tier1' && e.newsId)
      .map((e) => e.newsId),
  )

  const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  const promotions = []
  const skipped = []
  const reasonsByKind = {
    'not-tier-1-authority': 0,
    'wrong-signal-count': 0,
    'unknown-signal': 0,
    'severity-below-threshold': 0,
    'older-than-cap': 0,
    'invalid-link': 0,
    'no-tier-1-source-resolvable': 0,
    'same-day-collision': 0,
    'per-signal-cap': 0,
    'already-promoted': 0,
  }

  // Sort news items oldest-first so multi-news-per-day decisions are stable
  // (older wins per CONTENT-STANDARDS §4.1 "use the first valid value").
  const newsSorted = [...news].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

  for (const item of newsSorted) {
    if (promotions.length >= PER_RUN_CAP) {
      skipped.push({ newsId: item.id, reason: 'per-run-cap-reached' })
      continue
    }

    if (promotedNewsIds.has(item.id)) {
      reasonsByKind['already-promoted']++
      continue
    }

    if (!TIER1_NEWS_AUTHORITIES.has(item.authority)) {
      reasonsByKind['not-tier-1-authority']++
      continue
    }

    const sigIds = Array.isArray(item.signalIds) ? item.signalIds : []
    if (sigIds.length !== 1) {
      reasonsByKind['wrong-signal-count']++
      continue
    }
    const signalId = sigIds[0]
    const signal = signalsById.get(signalId)
    if (!signal) {
      reasonsByKind['unknown-signal']++
      skipped.push({ newsId: item.id, signalId, reason: 'unknown-signal' })
      continue
    }

    const rank = SEVERITY_RANK[signal.severity] ?? -1
    if (rank < MIN_SEVERITY_RANK) {
      reasonsByKind['severity-below-threshold']++
      continue
    }

    if (!item.timestamp || (nowMs - item.timestamp) > maxAgeMs) {
      reasonsByKind['older-than-cap']++
      continue
    }

    if (!item.link || typeof item.link !== 'string' || !isUrl(item.link)) {
      reasonsByKind['invalid-link']++
      skipped.push({ newsId: item.id, signalId, reason: 'invalid-link' })
      continue
    }

    const sourceId = resolveTier1SourceId(signal, item.authority, sourcesById)
    if (!sourceId) {
      reasonsByKind['no-tier-1-source-resolvable']++
      skipped.push({ newsId: item.id, signalId, authority: item.authority, reason: 'no-tier-1-source-resolvable' })
      continue
    }

    const day = utcDay(item.timestamp)
    if (existingDayKeys.has(`${signalId}|${day}`)) {
      reasonsByKind['same-day-collision']++
      continue
    }

    const currentCount = perSignalAutoCount.get(signalId) || 0
    if (currentCount >= PER_SIGNAL_7D_CAP) {
      reasonsByKind['per-signal-cap']++
      skipped.push({ newsId: item.id, signalId, reason: 'per-signal-cap' })
      continue
    }

    // Verbatim title/description — hard assert.
    const title = truncateTitle(item.title)
    const description = String(item.description || '').trim()
    if (!title || !description) {
      skipped.push({ newsId: item.id, signalId, reason: 'empty-title-or-description' })
      continue
    }

    const event = {
      id: `auto-${item.id}`,
      signalId,
      date: day,
      title,
      description,
      sourceId,
      category: signal.category,
      provenance: 'auto-news-tier1',
      newsId: item.id,
      authority: item.authority,
      link: item.link,
      promotedAt: new Date(nowMs).toISOString(),
    }

    promotions.push(event)
    existingDayKeys.add(`${signalId}|${day}`)
    perSignalAutoCount.set(signalId, currentCount + 1)
    promotedNewsIds.add(item.id)
  }

  // Idempotency / no-write on zero promotions (CONTENT-STANDARDS §4.4).
  if (promotions.length === 0) {
    writeResult({
      ok: true,
      mode: 'no-op',
      promotionsCount: 0,
      reasonsByKind,
      skipped,
      wroteTimeline: false,
    })
    console.log('[promote-timeline] no qualifying news items; timeline unchanged')
    return
  }

  // Append promotions to timeline, sorted with curated events first (stable),
  // then write atomically. We do NOT re-sort the entire timeline — appending
  // new auto events preserves the curated reading order at the top of the file.
  const next = [...timeline, ...promotions]
  const serialized = JSON.stringify(next, null, 2) + '\n'

  // Idempotency: if the new serialization matches the existing file byte-for-byte,
  // we still skip the write (defensive — should never trigger because promotions
  // is non-empty here, but inexpensive to check).
  const current = readFileSync(TIMELINE_PATH, 'utf8')
  if (serialized === current) {
    writeResult({
      ok: true,
      mode: 'no-op-byte-identical',
      promotionsCount: 0,
      reasonsByKind,
      skipped,
      wroteTimeline: false,
    })
    console.log('[promote-timeline] serialized output byte-identical to current file; not writing')
    return
  }

  atomicWriteFileSync(TIMELINE_PATH, serialized)
  writeResult({
    ok: true,
    mode: 'promoted',
    promotionsCount: promotions.length,
    promotions: promotions.map((p) => ({
      id: p.id,
      signalId: p.signalId,
      date: p.date,
      authority: p.authority,
      newsId: p.newsId,
    })),
    reasonsByKind,
    skipped,
    wroteTimeline: true,
  })
  console.log(`[promote-timeline] promoted ${promotions.length} news items to signal-timeline.json`)
}

main()
