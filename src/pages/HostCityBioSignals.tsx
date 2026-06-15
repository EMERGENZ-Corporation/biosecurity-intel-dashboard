// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  signalSources,
  hostCityBiosurveillance,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  formatDate,
} from '../utils/signals'
import { deriveHostCityStatus } from '../utils/hostCityBioSignals'
import type {
  HostCityRecord,
  HostCityObservation,
  HostCityDomainStatus,
  HostCityFreshnessStatus,
  DerivedHostCityStatus,
  SignalSeverity,
  SignalConfidence,
  SignalSource,
} from '../types'
import SourceChip from '../components/SourceChip'

const sourcesById = new Map<string, SignalSource>(signalSources.map((s) => [s.id, s]))

const COUNTRY_OPTIONS = ['United States', 'Canada', 'Mexico'] as const

type DomainColumnKey =
  | 'respiratoryStatus'
  | 'entericStatus'
  | 'vaccinePreventableStatus'
  | 'zoonoticVectorStatus'
  | 'environmentalStatus'

const DOMAIN_COLUMNS: Array<{ key: DomainColumnKey; label: string }> = [
  { key: 'respiratoryStatus', label: 'Respiratory' },
  { key: 'entericStatus', label: 'Enteric / GI' },
  { key: 'vaccinePreventableStatus', label: 'Vaccine-preventable' },
  { key: 'zoonoticVectorStatus', label: 'Zoonotic / Vector' },
  { key: 'environmentalStatus', label: 'Environmental' },
]

// Three empty-states are deliberately distinct (CONTENT-STANDARDS §4.2):
//   normal       — source-backed, nothing elevated
//   No data      — a source is registered but no current observation
//   Not monitored — no public surveillance source registered (dashed)
const DOMAIN_STATUS_DISPLAY: Record<HostCityDomainStatus, { label: string; color: string; dashed: boolean }> = {
  elevated: { label: 'Elevated', color: '#F97316', dashed: false },
  increasing: { label: 'Increasing', color: '#FBBF24', dashed: false },
  decreasing: { label: 'Decreasing', color: '#38BDF8', dashed: false },
  normal: { label: 'Normal', color: '#22C55E', dashed: false },
  unavailable: { label: 'No current data', color: '#94A3B8', dashed: false },
  unknown: { label: 'Not monitored', color: '#64748B', dashed: true },
}

const FRESHNESS_DISPLAY: Record<HostCityFreshnessStatus, { label: string; color: string }> = {
  current: { label: 'Sources current', color: '#22C55E' },
  stale: { label: 'Sources stale', color: '#F97316' },
  unavailable: { label: 'No current data', color: '#94A3B8' },
  unknown: { label: 'Coverage unknown', color: '#64748B' },
}

const CONFIDENCE_LABELS: Record<SignalConfidence, string> = {
  official: 'Official',
  corroborated: 'Corroborated',
  emerging: 'Emerging',
  unverified: 'Unverified',
}

const monoLabel = (extra: object = {}) => ({
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.625rem',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  ...extra,
})

interface CityWithStatus {
  city: HostCityRecord
  derived: DerivedHostCityStatus
}

function StatusChip({ status }: { status: HostCityDomainStatus }) {
  const d = DOMAIN_STATUS_DISPLAY[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.15rem 0.45rem',
        borderRadius: '3px',
        border: `1px ${d.dashed ? 'dashed' : 'solid'} ${d.color}`,
        backgroundColor: 'var(--color-bg-primary)',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.625rem',
        color: d.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: d.color }} />
      {d.label}
    </span>
  )
}

function ObservationRow({ obs }: { obs: HostCityObservation }) {
  const src = sourcesById.get(obs.sourceId)
  const statusDisp = DOMAIN_STATUS_DISPLAY[(obs.status === 'stale' ? 'unavailable' : obs.status) as HostCityDomainStatus]
  return (
    <div
      style={{
        padding: '0.5rem 0.625rem',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
        <span
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          {obs.pathogenOrSyndrome}
        </span>
        <span style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={monoLabel({ color: statusDisp.color })}>{statusDisp.label}</span>
          <span style={monoLabel()}>· {obs.observationType}</span>
        </span>
      </div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        {obs.summary}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
        <SourceChip
          authority={src?.authority ?? obs.sourceId}
          documentTitle={src?.title ?? 'Registered source'}
          date={formatDate(obs.reportDate ?? obs.sampleDate ?? obs.lastVerified)}
          url={obs.sourceUrl}
        />
        <span style={monoLabel()}>Verified {formatDate(obs.lastVerified)}</span>
      </div>
    </div>
  )
}

function CityCard({ city, derived }: CityWithStatus) {
  const publicObs = city.observations.filter((o) => o.publicDisplayAllowed)
  const sev = derived.overallBioSignalStatus
  const fresh = FRESHNESS_DISPLAY[derived.sourceFreshnessStatus]

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${SEVERITY_COLORS[sev]}`,
        borderRadius: '6px',
        padding: '0.875rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {city.displayName}
          </div>
          <div style={monoLabel({ textTransform: 'none', marginTop: '0.15rem' })}>
            {city.metroArea}, {city.country}
            {city.venueName ? ` · ${city.venueName}` : ''}
          </div>
        </div>
        <span
          style={{
            alignSelf: 'flex-start',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            border: `1px solid ${SEVERITY_COLORS[sev]}`,
            color: SEVERITY_COLORS[sev],
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {SEVERITY_LABELS[sev]}
        </span>
      </div>

      {/* Per-domain status matrix */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {DOMAIN_COLUMNS.map((col) => (
          <span key={col.key} style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={monoLabel({ fontSize: '0.5625rem' })}>{col.label}</span>
            <StatusChip status={derived[col.key]} />
          </span>
        ))}
      </div>

      {/* Source freshness + confidence */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: fresh.color }} />
          <span style={monoLabel({ color: fresh.color })}>{fresh.label}</span>
        </span>
        <span style={monoLabel()}>
          Source confidence: {derived.confidence ? CONFIDENCE_LABELS[derived.confidence] : '—'}
        </span>
        {derived.lastUpdated && <span style={monoLabel()}>Updated {formatDate(derived.lastUpdated)}</span>}
        <span style={monoLabel()}>{derived.publicObservationCount} source-backed obs.</span>
      </div>

      {/* Observations or honest empty state */}
      {publicObs.length > 0 ? (
        <div style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
          {publicObs.map((obs) => (
            <ObservationRow key={obs.id} obs={obs} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {city.sourceIds.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {city.sourceIds.map((sid) => {
                const s = sourcesById.get(sid)
                return s ? (
                  <SourceChip
                    key={sid}
                    authority={s.authority}
                    documentTitle={s.title}
                    date={`verified ${formatDate(s.lastVerified)}`}
                    url={s.url}
                  />
                ) : null
              })}
            </div>
          )}
          <span
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            {city.sourceCoverageSummary}
          </span>
        </div>
      )}
    </div>
  )
}

export default function HostCityBioSignals() {
  const [country, setCountry] = useState<string>('all')
  const [status, setStatus] = useState<SignalSeverity | 'all'>('all')
  const [domain, setDomain] = useState<DomainColumnKey | 'all'>('all')
  const [confidence, setConfidence] = useState<SignalConfidence | 'all'>('all')

  const allCities: CityWithStatus[] = useMemo(
    () =>
      hostCityBiosurveillance.hostCities.map((city) => ({
        city,
        derived: deriveHostCityStatus(city, sourcesById),
      })),
    [],
  )

  const filtered = useMemo(
    () =>
      allCities.filter(({ city, derived }) => {
        if (country !== 'all' && city.country !== country) return false
        if (status !== 'all' && derived.overallBioSignalStatus !== status) return false
        if (confidence !== 'all' && derived.confidence !== confidence) return false
        if (domain !== 'all' && derived[domain] === 'unknown') return false
        return true
      }),
    [allCities, country, status, domain, confidence],
  )

  const withCoverage = allCities.filter(({ city }) => city.sourceIds.length > 0).length
  const withObs = allCities.filter(({ derived }) => derived.publicObservationCount > 0).length

  return (
    <div style={{ maxWidth: '1100px' }}>
      <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>
        HOST CITY BIOSIGNALS
      </h1>
      <p style={monoLabel({ textTransform: 'none', margin: '0 0 1rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>
        FIFA World Cup 2026 host-city biosurveillance · {allCities.length} cities · {withCoverage} with registered sources · {withObs} with source-backed observations
      </p>

      {/* Disclaimer — required, non-negotiable */}
      <div
        style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          borderLeft: '3px solid var(--color-accent-blue)',
          borderRadius: '6px',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'var(--color-text-primary)' }}>Source-backed situational awareness only.</strong>{' '}
        Not clinical guidance. Not predictive modeling. EMERGENZ is independent and aggregates publicly available
        surveillance; it is not affiliated with FIFA or host-city authorities. Per-city status is derived only from
        publicly displayable, source-attributed observations — cities with no registered public surveillance source are
        shown as <em>Not monitored</em>, never inferred. For official public health guidance, see{' '}
        <Link to="/resources" style={{ color: 'var(--color-accent-blue)' }}>
          Resources
        </Link>
        .
      </div>

      {/* Legend */}
      <div
        style={{
          marginBottom: '1rem',
          padding: '0.625rem 0.875rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        <span style={monoLabel()}>States:</span>
        {(['normal', 'elevated', 'increasing', 'decreasing', 'unavailable', 'unknown'] as HostCityDomainStatus[]).map(
          (s) => (
            <StatusChip key={s} status={s} />
          ),
        )}
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
          padding: '0.625rem 0.875rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={monoLabel()}>Country</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={selectStyle}>
            <option value="all">All</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={monoLabel()}>Overall status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as SignalSeverity | 'all')} style={selectStyle}>
            <option value="all">All</option>
            {(['monitor', 'watch', 'concern', 'action'] as SignalSeverity[]).map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={monoLabel()}>Domain</span>
          <select value={domain} onChange={(e) => setDomain(e.target.value as DomainColumnKey | 'all')} style={selectStyle}>
            <option value="all">All</option>
            {DOMAIN_COLUMNS.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={monoLabel()}>Confidence</span>
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as SignalConfidence | 'all')}
            style={selectStyle}
          >
            <option value="all">All</option>
            {(['official', 'corroborated', 'emerging', 'unverified'] as SignalConfidence[]).map((c) => (
              <option key={c} value={c}>
                {CONFIDENCE_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* City grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '0.75rem' }}>
        {filtered.map((entry) => (
          <CityCard key={entry.city.id} city={entry.city} derived={entry.derived} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p style={monoLabel({ padding: '1rem 0' })}>
          No host cities match the current filters
          {domain !== 'all' ? ' — no city has registered coverage in this domain yet.' : '.'}
        </p>
      )}
    </div>
  )
}

const selectStyle = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.75rem',
  padding: '0.3rem 0.5rem',
  backgroundColor: 'var(--color-bg-tertiary)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  color: 'var(--color-text-primary)',
  minWidth: '8rem',
} as const
