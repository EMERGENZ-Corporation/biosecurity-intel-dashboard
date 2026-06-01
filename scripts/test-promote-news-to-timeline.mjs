#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Unit tests for scripts/promote-news-to-timeline.mjs. Each test sets up an
 * isolated tempdir with fixture inputs, runs the promoter against env-pointed
 * paths, and asserts the output artifact + timeline-file delta.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { spawnSync } from 'child_process'

const root = process.cwd()
const tempRoot = mkdtempSync(join(tmpdir(), 'emergenz-promote-timeline-'))

function setupFixture(name, { signals, sources, timeline, news }) {
  const caseRoot = join(tempRoot, name)
  mkdirSync(caseRoot, { recursive: true })
  const paths = {
    signals: join(caseRoot, 'signals.json'),
    sources: join(caseRoot, 'signal-sources.json'),
    timeline: join(caseRoot, 'signal-timeline.json'),
    news: join(caseRoot, 'news.json'),
    output: join(caseRoot, 'promote-result.json'),
  }
  writeFileSync(paths.signals, JSON.stringify(signals, null, 2))
  writeFileSync(paths.sources, JSON.stringify(sources, null, 2))
  writeFileSync(paths.timeline, JSON.stringify(timeline, null, 2) + '\n')
  writeFileSync(paths.news, JSON.stringify(news, null, 2))
  return paths
}

function run(paths) {
  const result = spawnSync(process.execPath, ['scripts/promote-news-to-timeline.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      PROMOTE_SIGNALS_PATH: paths.signals,
      PROMOTE_SOURCES_PATH: paths.sources,
      PROMOTE_TIMELINE_PATH: paths.timeline,
      PROMOTE_NEWS_PATH: paths.news,
      PROMOTE_OUTPUT_PATH: paths.output,
    },
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`promote exited ${result.status}\n${result.stderr}${result.stdout}`)
  }
  return {
    result: JSON.parse(readFileSync(paths.output, 'utf8')),
    timeline: JSON.parse(readFileSync(paths.timeline, 'utf8')),
    stdout: result.stdout,
  }
}

const NOW = Date.now()
const ISO_NOW = new Date(NOW).toISOString()

function recentTimestamp(daysAgo) {
  return NOW - daysAgo * 24 * 60 * 60 * 1000
}

// Minimal fixture builders.
function signalFixture(overrides = {}) {
  return {
    id: 'fix-signal',
    name: 'Fixture signal',
    category: 'zoonotic',
    geography: ['Global'],
    severity: 'concern',
    confidence: 'official',
    trend: 'stable',
    status: 'active',
    summary: 'fixture',
    operationalRelevance: 'fixture',
    primarySourceId: 'cdc-fix-source',
    sourceIds: ['cdc-fix-source'],
    lastUpdated: '2026-05-24',
    lastChecked: '2026-05-24',
    ...overrides,
  }
}

function sourceFixture(overrides = {}) {
  return {
    id: 'cdc-fix-source',
    authority: 'CDC',
    title: 'CDC fixture source',
    sourceType: 'health-advisory',
    sourceTier: 1,
    primary: true,
    url: 'https://www.cdc.gov/example',
    lastVerified: '2026-05-24',
    domains: ['zoonotic'],
    ...overrides,
  }
}

function newsFixture(overrides = {}) {
  return {
    id: 'news-fix-1',
    authority: 'CDC',
    title: 'CDC news item title',
    description: 'CDC news item description',
    link: 'https://www.cdc.gov/news/example',
    pubDate: ISO_NOW,
    timestamp: recentTimestamp(1),
    signalIds: ['fix-signal'],
    ...overrides,
  }
}

const tests = []

function test(name, fn) {
  tests.push({ name, fn })
}

test('happy-path: tier-1 CDC item with one matched concern-severity signal promotes', () => {
  const paths = setupFixture('happy-path', {
    signals: [signalFixture()],
    sources: [sourceFixture()],
    timeline: [],
    news: [newsFixture()],
  })
  const { result, timeline } = run(paths)
  if (result.promotionsCount !== 1) throw new Error(`expected 1 promotion; got ${result.promotionsCount}`)
  if (timeline.length !== 1) throw new Error(`expected timeline length 1; got ${timeline.length}`)
  const event = timeline[0]
  if (event.provenance !== 'auto-news-tier1') throw new Error('expected provenance auto-news-tier1')
  if (event.newsId !== 'news-fix-1') throw new Error('expected newsId news-fix-1')
  if (event.id !== 'auto-news-fix-1') throw new Error(`expected id auto-news-fix-1; got ${event.id}`)
  if (event.title !== 'CDC news item title') throw new Error('title not verbatim')
  if (event.description !== 'CDC news item description') throw new Error('description not verbatim')
})

test('empty-news: no items, writes nothing', () => {
  const paths = setupFixture('empty-news', {
    signals: [signalFixture()],
    sources: [sourceFixture()],
    timeline: [],
    news: [],
  })
  const { result, timeline } = run(paths)
  if (result.promotionsCount !== 0) throw new Error('expected 0 promotions')
  if (timeline.length !== 0) throw new Error('timeline should be empty')
  if (result.mode !== 'no-op') throw new Error(`expected mode no-op; got ${result.mode}`)
})

test('non-tier1-authority: NPR item is skipped', () => {
  const paths = setupFixture('non-tier1-authority', {
    signals: [signalFixture()],
    sources: [sourceFixture()],
    timeline: [],
    news: [newsFixture({ authority: 'NPR' })],
  })
  const { result } = run(paths)
  if (result.promotionsCount !== 0) throw new Error('NPR should not promote')
  if ((result.reasonsByKind['not-tier-1-authority'] || 0) < 1) {
    throw new Error('not-tier-1-authority reason missing')
  }
})

test('severity-below-threshold: monitor signal is skipped', () => {
  const paths = setupFixture('severity-below-threshold', {
    signals: [signalFixture({ severity: 'monitor' })],
    sources: [sourceFixture()],
    timeline: [],
    news: [newsFixture()],
  })
  const { result } = run(paths)
  if (result.promotionsCount !== 0) throw new Error('monitor severity should not promote')
  if ((result.reasonsByKind['severity-below-threshold'] || 0) < 1) {
    throw new Error('severity-below-threshold reason missing')
  }
})

test('older-than-cap: 30-day-old item is skipped', () => {
  const paths = setupFixture('older-than-cap', {
    signals: [signalFixture()],
    sources: [sourceFixture()],
    timeline: [],
    news: [newsFixture({ timestamp: recentTimestamp(30) })],
  })
  const { result } = run(paths)
  if (result.promotionsCount !== 0) throw new Error('30d-old should not promote')
  if ((result.reasonsByKind['older-than-cap'] || 0) < 1) throw new Error('older-than-cap reason missing')
})

test('wrong-signal-count: multi-signal news item is skipped', () => {
  const paths = setupFixture('wrong-signal-count', {
    signals: [signalFixture(), signalFixture({ id: 'fix-signal-2', primarySourceId: 'cdc-fix-source' })],
    sources: [sourceFixture()],
    timeline: [],
    news: [newsFixture({ signalIds: ['fix-signal', 'fix-signal-2'] })],
  })
  const { result } = run(paths)
  if (result.promotionsCount !== 0) throw new Error('multi-signal item should not promote')
  if ((result.reasonsByKind['wrong-signal-count'] || 0) < 1) throw new Error('wrong-signal-count reason missing')
})

test('no-tier-1-source-resolvable: signal whose primary+sources are all Tier 2 is skipped', () => {
  const paths = setupFixture('no-tier1-source', {
    signals: [signalFixture({ primarySourceId: 'tier2-only', sourceIds: ['tier2-only'] })],
    sources: [
      sourceFixture({ id: 'tier2-only', sourceTier: 2, authority: 'PHAC' }),
    ],
    timeline: [],
    news: [newsFixture()],
  })
  const { result } = run(paths)
  if (result.promotionsCount !== 0) throw new Error('no Tier 1 source should skip')
  if ((result.reasonsByKind['no-tier-1-source-resolvable'] || 0) < 1) {
    throw new Error('no-tier-1-source-resolvable reason missing')
  }
})

test('same-day-collision: curated event same signal+day blocks auto promotion', () => {
  const today = new Date(recentTimestamp(1)).toISOString().slice(0, 10)
  const paths = setupFixture('same-day-collision', {
    signals: [signalFixture()],
    sources: [sourceFixture()],
    timeline: [{
      id: 'curated-existing',
      signalId: 'fix-signal',
      date: today,
      title: 'curated title',
      description: 'curated desc',
      sourceId: 'cdc-fix-source',
      category: 'zoonotic',
    }],
    news: [newsFixture()],
  })
  const { result, timeline } = run(paths)
  if (result.promotionsCount !== 0) throw new Error('same-day collision must skip')
  if (timeline.length !== 1) throw new Error('curated event must remain untouched')
  if ((result.reasonsByKind['same-day-collision'] || 0) < 1) {
    throw new Error('same-day-collision reason missing')
  }
})

test('idempotency: re-running on same inputs produces zero new promotions', () => {
  const paths = setupFixture('idempotency', {
    signals: [signalFixture()],
    sources: [sourceFixture()],
    timeline: [],
    news: [newsFixture()],
  })
  const first = run(paths)
  if (first.result.promotionsCount !== 1) throw new Error('first run should promote 1')
  const second = run(paths)
  if (second.result.promotionsCount !== 0) {
    throw new Error(`re-run should be idempotent; got ${second.result.promotionsCount} new promotions`)
  }
  if (second.timeline.length !== 1) throw new Error('timeline should still have just 1 entry')
})

test('per-run-cap: 25 qualifying items → only 20 promoted', () => {
  const newsItems = Array.from({ length: 25 }, (_, i) => newsFixture({
    id: `news-fix-${i}`,
    link: `https://www.cdc.gov/news/example-${i}`,
    timestamp: recentTimestamp(0.01 * i), // staggered so utc-day differs
    title: `CDC item ${i}`,
  }))
  // To bypass same-day collision, stagger timestamps across distinct UTC days.
  const stagger = newsItems.map((item, i) => ({
    ...item,
    timestamp: NOW - i * 24 * 60 * 60 * 1000, // 1 day apart
  })).filter((item) => (NOW - item.timestamp) <= 14 * 24 * 60 * 60 * 1000)
  // Only first 14 will be ≤14d old. Reduce per-run cap test to use a fresh
  // approach: same UTC day but different signals.
  const signals = Array.from({ length: 25 }, (_, i) => signalFixture({
    id: `fix-signal-${i}`,
    primarySourceId: 'cdc-fix-source',
    sourceIds: ['cdc-fix-source'],
  }))
  const newsItems2 = signals.map((s, i) => newsFixture({
    id: `news-fix-${i}`,
    link: `https://www.cdc.gov/news/example-${i}`,
    timestamp: recentTimestamp(0.5),
    signalIds: [s.id],
    title: `CDC item ${i}`,
  }))
  const paths = setupFixture('per-run-cap', {
    signals,
    sources: [sourceFixture()],
    timeline: [],
    news: newsItems2,
  })
  const { result } = run(paths)
  if (result.promotionsCount !== 20) {
    throw new Error(`per-run cap should clamp to 20; got ${result.promotionsCount}`)
  }
  // suppress unused-var warning
  void stagger
})

test('per-signal-7d-cap: 7 same-signal items → only 5 promoted (one per day to avoid same-day collision)', () => {
  const newsItems = Array.from({ length: 7 }, (_, i) => newsFixture({
    id: `news-fix-${i}`,
    link: `https://www.cdc.gov/news/example-${i}`,
    timestamp: NOW - i * 24 * 60 * 60 * 1000,
    title: `CDC item ${i}`,
  })).filter((item) => (NOW - item.timestamp) <= 14 * 24 * 60 * 60 * 1000)
  const paths = setupFixture('per-signal-cap', {
    signals: [signalFixture()],
    sources: [sourceFixture()],
    timeline: [],
    news: newsItems,
  })
  const { result } = run(paths)
  if (result.promotionsCount !== 5) {
    throw new Error(`per-signal 7d cap should clamp to 5; got ${result.promotionsCount}`)
  }
})

test('invalid-link: null link skips with explicit reason', () => {
  const paths = setupFixture('invalid-link', {
    signals: [signalFixture()],
    sources: [sourceFixture()],
    timeline: [],
    news: [newsFixture({ link: null })],
  })
  const { result } = run(paths)
  if (result.promotionsCount !== 0) throw new Error('null link must skip')
  if ((result.reasonsByKind['invalid-link'] || 0) < 1) throw new Error('invalid-link reason missing')
})

try {
  let passed = 0
  for (const { name, fn } of tests) {
    try {
      fn()
      passed++
    } catch (error) {
      console.error(`[test-promote-timeline] FAIL: ${name}\n  ${error.message}`)
      throw error
    }
  }
  console.log(`[test-promote-timeline] OK (${passed} tests)`)
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
