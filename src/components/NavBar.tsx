import { NavLink } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/clinical', label: 'Clinical' },
  { to: '/ppe', label: 'PPE' },
  { to: '/genomics', label: 'Genomics' },
  { to: '/protocols', label: 'Protocols' },
  { to: '/news', label: 'News' },
  { to: '/sources', label: 'Sources' },
  { to: '/about', label: 'About' },
]

export default function NavBar() {
  return (
    <nav
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          height: '56px',
        }}
      >
        {/* Brand */}
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 600,
            fontSize: '1rem',
            color: 'var(--color-emergenz)',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          EMERGENZ
          <span
            style={{
              color: 'var(--color-text-secondary)',
              fontWeight: 400,
              marginLeft: '0.5rem',
            }}
          >
            HANTAVIRUS INTEL
          </span>
        </span>

        {/* Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            flexWrap: 'wrap',
          }}
        >
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.8125rem',
                fontWeight: 500,
                padding: '0.25rem 0.625rem',
                borderRadius: '4px',
                textDecoration: 'none',
                color: isActive ? 'var(--color-emergenz)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
                transition: 'color 0.15s, background-color 0.15s',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
