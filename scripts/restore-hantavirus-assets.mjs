#!/usr/bin/env node
/**
 * One-time restoration of hantavirus assets dropped during the multi-threat
 * migration. Source: f4ebe5c^ commit (preserved here as scripts/_old-*.json).
 *
 * Restores:
 *  - 23 map markers (ship route, US state monitoring, flight tracing,
 *    specific case/death sites, Arrowe Park monitoring facility,
 *    Colorado Sin Nombre context death)
 *  - 23 timeline events (full hantavirus chronological narrative)
 *  - 31 news items (CDC HAN, WHO DON, ECDC, AP, BBC, etc. coverage)
 *  - Authority risk-assessment badges (WHO global, CDC HAN, ECDC EU/EEA)
 *  - HCW alert callout
 *
 * Run once: node scripts/restore-hantavirus-assets.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const TIMELINE_PATH = 'src/data/signal-timeline.json'
const NEWS_PATH = 'src/data/news.json'

const OLD_MARKERS = 'scripts/_old-markers.json'
const OLD_TIMELINE = 'scripts/_old-timeline.json'
const OLD_NEWS = 'scripts/_old-news.json'
const OLD_META = 'scripts/_old-meta.json'

const HANTAVIRUS_ID = 'andes-hantavirus-mv-hondius-2026'

// ---------------------------------------------------------------------------
// 1) MAP MARKERS — map old marker types to new MarkerType union, preserving
// the original semantics. New types ship_route, us_state_monitoring,
// flight_tracing match the old names verbatim.
// ---------------------------------------------------------------------------
const OLD_TYPE_TO_NEW = {
  ship_route: 'ship_route',
  return_destination: 'exposure_event',
  case_confirmed: 'case_confirmed',
  death: 'death',
  monitoring_facility: 'monitoring_site',
  us_state_monitoring: 'us_state_monitoring',
  flight_tracing: 'flight_tracing',
}

function convertMarker(old) {
  // Preserve a stable ID. Some old markers already have descriptive IDs.
  const sources = old.sources && old.sources.length > 0
    ? old.sources
    : old.source && old.sourceUrl
      ? [{ label: old.source, url: old.sourceUrl }]
      : undefined
  return {
    id: old.id,
    lat: old.lat,
    lng: old.lng,
    label: old.name,
    description: [old.status, old.description].filter(Boolean).join(' — '),
    type: OLD_TYPE_TO_NEW[old.type] ?? 'outbreak_zone',
    ...(sources ? { sources } : {}),
  }
}

function restoreMarkers(signals) {
  if (!existsSync(OLD_MARKERS)) {
    console.warn('  [markers] _old-markers.json not present — skipping')
    return 0
  }
  const oldMarkers = JSON.parse(readFileSync(OLD_MARKERS, 'utf8'))
  const signal = signals.find((s) => s.id === HANTAVIRUS_ID)
  if (!signal) throw new Error('hantavirus signal not found')

  const existingIds = new Set((signal.mapMarkers || []).map((m) => m.id))
  const existingLabels = new Set((signal.mapMarkers || []).map((m) => m.label.toLowerCase()))

  let added = 0
  for (const old of oldMarkers) {
    const converted = convertMarker(old)
    // Skip if we already have this marker (by ID or by close label match)
    if (existingIds.has(converted.id)) continue
    const labelLower = converted.label.toLowerCase()
    const labelMatched = [...existingLabels].some(
      (existing) => existing.includes(labelLower.slice(0, 15)) || labelLower.includes(existing.slice(0, 15))
    )
    if (labelMatched) continue
    signal.mapMarkers.push(converted)
    added += 1
  }
  console.log(`  [markers] added ${added} of ${oldMarkers.length}; total now ${signal.mapMarkers.length}`)
  return added
}

// ---------------------------------------------------------------------------
// 2) TIMELINE EVENTS — convert old TimelineEvent shape to SignalTimelineEvent
// (add signalId and category).
// ---------------------------------------------------------------------------
function restoreTimeline() {
  if (!existsSync(OLD_TIMELINE)) {
    console.warn('  [timeline] _old-timeline.json not present — skipping')
    return 0
  }
  const oldEvents = JSON.parse(readFileSync(OLD_TIMELINE, 'utf8'))
  const current = JSON.parse(readFileSync(TIMELINE_PATH, 'utf8'))
  const existingIds = new Set(current.map((e) => e.id))
  const existingTitles = new Set(current.map((e) => e.title.toLowerCase()))

  let added = 0
  for (const old of oldEvents) {
    // Skip if already present
    if (existingIds.has(old.id)) continue
    if (existingTitles.has((old.title || '').toLowerCase())) continue

    // Source ID — try to map common authority refs to known source IDs
    // in signal-sources.json. Fall back to a generic CDC ref.
    const sourceId =
      old.sourceId ||
      mapAuthorityToSourceId(old.authority, old.title) ||
      'cdc-han-528'

    current.push({
      id: old.id || `hanta-${(old.date || '').replace(/[^0-9]/g, '')}-${added}`,
      signalId: HANTAVIRUS_ID,
      date: normalizeDate(old.date),
      title: old.title || 'Hantavirus update',
      description: old.description || old.summary || '',
      sourceId,
      category: 'zoonotic',
    })
    added += 1
  }

  // Keep sorted newest-first
  current.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  writeFileSync(TIMELINE_PATH, JSON.stringify(current, null, 2) + '\n')
  console.log(`  [timeline] added ${added} of ${oldEvents.length}; total now ${current.length}`)
  return added
}

function mapAuthorityToSourceId(authority, title) {
  const a = (authority || '').toLowerCase()
  const t = (title || '').toLowerCase()
  if (t.includes('han 528')) return 'cdc-han-528'
  if (t.includes('don601')) return 'who-don601'
  if (t.includes('don599')) return 'who-don599'
  if (t.includes('rapid risk assessment')) return 'who-andes-rra-v2'
  if (a === 'who') return 'who-disease-outbreak-news'
  if (a === 'cdc') return 'cdc-hantavirus-situation-summary'
  if (a === 'ecdc') return 'ecdc-andes-surveillance'
  if (a === 'phac') return 'phac-andes-media-update'
  return null
}

function normalizeDate(raw) {
  if (!raw) return new Date().toISOString().slice(0, 10)
  // Handle "May 19, 2026" → "2026-05-19"
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return raw
}

// ---------------------------------------------------------------------------
// 3) NEWS ITEMS — re-seed the 31 historical hantavirus items, tagged.
// Pipeline's MAX_ITEMS bump (separately applied) keeps them resident.
// ---------------------------------------------------------------------------
function restoreNews() {
  if (!existsSync(OLD_NEWS)) {
    console.warn('  [news] _old-news.json not present — skipping')
    return 0
  }
  const oldItems = JSON.parse(readFileSync(OLD_NEWS, 'utf8'))
  let current = []
  try { current = JSON.parse(readFileSync(NEWS_PATH, 'utf8')) } catch { /* empty */ }
  const existingIds = new Set(current.map((n) => n.id))

  let added = 0
  for (const old of oldItems) {
    if (existingIds.has(old.id)) continue
    current.push({
      id: old.id,
      signalIds: [HANTAVIRUS_ID],
      authority: old.authority,
      title: old.title,
      description: old.description,
      link: old.link,
      pubDate: old.pubDate,
      timestamp: old.timestamp,
    })
    added += 1
  }

  current.sort((a, b) => b.timestamp - a.timestamp)
  writeFileSync(NEWS_PATH, JSON.stringify(current, null, 2) + '\n')
  console.log(`  [news] re-seeded ${added} of ${oldItems.length}; total now ${current.length}`)
  return added
}

// ---------------------------------------------------------------------------
// 4) AUTHORITY RISK ASSESSMENTS + HCW ALERT — pull from old meta.json,
// populate the hantavirus signal's new riskAssessments[] and hcwAlert fields.
// ---------------------------------------------------------------------------
function restoreRisksAndHcwAlert(signals) {
  if (!existsSync(OLD_META)) {
    console.warn('  [meta] _old-meta.json not present — skipping')
    return
  }
  const meta = JSON.parse(readFileSync(OLD_META, 'utf8'))
  const signal = signals.find((s) => s.id === HANTAVIRUS_ID)
  if (!signal) throw new Error('hantavirus signal not found')

  const risks = []
  if (meta.whoGlobalRisk) {
    risks.push({
      authority: 'WHO',
      label: meta.whoGlobalRisk,
      description: 'WHO global risk assessment',
      url: meta.whoGlobalRiskUrl || 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON601',
      asOf: meta.lastUpdated?.slice(0, 10),
    })
  }
  if (meta.cdcResponseLevel) {
    risks.push({
      authority: 'CDC',
      label: meta.cdcResponseLevel,
      description: 'CDC Health Alert Network',
      url: meta.cdcResponseLevelUrl || 'https://www.cdc.gov/han/php/notices/han00528.html',
      asOf: meta.lastUpdated?.slice(0, 10),
    })
  }
  if (meta.ecdcRisk) {
    risks.push({
      authority: 'ECDC',
      label: meta.ecdcRisk,
      description: 'ECDC EU/EEA risk',
      url: meta.ecdcRiskUrl || 'https://www.ecdc.europa.eu/en/publications-data/hantavirus-associated-cluster-illness-cruise-ship-ecdc-assessment-and',
      asOf: meta.lastUpdated?.slice(0, 10),
    })
  }
  if (risks.length > 0) {
    signal.riskAssessments = risks
    console.log(`  [risk] added ${risks.length} authority assessments`)
  }

  if (meta.hcwAlert) {
    signal.hcwAlert = {
      headline: meta.hcwAlert.headline || 'Healthcare worker alert',
      body: meta.hcwAlert.body || meta.hcwAlert.message || '',
      sourceUrl: meta.hcwAlert.sourceUrl || 'https://www.cdc.gov/han/php/notices/han00528.html',
      sourceAuthority: meta.hcwAlert.sourceAuthority || meta.hcwAlert.authority || 'CDC',
      updatedAt: meta.hcwAlert.updatedAt || meta.lastUpdated || new Date().toISOString(),
    }
    console.log('  [hcw] added HCW alert')
  } else {
    // Compose a default HCW alert from documented context: Radboud UMC
    // quarantine event + person-to-person Andes virus transmission risk.
    signal.hcwAlert = {
      headline: 'Documented HCW transmission risk — strict airborne PPE required',
      body: 'Andes virus is the only hantavirus with documented person-to-person transmission, including via close contact with respiratory secretions, blood, saliva, or excreta. Secondary HCW infections have occurred at facilities where airborne precautions were not applied. NYC DOH HAN #8 recommends airborne infection isolation precautions (N95 or higher, gown, gloves, eye protection) for ALL contacts with suspected or confirmed Andes virus patients, not limited to aerosol-generating procedures. The May 12 Radboud UMC event is a documented HCW exposure that placed multiple staff under quarantine after an incorrect blood-sampling procedure.',
      sourceUrl: 'https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf',
      sourceAuthority: 'NYC DOH (HAN #8)',
      updatedAt: '2026-05-16',
    }
    console.log('  [hcw] added composed HCW alert (no override in old meta)')
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const signals = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8'))

  console.log('[restore-hantavirus-assets] starting…')
  restoreMarkers(signals)
  restoreRisksAndHcwAlert(signals)
  writeFileSync(SIGNALS_PATH, JSON.stringify(signals, null, 2) + '\n')

  restoreTimeline()
  restoreNews()

  console.log('[restore-hantavirus-assets] done')
}

main()
