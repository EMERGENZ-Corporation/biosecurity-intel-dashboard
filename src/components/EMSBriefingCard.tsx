import { useState, useEffect } from 'react'
import { getCached, setCache } from '../utils/sessionCache'

const CACHE_KEY = 'gemini_ems_summary_cache'
const CACHE_TS_KEY = 'gemini_ems_summary_ts'
const TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

interface Summary {
  bullets: string[]
  generatedAt: string
  sources: string[]
}

export default function EMSBriefingCard() {
  const [summary, setSummary] = useState<Summary | null>(getCached<Summary>(CACHE_KEY))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRefresh = (): boolean => {
    const ts = sessionStorage.getItem(CACHE_TS_KEY)
    if (!ts) return true
    return Date.now() - parseInt(ts, 10) > TTL_MS
  }

  async function generate(force = false) {
    if (!force && !canRefresh()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ems-summary', { method: 'POST' })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = (await res.json()) as Summary
      setSummary(data)
      setCache(CACHE_KEY, data, TTL_MS)
      sessionStorage.setItem(CACHE_TS_KEY, Date.now().toString())
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate on first mount if no cache
  useEffect(() => {
    if (!summary) {
      generate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hoursUntilRefresh = (): string => {
    const ts = sessionStorage.getItem(CACHE_TS_KEY)
    if (!ts) return ''
    const remaining = TTL_MS - (Date.now() - parseInt(ts, 10))
    if (remaining <= 0) return ''
    const h = Math.floor(remaining / 3600000)
    const m = Math.floor((remaining % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderLeft: '3px solid var(--color-emergenz)',
        borderRadius: '4px',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--color-emergenz)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.125rem',
            }}
          >
            EMS Operational Briefing
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.6875rem',
              color: 'var(--color-text-muted)',
            }}
          >
            AI-Generated Summary — Source: CDC HAN 528 + ECDC Rapid Risk Assessment
          </div>
        </div>
        <button
          onClick={() => generate(true)}
          disabled={loading || !canRefresh()}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.625rem',
            padding: '0.25rem 0.625rem',
            backgroundColor: 'var(--color-bg-tertiary)',
            border: `1px solid ${canRefresh() ? 'var(--color-emergenz)' : 'var(--color-border)'}`,
            borderRadius: '3px',
            color: canRefresh() ? 'var(--color-emergenz)' : 'var(--color-text-muted)',
            cursor: loading || !canRefresh() ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Generating…' : canRefresh() ? 'Regenerate ↻' : `Refresh in ${hoursUntilRefresh()}`}
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          Generating briefing from CDC HAN 528 and ECDC Rapid Risk Assessment…
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--color-accent-red)',
          }}
        >
          Generation failed — {error}
        </div>
      )}

      {summary && !loading && (
        <>
          <ul style={{ margin: '0 0 0.75rem 0', padding: '0 0 0 1rem' }}>
            {summary.bullets.map((bullet, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '0.375rem',
                }}
              >
                {bullet}
              </li>
            ))}
          </ul>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.5625rem',
                color: 'var(--color-text-muted)',
              }}
            >
              Generated {new Date(summary.generatedAt).toLocaleString()} ·{' '}
              {summary.sources?.join(' + ')}
            </span>
            <a
              href="https://www.cdc.gov/han/php/notices/han00528.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.5625rem',
                color: 'var(--color-accent-blue)',
                textDecoration: 'none',
              }}
            >
              View Source Documents ↗
            </a>
          </div>
        </>
      )}

      {!summary && !loading && !error && (
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Click Regenerate to generate an AI briefing from CDC HAN 528 + ECDC guidance.
        </div>
      )}
    </div>
  )
}
