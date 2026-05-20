import { Link } from 'react-router-dom'
import { Signal } from '../types'
import {
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  CONFIDENCE_LABELS,
  TREND_LABELS,
  categoryLabel,
  formatDate,
  getSource,
} from '../utils/signals'

interface Props {
  signal: Signal
  compact?: boolean
}

export default function SignalCard({ signal, compact = false }: Props) {
  const primary = getSource(signal.primarySourceId)
  const color = SEVERITY_COLORS[signal.severity]

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
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
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}
        >
          {SEVERITY_LABELS[signal.severity]}
        </span>
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
        <span>{categoryLabel(signal.category)}</span>
        <span>·</span>
        <span>{signal.geography[0] ?? 'Global'}{signal.geography.length > 1 ? ` +${signal.geography.length - 1}` : ''}</span>
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
