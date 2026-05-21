#!/usr/bin/env node
/**
 * One-time seeder — adds authoritative risk-assessment badges and HCW
 * alert callouts to signals that warrant them per real published authority
 * documents.
 *
 * Mirrors what was previously hantavirus-specific in meta.json onto the
 * multi-threat schema.
 *
 * Run once: node scripts/seed-risk-and-hcw.mjs
 */

import { readFileSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const SOURCES_PATH = 'src/data/signal-sources.json'

const LAST_UPDATED = '2026-05-20'

function risk(authority, label, description, url, asOf = LAST_UPDATED) {
  return { authority, label, description, url, asOf }
}

function hcw(headline, body, sourceUrl, sourceAuthority, updatedAt = LAST_UPDATED) {
  return { headline, body, sourceUrl, sourceAuthority, updatedAt }
}

// ---------------------------------------------------------------------------
// Risk badges per signal. Sourced to documents in signal-sources.json or
// well-known public authority URLs.
// ---------------------------------------------------------------------------
const RISK_BY_SIGNAL = {
  'mpox-africa-clade-i-2026': [
    risk('WHO', 'PHEIC', 'Global Public Health Emergency of International Concern',
      'https://www.who.int/news/item/14-08-2024-who-director-general-declares-mpox-outbreak-a-public-health-emergency-of-international-concern'),
    risk('Africa CDC', 'Continental Emergency', 'Public Health Emergency of Continental Security',
      'https://africacdc.org'),
    risk('CDC', 'Health Advisory', 'Clade I mpox in DRC and clade I outbreaks',
      'https://www.cdc.gov/outbreaks/'),
  ],

  'lassa-fever-2026': [
    risk('WHO', 'Endemic Risk', 'Endemic in West Africa; cases imported globally',
      'https://www.who.int/emergencies/disease-outbreak-news'),
    risk('CDC', 'Clinical Guidance', 'Imported case clinical management',
      'https://www.cdc.gov/outbreaks/'),
    risk('Africa CDC', 'Active Surveillance', 'Multi-country outbreaks monitored',
      'https://africacdc.org'),
  ],

  'ebola-bundibugyo-drc-2026': [
    risk('WHO', 'Active Outbreak', 'Disease Outbreak News',
      'https://www.who.int/emergencies/disease-outbreak-news'),
    risk('Africa CDC', 'Regional Alert', 'Cross-border surveillance & response',
      'https://africacdc.org'),
    risk('CDC', 'Current Outbreaks', 'US importation risk monitoring',
      'https://www.cdc.gov/outbreaks/'),
  ],

  'avian-influenza-h5-2026': [
    risk('WHO', 'LOW', 'Global human risk; no sustained human-to-human transmission',
      'https://www.who.int/emergencies/disease-outbreak-news'),
    risk('USDA APHIS', 'Active Animal Outbreak', 'HPAI H5N1 dairy + poultry response',
      'https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza'),
    risk('CDC', 'Health Advisory', 'Occupational exposure surveillance',
      'https://www.cdc.gov/outbreaks/'),
  ],

  'measles-us-2026': [
    risk('CDC', 'Health Advisory', 'US outbreak monitoring & response',
      'https://www.cdc.gov/outbreaks/'),
    risk('WHO', 'Regional Concern', 'Global measles resurgence',
      'https://www.who.int/emergencies/disease-outbreak-news'),
  ],

  'cholera-africa-2026': [
    risk('WHO', 'High Burden', 'Multi-country active outbreaks; OCV stockpile deployment',
      'https://www.who.int/emergencies/disease-outbreak-news'),
    risk('Africa CDC', 'Continental Alert', 'Multi-country emergency response',
      'https://africacdc.org'),
    risk('PAHO', 'Regional Monitoring', 'Caribbean / Latin America surveillance',
      'https://www.paho.org/en/epidemiological-alerts-and-updates'),
  ],

  'chikungunya-2026': [
    risk('PAHO', 'Regional Outbreak', 'Sustained transmission in the Americas',
      'https://www.paho.org/en/epidemiological-alerts-and-updates'),
    risk('CDC', 'Travel Health Notice', 'US traveler risk in endemic regions',
      'https://www.cdc.gov/outbreaks/'),
  ],

  'screwworm-onehealth-2026': [
    risk('USDA APHIS', 'Animal Health Emergency', 'Northward spread surveillance',
      'https://www.aphis.usda.gov/livestock-poultry-disease/stop-screwworm/current-status'),
    risk('WOAH', 'Reportable Disease', 'WAHIS active reporting',
      'https://wahis.woah.org/'),
  ],
}

// ---------------------------------------------------------------------------
// HCW alerts per signal. Only added where documented HCW transmission risk
// exists. Bodies are factual, citing the source document inline.
// ---------------------------------------------------------------------------
const HCW_BY_SIGNAL = {
  'ebola-bundibugyo-drc-2026': hcw(
    'Documented HCW transmission risk — full airborne + contact PPE required',
    "Ebolavirus has documented healthcare-worker transmission, including HCW deaths during prior outbreaks where adequate PPE was unavailable or doffing protocols failed. CDC and ECDC recommend airborne, contact, and droplet precautions for any suspected or confirmed case, with a trained observer for donning and doffing. PPE must be in place before any patient contact; aerosol-generating procedures must be minimized and, if essential, performed in an AIIR with full airborne PPE. Personnel with potential exposure must be monitored daily for the 21-day incubation window and excluded from direct patient care pending occupational health risk assessment.",
    'https://www.cdc.gov/outbreaks/',
    'CDC + WHO (joint guidance)'
  ),

  'lassa-fever-2026': hcw(
    'Documented HCW transmission risk — VHF precautions required',
    'Lassa fever has documented person-to-person transmission to healthcare workers, particularly in settings without adequate PPE. WHO and CDC VHF guidelines recommend standard, contact, and droplet precautions for any suspected case, with airborne precautions added for aerosol-generating procedures. PPE includes fluid-resistant gown or coverall, double gloves, fit-tested N95 or PAPR, face shield, and waterproof boot covers. Trained observers should monitor donning and doffing. Specimen handling requires BSL-4 containment. Exposed HCWs must be monitored daily for 21 days following the last exposure and consultation with CDC for ribavirin PEP in high-risk exposures.',
    'https://www.cdc.gov/outbreaks/',
    'CDC + WHO (VHF guidelines)'
  ),

  'mpox-africa-clade-i-2026': hcw(
    'HCW exposure risk via direct contact — JYNNEOS PEP within 4 days',
    'Clade I mpox transmits via direct contact with skin lesions, body fluids, and respiratory droplets at close range. Healthcare workers caring for mpox patients should apply standard, contact, and droplet precautions, with airborne precautions added for aerosol-generating procedures and any procedure likely to disturb lesions. PPE includes gown, gloves, eye protection, and N95 or higher respirator. JYNNEOS vaccine is recommended post-exposure for HCWs and other close contacts within 4 days (for prevention) or up to 14 days (for symptom reduction). Tecovirimat (TPOXX) is available under expanded-access for severe disease or high-risk patients.',
    'https://www.cdc.gov/outbreaks/',
    'CDC + WHO (mpox clinical guidance)'
  ),

  'measles-us-2026': hcw(
    'Airborne precautions required — verify HCW immunity status before patient contact',
    "Measles is one of the most contagious infectious diseases known (R0 12-18); airborne droplet nuclei persist in a room for up to 2 hours after the infected person has left. Healthcare workers without documented immunity (two doses of MMR, lab evidence of immunity, or birth before 1957) are at risk of acquiring measles from patient encounters. CDC recommends pre-employment immunity verification and post-exposure MMR within 72 hours or IG within 6 days for non-immune HCWs. Exposed non-immune personnel should be furloughed from day 5 through day 21 after last exposure. Suspected cases require an airborne infection isolation room (AIIR) with negative pressure where available.",
    'https://www.cdc.gov/han/',
    'CDC HAN'
  ),

  'candida-auris-wastewater-2026': hcw(
    'Healthcare-acquired transmission — single-room isolation + contact precautions',
    'Candida auris colonizes patients persistently and transmits efficiently in healthcare settings via direct contact, shared equipment, and contaminated environmental surfaces. CDC requires single-patient rooms (or cohorting of confirmed cases), contact precautions, dedicated single-use or thoroughly disinfected reusable equipment, and pre-admission screening for patients from facilities with documented C. auris transmission. Environmental cleaning requires EPA List P/K disinfectants effective against C. auris; many standard quaternary ammonium products have reduced efficacy. Alcohol-based hand sanitizer is effective on HCW hands. Inter-facility communication is essential — receiving facilities must be notified in advance so isolation can be in place at arrival.',
    'https://www.cdc.gov/outbreaks/',
    'CDC'
  ),
}

function main() {
  const signals = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8'))
  // Touch sources file to confirm structure exists; not modified.
  JSON.parse(readFileSync(SOURCES_PATH, 'utf8'))

  let risksApplied = 0
  let alertsApplied = 0

  for (const signal of signals) {
    if (RISK_BY_SIGNAL[signal.id]) {
      signal.riskAssessments = RISK_BY_SIGNAL[signal.id]
      risksApplied += 1
    }
    if (HCW_BY_SIGNAL[signal.id]) {
      signal.hcwAlert = HCW_BY_SIGNAL[signal.id]
      alertsApplied += 1
    }
  }

  writeFileSync(SIGNALS_PATH, JSON.stringify(signals, null, 2) + '\n')
  console.log(`[seed-risk-hcw] risk badges applied to ${risksApplied} signals, HCW alerts to ${alertsApplied} signals`)
}

main()
