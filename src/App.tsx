import { Suspense, lazy, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import NavBar from './components/NavBar'
import DisclaimerBanner from './components/DisclaimerBanner'
import AcknowledgmentModal, { hasAcknowledged } from './components/AcknowledgmentModal'
import { ErrorBoundary } from './components/ErrorBoundary'

// Lazy-load route modules so large data and map libraries stay out of the app shell.
const Overview = lazy(() => import('./pages/Overview'))
const Signals = lazy(() => import('./pages/Signals'))
const News = lazy(() => import('./pages/News'))
const SignalDetail = lazy(() => import('./pages/SignalDetail'))
const MapPage = lazy(() => import('./pages/MapPage'))
const TimelinePage = lazy(() => import('./pages/TimelinePage'))
const Briefings = lazy(() => import('./pages/Briefings'))
const Resources = lazy(() => import('./pages/Resources'))
const SourcesPage = lazy(() => import('./pages/SourcesPage'))
const Status = lazy(() => import('./pages/Status'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'))

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

function NotFound() {
  return (
    <div
      style={{
        paddingTop: '3rem',
        fontFamily: "'IBM Plex Mono', monospace",
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.75rem',
        }}
      >
        404
      </div>
      <div
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '1rem',
        }}
      >
        Page not found
      </div>
      <Link
        to="/"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          color: 'var(--color-accent-blue)',
          textDecoration: 'none',
        }}
      >
        ← Return to overview
      </Link>
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
        <ErrorBoundary label="Page">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/signals" element={<Signals />} />
              <Route path="/signals/:id" element={<SignalDetail />} />
              <Route path="/news" element={<News />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/briefings" element={<Briefings />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/status" element={<Status />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/methodology" element={<MethodologyPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
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
