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
        Content sourced from authoritative public health sources. No original EMERGENZ clinical
        content. Every block carries a direct source citation. Where multiple sources are cited,
        each claim is traceable to its listed source.
      </p>

      {/* C1 FIX: Etiology — WHO DON599 claims now have their own source chip via additionalSources */}
      <ContentBlock
        title="Etiology"
        content="Andes virus (ANDV) is a hantavirus in the family Hantaviridae. It is primarily associated with the long-tailed pygmy rice rat (Oligoryzomys longicaudatus) in Chile and Argentina. ANDV causes Hantavirus Pulmonary Syndrome (HPS) — a severe, sometimes fatal respiratory disease — and is the only hantavirus known to spread from person to person. The causative agent of the 2026 MV Hondius outbreak was confirmed as Andes virus (Orthohantavirus andesense) following genomic sequencing at the National Institute for Communicable Diseases (NICD) in South Africa and virus-specific PCR at Geneva University Hospitals in Switzerland."
        authorityName="CDC"
        documentTitle="About Andes Virus"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/about/andesvirus.html"
        license="U.S. Government Work (CDC) / CC BY-NC-SA 3.0 IGO (WHO DON599)"
        additionalSources={[
          {
            authority: 'WHO',
            documentTitle: 'Disease Outbreak News DON599',
            date: '2026-05-04',
            url: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON599',
            license: 'CC BY-NC-SA 3.0 IGO',
          },
        ]}
      />

      {/* C2 FIX: Removed editorial synthesis sentence about "2026 outbreak involves..." */}
      <ContentBlock
        title="Transmission"
        content="Hantaviruses are transmitted to people from rodents primarily through exposure to infected rodent urine, droppings, or saliva. People can become infected when they breathe in aerosolized virus particles. Andes virus is the only type of hantavirus that has been documented to spread from person-to-person. This spread has occurred through close contact with an infected person's blood, saliva, or respiratory secretions, or with their urine or feces. Secondary infections among healthcare workers have previously been documented in healthcare facilities."
        authorityName="CDC"
        documentTitle="HAN 528 — Andes Virus Infection Associated with Cruise Ship Voyage"
        publicationDate="2026-05-08"
        sourceUrl="https://www.cdc.gov/han/php/notices/han00528.html"
      />

      {/*
        C3 FIX: Radboud UMC May 12 event removed from HAN 528 attribution.
        HAN 528 was published May 8 — the event postdated the source.
        Radboud reference retained below with correct Euronews attribution.
      */}
      <ContentBlock
        title="Human-to-Human Transmission (ANDV Unique Risk)"
        content="Andes virus is the only type of hantavirus that has been documented to spread from person-to-person. This spread has occurred through close contact with an infected person's blood, saliva, or respiratory secretions, or with their urine or feces. Healthcare workers and close household contacts are at increased risk. This is distinct from all other hantaviruses, which are transmitted only from rodent reservoirs to humans and do not spread between people."
        authorityName="CDC"
        documentTitle="HAN 528 — Andes Virus Infection Associated with Cruise Ship Voyage"
        publicationDate="2026-05-08"
        sourceUrl="https://www.cdc.gov/han/php/notices/han00528.html"
        additionalSources={[
          {
            authority: 'Euronews',
            documentTitle: 'Dutch hospital workers quarantined after faulty procedure (2026 HCW exposure event — Radboud UMC, May 12)',
            date: '2026-05-12',
            url: 'https://www.euronews.com/health/2026/05/12/dutch-hospital-workers-quarantined-after-faulty-procedure-treating-hantavirus-patient',
          },
        ]}
      />

      <ContentBlock
        title="Incubation Period"
        content={`Signs and symptoms of HPS due to Andes virus appear 4 to 42 days after exposure. The wide incubation window has significant implications for contact tracing and monitoring decisions, as persons exposed during the MV Hondius voyage may develop symptoms well beyond the initial identification period.\n\nClinical screening note (NETEC): Most clinical screening protocols inquire about exposures within 7–30 days; for hantavirus, clinicians should ask about the past 6 weeks given the extended incubation window. Nebraska Medicine similarly cites symptom onset of "one to six weeks" after exposure.`}
        authorityName="CDC"
        documentTitle="About Andes Virus"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/about/andesvirus.html"
        additionalSources={[
          {
            authority: 'NYC DOH',
            documentTitle: 'HAN Advisory #8 — Andes Strain Hantavirus (also cites 4–42 day window)',
            date: '2026-05-08',
            url: 'https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf',
          },
          {
            authority: 'NETEC',
            documentTitle: 'Hantavirus: Clinical Insights, Emerging Evidence, and What Every Healthcare Worker Should Know (6-week screening window)',
            date: '2026-05-06',
            url: 'https://netec.org/2026/02/23/hantavirus-clinical-insights-emerging-evidence-and-what-every-healthcare-worker-should-know/',
          },
          {
            authority: 'Nebraska Medicine',
            documentTitle: 'What You Need to Know About Hantavirus — Biocontainment Unit',
            date: '2026-05-11',
            url: 'https://www.nebraskamed.com/health/nebraska-medicine-news/biocontainment-unit/nebraska-medicineunmc-asked-to-monitor-us',
          },
        ]}
      />

      <ContentBlock
        title="Clinical Phase I — Prodrome (Days 1–5)"
        content="The prodromic phase of Hantavirus Pulmonary Syndrome (HPS) typically lasts 3 to 5 days and may resemble an influenza-like illness. Clinical features include: fever, fatigue, myalgia (especially large muscle groups: thighs, hips, back, shoulders), headache, and dizziness/chills. Gastrointestinal symptoms — nausea, vomiting, diarrhea, and abdominal pain — may also occur. There is no respiratory distress during this phase. The prodrome is indistinguishable from many other viral illnesses without laboratory confirmation and an exposure history."
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
      />

      {/* C5 FIX: ECMO reference attributed to NYC DOH HAN #8 via additionalSources */}
      <ContentBlock
        title="Clinical Phase II — Cardiopulmonary (Days 4–10)"
        content="The cardiopulmonary phase of HPS represents a rapid and potentially fatal transition from the prodromal illness. Onset is characterized by sudden worsening of dyspnea and the development of non-cardiogenic pulmonary edema with hypoxemia. Clinical features include: cough with frothy or blood-tinged sputum, progressive respiratory failure requiring mechanical ventilation, myocardial depression with reduced cardiac output and cardiogenic shock, and severe hypoxemia refractory to supplemental oxygen. Cardiovascular collapse can occur within hours of respiratory symptom onset. This phase carries the highest case fatality rate. ECMO (extracorporeal membrane oxygenation) has been used as a bridge to recovery in refractory cardiopulmonary failure."
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
        additionalSources={[
          {
            authority: 'NYC DOH',
            documentTitle: 'HAN Advisory #8 — Andes Strain Hantavirus (ECMO reference)',
            date: '2026-05-08',
            url: 'https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf',
          },
        ]}
      />

      <ContentBlock
        title="Clinical Phase III — Convalescent"
        content="In survivors of the cardiopulmonary phase, recovery begins with diuresis of the accumulated pulmonary fluid, typically within 48 hours of the clinical nadir. Recovery can be rapid once the acute phase has resolved. Survivors may experience fatigue and reduced exercise tolerance for weeks to months. Most survivors recover full pulmonary function, though the duration of recovery is variable."
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
      />

      <ContentBlock
        title="Differential Diagnosis"
        content="HPS must be differentiated from other causes of acute respiratory failure, particularly in patients with a relevant exposure history. Conditions in the differential diagnosis include: influenza and other respiratory viruses, Legionnaire's disease (Legionella pneumophila), leptospirosis, mycoplasma pneumonia, Q fever (Coxiella burnetii), and other causes of ARDS. Key distinguishing features favoring HPS include: exposure to rodents or environments with rodent activity (or, in the 2026 context, close contact with a confirmed or probable case), and rapid progression from a prodromal illness to severe respiratory failure."
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
      />

      {/* C6 FIX: NYC DOH phone number now attributed to NYC DOH HAN #8 via additionalSources */}
      <ContentBlock
        title="Diagnosis"
        content={`Laboratory confirmation of HPS requires one or more of the following:\n\n• Serology: Detection of hantavirus-specific IgM antibodies by enzyme-linked immunosorbent assay (ELISA) in a single serum specimen, or a fourfold or greater rise in hantavirus-specific IgG titer between acute and convalescent sera.\n• RT-PCR: Detection of hantavirus RNA in blood, urine, or tissue.\n• Immunohistochemistry: Detection of hantavirus antigen in tissue specimens.\n\nClinicians should contact the CDC Emergency Operations Center at 770-488-7100 to request diagnostic testing and guidance. New York City providers should call 866-692-3641 (NYC DOH 24-hour line). Testing turnaround and specimen handling requirements should be confirmed with the testing laboratory prior to collection.\n\nNote: Verify all contact numbers directly with the issuing authority before use in an operational context. Phone numbers are reproduced from source documents dated May 2026 and may change.`}
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
        additionalSources={[
          {
            authority: 'NYC DOH',
            documentTitle: 'HAN Advisory #8 — Andes Strain Hantavirus (NYC 24-hour reporting line: 866-692-3641)',
            date: '2026-05-08',
            url: 'https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf',
          },
        ]}
      />

      <ContentBlock
        title='Laboratory Diagnostic Indicators — "The Classic Five"'
        content={`Dr. Maria Frank (Johns Hopkins Hospital, Director of Special Pathogens Center; RESPTIC Director), via NETEC Clinical Insights (updated May 2026), identifies five laboratory findings that strongly suggest HCPS when clustered together:\n\n1. Thrombocytopenia\n2. Hemoconcentration\n3. Left shift without toxic granulation\n4. More than 10% immunoblasts on peripheral smear\n5. Rapid onset of respiratory compromise\n\n"The presence of four or more of these strongly suggests HCPS."\n\nTwo primary diagnostic testing approaches:\n• PCR: useful because viremia persists throughout illness\n• Serology: IgM typically positive at symptom onset\n\nA confirmed case requires compatible illness plus: positive IgM, rising IgG titers, positive immunohistochemistry, or positive PCR. HCPS is a nationally notifiable condition — report suspected cases promptly to local or state health departments. Contact CDC Emergency Operations Center at 770-488-7100 for consultation, testing support, and confirmatory diagnostics.`}
        authorityName="NETEC"
        documentTitle='Hantavirus: Clinical Insights, Emerging Evidence, and What Every Healthcare Worker Should Know (Dr. Maria Frank — "The Classic Five")'
        publicationDate="2026-05-06"
        sourceUrl="https://netec.org/2026/02/23/hantavirus-clinical-insights-emerging-evidence-and-what-every-healthcare-worker-should-know/"
      />

      <ContentBlock
        title="Treatment"
        content={`There is no specific treatment for hantavirus infection. If HPS is suspected, the patient needs emergency medical care immediately, preferably in the intensive care unit. Supportive care is the mainstay of treatment and should be initiated even before diagnostic confirmation.\n\nManagement priorities include:\n• Aggressive management of pulmonary edema and respiratory failure\n• Early intubation and mechanical ventilation with low tidal volume (lung-protective) strategy\n• Hemodynamic support with vasopressors for cardiogenic shock — avoid fluid boluses for hypotension\n• Careful fluid management to avoid exacerbating pulmonary edema\n• Empiric broad-spectrum antibiotics are appropriate until bacterial infection is excluded\n• ECMO as a bridge to recovery in refractory cardiopulmonary failure where available\n\nThere is no approved antiviral therapy for hantavirus. Ribavirin has been studied but has not demonstrated efficacy in controlled trials for HPS.\n\nWithout early supportive care, most deaths occur within 24–48 hours of onset of the cardiopulmonary phase (NETEC).`}
        authorityName="CDC"
        documentTitle="Hantavirus Pulmonary Syndrome: Clinical Overview for Clinicians"
        publicationDate="2024"
        sourceUrl="https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html"
        additionalSources={[
          {
            authority: 'NETEC',
            documentTitle: 'Hantavirus: Clinical Insights, Emerging Evidence, and What Every Healthcare Worker Should Know (empiric antibiotics; 24–48h mortality timeline)',
            date: '2026-05-06',
            url: 'https://netec.org/2026/02/23/hantavirus-clinical-insights-emerging-evidence-and-what-every-healthcare-worker-should-know/',
          },
          {
            authority: 'NYC DOH',
            documentTitle: 'HAN Advisory #8 — Andes Strain Hantavirus (ECMO reference)',
            date: '2026-05-08',
            url: 'https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf',
          },
        ]}
      />

      <ContentBlock
        title="Poor Prognostic Indicators"
        content={`The following findings indicate high risk of fatal outcome and should prompt immediate escalation to ECMO-capable facility (per NETEC Clinical Insights, Dr. Bradfute and Dr. Frank, May 2026):\n\n• Lactate >4.0 mmol/L\n• Cardiac index <2.2 L/min/m²\n• Severe myocardial depression, arrhythmias, or electromechanical dissociation\n\nAdditional high-risk clinical features:\n• Most patients develop hypotension within 24 hours of cardiopulmonary phase onset\n• Pulmonary edema and hypoxia typically worsen rapidly once the cardiopulmonary phase begins\n• Without early supportive care including ECMO where indicated, most deaths occur within 24–48 hours of cardiopulmonary phase onset\n\nSurvivors often experience a polyuric phase and may recover rapidly, though fatigue may persist for weeks to months.`}
        authorityName="NETEC"
        documentTitle="Hantavirus: Clinical Insights, Emerging Evidence, and What Every Healthcare Worker Should Know (Dr. Bradfute, Dr. Frank — prognostic indicators)"
        publicationDate="2026-05-06"
        sourceUrl="https://netec.org/2026/02/23/hantavirus-clinical-insights-emerging-evidence-and-what-every-healthcare-worker-should-know/"
      />

      {/*
        C7 FIX:
        - Primary source changed to CDC HAN 528 for the 38% figure (correct attribution)
        - NYC DOH "4 in 10" framing added as additionalSource
        - Al Jazeera secondary claim removed (not an authoritative source)
        - Editorial "current CFR 27%" EMERGENZ calculation removed entirely
      */}
      <ContentBlock
        title="Case Fatality Rate"
        content="Hantavirus Pulmonary Syndrome (HPS) has a case fatality rate of approximately 38% (CDC HAN 528). NYC DOH HAN Advisory #8 characterizes this as fatal in nearly 4 in 10 people who are infected. HPS is among the most lethal acute respiratory infections encountered in emergency and critical care settings. Early recognition and aggressive supportive care are the only evidence-based interventions that may improve outcome."
        authorityName="CDC"
        documentTitle="HAN 528 — Andes Virus Infection Associated with Cruise Ship Voyage"
        publicationDate="2026-05-08"
        sourceUrl="https://www.cdc.gov/han/php/notices/han00528.html"
        additionalSources={[
          {
            authority: 'NYC DOH',
            documentTitle: 'HAN Advisory #8 — Andes Strain Hantavirus',
            date: '2026-05-08',
            url: 'https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf',
          },
        ]}
      />

      {/*
        C8 FIX:
        - "Andre virus" typo corrected to "Andes virus"
        - EPA decontamination reference removed (not NYC DOH HAN #8 content)
        - Numbered steps reframed as recommended practice, not verbatim NYC DOH
        - Content scoped to what NYC DOH HAN #8 actually covers for EMS
      */}
      <ContentBlock
        title="EMS-Specific Considerations"
        content={`The following guidance is based on NYC DOH HAN Advisory #8 and CDC HAN 528 recommendations for EMS personnel.\n\n• Use airborne infection isolation precautions for all contacts with suspected or confirmed Andes virus patients. Apply N95 or higher respirator, gown, gloves, and eye protection before patient contact.\n• Minimize aerosol-generating procedures (AGPs) in the field. If required (intubation, BVM, CPAP, nebulizer), ensure full AGP precautions are in place before initiating.\n• Notify the receiving facility in advance of transport so airborne isolation rooms (AIIR) can be prepared.\n• Document all personnel who had direct patient contact for exposure tracking purposes.\n• Report any patient suspected of having Andes virus to the local health department immediately.\n• Personnel who develop symptoms consistent with hantavirus within 42 days of a potential exposure should report to occupational health immediately and avoid patient care.\n\nAndes virus does not spread via casual contact. Documented transmission pathways are close sustained contact, contact with bodily fluids, or aerosol-generating procedures without adequate PPE.`}
        authorityName="NYC DOH"
        documentTitle="HAN Advisory #8 — Andes Strain Hantavirus"
        publicationDate="2026-05-08"
        sourceUrl="https://www.nyc.gov/assets/doh/downloads/pdf/han/advisory/2026/han-advisory-8-hantavirus.pdf"
        additionalSources={[
          {
            authority: 'CDC',
            documentTitle: 'HAN 528 — Andes Virus Infection Associated with Cruise Ship Voyage',
            date: '2026-05-08',
            url: 'https://www.cdc.gov/han/php/notices/han00528.html',
          },
        ]}
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
        All content on this page is sourced from authoritative public health sources. No
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
