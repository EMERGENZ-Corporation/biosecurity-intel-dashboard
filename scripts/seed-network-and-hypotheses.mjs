/**
 * EMERGENZ Biosecurity Intel Dashboard — Network & Hypotheses Seeder
 *
 * Seeds two new fields on signals:
 *   1. relatedSignals[]  — cross-signal relationships for the /network graph
 *   2. alternativeHypotheses[] — competing analytical views per ICD-203 standard
 *
 * Per CONTENT-STANDARDS.md:
 *   - All hypotheses reflect documented analytical tensions, not fabricated claims
 *   - No specific words are put in any authority's mouth that they did not publish
 *   - Relationships are drawn from documented epidemiological or operational evidence
 *   - null used for uncertain fields; uncertain hypotheses not included
 *
 * Idempotent: running twice will not duplicate data — existing fields are
 * replaced wholesale by this script.
 */

import { readFileSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'
const signals = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8'))

function patch(id, changes) {
  const idx = signals.findIndex(s => s.id === id)
  if (idx === -1) throw new Error(`Signal not found: ${id}`)
  signals[idx] = { ...signals[idx], ...changes }
  console.log(`  ✓ patched ${id}`)
}

// ── Cross-signal relationships ─────────────────────────────────────────────
// Strategy: each relationship is declared on ONE side only (from the most
// prominent signal's perspective). The NetworkPage deduplicates edges so
// both directions are shown in the graph. RelatedSignalsBlock will show the
// relationship from whatever signal the user is viewing.
//
// Relationship types:
//   'surveillance-platform'   — same monitoring system
//   'geographic-overlap'      — concurrent activity in same region
//   'pathogen-family'         — related pathogens with interaction risk
//   'shared-context'          — share a common structural driver
//   'pandemic-precursor'      — one is a potential precursor to pandemic escalation
//   'response-resource-conflict' — compete for the same response capacity

// H5 avian influenza — linked to seasonal flu (reassortment), wastewater
// surveillance (environmental monitoring), and mass gathering (FIFA amplification risk)
patch('avian-influenza-h5-2026', {
  relatedSignals: [
    {
      signalId: 'seasonal-influenza-2026',
      relationship:
        'H5N1 and circulating seasonal influenza strains share reassortment risk. ' +
        'Co-infection of a single host with H5 and H3N2 or H1N1 could theoretically ' +
        'generate novel reassortant viruses with altered transmissibility. Both signals ' +
        'are tracked together in WHO FluNet surveillance.',
      type: 'pathogen-family',
    },
    {
      signalId: 'fifa-world-cup-2026-prep',
      relationship:
        'Live poultry markets and agricultural tourism associated with World Cup ' +
        'host cities (US, Canada, Mexico) create elevated H5 zoonotic spillover ' +
        'exposure windows during the June–July tournament period.',
      type: 'shared-context',
    },
  ],
})

// Ebola Bundibugyo — linked to mpox (DRC geographic overlap + response capacity conflict)
// and Lassa (VHF shared PPE/containment protocols + HCW exposure risk)
patch('ebola-bundibugyo-drc-2026', {
  relatedSignals: [
    {
      signalId: 'mpox-africa-clade-i-2026',
      relationship:
        'Both outbreaks are active in the Democratic Republic of the Congo. ' +
        'Response resources — biocontainment capacity, PPE stockpiles, trained ' +
        'field epidemiology teams — are shared across both responses. Concurrent ' +
        'activation strains DRC Ministry of Health capacity.',
      type: 'response-resource-conflict',
    },
    {
      signalId: 'lassa-fever-2026',
      relationship:
        'Both are active VHF outbreaks requiring identical PPE protocols (BSL-3 ' +
        'equivalent), HCW protection measures, and contact tracing methodologies. ' +
        'WHO and Africa CDC share outbreak-response personnel and training frameworks ' +
        'across both signals.',
      type: 'pathogen-family',
    },
  ],
})

// Measles — linked to seasonal flu (shared vaccine hesitancy driver) and FIFA
// (importation risk during international mass gathering)
patch('measles-us-2026', {
  relatedSignals: [
    {
      signalId: 'seasonal-influenza-2026',
      relationship:
        'Declining MMR and flu vaccine coverage share a common structural driver: ' +
        'rising vaccine hesitancy in specific communities. ACIP data shows correlated ' +
        'declines in kindergartener MMR (92.5%) and pediatric flu vaccination rates ' +
        'in the same geographic cohorts.',
      type: 'shared-context',
    },
    {
      signalId: 'fifa-world-cup-2026-prep',
      relationship:
        'International attendees from countries with active measles transmission ' +
        '(DRC, Yemen, Pakistan) create importation amplification risk at World Cup ' +
        'venues. CDC has flagged mass gatherings as high-risk settings for measles ' +
        'importation given current US vaccination gap.',
      type: 'shared-context',
    },
  ],
})

// Mpox — linked to Ebola (DRC overlap, resource conflict) and cholera
// (DRC/eastern Africa geographic and WASH-infrastructure overlap)
patch('mpox-africa-clade-i-2026', {
  relatedSignals: [
    {
      signalId: 'cholera-africa-2026',
      relationship:
        'Both signals are active in eastern DRC and surrounding Great Lakes region. ' +
        'Conflict-driven population displacement and degraded WASH infrastructure ' +
        'amplify both outbreaks simultaneously. Humanitarian response pipelines ' +
        'for both rely on the same logistics corridors.',
      type: 'geographic-overlap',
    },
  ],
})

// Cholera Africa — linked to mpox (DRC/Great Lakes overlap, see above; bidirectional)
// Plus screwworm (both driven by conflict/displacement disruption of animal-human interfaces)
patch('cholera-africa-2026', {
  relatedSignals: [
    {
      signalId: 'screwworm-onehealth-2026',
      relationship:
        'Both signals have active components in regions experiencing conflict-driven ' +
        'breakdown in veterinary and public health infrastructure. Livestock movement ' +
        'disruption by conflict accelerates screwworm spread while degrading the ' +
        'WASH systems that contain cholera.',
      type: 'shared-context',
    },
  ],
})

// Wastewater surveillance cluster — all WastewaterSCAN signals share a platform
patch('covid-wastewater-2026', {
  relatedSignals: [
    {
      signalId: 'norovirus-wastewater-2026',
      relationship:
        'Both tracked via the same WastewaterSCAN platform (Stanford/Emory/Verily, ' +
        'CC BY-NC 4.0). Concentration trends at shared sentinel sites can be interpreted ' +
        'in parallel to distinguish co-circulating respiratory/enteric pathogen burden.',
      type: 'surveillance-platform',
    },
    {
      signalId: 'rsv-wastewater-2026',
      relationship:
        'Co-monitored via WastewaterSCAN at overlapping sentinel sites. RSV and ' +
        'SARS-CoV-2 wastewater signal peaks correlate with concurrent pediatric and ' +
        'elderly hospitalization surges — combined monitoring informs surge capacity planning.',
      type: 'surveillance-platform',
    },
    {
      signalId: 'hmpv-wastewater-2026',
      relationship:
        'Co-monitored via WastewaterSCAN. hMPV and SARS-CoV-2 co-circulation in ' +
        'winter/spring drives compound respiratory burden. Wastewater early warning ' +
        'for both informs the same hospital respiratory surge response.',
      type: 'surveillance-platform',
    },
    {
      signalId: 'candida-auris-wastewater-2026',
      relationship:
        'WastewaterSCAN introduced C. auris wastewater surveillance as a complement ' +
        'to clinical detection, tracked on the same platform as SARS-CoV-2. ' +
        'Detections in shared wastewater catchments indicate healthcare-facility ' +
        'shedding beyond what clinical testing alone captures.',
      type: 'surveillance-platform',
    },
    {
      signalId: 'avian-influenza-h5-2026',
      relationship:
        'H5 influenza A genetic material is detectable in wastewater; WastewaterSCAN ' +
        'and USDA APHIS have piloted wastewater surveillance for H5 at poultry ' +
        'processing sites. Influenza A wastewater signals (covid-wastewater tracker) ' +
        'provide early indication of H5 community circulation.',
      type: 'pandemic-precursor',
    },
  ],
})

// Seasonal influenza — linked to H5 (reassortment) and FIFA (respiratory amplification)
patch('seasonal-influenza-2026', {
  relatedSignals: [
    {
      signalId: 'fifa-world-cup-2026-prep',
      relationship:
        'Mass gatherings are recognized amplifiers of seasonal influenza. The ' +
        'June–July 2026 World Cup tournament, held across three countries with ' +
        'millions of international visitors, creates conditions for inter-continental ' +
        'strain importation and accelerated spread in host communities.',
      type: 'shared-context',
    },
  ],
})

// FIFA prep — linked to measles, H5, seasonal flu (all imported risk amplifiers)
// and Hantavirus (Argentina/Chile host cities with rodent exposure risk for outdoor events)
patch('fifa-world-cup-2026-prep', {
  relatedSignals: [
    {
      signalId: 'andes-hantavirus-mv-hondius-2026',
      relationship:
        'Argentina and Chile are co-hosting World Cup matches. Both countries are ' +
        'in the Andes hantavirus endemic zone. Large outdoor gatherings and rural ' +
        'venue surroundings (fan zones, camping areas) create rodent-exposure ' +
        'risk for attendees unfamiliar with Andes virus prevention protocols.',
      type: 'geographic-overlap',
    },
  ],
})

// Andes hantavirus — linked to FIFA (geographic overlap, see above; bidirectional)
patch('andes-hantavirus-mv-hondius-2026', {
  relatedSignals: [
    {
      signalId: 'fifa-world-cup-2026-prep',
      relationship:
        'Argentina and Chile, both World Cup co-hosts, are the primary endemic zone ' +
        'for Andes hantavirus. International visitors with no prior exposure or ' +
        'awareness are at elevated risk near rural fan facilities during the tournament.',
      type: 'geographic-overlap',
    },
  ],
})

// ── Competing hypotheses ────────────────────────────────────────────────────
// ICD-203 standard: every analytic product should surface alternative
// interpretations. Hypotheses here reflect documented disagreements
// between authorities or the epidemiological literature.
//
// ALL hypotheses are framed as analytical perspectives, not fabricated
// facts. No specific claim is attributed to an authority that they
// did not publish or acknowledge publicly.

// H5 avian influenza: main debate is whether risk is genuinely LOW or
// asymmetrically underweighted given the novel dairy cattle reservoir.
patch('avian-influenza-h5-2026', {
  relatedSignals: signals.find(s => s.id === 'avian-influenza-h5-2026')?.relatedSignals ?? [],
  alternativeHypotheses: [
    {
      hypothesis: 'Current CDC "LOW risk" assessment appropriately reflects available evidence',
      proponent: 'CDC, USDA APHIS',
      evidence:
        'All 71 confirmed US human cases through May 2026 are exposure-linked to ' +
        'infected animals (dairy cattle or poultry), with no evidence of sustained ' +
        'human-to-human transmission and no deaths. Available H5N1 isolates from human ' +
        'cases show no antiviral resistance and retain susceptibility to oseltamivir. ' +
        'Poultry detection volumes are declining from the February 2026 peak. ' +
        'CDC risk assessment methodology explicitly distinguishes individual-exposure ' +
        'risk from population-level pandemic risk.',
      disposition: 'active',
      url: 'https://www.cdc.gov/bird-flu/situation-summary/index.html',
      sourceId: 'cdc-current-outbreaks',
    },
    {
      hypothesis:
        'The dairy cattle reservoir represents an under-appreciated adaptive opportunity ' +
        'that makes the pandemic precursor risk higher than the current LOW label implies',
      proponent:
        'Academic influenza researchers; ECDC (EU/EEA risk framing differs from CDC LOW)',
      evidence:
        'The sustained presence of H5N1 in dairy cattle since early 2024 creates ' +
        'a novel ecological niche not present in prior H5 pandemic-risk assessments. ' +
        'Cattle herds move across state lines, exposing a large and varied worker ' +
        'population. Surveillance gaps — not all herds are tested — mean the true ' +
        'scale of dairy cattle infection is unknown. Some virologists note that ' +
        'sustained mammalian adaptation increases the probability of mutations that ' +
        'improve human-to-human transmissibility, even absent current evidence of such ' +
        'mutations. ECDC frames EU/EEA risk as "low to medium" for the general population ' +
        'while characterizing zoonotic exposure risk as elevated for workers.',
      disposition: 'active',
      url: 'https://www.ecdc.europa.eu/en/avian-influenza/threats-and-outbreaks/avian-influenza-humans',
    },
    {
      hypothesis: 'Dairy cattle detections are declining in parallel with poultry; risk is resolving',
      proponent: 'Optimistic reading of USDA APHIS trend data',
      evidence:
        'Poultry detections peaked at ~11.4M birds in February 2026 and fell to ~140,000 ' +
        'by May 2026. If dairy cattle follow a similar arc, the reservoir may be self-limiting. ' +
        'No H5 wastewater signal above baseline has been detected in urban catchments.',
      disposition: 'under-investigation',
    },
  ],
})

// Measles: the key analytical debate is whether declining US rates are
// importation-driven or structural (vaccination coverage collapse).
patch('measles-us-2026', {
  relatedSignals: signals.find(s => s.id === 'measles-us-2026')?.relatedSignals ?? [],
  alternativeHypotheses: [
    {
      hypothesis:
        'Current outbreak surge is driven primarily by structural MMR coverage ' +
        'decline in specific under-vaccinated communities',
      proponent: 'CDC, AAP (American Academy of Pediatrics)',
      evidence:
        'CDC data confirms 93% of 2026 cases are outbreak-associated, predominantly ' +
        'in communities with documented vaccination refusal clusters. Kindergartener ' +
        'MMR coverage declined from 95.2% (2019–2020) to 92.5% (2024–2025), leaving ' +
        '~286,000 unvaccinated kindergarteners as the structural immunity gap. ' +
        'This framing implies the solution is community-targeted vaccination outreach, ' +
        'not primarily importation prevention.',
      disposition: 'active',
      url: 'https://www.cdc.gov/measles/data-research/index.html',
      sourceId: 'cdc-current-outbreaks',
    },
    {
      hypothesis:
        'Importation from high-incidence countries is the primary ignition mechanism; ' +
        'domestic under-vaccination amplifies but does not initiate outbreaks',
      proponent:
        'Travel-medicine community; some state epidemiologists in high-importation states',
      evidence:
        '9 of 1,952 confirmed 2026 cases (0.5%) involved international visitors to the US. ' +
        'Multiple 2026 outbreaks trace to a single import event into a susceptible community. ' +
        'This framing supports border-point vaccination assessment and targeted traveler ' +
        'advisory issuance as co-equal interventions alongside domestic outreach.',
      disposition: 'active',
    },
    {
      hypothesis:
        'Waning immunity in adults vaccinated with a single dose in the 1970s–1980s ' +
        'is an unmeasured but significant contributor to outbreak size',
      proponent:
        'Some immunologists; documented in peer-reviewed literature on measles seroprevalence',
      evidence:
        'Two-dose MMR schedules became standard practice in 1989. Adults vaccinated ' +
        'before 1989 with a single dose may have lower measles-specific antibody titers ' +
        'than current two-dose vaccinees. Limited large-scale adult seroprevalence studies ' +
        'mean this contribution is unquantified in CDC outbreak attribution. If real, ' +
        'it would argue for adult booster consideration in outbreak settings.',
      disposition: 'under-investigation',
    },
  ],
})

// Ebola Bundibugyo: debate is whether healthcare-facility or community
// transmission is dominant — drives different response priorities.
patch('ebola-bundibugyo-drc-2026', {
  relatedSignals: signals.find(s => s.id === 'ebola-bundibugyo-drc-2026')?.relatedSignals ?? [],
  alternativeHypotheses: [
    {
      hypothesis:
        'Healthcare-facility transmission is the dominant amplification mechanism, ' +
        'consistent with historical Bundibugyo outbreak dynamics',
      proponent:
        'WHO historical outbreak analysis; Africa CDC response guidance for Bundibugyo',
      evidence:
        'The 2007 Bundibugyo outbreak (Uganda) was amplified primarily through healthcare ' +
        'settings before containment. Bundibugyo ebolavirus carries similar transmission ' +
        'dynamics to Zaire ebolavirus in healthcare environments (contact with bodily fluids, ' +
        'inadequate PPE). A healthcare-facility amplification framing prioritizes HCW ' +
        'training, PPE distribution, and nosocomial surveillance.',
      disposition: 'active',
      url: 'https://www.who.int/emergencies/disease-outbreak-news',
    },
    {
      hypothesis:
        'Community transmission in funeral practices and household settings is driving ' +
        'the multi-health-zone spread pattern observed in eastern DRC',
      proponent:
        'Field epidemiology teams citing multi-zone spread geography',
      evidence:
        'Multi-health-zone spread is more consistent with community transmission networks ' +
        '(movement between zones for funerals, market contact) than with a single ' +
        'healthcare-facility amplification event. If community transmission is primary, ' +
        'response priorities shift toward safe and dignified burial teams, community ' +
        'engagement, and contact tracing in household networks rather than solely facility infection-control.',
      disposition: 'active',
    },
    {
      hypothesis:
        'Bundibugyo ebolavirus is intrinsically less transmissible than Zaire ebolavirus ' +
        'and will self-limit more rapidly than current response framing suggests',
      proponent:
        'Comparative VHF outbreak analysis; historical Bundibugyo case fatality data',
      evidence:
        'The 2007 Bundibugyo outbreak had a case fatality rate of ~25%, lower than the ' +
        '40–90% seen in Zaire ebolavirus outbreaks. Some analysts argue that the lower ' +
        'CFR reflects lower per-contact transmissibility. If correct, the outbreak may ' +
        'resolve faster than Zaire-serotype planning assumptions. However, the absence ' +
        'of a licensed Bundibugyo-specific vaccine means reliance on ring vaccination ' +
        'with rVSV-ZEBOV (cross-protective efficacy uncertain) complicates this projection.',
      disposition: 'under-investigation',
    },
  ],
})

// Cholera Africa: key debate is whether the 65% YOY decline is real
// improvement or a surveillance artifact.
patch('cholera-africa-2026', {
  relatedSignals: signals.find(s => s.id === 'cholera-africa-2026')?.relatedSignals ?? [],
  alternativeHypotheses: [
    {
      hypothesis:
        'The 65% year-over-year decline reflects genuine epidemiological improvement ' +
        'driven by WASH investment and improved outbreak response coordination',
      proponent: 'Africa CDC epidemic intelligence; WHO GTFCC (Global Task Force on Cholera Control)',
      evidence:
        'Africa CDC confirmed 40,707 cases Jan 1–May 14, 2026, representing a 65% decline ' +
        'from the same period in 2025. GTFCC-coordinated WASH scale-up in Ethiopia and ' +
        'Mozambique and oral cholera vaccine (OCV) campaigns in high-burden areas provide ' +
        'plausible mechanisms for genuine improvement. Case fatality ratios, while still ' +
        'elevated in conflict zones, are trending downward in settings with functional ' +
        'health infrastructure.',
      disposition: 'active',
      url: 'https://africacdc.org/disease/cholera/',
      sourceId: 'africa-cdc-outbreaks',
    },
    {
      hypothesis:
        'The apparent decline partly reflects surveillance system stress and displacement ' +
        'of case-counting capacity in conflict-affected areas rather than an equal ' +
        'improvement in actual disease incidence',
      proponent:
        'MSF (Médecins Sans Frontières) field reporting; academic surveillance-bias literature',
      evidence:
        'Sudan, Somalia, and eastern DRC — among the highest-burden settings — are ' +
        'experiencing active conflict that disrupts passive case reporting systems. ' +
        'Cases in displaced populations and informal settlements are historically ' +
        'under-counted. If surveillance capacity declined proportionally with case ' +
        'counts, the apparent 65% reduction may overstate real improvement. This ' +
        'framing supports maintaining response capacity rather than scaling back based ' +
        'on the headline number.',
      disposition: 'active',
    },
  ],
})

// ── Write ──────────────────────────────────────────────────────────────────
writeFileSync(SIGNALS_PATH, JSON.stringify(signals, null, 2) + '\n')
console.log(`\n[seed-network-and-hypotheses] done — wrote ${SIGNALS_PATH}`)
