import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import DisclaimerBanner from './components/DisclaimerBanner'
import Dashboard from './pages/Dashboard'

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
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <DisclaimerBanner />
      <main style={{ flex: 1, padding: '1.5rem 1rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
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
    </div>
  )
}
