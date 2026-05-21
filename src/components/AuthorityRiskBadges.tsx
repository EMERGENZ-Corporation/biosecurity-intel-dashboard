import type { RiskAssessment } from '../types'
import { formatDate } from '../utils/signals'

interface Props {
  assessments: RiskAssessment[]
}

// Color-code by risk-label keywords. Authority links remain blue.
function riskColor(label: string): string {
  const l = label.toLowerCase()
  if (l.includes('very low') || l.includes('low')) return 'var(--color-accent-green)'
  if (l.includes('moderate') || l.includes('han ') || l.includes('alert')) return 'var(--color-accent-orange)'
  if (l.includes('high') || l.includes('emergency') || l.includes('pheic')) return 'var(--color-accent-red)'
  return 'var(--color-accent-blue)'
}

export default function AuthorityRiskBadges({ assessments }: Props) {
  if (assessments.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.75rem',
        marginBottom: '1rem',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
      }}
    >
      {assessments.map((a) => {
        const color = riskColor(a.label)
        return (
          <a
            key={`${a.authority}-${a.url}`}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            title={a.description + (a.asOf ? ` · ${formatDate(a.asOf)}` : '')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.75rem',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: `1px solid ${color}`,
              borderRadius: '4px',
              textDecoration: 'none',
              minWidth: '140px',
            }}
          >
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
                {a.authority} · {a.description}
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {a.label} ↗
              </span>
            </div>
          </a>
        )
      })}
    </div>
  )
}
