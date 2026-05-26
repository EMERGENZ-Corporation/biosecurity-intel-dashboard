import { useMemo, useState } from 'react'
import SignalsMap from '../components/SignalsMap'
import { ErrorBoundary } from '../components/ErrorBoundary'
import {
  signals,
  SEVERITY_LABELS,
  categoryTone,
  intelToneStyle,
  markerTypeTone,
  severityTone,
  signalMatchesDomain,
} from '../utils/signals'
import {
  SignalSeverity,
  ThreatCategory,
  THREAT_CATEGORY_LABELS,
  MarkerType,
  MARKER_TYPE_LABELS,
} from '../types'

const SEVERITY_OPTIONS: SignalSeverity[] = ['monitor', 'watch', 'concern', 'action']
const MARKER_TYPE_OPTIONS: MarkerType[] = [
  'case_confirmed',
  'death',
  'outbreak_zone',
  'exposure_event',
  'monitoring_site',
  'animal_detection',
  'vector_zone',
  'infrastructure',
  'ship_route',
  'us_state_monitoring',
  'flight_tracing',
]

const ROW_LABEL: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.625rem',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  minWidth: '5.5rem',
}

const CHIP_BASE: React.CSSProperties = {
  cursor: 'pointer',
}

export default function MapPage() {
  const [activeCategories, setActiveCategories] = useState<Set<ThreatCategory>>(
    new Set(Object.keys(THREAT_CATEGORY_LABELS) as ThreatCategory[])
  )
  const [activeSeverities, setActiveSeverities] = useState<Set<SignalSeverity>>(
    new Set(SEVERITY_OPTIONS)
  )
  const [activeTypes, setActiveTypes] = useState<Set<MarkerType>>(new Set(MARKER_TYPE_OPTIONS))

  const filtered = useMemo(
    () =>
      signals.filter(
        (s) =>
          (Object.keys(THREAT_CATEGORY_LABELS) as ThreatCategory[]).some(
            (domain) => activeCategories.has(domain) && signalMatchesDomain(s, domain),
          ) &&
          activeSeverities.has(s.severity)
      ),
    [activeCategories, activeSeverities]
  )

  const totalMarkers = useMemo(() => {
    let count = 0
    for (const s of filtered) {
      for (const m of s.mapMarkers ?? []) {
        if (activeTypes.has(m.type ?? 'outbreak_zone')) count++
      }
    }
    return count
  }, [filtered, activeTypes])

  function toggleCategory(cat: ThreatCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function toggleSeverity(s: SignalSeverity) {
    setActiveSeverities((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  function toggleType(t: MarkerType) {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  return (
    <div style={{ maxWidth: '1300px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.25rem 0',
        }}
      >
        MAP
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1rem 0',
        }}
      >
        Geographic view of monitored signals · domain, severity, and marker-type filters ·{' '}
        {totalMarkers} marker{totalMarkers !== 1 ? 's' : ''} visible
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          padding: '0.875rem 1rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        {/* Severity row */}
        <div role="group" aria-label="Map severity filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span style={ROW_LABEL}>Severity:</span>
          {SEVERITY_OPTIONS.map((s) => {
            const active = activeSeverities.has(s)
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                className={`intel-pill is-button ${active ? 'is-active' : 'is-muted'}`}
                onClick={() => toggleSeverity(s)}
                style={{
                  ...CHIP_BASE,
                  ...intelToneStyle(severityTone(s)),
                }}
              >
                {SEVERITY_LABELS[s]}
              </button>
            )
          })}
        </div>

        {/* Category row */}
        <div role="group" aria-label="Map domain filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span style={ROW_LABEL}>Domain:</span>
          {(Object.entries(THREAT_CATEGORY_LABELS) as [ThreatCategory, string][]).map(([k, label]) => {
            const active = activeCategories.has(k)
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                className={`intel-pill is-button ${active ? 'is-active' : 'is-muted'}`}
                onClick={() => toggleCategory(k)}
                style={{
                  ...CHIP_BASE,
                  ...intelToneStyle(categoryTone(k)),
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Marker-type row with color swatches */}
        <div role="group" aria-label="Map marker type filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span style={ROW_LABEL}>Marker type:</span>
          {MARKER_TYPE_OPTIONS.map((t) => {
            const active = activeTypes.has(t)
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                className={`intel-pill is-button ${active ? 'is-active' : 'is-muted'}`}
                onClick={() => toggleType(t)}
                style={{
                  ...CHIP_BASE,
                  ...intelToneStyle(markerTypeTone(t)),
                }}
              >
                <span
                  aria-hidden="true"
                  className="intel-dot"
                />
                {MARKER_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>
      </div>

      <ErrorBoundary label="Map">
        <SignalsMap signals={filtered} height={580} initialZoom={2} visibleTypes={activeTypes} />
      </ErrorBoundary>
    </div>
  )
}
