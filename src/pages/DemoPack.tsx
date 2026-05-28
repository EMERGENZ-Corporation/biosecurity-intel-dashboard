import { Link } from 'react-router-dom'
import SourceChip from '../components/SourceChip'
import {
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_RANK,
  categoryLabel,
  categoryTone,
  formatDate,
  getSource,
  intelToneStyle,
  rankSignals,
  severityTone,
  signals,
} from '../utils/signals'
import type { Signal, SignalDetailSection } from '../types'

const FIFA_SIGNAL_ID = 'fifa-world-cup-2026-prep'
const TRIAGE_SIGNAL_ID = 'measles-us-2026'

// EMS_WORLD_2026_REMOVE_AFTER_2026-05-30
// =====================================================================
// This page is a TEMPORARY conference surface for EMS World Live: Austin
// (event ends 2026-05-30). After that date, REMOVE — do not keep.
//
// What to remove:
//   1. This file: src/pages/DemoPack.tsx
//   2. The lazy import + two <Route> entries in src/App.tsx
//      (/ems-world-briefing AND the /demo alias)
//   3. The nav entry in src/components/NavBar.tsx
//   4. docs/AUSTIN-DEMO-RUNBOOK.md (event-specific)
//   5. This comment is the searchable removal marker — grep
//      "EMS_WORLD_2026_REMOVE_AFTER" to find every reference.
//
// What NOT to remove — these are standing dashboard content, independent
// of this surface:
//   - /signals/fifa-world-cup-2026-prep (the FIFA 2026 preparedness signal)
//   - /signals/measles-us-2026 and its triage card
//   - /briefings (the standing briefings page)
//   - any data in src/data/*.json
//
// Optional at removal: add a one-line redirect from /ems-world-briefing
// to /briefings in App.tsx so any externally-bookmarked URL lands somewhere
// useful instead of NotFound.
// =====================================================================

const BRIEFING_SECTION_PRIORITY = [
  'ems-specific',
  'ems-transport-protocols',
  'operational-guidance',
  'protocols-and-guidance',
  'clinical-profile',
]

function pickBriefingSection(signal: Signal): SignalDetailSection | undefined {
  for (const id of BRIEFING_SECTION_PRIORITY) {
    const section = signal.detailSections?.find((candidate) => candidate.id === id)
    if (section) return section
  }
  return signal.detailSections?.[0]
}

function excerpt(body: string, limit = 260): string {
  const normalized = body.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit).trim()}...`
}

function Panel({
  title,
  eyebrow,
  accent,
  children,
  action,
}: {
  title: string
  eyebrow?: string
  accent?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section
      style={{
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${accent ?? 'var(--color-border)'}`,
        borderRadius: '6px',
        padding: '1rem',
        boxShadow: '0 16px 42px rgba(0, 0, 0, 0.16)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          {eyebrow && (
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.625rem',
                color: accent ?? 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
                marginBottom: '0.25rem',
              }}
            >
              {eyebrow}
            </div>
          )}
          <h2
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function ActionLink({
  to,
  children,
  external,
  primary,
}: {
  to: string
  children: React.ReactNode
  external?: boolean
  primary?: boolean
}) {
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '36px',
    padding: '0.45rem 0.75rem',
    borderRadius: '4px',
    border: primary ? '1px solid var(--color-emergenz)' : '1px solid var(--color-border)',
    backgroundColor: primary ? 'var(--color-emergenz)' : 'var(--color-bg-tertiary)',
    color: primary ? '#071014' : 'var(--color-text-primary)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.6875rem',
    fontWeight: 700,
    textDecoration: 'none',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap' as const,
  }

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" style={style}>
        {children}
      </a>
    )
  }

  return (
    <Link to={to} style={style}>
      {children}
    </Link>
  )
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        padding: '0.5rem 0.625rem',
        backgroundColor: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1rem',
          color: 'var(--color-text-primary)',
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.5625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginTop: '0.1875rem',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function SourceFooter({ signal, section }: { signal: Signal; section?: SignalDetailSection }) {
  const primary = signal.primarySourceId ? getSource(signal.primarySourceId) : undefined

  if (!section?.attribution && !primary) return null

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        borderTop: '1px solid var(--color-border)',
        paddingTop: '0.625rem',
        marginTop: '0.75rem',
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        Source
      </span>
      {section?.attribution ? (
        <SourceChip
          authority={section.attribution.authority}
          documentTitle={section.attribution.documentTitle}
          date={section.attribution.date}
          url={section.attribution.url}
        />
      ) : primary ? (
        <SourceChip
          authority={primary.authority}
          documentTitle={primary.title}
          date={primary.publicationDate ?? primary.lastVerified}
          url={primary.url}
        />
      ) : null}
    </div>
  )
}

export default function DemoPack() {
  const activeBriefings = rankSignals(signals)
    .filter((signal) => signal.status === 'active' && SEVERITY_RANK[signal.severity] >= SEVERITY_RANK.concern)
    .map((signal) => ({ signal, section: pickBriefingSection(signal) }))
    .filter((item) => item.section)
    .slice(0, 3) as Array<{ signal: Signal; section: SignalDetailSection }>

  const fifaSignal = signals.find((signal) => signal.id === FIFA_SIGNAL_ID)
  const fifaSection =
    fifaSignal?.detailSections?.find((section) => section.id === 'ems-surge-readiness') ??
    fifaSignal?.detailSections?.find((section) => section.id === 'surveillance-planning') ??
    fifaSignal?.detailSections?.[0]

  const triageSignal = signals.find((signal) => signal.id === TRIAGE_SIGNAL_ID && signal.triageCard)
  const triageCard = triageSignal?.triageCard

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
      <header
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1rem',
          backgroundColor: 'rgba(17, 24, 39, 0.92)',
          border: '1px solid var(--color-border)',
          borderLeft: '4px solid var(--color-emergenz)',
          borderRadius: '6px',
          boxShadow: '0 18px 46px rgba(0, 0, 0, 0.18)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            color: 'var(--color-emergenz)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 700,
            marginBottom: '0.375rem',
          }}
        >
          EMS-facing snapshot
        </div>
        <h1
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '1.25rem',
            color: 'var(--color-text-primary)',
            margin: '0 0 0.5rem 0',
            letterSpacing: '0.02em',
          }}
        >
          EMS WORLD BRIEFING
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
            margin: 0,
            maxWidth: '850px',
          }}
        >
          Source-backed biosecurity intelligence framed for EMS providers: the active
          concern- and action-level briefings the dashboard is tracking right now, the FIFA
          2026 mass-gathering preparedness signal, and a printable measles triage card. Every
          item below links to its full source-attributed view. This is situational awareness,
          not a clinical decision system — follow your agency protocols and medical director
          directives.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.875rem' }}>
          <ActionLink to="/briefings" primary>
            Start briefings
          </ActionLink>
          <ActionLink to={`/signals/${FIFA_SIGNAL_ID}`}>
            FIFA signal
          </ActionLink>
          <ActionLink to={`/signals/${TRIAGE_SIGNAL_ID}/triage?print=1`} external>
            Print triage card
          </ActionLink>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <MiniMetric label="Active briefings" value={activeBriefings.length} />
        <MiniMetric label="FIFA map markers" value={fifaSignal?.mapMarkers?.length ?? '-'} />
        <MiniMetric label="Printable card" value={triageSignal ? 'Ready' : 'Missing'} />
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <Panel
          title="Active operational briefings"
          eyebrow="Concern + Action signals"
          accent="var(--color-emergenz)"
          action={<ActionLink to="/briefings">Open all briefings</ActionLink>}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.55,
              margin: '0 0 0.75rem 0',
            }}
          >
            High-severity signals the dashboard is actively tracking. Each card opens the full
            briefing with primary-source attribution and last-checked date visible.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '0.625rem',
            }}
          >
            {activeBriefings.map(({ signal, section }) => (
              <Link
                key={signal.id}
                to={`/signals/${signal.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${SEVERITY_COLORS[signal.severity]}`,
                  borderRadius: '4px',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <span className="intel-pill is-active" style={intelToneStyle(severityTone(signal.severity))}>
                    {SEVERITY_LABELS[signal.severity]}
                  </span>
                  <span className="intel-pill is-muted" style={intelToneStyle(categoryTone(signal.category))}>
                    {categoryLabel(signal.category)}
                  </span>
                </div>
                <strong
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.875rem',
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.35,
                  }}
                >
                  {signal.name}
                </strong>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.625rem',
                    color: 'var(--color-emergenz)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {section.title}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {excerpt(section.bodyMarkdown, 210)}
                </span>
              </Link>
            ))}
          </div>
        </Panel>

        {fifaSignal && (
          <Panel
            title="FIFA 2026 signal"
            eyebrow="Mass-gathering preparedness"
            accent={SEVERITY_COLORS[fifaSignal.severity]}
            action={<ActionLink to={`/signals/${fifaSignal.id}`}>Open signal</ActionLink>}
          >
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span className="intel-pill is-active" style={intelToneStyle(severityTone(fifaSignal.severity))}>
                {SEVERITY_LABELS[fifaSignal.severity]}
              </span>
              <span className="intel-pill is-muted" style={intelToneStyle(categoryTone(fifaSignal.category))}>
                {categoryLabel(fifaSignal.category)}
              </span>
              {fifaSignal.operationalLenses?.map((lens) => (
                <span key={lens} className="intel-pill is-muted" style={intelToneStyle(categoryTone(lens))}>
                  {categoryLabel(lens)}
                </span>
              ))}
            </div>
            <p
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.55,
                margin: '0 0 0.75rem 0',
              }}
            >
              {fifaSignal.summary}
            </p>
            {fifaSection && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.625rem',
                    color: 'var(--color-emergenz)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.375rem',
                    fontWeight: 700,
                  }}
                >
                  {fifaSection.title}
                </div>
                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {excerpt(fifaSection.bodyMarkdown, 420)}
                </p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <MiniMetric label="Map markers" value={fifaSignal.mapMarkers?.length ?? 0} />
              <MiniMetric label="Detail sections" value={fifaSignal.detailSections?.length ?? 0} />
              <MiniMetric label="Last checked" value={formatDate(fifaSignal.lastChecked)} />
            </div>
            <SourceFooter signal={fifaSignal} section={fifaSection} />
          </Panel>
        )}

        {triageSignal && triageCard && (
          <Panel
            title="Printable triage card"
            eyebrow="Single-page clinical card"
            accent="var(--color-accent-orange)"
            action={
              <ActionLink to={`/signals/${triageSignal.id}/triage?print=1`} external primary>
                Open print view
              </ActionLink>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                  <span className="intel-pill is-active" style={intelToneStyle(severityTone(triageSignal.severity))}>
                    {SEVERITY_LABELS[triageSignal.severity]}
                  </span>
                  <span className="intel-pill is-muted" style={intelToneStyle(categoryTone(triageSignal.category))}>
                    {categoryLabel(triageSignal.category)}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '1rem',
                    color: 'var(--color-text-primary)',
                    margin: '0 0 0.5rem 0',
                  }}
                >
                  {triageSignal.name}
                </h3>
                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Single-page clinical triage card sourced to a Tier 1 authority. Designed for ED
                  nurses, EMS captains, and EOC briefers. Use alongside agency protocols and
                  medical director directives — this is an operational reference, not a clinical
                  decision system.
                </p>
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.55,
                }}
              >
                <div>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Source:</strong>{' '}
                  {triageCard.sourceAuthority}
                </div>
                <div>{triageCard.sourceTitle}</div>
                <div>Last reviewed {formatDate(triageCard.lastReviewed)}</div>
              </div>
            </div>
          </Panel>
        )}

      </div>
    </div>
  )
}
