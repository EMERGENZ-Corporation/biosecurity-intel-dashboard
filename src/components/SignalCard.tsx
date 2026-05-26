import { Link } from 'react-router-dom'
import { Signal, type NewsItem } from '../types'
import SourceDiversityBadge from './SourceDiversityBadge'
import {
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  CONFIDENCE_LABELS,
  TREND_LABELS,
  categoryLabel,
  categoryTone,
  formatDate,
  getSource,
  intelToneStyle,
  severityTone,
} from '../utils/signals'
import newsData from '../data/news.json'

const news = newsData as NewsItem[]

interface Props {
  signal: Signal
  compact?: boolean
}

function DepthBadge({ count, label }: { count: number; label: string }) {
  return (
    <span
      title={`${count} ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.1rem 0.35rem',
        backgroundColor: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: '3px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.5625rem',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{count}</span>
      {label}
    </span>
  )
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export default function SignalCard({ signal, compact = false }: Props) {
  const primary = getSource(signal.primarySourceId)
  const color = SEVERITY_COLORS[signal.severity]
  const markerCount = signal.mapMarkers?.length ?? 0
  const sectionCount = signal.detailSections?.length ?? 0
  const newsCount = news.filter((n) => n.signalIds.includes(signal.id)).length

  // "Changed 7d" indicator — signal was updated within the past week
  const lastUpdatedMs = new Date(signal.lastUpdated).getTime()
  const changedRecently = Number.isFinite(lastUpdatedMs) && Date.now() - lastUpdatedMs <= SEVEN_DAYS_MS

  return (
    <Link
      to={`/signals/${signal.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '0.375rem' : '0.5rem',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: '4px',
        padding: compact ? '0.75rem 0.875rem' : '1rem 1.125rem',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: compact ? '0.8125rem' : '0.875rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.35,
          }}
        >
          {signal.name}
        </span>
        <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {changedRecently && (
            <span
              title={`Updated ${formatDate(signal.lastUpdated)} — within last 7 days`}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.5625rem',
                fontWeight: 700,
                color: 'var(--color-accent-blue)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '0.1rem 0.35rem',
                border: '1px solid var(--color-accent-blue)',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              Updated 7d
            </span>
          )}
          <span
            className="intel-pill is-active"
            style={{
              ...intelToneStyle(severityTone(signal.severity)),
              whiteSpace: 'nowrap',
            }}
          >
            {SEVERITY_LABELS[signal.severity]}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.375rem 0.75rem',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <span className="intel-pill is-muted" style={intelToneStyle(categoryTone(signal.category))}>
          {categoryLabel(signal.category)}
        </span>
        {signal.operationalLenses?.map((lens) => (
          <span key={lens} className="intel-pill is-muted" style={intelToneStyle(categoryTone(lens))}>
            {categoryLabel(lens)}
          </span>
        ))}
        <span>·</span>
        <span>
          {signal.geography[0] ?? 'Global'}
          {signal.geography.length > 1 ? ` +${signal.geography.length - 1}` : ''}
        </span>
        <span>·</span>
        <span>{CONFIDENCE_LABELS[signal.confidence]}</span>
        <span>·</span>
        <span>{TREND_LABELS[signal.trend]}</span>
      </div>

      {!compact && (
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {signal.operationalRelevance}
        </p>
      )}

      {/* Depth indicators + source-diversity score */}
      {!compact && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
          {markerCount > 0 && <DepthBadge count={markerCount} label="markers" />}
          {sectionCount > 0 && <DepthBadge count={sectionCount} label="sections" />}
          {newsCount > 0 && <DepthBadge count={newsCount} label="news" />}
          <SourceDiversityBadge signal={signal} variant="card" />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.5625rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <span>{primary ? `${primary.authority} · ${primary.title}` : '—'}</span>
        <span>Updated {formatDate(signal.lastUpdated)}</span>
      </div>
    </Link>
  )
}
