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

const meta = readJson('meta')
const timeline = readJson('timeline') ?? []
const news = readJson('news') ?? []
const markers = readJson('markers') ?? []
const sources = readJson('sources') ?? []
const usMonitoring = readJson('usMonitoring') ?? []
const flights = readJson('flights') ?? []
const emsBriefing = readJson('emsBriefing')
const protocols = readJson('protocols') ?? []

if (meta) {
  requireFields(meta, ['confirmed', 'deaths', 'countries', 'usStatesMonitoring', 'lastUpdated', 'lastChecked', 'source'], 'meta')
  if (!isIsoDate(meta.lastUpdated)) errors.push('meta.lastUpdated must be an ISO date string')
  if (!isIsoDate(meta.lastChecked)) errors.push('meta.lastChecked must be an ISO date string')
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
