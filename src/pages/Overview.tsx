import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import SignalCard from '../components/SignalCard'
import SignalsMap from '../components/SignalsMap'
import { ErrorBoundary } from '../components/ErrorBoundary'
import statusJson from '../../public/status.json'
import newsData from '../data/news.json'
import {
  signals,
  signalTimeline,
  rankSignals,
  categoryCounts,
  isSignalStale,
  highestSeverity,
  formatDateTime,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_RANK,
  categoryLabel,
} from '../utils/signals'
import { THREAT_CATEGORY_LABELS, type NewsItem } from '../types'

const news = newsData as NewsItem[]

// Authority pills for the news rail. Mirror News.tsx so chip colors are consistent.
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

// Short labels for signal chips in the news rail
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

function StatChip({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.125rem',
        padding: '0.5rem 0.875rem',
        backgroundColor: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        minWidth: '120px',
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.5625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.125rem',
          fontWeight: 700,
          color: color ?? 'var(--color-text-primary)',
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function Section({
  title,
  children,
  extra,
  accent,
}: {
  title: string
  children: React.ReactNode
  extra?: React.ReactNode
  accent?: string
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderLeft: accent ? `3px solid ${accent}` : '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '1rem 1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.875rem',
          gap: '1rem',
        }}
      >
        <h2
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
          }}
        >
          {title}
        </h2>
        {extra}
      </div>
      {children}
    </div>
  )
}

function SeeAllLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.6875rem',
        color: 'var(--color-accent-blue)',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label} →
    </Link>
  )
}

export default function Overview() {
  const isMobile = useMediaQuery('(max-width: 900px)')

  const ranked = useMemo(() => rankSignals(signals), [])
  const priorityQueue = ranked.slice(0, 5)
  const categories = categoryCounts(signals)
  const highest = highestSeverity(signals)
  const staleSignals = signals.filter((signal) => isSignalStale(signal))

  // 6 most recent timeline events
  const recent = useMemo(
    () =>
      [...signalTimeline]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    []
  )

  // 5 most recent news items
  const latestNews = useMemo(
    () => [...news].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5),
    []
  )

  // Signals at severity >= concern with an operational-guidance or EMS section.
  // Surfaces actionable briefing content on the landing page.
  const briefingSignals = useMemo(() => {
    return signals
      .filter((s) => s.status === 'active' && SEVERITY_RANK[s.severity] >= SEVERITY_RANK['concern'])
      .map((s) => {
        const section =
          s.detailSections?.find((sec) => sec.id === 'ems-specific') ??
          s.detailSections?.find((sec) => sec.id === 'operational-guidance') ??
          s.detailSections?.find((sec) => sec.id === 'protocols-and-guidance') ??
          s.detailSections?.[0]
        return section ? { signal: s, section } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => SEVERITY_RANK[b.signal.severity] - SEVERITY_RANK[a.signal.severity])
      .slice(0, 3)
  }, [])

  // Pull the first 2 sentences from the chosen section's body for the briefing summary.
  function briefingSummary(body: string): string {
    const sentences = body.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/)
    return sentences.slice(0, 2).join(' ').slice(0, 320)
  }

  const lastDataUpdate = statusJson.dashboard?.lastUpdated

  return (
    <div style={{ maxWidth: '1300px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0 0 0.25rem 0',
          }}
        >
          BIOSECURITY OPERATIONAL OVERVIEW
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          Multi-threat situational awareness · source-backed · static refresh cycle
        </p>
      </div>

      {/* Global status strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <StatChip label="Active signals" value={signals.filter((s) => s.status === 'active').length} />
        <StatChip
          label="Highest severity"
          value={highest ? SEVERITY_LABELS[highest] : '—'}
          color={highest ? SEVERITY_COLORS[highest] : undefined}
        />
        <StatChip label="Domains in scope" value={Object.keys(categories).length} />
        <StatChip
          label="Stale signals"
          value={staleSignals.length}
          color={
            staleSignals.length > 0 ? 'var(--color-accent-orange)' : 'var(--color-accent-green)'
          }
        />
        <StatChip label="News items" value={news.length} />
        <div style={{ marginLeft: isMobile ? 0 : 'auto', alignSelf: 'center', display: 'flex', gap: '0.5rem' }}>
          <SeeAllLink to="/status" label="View status" />
        </div>
      </div>

      {/* Operational briefings rail — actionable summaries from highest-severity signals */}
      {briefingSignals.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <Section
            title="Active operational briefings"
            accent="var(--color-emergenz)"
            extra={<SeeAllLink to="/briefings" label="All briefings" />}
          >
            <p
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                margin: '0 0 0.75rem 0',
                lineHeight: 1.5,
              }}
            >
              Source-backed operational guidance from signals at severity Concern or Action. Verify against
              the primary source before operational use.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '0.625rem',
              }}
            >
              {briefingSignals.map(({ signal, section }) => {
                const sevColor = SEVERITY_COLORS[signal.severity]
                return (
                  <Link
                    key={signal.id}
                    to={`/signals/${signal.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                      padding: '0.75rem 0.875rem',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      borderLeft: `3px solid ${sevColor}`,
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          color: sevColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {SEVERITY_LABELS[signal.severity]}
                      </span>
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '0.5625rem',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {categoryLabel(signal.category)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        lineHeight: 1.35,
                      }}
                    >
                      {signal.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.5625rem',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {section.title}
                      {section.attribution && ` · ${section.attribution.authority}`}
                    </div>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                        marginTop: '0.125rem',
                      }}
                    >
                      {briefingSummary(section.bodyMarkdown)}…
                    </div>
                  </Link>
                )
              })}
            </div>
          </Section>
        </div>
      )}

      {/* Two-column grid: priority queue + domain coverage / data currency */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '1rem',
          marginBottom: '1rem',
          alignItems: 'start',
        }}
      >
        <Section
          title="Priority signal queue"
          extra={<SeeAllLink to="/signals" label="All signals" />}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {priorityQueue.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
            {priorityQueue.length === 0 && (
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                No active signals available.
              </p>
            )}
          </div>
        </Section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Section title="Threat domain coverage">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {(Object.entries(THREAT_CATEGORY_LABELS) as Array<
                [keyof typeof THREAT_CATEGORY_LABELS, string]
              >).map(([key, label]) => {
                const count = categories[key] ?? 0
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.375rem 0.5rem',
                      backgroundColor: count > 0 ? 'var(--color-bg-tertiary)' : 'transparent',
                      border:
                        count > 0 ? '1px solid var(--color-border)' : '1px solid transparent',
                      borderRadius: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.6875rem',
                        color: count > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: count > 0 ? 'var(--color-accent-blue)' : 'var(--color-text-muted)',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </Section>

          <Section title="Data currency">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.6875rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <div>
                Status:{' '}
                <span
                  style={{
                    color:
                      statusJson.status === 'ok'
                        ? 'var(--color-accent-green)'
                        : 'var(--color-accent-orange)',
                  }}
                >
                  {statusJson.status?.toUpperCase()}
                </span>
              </div>
              <div>Data last updated: {lastDataUpdate ? formatDateTime(lastDataUpdate) : '—'}</div>
              <div>Source records: {statusJson.sources?.total ?? '—'}</div>
              <div>News items: {news.length}</div>
              {staleSignals.length > 0 && (
                <div style={{ color: 'var(--color-accent-orange)' }}>
                  Stale signals: {staleSignals.map((s) => s.id).join(', ')}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Latest news rail */}
      {latestNews.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <Section
            title="Latest authority &amp; media coverage"
            extra={<SeeAllLink to="/news" label="All news" />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {latestNews.map((item) => {
                const color = AUTHORITY_COLORS[item.authority] ?? 'var(--color-text-muted)'
                const date = new Date(item.pubDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
                return (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        width: '3px',
                        flexShrink: 0,
                        backgroundColor: color,
                        borderRadius: '2px',
                        alignSelf: 'stretch',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.25rem',
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
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.625rem',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {date}
                        </span>
                        {item.signalIds.slice(0, 2).map((sid) => (
                          <span
                            key={sid}
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: '0.5625rem',
                              fontWeight: 600,
                              color: 'var(--color-text-muted)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '3px',
                              padding: '0.0625rem 0.3rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {SIGNAL_SHORT_NAMES[sid] ?? sid}
                          </span>
                        ))}
                      </div>
                      <div
                        style={{
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.title} ↗
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </Section>
        </div>
      )}

      {/* Map preview */}
      <div style={{ marginBottom: '1rem' }}>
        <Section
          title="Signal map preview"
          extra={<SeeAllLink to="/map" label="Open full map" />}
        >
          <ErrorBoundary label="Map preview">
            <SignalsMap signals={signals} height={isMobile ? 280 : 360} />
          </ErrorBoundary>
        </Section>
      </div>

      {/* Recent developments — timeline */}
      <Section
        title="Recent developments"
        extra={<SeeAllLink to="/timeline" label="Full timeline" />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {recent.map((event) => (
            <Link
              key={event.id}
              to={`/signals/${event.signalId}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.625rem 0.75rem',
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.625rem',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {event.date} · {categoryLabel(event.category)}
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)',
                }}
              >
                {event.title}
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {event.description}
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  )
}
