export default function AboutPage() {
  return (
    <div style={{ maxWidth: '780px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.5rem 0',
        }}
      >
        ABOUT
      </h1>
      <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
        The EMERGENZ Biosecurity Intelligence Dashboard is a static, source-backed situational
        awareness view across multiple biological threat domains — viral hemorrhagic fevers,
        respiratory viruses, zoonotic and vector-borne disease, vaccine-preventable disease,
        environmental and wastewater surveillance, AMR/fungal threats, and One Health signals.
      </p>

      <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: '1.5rem' }}>
        Who this is for
      </h2>
      <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
        Public health analysts, EMS and emergency management leaders, healthcare preparedness
        teams, and nonprofit operational staff who need a fast cross-domain scan of what is
        happening, what changed, what matters, and where to verify it.
      </p>

      <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: '1.5rem' }}>
        What it is not
      </h2>
      <ul style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
        <li>Not a clinical decision system.</li>
        <li>Not a prediction or modeling engine.</li>
        <li>Not a replacement for official public health guidance.</li>
        <li>Not real-time. Data is refreshed on an automated cycle and may lag the source.</li>
      </ul>

      <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: '1.5rem' }}>
        Source provenance
      </h2>
      <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
        Every signal claim cites a source from the registry on the Sources page. Primary sources
        are official health authorities (WHO, CDC, ECDC, Africa CDC, PAHO, PHAC, USDA APHIS,
        WOAH). Secondary sources are expert analyses (CIDRAP, Brown Pandemic Center) and
        unofficial early signals (ProMED), which we treat as leads rather than authoritative
        claims.
      </p>

      <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: '1.5rem' }}>
        How resilience is built in
      </h2>
      <ul style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
        <li>Public <code>/status.json</code> contract surfaced on the Status page.</li>
        <li>Schema validator (<code>npm run validate:data</code>) enforces signal, timeline, and
          source integrity in CI before any data lands on the dashboard.</li>
        <li>Parser regression tests guard against silent source-extractor breakage.</li>
        <li>Production freshness verifier, stale-data alerts, and an independent hourly status
          monitor reconcile a single GitHub issue rather than spamming alerts.</li>
      </ul>

      <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: '1.5rem' }}>
        Disclaimer
      </h2>
      <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
        This dashboard aggregates publicly available information from authoritative sources for
        informational purposes only. It does not constitute medical advice or official public
        health guidance. EMS providers and clinicians must follow their agency protocols and
        medical director directives. Verify time-sensitive data directly with the originating
        authority before making operational decisions.
      </p>

      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
        EMERGENZ Corporation · 501(c)(3) Nonprofit · <a href="https://www.emergenz.us" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-emergenz)', textDecoration: 'none' }}>www.emergenz.us ↗</a>
      </p>
    </div>
  )
}
