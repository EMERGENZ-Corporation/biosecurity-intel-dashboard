import type { ReactNode } from 'react'

function SectionHeader({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </h2>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '1.5rem',
        marginBottom: '1.25rem',
      }}
    >
      {children}
    </div>
  )
}

function Body({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '0.9375rem',
        color: 'var(--color-text-secondary)',
        lineHeight: 1.7,
        margin: '0 0 0.75rem 0',
      }}
    >
      {children}
    </p>
  )
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'var(--color-accent-blue)', textDecoration: 'none' }}
    >
      {children}
    </a>
  )
}

const MIT_LICENSE = `MIT License

Copyright (c) 2026 EMERGENZ Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '860px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 1.5rem 0',
        }}
      >
        ABOUT & LEGAL
      </h1>

      {/* About This Dashboard */}
      <Card>
        <SectionHeader>About This Dashboard</SectionHeader>
        <Body>
          The EMERGENZ Biosecurity Intelligence Dashboard is an open-source, publicly accessible
          web application that aggregates, displays, and contextualizes publicly available
          information across multiple biological threat domains — viral hemorrhagic fevers,
          respiratory viruses, zoonotic and One Health signals, vector-borne disease, vaccine-
          preventable disease, enteric and waterborne pathogens, environmental and wastewater
          surveillance, AMR and fungal threats, and event-based and travel-linked signals. It
          is built for EMS providers, emergency managers, public health analysts, and healthcare
          preparedness teams who need a fast cross-domain scan of what is happening, what
          changed, what matters, and where to verify it.
        </Body>
        <Body>
          This dashboard does <strong>not</strong> author any original clinical or guidance
          content. All substantive content is reproduced verbatim from authoritative public
          health sources — the World Health Organization, U.S. Centers for Disease Control and
          Prevention, European Centre for Disease Prevention and Control, Africa CDC, PAHO,
          Public Health Agency of Canada, UK Health Security Agency, USDA APHIS, WOAH, and
          relevant national and state and local health departments — with explicit citation,
          direct reference links, and license attribution. All data and content standards are
          governed by the project's{' '}
          <ExternalLink href="https://github.com/EMERGENZ-Corporation/biosecurity-intel-dashboard/blob/main/CONTENT-STANDARDS.md">
            CONTENT-STANDARDS.md
          </ExternalLink>
          , which defines a four-tier source hierarchy, attribution requirements, data integrity
          rules, and a non-fabrication policy enforced in the automated pipeline.
        </Body>
        <Body>
          The full codebase is open-source under the MIT license. Contributions are welcome via{' '}
          <ExternalLink href="https://github.com/EMERGENZ-Corporation/biosecurity-intel-dashboard">
            github.com/EMERGENZ-Corporation/biosecurity-intel-dashboard
          </ExternalLink>
          .
        </Body>
      </Card>

      {/* About EMERGENZ */}
      <Card>
        <SectionHeader>About EMERGENZ Corporation</SectionHeader>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            gap: '0.5rem 1.5rem',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
            margin: 0,
          }}
        >
          {[
            ['Organization', 'EMERGENZ Corporation'],
            ['EIN', '93-4070519'],
            ['Status', '501(c)(3) Nonprofit'],
            ['Mission', 'EMS and mobile health innovation'],
            ['Incorporation', 'Delaware (foreign-registered in California)'],
            ['Website', 'www.emergenz.us'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'contents' }}>
              <dt
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  alignSelf: 'start',
                  paddingTop: '0.125rem',
                }}
              >
                {label}
              </dt>
              <dd style={{ color: 'var(--color-text-primary)', margin: 0 }}>
                {label === 'Website' ? (
                  <ExternalLink href="https://www.emergenz.us">{value}</ExternalLink>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Who this is for */}
      <Card>
        <SectionHeader>Who this is for</SectionHeader>
        <Body>
          Public health analysts, EMS and emergency management leaders, healthcare preparedness
          teams, hospital infection prevention staff, government and military medical units, and
          nonprofit operational staff who need a fast cross-domain scan of what is happening,
          what changed, what matters, and where to verify it.
        </Body>
      </Card>

      {/* What it is not */}
      <Card>
        <SectionHeader>What it is not</SectionHeader>
        <ul
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            margin: 0,
            paddingLeft: '1.25rem',
          }}
        >
          <li>Not a clinical decision system.</li>
          <li>Not a prediction, modeling, or forecasting engine.</li>
          <li>Not a replacement for official public health guidance.</li>
          <li>Not real-time. Data is refreshed on an automated cycle and may lag the source.</li>
          <li>Not a substitute for verifying time-sensitive information with the originating authority.</li>
        </ul>
      </Card>

      {/* Source provenance & tier system */}
      <Card>
        <SectionHeader>Source provenance &amp; tier system</SectionHeader>
        <Body>
          Every signal claim cites a source from the registry on the Sources page. Sources are
          assigned to one of four tiers per CONTENT-STANDARDS.md §1:
        </Body>
        <ul
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            margin: '0 0 0.75rem 0',
            paddingLeft: '1.25rem',
          }}
        >
          <li>
            <strong>Tier 1 — Authoritative:</strong> WHO, CDC, ECDC. Pipeline alerts on failure
            during active outbreaks.
          </li>
          <li>
            <strong>Tier 2 — Institutional:</strong> National and regional agencies (PHAC, UKHSA,
            RKI, RIVM, Africa CDC, PAHO, USDA APHIS, WOAH) and peer-reviewed journals (NEJM,
            Lancet, Nature Medicine, Science). Treated as primary sources.
          </li>
          <li>
            <strong>Tier 3 — Media:</strong> News outlets and science journalism (AP, BBC,
            STAT News, NPR, Reuters, Science News). Populates the News Feed only; never drives
            structured data fields.
          </li>
          <li>
            <strong>Tier 4 — Preprint / unreviewed:</strong> bioRxiv, medRxiv. Must be labeled
            as not yet peer-reviewed.
          </li>
        </ul>
        <Body>
          Tier 1 and 2 sources drive structured data (case counts, risk levels, clinical
          guidance). Tier 3 and 4 sources populate news feeds and are clearly disclaimed as
          such. Where automated extraction cannot determine a value with confidence, the
          pipeline writes <code>null</code> and the dashboard displays <code>—</code> or
          <code> TBD</code> rather than guessing.
        </Body>
      </Card>

      {/* Data currency */}
      <Card>
        <SectionHeader>Data currency &amp; update cadence</SectionHeader>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            gap: '0.5rem 1.5rem',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          {[
            ['Signal data', 'Manually verified against primary sources; updated as authority publications change'],
            ['News feed', 'Automated every 6 hours from 17+ RSS feeds + per-signal Google News queries'],
            ['Status contract', 'Regenerated daily and on every signal-data commit'],
            ['Source registry', 'Reviewed continuously; each entry carries a lastVerified date'],
            ['Staleness alert', 'Surfaced on Status page when a signal exceeds policy thresholds'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'contents' }}>
              <dt
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  alignSelf: 'start',
                  paddingTop: '0.125rem',
                }}
              >
                {label}
              </dt>
              <dd style={{ color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.6 }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Resilience */}
      <Card>
        <SectionHeader>How resilience is built in</SectionHeader>
        <ul
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            margin: 0,
            paddingLeft: '1.25rem',
          }}
        >
          <li>
            Public <code>/status.json</code> contract surfaced on the Status page so consumers
            can detect a stale or degraded dashboard programmatically.
          </li>
          <li>
            Schema validator (<code>npm run validate:data</code>) enforces signal, timeline,
            and source integrity in CI before any data lands on the dashboard.
          </li>
          <li>
            Parser regression tests guard against silent source-extractor breakage.
          </li>
          <li>
            Production freshness verifier, stale-data alerts, and an independent status monitor
            reconcile a single GitHub issue rather than spamming alerts.
          </li>
          <li>
            Tier 1 RSS feed failures during active outbreaks raise a hard pipeline alert per
            CONTENT-STANDARDS.md §6.1. Tier 2+ feed failures are logged but never block a run.
          </li>
          <li>
            All automated pipeline commits are authored by <code>EMERGENZ Data Bot</code>; all
            AI-assisted manual commits carry <code>Co-Authored-By: Claude</code> attribution.
          </li>
        </ul>
      </Card>

      {/* Legal Disclaimer */}
      <Card>
        <SectionHeader>Legal Disclaimer</SectionHeader>
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.75,
            padding: '1rem',
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
          }}
        >
          <p style={{ margin: 0 }}>
            The EMERGENZ Biosecurity Intelligence Dashboard is provided for informational and
            situational awareness purposes only. Content is aggregated from publicly available
            sources including the World Health Organization, U.S. Centers for Disease Control
            and Prevention, European Centre for Disease Prevention and Control, Africa CDC,
            PAHO, national health agencies, and other public health authorities. EMERGENZ
            Corporation makes no representations or warranties of any kind, express or implied,
            regarding the accuracy, completeness, timeliness, currency, or fitness for any
            particular purpose of the information presented. This dashboard does not constitute
            medical advice, clinical guidance, treatment recommendations, or official public
            health direction. It is not a substitute for professional medical judgment, agency
            protocols, or the directives of a licensed medical director. EMS providers,
            emergency managers, clinicians, and public safety personnel must follow their
            agency's established protocols and the directives of their medical director or
            supervising physician. To the maximum extent permitted by applicable law, EMERGENZ
            Corporation, its officers, directors, employees, contractors, and affiliates shall
            not be liable for any direct, indirect, incidental, consequential, clinical,
            operational, or legal outcome arising from use of or reliance on this dashboard or
            the information it contains. All source content remains the property of the
            originating authority and is reproduced under applicable license terms as documented
            in the Sources Registry.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Data currency:</strong> Information presented may not reflect the most
            current available data. Signal data is manually verified against primary sources;
            the news feed is updated on a 6-hour automated cycle; the public status contract is
            regenerated daily. Users must verify time-sensitive information directly with the
            originating authority before making operational decisions.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Third-party content:</strong> News feed content is sourced from third-party
            media outlets and is provided for informational purposes only. EMERGENZ Corporation
            does not endorse, verify, or take responsibility for third-party content. Official
            guidance content is sourced from and attributed to the named public health authority
            in each case.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Assumption of risk:</strong> By accessing this dashboard, users acknowledge
            that emergency medical and public health decisions involve inherent risk and
            uncertainty, and that no information system can substitute for trained professional
            judgment in a clinical or operational setting.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Governing law:</strong> EMERGENZ Corporation is a nonprofit corporation
            incorporated under the laws of the State of Delaware and registered as a foreign
            entity in the State of California. This dashboard is operated from the United
            States. Any disputes arising from use of this dashboard shall be governed by the
            laws of the State of Delaware, without regard to its conflict of law provisions.
          </p>
        </div>
      </Card>

      {/* Privacy */}
      <Card>
        <SectionHeader>Privacy</SectionHeader>
        <Body>
          EMERGENZ Corporation does not collect, store, or process any personally identifiable
          information through this dashboard. No cookies, tracking pixels, or analytics tools
          are employed. No user accounts or registration are required. This dashboard is a
          read-only public information tool. The only browser storage used is{' '}
          <code>sessionStorage</code> to retain your acknowledgment of the disclaimer for the
          duration of your browser session — this data never leaves your device.
        </Body>
      </Card>

      {/* MIT License */}
      <Card>
        <SectionHeader>MIT License</SectionHeader>
        <pre
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.65,
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            padding: '1rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}
        >
          {MIT_LICENSE}
        </pre>
      </Card>

      {/* WHO Attribution */}
      <Card>
        <SectionHeader>WHO Content Attribution Notice</SectionHeader>
        <Body>
          Portions of this dashboard reproduce content from World Health Organization
          publications. © World Health Organization 2026. Some rights reserved. Licensed under{' '}
          <ExternalLink href="https://creativecommons.org/licenses/by-nc-sa/3.0/igo/">
            CC BY-NC-SA 3.0 IGO
          </ExternalLink>
          .
        </Body>
      </Card>

      {/* CDC Attribution */}
      <Card>
        <SectionHeader>U.S. Government Content Notice</SectionHeader>
        <Body>
          Portions of this dashboard reproduce content from U.S. Centers for Disease Control
          and Prevention, U.S. Department of Agriculture APHIS, and other U.S. federal agency
          publications. U.S. Government works are not subject to copyright protection within
          the United States (17 U.S.C. §105). Attribution is provided to indicate origin and
          to allow verification against the issuing agency.
        </Body>
      </Card>

      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          margin: '2rem 0 0 0',
          textAlign: 'center',
        }}
      >
        EMERGENZ Corporation · 501(c)(3) Nonprofit ·{' '}
        <ExternalLink href="https://www.emergenz.us">www.emergenz.us ↗</ExternalLink>
      </p>
    </div>
  )
}
