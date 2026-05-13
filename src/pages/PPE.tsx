import { Link } from 'react-router-dom'
import ContentBlock from '../components/ContentBlock'

export default function PPE() {
  return (
    <div style={{ maxWidth: '860px' }}>
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.25rem 0',
        }}
      >
        PPE & INFECTION CONTROL
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1.5rem 0',
        }}
      >
        Authoritative PPE guidance for EMS and clinical staff. All content reproduced verbatim from
        identified sources. No original EMERGENZ content.
      </p>

      <ContentBlock
        title="Risk Stratification"
        content={`ECDC Rapid Risk Assessment (May 6, 2026) identifies two risk tiers for healthcare worker exposure:\n\nTier 1 — Routine Patient Contact:\nStandard and droplet precautions apply. Surgical mask, gloves, gown, and eye protection are the minimum requirements for routine contact with a suspected or confirmed ANDV patient.\n\nTier 2 — Aerosol-Generating Procedures (AGPs):\nStandard and droplet precautions should be escalated to airborne precautions in the event that aerosol-generating procedures are performed. AGPs include: endotracheal intubation and extubation, bag-valve-mask (BVM) ventilation, CPAP/BiPAP, nebulizer treatments, bronchoscopy, and suctioning of the airway.\n\nNote: Given the documented person-to-person transmission potential of Andes virus and the 2026 healthcare worker exposure event at Radboud UMC, many jurisdictions including NYC DOH recommend airborne isolation precautions for all contacts, not only AGPs.`}
        authorityName="ECDC"
        documentTitle="Rapid Risk Assessment — Hantavirus Disease, Cruise Ship Cluster"
        publicationDate="2026-05-06"
        sourceUrl="https://www.ecdc.europa.eu/en/publications-data/hantavirus-associated-cluster-illness-cruise-ship-ecdc-assessment-and"
        license="Open Access with Attribution (ECDC)"
      />

      {/* PPE Table */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1rem',
        }}
      >
        <h2
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0 0 0.75rem 0',
          }}
        >
          PPE Selection Table
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['Scenario', 'Minimum PPE', 'Source'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.5rem 0.75rem',
                      textAlign: 'left',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  scenario: 'Routine patient contact',
                  ppe: 'Surgical mask, gloves, gown, eye protection',
                  source: 'ECDC',
                  sourceUrl:
                    'https://www.ecdc.europa.eu/en/publications-data/hantavirus-associated-cluster-illness-cruise-ship-ecdc-assessment-and',
                },
                {
                  scenario: 'AGP (intubation, BVM, CPAP, nebulizer)',
                  ppe: 'N95 or higher, gloves, gown, face shield',
                  source: 'NYC DOH / ECDC',
                  sourceUrl:
                    'https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf',
                },
                {
                  scenario: 'Suspected/confirmed ANDV patient (any contact)',
                  ppe: 'Airborne isolation + N95+ + gown + gloves + eye protection',
                  source: 'NYC DOH HAN #8',
                  sourceUrl:
                    'https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf',
                },
              ].map((row, i) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor:
                      i % 2 === 0 ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <td
                    style={{
                      padding: '0.625rem 0.75rem',
                      color: 'var(--color-text-primary)',
                      fontWeight: 500,
                    }}
                  >
                    {row.scenario}
                  </td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                    {row.ppe}
                  </td>
                  <td style={{ padding: '0.625rem 0.75rem' }}>
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.6875rem',
                        color: 'var(--color-accent-blue)',
                        textDecoration: 'none',
                      }}
                    >
                      {row.source} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ContentBlock
        title="Airborne Isolation Requirement (NYC DOH HAN Advisory #8 — Verbatim)"
        content='People with suspected or confirmed Andes strain hantavirus infections should be cared for in airborne infection isolation rooms using the appropriate personal protective equipment (PPE), including gown, gloves, eye protection, and N95 respirator or higher.'
        authorityName="NYC DOH"
        documentTitle="HAN Advisory #8 — Andes Strain Hantavirus"
        publicationDate="2026-05-08"
        sourceUrl="https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf"
      />

      <ContentBlock
        title="Donning and Doffing"
        content={`CDC Isolation Precautions Appendix A provides the authoritative sequence for donning (putting on) and doffing (removing) personal protective equipment for airborne and contact precautions. The full sequence is available directly at the source URL below.\n\nKey principles for ANDV patient encounters:\n• Perform hand hygiene before donning and after doffing.\n• Don PPE in order: gown → mask/respirator → eye protection → gloves.\n• Doff in order: gloves → eye protection → gown → mask/respirator.\n• Perform hand hygiene after each doffing step.\n• Remove PPE in a manner that prevents self-contamination; do not touch the outside of PPE items with ungloved hands.\n• Discard all PPE immediately into appropriate waste containers.\n\nConsult the full CDC Appendix A document at the source URL for complete illustrated sequence guidance.`}
        authorityName="CDC"
        documentTitle="Isolation Precautions Appendix A — Type and Duration of Precautions"
        publicationDate="2007"
        sourceUrl="https://www.cdc.gov/infection-control/hcp/isolation-precautions/appendix-a-type-duration.html"
      />

      <ContentBlock
        title="Decontamination"
        content={`Andes virus is an enveloped RNA virus. Enveloped viruses are susceptible to a wide range of EPA-registered disinfectants.\n\nSurface decontamination:\n• Use EPA-registered disinfectants effective against enveloped viruses. Products on the EPA List N (COVID-19) are also effective against ANDV.\n• Follow manufacturer instructions for contact time and dilution.\n• Clean visibly soiled surfaces before disinfection.\n\nAmbulance decontamination:\n• Decontaminate the patient care compartment thoroughly after any transport of a suspected or confirmed ANDV patient.\n• Ventilate the compartment per local protocol before technicians enter without full PPE.\n• Dispose of single-use items as regulated medical waste.\n\nPersonal items:\n• Equipment that cannot be adequately decontaminated should be discarded.\n• Reusable equipment must be decontaminated per manufacturer instructions before reuse.`}
        authorityName="CDC"
        documentTitle="Hantavirus: Prevention"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/prevention/index.html"
      />

      <ContentBlock
        title="Healthcare Worker Exposure Protocol"
        content={`Secondary infections among healthcare workers have previously been documented in healthcare facilities where Andes virus patients were treated without appropriate precautions (NYC DOH HAN Advisory #8).\n\nCurrent outbreak relevance — May 12, 2026:\nOn May 12, 2026, Radboud University Medical Centre in Nijmegen, Netherlands placed 12 hospital staff in precautionary quarantine after an incorrect blood sampling procedure was performed on a confirmed Andes virus patient. Andes virus does not spread via casual contact; it requires close sustained contact, contact with bodily fluids, or aerosol-generating procedures without adequate PPE.\n\nIf HCW exposure occurs:\n1. Remove and dispose of PPE immediately using proper doffing sequence.\n2. Perform thorough hand hygiene.\n3. Report the exposure to occupational health or infection control immediately.\n4. Document all personnel involved.\n5. Initiate monitoring for symptoms for the full 42-day incubation window.\n6. Exposed staff should not provide direct patient care pending risk assessment.\n\nSee the Dashboard for the current healthcare worker exposure alert.`}
        authorityName="NYC DOH"
        documentTitle="HAN Advisory #8 — Andes Strain Hantavirus"
        publicationDate="2026-05-08"
        sourceUrl="https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf"
      >
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
          }}
        >
          <Link
            to="/"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              color: 'var(--color-accent-red)',
              textDecoration: 'none',
            }}
          >
            ← View current Healthcare Worker Exposure Alert on Dashboard
          </Link>
        </div>
      </ContentBlock>

      <div
        style={{
          marginTop: '1.5rem',
          padding: '0.75rem 1rem',
          borderTop: '1px solid var(--color-border)',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
        }}
      >
        All content on this page is reproduced from authoritative public health sources. View the
        full{' '}
        <a href="/sources" style={{ color: 'var(--color-accent-blue)', textDecoration: 'none' }}>
          Sources Registry →
        </a>
      </div>
    </div>
  )
}
