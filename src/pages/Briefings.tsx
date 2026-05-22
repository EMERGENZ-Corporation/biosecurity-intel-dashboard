import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SourceChip from '../components/SourceChip'
import {
  signals,
  rankSignals,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_RANK,
  categoryLabel,
  categoryTone,
  getSource,
  intelToneStyle,
  NEUTRAL_TONE,
  severityTone,
} from '../utils/signals'
import {
  type Signal,
  type SignalDetailSection,
  type SignalSeverity,
  type ThreatCategory,
  THREAT_CATEGORY_LABELS,
} from '../types'

const SEVERITY_OPTIONS: SignalSeverity[] = ['monitor', 'watch', 'concern', 'action']

// Prefer the operationally-actionable section per signal in this order.
const SECTION_PRIORITY = [
  'ems-specific',
  'operational-guidance',
  'protocols-and-guidance',
  'clinical-profile',
  'ppe-and-ipc',
]

function pickBriefingSection(signal: Signal): SignalDetailSection | null {
  for (const id of SECTION_PRIORITY) {
    const section = signal.detailSections?.find((s) => s.id === id)
    if (section) return section
  }
  return signal.detailSections?.[0] ?? null
}

function BriefingCard({ signal }: { signal: Signal }) {
  const section = pickBriefingSection(signal)
  const sevColor = SEVERITY_COLORS[signal.severity]
  const primary = signal.primarySourceId ? getSource(signal.primarySourceId) : undefined

  return (
    <article
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${sevColor}`,
        borderRadius: '6px',
        padding: '1.125rem 1.375rem',
      }}
    >
      {/* Header row: severity + category + signal name */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.625rem',
        }}
      >
        <span
          className="intel-pill is-active"
          style={{
            ...intelToneStyle(severityTone(signal.severity)),
          }}
        >
          {SEVERITY_LABELS[signal.severity]}
        </span>
        <span
          className="intel-pill is-muted"
          style={{
            ...intelToneStyle(categoryTone(signal.category)),
          }}
        >
          {categoryLabel(signal.category)}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          ·
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {signal.geography[0] ?? 'Global'}
          {signal.geography.length > 1 ? ` +${signal.geography.length - 1}` : ''}
        </span>
      </div>

      <Link
        to={`/signals/${signal.id}`}
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          textDecoration: 'none',
          lineHeight: 1.35,
          display: 'block',
          marginBottom: '0.5rem',
        }}
      >
        {signal.name} →
      </Link>

      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 0.75rem 0',
        }}
      >
        {signal.operationalRelevance}
      </p>

      {/* Briefing section content — body preview */}
      {section && (
        <div
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            padding: '0.75rem 0.875rem',
            marginBottom: '0.75rem',
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              fontWeight: 700,
              color: 'var(--color-emergenz)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem',
            }}
          >
            {section.title}
          </div>
          {section.bodyMarkdown
            .split(/\n\s*\n/)
            .slice(0, 2)
            .map((para, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.6,
                  margin: '0 0 0.5rem 0',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {para.trim()}
              </p>
            ))}
          <Link
            to={`/signals/${signal.id}`}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              color: 'var(--color-accent-blue)',
              textDecoration: 'none',
            }}
          >
            Read full briefing →
          </Link>
        </div>
      )}

      {/* Source attribution */}
      {(section?.attribution || primary) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center',
            paddingTop: '0.625rem',
            borderTop: '1px solid var(--color-border)',
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
            Source:
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
      )}
    </article>
  )
}

export default function Briefings() {
  const [severity, setSeverity] = useState<SignalSeverity | 'all'>('all')
  const [category, setCategory] = useState<ThreatCategory | 'all'>('all')

  const filtered = useMemo(() => {
    const subset = signals.filter((s) => {
      if (severity !== 'all' && s.severity !== severity) return false
      if (category !== 'all' && s.category !== category) return false
      return true
    })
    // Briefings emphasize concern/action by default — sort by severity rank then ranking helper
    const ranked = rankSignals(subset)
    return severity === 'all'
      ? ranked.filter((s) => SEVERITY_RANK[s.severity] >= SEVERITY_RANK['watch'])
      : ranked
  }, [severity, category])

  return (
    <div style={{ maxWidth: '1000px' }}>
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
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1rem 0',
        }}
      >
        Operational briefings for EMS, healthcare preparedness, and public health staff · {filtered.length}{' '}
        signal{filtered.length !== 1 ? 's' : ''} surfaced
      </p>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          padding: '0.875rem 1rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <div role="group" aria-label="Briefing severity filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              minWidth: '5rem',
            }}
          >
            Severity:
          </span>
          {(['all', ...SEVERITY_OPTIONS] as Array<SignalSeverity | 'all'>).map((s) => {
            const active = severity === s
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                className={`intel-pill is-button ${active ? 'is-active' : 'is-muted'}`}
                onClick={() => setSeverity(s)}
                style={{
                  ...intelToneStyle(s === 'all' ? NEUTRAL_TONE : severityTone(s)),
                  cursor: 'pointer',
                }}
              >
                {s === 'all' ? 'Watch+' : SEVERITY_LABELS[s]}
              </button>
            )
          })}
        </div>

        <div role="group" aria-label="Briefing category filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              minWidth: '5rem',
            }}
          >
            Category:
          </span>
          <button
            type="button"
            aria-pressed={category === 'all'}
            className={`intel-pill is-button ${category === 'all' ? 'is-active' : 'is-muted'}`}
            onClick={() => setCategory('all')}
            style={{
              ...intelToneStyle(NEUTRAL_TONE),
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {(Object.entries(THREAT_CATEGORY_LABELS) as Array<[ThreatCategory, string]>).map(([k, label]) => {
            const active = category === k
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                className={`intel-pill is-button ${active ? 'is-active' : 'is-muted'}`}
                onClick={() => setCategory(k)}
                style={{
                  ...intelToneStyle(categoryTone(k)),
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Briefings list */}
      {filtered.length === 0 ? (
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            padding: '1.5rem 0',
          }}
        >
          No signals match the current filters.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((signal) => (
            <BriefingCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: '1.25rem',
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
        Briefings are previews of source-backed signal content. Each card cites its primary source —
        verify against the linked document before operational use. For full clinical depth, click
        through to the signal detail page.
      </div>
    </div>
  )
}
