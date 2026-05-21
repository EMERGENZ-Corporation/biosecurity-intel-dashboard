import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SourceChip from '../components/SourceChip'
import {
  signalTimeline,
  getSource,
  getSignal,
  categoryLabel,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
} from '../utils/signals'
import {
  type SignalSeverity,
  type ThreatCategory,
  THREAT_CATEGORY_LABELS,
} from '../types'

const SEVERITY_OPTIONS: SignalSeverity[] = ['monitor', 'watch', 'concern', 'action']

function monthKey(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TimelinePage() {
  const [categoryFilter, setCategoryFilter] = useState<ThreatCategory | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<SignalSeverity | 'all'>('all')

  const events = useMemo(() => {
    const subset = signalTimeline.filter((event) => {
      if (categoryFilter !== 'all' && event.category !== categoryFilter) return false
      if (severityFilter !== 'all') {
        const signal = getSignal(event.signalId)
        if (!signal || signal.severity !== severityFilter) return false
      }
      return true
    })
    return [...subset].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [categoryFilter, severityFilter])

  // Group events by month for scannable layout
  const grouped = useMemo(() => {
    const map = new Map<string, typeof events>()
    for (const event of events) {
      const key = monthKey(event.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(event)
    }
    return Array.from(map.entries())
  }, [events])

  const signalCount = new Set(events.map((e) => e.signalId)).size

  return (
    <div style={{ maxWidth: '1000px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.25rem 0',
        }}
      >
        TIMELINE
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1rem 0',
        }}
      >
        {events.length} event{events.length !== 1 ? 's' : ''} across {signalCount} signal
        {signalCount !== 1 ? 's' : ''} · newest first
      </p>

      {/* Filters */}
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
        <div role="group" aria-label="Timeline severity filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              minWidth: '5rem',
            }}
          >
            Severity:
          </span>
          {(['all', ...SEVERITY_OPTIONS] as Array<SignalSeverity | 'all'>).map((s) => {
            const active = severityFilter === s
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => setSeverityFilter(s)}
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
                {s === 'all' ? 'All' : SEVERITY_LABELS[s]}
              </button>
            )
          })}
        </div>

        <div role="group" aria-label="Timeline category filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              minWidth: '5rem',
            }}
          >
            Category:
          </span>
          {(['all', ...Object.keys(THREAT_CATEGORY_LABELS)] as Array<ThreatCategory | 'all'>).map((key) => {
            const active = categoryFilter === key
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setCategoryFilter(key)}
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
                {key === 'all' ? 'All' : THREAT_CATEGORY_LABELS[key as ThreatCategory]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Timeline events grouped by month */}
      {grouped.length === 0 ? (
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            padding: '1rem 0',
          }}
        >
          No events match the current filters.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {grouped.map(([month, monthEvents]) => (
            <div key={month}>
              <h2
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--color-emergenz)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  margin: '0 0 0.625rem 0',
                  paddingBottom: '0.375rem',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {month}
                <span
                  style={{
                    marginLeft: '0.5rem',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.5625rem',
                  }}
                >
                  {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}
                </span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {monthEvents.map((event) => {
                  const source = getSource(event.sourceId)
                  const signal = getSignal(event.signalId)
                  const sevColor = signal ? SEVERITY_COLORS[signal.severity] : 'var(--color-border)'
                  return (
                    <div
                      key={event.id}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderLeft: `3px solid ${sevColor}`,
                        borderRadius: '4px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          marginBottom: '0.375rem',
                        }}
                      >
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                          <span
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: 'var(--color-text-primary)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {dayLabel(event.date)}
                          </span>
                          {signal && (
                            <span
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.5625rem',
                                fontWeight: 700,
                                color: sevColor,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                padding: '0.1rem 0.35rem',
                                border: `1px solid ${sevColor}`,
                                borderRadius: '3px',
                              }}
                            >
                              {SEVERITY_LABELS[signal.severity]}
                            </span>
                          )}
                          <span
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: '0.625rem',
                              color: 'var(--color-text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {categoryLabel(event.category)}
                          </span>
                        </div>
                        {signal && (
                          <Link
                            to={`/signals/${signal.id}`}
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: '0.625rem',
                              color: 'var(--color-accent-blue)',
                              textDecoration: 'none',
                            }}
                          >
                            {signal.name} →
                          </Link>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {event.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.55,
                          marginBottom: source ? '0.625rem' : 0,
                        }}
                      >
                        {event.description}
                      </div>
                      {source && (
                        <SourceChip
                          authority={source.authority}
                          documentTitle={source.title}
                          date={source.publicationDate ?? source.lastVerified}
                          url={source.url}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
