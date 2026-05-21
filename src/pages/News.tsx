import { useState, useMemo } from 'react'
import type { NewsItem, Signal } from '../types'
import newsData from '../data/news.json'
import signalsData from '../data/signals.json'

const news = newsData as NewsItem[]
const signals = signalsData as Signal[]

// Short display names for filter tabs — derived from signal pathogen or first noun in name
const SIGNAL_SHORT_NAMES: Record<string, string> = {
  'andes-hantavirus-mv-hondius-2026': 'Hantavirus',
  'ebola-bundibugyo-drc-2026': 'Ebola',
  'measles-us-2026': 'Measles',
  'mpox-africa-clade-i-2026': 'Mpox',
  'avian-influenza-h5-2026': 'Avian Flu',
  'cholera-africa-2026': 'Cholera',
  'seasonal-influenza-2026': 'Influenza',
  'covid-wastewater-2026': 'COVID-19',
  'norovirus-wastewater-2026': 'Norovirus',
  'rsv-wastewater-2026': 'RSV',
  'hmpv-wastewater-2026': 'hMPV',
  'lassa-fever-2026': 'Lassa',
  'chikungunya-2026': 'Chikungunya',
  'candida-auris-wastewater-2026': 'C. auris',
  'screwworm-onehealth-2026': 'Screwworm',
  'fifa-world-cup-2026-prep': 'FIFA 2026',
}

const AUTHORITY_COLORS: Record<string, string> = {
  WHO: 'var(--color-accent-blue)',
  CDC: 'var(--color-accent-red)',
  ECDC: 'var(--color-accent-orange)',
  UKHSA: '#005EB8',
  CIDRAP: '#7A0019',
  'BBC Health': '#BB1919',
  'ABC News': '#1C3F94',
  'NBC News': '#FA621E',
  'CBC News': '#E8292B',
  NPR: '#1A9ADB',
  'STAT News': '#E63946',
  'Science News': '#6B4EAB',
  Science: '#C41230',
  'Google News': '#4285F4',
}

function formatDate(pubDate: string) {
  const d = new Date(pubDate)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function SignalChip({ signalId }: { signalId: string }) {
  const label = SIGNAL_SHORT_NAMES[signalId] ?? signalId
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.5625rem',
        fontWeight: 600,
        color: 'var(--color-text-muted)',
        border: '1px solid var(--color-border)',
        borderRadius: '3px',
        padding: '0.1rem 0.35rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  const color = AUTHORITY_COLORS[item.authority] ?? 'var(--color-text-muted)'
  const date = formatDate(item.pubDate)

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
          {item.signalIds.map(sid => (
            <SignalChip key={sid} signalId={sid} />
          ))}
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
            {item.description.slice(0, 220)}
            {item.description.length > 220 ? '…' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

export default function News() {
  const [activeSignal, setActiveSignal] = useState<string | null>(null)

  // Build filter tabs: only signals that have at least one news item
  const signalsWithNews = useMemo(() => {
    const covered = new Set(news.flatMap(item => item.signalIds))
    return signals.filter(s => covered.has(s.id))
  }, [])

  const filtered = useMemo(() => {
    const sorted = [...news].sort((a, b) => b.timestamp - a.timestamp)
    if (activeSignal === null) return sorted
    return sorted.filter(item => item.signalIds.includes(activeSignal))
  }, [activeSignal])

  const newestTs = news.reduce((max, item) => Math.max(max, item.timestamp), 0)
  const updatedLabel = newestTs
    ? new Date(newestTs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

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
        Public health authority coverage and biosecurity news aggregated for situational awareness.
        Updated every 6 hours via automated pipeline.
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1rem 0',
        }}
      >
        Auto-updated every 6h · {news.length} item{news.length !== 1 ? 's' : ''}
        {updatedLabel ? ` · newest ${updatedLabel}` : ''}
      </p>

      {/* Disclaimer */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderLeft: '3px solid var(--color-accent-yellow)',
          borderRadius: '4px',
          marginBottom: '1rem',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--color-accent-yellow)' }}>Note:</strong> News feeds contain
        media coverage and may include analysis, opinion, or unverified information. For
        authoritative clinical and public health guidance, see individual signal detail pages.
      </div>

      {/* Signal filter tabs */}
      {signalsWithNews.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.375rem',
            marginBottom: '1.25rem',
          }}
        >
          <button
            onClick={() => setActiveSignal(null)}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '0.3rem 0.75rem',
              borderRadius: '4px',
              border: '1px solid',
              borderColor: activeSignal === null ? 'var(--color-emergenz)' : 'var(--color-border)',
              backgroundColor: activeSignal === null ? 'var(--color-bg-tertiary)' : 'transparent',
              color: activeSignal === null ? 'var(--color-emergenz)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            All ({news.length})
          </button>
          {signalsWithNews.map(signal => {
            const count = news.filter(item => item.signalIds.includes(signal.id)).length
            const isActive = activeSignal === signal.id
            return (
              <button
                key={signal.id}
                onClick={() => setActiveSignal(signal.id)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.3rem 0.75rem',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--color-emergenz)' : 'var(--color-border)',
                  backgroundColor: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
                  color: isActive ? 'var(--color-emergenz)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {SIGNAL_SHORT_NAMES[signal.id] ?? signal.id} ({count})
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            padding: '1.5rem 0',
          }}
        >
          No news items available for this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(item => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
