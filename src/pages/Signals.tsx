import { useMemo, useState } from 'react'
import SignalCard from '../components/SignalCard'
import {
  signals,
  rankSignals,
  SEVERITY_LABELS,
  NEUTRAL_TONE,
  categoryTone,
  intelToneStyle,
  severityTone,
  type IntelTone,
} from '../utils/signals'
import { SignalSeverity, ThreatCategory, THREAT_CATEGORY_LABELS } from '../types'

const SEVERITY_OPTIONS: SignalSeverity[] = ['monitor', 'watch', 'concern', 'action']

function FilterButton({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean
  tone: IntelTone
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`intel-pill is-button ${active ? 'is-active' : 'is-muted'}`}
      onClick={onClick}
      style={{
        ...intelToneStyle(tone),
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

export default function Signals() {
  const [categoryFilter, setCategoryFilter] = useState<ThreatCategory | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<SignalSeverity | 'all'>('all')

  const filtered = useMemo(() => {
    const subset = signals.filter((signal) => {
      if (categoryFilter !== 'all' && signal.category !== categoryFilter) return false
      if (severityFilter !== 'all' && signal.severity !== severityFilter) return false
      return true
    })
    return rankSignals(subset)
  }, [categoryFilter, severityFilter])

  return (
    <div style={{ maxWidth: '1100px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.25rem 0',
        }}
      >
        SIGNALS
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1rem 0',
        }}
      >
        All monitored biosecurity signals · ranked by severity, confidence, and recency.
      </p>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <div role="group" aria-label="Signal severity filter" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Severity:
          </span>
          <FilterButton active={severityFilter === 'all'} tone={NEUTRAL_TONE} onClick={() => setSeverityFilter('all')}>All</FilterButton>
          {SEVERITY_OPTIONS.map((s) => (
            <FilterButton key={s} active={severityFilter === s} tone={severityTone(s)} onClick={() => setSeverityFilter(s)}>
              {SEVERITY_LABELS[s]}
            </FilterButton>
          ))}
        </div>

        <div role="group" aria-label="Signal category filter" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Category:
          </span>
          <FilterButton active={categoryFilter === 'all'} tone={NEUTRAL_TONE} onClick={() => setCategoryFilter('all')}>All</FilterButton>
          {(Object.entries(THREAT_CATEGORY_LABELS) as Array<[ThreatCategory, string]>).map(([key, label]) => (
            <FilterButton key={key} active={categoryFilter === key} tone={categoryTone(key)} onClick={() => setCategoryFilter(key)}>
              {label}
            </FilterButton>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {filtered.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
        {filtered.length === 0 && (
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            No signals match the current filters.
          </p>
        )}
      </div>
    </div>
  )
}
