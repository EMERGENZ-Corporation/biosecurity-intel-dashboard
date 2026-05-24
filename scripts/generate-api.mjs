#!/usr/bin/env node
/**
 * Generates static API endpoints under public/api/v1/ so consumers (analysts,
 * partner agencies, downstream tools) can fetch the dashboard's structured
 * data directly without scraping. Each endpoint is wrapped in a small
 * envelope carrying the generation timestamp, item count, and the schema
 * version so consumers can detect breaking changes.
 *
 * Endpoints:
 *   /api/v1/signals.json       — full Signal[] array
 *   /api/v1/signal-sources.json — full SignalSource[] array
 *   /api/v1/signal-timeline.json — full SignalTimelineEvent[] array
 *   /api/v1/news.json          — full NewsItem[] array
 *
 * Run via `npm run generate:api` or as part of the data refresh workflow.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

const SCHEMA_VERSION = 1

const ENDPOINTS = [
  { src: 'src/data/signals.json',          dst: 'public/api/v1/signals.json',          name: 'signals'        },
  { src: 'src/data/signal-sources.json',   dst: 'public/api/v1/signal-sources.json',   name: 'signalSources'  },
  { src: 'src/data/signal-timeline.json',  dst: 'public/api/v1/signal-timeline.json',  name: 'signalTimeline' },
  { src: 'src/data/news.json',             dst: 'public/api/v1/news.json',             name: 'news'           },
]

function ensureDir(path) {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const SEVERITY_RANK = { monitor: 0, watch: 1, concern: 2, action: 3 }
const SITE_URL = process.env.SITE_URL || 'https://biosecurity-intel.emergenzsystems.org'

function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Emit an RSS 2.0 feed of high-severity signals + recent news so analysts
 * and partner agencies can subscribe to dashboard updates per
 * UX-GAP-ANALYSIS §3 #25. One item per active signal at concern+ severity,
 * plus the 20 most recent news items.
 */
function generateRssFeed(generatedAt) {
  const signals = JSON.parse(readFileSync('src/data/signals.json', 'utf8'))
  const news = JSON.parse(readFileSync('src/data/news.json', 'utf8'))

  const highSeveritySignals = signals
    .filter((s) => s.status === 'active' && SEVERITY_RANK[s.severity] >= SEVERITY_RANK.concern)
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])

  const recentNews = [...news].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)

  const signalItems = highSeveritySignals.map((s) => `
    <item>
      <title>[${s.severity.toUpperCase()}] ${escapeXml(s.name)}</title>
      <link>${SITE_URL}/signals/${s.id}</link>
      <guid isPermaLink="true">${SITE_URL}/signals/${s.id}</guid>
      <pubDate>${new Date(s.lastUpdated).toUTCString()}</pubDate>
      <category>${escapeXml(s.category)}</category>
      <description>${escapeXml(s.summary)}</description>
    </item>`).join('')

  const newsItems = recentNews.map((n) => `
    <item>
      <title>${escapeXml(n.authority)}: ${escapeXml(n.title)}</title>
      <link>${escapeXml(n.link)}</link>
      <guid isPermaLink="false">${escapeXml(n.id)}</guid>
      <pubDate>${new Date(n.timestamp).toUTCString()}</pubDate>
      <category>news</category>
      <description>${escapeXml(n.description ?? '')}</description>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>EMERGENZ Biosecurity Intelligence Dashboard</title>
    <link>${SITE_URL}/</link>
    <description>High-severity biosecurity signals and recent authority/media coverage. Generated ${generatedAt}.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(generatedAt).toUTCString()}</lastBuildDate>${signalItems}${newsItems}
  </channel>
</rss>
`
  ensureDir('public/api/v1/feed.rss')
  writeFileSync('public/api/v1/feed.rss', xml)
  console.log(`  wrote public/api/v1/feed.rss (${highSeveritySignals.length} signals + ${recentNews.length} news items)`)
}

function main() {
  const generatedAt = new Date().toISOString()
  let totalItems = 0

  for (const { src, dst, name } of ENDPOINTS) {
    const data = JSON.parse(readFileSync(src, 'utf8'))
    if (!Array.isArray(data)) {
      throw new Error(`${src} did not parse to an array`)
    }
    const envelope = {
      schemaVersion: SCHEMA_VERSION,
      generatedAt,
      endpoint: dst.replace(/^public/, ''),
      count: data.length,
      [name]: data,
    }
    ensureDir(dst)
    writeFileSync(dst, JSON.stringify(envelope, null, 2) + '\n')
    totalItems += data.length
    console.log(`  wrote ${dst} (${data.length} ${name})`)
  }

  generateRssFeed(generatedAt)

  console.log(`[generate-api] generated ${ENDPOINTS.length} JSON endpoints + 1 RSS feed, ${totalItems} total items`)
}

main()
