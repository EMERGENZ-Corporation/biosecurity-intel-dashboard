import { useMemo, useState } from 'react'
import SignalsMap from '../components/SignalsMap'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { signals, SEVERITY_LABELS } from '../utils/signals'
import { SignalSeverity, ThreatCategory, THREAT_CATEGORY_LABELS } from '../types'

const SEVERITY_OPTIONS: SignalSeverity[] = ['monitor', 'watch', 'concern', 'action']

export default function MapPage() {
  const [activeCategories, setActiveCategories] = useState<Set<ThreatCategory>>(
    new Set(Object.keys(THREAT_CATEGORY_LABELS) as ThreatCategory[])
  )
  const [activeSeverities, setActiveSeverities] = useState<Set<SignalSeverity>>(new Set(SEVERITY_OPTIONS))

  const filtered = useMemo(
    () => signals.filter((signal) => activeCategories.has(signal.category) && activeSeverities.has(signal.severity)),
    [activeCategories, activeSeverities]
  )

  function toggleCategory(cat: ThreatCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function toggleSeverity(s: SignalSeverity) {
    setActiveSeverities((prev) => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
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
        Geographic view of monitored signals · category and severity filters
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '0.75rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Severity:
          </span>
          {SEVERITY_OPTIONS.map((s) => {
            const active = activeSeverities.has(s)
            return (
              <button
                key={s}
                onClick={() => toggleSeverity(s)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.625rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: active ? 'var(--color-bg-tertiary)' : 'transparent',
                  border: `1px solid ${active ? 'var(--color-accent-blue)' : 'var(--color-border)'}`,
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {SEVERITY_LABELS[s]}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Category:
          </span>
          {(Object.entries(THREAT_CATEGORY_LABELS) as Array<[ThreatCategory, string]>).map(([key, label]) => {
            const active = activeCategories.has(key)
            return (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.625rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: active ? 'var(--color-bg-tertiary)' : 'transparent',
                  border: `1px solid ${active ? 'var(--color-accent-blue)' : 'var(--color-border)'}`,
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <ErrorBoundary label="Map">
        <SignalsMap signals={filtered} height={560} initialZoom={2} />
      </ErrorBoundary>
    </div>
  )
}
