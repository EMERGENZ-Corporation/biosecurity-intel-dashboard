#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Unit tests for fetchText() in scripts/update-news.mjs — the bounded-retry
 * fetch that protects the critical Tier 1 feed gate from transient WAF 403s and
 * timeouts. A single transient blip on CDC/WHO/ECDC must NOT trip the
 * fail-closed gate, but a genuinely-down feed must still fail after the retry
 * budget is exhausted.
 *
 * fetchText is imported directly — update-news.mjs only runs its pipeline when
 * invoked as the main module — and global.fetch is stubbed per-case so no
 * network is touched. Real backoff sleeps (600ms, 1200ms) are short enough to
 * keep the suite fast.
 */

import { fetchText } from './update-news.mjs'

const realFetch = global.fetch

// Build a stubbed fetch that walks a scripted list of responders. Each responder
// is either { status, body } (resolves to a Response-like object) or a function
// that throws (to simulate a network error / abort, which carries no HTTP
// status). The User-Agent of every call is recorded into the returned array.
function stubFetch(responders) {
  const calls = []
  global.fetch = async (url, opts = {}) => {
    const ua = opts.headers?.['User-Agent']
    const responder = responders[calls.length]
    calls.push({ url, ua })
    if (!responder) throw new Error(`unexpected fetch call #${calls.length} to ${url}`)
    if (typeof responder === 'function') return responder()
    return {
      ok: responder.status >= 200 && responder.status < 300,
      status: responder.status,
      text: async () => responder.body ?? '',
    }
  }
  return calls
}

const ok = (status, body = '<rss/>') => ({ status, body })
const networkError = () => { throw new Error('This operation was aborted') }

const tests = []
const test = (name, fn) => tests.push({ name, fn })

test('success on first try makes one call with the identifying UA', async () => {
  const calls = stubFetch([ok(200, '<rss>one</rss>')])
  const body = await fetchText('https://example.test/feed')
  if (body !== '<rss>one</rss>') throw new Error('did not return body')
  if (calls.length !== 1) throw new Error(`expected 1 call; got ${calls.length}`)
  if (!calls[0].ua.includes('EMERGENZ-Biosecurity-Intel')) {
    throw new Error(`first attempt should use the identifying UA; got ${calls[0].ua}`)
  }
})

test('403 then 200 retries and falls back to a browser UA on the retry', async () => {
  const calls = stubFetch([ok(403), ok(200, '<rss>recovered</rss>')])
  const body = await fetchText('https://www.ecdc.europa.eu/feed')
  if (body !== '<rss>recovered</rss>') throw new Error('did not recover after 403')
  if (calls.length !== 2) throw new Error(`expected 2 calls; got ${calls.length}`)
  if (!calls[0].ua.includes('EMERGENZ-Biosecurity-Intel')) throw new Error('attempt 0 used wrong UA')
  if (!calls[1].ua.includes('Mozilla/5.0')) throw new Error('retry should use a browser UA')
})

test('429 (rate limit) is retried', async () => {
  const calls = stubFetch([ok(429), ok(200, '<rss>ok</rss>')])
  const body = await fetchText('https://example.test/feed')
  if (body !== '<rss>ok</rss>') throw new Error('did not recover after 429')
  if (calls.length !== 2) throw new Error(`expected 2 calls; got ${calls.length}`)
})

test('network error / abort (no HTTP status) is retried', async () => {
  const calls = stubFetch([networkError, ok(200, '<rss>ok</rss>')])
  const body = await fetchText('https://example.test/feed')
  if (body !== '<rss>ok</rss>') throw new Error('did not recover from network error')
  if (calls.length !== 2) throw new Error(`expected 2 calls; got ${calls.length}`)
})

test('404 is permanent — no retry, fail fast', async () => {
  const calls = stubFetch([ok(404)])
  let threw
  try { await fetchText('https://example.test/missing') } catch (error) { threw = error }
  if (!threw) throw new Error('expected a throw on 404')
  if (!threw.message.includes('404')) throw new Error(`expected HTTP 404; got ${threw.message}`)
  if (calls.length !== 1) throw new Error(`404 must not retry; got ${calls.length} calls`)
})

test('persistent 403 exhausts the retry budget (3 total attempts) then throws', async () => {
  const calls = stubFetch([ok(403), ok(403), ok(403)])
  let threw
  try { await fetchText('https://www.ecdc.europa.eu/feed') } catch (error) { threw = error }
  if (!threw) throw new Error('expected a throw after exhausting retries')
  if (!threw.message.includes('403')) throw new Error(`expected HTTP 403; got ${threw.message}`)
  if (calls.length !== 3) throw new Error(`expected 3 attempts; got ${calls.length}`)
})

let passed = 0
try {
  for (const { name, fn } of tests) {
    try {
      await fn()
      passed++
    } catch (error) {
      console.error(`[test-fetch-retry] FAIL: ${name}\n  ${error.message}`)
      throw error
    }
  }
  console.log(`[test-fetch-retry] OK (${passed} tests)`)
} finally {
  global.fetch = realFetch
}
