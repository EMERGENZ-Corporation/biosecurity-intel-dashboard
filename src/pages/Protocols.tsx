import { useState, useEffect } from 'react'
import { getCached, setCache } from '../utils/sessionCache'

const CACHE_KEY = 'protocols_feed_cache'
const CACHE_TTL = 2 * 60 * 60 * 1000 // 2 hours

interface FeedItem {
  id: string
  authority: string
  title: string
  description: string
  link: string
  pubDate: string
  timestamp: number
  type: string
  pinned?: boolean
}

const DOC_TYPE_COLORS: Record<string, string> = {
  CDC: 'var(--color-accent-red)',
  WHO: 'var(--color-accent-blue)',
  ECDC: 'var(--color-accent-orange)',
  'NYC DOH': 'var(--color-accent-purple)',
  NETEC: 'var(--color-accent-green)',
}

function AuthorityBadge({ authority }: { authority: string }) {
  const color = DOC_TYPE_COLORS[authority] ?? 'var(--color-text-muted)'
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.625rem',
        fontWeight: 700,
        color,
        border: `1px solid ${color}`,
        borderRadius: '3px',
        padding: '0.125rem 0.375rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {authority}
    </span>
  )
}

function FeedCard({ item }: { item: FeedItem }) {
  const date = item.pubDate
    ? new Date(item.pubDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <div
      style={{
        backgroundColor: item.pinned ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderLeft: item.pinned
          ? `3px solid ${DOC_TYPE_COLORS[item.authority] ?? 'var(--color-border)'}`
          : '1px solid var(--color-border)',
        borderRadius: '4px',
        padding: '0.875rem 1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.625rem',
          marginBottom: '0.375rem',
          flexWrap: 'wrap',
        }}
      >
        <AuthorityBadge authority={item.authority} />
        {item.pinned && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.5625rem',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: '3px',
              padding: '0.125rem 0.375rem',
            }}
          >
            PINNED
          </span>
        )}
        {date && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6875rem',
              color: 'var(--color-text-muted)',
              marginLeft: 'auto',
            }}
          >
            {date}
          </span>
        )}
      </div>
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          textDecoration: 'none',
          display: 'block',
          marginBottom: item.description ? '0.375rem' : 0,
          lineHeight: 1.4,
        }}
      >
        {item.title} ↗
      </a>
      {item.description && (
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {item.description}
        </p>
      )}
    </div>
  )
}

export default function Protocols() {
  const [items, setItems] = useState<FeedItem[]>(getCached<FeedItem[]>(CACHE_KEY) ?? [])
  const [loading, setLoading] = useState(items.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)

  useEffect(() => {
    if (items.length > 0) return // use cache
    async function load() {
      try {
        const res = await fetch('/api/feeds?type=protocols')
        if (!res.ok) throw new Error(`API ${res.status}`)
        const data = (await res.json()) as { items: FeedItem[]; fetchedAt: string }
        setItems(data.items)
        setFetchedAt(data.fetchedAt)
        setCache(CACHE_KEY, data.items, CACHE_TTL)
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [items.length])

  const pinned = items.filter((i) => i.pinned)
  const live = items.filter((i) => !i.pinned)

  return (
    <div style={{ maxWidth: '860px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.25rem 0',
        }}
      >
        PROTOCOLS &amp; GUIDANCE
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 0.25rem 0',
        }}
      >
        EMS, emergency management, and public health protocol releases. Pinned documents are the
        primary authoritative guidance for this outbreak. Live feed sourced from CDC HAN and ECDC RSS.
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1.5rem 0',
        }}
      >
        {fetchedAt
          ? `Feed last fetched: ${new Date(fetchedAt).toLocaleString()}`
          : 'Feed cached · refresh by reopening page'}
      </p>

      <div
        style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          marginBottom: '1.25rem',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        For authoritative clinical content, see the{' '}
        <a href="/clinical" style={{ color: 'var(--color-accent-blue)' }}>
          Clinical Profile
        </a>{' '}
        and{' '}
        <a href="/ppe" style={{ color: 'var(--color-accent-blue)' }}>
          PPE &amp; Infection Control
        </a>{' '}
        pages. This feed covers new protocol releases only.
      </div>

      {/* Pinned documents */}
      <h2
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 0.75rem 0',
        }}
      >
        Pinned — Primary Guidance Documents
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {pinned.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>

      {/* Live feed */}
      <h2
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 0.75rem 0',
        }}
      >
        Live Feed — CDC HAN &amp; ECDC Publications
      </h2>

      {loading && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            padding: '1.5rem 0',
          }}
        >
          Fetching feeds…
        </div>
      )}

      {error && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--color-accent-yellow)',
            padding: '0.75rem',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
          }}
        >
          Live feed unavailable — {error}. Pinned documents above are unaffected.
        </div>
      )}

      {!loading && !error && live.length === 0 && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace',",
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            padding: '0.75rem',
          }}
        >
          No additional live feed items at this time. Pinned documents above are current.
        </div>
      )}

      {live.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {live.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
