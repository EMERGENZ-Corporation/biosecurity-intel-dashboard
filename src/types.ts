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
