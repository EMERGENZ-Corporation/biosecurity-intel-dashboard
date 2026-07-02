#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * EMERGENZ Biosecurity Intel Dashboard - autonomous signal discovery.
 *
 * This is a deterministic official-source scanner. It writes only the internal
 * signal-candidates.json artifact. Curated public signal facts remain governed
 * by src/data/signal-discovery-policy.json and CONTENT-STANDARDS.md:
 * official epidemiologic sources can support low-risk monitor/watch candidates;
 * Embassy/State alerts are operational sentinels and cannot write counts.
 */

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { XMLParser } from 'fast-xml-parser'

const SIGNALS_PATH = process.env.SIGNAL_DISCOVERY_SIGNALS_PATH || 'src/data/signals.json'
const SOURCES_PATH = process.env.SIGNAL_DISCOVERY_SOURCES_PATH || 'src/data/signal-sources.json'
const POLICY_PATH = process.env.SIGNAL_DISCOVERY_POLICY_PATH || 'src/data/signal-discovery-policy.json'
const OUTPUT_PATH = process.env.SIGNAL_DISCOVERY_OUTPUT || 'signal-candidates.json'

const USER_AGENT =
  'Mozilla/5.0 (compatible; EMERGENZ-signal-discovery/1.0; +https://github.com/EMERGENZ-Corporation/biosecurity-intel-dashboard)'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: '__cdata',
  parseTagValue: false,
})

const SEVERITY_RANK = { monitor: 0, watch: 1, concern: 2, action: 3 }

export function stripHtml(str = '') {
  return String(str)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&ndash;|&mdash;/gi, '-')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseHumanDate(text) {
  const m = String(text).match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\b/i)
  if (!m) return null
  const month = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  }[m[1].toLowerCase()]
  return `${m[3]}-${month}-${String(Number(m[2])).padStart(2, '0')}`
}

function textValue(node) {
  if (!node) return ''
  if (typeof node === 'string') return stripHtml(node)
  if (typeof node === 'number') return String(node)
  if (node.__cdata) return stripHtml(node.__cdata)
  if (node['#text']) return stripHtml(node['#text'])
  if (node.rendered) return stripHtml(node.rendered)
  return stripHtml(JSON.stringify(node))
}

export function parseFdaOutbreaks(html) {
  const text = stripHtml(html)
  const activeStart = text.search(/\bActive Investigations\b/i)
  const closedStart = text.search(/\bClosed Investigations\b/i)
  const activeText = activeStart >= 0
    ? text.slice(activeStart, closedStart > activeStart ? closedStart : undefined)
    : text
  const rows = []
  const rowTexts = activeText
    .split(/(?=\b\d{1,2}\/\d{1,2}\/20\d{2}\s+1[0-9]{3}\s+)/g)
    .filter((row) => /^\d{1,2}\/\d{1,2}\/20\d{2}\s+1[0-9]{3}\s+/i.test(row))
  for (const rowText of rowTexts) {
    const ref = rowText.match(/^\d{1,2}\/\d{1,2}\/20\d{2}\s+(1[0-9]{3})\s+/)?.[1]
    if (!ref || !/cyclospora|cyclosporiasis/i.test(rowText)) continue
    const window = rowText
    const product = /Not Yet Identified/i.test(window) ? 'Not Yet Identified' : null
    const caseMatch =
      window.match(/(?:Cyclospora|Cyclosporiasis)[^0-9]{0,160}(\d{1,5})\s+(?:case|cases|illness|illnesses)\b/i) ||
      window.match(/(?:Not Yet Identified|identified)[^0-9]{0,80}(\d{1,5})\b/i)
    const eventEnded = /\b(event ended|ended)\b/i.test(window)
    const status =
      /\bongoing\b/i.test(window) ? 'ongoing' : eventEnded ? 'event-ended-active-investigation' : 'active-investigation'
    const checkCount = (window.match(/✔/g) || []).length
    rows.push({
      reference: ref,
      pathogen: 'Cyclospora',
      product,
      cases: caseMatch ? Number(caseMatch[1]) : null,
      status,
      traceback: /traceback/i.test(window) || checkCount >= 1,
      sampling: /sampling/i.test(window) || checkCount >= 2,
    })
  }

  const byRef = new Map()
  for (const row of rows) byRef.set(row.reference, row)
  return {
    found: byRef.size > 0,
    source: 'FDA CORE',
    cyclosporaInvestigations: [...byRef.values()].sort((a, b) => a.reference.localeCompare(b.reference)),
    textHashInputLength: text.length,
  }
}

export function parseCdcCyclosporiasis(html) {
  const text = stripHtml(html)
  const cases = text.match(/Cases acquired in the United States:\s*([0-9,]+)/i) ||
    text.match(/\b([0-9,]+)\s+cases were reported in people who acquired cyclosporiasis in the United States/i)
  const hospitalizations = text.match(/Hospitalizations:\s*([0-9,]+)/i)
  const deaths = text.match(/Deaths:\s*([0-9,]+)/i)
  const states = text.match(/States reporting cases:\s*([0-9,]+)/i) ||
    text.match(/Cases were reported by\s+([0-9,]+)\s+states/i)
  return {
    found: /Surveillance of Cyclosporiasis/i.test(text) && /2026 fast facts/i.test(text),
    updated: parseHumanDate(text),
    usAcquiredCases: cases ? Number(cases[1].replace(/,/g, '')) : null,
    hospitalizations: hospitalizations ? Number(hospitalizations[1].replace(/,/g, '')) : null,
    deaths: deaths ? Number(deaths[1].replace(/,/g, '')) : null,
    statesReporting: states ? Number(states[1].replace(/,/g, '')) : null,
    noSingleMultistateOutbreak: /no evidence of a single, multistate Cyclospora outbreak/i.test(text),
  }
}

export function detectPowassanCurrentData(html) {
  const text = stripHtml(html)
  const updateDate = parseHumanDate(text)
  const cadence =
    text.match(/updated every\s+1\s*[–-]\s*2\s+weeks[^.]*\./i)?.[0] ||
    text.match(/updated every\s+1 to 2\s+weeks[^.]*\./i)?.[0] ||
    null
  return {
    found: /Powassan/i.test(text) && /current(?:-| )year/i.test(text),
    updated: updateDate,
    preliminary: /preliminary/i.test(text),
    cadence,
    mentionsStateLocalMoreCurrent: /state and local health departments may have more current/i.test(text),
  }
}

export function parseWhoBundibugyo(html) {
  const text = stripHtml(html)
  const marburgOutbreakPattern = /\bMarburg\b.{0,80}\b(outbreak|case|confirmed|Uganda)\b/i
  return {
    found: /Ebola/i.test(text) && /Bundibugyo/i.test(text),
    disease: /Bundibugyo/i.test(text) ? 'Ebola disease caused by Bundibugyo virus' : null,
    ugandaMentioned: /Uganda/i.test(text),
    drcMentioned: /Democratic Republic of the Congo|DRC/i.test(text),
    marburgMentioned: /Marburg/i.test(text),
    marburgConfirmedOutbreak: marburgOutbreakPattern.test(text) && !/including Ebola and Marburg disease|Ebola virus and Marburg|filovirus disease, including/i.test(text),
  }
}

export function parseEmbassyAlerts(input) {
  const raw = String(input || '')
  const alerts = []

  try {
    const json = JSON.parse(raw)
    const posts = Array.isArray(json) ? json : [json]
    for (const post of posts) {
      const title = textValue(post.title)
      const body = textValue(post.content || post.excerpt || '')
      const link = post.link || post.guid?.rendered || null
      if (!title && !body) continue
      alerts.push({
        title,
        link,
        date: post.date || null,
        text: `${title} ${body}`.trim(),
        sourceFormat: 'wordpress-json',
      })
    }
  } catch {
    try {
      const parsed = xmlParser.parse(raw)
      const channel = parsed?.rss?.channel
      const rawItems = Array.isArray(channel?.item) ? channel.item : channel?.item ? [channel.item] : []
      for (const item of rawItems) {
        const title = textValue(item.title)
        const body = textValue(item.description || item['content:encoded'] || '')
        const link = textValue(item.link || item.guid || '')
        alerts.push({
          title,
          link,
          date: textValue(item.pubDate || ''),
          text: `${title} ${body}`.trim(),
          sourceFormat: 'rss',
        })
      }
    } catch {
      const text = stripHtml(raw)
      if (text) {
        alerts.push({
          title: text.match(/Health Alert[^.]{0,120}/i)?.[0] || 'Embassy alert page',
          link: null,
          date: parseHumanDate(text),
          text,
          sourceFormat: 'html',
        })
      }
    }
  }

  return alerts
    .map((alert) => {
      const haystack = alert.text.toLowerCase()
      return {
        ...alert,
        matchedTerms: ['health alert', 'security alert', 'ebola', 'bundibugyo', 'marburg', 'filovirus', 'kampala', 'uganda']
          .filter((term) => haystack.includes(term)),
      }
    })
    .filter((alert) => alert.matchedTerms.length > 0)
}

function maxSeverityAllowed(candidateSeverity, maxSeverity) {
  return SEVERITY_RANK[candidateSeverity] <= SEVERITY_RANK[maxSeverity]
}

function sourceExists(sources, id) {
  return sources.some((source) => source.id === id)
}

function signalExists(signals, id) {
  return signals.some((signal) => signal.id === id)
}

export function buildCandidates({ signals, sources, policy, parsed, checkedAt }) {
  const candidates = []

  const addCandidate = (candidate) => {
    candidates.push({
      discoveredAt: checkedAt,
      ...candidate,
      safety: {
        maxAutoSeverity: candidate.maxAutoSeverity ?? policy.defaultMaxAutoSeverity,
        requestedSeverity: candidate.requestedSeverity ?? 'monitor',
        canAutoPublish: Boolean(candidate.canAutoPublish),
        canWriteCounts: Boolean(candidate.canWriteCounts),
        requiresApproval: Boolean(candidate.requiresApproval),
        ...candidate.safety,
      },
    })
  }

  const cyclosporaPolicy = policy.signals['cyclospora-us-2026']
  const cyclosporaFound = parsed.fda?.found || parsed.cdcCyclosporiasis?.found
  if (cyclosporaFound) {
    const covered = signalExists(signals, 'cyclospora-us-2026')
    const primaryOk = cyclosporaPolicy.allowedSourceIds.every((id) => sourceExists(sources, id))
    const requestedSeverity = 'watch'
    addCandidate({
      id: 'candidate-cyclospora-us-2026',
      signalId: 'cyclospora-us-2026',
      title: 'Cyclospora U.S. foodborne surveillance and FDA CORE traceback lane',
      classification: covered ? 'COVERED_SIGNAL_REFRESH' : 'AUTO_PUBLISH_ELIGIBLE',
      requestedSeverity,
      maxAutoSeverity: cyclosporaPolicy.maxAutoSeverity,
      canAutoPublish: !covered && primaryOk && maxSeverityAllowed(requestedSeverity, cyclosporaPolicy.maxAutoSeverity),
      canWriteCounts: true,
      requiresApproval: !covered && (!primaryOk || !maxSeverityAllowed(requestedSeverity, cyclosporaPolicy.maxAutoSeverity)),
      sourceIds: cyclosporaPolicy.allowedSourceIds,
      findings: {
        cdc: parsed.cdcCyclosporiasis ?? null,
        fda: parsed.fda ?? null,
      },
      proposedAction: covered
        ? 'Keep existing signal reviewed; update only if CDC/FDA facts changed.'
        : 'Create watch-level Cyclospora signal from CDC surveillance plus FDA CORE traceback status.',
    })
  }

  const powassanPolicy = policy.signals['powassan-us-2026']
  if (parsed.powassan?.found) {
    const covered = signalExists(signals, 'powassan-us-2026')
    const primaryOk = powassanPolicy.allowedSourceIds.every((id) => sourceExists(sources, id))
    const requestedSeverity = 'monitor'
    addCandidate({
      id: 'candidate-powassan-us-2026',
      signalId: 'powassan-us-2026',
      title: 'Powassan current-year CDC surveillance lane',
      classification: covered ? 'COVERED_SIGNAL_REFRESH' : 'AUTO_PUBLISH_ELIGIBLE',
      requestedSeverity,
      maxAutoSeverity: powassanPolicy.maxAutoSeverity,
      canAutoPublish: !covered && primaryOk && maxSeverityAllowed(requestedSeverity, powassanPolicy.maxAutoSeverity),
      canWriteCounts: true,
      requiresApproval: !covered && !primaryOk,
      sourceIds: powassanPolicy.allowedSourceIds,
      findings: parsed.powassan,
      proposedAction: covered
        ? 'Keep existing monitor-level signal reviewed against CDC current-year data.'
        : 'Create monitor-level Powassan signal from CDC current-year data and data/maps page.',
    })
  }

  const ebolaPolicy = policy.signals['ebola-bundibugyo-drc-2026']
  const embassyAlerts = parsed.embassyAlerts ?? []
  const whoBundibugyo = parsed.whoBundibugyo ?? null
  if (whoBundibugyo?.found || embassyAlerts.length > 0) {
    const mentionsMarburg = embassyAlerts.some((alert) => alert.matchedTerms.includes('marburg'))
    const marburgUncorroborated = mentionsMarburg && !whoBundibugyo?.marburgConfirmedOutbreak
    addCandidate({
      id: 'candidate-uganda-filovirus-operational-sentinel',
      signalId: 'ebola-bundibugyo-drc-2026',
      title: 'Uganda filovirus operational sentinel: WHO Bundibugyo plus Embassy Kampala alerts',
      classification: 'OPERATIONAL_SENTINEL',
      requestedSeverity: marburgUncorroborated ? 'watch' : 'monitor',
      maxAutoSeverity: 'watch',
      canAutoPublish: false,
      canWriteCounts: false,
      requiresApproval: marburgUncorroborated,
      sourceIds: ebolaPolicy.allowedSourceIds,
      findings: {
        who: whoBundibugyo,
        embassyAlerts: embassyAlerts.map((alert) => ({
          title: alert.title,
          link: alert.link,
          date: alert.date,
          matchedTerms: alert.matchedTerms,
          sourceFormat: alert.sourceFormat,
        })),
      },
      proposedAction: marburgUncorroborated
        ? 'Stage for human review: Embassy/State alert mentions Marburg-like terminology without WHO/CDC/MOH corroboration.'
        : 'Use Embassy/State alerts for operational posture only; keep WHO/CDC/MOH/Africa CDC as epidemiologic sources of record.',
      safety: {
        embassyOnlyCannotWriteCounts: true,
        diseaseIdentityRequiresPrimaryCorroboration: true,
      },
    })
  }

  return candidates
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function atomicWriteFileSync(path, content) {
  const tmp = `${path}.tmp.${process.pid}`
  writeFileSync(tmp, content)
  try {
    renameSync(tmp, path)
  } catch (error) {
    if (existsSync(tmp)) {
      try { unlinkSync(tmp) } catch { /* best effort */ }
    }
    throw error
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/rss+xml,application/json,*/*',
      'User-Agent': USER_AGENT,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return await res.text()
}

async function fetchLane(lane, warnings) {
  const urls = [lane.url, ...(lane.fallbackUrls ?? [])]
  let lastError = null
  for (const url of urls) {
    try {
      return { lane, url, body: await fetchText(url), ok: true }
    } catch (error) {
      lastError = error
      warnings.push(`${lane.id}: fetch failed for ${url}: ${error.message}`)
    }
  }
  return { lane, url: lane.url, body: '', ok: false, error: lastError?.message ?? 'unknown fetch failure' }
}

export async function discover({ signals, sources, policy, checkedAt = new Date().toISOString(), fetchResults = null } = {}) {
  const warnings = []
  const loadedSignals = signals ?? readJson(SIGNALS_PATH)
  const loadedSources = sources ?? readJson(SOURCES_PATH)
  const loadedPolicy = policy ?? readJson(POLICY_PATH)

  if (loadedPolicy.killSwitches?.enabled && process.env[loadedPolicy.killSwitches.envVar] === loadedPolicy.killSwitches.disableValue) {
    return {
      ok: true,
      status: 'disabled',
      actionRequired: false,
      checkedAt,
      candidates: [],
      warnings: [`disabled by ${loadedPolicy.killSwitches.envVar}`],
    }
  }

  const laneResults = fetchResults ?? await Promise.all(loadedPolicy.sourceLanes.map((lane) => fetchLane(lane, warnings)))
  const byLane = Object.fromEntries(laneResults.map((result) => [result.lane.id, result]))
  const parsed = {
    fda: byLane['fda-core-foodborne']?.ok ? parseFdaOutbreaks(byLane['fda-core-foodborne'].body) : null,
    cdcCyclosporiasis: byLane['cdc-cyclosporiasis-surveillance']?.ok ? parseCdcCyclosporiasis(byLane['cdc-cyclosporiasis-surveillance'].body) : null,
    powassan: byLane['cdc-powassan-current-year']?.ok ? detectPowassanCurrentData(byLane['cdc-powassan-current-year'].body) : null,
    whoBundibugyo: byLane['who-bundibugyo-situation']?.ok ? parseWhoBundibugyo(byLane['who-bundibugyo-situation'].body) : null,
    embassyAlerts: byLane['state-embassy-kampala-alert-feed']?.ok ? parseEmbassyAlerts(byLane['state-embassy-kampala-alert-feed'].body) : [],
  }
  const candidates = buildCandidates({ signals: loadedSignals, sources: loadedSources, policy: loadedPolicy, parsed, checkedAt })
  const actionRequired = candidates.some((candidate) => candidate.safety.requiresApproval)
  return {
    ok: true,
    status: actionRequired ? 'approval-needed' : 'covered-or-auto-eligible',
    actionRequired,
    checkedAt,
    sourceLaneHealth: laneResults.map((result) => ({
      id: result.lane.id,
      ok: result.ok,
      url: result.url,
      role: result.lane.role,
      canWriteCounts: Boolean(result.lane.canWriteCounts),
      error: result.error ?? null,
    })),
    counts: {
      candidates: candidates.length,
      approvalRequired: candidates.filter((candidate) => candidate.safety.requiresApproval).length,
      autoPublishEligible: candidates.filter((candidate) => candidate.safety.canAutoPublish).length,
      coveredRefreshes: candidates.filter((candidate) => candidate.classification === 'COVERED_SIGNAL_REFRESH').length,
      operationalSentinels: candidates.filter((candidate) => candidate.classification === 'OPERATIONAL_SENTINEL').length,
    },
    candidates,
    warnings,
  }
}

async function main() {
  const result = await discover()
  atomicWriteFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n')
  console.log(`[discover-signals] wrote ${OUTPUT_PATH}; status=${result.status}; candidates=${result.counts?.candidates ?? 0}; actionRequired=${result.actionRequired}`)
  for (const warning of result.warnings ?? []) console.warn(`[discover-signals] warning: ${warning}`)
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  main().catch((error) => {
    console.error('[discover-signals] FAILED:', error.message)
    try {
      atomicWriteFileSync(OUTPUT_PATH, JSON.stringify({
        ok: false,
        status: 'script-error',
        actionRequired: true,
        checkedAt: new Date().toISOString(),
        error: error.message,
      }, null, 2) + '\n')
    } catch { /* ignore */ }
    process.exitCode = 1
  })
}
