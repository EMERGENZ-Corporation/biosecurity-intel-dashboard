import { Link } from 'react-router-dom'
import newsItems from '../data/news.json'

interface FeedItem {
  id: string
  authority: string
  title: string
  description: string
  link: string
  pubDate: string
  timestamp: number
}

const AUTHORITY_COLORS: Record<string, string> = {
  WHO: 'var(--color-accent-blue)',
  CDC: 'var(--color-accent-red)',
  ECDC: 'var(--color-accent-orange)',
  Reuters: '#FF8C00',
  AP: '#C0C0C0',
  Newsweek: '#CC0000',
  'Detroit Free Press': '#006DB7',
  'MSN Health': '#00A4EF',
  Wired: '#000000',
  'Scientific American': '#FF6600',
  'Science News': '#6B4EAB',
  'Harvard HSPH': '#A51C30',
  Forbes: '#A9232F',
  NPR: '#1A9ADB',
  'BBC Health': '#BB1919',
  'ABC News': '#1C3F94',
  ProMED: '#2E7D32',
  Eurosurveillance: '#003078',
  RIVM: '#FF6200',
  NEJM: '#CC0000',
  Lancet: '#004B8D',
  'Nature Medicine': '#E87722',
  Science: '#C41230',
  'Google News': '#4285F4',
  'AP News': '#CC0000',
  'STAT News': '#E63946',
  'CBC News': '#E8292B',
  'CTV News': '#004B8D',
  'Medscape': '#00539C',
  'MedPage Today': '#005A9C',
  'Healio': '#007CB2',
  'NBC News': '#FA621E',
  'CBS News': '#004F9F',
  Guardian: '#052962',
  'The Hill': '#000000',
  'Al Jazeera': '#8B1C13',
  Time: '#E42F21',
  Euronews: '#0055A4',
  PHAC: '#D80621',
  RKI: '#003F7F',
  UKHSA: '#005EB8',
}

function NewsCard({ item }: { item: FeedItem }) {
  const color = AUTHORITY_COLORS[item.authority] ?? 'var(--color-text-muted)'
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
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        padding: '0.875rem 1rem',
        display: 'flex',
        gap: '0.875rem',
      }}
    >
      {/* Authority stripe */}
      <div
        style={{
          width: '3px',
          borderRadius: '2px',
          backgroundColor: color,
          flexShrink: 0,
          alignSelf: 'stretch',
          minHeight: '40px',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.375rem',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              fontWeight: 700,
              color,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {item.authority}
          </span>
          {date && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.625rem',
                color: 'var(--color-text-muted)',
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
            lineHeight: 1.4,
            marginBottom: item.description ? '0.375rem' : 0,
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
            {item.description.slice(0, 200)}
            {item.description.length > 200 ? '…' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

export default function News() {
  // Items are populated by the GitHub Actions pipeline every 12 hours.
  // Sorted newest-first by timestamp.
  const items = [...(newsItems as FeedItem[])].sort((a, b) => b.timestamp - a.timestamp)

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
        NEWS FEED
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 0.25rem 0',
        }}
      >
        Public health agency coverage aggregated for situational awareness. Sourced from WHO, CDC,
        and ECDC. Updated every 12 hours via automated pipeline.
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1rem 0',
        }}
      >
        Auto-updated every 12h · {items.length} item{items.length !== 1 ? 's' : ''}
      </p>

      {/* Disclaimer */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderLeft: '3px solid var(--color-accent-yellow)',
          borderRadius: '4px',
          marginBottom: '1.25rem',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--color-accent-yellow)' }}>Note:</strong> News feeds contain
        media coverage and may include analysis, opinion, or unverified information. For authoritative
        clinical and public health guidance, see{' '}
        <Link to="/protocols" style={{ color: 'var(--color-accent-blue)' }}>
          Protocols &amp; Guidance
        </Link>
        .
      </div>

      {items.length === 0 ? (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            padding: '1rem 0',
          }}
        >
          No news feed items available at this time.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
