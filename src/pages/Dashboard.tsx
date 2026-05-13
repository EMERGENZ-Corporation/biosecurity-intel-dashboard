import { useState, useEffect } from 'react'
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
import { getCached, setCache, isFresh } from '../utils/sessionCache'

const ALL_TYPES = [
  'ship_route',
  'case_confirmed',
  'death',
  'monitoring_facility',
  'us_state_monitoring',
  'flight_tracing',
  'return_destination',
]

const REFRESH_CACHE_KEY = 'situation_data_cache'
const REFRESH_TS_KEY = 'situation_data_ts'
const REFRESH_TTL = 6 * 60 * 60 * 1000 // 6 hours

interface SituationData {
  confirmed: number
  deaths: number
  countries: number
  usStatesMonitoring: number
  lastUpdated: string
  source: string
  live: boolean
}

const STATIC_DATA: SituationData = {
  confirmed: 11,
  deaths: 3,
  countries: 8,
  usStatesMonitoring: 11,
  lastUpdated: '2026-05-12T00:00:00Z',
  source: 'WHO / ECDC / CDC',
  live: false,
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1rem',
      }}
    >
      {children}
    </div>
  )
}

export default function Dashboard() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [visibleTypes, setVisibleTypes] = useState<string[]>(ALL_TYPES)
  const [data, setData] = useState<SituationData>(
    getCached<SituationData>(REFRESH_CACHE_KEY) ?? STATIC_DATA
  )
  const [refreshing, setRefreshing] = useState(false)
  const [showShare, setShowShare] = useState(false)

  function handleToggle(type: string) {
    setVisibleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  async function handleRefresh() {
    if (isFresh(REFRESH_TS_KEY)) return
    setRefreshing(true)
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const freshData = (await res.json()) as SituationData
      setData(freshData)
      setCache(REFRESH_CACHE_KEY, freshData, REFRESH_TTL)
      setCache(REFRESH_TS_KEY, Date.now(), REFRESH_TTL)
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setRefreshing(false)
    }
  }

  // Fetch on mount if cache is stale
  useEffect(() => {
    if (!isFresh(REFRESH_TS_KEY)) {
      handleRefresh()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const canRefresh = !isFresh(REFRESH_TS_KEY) && !refreshing

  const tiles = [
    {
      metric: 'Global Confirmed + Probable',
      value: String(data.confirmed),
      source: 'WHO / ECDC',
      date: new Date(data.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      url: 'https://www.ecdc.europa.eu/en/infectious-disease-topics/hantavirus-infection/surveillance-and-updates/andes-hantavirus-outbreak',
      color: 'var(--color-accent-red)',
    },
    {
      metric: 'Global Deaths',
      value: String(data.deaths),
      source: 'WHO',
      date: new Date(data.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      url: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON599',
      color: 'var(--color-accent-orange)',
    },
    {
      metric: 'Countries with Cases',
      value: String(data.countries),
      source: 'WHO DON600',
      date: 'May 11, 2026',
      url: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600',
      color: 'var(--color-accent-yellow)',
    },
    {
      metric: 'U.S. States Monitoring',
      value: String(data.usStatesMonitoring),
      source: 'CDC + State DOHs',
      date: new Date(data.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      url: 'https://www.cdc.gov/han/php/notices/han00528.html',
      color: 'var(--color-accent-blue)',
    },
  ]

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
        {[
          {
            label: 'WHO Global Risk',
            value: 'LOW',
            color: 'var(--color-accent-green)',
            url: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600',
          },
          {
            label: 'CDC Response',
            value: 'Level 3',
            color: 'var(--color-accent-orange)',
            url: 'https://www.cdc.gov/han/php/notices/han00528.html',
          },
          {
            label: 'ECDC EU/EEA Risk',
            value: 'VERY LOW',
            color: 'var(--color-accent-green)',
            url: 'https://www.ecdc.europa.eu/en/infectious-disease-topics/hantavirus-infection/surveillance-and-updates/andes-hantavirus-outbreak',
          },
        ].map((badge) => (
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
          {data.live && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.5625rem',
                color: 'var(--color-accent-green)',
              }}
            >
              ● LIVE
            </span>
          )}
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.5625rem',
              color: 'var(--color-text-muted)',
            }}
          >
            {data.source} ·{' '}
            {new Date(data.lastUpdated).toLocaleString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={!canRefresh}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              padding: '0.25rem 0.625rem',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: `1px solid ${canRefresh ? 'var(--color-emergenz)' : 'var(--color-border)'}`,
              borderRadius: '3px',
              color: canRefresh ? 'var(--color-emergenz)' : 'var(--color-text-muted)',
              cursor: canRefresh ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh Data ↻'}
          </button>
        </div>
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
            ⚠ HEALTHCARE WORKER EXPOSURE EVENT — Netherlands
          </div>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              color: 'var(--color-text-muted)',
            }}
          >
            May 12, 2026
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
          12 staff at Radboud UMC university medical centre in Nijmegen placed in precautionary
          quarantine after an incorrect blood sampling procedure was followed with a confirmed Andes
          hantavirus patient. May 12, 2026.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <SourceChip
            authority="Euronews"
            documentTitle="Dutch hospital workers quarantined after faulty procedure"
            date="May 12, 2026"
            url="https://www.euronews.com/health/2026/05/12/dutch-hospital-workers-quarantined-after-faulty-procedure-treating-hantavirus-patient"
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

      {/* Main two-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {/* Left: Timeline */}
        <Section>
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
        <GlobalMap visibleTypes={visibleTypes} />
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

      {/* Share button — fixed bottom-right */}
      <button
        onClick={() => setShowShare(true)}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.625rem 1rem',
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
