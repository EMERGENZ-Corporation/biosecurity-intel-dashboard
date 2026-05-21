import { useMemo, useState } from 'react'
import SignalsMap from '../components/SignalsMap'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { signals, SEVERITY_LABELS, MARKER_TYPE_COLORS } from '../utils/signals'
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
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.625rem',
  padding: '0.25rem 0.5rem',
  borderRadius: '4px',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  transition: 'all 0.15s',
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
        (s) => activeCategories.has(s.category) && activeSeverities.has(s.severity)
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
        Geographic view of monitored signals · category, severity, and marker-type filters ·{' '}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span style={ROW_LABEL}>Severity:</span>
          {SEVERITY_OPTIONS.map((s) => {
            const active = activeSeverities.has(s)
            return (
              <button
                key={s}
                onClick={() => toggleSeverity(s)}
                style={{
                  ...CHIP_BASE,
                  backgroundColor: active ? 'var(--color-bg-tertiary)' : 'transparent',
                  border: `1px solid ${active ? 'var(--color-accent-blue)' : 'var(--color-border)'}`,
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
              >
                {SEVERITY_LABELS[s]}
              </button>
            )
          })}
        </div>

        {/* Category row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span style={ROW_LABEL}>Category:</span>
          {(Object.entries(THREAT_CATEGORY_LABELS) as [ThreatCategory, string][]).map(([k, label]) => {
            const active = activeCategories.has(k)
            return (
              <button
                key={k}
                onClick={() => toggleCategory(k)}
                style={{
                  ...CHIP_BASE,
                  backgroundColor: active ? 'var(--color-bg-tertiary)' : 'transparent',
                  border: `1px solid ${active ? 'var(--color-accent-blue)' : 'var(--color-border)'}`,
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Marker-type row with color swatches */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span style={ROW_LABEL}>Marker type:</span>
          {MARKER_TYPE_OPTIONS.map((t) => {
            const active = activeTypes.has(t)
            const color = MARKER_TYPE_COLORS[t]
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                style={{
                  ...CHIP_BASE,
                  backgroundColor: active ? 'var(--color-bg-tertiary)' : 'transparent',
                  border: `1px solid ${active ? color : 'var(--color-border)'}`,
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  opacity: active ? 1 : 0.55,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: '0.625rem',
                    height: '0.625rem',
                    borderRadius: '50%',
                    backgroundColor: color,
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.45)',
                  }}
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
