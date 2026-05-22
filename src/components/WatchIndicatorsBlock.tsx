import type { WatchIndicator } from '../types'
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../utils/signals'

interface Props {
  indicators: WatchIndicator[]
}

/**
 * Watch indicators section — per UX-GAP-ANALYSIS §1.7 and ICD-203 alignment,
 * makes the analytic escalation plan explicit. An intel officer can see at
 * a glance what events would push the signal from its current severity
 * to the next.
 */
export default function WatchIndicatorsBlock({ indicators }: Props) {
  if (!indicators || indicators.length === 0) return null

  return (
    <section
      id="watch-indicators"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderLeft: '3px solid var(--color-accent-yellow)',
        borderRadius: '6px',
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
        scrollMarginTop: '1rem',
      }}
    >
      <h2
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0 0 0.5rem 0',
        }}
      >
        Watch indicators
      </h2>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 0.875rem 0',
          lineHeight: 1.5,
        }}
      >
        Explicit escalation triggers. If any threshold is met, severity escalates to the level
        shown. Surface these in shift briefings and watch-officer handoffs.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {indicators.map((ind, i) => {
          const color = SEVERITY_COLORS[ind.escalateTo]
          return (
            <li
              key={i}
              style={{
                padding: '0.625rem 0.875rem',
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderLeft: `3px solid ${color}`,
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.375rem',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {ind.trigger}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.5625rem',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  →
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '0.1rem 0.4rem',
                    border: `1px solid ${color}`,
                    borderRadius: '3px',
                  }}
                >
                  Escalate to {SEVERITY_LABELS[ind.escalateTo]}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.25rem',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '0.4rem' }}>
                  Threshold:
                </span>
                {ind.threshold}
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}
              >
                {ind.rationale}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
