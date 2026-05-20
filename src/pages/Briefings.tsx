import { Link } from 'react-router-dom'
import { signals, rankSignals, SEVERITY_COLORS, SEVERITY_LABELS, categoryLabel } from '../utils/signals'

export default function Briefings() {
  const ranked = rankSignals(signals)
  const top = ranked.slice(0, 5)

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.25rem 0',
        }}
      >
        BRIEFINGS
      </h1>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
        Operational summaries for public health, EMS, and healthcare preparedness users
      </p>

      <div
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-primary)', margin: '0 0 0.625rem 0' }}>
          Top operational signals
        </h2>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 0.875rem 0' }}>
          Ranked by severity, confidence, and recency. Use these as a scan list before shift change or
          a preparedness huddle. Each signal links to source-backed detail.
        </p>

        <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {top.map((signal) => (
            <li key={signal.id} style={{ marginBottom: '0.625rem' }}>
              <Link
                to={`/signals/${signal.id}`}
                style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.9375rem', color: 'var(--color-text-primary)', fontWeight: 600, textDecoration: 'none' }}
              >
                {signal.name}
              </Link>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span style={{ color: SEVERITY_COLORS[signal.severity] }}>{SEVERITY_LABELS[signal.severity]}</span> · {categoryLabel(signal.category)} · {signal.geography[0]}
              </div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: '0.25rem' }}>
                {signal.operationalRelevance}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div
        style={{
          padding: '0.875rem 1rem',
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}
      >
        Briefings are derived from the signal records and their primary sources. The MVP shows the
        top-of-queue scan; richer per-domain briefings (EMS, healthcare preparedness, public health
        analyst, nonprofit situational awareness) can be added as static summaries without changing
        the data pipeline.
      </div>
    </div>
  )
}
