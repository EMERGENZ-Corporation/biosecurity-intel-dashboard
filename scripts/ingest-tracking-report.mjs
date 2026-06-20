#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * EMERGENZ Biosecurity Intel Dashboard — Brown Pandemic Center Tracking Report
 * weekly capture (READ-ONLY review gate).
 *
 * WHAT THIS IS
 *   The Tracking Report (pandemics.sph.brown.edu/our-work/tracking-report) is a
 *   weekly newsletter that aggregates and contextualizes outbreak data. It is a
 *   TERTIARY aggregator, not a primary source. This script fetches the current
 *   issue every week, diffs it against the live signals, and surfaces — for a
 *   human — which signals look stale relative to the issue and whether the issue
 *   covers a topic the dashboard does not yet track.
 *
 * WHAT THIS IS *NOT*
 *   It NEVER writes curated data. It does not touch signals.json,
 *   signal-sources.json, signal-timeline.json, host-city-biosurveillance.json,
 *   status.json, or the API. Its only output is the result artifact
 *   (ingest-tracking-report-result.json, gitignored).
 *
 *   Unlike the PHAC/NWSS wastewater ingesters — which auto-WRITE because their
 *   source is a registered Tier 1/2 PRIMARY feed mapped verbatim — the Tracking
 *   Report is a tertiary digest of prose figures. Per CONTENT-STANDARDS §2/§3.4
 *   and AGENTS.md ("bind figures to primary sources, not the newsletter"), its
 *   numbers must be re-verified against each disease's primary source (WHO DON,
 *   CDC, Africa CDC, …) by a human before they enter a curated field. So this
 *   script's job is detection + surfacing, never transcription.
 *
 * TRUST MODEL (mirrors ingest-phac-host-cities.mjs)
 *   - Deterministic, idempotent, makes only GET requests.
 *   - Fail-open: any network/parse failure leaves the dashboard untouched and
 *     reports a non-alarming warning (a flaky fetch must not nag a human).
 *   - Stateless: "is there a new issue?" is answered by comparing the issue date
 *     to each signal's humans-only `lastChecked` attestation — no committed state
 *     file to drift. A signal re-verified AFTER the issue published is caught up.
 *
 * OUTPUT (ingest-tracking-report-result.json)
 *   { ok, status, actionRequired, checkedAt, issue:{...}, needsHuman:[...],
 *     signalCoverage:[...], uncoveredTopics:[...], warnings:[...] }
 *   ok=false  → a human action is due (new issue, or date unparsed) → the daily
 *               Human Review Digest folds this in and the weekly workflow opens
 *               / updates a GitHub issue.
 *   ok=true   → caught up, or a transient fetch failure (fail-open).
 *
 * USAGE
 *   node scripts/ingest-tracking-report.mjs                 # fetch live + report
 *   TRACKING_REPORT_ISSUE_FIXTURE=issue.html node ...       # offline issue html
 *   TRACKING_REPORT_LANDING_FIXTURE=landing.html node ...   # offline landing html
 *   TRACKING_REPORT_ISSUE_URL=<url> node ...                # skip landing discovery
 */

import { createHash } from 'crypto'
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'

// ---------------------------------------------------------------------------
// Config — the maintenance surface.
// ---------------------------------------------------------------------------
const SIGNALS_PATH = process.env.TRACKING_REPORT_SIGNALS_PATH || 'src/data/signals.json'
const OUTPUT_PATH = process.env.TRACKING_REPORT_OUTPUT || 'ingest-tracking-report-result.json'

// Stable human landing page that always points at the current issue + archive.
// Resilient to the per-issue mailchi.mp slug changing every week.
const LANDING_URL =
  process.env.TRACKING_REPORT_LANDING_URL ||
  'https://pandemics.sph.brown.edu/our-work/tracking-report'

const SOURCE = 'brown-pandemic-center-tracking-report'

// Common-name aliases per signal id. The signal `pathogen` field carries the
// scientific name ("Vibrio cholerae O1"); the newsletter uses common names
// ("cholera"). Keep this in sync when signals are added/removed — signals NOT
// listed here fall back to tokens derived from their name/pathogen and are
// reported under `warnings` so the gap is visible, never silent.
const SIGNAL_KEYWORDS = {
  'andes-hantavirus-mv-hondius-2026': ['hantavirus', 'andes virus', 'hondius', 'navis'],
  'ebola-bundibugyo-drc-2026': ['ebola', 'bundibugyo'],
  'measles-us-2026': ['measles'],
  'mpox-africa-clade-i-2026': ['mpox', 'monkeypox', 'clade i', 'clade ii'],
  'avian-influenza-h5-2026': ['avian influenza', 'bird flu', 'h5n1', 'h9n2', 'h5n'],
  'cholera-africa-2026': ['cholera'],
  'seasonal-influenza-2026': ['seasonal influenza', 'influenza a', 'influenza b'],
  'covid-wastewater-2026': ['covid', 'sars-cov-2', 'coronavirus'],
  'norovirus-wastewater-2026': ['norovirus'],
  'rotavirus-wastewater-2026-bay-area': ['rotavirus'],
  'rsv-wastewater-2026': ['rsv', 'respiratory syncytial'],
  'hmpv-wastewater-2026': ['metapneumovirus', 'hmpv'],
  'lassa-fever-2026': ['lassa'],
  'chikungunya-2026': ['chikungunya', 'chkv'],
  'candida-auris-wastewater-2026': ['candida auris', 'c. auris', 'c auris'],
  'screwworm-onehealth-2026': ['screwworm', 'cochliomyia'],
  'fifa-world-cup-2026-prep': ['world cup', 'fifa'],
  'pertussis-us-2026': ['pertussis', 'whooping cough'],
  'yellow-fever-colombia-2026': ['yellow fever'],
}

// Broad disease lexicon for best-effort "uncovered topic" detection: terms that,
// when present in the issue but matched by NO signal's keywords, suggest a topic
// the dashboard may not yet track. Coarse by design (advisory only).
const DISEASE_LEXICON = [
  'ebola', 'marburg', 'measles', 'mpox', 'monkeypox', 'cholera', 'hantavirus',
  'avian influenza', 'bird flu', 'h5n1', 'h9n2', 'covid', 'sars-cov-2', 'norovirus',
  'rotavirus', 'rsv', 'metapneumovirus', 'lassa', 'chikungunya', 'candida auris',
  'screwworm', 'pertussis', 'whooping cough', 'yellow fever', 'dengue', 'zika',
  'nipah', 'oropouche', 'polio', 'poliovirus', 'diphtheria', 'anthrax', 'plague',
  'rabies', 'malaria', 'tuberculosis', 'west nile', 'crimean-congo', 'rift valley',
  'hepatitis', 'legionella', 'listeria', 'salmonella', 'e. coli', 'shigella',
]

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing — no network, no fs).
// ---------------------------------------------------------------------------

/**
 * Pull the current issue URL (and archive URL) out of the landing page HTML.
 * The current issue is a per-week mailchi.mp campaign link; the archive is the
 * Brown /newsletter-archive page. Returns { issueUrl, archiveUrl }.
 */
export function extractLatestIssueUrl(landingHtml) {
  const html = String(landingHtml)
  const hrefs = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1])
  const isSubscribe = (h) => /subscri/i.test(h)
  const issueUrl =
    hrefs.find((h) => /mailchi\.mp\//i.test(h) && /tracking-report/i.test(h) && !isSubscribe(h)) ||
    hrefs.find((h) => /mailchi\.mp\//i.test(h) && !isSubscribe(h)) ||
    null
  const archiveRel = hrefs.find((h) => /newsletter-archive/i.test(h)) || null
  const archiveUrl = archiveRel
    ? archiveRel.startsWith('http')
      ? archiveRel
      : `https://pandemics.sph.brown.edu${archiveRel.startsWith('/') ? '' : '/'}${archiveRel}`
    : null
  return { issueUrl, archiveUrl }
}

/** Strip an HTML document to readable plain text (best-effort, no deps). */
export function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&mdash;/gi, '—')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Best-effort issue date as ISO (YYYY-MM-DD) or null. Prefers a "Month D, YYYY"
 * string near the top of the issue (the dateline); falls back to an "M-D" slug
 * in the issue URL (year inferred from the dateline year or `fallbackYear`).
 */
export function extractIssueDate(issueText, issueUrl, fallbackYear) {
  const head = String(issueText).slice(0, 4000)
  const m = head.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(20\d{2})\b/i,
  )
  if (m) {
    const month = MONTHS[m[1].toLowerCase()]
    const day = Number.parseInt(m[2], 10)
    const year = Number.parseInt(m[3], 10)
    if (month && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  // Slug fallback: ".../tracking-report-6-11-..." → month 6, day 11.
  const slug = String(issueUrl || '').match(/tracking-report-(\d{1,2})-(\d{1,2})\b/i)
  if (slug) {
    const month = Number.parseInt(slug[1], 10)
    const day = Number.parseInt(slug[2], 10)
    const year = fallbackYear || new Date().getUTCFullYear()
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  return null
}

/** A short human title for the issue. */
export function extractIssueTitle(issueText) {
  const t = String(issueText)
  const m = t.match(/(?:the\s+)?pandemic center tracking report[^.|]*?(?:20\d{2})/i)
  if (m) return m[0].replace(/\s+/g, ' ').trim()
  return 'Pandemic Center Tracking Report'
}

/** Keywords for a signal: curated aliases, plus tokens derived from its own fields. */
export function buildSignalKeywords(signal) {
  const curated = SIGNAL_KEYWORDS[signal.id] || []
  if (curated.length > 0) return { keywords: curated, derived: false }
  // Fallback so an un-mapped signal still matches *something*.
  const tokens = new Set()
  for (const src of [signal.name, signal.pathogen]) {
    for (const w of String(src || '').toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length >= 5 && !STOPWORDS.has(w)) tokens.add(w)
    }
  }
  return { keywords: [...tokens], derived: true }
}

const STOPWORDS = new Set([
  'virus', 'fever', 'human', 'disease', 'subtypes', 'orthohantavirus', 'morbillivirus',
  'ebolavirus', 'mammarenavirus', 'multiple', 'pathogens', 'event', 'based', 'surveillance',
  'wastewater', 'cluster', 'travel', 'linked', 'northern', 'hemisphere', 'season', 'late',
  'global', 'outbreak', 'activity', 'including', 'republic', 'africa', 'americas', 'states',
  'united', 'world', 'signals', 'zoonotic',
])

/**
 * For each signal, whether the issue mentions it and whether the signal's
 * humans-only `lastChecked` predates the issue (→ likely stale vs this issue).
 */
export function matchSignalsToIssue(signals, issueText, issueDateIso) {
  const haystack = String(issueText).toLowerCase()
  const issueMs = issueDateIso ? new Date(issueDateIso).getTime() : null
  const warnings = []
  const coverage = signals.map((s) => {
    const { keywords, derived } = buildSignalKeywords(s)
    if (derived) warnings.push(`signal "${s.id}" has no curated keyword alias; used derived tokens [${keywords.join(', ')}]`)
    const mentioned = keywords.some((k) => haystack.includes(k.toLowerCase()))
    const lc = s.lastChecked ? new Date(s.lastChecked).getTime() : null
    const staleVsIssue =
      mentioned && issueMs !== null && lc !== null && lc < issueMs
    return {
      id: s.id,
      name: s.name,
      mentioned,
      lastChecked: s.lastChecked || null,
      lastUpdated: s.lastUpdated || null,
      staleVsIssue,
      matchedKeywords: keywords.filter((k) => haystack.includes(k.toLowerCase())),
    }
  })
  return { coverage, warnings }
}

/** Lexicon terms present in the issue but not covered by any signal keyword. */
export function scanUncoveredTopics(issueText, signals) {
  const haystack = String(issueText).toLowerCase()
  const covered = new Set()
  for (const s of signals) for (const k of buildSignalKeywords(s).keywords) covered.add(k.toLowerCase())
  const uncovered = []
  for (const term of DISEASE_LEXICON) {
    if (haystack.includes(term) && !covered.has(term)) uncovered.push(term)
  }
  return [...new Set(uncovered)]
}

export function sha256(text) {
  return createHash('sha256').update(String(text)).digest('hex')
}

/** Assemble the result object from already-fetched pieces (pure). */
export function buildResult({ issueUrl, archiveUrl, issueText, issueDateIso, signals, checkedAt }) {
  const title = extractIssueTitle(issueText)
  const { coverage, warnings } = matchSignalsToIssue(signals, issueText, issueDateIso)
  const uncoveredTopics = scanUncoveredTopics(issueText, signals)
  const staleMentioned = coverage.filter((c) => c.staleVsIssue)
  const freshestReview = signals
    .map((s) => s.lastChecked)
    .filter(Boolean)
    .sort()
    .pop() || null

  const issue = {
    url: issueUrl,
    title,
    date: issueDateIso,
    contentHash: sha256(issueText),
    textLength: issueText.length,
    archiveUrl: archiveUrl || null,
  }

  const needsHuman = []
  const watch = []

  if (issueDateIso === null) {
    // We have an issue but cannot place it in time → ask a human to look rather
    // than risk silently missing a genuinely new issue.
    needsHuman.push({
      id: 'tracking-report-date-unparsed',
      classification: 'NEEDS-HUMAN',
      severity: 'watch',
      category: 'tracking-report-capture',
      title: 'Latest Tracking Report fetched, but its publication date could not be parsed',
      why: 'Freshness vs. signals is computed from the issue date; without it the staleness diff is unreliable. Open the issue and confirm whether the current signal figures already reflect it.',
      recommendedAction: {
        summary: 'Open the issue and reconcile against signals manually this once; if the dateline format changed, update extractIssueDate().',
        file: 'scripts/ingest-tracking-report.mjs',
        field: 'extractIssueDate()',
        primarySource: { id: SOURCE, url: issueUrl },
      },
    })
  } else {
    for (const c of staleMentioned) {
      needsHuman.push({
        id: `tracking-report-stale--${c.id}`,
        classification: 'NEEDS-HUMAN',
        severity: 'concern',
        category: 'tracking-report-capture',
        title: `${c.id}: Tracking Report (${issueDateIso}) is newer than the signal's last review (${c.lastChecked})`,
        why: 'The current issue discusses this signal and was published after the signal was last verified. Re-verify the figures against the signal\'s PRIMARY source (not the newsletter), then bump lastChecked (and lastUpdated only if a fact changed).',
        governingStandard: 'CONTENT-STANDARDS §2/§3.4; AGENTS.md ("bind figures to primary sources, not the newsletter")',
        recommendedAction: {
          summary: 'Re-verify against the primary source, then update signals.json.',
          file: SIGNALS_PATH,
          field: `signals[id=${c.id}].{metrics,currentSituation,lastChecked,lastUpdated}`,
          primarySource: { id: SOURCE, url: issueUrl },
        },
      })
    }
  }

  if (uncoveredTopics.length > 0) {
    // Watch-only: the lexicon scan is best-effort and false-positive-prone (e.g.
    // "diphtheria" inside "DTP vaccine", "rabies" inside a combo-vaccine note),
    // so it surfaces for a human glance but never flips the monitor red or opens
    // an issue on its own.
    watch.push({
      id: 'tracking-report-uncovered-topics',
      classification: 'AUTONOMOUS-WATCH',
      severity: 'watch',
      category: 'tracking-report-capture',
      title: `Issue mentions ${uncoveredTopics.length} disease term(s) no signal covers: ${uncoveredTopics.join(', ')}`,
      why: 'A disease term appears in the issue but matches no tracked signal. It may be a new outbreak worth adding as a signal — or just a passing mention (vaccine names, comparisons). A human should glance and judge. Best-effort lexicon scan; expect false positives.',
      recommendedAction: {
        summary: 'Glance at the flagged term(s) in the issue; add a new signal only if the dashboard should track it.',
        file: SIGNALS_PATH,
        field: 'signals[] (new entry)',
        primarySource: { id: SOURCE, url: issueUrl },
      },
    })
  }

  // `ok` (and the weekly GitHub issue) is driven ONLY by needsHuman — a genuinely
  // newer issue the signals have not caught up to, or a broken date parse that
  // blinds the diff. Watch items are informational and never alarm on their own.
  const actionRequired = needsHuman.length > 0
  const status =
    issueDateIso === null ? 'date-unparsed' : actionRequired ? 'new-issue' : 'caught-up'

  return {
    ok: !actionRequired, // false → daily digest folds it in + weekly workflow opens an issue
    status,
    actionRequired,
    checkedAt,
    source: SOURCE,
    landingPage: LANDING_URL,
    issue,
    freshestSignalReview: freshestReview,
    counts: {
      signals: signals.length,
      mentioned: coverage.filter((c) => c.mentioned).length,
      staleVsIssue: staleMentioned.length,
      uncoveredTopics: uncoveredTopics.length,
      needsHuman: needsHuman.length,
      watch: watch.length,
    },
    needsHuman,
    watch,
    signalCoverage: coverage,
    uncoveredTopics,
    warnings,
  }
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

function writeResult(result) {
  atomicWriteFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n')
}

async function fetchText(url) {
  // Brown's site + Mailchimp sit behind CDNs that challenge non-browser UAs from
  // CI IPs. A descriptive browser-style UA + a few retries with backoff makes the
  // fetch reliable without misrepresenting who we are. Fail-open if all fail.
  const headers = {
    Accept: 'text/html,application/xhtml+xml,*/*',
    'User-Agent':
      'Mozilla/5.0 (compatible; EMERGENZ-biosecurity-dashboard/1.0; +https://github.com/EMERGENZ-Corporation/biosecurity-intel-dashboard)',
  }
  const attempts = Number.parseInt(process.env.TRACKING_REPORT_FETCH_ATTEMPTS || '4', 10)
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, { headers, redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`)
      return await res.text()
    } catch (error) {
      lastError = error
      const cause = error.cause ? ` (cause: ${error.cause.code || error.cause.message || error.cause})` : ''
      console.warn(`[ingest-tracking-report] fetch attempt ${attempt}/${attempts} failed: ${error.message}${cause}`)
      if (attempt < attempts) await new Promise((r) => setTimeout(r, attempt * 2500))
    }
  }
  throw lastError
}

async function main() {
  const checkedAt = new Date().toISOString()
  const signals = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8'))
  if (!Array.isArray(signals) || signals.length === 0) throw new Error('signals.json must be a non-empty array')

  // 1) Resolve the current issue URL (fixture > explicit env > landing discovery).
  let issueUrl = process.env.TRACKING_REPORT_ISSUE_URL || null
  let archiveUrl = null
  try {
    if (!issueUrl) {
      const landingHtml = process.env.TRACKING_REPORT_LANDING_FIXTURE
        ? readFileSync(process.env.TRACKING_REPORT_LANDING_FIXTURE, 'utf8')
        : await fetchText(LANDING_URL)
      const found = extractLatestIssueUrl(landingHtml)
      issueUrl = found.issueUrl
      archiveUrl = found.archiveUrl
      if (!issueUrl) throw new Error('could not locate the current issue link on the landing page')
    }
  } catch (error) {
    // Fail-open: leave the dashboard untouched, do not nag a human on a blip.
    console.warn(`[ingest-tracking-report] discovery failed (fail-open): ${error.message}`)
    writeResult({ ok: true, status: 'fetch-error', actionRequired: false, checkedAt, source: SOURCE, landingPage: LANDING_URL, error: error.message, warnings: [`landing-page discovery failed: ${error.message}`] })
    return
  }

  // 2) Fetch the issue.
  let issueHtml
  try {
    issueHtml = process.env.TRACKING_REPORT_ISSUE_FIXTURE
      ? readFileSync(process.env.TRACKING_REPORT_ISSUE_FIXTURE, 'utf8')
      : await fetchText(issueUrl)
  } catch (error) {
    console.warn(`[ingest-tracking-report] issue fetch failed (fail-open): ${error.message}`)
    writeResult({ ok: true, status: 'fetch-error', actionRequired: false, checkedAt, source: SOURCE, landingPage: LANDING_URL, issue: { url: issueUrl }, error: error.message, warnings: [`issue fetch failed: ${error.message}`] })
    return
  }

  // 3) Parse + diff.
  const issueText = htmlToText(issueHtml)
  const issueDateIso = extractIssueDate(issueText, issueUrl)
  const result = buildResult({ issueUrl, archiveUrl, issueText, issueDateIso, signals, checkedAt })
  writeResult(result)

  // 4) Console summary.
  console.log(`[ingest-tracking-report] ${checkedAt}`)
  console.log(`  issue: ${result.issue.title} (${result.issue.date || 'date unknown'})`)
  console.log(`  url:   ${result.issue.url}`)
  console.log(`  status: ${result.status}   action required: ${result.actionRequired}`)
  console.log(`  signals mentioned: ${result.counts.mentioned}/${result.counts.signals}   stale vs issue: ${result.counts.staleVsIssue}   uncovered topics: ${result.counts.uncoveredTopics}`)
  for (const item of result.needsHuman) console.log(`    NEEDS-HUMAN [${item.severity}] ${item.title}`)
  for (const item of result.watch || []) console.log(`    watch [${item.severity}] ${item.title}`)
  for (const w of result.warnings || []) console.log(`    (warn) ${w}`)
  if (!result.actionRequired) console.log('  caught up — signals reviewed at/after this issue. No human action due.')
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  main().catch((error) => {
    // Last-resort fail-open: never crash the weekly job over a parse edge case.
    console.error(`[ingest-tracking-report] non-fatal error (fail-open): ${error.message}`)
    try {
      writeResult({ ok: true, status: 'fetch-error', actionRequired: false, checkedAt: new Date().toISOString(), source: SOURCE, error: error.message })
    } catch { /* ignore */ }
    process.exitCode = 0
  })
}
