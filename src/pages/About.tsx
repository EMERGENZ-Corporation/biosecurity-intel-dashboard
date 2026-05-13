export default function About() {
  const sectionHeader = (text: string) => (
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
      {text}
    </h2>
  )

  const card = (children: React.ReactNode) => (
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

  const body = (text: string | React.ReactNode) => (
    <p
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '0.9375rem',
        color: 'var(--color-text-secondary)',
        lineHeight: 1.7,
        margin: '0 0 0.75rem 0',
      }}
    >
      {text}
    </p>
  )

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
      {card(
        <>
          {sectionHeader('About This Dashboard')}
          {body(
            'The EMERGENZ Hantavirus Intelligence Dashboard is an open-source, publicly accessible web application that aggregates, displays, and contextualizes publicly available information about the 2026 MV Hondius Andes virus outbreak for EMS providers, emergency managers, and public health professionals.'
          )}
          {body(
            'This dashboard does NOT author any original clinical or guidance content. All substantive content is reproduced verbatim from authoritative public health sources — the World Health Organization, U.S. Centers for Disease Control and Prevention, European Centre for Disease Prevention and Control, and relevant state and local health departments — with explicit citation, direct reference links, and license attribution.'
          )}
          {body(
            <>
              The full codebase is open-source under the MIT license. Contributions are welcome via{' '}
              <a
                href="https://github.com/emergenz-corp/hantavirus-intel-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-accent-blue)' }}
              >
                github.com/emergenz-corp/hantavirus-intel-dashboard
              </a>
              . See CONTRIBUTING.md in the repository for contribution guidelines.
            </>
          )}
        </>
      )}

      {/* About EMERGENZ */}
      {card(
        <>
          {sectionHeader('About EMERGENZ Corporation')}
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'max-content 1fr',
              gap: '0.375rem 1.5rem',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.875rem',
              margin: 0,
            }}
          >
            {[
              ['Organization', 'EMERGENZ Corporation'],
              ['EIN', '93-4070519'],
              ['Status', '501(c)(3) Nonprofit'],
              ['Mission', 'EMS and mobile health innovation'],
            ].map(([label, value]) => (
              <>
                <dt
                  key={label + '-dt'}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    alignSelf: 'start',
                    paddingTop: '0.125rem',
                  }}
                >
                  {label}
                </dt>
                <dd
                  key={label + '-dd'}
                  style={{ color: 'var(--color-text-primary)', margin: 0 }}
                >
                  {value}
                </dd>
              </>
            ))}
          </dl>
        </>
      )}

      {/* Legal Disclaimer */}
      {card(
        <>
          {sectionHeader('Legal Disclaimer')}
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.75,
              margin: 0,
              padding: '1rem',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
            }}
          >
            The EMERGENZ Hantavirus Outbreak Intelligence Dashboard is provided for informational
            purposes only. Content is aggregated from publicly available sources including the World
            Health Organization, U.S. Centers for Disease Control and Prevention, European Centre
            for Disease Prevention and Control, and other public health authorities. EMERGENZ
            Corporation makes no representations or warranties regarding the accuracy, completeness,
            timeliness, or fitness for any particular purpose of the information presented. This
            dashboard does not constitute medical advice, clinical guidance, or official public
            health direction. EMS providers, emergency managers, and public safety personnel must
            follow their agency's established protocols and the directives of their medical director.
            EMERGENZ Corporation, its officers, employees, volunteers, and affiliates shall not be
            liable for any clinical, operational, or legal outcome arising from use of or reliance
            on this dashboard. All source content remains the property of the originating authority
            and is reproduced under applicable license terms as documented in the Sources Registry.
          </p>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6875rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.75rem',
              marginBottom: 0,
            }}
          >
            Note: Disclaimer language to be reviewed by healthcare attorney before public launch.
          </p>
        </>
      )}

      {/* MIT License */}
      {card(
        <>
          {sectionHeader('MIT License')}
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
          >{`MIT License

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
SOFTWARE.`}</pre>
        </>
      )}

      {/* WHO Attribution */}
      {card(
        <>
          {sectionHeader('WHO Content Attribution Notice')}
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.9375rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Portions of this dashboard reproduce content from World Health Organization
            publications. © World Health Organization 2026. Some rights reserved. Licensed under{' '}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/3.0/igo/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent-blue)' }}
            >
              CC BY-NC-SA 3.0 IGO
            </a>
            .
          </p>
        </>
      )}
    </div>
  )
}
