import { readFileSync } from 'fs'

const DATA_DIR = 'src/data'
const files = {
  meta: `${DATA_DIR}/meta.json`,
  timeline: `${DATA_DIR}/timeline.json`,
  news: `${DATA_DIR}/news.json`,
  markers: `${DATA_DIR}/markers.json`,
  sources: `${DATA_DIR}/sources.json`,
  usMonitoring: `${DATA_DIR}/us-monitoring.json`,
  flights: `${DATA_DIR}/flights.json`,
  emsBriefing: `${DATA_DIR}/ems-briefing.json`,
  protocols: `${DATA_DIR}/protocols.json`,
  manualOverrides: `${DATA_DIR}/manual-overrides.json`,
}

const errors = []

function readJson(name) {
  try {
    return JSON.parse(readFileSync(files[name], 'utf8'))
  } catch (error) {
    errors.push(`${files[name]}: ${error.message}`)
    return null
  }
}

function requireFields(record, fields, label) {
  for (const field of fields) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push(`${label}: missing ${field}`)
    }
  }
}

function checkDuplicate(records, keyFn, label) {
  const seen = new Map()
  records.forEach((record, index) => {
    const key = keyFn(record)
    if (!key) return
    if (seen.has(key)) {
      errors.push(`${label}: duplicate "${key}" at indexes ${seen.get(key)} and ${index}`)
    } else {
      seen.set(key, index)
    }
  })
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !isNaN(new Date(value).getTime())
}

function isParseableDate(value) {
  return typeof value === 'string' && !isNaN(new Date(value).getTime())
}

function isUrl(value) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

const meta = readJson('meta')
const timeline = readJson('timeline') ?? []
const news = readJson('news') ?? []
const markers = readJson('markers') ?? []
const sources = readJson('sources') ?? []
const usMonitoring = readJson('usMonitoring') ?? []
const flights = readJson('flights') ?? []
const emsBriefing = readJson('emsBriefing')
const protocols = readJson('protocols') ?? []
const manualOverrides = readJson('manualOverrides')

if (meta) {
  requireFields(meta, ['confirmed', 'deaths', 'countries', 'usStatesMonitoring', 'lastUpdated', 'lastChecked', 'source'], 'meta')
  if (!isIsoDate(meta.lastUpdated)) errors.push('meta.lastUpdated must be an ISO date string')
  if (!isIsoDate(meta.lastChecked)) errors.push('meta.lastChecked must be an ISO date string')
  if (meta.lastOfficialSourceCheck && !isIsoDate(meta.lastOfficialSourceCheck)) {
    errors.push('meta.lastOfficialSourceCheck must be an ISO date string')
  }
  if (!Number.isInteger(meta.confirmed) || meta.confirmed < 0) errors.push('meta.confirmed must be a non-negative integer')
  if (!Number.isInteger(meta.deaths) || meta.deaths < 0) errors.push('meta.deaths must be a non-negative integer')
  if (!Number.isInteger(meta.countries) || meta.countries < 0) errors.push('meta.countries must be a non-negative integer')
  if (!Number.isInteger(meta.usStatesMonitoring) || meta.usStatesMonitoring < 0) {
    errors.push('meta.usStatesMonitoring must be a non-negative integer')
  }
  if (meta.deaths > meta.confirmed) errors.push('meta.deaths cannot exceed meta.confirmed')
  if (new Date(meta.lastChecked).getTime() < new Date(meta.lastUpdated).getTime()) {
    errors.push('meta.lastChecked cannot be older than meta.lastUpdated')
  }

  if (meta.feedHealth) {
    requireFields(meta.feedHealth, ['lastRun', 'failedFeeds', 'itemsFound', 'candidateItemsFound', 'extractionStatus'], 'meta.feedHealth')
    if (!isIsoDate(meta.feedHealth.lastRun)) errors.push('meta.feedHealth.lastRun must be an ISO date string')
    if (!Array.isArray(meta.feedHealth.failedFeeds)) errors.push('meta.feedHealth.failedFeeds must be an array')
    if (!Number.isInteger(meta.feedHealth.itemsFound) || meta.feedHealth.itemsFound < 0) {
      errors.push('meta.feedHealth.itemsFound must be a non-negative integer')
    }
    if (!Number.isInteger(meta.feedHealth.candidateItemsFound) || meta.feedHealth.candidateItemsFound < 0) {
      errors.push('meta.feedHealth.candidateItemsFound must be a non-negative integer')
    }
  }

  if (meta.officialSources) {
    if (!Array.isArray(meta.officialSources) || meta.officialSources.length === 0) {
      errors.push('meta.officialSources must be a non-empty array when present')
    } else {
      checkDuplicate(meta.officialSources, (source) => source.id, 'meta official source ids')
      meta.officialSources.forEach((source, index) => {
        requireFields(source, ['id', 'authority', 'label', 'url', 'status', 'lastChecked'], `meta.officialSources[${index}]`)
        if (!isUrl(source.url)) errors.push(`meta.officialSources[${index}]: url must be valid`)
        if (!['ok', 'failed'].includes(source.status)) {
          errors.push(`meta.officialSources[${index}]: invalid status "${source.status}"`)
        }
        if (!isIsoDate(source.lastChecked)) errors.push(`meta.officialSources[${index}]: lastChecked must be ISO`)
        if (source.lastChanged && !isIsoDate(source.lastChanged)) {
          errors.push(`meta.officialSources[${index}]: lastChanged must be ISO`)
        }
      })
    }
  }

  if (meta.metricProvenance) {
    Object.entries(meta.metricProvenance).forEach(([key, provenance]) => {
      requireFields(provenance, ['source', 'sourceLabel', 'sourceUrl', 'method', 'lastVerified'], `meta.metricProvenance.${key}`)
      if (!isUrl(provenance.sourceUrl)) errors.push(`meta.metricProvenance.${key}: sourceUrl must be valid`)
      if (!isIsoDate(provenance.lastVerified)) errors.push(`meta.metricProvenance.${key}: lastVerified must be ISO`)
    })
  }

  if (meta.manualOverride) {
    requireFields(meta.manualOverride, ['active', 'updatedAt', 'reason'], 'meta.manualOverride')
    if (typeof meta.manualOverride.active !== 'boolean') errors.push('meta.manualOverride.active must be boolean')
    if (!isIsoDate(meta.manualOverride.updatedAt)) errors.push('meta.manualOverride.updatedAt must be ISO')
    if (meta.manualOverride.expiresAt && !isIsoDate(meta.manualOverride.expiresAt)) {
      errors.push('meta.manualOverride.expiresAt must be ISO')
    }
  }
}

if (manualOverrides) {
  requireFields(manualOverrides, ['enabled', 'metrics', 'riskLevels'], 'manual-overrides')
  if (typeof manualOverrides.enabled !== 'boolean') errors.push('manual-overrides.enabled must be boolean')
  if (manualOverrides.updatedAt !== null && manualOverrides.updatedAt !== undefined && !isIsoDate(manualOverrides.updatedAt)) {
    errors.push('manual-overrides.updatedAt must be null or ISO')
  }
  if (manualOverrides.expiresAt !== null && manualOverrides.expiresAt !== undefined && !isIsoDate(manualOverrides.expiresAt)) {
    errors.push('manual-overrides.expiresAt must be null or ISO')
  }
  for (const [key, value] of Object.entries(manualOverrides.metrics ?? {})) {
    if (!['confirmed', 'deaths', 'countries', 'usStatesMonitoring'].includes(key)) {
      errors.push(`manual-overrides.metrics: unsupported metric "${key}"`)
    }
    if (!Number.isInteger(value) || value < 0) {
      errors.push(`manual-overrides.metrics.${key} must be a non-negative integer`)
    }
  }
  for (const [key, value] of Object.entries(manualOverrides.riskLevels ?? {})) {
    if (!['whoGlobalRisk', 'ecdcRisk', 'cdcResponseLevel'].includes(key)) {
      errors.push(`manual-overrides.riskLevels: unsupported risk level "${key}"`)
    }
    if (typeof value !== 'string' || value.length === 0) {
      errors.push(`manual-overrides.riskLevels.${key} must be a non-empty string`)
    }
  }
}

checkDuplicate(timeline, (event) => event.id, 'timeline ids')
timeline.forEach((event, index) => {
  requireFields(event, ['id', 'date', 'title', 'description', 'source', 'sourceUrl', 'category'], `timeline[${index}]`)
  if (!isParseableDate(event.date)) errors.push(`timeline[${index}]: date must be parseable`)
  if (!['WHO', 'CDC', 'ECDC', 'other'].includes(event.category)) {
    errors.push(`timeline[${index}]: invalid category "${event.category}"`)
  }
})

checkDuplicate(news, (item) => item.id, 'news ids')
checkDuplicate(news, (item) => item.link, 'news links')
news.forEach((item, index) => {
  requireFields(item, ['id', 'authority', 'title', 'description', 'link', 'pubDate', 'timestamp'], `news[${index}]`)
  if (!Number.isFinite(item.timestamp)) errors.push(`news[${index}]: timestamp must be numeric`)
})

checkDuplicate(markers, (marker) => marker.id, 'marker ids')
markers.forEach((marker, index) => {
  requireFields(marker, ['id', 'name', 'lat', 'lng', 'type', 'status', 'description'], `markers[${index}]`)
  if (typeof marker.lat !== 'number' || marker.lat < -90 || marker.lat > 90) {
    errors.push(`markers[${index}]: invalid latitude`)
  }
  if (typeof marker.lng !== 'number' || marker.lng < -180 || marker.lng > 180) {
    errors.push(`markers[${index}]: invalid longitude`)
  }
})

checkDuplicate(sources, (source) => source.id, 'source ids')
sources.forEach((source, index) => {
  requireFields(source, ['id', 'authority', 'authorityFull', 'title', 'documentType', 'publicationDate', 'lastVerified', 'url'], `sources[${index}]`)
})

usMonitoring.forEach((entry, index) => {
  requireFields(entry, ['state', 'exposureCategory', 'confirmedCases', 'sourceUrl'], `us-monitoring[${index}]`)
  if (entry.personsMonitored !== null && !Number.isInteger(entry.personsMonitored)) {
    errors.push(`us-monitoring[${index}]: personsMonitored must be integer or null`)
  }
})

checkDuplicate(flights, (flight) => flight.id, 'flight ids')
flights.forEach((flight, index) => {
  requireFields(flight, ['id', 'flightNumber', 'operator', 'route', 'date', 'status', 'sourceUrl'], `flights[${index}]`)
})

if (emsBriefing) {
  requireFields(emsBriefing, ['bullets', 'updatedAt', 'sources'], 'ems-briefing')
  if (!Array.isArray(emsBriefing.bullets) || emsBriefing.bullets.length === 0) {
    errors.push('ems-briefing: bullets must be a non-empty array')
  }
}

checkDuplicate(protocols, (protocol) => protocol.id, 'protocol ids')

if (errors.length > 0) {
  console.error('[validate-data] FAILED')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('[validate-data] OK')
