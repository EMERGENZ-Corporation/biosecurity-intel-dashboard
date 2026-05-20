export interface MarkerSource {
  label: string
  url: string
}

export interface Marker {
  id: string
  name: string
  lat: number
  lng: number
  type: 'ship_route' | 'case_confirmed' | 'death' | 'monitoring_facility' | 'us_state_monitoring' | 'flight_tracing' | 'return_destination'
  status: string
  description: string
  source: string
  sourceUrl: string
  sources?: MarkerSource[]
}

export interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  source: string
  sourceUrl: string
  category: 'WHO' | 'CDC' | 'ECDC' | 'other'
}

export interface Source {
  id: string
  authority: string
  authorityFull: string
  title: string
  documentType: string
  publicationDate: string
  lastVerified: string
  url: string
  contentUsed: string
  license: string
  accessStatus: string
}

export interface USMonitoringEntry {
  state: string
  personsMonitored: number | null
  exposureCategory: string
  confirmedCases: number
  confirmedCasesNote: string
  sourceUrl: string
}

export interface FlightEntry {
  id: string
  flightNumber: string
  operator: string
  route: string
  date: string
  passengersTraced: string
  exposureDescription: string
  status: string
  source: string
  sourceUrl: string
}

// ---------------------------------------------------------------------------
// Generalized biosecurity data model (signals, timeline, sources, status).
// ---------------------------------------------------------------------------

export type ThreatCategory =
  | 'vhf'
  | 'respiratory'
  | 'zoonotic'
  | 'vaccine_preventable'
  | 'enteric'
  | 'vector_borne'
  | 'amr_fungal'
  | 'environmental'
  | 'mass_gathering'
  | 'travel'

export const THREAT_CATEGORY_LABELS: Record<ThreatCategory, string> = {
  vhf: 'Viral hemorrhagic fever',
  respiratory: 'Respiratory viruses',
  zoonotic: 'Zoonotic / One Health',
  vaccine_preventable: 'Vaccine-preventable disease',
  enteric: 'Enteric / waterborne',
  vector_borne: 'Vector-borne disease',
  amr_fungal: 'AMR / fungal / healthcare-associated',
  environmental: 'Wastewater / environmental',
  mass_gathering: 'Event-based / mass gathering',
  travel: 'Travel-linked / importation',
}

export type SignalSeverity = 'monitor' | 'watch' | 'concern' | 'action'
export type SignalConfidence = 'official' | 'corroborated' | 'emerging' | 'unverified'
export type SignalTrend = 'increasing' | 'stable' | 'decreasing' | 'unknown'
export type SignalStatus = 'active' | 'monitoring' | 'resolved'

export interface SignalMetric {
  label: string
  value: number | string
  sourceId: string
  unit?: string
  asOf?: string
}

export interface SignalMapMarker {
  id: string
  lat: number
  lng: number
  label: string
  description?: string
  severity?: SignalSeverity
}

export interface SignalDetailSection {
  id: string
  title: string
  /** Plain text or lightweight markdown. Rendered as paragraphs in the UI. */
  bodyMarkdown: string
}

export interface Signal {
  id: string
  name: string
  category: ThreatCategory
  pathogen?: string
  geography: string[]
  severity: SignalSeverity
  confidence: SignalConfidence
  trend: SignalTrend
  status: SignalStatus
  summary: string
  operationalRelevance: string
  whyItMatters?: string
  currentSituation?: string
  geographyNotes?: string
  metrics?: SignalMetric[]
  mapMarkers?: SignalMapMarker[]
  detailSections?: SignalDetailSection[]
  primarySourceId: string
  sourceIds: string[]
  lastUpdated: string
  lastChecked: string
}

export interface SignalTimelineEvent {
  id: string
  signalId: string
  date: string
  title: string
  description: string
  sourceId: string
  category: ThreatCategory
}

export type SourceType =
  | 'outbreak-news'
  | 'expert-weekly-report'
  | 'health-advisory'
  | 'surveillance-dashboard'
  | 'wastewater'
  | 'animal-health'
  | 'academic'
  | 'press-release'
  | 'other'

export interface SignalSource {
  id: string
  authority: string
  authorityFull?: string
  title: string
  sourceType: SourceType
  primary: boolean
  url: string
  publicationDate?: string
  lastVerified: string
  domains: ThreatCategory[]
  geography?: string[]
  notes?: string
}

export interface StatusSignalSummary {
  active: number
  highestSeverity: SignalSeverity | null
  byCategory: Partial<Record<ThreatCategory, number>>
  staleSignalIds: string[]
}

export interface StatusSourcesSummary {
  checked: number
  ok: number
  degraded: string[]
  failed: string[]
}
