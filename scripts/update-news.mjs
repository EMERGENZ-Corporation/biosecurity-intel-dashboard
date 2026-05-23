/**
 * EMERGENZ Biosecurity Intel Dashboard — News Feed Updater
 *
 * Runs every 6 hours via GitHub Actions.
 * Fetches RSS feeds from public health authorities and news outlets,
 * tags each item with matching signal IDs, deduplicates, and writes
 * src/data/news.json for the static SPA.
 *
 * No Gemini or external API keys required — pure RSS + keyword matching.
 */

import { createHash } from 'crypto'
import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from 'fs'

/**
 * Atomic write — write to a temp sibling file, fsync via rename. Protects against
 * the catastrophic case where a SIGKILL (workflow cancellation, OOM, runner
 * eviction) mid-write leaves a half-truncated `news.json`. The next run's
 * JSON.parse would silently fall back to `[]` and nuke 30 days of curated entries.
 * Rename is atomic on POSIX; falls back to write+delete on rare failure.
 */
function atomicWriteFileSync(path, content) {
  const tmp = `${path}.tmp.${process.pid}`
  writeFileSync(tmp, content)
  try {
    renameSync(tmp, path)
  } catch (error) {
    // Cleanup tmp file if rename failed, then re-throw
    if (existsSync(tmp)) {
      try { unlinkSync(tmp) } catch { /* best-effort */ }
    }
    throw error
  }
}
import { XMLParser } from 'fast-xml-parser'

const SIGNALS_PATH = 'src/data/signals.json'
const NEWS_PATH = 'src/data/news.json'
const RESULT_PATH = 'update-news-result.json'

// Bumped from 200 -> 500 so historical / authoritative items survive when
// per-signal Google News queries flood with same-day items. With ~16 signals
// × ~100 fresh items per run, the old 200 cap evicted everything older than
// 24 hours including curated CDC HAN / WHO DON / ECDC seeded entries.
const MAX_ITEMS = Number.parseInt(process.env.MAX_NEWS_ITEMS || '500', 10)
const MAX_AGE_DAYS = Number.parseInt(process.env.MAX_NEWS_AGE_DAYS || '30', 10)
const FETCH_TIMEOUT_MS = 12000
const NEWS_DESCRIPTION_MAX_CHARS = 280

// ---------------------------------------------------------------------------
// Per-signal keyword overrides.
// Keys match signal IDs in signals.json.
// Each value is an array of lowercase strings; any match in title/description
// causes that signal's ID to be added to the item's signalIds array.
// ---------------------------------------------------------------------------
const SIGNAL_KEYWORD_OVERRIDES = {
  'andes-hantavirus-mv-hondius-2026': [
    'hantavirus', 'andes virus', 'andes hantavirus', 'mv hondius', 'hondius',
    'andv', 'orthohantavirus', 'hantavirus pulmonary', 'hps',
  ],
  'ebola-bundibugyo-drc-2026': [
    'ebola', 'bundibugyo', 'ebolavirus', 'ebola drc', 'ebola uganda', 'evd',
    'ebola hemorrhagic', 'ebola outbreak',
  ],
  'measles-us-2026': [
    'measles', 'measles outbreak', 'rubeola', 'measles case', 'measles vaccination',
  ],
  'mpox-africa-clade-i-2026': [
    'mpox', 'monkeypox', 'clade i', 'clade 1b', 'mpox africa', 'mpox outbreak',
    'mpox clade',
  ],
  'avian-influenza-h5-2026': [
    'avian influenza', 'bird flu', 'h5n1', 'h5 influenza', 'h5nx', 'avian flu',
    'highly pathogenic avian', 'hpai', 'h5n2', 'h5n9',
  ],
  'cholera-africa-2026': [
    'cholera', 'vibrio cholerae', 'cholera outbreak', 'cholera africa',
  ],
  'seasonal-influenza-2026': [
    'influenza season', 'flu season', 'seasonal influenza', 'influenza a', 'influenza b',
  ],
  'covid-wastewater-2026': [
    'covid wastewater', 'sars-cov-2 wastewater', 'covid-19 wastewater',
    'covid surveillance wastewater', 'covid sewage',
  ],
  'norovirus-wastewater-2026': [
    'norovirus', 'norovirus wastewater', 'norovirus outbreak', 'norovirus surge',
  ],
  'rsv-wastewater-2026': [
    'rsv', 'respiratory syncytial', 'rsv wastewater', 'rsv season',
  ],
  'hmpv-wastewater-2026': [
    'metapneumovirus', 'hmpv', 'human metapneumovirus',
  ],
  'lassa-fever-2026': [
    'lassa fever', 'lassa virus', 'lassa outbreak', 'lassa mammarenavirus',
  ],
  'chikungunya-2026': [
    'chikungunya', 'chikv', 'chikungunya outbreak', 'chikungunya virus',
  ],
  'candida-auris-wastewater-2026': [
    'candida auris', 'c. auris', 'drug-resistant fungus', 'candida auris wastewater',
    'candida auris outbreak',
  ],
  'screwworm-onehealth-2026': [
    'screwworm', 'cochliomyia', 'new world screwworm', 'screwworm fly',
    'screwworm outbreak', 'screwworm us',
  ],
  'fifa-world-cup-2026-prep': [
    'world cup 2026', 'fifa 2026', 'mass gathering disease', 'world cup health',
    'world cup outbreak',
  ],
}

// Global health RSS feeds — fetched for every run.
// Direct authority/media feeds; per-signal Google News queries are built
// dynamically below and fill in coverage for outlets without working RSS.
//
// Validated 2026-05-22. Endpoints removed (returning 404/403/timeout):
//   WHO old news-releases.xml - replaced with live news-english.xml
//   ECDC old /en/rss.xml - replaced with live CDTR taxonomy feed
//   ProMED (promedmail.org/feed/) — coverage now via per-signal Google News
//   Eurosurveillance (eurosurveillance.org/rss/eurosurv.xml) — 403
//   PHAC (healthycanadians.gc.ca alerts feed) — domain deprecated
//   RKI (rki.de EN feed) — timeout / structure changed
//   AP News (apnews.com/rss/apf-Health) — RSS discontinued
//   CTV News (older URL) — feed restructured
const GLOBAL_FEEDS = [
  // Tier 1 — authoritative
  { url: 'https://tools.cdc.gov/api/v2/resources/media/132608.rss', authority: 'CDC', critical: true },
  { url: 'https://www.who.int/rss-feeds/news-english.xml', authority: 'WHO', critical: true },
  { url: 'https://www.ecdc.europa.eu/en/taxonomy/term/1505/feed', authority: 'ECDC', critical: true },

  // Tier 2 — institutional
  { url: 'https://www.gov.uk/government/organisations/uk-health-security-agency.atom', authority: 'UKHSA', critical: false },
  { url: 'https://www.science.org/rss/news_current.xml', authority: 'Science', critical: false },
  { url: 'https://www.cidrap.umn.edu/rss.xml', authority: 'CIDRAP', critical: false },
  // FDA: source is registered in signal-sources.json (Tier 1, 17 U.S.C. §105).
  // RSS feed URL could not be verified against a live endpoint as of 2026-05-22;
  // covered via per-signal Google News queries for countermeasure/EUA coverage.

  // Tier 3 — media
  { url: 'https://feeds.bbci.co.uk/news/health/rss.xml', authority: 'BBC Health', critical: false },
  { url: 'https://abcnews.go.com/abcnews/healthheadlines', authority: 'ABC News', critical: false },
  { url: 'https://feeds.npr.org/1128/rss.xml', authority: 'NPR', critical: false },
  { url: 'https://www.statnews.com/feed/', authority: 'STAT News', critical: false },
  { url: 'https://feeds.nbcnews.com/nbcnews/public/health', authority: 'NBC News', critical: false },
  { url: 'https://www.cbc.ca/webfeed/rss/rss-health', authority: 'CBC News', critical: false },
  { url: 'https://www.sciencenews.org/feed', authority: 'Science News', critical: false },
]

// Authority weight for deduplication tie-breaking (higher = preferred)
const AUTHORITY_WEIGHT = new Map([
  ['CDC', 100], ['WHO', 95], ['ECDC', 95],
  ['UKHSA', 80], ['CIDRAP', 78],
  ['Science', 70], ['STAT News', 60],
  ['BBC Health', 65], ['NBC News', 55], ['CBC News', 55],
  ['ABC News', 55], ['NPR', 55],
  ['Science News', 55],
  ['Google News', 25],
])

// Domains where the canonical article is behind a hard paywall — skip
const BLOCKED_DOMAINS = [
  'wired.com', 'bloomberg.com', 'nytimes.com', 'washingtonpost.com',
  'ft.com', 'theatlantic.com', 'thetimes.co.uk', 'telegraph.co.uk',
]

// ---------------------------------------------------------------------------
// Minimal async fetch with timeout
// ---------------------------------------------------------------------------
async function fetchText(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'EMERGENZ-Biosecurity-Intel/1.0 (+https://emergenz.us)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// RSS/Atom parser
// ---------------------------------------------------------------------------
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  cdataPropName: '__cdata',
})

function stripHtml(str = '') {
  return String(str)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

function truncateDescription(description = '') {
  const text = stripHtml(description)
  if (text.length <= NEWS_DESCRIPTION_MAX_CHARS) return text

  const limit = NEWS_DESCRIPTION_MAX_CHARS - 3
  const clipped = text.slice(0, limit).replace(/\s+\S*$/, '').trimEnd()
  return `${clipped || text.slice(0, limit).trimEnd()}...`
}

function normalizeNewsItem(item) {
  return {
    ...item,
    description: truncateDescription(item.description ?? ''),
  }
}

function extractText(node) {
  if (!node) return ''
  if (typeof node === 'string') return stripHtml(node)
  if (node.__cdata) return stripHtml(node.__cdata)
  if (node['#text']) return stripHtml(node['#text'])
  return ''
}

function extractLink(item) {
  if (item.link) {
    const raw = extractText(item.link)
    if (raw.startsWith('http')) return raw
    // Atom: link may be an object with @_href
    if (typeof item.link === 'object' && item.link['@_href']) return item.link['@_href']
    if (Array.isArray(item.link)) {
      const alt = item.link.find(l => l['@_rel'] === 'alternate' || !l['@_rel'])
      if (alt?.['@_href']) return alt['@_href']
    }
  }
  if (item.guid) {
    const g = extractText(item.guid)
    if (g.startsWith('http')) return g
  }
  return ''
}

function parseDate(raw) {
  if (!raw) return 0
  const t = Date.parse(raw)
  return Number.isFinite(t) ? t : 0
}

function parseFeed(xml, authority) {
  let parsed
  try { parsed = xmlParser.parse(xml) } catch { return [] }

  let items = []

  // RSS 2.0
  const channel = parsed?.rss?.channel
  if (channel) {
    const raw = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : []
    items = raw
  }

  // Atom
  const feed = parsed?.feed
  if (feed) {
    const raw = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : []
    items = raw
  }

  return items.map(item => {
    const title = extractText(item.title || item['title:encoded'] || '')
    const description = truncateDescription(extractText(item.description || item.summary || item.content || item['content:encoded'] || ''))
    const link = extractLink(item)
    const pubDate = extractText(item.pubDate || item.published || item.updated || '')
    const timestamp = parseDate(pubDate) || parseDate(item.pubDate) || parseDate(item.published) || 0

    // Stable ID: hash of normalized link (or title if no link)
    const idSource = link || title
    const id = authority.toLowerCase().replace(/\s+/g, '-') + '-' + createHash('md5').update(idSource).digest('hex').slice(0, 8)

    return { id, authority, title, description, link, pubDate: pubDate || new Date(timestamp).toISOString(), timestamp }
  }).filter(item => item.title && item.link)
}

// ---------------------------------------------------------------------------
// Signal tagging
// ---------------------------------------------------------------------------
function tagItem(item, signals) {
  const haystack = (item.title + ' ' + item.description).toLowerCase()
  const matched = new Set()

  for (const signal of signals) {
    const keywords = SIGNAL_KEYWORD_OVERRIDES[signal.id]
    if (!keywords) continue
    if (keywords.some(kw => haystack.includes(kw))) {
      matched.add(signal.id)
    }
  }

  return Array.from(matched)
}

// ---------------------------------------------------------------------------
// Blocked domain check
// ---------------------------------------------------------------------------
function isBlocked(link) {
  try {
    const host = new URL(link).hostname.replace(/^www\./, '')
    return BLOCKED_DOMAINS.some(d => host === d || host.endsWith('.' + d))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Build per-signal Google News RSS feeds
// ---------------------------------------------------------------------------
function buildSignalGoogleFeeds(signals) {
  const feeds = []
  for (const signal of signals) {
    if (signal.status !== 'active') continue
    const kws = SIGNAL_KEYWORD_OVERRIDES[signal.id]
    if (!kws || kws.length === 0) continue
    // Use the top 3 keywords in an OR query
    const query = kws.slice(0, 3).map(k => `"${k}"`).join(' OR ')
    const encoded = encodeURIComponent(query)
    feeds.push({
      url: `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`,
      authority: 'Google News',
      critical: false,
    })
  }
  return feeds
}

function writeResult(result) {
  atomicWriteFileSync(RESULT_PATH, JSON.stringify({
    checkedAt: new Date().toISOString(),
    ...result,
  }, null, 2) + '\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const signals = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8'))
  let existing = []
  // Distinguish "file doesn't exist (first run)" from "file exists but is corrupt".
  // A corrupt news.json (e.g. SIGKILL during a previous write) must NOT silently
  // be replaced with [] — that would nuke 30 days of curated entries. Atomic-write
  // protections above prevent this from happening going forward, but we still
  // refuse to nuke a corrupt file we encounter.
  if (existsSync(NEWS_PATH)) {
    try {
      existing = JSON.parse(readFileSync(NEWS_PATH, 'utf8'))
    } catch (error) {
      console.error(`[update-news] FATAL — ${NEWS_PATH} is corrupt and will not be overwritten:`)
      console.error(error.message)
      console.error('Fix: restore the most recent good news.json from git, or delete it explicitly to force a first-run.')
      process.exit(1)
    }
  }

  const activeSignalCount = signals.filter(signal => signal.status === 'active').length
  const allFeeds = [...GLOBAL_FEEDS, ...buildSignalGoogleFeeds(signals)]

  console.log(`[update-news] fetching ${allFeeds.length} feeds…`)

  const feedResults = await Promise.allSettled(
    allFeeds.map(async feed => {
      const xml = await fetchText(feed.url)
      const items = parseFeed(xml, feed.authority)
      console.log(`  ✓ ${feed.authority} (${feed.url.slice(0, 60)}) — ${items.length} items`)
      return items
    })
  )

  const criticalFailures = []
  const softFailures = []
  const fresh = []

  feedResults.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      fresh.push(...result.value)
    } else {
      const feed = allFeeds[i]
      console.warn(`  ✗ ${feed.authority} FAILED: ${result.reason?.message ?? result.reason}`)
      const failure = {
        authority: feed.authority,
        url: feed.url,
        reason: result.reason?.message ?? String(result.reason),
      }
      if (feed.critical) criticalFailures.push(failure)
      else softFailures.push(failure)
    }
  })

  if (activeSignalCount > 0 && criticalFailures.length > 0) {
    writeResult({
      ok: false,
      activeSignalCount,
      criticalFailures,
      softFailures,
      fetchedItems: fresh.length,
      wroteNewsJson: false,
    })
    console.error('[update-news] critical Tier 1 feed failure during active monitoring - writing no files')
    process.exit(1)
  }

  // Build a merged set: start from existing, layer in fresh
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  const byId = new Map()

  // Existing items first (they've already been reviewed)
  for (const item of existing) {
    if (item.timestamp >= cutoff) byId.set(item.id, normalizeNewsItem(item))
  }

  // Fresh items — deduplicate by ID, preferring higher-authority version
  for (const item of fresh) {
    if (!item.title || !item.link) continue
    if (isBlocked(item.link)) continue
    if (item.timestamp > 0 && item.timestamp < cutoff) continue

    // If we have a newer timestamp for this ID, keep the fresher one
    const existing_entry = byId.get(item.id)
    if (existing_entry) {
      const existW = AUTHORITY_WEIGHT.get(existing_entry.authority) ?? 10
      const newW = AUTHORITY_WEIGHT.get(item.authority) ?? 10
      if (newW <= existW) continue
    }

    // Tag with signal IDs
    const signalIds = tagItem(item, signals)
    byId.set(item.id, normalizeNewsItem({ ...item, signalIds }))
  }

  // Sort newest-first, cap at MAX_ITEMS
  const output = Array.from(byId.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_ITEMS)

  // Per CONTENT-STANDARDS.md §4.4: if the output is byte-identical to what's
  // already on disk, write nothing. Prevents spurious commits and Vercel
  // rebuilds when feeds return only items already in the dataset.
  const nextSerialized = JSON.stringify(output, null, 2) + '\n'
  let existingSerialized = ''
  try { existingSerialized = readFileSync(NEWS_PATH, 'utf8') } catch { /* first run */ }

  if (existingSerialized === nextSerialized) {
    writeResult({
      ok: true,
      activeSignalCount,
      criticalFailures,
      softFailures,
      fetchedItems: fresh.length,
      outputItems: output.length,
      wroteNewsJson: false,
    })
    console.log('[update-news] no change vs existing news.json — skipping write per CONTENT-STANDARDS §4.4')
    return
  }

  atomicWriteFileSync(NEWS_PATH, nextSerialized)
  writeResult({
    ok: true,
    activeSignalCount,
    criticalFailures,
    softFailures,
    fetchedItems: fresh.length,
    outputItems: output.length,
    wroteNewsJson: true,
  })

  const signalCoverage = signals.map(s => ({
    id: s.id,
    count: output.filter(item => item.signalIds.includes(s.id)).length,
  }))

  console.log(`[update-news] wrote ${output.length} items to ${NEWS_PATH}`)
  console.log('[update-news] signal coverage:')
  for (const { id, count } of signalCoverage) {
    if (count > 0) console.log(`  ${id}: ${count}`)
  }
}

main().catch(err => {
  console.error('[update-news] FATAL:', err)
  process.exit(1)
})
