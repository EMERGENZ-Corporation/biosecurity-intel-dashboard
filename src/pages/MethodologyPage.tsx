import { Link } from 'react-router-dom'

/**
 * Confidence-methodology / analytic-rubric documentation per
 * UX-GAP-ANALYSIS §3 #23. Documents how severity, confidence, trend,
 * source-diversity, and watch-indicator assignments are made — ICD-203
 * alignment so an external reviewer can audit analytic process.
 */
export default function MethodologyPage() {
  return (
    <div style={{ maxWidth: '900px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 1rem 0',
        }}
      >
        ANALYTIC METHODOLOGY
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.9375rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 1.5rem 0',
        }}
      >
        This page documents how the dashboard assigns severity, confidence, trend, and other
        analytic fields. Surfacing methodology is required for ICD-203 (Analytic Standards)
        alignment and is the practical basis for independent review of the dashboard's
        analytic product.
      </p>

      <MethodologySection
        title="Severity"
        body={
          <>
            <p>Four-level scale aligned to operational posture:</p>
            <ul style={listStyle}>
              <li><strong style={{ color: 'var(--color-accent-green)' }}>MONITOR</strong> — Background surveillance only. No active outbreak; no operational change.</li>
              <li><strong style={{ color: 'var(--color-accent-yellow)' }}>WATCH</strong> — Emerging signal, low-confidence or geographically distant. Preparedness teams notified.</li>
              <li><strong style={{ color: 'var(--color-accent-orange)' }}>CONCERN</strong> — Confirmed outbreak with EMS/HCW operational relevance. Active response planning.</li>
              <li><strong style={{ color: 'var(--color-accent-red)' }}>ACTION</strong> — Documented patient-care or HCW impact, or PHEIC-level escalation. Immediate response posture.</li>
            </ul>
            <p>
              Severity is set manually by a reviewer against the criteria above. Promotion or
              demotion is logged in the signal's <code>lastUpdated</code> field; for risk
              assessments where authorities publish their own levels, prior levels are
              preserved in <code>RiskAssessment.history[]</code>.
            </p>
          </>
        }
      />

      <MethodologySection
        title="Confidence"
        body={
          <>
            <p>Four-level scale describing evidence strength:</p>
            <ul style={listStyle}>
              <li><strong>OFFICIAL</strong> — At least one Tier 1 authority (WHO / CDC / ECDC) has formally reported the signal in a primary document (DON, HAN, surveillance update).</li>
              <li><strong>CORROBORATED</strong> — Two or more Tier 2 sources or one Tier 1 + multiple Tier 2 agree on the core facts.</li>
              <li><strong>EMERGING</strong> — Single Tier 1/2 source, or multiple Tier 3 sources with internal consistency.</li>
              <li><strong>UNVERIFIED</strong> — Only Tier 3/4 sources, ProMED-only, or single-source preprint.</li>
            </ul>
            <p>
              Confidence is partially mechanizable from <Link to="/sources" style={linkStyle}>the source registry</Link> and the source-diversity score (see below).
              Reviewers assign confidence after weighing source counts, tier mix, and authority dissent.
            </p>
          </>
        }
      />

      <MethodologySection
        title="Trend"
        body={
          <>
            <p>Four-level qualitative direction over the previous 14–30 days:</p>
            <ul style={listStyle}>
              <li><strong>↑ INCREASING</strong> — Sustained week-over-week growth in case counts, deaths, geographic spread, or surveillance signal.</li>
              <li><strong>→ STABLE</strong> — Steady state within sampling noise.</li>
              <li><strong>↓ DECREASING</strong> — Sustained decline; outbreak controlled or seasonal recession.</li>
              <li><strong>? UNKNOWN</strong> — Insufficient data to assign direction (typical at signal onset).</li>
            </ul>
            <p>
              Trend is reviewer-assigned, not computed. Signals with structured time-series
              (e.g. CDC FluView, wastewater dashboards) check the trend against the upstream
              source's own week-over-week movement.
            </p>
          </>
        }
      />

      <MethodologySection
        title="Source diversity"
        body={
          <>
            <p>
              Runtime-computed from <code>signal.sourceIds</code>. Counts the number of distinct
              authority bodies issuing the cited sources and the per-tier distribution.
              Assigns one of four labels:
            </p>
            <ul style={listStyle}>
              <li><strong style={{ color: 'var(--color-accent-green)' }}>STRONG</strong> — 3+ distinct Tier 1/2 authorities</li>
              <li><strong style={{ color: 'var(--color-accent-blue)' }}>MODERATE</strong> — 2 Tier 1/2 authorities, or 4+ distinct authorities</li>
              <li><strong style={{ color: 'var(--color-accent-yellow)' }}>WEAK</strong> — 1–2 distinct authorities, only Tier 3/4</li>
              <li><strong style={{ color: 'var(--color-accent-orange)' }}>SINGLE-SOURCE</strong> — Only 1 distinct authority</li>
            </ul>
            <p>
              Diversity does not replace severity or confidence — a SINGLE-SOURCE signal can
              still be at ACTION severity if the single source is sufficiently authoritative
              (e.g. CDC HAN). Conversely, a STRONG-diversity MONITOR signal is more analytically
              robust than a STRONG-diversity ACTION signal where authorities disagree.
            </p>
          </>
        }
      />

      <MethodologySection
        title="Watch indicators"
        body={
          <>
            <p>
              Explicit escalation triggers per ICD-203 §6 (Logical Argumentation). Each
              indicator carries:
            </p>
            <ul style={listStyle}>
              <li><strong>trigger</strong> — Plain-language event description</li>
              <li><strong>threshold</strong> — Operational measurement that distinguishes a true-positive from background noise</li>
              <li><strong>escalateTo</strong> — Target severity level if the threshold is met</li>
              <li><strong>rationale</strong> — Why this indicator matters analytically</li>
            </ul>
            <p>
              Watch indicators make the analytic-watch plan explicit. They are not predictions —
              they are pre-committed if/then statements that constrain motivated reasoning at
              the moment of escalation decision.
            </p>
          </>
        }
      />

      <MethodologySection
        title="Source tiers"
        body={
          <>
            <p>Per <Link to="/about" style={linkStyle}>CONTENT-STANDARDS.md §1</Link>:</p>
            <ul style={listStyle}>
              <li><strong>Tier 1 — Authoritative:</strong> WHO, CDC, ECDC. Pipeline hard-fails on Tier 1 RSS failure during active outbreaks.</li>
              <li><strong>Tier 2 — Institutional:</strong> National/regional agencies (PHAC, UKHSA, RKI, Africa CDC, PAHO, USDA APHIS, WOAH) and peer-reviewed journals.</li>
              <li><strong>Tier 3 — Media:</strong> News outlets. Populates news feed only — never drives structured data.</li>
              <li><strong>Tier 4 — Preprint:</strong> bioRxiv, medRxiv. Must be labeled as not-yet-peer-reviewed.</li>
            </ul>
            <p>
              Tier 1 and Tier 2 sources drive structured data (case counts, risk levels,
              clinical guidance). Tier 3/4 sources are leads only and never update structured
              fields.
            </p>
          </>
        }
      />

      <MethodologySection
        title="Automation boundaries"
        body={
          <>
            <p>
              The dashboard is autonomous where automation is low-risk and directly
              inspectable: public news collection, RSS feed generation, status-contract
              publication, static API generation, validation, production verification, and
              stale-data alerting.
            </p>
            <ul style={listStyle}>
              <li><strong>News feed:</strong> RSS and per-signal Google News queries run every 6 hours. News items are tagged to signals by keyword matching and source weighting.</li>
              <li><strong>Status contract:</strong> <code>/status.json</code> is regenerated daily and when source-backed data changes.</li>
              <li><strong>Public API:</strong> <code>/api/v1/</code> static JSON and RSS endpoints are regenerated after successful data/news updates.</li>
              <li><strong>Monitoring:</strong> production checks verify deployed freshness and raise reusable GitHub issues when thresholds fail.</li>
            </ul>
            <p>
              Structured public-health fields remain intentionally conservative. Case counts,
              clinical guidance, PPE language, risk levels, and generated API contracts must
              pass validators and stay tied to registered Tier 1/2 sources. Automation may
              assist with discovery and extraction, but it cannot become the authority of
              record.
            </p>
          </>
        }
      />

      <MethodologySection
        title="AI and enrichment tools"
        body={
          <>
            <p>
              Gemini is used only for optional server-side news enrichment after the
              deterministic RSS and Google News updater succeeds. When configured, Gemini may
              classify news items into existing signal IDs, identify duplicate or same-event
              items, suggest future query expansions, and generate an internal brief. Missing
              keys, quota errors, invalid JSON, or timeouts fail open to the deterministic
              pipeline.
            </p>
            <p>
              Bright Data is used only as an optional server-side context fallback for the
              Gemini news-enrichment step. It can help retrieve short context snippets for
              difficult-to-read news items, but it is not used as a source of record and should
              not write structured clinical, public-health, legal, or licensing fields without
              independent Tier 1/2 verification.
            </p>
            <p>
              AI-assisted development may support code, tests, and source-backed summaries.
              Public-facing claims must still cite the underlying authority document, and
              clinical guidance remains manually curated under the content standards. Gemini
              may add only high-confidence news tags and internal reviewer context. CI also
              runs an AI/enrichment disclosure audit to detect browser-exposed provider keys
              or expansion beyond the approved news-enrichment boundary.
            </p>
          </>
        }
      />

      <MethodologySection
        title="Estimative language"
        body={
          <>
            <p>
              ICD-203 §3 requires estimative language to communicate analytic confidence
              separately from likelihood. This dashboard uses:
            </p>
            <ul style={listStyle}>
              <li>Severity for operational posture (what to do)</li>
              <li>Confidence for evidence strength (how sure we are about the facts)</li>
              <li>Trend for direction (where it's moving)</li>
              <li>Source diversity for analytic robustness (how many distinct authorities concur)</li>
              <li>Risk-history Δ for analytic evolution (how the assessment changed over time)</li>
            </ul>
            <p>
              When the cited authority publishes its own estimative language (e.g. WHO
              "very low" / "low" / "moderate" / "high"), the authority's label is preserved
              verbatim on the risk badge so the dashboard does not paraphrase or downgrade.
            </p>
          </>
        }
      />

      <MethodologySection
        title="Independent review"
        body={
          <>
            <p>
              Every signal's full data envelope is available at{' '}
              <Link to="/status" style={linkStyle}>/api/v1/signals.json</Link> for independent
              analytic review. Source diversity score, watch indicators, and risk-history Δ
              are all computed from publicly-readable fields — a reviewer can replay any
              analytic assignment against the public data.
            </p>
            <p>
              For questions about a specific signal's analytic basis, follow the source chips
              on the signal detail page to the primary authority documents. The dashboard does
              not paraphrase primary sources beyond explicit attribution.
            </p>
          </>
        }
      />
    </div>
  )
}

const listStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontSize: '0.9375rem',
  color: 'var(--color-text-secondary)',
  lineHeight: 1.65,
  margin: '0 0 0.875rem 0',
  paddingLeft: '1.25rem',
}

const linkStyle: React.CSSProperties = {
  color: 'var(--color-accent-blue)',
  textDecoration: 'none',
}

function MethodologySection({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.25rem',
      }}
    >
      <h2
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.875rem',
          fontWeight: 700,
          color: 'var(--color-emergenz)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 0.75rem 0',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.9375rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.65,
        }}
      >
        {body}
      </div>
    </div>
  )
}
