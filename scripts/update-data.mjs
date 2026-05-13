/**
 * EMERGENZ Hantavirus Dashboard — Automated Data Update Script
 *
 * Runs every 12 hours via GitHub Actions.
 *
 * Cost controls:
 *   - Step 1 (RSS check) is FREE — plain HTTP, no APIs
 *   - Steps 2–3 (Bright Data + Gemini) only run when new relevant content is found
 *   - All new RSS content is bundled into ONE Gemini call per run
 *   - Input is capped at ~6000 chars; output at 800 tokens
 *   - During quiet periods (no new publications), cost = $0
 */

import { readFileSync, writeFileSync } from 'fs'
import { XMLParser } from 'fast-xml-parser'

const GEMINI_KEY = process.env.GEMINI_API_KEY
const BD_KEY = process.env.BRIGHT_DATA_API_KEY
const BD_ZONE = process.env.BRIGHT_DATA_ZONE || 'web_unlocker1'

const META_PATH      = 'src/data/meta.json'
const TIMELINE_PATH  = 'src/data/timeline.json'

// RSS feeds fetched for free — no Bright Data needed
const RSS_FEEDS = [
  { url: 'https://tools.cdc.gov/api/v2/resources/media/132608.rss', authority: 'CDC' },
  { url: 'https://www.who.int/feeds/entity/csr/don/en/rss.xml',     authority: 'WHO' },
  { url: 'https://www.ecdc.europa.eu/en/rss.xml',                    authority: 'ECDC' },
]

// Keywords to filter RSS items relevant to this outbreak
const RELEVANT_KEYWORDS = ['hanta', 'andes', 'hondius', 'andv', 'orthohantavirus']

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchRss(feed) {
  const res = await fetch(feed.url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: '__cdata' })
  const parsed = parser.parse(xml)
  const items = parsed?.rss?.channel?.item ?? []
  return Array.isArray(items) ? items : [items]
}

async function main() {
  const now = new Date().toISOString()
  const meta = JSON.parse(readFileSync(META_PATH, 'utf8'))
  const lastChecked = new Date(meta.lastChecked)

  console.log(`[update-data] Last checked: ${meta.lastChecked}`)

  // ─── Step 1: Fetch RSS feeds (FREE — no API cost) ───────────────────────────
  const newItems = []

  for (const feed of RSS_FEEDS) {
    try {
      const items = await fetchRss(feed)
      for (const item of items) {
        const title       = item.title?.__cdata ?? item.title ?? ''
        const description = item.description?.__cdata ?? item.description ?? ''
        const link        = item.link ?? ''
        const pubDate     = item.pubDate ?? ''

        // Skip items older than last check
        if (pubDate) {
          const d = new Date(pubDate)
          if (!isNaN(d.getTime()) && d <= lastChecked) continue
        }

        // Skip items not related to this outbreak
        const text = `${title} ${description}`.toLowerCase()
        if (!RELEVANT_KEYWORDS.some(kw => text.includes(kw))) continue

        newItems.push({ authority: feed.authority, title, description: stripHtml(description).slice(0, 400), link, pubDate })
      }
    } catch (e) {
      console.warn(`[update-data] RSS fetch failed (${feed.authority}):`, e.message)
    }
  }

  console.log(`[update-data] New relevant RSS items: ${newItems.length}`)

  // Always update lastChecked
  meta.lastChecked = now

  if (newItems.length === 0) {
    // Nothing new — zero API cost path
    writeFileSync(META_PATH, JSON.stringify(meta, null, 2))
    console.log('[update-data] No new content. Exiting without API calls.')
    return
  }

  // ─── Step 2: Bright Data — fetch CDC Situation Summary (ONE call) ───────────
  let cdcText = ''
  if (BD_KEY) {
    try {
      const bdRes = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${BD_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone: BD_ZONE,
          url: 'https://www.cdc.gov/hantavirus/situation-summary/index.html',
          format: 'raw',
        }),
        signal: AbortSignal.timeout(30000),
      })
      if (bdRes.ok) {
        cdcText = stripHtml(await bdRes.text()).slice(0, 2500)
        console.log('[update-data] CDC Situation Summary fetched.')
      }
    } catch (e) {
      console.warn('[update-data] Bright Data fetch failed:', e.message)
    }
  } else {
    console.warn('[update-data] BRIGHT_DATA_API_KEY not set — skipping CDC scrape.')
  }

  // ─── Step 3: Gemini — ONE call, extract everything ──────────────────────────
  if (!GEMINI_KEY) {
    console.warn('[update-data] GEMINI_API_KEY not set — skipping extraction.')
    writeFileSync(META_PATH, JSON.stringify(meta, null, 2))
    return
  }

  const existingTimeline = JSON.parse(readFileSync(TIMELINE_PATH, 'utf8'))
  const existingKeys = new Set(existingTimeline.map(e => `${e.date}::${e.title}`))

  const newItemsText = newItems
    .map(i => `[${i.authority}] ${i.title}\n${i.description}\nURL: ${i.link}\nDate: ${i.pubDate}`)
    .join('\n\n---\n\n')
    .slice(0, 4000)

  const prompt = `You are extracting structured data for a public health dashboard tracking the 2026 Andes hantavirus (MV Hondius) outbreak.

Return ONLY valid JSON — no markdown fences, no explanation, just the JSON object.

${cdcText ? `CDC Situation Summary (current):\n${cdcText}\n\n` : ''}New official publications since last check:
${newItemsText}

Current dashboard state for context:
- Confirmed+probable cases: ${meta.confirmed}
- Deaths: ${meta.deaths}
- Countries: ${meta.countries}
- US states monitoring: ${meta.usStatesMonitoring}
- WHO Global Risk: ${meta.whoGlobalRisk}
- CDC Response Level: ${meta.cdcResponseLevel}
- ECDC EU/EEA Risk: ${meta.ecdcRisk}
- Latest HCW alert date: ${meta.hcwAlert?.date ?? 'none'}

Extract and return this exact JSON structure:
{
  "caseStats": {
    "confirmed": <integer or null — only if explicitly stated and changed>,
    "deaths": <integer or null>,
    "countries": <integer or null>,
    "usStatesMonitoring": <integer or null>
  },
  "riskLevels": {
    "whoGlobalRisk": <"LOW"|"MODERATE"|"HIGH"|"VERY HIGH"|null — null if unchanged>,
    "cdcResponseLevel": <"Level 1"|"Level 2"|"Level 3"|null — null if unchanged>,
    "ecdcRisk": <"VERY LOW"|"LOW"|"MODERATE"|"HIGH"|null — null if unchanged>
  },
  "timelineEvents": [
    {
      "date": "YYYY-MM-DD",
      "title": "<10 words max, factual>",
      "description": "<one sentence, verbatim or close paraphrase from source>",
      "source": "<authority: WHO/CDC/ECDC/other>",
      "sourceUrl": "<direct URL>"
    }
  ],
  "hcwAlert": null or {
    "title": "<UPPERCASE — location and event type>",
    "content": "<2-3 sentences, factual, sourced>",
    "date": "YYYY-MM-DD",
    "sourceLabel": "<publication name>",
    "sourceUrl": "<direct URL>"
  }
}

Rules:
- Use null for any caseStats field you are not confident about. Do not guess.
- Only include timelineEvents that represent genuinely new developments not already captured.
- hcwAlert must be null unless there is a NEW healthcare worker exposure event after ${meta.hcwAlert?.date ?? '2026-05-12'}.
- Never fabricate numbers or events. Only extract what the sources explicitly state.`

  let extracted = null
  try {
    const gemRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 800 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    )
    if (gemRes.ok) {
      const gemData = await gemRes.json()
      const raw = gemData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      extracted = JSON.parse(cleaned)
      console.log('[update-data] Gemini extraction succeeded.')
    } else {
      console.warn('[update-data] Gemini API error:', gemRes.status)
    }
  } catch (e) {
    console.warn('[update-data] Gemini call failed:', e.message)
  }

  if (!extracted) {
    writeFileSync(META_PATH, JSON.stringify(meta, null, 2))
    return
  }

  let dataChanged = false

  // Apply case stats (integers only, sanity-checked)
  const cs = extracted.caseStats ?? {}
  for (const [key, val] of Object.entries(cs)) {
    if (typeof val === 'number' && Number.isInteger(val) && val > 0 && val !== meta[key]) {
      meta[key] = val
      dataChanged = true
      console.log(`[update-data] Updated ${key}: ${val}`)
    }
  }

  // Apply risk levels
  const rl = extracted.riskLevels ?? {}
  const riskMap = { whoGlobalRisk: 'whoGlobalRisk', cdcResponseLevel: 'cdcResponseLevel', ecdcRisk: 'ecdcRisk' }
  for (const [src, dest] of Object.entries(riskMap)) {
    if (rl[src] && rl[src] !== meta[dest]) {
      meta[dest] = rl[src]
      dataChanged = true
      console.log(`[update-data] Updated ${dest}: ${rl[src]}`)
    }
  }

  // Apply HCW alert (only if newer date)
  if (extracted.hcwAlert && extracted.hcwAlert.date) {
    const currentDate = meta.hcwAlert?.date ?? '1970-01-01'
    if (extracted.hcwAlert.date > currentDate) {
      meta.hcwAlert = extracted.hcwAlert
      dataChanged = true
      console.log(`[update-data] Updated HCW alert: ${extracted.hcwAlert.date}`)
    }
  }

  // Append new timeline events
  if (Array.isArray(extracted.timelineEvents) && extracted.timelineEvents.length > 0) {
    let added = 0
    for (const event of extracted.timelineEvents) {
      if (!event.date || !event.title) continue
      const key = `${event.date}::${event.title}`
      if (!existingKeys.has(key)) {
        existingTimeline.push(event)
        existingKeys.add(key)
        added++
        dataChanged = true
      }
    }
    if (added > 0) {
      existingTimeline.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0))
      writeFileSync(TIMELINE_PATH, JSON.stringify(existingTimeline, null, 2))
      console.log(`[update-data] Added ${added} new timeline event(s).`)
    }
  }

  if (dataChanged) {
    meta.lastUpdated = now
    meta.source = 'WHO / ECDC / CDC — auto-updated'
    console.log('[update-data] Data changed — lastUpdated set.')
  } else {
    console.log('[update-data] No data changes detected.')
  }

  writeFileSync(META_PATH, JSON.stringify(meta, null, 2))
  console.log('[update-data] Done.')
}

main().catch(e => {
  console.error('[update-data] Fatal error:', e)
  process.exit(1)
})
