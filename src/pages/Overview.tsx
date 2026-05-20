import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import SignalCard from '../components/SignalCard'
import SignalsMap from '../components/SignalsMap'
import { ErrorBoundary } from '../components/ErrorBoundary'
import statusJson from '../../public/status.json'
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
  categoryLabel,
} from '../utils/signals'
import { THREAT_CATEGORY_LABELS } from '../types'

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

function Section({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '1rem 1.25rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.875rem' }}>
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

export default function Overview() {
  const isMobile = useMediaQuery('(max-width: 900px)')

  const ranked = useMemo(() => rankSignals(signals), [])
  const priorityQueue = ranked.slice(0, 5)
  const categories = categoryCounts(signals)
  const highest = highestSeverity(signals)
  const staleSignals = signals.filter((signal) => isSignalStale(signal))

  const recent = useMemo(
    () =>
      [...signalTimeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6),
    []
  )

  const failedSources = statusJson.pipeline?.officialSourceFailures ?? []
  const degradedFeeds = statusJson.pipeline?.failedFeeds ?? []

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
          color={staleSignals.length > 0 ? 'var(--color-accent-orange)' : 'var(--color-accent-green)'}
        />
        <StatChip
          label="Official sources failing"
          value={failedSources.length}
          color={failedSources.length > 0 ? 'var(--color-accent-red)' : 'var(--color-accent-green)'}
        />
        <div style={{ marginLeft: isMobile ? 0 : 'auto', alignSelf: 'center', display: 'flex', gap: '0.5rem' }}>
          <Link
            to="/status"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6875rem',
              color: 'var(--color-accent-blue)',
              textDecoration: 'none',
              padding: '0.375rem 0.625rem',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
            }}
          >
            View status →
          </Link>
        </div>
      </div>

      {/* Two-column grid */}
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
          extra={
            <Link
              to="/signals"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-accent-blue)', textDecoration: 'none' }}
            >
              All signals →
            </Link>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {priorityQueue.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
            {priorityQueue.length === 0 && (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                No active signals seeded.
              </p>
            )}
          </div>
        </Section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Section title="Threat domain coverage">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {(Object.entries(THREAT_CATEGORY_LABELS) as Array<[keyof typeof THREAT_CATEGORY_LABELS, string]>).map(([key, label]) => {
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
                      border: count > 0 ? '1px solid var(--color-border)' : '1px solid transparent',
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

          <Section title="Freshness & feed health">
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
              <div>Status: <span style={{ color: statusJson.status === 'ok' ? 'var(--color-accent-green)' : 'var(--color-accent-orange)' }}>{statusJson.status?.toUpperCase()}</span></div>
              <div>Generated: {formatDateTime(statusJson.generatedAt)}</div>
              <div>Failing feeds: {degradedFeeds.length}</div>
              <div>Failed official sources: {failedSources.length}</div>
              {staleSignals.length > 0 && (
                <div style={{ color: 'var(--color-accent-orange)' }}>
                  Stale signals: {staleSignals.map((s) => s.id).join(', ')}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Map preview */}
      <Section
        title="Signal map preview"
        extra={
          <Link
            to="/map"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-accent-blue)', textDecoration: 'none' }}
          >
            Open full map →
          </Link>
        }
      >
        <ErrorBoundary label="Map preview">
          <SignalsMap signals={signals} height={isMobile ? 280 : 360} />
        </ErrorBoundary>
      </Section>

      {/* Recent developments */}
      <div style={{ marginTop: '1rem' }}>
        <Section
          title="Recent developments"
          extra={
            <Link
              to="/timeline"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-accent-blue)', textDecoration: 'none' }}
            >
              Full timeline →
            </Link>
          }
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
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                  {event.title}
                </div>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {event.description}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
