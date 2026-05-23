/**
 * EMERGENZ Biosecurity Intel Dashboard — Triage Card Seeder
 *
 * Seeds triageCard fields for 5 signals with publicly available CDC/WHO
 * clinical case definitions and isolation guidance. Per CONTENT-STANDARDS §7.1:
 *   - All clinical content must be sourced to a specific authoritative document
 *   - URLs must point to the SPECIFIC guidance page, not a general homepage
 *   - lastReviewed must be set to the date this card was verified against source
 *   - No clinical advice is invented — every line traces to the cited source
 *
 * Sources used:
 *   - CDC Measles: cdc.gov/measles/hcp/clinical-overview/index.html
 *   - CDC Bird Flu (H5): cdc.gov/bird-flu/hcp/clinical-care/
 *   - CDC Ebola (Bundibugyo): cdc.gov/vhf/ebola/clinicians/index.html
 *   - CDC Mpox Clade I: cdc.gov/poxvirus/mpox/clinicians/clinical-recognition.html
 *   - CDC Lassa Fever: cdc.gov/vhf/lassa/healthcare-workers/
 *
 * Idempotent: re-running replaces existing triageCard fields.
 */

import { readFileSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const signals = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8'))

const LAST_REVIEWED = '2026-05-23'

function patch(id, triageCard) {
  const idx = signals.findIndex(s => s.id === id)
  if (idx === -1) throw new Error(`Signal not found: ${id}`)
  signals[idx] = { ...signals[idx], triageCard }
  console.log(`  ✓ seeded triage card on ${id}`)
}

// ── Measles ─────────────────────────────────────────────────────────────────
// CDC Clinical Overview, https://www.cdc.gov/measles/hcp/clinical-overview/index.html
patch('measles-us-2026', {
  whenToSuspect: [
    { label: 'Fever ≥38.3°C (101°F)', detail: 'with prodromal onset 7–14 days post-exposure' },
    { label: 'Cough, coryza, or conjunctivitis ("3 Cs")', detail: 'classic prodrome' },
    { label: 'Koplik spots', detail: 'bluish-white papules on buccal mucosa, pathognomonic but transient' },
    { label: 'Maculopapular rash', detail: 'beginning at hairline, spreading cephalocaudally 3–5 days after prodrome onset' },
  ],
  exposureCriteria: [
    { label: 'Unvaccinated or under-vaccinated', detail: '<2 MMR doses or unknown status' },
    { label: 'Recent travel', detail: 'to country with active transmission, or US outbreak jurisdiction' },
    { label: 'Contact with confirmed case', detail: 'within preceding 7–21 days' },
    { label: 'Healthcare or congregate setting', detail: 'school, daycare, religious community gathering' },
  ],
  isolation: 'Airborne precautions — single negative-pressure room (AIIR). Patient masking on transit. Maintain isolation from rash onset through day 4 of rash.',
  ppe: 'N95 respirator (fit-tested), eye protection, gown, gloves. Only MMR-immune staff should enter the room when possible.',
  initialActions: [
    'Place patient immediately in airborne isolation room — do NOT triage in shared waiting area',
    'Notify Infection Prevention / Hospital Epidemiology STAT',
    'Collect specimens for measles IgM serology, RT-PCR (NP swab + urine), and viral culture if available',
    'Document vaccination history including dates and dose count',
    'Begin contact tracing list — all unmasked individuals within 6 feet during the patient\'s infectious period',
    'Administer vitamin A per CDC pediatric dosing if child <2 years (50,000–200,000 IU based on age)',
  ],
  notify: [
    { party: 'Hospital Infection Prevention', contact: 'Internal escalation per facility protocol', timing: 'Immediately on suspicion' },
    { party: 'State / Local Health Department', contact: 'Use cdc.gov/publichealthgateway directory', timing: 'Same day, before laboratory confirmation' },
    { party: 'CDC Emergency Operations Center', contact: '770-488-7100 (24h)', timing: 'For confirmed cases, complex situations, or specimen submission guidance' },
  ],
  treatmentSummary:
    'No specific antiviral therapy. Supportive care: antipyretics, IV hydration if dehydrated, ' +
    'and vitamin A supplementation (WHO/CDC recommendation regardless of nutritional status in ' +
    'hospitalized children). Post-exposure prophylaxis for susceptible contacts: MMR within ' +
    '72 hours of exposure, or immune globulin within 6 days. Watch for complications: pneumonia, ' +
    'otitis media, encephalitis (rare, ~1/1000 cases).',
  sourceAuthority: 'CDC',
  sourceTitle: 'Measles (Rubeola) — Clinical Overview for Healthcare Providers',
  sourceUrl: 'https://www.cdc.gov/measles/hcp/clinical-overview/index.html',
  lastReviewed: LAST_REVIEWED,
})

// ── Avian Influenza H5 ──────────────────────────────────────────────────────
// CDC Clinical Care, https://www.cdc.gov/bird-flu/hcp/clinical-care/
patch('avian-influenza-h5-2026', {
  whenToSuspect: [
    { label: 'Acute respiratory illness with fever', detail: 'cough, sore throat, dyspnea' },
    { label: 'Conjunctivitis', detail: 'common presentation in H5N1 human cases, sometimes the ONLY sign' },
    { label: 'Pneumonia or ARDS', detail: 'rapid progression to severe lower respiratory tract disease possible' },
    { label: 'GI symptoms', detail: 'diarrhea reported in subset of H5N1 cases' },
  ],
  exposureCriteria: [
    { label: 'Direct contact with sick or dead birds', detail: 'poultry, wild birds, including bird droppings' },
    { label: 'Direct contact with dairy cattle', detail: 'or unpasteurized milk from H5-affected herds' },
    { label: 'Occupational exposure', detail: 'poultry/dairy worker, veterinarian, culler, wildlife responder' },
    { label: 'Visit to live bird market', detail: 'in country with documented H5 circulation' },
  ],
  isolation: 'Place in single-patient airborne isolation room (AIIR). Standard, Contact, AND Airborne Precautions per CDC pending characterization. Limit transport.',
  ppe: 'N95 respirator (or PAPR), eye protection (face shield or goggles), gown, gloves. Hand hygiene before donning and after doffing.',
  initialActions: [
    'Place patient in airborne isolation immediately — do NOT delay for triage',
    'Collect NP swab AND oropharyngeal swab; conjunctival swab if conjunctivitis present',
    'Place specimens in viral transport media; coordinate with state public health lab',
    'Document exposure history: bird/animal contact, dairy operations, raw milk, occupation',
    'Initiate empiric oseltamivir 75 mg BID (adult dose) without waiting for confirmation if illness compatible',
    'Notify state health department BEFORE testing — they coordinate CDC specimen receipt',
  ],
  notify: [
    { party: 'State Public Health Laboratory', contact: 'Via state DOH on-call epidemiologist', timing: 'BEFORE collecting specimens — they specify packaging/routing' },
    { party: 'Hospital Infection Prevention', contact: 'Internal escalation', timing: 'Concurrent with state DOH notification' },
    { party: 'CDC Emergency Operations Center', contact: '770-488-7100 (24h)', timing: 'For severe cases, healthcare worker exposure, or unusual presentations' },
  ],
  treatmentSummary:
    'Empiric oseltamivir (Tamiflu) 75 mg BID × 5 days for adults; weight-based pediatric dosing. ' +
    'Treatment most effective within 48 hours of symptom onset but should be initiated regardless of ' +
    'duration in severe cases. Peramivir or baloxavir are alternatives. Supportive care for ARDS may ' +
    'require ECMO. Antiviral post-exposure prophylaxis (oseltamivir 75 mg daily × 10 days) for high-risk ' +
    'exposed contacts. All current US H5 isolates remain oseltamivir-sensitive (per CDC, May 2026).',
  sourceAuthority: 'CDC',
  sourceTitle: 'H5N1 Bird Flu — Clinical Care Guidance for Healthcare Providers',
  sourceUrl: 'https://www.cdc.gov/bird-flu/hcp/clinical-care/',
  lastReviewed: LAST_REVIEWED,
})

// ── Ebola Bundibugyo ────────────────────────────────────────────────────────
// CDC Clinicians, https://www.cdc.gov/vhf/ebola/clinicians/index.html
patch('ebola-bundibugyo-drc-2026', {
  whenToSuspect: [
    { label: 'Fever ≥38.0°C (100.4°F)', detail: 'AND compatible travel/exposure within 21 days' },
    { label: 'Severe headache, myalgia, weakness', detail: 'early prodrome, days 1–3 of illness' },
    { label: 'GI symptoms', detail: 'vomiting, diarrhea, abdominal pain — typically day 3–5' },
    { label: 'Unexplained hemorrhage', detail: 'late finding (day 5+), but absence does NOT exclude Ebola' },
  ],
  exposureCriteria: [
    { label: 'Travel to outbreak area', detail: 'Democratic Republic of the Congo (eastern provinces), Uganda border regions' },
    { label: 'Contact with confirmed or suspected case', detail: 'including bodily fluids, within 21 days' },
    { label: 'Healthcare worker in affected facility', detail: 'or returned from outbreak response deployment' },
    { label: 'Attended funeral / handled remains', detail: 'in outbreak area within 21 days' },
  ],
  isolation: 'Single-patient room with private bathroom (or covered commode). Door closed. Restrict entry to essential personnel with documented training. Refer suspected cases to designated Ebola treatment center as soon as safely possible.',
  ppe: 'Per CDC tiered guidance: impermeable gown OR coverall, double gloves, full face shield + N95 respirator OR PAPR, surgical hood, apron, boot covers. Trained observer for ALL donning/doffing.',
  initialActions: [
    'Implement isolation immediately on suspicion — defer all elective procedures',
    'Limit caregivers to designated trained team; maintain entry/exit log',
    'Notify state DOH and CDC EOC BEFORE collecting any specimens',
    'DO NOT collect specimens until CDC/state lab specifies routing — improper handling has injured personnel',
    'Manage acutely ill patients with aggressive fluid resuscitation; correct electrolytes',
    'Begin clinical investigation for differential diagnoses: malaria, typhoid, Lassa, other VHFs',
  ],
  notify: [
    { party: 'State / Local Health Department', contact: 'On-call epidemiologist (24h)', timing: 'IMMEDIATELY on suspicion — before specimen collection' },
    { party: 'CDC Emergency Operations Center', contact: '770-488-7100 (24h)', timing: 'IMMEDIATELY; CDC coordinates testing, treatment, and patient routing' },
    { party: 'Hospital Infection Prevention / Bioemergency Team', contact: 'Internal protocol', timing: 'Concurrent — full facility-wide alert' },
    { party: 'Regional Ebola Treatment Center', contact: 'Via state DOH for the nearest of 10 designated US RETCs', timing: 'For confirmed cases — patient transfer to a RETC is the goal' },
  ],
  treatmentSummary:
    'Bundibugyo ebolavirus: NO licensed vaccine specific to Bundibugyo (rVSV-ZEBOV cross-protection ' +
    'uncertain). NO FDA-approved Bundibugyo-specific therapeutic. Treatment is aggressive supportive ' +
    'care: IV crystalloids, electrolyte correction, blood products for coagulopathy, treatment of ' +
    'co-infections (malaria, bacterial sepsis), respiratory support. Investigational monoclonal ' +
    'antibody cocktails (Inmazeb, Ebanga) are licensed for Zaire ebolavirus only — cross-reactivity ' +
    'with Bundibugyo is incomplete; consult CDC for compassionate-use guidance.',
  sourceAuthority: 'CDC',
  sourceTitle: 'Ebola — Information for Healthcare Providers',
  sourceUrl: 'https://www.cdc.gov/vhf/ebola/clinicians/index.html',
  lastReviewed: LAST_REVIEWED,
})

// ── Mpox Clade I ────────────────────────────────────────────────────────────
// CDC, https://www.cdc.gov/poxvirus/mpox/clinicians/clinical-recognition.html
patch('mpox-africa-clade-i-2026', {
  whenToSuspect: [
    { label: 'New characteristic rash', detail: 'firm, deep-seated, well-circumscribed, often umbilicated lesions; all in same stage of development' },
    { label: 'Fever, lymphadenopathy', detail: 'prodrome 1–4 days before rash (lymphadenopathy is distinguishing feature vs varicella)' },
    { label: 'Anogenital or oral lesions', detail: 'common in current outbreak; may be the only manifestation' },
    { label: 'Lesion morphology progression', detail: 'macule → papule → vesicle → pustule → umbilicated → scab over 2–4 weeks' },
  ],
  exposureCriteria: [
    { label: 'Travel to Clade I endemic/outbreak area', detail: 'DRC, Burundi, Republic of Congo, Central African Republic within 21 days' },
    { label: 'Close skin-to-skin contact', detail: 'with confirmed case, including sexual contact, within 21 days' },
    { label: 'Contact with infected animal', detail: 'rodents, primates — bite, scratch, contact with body fluids' },
    { label: 'Healthcare worker exposure', detail: 'patient contact without appropriate PPE' },
  ],
  isolation: 'Standard, Contact, AND Droplet Precautions. Single-patient room with door closed; private bathroom. Use AIIR for procedures generating aerosols (intubation, extubation).',
  ppe: 'Gown, gloves, eye protection (face shield or goggles), and N95 respirator (or higher) for room entry. Hand hygiene before donning, after doffing.',
  initialActions: [
    'Place patient in isolation with door closed — masked, covered lesions if transport unavoidable',
    'Photograph and document lesion distribution, stages, and number',
    'Collect lesion specimens (two swabs per lesion site, two lesion sites) — vigorous swabbing of lesion surface or roof',
    'Place swabs in dry sterile container or viral transport media per state lab guidance',
    'Document sexual history, travel history, and contact list',
    'Counsel patient on isolation requirements until all lesions have crusted, scabbed, and re-epithelialized',
  ],
  notify: [
    { party: 'State / Local Health Department', contact: 'On-call epidemiologist', timing: 'Same day on suspicion' },
    { party: 'CDC Emergency Operations Center', contact: '770-488-7100 (24h)', timing: 'For Clade I suspicion, severe cases, or treatment access (tecovirimat IND)' },
    { party: 'Hospital Infection Prevention', contact: 'Internal protocol', timing: 'Same day' },
  ],
  treatmentSummary:
    'Most cases resolve without specific therapy. Tecovirimat (TPOXX) is available under CDC ' +
    'Expanded Access IND for severe mpox or patients at risk of severe disease (immunocompromised, ' +
    'pediatric <8 years, pregnant, lesions in vulnerable anatomic sites). Brincidofovir and ' +
    'vaccinia immune globulin are alternatives. Supportive care: pain control, secondary bacterial ' +
    'infection prevention, hydration. Post-exposure prophylaxis with JYNNEOS vaccine within 4 days ' +
    'of exposure (up to 14 days may still attenuate disease).',
  sourceAuthority: 'CDC',
  sourceTitle: 'Mpox — Clinical Recognition',
  sourceUrl: 'https://www.cdc.gov/poxvirus/mpox/clinicians/clinical-recognition.html',
  lastReviewed: LAST_REVIEWED,
})

// ── Lassa Fever ─────────────────────────────────────────────────────────────
// CDC, https://www.cdc.gov/vhf/lassa/healthcare-workers/
patch('lassa-fever-2026', {
  whenToSuspect: [
    { label: 'Fever ≥38.0°C', detail: 'gradual onset, often with malaise, headache, myalgia — days 1–4' },
    { label: 'Pharyngitis with exudate', detail: 'sore throat is prominent and often severe' },
    { label: 'Retrosternal chest pain, cough', detail: 'days 3–5' },
    { label: 'Facial / neck edema', detail: 'severe cases; deafness in convalescence (~25% of survivors)' },
    { label: 'Bleeding from mucous membranes', detail: 'late finding (day 6+) — gums, GI, vaginal' },
  ],
  exposureCriteria: [
    { label: 'Travel to West Africa', detail: 'Nigeria, Sierra Leone, Liberia, Guinea, Benin, Togo within 21 days' },
    { label: 'Rodent exposure', detail: 'Mastomys natalensis — contact with rodent urine/feces, contaminated food' },
    { label: 'Contact with confirmed case', detail: 'including healthcare exposure to body fluids' },
    { label: 'Healthcare worker in endemic area', detail: 'or returned from outbreak deployment' },
  ],
  isolation: 'Single-patient room with private bathroom. Restrict entry. Treat as VHF — refer to designated treatment center for confirmed cases. Door closed.',
  ppe: 'Per CDC VHF guidance: impermeable gown or coverall, double gloves, full face shield + N95 (or PAPR), surgical hood, apron, boot covers. Trained observer for donning/doffing.',
  initialActions: [
    'Implement VHF isolation precautions immediately on suspicion',
    'Notify state DOH and CDC EOC BEFORE specimen collection',
    'Initiate empiric ribavirin if Lassa strongly suspected — early treatment (≤6 days) markedly reduces mortality',
    'Aggressive fluid management; monitor for ARDS, renal failure, coagulopathy',
    'Investigate differential: malaria, typhoid, Ebola/Marburg, leptospirosis, rickettsial disease',
    'Begin contact tracing — household, healthcare workers, fellow travelers',
  ],
  notify: [
    { party: 'State / Local Health Department', contact: 'On-call epidemiologist (24h)', timing: 'IMMEDIATELY on suspicion' },
    { party: 'CDC Emergency Operations Center', contact: '770-488-7100 (24h)', timing: 'IMMEDIATELY — CDC provides testing, ribavirin access, transfer guidance' },
    { party: 'Hospital Infection Prevention / Bioemergency Team', contact: 'Internal protocol', timing: 'Concurrent — facility-wide VHF response' },
  ],
  treatmentSummary:
    'Ribavirin IV is the established treatment: loading 30 mg/kg IV, then 16 mg/kg q6h × 4 days, ' +
    'then 8 mg/kg q8h × 6 days. Treatment within 6 days of symptom onset reduces case fatality from ' +
    '~55% to <5% in severe cases. Aggressive supportive care: fluid management, electrolyte ' +
    'correction, blood products for coagulopathy, hemodialysis if renal failure. Post-exposure ' +
    'prophylaxis (oral ribavirin) is sometimes used for high-risk percutaneous exposures (consult CDC). ' +
    'No licensed Lassa vaccine.',
  sourceAuthority: 'CDC',
  sourceTitle: 'Lassa Fever — Information for Healthcare Workers',
  sourceUrl: 'https://www.cdc.gov/vhf/lassa/healthcare-workers/',
  lastReviewed: LAST_REVIEWED,
})

// ── Write ──────────────────────────────────────────────────────────────────
writeFileSync(SIGNALS_PATH, JSON.stringify(signals, null, 2) + '\n')
console.log(`\n[seed-triage-cards] done — wrote ${SIGNALS_PATH}`)
