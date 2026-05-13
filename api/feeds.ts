import type { VercelRequest, VercelResponse } from '@vercel/node'
import { XMLParser } from 'fast-xml-parser'

interface FeedItem {
  id: string
  authority: string
  title: string
  description: string
  link: string
  pubDate: string
  timestamp: number
  type: 'news' | 'protocols'
  pinned?: boolean
}

// Pinned protocol documents — always returned first, hardcoded
const PINNED_PROTOCOLS: FeedItem[] = [
  {
    id: 'pin-cdc-han528',
    authority: 'CDC',
    title: 'HAN 528: Andes Virus Infection Associated with Cruise Ship Voyage — International',
    description:
      'CDC Health Alert Network advisory for clinicians and public health officials on Andes virus exposure linked to MV Hondius cruise.',
    link: 'https://www.cdc.gov/han/php/notices/han00528.html',
    pubDate: 'Thu, 08 May 2026 00:00:00 +0000',
    timestamp: new Date('2026-05-08').getTime(),
    type: 'protocols',
    pinned: true,
  },
  {
    id: 'pin-ecdc-rra',
    authority: 'ECDC',
    title: 'Rapid Risk Assessment: Hantavirus disease associated with a cruise ship — multi-country cluster',
    description:
      'ECDC rapid risk assessment covering epidemiology, risk for EU/EEA, and infection prevention and control recommendations.',
    link: 'https://www.ecdc.europa.eu/en/publications-data/hantavirus-associated-cluster-illness-cruise-ship-ecdc-assessment-and',
    pubDate: 'Wed, 06 May 2026 00:00:00 +0000',
    timestamp: new Date('2026-05-06').getTime(),
    type: 'protocols',
    pinned: true,
  },
  {
    id: 'pin-ecdc-surveillance',
    authority: 'ECDC',
    title: 'Andes Hantavirus Outbreak — Surveillance and Updates (live)',
    description:
      'ECDC live epidemiological update page for the MV Hondius cluster. Updated as new data are confirmed. Last updated May 12, 2026.',
    link: 'https://www.ecdc.europa.eu/en/infectious-disease-topics/hantavirus-infection/surveillance-and-updates/andes-hantavirus-outbreak',
    pubDate: 'Tue, 12 May 2026 00:00:00 +0000',
    timestamp: new Date('2026-05-12').getTime(),
    type: 'protocols',
    pinned: true,
  },
  {
    id: 'pin-nyc-doh-han8',
    authority: 'NYC DOH',
    title: 'Health Advisory #8: Andes Strain Hantavirus — Clinical Guidance for Healthcare Providers',
    description:
      'NYC DOH advisory covering transmission, clinical presentation, infection control, PPE requirements including airborne isolation.',
    link: 'https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf',
    pubDate: 'Thu, 08 May 2026 00:00:00 +0000',
    timestamp: new Date('2026-05-08').getTime(),
    type: 'protocols',
    pinned: true,
  },
  {
    id: 'pin-who-don599',
    authority: 'WHO',
    title: 'Disease Outbreak News 599: Hantavirus disease associated with a cruise ship — multi-country',
    description:
      'WHO Disease Outbreak News confirming Andes virus as causative agent, 7 cases including 3 deaths as of May 4, 2026.',
    link: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON599',
    pubDate: 'Sun, 04 May 2026 00:00:00 +0000',
    timestamp: new Date('2026-05-04').getTime(),
    type: 'protocols',
    pinned: true,
  },
  {
    id: 'pin-who-don600',
    authority: 'WHO',
    title: 'Disease Outbreak News 600: Hantavirus disease — multi-country update',
    description:
      'WHO DON update confirming 11 total cases (9 confirmed, 2 probable), 3 deaths, across 8 countries as of May 11, 2026.',
    link: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600',
    pubDate: 'Mon, 11 May 2026 00:00:00 +0000',
    timestamp: new Date('2026-05-11').getTime(),
    type: 'protocols',
    pinned: true,
  },
]

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '_',
  cdataPropName: '__cdata',
  parseTagValue: true,
  trimValues: true,
})

function extractText(val: unknown): string {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object') {
    const v = val as Record<string, unknown>
    if (v.__cdata) return String(v.__cdata)
    if (v['#text']) return String(v['#text'])
  }
  return ''
}

function parseRSS(xml: string, authority: string, feedType: 'news' | 'protocols'): FeedItem[] {
  try {
    const doc = parser.parse(xml)
    const channel = doc?.rss?.channel || doc?.feed
    if (!channel) return []

    const rawItems: unknown[] = Array.isArray(channel.item)
      ? channel.item
      : channel.item
        ? [channel.item]
        : Array.isArray(channel.entry)
          ? channel.entry
          : channel.entry
            ? [channel.entry]
            : []

    return rawItems
      .map((item) => {
        const i = item as Record<string, unknown>
        const title = extractText(i.title)
        const link = extractText(i.link) || extractText(i.url) || ''
        const description = extractText(i.description || i.summary || i.content || '')
          .replace(/<[^>]+>/g, '')
          .slice(0, 250)
        const pubDate =
          extractText(i.pubDate || i.published || i.updated || i['dc:date'] || '')
        const guid = extractText(i.guid || i.id || link)
        const timestamp = pubDate ? new Date(pubDate).getTime() : 0

        if (!title || !link) return null

        return {
          id: guid || link,
          authority,
          title,
          description,
          link,
          pubDate,
          timestamp,
          type: feedType,
          pinned: false,
        } satisfies FeedItem
      })
      .filter((x): x is FeedItem => x !== null)
  } catch {
    return []
  }
}

async function fetchFeed(
  url: string,
  authority: string,
  feedType: 'news' | 'protocols'
): Promise<FeedItem[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRSS(xml, authority, feedType)
  } catch {
    return []
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=3600')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const feedType = (req.query?.type as string) || 'all'

  // Fetch all RSS feeds in parallel
  const [cdcHan, whoDoN, ecdc] = await Promise.all([
    fetchFeed(
      'https://tools.cdc.gov/api/v2/resources/media/132608.rss',
      'CDC',
      'protocols'
    ),
    fetchFeed(
      'https://www.who.int/feeds/entity/csr/don/en/rss.xml',
      'WHO',
      'news'
    ),
    fetchFeed(
      'https://www.ecdc.europa.eu/en/rss.xml',
      'ECDC',
      'news'
    ),
  ])

  // Deduplicate by id
  const allLive = [...cdcHan, ...whoDoN, ...ecdc]
  const seen = new Set<string>()
  const deduped = allLive.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })

  // Sort live items by timestamp descending
  deduped.sort((a, b) => b.timestamp - a.timestamp)

  let items: FeedItem[]

  if (feedType === 'protocols') {
    // Pinned first, then CDC HAN live items
    const liveProt = deduped.filter((i) => i.type === 'protocols')
    items = [...PINNED_PROTOCOLS, ...liveProt]
  } else if (feedType === 'news') {
    items = deduped.filter((i) => i.type === 'news')
  } else {
    items = [...PINNED_PROTOCOLS, ...deduped]
  }

  return res.status(200).json({
    items,
    fetchedAt: new Date().toISOString(),
    liveCount: deduped.length,
  })
}
