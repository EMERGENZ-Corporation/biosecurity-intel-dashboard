import signalsData from '../data/signals.json'
import timelineData from '../data/signal-timeline.json'
import sourcesData from '../data/signal-sources.json'
import type { CSSProperties } from 'react'
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
  monitor: '#3B82F6',
  watch: '#FBBF24',
  concern: '#F97316',
  action: '#EF4444',
}

export interface IntelTone {
  border: string
  glow: string
}

export const NEUTRAL_TONE: IntelTone = {
  border: '#64748B',
  glow: 'rgba(100,116,139,0.24)',
}

export const SEVERITY_TONES: Record<SignalSeverity, IntelTone> = {
  monitor: { border: '#3B82F6', glow: 'rgba(59,130,246,0.25)' },
  watch: { border: '#FBBF24', glow: 'rgba(251,191,36,0.25)' },
  concern: { border: '#F97316', glow: 'rgba(249,115,22,0.25)' },
  action: { border: '#EF4444', glow: 'rgba(239,68,68,0.30)' },
}

export const CATEGORY_TONES: Record<ThreatCategory, IntelTone> = {
  respiratory: { border: '#38BDF8', glow: 'rgba(56,189,248,0.24)' },
  vhf: { border: '#DC2626', glow: 'rgba(220,38,38,0.28)' },
  enteric: { border: '#14B8A6', glow: 'rgba(20,184,166,0.24)' },
  vector_borne: { border: '#22C55E', glow: 'rgba(34,197,94,0.24)' },
  zoonotic: { border: '#84CC16', glow: 'rgba(132,204,22,0.22)' },
  amr_fungal: { border: '#A855F7', glow: 'rgba(168,85,247,0.25)' },
  environmental: { border: '#64748B', glow: 'rgba(100,116,139,0.24)' },
  mass_gathering: { border: '#F59E0B', glow: 'rgba(245,158,11,0.25)' },
  travel: { border: '#0EA5E9', glow: 'rgba(14,165,233,0.24)' },
  vaccine_preventable: { border: '#F97316', glow: 'rgba(249,115,22,0.25)' },
}

// Marker-type color palette tuned for dark CARTO tile contrast.
// Resolved hex values (not CSS vars) — used by Leaflet CircleMarker which
// does not resolve CSS variables.
export const MARKER_TYPE_COLORS: Record<MarkerType, string> = {
  case_confirmed: '#EF4444',
  death: '#991B1B',
  outbreak_zone: '#EA580C',
  exposure_event: '#A855F7',
  monitoring_site: '#EAB308',
  animal_detection: '#22C55E',
  vector_zone: '#15803D',
  infrastructure: '#60A5FA',
  ship_route: '#2563EB',
  us_state_monitoring: '#10B981',
  flight_tracing: '#38BDF8',
}

export const MARKER_TYPE_TONES: Record<MarkerType, IntelTone> = {
  case_confirmed: { border: '#EF4444', glow: 'rgba(239,68,68,0.30)' },
  death: { border: '#991B1B', glow: 'rgba(153,27,27,0.34)' },
  outbreak_zone: { border: '#EA580C', glow: 'rgba(234,88,12,0.28)' },
  exposure_event: { border: '#A855F7', glow: 'rgba(168,85,247,0.26)' },
  monitoring_site: { border: '#EAB308', glow: 'rgba(234,179,8,0.25)' },
  animal_detection: { border: '#22C55E', glow: 'rgba(34,197,94,0.25)' },
  vector_zone: { border: '#15803D', glow: 'rgba(21,128,61,0.30)' },
  infrastructure: { border: '#60A5FA', glow: 'rgba(96,165,250,0.24)' },
  ship_route: { border: '#2563EB', glow: 'rgba(37,99,235,0.26)' },
  us_state_monitoring: { border: '#10B981', glow: 'rgba(16,185,129,0.24)' },
  flight_tracing: { border: '#38BDF8', glow: 'rgba(56,189,248,0.25)' },
}

export function intelToneStyle(tone: IntelTone): CSSProperties {
  return {
    '--pill-color': tone.border,
    '--pill-glow': tone.glow,
  } as CSSProperties
}

export function severityTone(severity: SignalSeverity): IntelTone {
  return SEVERITY_TONES[severity]
}

export function categoryTone(category: ThreatCategory): IntelTone {
  return CATEGORY_TONES[category]
}

export function markerTypeTone(type: MarkerType): IntelTone {
  return MARKER_TYPE_TONES[type]
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
