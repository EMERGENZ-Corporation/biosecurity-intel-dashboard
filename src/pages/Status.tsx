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
  dashboard?: Record<string, unknown>
  sources?: {
    total?: number
    primary?: number
    secondary?: number
  }
  staleReasons?: string[]
  runbook?: string
  signals?: {
    active?: number
    highestSeverity?: string | null
    byCategory?: Record<string, number>
    staleSignalIds?: string[]
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
          Data last updated {status.dashboard?.lastUpdated ? formatDateTime(status.dashboard.lastUpdated as string) : '—'}
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
        <Row label="Max data age">{status.thresholds?.maxDataAgeHours ?? '—'}h</Row>
        <Row label="Max official check age">{status.thresholds?.maxOfficialCheckAgeHours ?? '—'}h</Row>
        {status.signals && (
          <>
            <Row label="Active signals">{status.signals.active ?? '—'}</Row>
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
          Source registry
        </h2>
        <Row label="Registered sources">{status.sources?.total ?? '—'}</Row>
        <Row label="Primary sources">{status.sources?.primary ?? '—'}</Row>
        <Row label="Secondary sources">{status.sources?.secondary ?? '—'}</Row>
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
