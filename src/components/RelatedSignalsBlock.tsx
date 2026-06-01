// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * RelatedSignalsBlock
 *
 * Renders a "Related signals" section at the bottom of each SignalDetail.
 * Shows other active signals that share a documented relationship with this one
 * (shared surveillance platform, geographic overlap, pathogen-family risk, etc.).
 * Each card links directly to the related signal's detail page.
 *
 * Also links to the /network page for the full relationship graph.
 */
import { Link } from 'react-router-dom'
import type { Signal, SignalRelationship, SignalRelationshipType } from '../types'
import { SEVERITY_COLORS } from '../utils/signals'

const RELATIONSHIP_TYPE_LABELS: Record<SignalRelationshipType, string> = {
  'surveillance-platform': 'Shared surveillance',
  'geographic-overlap': 'Geographic overlap',
  'pathogen-family': 'Pathogen family',
  'shared-context': 'Shared driver',
  'pandemic-precursor': 'Pandemic precursor',
  'response-resource-conflict': 'Resource conflict',
}

const RELATIONSHIP_TYPE_COLORS: Record<SignalRelationshipType, string> = {
  'surveillance-platform': 'var(--color-accent-blue)',
  'geographic-overlap': 'var(--color-severity-concern)',
  'pathogen-family': 'var(--color-severity-action)',
  'shared-context': 'var(--color-text-muted)',
  'pandemic-precursor': 'var(--color-severity-action)',
  'response-resource-conflict': 'var(--color-severity-watch)',
}

interface Props {
  relationships: SignalRelationship[]
  /** All signals, so we can look up metadata for each related signal. */
  allSignals: Signal[]
}

export default function RelatedSignalsBlock({ relationships, allSignals }: Props) {
  if (!relationships.length) return null

  const resolved = relationships
    .map((rel) => {
      const signal = allSignals.find((s) => s.id === rel.signalId)
      return signal ? { rel, signal } : null
    })
    .filter((x): x is { rel: SignalRelationship; signal: Signal } => x !== null)

  if (!resolved.length) return null

  return (
    <section
      id="related-signals"
      style={{ scrollMarginTop: '1rem', marginBottom: '1.5rem' }}
      aria-label="Related signals"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <h2
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Related signals
        </h2>
        <Link
          to="/network"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.5625rem',
            color: 'var(--color-accent-blue)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          View network graph →
        </Link>
      </div>

      {/* Relationship cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '0.5rem',
        }}
      >
        {resolved.map(({ rel, signal }) => {
          const severityColor = SEVERITY_COLORS[signal.severity]
          const typeColor = RELATIONSHIP_TYPE_COLORS[rel.type]
          const typeLabel = RELATIONSHIP_TYPE_LABELS[rel.type]
          return (
            <Link
              key={signal.id}
              to={`/signals/${signal.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderTop: `3px solid ${severityColor}`,
                  borderRadius: '4px',
                  transition: 'border-color 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = severityColor
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'
                  ;(e.currentTarget as HTMLDivElement).style.borderTopColor = severityColor
                }}
              >
                {/* Relationship type badge */}
                <div style={{ marginBottom: '0.375rem' }}>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: typeColor,
                      background: `color-mix(in srgb, ${typeColor} 12%, transparent)`,
                      padding: '0.125rem 0.375rem',
                      borderRadius: '3px',
                    }}
                  >
                    {typeLabel}
                  </span>
                </div>

                {/* Signal name */}
                <div
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {signal.name}
                </div>

                {/* Relationship description */}
                <div
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.45,
                    marginBottom: '0.375rem',
                  }}
                >
                  {rel.relationship}
                </div>

                {/* Severity + status pills */}
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: severityColor,
                      background: `color-mix(in srgb, ${severityColor} 12%, transparent)`,
                      padding: '0.125rem 0.375rem',
                      borderRadius: '3px',
                    }}
                  >
                    {signal.severity}
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.5rem',
                      color: 'var(--color-text-muted)',
                      padding: '0.125rem 0.375rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '3px',
                    }}
                  >
                    {signal.status}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
