import { signalSources, formatDate, SOURCE_TIER_LABELS } from '../utils/signals'
import { THREAT_CATEGORY_LABELS } from '../types'

export default function SourcesPage() {
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
        SOURCES
      </h1>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
        Evidence registry · every signal claim cites a source from this list
      </p>

      <div
        style={{
          marginBottom: '1rem',
          padding: '0.875rem 1rem',
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}
      >
        Tier 1 and Tier 2 sources can support structured monitoring data when they link to a
        specific relevant document or dashboard. Tier 3 and Tier 4 sources are informational leads
        only and must not drive structured data fields.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {signalSources.map((source) => (
          <div
            key={source.id}
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderLeft: `3px solid ${source.primary ? 'var(--color-accent-green)' : 'var(--color-accent-purple)'}`,
              borderRadius: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {source.authority}
                {source.authorityFull && source.authorityFull !== source.authority ? ` — ${source.authorityFull}` : ''}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: source.primary ? 'var(--color-accent-green)' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {source.primary ? 'Primary' : 'Secondary'} · {SOURCE_TIER_LABELS[source.sourceTier]} · {source.sourceType}
              </span>
            </div>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
              {source.title}
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-accent-blue)', display: 'inline-block', marginTop: '0.25rem' }}
            >
              {source.url} ↗
            </a>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
              Domains: {source.domains.map((d) => THREAT_CATEGORY_LABELS[d]).join(', ')}
              {source.publicationDate ? ` · Published ${formatDate(source.publicationDate)}` : ''}
              {' · '}Last verified {formatDate(source.lastVerified)}
            </div>
            {source.notes && (
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.375rem', fontStyle: 'italic' }}>
                {source.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
