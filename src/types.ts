// ---------------------------------------------------------------------------
// Biosecurity Intel Dashboard — shared data shapes.
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

/**
 * Generalized marker categories for the multi-threat dashboard.
 * Replaces the hantavirus-only types (ship_route, flight_tracing,
 * us_state_monitoring, etc.) with semantically broader categories
 * that work across all signal domains.
 */
export type MarkerType =
  | 'case_confirmed'      // confirmed/probable human case
  | 'death'               // fatal case
  | 'outbreak_zone'       // active outbreak area (city/region/country)
  | 'exposure_event'      // specific exposure incident (ship route, HCW exposure, mass-gathering venue)
  | 'monitoring_site'     // wastewater, surveillance, biocontainment, treatment center
  | 'animal_detection'    // livestock/wildlife/poultry detection
  | 'vector_zone'         // vector establishment / endemic vector area
  | 'infrastructure'      // health system asset (BSL lab, port of entry, mass-gathering venue)

export const MARKER_TYPE_LABELS: Record<MarkerType, string> = {
  case_confirmed: 'Confirmed case',
  death: 'Fatal case',
  outbreak_zone: 'Outbreak zone',
  exposure_event: 'Exposure event',
  monitoring_site: 'Monitoring site',
  animal_detection: 'Animal detection',
  vector_zone: 'Vector zone',
  infrastructure: 'Infrastructure',
}

export interface MarkerSource {
  label: string
  url: string
}

export interface SignalMapMarker {
  id: string
  lat: number
  lng: number
  label: string
  description?: string
  /** Marker category for layer toggle, color, and size. Defaults to outbreak_zone. */
  type?: MarkerType
  severity?: SignalSeverity
  /** Direct source link(s) shown in the popup. */
  sources?: MarkerSource[]
}

/**
 * A citation attached to a content block. The primary attribution lives on
 * SignalDetailSection itself; additionalAttributions[] is for blocks that
 * pull from multiple authoritative documents.
 */
export interface SectionAttribution {
  authority: string
  documentTitle: string
  /** Publication or DON date. ISO date or human-readable year. */
  date: string
  url: string
  license?: string
}

export interface SignalDetailSection {
  id: string
  title: string
  lastReviewed?: string
  updatedAt?: string
  /** Plain text or lightweight markdown. Rendered as paragraphs in the UI. */
  bodyMarkdown: string
  /**
   * Primary source for this block. When present, the section renders with a
   * source-attribution footer (per CONTENT-STANDARDS.md §2.1). When absent,
   * the block falls back to plain rendering for backwards compatibility.
   */
  attribution?: SectionAttribution
  /** Additional supporting sources beyond the primary attribution. */
  additionalAttributions?: SectionAttribution[]
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

export type SourceTier = 1 | 2 | 3 | 4

export interface SignalSource {
  id: string
  authority: string
  authorityFull?: string
  title: string
  sourceType: SourceType
  sourceTier: SourceTier
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

export interface NewsItem {
  id: string
  /** Signal IDs this item relates to. Empty array = general biosecurity coverage. */
  signalIds: string[]
  authority: string
  title: string
  description: string
  link: string
  pubDate: string
  timestamp: number
}
