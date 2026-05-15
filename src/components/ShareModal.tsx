import { useState, useEffect, useRef } from 'react'
import emsBriefing from '../data/ems-briefing.json'

interface Props {
  onClose: () => void
  caseStats?: {
    confirmed: number
    deaths: number
    countries: number
    usStatesMonitoring: number
    lastUpdated: string
  }
}

function buildDraft(caseStats?: Props['caseStats']) {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const updatedDate = caseStats?.lastUpdated
    ? new Date(caseStats.lastUpdated).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : date

  const subject = `SITUATIONAL ALERT: Andes Hantavirus (MV Hondius) — ${date}`

  const statsBlock = caseStats
    ? `CURRENT SITUATION (as of ${updatedDate}):
  • Confirmed + probable cases: ${caseStats.confirmed}
  • Deaths: ${caseStats.deaths}
  • Countries with cases: ${caseStats.countries}
  • U.S. states monitoring: ${caseStats.usStatesMonitoring}

Sources: WHO Disease Outbreak News DON600 · CDC HAN 528 · ECDC Rapid Risk Assessment`
    : ''

  const bulletsBlock = emsBriefing.bullets
    .map((b, i) => `  ${i + 1}. ${b}`)
    .join('\n\n')

  const body = `SITUATIONAL ALERT — ANDES HANTAVIRUS (MV HONDIUS OUTBREAK)
Issued: ${date} | EMERGENZ Intelligence Dashboard
${'-'.repeat(60)}

${statsBlock}
${'-'.repeat(60)}

EMS & CLINICAL OPERATIONAL GUIDANCE:
Sources: ${emsBriefing.sources.join(' + ')}

${bulletsBlock}

${'-'.repeat(60)}

RESOURCES:
  • CDC HAN 528: https://www.cdc.gov/han/php/notices/han00528.html
  • WHO DON600: https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600
  • ECDC RRA: https://www.ecdc.europa.eu/en/publications-data/hantavirus-associated-cluster-illness-cruise-ship-ecdc-assessment-and
  • NYC DOH HAN #8: https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf
  • EMERGENZ Dashboard: https://andeshantavirus.emergenzsystems.org

This alert was generated from authoritative public health sources via EMERGENZ.
Review and edit before sending. Do not forward unedited.`

  return { subject, body }
}

export default function ShareModal({ onClose, caseStats }: Props) {
  const { subject: initSubject, body: initBody } = buildDraft(caseStats)

  const [subject, setSubject] = useState(initSubject)
  const [body, setBody] = useState(initBody)

  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Focus close button on mount
  useEffect(() => {
    closeBtnRef.current?.focus()
  }, [])

  // Escape closes; Tab focus trap
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function openMailto() {
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div
              id="share-modal-title"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Share via Email
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.125rem',
              }}
            >
              Situational alert · Edit before sending · Opens your default email client
            </div>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
            }}
            aria-label="Close share modal"
          >
            ×
          </button>
        </div>

        {/* Edit fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>
          <div>
            <label
              htmlFor="share-subject"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.625rem',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Subject
            </label>
            <input
              id="share-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.875rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                color: 'var(--color-text-primary)',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <label
              htmlFor="share-body"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.625rem',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Body
            </label>
            <textarea
              id="share-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{
                flex: 1,
                minHeight: '240px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.75rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                resize: 'vertical',
                boxSizing: 'border-box',
                width: '100%',
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.5625rem',
              color: 'var(--color-text-muted)',
            }}
          >
            Sourced from: {emsBriefing.sources.join(' + ')} · Edit before sending
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={openMailto}
            disabled={!subject || !body}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-emergenz)',
              border: 'none',
              borderRadius: '4px',
              color: '#000',
              cursor: 'pointer',
            }}
          >
            Open in Email Client →
          </button>
        </div>
      </div>
    </div>
  )
}
