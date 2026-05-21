import { Link, useParams } from 'react-router-dom'
import {
  getSignal,
  getSource,
  timelineForSignal,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  CONFIDENCE_LABELS,
  TREND_LABELS,
  categoryLabel,
  formatDate,
  formatDateTime,
  SOURCE_TIER_LABELS,
} from '../utils/signals'
import SignalsMap from '../components/SignalsMap'
import ContentBlock from '../components/ContentBlock'
import HcwAlertCard from '../components/HcwAlertCard'
import AuthorityRiskBadges from '../components/AuthorityRiskBadges'
import { ErrorBoundary } from '../components/ErrorBoundary'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.5625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>
        {children}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '1rem 1.25rem',
        marginBottom: '0.875rem',
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
          margin: '0 0 0.625rem 0',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '0.9375rem',
        color: 'var(--color-text-primary)',
        lineHeight: 1.65,
        margin: '0 0 0.625rem 0',
      }}
    >
      {children}
    </p>
  )
}

export default function SignalDetail() {
  const { id } = useParams<{ id: string }>()
  const signal = id ? getSignal(id) : undefined

  if (!signal) {
    return (
      <div style={{ maxWidth: '900px' }}>
        <h1
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '1rem',
            color: 'var(--color-text-primary)',
          }}
        >
          Signal not found
        </h1>
        <Link to="/signals" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-accent-blue)' }}>
          ← Back to signals
        </Link>
      </div>
    )
  }

  const events = timelineForSignal(signal.id)
  const sources = signal.sourceIds.map(getSource).filter(Boolean) as ReturnType<typeof getSource>[]
  const severityColor = SEVERITY_COLORS[signal.severity]

  return (
    <div style={{ maxWidth: '1100px' }}>
      <Link
        to="/signals"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-accent-blue)',
          textDecoration: 'none',
        }}
      >
        ← All signals
      </Link>

      <div style={{ margin: '0.5rem 0 1rem 0' }}>
        <h1
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
            borderLeft: `4px solid ${severityColor}`,
            paddingLeft: '0.75rem',
          }}
        >
          {signal.name}
        </h1>
      </div>

      {/* Field strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <Field label="Category">{categoryLabel(signal.category)}</Field>
        <Field label="Severity">
          <span style={{ color: severityColor }}>{SEVERITY_LABELS[signal.severity]}</span>
        </Field>
        <Field label="Confidence">{CONFIDENCE_LABELS[signal.confidence]}</Field>
        <Field label="Trend">{TREND_LABELS[signal.trend]}</Field>
        <Field label="Status">{signal.status}</Field>
        <Field label="Pathogen">{signal.pathogen ?? '—'}</Field>
        <Field label="Updated">{formatDate(signal.lastUpdated)}</Field>
        <Field label="Last checked">{formatDate(signal.lastChecked)}</Field>
      </div>

      {signal.riskAssessments && signal.riskAssessments.length > 0 && (
        <AuthorityRiskBadges assessments={signal.riskAssessments} />
      )}

      {signal.hcwAlert && <HcwAlertCard alert={signal.hcwAlert} />}

      <Section title="Summary">
        <Paragraph>{signal.summary}</Paragraph>
      </Section>

      {signal.currentSituation && (
        <Section title="Current situation">
          <Paragraph>{signal.currentSituation}</Paragraph>
        </Section>
      )}

      <Section title="Why it matters">
        <Paragraph>{signal.whyItMatters ?? signal.operationalRelevance}</Paragraph>
        {signal.whyItMatters && (
          <>
            <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.5rem' }}>
              Operational relevance
            </h3>
            <Paragraph>{signal.operationalRelevance}</Paragraph>
          </>
        )}
      </Section>

      <Section title="Geography">
        <Paragraph>{signal.geographyNotes ?? signal.geography.join(', ')}</Paragraph>
        {(signal.mapMarkers?.length ?? 0) > 0 && (
          <ErrorBoundary label="Signal map">
            <SignalsMap signals={[signal]} height={320} initialZoom={2} />
          </ErrorBoundary>
        )}
      </Section>

      {(signal.metrics?.length ?? 0) > 0 && (
        <Section title="Metrics">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.5rem',
            }}
          >
            {signal.metrics!.map((metric) => {
              const source = getSource(metric.sourceId)
              return (
                <div
                  key={metric.label}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {metric.value}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    {metric.label}
                  </div>
                  {source && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}
                    >
                      {source.authority} · {source.title} ↗
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {events.length > 0 && (
        <Section title="Timeline">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {events.map((event) => {
              const source = getSource(event.sourceId)
              return (
                <div key={event.id} style={{ padding: '0.625rem 0.75rem', backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {event.date}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
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
                      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-accent-blue)', display: 'inline-block', marginTop: '0.25rem' }}
                    >
                      {source.authority} ↗
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      <Section title="Sources & provenance">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sources.map((source) => source && (
            <li key={source.id} style={{ padding: '0.625rem 0.75rem', backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: source.primary ? 'var(--color-accent-green)' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {source.primary ? 'Primary' : 'Secondary'} · {SOURCE_TIER_LABELS[source.sourceTier]} · {source.sourceType}
              </div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {source.authority} — {source.title}
              </div>
              <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-accent-blue)' }}>
                {source.url} ↗
              </a>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Last verified {formatDate(source.lastVerified)}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {(signal.detailSections?.length ?? 0) > 0 && signal.detailSections!.map((section) => (
        <ContentBlock
          key={section.id}
          title={section.title}
          bodyMarkdown={section.bodyMarkdown}
          attribution={section.attribution}
          additionalAttributions={section.additionalAttributions}
          lastReviewed={section.lastReviewed}
        />
      ))}

      <Section title="Data quality & confidence">
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          Confidence: <span style={{ color: 'var(--color-text-primary)' }}>{CONFIDENCE_LABELS[signal.confidence]}</span>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Last checked: <span style={{ color: 'var(--color-text-primary)' }}>{formatDateTime(signal.lastChecked)}</span>
        </div>
      </Section>
    </div>
  )
}
