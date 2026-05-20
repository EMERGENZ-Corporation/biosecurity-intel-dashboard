import { readFileSync } from 'fs'

const DATA_DIR = 'src/data'
const files = {
  status: 'public/status.json',
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
const STATUS_VALUES = new Set(['ok', 'degraded', 'critical'])

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

const signals = readJson('signals') ?? []
const signalTimeline = readJson('signalTimeline') ?? []
const signalSources = readJson('signalSources') ?? []
const status = readJson('status')

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

if (status) {
  requireFields(status, ['schemaVersion', 'status', 'generatedAt', 'thresholds', 'dashboard', 'signals', 'sources', 'pipeline', 'staleReasons'], 'status')
  if (status.schemaVersion !== 2) errors.push(`status.schemaVersion must be 2; got ${status.schemaVersion}`)
  if (!STATUS_VALUES.has(status.status)) errors.push(`status.status invalid: ${status.status}`)
  if (status.generatedAt && !isIsoDate(status.generatedAt)) errors.push('status.generatedAt must be ISO')
  if (!Array.isArray(status.staleReasons)) errors.push('status.staleReasons must be an array')
  if (status.thresholds) {
    requireFields(status.thresholds, ['maxDataAgeHours', 'maxOfficialCheckAgeHours', 'maxSignalStaleHours'], 'status.thresholds')
  }
  if (status.signals) {
    requireFields(status.signals, ['total', 'active', 'byCategory', 'staleSignalIds'], 'status.signals')
    if (status.signals.total !== signals.length) errors.push('status.signals.total must match signals.json length')
    if (!Array.isArray(status.signals.staleSignalIds)) errors.push('status.signals.staleSignalIds must be array')
  }
  if (status.pipeline) {
    if (!Array.isArray(status.pipeline.failedFeeds)) errors.push('status.pipeline.failedFeeds must be array')
    if (!Array.isArray(status.pipeline.officialSourceFailures)) errors.push('status.pipeline.officialSourceFailures must be array')
  }
}

if (errors.length > 0) {
  console.error('[validate-data] FAILED')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('[validate-data] OK')
