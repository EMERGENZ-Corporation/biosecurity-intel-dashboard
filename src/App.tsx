import { Suspense, lazy, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import DisclaimerBanner from './components/DisclaimerBanner'
import Dashboard from './pages/Dashboard'
import AcknowledgmentModal, { hasAcknowledged } from './components/AcknowledgmentModal'

// Lazy-load all secondary pages so they don't bloat the initial bundle.
// The Dashboard is kept as a static import because it's the landing page.
const Clinical = lazy(() => import('./pages/Clinical'))
const PPE = lazy(() => import('./pages/PPE'))
const Genomics = lazy(() => import('./pages/Genomics'))
const Protocols = lazy(() => import('./pages/Protocols'))
const News = lazy(() => import('./pages/News'))
const Sources = lazy(() => import('./pages/Sources'))
const About = lazy(() => import('./pages/About'))

function PageLoader() {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.75rem',
        color: 'var(--color-text-muted)',
        padding: '2rem 0',
      }}
    >
      Loading…
    </div>
  )
}

export default function App() {
  const [acknowledged, setAcknowledged] = useState<boolean>(hasAcknowledged)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!acknowledged && <AcknowledgmentModal onAcknowledge={() => setAcknowledged(true)} />}

      {/* Skip-to-content link — visually hidden until focused (WCAG 2.4.1) */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          zIndex: 10000,
        }}
        onFocus={(e) => {
          const el = e.currentTarget
          el.style.left = '1rem'
          el.style.top = '1rem'
          el.style.width = 'auto'
          el.style.height = 'auto'
          el.style.overflow = 'visible'
          el.style.backgroundColor = 'var(--color-emergenz)'
          el.style.color = '#000'
          el.style.padding = '0.5rem 1rem'
          el.style.borderRadius = '4px'
          el.style.fontFamily = "'IBM Plex Mono', monospace"
          el.style.fontSize = '0.875rem'
          el.style.fontWeight = '700'
        }}
        onBlur={(e) => {
          const el = e.currentTarget
          el.style.left = '-9999px'
          el.style.top = 'auto'
          el.style.width = '1px'
          el.style.height = '1px'
          el.style.overflow = 'hidden'
          el.style.backgroundColor = ''
          el.style.color = ''
          el.style.padding = ''
          el.style.borderRadius = ''
        }}
      >
        Skip to main content
      </a>

      <NavBar />
      <DisclaimerBanner />
      <main id="main-content" style={{ flex: 1, padding: '1.5rem 1rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clinical" element={<Clinical />} />
            <Route path="/ppe" element={<PPE />} />
            <Route path="/genomics" element={<Genomics />} />
            <Route path="/protocols" element={<Protocols />} />
            <Route path="/news" element={<News />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Suspense>
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)',
          padding: '0.875rem 1rem',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.04em',
            }}
          >
            © {new Date().getFullYear()} EMERGENZ Corporation · 501(c)(3) Nonprofit · All rights reserved
          </span>
          <a
            href="https://www.emergenz.us"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.625rem',
              color: 'var(--color-emergenz)',
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            www.emergenz.us ↗
          </a>
        </div>
      </footer>
    </div>
  )
}
