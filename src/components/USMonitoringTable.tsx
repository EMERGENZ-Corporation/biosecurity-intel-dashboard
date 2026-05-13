import type { USMonitoringEntry } from '../types'
import monitoringData from '../data/us-monitoring.json'

const entries = monitoringData as USMonitoringEntry[]

export default function USMonitoringTable() {
  return (
    <div>
      <h2
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 0.75rem 0',
        }}
      >
        U.S. Domestic Monitoring
      </h2>
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
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {['State', 'Monitored', 'Exposure Category', 'Confirmed Cases', 'Source'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.5rem 0.75rem',
                      textAlign: 'left',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.state}
                style={{
                  backgroundColor:
                    i % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--color-accent-blue)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    {entry.state}
                  </a>
                </td>
                <td
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {entry.personsMonitored ?? 'TBD'}
                </td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                  {entry.exposureCategory}
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 700,
                      color:
                        entry.confirmedCases > 0
                          ? 'var(--color-accent-red)'
                          : 'var(--color-accent-green)',
                    }}
                  >
                    {entry.confirmedCases}
                  </span>
                  {entry.confirmedCasesNote && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.6875rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '0.125rem',
                      }}
                    >
                      {entry.confirmedCasesNote}
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.6875rem',
                      color: 'var(--color-accent-blue)',
                      textDecoration: 'none',
                    }}
                  >
                    ↗ DOH
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
