#!/usr/bin/env node
/**
 * One-time seeder — bring non-hantavirus signals to section parity with
 * the hantavirus signal (5 sections each).
 *
 * Each signal previously had 3 sections (2 thematic + 1 operational-guidance).
 * This adds 2 more thematic sections per signal, totaling 5. Sections are
 * inserted BEFORE the operational-guidance section so the rendered order
 * groups clinical/operational content first.
 *
 * Per CONTENT-STANDARDS.md §7.1, all clinical content is manually authored.
 * Bodies are factual and source-grounded; specifics cite the primary source
 * inline so reviewers can verify quickly.
 *
 * Run once: node scripts/parity-signal-sections.mjs
 */

import { readFileSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const SOURCES_PATH = 'src/data/signal-sources.json'
const LAST_REVIEWED = '2026-05-21'

const NEW_SECTIONS = {
  // ===========================================================================
  // Ebola Bundibugyo (existing: clinical-profile, ppe-and-isolation, operational-guidance)
  // ===========================================================================
  'ebola-bundibugyo-drc-2026': [
    {
      id: 'laboratory-diagnostics',
      title: 'Laboratory diagnostics',
      body: `RT-PCR for ebolavirus is the gold-standard diagnostic for acute Ebola disease, typically becoming positive within 3 days of symptom onset. Antigen-capture ELISA and IgM serology become positive later in illness. Specimens may be persistently positive in convalescent blood, semen, breast milk, ocular fluid, and CNS for extended periods after recovery (CDC; WHO).

All specimen handling for known or suspected Ebola requires BSL-4 containment for live virus and BSL-3 containment with inactivation for diagnostic work. Routine clinical laboratories should not process Ebola specimens; coordinate with the state public health laboratory and the Laboratory Response Network (LRN) before any specimen collection. CDC Emergency Operations Center: 770-488-7100.

Acceptable diagnostic specimens include EDTA whole blood (preferred), serum, and oral or buccal swabs in cases where blood draw is contraindicated. Specimens are shipped as Category A Infectious Substance (UN2814) — shippers must be IATA-trained and certified, and the receiving facility must be notified in advance.

Differential diagnosis includes malaria (especially in returning travelers from endemic regions), typhoid fever, Lassa fever, Marburg disease, and yellow fever. Empiric antimalarials should be considered while awaiting confirmatory testing in patients with appropriate exposure history.`,
      primary: 'cdc-current-outbreaks',
      additional: ['who-disease-outbreak-news', 'africa-cdc-outbreaks'],
    },
    {
      id: 'ems-transport-protocols',
      title: 'EMS transport protocols',
      body: `Pre-notification of the receiving facility is mandatory for any suspected Ebola case. The receiving facility must have time to activate VHF protocols, prepare an airborne infection isolation room (AIIR), assemble the donning/doffing trained team, and arrange dedicated equipment before patient arrival.

EMS vehicles transporting suspected cases require thorough decontamination per agency biosafety SOP after the run. The cabin should be sealed during transport; minimize the number of personnel in the patient compartment; document all personnel with direct or indirect patient contact for the duration of the run.

Personnel transporting suspected cases must be in full PPE before patient contact and maintain PPE throughout the run. Doffing occurs only at the receiving facility under trained-observer supervision in a designated doffing area. PPE waste is handled as Category A regulated medical waste per UN2814 shipping requirements.

After completion, all involved personnel are tracked for 21 days through occupational health, monitored daily for symptoms, and excluded from direct patient care pending occupational health risk assessment. Coordinate exposure response with the state health department and the receiving facility's infection prevention team.`,
      primary: 'cdc-han',
      additional: ['cdc-current-outbreaks'],
    },
  ],

  // ===========================================================================
  // Measles US (existing: clinical-profile, post-exposure-prophylaxis, operational-guidance)
  // ===========================================================================
  'measles-us-2026': [
    {
      id: 'school-and-childcare-response',
      title: 'School and childcare response',
      body: `Exposed contacts without evidence of immunity must be excluded from school, childcare, healthcare work, and shared communal settings from day 5 through day 21 after the last exposure per CDC guidance. The exclusion window starts day 5 post-exposure (matching the typical infectious-period onset) and ends day 21 (the outer bound of incubation).

Schools and childcare facilities should review immunization records during active community transmission and require documentation of immunity for continued attendance per state law. States vary in their handling of philosophical and religious exemptions; verify current state policy with the local health department.

School closure is considered only when transmission cannot be controlled through case isolation, contact exclusion, and targeted vaccination. Most outbreaks can be contained without facility closure; closure is typically reserved for situations where vaccination coverage in the school community is severely below herd-immunity threshold (CDC).

Healthcare-worker immunity verification is critical; non-immune HCWs exposed during outbreaks should be furloughed from direct patient care during the exclusion window. Coordinate with occupational health, infection prevention, and the state health department for management of exposed staff.`,
      primary: 'cdc-han',
      additional: ['cdc-current-outbreaks'],
    },
    {
      id: 'surveillance-and-reporting',
      title: 'Surveillance and reporting',
      body: `Measles is a nationally notifiable condition in all 50 states. Any suspected case must be reported immediately to the local or state health department, typically by phone, with formal case report submission within 24 hours per state regulations. Public health response includes contact tracing, source investigation, and active surveillance of exposed populations (CDC).

Diagnosis is confirmed by serology (measles-specific IgM) or RT-PCR on a nasopharyngeal or oropharyngeal swab plus urine specimen. Specimens should be collected as soon as possible after rash onset for highest sensitivity. Specimens are sent to the state public health laboratory; CDC provides genotyping for outbreak investigation and source attribution.

Genotype assignment is essential for distinguishing imported cases from endemic transmission (the US declared measles eliminated in 2000; sustained transmission greater than 12 months would constitute loss of elimination status). Most current US cases are linked to importation followed by local transmission in under-vaccinated communities.

State health departments coordinate with CDC for cluster investigation, vaccination campaign deployment, and communication to clinicians and the public. The Vaccines for Children (VFC) program and state immunization registries support outbreak vaccination response. Verify current case-count thresholds and reporting timelines with your state's Communicable Disease Branch.`,
      primary: 'cdc-current-outbreaks',
      additional: ['cdc-han'],
    },
  ],

  // ===========================================================================
  // Mpox Clade I (existing: clinical-profile, infection-prevention, operational-guidance)
  // ===========================================================================
  'mpox-africa-clade-i-2026': [
    {
      id: 'laboratory-diagnostics',
      title: 'Laboratory diagnostics',
      body: `Real-time PCR on lesion material (vesicle fluid, lesion exudate, or lesion crust) is the gold-standard diagnostic for mpox. Two swabs per lesion from 2-3 distinct lesions are typical; samples are placed in viral transport medium and shipped to the state public health laboratory or LRN reference lab (CDC).

Specimen collection requires standard, contact, and droplet PPE; airborne PPE is recommended for any procedure likely to disturb lesions. Swabs are vigorous; avoid de-roofing intact vesicles. Specimens from active lesions are far more sensitive than blood or serology, which are not reliable for acute diagnosis.

Clade differentiation (clade I vs clade IIb) requires sequencing or specific clade-targeted assays beyond initial mpox PCR. The state public health laboratory coordinates clade differentiation with CDC; specifically request clade typing for any positive case to inform outbreak attribution and public health response.

Serology may be useful for retrospective diagnosis or population studies but is not reliable for acute care given orthopoxvirus cross-reactivity. Coordinate testing with CDC and your state's LRN reference laboratory.`,
      primary: 'cdc-current-outbreaks',
      additional: ['who-disease-outbreak-news'],
    },
    {
      id: 'travel-and-importation-risk',
      title: 'Travel and importation risk',
      body: `CDC has issued travel health notices for countries with active clade I transmission. Travelers from active clade I outbreak zones presenting with characteristic rash within 21 days of return should be evaluated using CDC clinical criteria. The 21-day window accounts for the upper bound of incubation (CDC; WHO).

Ports of entry are not actively screening travelers for mpox; reliance is on clinical alertness, traveler health education, and post-arrival self-monitoring. EMS providers and emergency department clinicians serving major airports and international ports should maintain a high index of suspicion for returning travelers with characteristic presentation.

CDC's monitoring includes voluntary contact tracing for confirmed cases, partner notification, and outreach to high-risk populations. State health departments coordinate with CDC for travel-related case management and JYNNEOS vaccine deployment to identified close contacts.

For clinicians: suspected case management includes immediate isolation, single-patient room with private bathroom, PPE per CDC guidance, prompt PCR testing on lesion material, and notification of the state health department. Tecovirimat (TPOXX) is available under expanded-access protocols for severe disease or high-risk patients; coordinate access through CDC.`,
      primary: 'cdc-current-outbreaks',
      additional: ['who-disease-outbreak-news'],
    },
  ],

  // ===========================================================================
  // Avian flu H5 (existing: human-clinical-profile, occupational-exposure, operational-guidance)
  // ===========================================================================
  'avian-influenza-h5-2026': [
    {
      id: 'one-health-surveillance',
      title: 'One Health surveillance coordination',
      body: `Coordinated surveillance of avian influenza H5 spans animal, environmental, and human health domains. USDA APHIS operates animal-health surveillance (commercial poultry, dairy herds, wildlife testing); CDC coordinates human surveillance through state public health laboratories and the Influenza Risk Assessment Tool (IRAT); WOAH WAHIS aggregates global animal-health intelligence.

In April 2024, USDA issued a federal order requiring mandatory testing of lactating dairy cattle moving interstate to support outbreak surveillance and contain spread. State agriculture and health departments coordinate joint farm investigations, worker exposure tracking, and risk communication. The arrangement formalizes One Health collaboration that had previously been case-by-case.

Wastewater surveillance for influenza A is conducted by CDC NWSS and WastewaterSCAN at select sites. Influenza A signal in wastewater above expected seasonal baseline can indicate either circulating human seasonal influenza or spillover from animal sources; subtyping is typically not done routinely in wastewater but is increasing in capability.

Verify current surveillance findings through USDA APHIS, CDC IRAT updates, and WOAH WAHIS. Multi-source surveillance integration informs the IRAT's probability and severity scores, which guide pandemic preparedness planning.`,
      primary: 'usda-aphis-hpai',
      additional: ['cdc-current-outbreaks', 'woah-wahis'],
    },
    {
      id: 'laboratory-diagnostics',
      title: 'Laboratory diagnostics',
      body: `Routine respiratory viral panels typically detect influenza A but do not reliably subtype H5. Suspected H5 cases require dedicated H5-specific RT-PCR, which is performed at state public health laboratories (Laboratory Response Network) with confirmation at CDC. Suspected case identification triggers prioritized state-to-CDC specimen transfer (CDC).

Acceptable specimens include nasopharyngeal swab in viral transport medium, lower-respiratory specimens (sputum, bronchoalveolar lavage) for severely ill patients, and conjunctival swab for patients with conjunctivitis (notable in recent US dairy-worker cases). Specimens should be collected as early as possible after symptom onset.

Antiviral resistance monitoring is conducted on positive specimens through CDC's neuraminidase inhibitor and cap-dependent endonuclease inhibitor resistance surveillance programs. Resistance to current treatments (oseltamivir, baloxavir) has been rare in H5 isolates to date but warrants ongoing monitoring as use expands.

Coordinate suspected case testing with the state epidemiologist and CDC EOC (770-488-7100) before specimen collection. Routine reflex H5 testing of all positive influenza A specimens is not standard at most clinical laboratories; explicit subtyping request is required.`,
      primary: 'cdc-current-outbreaks',
      additional: ['who-disease-outbreak-news', 'usda-aphis-hpai'],
    },
  ],

  // ===========================================================================
  // Cholera Africa (existing: clinical-management, oral-cholera-vaccine, operational-guidance)
  // ===========================================================================
  'cholera-africa-2026': [
    {
      id: 'wash-interventions',
      title: 'WASH interventions',
      body: `Water, Sanitation, and Hygiene (WASH) interventions are foundational to cholera outbreak control alongside case management and vaccination. WHO and UNICEF coordinate WASH response with country MoH, MSF, IFRC, and partner NGOs. Priority interventions include safe water supply, latrine construction, hand hygiene promotion, household water treatment, and oral rehydration corners (WHO).

Safe water supply uses chlorination of household water (typically with sodium hypochlorite tablets or solution dosed for typical household volumes), point-of-use filtration, or bulk-chlorinated municipal supply where feasible. In IDP camps and displacement settings, chlorinated water distribution points are established with documented dosing.

Latrine coverage targets vary by context but typically aim for 1 latrine per 20 persons in stable refugee camps and adjust for emergency phases. Latrine siting requires safe distance from water sources (minimum 30 meters), gender-separated facilities, and night-lighting for security. Coordinate latrine construction with the camp management agency and the host MoH.

Hygiene promotion focuses on handwashing with soap before food preparation, before eating, after defecation, and after caring for sick people. Communication channels include community health workers, household visits, posters, radio, and through religious and community leaders. Adapt messaging to the local language and cultural context.`,
      primary: 'who-disease-outbreak-news',
      additional: ['paho-epi-alerts', 'africa-cdc-outbreaks'],
    },
    {
      id: 'outbreak-response-coordination',
      title: 'Outbreak response coordination',
      body: `Country-led cholera response is coordinated by the National Ministry of Health, with WHO providing technical assistance and convening the International Coordinating Group (ICG) on Vaccine Provision for OCV stockpile decisions. UNICEF supports WASH, child health, and supply-chain logistics. MSF operates Cholera Treatment Centres (CTCs) and Cholera Treatment Units (CTUs) in many high-burden settings (WHO).

The Global Task Force on Cholera Control (GTFCC), hosted by WHO, coordinates international cholera response, technical guidance, and the Ending Cholera 2030 roadmap. GTFCC supports country preparedness, OCV deployment planning, and surveillance harmonization.

Activation of the ICG OCV stockpile follows a country request, ICG review, and dispatch from regional stocks. Activation triggers include confirmed outbreak with sustained transmission, high case-fatality, or sustained risk in vulnerable populations (IDP camps, conflict zones, post-disaster). Average decision-to-dispatch is typically 7-14 days.

For US clinicians receiving travelers from cholera-endemic regions: cholera is a nationally notifiable condition. Coordinate with the state health department for case reporting, treatment with rapid rehydration and azithromycin or doxycycline (where susceptible), and rapid diagnostic testing through sentinel and reference laboratories.`,
      primary: 'who-disease-outbreak-news',
      additional: ['africa-cdc-outbreaks', 'paho-epi-alerts'],
    },
  ],

  // ===========================================================================
  // Seasonal flu (existing: clinical-management, surveillance-methods, operational-guidance)
  // ===========================================================================
  'seasonal-influenza-2026': [
    {
      id: 'vaccine-strategy',
      title: 'Vaccine strategy',
      body: `Annual seasonal influenza vaccine composition is announced by WHO each February for the Northern Hemisphere season (October-March) and each September for the Southern Hemisphere season. The composition is informed by the WHO Global Influenza Surveillance and Response System (GISRS) collaborating centres and reflects expected circulating strains based on the prior season's surveillance (WHO; CDC).

Trivalent and quadrivalent formulations are licensed in the United States. ACIP recommends annual vaccination for all persons aged 6 months and older without contraindications, with particular emphasis on high-risk populations (adults 65+, pregnant patients, immunocompromised, chronic conditions, healthcare personnel).

High-dose and adjuvanted vaccines are licensed for adults aged 65 and older to address age-related immune senescence; ACIP recommends preferential use of these enhanced formulations where available. Cell-based and recombinant vaccines provide alternatives for patients with egg allergy and for accelerated production timelines.

Vaccine effectiveness varies year over year based on antigenic match. CDC publishes interim vaccine effectiveness estimates during the season through MMWR. Verify current ACIP recommendations and the season's interim VE estimates with CDC FluView before patient counseling.`,
      primary: 'cdc-fluview',
      additional: ['cdc-respiratory-viruses'],
    },
    {
      id: 'antiviral-stewardship',
      title: 'Antiviral stewardship',
      body: `Neuraminidase inhibitors (oseltamivir, zanamivir, peramivir) and the cap-dependent endonuclease inhibitor baloxavir are the licensed antivirals for influenza. CDC and IDSA recommend treatment for hospitalized patients, severe or progressive illness, and high-risk outpatients regardless of vaccination status. Treatment is most effective when initiated within 48 hours of symptom onset (CDC; IDSA).

Oseltamivir is the most-used influenza antiviral worldwide; it is available in oral capsule and suspension formulations and is licensed for treatment from 2 weeks of age and for prophylaxis from 3 months. Baloxavir is a single-dose oral agent licensed for treatment of acute uncomplicated influenza in patients 5 years and older.

Antiviral chemoprophylaxis can be considered for high-risk close contacts in long-term-care facility outbreaks and during institutional outbreaks where vaccination cannot be relied upon. CDC recommends vaccination as the primary prevention strategy and treats antivirals as a treatment tool, not a substitute for vaccination.

Resistance to oseltamivir has been documented historically for certain H1N1 strains; CDC publishes current circulating-strain antiviral resistance through FluView. Verify resistance patterns before treatment selection in cases of suspected antiviral failure.`,
      primary: 'cdc-fluview',
      additional: ['cdc-respiratory-viruses'],
    },
  ],

  // ===========================================================================
  // COVID wastewater (existing: methodology, interpretation, operational-guidance)
  // ===========================================================================
  'covid-wastewater-2026': [
    {
      id: 'variant-tracking',
      title: 'Variant tracking',
      body: `Sequencing of wastewater samples enables early detection of SARS-CoV-2 variants and lineages before clinical case sequencing accumulates sufficient statistical power. CDC NWSS and WastewaterSCAN both support amplicon-based and metagenomic sequencing approaches for variant surveillance (CDC NWSS).

Variant detection in wastewater typically precedes peak clinical reporting by 2-4 weeks; this lead time is most pronounced during periods of low clinical sequencing volume. Wastewater sequencing can identify novel variants weeks before they accumulate in clinical surveillance, providing early situational awareness for public health response.

Wastewater variant data is not equivalent to a population-prevalence estimate. The signal reflects the mix of variants shedding into the sampled wastewater catchment area, weighted by the relative shedding rates of each variant, sampling and processing methodology, and stochastic variation. Interpret as a relative-frequency signal rather than absolute prevalence.

CDC and WHO collaborate with national reference labs and academic sequencing consortia for variant nomenclature (Pango lineages, WHO Greek-letter designations) and signal-to-clinical correlation. Verify variant detections through CDC NWSS dashboards before clinical interpretation; cross-reference with clinical sequencing data from GISAID where available.`,
      primary: 'cdc-nwss',
      additional: ['wastewaterscan'],
    },
    {
      id: 'clinical-integration',
      title: 'Clinical surveillance integration',
      body: `Wastewater surveillance is most operationally valuable when integrated with conventional clinical surveillance signals: ED visit data, hospital admissions, ICU census, ventilator availability, and laboratory case counts. Combined signals provide earlier and more reliable surge prediction than any single data stream (CDC NWSS).

CDC's COVID Data Tracker integrates wastewater concentration trends alongside ED visits, hospital admissions, and emergency department visits for COVID-19-like illness. State health departments operate parallel integrated dashboards for jurisdictional planning. EMS and hospital preparedness teams use the integrated picture to align PPE, staffing, and bed capacity to forthcoming demand.

Lead time of wastewater over hospital admissions is typically 1-3 weeks in mature surveillance systems; lead time over mortality is 4-6 weeks. Local lead times vary by community testing behavior, healthcare-seeking patterns, and reporting infrastructure. Validate your jurisdiction's specific lead-time relationships before using wastewater alone for trigger thresholds.

Population-level wastewater signal does not provide individual-level diagnosis. For clinical decisions, refer to current clinical testing, vaccination guidance from ACIP/CDC, and your facility's clinical protocols. Wastewater informs the population-level question of "what will hospital demand look like in 2-4 weeks" rather than the individual question of "should this patient be tested."`,
      primary: 'cdc-nwss',
      additional: ['cdc-respiratory-viruses', 'wastewaterscan'],
    },
  ],

  // ===========================================================================
  // Norovirus wastewater (existing: clinical-profile, outbreak-response, operational-guidance)
  // ===========================================================================
  'norovirus-wastewater-2026': [
    {
      id: 'laboratory-diagnostics',
      title: 'Laboratory diagnostics',
      body: `Real-time RT-PCR on stool or vomitus specimens collected within 72 hours of symptom onset provides the highest diagnostic sensitivity for norovirus. Most US clinical laboratories detect norovirus via multiplex GI panels that include other enteric pathogens (Salmonella, Shigella, Campylobacter, EHEC, Cryptosporidium, Giardia, rotavirus, sapovirus, astrovirus, adenovirus 40/41) (CDC).

CDC's CaliciNet supports outbreak typing and genotype identification, distinguishing GI from GII strains and tracking circulating genotypes. CaliciNet specimens are forwarded from state public health laboratories with appropriate epidemiologic linkage. Real-time outbreak typing informs identification of novel emergent strains and outbreak source attribution.

Wastewater surveillance through WastewaterSCAN measures community-level norovirus circulation independent of clinical reporting, which is highly under-ascertained for norovirus given the typically self-limited course. Wastewater signal can precede clinical reporting by several days and provides earlier situational awareness for LTCF, school, and ED preparedness.

Specimens should be collected during the symptomatic period; storage at -70 degrees C preserves viral RNA for confirmatory testing and CaliciNet typing. Coordinate clinical and outbreak specimen submission with the state public health laboratory.`,
      primary: 'cdc-current-outbreaks',
      additional: ['wastewaterscan', 'cdc-nwss'],
    },
    {
      id: 'healthcare-and-ltcf-ipc',
      title: 'Healthcare and LTCF infection prevention',
      body: `Norovirus outbreaks in long-term-care facilities, healthcare, and other congregate-living settings require rapid response: case isolation, cohorting of symptomatic and exposed asymptomatic residents, enhanced environmental cleaning, exclusion of symptomatic staff, and clear communication to residents and families (CDC).

Environmental decontamination protocols specify EPA List G disinfectants for healthcare settings. Sodium hypochlorite (bleach) at 1:50 dilution for non-porous surfaces or 1:10 for heavily contaminated areas is widely used; surface contact times specified by the EPA registration label must be followed for effectiveness. Quaternary ammonium products commonly used in healthcare have reduced efficacy against non-enveloped viruses.

Healthcare worker hand hygiene with soap and water is more effective than alcohol-based hand sanitizer against norovirus given the virus's non-enveloped structure. Education on this distinction is important for staff who default to alcohol-based hand sanitizer use; explicit policy reinforcement is recommended during outbreak periods.

Symptomatic food handlers and direct-care HCWs must be excluded from food preparation and direct patient care for 48 hours after symptom resolution per the FDA Food Code. Symptomatic visitors should be barred from the facility until 48 hours after symptom resolution. Coordinate exclusion management with occupational health and the state health department.`,
      primary: 'cdc-current-outbreaks',
      additional: ['wastewaterscan'],
    },
  ],

  // ===========================================================================
  // RSV wastewater (existing: clinical-profile, prevention, operational-guidance)
  // ===========================================================================
  'rsv-wastewater-2026': [
    {
      id: 'laboratory-diagnostics',
      title: 'Laboratory diagnostics',
      body: `Multiplex respiratory PCR panels including RSV are the recommended diagnostic approach during peak respiratory virus season. Panels typically include influenza A/B, SARS-CoV-2, RSV, parainfluenza 1-4, hMPV, adenovirus, rhinovirus/enterovirus, and others. Multiplex testing identifies co-infections that influence clinical course (CDC).

Antigen detection tests for RSV have lower sensitivity than RT-PCR and are most useful in young children where viral load is typically high. In older children and adults, antigen sensitivity is reduced; RT-PCR is preferred. Outpatient testing options include rapid antigen tests, multiplex POC PCR, and laboratory-based PCR.

Specimen of choice is a nasopharyngeal swab in viral transport medium; nasopharyngeal aspirate is acceptable in young children, and oropharyngeal swab is acceptable when NP collection is not feasible. Specimens should be transported on ice and processed within standard timeframes per the laboratory's specifications.

CDC RESP-NET conducts hospitalization-based surveillance for RSV alongside influenza and SARS-CoV-2. Wastewater RSV surveillance through CDC NWSS and WastewaterSCAN provides community-level signal that complements clinical RESP-NET data. Verify diagnostic capabilities and reporting timelines with your laboratory before peak season.`,
      primary: 'cdc-respiratory-viruses',
      additional: ['wastewaterscan'],
    },
    {
      id: 'pediatric-surge-management',
      title: 'Pediatric surge management',
      body: `RSV is the leading cause of pediatric hospitalization for lower-respiratory infection in the United States, with peak admissions during the seasonal peak (typically December-February in temperate climates). Hospitals serving children should pre-position surge plans for emergency department, inpatient, and PICU capacity (CDC; AAP).

Bronchiolitis admission criteria per AAP guidance include hypoxemia (SpO2 less than 90% on room air), severe respiratory distress (retractions, grunting, nasal flaring), dehydration or inability to maintain oral hydration, apnea, and age under 3 months with concerning clinical features. Most hospitalizations are for hydration and respiratory support, not specific antiviral therapy.

Respiratory support escalation typically proceeds through supplemental oxygen, high-flow nasal cannula (HFNC), continuous positive airway pressure (CPAP), bilevel positive airway pressure (BiPAP), and mechanical ventilation. HFNC has become first-line for moderate bronchiolitis in many institutions; CPAP and intubation are reserved for severe cases.

Management is supportive: bronchodilators and corticosteroids are not routinely recommended for typical bronchiolitis in infants per AAP guidelines. Hypertonic saline nebulization may reduce length of stay in hospitalized infants per some evidence. Verify your institution's clinical pathway and coordinate ED-to-floor handoffs to minimize boarding during surge.`,
      primary: 'cdc-respiratory-viruses',
      additional: ['cdc-han'],
    },
  ],

  // ===========================================================================
  // hMPV wastewater (existing: clinical-profile, diagnostic-testing, operational-guidance)
  // ===========================================================================
  'hmpv-wastewater-2026': [
    {
      id: 'clinical-management',
      title: 'Clinical management',
      body: `There is currently no licensed vaccine or specific antiviral for hMPV. Management is supportive: oxygen, hydration, respiratory support (high-flow nasal cannula, BiPAP, intubation as needed). Bronchodilators may be considered case-by-case for documented airway reactivity but are not routinely recommended for hMPV bronchiolitis (CDC).

Severity distribution overlaps with RSV; young children, older adults, and immunocompromised patients carry the highest burden. Hospitalization criteria mirror RSV: hypoxemia, severe respiratory distress, inability to maintain hydration, apnea, or age under 3 months with concerning clinical features. Most cases are managed outpatient with supportive care and follow-up.

Co-infection with other respiratory pathogens (RSV, influenza, SARS-CoV-2, rhinovirus) is common during peak respiratory virus season and may worsen clinical course in immunocompromised hosts. Multiplex PCR testing identifies co-infections that inform clinical management.

Ribavirin has activity against hMPV in vitro and has been used adjunctively in severe cases in immunocompromised hosts (particularly stem-cell transplant recipients) per case reports, though no controlled trial data support routine use. Consult infectious disease for severe disease in immunocompromised patients.`,
      primary: 'cdc-respiratory-viruses',
      additional: ['wastewaterscan'],
    },
    {
      id: 'infection-prevention',
      title: 'Infection prevention',
      body: `Standard, contact, and droplet precautions are recommended for any patient with known or suspected hMPV. Patients should be placed in a single-patient room when available, or cohorted with confirmed hMPV cases. Dedicated single-use or thoroughly disinfected reusable equipment minimizes cross-transmission risk (CDC).

PPE for direct patient care includes gown, gloves, eye protection, and a procedural mask. N95 or higher respirator is recommended for aerosol-generating procedures (intubation, extubation, BVM ventilation, CPAP/BiPAP, nebulizers, bronchoscopy, suctioning). PPE removal follows standard doffing protocols.

Hand hygiene with alcohol-based hand sanitizer or soap and water before and after patient contact, and after PPE removal, is the foundation of transmission prevention. Avoid touching the face during clinical encounters; hMPV transmits via large respiratory droplets and contact with contaminated surfaces.

Outbreak management in long-term-care, healthcare, and congregate-living settings during peak season focuses on case identification, cohorting of confirmed cases, enhanced environmental cleaning, and exclusion of symptomatic staff. Coordinate outbreak response with the state health department and your facility's infection prevention team.`,
      primary: 'cdc-respiratory-viruses',
      additional: ['wastewaterscan'],
    },
  ],

  // ===========================================================================
  // Lassa fever (existing: clinical-profile, ppe-and-isolation, operational-guidance)
  // ===========================================================================
  'lassa-fever-2026': [
    {
      id: 'ribavirin-treatment-protocol',
      title: 'Ribavirin treatment protocol',
      body: `Ribavirin has documented activity against Lassa virus and is recommended for suspected severe cases when initiated early in the clinical course. Treatment efficacy decreases substantially after day 6 of illness, emphasizing the importance of early recognition and prompt initiation. CDC and WHO VHF guidelines recommend ribavirin for severe Lassa fever and for post-exposure prophylaxis in high-risk healthcare exposures.

Adult treatment dosing per CDC VHF guidance: 30 mg/kg IV loading dose (maximum 2 g), then 16 mg/kg IV every 6 hours for 4 days (maximum 1 g per dose), then 8 mg/kg IV every 8 hours for 6 days (maximum 500 mg per dose). Total treatment course is 10 days. Pediatric dosing is weight-based and should be coordinated with pediatric infectious disease consultation (CDC).

Adverse effects of ribavirin include hemolytic anemia (the dose-limiting toxicity), nausea, headache, fatigue, and elevated bilirubin. Hematocrit should be monitored every 1-2 days during therapy. Ribavirin is teratogenic and contraindicated in pregnancy; pregnant patients with Lassa fever require maternal-fetal medicine and infectious disease consultation for individualized risk-benefit assessment.

Coordinate ribavirin access through CDC Emergency Operations Center (770-488-7100) and the state public health laboratory. Ribavirin is held in the Strategic National Stockpile for VHF cases; access requires CDC consultation and verification of the clinical scenario.`,
      primary: 'cdc-current-outbreaks',
      additional: ['who-disease-outbreak-news'],
    },
    {
      id: 'travel-surveillance',
      title: 'Travel surveillance',
      body: `Lassa fever is endemic in West Africa, with the highest burden in Nigeria (Edo, Ondo, Bauchi, Ebonyi states), Sierra Leone, Liberia, and Guinea. The annual outbreak peak in Nigeria typically runs January through March. CDC publishes travel health notices for active outbreak periods; travelers from endemic areas with febrile illness within 21 days of return warrant Lassa fever evaluation (CDC; WHO).

Screening criteria for returning travelers include: fever, exposure history (residence in or travel through endemic regions), and absence of alternative diagnosis after initial workup. Differential diagnosis includes malaria (often co-circulating), typhoid fever, Ebola, Marburg disease, yellow fever, and rickettsial diseases. Empiric antimalarials should be considered in parallel with VHF workup.

EMS providers and emergency departments serving major international airports and ports of entry should maintain awareness of Lassa fever among returning travelers. Pre-travel counseling for healthcare workers and humanitarian staff deploying to endemic regions includes Lassa fever recognition, prevention measures (avoidance of rodent contact, safe food storage, PPE in clinical settings), and post-deployment monitoring.

Coordinate suspected case management with CDC Emergency Operations Center (770-488-7100) and the state public health laboratory. The state Communicable Disease Branch coordinates clinical management, contact tracing, and PPE deployment for VHF cases.`,
      primary: 'cdc-current-outbreaks',
      additional: ['who-disease-outbreak-news', 'africa-cdc-outbreaks'],
    },
  ],

  // ===========================================================================
  // Chikungunya (existing: clinical-profile, vector-control, operational-guidance)
  // ===========================================================================
  'chikungunya-2026': [
    {
      id: 'chronic-arthropathy',
      title: 'Chronic arthropathy management',
      body: `Approximately 30-40% of patients with acute chikungunya develop chronic arthralgia and arthritis that can persist for months to years. Risk factors for chronic disease include older age, female sex, and higher acute viral load. Chronic chikungunya arthropathy can be severely disabling and clinically difficult to distinguish from rheumatoid arthritis without serologic testing (PAHO; CDC).

Initial management of chronic symptoms includes NSAIDs for pain and inflammation, physical therapy for joint mobility, and patient education on disease course. Acetaminophen and NSAIDs are first-line analgesics; opioids should be avoided given the chronic course and addiction risk.

Rheumatology referral is recommended for patients with persistent symptoms beyond 3 months or for those with severe functional impairment. Disease-modifying antirheumatic drugs (DMARDs), particularly methotrexate, have been used for chronic chikungunya with reported benefit in observational studies; consider in consultation with rheumatology.

Differentiation from inflammatory arthritis requires serology (CHIKV IgG positive, antinuclear antibody and rheumatoid factor negative). CHIKV IgG can persist for years after acute infection; positive serology in the appropriate clinical context with exposure history supports the diagnosis. Coordinate with infectious disease and rheumatology for complex cases.`,
      primary: 'paho-epi-alerts',
      additional: ['cdc-current-outbreaks'],
    },
    {
      id: 'vector-establishment-and-importation',
      title: 'Vector establishment and importation',
      body: `Aedes aegypti and Aedes albopictus are established in the southern United States (Florida, Texas, Hawaii, parts of the Gulf Coast, and Southeast). Aedes albopictus is increasingly present in temperate regions including parts of the Northeast and Pacific Coast. Established vectors create autochthonous transmission risk during introduction events from returning infected travelers (CDC; PAHO).

Autochthonous CHIKV transmission has been documented sporadically in Florida and other Gulf states, typically initiated by an infected returning traveler. Local mosquito control departments coordinate vector surveillance and response. The Aedes aegypti and albopictus 'invasive mosquito' surveillance programs operate at the federal level (CDC vector-borne diseases division) and at state and county vector control districts.

EMS and ED clinicians in vector-establishment zones should maintain index of suspicion for CHIKV alongside dengue and Zika in symptomatic returning travelers and local residents during peak vector activity. Local cases of autochthonous transmission trigger heightened vector-control response: house-by-house source reduction, ULV adulticide spraying, and intensified surveillance.

Travel health counseling for travelers to endemic regions includes mosquito-bite prevention (DEET, picaridin, or IR3535-containing repellents; long sleeves; permethrin-treated clothing) and consideration of the licensed chikungunya vaccine (Ixchiq) for adults 18 and older at increased risk of exposure. Verify current ACIP recommendations for chikungunya vaccination.`,
      primary: 'paho-epi-alerts',
      additional: ['cdc-current-outbreaks'],
    },
  ],

  // ===========================================================================
  // Candida auris (existing: infection-prevention, lab-identification, operational-guidance)
  // ===========================================================================
  'candida-auris-wastewater-2026': [
    {
      id: 'outbreak-investigation',
      title: 'Outbreak investigation',
      body: `Healthcare-associated C. auris outbreaks require rapid case ascertainment, colonization screening of exposed patients, environmental sampling, and infection prevention reinforcement. CDC and state health departments coordinate outbreak response; facilities with newly identified cases should notify the state public health laboratory and infection prevention authority within 24 hours (CDC).

Colonization screening uses composite swabs of axilla and groin processed by selective culture or PCR. Screening of exposed patients is recommended for any patient who shared a room or care team with a confirmed case in the prior 4 weeks. Repeat screening may be indicated based on local risk assessment and the patient's continued exposure risk.

Environmental sampling is conducted on high-touch surfaces (bed rails, call buttons, monitors, IV poles, mobile equipment) in rooms occupied by confirmed cases. Persistent environmental contamination has been documented for months on suboptimally cleaned surfaces; enhanced terminal cleaning is critical at discharge or transfer.

Outbreak control measures include single-patient room isolation (or cohorting), contact precautions, dedicated equipment, enhanced environmental cleaning with EPA List P or List K disinfectants, inter-facility communication for any patient transfer, and ongoing surveillance until 8 weeks without new cases. Coordinate outbreak response with CDC and state public health.`,
      primary: 'cdc-current-outbreaks',
      additional: ['wastewaterscan'],
    },
    {
      id: 'antifungal-stewardship',
      title: 'Antifungal stewardship',
      body: `Empiric antifungal selection for C. auris should be informed by local susceptibility patterns and consultation with the facility's antimicrobial stewardship team and infectious disease consultation. Approximately 90% of isolates are fluconazole-resistant, 30% echinocandin-resistant, and a small but growing subset are pan-resistant to all three antifungal classes (CDC).

Echinocandins (caspofungin, micafungin, anidulafungin) are typically first-line empiric therapy for C. auris bloodstream infection given the high rate of azole resistance. Susceptibility testing should be performed on every isolate to guide definitive therapy; CDC's Antibiotic Resistance Laboratory Network (AR Lab Network) provides reference susceptibility testing.

Treatment duration depends on infection site and clinical response. Catheter-related bloodstream infections typically require catheter removal alongside antifungal therapy. Other deep-seated infections (endocarditis, osteomyelitis, CNS infection) require prolonged antifungal therapy and surgical source control where applicable.

Surveillance for development of resistance during therapy is critical given the documented emergence of pan-resistance under treatment pressure. Repeat susceptibility testing at 7-14 days into therapy and at any sign of clinical failure. Coordinate complex cases with infectious disease and the state public health laboratory.`,
      primary: 'cdc-current-outbreaks',
      additional: ['wastewaterscan'],
    },
  ],

  // ===========================================================================
  // Screwworm (existing: animal-detection, human-myiasis, operational-guidance)
  // ===========================================================================
  'screwworm-onehealth-2026': [
    {
      id: 'usda-aphis-coordination',
      title: 'USDA APHIS coordination',
      body: `USDA APHIS coordinates the federal screwworm response in partnership with state animal-health officials, Mexican animal-health authorities (SENASICA), and Central American partners through the Commission for the Eradication and Prevention of Screwworm (COPEG). The decades-long partnership maintained the Darien Gap biological barrier through sterile-insect technique (SIT) releases until the recent northward breakthrough.

SIT operations release sterile male screwworm flies in target zones; sterile males mate with wild females, producing infertile eggs that suppress population growth. The Panama sterile-fly production facility supports COPEG's release program; expanded production capacity is needed to address the current northward incursion. USDA APHIS is coordinating expansion plans with Panamanian partners (USDA APHIS).

State animal-health officials in border states (Texas, New Mexico, Arizona, California, Florida) operate field surveillance with cooperation from livestock producers, veterinarians, and wildlife biologists. The APHIS hotline 1-866-536-7593 receives suspect-case reports. Confirmed identifications trigger quarantine, treatment protocols, and intensified local surveillance.

Cross-border information sharing between US, Mexican, and Central American animal-health authorities supports outbreak intelligence. Verify current status, sterile-fly release schedules, and quarantine zones through USDA APHIS communications and the COPEG situation reports.`,
      primary: 'usda-aphis-screwworm-status',
      additional: ['woah-wahis'],
    },
    {
      id: 'wildlife-and-border-surveillance',
      title: 'Wildlife and border surveillance',
      body: `Border-state wildlife surveillance is critical given the screwworm's host range (any warm-blooded animal with an open wound or natural body opening). Deer, feral hogs, and other wild ungulates can carry infestations across borders and into US territory. State wildlife agencies coordinate with USDA APHIS for wildlife monitoring and reporting (USDA APHIS).

Livestock import inspection at US-Mexico border crossings is intensified during outbreak periods. APHIS port-of-entry veterinarians inspect cattle, horses, and other livestock for visible wounds and active myiasis. Detected animals are quarantined, treated, and processed under outbreak response protocols.

Wildlife monitoring relies on partnership with state fish and wildlife agencies, hunter-reported observations, and roadside-carcass surveillance during hunting seasons. The combination provides early-warning intelligence on northward movement and identifies sentinel populations for targeted SIT release.

Coordinate suspect case reports through APHIS (1-866-536-7593) and your state animal-health office. Verify quarantine zones, surveillance protocols, and SIT release schedules through USDA APHIS situation reports and the WOAH WAHIS dashboard.`,
      primary: 'usda-aphis-screwworm-status',
      additional: ['woah-wahis'],
    },
  ],

  // ===========================================================================
  // FIFA 2026 (existing: surveillance-planning, ems-surge-readiness, operational-guidance)
  // ===========================================================================
  'fifa-world-cup-2026-prep': [
    {
      id: 'cross-border-coordination',
      title: 'Cross-border coordination',
      body: `The 2026 FIFA World Cup is hosted by the United States, Canada, and Mexico, creating an unprecedented need for cross-border public health and EMS coordination during the tournament period (June 11 - July 19, 2026). National authorities (CDC, PHAC, and Mexican health authorities), state and provincial agencies, and host-city emergency management coordinate through pre-established channels (WHO Mass Gatherings framework).

Medical evacuation protocols across the three host countries are validated through joint exercises. Air-medical agreements address mass-casualty scenarios, repatriation of injured spectators, and continuity of care for chronic medical conditions. Ground transport agreements support border-crossing transfers and humanitarian medical evacuations.

Surveillance intelligence-sharing during the tournament includes daily situational-awareness reports that integrate participating-team home-region outbreak intelligence, syndromic surveillance from host-city EDs and EMS, and laboratory signal from sentinel sites. CDC, PHAC, and Mexican health authorities coordinate joint situational-awareness conference calls during tournament play.

Communications protocols with venue medical, hotel medical, host-city EMS, FBI/DHS security-medical integration, and consular partners are pre-established. Multilingual public-communications materials are produced in collaboration with FIFA, host committees, and consular partners.`,
      primary: 'who-mass-gatherings',
      additional: ['cdc-current-outbreaks'],
    },
    {
      id: 'pre-event-vaccination',
      title: 'Pre-event vaccination and traveler health',
      body: `Pre-event traveler health counseling for international attendees includes routine vaccination verification (MMR, varicella, polio booster as needed), seasonal vaccinations (influenza for Southern Hemisphere travelers, COVID-19 boosters), and destination-specific recommendations (yellow fever for travelers from endemic regions, measles in unvaccinated populations) (WHO; CDC).

Host-city public health departments coordinate with CDC and PHAC for traveler health advisories, immunization clinics for arriving teams and staff, and outbreak response for any imported transmission. Spectator-facing communication uses CDC Traveler's Health pages, FIFA host-city portals, and partner consular outreach.

Mass-gathering health risk-assessment frameworks (WHO-MG checklist) inform pre-tournament vaccination strategy. Risk assessment considers: participating-team home-region outbreak status, host-city vaccination coverage, expected attendance demographics, and venue-specific risk factors (indoor vs outdoor seating, crowd density, transportation patterns).

Verify current ACIP and CDC traveler health recommendations during the tournament planning phase and through tournament play. Coordinate vaccine deployment to identified at-risk populations through state immunization programs, partner pharmacies, and host-committee health-services contractors.`,
      primary: 'who-mass-gatherings',
      additional: ['cdc-current-outbreaks'],
    },
  ],
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

  let addedCount = 0
  let replacedCount = 0

  for (const signal of signals) {
    const newSections = NEW_SECTIONS[signal.id]
    if (!newSections) continue
    if (!signal.detailSections) signal.detailSections = []

    // Insert new sections BEFORE the operational-guidance section so the
    // clinical/operational ordering reads naturally.
    const opIdx = signal.detailSections.findIndex((s) => s.id === 'operational-guidance')
    const insertAt = opIdx >= 0 ? opIdx : signal.detailSections.length

    for (const def of newSections) {
      const newSection = {
        id: def.id,
        title: def.title,
        bodyMarkdown: def.body.trim(),
        attribution: toAttribution(findSource(sources, def.primary)),
        additionalAttributions: def.additional.map((id) => toAttribution(findSource(sources, id))),
        lastReviewed: LAST_REVIEWED,
      }
      const existingIdx = signal.detailSections.findIndex((s) => s.id === def.id)
      if (existingIdx >= 0) {
        signal.detailSections[existingIdx] = newSection
        replacedCount += 1
      } else {
        const currentOpIdx = signal.detailSections.findIndex((s) => s.id === 'operational-guidance')
        const target = currentOpIdx >= 0 ? currentOpIdx : signal.detailSections.length
        signal.detailSections.splice(target, 0, newSection)
        addedCount += 1
      }
    }

    void insertAt
  }

  writeFileSync(SIGNALS_PATH, JSON.stringify(signals, null, 2) + '\n')

  const totalSections = signals.reduce((sum, s) => sum + (s.detailSections?.length ?? 0), 0)
  console.log(`[parity-sections] added ${addedCount}, replaced ${replacedCount}; total ${totalSections} sections across ${signals.length} signals`)
}

main()
