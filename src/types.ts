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
  respiratory: 'Respiratory Threats',
  vhf: 'Hemorrhagic Threats',
  enteric: 'Enteric / Waterborne',
  vector_borne: 'Vector-Borne',
  zoonotic: 'Zoonotic Spillover',
  amr_fungal: 'Healthcare-Associated / AMR',
  environmental: 'Environmental Surveillance',
  mass_gathering: 'Mass Gatherings & Events',
  travel: 'Travel & Importation',
  vaccine_preventable: 'Vaccine Gaps',
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
 * Multi-threat marker categories. Includes both the generalized types
 * (outbreak_zone, exposure_event, etc.) and travel/domestic-monitoring
 * types preserved from the original hantavirus dashboard (ship_route,
 * us_state_monitoring, flight_tracing) which are useful for any signal
 * involving travel-linked exposure or domestic surveillance networks.
 */
export type MarkerType =
  | 'case_confirmed'        // confirmed/probable human case
  | 'death'                 // fatal case
  | 'outbreak_zone'         // active outbreak area (city/region/country)
  | 'exposure_event'        // specific exposure incident (HCW exposure, mass-gathering venue)
  | 'monitoring_site'       // wastewater, surveillance, biocontainment, treatment center
  | 'animal_detection'      // livestock/wildlife/poultry detection
  | 'vector_zone'           // vector establishment / endemic vector area
  | 'infrastructure'        // health system asset (BSL lab, port of entry, mass-gathering venue)
  | 'ship_route'            // ship/cruise itinerary waypoint
  | 'us_state_monitoring'   // US state-level domestic monitoring node
  | 'flight_tracing'        // flight contact-tracing origin or destination

export const MARKER_TYPE_LABELS: Record<MarkerType, string> = {
  case_confirmed: 'Confirmed case',
  death: 'Fatal case',
  outbreak_zone: 'Outbreak zone',
  exposure_event: 'Exposure event',
  monitoring_site: 'Monitoring site',
  animal_detection: 'Animal detection',
  vector_zone: 'Vector zone',
  infrastructure: 'Infrastructure',
  ship_route: 'Ship route',
  us_state_monitoring: 'US state monitoring',
  flight_tracing: 'Flight tracing',
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

/**
 * Authoritative risk-level assessment from a public health authority.
 * Renders as a prominent badge strip on signal-detail pages.
 */
/**
 * Prior risk-level entry for the same authority — surfaces the Δ over
 * time per UX-GAP-ANALYSIS §1.7. Renders as a small history strip when
 * a current RiskAssessment carries ≥1 history entry.
 */
export interface RiskAssessmentHistoryEntry {
  /** Previous risk label (e.g. "VERY LOW", "MODERATE"). */
  label: string
  /** Date the previous level was set. */
  asOf: string
  /** Optional link to the previous-level source document. */
  url?: string
}

export interface RiskAssessment {
  /** Authority issuing the assessment (e.g. WHO, CDC, ECDC). */
  authority: string
  /** Label shown on the badge (e.g. "LOW", "VERY LOW", "HAN 528"). */
  label: string
  /** Free-text description (e.g. "Global risk", "EU/EEA risk"). */
  description: string
  /** Link to the issuing document. */
  url: string
  /** Date of the assessment. */
  asOf?: string
  /** Prior risk-level entries (oldest first) showing how this authority's view evolved. */
  history?: RiskAssessmentHistoryEntry[]
}

/**
 * Watch indicator — an explicit escalation trigger per UX-GAP-ANALYSIS §1.7.
 * Surfaces "if X happens, escalate this signal to severity Y" so the
 * medical intelligence officer sees the analytic plan, not just the
 * current state. ICD-203 aligned: makes the analytic methodology
 * transparent.
 */
export interface WatchIndicator {
  /** Short descriptor — "Sustained human-to-human transmission" */
  trigger: string
  /** Operational threshold — "≥3 generations of community transmission" */
  threshold: string
  /** Target severity if the threshold is met */
  escalateTo: SignalSeverity
  /** Why this indicator matters / what it implies */
  rationale: string
}

/**
 * Healthcare-worker alert callout — prominent warning surfaced on
 * signal-detail pages when a signal carries an HCW-relevant operational
 * concern (e.g. documented HCW transmission, faulty procedure exposure).
 */
export interface HcwAlert {
  /** Short headline shown in the alert. */
  headline: string
  /** Plain text body — single paragraph. */
  body: string
  /** Link to the issuing authority's source document. */
  sourceUrl: string
  /** Authority issuing the alert. */
  sourceAuthority: string
  /** Date the alert was issued or last updated. */
  updatedAt: string
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
  /** Authoritative risk assessments from public health authorities. */
  riskAssessments?: RiskAssessment[]
  /** Explicit escalation triggers — surfaces analytic-watch indicators per ICD-203 practice. */
  watchIndicators?: WatchIndicator[]
  /** Healthcare-worker alert callout when applicable. */
  hcwAlert?: HcwAlert
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
