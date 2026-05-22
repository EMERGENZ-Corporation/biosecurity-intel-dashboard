import type { Signal } from '../types'
import { computeSourceDiversity, diversityLabelColor } from '../utils/sourceDiversity'

interface Props {
  signal: Signal
  /** "card" = compact single chip (for SignalCard). "detail" = expanded breakdown (signal detail). */
  variant?: 'card' | 'detail'
}

/**
 * Visualizes the source-diversity score for an intel officer / analyst.
 * Surfaces evidence strength behind the severity label so the consumer
 * can weigh competing signals on more than just the assigned severity.
 */
export default function SourceDiversityBadge({ signal, variant = 'card' }: Props) {
  const score = computeSourceDiversity(signal)
  const color = diversityLabelColor(score.label)

  if (variant === 'card') {
    return (
      <span
        title={`Source diversity: ${score.label} — ${score.distinctAuthorities} distinct ` +
          `${score.distinctAuthorities === 1 ? 'authority' : 'authorities'} ` +
          `(T1:${score.tierCounts[1]} T2:${score.tierCounts[2]} T3:${score.tierCounts[3]} T4:${score.tierCounts[4]})`}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.5625rem',
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '0.1rem 0.35rem',
          border: `1px solid ${color}`,
          borderRadius: '3px',
          whiteSpace: 'nowrap',
        }}
      >
        {score.label} · {score.distinctAuthorities} src
      </span>
    )
  }

  return (
    <div
      role="region"
      aria-label="Source diversity"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 0.875rem',
        marginBottom: '1rem',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.5625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginRight: '0.25rem',
        }}
      >
        Source diversity:
      </span>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0.15rem 0.5rem',
          border: `1px solid ${color}`,
          borderRadius: '3px',
        }}
      >
        {score.label}
      </span>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        {score.distinctAuthorities} distinct {score.distinctAuthorities === 1 ? 'authority' : 'authorities'}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
        ·
      </span>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        T1:{score.tierCounts[1]} · T2:{score.tierCounts[2]} · T3:{score.tierCounts[3]} · T4:{score.tierCounts[4]}
      </span>
    </div>
  )
}
