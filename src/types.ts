export interface Marker {
  id: string
  name: string
  lat: number
  lng: number
  type: 'ship-route' | 'case' | 'death' | 'monitoring' | 'us-monitoring' | 'flight' | 'us-facility'
  status: string
  description: string
  source: string
  sourceUrl: string
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
