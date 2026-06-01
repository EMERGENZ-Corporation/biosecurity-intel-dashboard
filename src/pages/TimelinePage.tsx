// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SourceChip from '../components/SourceChip'
import {
  signalTimeline,
  getSource,
  getSignal,
  categoryLabel,
  categoryTone,
  intelToneStyle,
  NEUTRAL_TONE,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  severityTone,
  signalMatchesDomain,
} from '../utils/signals'
import {
  type SignalSeverity,
  type ThreatCategory,
  THREAT_CATEGORY_LABELS,
} from '../types'

const SEVERITY_OPTIONS: SignalSeverity[] = ['monitor', 'watch', 'concern', 'action']

type DateRange = 'all' | '7d' | '30d' | '90d' | '365d'

const DATE_RANGES: { id: DateRange; label: string; days: number | null }[] = [
  { id: 'all', label: 'All', days: null },
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: '365d', label: 'Last year', days: 365 },
]

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
  const [dateRange, setDateRange] = useState<DateRange>('all')

  const events = useMemo(() => {
    const range = DATE_RANGES.find(r => r.id === dateRange)
    const cutoff = range?.days != null ? Date.now() - range.days * 24 * 60 * 60 * 1000 : null
    const subset = signalTimeline.filter((event) => {
      const signal = getSignal(event.signalId)
      if (
        categoryFilter !== 'all' &&
        event.category !== categoryFilter &&
        (!signal || !signalMatchesDomain(signal, categoryFilter))
      ) return false
      if (severityFilter !== 'all') {
        if (!signal || signal.severity !== severityFilter) return false
      }
      if (cutoff !== null) {
        const t = new Date(event.date).getTime()
        if (Number.isNaN(t) || t < cutoff) return false
      }
      return true
    })
    return [...subset].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [categoryFilter, severityFilter, dateRange])

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
        <div role="group" aria-label="Timeline date range filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
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
            Date:
          </span>
          {DATE_RANGES.map((range) => {
            const active = dateRange === range.id
            return (
              <button
                key={range.id}
                type="button"
                aria-pressed={active}
                className={`intel-pill is-button ${active ? 'is-active' : 'is-muted'}`}
                onClick={() => setDateRange(range.id)}
                style={{
                  ...intelToneStyle(NEUTRAL_TONE),
                  cursor: 'pointer',
                }}
              >
                {range.label}
              </button>
            )
          })}
        </div>

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
                className={`intel-pill is-button ${active ? 'is-active' : 'is-muted'}`}
                onClick={() => setSeverityFilter(s)}
                style={{
                  ...intelToneStyle(s === 'all' ? NEUTRAL_TONE : severityTone(s)),
                  cursor: 'pointer',
                }}
              >
                {s === 'all' ? 'All' : SEVERITY_LABELS[s]}
              </button>
            )
          })}
        </div>

        <div role="group" aria-label="Timeline domain filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
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
            Domain:
          </span>
          {(['all', ...Object.keys(THREAT_CATEGORY_LABELS)] as Array<ThreatCategory | 'all'>).map((key) => {
            const active = categoryFilter === key
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                className={`intel-pill is-button ${active ? 'is-active' : 'is-muted'}`}
                onClick={() => setCategoryFilter(key)}
                style={{
                  ...intelToneStyle(key === 'all' ? NEUTRAL_TONE : categoryTone(key)),
                  cursor: 'pointer',
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
                              className="intel-pill is-active"
                              style={{
                                ...intelToneStyle(severityTone(signal.severity)),
                              }}
                            >
                              {SEVERITY_LABELS[signal.severity]}
                            </span>
                          )}
                          <span
                            className="intel-pill is-muted"
                            style={{
                              ...intelToneStyle(categoryTone(event.category)),
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
