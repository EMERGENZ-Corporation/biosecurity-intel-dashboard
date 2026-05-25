import { useMemo, useState } from 'react'
import { signalSources, formatDate, SOURCE_TIER_LABELS } from '../utils/signals'
import { ThreatCategory, THREAT_CATEGORY_LABELS, SourceType, type SourceTier } from '../types'

const TIER_COLORS: Record<SourceTier, string> = {
  1: 'var(--color-accent-green)',
  2: 'var(--color-accent-blue)',
  3: 'var(--color-accent-yellow)',
  4: 'var(--color-accent-orange)',
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  'outbreak-news': 'Outbreak news',
  'expert-weekly-report': 'Expert weekly report',
  'health-advisory': 'Health advisory',
  'surveillance-dashboard': 'Surveillance dashboard',
  wastewater: 'Wastewater surveillance',
  'animal-health': 'Animal health',
  academic: 'Academic',
  'press-release': 'Press release',
  other: 'Other',
}

export default function Resources() {
  const [domain, setDomain] = useState<ThreatCategory | 'all'>('all')
  const [sourceType, setSourceType] = useState<SourceType | 'all'>('all')
  const [primaryOnly, setPrimaryOnly] = useState(false)

  const filtered = useMemo(
    () =>
      signalSources.filter((source) => {
        if (domain !== 'all' && !source.domains.includes(domain)) return false
        if (sourceType !== 'all' && source.sourceType !== sourceType) return false
        if (primaryOnly && !source.primary) return false
        return true
      }),
    [domain, sourceType, primaryOnly]
  )

  return (
    <div style={{ maxWidth: '1100px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.25rem 0',
        }}
      >
        RESOURCES
      </h1>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
        Filterable library of monitored sources · {filtered.length} of {signalSources.length} shown
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          padding: '0.75rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Domain
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as ThreatCategory | 'all')}
            aria-label="Filter resources by domain"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6875rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              borderRadius: '4px',
            }}
          >
            <option value="all">All domains</option>
            {(Object.entries(THREAT_CATEGORY_LABELS) as Array<[ThreatCategory, string]>).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Resource type
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType | 'all')}
            aria-label="Filter resources by type"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6875rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              borderRadius: '4px',
            }}
          >
            <option value="all">All types</option>
            {(Object.entries(SOURCE_TYPE_LABELS) as Array<[SourceType, string]>).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <label style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={primaryOnly} onChange={(e) => setPrimaryOnly(e.target.checked)} />
            Primary sources only
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              padding: '0.75rem 0.875rem',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderLeft: `3px solid ${TIER_COLORS[source.sourceTier]}`,
              borderRadius: '4px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {source.authority} — {source.title}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: source.primary ? 'var(--color-accent-green)' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {source.primary ? 'Primary' : 'Secondary'} · {SOURCE_TIER_LABELS[source.sourceTier]} · {SOURCE_TYPE_LABELS[source.sourceType]}
              </span>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
              Domains: {source.domains.map((d) => THREAT_CATEGORY_LABELS[d]).join(', ')}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: 'var(--color-accent-blue)' }}>
              {source.url}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)' }}>
              Last verified {formatDate(source.lastVerified)}
              {source.notes ? ` · ${source.notes}` : ''}
            </div>
          </a>
        ))}
        {filtered.length === 0 && (
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            No resources match the current filters.
          </p>
        )}
      </div>
    </div>
  )
}
