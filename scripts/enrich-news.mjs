#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Optional Gemini/Bright Data news enrichment.
 *
 * Safety contract:
 * - Runs after the deterministic RSS/Google News updater.
 * - If Gemini is not configured, fails open to the existing keyword pipeline.
 * - If Gemini fails, times out, or returns invalid JSON, fails open.
 * - Only high-confidence Gemini tags may be added to `news.signalIds`.
 * - Never removes deterministic tags.
 * - Never writes clinical guidance, signal facts, metrics, risk levels, or
 *   source-registry fields.
 * - Bright Data is optional and only supplies short internal context snippets
 *   for news triage. The original publisher remains the cited source.
 */

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const NEWS_PATH = 'src/data/news.json'
const OUTPUT_PATH = process.env.AI_NEWS_ENRICHMENT_OUTPUT || 'ai-news-enrichment-result.json'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GEMINI_ENABLED = process.env.GEMINI_NEWS_ENRICHMENT !== '0'
const GEMINI_TIMEOUT_MS = Number.parseInt(process.env.GEMINI_NEWS_TIMEOUT_MS || '30000', 10)
const MAX_NEWS_ITEMS = Number.parseInt(process.env.MAX_AI_NEWS_ITEMS || '80', 10)
const MAX_PUBLIC_TAG_ADDS = Number.parseInt(process.env.MAX_AI_PUBLIC_TAG_ADDS || '80', 10)

const BRIGHT_DATA_API_KEY = process.env.BRIGHT_DATA_API_KEY || process.env.BRIGHTDATA_API_KEY || ''
const BRIGHT_DATA_ZONE = process.env.BRIGHT_DATA_ZONE || ''
const BRIGHT_DATA_ENABLED = process.env.BRIGHT_DATA_NEWS_CONTEXT !== '0'
const BRIGHT_DATA_TIMEOUT_MS = Number.parseInt(process.env.BRIGHT_DATA_TIMEOUT_MS || '20000', 10)
const MAX_BRIGHT_DATA_CONTEXT_ITEMS = Number.parseInt(process.env.MAX_BRIGHT_DATA_CONTEXT_ITEMS || '5', 10)

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

function truncate(text = '', max = 900) {
  const cleaned = String(text).replace(/\s+/g, ' ').trim()
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max - 3).trimEnd()}...`
}

// Classify a Gemini failure so the workflow can decide whether to surface it.
// A persistent credential/authorization problem (denied/revoked project access,
// invalid key) repeats every run and won't self-heal, so it should not keep
// commenting on the reusable AI-brief issue. Transient problems (rate limits,
// 5xx, timeouts, network) may clear on the next run and stay worth surfacing.
function classifyGeminiFailure(message = '') {
  return /HTTP 40[13]\b|PERMISSION_DENIED|UNAUTHENTICATED|API[_ ]KEY[_ ]INVALID|API key not valid|denied access/i.test(message)
    ? 'auth-denied'
    : 'transient'
}

function normalizeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function signalCatalog(signals) {
  return signals.map((signal) => ({
    id: signal.id,
    name: signal.name,
    category: signal.category,
    severity: signal.severity,
    geography: signal.geography,
    summary: truncate(signal.summary, 240),
  }))
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchBrightDataContext(item) {
  if (!BRIGHT_DATA_ENABLED || !BRIGHT_DATA_API_KEY || !BRIGHT_DATA_ZONE || !item.link) {
    return { attempted: false, context: null }
  }

  try {
    const res = await fetchWithTimeout(
      'https://api.brightdata.com/request',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${BRIGHT_DATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zone: BRIGHT_DATA_ZONE,
          url: item.link,
          format: 'raw',
          data_format: 'markdown',
        }),
      },
      BRIGHT_DATA_TIMEOUT_MS,
    )

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = await res.text()
    let body = raw
    try {
      const parsed = JSON.parse(raw)
      body = parsed.body ?? parsed.data ?? raw
    } catch {
      // Raw response is acceptable.
    }
    return { attempted: true, context: truncate(body, 1200) }
  } catch (error) {
    return { attempted: true, context: null, error: error.message }
  }
}

async function buildBrightDataContexts(items) {
  const candidates = items
    .filter((item) => item.link && (String(item.description ?? '').length < 100 || item.authority === 'Google News'))
    .slice(0, MAX_BRIGHT_DATA_CONTEXT_ITEMS)

  const contexts = new Map()
  const failures = []
  let attempted = 0

  for (const item of candidates) {
    const result = await fetchBrightDataContext(item)
    if (!result.attempted) continue
    attempted += 1
    if (result.context) contexts.set(item.id, result.context)
    if (result.error) failures.push({ newsId: item.id, reason: result.error, host: normalizeHost(item.link) })
  }

  return { contexts, attempted, used: contexts.size, failures }
}

function buildPrompt(input) {
  return [
    'You are assisting the EMERGENZ Biosecurity Intelligence Dashboard with low-risk news triage.',
    '',
    'Allowed tasks:',
    '- Suggest signal IDs for news items.',
    '- Identify duplicate or same-event news items.',
    '- Suggest future search query expansions.',
    '- Produce an internal reviewer brief headline and priority item IDs.',
    '',
    'Hard limits:',
    '- Do not write clinical guidance, PPE guidance, treatment advice, case counts, risk levels, or public-health directives.',
    '- Do not invent events, numbers, authorities, sources, or URLs.',
    '- Use only the provided news items and signal catalog.',
    '- Prefer null or empty arrays when uncertain.',
    '- Return JSON only. No markdown.',
    '',
    'Return exactly this shape:',
    '{',
    '  "items": [',
    '    {',
    '      "newsId": "known news id",',
    '      "suggestedSignalIds": ["known signal id"],',
    '      "duplicateOf": "known news id or null",',
    '      "eventClusterKey": "short kebab-case cluster key",',
    '      "reason": "short internal rationale, not public copy",',
    '      "confidence": "low | medium | high"',
    '    }',
    '  ],',
    '  "queryExpansions": [{ "signalId": "known signal id", "queries": ["short query"] }],',
    '  "internalBrief": { "headline": "short internal headline", "priorityItems": ["known news id"] }',
    '}',
    '',
    JSON.stringify(input),
  ].join('\n')
}

async function callGemini(input) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`
  const prompt = buildPrompt(input)

  const res = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    },
    GEMINI_TIMEOUT_MS,
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini HTTP ${res.status}${body ? `: ${truncate(body, 300)}` : ''}`)
  }

  const json = await res.json()
  const text = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim()

  if (!text) throw new Error('Gemini returned no text')
  return JSON.parse(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim())
}

function validateGeminiOutput(raw, news, signals) {
  const newsIds = new Set(news.map((item) => item.id))
  const signalIds = new Set(signals.map((signal) => signal.id))
  const itemById = new Map(news.map((item) => [item.id, item]))
  const confidenceValues = new Set(['low', 'medium', 'high'])

  const items = Array.isArray(raw?.items) ? raw.items : []
  const validatedItems = []
  for (const item of items.slice(0, news.length)) {
    if (!newsIds.has(item?.newsId)) continue
    const suggestedSignalIds = Array.isArray(item.suggestedSignalIds)
      ? [...new Set(item.suggestedSignalIds.filter((id) => signalIds.has(id)))]
      : []
    const duplicateOf = newsIds.has(item.duplicateOf) && item.duplicateOf !== item.newsId ? item.duplicateOf : null
    const confidence = confidenceValues.has(item.confidence) ? item.confidence : 'low'
    validatedItems.push({
      newsId: item.newsId,
      suggestedSignalIds,
      duplicateOf,
      eventClusterKey: truncate(item.eventClusterKey ?? '', 80).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || null,
      reason: truncate(item.reason ?? '', 220),
      confidence,
      title: itemById.get(item.newsId)?.title ?? '',
    })
  }

  const queryExpansions = Array.isArray(raw?.queryExpansions) ? raw.queryExpansions : []
  const validatedQueryExpansions = queryExpansions
    .filter((entry) => signalIds.has(entry?.signalId))
    .slice(0, signals.length)
    .map((entry) => ({
      signalId: entry.signalId,
      queries: Array.isArray(entry.queries)
        ? [...new Set(entry.queries.map((q) => truncate(q, 90)).filter((q) => q && !/^https?:\/\//i.test(q)))].slice(0, 5)
        : [],
    }))
    .filter((entry) => entry.queries.length > 0)

  const priorityItems = Array.isArray(raw?.internalBrief?.priorityItems)
    ? raw.internalBrief.priorityItems.filter((id) => newsIds.has(id)).slice(0, 10)
    : []

  const internalBrief = {
    headline: truncate(raw?.internalBrief?.headline ?? 'Gemini news triage completed', 140),
    priorityItems: priorityItems.map((id) => {
      const item = itemById.get(id)
      return {
        newsId: id,
        title: item?.title ?? '',
        authority: item?.authority ?? '',
        link: item?.link ?? '',
      }
    }),
  }

  return { items: validatedItems, queryExpansions: validatedQueryExpansions, internalBrief }
}

function mergeHighConfidenceTags(news, validatedItems) {
  let changed = false
  let publicTagAdds = 0
  const byId = new Map(validatedItems.map((item) => [item.newsId, item]))

  const nextNews = news.map((item) => {
    const suggestion = byId.get(item.id)
    if (!suggestion || suggestion.confidence !== 'high' || suggestion.suggestedSignalIds.length === 0) {
      return item
    }

    const current = Array.isArray(item.signalIds) ? item.signalIds : []
    const merged = [...new Set([...current, ...suggestion.suggestedSignalIds])]
    const added = merged.length - current.length
    if (added <= 0 || publicTagAdds >= MAX_PUBLIC_TAG_ADDS) return item

    publicTagAdds += added
    changed = true
    return { ...item, signalIds: merged }
  })

  return { changed, publicTagAdds, nextNews }
}

async function main() {
  const signals = readJson(SIGNALS_PATH)
  const news = readJson(NEWS_PATH)

  if (!GEMINI_ENABLED || !GEMINI_API_KEY) {
    writeResult({
      ok: true,
      mode: 'deterministic-fallback',
      aiAttempted: false,
      aiUsed: false,
      reason: !GEMINI_ENABLED ? 'GEMINI_NEWS_ENRICHMENT=0' : 'GEMINI_API_KEY not configured',
      newsItemsConsidered: 0,
      newsJsonChanged: false,
    })
    console.log('[enrich-news] Gemini not configured; deterministic news pipeline remains active')
    return
  }

  const recentNews = [...news]
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
    .slice(0, MAX_NEWS_ITEMS)

  const brightData = await buildBrightDataContexts(recentNews)
  const input = {
    generatedAt: new Date().toISOString(),
    rules: {
      publicWrites: 'Only high-confidence signalIds may be added to news items. Never remove existing tags.',
      prohibited: 'No clinical guidance, case counts, risk levels, or source-of-record claims.',
    },
    signals: signalCatalog(signals),
    news: recentNews.map((item) => ({
      id: item.id,
      authority: item.authority,
      title: item.title,
      description: truncate(item.description, 300),
      link: item.link,
      host: normalizeHost(item.link),
      currentSignalIds: Array.isArray(item.signalIds) ? item.signalIds : [],
      brightDataContext: brightData.contexts.get(item.id) ?? null,
    })),
  }

  try {
    const raw = await callGemini(input)
    const validated = validateGeminiOutput(raw, recentNews, signals)
    const merge = mergeHighConfidenceTags(news, validated.items)

    if (merge.changed) {
      atomicWriteFileSync(NEWS_PATH, JSON.stringify(merge.nextNews, null, 2) + '\n')
    }

    writeResult({
      ok: true,
      mode: 'gemini-news-enrichment',
      aiAttempted: true,
      aiUsed: true,
      geminiModel: GEMINI_MODEL,
      newsItemsConsidered: recentNews.length,
      validatedItems: validated.items.length,
      highConfidenceItems: validated.items.filter((item) => item.confidence === 'high').length,
      newsJsonChanged: merge.changed,
      publicTagAdds: merge.publicTagAdds,
      brightData: {
        attempted: brightData.attempted,
        used: brightData.used,
        failures: brightData.failures,
      },
      queryExpansions: validated.queryExpansions,
      internalBrief: validated.internalBrief,
      items: validated.items,
    })
    console.log(`[enrich-news] Gemini enrichment OK - considered ${recentNews.length} items, added ${merge.publicTagAdds} public tag(s)`)
  } catch (error) {
    const failureClass = classifyGeminiFailure(error.message)
    writeResult({
      ok: true,
      mode: 'deterministic-fallback',
      aiAttempted: true,
      aiUsed: false,
      reason: error.message,
      failureClass,
      geminiModel: GEMINI_MODEL,
      newsItemsConsidered: recentNews.length,
      newsJsonChanged: false,
      brightData: {
        attempted: brightData.attempted,
        used: brightData.used,
        failures: brightData.failures,
      },
    })
    console.warn(`[enrich-news] Gemini enrichment unavailable (${failureClass}); deterministic news pipeline remains active: ${error.message}`)
  }
}

main().catch((error) => {
  writeResult({
    ok: true,
    mode: 'deterministic-fallback',
    aiAttempted: true,
    aiUsed: false,
    reason: error.message,
    newsJsonChanged: false,
  })
  console.warn(`[enrich-news] failed open to deterministic pipeline: ${error.message}`)
})
