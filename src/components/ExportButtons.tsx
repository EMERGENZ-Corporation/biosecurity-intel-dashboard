// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import { downloadCsv, downloadJson } from '../utils/export'

interface Props {
  /** Stem of the downloaded filename — e.g. "signals" → signals.csv / signals.json */
  filename: string
  /** Raw rows for CSV export (will be flattened to first-level keys) */
  rows: Record<string, unknown>[]
  /** Rich data for JSON export — defaults to rows */
  json?: unknown
  /** Optional caption rendered alongside the buttons */
  label?: string
}

/**
 * Compact CSV/JSON download bar surfaced on list pages so analysts can
 * pull data into Excel / Python / R without scraping. UX-GAP §1.7 #16.
 */
export default function ExportButtons({ filename, rows, json, label = 'Export' }: Props) {
  const buttonStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.625rem',
    fontWeight: 600,
    padding: '0.3rem 0.625rem',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'var(--color-accent-blue)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      role="group"
      aria-label="Export data"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        flexWrap: 'wrap',
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
        {label}:
      </span>
      <button
        type="button"
        onClick={() => downloadCsv(`${filename}.csv`, rows)}
        title={`Download ${rows.length} row${rows.length !== 1 ? 's' : ''} as CSV`}
        style={buttonStyle}
      >
        CSV ↓
      </button>
      <button
        type="button"
        onClick={() => downloadJson(`${filename}.json`, json ?? rows)}
        title="Download as JSON"
        style={buttonStyle}
      >
        JSON ↓
      </button>
    </div>
  )
}
