/**
 * EMERGENZ Hantavirus Dashboard - Automated Data Update Script
 *
 * Runs every 6 hours via GitHub Actions.
 * The dashboard is a static SPA; this script is the only autonomous data writer.
 *
 * Stability rules:
 * - Deduplicate RSS candidates before calling Gemini.
 * - Do not write dashboard JSON when Gemini is unavailable.
 * - Treat broken noncritical feeds as degraded, not fatal.
 * - Exit nonzero only for required-path failures that need human attention.
 */

import { readFileSync, writeFileSync } from 'fs'
import { XMLParser } from 'fast-xml-parser'

const GEMINI_KEY = process.env.GEMINI_API_KEY
const BD_KEY = process.env.BRIGHT_DATA_API_KEY
const BD_ZONE = process.env.BRIGHT_DATA_ZONE || 'web_unlocker1'

const META_PATH = 'src/data/meta.json'
const TIMELINE_PATH = 'src/data/timeline.json'
const NEWS_PATH = 'src/data/news.json'

const RSS_FEEDS = [
  { url: 'https://tools.cdc.gov/api/v2/resources/media/132608.rss', authority: 'CDC', critical: true },

  // WHO/ECDC RSS endpoints have been unreliable/404 as of May 2026. Keep them as
  // monitored feeds, but do not page on their RSS failures alone.
  { url: 'https://www.who.int/rss-feeds/news-releases.xml', authority: 'WHO', critical: false },
  { url: 'https://www.ecdc.europa.eu/en/rss.xml', authority: 'ECDC', critical: false },
  { url: 'https://promedmail.org/feed/', authority: 'ProMED', critical: false },
  { url: 'https://www.eurosurveillance.org/rss/eurosurv.xml', authority: 'Eurosurveillance', critical: false },
  { url: 'https://www.rivm.nl/en/rss.xml', authority: 'RIVM', critical: false },

  { url: 'https://news.google.com/rss/search?q=hantavirus&hl=en-US&gl=US&ceid=US:en', authority: 'Google News', critical: false },
  { url: 'https://news.google.com/rss/search?q=%22andes+virus%22+OR+%22MV+Hondius%22&hl=en-US&gl=US&ceid=US:en', authority: 'Google News', critical: false },
  { url: 'https://www.cbc.ca/cmlink/rss-health', authority: 'CBC News', critical: false },
  { url: 'https://www.ctvnews.ca/rss/ctvnews-ca-health-public-rss-1.844908', authority: 'CTV News', critical: false },

  { url: 'https://healthycanadians.gc.ca/connect-connectez/alerts-avis-rss-eng.xml', authority: 'PHAC', critical: false },
  { url: 'https://www.rki.de/EN/Content/Service/RSS/rss.xml', authority: 'RKI', critical: false },
  { url: 'https://www.gov.uk/government/organisations/uk-health-security-agency.atom', authority: 'UKHSA', critical: false },

  { url: 'https://feeds.npr.org/1128/rss.xml', authority: 'NPR', critical: false },
  { url: 'https://feeds.bbci.co.uk/news/health/rss.xml', authority: 'BBC Health', critical: false },
  { url: 'https://feeds.reuters.com/reuters/healthNews', authority: 'Reuters', critical: false },
  { url: 'https://apnews.com/rss/apf-Health', authority: 'AP News', critical: false },
  { url: 'https://abcnews.go.com/abcnews/healthheadlines', authority: 'ABC News', critical: false },

  { url: 'https://www.wired.com/feed/rss', authority: 'Wired', critical: false },
  { url: 'https://www.statnews.com/feed/', authority: 'STAT News', critical: false },
  { url: 'https://www.sciencenews.org/feed', authority: 'Science News', critical: false },
  { url: 'https://hsph.harvard.edu/news/feed/', authority: 'Harvard HSPH', critical: false },

  { url: 'https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss', authority: 'NEJM', critical: false },
  { url: 'https://www.thelancet.com/rssfeed/lancet_online.xml', authority: 'Lancet', critical: false },
  { url: 'https://www.nature.com/nm.rss', authority: 'Nature Medicine', critical: false },
  { url: 'https://www.science.org/rss/news_current.xml', authority: 'Science', critical: false },
]

const RELEVANT_KEYWORDS = [
  'hanta',
  'andes virus',
  'hondius',
  'andv',
  'orthohantavirus',
  'andes hantavirus',
]

const BLOCKED_DOMAINS = [
  'wired.com',
  'forbes.com',
  'reuters.com',
  'bloomberg.com',
  'nytimes.com',
  'washingtonpost.com',
  'ft.com',
  'theatlantic.com',
  'scientificamerican.com',
  'thetimes.co.uk',
  'telegraph.co.uk',
  'nejm.org',
  'thelancet.com',
  'nature.com',
  'science.org',
]

const STATE_DOH_PAGES = [
  { url: 'https://www.health.ny.gov/diseases/communicable/hantavirus/', state: 'NY' },
  { url: 'https://www.cdph.ca.gov/Programs/CID/DCDC/Pages/Hantavirus.aspx', state: 'CA' },
  { url: 'https://www.dshs.texas.gov/infectious-disease/hantavirus', state: 'TX' },
  { url: 'https://www.doh.wa.gov/YouandYourFamily/IllnessandDisease/Hantavirus', state: 'WA' },
]

function stripHtml(html = '') {
  return String(html)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function textValue(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    return value.__cdata ?? value['#text'] ?? value.href ?? ''
  }
  return ''
}

function linkValue(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const alternate = value.find((entry) => entry?.rel === 'alternate') ?? value[0]
    return linkValue(alternate)
  }
  if (typeof value === 'object') {
    return value.href ?? value['@_href'] ?? value['#text'] ?? ''
  }
  return ''
}

async function fetchRss(feed) {
  const res = await fetch(feed.url, {
    headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const xml = await res.text()
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    cdataPropName: '__cdata',
  })
  const parsed = parser.parse(xml)
  const rssItems = parsed?.rss?.channel?.item
  const atomEntries = parsed?.feed?.entry
  const items = rssItems ?? atomEntries ?? []
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
    if (!res.ok) {
      console.warn(`[update-data] BD HTTP ${res.status}: ${label}`)
      return ''
    }
    const text = stripHtml(await res.text())
    console.log(`[update-data] BD fetched: ${label}`)
    return text
  } catch (error) {
    console.warn(`[update-data] BD failed (${label}): ${error.message}`)
    return ''
  }
}

function isBlockedDomain(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return BLOCKED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

function isWhoDon(item) {
  const text = `${item.title} ${item.link}`.toLowerCase()
  return item.authority === 'WHO' && (text.includes('don') || text.includes('disease-outbreak-news'))
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))]
}

async function main() {
  const now = new Date().toISOString()
  const meta = JSON.parse(readFileSync(META_PATH, 'utf8'))
  const existingTimeline = JSON.parse(readFileSync(TIMELINE_PATH, 'utf8'))
  const existingNews = JSON.parse(readFileSync(NEWS_PATH, 'utf8'))
  const existingTimelineKeys = new Set(existingTimeline.map((event) => `${event.date}::${event.title}`))
  const existingNewsLinks = new Set(existingNews.map((item) => item.link).filter(Boolean))

  const lookbackMs = 72 * 60 * 60 * 1000
  const cutoff = new Date(Date.now() - lookbackMs)

  console.log(`[update-data] Run: ${now}`)
  console.log(`[update-data] Lookback cutoff: ${cutoff.toISOString()} (72h sliding window)`)
  console.log(`[update-data] BD key: ${BD_KEY ? 'SET' : 'NOT SET'} | Zone: ${BD_ZONE}`)
  console.log(`[update-data] Gemini key: ${GEMINI_KEY ? 'SET' : 'NOT SET'}`)
  console.log(`[update-data] RSS feeds: ${RSS_FEEDS.length}`)

  const candidateItems = []
  const failedFeeds = []
  const failedCriticalFeeds = []

  for (const feed of RSS_FEEDS) {
    try {
      const items = await fetchRss(feed)
      for (const item of items) {
        const title = textValue(item.title)
        const description = textValue(item.description ?? item.summary ?? item.content)
        const link = linkValue(item.link ?? item.id)
        const pubDate = textValue(item.pubDate ?? item.published ?? item.updated ?? item['dc:date'])

        if (pubDate) {
          const date = new Date(pubDate)
          if (!isNaN(date.getTime()) && date < cutoff) continue
        }

        const searchable = `${title} ${description}`.toLowerCase()
        if (!RELEVANT_KEYWORDS.some((keyword) => searchable.includes(keyword))) continue

        candidateItems.push({
          authority: feed.authority,
          title,
          description: stripHtml(description).slice(0, 400),
          link,
          pubDate,
        })
      }
    } catch (error) {
      console.warn(`[update-data] RSS FEED FAILURE (${feed.authority} - ${feed.url}): ${error.message}`)
      failedFeeds.push(feed.authority)
      if (feed.critical) failedCriticalFeeds.push(feed.authority)
    }
  }

  const seenRunItems = new Set()
  const newItems = candidateItems.filter((item) => {
    const key = item.link || `${item.authority}::${item.title}::${item.pubDate}`
    if (seenRunItems.has(key)) return false
    seenRunItems.add(key)
    return !item.link || !existingNewsLinks.has(item.link)
  })

  console.log(`[update-data] Relevant RSS candidates: ${candidateItems.length}`)
  console.log(`[update-data] New relevant RSS items after dedupe: ${newItems.length}`)

  if (failedFeeds.length > 0) {
    console.warn(`[update-data] Feed failures: ${uniqueValues(failedFeeds).join(', ')}`)
  }

  const criticalFailures = uniqueValues(failedCriticalFeeds)
  if (criticalFailures.length > 0 && (meta.confirmed ?? 0) > 0) {
    console.error(`[update-data] CRITICAL: Required feed failures during active outbreak: ${criticalFailures.join(', ')}`)
    process.exit(1)
  }

  if (newItems.length === 0) {
    if ((meta.confirmed ?? 0) > 0 && candidateItems.length === 0) {
      console.warn('[update-data] ANOMALY: Active outbreak but no relevant RSS candidates found.')
    }
    console.log('[update-data] No new deduped items. Exiting without writing files.')
    return
  }

  let cdcText = ''
  const articleTexts = {}
  const donTexts = []
  const stateTexts = []

  if (BD_KEY) {
    const bdTasks = []

    bdTasks.push(
      brightDataFetch('https://www.cdc.gov/hantavirus/situation-summary/index.html', 'CDC Situation Summary')
        .then((text) => { cdcText = text.slice(0, 2500) })
    )

    for (const item of newItems.filter((entry) => isBlockedDomain(entry.link)).slice(0, 4)) {
      bdTasks.push(
        brightDataFetch(item.link, `article: ${item.title.slice(0, 60)}`)
          .then((text) => { if (text) articleTexts[item.link] = text.slice(0, 1500) })
      )
    }

    for (const item of newItems.filter(isWhoDon).slice(0, 2)) {
      bdTasks.push(
        brightDataFetch(item.link, `WHO DON: ${item.title.slice(0, 60)}`)
          .then((text) => { if (text) donTexts.push({ url: item.link, text: text.slice(0, 2000) }) })
      )
    }

    for (const page of STATE_DOH_PAGES) {
      bdTasks.push(
        brightDataFetch(page.url, `State DOH: ${page.state}`)
          .then((text) => { if (text) stateTexts.push({ state: page.state, text: text.slice(0, 1000) }) })
      )
    }

    await Promise.allSettled(bdTasks)
    console.log(`[update-data] BD complete: ${Object.keys(articleTexts).length} articles enriched, ${donTexts.length} DONs fetched, ${stateTexts.length} state pages fetched`)
  } else {
    console.warn('[update-data] BRIGHT_DATA_API_KEY not set - skipping BD enrichment.')
  }

  if (!GEMINI_KEY) {
    console.error('[update-data] GEMINI_API_KEY not set - cannot extract new outbreak data.')
    process.exit(1)
  }

  const newItemsText = newItems
    .map((item) => `[${item.authority}] ${item.title}\n${item.description}\nURL: ${item.link}\nDate: ${item.pubDate}`)
    .join('\n\n---\n\n')
    .slice(0, 3000)

  const articleEnrichmentText = Object.entries(articleTexts).length > 0
    ? `\n\nFull article text (use for newsDescriptions output):\n${Object.entries(articleTexts)
      .map(([url, text]) => `URL: ${url}\n${text}`)
      .join('\n\n---\n\n')}`
    : ''

  const donText = donTexts.length > 0
    ? `\n\nWHO DON full page text (use for case count extraction):\n${donTexts
      .map((don) => `URL: ${don.url}\n${don.text}`)
      .join('\n\n---\n\n')}`
    : ''

  const stateText = stateTexts.length > 0
    ? `\n\nState DOH pages (use to update usStatesMonitoring if an explicit count is found):\n${stateTexts
      .map((state) => `[${state.state}] ${state.text}`)
      .join('\n\n---\n\n')}`
    : ''

  const prompt = `You are extracting structured data for a public health dashboard tracking the 2026 Andes hantavirus (MV Hondius) outbreak.

Return ONLY valid JSON. No markdown fences, no explanation, just the JSON object.

${cdcText ? `CDC Situation Summary (current):\n${cdcText}\n` : ''}${donText}${stateText}

New publications:
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
    "confirmed": <integer or null>,
    "deaths": <integer or null>,
    "countries": <integer or null>,
    "usStatesMonitoring": <integer or null>
  },
  "riskLevels": {
    "whoGlobalRisk": <"LOW"|"MODERATE"|"HIGH"|"VERY HIGH"|null>,
    "ecdcRisk": <"VERY LOW"|"LOW"|"MODERATE"|"HIGH"|null>
  },
  "timelineEvents": [
    {
      "id": "<t-YYYYMMDD-slugified-title>",
      "date": "YYYY-MM-DD",
      "title": "<10 words max, factual>",
      "description": "<one sentence, factual, sourced>",
      "source": "<authority name>",
      "sourceUrl": "<direct URL>",
      "category": "<WHO|CDC|ECDC|other>"
    }
  ],
  "hcwAlert": null or {
    "title": "<UPPERCASE location and event type>",
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
- Every timelineEvent must include id, date, title, description, source, sourceUrl, and category.
- category must be exactly one of: WHO, CDC, ECDC, other.
- hcwAlert must be null unless there is a new HCW exposure event after ${meta.hcwAlert?.date ?? '2026-05-12'}.
- newsDescriptions: only include entries for URLs present in the full article text section.
- Never fabricate numbers or events.`

  let extracted = null
  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries && !extracted; attempt++) {
    try {
      if (attempt > 1) {
        const delayMs = attempt * 3000
        console.log(`[update-data] Gemini retry ${attempt}/${maxRetries} in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }

      const geminiResponse = await fetch(
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

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json()
        const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
        extracted = JSON.parse(cleaned)
        console.log(`[update-data] Gemini extraction succeeded (attempt ${attempt}).`)
      } else if (geminiResponse.status === 429 || geminiResponse.status >= 500) {
        console.warn(`[update-data] Gemini retryable error ${geminiResponse.status} (attempt ${attempt}/${maxRetries})`)
      } else {
        console.error(`[update-data] Gemini non-retryable error ${geminiResponse.status}.`)
        process.exit(1)
      }
    } catch (error) {
      console.warn(`[update-data] Gemini attempt ${attempt} failed: ${error.message}`)
    }
  }

  if (!extracted) {
    console.warn('[update-data] Gemini extraction unavailable - exiting without writing files.')
    return
  }

  let dataChanged = false

  const caseStats = extracted.caseStats ?? {}
  for (const [key, value] of Object.entries(caseStats)) {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0 && value !== meta[key]) {
      meta[key] = value
      dataChanged = true
      console.log(`[update-data] Updated ${key}: ${value}`)
    }
  }

  const riskLevels = extracted.riskLevels ?? {}
  for (const [key, destination] of Object.entries({ whoGlobalRisk: 'whoGlobalRisk', ecdcRisk: 'ecdcRisk' })) {
    if (riskLevels[key] && riskLevels[key] !== meta[destination]) {
      meta[destination] = riskLevels[key]
      dataChanged = true
      console.log(`[update-data] Updated ${destination}: ${riskLevels[key]}`)
    }
  }

  if (extracted.hcwAlert?.date) {
    const currentDate = meta.hcwAlert?.date ?? '1970-01-01'
    if (extracted.hcwAlert.date > currentDate) {
      meta.hcwAlert = extracted.hcwAlert
      dataChanged = true
      console.log(`[update-data] Updated HCW alert: ${extracted.hcwAlert.date}`)
    }
  }

  const validCategories = new Set(['WHO', 'CDC', 'ECDC', 'other'])
  if (Array.isArray(extracted.timelineEvents)) {
    let added = 0
    for (const event of extracted.timelineEvents) {
      if (!event.date || !event.title) continue
      const key = `${event.date}::${event.title}`
      if (existingTimelineKeys.has(key)) continue

      existingTimeline.push({
        ...event,
        id: event.id || `t-${event.date.replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7)}`,
        category: validCategories.has(event.category) ? event.category : 'other',
      })
      existingTimelineKeys.add(key)
      added++
      dataChanged = true
    }

    if (added > 0) {
      existingTimeline.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0))
      writeFileSync(TIMELINE_PATH, JSON.stringify(existingTimeline, null, 2))
      console.log(`[update-data] Added ${added} new timeline event(s).`)
    }
  }

  meta.lastChecked = now
  meta.feedHealth = {
    lastRun: now,
    failedFeeds: uniqueValues(failedFeeds),
    itemsFound: newItems.length,
    candidateItemsFound: candidateItems.length,
  }

  if (dataChanged) {
    meta.lastUpdated = now
    console.log('[update-data] Data changed - lastUpdated set.')
  } else {
    console.log('[update-data] No structured data changes detected.')
  }

  writeFileSync(META_PATH, JSON.stringify(meta, null, 2))

  const enrichedDescriptions = extracted.newsDescriptions ?? {}
  let newsChanged = false

  for (const item of newItems) {
    if (!item.link || existingNewsLinks.has(item.link)) continue
    const pubTimestamp = item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
    existingNews.push({
      id: `rss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      authority: item.authority,
      title: item.title,
      description: enrichedDescriptions[item.link] || item.description,
      link: item.link,
      pubDate: item.pubDate,
      timestamp: isNaN(pubTimestamp) ? Date.now() : pubTimestamp,
    })
    existingNewsLinks.add(item.link)
    newsChanged = true
  }

  if (newsChanged) {
    existingNews.sort((a, b) => b.timestamp - a.timestamp)
    writeFileSync(NEWS_PATH, JSON.stringify(existingNews.slice(0, 50), null, 2))
    console.log('[update-data] Updated news.json.')
  }

  console.log('[update-data] Done.')
}

main().catch((error) => {
  console.error('[update-data] Fatal error:', error)
  process.exit(1)
})
