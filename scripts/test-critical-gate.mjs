#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Unit tests for criticalQuorumBreached() in scripts/update-news.mjs — the
 * quorum gate that decides whether a Tier 1 feed-failure set is severe enough
 * to halt the run (write nothing, page a human) or whether the run degrades
 * gracefully and still publishes.
 *
 * Design under test:
 *   - CDC and WHO are PRIMARY Tier 1 authorities. Either being unreachable
 *     during active monitoring halts the run (fail-closed).
 *   - ECDC is Tier 1 but WAF-flaky (intermittent 403/429). A LONE ECDC failure
 *     that survives the retry budget is tolerated — the run degrades gracefully.
 *   - Two or more simultaneous Tier 1 failures indicate a correlated outage and
 *     always halt.
 *
 * criticalQuorumBreached is a pure function imported directly — update-news.mjs
 * only runs its pipeline when invoked as the main module — so no network or
 * filesystem is touched.
 */

import { criticalQuorumBreached } from './update-news.mjs'

const fail = authority => ({
  authority,
  url: `https://example.test/${authority.toLowerCase()}/feed`,
  reason: 'HTTP 403',
})

const tests = []
const test = (name, fn) => tests.push({ name, fn })
const assertEq = (actual, expected, msg) => {
  if (actual !== expected) throw new Error(`${msg} — expected ${expected}, got ${actual}`)
}

test('no critical failures → not breached', () => {
  assertEq(criticalQuorumBreached([]), false, 'empty set must not breach')
})

test('undefined argument → not breached (defensive default)', () => {
  assertEq(criticalQuorumBreached(), false, 'missing arg must not breach')
})

test('lone ECDC failure → tolerated (graceful degradation)', () => {
  assertEq(criticalQuorumBreached([fail('ECDC')]), false, 'lone ECDC must degrade gracefully')
})

test('lone CDC failure → breached', () => {
  assertEq(criticalQuorumBreached([fail('CDC')]), true, 'CDC is primary; must halt')
})

test('lone WHO failure → breached', () => {
  assertEq(criticalQuorumBreached([fail('WHO')]), true, 'WHO is primary; must halt')
})

test('CDC + ECDC failure → breached (2 failures)', () => {
  assertEq(criticalQuorumBreached([fail('CDC'), fail('ECDC')]), true, 'two failures must halt')
})

test('WHO + ECDC failure → breached (2 failures)', () => {
  assertEq(criticalQuorumBreached([fail('WHO'), fail('ECDC')]), true, 'two failures must halt')
})

test('CDC + WHO failure → breached (both primaries down)', () => {
  assertEq(criticalQuorumBreached([fail('CDC'), fail('WHO')]), true, 'both primaries down must halt')
})

test('all three Tier 1 fail → breached (correlated outage)', () => {
  assertEq(criticalQuorumBreached([fail('CDC'), fail('WHO'), fail('ECDC')]), true, 'correlated outage must halt')
})

let passed = 0
for (const { name, fn } of tests) {
  try {
    fn()
    passed++
  } catch (error) {
    console.error(`[test-critical-gate] FAIL: ${name}\n  ${error.message}`)
    process.exit(1)
  }
}
console.log(`[test-critical-gate] OK (${passed} tests)`)
