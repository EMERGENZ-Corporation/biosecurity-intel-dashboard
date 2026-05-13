import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import DisclaimerBanner from './components/DisclaimerBanner'
import Dashboard from './pages/Dashboard'
import Clinical from './pages/Clinical'
import PPE from './pages/PPE'
import Genomics from './pages/Genomics'
import Protocols from './pages/Protocols'
import News from './pages/News'
import Sources from './pages/Sources'
import About from './pages/About'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <DisclaimerBanner />
      <main style={{ flex: 1, padding: '1.5rem 1rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
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
      </main>
    </div>
  )
}
