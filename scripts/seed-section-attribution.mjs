#!/usr/bin/env node
/**
 * One-time content-block attribution seeder.
 *
 * Adds per-block source attribution to signal detailSections per
 * CONTENT-STANDARDS.md §2.1. For the hantavirus signal (which already has
 * 5 sections), attribution is layered onto existing bodyMarkdown without
 * altering the text. For other signals (currently no detailSections),
 * a single "Operational guidance" section is added — short, factual,
 * traceable to the signal's primary source.
 *
 * Run once: node scripts/seed-section-attribution.mjs
 */

import { readFileSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const SOURCES_PATH = 'src/data/signal-sources.json'

const LAST_REVIEWED = '2026-05-20'

// ---------------------------------------------------------------------------
// Hantavirus: attribution to layer onto each existing section.
// Keyed by section id; existing bodyMarkdown is preserved.
// ---------------------------------------------------------------------------
const HANTAVIRUS_ATTRIBUTION = {
  'clinical-profile': {
    primary: 'cdc-han-528',
    additional: ['nyc-doh-han-8', 'netec-hantavirus-clinical-insights', 'cdc-hantavirus-clinical-overview'],
  },
  'ppe-and-ipc': {
    primary: 'nyc-doh-han-8',
    additional: ['netec-vhf-ppe-matrix', 'ecdc-andes-rra', 'cdc-isolation-precautions', 'cdc-rodent-cleanup'],
  },
  'ems-specific': {
    primary: 'cdc-han-528',
    additional: ['who-don601', 'netec-hantavirus-clinical-insights'],
  },
  'genomics-and-diagnostics': {
    primary: 'cdc-hantavirus-about-andes',
    additional: ['netec-hantavirus-lab-resources'],
  },
  'protocols-and-guidance': {
    primary: 'cdc-han-528',
    additional: ['nyc-doh-han-8', 'who-don601'],
  },
}

// ---------------------------------------------------------------------------
// New operational-guidance sections for signals without detailSections.
// Each pulls from CDC/WHO/ECDC/USDA primary source where applicable.
// Bodies are factual statements grounded in the cited source — short and
// non-clinical (no diagnostic or treatment recommendations) per
// CONTENT-STANDARDS.md §7.1 (clinical guidance is manually curated only).
// ---------------------------------------------------------------------------
const NEW_SECTIONS = {
  'ebola-bundibugyo-drc-2026': {
    title: 'Operational guidance',
    primary: 'who-disease-outbreak-news',
    additional: ['africa-cdc-outbreaks', 'cdc-current-outbreaks'],
    body: `Ebolavirus outbreaks are reported in real time by WHO Disease Outbreak News and Africa CDC. Active surveillance includes ring-vaccination campaigns where rVSV-ZEBOV is matched to the strain, cross-border case-finding, and Ebola Treatment Unit (ETU) deployment.

Returning travelers from active outbreak zones presenting with febrile illness within 21 days of departure should be triaged using standard EVD screening (fever, exposure history, contact with known/suspected case). Specimen handling requires BSL-4 containment for confirmatory testing; coordinate with state public health lab and CDC Emergency Operations Center (770-488-7100) prior to collection.

Operational priorities include early isolation, contact tracing, safe burials, and community engagement. Verify ETU locations, transport protocols, and PPE supply chains against your agency's biosafety SOP before deployment.`,
  },

  'measles-us-2026': {
    title: 'Operational guidance',
    primary: 'cdc-current-outbreaks',
    additional: ['cdc-han'],
    body: `Measles outbreaks in the United States are driven primarily by under-vaccinated communities and importation from regions with active circulation. CDC monitors the situation through state health department case reports and HAN advisories. The MMR vaccine is approximately 97% effective after two doses; herd immunity threshold is roughly 95% population coverage.

Operationally, EMS providers and emergency departments handling suspected measles cases should apply airborne precautions (N95 or higher), isolate the patient in a negative-pressure room when available, and notify the receiving facility before transport. Vulnerable contacts (under 1 year, immunocompromised, pregnant) require post-exposure prophylaxis evaluation within 72 hours (vaccine) or 6 days (immunoglobulin).

Verify state-specific case-reporting requirements with your local health department. Measles is a reportable condition in all 50 states.`,
  },

  'mpox-africa-clade-i-2026': {
    title: 'Operational guidance',
    primary: 'who-disease-outbreak-news',
    additional: ['africa-cdc-outbreaks', 'cdc-current-outbreaks'],
    body: `Clade I mpox (formerly Monkeypox virus clade I) is the strain currently driving sustained transmission in the Democratic Republic of the Congo and neighboring countries. Clade I has historically caused more severe disease than clade II, including higher case-fatality and increased pediatric burden. WHO declared the current outbreak a Public Health Emergency of International Concern (PHEIC) in 2024.

Operationally, suspected mpox cases require standard, contact, and droplet precautions. Confirmed clade I cases should be reported to CDC and managed in consultation with state public health authorities. JYNNEOS vaccine is licensed for pre-exposure and post-exposure use in eligible adults.

Travelers returning from active outbreak zones with characteristic rash should be triaged using CDC clinical criteria. Coordinate diagnostic testing through your jurisdiction's Laboratory Response Network (LRN) reference laboratory.`,
  },

  'avian-influenza-h5-2026': {
    title: 'Operational guidance',
    primary: 'usda-aphis-hpai',
    additional: ['cdc-current-outbreaks', 'woah-wahis'],
    body: `Highly pathogenic avian influenza (HPAI) H5N1 clade 2.3.4.4b has expanded its host range to include dairy cattle in the United States since March 2024. USDA APHIS coordinates animal-health response (depopulation, biosecurity, milk-supply surveillance); CDC monitors human exposures and conducts genomic surveillance.

Operationally, occupational exposures (dairy workers, poultry workers, depopulation responders) should be assessed under CDC guidance. PPE for active depopulation includes fit-tested N95, eye protection, gloves, coveralls, and boots. Antiviral prophylaxis with oseltamivir is recommended for unprotected exposures.

The pasteurized commercial milk supply remains safe per FDA pasteurization studies. Surveillance focuses on detecting any mutations associated with enhanced mammalian transmission. Verify outbreak reports against USDA APHIS and WOAH WAHIS dashboards.`,
  },

  'cholera-africa-2026': {
    title: 'Operational guidance',
    primary: 'who-disease-outbreak-news',
    additional: ['africa-cdc-outbreaks', 'paho-epi-alerts'],
    body: `Cholera outbreaks across sub-Saharan Africa are driven by displacement, conflict-affected water and sanitation infrastructure, and seasonal flooding. WHO and Africa CDC coordinate oral cholera vaccine (OCV) deployment from the global stockpile, which is managed by the International Coordinating Group (ICG).

Operationally, cholera is treatable with prompt oral or intravenous rehydration; case-fatality should be under 1% with adequate care. Vibrio cholerae O1 serogroup is the predominant circulating strain. Standard precautions are sufficient for clinical contact; the primary transmission route is fecal-oral via contaminated water or food.

Travelers from active outbreak zones presenting with acute watery diarrhea should be evaluated using clinical criteria; rapid diagnostic tests are available at sentinel sites. Coordinate suspected case management with state public health authorities.`,
  },

  'seasonal-influenza-2026': {
    title: 'Operational guidance',
    primary: 'cdc-fluview',
    additional: ['cdc-respiratory-viruses', 'ecdc-cdtr'],
    body: `Seasonal influenza activity is tracked weekly by CDC FluView (US), ECDC (EU/EEA), UKHSA (UK), and Public Health Agency of Canada FluWatch. Northern Hemisphere influenza vaccine composition is announced annually in February for the following season. Vaccine effectiveness varies year over year based on antigenic match.

Operationally, EMS and hospital systems should anticipate surge during peak weeks (typically December–March in Northern Hemisphere). Antiviral treatment with oseltamivir, baloxavir, or zanamivir is most effective when initiated within 48 hours of symptom onset, especially in high-risk populations (adults 65+, immunocompromised, pregnant, chronic conditions).

Subtyping (A/H1N1, A/H3N2, B/Victoria, B/Yamagata) and antiviral resistance surveillance are conducted via the WHO Global Influenza Surveillance and Response System (GISRS). Verify current circulating strains and dominant subtype via FluView before clinical interpretation.`,
  },

  'covid-wastewater-2026': {
    title: 'Operational guidance',
    primary: 'cdc-nwss',
    additional: ['wastewaterscan'],
    body: `SARS-CoV-2 wastewater surveillance through the CDC National Wastewater Surveillance System (NWSS) and WastewaterSCAN provides leading-indicator signal for community transmission, typically rising 4–7 days before clinical case reports. Variants of concern are detected through sequencing of wastewater samples at select sites.

Operationally, sustained increases in wastewater signal can indicate forthcoming healthcare surge. EMS and hospital preparedness teams should align resourcing, PPE, and capacity planning to wastewater trajectories alongside conventional clinical surveillance.

Wastewater signal does not provide individual-level diagnosis, vaccination guidance, or treatment recommendation — it informs population-level situational awareness only. Verify trends against CDC NWSS and your jurisdiction's public health dashboard.`,
  },

  'norovirus-wastewater-2026': {
    title: 'Operational guidance',
    primary: 'wastewaterscan',
    additional: ['cdc-nwss'],
    body: `Norovirus wastewater surveillance through WastewaterSCAN tracks community-level transmission of the leading cause of acute gastroenteritis in the United States. Seasonal peaks typically occur November–April. Norovirus is highly transmissible via fecal-oral, food, and surface routes.

Operationally, sustained increases in wastewater signal correlate with elevated ED visits for vomiting and diarrhea, especially in long-term-care facilities, schools, and cruise-ship environments. Standard precautions plus contact precautions; alcohol-based hand sanitizer is less effective than soap and water against norovirus.

Outbreak management focuses on isolation of symptomatic cases, environmental decontamination (1:50 bleach for hard surfaces), and exclusion of food handlers for 48 hours after symptom resolution. Verify outbreak status against your jurisdiction's enteric-disease surveillance program.`,
  },

  'rsv-wastewater-2026': {
    title: 'Operational guidance',
    primary: 'cdc-respiratory-viruses',
    additional: ['wastewaterscan', 'cdc-nwss'],
    body: `Respiratory syncytial virus (RSV) wastewater surveillance complements CDC RESP-NET clinical surveillance to track seasonal RSV circulation. Peak season in the Northern Hemisphere typically runs October–March. RSV is the leading cause of hospitalization for infants in the United States.

Operationally, monoclonal antibody prophylaxis (nirsevimab) is recommended for eligible infants and high-risk children during RSV season. Adult RSV vaccines (Abrysvo, Arexvy) are licensed for adults 60+ and select populations.

EMS and pediatric facilities should anticipate surge during peak weeks. Standard precautions plus contact and droplet precautions; isolate suspected cases and verify diagnostic testing pathway with your hospital's clinical laboratory. Verify current circulating activity through CDC respiratory-virus dashboards.`,
  },

  'hmpv-wastewater-2026': {
    title: 'Operational guidance',
    primary: 'cdc-respiratory-viruses',
    additional: ['wastewaterscan'],
    body: `Human metapneumovirus (hMPV) is a pneumovirus that causes respiratory illness across all age groups, with the highest burden in young children, older adults, and immunocompromised patients. Wastewater surveillance through WastewaterSCAN and clinical surveillance through CDC respiratory-virus systems track seasonal circulation.

Operationally, hMPV currently has no licensed vaccine or specific antiviral. Management is supportive: oxygen, fluids, and respiratory support as clinically indicated. Standard precautions plus contact and droplet precautions for known or suspected cases.

Co-circulation with influenza, RSV, SARS-CoV-2, and other respiratory pathogens is common during peak seasons. Multiplex molecular testing is the gold standard for diagnosis. Verify circulating activity and co-infection patterns through CDC respiratory-virus data.`,
  },

  'lassa-fever-2026': {
    title: 'Operational guidance',
    primary: 'who-disease-outbreak-news',
    additional: ['cdc-current-outbreaks', 'africa-cdc-outbreaks'],
    body: `Lassa fever is endemic in West Africa, with the highest burden in Nigeria (Edo, Ondo, Bauchi, and Ebonyi states), Sierra Leone, Liberia, and Guinea. The Lassa mammarenavirus reservoir is the multimammate rat (Mastomys natalensis). Person-to-person transmission occurs through contact with body fluids of infected patients, particularly in healthcare settings without adequate PPE.

Operationally, returning travelers from endemic areas presenting with febrile illness within 21 days require Lassa screening. Standard, contact, and droplet precautions are recommended; airborne precautions for aerosol-generating procedures. Specimen handling requires BSL-4 containment for confirmatory testing.

Ribavirin has activity against Lassa virus and is recommended for suspected severe cases when initiated early in the clinical course. Coordinate with CDC Emergency Operations Center (770-488-7100) and your state public health laboratory before specimen collection.`,
  },

  'chikungunya-2026': {
    title: 'Operational guidance',
    primary: 'paho-epi-alerts',
    additional: ['cdc-current-outbreaks'],
    body: `Chikungunya virus is transmitted by Aedes aegypti and Aedes albopictus mosquitoes. Endemic and outbreak transmission is sustained across the Americas, parts of Africa, South Asia, and Southeast Asia; autochthonous transmission has been documented in southern Europe and the southern United States where competent vectors are established.

Operationally, the clinical course typically includes fever, severe polyarthralgia, headache, and rash. Mortality is low but chronic arthralgia can persist for months to years. There is no specific antiviral; management is supportive (rest, fluids, NSAIDs after dengue is ruled out).

A licensed chikungunya vaccine (Ixchiq) is available for travelers and at-risk populations. Vector control (source reduction, larvicide, residual indoor spraying) remains the primary prevention strategy in endemic areas. Verify outbreak status and vector activity through PAHO and CDC.`,
  },

  'candida-auris-wastewater-2026': {
    title: 'Operational guidance',
    primary: 'cdc-current-outbreaks',
    additional: ['wastewaterscan'],
    body: `Candida auris is a multidrug-resistant yeast first identified in 2009 and now associated with healthcare-facility outbreaks in over 40 US states. The organism colonizes patients persistently, transmits between patients via healthcare contact and shared environment, and is resistant to multiple antifungal classes (echinocandins, azoles, polyenes — sometimes all three).

Operationally, infection prevention measures include single-room isolation, dedicated equipment, enhanced terminal cleaning with EPA List P disinfectants, and pre-admission screening from facilities with active C. auris cases. Active surveillance through wastewater is emerging as a tool for facility-level monitoring.

Empiric antifungal selection should be informed by local susceptibility patterns; consult your facility's antimicrobial stewardship team. Confirmatory speciation requires MALDI-TOF or sequencing — many automated platforms misidentify C. auris as related Candida species.`,
  },

  'screwworm-onehealth-2026': {
    title: 'Operational guidance',
    primary: 'usda-aphis-screwworm-status',
    additional: ['woah-wahis'],
    body: `The New World screwworm (Cochliomyia hominivorax) was eradicated from the United States in 1966 and from much of Central America via sterile-insect technique. Northward expansion from Panama through Costa Rica and into southern Mexico since 2023 represents a serious risk to US livestock, wildlife, and (rarely) human myiasis cases.

Operationally, USDA APHIS coordinates surveillance and sterile-fly release with Mexican and Central American partners. US border surveillance focuses on Texas, New Mexico, Arizona, and California. Veterinarians and producers in border states should report any maggot infestations of livestock or wildlife wounds to USDA APHIS via 1-866-536-7593.

Human cases are rare and typically resolve with mechanical removal of larvae and wound care. EMS providers encountering suspect wounds should consult infectious disease and coordinate with local public health. Verify outbreak status and sterile-fly release schedules through USDA APHIS.`,
  },

  'fifa-world-cup-2026-prep': {
    title: 'Mass-gathering health preparedness',
    primary: 'who-mass-gatherings',
    additional: ['cdc-current-outbreaks'],
    body: `The 2026 FIFA World Cup will be hosted across 16 venues in the United States, Canada, and Mexico from June 11 through July 19, 2026. Expected attendance and concentrated international travel create elevated risk for respiratory virus transmission, vector-borne disease importation, foodborne outbreaks, and mass-casualty preparedness scenarios.

Operationally, host-city and venue medical planning is coordinated with state, provincial, and federal public health authorities. WHO has published mass-gathering health risk-assessment frameworks (WHO-MG checklist) that inform syndromic surveillance, EMS surge capacity, hospital diversion plans, and pathogen-specific contingency protocols.

EMS systems serving host cities should pre-position medical strike teams, validate translation services, coordinate with FBI/DHS for security-medical integration, and verify cross-border medical-evacuation protocols with Canadian and Mexican counterparts. Verify venue-specific medical plans with the local host committee.`,
  },
}

function findSource(sources, id) {
  const s = sources.find((x) => x.id === id)
  if (!s) throw new Error(`Source not found: ${id}`)
  return s
}

function toAttribution(source) {
  return {
    authority: source.authority,
    documentTitle: source.title,
    date: source.publicationDate ?? source.lastVerified,
    url: source.url,
  }
}

function main() {
  const signals = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8'))
  const sources = JSON.parse(readFileSync(SOURCES_PATH, 'utf8'))

  let sectionsTouched = 0
  let sectionsAdded = 0

  for (const signal of signals) {
    // Layer attribution onto hantavirus sections without altering bodyMarkdown
    if (signal.id === 'andes-hantavirus-mv-hondius-2026') {
      for (const section of signal.detailSections || []) {
        const conf = HANTAVIRUS_ATTRIBUTION[section.id]
        if (!conf) continue
        section.attribution = toAttribution(findSource(sources, conf.primary))
        section.additionalAttributions = conf.additional.map((id) => toAttribution(findSource(sources, id)))
        section.lastReviewed = section.lastReviewed ?? LAST_REVIEWED
        sectionsTouched += 1
      }
      continue
    }

    // Other signals: add the new operational-guidance section
    const config = NEW_SECTIONS[signal.id]
    if (!config) continue

    const newSection = {
      id: 'operational-guidance',
      title: config.title,
      bodyMarkdown: config.body,
      attribution: toAttribution(findSource(sources, config.primary)),
      additionalAttributions: config.additional.map((id) => toAttribution(findSource(sources, id))),
      lastReviewed: LAST_REVIEWED,
    }

    if (!signal.detailSections) signal.detailSections = []
    // Replace if already present, otherwise append
    const existingIdx = signal.detailSections.findIndex((s) => s.id === 'operational-guidance')
    if (existingIdx >= 0) {
      signal.detailSections[existingIdx] = newSection
    } else {
      signal.detailSections.push(newSection)
    }
    sectionsAdded += 1
  }

  writeFileSync(SIGNALS_PATH, JSON.stringify(signals, null, 2) + '\n')
  console.log(`[seed-attribution] updated ${sectionsTouched} hantavirus sections; added ${sectionsAdded} new sections`)
}

main()
