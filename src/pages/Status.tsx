// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import { useEffect, useState } from 'react'
import { formatDateTime } from '../utils/signals'
import staticStatus from '../../public/status.json'

interface StatusJson {
  schemaVersion: number
  status: string
  generatedAt: string
  thresholds?: {
    maxDataAgeHours: number
    maxOfficialCheckAgeHours: number
  }
  dashboard?: {
    lastUpdated?: string | null
    lastChecked?: string | null
    lastOfficialSourceCheck?: string | null
    dataAgeHours?: number | null
    officialCheckAgeHours?: number | null
  }
  sources?: {
    total?: number
    primary?: number
    secondary?: number
    byTier?: Record<string, number>
  }
  staleReasons?: string[]
  runbook?: string
  signals?: {
    total?: number
    active?: number
    highestSeverity?: string | null
    byCategory?: Record<string, number>
    staleSignalIds?: string[]
    timelineEvents?: number
    totalMapMarkers?: number
    totalDetailSections?: number
  }
  news?: {
    total?: number
    newest?: string | null
  }
  automation?: {
    mode?: string
    publicSummary?: string
    dataWriters?: Array<{
      id: string
      cadence: string
      workflow: string
    }>
    reviewGates?: Array<{
      id: string
      mode: string
    }>
    monitors?: Array<{
      id: string
      cadence: string
      workflow: string
    }>
  }
}

const STATUS_COLORS: Record<string, string> = {
  ok: 'var(--color-accent-green)',
  degraded: 'var(--color-accent-orange)',
  critical: 'var(--color-accent-red)',
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '1rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-primary)', textAlign: 'right' }}>
        {children}
      </span>
    </div>
  )
}

function formatStatusDate(iso?: string | null): string {
  return iso ? formatDateTime(iso) : '—'
}

export default function Status() {
  const [live, setLive] = useState<StatusJson | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/status.json', { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled) setLive(json as StatusJson)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const status = (live ?? (staticStatus as StatusJson))
  const color = STATUS_COLORS[status.status] ?? 'var(--color-text-secondary)'
  const staleReasons = status.staleReasons ?? []

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.25rem 0',
        }}
      >
        STATUS
      </h1>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
        Human-readable view of the public <code>/status.json</code> contract
      </p>

      <div
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderLeft: `4px solid ${color}`,
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '1.25rem',
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {status.status}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Status generated {formatStatusDate(status.generatedAt)}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Curated signal data updated {formatStatusDate(status.dashboard?.lastUpdated)}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Latest news item {formatStatusDate(status.news?.newest)}
        </div>
      </div>

      <div
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem 0' }}>
          Data freshness
        </h2>
        <Row label="Status generated">{formatStatusDate(status.generatedAt)}</Row>
        <Row label="Curated signal data">{formatStatusDate(status.dashboard?.lastUpdated)}</Row>
        <Row label="Official source review">{formatStatusDate(status.dashboard?.lastOfficialSourceCheck)}</Row>
        {status.news?.newest && <Row label="Latest news item">{formatDateTime(status.news.newest)}</Row>}
        <Row label="Max signal-data age">{status.thresholds?.maxDataAgeHours ?? '—'}h</Row>
        <Row label="Max source-review age">{status.thresholds?.maxOfficialCheckAgeHours ?? '—'}h</Row>
        {status.signals && (
          <>
            <Row label="Active signals">{status.signals.active ?? '—'} / {status.signals.total ?? '—'}</Row>
            <Row label="Highest severity">{status.signals.highestSeverity ?? '—'}</Row>
            <Row label="Stale signals">{status.signals.staleSignalIds?.length ?? 0}</Row>
          </>
        )}
      </div>

      <div
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem 0' }}>
          Content volume
        </h2>
        <Row label="Map markers">{status.signals?.totalMapMarkers ?? '—'}</Row>
        <Row label="Detail sections">{status.signals?.totalDetailSections ?? '—'}</Row>
        <Row label="Timeline events">{status.signals?.timelineEvents ?? '—'}</Row>
        <Row label="News items">{status.news?.total ?? '—'}</Row>
      </div>

      {status.automation && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
          }}
        >
          <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem 0' }}>
            Autonomous update loop
          </h2>
          <Row label="Mode">{status.automation.mode ?? '-'}</Row>
          <Row label="Scheduled writers">{status.automation.dataWriters?.length ?? 0}</Row>
          <Row label="Review gates">{status.automation.reviewGates?.length ?? 0}</Row>
          <Row label="Monitors">{status.automation.monitors?.length ?? 0}</Row>
          {status.automation.dataWriters?.map((writer) => (
            <Row key={writer.id} label={writer.id}>{writer.cadence} | {writer.workflow}</Row>
          ))}
        </div>
      )}

      <div
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem 0' }}>
          Source registry
        </h2>
        <Row label="Registered sources">{status.sources?.total ?? '—'}</Row>
        <Row label="Primary sources">{status.sources?.primary ?? '—'}</Row>
        <Row label="Secondary sources">{status.sources?.secondary ?? '—'}</Row>
        {status.sources?.byTier && (
          <>
            <Row label="Tier 1 (authoritative)">{status.sources.byTier.tier1 ?? 0}</Row>
            <Row label="Tier 2 (institutional)">{status.sources.byTier.tier2 ?? 0}</Row>
            <Row label="Tier 3 (media)">{status.sources.byTier.tier3 ?? 0}</Row>
            <Row label="Tier 4 (preprint)">{status.sources.byTier.tier4 ?? 0}</Row>
          </>
        )}
      </div>

      {/* Public API documentation */}
      <div
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem 0' }}>
          Public API
        </h2>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
            margin: '0 0 0.75rem 0',
          }}
        >
          All dashboard data is published as static JSON under{' '}
          <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--color-accent-blue)' }}>
            /api/v1/
          </code>
          . Each endpoint is wrapped in an envelope with{' '}
          <code style={{ fontFamily: "'IBM Plex Mono', monospace' " }}>schemaVersion</code>,{' '}
          <code style={{ fontFamily: "'IBM Plex Mono', monospace" }}>generatedAt</code>, and{' '}
          <code style={{ fontFamily: "'IBM Plex Mono', monospace" }}>count</code>. Endpoints are
          regenerated on every signal-data and news-pipeline commit. No
          authentication required; CORS open for analyst tooling.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {[
            { path: '/status.json', desc: 'Dashboard health, depth counters, source-tier breakdown' },
            { path: '/api/v1/signals.json', desc: 'Full Signal[] — 16 signals with markers, sections, attributions, risk badges, HCW alerts, watch indicators' },
            { path: '/api/v1/signal-sources.json', desc: 'Full SignalSource[] — 38 sources with tier, type, domain, lastVerified' },
            { path: '/api/v1/signal-timeline.json', desc: 'Full SignalTimelineEvent[] — 41 chronological events tied to signals + sources' },
            { path: '/api/v1/news.json', desc: 'Full NewsItem[] — 500 most recent news items with signalIds tags' },
            { path: '/api/v1/feed.rss', desc: 'RSS 2.0 feed — high-severity signals + 20 most-recent news items. Subscribe in your feed reader for push-style alerts.' },
          ].map(({ path, desc }) => (
            <div
              key={path}
              style={{
                padding: '0.5rem 0.625rem',
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
            >
              <a
                href={path}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.75rem',
                  color: 'var(--color-accent-blue)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                GET {path} ↗
              </a>
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  marginTop: '0.25rem',
                  lineHeight: 1.45,
                }}
              >
                {desc}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: '0.625rem',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Example:{' '}
          <code style={{ color: 'var(--color-text-secondary)' }}>
            curl https://biosecurity-intel.emergenzsystems.org/api/v1/signals.json
          </code>
        </div>
      </div>

      {staleReasons.length > 0 && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-accent-orange)',
            borderRadius: '6px',
            color: 'var(--color-accent-orange)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
          }}
        >
          <strong>Stale reasons:</strong> {staleReasons.join('; ')}
        </div>
      )}

      {status.runbook && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {status.runbook}
        </div>
      )}
    </div>
  )
}
