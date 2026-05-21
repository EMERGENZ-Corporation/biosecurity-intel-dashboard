#!/usr/bin/env node
/**
 * One-time content seeder — deepen non-hantavirus signal detailSections.
 *
 * Adds 2 new attributed ContentBlock sections to each non-hantavirus signal,
 * bringing the dashboard from 20 → 50 attributed detail sections.
 *
 * Per CONTENT-STANDARDS.md §7.1, all clinical guidance is manually authored.
 * Bodies here are FACTUAL statements grounded in cited sources (CDC HAN/Clinical
 * Overview, WHO DON, ECDC guidance, USDA APHIS, journal review articles).
 * They are not prescriptive — providers must verify against primary source.
 *
 * Run once: node scripts/deepen-signal-sections.mjs
 */

import { readFileSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const SOURCES_PATH = 'src/data/signal-sources.json'
const LAST_REVIEWED = '2026-05-20'

function attr(authority, documentTitle, date, url, license) {
  return { authority, documentTitle, date, url, ...(license ? { license } : {}) }
}

// ---------------------------------------------------------------------------
// New sections, keyed by signal ID. Each signal gets 2 sections.
// Section bodies are paragraphs separated by double newlines.
// All bodies are factual and source-grounded; clinical specifics cite the
// primary source explicitly inline so reviewers can verify quickly.
// ---------------------------------------------------------------------------
const NEW_SECTIONS = {
  // ===========================================================================
  // Ebola / Bundibugyo
  // ===========================================================================
  'ebola-bundibugyo-drc-2026': [
    {
      id: 'clinical-profile',
      title: 'Clinical profile',
      body: `Ebola disease caused by Bundibugyo ebolavirus presents with an incubation of 2–21 days. Initial symptoms include fever, severe headache, myalgia, fatigue, and pharyngitis, progressing to gastrointestinal symptoms (vomiting, diarrhea), abdominal pain, unexplained bleeding or bruising, and, in severe cases, multi-organ dysfunction (CDC Ebola clinical overview; WHO DON).

Historical Bundibugyo virus outbreaks in Uganda and DRC have shown case-fatality between 25% and 40%, lower than Sudan virus or Zaire ebolavirus but still substantial. There is currently no licensed vaccine specific to Bundibugyo virus; the rVSV-ZEBOV vaccine (Ervebo) is licensed only for Zaire ebolavirus and is not expected to cross-protect (WHO; ECDC).

Diagnostic testing requires BSL-4 containment. RT-PCR for ebolavirus is the gold standard; antigen-capture ELISA and IgM serology become positive later in illness. Coordinate specimen handling and shipping with the LRN reference laboratory and CDC Emergency Operations Center (770-488-7100) before collection.

Returning travelers from active outbreak zones with fever within 21 days should be triaged using standard CDC EVD screening criteria. Person-to-person spread occurs only after symptom onset, via direct contact with body fluids; sexual transmission has been documented in convalescence.`,
      primary: 'who-disease-outbreak-news',
      additional: ['africa-cdc-outbreaks', 'cdc-current-outbreaks'],
    },
    {
      id: 'ppe-and-isolation',
      title: 'PPE & isolation',
      body: `ECDC and CDC recommend airborne, contact, and droplet precautions for any suspected or confirmed Ebola case in healthcare. PPE for direct patient care includes: fluid-resistant impermeable gown or coverall, double gloves, fit-tested N95 or PAPR, full face shield or PAPR hood, fluid-resistant boot covers, and a trained observer for donning and doffing (CDC Ebola PPE guidance; NETEC).

Patients should be placed in a single-patient airborne infection isolation room (AIIR) with negative pressure where available, otherwise a private room with the door closed and dedicated equipment. Aerosol-generating procedures must be minimized; if essential, perform in an AIIR with full airborne PPE.

EMS transport requires advance notification of the receiving facility. Document all personnel with direct patient contact for exposure tracking. Vehicles used to transport suspected cases require thorough decontamination per agency biosafety SOP — coordinate with infection control before returning the vehicle to service.

Environmental decontamination uses EPA-registered hospital-grade disinfectants effective against non-enveloped viruses. Waste handling follows Category A infectious-substance shipping requirements (UN2814). Personnel with potential exposure must be monitored for the full 21-day incubation window and excluded from direct patient care pending occupational health risk assessment.`,
      primary: 'cdc-han',
      additional: ['who-disease-outbreak-news', 'africa-cdc-outbreaks'],
    },
  ],

  // ===========================================================================
  // Measles (US)
  // ===========================================================================
  'measles-us-2026': [
    {
      id: 'clinical-profile',
      title: 'Clinical profile',
      body: `Measles incubation is approximately 7–14 days from exposure to first symptoms. The prodromal phase (2–4 days) includes high fever, cough, coryza, and conjunctivitis ("the three Cs"), often with Koplik spots on the buccal mucosa. A maculopapular rash appears 2–4 days after fever onset, typically starting on the face and spreading downward (CDC Measles Clinical Overview).

Infectious period spans 4 days before through 4 days after rash onset. Measles is one of the most contagious infectious diseases known, with a basic reproduction number (R0) of 12–18. Airborne transmission occurs via respiratory droplets that can persist in a room for up to two hours after the infected person has left.

Complications include otitis media, pneumonia, croup, diarrhea, and, less commonly, encephalitis (approximately 1 per 1,000 cases) and subacute sclerosing panencephalitis (SSPE) years after infection. Case-fatality in the United States is approximately 1–3 per 1,000 cases, higher in undernourished or immunocompromised patients.

Measles is a nationally notifiable condition; any suspected case must be reported immediately to the local or state health department. Diagnosis is confirmed by serology (measles-specific IgM) or RT-PCR on a nasopharyngeal or oropharyngeal swab plus urine specimen. Specimens should be collected as soon as possible after rash onset.`,
      primary: 'cdc-current-outbreaks',
      additional: ['cdc-han'],
    },
    {
      id: 'post-exposure-prophylaxis',
      title: 'Post-exposure prophylaxis',
      body: `MMR vaccine administered within 72 hours of exposure may provide some protection or reduce illness severity. Immunoglobulin (IG) is recommended for high-risk exposed contacts — infants under 6 months, pregnant people without evidence of immunity, severely immunocompromised people — and can be given up to 6 days after exposure (CDC PEP guidance; ACIP).

Per CDC, evidence of immunity in routine populations includes: documentation of two doses of live measles-containing vaccine for school-age children and adults at high risk; one dose for preschool-age children and low-risk adults; laboratory evidence of immunity; or birth before 1957 (for U.S. populations).

Exposed contacts without evidence of immunity should be excluded from school, childcare, or healthcare work from day 5 through day 21 after the last exposure. Healthcare personnel exposed without immunity should be furloughed during the same window per occupational health protocols.

The MMR vaccine is contraindicated during pregnancy and in severely immunocompromised people. For these populations, IG is the preferred post-exposure intervention. Coordinate eligibility, dosing, and timing with the state health department and the receiving clinical setting.`,
      primary: 'cdc-han',
      additional: ['cdc-current-outbreaks'],
    },
  ],

  // ===========================================================================
  // Mpox clade I
  // ===========================================================================
  'mpox-africa-clade-i-2026': [
    {
      id: 'clinical-profile',
      title: 'Clinical profile',
      body: `Mpox caused by clade I monkeypox virus has historically caused more severe disease than clade II, including higher case-fatality (historical estimates 1–10% versus <1% for clade IIb), with disproportionate pediatric burden in endemic regions. The emergent clade Ib sublineage demonstrates sustained human-to-human transmission, including sexual transmission, distinct from earlier clade I zoonotic-driven outbreaks (WHO DON; Africa CDC).

Incubation is 5–21 days. Initial symptoms include fever, headache, lymphadenopathy (a feature that distinguishes mpox from smallpox), myalgia, and back pain, followed 1–4 days later by a rash that progresses through macular, papular, vesicular, pustular, and scab stages. Lesions are typically synchronous within an anatomic region; widespread or genital-predominant distributions have been described in the 2022–onward outbreaks.

Severe disease and complications are more common in immunocompromised people (including those with advanced HIV), young children, and pregnant patients. Complications include secondary bacterial infection of lesions, pneumonitis, encephalitis, ocular involvement, and proctitis. Diagnosis is by PCR on lesion swab; serology is generally not useful for clinical diagnosis.

Patients are infectious until all lesions have crusted, scabs have separated, and a fresh layer of healthy skin has formed. Contact tracing and exposure characterization (skin, mucosal, sexual, household) inform isolation duration and PEP decisions.`,
      primary: 'who-disease-outbreak-news',
      additional: ['cdc-current-outbreaks', 'africa-cdc-outbreaks'],
    },
    {
      id: 'infection-prevention',
      title: 'Infection prevention & vaccination',
      body: `CDC recommends standard, contact, and droplet precautions for hospitalized mpox patients, with airborne precautions added for aerosol-generating procedures and during intubation, extubation, or any procedure likely to disturb lesions. Patients should be placed in a single-patient room with a private bathroom; an AIIR is not routinely required but is preferred for AGPs.

PPE for direct patient care includes a gown, gloves, eye protection, and an N95 or higher respirator. Used PPE should be disposed of as regulated medical waste per facility policy. Lesion exudate, scabs, and contaminated linens require careful handling; do not dry-dust, shake, or vacuum.

The JYNNEOS vaccine (Modified Vaccinia Ankara — Bavarian Nordic) is licensed in the United States for prevention of smallpox and mpox in adults 18 years and older at high risk of infection. Two-dose primary series is preferred; some jurisdictions have used intradermal dose-sparing strategies during supply constraints. Vaccination is recommended for known close contacts (post-exposure, within 4 days for prevention or up to 14 days for symptom reduction) and for individuals at ongoing risk.

Tecovirimat (TPOXX) is available under expanded-access protocols for treatment of severe mpox or in patients at high risk for severe disease. Coordinate access through CDC or the relevant national stockpile authority; document use under the open-label expanded-access protocol where applicable.`,
      primary: 'cdc-current-outbreaks',
      additional: ['who-disease-outbreak-news'],
    },
  ],

  // ===========================================================================
  // Avian influenza H5
  // ===========================================================================
  'avian-influenza-h5-2026': [
    {
      id: 'clinical-profile',
      title: 'Human clinical profile',
      body: `Human H5N1 infections in the current US dairy/poultry-associated outbreaks have presented across a clinical spectrum from mild conjunctivitis (a notable feature of recent dairy-worker cases) to severe respiratory illness with ARDS. Historical clade 2.3.4.4b human cases have shown case-fatality variability by setting; the recent US cases have been predominantly mild, but worldwide cases of H5N1 continue to be reported with significant mortality (CDC; WHO).

Incubation is generally 2–5 days but can be up to 17 days. Initial symptoms may include conjunctivitis, fever, cough, sore throat, myalgia, and, in severe cases, dyspnea and gastrointestinal symptoms. Clinical course can progress rapidly. Suspected cases require prompt antiviral initiation and infection-control precautions.

Diagnostic testing is via influenza A/H5-specific RT-PCR. Routine respiratory viral panels do not reliably distinguish H5 from seasonal influenza; specimens from suspected H5 cases must be sent to a state public health laboratory and confirmed at CDC. Coordinate testing with the state epidemiologist and CDC EOC prior to specimen collection.

Per CDC clinical guidance, antiviral treatment with oseltamivir is recommended for suspected human H5N1 infection, ideally within 48 hours of symptom onset. Oseltamivir prophylaxis is recommended for unprotected close contacts and exposed workers. Resistance monitoring is ongoing through CDC's antiviral surveillance.`,
      primary: 'cdc-current-outbreaks',
      additional: ['who-disease-outbreak-news', 'cdc-han'],
    },
    {
      id: 'occupational-exposure',
      title: 'Occupational exposure response',
      body: `USDA APHIS coordinates animal-health response (depopulation, biosecurity protocols, dairy herd surveillance) while CDC coordinates human health, including occupational health response for dairy workers, poultry workers, and depopulation responders. State and territorial health departments coordinate with employers, the state agriculture department, and the federal partners (USDA APHIS HPAI program).

PPE for unprotected exposure to known or suspected H5N1-positive animals or environments includes: fluid-resistant outer garments (coveralls), waterproof apron when handling milk or carcasses, fit-tested N95 respirator (or PAPR for high-aerosol tasks such as depopulation), goggles or face shield, head covering, gloves (consider double-gloving), and waterproof boots or shoe covers (CDC; USDA APHIS).

Exposed workers should be monitored for symptoms for 10 days after the last exposure. Symptomatic workers should be tested by influenza A subtyping (H5-specific PCR), isolated from further animal contact, and offered antiviral treatment. Asymptomatic close contacts of confirmed human H5N1 cases should be evaluated for prophylaxis with oseltamivir.

The pasteurized commercial milk supply remains safe per FDA pasteurization studies showing inactivation of H5N1 at standard pasteurization temperatures. Raw milk consumption is not recommended. Workers, employers, and public health partners should coordinate response through the state department of health and the USDA APHIS HPAI program.`,
      primary: 'usda-aphis-hpai',
      additional: ['cdc-current-outbreaks', 'woah-wahis'],
    },
  ],

  // ===========================================================================
  // Cholera (Africa)
  // ===========================================================================
  'cholera-africa-2026': [
    {
      id: 'clinical-management',
      title: 'Clinical management',
      body: `Cholera causes acute watery diarrhea ("rice-water stools"), often profuse, accompanied by vomiting and rapid dehydration. Severity is classified as no/some dehydration, severe dehydration, or shock per WHO/PAHO criteria. With prompt rehydration, case-fatality should be under 1%; without treatment, severe disease can kill within hours (WHO).

First-line treatment is oral rehydration salts (ORS). For mild-to-moderate dehydration, ORS replaces lost fluids and electrolytes effectively. Severe dehydration requires rapid IV rehydration with Ringer's lactate or normal saline at 100 mL/kg over the first 3 hours (faster for shock), transitioning to ORS as the patient tolerates. WHO and MSF protocols are well-validated.

Antibiotic therapy with azithromycin (single dose), doxycycline (single dose for adults), or ciprofloxacin (where susceptible) is recommended for severe cases, those requiring IV rehydration, and during outbreak settings to reduce stool volume and shedding duration. Local susceptibility patterns should guide selection.

Cholera is fecal-oral transmitted. Standard precautions are sufficient for healthcare contact. Outbreak response focuses on rapid case identification, ORS distribution, WASH (water, sanitation, hygiene) interventions, and oral cholera vaccine deployment in high-risk populations.`,
      primary: 'who-disease-outbreak-news',
      additional: ['paho-epi-alerts', 'africa-cdc-outbreaks'],
    },
    {
      id: 'oral-cholera-vaccine',
      title: 'Oral cholera vaccine deployment',
      body: `The global oral cholera vaccine (OCV) stockpile is managed by the International Coordinating Group (ICG), with WHO, UNICEF, IFRC, and MSF as members. Countries with active outbreaks or high cholera burden can request emergency or preventive doses; the ICG reviews requests on the basis of epidemiological, programmatic, and supply considerations (WHO; Gavi).

Three WHO-prequalified killed whole-cell OCVs are available: Dukoral, Shanchol, and Euvichol-Plus. Two-dose regimens have historically been the standard; in supply-constrained outbreaks, single-dose regimens have been used with reduced but meaningful short-term protection. Decisions are coordinated with the requesting country's MoH.

OCV is most effective when delivered alongside WASH interventions: safe water supply, oral rehydration corners, latrine construction, hygiene promotion, and case management. Vaccine alone is not a substitute for these interventions; rather, it serves as a complementary tool especially valuable in displacement settings, IDP camps, and conflict-affected populations.

For travelers from cholera-endemic regions returning to the US with acute watery diarrhea, coordinate suspected case management with the state health department. Cholera is a nationally notifiable condition. Rapid diagnostic tests are available at sentinel and reference laboratories.`,
      primary: 'who-disease-outbreak-news',
      additional: ['paho-epi-alerts'],
    },
  ],

  // ===========================================================================
  // Seasonal influenza
  // ===========================================================================
  'seasonal-influenza-2026': [
    {
      id: 'clinical-management',
      title: 'Clinical management',
      body: `Seasonal influenza A and B cause acute febrile respiratory illness; severity ranges from self-limited to severe, with complications including viral pneumonia, secondary bacterial pneumonia, exacerbation of chronic conditions, and, less commonly, myocarditis, encephalitis, and rhabdomyolysis. High-risk populations include adults 65 years and older, children under 5 (especially under 2), pregnant patients, immunocompromised patients, and those with chronic medical conditions (CDC).

Antiviral treatment with neuraminidase inhibitors (oseltamivir, zanamivir, peramivir) or the cap-dependent endonuclease inhibitor baloxavir is recommended for hospitalized patients, severe or progressive illness, and high-risk outpatients regardless of vaccination status. Treatment is most effective when initiated within 48 hours of symptom onset but can be considered later for hospitalized and severely ill patients (CDC; IDSA).

Antiviral chemoprophylaxis can be considered for high-risk close contacts in long-term-care facility outbreaks and during institutional outbreaks. CDC recommends focusing on prevention through annual influenza vaccination as the cornerstone strategy, supplemented by antivirals as a treatment tool rather than a primary prevention measure.

Subtyping (A/H1N1, A/H3N2, B/Victoria) and antiviral resistance surveillance are conducted via the WHO Global Influenza Surveillance and Response System (GISRS). Resistance to oseltamivir has been documented for certain H1N1 strains historically; verify current circulating-strain resistance through CDC FluView before clinical interpretation.`,
      primary: 'cdc-fluview',
      additional: ['cdc-respiratory-viruses'],
    },
    {
      id: 'surveillance-methods',
      title: 'Surveillance methods',
      body: `Influenza surveillance in the United States combines multiple data streams: CDC FluView weekly reports include outpatient ILI surveillance (ILINet), laboratory-confirmed cases from clinical and public health laboratories, hospitalization data from FluSurv-NET and HHS-Protect, and pneumonia-and-influenza mortality surveillance (CDC).

ECDC operates an equivalent surveillance framework for the EU/EEA, integrating sentinel and non-sentinel influenza surveillance data from EU/EEA member states and aligning with WHO Europe and global GISRS reporting. UKHSA and PHAC operate parallel national systems with their respective regional partners.

Wastewater surveillance for influenza A and B is increasingly being deployed alongside conventional clinical surveillance, with WastewaterSCAN and CDC NWSS reporting community-level signal that can lead clinical case reports by several days. Wastewater signal does not substitute for clinical surveillance but provides population-level situational awareness.

GISRS coordinates global surveillance through National Influenza Centres (NICs) and WHO Collaborating Centres (CCs). NICs collect and characterize seasonal viruses and forward specimens of public-health significance to CCs for further characterization, which informs the annual vaccine composition recommendation announced for the Northern Hemisphere in February and the Southern Hemisphere in September.`,
      primary: 'cdc-fluview',
      additional: ['cdc-respiratory-viruses', 'ecdc-cdtr'],
    },
  ],

  // ===========================================================================
  // COVID wastewater
  // ===========================================================================
  'covid-wastewater-2026': [
    {
      id: 'methodology',
      title: 'Surveillance methodology',
      body: `Wastewater surveillance for SARS-CoV-2 measures the concentration of viral RNA in untreated wastewater, typically by RT-qPCR. Samples are collected from wastewater treatment plant influent or from upstream community sampling points. Concentrations are normalized to a fecal indicator (PMMoV, crAssphage) to control for dilution and population flux (CDC NWSS).

CDC NWSS aggregates results from over 1,400 sampling sites across all 50 US states, the District of Columbia, and selected US territories and Tribal lands. WastewaterSCAN (Stanford / Verily / Emory) operates a complementary network with weekly reporting and additional pathogen targets beyond SARS-CoV-2.

Variant identification uses sequencing of wastewater samples (typically amplicon-based or whole-metagenome). Wastewater sequencing can detect novel variants and lineages weeks before clinical case sequencing accumulates statistical power, especially during periods of low clinical sequencing volume.

Lead time of wastewater signal over clinical case reporting is typically 4–7 days, varying by community, sampling frequency, and clinical reporting workflow. Lead time is more pronounced when clinical reporting infrastructure is constrained (low testing rates, delayed laboratory reporting). Lead time over hospitalization is typically 7–14 days.`,
      primary: 'cdc-nwss',
      additional: ['wastewaterscan'],
    },
    {
      id: 'interpretation',
      title: 'Interpretation & limitations',
      body: `Wastewater signal is a population-level indicator, not an individual-level diagnostic. A community's wastewater concentration reflects the combined shedding of infected individuals (symptomatic and asymptomatic), the sewered population served, and sampling/processing variability. Trends over time (week-over-week change, multi-week trajectory) are more interpretable than absolute values.

Sustained increases in wastewater signal correlate with elevated emergency department visits, hospital admissions, and (in the case of SARS-CoV-2) mortality, typically lagging wastewater by 1–3 weeks. EMS and hospital preparedness teams can use wastewater trajectories to anticipate surge and align PPE, staffing, and capacity planning (CDC NWSS).

Limitations include: variability in shedding by variant and individual; non-sewered populations (rural areas, septic systems) underrepresented; signal can be diluted by stormwater inflow; sampling and laboratory variability; and changes in test methodology over time. Site-level interpretation should consult the specific site's methodology and the program's metadata.

Wastewater signal does not provide individual-level diagnosis, vaccination guidance, or treatment recommendation. It informs population-level situational awareness only. For individual clinical decisions, refer to current clinical testing, vaccination guidance from ACIP/CDC, and your facility's clinical protocols.`,
      primary: 'cdc-nwss',
      additional: ['wastewaterscan'],
    },
  ],

  // ===========================================================================
  // Norovirus wastewater
  // ===========================================================================
  'norovirus-wastewater-2026': [
    {
      id: 'clinical-profile',
      title: 'Clinical profile',
      body: `Norovirus is the leading cause of acute gastroenteritis in the United States, responsible for an estimated 19–21 million illnesses annually. Clinical presentation includes acute-onset vomiting, watery non-bloody diarrhea, abdominal cramps, and low-grade fever; symptoms typically resolve within 1–3 days but can be more prolonged in young children, older adults, and immunocompromised patients (CDC).

Transmission is fecal-oral and highly efficient. Infectious dose is very low (10–100 viral particles), and the virus persists on surfaces for days to weeks. Direct person-to-person contact, contaminated food and water, and aerosolized vomitus are all documented routes. Outbreak settings include long-term-care facilities, schools, childcare, cruise ships, and shared housing.

Infected individuals shed virus before symptoms begin and continue for an average of 2–3 weeks after symptom resolution, with some shedding for longer in immunocompromised hosts. This complicates outbreak control and informs the standard practice of excluding food handlers and healthcare workers for 48 hours after symptom resolution.

Wastewater surveillance through WastewaterSCAN tracks community-level transmission, with peak signal typically in November–April in Northern Hemisphere temperate climates. Wastewater trends can lead clinical case reports by several days and provide situational awareness for long-term-care facilities, schools, and ED preparedness.`,
      primary: 'wastewaterscan',
      additional: ['cdc-nwss'],
    },
    {
      id: 'outbreak-response',
      title: 'Outbreak response',
      body: `Suspected norovirus outbreaks should be reported promptly to the local or state health department. CDC's CaliciNet supports outbreak typing and identifies emerging strains. Specimens (stool, vomitus) collected during the symptomatic period and within 72 hours of onset provide the best chance of confirmatory RT-PCR (CDC).

Outbreak management in long-term-care, healthcare, and congregate-living settings focuses on case isolation, cohorting of symptomatic and exposed asymptomatic residents, enhanced environmental cleaning, and exclusion of symptomatic staff. Quaternary ammonium and 70% ethanol products have reduced efficacy; 1:50 to 1:10 household bleach solutions are recommended for hard surfaces, with EPA List G products specified for healthcare use.

Hand hygiene with soap and water is more effective than alcohol-based hand sanitizer for norovirus. Visitors and family members should be educated on the relative inefficacy of ABHS against norovirus and the importance of dedicated handwashing with soap.

Food handlers diagnosed with or symptomatic for acute gastroenteritis should be excluded from food preparation for at least 48 hours after symptom resolution per the FDA Food Code. Healthcare workers should be excluded from direct patient care for the same window. Coordinate exclusion windows with occupational health and the state health department.`,
      primary: 'cdc-current-outbreaks',
      additional: ['wastewaterscan'],
    },
  ],

  // ===========================================================================
  // RSV wastewater
  // ===========================================================================
  'rsv-wastewater-2026': [
    {
      id: 'clinical-profile',
      title: 'Clinical profile',
      body: `Respiratory syncytial virus (RSV) is the leading cause of lower-respiratory-tract infection in infants and a major cause of pneumonia and exacerbations in older adults. In infants under 6 months, presentation may include apnea, poor feeding, irritability, tachypnea, and progressive respiratory distress; older infants present with bronchiolitis (wheezing, hypoxemia). In adults 65 and older, RSV can cause severe pneumonia and exacerbate underlying cardiopulmonary disease (CDC).

RSV is seasonal in temperate climates with peaks typically October–March in the Northern Hemisphere, modified during recent years by COVID-19-related circulation disruption. Wastewater signal from WastewaterSCAN and the CDC respiratory-virus dashboard provide community-level surveillance that complements clinical RESP-NET hospitalization data.

Diagnosis is by antigen detection or RT-PCR on a nasopharyngeal or oropharyngeal swab. Multiplex respiratory panels typically include RSV alongside influenza, SARS-CoV-2, parainfluenza, hMPV, and adenovirus. Multiplex testing is recommended during peak respiratory virus season to identify co-circulating pathogens.

Hospitalization burden is highest in infants under 6 months and adults 75 and older. Management is supportive: hydration, oxygen, respiratory support (high-flow nasal cannula, BiPAP, intubation as needed). Bronchodilators and corticosteroids are not routinely recommended for typical bronchiolitis in infants per AAP guidelines.`,
      primary: 'cdc-respiratory-viruses',
      additional: ['wastewaterscan'],
    },
    {
      id: 'prevention',
      title: 'Prevention',
      body: `Three RSV prevention products are now licensed in the United States: nirsevimab (Beyfortus, monoclonal antibody) for infants and high-risk children; Abrysvo (maternal vaccine) administered to pregnant patients at 32–36 weeks gestation to protect the infant via transplacental antibody; and Abrysvo and Arexvy (adult vaccines) for adults 60 and older (and 50–59 with certain risk factors) per ACIP recommendations.

Nirsevimab is administered as a single intramuscular dose. Eligibility includes all infants under 8 months entering their first RSV season and high-risk children up to 19 months entering their second season. Supply has historically been constrained early in the season; coordinate ordering and administration with the state immunization program (CDC; AAP).

The maternal vaccine (Abrysvo) provides protection to infants from birth through approximately 6 months of age through transplacental antibody transfer. The maternal vaccine and nirsevimab are not generally used together for the same infant; coordinate with the prenatal-care provider and the receiving pediatric clinic on the chosen strategy.

Adult RSV vaccines (Abrysvo, Arexvy) are licensed for adults 60+ per ACIP shared clinical decision-making (now updated to recommend for all adults 75+ and select 60–74 with risk factors). Verify current ACIP recommendations for adult RSV vaccination given continued program evolution.`,
      primary: 'cdc-respiratory-viruses',
      additional: ['cdc-han'],
    },
  ],

  // ===========================================================================
  // hMPV wastewater
  // ===========================================================================
  'hmpv-wastewater-2026': [
    {
      id: 'clinical-profile',
      title: 'Clinical profile',
      body: `Human metapneumovirus (hMPV) is a member of the Pneumoviridae family, discovered in 2001 and now recognized as a significant cause of respiratory illness across all age groups. Clinical presentation includes upper-respiratory symptoms (cough, congestion, fever), lower-respiratory illness (bronchiolitis in young children, pneumonia in older adults), and exacerbations of underlying asthma and COPD (CDC).

Burden is highest in young children (especially under 5 years), older adults (65+), and immunocompromised patients. Severity overlaps substantially with RSV. Co-infection with other respiratory pathogens (RSV, influenza, SARS-CoV-2, rhinovirus) is common during peak seasons and may worsen clinical course in immunocompromised hosts.

Diagnosis is by RT-PCR; multiplex respiratory viral panels include hMPV alongside other common respiratory pathogens. Antigen detection is less sensitive than PCR. Diagnostic testing is recommended in hospitalized patients with severe respiratory illness, immunocompromised hosts, and outbreak settings.

Seasonality in temperate climates is typically February–May, often peaking after the influenza and RSV peaks; this delayed peak can extend the overall respiratory-virus season. Wastewater surveillance through WastewaterSCAN tracks community-level hMPV circulation alongside other respiratory viruses.`,
      primary: 'cdc-respiratory-viruses',
      additional: ['wastewaterscan'],
    },
    {
      id: 'diagnostic-testing',
      title: 'Diagnostic testing',
      body: `Multiplex respiratory PCR panels are the preferred diagnostic approach during peak respiratory virus season. Common panels detect hMPV alongside RSV, influenza A/B, SARS-CoV-2, parainfluenza 1–4, adenovirus, rhinovirus/enterovirus, and others. Panel composition varies by manufacturer and platform; verify the local laboratory's specific assay.

Specimen of choice is a nasopharyngeal swab in viral transport medium; nasopharyngeal aspirate is acceptable in young children, and oropharyngeal swab is acceptable when NP collection is not feasible. Specimens should be transported on ice and processed within standard timeframes per the laboratory's specifications.

There is currently no licensed vaccine or specific antiviral for hMPV. Management is supportive: oxygen, hydration, respiratory support (HFNC, BiPAP, intubation as needed). Bronchodilators may be considered case-by-case for documented airway reactivity but are not routinely recommended for hMPV bronchiolitis.

Infection prevention requires standard, contact, and droplet precautions per facility infection-control policy. Patients should be placed in a single-patient room or cohorted with confirmed hMPV cases. Dedicated equipment and enhanced terminal cleaning are appropriate during outbreaks in healthcare or long-term-care settings.`,
      primary: 'cdc-respiratory-viruses',
      additional: ['wastewaterscan'],
    },
  ],

  // ===========================================================================
  // Lassa fever
  // ===========================================================================
  'lassa-fever-2026': [
    {
      id: 'clinical-profile',
      title: 'Clinical profile',
      body: `Lassa fever is caused by Lassa mammarenavirus, transmitted to humans primarily through contact with food or household items contaminated by urine or feces of infected Mastomys natalensis rodents. Person-to-person transmission occurs through direct contact with body fluids of infected patients, particularly in healthcare settings without adequate PPE (WHO; CDC).

Incubation is 6–21 days. Approximately 80% of infections are mild or asymptomatic. Symptomatic disease begins with gradual onset of fever, malaise, headache, and pharyngitis, progressing in approximately 20% of cases to severe disease with hemorrhagic features, pleural effusion, ARDS, encephalopathy, and shock. Sensorineural hearing loss occurs in approximately 25% of symptomatic survivors and may be permanent.

Pregnant patients have significantly higher case-fatality, particularly in the third trimester, with risk of fetal loss. Standard precautions plus contact and droplet precautions are recommended; airborne precautions for aerosol-generating procedures. Specimen handling requires BSL-4 containment for confirmatory testing (RT-PCR; viral culture).

Ribavirin has activity against Lassa virus and is recommended for suspected severe cases when initiated early in the clinical course. Treatment efficacy decreases substantially after day 6 of illness, emphasizing the importance of early recognition and prompt initiation. Coordinate ribavirin access through CDC and the state public health laboratory.`,
      primary: 'who-disease-outbreak-news',
      additional: ['cdc-current-outbreaks', 'africa-cdc-outbreaks'],
    },
    {
      id: 'ppe-and-isolation',
      title: 'PPE & isolation',
      body: `Per WHO and CDC VHF guidance, suspected Lassa fever requires standard, contact, and droplet precautions at minimum, with airborne precautions added for aerosol-generating procedures. PPE for direct care includes fluid-resistant gown or coverall, double gloves, fit-tested N95 or PAPR, face shield, and waterproof boot covers (WHO VHF guidelines).

Patients should be isolated in a single-patient room with private bathroom and dedicated equipment. AIIR is preferred where available. Trained observers should monitor donning and doffing; doffing errors are a documented risk for HCW exposure. Healthcare facilities receiving suspected cases should activate institutional VHF response protocols and notify public health authorities.

Returning travelers from West African endemic zones with fever within 21 days should be evaluated for Lassa fever using the CDC clinical criteria. Coordinate specimen collection and testing with CDC Emergency Operations Center (770-488-7100) and the state public health laboratory before drawing blood; BSL-4 containment is required for confirmatory testing.

Exposed healthcare workers should be monitored daily for symptoms for 21 days following the last exposure. Symptomatic exposed workers should be isolated and tested. Asymptomatic high-risk exposures may warrant ribavirin post-exposure prophylaxis on a case-by-case basis in consultation with CDC.`,
      primary: 'who-disease-outbreak-news',
      additional: ['cdc-han'],
    },
  ],

  // ===========================================================================
  // Chikungunya
  // ===========================================================================
  'chikungunya-2026': [
    {
      id: 'clinical-profile',
      title: 'Clinical profile',
      body: `Chikungunya virus (CHIKV) is an arthropod-borne alphavirus transmitted primarily by Aedes aegypti and Aedes albopictus mosquitoes. Clinical presentation typically begins 3–7 days after the infectious bite with acute high fever, severe polyarthralgia (often disabling), maculopapular rash, headache, myalgia, and conjunctivitis (PAHO; CDC).

The acute phase resolves over 7–10 days. However, 30–40% of patients develop chronic arthralgia and arthritis that can persist for months to years; risk factors for chronic disease include older age, female sex, and higher acute viral load. Chronic CHIKV arthropathy can be severely disabling and difficult to distinguish from rheumatoid arthritis without serologic testing.

Mortality is low but documented in older adults, immunocompromised patients, and neonates infected vertically. Atypical presentations include encephalitis, myocarditis, and bullous skin lesions in neonates and older adults. Coinfection with dengue and Zika is common in regions where these viruses co-circulate; differential diagnosis is critical given overlapping clinical presentations.

Diagnosis is by RT-PCR during the viremic phase (first 5–7 days) or serology (IgM, IgG) later in illness. There is no specific antiviral; management is supportive (rest, fluids, NSAIDs after dengue is ruled out). Acetaminophen rather than NSAIDs should be used during the acute febrile phase until dengue has been excluded.`,
      primary: 'paho-epi-alerts',
      additional: ['cdc-current-outbreaks'],
    },
    {
      id: 'vector-control',
      title: 'Vector control & vaccination',
      body: `Vector control remains the primary prevention strategy in endemic areas: source reduction (eliminating standing water in containers, tires, gutters), larviciding, residual indoor spraying, and personal protection (DEET-, picaridin-, or IR3535-containing repellents; long sleeves; permethrin-treated clothing). Community engagement is essential — most breeding sites are within or immediately around homes (PAHO; CDC).

The licensed chikungunya vaccine Ixchiq (live-attenuated, Valneva) was FDA-approved in 2023 for adults 18 and older at increased risk of exposure. ACIP recommendations may evolve as post-licensure data accumulate; verify current eligibility and contraindications, particularly for older adults given reported serious adverse events in early post-licensure surveillance.

Aedes aegypti and Aedes albopictus are established in the southern United States (Florida, Texas, Hawaii, parts of the Gulf Coast and Southeast). Autochthonous CHIKV transmission has been documented sporadically in Florida and other Gulf states. Travelers returning from outbreak regions with febrile arthralgia should be evaluated for CHIKV; CDC arbovirus testing is available through state health departments.

EMS and ED clinicians in vector-establishment zones should maintain index of suspicion for CHIKV alongside dengue and Zika in symptomatic returning travelers and local residents. Coordinate suspected case reporting with state and local arbovirus surveillance programs. Local cases of autochthonous transmission trigger heightened vector-control response.`,
      primary: 'paho-epi-alerts',
      additional: ['cdc-current-outbreaks'],
    },
  ],

  // ===========================================================================
  // Candida auris
  // ===========================================================================
  'candida-auris-wastewater-2026': [
    {
      id: 'infection-prevention',
      title: 'Infection prevention in healthcare',
      body: `Candida auris colonization in patients can persist for months and is detected on skin, in respiratory and urinary tracts, and on environmental surfaces. CDC infection-prevention recommendations include single-patient rooms (or cohorting confirmed cases), contact precautions, dedicated single-use or thoroughly disinfected reusable equipment, and pre-admission screening of patients from facilities with documented C. auris transmission (CDC).

Environmental cleaning requires EPA List P or List K disinfectants effective against C. auris. Many quaternary ammonium products commonly used in healthcare have reduced efficacy; verify product registration against C. auris specifically. Enhanced terminal cleaning is recommended at discharge or transfer. Surfaces with high hand-contact (bed rails, call buttons, monitors) warrant frequent intermediate cleaning during the patient's stay.

Hand hygiene with alcohol-based hand sanitizer is effective against C. auris on healthcare-worker hands; soap-and-water washing is also effective. Glove use during contact with the patient or environment does not replace hand hygiene before and after.

Inter-facility communication is essential. When transferring a patient with known or suspected C. auris colonization or infection, the receiving facility must be notified in advance so single-room isolation and contact precautions can be in place at arrival. State and local health departments coordinate facility-to-facility communication and outbreak response.`,
      primary: 'cdc-current-outbreaks',
      additional: ['wastewaterscan'],
    },
    {
      id: 'lab-identification',
      title: 'Laboratory identification',
      body: `Many commercial yeast identification platforms misidentify Candida auris as related species (C. haemulonii, C. famata, C. duobushaemulonii, C. lusitaniae, Saccharomyces cerevisiae, and others). MALDI-TOF mass spectrometry with an updated reference library reliably identifies C. auris; many older library versions do not include it (CDC).

When a yeast isolate is identified as one of the commonly misidentified species and is recovered from a non-sterile site in a high-risk patient (recent international healthcare exposure, residence in a long-term acute-care facility, or temporal-geographic association with a known outbreak), suspect C. auris and forward the isolate to a reference laboratory for confirmatory identification.

Antifungal susceptibility testing is essential for clinical management because multidrug resistance is common: approximately 90% of isolates are fluconazole-resistant, 30% echinocandin-resistant, and a subset (varying by region and clade) are pan-resistant to all three antifungal classes (echinocandins, azoles, polyenes). Empiric therapy decisions should be informed by local susceptibility patterns and consultation with antimicrobial stewardship.

Screening of high-risk patients on admission uses composite swabs of axilla and groin processed by selective culture or PCR. Surveillance cultures should be repeated based on local risk assessment and facility outbreak status. Coordinate screening protocols with infection prevention and the state public health laboratory.`,
      primary: 'cdc-current-outbreaks',
      additional: ['wastewaterscan'],
    },
  ],

  // ===========================================================================
  // Screwworm
  // ===========================================================================
  'screwworm-onehealth-2026': [
    {
      id: 'animal-detection',
      title: 'Animal detection & surveillance',
      body: `New World screwworm (Cochliomyia hominivorax) infests warm-blooded animals, depositing eggs on the margins of wounds or natural body openings. Larvae burrow into living tissue, causing tissue destruction (myiasis). Untreated infestations are often fatal in livestock and wildlife and represent a serious animal-health threat to the US livestock industry (USDA APHIS).

USDA APHIS coordinates surveillance and sterile-insect-technique (SIT) operations with Mexico, Panama, and Central American partners through the Commission for the Eradication and Prevention of Screwworm (COPEG). Sustained SIT releases at the Darien Gap have historically maintained a biological barrier preventing northward spread; the recent breakthrough into Central America and southern Mexico represents a significant operational concern.

Veterinarians and livestock producers in border states (Texas, New Mexico, Arizona, California, and Florida) should report any suspect maggot infestation in livestock or wildlife wounds. Suspected specimens (larvae preserved in 70% ethanol) should be submitted to a USDA APHIS-approved laboratory for species identification. The APHIS hotline for screwworm detection is 1-866-536-7593.

USDA APHIS conducts surveillance at livestock import points and supports state animal-health officials in monitoring herd health. Surveillance methodology includes wound inspection in border-region livestock, trapping of adult flies in select sites, and coordination with Mexican animal-health authorities (SENASICA) on real-time outbreak intelligence.`,
      primary: 'usda-aphis-screwworm-status',
      additional: ['woah-wahis'],
    },
    {
      id: 'human-myiasis',
      title: 'Human myiasis',
      body: `Human screwworm infestation (myiasis) is rare and typically occurs through contact with wounds, ulcers, or natural body openings (eyes, ears, nose, mouth, genitalia) when exposed to gravid female flies in endemic areas. Risk factors include open wounds, recent surgery, debilitating illness, alcoholism, and exposure in active outbreak zones.

Clinical presentation depends on infestation site: cutaneous wound infestation presents with visible larvae in tissue, foul odor, serosanguineous discharge, and pain often disproportionate to the wound size. Cavity infestations (oral, nasal, ocular, aural) can cause significant tissue destruction and require urgent surgical intervention.

Management requires mechanical removal of all larvae under appropriate anesthesia and analgesia, followed by wound care, prophylactic antibiotics where indicated, and tetanus prophylaxis per standard wound-care protocols. Ivermectin has been used adjunctively in some cases. Consult infectious disease for treatment guidance in complicated presentations.

Cases of human myiasis from C. hominivorax must be reported to local and state health departments; suspect cases require entomologic confirmation through a parasitology reference laboratory. Travelers returning from endemic regions with non-healing wounds should be evaluated for myiasis. Cross-border coordination with Mexican and Central American health authorities supports case management for travelers and recent immigrants.`,
      primary: 'usda-aphis-screwworm-status',
      additional: ['woah-wahis'],
    },
  ],

  // ===========================================================================
  // FIFA World Cup 2026
  // ===========================================================================
  'fifa-world-cup-2026-prep': [
    {
      id: 'surveillance-planning',
      title: 'Surveillance planning',
      body: `Mass-gathering health planning for the 2026 FIFA World Cup integrates syndromic surveillance at host-city EDs and EMS, enhanced sentinel surveillance for respiratory and enteric pathogens, and accelerated reporting timelines for nationally notifiable conditions. WHO's mass-gathering risk-assessment framework (WHO-MG checklist) informs national, state, and host-city planning across the US, Canada, and Mexico (WHO).

Pre-event risk assessment characterizes pathogens with elevated importation risk during the tournament period: arboviral diseases (dengue, chikungunya, Zika), respiratory viruses (influenza, COVID-19, RSV), measles and other vaccine-preventable diseases, foodborne illness, and any active outbreak in regions with significant participating-team attendance. CDC, PHAC, and Mexican health authorities coordinate cross-border surveillance intelligence-sharing.

Host-city public health departments operate Joint Information Centers (JICs) and Joint Operations Centers (JOCs) during tournament play, with embedded EMS, hospital, and infection-prevention liaisons. Daily situational-awareness reports synthesize syndromic data, lab signal, and event-day intelligence. Communications protocols with venue medical, hotel medical, and host-city EMS are pre-established.

Multilingual public communications materials are produced in collaboration with FIFA, host committees, and consular partners. Travel health advisories, vaccination reminders, mosquito-bite prevention, and food-and-water safety guidance are disseminated through official channels and partner organizations.`,
      primary: 'who-mass-gatherings',
      additional: ['cdc-current-outbreaks'],
    },
    {
      id: 'ems-surge-readiness',
      title: 'EMS surge readiness',
      body: `Host-city EMS systems are pre-positioning medical strike teams, additional ambulance units, and bilingual paramedic teams for the tournament period. Venue medical plans include venue-based first-aid stations, embedded ALS teams at stadiums, and pre-established transport agreements with receiving Level 1 trauma centers and tertiary care hospitals.

Cross-border medical evacuation protocols between US, Canadian, and Mexican EMS and emergency-management partners are validated through joint exercises. Air-medical and ground-transport agreements address mass-casualty scenarios, repatriation of injured spectators, and continuity of care for chronic medical conditions in international visitors.

Hospital surge plans incorporate diversion criteria, mutual-aid agreements with regional partners, and pharmacy/blood-bank stockpiling for anticipated demand. ICU and ED capacity is monitored daily during the tournament; pre-event drills validate decontamination, mass-casualty triage, and integration with FBI/DHS security-medical operations.

EMS providers serving host cities should validate language access through translator services or bilingual personnel, confirm interoperability with venue medical operations, and review CONTENT-STANDARDS-compliant outbreak guidance pertinent to participating-team home regions. Verify current venue medical plans, contact lists, and mutual-aid activation procedures with your local host committee.`,
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
  return attr(
    source.authority,
    source.title,
    source.publicationDate ?? source.lastVerified,
    source.url
  )
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
        // Insert new sections BEFORE the existing "operational-guidance" so the new
        // sections appear first in the rendered order
        const opIdx = signal.detailSections.findIndex((s) => s.id === 'operational-guidance')
        if (opIdx >= 0) {
          signal.detailSections.splice(opIdx, 0, newSection)
        } else {
          signal.detailSections.push(newSection)
        }
        addedCount += 1
      }
    }
  }

  writeFileSync(SIGNALS_PATH, JSON.stringify(signals, null, 2) + '\n')

  const totalSections = signals.reduce((sum, s) => sum + (s.detailSections?.length ?? 0), 0)
  console.log(`[deepen-sections] added ${addedCount} new sections, replaced ${replacedCount}; total ${totalSections} sections across ${signals.length} signals`)
}

main()
