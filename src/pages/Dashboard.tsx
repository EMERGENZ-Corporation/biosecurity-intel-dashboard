import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMediaQuery } from '../hooks/useMediaQuery'
import Timeline from '../components/Timeline'
import USMonitoringTable from '../components/USMonitoringTable'
import FlightTracingPanel from '../components/FlightTracingPanel'
import SourceChip from '../components/SourceChip'
import GlobalMap from '../components/GlobalMap'
import MapLayerToggle from '../components/MapLayerToggle'
import EMSBriefingCard from '../components/EMSBriefingCard'
import ShareModal from '../components/ShareModal'
import { ErrorBoundary } from '../components/ErrorBoundary'
import metaJson from '../data/meta.json'

// Pipeline runs every 6 hours — keep in sync with update-data.yml cron schedule
const PIPELINE_INTERVAL_LABEL = 'every 6h'
// Warn if data has not been updated in more than 48 hours during an active outbreak
const STALENESS_WARN_MS = 48 * 60 * 60 * 1000

const ALL_TYPES = [
  'ship_route',
  'case_confirmed',
  'death',
  'monitoring_facility',
  'us_state_monitoring',
  'flight_tracing',
  'return_destination',
]

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '1.25rem 1.5rem',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

const metricProvenance = metaJson.metricProvenance as Record<string, {
  sourceLabel: string
  sourceUrl: string
  lastVerified: string
}> | undefined

function metricSource(key: string, fallbackSource: string, fallbackUrl: string, fallbackDate: string) {
  const provenance = metricProvenance?.[key]
  return {
    source: provenance?.sourceLabel ?? fallbackSource,
    url: provenance?.sourceUrl ?? fallbackUrl,
    date: new Date(provenance?.lastVerified ?? fallbackDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }
}

export default function Dashboard() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [visibleTypes, setVisibleTypes] = useState<string[]>(ALL_TYPES)
  const [showShare, setShowShare] = useState(false)

  // Data served from meta.json — updated every 6h via GitHub Actions → Vercel rebuild.
  // Static SPA: no runtime API calls.
  const isDataStale = Date.now() - new Date(metaJson.lastUpdated).getTime() > STALENESS_WARN_MS
  const officialSourceFailures = metaJson.feedHealth?.officialSourceFailures ?? []

  const data = {
    confirmed: metaJson.confirmed,
    deaths: metaJson.deaths,
    countries: metaJson.countries,
    usStatesMonitoring: metaJson.usStatesMonitoring,
    lastUpdated: metaJson.lastUpdated,
    source: metaJson.source,
  }

  function handleToggle(type: string) {
    setVisibleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const statusBadges = [
    {
      label: 'WHO Global Risk',
      value: metaJson.whoGlobalRisk,
      color: metaJson.whoGlobalRisk === 'LOW' ? 'var(--color-accent-green)' : 'var(--color-accent-orange)',
      url: metaJson.whoGlobalRiskUrl,
    },
    {
      label: 'CDC Health Alert',
      value: metaJson.cdcResponseLevel,
      color: 'var(--color-accent-orange)',
      url: metaJson.cdcResponseLevelUrl,
    },
    {
      label: 'ECDC EU/EEA Risk',
      value: metaJson.ecdcRisk,
      color: metaJson.ecdcRisk === 'VERY LOW' || metaJson.ecdcRisk === 'LOW' ? 'var(--color-accent-green)' : 'var(--color-accent-orange)',
      url: metaJson.ecdcRiskUrl,
    },
  ]

  const confirmedSource = metricSource(
    'confirmed',
    data.source,
    'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON601',
    data.lastUpdated
  )
  const deathsSource = metricSource(
    'deaths',
    'WHO DON601',
    'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON601',
    data.lastUpdated
  )
  const countriesSource = metricSource(
    'countries',
    'WHO DON601',
    'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON601',
    data.lastUpdated
  )
  const usMonitoringSource = metricSource(
    'usStatesMonitoring',
    'CDC + State DOHs',
    'https://www.cdc.gov/han/php/notices/han00528.html',
    data.lastUpdated
  )

  const tiles = [
    {
      metric: 'Total Reported Cases',
      value: String(data.confirmed),
      ...confirmedSource,
      color: 'var(--color-accent-red)',
    },
    {
      metric: 'Global Deaths',
      value: String(data.deaths),
      ...deathsSource,
      color: 'var(--color-accent-orange)',
    },
    {
      metric: 'Countries with Cases',
      value: String(data.countries),
      ...countriesSource,
      color: 'var(--color-accent-yellow)',
    },
    {
      metric: 'U.S. States Monitoring',
      value: String(data.usStatesMonitoring),
      ...usMonitoringSource,
      color: 'var(--color-accent-blue)',
    },
  ]

  const hcw = metaJson.hcwAlert

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Page title */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0 0 0.25rem 0',
          }}
        >
          MV HONDIUS / ANDES VIRUS OUTBREAK 2026
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          Operational situation overview · EMS &amp; Public Health Intelligence
        </p>
      </div>

      {/* Staleness warning — shown when data has not updated in 48h during active outbreak */}
      {isDataStale && data.confirmed > 0 && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
            padding: '0.625rem 1rem',
            backgroundColor: 'rgba(255, 165, 0, 0.08)',
            border: '1px solid var(--color-accent-orange)',
            borderLeft: '3px solid var(--color-accent-orange)',
            borderRadius: '4px',
          }}
        >
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-accent-orange)', fontWeight: 700 }}>
            ⚠ DATA MAY BE STALE
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
            Last update: {new Date(data.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — verify time-sensitive data directly with WHO, CDC, or ECDC before operational use.
          </span>
        </div>
      )}

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          alignItems: isMobile ? 'flex-start' : 'center',
          marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        {statusBadges.map((badge) => (
          <a
            key={badge.label}
            href={badge.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.625rem',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: `1px solid ${badge.color}`,
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.625rem',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {badge.label}
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: badge.color,
              }}
            >
              {badge.value}
            </span>
          </a>
        ))}

        <div style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.5625rem',
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            Auto-updated {PIPELINE_INTERVAL_LABEL}
          </span>
        </div>
      </div>

      {/* Auto-update status row */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '1.25rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.5625rem',
            color: 'var(--color-accent-green)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          ● Auto-update: {PIPELINE_INTERVAL_LABEL}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)' }}>
          Last checked: {fmt(metaJson.lastChecked)}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)' }}>
          Data updated: {fmt(metaJson.lastUpdated)}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)' }}>
          Official sources: {officialSourceFailures.length === 0 ? 'OK' : `${officialSourceFailures.length} failing`}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-muted)' }}>
          {metaJson.source}
        </span>
      </div>

      {/* Case counter row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        {tiles.map((tile) => (
          <a
            key={tile.metric}
            href={tile.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '1rem',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderTop: `3px solid ${tile.color}`,
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '2rem',
                fontWeight: 700,
                color: tile.color,
                lineHeight: 1,
                marginBottom: '0.375rem',
              }}
            >
              {tile.value}
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '0.5rem',
                lineHeight: 1.3,
              }}
            >
              {tile.metric}
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.625rem',
                color: 'var(--color-text-muted)',
              }}
            >
              {tile.source} · {tile.date}
            </span>
          </a>
        ))}
      </div>

      {/* EMS Briefing Card */}
      <EMSBriefingCard />

      {/* HEALTHCARE WORKER ALERT CARD */}
      {hcw && (
        <div
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid var(--color-accent-red)',
            borderRadius: '4px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.625rem',
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-accent-red)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              ⚠ {hcw.title}
            </div>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.625rem',
                color: 'var(--color-text-muted)',
              }}
            >
              {hcw.date}
            </span>
          </div>

          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.9375rem',
              color: 'var(--color-text-primary)',
              lineHeight: 1.65,
              margin: '0 0 0.75rem 0',
            }}
          >
            {hcw.content}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <SourceChip
              authority={hcw.sourceLabel}
              documentTitle={hcw.title}
              date={hcw.date}
              url={hcw.sourceUrl}
            />
            <Link
              to="/ppe"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.75rem',
                color: 'var(--color-accent-red)',
                textDecoration: 'none',
              }}
            >
              Review PPE &amp; IPC Guidance →
            </Link>
          </div>
        </div>
      )}

      {/* Main two-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '1rem',
          marginBottom: '1rem',
          alignItems: 'stretch',
        }}
      >
        {/* Left: Timeline — fills full row height */}
        <Section style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
          <Timeline />
        </Section>

        {/* Right: US Monitoring + Flight Tracing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Section>
            <USMonitoringTable />
          </Section>
          <Section>
            <FlightTracingPanel />
          </Section>
        </div>
      </div>

      {/* Global Map */}
      <div style={{ marginBottom: '1rem' }}>
        <MapLayerToggle visibleTypes={visibleTypes} onToggle={handleToggle} />
        <ErrorBoundary label="Global Map">
          <GlobalMap visibleTypes={visibleTypes} />
        </ErrorBoundary>
      </div>

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          onClose={() => setShowShare(false)}
          caseStats={{
            confirmed: data.confirmed,
            deaths: data.deaths,
            countries: data.countries,
            usStatesMonitoring: data.usStatesMonitoring,
            lastUpdated: data.lastUpdated,
          }}
        />
      )}

      {/* Share button — fixed bottom-right; bottom accounts for iOS home-indicator safe area */}
      <button
        onClick={() => setShowShare(true)}
        aria-label="Share outbreak alert"
        style={{
          position: 'fixed',
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          right: '1.5rem',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.75rem 1rem',
          minHeight: '44px',
          backgroundColor: 'var(--color-emergenz)',
          border: 'none',
          borderRadius: '4px',
          color: '#000',
          cursor: 'pointer',
          zIndex: 500,
          boxShadow: '0 2px 12px rgba(0,194,255,0.3)',
        }}
      >
        ✉ Share Alert
      </button>
    </div>
  )
}
