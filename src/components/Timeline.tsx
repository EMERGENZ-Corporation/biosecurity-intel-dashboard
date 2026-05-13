import type { TimelineEvent } from '../types'
import SourceChip from './SourceChip'
import timelineData from '../data/timeline.json'

const events = timelineData as TimelineEvent[]

const CATEGORY_COLORS: Record<TimelineEvent['category'], string> = {
  WHO: 'var(--color-accent-blue)',
  CDC: 'var(--color-accent-red)',
  ECDC: 'var(--color-accent-orange)',
  other: 'var(--color-border)',
}

export default function Timeline() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
        <h2
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: '0 0 0.375rem 0',
          }}
        >
          Outbreak Timeline
        </h2>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Color-coded by authority:{' '}
          <span style={{ color: 'var(--color-accent-blue)' }}>WHO</span>{' · '}
          <span style={{ color: 'var(--color-accent-red)' }}>CDC</span>{' · '}
          <span style={{ color: 'var(--color-accent-orange)' }}>ECDC</span>{' · '}
          <span style={{ color: 'var(--color-text-muted)' }}>News/other</span>
          {' — '}Early outbreak entries (grey) sourced from news media and Wikipedia for situational awareness only. Not clinical guidance.
        </p>
      </div>
      <ul
        aria-label="Outbreak timeline events"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '0.25rem',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {events.map((event) => (
          <li
            key={event.id}
            style={{
              display: 'flex',
              gap: '0.75rem',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderLeft: `3px solid ${CATEGORY_COLORS[event.category]}`,
              borderRadius: '4px',
              padding: '0.75rem',
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
                minWidth: '80px',
                paddingTop: '0.125rem',
                flexShrink: 0,
              }}
            >
              {event.date}
            </div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.8125rem',
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
                  lineHeight: 1.5,
                  marginBottom: '0.5rem',
                }}
              >
                {event.description}
              </div>
              <div style={{ overflow: 'hidden', maxWidth: '100%' }}>
                <SourceChip
                  authority={event.source.split('/')[0].trim()}
                  documentTitle={event.source}
                  date={event.date}
                  url={event.sourceUrl}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
