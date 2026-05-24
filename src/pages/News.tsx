import { useState, useMemo } from 'react'
import type { NewsItem, Signal } from '../types'
import newsData from '../data/news.json'
import signalsData from '../data/signals.json'
import { categoryTone, intelToneStyle, NEUTRAL_TONE } from '../utils/signals'
import ExportButtons from '../components/ExportButtons'

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

type DateRange = 'all' | '1d' | '7d' | '30d' | '90d'

const DATE_RANGES: { id: DateRange; label: string; days: number | null }[] = [
  { id: 'all', label: 'All', days: null },
  { id: '1d', label: 'Today', days: 1 },
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
]

export default function News() {
  const [activeSignal, setActiveSignal] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('all')

  // Build filter tabs: only signals that have at least one news item
  const signalsWithNews = useMemo(() => {
    const covered = new Set(news.flatMap(item => item.signalIds))
    return signals.filter(s => covered.has(s.id))
  }, [])

  const filtered = useMemo(() => {
    const range = DATE_RANGES.find(r => r.id === dateRange)
    const cutoff = range?.days != null ? Date.now() - range.days * 24 * 60 * 60 * 1000 : null
    const sorted = [...news].sort((a, b) => b.timestamp - a.timestamp)
    return sorted.filter(item => {
      if (activeSignal !== null && !item.signalIds.includes(activeSignal)) return false
      if (cutoff !== null && item.timestamp < cutoff) return false
      return true
    })
  }, [activeSignal, dateRange])

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

      <div style={{ marginBottom: '0.75rem' }}>
        <ExportButtons
          filename="news"
          rows={filtered.map((n) => ({
            id: n.id,
            authority: n.authority,
            title: n.title,
            description: n.description,
            link: n.link,
            pubDate: n.pubDate,
            signalIds: n.signalIds.join('; '),
          }))}
          json={filtered}
        />
      </div>

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

      {/* Date range filter */}
      <div
        role="group"
        aria-label="News date range filter"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.375rem',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            minWidth: '3.5rem',
          }}
        >
          Date:
        </span>
        {DATE_RANGES.map(range => {
          const isActive = dateRange === range.id
          const count = range.days == null
            ? news.length
            : news.filter(n => n.timestamp >= Date.now() - range.days! * 24 * 60 * 60 * 1000).length
          return (
            <button
              key={range.id}
              type="button"
              aria-pressed={isActive}
              className={`intel-pill is-button ${isActive ? 'is-active' : 'is-muted'}`}
              onClick={() => setDateRange(range.id)}
              style={{
                ...intelToneStyle(NEUTRAL_TONE),
                cursor: 'pointer',
              }}
            >
              {range.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Signal filter tabs */}
      {signalsWithNews.length > 0 && (
        <div
          role="group"
          aria-label="News signal filter"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.375rem',
            marginBottom: '1.25rem',
          }}
        >
          <button
            type="button"
            aria-pressed={activeSignal === null}
            className={`intel-pill is-button ${activeSignal === null ? 'is-active' : 'is-muted'}`}
            onClick={() => setActiveSignal(null)}
            style={{
              ...intelToneStyle(NEUTRAL_TONE),
              cursor: 'pointer',
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
                type="button"
                aria-pressed={isActive}
                className={`intel-pill is-button ${isActive ? 'is-active' : 'is-muted'}`}
                onClick={() => setActiveSignal(signal.id)}
                style={{
                  ...intelToneStyle(categoryTone(signal.category)),
                  cursor: 'pointer',
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
