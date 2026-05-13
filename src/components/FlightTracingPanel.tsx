import type { FlightEntry } from '../types'
import SourceChip from './SourceChip'
import flightsData from '../data/flights.json'

const flights = flightsData as FlightEntry[]

export default function FlightTracingPanel() {
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
          margin: '0 0 0.75rem 0',
        }}
      >
        Flight Contact Tracing
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {flights.map((flight) => (
          <div
            key={flight.id}
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderLeft: '3px solid var(--color-accent-purple)',
              borderRadius: '4px',
              padding: '1rem 1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--color-accent-purple)',
                  }}
                >
                  {flight.flightNumber}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                    marginLeft: '0.5rem',
                  }}
                >
                  {flight.operator}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                {flight.date}
              </span>
            </div>

            <div
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '0.25rem',
              }}
            >
              {flight.route}
            </div>

            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
                marginBottom: '0.5rem',
              }}
            >
              Persons traced: {flight.passengersTraced}
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
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Exposure: </span>
              {flight.exposureDescription}
            </div>

            <div
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Status: </span>
              {flight.status}
            </div>

            <SourceChip
              authority={flight.source.split('/')[0].trim()}
              documentTitle={flight.source}
              date={flight.date}
              url={flight.sourceUrl}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
