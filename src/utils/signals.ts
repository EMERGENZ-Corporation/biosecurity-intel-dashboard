import signalsData from '../data/signals.json'
import timelineData from '../data/signal-timeline.json'
import sourcesData from '../data/signal-sources.json'
import {
  Signal,
  SignalSource,
  SignalTimelineEvent,
  SignalSeverity,
  ThreatCategory,
  THREAT_CATEGORY_LABELS,
  MarkerType,
} from '../types'

export const signals = signalsData as Signal[]
export const signalTimeline = timelineData as SignalTimelineEvent[]
export const signalSources = sourcesData as SignalSource[]

const sourceById = new Map(signalSources.map((source) => [source.id, source]))
const signalById = new Map(signals.map((signal) => [signal.id, signal]))

export function getSignal(id: string): Signal | undefined {
  return signalById.get(id)
}

export function getSource(id: string): SignalSource | undefined {
  return sourceById.get(id)
}

export const SEVERITY_RANK: Record<SignalSeverity, number> = {
  monitor: 0,
  watch: 1,
  concern: 2,
  action: 3,
}

export const SEVERITY_LABELS: Record<SignalSeverity, string> = {
  monitor: 'Monitor',
  watch: 'Watch',
  concern: 'Concern',
  action: 'Action',
}

export const SEVERITY_COLORS: Record<SignalSeverity, string> = {
  monitor: 'var(--color-accent-green)',
  watch: 'var(--color-accent-yellow)',
  concern: 'var(--color-accent-orange)',
  action: 'var(--color-accent-red)',
}

// Marker-type color palette tuned for dark CARTO tile contrast.
// Resolved hex values (not CSS vars) — used by Leaflet CircleMarker which
// does not resolve CSS variables.
export const MARKER_TYPE_COLORS: Record<MarkerType, string> = {
  case_confirmed: '#F85149',     // red
  death: '#FF1744',              // bright red — maximum contrast on dark tiles
  outbreak_zone: '#E08E45',      // orange
  exposure_event: '#BC8CFF',     // violet
  monitoring_site: '#E3B341',    // amber/gold
  animal_detection: '#3FB950',   // green
  vector_zone: '#56D364',        // lime
  infrastructure: '#79C0FF',     // light blue
  ship_route: '#388BFD',         // blue — itinerary trail
  us_state_monitoring: '#3FB950', // green — domestic surveillance
  flight_tracing: '#BC8CFF',     // violet — contact-tracing path
}

// Larger marker radius for case-level and exposure markers, smaller for
// region/infrastructure markers.
const LARGE_MARKER_TYPES: Set<MarkerType> = new Set([
  'case_confirmed', 'death', 'exposure_event', 'monitoring_site', 'flight_tracing',
])

export function markerRadius(type: MarkerType): number {
  return LARGE_MARKER_TYPES.has(type) ? 9 : 6
}

export const CONFIDENCE_LABELS = {
  official: 'Official',
  corroborated: 'Corroborated',
  emerging: 'Emerging',
  unverified: 'Unverified',
} as const

export const TREND_LABELS = {
  increasing: '↑ Increasing',
  stable: '→ Stable',
  decreasing: '↓ Decreasing',
  unknown: '? Unknown',
} as const

export const SOURCE_TIER_LABELS = {
  1: 'Tier 1 · Authoritative',
  2: 'Tier 2 · Institutional',
  3: 'Tier 3 · Media / expert analysis',
  4: 'Tier 4 · Preprint / unreviewed',
} as const

export function rankSignals(input: Signal[]): Signal[] {
  return [...input].sort((a, b) => {
    const severityDelta = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
    if (severityDelta !== 0) return severityDelta
    // Tie-break by confidence (official first) then recency.
    const confidenceOrder = ['official', 'corroborated', 'emerging', 'unverified']
    const confidenceDelta =
      confidenceOrder.indexOf(a.confidence) - confidenceOrder.indexOf(b.confidence)
    if (confidenceDelta !== 0) return confidenceDelta
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  })
}

export function categoryLabel(category: ThreatCategory): string {
  return THREAT_CATEGORY_LABELS[category]
}

export function categoryCounts(input: Signal[]): Partial<Record<ThreatCategory, number>> {
  const counts: Partial<Record<ThreatCategory, number>> = {}
  for (const signal of input) {
    counts[signal.category] = (counts[signal.category] ?? 0) + 1
  }
  return counts
}

export function isSignalStale(signal: Signal, maxAgeHours = 72): boolean {
  const ageMs = Date.now() - new Date(signal.lastChecked).getTime()
  return ageMs > maxAgeHours * 60 * 60 * 1000
}

export function highestSeverity(input: Signal[]): SignalSeverity | null {
  if (input.length === 0) return null
  return input.reduce<SignalSeverity>((acc, signal) => {
    return SEVERITY_RANK[signal.severity] > SEVERITY_RANK[acc] ? signal.severity : acc
  }, 'monitor')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function timelineForSignal(signalId: string): SignalTimelineEvent[] {
  return signalTimeline
    .filter((event) => event.signalId === signalId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
