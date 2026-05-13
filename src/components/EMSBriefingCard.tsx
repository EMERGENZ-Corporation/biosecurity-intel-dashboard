import emsBriefing from '../data/ems-briefing.json'

export default function EMSBriefingCard() {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderLeft: '3px solid var(--color-emergenz)',
        borderRadius: '4px',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--color-emergenz)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.125rem',
          }}
        >
          EMS Operational Briefing
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Sourced from: {emsBriefing.sources.join(' + ')}
        </div>
      </div>

      {/* Bullets */}
      <ul style={{ margin: '0 0 0.75rem 0', padding: '0 0 0 1rem' }}>
        {emsBriefing.bullets.map((bullet, i) => (
          <li
            key={i}
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              marginBottom: '0.375rem',
            }}
          >
            {bullet}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.5625rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Manually curated · Last reviewed{' '}
          {new Date(emsBriefing.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <a
          href="https://www.cdc.gov/han/php/notices/han00528.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.5625rem',
            color: 'var(--color-accent-blue)',
            textDecoration: 'none',
          }}
        >
          View Source Documents ↗
        </a>
      </div>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace',",
          fontSize: '0.5625rem',
          color: 'var(--color-text-muted)',
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        ⚠ Verify contact numbers (CDC EOC 770-488-7100 · NYC DOH 866-692-3641) directly with
        issuing authority before operational use. Reproduced from May 2026 source documents.
      </p>
    </div>
  )
}
