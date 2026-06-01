#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * One-time map marker seeder.
 *
 * Adds typed map markers across all 16 biosecurity signals so the dashboard
 * can demonstrate multi-threat geographic scope. Each marker carries a type
 * (case_confirmed, death, outbreak_zone, exposure_event, monitoring_site,
 * animal_detection, vector_zone, infrastructure), severity, optional source
 * link(s), and human-readable label/description.
 *
 * Run once: node scripts/seed-map-markers.mjs
 */

import { readFileSync, writeFileSync } from 'fs'

const SIGNALS_PATH = 'src/data/signals.json'

const MARKERS_BY_SIGNAL = {
  'andes-hantavirus-mv-hondius-2026': [
    { id: 'andes-arg-buenos-aires', lat: -34.6037, lng: -58.3816, type: 'outbreak_zone', severity: 'concern',
      label: 'Argentina — Buenos Aires region',
      description: 'Andes virus exposure region; multiple confirmed/probable cases tied to MV Hondius itinerary.' },
    { id: 'andes-cl-santiago', lat: -33.4489, lng: -70.6693, type: 'outbreak_zone', severity: 'concern',
      label: 'Chile — Santiago region',
      description: 'Andes virus endemic region; reservoir Oligoryzomys longicaudatus.' },
    { id: 'andes-ushuaia-departure', lat: -54.8019, lng: -68.303, type: 'exposure_event', severity: 'action',
      label: 'Ushuaia, Argentina — MV Hondius departure',
      description: 'Expedition departure point April 2026; index exposure event for the cluster.' },
    { id: 'andes-antarctica-waypoint', lat: -64.4, lng: -57.0, type: 'exposure_event', severity: 'concern',
      label: 'Antarctic Peninsula — cruise itinerary waypoint' },
    { id: 'andes-nl-radboud', lat: 51.8246, lng: 5.8689, type: 'exposure_event', severity: 'action',
      label: 'Radboud UMC, Nijmegen — HCW exposure event',
      description: 'Healthcare worker quarantine event after incorrect blood-sampling procedure.' },
    { id: 'andes-ch-geneva', lat: 46.2044, lng: 6.1432, type: 'monitoring_site', severity: 'concern',
      label: 'Geneva University Hospitals — diagnostic confirmation',
      description: 'Virus-specific PCR confirmation site for European cluster.' },
    { id: 'andes-us-unmc', lat: 41.2566, lng: -95.9803, type: 'monitoring_site', severity: 'concern',
      label: 'UNMC Biocontainment, Nebraska',
      description: 'US repatriation monitoring facility for MV Hondius passengers.' },
    { id: 'andes-us-emory', lat: 33.7929, lng: -84.3236, type: 'monitoring_site', severity: 'watch',
      label: 'Emory University Hospital, Atlanta',
      description: 'US repatriation monitoring; both monitored passengers discharged negative.' },
    { id: 'andes-ca-bc', lat: 49.2827, lng: -123.1207, type: 'case_confirmed', severity: 'action',
      label: 'British Columbia — confirmed Canadian case',
      description: 'First Canadian Andes hantavirus case confirmed by National Microbiology Lab.' },
    { id: 'andes-de-frankfurt', lat: 50.1109, lng: 8.6821, type: 'case_confirmed', severity: 'action',
      label: 'Germany — repatriated passenger case' },
    { id: 'andes-uk-london', lat: 51.5074, lng: -0.1278, type: 'case_confirmed', severity: 'action',
      label: 'United Kingdom — repatriated passenger case' },
    { id: 'andes-fr-paris', lat: 48.8566, lng: 2.3522, type: 'case_confirmed', severity: 'action',
      label: 'France — confirmed case',
      description: 'Genomic match to MV Hondius cluster.' },
    { id: 'andes-death-1', lat: -34.61, lng: -58.38, type: 'death', severity: 'action',
      label: 'Fatality 1 — Argentina' },
    { id: 'andes-death-2', lat: 46.23, lng: 6.15, type: 'death', severity: 'action',
      label: 'Fatality 2 — Switzerland (Geneva HUG)' },
    { id: 'andes-death-3', lat: 51.82, lng: 5.87, type: 'death', severity: 'action',
      label: 'Fatality 3 — Netherlands' },
  ],

  'ebola-bundibugyo-drc-2026': [
    { id: 'ebola-drc-ituri', lat: 1.5, lng: 29.0, type: 'outbreak_zone', severity: 'action',
      label: 'Ituri Province, DRC — active outbreak zone' },
    { id: 'ebola-drc-bunia-etu', lat: 1.5667, lng: 30.25, type: 'infrastructure', severity: 'action',
      label: 'Bunia ETU — Ebola Treatment Unit' },
    { id: 'ebola-drc-goma', lat: -1.6792, lng: 29.2228, type: 'monitoring_site', severity: 'concern',
      label: 'Goma — regional coordination & port-of-entry screening' },
    { id: 'ebola-ug-kasese', lat: 0.1833, lng: 30.0833, type: 'monitoring_site', severity: 'concern',
      label: 'Kasese, Uganda — cross-border surveillance' },
    { id: 'ebola-ug-mubende', lat: 0.5667, lng: 31.3667, type: 'outbreak_zone', severity: 'concern',
      label: 'Mubende District, Uganda — historical Bundibugyo focus' },
    { id: 'ebola-who-afro', lat: -4.2634, lng: 15.2429, type: 'infrastructure', severity: 'watch',
      label: 'WHO AFRO, Brazzaville — regional response coordination' },
    { id: 'ebola-drc-beni', lat: 0.4914, lng: 29.4736, type: 'monitoring_site', severity: 'concern',
      label: 'Beni — community surveillance & contact tracing hub' },
  ],

  'measles-us-2026': [
    { id: 'measles-tx-gaines', lat: 32.7357, lng: -102.6383, type: 'outbreak_zone', severity: 'action',
      label: 'Gaines County, Texas — large outbreak cluster' },
    { id: 'measles-nm-lea', lat: 32.7395, lng: -103.3739, type: 'outbreak_zone', severity: 'concern',
      label: 'Lea County, New Mexico — linked cluster' },
    { id: 'measles-fl-broward', lat: 26.1224, lng: -80.1373, type: 'case_confirmed', severity: 'concern',
      label: 'Broward County, Florida — school-linked cases' },
    { id: 'measles-ny-brooklyn', lat: 40.6782, lng: -73.9442, type: 'case_confirmed', severity: 'concern',
      label: 'Brooklyn, NY — community cluster' },
    { id: 'measles-oh-cuyahoga', lat: 41.4993, lng: -81.6944, type: 'case_confirmed', severity: 'watch',
      label: 'Cuyahoga County, Ohio — importation case' },
    { id: 'measles-pa-philadelphia', lat: 39.9526, lng: -75.1652, type: 'case_confirmed', severity: 'watch',
      label: 'Philadelphia, PA — hospital-linked exposure' },
    { id: 'measles-ca-la', lat: 34.0522, lng: -118.2437, type: 'case_confirmed', severity: 'concern',
      label: 'Los Angeles County, CA — travel-linked case' },
    { id: 'measles-md-prince-georges', lat: 38.8290, lng: -76.8203, type: 'case_confirmed', severity: 'watch',
      label: "Prince George's County, MD — importation case" },
  ],

  'mpox-africa-clade-i-2026': [
    { id: 'mpox-drc-equateur', lat: 0.0, lng: 18.5, type: 'outbreak_zone', severity: 'action',
      label: 'Équateur Province, DRC — endemic transmission' },
    { id: 'mpox-drc-south-kivu', lat: -2.5, lng: 28.85, type: 'outbreak_zone', severity: 'action',
      label: 'South Kivu, DRC — clade Ib emergence' },
    { id: 'mpox-bi-bujumbura', lat: -3.3614, lng: 29.3599, type: 'outbreak_zone', severity: 'concern',
      label: 'Burundi — sustained transmission' },
    { id: 'mpox-rw-kigali', lat: -1.9706, lng: 30.1044, type: 'outbreak_zone', severity: 'concern',
      label: 'Rwanda — cross-border transmission' },
    { id: 'mpox-ug-kampala', lat: 0.3476, lng: 32.5825, type: 'outbreak_zone', severity: 'concern',
      label: 'Uganda — cross-border importation' },
    { id: 'mpox-se-stockholm', lat: 59.3293, lng: 18.0686, type: 'case_confirmed', severity: 'concern',
      label: 'Sweden — first European clade Ib case' },
    { id: 'mpox-th-bangkok', lat: 13.7563, lng: 100.5018, type: 'case_confirmed', severity: 'watch',
      label: 'Thailand — imported clade Ib case' },
  ],

  'avian-influenza-h5-2026': [
    { id: 'h5-tx-dairy', lat: 35.2220, lng: -101.8313, type: 'animal_detection', severity: 'concern',
      label: 'Texas Panhandle — dairy herd HPAI H5N1 detections' },
    { id: 'h5-ca-dairy', lat: 36.7783, lng: -119.4179, type: 'animal_detection', severity: 'action',
      label: 'Central California — dairy herd outbreak' },
    { id: 'h5-ia-poultry', lat: 42.0308, lng: -93.6319, type: 'animal_detection', severity: 'concern',
      label: 'Iowa — commercial poultry detection' },
    { id: 'h5-mn-turkey', lat: 46.7296, lng: -94.6859, type: 'animal_detection', severity: 'watch',
      label: 'Minnesota — turkey flock HPAI detection' },
    { id: 'h5-tx-human', lat: 31.9686, lng: -99.9018, type: 'case_confirmed', severity: 'concern',
      label: 'Texas — human H5N1 case (dairy worker)' },
    { id: 'h5-mi-human', lat: 44.3148, lng: -85.6024, type: 'case_confirmed', severity: 'concern',
      label: 'Michigan — human H5N1 case (dairy worker)' },
    { id: 'h5-co-human', lat: 39.5501, lng: -105.7821, type: 'case_confirmed', severity: 'concern',
      label: 'Colorado — human H5N1 case (poultry depopulation)' },
    { id: 'h5-kh-cambodia', lat: 11.5564, lng: 104.9282, type: 'case_confirmed', severity: 'action',
      label: 'Cambodia — human H5N1 fatal case (clade 2.3.2.1c)' },
  ],

  'cholera-africa-2026': [
    { id: 'cholera-sd-khartoum', lat: 15.5007, lng: 32.5599, type: 'outbreak_zone', severity: 'action',
      label: 'Sudan — Khartoum, ongoing outbreak under conflict' },
    { id: 'cholera-et-addis', lat: 9.03, lng: 38.74, type: 'outbreak_zone', severity: 'concern',
      label: 'Ethiopia — multi-region outbreak' },
    { id: 'cholera-mz', lat: -18.6657, lng: 35.5296, type: 'outbreak_zone', severity: 'concern',
      label: 'Mozambique — cyclone-linked outbreak' },
    { id: 'cholera-mw-lilongwe', lat: -13.9626, lng: 33.7741, type: 'outbreak_zone', severity: 'concern',
      label: 'Malawi — sustained transmission' },
    { id: 'cholera-zm-lusaka', lat: -15.3875, lng: 28.3228, type: 'outbreak_zone', severity: 'watch',
      label: 'Zambia — Lusaka outbreak' },
    { id: 'cholera-zw-harare', lat: -17.8252, lng: 31.0335, type: 'outbreak_zone', severity: 'watch',
      label: 'Zimbabwe — urban outbreak' },
    { id: 'cholera-so-mogadishu', lat: 2.0469, lng: 45.3182, type: 'outbreak_zone', severity: 'concern',
      label: 'Somalia — IDP camp-linked transmission' },
  ],

  'seasonal-influenza-2026': [
    { id: 'flu-us-cdc', lat: 33.7956, lng: -84.3252, type: 'monitoring_site', severity: 'watch',
      label: 'CDC FluView, Atlanta — US surveillance' },
    { id: 'flu-uk-ukhsa', lat: 51.5074, lng: -0.1278, type: 'monitoring_site', severity: 'watch',
      label: 'UKHSA, London — UK surveillance' },
    { id: 'flu-eu-ecdc', lat: 59.3293, lng: 18.0686, type: 'monitoring_site', severity: 'watch',
      label: 'ECDC, Stockholm — EU/EEA surveillance' },
    { id: 'flu-de-rki', lat: 52.5200, lng: 13.4050, type: 'monitoring_site', severity: 'watch',
      label: 'Robert Koch Institute, Berlin' },
    { id: 'flu-ca-phac', lat: 45.4215, lng: -75.6993, type: 'monitoring_site', severity: 'watch',
      label: 'PHAC FluWatch, Ottawa' },
  ],

  'covid-wastewater-2026': [
    { id: 'covid-us-boston', lat: 42.3601, lng: -71.0589, type: 'monitoring_site', severity: 'watch',
      label: 'Boston — Biobot wastewater site' },
    { id: 'covid-us-atlanta', lat: 33.7490, lng: -84.3880, type: 'monitoring_site', severity: 'watch',
      label: 'Atlanta — CDC NWSS site' },
    { id: 'covid-us-houston', lat: 29.7604, lng: -95.3698, type: 'monitoring_site', severity: 'watch',
      label: 'Houston — TMC wastewater surveillance' },
    { id: 'covid-us-la', lat: 34.0522, lng: -118.2437, type: 'monitoring_site', severity: 'watch',
      label: 'LA County — sewershed monitoring' },
    { id: 'covid-us-nyc', lat: 40.7128, lng: -74.0060, type: 'monitoring_site', severity: 'watch',
      label: 'NYC DOHMH — wastewater program' },
    { id: 'covid-us-chicago', lat: 41.8781, lng: -87.6298, type: 'monitoring_site', severity: 'watch',
      label: 'Chicago — IDPH wastewater monitoring' },
  ],

  'norovirus-wastewater-2026': [
    { id: 'noro-us-stanford', lat: 37.4275, lng: -122.1697, type: 'monitoring_site', severity: 'watch',
      label: 'WastewaterSCAN — Stanford coordinating site' },
    { id: 'noro-us-boston', lat: 42.3601, lng: -71.0589, type: 'monitoring_site', severity: 'watch',
      label: 'Boston — norovirus wastewater detection' },
    { id: 'noro-us-twin-cities', lat: 44.9778, lng: -93.2650, type: 'monitoring_site', severity: 'watch',
      label: 'Twin Cities, MN — norovirus signal increase' },
  ],

  'rsv-wastewater-2026': [
    { id: 'rsv-us-atlanta', lat: 33.7490, lng: -84.3880, type: 'monitoring_site', severity: 'watch',
      label: 'CDC RESP-NET, Atlanta' },
    { id: 'rsv-us-boston', lat: 42.3601, lng: -71.0589, type: 'monitoring_site', severity: 'watch',
      label: 'Boston — RSV wastewater monitoring' },
    { id: 'rsv-us-houston', lat: 29.7604, lng: -95.3698, type: 'monitoring_site', severity: 'watch',
      label: 'Houston — TMC RSV surveillance' },
  ],

  'hmpv-wastewater-2026': [
    { id: 'hmpv-us-cambridge', lat: 42.3736, lng: -71.1097, type: 'monitoring_site', severity: 'watch',
      label: 'Cambridge MA — hMPV wastewater signal' },
    { id: 'hmpv-us-houston', lat: 29.7604, lng: -95.3698, type: 'monitoring_site', severity: 'watch',
      label: 'Houston — hMPV surveillance' },
    { id: 'hmpv-cn-beijing', lat: 39.9042, lng: 116.4074, type: 'monitoring_site', severity: 'watch',
      label: 'Beijing CDC — hMPV reporting' },
  ],

  'lassa-fever-2026': [
    { id: 'lassa-ng-edo', lat: 6.3350, lng: 5.6037, type: 'outbreak_zone', severity: 'action',
      label: 'Edo State, Nigeria — high-burden focus (Irrua)' },
    { id: 'lassa-ng-ondo', lat: 7.1, lng: 5.05, type: 'outbreak_zone', severity: 'concern',
      label: 'Ondo State, Nigeria' },
    { id: 'lassa-ng-bauchi', lat: 10.3158, lng: 9.8442, type: 'outbreak_zone', severity: 'concern',
      label: 'Bauchi State, Nigeria' },
    { id: 'lassa-ng-irrua', lat: 6.7406, lng: 6.2197, type: 'infrastructure', severity: 'concern',
      label: 'Irrua Specialist Teaching Hospital — reference center' },
    { id: 'lassa-sl', lat: 8.4606, lng: -11.7799, type: 'vector_zone', severity: 'watch',
      label: 'Sierra Leone — Mastomys natalensis reservoir zone' },
    { id: 'lassa-gn', lat: 9.6412, lng: -13.5784, type: 'vector_zone', severity: 'watch',
      label: 'Guinea — Lassa endemic zone' },
  ],

  'chikungunya-2026': [
    { id: 'chikv-br-mg', lat: -19.9167, lng: -43.9345, type: 'outbreak_zone', severity: 'action',
      label: 'Belo Horizonte, Brazil — large outbreak' },
    { id: 'chikv-py-asuncion', lat: -25.2637, lng: -57.5759, type: 'outbreak_zone', severity: 'concern',
      label: 'Asunción, Paraguay — sustained transmission' },
    { id: 'chikv-ar-ba', lat: -34.6037, lng: -58.3816, type: 'case_confirmed', severity: 'watch',
      label: 'Buenos Aires, Argentina — imported and local cases' },
    { id: 'chikv-re', lat: -21.1151, lng: 55.5364, type: 'vector_zone', severity: 'concern',
      label: 'La Réunion — historical autochthonous transmission' },
    { id: 'chikv-it-emilia', lat: 44.4949, lng: 11.3426, type: 'vector_zone', severity: 'watch',
      label: 'Emilia-Romagna, Italy — autochthonous transmission' },
    { id: 'chikv-us-fl', lat: 25.7617, lng: -80.1918, type: 'vector_zone', severity: 'watch',
      label: 'Florida, USA — competent vector established' },
  ],

  'candida-auris-wastewater-2026': [
    { id: 'cauris-us-ny', lat: 40.7128, lng: -74.0060, type: 'monitoring_site', severity: 'concern',
      label: 'New York — high-burden state surveillance' },
    { id: 'cauris-us-fl', lat: 27.6648, lng: -81.5158, type: 'monitoring_site', severity: 'concern',
      label: 'Florida — healthcare-associated cluster' },
    { id: 'cauris-us-il', lat: 41.8781, lng: -87.6298, type: 'monitoring_site', severity: 'concern',
      label: 'Illinois — Chicago metro healthcare outbreaks' },
    { id: 'cauris-us-nv', lat: 36.1699, lng: -115.1398, type: 'monitoring_site', severity: 'watch',
      label: 'Nevada — Las Vegas healthcare facilities' },
    { id: 'cauris-us-ca', lat: 36.7783, lng: -119.4179, type: 'monitoring_site', severity: 'watch',
      label: 'California — wastewater detection program' },
  ],

  'screwworm-onehealth-2026': [
    { id: 'screw-pa', lat: 9.0, lng: -80.0, type: 'animal_detection', severity: 'action',
      label: 'Panama — sustained livestock outbreak' },
    { id: 'screw-cr', lat: 9.7489, lng: -83.7534, type: 'animal_detection', severity: 'concern',
      label: 'Costa Rica — recent detection' },
    { id: 'screw-mx-chiapas', lat: 16.7569, lng: -93.1292, type: 'animal_detection', severity: 'action',
      label: 'Chiapas, Mexico — northward spread detection' },
    { id: 'screw-mx-veracruz', lat: 19.1738, lng: -96.1342, type: 'animal_detection', severity: 'concern',
      label: 'Veracruz, Mexico — northern advance front' },
    { id: 'screw-us-tx-border', lat: 28.7041, lng: -100.5163, type: 'monitoring_site', severity: 'concern',
      label: 'US southern border, Texas — APHIS surveillance' },
    { id: 'screw-usda-aphis', lat: 38.9839, lng: -76.9258, type: 'infrastructure', severity: 'watch',
      label: 'USDA APHIS HQ, Riverdale MD — national response' },
  ],

  'fifa-world-cup-2026-prep': [
    { id: 'fifa-us-metlife', lat: 40.8128, lng: -74.0742, type: 'infrastructure', severity: 'watch',
      label: 'MetLife Stadium, NJ — final venue' },
    { id: 'fifa-us-sofi', lat: 33.9534, lng: -118.3387, type: 'infrastructure', severity: 'watch',
      label: 'SoFi Stadium, Inglewood CA' },
    { id: 'fifa-us-att', lat: 32.7473, lng: -97.0945, type: 'infrastructure', severity: 'watch',
      label: 'AT&T Stadium, Arlington TX' },
    { id: 'fifa-us-mercedes', lat: 33.7553, lng: -84.4006, type: 'infrastructure', severity: 'watch',
      label: 'Mercedes-Benz Stadium, Atlanta GA' },
    { id: 'fifa-ca-toronto', lat: 43.6332, lng: -79.4187, type: 'infrastructure', severity: 'watch',
      label: 'BMO Field, Toronto' },
    { id: 'fifa-ca-vancouver', lat: 49.2767, lng: -123.1119, type: 'infrastructure', severity: 'watch',
      label: 'BC Place, Vancouver' },
    { id: 'fifa-mx-azteca', lat: 19.3029, lng: -99.1505, type: 'infrastructure', severity: 'watch',
      label: 'Estadio Azteca, Mexico City' },
    { id: 'fifa-mx-bbva', lat: 25.6695, lng: -100.2444, type: 'infrastructure', severity: 'watch',
      label: 'Estadio BBVA, Monterrey' },
  ],
}

function main() {
  const signals = JSON.parse(readFileSync(SIGNALS_PATH, 'utf8'))
  let totalAdded = 0
  let signalsTouched = 0

  for (const signal of signals) {
    const markers = MARKERS_BY_SIGNAL[signal.id]
    if (!markers) continue
    signal.mapMarkers = markers
    totalAdded += markers.length
    signalsTouched += 1
  }

  writeFileSync(SIGNALS_PATH, JSON.stringify(signals, null, 2) + '\n')
  console.log(`[seed-markers] wrote ${totalAdded} markers across ${signalsTouched} signals`)
}

main()
