// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import type { Signal } from '../types'
import { SEVERITY_LABELS, SEVERITY_COLORS, CONFIDENCE_LABELS, TREND_LABELS } from '../utils/signals'

interface Props {
  signal: Signal
}

/**
 * Executive verdict / TL;DR box rendered at the top of every signal detail
 * page. Synthesizes severity + confidence + trend into a one-line "verdict"
 * plus a short operational summary so a user reading on a phone or in a
 * 30-second triage window gets the operational bottom line without
 * scrolling through 13 sections.
 *
 * Pulls from the signal's existing fields — no new authoring required.
 * The text composition is rules-based, not LLM-generated, so it's
 * deterministic and reviewable.
 */
export default function TldrBox({ signal }: Props) {
  const sevColor = SEVERITY_COLORS[signal.severity]
  const sevLabel = SEVERITY_LABELS[signal.severity]
  const confidence = CONFIDENCE_LABELS[signal.confidence]
  const trend = TREND_LABELS[signal.trend]

  // First sentence of operationalRelevance gives the core "what to do" framing.
  const firstSentence = signal.operationalRelevance.split(/(?<=[.!?])\s+/)[0] ?? signal.operationalRelevance

  return (
    <div
      role="region"
      aria-label="Executive verdict"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${sevColor}`,
        borderRadius: '6px',
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.5625rem',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Executive verdict
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            fontWeight: 700,
            color: sevColor,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.1rem 0.4rem',
            border: `1px solid ${sevColor}`,
            borderRadius: '3px',
          }}
        >
          {sevLabel}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {confidence} · {trend}
        </span>
      </div>

      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.9375rem',
          color: 'var(--color-text-primary)',
          lineHeight: 1.55,
          margin: '0 0 0.5rem 0',
        }}
      >
        {firstSentence}
      </p>

      {signal.whyItMatters && (
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--color-emergenz)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginRight: '0.5rem',
            }}
          >
            Why it matters:
          </span>
          {signal.whyItMatters}
        </p>
      )}
    </div>
  )
}
