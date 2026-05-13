import type { VercelRequest, VercelResponse } from '@vercel/node'

// Static fallback — authoritative as of May 12, 2026
const FALLBACK = {
  confirmed: 11,
  deaths: 3,
  countries: 8,
  usStatesMonitoring: 11,
  lastUpdated: '2026-05-12T00:00:00Z',
  source: 'WHO / ECDC / CDC — static baseline',
  live: false,
}

function extractNumber(text: string, patterns: RegExp[]): number | null {
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) {
      const n = parseInt(m[1].replace(/,/g, ''), 10)
      if (!isNaN(n)) return n
    }
  }
  return null
}

function parseCDCPage(html: string) {
  // Strip tags, normalise whitespace
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  const confirmed = extractNumber(text, [
    /(\d+)\s+(?:confirmed|total)\s+(?:and\s+probable\s+)?cases?/i,
    /cases?[\s:–—]+(\d+)/i,
    /total\s+cases?[\s:–—]+(\d+)/i,
    /(?:have\s+been\s+)?(?:identified|reported)[^\d]{0,30}(\d+)\s+cases?/i,
  ])

  const deaths = extractNumber(text, [
    /(\d+)\s+deaths?/i,
    /deaths?[\s:–—]+(\d+)/i,
    /(\d+)\s+(?:people\s+)?(?:have\s+)?died/i,
    /fatal(?:ities|ity)[\s:–—]+(\d+)/i,
  ])

  const countries = extractNumber(text, [
    /(\d+)\s+countries/i,
    /countries[\s:–—]+(\d+)/i,
    /affected\s+countries[\s:–—]+(\d+)/i,
  ])

  const result: Record<string, number> = {}
  if (confirmed !== null) result.confirmed = confirmed
  if (deaths !== null) result.deaths = deaths
  if (countries !== null) result.countries = countries
  return result
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.BRIGHT_DATA_API_KEY
  if (!apiKey) {
    return res.status(200).json({ ...FALLBACK, source: 'Static — API key not configured' })
  }

  const zone = process.env.BRIGHT_DATA_ZONE || 'web_unlocker1'

  try {
    const bdRes = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zone,
        url: 'https://www.cdc.gov/hantavirus/situation-summary/index.html',
        format: 'raw',
      }),
    })

    if (!bdRes.ok) {
      const errText = await bdRes.text().catch(() => '')
      console.error(`Bright Data ${bdRes.status}:`, errText.slice(0, 200))
      return res.status(200).json({
        ...FALLBACK,
        source: 'Static baseline — scrape unavailable',
        lastUpdated: new Date().toISOString(),
      })
    }

    const html = await bdRes.text()
    const parsed = parseCDCPage(html)

    return res.status(200).json({
      ...FALLBACK,
      ...parsed,
      lastUpdated: new Date().toISOString(),
      source: 'CDC Situation Summary (live)',
      live: true,
    })
  } catch (err) {
    console.error('refresh handler error:', err)
    return res.status(200).json({
      ...FALLBACK,
      source: 'Static baseline — error during scrape',
      lastUpdated: new Date().toISOString(),
    })
  }
}
