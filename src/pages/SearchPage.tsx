// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { search, summarize, type SearchHit, type SearchHitKind } from '../utils/search'

const KIND_LABELS: Record<SearchHitKind, string> = {
  signal: 'Signal',
  section: 'Section',
  news: 'News',
  source: 'Source',
}

const KIND_COLORS: Record<SearchHitKind, string> = {
  signal: 'var(--color-accent-red)',
  section: 'var(--color-accent-blue)',
  news: 'var(--color-accent-yellow)',
  source: 'var(--color-accent-green)',
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [kindFilter, setKindFilter] = useState<SearchHitKind | 'all'>('all')

  // Keep URL ?q= synced with the input so the search is shareable / bookmarkable
  useEffect(() => {
    if (query !== (searchParams.get('q') ?? '')) {
      if (query) setSearchParams({ q: query })
      else setSearchParams({})
    }
  }, [query, searchParams, setSearchParams])

  const hits = useMemo(() => search(query), [query])
  const summary = useMemo(() => summarize(hits, query), [hits, query])
  const filtered = useMemo(
    () => (kindFilter === 'all' ? hits : hits.filter((h) => h.kind === kindFilter)),
    [hits, kindFilter]
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
        SEARCH
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1rem 0',
        }}
      >
        Search across signals, detail sections, news, and the source registry.
      </p>

      {/* Search input */}
      <div
        style={{
          marginBottom: '1rem',
          padding: '0.75rem 0.875rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <input
          type="search"
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search signals, sections, news, sources…"
          aria-label="Search query"
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            color: 'var(--color-text-primary)',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
          }}
        />
      </div>

      {/* Summary + kind filter */}
      {query.length >= 2 && (
        <div
          role="group"
          aria-label="Result kind filter"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.375rem',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginRight: '0.25rem',
            }}
          >
            {summary.hitCount} hit{summary.hitCount !== 1 ? 's' : ''} for "{query}"
          </span>
          {(['all', 'signal', 'section', 'news', 'source'] as Array<SearchHitKind | 'all'>).map((k) => {
            const active = kindFilter === k
            const count = k === 'all' ? summary.hitCount : summary.byKind[k]
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                onClick={() => setKindFilter(k)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.625rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: active ? 'var(--color-bg-tertiary)' : 'transparent',
                  border: `1px solid ${active ? 'var(--color-accent-blue)' : 'var(--color-border)'}`,
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {k === 'all' ? 'All' : `${KIND_LABELS[k]} (${count})`}
              </button>
            )
          })}
        </div>
      )}

      {/* Result list */}
      {query.length < 2 ? (
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Type at least 2 characters to start searching.
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          No results match "{query}".
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map((hit, i) => (
            <ResultRow key={`${hit.kind}-${i}-${hit.href}`} hit={hit} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ResultRow({ hit }: { hit: SearchHit }) {
  const color = KIND_COLORS[hit.kind]
  const isExternal = hit.href.startsWith('http')

  const inner = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.5625rem',
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.1rem 0.35rem',
            border: `1px solid ${color}`,
            borderRadius: '3px',
          }}
        >
          {KIND_LABELS[hit.kind]}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {hit.subtitle}
        </span>
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: '0.25rem',
        }}
      >
        {hit.title}
      </div>
      {hit.snippet && (
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {hit.snippet}
        </div>
      )}
    </>
  )

  const style: React.CSSProperties = {
    display: 'block',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderLeft: `3px solid ${color}`,
    borderRadius: '4px',
    textDecoration: 'none',
    color: 'inherit',
  }

  return (
    <li>
      {isExternal ? (
        <a href={hit.href} target="_blank" rel="noopener noreferrer" style={style}>
          {inner}
        </a>
      ) : (
        <Link to={hit.href} style={style}>
          {inner}
        </Link>
      )}
    </li>
  )
}
