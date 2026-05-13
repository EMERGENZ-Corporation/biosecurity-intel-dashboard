import type { Source } from '../types'
import sourcesData from '../data/sources.json'

const sources = sourcesData as Source[]

const ACCESS_COLORS: Record<string, string> = {
  VERIFIED: 'var(--color-accent-green)',
  'ROBOTS BLOCKED — listed as manual reference link only': 'var(--color-accent-yellow)',
  '403 ERROR — listed as manual reference link only': 'var(--color-accent-orange)',
}

function accessLabel(status: string) {
  if (status === 'VERIFIED') return 'VERIFIED'
  if (status.startsWith('ROBOTS BLOCKED')) return 'ROBOTS BLOCKED'
  if (status.startsWith('403')) return '403 ERROR'
  return status
}

export default function Sources() {
  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0 0 0.5rem 0',
          }}
        >
          SOURCES REGISTRY
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 0.5rem 0',
          }}
        >
          This registry is the open-source evidence audit trail for the EMERGENZ Hantavirus Intel
          Dashboard. Every source document used to populate dashboard content is listed here with its
          authority, document type, license, and direct URL. No content on this dashboard is original
          EMERGENZ authorship — all substantive text is reproduced verbatim from the identified
          authoritative sources.
        </p>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {sources.length} sources indexed · Registry last updated:{' '}
          {new Date(
            Math.max(...sources.map((s) => new Date(s.lastVerified).getTime()).filter(Boolean))
          ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* WHO License Notice */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderLeft: '3px solid var(--color-accent-blue)',
          borderRadius: '4px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--color-accent-blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem',
          }}
        >
          WHO License Note
        </div>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          WHO content reproduced on this dashboard is licensed under CC BY-NC-SA 3.0 IGO. EMERGENZ
          Corporation is a 501(c)(3) nonprofit. Reproduction is for non-commercial public health
          information purposes. All WHO content is attributed, linked to the source document, and
          carries the WHO copyright notice. The dashboard codebase is licensed under MIT; WHO-attributed
          content sections carry their original license independently.
        </p>
      </div>

      {/* Sources Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.8125rem',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderBottom: '2px solid var(--color-border)',
              }}
            >
              {[
                'Authority',
                'Document Title',
                'Type',
                'Published',
                'Last Verified',
                'License',
                'Access Status',
                'Content Used',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '0.625rem 0.75rem',
                    textAlign: 'left',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map((s, i) => (
              <tr
                key={s.id}
                style={{
                  backgroundColor:
                    i % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <td
                  style={{
                    padding: '0.625rem 0.75rem',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.authority}
                </td>
                <td style={{ padding: '0.625rem 0.75rem', maxWidth: '280px' }}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--color-accent-blue)',
                      textDecoration: 'none',
                      lineHeight: 1.4,
                      display: 'block',
                    }}
                  >
                    {s.title}
                  </a>
                </td>
                <td
                  style={{
                    padding: '0.625rem 0.75rem',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap',
                    fontSize: '0.75rem',
                  }}
                >
                  {s.documentType}
                </td>
                <td
                  style={{
                    padding: '0.625rem 0.75rem',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.publicationDate}
                </td>
                <td
                  style={{
                    padding: '0.625rem 0.75rem',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.lastVerified}
                </td>
                <td
                  style={{
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.6875rem',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '180px',
                  }}
                >
                  {s.license}
                </td>
                <td style={{ padding: '0.625rem 0.75rem', whiteSpace: 'nowrap' }}>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: ACCESS_COLORS[s.accessStatus] ?? 'var(--color-text-muted)',
                    }}
                  >
                    {accessLabel(s.accessStatus)}
                  </span>
                </td>
                <td
                  style={{
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.6875rem',
                    color: 'var(--color-text-muted)',
                    maxWidth: '160px',
                  }}
                >
                  {s.contentUsed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
        }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          <strong>CDPH HantaToolkit</strong> — robots.txt blocked for automated scraping; listed as
          manual reference link only. &nbsp;
          <strong>WA DOH Hantavirus Guideline</strong> — 403 error at time of verification; listed
          as manual reference link only. If you identify a broken or updated source URL, please open
          an issue on{' '}
          <a
            href="https://github.com/emergenz-corp/hantavirus-intel-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-accent-blue)' }}
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  )
}
