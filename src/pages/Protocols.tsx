import protocolItems from '../data/protocols.json'

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
  'Nebraska Medicine': 'var(--color-accent-green)',
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
  // Items are sourced from protocols.json, populated/updated by GitHub Actions pipeline.
  const allItems = protocolItems as FeedItem[]
  const pinned = allItems.filter((i) => i.pinned).sort((a, b) => b.timestamp - a.timestamp)
  const live = allItems.filter((i) => !i.pinned).sort((a, b) => b.timestamp - a.timestamp)

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
        primary authoritative guidance for this outbreak. Updated every 12 hours via automated
        pipeline.
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1.5rem 0',
        }}
      >
        Auto-updated every 12h · {allItems.length} document{allItems.length !== 1 ? 's' : ''}
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
        pages. This feed covers protocol and guidance document releases only.
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
        {pinned.length > 0 ? (
          pinned.map((item) => <FeedCard key={item.id} item={item} />)
        ) : (
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              padding: '0.75rem 0',
            }}
          >
            No pinned documents at this time.
          </div>
        )}
      </div>

      {/* Live feed — additional items from pipeline */}
      {live.length > 0 && (
        <>
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
            Additional Publications
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {live.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
