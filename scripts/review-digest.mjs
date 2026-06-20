#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * EMERGENZ Biosecurity Intel Dashboard — human-review digest
 *
 * READ-ONLY. This script consolidates every recurring condition that needs a
 * HUMAN (not the autonomous pipeline) to act, and emits a single prioritized,
 * actionable digest so the dashboard can run unattended and only pull a person
 * in when review/intervention is genuinely due.
 *
 * It NEVER writes curated data. Its only output is the result artifact
 * (review-digest-result.json). It must not touch signals.json,
 * signal-sources.json, signal-timeline.json, public/status.json, or any other
 * curated/structured field — those are humans-only per CONTENT-STANDARDS §3.4.
 * Bumping a freshness timestamp here would fabricate a human-review attestation.
 *
 * It makes NO network calls. Network-dependent gates (source reachability,
 * source drift, RSS feeds, weval) are owned by their own workflows; this script
 * only folds in their last result artifact when present, as a status pointer.
 *
 * Classification:
 *   NEEDS-HUMAN       — a review gate has tripped (or will trip on the next
 *                       run); a specific human action is required now.
 *   AUTONOMOUS-WATCH  — within policy but approaching a threshold; pre-warning
 *                       so a future red-X never arrives unannounced.
 *
 * Exit code: 0 by default (report-only — the Production Status Monitor already
 * provides the hard red-X enforcement on the deployed contract). Set
 * REVIEW_DIGEST_STRICT=1 to exit 1 when any NEEDS-HUMAN item is present (useful
 * as a local pre-commit gate).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const DATA_DIR = process.env.REVIEW_DIGEST_DATA_DIR || 'src/data'
const OUTPUT_PATH = process.env.REVIEW_DIGEST_OUTPUT || 'review-digest-result.json'
const STRICT = process.env.REVIEW_DIGEST_STRICT === '1'

// Thresholds mirror the gates that already exist elsewhere so the digest never
// disagrees with the system it summarizes:
//   generate-status.mjs   → MAX_SIGNAL_STALE_HOURS (336h)
//   validate-data.mjs     → TRIAGE_STALE_DAYS (365d), hard CI failure
//   audit-official-sources→ MAX_SOURCE_VERIFIED_AGE_DAYS (30d)
const MAX_SIGNAL_STALE_HOURS = Number.parseInt(process.env.MAX_SIGNAL_STALE_HOURS || '336', 10)
const SIGNAL_WATCH_HOURS = Number.parseInt(process.env.REVIEW_DIGEST_SIGNAL_WATCH_HOURS || '240', 10)
const TRIAGE_STALE_DAYS = 365
const TRIAGE_WATCH_DAYS = 300
const MAX_SOURCE_VERIFIED_AGE_DAYS = Number.parseInt(process.env.MAX_SOURCE_VERIFIED_AGE_DAYS || '30', 10)
const SOURCE_WATCH_DAYS = 21
const DETAIL_SECTION_STALE_DAYS = 365

const SEVERITY_RANK = { action: 3, concern: 2, watch: 1, info: 0 }

const now = Date.now()
const needsHuman = []
const watch = []

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function readJsonOptional(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function ageHours(iso) {
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? (now - t) / 36e5 : null
}

function ageDays(iso) {
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? (now - t) / 864e5 : null
}

function push(item) {
  if (item.classification === 'NEEDS-HUMAN') needsHuman.push(item)
  else watch.push(item)
}

// ── G1: per-signal lastChecked staleness ───────────────────────────────────
// A signal whose lastChecked exceeds 336h flips public status.json to
// "degraded" (generate-status.mjs). lastChecked is the human's signed
// attestation that the signal was re-verified against its primary source.
function checkSignalFreshness(signals, sourcesById) {
  for (const signal of signals) {
    const hrs = ageHours(signal.lastChecked)
    if (hrs === null) continue
    const ps = sourcesById.get(signal.primarySourceId)
    const primarySource = ps ? { id: ps.id, url: ps.url } : null
    const severity =
      signal.severity === 'action' ? 'action' : signal.severity === 'concern' ? 'concern' : 'watch'

    if (hrs > MAX_SIGNAL_STALE_HOURS) {
      push({
        id: `signal-stale--${signal.id}`,
        classification: 'NEEDS-HUMAN',
        severity,
        category: 'structured-data-freshness',
        title: `Signal ${signal.id} not reviewed in ${hrs.toFixed(0)}h (>${MAX_SIGNAL_STALE_HOURS}h)`,
        why: 'Per-signal lastChecked exceeds MAX_SIGNAL_STALE_HOURS, which sets public status.json to "degraded". lastChecked is a humans-only field (CONTENT-STANDARDS §3.4) attesting the signal was verified against its primary source.',
        governingStandard: 'CONTENT-STANDARDS §3.4; RUNBOOK §2.4',
        threshold: { name: 'MAX_SIGNAL_STALE_HOURS', value: MAX_SIGNAL_STALE_HOURS, unit: 'hours' },
        observed: { ageHours: Number(hrs.toFixed(1)), lastChecked: signal.lastChecked, signalSeverity: signal.severity },
        recommendedAction: {
          summary: 'Re-verify this signal against its primary source, then bump lastChecked (and lastUpdated only if a fact changed).',
          file: `${DATA_DIR}/signals.json`,
          field: `signals[id=${signal.id}].lastChecked`,
          command: 'edit lastChecked to today (ISO); commit + push — Status Refresh regenerates status.json on push to signals.json.',
          primarySource,
        },
      })
    } else if (hrs > SIGNAL_WATCH_HOURS) {
      push({
        id: `signal-aging--${signal.id}`,
        classification: 'AUTONOMOUS-WATCH',
        severity: 'watch',
        category: 'structured-data-freshness',
        title: `Signal ${signal.id} review due soon (${hrs.toFixed(0)}h of ${MAX_SIGNAL_STALE_HOURS}h)`,
        why: 'Approaching the 336h staleness threshold. Reviewing now prevents a future "degraded" status.',
        governingStandard: 'CONTENT-STANDARDS §3.4',
        threshold: { name: 'MAX_SIGNAL_STALE_HOURS', value: MAX_SIGNAL_STALE_HOURS, unit: 'hours' },
        observed: { ageHours: Number(hrs.toFixed(1)), lastChecked: signal.lastChecked },
        recommendedAction: {
          summary: 'Re-verify against the primary source and bump lastChecked within the next ~2 days.',
          file: `${DATA_DIR}/signals.json`,
          field: `signals[id=${signal.id}].lastChecked`,
          command: 'edit lastChecked to today (ISO); commit + push.',
          primarySource,
        },
      })
    }
  }
}

// ── G4: triageCard.lastReviewed staleness (CI BLOCKER at 365d) ──────────────
function checkTriageCards(signals) {
  for (const signal of signals) {
    const tc = signal.triageCard
    if (!tc?.lastReviewed) continue
    const days = ageDays(tc.lastReviewed)
    if (days === null) continue

    if (days > TRIAGE_STALE_DAYS) {
      push({
        id: `triage-stale--${signal.id}`,
        classification: 'NEEDS-HUMAN',
        severity: 'action',
        category: 'clinical-content-freshness',
        title: `Triage card for ${signal.id} is ${days.toFixed(0)}d old (>${TRIAGE_STALE_DAYS}d — CI BLOCKER)`,
        why: 'validate-data.mjs hard-fails clinical triage content older than 365 days (CONTENT-STANDARDS §7.1). The next CI run or data commit will fail until this is re-verified.',
        governingStandard: 'CONTENT-STANDARDS §7.1; validate-data.mjs',
        threshold: { name: 'TRIAGE_STALE_DAYS', value: TRIAGE_STALE_DAYS, unit: 'days' },
        observed: { ageDays: Number(days.toFixed(0)), lastReviewed: tc.lastReviewed },
        recommendedAction: {
          summary: 'Re-verify the triage card against its cited authority, then bump triageCard.lastReviewed. Do not paraphrase clinical text here — open the source.',
          file: `${DATA_DIR}/signals.json`,
          field: `signals[id=${signal.id}].triageCard.lastReviewed`,
          command: 'edit triageCard.lastReviewed to today (ISO); commit + push.',
          primarySource: tc.sourceUrl ? { id: tc.sourceAuthority || null, url: tc.sourceUrl } : null,
        },
      })
    } else if (days > TRIAGE_WATCH_DAYS) {
      push({
        id: `triage-aging--${signal.id}`,
        classification: 'AUTONOMOUS-WATCH',
        severity: 'watch',
        category: 'clinical-content-freshness',
        title: `Triage card for ${signal.id} review due (${days.toFixed(0)}d of ${TRIAGE_STALE_DAYS}d)`,
        why: 'Clinical triage content approaching the 365-day re-verification deadline that hard-fails CI.',
        governingStandard: 'CONTENT-STANDARDS §7.1',
        threshold: { name: 'TRIAGE_STALE_DAYS', value: TRIAGE_STALE_DAYS, unit: 'days' },
        observed: { ageDays: Number(days.toFixed(0)), lastReviewed: tc.lastReviewed },
        recommendedAction: {
          summary: 'Schedule clinical re-verification before the 365-day deadline.',
          file: `${DATA_DIR}/signals.json`,
          field: `signals[id=${signal.id}].triageCard.lastReviewed`,
          command: 'edit triageCard.lastReviewed to today (ISO) after re-verifying; commit + push.',
          primarySource: tc.sourceUrl ? { id: tc.sourceAuthority || null, url: tc.sourceUrl } : null,
        },
      })
    }
  }
}

// ── G6: Tier 1/2 source lastVerified staleness (offline portion of the
// official-source audit; reachability/drift stay in their own workflows) ─────
function checkSourceVerification(sources) {
  for (const source of sources) {
    if (source.sourceTier !== 1 && source.sourceTier !== 2) continue
    const days = ageDays(source.lastVerified)
    if (days === null) {
      push({
        id: `source-malformed--${source.id}`,
        classification: 'NEEDS-HUMAN',
        severity: 'concern',
        category: 'source-registry-freshness',
        title: `Source ${source.id} has missing/invalid lastVerified`,
        why: 'A Tier 1/2 source record has an unparseable lastVerified date. Source attribution integrity depends on a valid verification timestamp.',
        governingStandard: 'CONTENT-STANDARDS §2.2',
        threshold: { name: 'MAX_SOURCE_VERIFIED_AGE_DAYS', value: MAX_SOURCE_VERIFIED_AGE_DAYS, unit: 'days' },
        observed: { lastVerified: source.lastVerified ?? null },
        recommendedAction: {
          summary: 'Fix the lastVerified ISO date after confirming the source.',
          file: `${DATA_DIR}/signal-sources.json`,
          field: `signal-sources[id=${source.id}].lastVerified`,
          command: 'set a valid ISO date; commit + push.',
          primarySource: { id: source.id, url: source.url },
        },
      })
      continue
    }

    if (days > MAX_SOURCE_VERIFIED_AGE_DAYS) {
      push({
        id: `source-stale--${source.id}`,
        classification: 'NEEDS-HUMAN',
        severity: 'concern',
        category: 'source-registry-freshness',
        title: `Source ${source.id} not verified in ${days.toFixed(0)}d (>${MAX_SOURCE_VERIFIED_AGE_DAYS}d)`,
        why: 'A Tier 1/2 source has not been human-verified within the 30-day window (CONTENT-STANDARDS §2.2). The official-source audit flags this too, but here it is paired with the action to clear it.',
        governingStandard: 'CONTENT-STANDARDS §2.2; RUNBOOK §6.2',
        threshold: { name: 'MAX_SOURCE_VERIFIED_AGE_DAYS', value: MAX_SOURCE_VERIFIED_AGE_DAYS, unit: 'days' },
        observed: { ageDays: Number(days.toFixed(0)), lastVerified: source.lastVerified, tier: source.sourceTier },
        recommendedAction: {
          summary: 'Open the source URL, confirm it still supports what the dashboard claims, then bump lastVerified.',
          file: `${DATA_DIR}/signal-sources.json`,
          field: `signal-sources[id=${source.id}].lastVerified`,
          command: 'set lastVerified to today (ISO); commit + push.',
          primarySource: { id: source.id, url: source.url },
        },
      })
    } else if (days > SOURCE_WATCH_DAYS) {
      push({
        id: `source-aging--${source.id}`,
        classification: 'AUTONOMOUS-WATCH',
        severity: 'watch',
        category: 'source-registry-freshness',
        title: `Source ${source.id} verification due soon (${days.toFixed(0)}d of ${MAX_SOURCE_VERIFIED_AGE_DAYS}d)`,
        why: 'Tier 1/2 source approaching the 30-day re-verification window.',
        governingStandard: 'CONTENT-STANDARDS §2.2',
        threshold: { name: 'MAX_SOURCE_VERIFIED_AGE_DAYS', value: MAX_SOURCE_VERIFIED_AGE_DAYS, unit: 'days' },
        observed: { ageDays: Number(days.toFixed(0)), lastVerified: source.lastVerified, tier: source.sourceTier },
        recommendedAction: {
          summary: 'Re-verify the source within the next ~week and bump lastVerified.',
          file: `${DATA_DIR}/signal-sources.json`,
          field: `signal-sources[id=${source.id}].lastVerified`,
          command: 'set lastVerified to today (ISO); commit + push.',
          primarySource: { id: source.id, url: source.url },
        },
      })
    }
  }
}

// ── G20: detail-section review drift (advisory aggregate, not validator-gated) ─
function checkDetailSectionDrift(signals) {
  const stale = []
  for (const signal of signals) {
    for (const section of signal.detailSections ?? []) {
      const stamp = section.lastReviewed || section.updatedAt
      const days = ageDays(stamp)
      if (days !== null && days > DETAIL_SECTION_STALE_DAYS) {
        stale.push(`${signal.id}/${section.id} (${days.toFixed(0)}d)`)
      }
    }
  }
  if (stale.length > 0) {
    push({
      id: 'detail-sections-aging',
      classification: 'AUTONOMOUS-WATCH',
      severity: 'watch',
      category: 'content-drift',
      title: `${stale.length} detail section(s) not reviewed in >${DETAIL_SECTION_STALE_DAYS}d`,
      why: 'Detail sections are not age-gated by the validator (only triage cards are), so they can silently drift. Surfaced as a watch item so long-lived content gets periodic eyes.',
      governingStandard: 'CONTENT-STANDARDS §7.1 (advisory)',
      threshold: { name: 'DETAIL_SECTION_STALE_DAYS', value: DETAIL_SECTION_STALE_DAYS, unit: 'days' },
      observed: { count: stale.length, sections: stale.slice(0, 25) },
      recommendedAction: {
        summary: 'Spot-review the oldest detail sections against their sources and bump lastReviewed/updatedAt.',
        file: `${DATA_DIR}/signals.json`,
        field: 'signals[].detailSections[].lastReviewed',
        command: 'after review, set lastReviewed to today (ISO); commit + push.',
        primarySource: null,
      },
    })
  }
}

// ── G19: scheduled code removal/deprecation markers that are now due ─────────
// Convention in this repo: a searchable token like
// FOO_REMOVE_AFTER_<date> / FOO_DEPRECATE_AFTER_<date> marks live code/config
// for scheduled removal. When the date passes, a human must complete the
// removal checklist. We scan live code/config dirs only — not append-only logs
// (HANDOFF.md / RUNBOOK.md retain historical marker text forever and would
// produce permanent false positives).
const MARKER_RE = /[A-Z0-9_]*_(?:REMOVE|DEPRECATE)_AFTER_(\d{4})-(\d{2})-(\d{2})/g
const SCAN_DIRS = ['src', 'scripts', '.github', 'docs']
const SCAN_SKIP_FILES = new Set(['HANDOFF.md', 'RUNBOOK.md'])
const SCAN_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.md', '.yml', '.yaml', '.json', '.html', '.css',
])

function scanFilesForMarkers() {
  const due = new Map() // markerToken → { date, files:Set }
  const walk = (dir) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
        walk(full)
        continue
      }
      if (SCAN_SKIP_FILES.has(entry.name)) continue
      const dot = entry.name.lastIndexOf('.')
      const ext = dot >= 0 ? entry.name.slice(dot) : ''
      if (!SCAN_EXT.has(ext)) continue
      let text
      try {
        if (statSync(full).size > 2_000_000) continue
        text = readFileSync(full, 'utf8')
      } catch {
        continue
      }
      let m
      MARKER_RE.lastIndex = 0
      while ((m = MARKER_RE.exec(text)) !== null) {
        const token = m[0]
        const date = `${m[1]}-${m[2]}-${m[3]}`
        if (new Date(date).getTime() > now) continue // not yet due
        if (!due.has(token)) due.set(token, { date, files: new Set() })
        due.get(token).files.add(full.replace(/\\/g, '/'))
      }
    }
  }
  for (const dir of SCAN_DIRS) walk(dir)
  return due
}

function checkRemovalMarkers() {
  const due = scanFilesForMarkers()
  for (const [token, { date, files }] of due) {
    push({
      id: `removal-marker--${token}`,
      classification: 'NEEDS-HUMAN',
      severity: 'concern',
      category: 'scheduled-code-removal',
      title: `Removal/deprecation marker ${token} is past due (${date})`,
      why: 'A scheduled code/config removal date has passed. The marked surface should be removed or its decision revisited; leaving dead time-boxed surfaces live is scope/UX debt.',
      governingStandard: 'Repo convention (searchable _REMOVE_AFTER_/_DEPRECATE_AFTER_ markers); see HANDOFF.md for the checklist.',
      threshold: { name: 'markerDate', value: date, unit: 'date' },
      observed: { dueDate: date, files: [...files] },
      recommendedAction: {
        summary: 'Complete the removal/deprecation checklist for this marker, or update the marker date if the decision changed.',
        file: [...files][0],
        field: token,
        command: `grep -r "${token}" . to find every reference, then follow the checklist.`,
        primarySource: null,
      },
    })
  }
}

// ── G21: host-city biosurveillance observation freshness ────────────────────
// Mirrors src/utils/hostCityBioSignals.ts. A host city's public status is
// DERIVED from publicDisplayAllowed observations; during the FIFA window stale
// "elevated" data is the highest-consequence failure (CONTENT-STANDARDS §4.2).
// This surfaces (a) cities whose freshest public observation is stale and
// (b) observations still awaiting publish review, so neither rots unseen.
// Cities with zero public observations are the honest "Not monitored" default
// and are intentionally NOT flagged.
const HOST_CITY_PATH = `${DATA_DIR}/host-city-biosurveillance.json`
const WC_EVENT_START = '2026-06-11'
const WC_EVENT_END = '2026-07-19'
const HOST_CITY_STALE_DAYS_EVENT = 7
const HOST_CITY_STALE_DAYS_OFF = 30
const HOST_CITY_WATCH_FRACTION = 0.7 // pre-warn at 70% of the stale threshold

function withinEventWindow(ms) {
  return ms >= new Date(WC_EVENT_START).getTime() && ms <= new Date(`${WC_EVENT_END}T23:59:59Z`).getTime()
}

function checkHostCityFreshness() {
  const doc = readJsonOptional(HOST_CITY_PATH)
  if (!doc || !Array.isArray(doc.hostCities)) return // layer absent or empty — nothing to age
  const inEvent = withinEventWindow(now)
  const staleDays = inEvent ? HOST_CITY_STALE_DAYS_EVENT : HOST_CITY_STALE_DAYS_OFF
  const watchDays = staleDays * HOST_CITY_WATCH_FRACTION

  for (const city of doc.hostCities) {
    const observations = Array.isArray(city.observations) ? city.observations : []
    const pub = observations.filter((o) => o.publicDisplayAllowed === true)
    const pending = observations.filter((o) => o.publicDisplayAllowed === false)

    // Staged observations should not sit forgotten behind the review gate.
    if (pending.length > 0) {
      push({
        id: `host-city-pending-review--${city.id}`,
        classification: 'AUTONOMOUS-WATCH',
        severity: 'watch',
        category: 'host-city-biosurveillance',
        title: `${city.displayName}: ${pending.length} host-city observation(s) awaiting publish review`,
        why: 'Observations with publicDisplayAllowed:false are excluded from the public surface until a human clears them (CONTENT-STANDARDS §3.4). Surfaced so staged signals are not forgotten.',
        governingStandard: 'CONTENT-STANDARDS §3.4 (review-gated publishing)',
        threshold: { name: 'publicDisplayAllowed', value: false, unit: 'flag' },
        observed: { pendingCount: pending.length },
        recommendedAction: {
          summary: 'Verify each staged observation against its source, then set publicDisplayAllowed:true (or remove it).',
          file: HOST_CITY_PATH,
          field: `hostCities[id=${city.id}].observations[].publicDisplayAllowed`,
          command: 'after verifying, set publicDisplayAllowed:true; commit + push.',
          primarySource: null,
        },
      })
    }

    if (pub.length === 0) continue // no public signal = honest "Not monitored"

    let newest = null
    for (const o of pub) {
      const d = o.reportDate || o.sampleDate
      const t = d ? new Date(d).getTime() : NaN
      if (Number.isFinite(t) && (newest === null || t > newest)) newest = t
    }
    if (newest === null) continue
    const days = (now - newest) / 864e5

    if (days > staleDays) {
      push({
        id: `host-city-stale--${city.id}`,
        classification: 'NEEDS-HUMAN',
        severity: 'concern',
        category: 'host-city-biosurveillance',
        title: `${city.displayName}: newest public biosignal is ${days.toFixed(0)}d old (>${staleDays}d${inEvent ? ', event window' : ''})`,
        why: 'A host city publishes source-backed biosignals but its freshest public observation is stale. The UI derives sourceFreshnessStatus="stale" from this; stale "elevated" data during the event is a patient-safety-adjacent failure (CONTENT-STANDARDS §4.2).',
        governingStandard: 'CONTENT-STANDARDS §4.2; src/utils/hostCityBioSignals.ts',
        threshold: { name: 'hostCityStaleDays', value: staleDays, unit: 'days' },
        observed: { ageDays: Number(days.toFixed(0)), publicObservations: pub.length, eventWindow: inEvent },
        recommendedAction: {
          summary: 'Re-verify the city observations against their sources; refresh reportDate/lastVerified, mark the observation status stale, or remove it.',
          file: HOST_CITY_PATH,
          field: `hostCities[id=${city.id}].observations[]`,
          command: 'update reportDate/lastVerified after re-verifying; commit + push.',
          primarySource: null,
        },
      })
    } else if (days > watchDays) {
      push({
        id: `host-city-aging--${city.id}`,
        classification: 'AUTONOMOUS-WATCH',
        severity: 'watch',
        category: 'host-city-biosurveillance',
        title: `${city.displayName}: public biosignal aging (${days.toFixed(0)}d of ${staleDays}d)`,
        why: 'Approaching the host-city staleness threshold; refreshing now keeps the public freshness badge "current".',
        governingStandard: 'src/utils/hostCityBioSignals.ts',
        threshold: { name: 'hostCityStaleDays', value: staleDays, unit: 'days' },
        observed: { ageDays: Number(days.toFixed(0)), publicObservations: pub.length, eventWindow: inEvent },
        recommendedAction: {
          summary: 'Re-verify and refresh the city observation dates within the next few days.',
          file: HOST_CITY_PATH,
          field: `hostCities[id=${city.id}].observations[]`,
          command: 'update reportDate/lastVerified after re-verifying; commit + push.',
          primarySource: null,
        },
      })
    }
  }
}

// ── Monitors summary: fold in present *-result.json artifacts as pointers ────
// Read-only ok/age pointers only — each monitor owns its own detailed issue, so
// we do not restate their findings here.
const MONITOR_ARTIFACTS = [
  { id: 'production-status-monitor', path: 'status-monitor-result.json', issueLabel: 'status-monitor' },
  { id: 'official-source-audit', path: 'official-source-audit-result.json', issueLabel: 'source-audit' },
  { id: 'official-source-drift', path: 'official-source-drift-result.json', issueLabel: 'source-drift' },
  { id: 'news-pipeline', path: 'update-news-result.json', issueLabel: 'news-pipeline' },
  { id: 'weval-baseline', path: 'weval-run-result.json', issueLabel: 'weval-pipeline' },
  { id: 'tracking-report-capture', path: 'ingest-tracking-report-result.json', issueLabel: 'tracking-report' },
]

function collectMonitors() {
  const monitors = []
  for (const m of MONITOR_ARTIFACTS) {
    const data = readJsonOptional(m.path)
    if (!data) continue
    monitors.push({
      id: m.id,
      ok: data.ok !== false,
      checkedAt: data.checkedAt ?? null,
      issueLabel: m.issueLabel,
    })
  }
  return monitors
}

function severityIcon(sev) {
  return { action: '[action]', concern: '[concern]', watch: '[watch]', info: '[info]' }[sev] || '[info]'
}

function printGroup(title, items) {
  if (items.length === 0) return
  console.log(`\n${title} (${items.length})`)
  const byCategory = new Map()
  for (const item of items) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, [])
    byCategory.get(item.category).push(item)
  }
  for (const [category, group] of byCategory) {
    console.log(`  ${category} (${group.length})`)
    group.sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0))
    for (const item of group) {
      console.log(`    ${severityIcon(item.severity)} ${item.title}`)
      console.log(`      → ${item.recommendedAction.summary}`)
      console.log(`      ↳ ${item.recommendedAction.file}${item.recommendedAction.field ? ` · ${item.recommendedAction.field}` : ''}`)
      if (item.recommendedAction.primarySource?.url) {
        console.log(`      ↳ source: ${item.recommendedAction.primarySource.url}`)
      }
    }
  }
}

function main() {
  const signals = readJson(`${DATA_DIR}/signals.json`)
  const sources = readJson(`${DATA_DIR}/signal-sources.json`)
  if (!Array.isArray(signals) || signals.length === 0) throw new Error('signals.json must be a non-empty array')
  if (!Array.isArray(sources) || sources.length === 0) throw new Error('signal-sources.json must be a non-empty array')

  const sourcesById = new Map(sources.map((s) => [s.id, s]))

  checkSignalFreshness(signals, sourcesById)
  checkTriageCards(signals)
  checkSourceVerification(sources)
  checkDetailSectionDrift(signals)
  checkHostCityFreshness()
  checkRemovalMarkers()

  const sortBySeverity = (a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0)
  needsHuman.sort(sortBySeverity)
  watch.sort(sortBySeverity)

  const monitors = collectMonitors()
  const checkedAt = new Date().toISOString()

  const result = {
    ok: needsHuman.length === 0,
    checkedAt,
    thresholds: {
      maxSignalStaleHours: MAX_SIGNAL_STALE_HOURS,
      triageStaleDays: TRIAGE_STALE_DAYS,
      maxSourceVerifiedAgeDays: MAX_SOURCE_VERIFIED_AGE_DAYS,
      detailSectionStaleDays: DETAIL_SECTION_STALE_DAYS,
    },
    counts: {
      needsHuman: needsHuman.length,
      watch: watch.length,
      signals: signals.length,
      sources: sources.length,
    },
    needsHuman,
    watch,
    monitors,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n')

  console.log(`[review-digest] ${checkedAt}`)
  console.log(`  NEEDS-HUMAN: ${needsHuman.length}   AUTONOMOUS-WATCH: ${watch.length}`)
  printGroup('NEEDS-HUMAN', needsHuman)
  printGroup('AUTONOMOUS-WATCH', watch)
  if (monitors.length > 0) {
    console.log('\nautonomous monitors (last run):')
    for (const m of monitors) {
      console.log(`  ${m.ok ? 'OK ' : 'XX '} ${m.id}${m.ok ? '' : ` — see the "${m.issueLabel}" issue`}`)
    }
  }

  if (needsHuman.length === 0) {
    console.log('\n[review-digest] OK — no human action due. Autonomy healthy.')
  } else {
    console.log(`\n[review-digest] ${needsHuman.length} item(s) need human attention. Report-only (exit 0)${STRICT ? ' overridden by REVIEW_DIGEST_STRICT=1' : '; set REVIEW_DIGEST_STRICT=1 to fail'}.`)
    if (STRICT) process.exitCode = 1
  }
}

try {
  main()
} catch (error) {
  console.error('[review-digest] FAILED:', error.message)
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({ ok: false, checkedAt: new Date().toISOString(), error: error.message }, null, 2) + '\n',
  )
  process.exitCode = 1
}
