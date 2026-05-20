/**
 * EMERGENZ Biosecurity Intel Dashboard - Automated Data Update Script
 *
 * Runs every 6 hours via GitHub Actions.
 * The dashboard is a static SPA; this script is the only autonomous data writer.
 *
 * Stability rules:
 * - Deduplicate RSS candidates before calling Gemini.
 * - Fall back to capped, source-backed RSS news updates when Gemini is unavailable.
 * - Treat broken noncritical feeds as degraded, not fatal.
 * - Exit nonzero only for required-path failures that need human attention.
 */

import { createHash } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { XMLParser } from 'fast-xml-parser'

const GEMINI_KEY = process.env.GEMINI_API_KEY
const BD_KEY = process.env.BRIGHT_DATA_API_KEY
const BD_ZONE = process.env.BRIGHT_DATA_ZONE || 'web_unlocker1'

const META_PATH = 'src/data/meta.json'
const TIMELINE_PATH = 'src/data/timeline.json'
const NEWS_PATH = 'src/data/news.json'
const MANUAL_OVERRIDES_PATH = 'src/data/manual-overrides.json'
const STATUS_PATH = 'public/status.json'
const MAX_DATA_AGE_HOURS = Number.parseInt(process.env.MAX_DATA_AGE_HOURS || '48', 10)
const MAX_OFFICIAL_CHECK_AGE_HOURS = Number.parseInt(process.env.MAX_OFFICIAL_CHECK_AGE_HOURS || '12', 10)

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

const STRONG_OUTBREAK_KEYWORDS = [
  'andes virus',
  'andes hantavirus',
  'mv hondius',
  'hondius',
  'andv',
  'orthohantavirus',
]

const FALLBACK_AUTHORITY_WEIGHT = new Map([
  ['CDC', 100],
  ['WHO', 95],
  ['ECDC', 95],
  ['PHAC', 90],
  ['UKHSA', 80],
  ['ProMED', 75],
  ['AP News', 70],
  ['Reuters', 70],
  ['ABC News', 60],
  ['BBC Health', 60],
  ['CBC News', 60],
  ['NPR', 55],
  ['STAT News', 55],
  ['Google News', 25],
])

const FALLBACK_NEWS_LIMIT = Number.parseInt(process.env.FALLBACK_NEWS_LIMIT || '8', 10)
const FALLBACK_GOOGLE_NEWS_LIMIT = Number.parseInt(process.env.FALLBACK_GOOGLE_NEWS_LIMIT || '0', 10)

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

const OFFICIAL_SOURCE_PAGES = [
  {
    id: 'cdc-situation-summary',
    authority: 'CDC',
    label: 'CDC Situation Summary',
    url: 'https://www.cdc.gov/hantavirus/situation-summary/index.html',
    critical: true,
    parser: parseCdcSituation,
  },
  {
    id: 'ecdc-surveillance',
    authority: 'ECDC',
    label: 'ECDC Surveillance Update',
    url: 'https://www.ecdc.europa.eu/en/infectious-disease-topics/hantavirus-infection/surveillance-and-updates/andes-hantavirus-outbreak',
    critical: true,
    parser: parseEcdcSurveillance,
  },
  {
    id: 'who-rra-v2',
    authority: 'WHO',
    label: 'WHO Rapid Risk Assessment v2',
    url: 'https://www.who.int/publications/m/item/who-rapid-risk-assessment---hantavirus-outbreak-caused-by-andes-virus--global-v.2',
    critical: false,
    parser: parseWhoAssessment,
  },
  {
    id: 'phac-media-update',
    authority: 'PHAC',
    label: 'PHAC Media Update',
    url: 'https://www.canada.ca/en/public-health/news/2026/05/media-update-on-andes-hantavirus-situation1.html',
    critical: false,
    parser: parsePhacUpdate,
  },
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

async function fetchOfficialPage(page) {
  try {
    const res = await fetch(page.url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml,text/plain,*/*',
        'User-Agent': 'EMERGENZ-Hantavirus-Dashboard/1.0 (+https://emergenzsystems.org)',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { status: 'ok', text: stripHtml(await res.text()), transport: 'direct' }
  } catch (error) {
    if (!BD_KEY) return { status: 'failed', text: '', error: error.message, transport: 'direct' }

    const text = await brightDataFetch(page.url, page.label)
    if (text) return { status: 'ok', text, transport: 'bright-data' }
    return { status: 'failed', text: '', error: error.message, transport: 'bright-data' }
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

function sha256(text) {
  return createHash('sha256').update(text).digest('hex')
}

function normalizeRisk(value) {
  if (!value) return null
  const text = value.toUpperCase().replace(/\s+/g, ' ').trim()
  if (text.includes('VERY LOW')) return 'VERY LOW'
  if (text.includes('VERY HIGH')) return 'VERY HIGH'
  if (text.includes('MODERATE')) return 'MODERATE'
  if (text.includes('HIGH')) return 'HIGH'
  if (text.includes('LOW')) return 'LOW'
  return null
}

export function parseEcdcSurveillance(text) {
  const extraction = { caseStats: {}, riskLevels: {}, facts: [] }
  const caseMatch = text.match(/(?:total of\s*)?(\d+)\s+cases? has been reported,\s*including\s*(\d+)\s+confirmed\s+and\s+(\d+)\s+probable cases/i)
    ?? text.match(/(\d+)\s+confirmed cases?,\s*(\d+)\s+probable cases?,\s*(\d+)\s+suspected cases?,?\s*(?:and\s*)?(\d+)\s+(?:number of\s+)?deaths/i)
    ?? text.match(/confirmed cases?\s+(\d+)\s+probable cases?\s+(\d+)\s+suspected cases?\s+(\d+)\s+number of deaths\s+(\d+)/i)

  if (caseMatch) {
    if (caseMatch[0].toLowerCase().includes('total of')) {
      const totalCases = Number.parseInt(caseMatch[1], 10)
      const confirmed = Number.parseInt(caseMatch[2], 10)
      const probable = Number.parseInt(caseMatch[3], 10)
      extraction.caseStats.confirmed = totalCases
      extraction.facts.push(`${confirmed} confirmed, ${probable} probable, ${totalCases} total reported cases`)
    } else if (caseMatch[0].toLowerCase().includes('confirmed cases')) {
      const confirmed = Number.parseInt(caseMatch[1], 10)
      const probable = Number.parseInt(caseMatch[2], 10)
      const suspected = Number.parseInt(caseMatch[3], 10)
      const deaths = Number.parseInt(caseMatch[4], 10)
      extraction.caseStats.confirmed = confirmed + probable
      extraction.caseStats.deaths = deaths
      extraction.facts.push(`${confirmed} confirmed, ${probable} probable, ${suspected} suspected, ${deaths} deaths`)
    } else {
      const confirmed = Number.parseInt(caseMatch[1], 10)
      const probable = Number.parseInt(caseMatch[2], 10)
      const suspected = Number.parseInt(caseMatch[3], 10)
      const deaths = Number.parseInt(caseMatch[4], 10)
      extraction.caseStats.confirmed = confirmed + probable
      extraction.caseStats.deaths = deaths
      extraction.facts.push(`${confirmed} confirmed, ${probable} probable, ${suspected} suspected, ${deaths} deaths`)
    }
  }

  const deathsMatch = text.match(/Number of deaths\s+(\d+)/i) ?? text.match(/(\d+)\s+deaths/i)
  if (deathsMatch) extraction.caseStats.deaths = Number.parseInt(deathsMatch[1], 10)

  const riskMatch = text.match(/risk(?:\s+to\s+the\s+EU\/EEA\s+general\s+population)?(?:\s+is|\s+remains)?\s+(very low|low|moderate|high)/i)
  const ecdcRisk = normalizeRisk(riskMatch?.[1])
  if (ecdcRisk) extraction.riskLevels.ecdcRisk = ecdcRisk

  return extraction
}

export function parseWhoAssessment(text) {
  const extraction = { caseStats: {}, riskLevels: {}, facts: [] }
  const riskMatch = text.match(/(?:global|overall)\s+(?:public health\s+)?risk(?:\s+is|\s+remains|\s+as)?\s+(low|moderate|high|very high)/i)
  const whoGlobalRisk = normalizeRisk(riskMatch?.[1])
  if (whoGlobalRisk) extraction.riskLevels.whoGlobalRisk = whoGlobalRisk
  return extraction
}

export function parseCdcSituation(text) {
  const extraction = { caseStats: {}, riskLevels: {}, facts: [] }
  const monitoringMatch = text.match(/(\d+)\s+(?:U\.S\.\s+)?states?\s+(?:are\s+)?(?:monitoring|with\s+persons?\s+being\s+monitored)/i)
  if (monitoringMatch) extraction.caseStats.usStatesMonitoring = Number.parseInt(monitoringMatch[1], 10)
  if (/HAN\s*528/i.test(text)) extraction.riskLevels.cdcResponseLevel = 'HAN 528'
  return extraction
}

export function parsePhacUpdate(text) {
  const extraction = { caseStats: {}, riskLevels: {}, facts: [] }
  if (/one\s+(?:former\s+)?passenger[\s\S]{0,160}tested positive/i.test(text) || /one[\s\S]{0,160}positive for Andes hantavirus/i.test(text)) {
    extraction.facts.push('PHAC confirms one Canadian case linked to MV Hondius')
  }
  return extraction
}

async function checkOfficialSources(meta, now) {
  const previousSources = new Map((meta.officialSources ?? []).map((source) => [source.id, source]))
  const sourceHealth = []
  const extractions = []

  for (const page of OFFICIAL_SOURCE_PAGES) {
    const fetched = await fetchOfficialPage(page)
    const previous = previousSources.get(page.id)
    const record = {
      id: page.id,
      authority: page.authority,
      label: page.label,
      url: page.url,
      critical: page.critical,
      status: fetched.status,
      lastChecked: now,
      lastChanged: previous?.lastChanged ?? now,
      hash: previous?.hash ?? null,
      transport: fetched.transport,
    }

    if (fetched.status === 'ok') {
      const hash = sha256(fetched.text)
      record.hash = hash
      record.lastChanged = previous?.hash === hash ? previous?.lastChanged ?? now : now

      const extracted = page.parser(fetched.text)
      sourceHealth.push({ ...record, extracted })
      extractions.push({ page, extracted })
    } else {
      record.error = fetched.error
      sourceHealth.push(record)
    }
  }

  return { sourceHealth, extractions }
}

function applyOfficialExtractions(meta, extractions) {
  let changed = false
  const provenance = { ...(meta.metricProvenance ?? {}) }

  function applyMetric(key, value, source) {
    if (!Number.isInteger(value) || value < 0) return
    if (key === 'deaths' && value > (meta.confirmed ?? value)) return
    if (key !== 'deaths' && key !== 'confirmed' && value === 0) return
    if (meta[key] !== value) {
      meta[key] = value
      changed = true
      console.log(`[update-data] Official parser updated ${key}: ${value}`)
    }
    provenance[key] = {
      source: source.page.authority,
      sourceLabel: source.page.label,
      sourceUrl: source.page.url,
      method: 'official-parser',
      lastVerified: new Date().toISOString(),
    }
  }

  function applyRisk(key, value, source) {
    if (!value) return
    if (meta[key] !== value) {
      meta[key] = value
      changed = true
      console.log(`[update-data] Official parser updated ${key}: ${value}`)
    }
    provenance[key] = {
      source: source.page.authority,
      sourceLabel: source.page.label,
      sourceUrl: source.page.url,
      method: 'official-parser',
      lastVerified: new Date().toISOString(),
    }
  }

  const ecdc = extractions.find((entry) => entry.page.id === 'ecdc-surveillance')
  if (ecdc) {
    applyMetric('confirmed', ecdc.extracted.caseStats.confirmed, ecdc)
    applyMetric('deaths', ecdc.extracted.caseStats.deaths, ecdc)
    applyRisk('ecdcRisk', ecdc.extracted.riskLevels.ecdcRisk, ecdc)
  }

  const cdc = extractions.find((entry) => entry.page.id === 'cdc-situation-summary')
  if (cdc) {
    applyMetric('usStatesMonitoring', cdc.extracted.caseStats.usStatesMonitoring, cdc)
    applyRisk('cdcResponseLevel', cdc.extracted.riskLevels.cdcResponseLevel, cdc)
  }

  const who = extractions.find((entry) => entry.page.id === 'who-rra-v2')
  if (who) applyRisk('whoGlobalRisk', who.extracted.riskLevels.whoGlobalRisk, who)

  meta.metricProvenance = provenance
  return changed
}

function readManualOverrides(now) {
  try {
    const overrides = JSON.parse(readFileSync(MANUAL_OVERRIDES_PATH, 'utf8'))
    if (!overrides.enabled) return null
    if (overrides.expiresAt && new Date(overrides.expiresAt) < new Date(now)) {
      console.warn(`[update-data] Manual overrides expired at ${overrides.expiresAt}; ignoring.`)
      return null
    }
    return overrides
  } catch (error) {
    console.warn(`[update-data] Manual overrides unavailable: ${error.message}`)
    return null
  }
}

function applyManualOverrides(meta, overrides, now) {
  if (!overrides) return false

  let changed = false
  const provenance = { ...(meta.metricProvenance ?? {}) }

  for (const [key, value] of Object.entries(overrides.metrics ?? {})) {
    if (!['confirmed', 'deaths', 'countries', 'usStatesMonitoring'].includes(key)) continue
    if (!Number.isInteger(value) || value < 0) continue
    if (key === 'deaths' && value > (meta.confirmed ?? value)) continue
    if (meta[key] !== value) {
      meta[key] = value
      changed = true
      console.log(`[update-data] Manual override applied ${key}: ${value}`)
    }
    provenance[key] = {
      source: 'manual',
      sourceLabel: 'Manual override',
      sourceUrl: overrides.sourceUrl ?? meta.metricProvenance?.[key]?.sourceUrl ?? meta.ecdcRiskUrl,
      method: 'manual-override',
      lastVerified: now,
    }
  }

  for (const [key, value] of Object.entries(overrides.riskLevels ?? {})) {
    if (!['whoGlobalRisk', 'ecdcRisk', 'cdcResponseLevel'].includes(key) || !value) continue
    if (meta[key] !== value) {
      meta[key] = value
      changed = true
      console.log(`[update-data] Manual override applied ${key}: ${value}`)
    }
    provenance[key] = {
      source: 'manual',
      sourceLabel: 'Manual override',
      sourceUrl: overrides.sourceUrl ?? meta.metricProvenance?.[key]?.sourceUrl ?? meta.ecdcRiskUrl,
      method: 'manual-override',
      lastVerified: now,
    }
  }

  if (overrides.hcwAlert) {
    meta.hcwAlert = overrides.hcwAlert
    changed = true
    console.log('[update-data] Manual override applied hcwAlert.')
  }

  meta.metricProvenance = provenance
  meta.manualOverride = {
    active: true,
    updatedAt: overrides.updatedAt ?? now,
    reason: overrides.reason ?? '',
    expiresAt: overrides.expiresAt ?? null,
  }

  return changed
}

function toTimestamp(pubDate) {
  const timestamp = pubDate ? new Date(pubDate).getTime() : NaN
  return Number.isFinite(timestamp) ? timestamp : Date.now()
}

function hasStrongOutbreakSignal(item) {
  const searchable = `${item.title} ${item.description} ${item.link}`.toLowerCase()
  return STRONG_OUTBREAK_KEYWORDS.some((keyword) => searchable.includes(keyword))
}

function normalizeTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/centers for disease control and prevention|cdc \(\.gov\)|cdc|the oklahoman|cruise critic|bbc|ap news|google news/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(and|the|a|an|on|in|to|for|of|with|what|know|about)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function fallbackScore(item) {
  const authorityWeight = FALLBACK_AUTHORITY_WEIGHT.get(item.authority) ?? 20
  const strongSignalWeight = hasStrongOutbreakSignal(item) ? 40 : 0
  const recencyWeight = Math.min(Math.max(toTimestamp(item.pubDate) / 100000000000, 0), 20)
  return authorityWeight + strongSignalWeight + recencyWeight
}

function selectFallbackNewsItems(items) {
  const selected = []
  const googleNews = []

  for (const item of items
    .filter((item) => item.link && item.title && hasStrongOutbreakSignal(item))
    .sort((a, b) => fallbackScore(b) - fallbackScore(a))) {
    if (item.authority === 'Google News') {
      googleNews.push(item)
      continue
    }
    selected.push(item)
    if (selected.length >= FALLBACK_NEWS_LIMIT) return selected
  }

  return selected
    .concat(googleNews.slice(0, Math.max(0, FALLBACK_GOOGLE_NEWS_LIMIT)))
    .slice(0, Math.max(1, FALLBACK_NEWS_LIMIT))
}

function addNewsItems({ items, existingNews, existingNewsLinks, descriptions = {} }) {
  let added = 0
  const existingTitles = new Set(existingNews.map((item) => normalizeTitle(item.title)).filter(Boolean))

  for (const item of items) {
    if (!item.link || existingNewsLinks.has(item.link)) continue
    const titleKey = normalizeTitle(item.title)
    if (titleKey && existingTitles.has(titleKey)) continue

    existingNews.push({
      id: `rss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      authority: item.authority,
      title: item.title,
      description: descriptions[item.link] || item.description,
      link: item.link,
      pubDate: item.pubDate,
      timestamp: toTimestamp(item.pubDate),
    })
    existingNewsLinks.add(item.link)
    if (titleKey) existingTitles.add(titleKey)
    added++
  }

  if (added > 0) {
    existingNews.sort((a, b) => b.timestamp - a.timestamp)
    writeFileSync(NEWS_PATH, JSON.stringify(existingNews.slice(0, 50), null, 2))
  }

  return added
}

function updateFeedHealth(meta, {
  now,
  failedFeeds,
  failedCriticalFeeds = [],
  newItems,
  candidateItems,
  extractionStatus,
  officialSources,
}) {
  meta.lastChecked = now
  meta.feedHealth = {
    lastRun: now,
    failedFeeds: uniqueValues(failedFeeds),
    criticalFeedFailures: uniqueValues(failedCriticalFeeds),
    itemsFound: newItems.length,
    candidateItemsFound: candidateItems.length,
    extractionStatus,
  }
  if (officialSources) {
    meta.lastOfficialSourceCheck = now
    meta.officialSources = officialSources
    meta.feedHealth.officialSourceFailures = officialSources
      .filter((source) => source.status !== 'ok')
      .map((source) => source.authority)
  }
}

function ageHours(now, iso) {
  const age = (new Date(now).getTime() - new Date(iso).getTime()) / (60 * 60 * 1000)
  return Number.isFinite(age) ? age : null
}

function buildStatus(meta, now) {
  const officialSourceFailures = meta.feedHealth?.officialSourceFailures ?? []
  const criticalFeedFailures = meta.feedHealth?.criticalFeedFailures ?? []
  const dataAgeHours = ageHours(now, meta.lastUpdated)
  const officialCheckAgeHours = ageHours(now, meta.lastOfficialSourceCheck ?? meta.lastChecked)
  const staleReasons = []

  if (dataAgeHours === null || dataAgeHours > MAX_DATA_AGE_HOURS) {
    staleReasons.push(`headline data older than ${MAX_DATA_AGE_HOURS}h`)
  }
  if (officialCheckAgeHours === null || officialCheckAgeHours > MAX_OFFICIAL_CHECK_AGE_HOURS) {
    staleReasons.push(`official source check older than ${MAX_OFFICIAL_CHECK_AGE_HOURS}h`)
  }

  const status = staleReasons.length > 0 || criticalFeedFailures.length > 0
    ? 'critical'
    : officialSourceFailures.length > 0
      ? 'degraded'
      : 'ok'

  return {
    schemaVersion: 1,
    status,
    generatedAt: now,
    thresholds: {
      maxDataAgeHours: MAX_DATA_AGE_HOURS,
      maxOfficialCheckAgeHours: MAX_OFFICIAL_CHECK_AGE_HOURS,
    },
    dashboard: {
      lastUpdated: meta.lastUpdated,
      lastChecked: meta.lastChecked,
      lastOfficialSourceCheck: meta.lastOfficialSourceCheck ?? meta.lastChecked,
      dataAgeHours,
      officialCheckAgeHours,
      source: meta.source,
    },
    metrics: {
      confirmed: meta.confirmed,
      deaths: meta.deaths,
      countries: meta.countries,
      usStatesMonitoring: meta.usStatesMonitoring,
      whoGlobalRisk: meta.whoGlobalRisk,
      cdcResponseLevel: meta.cdcResponseLevel,
      ecdcRisk: meta.ecdcRisk,
    },
    pipeline: {
      extractionStatus: meta.feedHealth?.extractionStatus ?? 'unknown',
      itemsFound: meta.feedHealth?.itemsFound ?? 0,
      candidateItemsFound: meta.feedHealth?.candidateItemsFound ?? 0,
      failedFeeds: meta.feedHealth?.failedFeeds ?? [],
      criticalFeedFailures,
      officialSourceFailures,
      officialSourcesOk: (meta.officialSources ?? []).filter((source) => source.status === 'ok').length,
      officialSourcesTotal: (meta.officialSources ?? []).length,
    },
    staleReasons,
    runbook: 'Check GitHub Actions workflow "Automated Data Update", open stale-data or pipeline-failure issues, then verify official CDC/ECDC/WHO/PHAC source pages.',
  }
}

function writeMetaAndStatus(meta, now) {
  writeFileSync(META_PATH, JSON.stringify(meta, null, 2))
  writeFileSync(STATUS_PATH, JSON.stringify(buildStatus(meta, now), null, 2))
}

async function main() {
  const now = new Date().toISOString()
  const meta = JSON.parse(readFileSync(META_PATH, 'utf8'))
  const existingTimeline = JSON.parse(readFileSync(TIMELINE_PATH, 'utf8'))
  const existingNews = JSON.parse(readFileSync(NEWS_PATH, 'utf8'))
  const manualOverrides = readManualOverrides(now)
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

  console.log(`[update-data] Official source pages: ${OFFICIAL_SOURCE_PAGES.length}`)
  const { sourceHealth, extractions: officialExtractions } = await checkOfficialSources(meta, now)
  const officialDataChanged = applyOfficialExtractions(meta, officialExtractions)
  const manualOverrideChanged = applyManualOverrides(meta, manualOverrides, now)
  const failedCriticalOfficialSources = sourceHealth
    .filter((source) => source.critical && source.status !== 'ok')
    .map((source) => source.authority)

  if (failedCriticalOfficialSources.length > 0) {
    console.warn(`[update-data] Official source failures: ${uniqueValues(failedCriticalOfficialSources).join(', ')}`)
  }

  const criticalFailures = uniqueValues(failedCriticalFeeds)
  if (criticalFailures.length > 0 && failedCriticalOfficialSources.length > 0 && (meta.confirmed ?? 0) > 0) {
    console.error(`[update-data] CRITICAL: Required feed and official source failures during active outbreak: ${criticalFailures.join(', ')}`)
    process.exit(1)
  }

  if (newItems.length === 0) {
    if ((meta.confirmed ?? 0) > 0 && candidateItems.length === 0) {
      console.warn('[update-data] ANOMALY: Active outbreak but no relevant RSS candidates found.')
    }
    updateFeedHealth(meta, {
      now,
      failedFeeds,
      failedCriticalFeeds,
      newItems,
      candidateItems,
      extractionStatus: officialDataChanged
        ? 'Official parser updated structured data; no new RSS news items'
        : 'Official sources checked; no new RSS news items',
      officialSources: sourceHealth,
    })
    if (officialDataChanged || manualOverrideChanged) meta.lastUpdated = now
    writeMetaAndStatus(meta, now)
    console.log('[update-data] No new deduped items. Official source status recorded.')
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
    console.warn('[update-data] GEMINI_API_KEY not set - using RSS-only fallback.')
    const fallbackItems = selectFallbackNewsItems(newItems)
    const added = addNewsItems({ items: fallbackItems, existingNews, existingNewsLinks })
    updateFeedHealth(meta, {
      now,
      failedFeeds,
      failedCriticalFeeds,
      newItems,
      candidateItems,
      extractionStatus: `Gemini unavailable: missing API key; RSS-only fallback added ${added} news item(s)`,
      officialSources: sourceHealth,
    })
    if (added > 0 || officialDataChanged || manualOverrideChanged) meta.lastUpdated = now
    writeMetaAndStatus(meta, now)
    console.log(`[update-data] RSS-only fallback added ${added} news item(s).`)
    return
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
    console.warn('[update-data] Gemini extraction unavailable - using RSS-only fallback.')
    const fallbackItems = selectFallbackNewsItems(newItems)
    const added = addNewsItems({ items: fallbackItems, existingNews, existingNewsLinks })
    updateFeedHealth(meta, {
      now,
      failedFeeds,
      failedCriticalFeeds,
      newItems,
      candidateItems,
      extractionStatus: `Gemini unavailable after retries; RSS-only fallback added ${added} news item(s)`,
      officialSources: sourceHealth,
    })
    if (added > 0 || officialDataChanged || manualOverrideChanged) meta.lastUpdated = now
    writeMetaAndStatus(meta, now)
    console.log(`[update-data] RSS-only fallback added ${added} news item(s).`)
    return
  }

  let dataChanged = officialDataChanged || manualOverrideChanged

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

  updateFeedHealth(meta, {
    now,
    failedFeeds,
    failedCriticalFeeds,
    newItems,
    candidateItems,
    extractionStatus: 'Gemini extraction succeeded',
    officialSources: sourceHealth,
  })

  const enrichedDescriptions = extracted.newsDescriptions ?? {}
  const addedNews = addNewsItems({ items: newItems, existingNews, existingNewsLinks, descriptions: enrichedDescriptions })

  if (addedNews > 0) {
    dataChanged = true
    console.log('[update-data] Updated news.json.')
  }

  if (dataChanged) {
    meta.lastUpdated = now
    console.log('[update-data] Data changed - lastUpdated set.')
  } else {
    console.log('[update-data] No data changes detected.')
  }

  writeMetaAndStatus(meta, now)

  console.log('[update-data] Done.')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error('[update-data] Fatal error:', error)
    process.exit(1)
  })
}
