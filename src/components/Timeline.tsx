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
    <div>
      <h2
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 1rem 0',
        }}
      >
        Outbreak Timeline
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: '600px',
          overflowY: 'auto',
          paddingRight: '0.25rem',
        }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              display: 'flex',
              gap: '0.75rem',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderLeft: `3px solid ${CATEGORY_COLORS[event.category]}`,
              borderRadius: '4px',
              padding: '0.75rem',
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
              }}
            >
              {event.date}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
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
              <SourceChip
                authority={event.source.split('/')[0].trim()}
                documentTitle={event.source}
                date={event.date}
                url={event.sourceUrl}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
