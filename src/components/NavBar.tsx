import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useMediaQuery } from '../hooks/useMediaQuery'

const NAV_LINKS = [
  { to: '/', label: 'Overview' },
  { to: '/signals', label: 'Signals' },
  { to: '/news', label: 'News' },
  { to: '/map', label: 'Map' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/briefings', label: 'Briefings' },
  { to: '/resources', label: 'Resources' },
  { to: '/sources', label: 'Sources' },
  { to: '/status', label: 'Status' },
  { to: '/about', label: 'About' },
]

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const isMobile = useMediaQuery('(max-width: 768px)')
  const navigate = useNavigate()

  function closeMenu() {
    setMenuOpen(false)
  }

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
      setSearchQuery('')
      closeMenu()
    }
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
          aria-label="EMERGENZ Biosecurity Intel Dashboard — home"
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

            {/* Star of Life — path lifted verbatim from Star_of_life.svg brand asset,
                recoloured to #2E86DE; Rod of Asclepius paths kept white */}
            <svg
              width={isMobile ? 16 : 20}
              height={isMobile ? 16 : 20}
              viewBox="0 0 198 192"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              {/* Star shape */}
              <path
                d="M 75.09375,10 L 75.09375,56.53125 L 34.78125,33.25 L 12.28125,72.21875 L 52.59375,95.5 L 12.28125,118.75 L 34.78125,157.71875 L 75.09375,134.4375 L 75.09375,181 L 120.09375,181 L 120.09375,134.46875 L 160.375,157.71875 L 182.875,118.75 L 142.5625,95.5 L 182.875,72.21875 L 160.375,33.25 L 120.09375,56.5 L 120.09375,10 Z"
                fill="#2E86DE"
              />
              {/* Rod of Asclepius — staff */}
              <path
                d="M 92.517151,28.749341 C 92.408986,25.487473 95.364102,22.444786 98.522226,22.444786 C 100.78169,22.444786 103.56391,24.163507 103.49852,27.028713 C 102.70837,61.652668 100.60467,131.89502 99.809866,166.84929 C 99.785836,167.9063 98.454636,167.43783 98.406332,166.35356 C 96.861909,131.68636 93.680464,63.830863 92.517151,28.749341 z"
                fill="white"
              />
              {/* Serpent — upper coil */}
              <path
                d="M 94.036939,33.435356 C 96.542562,33.435356 97.667652,34.958914 99.217717,36.299367 C 100.71504,37.594206 101.88918,38.77889 101.88918,40.05277 C 101.88918,41.391534 100.90645,40.990382 99.865157,41.482074 C 99.316637,41.74108 99.365585,42.300792 98.469657,42.300792 C 96.316099,42.300792 95.45867,40.274406 92.51715,40.274406 C 90.093039,40.274406 86.944591,43.179145 86.944591,48.506596 C 86.944591,56.552685 90.047493,60.158311 93.720316,62.944591 L 94.100263,72.506596 C 90.174142,70.860159 80.042216,61.931473 80.042216,49.519789 C 80.042216,38.718116 87.055227,33.435356 94.036939,33.435356 z"
                fill="white"
              />
              {/* Serpent — middle coil */}
              <path
                d="M 102.52243,66.934037 L 102.26913,76.05277 C 102.26913,81.62722 87.514512,91.407424 87.514512,101.38259 C 87.514512,109.06464 93.688655,113.98417 95.968338,115.12401 L 95.683377,107.08179 C 95.683377,107.08179 92.897098,105.20276 92.897098,102.01583 C 92.897098,97.506158 109.86807,85.891676 109.86807,77.002639 C 109.86807,70.699933 105.56201,68.348285 102.52243,66.934037 z"
                fill="white"
              />
              {/* Serpent — lower coil */}
              <path
                d="M 101.35093,111.54617 C 101.35093,111.54617 107.14512,115.37689 107.14512,120.18997 C 107.14512,124.30746 103.98764,128.07412 100.25762,131.96931 C 95.900204,136.51968 94.980033,142.21601 97.551452,148.17942 L 97.773087,153.0554 C 95.905013,151.53561 92.960422,146.78869 92.960422,138.87071 C 92.960422,129.33988 101.12929,126.47258 101.12929,117.68866 L 101.35093,111.54617 z"
                fill="white"
              />
              {/* Serpent — tail */}
              <path
                d="M 100.21108,151.25066 C 100.21108,151.25066 102.90238,152.69861 102.90238,156.47493 C 102.90238,160.02958 98.451601,163.27556 97.773087,163.75726 C 97.11579,164.2239 96.863869,163.61619 97.39314,163.12401 C 97.939619,162.61583 100.17942,159.61423 100.17942,156.15831 L 100.21108,151.25066 z"
                fill="white"
              />
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
                BIOSECURITY<br />INTEL DASHBOARD
              </span>
            )}
          </div>
        </NavLink>

        {/* Desktop links + search */}
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
            <form onSubmit={onSearchSubmit} role="search" style={{ marginLeft: '0.5rem' }}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Global search"
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.8125rem',
                  padding: '0.3rem 0.625rem',
                  width: '8rem',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  color: 'var(--color-text-primary)',
                }}
              />
            </form>
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
