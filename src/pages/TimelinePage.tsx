import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { signalTimeline, getSource, getSignal, categoryLabel } from '../utils/signals'
import { ThreatCategory, THREAT_CATEGORY_LABELS } from '../types'

export default function TimelinePage() {
  const [filter, setFilter] = useState<ThreatCategory | 'all'>('all')

  const events = useMemo(() => {
    const subset = filter === 'all' ? signalTimeline : signalTimeline.filter((event) => event.category === filter)
    return [...subset].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [filter])

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
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
        Cross-domain developments across monitored signals
      </p>

      <div
        style={{
          display: 'flex',
          gap: '0.375rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          alignItems: 'center',
        }}
      >
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Category:
        </span>
        {(['all', ...Object.keys(THREAT_CATEGORY_LABELS)] as Array<ThreatCategory | 'all'>).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: filter === key ? 'var(--color-accent-blue)' : 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: filter === key ? '#000' : 'var(--color-text-secondary)',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {key === 'all' ? 'All' : THREAT_CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {events.map((event) => {
          const source = getSource(event.sourceId)
          const signal = getSignal(event.signalId)
          return (
            <div
              key={event.id}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderLeft: '3px solid var(--color-accent-blue)',
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {event.date} · {categoryLabel(event.category)}
                </span>
                {signal && (
                  <Link
                    to={`/signals/${signal.id}`}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-accent-blue)', textDecoration: 'none' }}
                  >
                    {signal.name} →
                  </Link>
                )}
              </div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.9375rem', color: 'var(--color-text-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                {event.title}
              </div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: '0.25rem' }}>
                {event.description}
              </div>
              {source && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-accent-blue)', textDecoration: 'none', marginTop: '0.375rem', display: 'inline-block' }}
                >
                  {source.authority} · {source.title} ↗
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
