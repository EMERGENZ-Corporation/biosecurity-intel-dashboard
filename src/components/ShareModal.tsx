import { useState } from 'react'
import { getCached } from '../utils/sessionCache'

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

interface EmailDraft {
  subject: string
  body: string
}

const SESSION_DRAFT_COUNT = 'email_draft_count'
const MAX_DRAFTS_PER_SESSION = 10

export default function ShareModal({ onClose, caseStats }: Props) {
  const cachedSummary = getCached<{ bullets: string[] }>('gemini_ems_summary_cache')

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)

  const draftCount = parseInt(sessionStorage.getItem(SESSION_DRAFT_COUNT) || '0', 10)
  const atLimit = draftCount >= MAX_DRAFTS_PER_SESSION

  async function generateDraft() {
    if (atLimit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/email-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseStats,
          emsBullets: cachedSummary?.bullets ?? [],
        }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const draft = (await res.json()) as EmailDraft
      setSubject(draft.subject)
      setBody(draft.body)
      setGenerated(true)
      sessionStorage.setItem(SESSION_DRAFT_COUNT, (draftCount + 1).toString())
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  function openMailto() {
    const encodedSubject = encodeURIComponent(subject)
    const encodedBody = encodeURIComponent(body)
    window.location.href = `mailto:?subject=${encodedSubject}&body=${encodedBody}`
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
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
              AI-drafted situational alert · Editable before sending · Opens your default email client
            </div>
          </div>
          <button
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
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Generate button */}
        {!generated && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {atLimit && (
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.6875rem',
                  color: 'var(--color-accent-yellow)',
                }}
              >
                Session limit reached ({MAX_DRAFTS_PER_SESSION} drafts). Start a new session to
                generate more.
              </div>
            )}
            <button
              onClick={generateDraft}
              disabled={loading || atLimit}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.75rem',
                padding: '0.5rem 1rem',
                backgroundColor: atLimit ? 'var(--color-bg-tertiary)' : 'var(--color-emergenz)',
                border: 'none',
                borderRadius: '4px',
                color: atLimit ? 'var(--color-text-muted)' : '#000',
                cursor: loading || atLimit ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                alignSelf: 'flex-start',
              }}
            >
              {loading ? 'Drafting…' : 'Generate Draft Email'}
            </button>
            {error && (
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.6875rem',
                  color: 'var(--color-accent-red)',
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {/* Edit fields */}
        {generated && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>
            <div>
              <label
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
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{
                  flex: 1,
                  minHeight: '240px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.8125rem',
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
              AI-generated from CDC HAN 528 + ECDC RRA · Edit before sending · Gemini 2.0 Flash
            </div>
          </div>
        )}

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
          {generated && (
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
          )}
        </div>
      </div>
    </div>
  )
}
