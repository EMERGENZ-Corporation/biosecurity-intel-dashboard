// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import type { Signal } from '../types'

interface Props {
  signal: Signal
}

/**
 * Action strip pinned at the top of every signal detail. Surfaces the most
 * operationally useful contacts and a print/PDF affordance so EMS and
 * preparedness users don't have to scroll 30 viewport-heights to find a
 * phone number.
 *
 * Phone numbers are static authority constants:
 * - CDC Emergency Operations Center: 770-488-7100 (24-hour line for clinical
 *   consultation, specimen submission, and outbreak response coordination)
 * - State DOH lookup: CDC maintains a directory of state and territorial
 *   health departments.
 *
 * The Print button uses window.print() which triggers the browser's native
 * print dialog. A print stylesheet (src/index.css) hides the nav, footer,
 * action strip itself, and other chrome so the printed page is briefing-ready.
 */
export default function SignalActionStrip({ signal }: Props) {
  function onPrint() {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div
      className="signal-action-strip"
      role="region"
      aria-label="Operational quick-actions"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.625rem 0.875rem',
        marginBottom: '1rem',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderLeft: '3px solid var(--color-emergenz)',
        borderRadius: '6px',
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.5625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginRight: '0.25rem',
        }}
      >
        Quick actions:
      </span>

      <a
        href="tel:7704887100"
        title="CDC Emergency Operations Center — 24-hour clinical consultation"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--color-accent-red)',
          textDecoration: 'none',
          padding: '0.3rem 0.625rem',
          border: '1px solid var(--color-accent-red)',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
        }}
      >
        📞 CDC EOC · 770-488-7100
      </a>

      <a
        href="https://www.cdc.gov/publichealthgateway/healthdirectories/healthdepartments.html"
        target="_blank"
        rel="noopener noreferrer"
        title="CDC directory of state and territorial health departments"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--color-accent-blue)',
          textDecoration: 'none',
          padding: '0.3rem 0.625rem',
          border: '1px solid var(--color-accent-blue)',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
        }}
      >
        State DOH lookup ↗
      </a>

      {signal.primarySourceId && (
        <a
          href={`#sources`}
          title="Jump to source registry for this signal"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            padding: '0.3rem 0.625rem',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          Primary sources ↓
        </a>
      )}

      <a
        href={`/compare?signals=${signal.id}`}
        title="Compare this signal with another side-by-side"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textDecoration: 'none',
          padding: '0.3rem 0.625rem',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
        }}
      >
        Compare with… ↗
      </a>

      <button
        type="button"
        onClick={onPrint}
        title="Print or save as PDF — uses browser print dialog"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          padding: '0.3rem 0.625rem',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
        }}
      >
        Print briefing ↗
      </button>

      {signal.triageCard && (
        <a
          href={`/signals/${signal.id}/triage?print=1`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open the printable clinical triage card (case definition, isolation, PPE, notification chain)"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--color-emergenz)',
            textDecoration: 'none',
            padding: '0.3rem 0.625rem',
            border: '1px solid var(--color-emergenz)',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          🩺 Triage card ↗
        </a>
      )}
    </div>
  )
}
