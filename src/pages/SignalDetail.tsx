import { useState } from 'react'
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
  categoryTone,
  formatDate,
  formatDateTime,
  intelToneStyle,
  severityTone,
  isSignalStale,
  SOURCE_TIER_LABELS,
} from '../utils/signals'
import SignalsMap from '../components/SignalsMap'
import ContentBlock from '../components/ContentBlock'
import HcwAlertCard from '../components/HcwAlertCard'
import AuthorityRiskBadges from '../components/AuthorityRiskBadges'
import SignalActionStrip from '../components/SignalActionStrip'
import TldrBox from '../components/TldrBox'
import SignalDetailToc, { type TocEntry } from '../components/SignalDetailToc'
import SourceDiversityBadge from '../components/SourceDiversityBadge'
import WatchIndicatorsBlock from '../components/WatchIndicatorsBlock'
import CompetingHypothesesBlock from '../components/CompetingHypothesesBlock'
import RelatedSignalsBlock from '../components/RelatedSignalsBlock'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { signals } from '../utils/signals'

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

/**
 * Section — signal-detail section block.
 *
 * When `collapsible` is true, the header becomes a button that toggles a
 * chevron and shows/hides the body. `defaultOpen` controls initial state
 * (default: false — collapsed). Used to address UX-GAP-ANALYSIS §3 #12
 * (progressive disclosure) — Timeline, Sources, Data quality collapse by
 * default so the page opens with the operational data, not the appendix.
 *
 * Anchor links (#timeline, #sources, #data-quality from the TOC) still
 * work: clicking a TOC link auto-expands its section via a hashchange
 * listener wired up in the page-level component.
 */
function Section({
  title,
  children,
  id,
  collapsible = false,
  defaultOpen = false,
  badge,
}: {
  title: string
  children: React.ReactNode
  id?: string
  collapsible?: boolean
  defaultOpen?: boolean
  /** Optional small badge text shown next to the header (e.g. item count) */
  badge?: string
}) {
  const [open, setOpen] = useState(defaultOpen || !collapsible)

  // If non-collapsible, render the traditional always-open layout.
  if (!collapsible) {
    return (
      <div
        id={id}
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          padding: '1rem 1.25rem',
          marginBottom: '0.875rem',
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
            margin: '0 0 0.625rem 0',
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    )
  }

  // Collapsible: header is a button.
  return (
    <div
      id={id}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: open ? '1rem 1.25rem' : '0.625rem 1.25rem',
        marginBottom: '0.875rem',
        scrollMarginTop: '1rem',
        transition: 'padding 0.15s ease',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id ? `${id}-body` : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: 0,
          margin: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-primary)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: '0.625rem',
              textAlign: 'center',
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
              color: 'var(--color-text-muted)',
              fontSize: '0.6875rem',
            }}
          >
            ▶
          </span>
          {title}
          {badge && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.5625rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-tertiary)',
                padding: '0.125rem 0.375rem',
                borderRadius: '3px',
                textTransform: 'none',
                letterSpacing: '0',
              }}
            >
              {badge}
            </span>
          )}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.5625rem',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {open ? 'Hide' : 'Show'}
        </span>
      </button>
      {open && (
        <div id={id ? `${id}-body` : undefined} style={{ marginTop: '0.75rem' }}>
          {children}
        </div>
      )}
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

  // Build the table-of-contents entries based on what the page actually
  // renders. Conditional sections are omitted unless their data is present.
  const tocEntries: TocEntry[] = [
    { id: 'summary', label: 'Summary' },
    ...(signal.currentSituation ? [{ id: 'current-situation', label: 'Current situation' }] : []),
    { id: 'why-it-matters', label: 'Why it matters' },
    ...((signal.watchIndicators?.length ?? 0) > 0 ? [{ id: 'watch-indicators', label: 'Watch indicators' }] : []),
    ...((signal.alternativeHypotheses?.length ?? 0) > 0 ? [{ id: 'competing-hypotheses', label: 'Competing hypotheses' }] : []),
    { id: 'geography', label: 'Geography' },
    ...((signal.metrics?.length ?? 0) > 0 ? [{ id: 'metrics', label: 'Metrics' }] : []),
    ...(events.length > 0 ? [{ id: 'timeline', label: 'Timeline' }] : []),
    { id: 'sources', label: 'Sources & provenance' },
    ...((signal.detailSections ?? []).map((s) => ({ id: s.id, label: s.title }))),
    { id: 'data-quality', label: 'Data quality' },
    ...((signal.relatedSignals?.length ?? 0) > 0 ? [{ id: 'related-signals', label: 'Related signals' }] : []),
  ]

  return (
    <div style={{ maxWidth: '1320px' }}>
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
        <Field label="Category">
          <span className="intel-pill is-muted" style={intelToneStyle(categoryTone(signal.category))}>
            {categoryLabel(signal.category)}
          </span>
        </Field>
        <Field label="Severity">
          <span className="intel-pill is-active" style={intelToneStyle(severityTone(signal.severity))}>
            {SEVERITY_LABELS[signal.severity]}
          </span>
        </Field>
        <Field label="Confidence">{CONFIDENCE_LABELS[signal.confidence]}</Field>
        <Field label="Trend">{TREND_LABELS[signal.trend]}</Field>
        <Field label="Status">{signal.status}</Field>
        <Field label="Pathogen">{signal.pathogen ?? '—'}</Field>
        <Field label="Updated">{formatDate(signal.lastUpdated)}</Field>
        <Field label="Last checked">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            {formatDate(signal.lastChecked)}
            {isSignalStale(signal, 168) && (
              <span
                title="This signal has not been re-verified against its primary source within 7 days. Re-verify before operational use."
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-severity-concern)',
                  background: 'color-mix(in srgb, var(--color-severity-concern) 14%, transparent)',
                  padding: '0.0625rem 0.375rem',
                  borderRadius: '3px',
                }}
              >
                Stale &gt;7d
              </span>
            )}
          </span>
        </Field>
      </div>

      <SignalActionStrip signal={signal} />
      <TldrBox signal={signal} />
      <SourceDiversityBadge signal={signal} variant="detail" />

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <SignalDetailToc entries={tocEntries} />
        <div style={{ flex: 1, minWidth: 0 }}>

      {signal.riskAssessments && signal.riskAssessments.length > 0 && (
        <AuthorityRiskBadges assessments={signal.riskAssessments} />
      )}

      {signal.hcwAlert && <HcwAlertCard alert={signal.hcwAlert} />}

      <Section title="Summary" id="summary">
        <Paragraph>{signal.summary}</Paragraph>
      </Section>

      {signal.currentSituation && (
        <Section title="Current situation" id="current-situation">
          <Paragraph>{signal.currentSituation}</Paragraph>
        </Section>
      )}

      <Section title="Why it matters" id="why-it-matters">
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

      {signal.watchIndicators && signal.watchIndicators.length > 0 && (
        <WatchIndicatorsBlock indicators={signal.watchIndicators} />
      )}

      {signal.alternativeHypotheses && signal.alternativeHypotheses.length > 0 && (
        <CompetingHypothesesBlock hypotheses={signal.alternativeHypotheses} />
      )}

      <Section title="Geography" id="geography">
        <Paragraph>{signal.geographyNotes ?? signal.geography.join(', ')}</Paragraph>
        {(signal.mapMarkers?.length ?? 0) > 0 && (
          <ErrorBoundary label="Signal map">
            <SignalsMap signals={[signal]} height={320} initialZoom={2} />
          </ErrorBoundary>
        )}
      </Section>

      {(signal.metrics?.length ?? 0) > 0 && (
        <Section title="Metrics" id="metrics">
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
        <Section
          title="Timeline"
          id="timeline"
          collapsible
          badge={`${events.length} event${events.length !== 1 ? 's' : ''}`}
        >
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

      <Section
        title="Sources & provenance"
        id="sources"
        collapsible
        badge={`${sources.length} source${sources.length !== 1 ? 's' : ''}`}
      >
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
        <div key={section.id} id={section.id} style={{ scrollMarginTop: '1rem' }}>
          <ContentBlock
            title={section.title}
            bodyMarkdown={section.bodyMarkdown}
            attribution={section.attribution}
            additionalAttributions={section.additionalAttributions}
            lastReviewed={section.lastReviewed}
          />
        </div>
      ))}

      {signal.relatedSignals && signal.relatedSignals.length > 0 && (
        <RelatedSignalsBlock relationships={signal.relatedSignals} allSignals={signals} />
      )}

      <Section title="Data quality & confidence" id="data-quality" collapsible>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          Confidence: <span style={{ color: 'var(--color-text-primary)' }}>{CONFIDENCE_LABELS[signal.confidence]}</span>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Last checked: <span style={{ color: 'var(--color-text-primary)' }}>{formatDateTime(signal.lastChecked)}</span>
        </div>
      </Section>

        </div>
      </div>
    </div>
  )
}
