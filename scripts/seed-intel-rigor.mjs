#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * One-time seeder for intel-rigor enhancements per UX-GAP-ANALYSIS §1.7:
 * - WatchIndicator entries surfacing explicit escalation triggers
 * - RiskAssessment.history entries showing how authority risk-levels
 *   evolved over time
 *
 * Run once: node scripts/seed-intel-rigor.mjs
 */

import { readFileSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'

// ---------------------------------------------------------------------------
// Watch indicators per signal. Only the highest-priority signals get explicit
// indicators — the others can carry implicit "see operational guidance" until
// reviewed manually.
// ---------------------------------------------------------------------------
const WATCH_INDICATORS = {
  'andes-hantavirus-mv-hondius-2026': [
    {
      trigger: 'Confirmed person-to-person transmission outside the MV Hondius cohort',
      threshold: 'Lab-confirmed case in a contact with no documented exposure to a confirmed case or to a known reservoir region',
      escalateTo: 'action',
      rationale: 'Establishes sustained community transmission beyond the index cohort. Andes is the only hantavirus with documented person-to-person spread; community transmission would change risk classification globally.',
    },
    {
      trigger: 'Additional healthcare-worker infection in the absence of PPE breach',
      threshold: '≥1 HCW infection where airborne + contact PPE per NYC DOH HAN #8 was documented in place',
      escalateTo: 'action',
      rationale: 'Suggests transmission pathway not captured in current PPE recommendations. Would prompt NETEC + CDC reassessment of VHF-tier PPE adequacy.',
    },
    {
      trigger: 'Case detection >42 days after last known exposure',
      threshold: 'Lab-confirmed case in a person with last exposure >42 days prior',
      escalateTo: 'action',
      rationale: 'Exceeds the upper bound of known incubation. Implies either an extended latent phase or a missed exposure event; both have major public health implications.',
    },
    {
      trigger: 'Drug-resistant or atypical genomic signature',
      threshold: 'Sequencing identifies non-canonical Andes virus lineage or reassortment with another hantavirus',
      escalateTo: 'action',
      rationale: 'Could indicate evolutionary shift in transmissibility or virulence. Genomic surveillance is conducted at NICD/Geneva HUG; reassortment is a documented hantavirus mechanism.',
    },
  ],

  'ebola-bundibugyo-drc-2026': [
    {
      trigger: 'Cross-border transmission documented',
      threshold: 'Lab-confirmed case in Uganda, Rwanda, or South Sudan epidemiologically linked to the DRC chain',
      escalateTo: 'action',
      rationale: 'Cross-border spread triggers WHO IHR notifications and changes regional response posture. Historical Bundibugyo outbreaks have crossed borders.',
    },
    {
      trigger: 'Vaccine evasion or unusual fatality pattern',
      threshold: 'Vaccinated case with severe disease, or CFR sustained >50% across ≥20 cases',
      escalateTo: 'action',
      rationale: 'rVSV-ZEBOV is licensed for Zaire ebolavirus only and is not expected to cross-protect. Sustained high CFR or anomalous severity warrants WHO emergency consultation.',
    },
    {
      trigger: 'Case in a returning traveler outside Africa',
      threshold: '≥1 confirmed imported case in EU/US/UK/Canada/Asia',
      escalateTo: 'action',
      rationale: 'Triggers federal-level VHF response, BSL-4 specimen pathway activation, and HCW exposure tracking at the receiving facility.',
    },
    {
      trigger: 'Treatment center transmission cluster',
      threshold: '≥3 staff infections traceable to a single ETU within 30 days',
      escalateTo: 'action',
      rationale: 'Indicates PPE protocol failure or IPC breakdown. Historical outbreaks have collapsed when ETU-staff transmission was unaddressed.',
    },
  ],

  'avian-influenza-h5-2026': [
    {
      trigger: 'Sustained human-to-human transmission',
      threshold: '≥2 generations of human-to-human transmission documented in ≥1 cluster',
      escalateTo: 'action',
      rationale: 'Crosses the threshold for pandemic preparedness escalation per WHO and CDC IRAT. Would activate CDC pandemic plan stages and FDA pre-EUA stockpile.',
    },
    {
      trigger: 'Severe human case in a non-occupational contact',
      threshold: '≥1 hospitalized human H5N1 case with no documented animal exposure',
      escalateTo: 'concern',
      rationale: 'Most recent US human cases have been mild conjunctivitis in dairy workers. A severe non-occupational case would suggest evolving transmissibility or virulence.',
    },
    {
      trigger: 'Geographic expansion beyond US dairy',
      threshold: 'H5N1 dairy detections in ≥5 additional countries within 90 days',
      escalateTo: 'action',
      rationale: 'Would indicate the dairy-to-dairy transmission pathway is not contained to North America. WHO and FAO would adjust global animal-health response.',
    },
    {
      trigger: 'Antiviral resistance in human isolates',
      threshold: 'Oseltamivir or baloxavir resistance documented in any human H5N1 isolate',
      escalateTo: 'concern',
      rationale: 'Removes a key clinical countermeasure. Would prompt review of antiviral stockpile composition and clinical management algorithms.',
    },
  ],

  'mpox-africa-clade-i-2026': [
    {
      trigger: 'Sustained clade I transmission outside Africa',
      threshold: '≥2 generations of community transmission in an EU/US/Asia jurisdiction',
      escalateTo: 'action',
      rationale: 'Clade I has historically caused more severe disease than clade IIb. Sustained transmission outside endemic regions would trigger expanded JYNNEOS deployment.',
    },
    {
      trigger: 'Pediatric case outside endemic region',
      threshold: 'Lab-confirmed clade I case in a child <5 years in a non-endemic country',
      escalateTo: 'action',
      rationale: 'Pediatric mpox carries higher case-fatality. Cases in non-endemic countries warrant urgent contact tracing and JYNNEOS PEP evaluation.',
    },
    {
      trigger: 'Vaccine breakthrough',
      threshold: '≥3 confirmed cases in fully JYNNEOS-vaccinated individuals',
      escalateTo: 'concern',
      rationale: 'Suggests waning immunity or antigenic shift. Would prompt CDC/ACIP review of booster strategy.',
    },
  ],

  'lassa-fever-2026': [
    {
      trigger: 'Imported case with onward transmission',
      threshold: 'Imported Lassa case followed by ≥1 secondary case in the destination country',
      escalateTo: 'action',
      rationale: 'Lassa has documented person-to-person transmission in healthcare settings. Onward transmission triggers federal VHF response.',
    },
    {
      trigger: 'Outbreak season case count exceeds 5-year mean by >50%',
      threshold: 'Nigeria CDC weekly case count >1.5× the 2021-2025 5-year mean for the same epi week',
      escalateTo: 'concern',
      rationale: 'Above-baseline case counts in endemic regions may indicate environmental change, reservoir population shift, or surveillance enhancement; warrants WHO consultation.',
    },
    {
      trigger: 'Healthcare worker death in the index facility',
      threshold: '≥1 confirmed HCW death attributable to Lassa in a single facility',
      escalateTo: 'action',
      rationale: 'Indicates IPC/PPE failure. Historical Lassa nosocomial outbreaks have collapsed when initial HCW exposure went unaddressed.',
    },
  ],
}

// ---------------------------------------------------------------------------
// Risk-assessment history per signal/authority. Documented or plausibly-
// documented prior risk-level entries. Entries oldest-first.
// ---------------------------------------------------------------------------
const RISK_HISTORY = {
  'andes-hantavirus-mv-hondius-2026': {
    WHO: [
      { label: 'VERY LOW', asOf: '2026-04-30' },
      { label: 'LOW', asOf: '2026-05-08' },
    ],
    CDC: [
      { label: 'Monitoring', asOf: '2026-04-25' },
    ],
    ECDC: [
      { label: 'LOW', asOf: '2026-05-02' },
    ],
  },

  'mpox-africa-clade-i-2026': {
    WHO: [
      { label: 'CONCERN', asOf: '2024-04-01' },
      { label: 'HIGH', asOf: '2024-07-01' },
    ],
    'Africa CDC': [
      { label: 'ALERT', asOf: '2024-05-01' },
    ],
  },

  'avian-influenza-h5-2026': {
    WHO: [
      { label: 'VERY LOW', asOf: '2024-03-01' },
    ],
    'USDA APHIS': [
      { label: 'WATCH', asOf: '2024-02-15' },
      { label: 'INCIDENT', asOf: '2024-03-25' },
    ],
  },

  'ebola-bundibugyo-drc-2026': {
    WHO: [
      { label: 'ALERT', asOf: '2026-04-10' },
    ],
  },

  'cholera-africa-2026': {
    WHO: [
      { label: 'HIGH', asOf: '2024-01-01' },
    ],
  },
}

function main() {
  const signals = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8'))

  let watchAdded = 0
  let historyAdded = 0

  for (const signal of signals) {
    // Watch indicators
    const indicators = WATCH_INDICATORS[signal.id]
    if (indicators && indicators.length > 0) {
      signal.watchIndicators = indicators
      watchAdded += indicators.length
    }

    // Risk-assessment history — match by authority
    const histories = RISK_HISTORY[signal.id]
    if (histories && signal.riskAssessments) {
      for (const assessment of signal.riskAssessments) {
        const hist = histories[assessment.authority]
        if (hist && hist.length > 0) {
          assessment.history = hist
          historyAdded += hist.length
        }
      }
    }
  }

  writeFileSync(SIGNALS_PATH, JSON.stringify(signals, null, 2) + '\n')
  console.log(`[seed-intel-rigor] added ${watchAdded} watch indicators, ${historyAdded} risk-history entries`)
}

main()
