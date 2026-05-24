/**
 * NetworkPage — /network
 *
 * Visualizes cross-signal relationships as an SVG network graph.
 * Layout: radial, signals arranged by severity ring (action → concern → watch → monitor).
 * Edges colored and typed by SignalRelationshipType.
 * No external graph library — pure SVG computed in React.
 *
 * Implements UX-GAP-ANALYSIS §3 #22.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signals, SEVERITY_COLORS } from '../utils/signals'
import type { Signal, SignalRelationshipType } from '../types'

// ── Layout constants ──────────────────────────────────────────────────────────
const WIDTH = 900
const HEIGHT = 720
const CX = WIDTH / 2
const CY = HEIGHT / 2

const SEVERITY_RINGS: Record<string, number> = {
  action: 90,
  concern: 175,
  watch: 245,
  monitor: 300,
}

// ── Edge styling by relationship type ────────────────────────────────────────
const EDGE_COLORS: Record<SignalRelationshipType, string> = {
  'surveillance-platform': '#4a9eff',
  'geographic-overlap': '#e6873a',
  'pathogen-family': '#e05252',
  'shared-context': '#9ca3af',
  'pandemic-precursor': '#e05252',
  'response-resource-conflict': '#f5c518',
}

const EDGE_LABELS: Record<SignalRelationshipType, string> = {
  'surveillance-platform': 'Shared surveillance',
  'geographic-overlap': 'Geographic overlap',
  'pathogen-family': 'Pathogen family',
  'shared-context': 'Shared driver',
  'pandemic-precursor': 'Pandemic precursor',
  'response-resource-conflict': 'Resource conflict',
}

// ── Compute node positions ───────────────────────────────────────────────────
interface NodePosition {
  id: string
  x: number
  y: number
  signal: Signal
}

function computeLayout(signals: Signal[]): NodePosition[] {
  const byRing: Record<string, Signal[]> = { action: [], concern: [], watch: [], monitor: [] }
  for (const s of signals) {
    byRing[s.severity]?.push(s)
  }

  const positions: NodePosition[] = []
  for (const [severity, ring] of Object.entries(byRing)) {
    const r = SEVERITY_RINGS[severity]
    ring.forEach((s, i) => {
      const angle = (i / ring.length) * 2 * Math.PI - Math.PI / 2
      positions.push({
        id: s.id,
        x: CX + r * Math.cos(angle),
        y: CY + r * Math.sin(angle),
        signal: s,
      })
    })
  }
  return positions
}

// ── Build unique edge list from relatedSignals ────────────────────────────────
interface Edge {
  from: string
  to: string
  type: SignalRelationshipType
  relationship: string
}

function buildEdges(signals: Signal[]): Edge[] {
  const seen = new Set<string>()
  const edges: Edge[] = []
  for (const s of signals) {
    for (const rel of s.relatedSignals ?? []) {
      const key = [s.id, rel.signalId].sort().join('|')
      if (!seen.has(key)) {
        seen.add(key)
        edges.push({ from: s.id, to: rel.signalId, type: rel.type, relationship: rel.relationship })
      }
    }
  }
  return edges
}

// ── Legend entry ─────────────────────────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
    </div>
  )
}

function LegendLine({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden="true">
        <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
      </svg>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5625rem', color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NetworkPage() {
  const [hovered, setHovered] = useState<string | null>(null)

  const positions = computeLayout(signals)
  const edges = buildEdges(signals)

  const posMap = new Map(positions.map((p) => [p.id, p]))

  // Determine which nodes/edges to highlight when a node is hovered
  const hoveredRelIds = hovered
    ? new Set(
        (signals.find((s) => s.id === hovered)?.relatedSignals ?? []).map((r) => r.signalId).concat([hovered])
      )
    : null

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/signals"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--color-accent-blue)',
            textDecoration: 'none',
          }}
        >
          ← All signals
        </Link>
        <h1
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0.5rem 0 0.25rem 0',
          }}
        >
          Signal relationship network
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          Cross-signal relationships documented from public health authorities and epidemiological
          evidence. Nodes sized by severity ring; edges colored by relationship type. Hover a node
          to highlight its connections.
        </p>
      </div>

      {/* Graph + legend */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {/* SVG graph */}
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: '100%', minWidth: '640px', height: 'auto', display: 'block' }}
          aria-label="Signal relationship network graph"
          role="img"
        >
          {/* Ring guides (cosmetic) */}
          {Object.values(SEVERITY_RINGS).map((r) => (
            <circle
              key={r}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="0.5"
              opacity={0.4}
            />
          ))}

          {/* Edges */}
          {edges.map((edge) => {
            const from = posMap.get(edge.from)
            const to = posMap.get(edge.to)
            if (!from || !to) return null

            const isHighlighted =
              hoveredRelIds == null ||
              (hoveredRelIds.has(edge.from) && hoveredRelIds.has(edge.to))

            const color = EDGE_COLORS[edge.type]
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={color}
                strokeWidth={isHighlighted ? 1.75 : 0.75}
                strokeDasharray="5 3"
                opacity={isHighlighted ? 0.8 : 0.2}
                style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
              />
            )
          })}

          {/* Nodes */}
          {positions.map((pos) => {
            const s = pos.signal
            const color = SEVERITY_COLORS[s.severity]
            const isHovered = hovered === s.id
            const isDimmed = hoveredRelIds != null && !hoveredRelIds.has(s.id)
            const relCount = (s.relatedSignals ?? []).length

            // Node radius: base 8, +1 per connection, max 14
            const r = Math.min(14, 8 + relCount)

            return (
              <g
                key={s.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                opacity={isDimmed ? 0.2 : 1}
                aria-label={s.name}
              >
                {/* Outer glow on hover */}
                {isHovered && (
                  <circle
                    r={r + 6}
                    fill={color}
                    opacity={0.15}
                  />
                )}
                {/* Node circle */}
                <circle
                  r={r}
                  fill={`color-mix(in srgb, ${color} 25%, var(--color-bg-secondary))`}
                  stroke={color}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />
                {/* Signal name label */}
                <text
                  textAnchor="middle"
                  dy={r + 11}
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize={9}
                  fill={isHovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {s.name.length > 22 ? s.name.slice(0, 21) + '…' : s.name}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Hovered signal tooltip bar */}
        {hovered && (() => {
          const s = signals.find((x) => x.id === hovered)
          if (!s) return null
          return (
            <div
              style={{
                padding: '0.625rem 1rem',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.5625rem',
                    color: SEVERITY_COLORS[s.severity],
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginRight: '0.5rem',
                  }}
                >
                  {s.severity}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {s.name}
                </span>
                {(s.relatedSignals?.length ?? 0) > 0 && (
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.5625rem',
                      color: 'var(--color-text-muted)',
                      marginLeft: '0.75rem',
                    }}
                  >
                    {s.relatedSignals!.length} connection{s.relatedSignals!.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <Link
                to={`/signals/${s.id}`}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.625rem',
                  color: 'var(--color-accent-blue)',
                  textDecoration: 'none',
                }}
              >
                View signal →
              </Link>
            </div>
          )
        })()}

        {/* Legend */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.5625rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.5rem',
            }}
          >
            Legend
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Node severity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <LegendDot color={SEVERITY_COLORS.action} label="Action" />
              <LegendDot color={SEVERITY_COLORS.concern} label="Concern" />
              <LegendDot color={SEVERITY_COLORS.watch} label="Watch" />
              <LegendDot color={SEVERITY_COLORS.monitor} label="Monitor" />
            </div>
            {/* Divider */}
            <div style={{ width: 1, height: 60, backgroundColor: 'var(--color-border)' }} />
            {/* Edge types */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {(Object.entries(EDGE_COLORS) as [SignalRelationshipType, string][]).map(([type, color]) => (
                <LegendLine key={type} color={color} label={EDGE_LABELS[type]} />
              ))}
            </div>
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.5rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.625rem',
            }}
          >
            Node size scales with connection count. Rings (inner → outer): action → concern → watch → monitor.
          </div>
        </div>
      </div>

      {/* Tabular fallback for accessibility */}
      <details style={{ marginTop: '1rem' }}>
        <summary
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          Relationship table (accessible view)
        </summary>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.75rem',
            marginTop: '0.5rem',
          }}
        >
          <thead>
            <tr>
              {['Signal', 'Related signal', 'Type', 'Description'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '0.375rem 0.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.5625rem',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {edges.map((edge, i) => {
              const from = signals.find((s) => s.id === edge.from)
              const to = signals.find((s) => s.id === edge.to)
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.375rem 0.5rem', color: 'var(--color-text-primary)' }}>
                    <Link to={`/signals/${edge.from}`} style={{ color: 'var(--color-accent-blue)' }}>
                      {from?.name ?? edge.from}
                    </Link>
                  </td>
                  <td style={{ padding: '0.375rem 0.5rem', color: 'var(--color-text-primary)' }}>
                    <Link to={`/signals/${edge.to}`} style={{ color: 'var(--color-accent-blue)' }}>
                      {to?.name ?? edge.to}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: '0.375rem 0.5rem',
                      color: EDGE_COLORS[edge.type],
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.5625rem',
                    }}
                  >
                    {EDGE_LABELS[edge.type]}
                  </td>
                  <td style={{ padding: '0.375rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                    {edge.relationship}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </details>
    </div>
  )
}
