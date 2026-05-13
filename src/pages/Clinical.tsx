import ContentBlock from '../components/ContentBlock'

export default function Clinical() {
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
        CLINICAL PROFILE
      </h1>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1.5rem 0',
        }}
      >
        All content reproduced verbatim from authoritative public health sources. No original
        EMERGENZ content. Every block carries a direct source citation.
      </p>

      <ContentBlock
        title="Etiology"
        content="Andes virus (ANDV) is a hantavirus in the family Hantaviridae. It is primarily associated with the long-tailed pygmy rice rat (Oligoryzomys longicaudatus) in Chile and Argentina. ANDV causes Hantavirus Pulmonary Syndrome (HPS) — a severe, sometimes fatal respiratory disease — and is the only hantavirus known to spread from person to person. The 2026 MV Hondius outbreak involves the Andes virus, confirmed via genomic sequencing at the National Institute for Communicable Diseases (NICD) in South Africa and virus-specific PCR at Geneva University Hospitals in Switzerland."
        authorityName="CDC / WHO"
        documentTitle="About Andes Virus / WHO DON599"
        publicationDate="2024 / 2026-05-04"
        sourceUrl="https://www.cdc.gov/hantavirus/about/andesvirus.html"
        license="CC BY-NC-SA 3.0 IGO (WHO content)"
      />

      <ContentBlock
        title="Transmission"
        content="Hantaviruses are transmitted to people from rodents primarily through exposure to infected rodent urine, droppings, or saliva. People can become infected when they breathe in aerosolized virus particles. Andes virus is the only type of hantavirus that has been documented to spread from person-to-person. This spread has occurred through close contact with an infected person's blood, saliva, or respiratory secretions, or with their urine or feces. Secondary infections among healthcare workers have previously been documented in healthcare facilities. The 2026 outbreak involves multiple cases with epidemiological links to shipboard exposure and close contact."
        authorityName="CDC"
        documentTitle="HAN 528 — Andes Virus Infection Associated with Cruise Ship Voyage"
        publicationDate="2026-05-08"
        sourceUrl="https://www.cdc.gov/han/php/notices/han00528.html"
      />

      <ContentBlock
        title="Human-to-Human Transmission (ANDV Unique Risk)"
        content="Andes virus is the only type of hantavirus that has been documented to spread from person-to-person. This spread has occurred through close contact with an infected person's blood, saliva, or respiratory secretions, or with their urine or feces. Healthcare workers and close household contacts are at increased risk. The 2026 Radboud UMC incident — in which 12 staff were placed in precautionary quarantine following an incorrect blood sampling procedure — illustrates the occupational exposure risk in clinical settings."
        authorityName="CDC"
        documentTitle="HAN 528 — Andes Virus Infection Associated with Cruise Ship Voyage"
        publicationDate="2026-05-08"
        sourceUrl="https://www.cdc.gov/han/php/notices/han00528.html"
      />

      <ContentBlock
        title="Incubation Period"
        content="Signs and symptoms of HPS due to Andes virus appear 4 to 42 days after exposure. The wide incubation window has significant implications for contact tracing and monitoring decisions, as persons exposed during the MV Hondius voyage may develop symptoms well beyond the initial identification period. New York City DOH HAN Advisory #8 also references the 4–42 day window for monitoring guidance."
        authorityName="CDC"
        documentTitle="About Andes Virus"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/about/andesvirus.html"
      />

      <ContentBlock
        title="Clinical Phase I — Prodrome (Days 1–5)"
        content="The prodromic phase of Hantavirus Pulmonary Syndrome (HPS) typically lasts 3 to 5 days and may resemble an influenza-like illness. Clinical features include: fever (temperature 101–104°F / 38.3–40°C), fatigue, myalgia (especially large muscle groups: thighs, hips, back, shoulders), headache, and dizziness/chills. Gastrointestinal symptoms — nausea, vomiting, diarrhea, and abdominal pain — are common and occur in approximately half of all HPS patients. There is no respiratory distress during this phase. The prodrome is indistinguishable from many other viral illnesses without laboratory confirmation and an exposure history."
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
      />

      <ContentBlock
        title="Clinical Phase II — Cardiopulmonary (Days 4–10)"
        content="The cardiopulmonary phase of HPS represents a rapid and potentially fatal transition from the prodromal illness. Onset is characterized by sudden worsening of dyspnea and the development of non-cardiogenic pulmonary edema with hypoxemia. Clinical features include: cough with frothy or blood-tinged sputum, progressive respiratory failure requiring mechanical ventilation, myocardial depression with reduced cardiac output and cardiogenic shock, and severe hypoxemia refractory to supplemental oxygen. Cardiovascular collapse can occur within hours of respiratory symptom onset. This phase carries the highest case fatality rate. ECMO (extracorporeal membrane oxygenation) has been used as a bridge to recovery in severe cases."
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
      />

      <ContentBlock
        title="Clinical Phase III — Convalescent"
        content="In survivors of the cardiopulmonary phase, recovery begins with diuresis of the accumulated pulmonary fluid, typically within 48 hours of the clinical nadir. Recovery can be rapid once the acute phase has resolved. Survivors may experience fatigue and reduced exercise tolerance for weeks to months. Full pulmonary recovery is the expected outcome in survivors."
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
      />

      <ContentBlock
        title="Differential Diagnosis"
        content="HPS must be differentiated from other causes of acute respiratory failure, particularly in patients with a relevant exposure history. The CDC Clinician Brief identifies the following conditions in the differential diagnosis: influenza and other respiratory viruses, Legionnaire's disease (Legionella pneumophila), leptospirosis, mycoplasma pneumonia, Q fever (Coxiella burnetii), and other causes of ARDS. Key distinguishing features favoring HPS include: exposure to rodents or environments with rodent activity (or, in this outbreak, close contact with a confirmed/probable case), rapid progression from prodromal to severe respiratory failure, and thrombocytopenia on complete blood count."
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
      />

      <ContentBlock
        title="Diagnosis"
        content={`Laboratory confirmation of HPS requires one or more of the following:\n\n• Serology: Detection of hantavirus-specific IgM antibodies by enzyme-linked immunosorbent assay (ELISA) in a single serum specimen, or a fourfold or greater rise in hantavirus-specific IgG titer between acute and convalescent sera.\n• RT-PCR: Detection of hantavirus RNA in blood, urine, or tissue.\n• Immunohistochemistry: Detection of hantavirus antigen in tissue specimens.\n\nClinicians should contact the CDC Emergency Operations Center at 770-488-7100 to request diagnostic testing and guidance. New York City providers should call 866-692-3641 (NYC DOH 24-hour line). Testing turnaround and specimen handling requirements should be confirmed with the testing laboratory prior to collection.`}
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
      />

      <ContentBlock
        title="Treatment"
        content="There is no specific treatment for hantavirus infection. If HPS is suspected, the patient needs emergency medical care immediately, preferably in the intensive care unit. Supportive care is the mainstay of treatment and should be initiated even before diagnostic confirmation. Management priorities include: aggressive management of pulmonary edema and respiratory failure; early intubation and mechanical ventilation with low tidal volume (lung-protective) strategy; hemodynamic support with vasopressors for cardiogenic shock; careful fluid management to avoid exacerbating pulmonary edema; and ECMO as a bridge to recovery in refractory cardiopulmonary failure where available. There is no approved antiviral therapy for hantavirus. Ribavirin has been studied but has not demonstrated efficacy in controlled trials for HPS."
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
      />

      <ContentBlock
        title="Case Fatality Rate"
        content="HPS is fatal in nearly 4 in 10 people who are infected. The overall case fatality rate for Hantavirus Pulmonary Syndrome is approximately 38% (CDC HAN 528). Secondary reporting from Al Jazeera citing epidemiologists suggests the CFR may be 40–50% particularly among elderly patients. The 2026 outbreak has a current case fatality rate of approximately 27% (3 deaths / 11 total cases as of May 12), reflecting both the severity of the illness and the availability of advanced critical care in affected European countries."
        authorityName="NYC DOH"
        documentTitle="HAN Advisory #8 — Andes Strain Hantavirus"
        publicationDate="2026-05-08"
        sourceUrl="https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf"
      />

      <ContentBlock
        title="EMS-Specific Considerations (NYC DOH HAN Advisory #8)"
        content={`EMS providers responding to patients with suspected or confirmed Andes strain hantavirus infection should:\n\n• Use airborne infection isolation precautions for all patient contacts. Place N95 or higher respirator, gown, gloves, and eye protection before patient contact.\n• Minimize aerosol-generating procedures (AGPs) in the field; if required (intubation, BVM, CPAP, nebulizer), ensure full AGP PPE is in place before initiating.\n• Notify the receiving facility in advance of transport so airborne isolation rooms (AIIR) can be prepared.\n• Document all personnel who had contact with the patient for exposure tracking purposes.\n• Decontaminate the ambulance using EPA-registered disinfectants effective against enveloped viruses following transport.\n• Report any patient suspected of having Andes virus to the local health department immediately.\n• Personnel who experience symptoms consistent with hantavirus within 42 days of a potential exposure should report to occupational health immediately and avoid patient contact.\n\nAndre virus does not spread via casual contact. Sustained close contact, aerosol-generating procedures, or contact with bodily fluids are the documented transmission pathways.`}
        authorityName="NYC DOH"
        documentTitle="HAN Advisory #8 — Andes Strain Hantavirus"
        publicationDate="2026-05-08"
        sourceUrl="https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf"
      />

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
        All content on this page is reproduced from authoritative public health sources. No
        original EMERGENZ clinical content. View the full{' '}
        <a
          href="/sources"
          style={{ color: 'var(--color-accent-blue)', textDecoration: 'none' }}
        >
          Sources Registry →
        </a>
      </div>
    </div>
  )
}
