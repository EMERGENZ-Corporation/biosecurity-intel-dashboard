import { useState } from 'react'
import { Link } from 'react-router-dom'
import Timeline from '../components/Timeline'
import USMonitoringTable from '../components/USMonitoringTable'
import FlightTracingPanel from '../components/FlightTracingPanel'
import SourceChip from '../components/SourceChip'
import GlobalMap from '../components/GlobalMap'
import MapLayerToggle from '../components/MapLayerToggle'

const ALL_TYPES = ['ship-route', 'case', 'death', 'monitoring', 'us-monitoring', 'flight', 'us-facility']

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
  const [visibleTypes, setVisibleTypes] = useState<string[]>(ALL_TYPES)

  function handleToggle(type: string) {
    setVisibleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

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
          Operational situation overview · Data as of May 12, 2026 · EMS & Public Health
          Intelligence
        </p>
      </div>

      {/* Status badges */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
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
            source: 'WHO DON600',
            url: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600',
          },
          {
            label: 'CDC Response',
            value: 'Level 3',
            color: 'var(--color-accent-orange)',
            source: 'CDC HAN 528',
            url: 'https://emergency.cdc.gov/han/2026/han00528.asp',
          },
          {
            label: 'ECDC EU/EEA Risk',
            value: 'VERY LOW',
            color: 'var(--color-accent-green)',
            source: 'ECDC May 12',
            url: 'https://www.ecdc.europa.eu/en/news-events/epidemiological-update-hantavirus-disease',
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
        <div
          style={{
            marginLeft: 'auto',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Static data · Map &amp; live refresh in Phase 3
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
        {[
          {
            metric: 'Global Confirmed + Probable',
            value: '11',
            source: 'WHO / ECDC',
            date: 'May 12, 2026',
            url: 'https://www.ecdc.europa.eu/en/news-events/epidemiological-update-hantavirus-disease',
            color: 'var(--color-accent-red)',
          },
          {
            metric: 'Global Deaths',
            value: '3',
            source: 'WHO',
            date: 'May 12, 2026',
            url: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON599',
            color: 'var(--color-accent-orange)',
          },
          {
            metric: 'Countries with Cases',
            value: '8',
            source: 'WHO DON600',
            date: 'May 11, 2026',
            url: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600',
            color: 'var(--color-accent-yellow)',
          },
          {
            metric: 'U.S. States Monitoring',
            value: '11',
            source: 'CDC + State DOHs',
            date: 'May 12, 2026',
            url: 'https://emergency.cdc.gov/han/2026/han00528.asp',
            color: 'var(--color-accent-blue)',
          },
        ].map((tile) => (
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
            Review PPE & IPC Guidance →
          </Link>
        </div>
      </div>

      {/* Main two-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
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
    </div>
  )
}
