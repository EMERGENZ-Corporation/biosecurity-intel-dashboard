// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const SESSION_KEY = 'emergenz_ack_v1'

export function hasAcknowledged(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  } catch {
    return true // if sessionStorage unavailable, don't block access
  }
}

interface Props {
  onAcknowledge: () => void
}

export default function AcknowledgmentModal({ onAcknowledge }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const acceptButtonRef = useRef<HTMLButtonElement>(null)

  // Trap focus and handle Escape (Escape does NOT dismiss — must click the button)
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    acceptButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        acceptButtonRef.current?.focus()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [])

  function handleAccept() {
    try {
      sessionStorage.setItem(SESSION_KEY, 'true')
    } catch { /* ignore */ }
    onAcknowledge()
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ack-title"
      aria-describedby="ack-description"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderTop: '3px solid var(--color-emergenz)',
          borderRadius: '6px',
          padding: '2rem',
          maxWidth: '540px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Logo / identity */}
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            fontWeight: 700,
            color: 'var(--color-emergenz)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1.25rem',
          }}
        >
          EMERGENZ — Biosecurity Intelligence Dashboard
        </div>

        {/* Title */}
        <h1
          id="ack-title"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0 0 1rem 0',
            lineHeight: 1.3,
          }}
        >
          Before You Enter
        </h1>

        {/* Acknowledgment text */}
        <p
          id="ack-description"
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            margin: '0 0 1.25rem 0',
          }}
        >
          This dashboard provides aggregated, source-backed biosecurity situational awareness
          across multiple biological threat domains. It does not constitute medical advice,
          clinical guidance, predictive modeling, or official public health direction. EMS
          providers and clinicians must follow their agency protocols and medical director
          directives.
        </p>

        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            margin: '0 0 1.75rem 0',
          }}
        >
          Data is refreshed on an automated cycle and may lag the originating source. Verify
          time-sensitive data directly with WHO, CDC, ECDC, Africa CDC, PAHO, or the relevant
          national authority before making operational decisions.
        </p>

        {/* CTA */}
        <button
          ref={acceptButtonRef}
          type="button"
          onClick={handleAccept}
          style={{
            width: '100%',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.875rem',
            fontWeight: 700,
            padding: '0.875rem 1.5rem',
            backgroundColor: 'var(--color-emergenz)',
            border: 'none',
            borderRadius: '4px',
            color: '#000',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            boxShadow: '0 2px 12px rgba(0,194,255,0.25)',
          }}
        >
          I Understand — Enter Dashboard
        </button>

        {/* Link to full disclaimer */}
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.5625rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            margin: '0.875rem 0 0 0',
          }}
        >
          <Link
            to="/about"
            style={{ color: 'var(--color-accent-blue)', textDecoration: 'none' }}
            onClick={handleAccept}
          >
            View full disclaimer and legal notice →
          </Link>
        </p>
      </div>
    </div>
  )
}
