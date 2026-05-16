import { useEffect } from 'react'
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
  // Trap focus and handle Escape (Escape does NOT dismiss — must click the button)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function handleAccept() {
    try {
      sessionStorage.setItem(SESSION_KEY, 'true')
    } catch { /* ignore */ }
    onAcknowledge()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ack-title"
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
          EMERGENZ — Hantavirus Intel Dashboard
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
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            margin: '0 0 1.25rem 0',
          }}
        >
          This dashboard provides aggregated public health information for situational awareness
          only. It does not constitute medical advice, clinical guidance, or official public health
          direction. EMS providers and clinicians must follow their agency protocols and medical
          director directives.
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
          Data is updated on a 12-hour automated cycle and may not reflect the most current
          information. Verify time-sensitive data directly with the originating authority before
          making operational decisions.
        </p>

        {/* CTA */}
        <button
          onClick={handleAccept}
          autoFocus
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
