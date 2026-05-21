import type { HcwAlert } from '../types'
import { formatDate } from '../utils/signals'

interface Props {
  alert: HcwAlert
}

export default function HcwAlertCard({ alert }: Props) {
  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'rgba(228, 79, 32, 0.08)',
        border: '1px solid var(--color-accent-orange)',
        borderLeft: '4px solid var(--color-accent-orange)',
        borderRadius: '6px',
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.375rem',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-accent-orange)',
          }}
        >
          ⚠
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            fontWeight: 700,
            color: 'var(--color-accent-orange)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Healthcare Worker Alert
        </span>
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '0.5rem',
          lineHeight: 1.4,
        }}
      >
        {alert.headline}
      </div>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 0.625rem 0',
        }}
      >
        {alert.body}
      </p>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          flexWrap: 'wrap',
        }}
      >
        <a
          href={alert.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--color-accent-blue)',
            textDecoration: 'none',
          }}
        >
          {alert.sourceAuthority} ↗
        </a>
        <span>·</span>
        <span>Updated {formatDate(alert.updatedAt)}</span>
      </div>
    </div>
  )
}
