/**
 * CompetingHypothesesBlock
 *
 * Renders the ICD-203 competing-hypothesis section for a signal.
 * Surfaces documented analytical disagreements between authorities
 * or analyst communities. Disposition badges distinguish active debates
 * from hypotheses that have been investigated and discounted.
 *
 * Design intent: amber/yellow tones signal analytic caution — these are
 * not settled facts, they are documented alternative views that a
 * competent intelligence officer must consider.
 */
import type { AlternativeHypothesis, HypothesisDisposition } from '../types'

const DISPOSITION_LABELS: Record<HypothesisDisposition, string> = {
  active: 'Active debate',
  'under-investigation': 'Under investigation',
  discounted: 'Discounted',
}

const DISPOSITION_COLORS: Record<HypothesisDisposition, string> = {
  active: 'var(--color-severity-concern)',
  'under-investigation': 'var(--color-accent-blue)',
  discounted: 'var(--color-text-muted)',
}

interface Props {
  hypotheses: AlternativeHypothesis[]
}

export default function CompetingHypothesesBlock({ hypotheses }: Props) {
  if (!hypotheses.length) return null

  return (
    <section
      id="competing-hypotheses"
      style={{ scrollMarginTop: '1rem', marginBottom: '1.5rem' }}
      aria-label="Competing hypotheses"
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            fontWeight: 700,
            color: 'var(--color-severity-concern)',
            background: 'color-mix(in srgb, var(--color-severity-concern) 12%, transparent)',
            padding: '0.1875rem 0.5rem',
            borderRadius: '3px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          ICD-203
        </span>
        <h2
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Competing hypotheses
        </h2>
      </div>

      {/* Explanatory note — raised to ≥12px per WCAG; rephrased for compliance:
          proponent attributions are EMERGENZ summaries, not direct quotes. */}
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          margin: '0 0 0.5rem 0',
          lineHeight: 1.55,
        }}
      >
        Alternative analytical interpretations of this signal. Surfacing competing
        hypotheses is a recognized ICD-203 analytic-rigor practice — single-hypothesis
        thinking is a documented source of intelligence failure.
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 0.75rem 0',
          lineHeight: 1.55,
          fontStyle: 'italic',
        }}
      >
        Proponent attributions are editorial summaries of public positions held by
        the named entity in the linked source document. They are not direct quotations
        and do not represent endorsement by that entity. Cite the linked source — not
        this summary — when attributing a position to a named authority.
      </p>

      {/* Hypothesis cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {hypotheses.map((h, i) => (
          <div
            key={i}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              borderLeft: `3px solid ${DISPOSITION_COLORS[h.disposition]}`,
              borderRadius: '4px',
            }}
          >
            {/* Header row: hypothesis label + disposition badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.375rem',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {h.hypothesis}
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: DISPOSITION_COLORS[h.disposition],
                  background: `color-mix(in srgb, ${DISPOSITION_COLORS[h.disposition]} 12%, transparent)`,
                  padding: '0.125rem 0.375rem',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {DISPOSITION_LABELS[h.disposition]}
              </span>
            </div>

            {/* Proponent */}
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.5625rem',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.375rem',
              }}
            >
              Proponent: {h.proponent}
            </div>

            {/* Evidence */}
            <p
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {h.evidence}
            </p>

            {/* Source link */}
            {h.url && (
              <a
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.5625rem',
                  color: 'var(--color-accent-blue)',
                  display: 'inline-block',
                  marginTop: '0.375rem',
                }}
              >
                Source ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
