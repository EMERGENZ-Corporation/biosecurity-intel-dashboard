#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Offline unit tests for the Tracking Report capture. No network: the pure
 * functions are fed small inline HTML/text fixtures.
 * Run: node scripts/test-ingest-tracking-report.mjs
 */
import {
  extractLatestIssueUrl,
  htmlToText,
  extractIssueDate,
  matchSignalsToIssue,
  scanUncoveredTopics,
  buildResult,
} from './ingest-tracking-report.mjs'

let failures = 0
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`  ✗ ${msg}`) }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`)
}

// --- extractLatestIssueUrl ---------------------------------------------------
const landing = `
  <a href="https://mailchi.mp/brown/tracking-report-subscription">Subscribe</a>
  <a href="/newsletter-archive">Archive</a>
  <a href="https://mailchi.mp/messages/pandemic-center-tracking-report-6-11-26">Read the latest issue</a>
`
const found = extractLatestIssueUrl(landing)
eq(found.issueUrl, 'https://mailchi.mp/messages/pandemic-center-tracking-report-6-11-26',
  'picks the tracking-report issue link, not the subscription link')
eq(found.archiveUrl, 'https://pandemics.sph.brown.edu/newsletter-archive',
  'resolves the relative archive link to an absolute URL')

// --- htmlToText --------------------------------------------------------------
eq(htmlToText('<p>Measles &amp; mpox</p><script>x=1</script>'), 'Measles & mpox',
  'strips tags + scripts and decodes entities')

// --- extractIssueDate --------------------------------------------------------
eq(extractIssueDate('The Pandemic Center Tracking Report June 11, 2026 ...', 'x'), '2026-06-11',
  'parses a "Month D, YYYY" dateline')
eq(extractIssueDate('no date here', 'https://mailchi.mp/messages/pandemic-center-tracking-report-6-11-26', 2026),
  '2026-06-11', 'falls back to the M-D slug when no dateline is present')
eq(extractIssueDate('no date and no slug', 'https://example.com/x'), null,
  'returns null when no date can be determined')

// --- signals fixture ---------------------------------------------------------
const issueText =
  'Pandemic Center Tracking Report June 11, 2026. Measles cases continue in the US. ' +
  'Ebola Bundibugyo outbreak in the DRC worsens. A new dengue outbreak is noted abroad.'
const signalsStale = [
  { id: 'measles-us-2026', name: 'Measles — US', pathogen: 'Measles morbillivirus', lastChecked: '2026-06-13T00:00:00.000Z' },
  { id: 'ebola-bundibugyo-drc-2026', name: 'Ebola — DRC', pathogen: 'Bundibugyo ebolavirus', lastChecked: '2026-05-30T00:00:00.000Z' },
  { id: 'rotavirus-wastewater-2026-bay-area', name: 'Rotavirus — Bay Area', pathogen: 'Rotavirus', lastChecked: '2026-06-13T00:00:00.000Z' },
]

// --- matchSignalsToIssue -----------------------------------------------------
const { coverage } = matchSignalsToIssue(signalsStale, issueText, '2026-06-11')
const byId = Object.fromEntries(coverage.map((c) => [c.id, c]))
eq(byId['measles-us-2026'].mentioned, true, 'measles is detected as mentioned')
eq(byId['measles-us-2026'].staleVsIssue, false, 'measles reviewed AFTER the issue → not stale')
eq(byId['ebola-bundibugyo-drc-2026'].staleVsIssue, true, 'ebola reviewed BEFORE the issue → stale vs issue')
eq(byId['rotavirus-wastewater-2026-bay-area'].mentioned, false, 'rotavirus is not mentioned in the issue')

// --- scanUncoveredTopics -----------------------------------------------------
const uncovered = scanUncoveredTopics(issueText, signalsStale)
assert(uncovered.includes('dengue'), 'dengue (no signal) is flagged as an uncovered topic')
assert(!uncovered.includes('measles'), 'measles (has a signal) is NOT flagged as uncovered')

// --- buildResult: new-issue path ---------------------------------------------
const newIssue = buildResult({
  issueUrl: 'u', archiveUrl: 'a', issueText, issueDateIso: '2026-06-11',
  signals: signalsStale, checkedAt: '2026-06-12T00:00:00.000Z',
})
eq(newIssue.ok, false, 'new-issue (a stale mentioned signal) → ok:false')
eq(newIssue.status, 'new-issue', 'status is new-issue')
assert(newIssue.needsHuman.some((i) => i.id === 'tracking-report-stale--ebola-bundibugyo-drc-2026'),
  'needsHuman includes the stale ebola signal')
assert(newIssue.watch.some((i) => i.id === 'tracking-report-uncovered-topics'),
  'uncovered topics are surfaced as a non-blocking watch, not needsHuman')

// --- buildResult: caught-up path ---------------------------------------------
const caughtUp = buildResult({
  issueUrl: 'u', archiveUrl: 'a', issueText,
  issueDateIso: '2026-06-11',
  signals: signalsStale.map((s) => ({ ...s, lastChecked: '2026-06-13T00:00:00.000Z' })),
  checkedAt: '2026-06-14T00:00:00.000Z',
})
eq(caughtUp.ok, true, 'all signals reviewed after the issue → ok:true (caught up)')
eq(caughtUp.status, 'caught-up', 'status is caught-up')
eq(caughtUp.needsHuman.length, 0, 'no human action due when caught up')

// --- buildResult: date-unparsed path -----------------------------------------
const noDate = buildResult({
  issueUrl: 'u', archiveUrl: 'a', issueText, issueDateIso: null,
  signals: signalsStale, checkedAt: '2026-06-12T00:00:00.000Z',
})
eq(noDate.ok, false, 'unparseable date → ok:false (a human should look)')
eq(noDate.status, 'date-unparsed', 'status is date-unparsed')
assert(noDate.needsHuman.some((i) => i.id === 'tracking-report-date-unparsed'),
  'needsHuman includes the date-unparsed item')

// --- summary -----------------------------------------------------------------
if (failures === 0) {
  console.log('[test-ingest-tracking-report] ✓ all assertions passed')
  process.exit(0)
} else {
  console.error(`[test-ingest-tracking-report] ✗ ${failures} assertion(s) failed`)
  process.exit(1)
}
