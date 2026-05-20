import { readFileSync } from 'fs'

const META_PATH = 'src/data/meta.json'
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://biosecurity-intel.emergenzsystems.org'
const MAX_ATTEMPTS = Number.parseInt(process.env.VERIFY_PRODUCTION_ATTEMPTS || '12', 10)
const DELAY_MS = Number.parseInt(process.env.VERIFY_PRODUCTION_DELAY_MS || '30000', 10)
const MAX_OFFICIAL_CHECK_AGE_HOURS = Number.parseInt(process.env.MAX_OFFICIAL_CHECK_AGE_HOURS || '12', 10)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ageHours(iso) {
  return (Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000)
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/javascript,text/javascript,*/*',
      'Cache-Control': 'no-cache',
      'User-Agent': 'EMERGENZ-Production-Verifier/1.0',
    },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json,*/*',
      'Cache-Control': 'no-cache',
      'User-Agent': 'EMERGENZ-Production-Verifier/1.0',
    },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

function assetUrls(html, baseUrl) {
  const urls = new Set()
  const pattern = /(?:src|href)=["']([^"']+\.js(?:\?[^"']*)?)["']/gi
  let match

  while ((match = pattern.exec(html)) !== null) {
    urls.add(new URL(match[1], baseUrl).toString())
  }

  return [...urls]
}

async function productionStatusMatches(meta, expectedLastUpdated, expectedLastOfficialSourceCheck) {
  const statusUrl = new URL('/status.json', PRODUCTION_URL)
  statusUrl.searchParams.set('verify', Date.now().toString())

  const status = await fetchJson(statusUrl.toString())
  return status.schemaVersion === 1
    && status.dashboard?.lastUpdated === expectedLastUpdated
    && status.dashboard?.lastOfficialSourceCheck === expectedLastOfficialSourceCheck
    && status.metrics?.confirmed === meta.confirmed
    && status.metrics?.deaths === meta.deaths
}

async function productionContains(expectedMarkers) {
  const cacheBustUrl = new URL(PRODUCTION_URL)
  cacheBustUrl.searchParams.set('verify', Date.now().toString())

  const html = await fetchText(cacheBustUrl.toString())
  if (expectedMarkers.every((marker) => html.includes(marker))) return true

  const scripts = assetUrls(html, cacheBustUrl)
  if (scripts.length === 0) {
    throw new Error(`No JavaScript assets found at ${PRODUCTION_URL}`)
  }

  for (const scriptUrl of scripts) {
    const script = await fetchText(scriptUrl)
    if (expectedMarkers.every((marker) => script.includes(marker))) return true
  }

  return false
}

async function main() {
  const meta = JSON.parse(readFileSync(META_PATH, 'utf8'))
  const expectedLastUpdated = meta.lastUpdated
  const lastOfficialSourceCheck = meta.lastOfficialSourceCheck ?? meta.lastChecked
  const expectedMarkers = [...new Set([expectedLastUpdated, lastOfficialSourceCheck].filter(Boolean))]
  const officialCheckAge = ageHours(lastOfficialSourceCheck)

  if (!Number.isFinite(officialCheckAge) || officialCheckAge > MAX_OFFICIAL_CHECK_AGE_HOURS) {
    throw new Error(
      `Official source check is stale: ${lastOfficialSourceCheck} (${officialCheckAge.toFixed(1)}h old, max ${MAX_OFFICIAL_CHECK_AGE_HOURS}h)`
    )
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[verify-production] Attempt ${attempt}/${MAX_ATTEMPTS}: ${PRODUCTION_URL}`)
      const statusMatches = await productionStatusMatches(meta, expectedLastUpdated, lastOfficialSourceCheck)
      const bundleMatches = await productionContains(expectedMarkers)
      if (statusMatches && bundleMatches) {
        console.log(`[verify-production] OK: production status and bundle contain ${expectedMarkers.join(' and ')}`)
        return
      }
      console.warn(`[verify-production] Production not fresh yet (status=${statusMatches}, bundle=${bundleMatches})`)
    } catch (error) {
      console.warn(`[verify-production] Attempt ${attempt} failed: ${error.message}`)
    }

    if (attempt < MAX_ATTEMPTS) await sleep(DELAY_MS)
  }

  throw new Error(`Production did not reflect ${expectedMarkers.join(' and ')} after ${MAX_ATTEMPTS} attempt(s)`)
}

main().catch((error) => {
  console.error('[verify-production] FAILED:', error.message)
  process.exit(1)
})
