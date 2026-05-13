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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            {/* Wordmark — Singapore Sling font */}
            <span
              style={{
                fontFamily: "'Singapore Sling', sans-serif",
                fontSize: isMobile ? '1.375rem' : '1.625rem',
                lineHeight: 1,
                letterSpacing: '0.02em',
              }}
            >
              <span style={{ color: '#E52222' }}>EMERGEN</span>
              <span style={{ color: '#2E86DE' }}>Z</span>
            </span>

            {/* Star of Life — outlined, matches logo treatment */}
            <svg
              width={isMobile ? 16 : 20}
              height={isMobile ? 16 : 20}
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              {/* Six-arm star shape */}
              <path
                d="M42 5h16v26l22.6-13 8 13.9L66 45h22v16H66l22.6 13.1-8 13.9L58 75v26H42V75L19.4 88.1l-8-13.9L34 61H12V45h22L11.4 31.9l8-13.9L42 31V5z"
                stroke="#2E86DE"
                strokeWidth="3"
                fill="none"
              />
              {/* Rod of Asclepius — staff */}
              <line x1="50" y1="20" x2="50" y2="80" stroke="#2E86DE" strokeWidth="3.5" strokeLinecap="round" />
              {/* Serpent — simplified S-curve around staff */}
              <path
                d="M50 30 C62 30, 62 42, 50 42 C38 42, 38 54, 50 54 C62 54, 62 66, 50 66"
                stroke="#2E86DE"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              {/* Serpent head */}
              <circle cx="50" cy="26" r="3.5" fill="#2E86DE" />
            </svg>

            {/* Subtitle — IBM Plex Mono */}
            {!isMobile && (
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.6875rem',
                  fontWeight: 400,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.08em',
                  paddingLeft: '0.25rem',
                  borderLeft: '1px solid var(--color-border)',
                  marginLeft: '0.125rem',
                  lineHeight: 1.2,
                }}
              >
                HANTAVIRUS<br />INTEL DASHBOARD
              </span>
            )}
          </div>
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
