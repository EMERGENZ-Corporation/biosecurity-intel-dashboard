import { useMemo, useState } from 'react'
import { signalSources, formatDate, SOURCE_TIER_LABELS } from '../utils/signals'
import { THREAT_CATEGORY_LABELS, type SourceTier } from '../types'
import ExportButtons from '../components/ExportButtons'

// Tier colors used for the per-source borderLeft accent.
const TIER_COLORS: Record<SourceTier, string> = {
  1: 'var(--color-accent-green)',     // Authoritative — pipeline alerts on failure
  2: 'var(--color-accent-blue)',      // Institutional
  3: 'var(--color-accent-yellow)',    // Media
  4: 'var(--color-accent-orange)',    // Preprint / unreviewed
}

const TIER_OPTIONS: Array<SourceTier | 'all'> = ['all', 1, 2, 3, 4]

export default function SourcesPage() {
  const [tierFilter, setTierFilter] = useState<SourceTier | 'all'>('all')

  const filtered = useMemo(
    () => signalSources.filter((s) => tierFilter === 'all' || s.sourceTier === tierFilter),
    [tierFilter]
  )

  // Tier breakdown summary
  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const s of signalSources) tierCounts[s.sourceTier] = (tierCounts[s.sourceTier] ?? 0) + 1
  const primaryCount = signalSources.filter((s) => s.primary).length

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
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1rem 0',
        }}
      >
        Evidence registry · every signal claim cites a source from this list ·{' '}
        {signalSources.length} sources · {primaryCount} primary
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <ExportButtons
          filename="sources"
          rows={filtered.map((s) => ({
            id: s.id,
            authority: s.authority,
            authorityFull: s.authorityFull ?? '',
            title: s.title,
            url: s.url,
            sourceTier: s.sourceTier,
            sourceType: s.sourceType,
            primary: s.primary,
            domains: s.domains.join('; '),
            publicationDate: s.publicationDate ?? '',
            lastVerified: s.lastVerified,
            notes: s.notes ?? '',
          }))}
          json={filtered}
        />
      </div>

      {/* Tier breakdown */}
      <div
        role="group"
        aria-label="Source tier filter"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        {([1, 2, 3, 4] as SourceTier[]).map((tier) => (
          <div
            key={tier}
            style={{
              padding: '0.625rem 0.875rem',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderLeft: `3px solid ${TIER_COLORS[tier]}`,
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.5625rem',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {SOURCE_TIER_LABELS[tier]}
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '1.25rem',
                fontWeight: 700,
                color: TIER_COLORS[tier],
                marginTop: '0.125rem',
                lineHeight: 1.1,
              }}
            >
              {tierCounts[tier]}
            </div>
          </div>
        ))}
      </div>

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
        Per <a href="https://github.com/EMERGENZ-Corporation/biosecurity-intel-dashboard/blob/main/CONTENT-STANDARDS.md" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-blue)' }}>CONTENT-STANDARDS.md §1</a>:
        Tier 1 and Tier 2 sources drive structured data (case counts, risk levels, clinical
        guidance). Tier 3 and Tier 4 sources populate news feeds and contextual leads only — they
        must not be used to update structured data fields.
      </div>

      {/* Tier filter */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.375rem',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '0.625rem 0.875rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            minWidth: '4rem',
          }}
        >
          Tier:
        </span>
        {TIER_OPTIONS.map((tier) => {
          const active = tierFilter === tier
          const color = tier === 'all' ? 'var(--color-accent-blue)' : TIER_COLORS[tier]
          return (
            <button
              key={String(tier)}
              type="button"
              aria-pressed={active}
              onClick={() => setTierFilter(tier)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.625rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: active ? 'var(--color-bg-tertiary)' : 'transparent',
                border: `1px solid ${active ? color : 'var(--color-border)'}`,
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {tier === 'all' ? `All (${signalSources.length})` : `Tier ${tier} (${tierCounts[tier]})`}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.map((source) => (
          <div
            key={source.id}
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderLeft: `3px solid ${TIER_COLORS[source.sourceTier]}`,
              borderRadius: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {source.authority}
                {source.authorityFull && source.authorityFull !== source.authority
                  ? ` — ${source.authorityFull}`
                  : ''}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <span
                  style={{
                    color: TIER_COLORS[source.sourceTier],
                    fontWeight: 700,
                    padding: '0.1rem 0.35rem',
                    border: `1px solid ${TIER_COLORS[source.sourceTier]}`,
                    borderRadius: '3px',
                  }}
                >
                  {SOURCE_TIER_LABELS[source.sourceTier]}
                </span>
                <span
                  style={{
                    color: source.primary
                      ? 'var(--color-accent-green)'
                      : 'var(--color-text-muted)',
                  }}
                >
                  {source.primary ? 'Primary' : 'Secondary'} · {source.sourceType}
                </span>
              </span>
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)',
                marginTop: '0.25rem',
              }}
            >
              {source.title}
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.6875rem',
                color: 'var(--color-accent-blue)',
                display: 'inline-block',
                marginTop: '0.25rem',
              }}
            >
              {source.url} ↗
            </a>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.625rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.375rem',
              }}
            >
              Domains: {source.domains.map((d) => THREAT_CATEGORY_LABELS[d]).join(', ')}
              {source.publicationDate ? ` · Published ${formatDate(source.publicationDate)}` : ''}
              {' · '}Last verified {formatDate(source.lastVerified)}
            </div>
            {source.notes && (
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  marginTop: '0.375rem',
                  fontStyle: 'italic',
                }}
              >
                {source.notes}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              padding: '1rem 0',
            }}
          >
            No sources match the current tier filter.
          </p>
        )}
      </div>
    </div>
  )
}
