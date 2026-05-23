/**
 * TriageCardPrint — /signals/:id/triage
 *
 * Single-page printable clinical triage card for ED nurses, EMS captains,
 * and EOC briefers. Designed to fit a single sheet of US-Letter / A4 paper.
 *
 * Layout uses the `.print-card` class wired to @media print CSS in index.css
 * so the screen view is also viewable directly without going through the
 * browser print dialog. The "Print" button auto-fires window.print() if the
 * user lands here via the action-strip button — but it's also a perfectly
 * usable screen view.
 *
 * Per CONTENT-STANDARDS §7.1: all clinical content on this card is sourced
 * to a specific authoritative document. We never render this page if
 * signal.triageCard is undefined — clinical fabrication is forbidden.
 *
 * Implements UX-GAP-ANALYSIS §3 #15.
 */
import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getSignal, SEVERITY_COLORS, SEVERITY_LABELS, categoryLabel, formatDate } from '../utils/signals'

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="triage-section-header"
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: '0.75rem 0 0.375rem 0',
        padding: '0.25rem 0.5rem',
        backgroundColor: 'var(--color-bg-tertiary)',
        borderLeft: '3px solid var(--color-emergenz)',
      }}
    >
      {children}
    </h2>
  )
}

export default function TriageCardPrint() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const autoPrint = params.get('print') === '1'

  const signal = id ? getSignal(id) : undefined

  // Auto-fire print dialog on mount when ?print=1 — gives the action-strip
  // "Print triage card" affordance a one-click flow.
  useEffect(() => {
    if (autoPrint && signal?.triageCard && typeof window !== 'undefined') {
      const t = setTimeout(() => window.print(), 300)
      return () => clearTimeout(t)
    }
  }, [autoPrint, signal])

  if (!signal) {
    return (
      <div style={{ padding: '2rem', fontFamily: "'IBM Plex Mono', monospace" }}>
        <h1>Signal not found</h1>
        <Link to="/signals">← Back to signals</Link>
      </div>
    )
  }

  const card = signal.triageCard

  if (!card) {
    return (
      <div style={{ padding: '2rem', maxWidth: '720px' }}>
        <Link to={`/signals/${signal.id}`} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-accent-blue)' }}>
          ← Back to {signal.name}
        </Link>
        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.125rem', marginTop: '1rem' }}>
          Triage card not yet authored
        </h1>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Per <code>CONTENT-STANDARDS §7.1</code>, clinical case-definition cards must be
          manually authored and reviewed by a qualified person against a specific
          authoritative guidance document. A triage card for <strong>{signal.name}</strong> has
          not yet been authored. The full signal briefing remains available.
        </p>
      </div>
    )
  }

  const severityColor = SEVERITY_COLORS[signal.severity]

  return (
    <div className="print-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Screen-only top bar (hidden in print via @media print) */}
      <div
        className="triage-screen-controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <Link to={`/signals/${signal.id}`} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-accent-blue)', textDecoration: 'none' }}>
          ← {signal.name}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--color-bg-primary)',
            backgroundColor: 'var(--color-emergenz)',
            border: 'none',
            cursor: 'pointer',
            padding: '0.4rem 0.75rem',
            borderRadius: '4px',
          }}
        >
          🖨 Print / Save as PDF
        </button>
      </div>

      {/* The actual card */}
      <div
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        {/* Header — name, category, severity */}
        <div style={{ borderBottom: '2px solid var(--color-text-primary)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            <h1
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '1.125rem',
                fontWeight: 700,
                margin: 0,
              }}
            >
              {signal.name}
            </h1>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: severityColor,
                background: `color-mix(in srgb, ${severityColor} 14%, transparent)`,
                padding: '0.1875rem 0.5rem',
                borderRadius: '3px',
              }}
            >
              {SEVERITY_LABELS[signal.severity]}
            </span>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            CLINICAL TRIAGE CARD · {categoryLabel(signal.category)}
            {signal.pathogen ? ` · ${signal.pathogen}` : ''}
          </div>
        </div>

        {/* WHEN TO SUSPECT */}
        <SectionHeader>When to suspect</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              Clinical signs
            </div>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', lineHeight: 1.5 }}>
              {card.whenToSuspect.map((c, i) => (
                <li key={i} style={{ marginBottom: '0.125rem' }}>
                  <strong>{c.label}</strong>
                  {c.detail && <span style={{ color: 'var(--color-text-secondary)' }}> — {c.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              Exposure criteria
            </div>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', lineHeight: 1.5 }}>
              {card.exposureCriteria.map((c, i) => (
                <li key={i} style={{ marginBottom: '0.125rem' }}>
                  <strong>{c.label}</strong>
                  {c.detail && <span style={{ color: 'var(--color-text-secondary)' }}> — {c.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ISOLATION & PPE */}
        <SectionHeader>Isolation & PPE</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', lineHeight: 1.5 }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              Isolation precautions
            </div>
            <div style={{ fontWeight: 600 }}>{card.isolation}</div>
          </div>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              Required PPE
            </div>
            <div style={{ fontWeight: 600 }}>{card.ppe}</div>
          </div>
        </div>

        {/* INITIAL ACTIONS */}
        <SectionHeader>First 30 minutes</SectionHeader>
        <ol style={{ margin: 0, paddingLeft: '1.25rem', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', lineHeight: 1.5 }}>
          {card.initialActions.map((a, i) => (
            <li key={i} style={{ marginBottom: '0.1875rem' }}>{a}</li>
          ))}
        </ol>

        {/* NOTIFY */}
        <SectionHeader>Notify</SectionHeader>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem' }}>
          <thead>
            <tr>
              {['Party', 'Contact', 'Timing'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '0.25rem 0.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.5625rem',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {card.notify.map((n, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.25rem 0.5rem', fontWeight: 600 }}>{n.party}</td>
                <td style={{ padding: '0.25rem 0.5rem', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem' }}>{n.contact}</td>
                <td style={{ padding: '0.25rem 0.5rem', color: 'var(--color-text-secondary)' }}>{n.timing}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TREATMENT */}
        <SectionHeader>Treatment summary</SectionHeader>
        <p style={{ margin: 0, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', lineHeight: 1.55 }}>
          {card.treatmentSummary}
        </p>

        {/* Source footer */}
        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.5625rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <div>
            <strong>Source:</strong>{' '}
            <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-blue)' }}>
              {card.sourceAuthority} — {card.sourceTitle}
            </a>
          </div>
          <div>Last reviewed {formatDate(card.lastReviewed)}</div>
        </div>
        <div
          style={{
            marginTop: '0.25rem',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.5rem',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          For operational reference only. Always verify against your facility's current
          clinical protocols and isolation policies. This card is not a substitute for
          full clinical guidance.
        </div>
      </div>
    </div>
  )
}
