// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
// ---------------------------------------------------------------------------
// Host-city biosurveillance — derivation logic.
//
// The host-city data file stores ONLY city identity + source-backed
// observations. Every status shown in the UI (per-domain columns, overall
// severity, confidence, source-freshness) is DERIVED here from observations
// whose publicDisplayAllowed === true. Consequences, enforced by construction:
//   • An "elevated" city with no backing public observation cannot exist.
//   • Observations under review (publicDisplayAllowed:false) never move the
//     public dial (CONTENT-STANDARDS §2.1 / §4.2).
//   • The rollup is deterministic and transparent — situational awareness, not
//     prediction. The parent FIFA signal severity is NOT touched here.
// ---------------------------------------------------------------------------
import type {
  HostCityRecord,
  HostCityObservation,
  HostCityDomain,
  HostCityDomainStatus,
  HostCityFreshnessStatus,
  DerivedHostCityStatus,
  SignalSeverity,
  SignalConfidence,
  SignalSource,
} from '../types'

const SEVERITY_BY_RANK: SignalSeverity[] = ['monitor', 'watch', 'concern', 'action']
const SEVERITY_RANK: Record<SignalSeverity, number> = { monitor: 0, watch: 1, concern: 2, action: 3 }

// Most-conservative confidence wins (higher rank = less certain).
const CONFIDENCE_RANK: Record<SignalConfidence, number> = {
  official: 0,
  corroborated: 1,
  emerging: 2,
  unverified: 3,
}

const DOMAIN_STATUS_RANK: Record<HostCityDomainStatus, number> = {
  unknown: 0,
  unavailable: 1,
  normal: 2,
  decreasing: 3,
  increasing: 4,
  elevated: 5,
}
const DOMAIN_STATUS_BY_RANK = (Object.entries(DOMAIN_STATUS_RANK) as Array<[HostCityDomainStatus, number]>)
  .sort((a, b) => a[1] - b[1])
  .map(([status]) => status)

// FIFA World Cup 2026 window — source-freshness tightens during the tournament.
export const WC_EVENT_START = '2026-06-11'
export const WC_EVENT_END = '2026-07-19'
export const STALE_DAYS_DURING_EVENT = 7
export const STALE_DAYS_OFF_EVENT = 30

type ColumnKey =
  | 'respiratoryStatus'
  | 'entericStatus'
  | 'vaccinePreventableStatus'
  | 'zoonoticVectorStatus'
  | 'environmentalStatus'

const COLUMNS: Array<{ key: ColumnKey; domains: HostCityDomain[] }> = [
  { key: 'respiratoryStatus', domains: ['respiratory'] },
  { key: 'entericStatus', domains: ['enteric'] },
  { key: 'vaccinePreventableStatus', domains: ['vaccine_preventable'] },
  { key: 'zoonoticVectorStatus', domains: ['zoonotic', 'vector_borne'] },
  { key: 'environmentalStatus', domains: ['environmental'] },
]

function publicObservations(city: HostCityRecord): HostCityObservation[] {
  return (city.observations ?? []).filter((o) => o.publicDisplayAllowed === true)
}

function observationDate(o: HostCityObservation): string | undefined {
  return o.reportDate ?? o.sampleDate
}

function isWithinEventWindow(now: Date): boolean {
  const t = now.getTime()
  return t >= new Date(WC_EVENT_START).getTime() && t <= new Date(`${WC_EVENT_END}T23:59:59Z`).getTime()
}

function cityCoversDomains(
  city: HostCityRecord,
  domains: HostCityDomain[],
  sourcesById: Map<string, SignalSource>,
): boolean {
  const wanted = domains as string[]
  return (city.sourceIds ?? []).some((sid) => {
    const src = sourcesById.get(sid)
    return !!src && Array.isArray(src.domains) && src.domains.some((d) => wanted.includes(d))
  })
}

function rollupColumn(
  pubObs: HostCityObservation[],
  domains: HostCityDomain[],
  city: HostCityRecord,
  sourcesById: Map<string, SignalSource>,
): HostCityDomainStatus {
  const contributing = pubObs.filter((o) => domains.includes(o.domain))
  if (contributing.length === 0) {
    // No public signal: distinguish "monitored, no current data" from "not monitored".
    return cityCoversDomains(city, domains, sourcesById) ? 'unavailable' : 'unknown'
  }
  let worstRank = 0
  for (const o of contributing) {
    // A stale observation provides no current domain signal.
    const status: HostCityDomainStatus = o.status === 'stale' ? 'unavailable' : (o.status as HostCityDomainStatus)
    worstRank = Math.max(worstRank, DOMAIN_STATUS_RANK[status] ?? 0)
  }
  return DOMAIN_STATUS_BY_RANK[worstRank]
}

/**
 * Derive the public-facing status of a host city from its source-backed,
 * publicly-displayable observations. Pure + deterministic.
 *
 * Promotion rules (spec):
 *   monitor  — relevant/registered, no abnormal source-backed signal.
 *   watch    — ≥1 elevated/increasing public observation (or one marked watch).
 *   concern  — multiple INDEPENDENT public signals converge (≥2 distinct source
 *              authorities elevated/increasing), or one marked concern.
 *   action   — an observation marked action (official advisory / confirmed
 *              outbreak / agency-confirmed high-consequence signal).
 */
export function deriveHostCityStatus(
  city: HostCityRecord,
  sourcesById: Map<string, SignalSource>,
  now: Date = new Date(),
): DerivedHostCityStatus {
  const pub = publicObservations(city)

  const columns = {} as Record<ColumnKey, HostCityDomainStatus>
  for (const col of COLUMNS) {
    columns[col.key] = rollupColumn(pub, col.domains, city, sourcesById)
  }

  // Convergence counts DISTINCT source authorities — a single program reporting
  // multiple pathogens does not converge into "concern".
  const elevated = pub.filter((o) => o.status === 'elevated' || o.status === 'increasing')
  const elevatedAuthorities = new Set(elevated.map((o) => sourcesById.get(o.sourceId)?.authority ?? o.sourceId))

  let overallRank = SEVERITY_RANK.monitor
  if (pub.some((o) => o.severity === 'action')) {
    overallRank = SEVERITY_RANK.action
  } else if (pub.some((o) => o.severity === 'concern') || elevatedAuthorities.size >= 2) {
    overallRank = SEVERITY_RANK.concern
  } else if (elevated.length >= 1 || pub.some((o) => o.severity === 'watch')) {
    overallRank = SEVERITY_RANK.watch
  }
  const overallBioSignalStatus = SEVERITY_BY_RANK[overallRank]

  // Confidence — floor (most conservative) across public observations.
  let confidence: SignalConfidence | null = null
  for (const o of pub) {
    if (confidence === null || CONFIDENCE_RANK[o.confidence] > CONFIDENCE_RANK[confidence]) {
      confidence = o.confidence
    }
  }

  // Freshness + lastUpdated from the newest public observation date.
  let lastUpdated: string | null = null
  for (const o of pub) {
    const d = observationDate(o)
    if (d && (lastUpdated === null || new Date(d).getTime() > new Date(lastUpdated).getTime())) {
      lastUpdated = d
    }
  }
  let sourceFreshnessStatus: HostCityFreshnessStatus
  if (pub.length === 0) {
    sourceFreshnessStatus = (city.sourceIds ?? []).length > 0 ? 'unavailable' : 'unknown'
  } else if (lastUpdated === null) {
    sourceFreshnessStatus = 'unknown'
  } else {
    const ageDays = (now.getTime() - new Date(lastUpdated).getTime()) / 86_400_000
    const threshold = isWithinEventWindow(now) ? STALE_DAYS_DURING_EVENT : STALE_DAYS_OFF_EVENT
    sourceFreshnessStatus = ageDays <= threshold ? 'current' : 'stale'
  }

  return {
    ...columns,
    overallBioSignalStatus,
    confidence,
    sourceFreshnessStatus,
    lastUpdated,
    publicObservationCount: pub.length,
  }
}
