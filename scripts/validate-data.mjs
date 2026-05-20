import { readFileSync } from 'fs'

const DATA_DIR = 'src/data'
const files = {
  status: 'public/status.json',
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
  // Generalized biosecurity data model (added in Phase 2 of the build packet).
  signals: `${DATA_DIR}/signals.json`,
  signalTimeline: `${DATA_DIR}/signal-timeline.json`,
  signalSources: `${DATA_DIR}/signal-sources.json`,
}

const THREAT_CATEGORIES = new Set([
  'vhf',
  'respiratory',
  'zoonotic',
  'vaccine_preventable',
  'enteric',
  'vector_borne',
  'amr_fungal',
  'environmental',
  'mass_gathering',
  'travel',
])
const SIGNAL_SEVERITIES = new Set(['monitor', 'watch', 'concern', 'action'])
const SIGNAL_CONFIDENCES = new Set(['official', 'corroborated', 'emerging', 'unverified'])
const SIGNAL_TRENDS = new Set(['increasing', 'stable', 'decreasing', 'unknown'])
const SIGNAL_STATUSES = new Set(['active', 'monitoring', 'resolved'])
const SOURCE_TYPES = new Set([
  'outbreak-news',
  'expert-weekly-report',
  'health-advisory',
  'surveillance-dashboard',
  'wastewater',
  'animal-health',
  'academic',
  'press-release',
  'other',
])

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
const status = readJson('status')
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
    if (meta.feedHealth.criticalFeedFailures && !Array.isArray(meta.feedHealth.criticalFeedFailures)) {
      errors.push('meta.feedHealth.criticalFeedFailures must be an array')
    }
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

if (status && meta) {
  requireFields(status, ['schemaVersion', 'status', 'generatedAt', 'thresholds', 'dashboard', 'metrics', 'pipeline'], 'status')
  if (status.schemaVersion !== 1) errors.push('status.schemaVersion must be 1')
  if (!['ok', 'degraded', 'critical'].includes(status.status)) {
    errors.push(`status.status must be ok, degraded, or critical; got "${status.status}"`)
  }
  if (!isIsoDate(status.generatedAt)) errors.push('status.generatedAt must be ISO')
  if (!Array.isArray(status.staleReasons)) errors.push('status.staleReasons must be an array')

  if (status.thresholds) {
    requireFields(status.thresholds, ['maxDataAgeHours', 'maxOfficialCheckAgeHours'], 'status.thresholds')
    if (!Number.isInteger(status.thresholds.maxDataAgeHours) || status.thresholds.maxDataAgeHours <= 0) {
      errors.push('status.thresholds.maxDataAgeHours must be a positive integer')
    }
    if (!Number.isInteger(status.thresholds.maxOfficialCheckAgeHours) || status.thresholds.maxOfficialCheckAgeHours <= 0) {
      errors.push('status.thresholds.maxOfficialCheckAgeHours must be a positive integer')
    }
  }

  if (status.dashboard) {
    requireFields(status.dashboard, ['lastUpdated', 'lastChecked', 'lastOfficialSourceCheck', 'source'], 'status.dashboard')
    if (status.dashboard.lastUpdated !== meta.lastUpdated) errors.push('status.dashboard.lastUpdated must match meta.lastUpdated')
    if (status.dashboard.lastChecked !== meta.lastChecked) errors.push('status.dashboard.lastChecked must match meta.lastChecked')
    if (status.dashboard.lastOfficialSourceCheck !== (meta.lastOfficialSourceCheck ?? meta.lastChecked)) {
      errors.push('status.dashboard.lastOfficialSourceCheck must match meta')
    }
    if (status.dashboard.source !== meta.source) errors.push('status.dashboard.source must match meta.source')
  }

  if (status.metrics) {
    for (const key of ['confirmed', 'deaths', 'countries', 'usStatesMonitoring', 'whoGlobalRisk', 'cdcResponseLevel', 'ecdcRisk']) {
      if (status.metrics[key] !== meta[key]) errors.push(`status.metrics.${key} must match meta.${key}`)
    }
  }

  if (status.pipeline) {
    requireFields(status.pipeline, ['extractionStatus', 'itemsFound', 'candidateItemsFound', 'failedFeeds', 'criticalFeedFailures', 'officialSourceFailures'], 'status.pipeline')
    if (!Array.isArray(status.pipeline.failedFeeds)) errors.push('status.pipeline.failedFeeds must be an array')
    if (!Array.isArray(status.pipeline.criticalFeedFailures)) errors.push('status.pipeline.criticalFeedFailures must be an array')
    if (!Array.isArray(status.pipeline.officialSourceFailures)) errors.push('status.pipeline.officialSourceFailures must be an array')
    if (status.pipeline.extractionStatus !== (meta.feedHealth?.extractionStatus ?? 'unknown')) {
      errors.push('status.pipeline.extractionStatus must match meta.feedHealth.extractionStatus')
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

// ---------------------------------------------------------------------------
// Generalized biosecurity records (signals, signal timeline, signal sources)
// ---------------------------------------------------------------------------

const signals = readJson('signals') ?? []
const signalTimeline = readJson('signalTimeline') ?? []
const signalSources = readJson('signalSources') ?? []

if (!Array.isArray(signals) || signals.length === 0) {
  errors.push('signals.json must be a non-empty array')
}
if (!Array.isArray(signalSources) || signalSources.length === 0) {
  errors.push('signal-sources.json must be a non-empty array')
}

checkDuplicate(signalSources, (source) => source.id, 'signal source ids')
const signalSourceIds = new Set(signalSources.map((source) => source.id))

signalSources.forEach((source, index) => {
  const label = `signal-sources[${index}]`
  requireFields(source, ['id', 'authority', 'title', 'sourceType', 'primary', 'url', 'lastVerified', 'domains'], label)
  if (source.sourceType && !SOURCE_TYPES.has(source.sourceType)) {
    errors.push(`${label}: invalid sourceType "${source.sourceType}"`)
  }
  if (typeof source.primary !== 'boolean') errors.push(`${label}: primary must be boolean`)
  if (source.url && !isUrl(source.url)) errors.push(`${label}: url must be valid`)
  if (source.lastVerified && !isIsoDate(source.lastVerified)) {
    errors.push(`${label}: lastVerified must be an ISO date string`)
  }
  if (source.publicationDate && !isIsoDate(source.publicationDate)) {
    errors.push(`${label}: publicationDate must be an ISO date string`)
  }
  if (!Array.isArray(source.domains) || source.domains.length === 0) {
    errors.push(`${label}: domains must be a non-empty array`)
  } else {
    source.domains.forEach((domain) => {
      if (!THREAT_CATEGORIES.has(domain)) errors.push(`${label}: invalid domain "${domain}"`)
    })
  }
})

checkDuplicate(signals, (signal) => signal.id, 'signal ids')
const signalIds = new Set(signals.map((signal) => signal.id))

signals.forEach((signal, index) => {
  const label = `signals[${index}] (${signal.id ?? 'no-id'})`
  requireFields(signal, [
    'id', 'name', 'category', 'geography', 'severity', 'confidence', 'trend', 'status',
    'summary', 'operationalRelevance', 'primarySourceId', 'sourceIds', 'lastUpdated', 'lastChecked',
  ], label)
  if (signal.category && !THREAT_CATEGORIES.has(signal.category)) {
    errors.push(`${label}: invalid category "${signal.category}"`)
  }
  if (signal.severity && !SIGNAL_SEVERITIES.has(signal.severity)) {
    errors.push(`${label}: invalid severity "${signal.severity}"`)
  }
  if (signal.confidence && !SIGNAL_CONFIDENCES.has(signal.confidence)) {
    errors.push(`${label}: invalid confidence "${signal.confidence}"`)
  }
  if (signal.trend && !SIGNAL_TRENDS.has(signal.trend)) {
    errors.push(`${label}: invalid trend "${signal.trend}"`)
  }
  if (signal.status && !SIGNAL_STATUSES.has(signal.status)) {
    errors.push(`${label}: invalid status "${signal.status}"`)
  }
  if (!Array.isArray(signal.geography) || signal.geography.length === 0) {
    errors.push(`${label}: geography must be a non-empty array`)
  }
  if (signal.lastUpdated && !isIsoDate(signal.lastUpdated)) errors.push(`${label}: lastUpdated must be ISO`)
  if (signal.lastChecked && !isIsoDate(signal.lastChecked)) errors.push(`${label}: lastChecked must be ISO`)
  if (signal.primarySourceId && !signalSourceIds.has(signal.primarySourceId)) {
    errors.push(`${label}: primarySourceId "${signal.primarySourceId}" not in signal-sources.json`)
  }
  if (Array.isArray(signal.sourceIds)) {
    signal.sourceIds.forEach((sourceId) => {
      if (!signalSourceIds.has(sourceId)) {
        errors.push(`${label}: sourceIds references unknown "${sourceId}"`)
      }
    })
  } else {
    errors.push(`${label}: sourceIds must be an array`)
  }
  if (signal.metrics) {
    if (!Array.isArray(signal.metrics)) {
      errors.push(`${label}: metrics must be an array`)
    } else {
      signal.metrics.forEach((metric, mIndex) => {
        requireFields(metric, ['label', 'value', 'sourceId'], `${label}.metrics[${mIndex}]`)
        if (metric.sourceId && !signalSourceIds.has(metric.sourceId)) {
          errors.push(`${label}.metrics[${mIndex}]: unknown sourceId "${metric.sourceId}"`)
        }
      })
    }
  }
  if (signal.mapMarkers) {
    if (!Array.isArray(signal.mapMarkers)) {
      errors.push(`${label}: mapMarkers must be an array`)
    } else {
      signal.mapMarkers.forEach((marker, mIndex) => {
        const mLabel = `${label}.mapMarkers[${mIndex}]`
        requireFields(marker, ['id', 'lat', 'lng', 'label'], mLabel)
        if (typeof marker.lat !== 'number' || marker.lat < -90 || marker.lat > 90) {
          errors.push(`${mLabel}: invalid latitude`)
        }
        if (typeof marker.lng !== 'number' || marker.lng < -180 || marker.lng > 180) {
          errors.push(`${mLabel}: invalid longitude`)
        }
      })
    }
  }
  if (signal.detailSections) {
    if (!Array.isArray(signal.detailSections)) {
      errors.push(`${label}: detailSections must be an array`)
    } else {
      signal.detailSections.forEach((section, sIndex) => {
        requireFields(section, ['id', 'title', 'bodyMarkdown'], `${label}.detailSections[${sIndex}]`)
      })
    }
  }
})

checkDuplicate(signalTimeline, (event) => event.id, 'signal-timeline ids')
signalTimeline.forEach((event, index) => {
  const label = `signal-timeline[${index}]`
  requireFields(event, ['id', 'signalId', 'date', 'title', 'description', 'sourceId', 'category'], label)
  if (event.category && !THREAT_CATEGORIES.has(event.category)) {
    errors.push(`${label}: invalid category "${event.category}"`)
  }
  if (event.date && !isParseableDate(event.date)) errors.push(`${label}: date must be parseable`)
  if (event.signalId && !signalIds.has(event.signalId)) {
    errors.push(`${label}: signalId "${event.signalId}" not in signals.json`)
  }
  if (event.sourceId && !signalSourceIds.has(event.sourceId)) {
    errors.push(`${label}: sourceId "${event.sourceId}" not in signal-sources.json`)
  }
})

if (errors.length > 0) {
  console.error('[validate-data] FAILED')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('[validate-data] OK')
