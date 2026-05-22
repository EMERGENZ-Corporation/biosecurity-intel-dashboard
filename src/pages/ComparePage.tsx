import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  signals,
  getSignal,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  CONFIDENCE_LABELS,
  TREND_LABELS,
  categoryLabel,
  formatDate,
} from '../utils/signals'
import { computeSourceDiversity, diversityLabelColor } from '../utils/sourceDiversity'
import type { Signal } from '../types'

/**
 * Side-by-side comparison for analysts and intel officers per
 * UX-GAP-ANALYSIS §3 #21. Reads ?signals=A,B,C from the URL. Up to 4
 * signals can be compared at once before the layout becomes cramped.
 *
 * Provides multi-select chips to add/remove signals from the comparison.
 * Each column shows the same field set in the same order so the user can
 * scan a row to compare (e.g. severity row, PPE row, source diversity row).
 */
const MAX_COMPARE = 4

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const idsParam = searchParams.get('signals') ?? ''
  const ids = idsParam.split(',').filter(Boolean).slice(0, MAX_COMPARE)
  const selected = useMemo(
    () => ids.map((id) => getSignal(id)).filter((s): s is Signal => !!s),
    [ids]
  )

  function setSelected(nextIds: string[]) {
    if (nextIds.length === 0) setSearchParams({})
    else setSearchParams({ signals: nextIds.join(',') })
  }

  function toggle(id: string) {
    if (selected.find((s) => s.id === id)) {
      setSelected(selected.filter((s) => s.id !== id).map((s) => s.id))
    } else if (selected.length < MAX_COMPARE) {
      setSelected([...selected.map((s) => s.id), id])
    }
  }

  return (
    <div style={{ maxWidth: '1400px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.25rem 0',
        }}
      >
        COMPARE SIGNALS
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1rem 0',
        }}
      >
        Side-by-side comparison · up to {MAX_COMPARE} signals · {selected.length} selected
      </p>

      {/* Multi-select chips */}
      <div
        role="group"
        aria-label="Select signals to compare"
        style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem',
          }}
        >
          Select up to {MAX_COMPARE} signals:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {signals.map((s) => {
            const active = selected.some((sel) => sel.id === s.id)
            const sevColor = SEVERITY_COLORS[s.severity]
            const atCap = !active && selected.length >= MAX_COMPARE
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(s.id)}
                disabled={atCap}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.6875rem',
                  padding: '0.3rem 0.625rem',
                  backgroundColor: active ? 'var(--color-bg-tertiary)' : 'transparent',
                  border: `1px solid ${active ? sevColor : 'var(--color-border)'}`,
                  color: active ? 'var(--color-text-primary)' : atCap ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  borderRadius: '4px',
                  cursor: atCap ? 'not-allowed' : 'pointer',
                  opacity: atCap ? 0.45 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.name.length > 40 ? s.name.slice(0, 38) + '…' : s.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      {selected.length === 0 ? (
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            padding: '1.5rem 0',
          }}
        >
          Pick 2 or more signals above to compare. Useful for: "Hantavirus vs Lassa — both VHF-like,
          but PPE differs how?" or "H5 humans vs H5 dairy: same pathogen, different operational
          posture."
        </p>
      ) : (
        <ComparisonTable selected={selected} />
      )}
    </div>
  )
}

interface RowDef {
  label: string
  render: (s: Signal) => React.ReactNode
}

function ComparisonTable({ selected }: { selected: Signal[] }) {
  const rows: RowDef[] = [
    {
      label: 'Severity',
      render: (s) => (
        <span style={{ color: SEVERITY_COLORS[s.severity], fontWeight: 700, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem' }}>
          {SEVERITY_LABELS[s.severity]}
        </span>
      ),
    },
    { label: 'Confidence', render: (s) => CONFIDENCE_LABELS[s.confidence] },
    { label: 'Trend', render: (s) => TREND_LABELS[s.trend] },
    { label: 'Status', render: (s) => s.status },
    { label: 'Category', render: (s) => categoryLabel(s.category) },
    { label: 'Pathogen', render: (s) => s.pathogen ?? '—' },
    {
      label: 'Geography',
      render: (s) => (s.geography[0] ?? 'Global') + (s.geography.length > 1 ? ` +${s.geography.length - 1}` : ''),
    },
    { label: 'Map markers', render: (s) => s.mapMarkers?.length ?? 0 },
    { label: 'Detail sections', render: (s) => s.detailSections?.length ?? 0 },
    {
      label: 'Risk badges',
      render: (s) =>
        (s.riskAssessments?.length ?? 0) === 0
          ? '—'
          : (s.riskAssessments ?? []).map((r) => `${r.authority}: ${r.label}`).join(' · '),
    },
    {
      label: 'HCW alert',
      render: (s) =>
        s.hcwAlert ? (
          <span style={{ color: 'var(--color-accent-orange)', fontWeight: 600 }}>⚠ {s.hcwAlert.headline}</span>
        ) : (
          '—'
        ),
    },
    {
      label: 'Watch indicators',
      render: (s) => s.watchIndicators?.length ?? 0,
    },
    {
      label: 'Source diversity',
      render: (s) => {
        const score = computeSourceDiversity(s)
        const color = diversityLabelColor(score.label)
        return (
          <span style={{ color, fontWeight: 700, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem' }}>
            {score.label} · {score.distinctAuthorities} src
          </span>
        )
      },
    },
    { label: 'Last updated', render: (s) => formatDate(s.lastUpdated) },
    { label: 'Last checked', render: (s) => formatDate(s.lastChecked) },
    {
      label: 'Summary',
      render: (s) => (
        <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {s.summary}
        </span>
      ),
    },
    {
      label: 'Operational relevance',
      render: (s) => (
        <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {s.operationalRelevance}
        </span>
      ),
    },
  ]

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        overflow: 'auto',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th
              style={{
                padding: '0.625rem 0.875rem',
                textAlign: 'left',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.5625rem',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
                width: '160px',
                backgroundColor: 'var(--color-bg-secondary)',
                position: 'sticky',
                left: 0,
              }}
            >
              Field
            </th>
            {selected.map((s) => (
              <th
                key={s.id}
                style={{
                  padding: '0.625rem 0.875rem',
                  textAlign: 'left',
                  borderLeft: `3px solid ${SEVERITY_COLORS[s.severity]}`,
                  backgroundColor: 'var(--color-bg-secondary)',
                  minWidth: '220px',
                }}
              >
                <Link
                  to={`/signals/${s.id}`}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    display: 'block',
                    lineHeight: 1.3,
                  }}
                >
                  {s.name} →
                </Link>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.5625rem',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginTop: '0.25rem',
                  }}
                >
                  {categoryLabel(s.category)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: i % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)',
              }}
            >
              <td
                style={{
                  padding: '0.5rem 0.875rem',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.625rem',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  verticalAlign: 'top',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'inherit',
                  borderRight: '1px solid var(--color-border)',
                }}
              >
                {row.label}
              </td>
              {selected.map((s) => (
                <td
                  key={s.id}
                  style={{
                    padding: '0.5rem 0.875rem',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.8125rem',
                    verticalAlign: 'top',
                  }}
                >
                  {row.render(s)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
