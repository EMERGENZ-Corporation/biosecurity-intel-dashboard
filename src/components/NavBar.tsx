import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useMediaQuery } from '../hooks/useMediaQuery'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  function closeMenu() {
    setMenuOpen(false)
  }

  const linkStyle = (isActive: boolean) => ({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.8125rem',
    fontWeight: 500 as const,
    padding: '0.25rem 0.625rem',
    borderRadius: '4px',
    textDecoration: 'none' as const,
    color: isActive ? 'var(--color-emergenz)' : 'var(--color-text-secondary)',
    backgroundColor: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
    transition: 'color 0.15s, background-color 0.15s',
    display: 'block' as const,
  })

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative',
        zIndex: 200,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
        }}
      >
        {/* Brand */}
        <NavLink
          to="/"
          style={{ textDecoration: 'none' }}
          aria-label="EMERGENZ Hantavirus Intel Dashboard — home"
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600,
              fontSize: isMobile ? '0.875rem' : '1rem',
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
              {isMobile ? 'HANTA INTEL' : 'HANTAVIRUS INTEL'}
            </span>
          </span>
        </NavLink>

        {/* Desktop links */}
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => linkStyle(isActive)}
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '0.375rem 0.625rem',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '1rem',
              lineHeight: 1,
            }}
          >
            {menuOpen ? '✕' : '≡'}
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div
          id="mobile-nav-menu"
          role="menu"
          style={{
            position: 'absolute',
            top: '56px',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-bg-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.125rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              role="menuitem"
              onClick={closeMenu}
              style={({ isActive }) => ({
                ...linkStyle(isActive),
                padding: '0.75rem 0.875rem',
                fontSize: '0.9375rem',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
