/**
 * EMERGENZ Hantavirus Dashboard — Automated Data Update Script
 *
 * Runs every 12 hours via GitHub Actions.
 *
 * Bright Data usage (all conditional on new RSS items being found):
 *   Slot 1  — CDC Situation Summary (existing)
 *   Slots 2–6 — Blocked-domain article enrichment (Wired, Forbes, Reuters, etc.) — up to 4 articles/run
 *   Slots 7–8 — WHO DON page(s) when a new DON is detected in RSS
 *   Slots 9–12 — State DOH pages (NY, CA, TX, WA) for US monitoring count
 *   Max ~12 BD calls/triggered run · ~$0.036/triggered run · $5 credit ≈ 138 triggered runs
 *
 * Cost controls:
 *   - Step 1 (RSS) is FREE — plain HTTP, no APIs
 *   - All Bright Data + Gemini calls only run when new relevant RSS items are found
 *   - All Bright Data calls are parallelized with Promise.allSettled
 *   - Single Gemini call per run regardless of how many BD fetches complete
 *   - During quiet periods (no new publications), cost = $0
 */

import { readFileSync, writeFileSync } from 'fs'
import { XMLParser } from 'fast-xml-parser'

const GEMINI_KEY = process.env.GEMINI_API_KEY
const BD_KEY     = process.env.BRIGHT_DATA_API_KEY
const BD_ZONE    = process.env.BRIGHT_DATA_ZONE || 'web_unlocker1'

const META_PATH      = 'src/data/meta.json'
const TIMELINE_PATH  = 'src/data/timeline.json'
const NEWS_PATH      = 'src/data/news.json'
const PROTOCOLS_PATH = 'src/data/protocols.json'

// ─── Feed configuration ────────────────────────────────────────────────────────

const RSS_FEEDS = [
  // Official public health feeds
  { url: 'https://tools.cdc.gov/api/v2/resources/media/132608.rss',                 authority: 'CDC' },
  { url: 'https://www.who.int/feeds/entity/csr/don/en/rss.xml',                     authority: 'WHO' },
  { url: 'https://www.ecdc.europa.eu/en/rss.xml',                                   authority: 'ECDC' },
  // General media — filtered by RELEVANT_KEYWORDS
  { url: 'https://news.google.com/rss/search?q=hantavirus&hl=en-US&gl=US&ceid=US:en', authority: 'Google News' },
  { url: 'https://www.wired.com/feed/rss',                                           authority: 'Wired' },
  { url: 'https://feeds.reuters.com/reuters/healthNews',                             authority: 'Reuters' },
  { url: 'https://apnews.com/rss/apf-Health',                                        authority: 'AP News' },
  { url: 'https://www.statnews.com/feed/',                                           authority: 'STAT News' },
  { url: 'https://www.sciencenews.org/feed',                                         authority: 'Science News' },
  { url: 'https://hsph.harvard.edu/news/feed/',                                      authority: 'Harvard HSPH' },
]

// Keywords to filter RSS items relevant to this outbreak
const RELEVANT_KEYWORDS = ['hanta', 'andes', 'hondius', 'andv', 'orthohantavirus']

// Domains that block plain fetch — use Bright Data for article enrichment
const BLOCKED_DOMAINS = [
  'wired.com', 'forbes.com', 'reuters.com', 'bloomberg.com',
  'nytimes.com', 'washingtonpost.com', 'ft.com', 'theatlantic.com',
  'scientificamerican.com', 'thetimes.co.uk', 'telegraph.co.uk',
]

// State DOH pages for US monitoring count — Bright Data only, JS-rendered or bot-protected
const STATE_DOH_PAGES = [
  { url: 'https://www.health.ny.gov/diseases/communicable/hantavirus/',          state: 'NY' },
  { url: 'https://www.cdph.ca.gov/Programs/CID/DCDC/Pages/Hantavirus.aspx',     state: 'CA' },
  { url: 'https://www.dshs.texas.gov/infectious-disease/hantavirus',             state: 'TX' },
  { url: 'https://www.doh.wa.gov/YouandYourFamily/IllnessandDisease/Hantavirus', state: 'WA' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function brightDataFetch(url, label) {
  if (!BD_KEY) return ''
  try {
    const res = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${BD_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone: BD_ZONE, url, format: 'raw' }),
      signal: AbortSignal.timeout(30000),
    })
    if (res.ok) {
      const text = stripHtml(await res.text())
      console.log(`[update-data] BD fetched: ${label}`)
      return text
    }
    console.warn(`[update-data] BD HTTP ${res.status}: ${label}`)
    return ''
  } catch (e) {
    console.warn(`[update-data] BD failed (${label}):`, e.message)
    return ''
  }
}

function isBlockedDomain(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return BLOCKED_DOMAINS.some(d => host === d || host.endsWith('.' + d))
  } catch { return false }
}

function isWhoDon(item) {
  const text = `${item.title} ${item.link}`.toLowerCase()
  return item.authority === 'WHO' && (text.includes('don') || text.includes('disease-outbreak-news'))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const now = new Date().toISOString()
  const meta = JSON.parse(readFileSync(META_PATH, 'utf8'))
  const lastChecked = new Date(meta.lastChecked)

  console.log(`[update-data] Last checked: ${meta.lastChecked}`)

  // ─── Step 1: Fetch RSS feeds (FREE) ──────────────────────────────────────────
  const newItems = []

  for (const feed of RSS_FEEDS) {
    try {
      const items = await fetchRss(feed)
      for (const item of items) {
        const title       = item.title?.__cdata ?? item.title ?? ''
        const description = item.description?.__cdata ?? item.description ?? ''
        const link        = item.link ?? ''
        const pubDate     = item.pubDate ?? ''

        if (pubDate) {
          const d = new Date(pubDate)
          if (!isNaN(d.getTime()) && d <= lastChecked) continue
        }

        const text = `${title} ${description}`.toLowerCase()
        if (!RELEVANT_KEYWORDS.some(kw => text.includes(kw))) continue

        newItems.push({
          authority: feed.authority,
          title,
          description: stripHtml(description).slice(0, 400),
          link,
          pubDate,
        })
      }
    } catch (e) {
      console.warn(`[update-data] RSS fetch failed (${feed.authority}):`, e.message)
    }
  }

  console.log(`[update-data] New relevant RSS items: ${newItems.length}`)

  meta.lastChecked = now

  if (newItems.length === 0) {
    writeFileSync(META_PATH, JSON.stringify(meta, null, 2))
    console.log('[update-data] No new content. Exiting without API calls.')
    return
  }

  // ─── Step 2: Bright Data — parallel fetches ───────────────────────────────────
  // Slot 1: CDC Situation Summary (always)
  // Slots 2–5: up to 4 blocked-domain articles found in this run
  // Slots 6–7: WHO DON page(s) found in this run
  // Slots 8–11: State DOH pages

  let cdcText = ''
  const articleTexts = {}   // url → text (for news description enrichment)
  const donTexts = []       // [{url, text}] for case count extraction
  const stateTexts = []     // [{state, text}] for US monitoring count

  if (BD_KEY) {
    // Build parallel fetch list
    const bdTasks = []

    // Slot 1 — CDC Situation Summary
    bdTasks.push(
      brightDataFetch('https://www.cdc.gov/hantavirus/situation-summary/index.html', 'CDC Situation Summary')
        .then(t => { cdcText = t.slice(0, 2500) })
    )

    // Slots 2–5 — blocked-domain article enrichment (cap at 4)
    const blockedItems = newItems.filter(i => isBlockedDomain(i.link)).slice(0, 4)
    for (const item of blockedItems) {
      bdTasks.push(
        brightDataFetch(item.link, `article: ${item.title.slice(0, 60)}`)
          .then(t => { if (t) articleTexts[item.link] = t.slice(0, 1500) })
      )
    }

    // Slots 6–7 — WHO DON pages (cap at 2)
    const donItems = newItems.filter(isWhoDon).slice(0, 2)
    for (const item of donItems) {
      bdTasks.push(
        brightDataFetch(item.link, `WHO DON: ${item.title.slice(0, 60)}`)
          .then(t => { if (t) donTexts.push({ url: item.link, text: t.slice(0, 2000) }) })
      )
    }

    // Slots 8–11 — State DOH pages
    for (const page of STATE_DOH_PAGES) {
      bdTasks.push(
        brightDataFetch(page.url, `State DOH: ${page.state}`)
          .then(t => { if (t) stateTexts.push({ state: page.state, text: t.slice(0, 1000) }) })
      )
    }

    await Promise.allSettled(bdTasks)
    console.log(`[update-data] BD complete: ${Object.keys(articleTexts).length} articles enriched, ${donTexts.length} DONs fetched, ${stateTexts.length} state pages fetched`)
  } else {
    console.warn('[update-data] BRIGHT_DATA_API_KEY not set — skipping all BD fetches.')
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
    .slice(0, 3000)

  const articleEnrichmentText = Object.entries(articleTexts).length > 0
    ? '\n\nFull article text (use for newsDescriptions output):\n' +
      Object.entries(articleTexts)
        .map(([url, text]) => `URL: ${url}\n${text}`)
        .join('\n\n---\n\n')
    : ''

  const donText = donTexts.length > 0
    ? '\n\nWHO DON full page text (use for case count extraction):\n' +
      donTexts.map(d => `URL: ${d.url}\n${d.text}`).join('\n\n---\n\n')
    : ''

  const stateText = stateTexts.length > 0
    ? '\n\nState DOH pages (use to update usStatesMonitoring if an explicit count is found):\n' +
      stateTexts.map(s => `[${s.state}] ${s.text}`).join('\n\n---\n\n')
    : ''

  const prompt = `You are extracting structured data for a public health dashboard tracking the 2026 Andes hantavirus (MV Hondius) outbreak.

Return ONLY valid JSON — no markdown fences, no explanation, just the JSON object.

${cdcText ? `CDC Situation Summary (current):\n${cdcText}\n` : ''}${donText}${stateText}

New publications since last check:
${newItemsText}
${articleEnrichmentText}

Current dashboard state:
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
    "whoGlobalRisk": <"LOW"|"MODERATE"|"HIGH"|"VERY HIGH"|null>,
    "cdcResponseLevel": <"Level 1"|"Level 2"|"Level 3"|null>,
    "ecdcRisk": <"VERY LOW"|"LOW"|"MODERATE"|"HIGH"|null>
  },
  "timelineEvents": [
    {
      "date": "YYYY-MM-DD",
      "title": "<10 words max, factual>",
      "description": "<one sentence, verbatim or close paraphrase from source>",
      "source": "<authority>",
      "sourceUrl": "<direct URL>"
    }
  ],
  "hcwAlert": null or {
    "title": "<UPPERCASE — location and event type>",
    "content": "<2-3 sentences, factual, sourced>",
    "date": "YYYY-MM-DD",
    "sourceLabel": "<publication name>",
    "sourceUrl": "<direct URL>"
  },
  "newsDescriptions": {
    "<url>": "<2-3 sentence factual description drawn from full article text>"
  }
}

Rules:
- Use null for any caseStats field you are not confident about. Do not guess numbers.
- usStatesMonitoring: only update if a source explicitly states a new total count of US states monitoring.
- Only include timelineEvents that represent genuinely new developments.
- hcwAlert must be null unless there is a NEW HCW exposure event after ${meta.hcwAlert?.date ?? '2026-05-12'}.
- newsDescriptions: only include entries for URLs present in the "Full article text" section above. If no article text was provided, return an empty object {}.
- Never fabricate numbers or events. Only extract what sources explicitly state.`

  let extracted = null
  try {
    const gemRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1200 },
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

  // Apply case stats
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
  for (const [key, dest] of Object.entries({ whoGlobalRisk: 'whoGlobalRisk', cdcResponseLevel: 'cdcResponseLevel', ecdcRisk: 'ecdcRisk' })) {
    if (rl[key] && rl[key] !== meta[dest]) {
      meta[dest] = rl[key]
      dataChanged = true
      console.log(`[update-data] Updated ${dest}: ${rl[key]}`)
    }
  }

  // Apply HCW alert (only if newer date)
  if (extracted.hcwAlert?.date) {
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

  // ─── Update news.json ─────────────────────────────────────────────────────────
  const enrichedDescriptions = extracted.newsDescriptions ?? {}

  if (newItems.length > 0) {
    const existingNews = JSON.parse(readFileSync(NEWS_PATH, 'utf8'))
    const existingLinks = new Set(existingNews.map(n => n.link))
    let newsChanged = false

    for (const item of newItems) {
      if (!item.link || existingLinks.has(item.link)) continue
      const pubTs = item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
      // Use Gemini-enriched description if available, otherwise fall back to RSS snippet
      const description = enrichedDescriptions[item.link] || item.description
      existingNews.push({
        id: `rss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        authority: item.authority,
        title: item.title,
        description,
        link: item.link,
        pubDate: item.pubDate,
        timestamp: isNaN(pubTs) ? Date.now() : pubTs,
      })
      existingLinks.add(item.link)
      newsChanged = true
    }

    if (newsChanged) {
      existingNews.sort((a, b) => b.timestamp - a.timestamp)
      writeFileSync(NEWS_PATH, JSON.stringify(existingNews.slice(0, 50), null, 2))
      console.log('[update-data] Updated news.json.')
    }
  }

  console.log('[update-data] Done.')
}

main().catch(e => {
  console.error('[update-data] Fatal error:', e)
  process.exit(1)
})
