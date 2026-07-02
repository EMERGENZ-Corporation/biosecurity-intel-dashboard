#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation

import assert from 'node:assert/strict'
import {
  buildCandidates,
  detectPowassanCurrentData,
  parseCdcCyclosporiasis,
  parseEmbassyAlerts,
  parseFdaOutbreaks,
  parseWhoBundibugyo,
} from './discover-signals.mjs'

const policy = {
  defaultMaxAutoSeverity: 'watch',
  signals: {
    'cyclospora-us-2026': {
      allowedSourceIds: [
        'cdc-cyclosporiasis-surveillance-2026',
        'fda-core-foodborne-outbreaks-2026',
        'fda-cyclospora-pathogen',
      ],
      maxAutoSeverity: 'watch',
    },
    'powassan-us-2026': {
      allowedSourceIds: [
        'cdc-powassan-current-year-2026',
        'cdc-powassan-data-maps',
        'cdc-powassan-about',
      ],
      maxAutoSeverity: 'watch',
    },
    'ebola-bundibugyo-drc-2026': {
      allowedSourceIds: [
        'who-ebola-drc-2026-situation',
        'who-don-ebola-bundibugyo-drc-2026',
        'africa-cdc-outbreaks',
        'cdc-current-outbreaks',
        'state-embassy-kampala-alert-feed',
        'state-embassy-kampala-health-alert-2026-06-29',
      ],
    },
  },
}

const sources = [
  'cdc-cyclosporiasis-surveillance-2026',
  'fda-core-foodborne-outbreaks-2026',
  'fda-cyclospora-pathogen',
  'cdc-powassan-current-year-2026',
  'cdc-powassan-data-maps',
  'cdc-powassan-about',
  'who-ebola-drc-2026-situation',
  'who-don-ebola-bundibugyo-drc-2026',
  'africa-cdc-outbreaks',
  'cdc-current-outbreaks',
  'state-embassy-kampala-alert-feed',
  'state-embassy-kampala-health-alert-2026-06-29',
].map((id) => ({ id }))

function test(name, fn) {
  try {
    fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    console.error(`not ok - ${name}`)
    console.error(error)
    process.exitCode = 1
  }
}

test('FDA parser extracts active Cyclospora CORE investigations', () => {
  const html = `
    <table>
      <caption>Active Investigations</caption>
      <tr><td>6/17/2026</td><td>1381</td><td>Cyclospora cayetanensis</td><td>Not Yet Identified</td><td>2 cases</td><td>Active</td><td>Ongoing</td><td>Traceback Initiated</td><td>Sampling Initiated</td></tr>
      <tr><td>6/3/2026</td><td>1375</td><td>Cyclospora cayetanensis</td><td>Not Yet Identified</td><td>8 cases</td><td>Active</td><td>Event Ended</td><td>Traceback Initiated</td><td>Sampling Initiated</td></tr>
      <caption>Closed Investigations</caption>
    </table>`
  const parsed = parseFdaOutbreaks(html)
  assert.equal(parsed.found, true)
  assert.deepEqual(parsed.cyclosporaInvestigations.map((row) => row.reference), ['1375', '1381'])
  assert.deepEqual(parsed.cyclosporaInvestigations.map((row) => row.cases), [8, 2])
  assert.equal(parsed.cyclosporaInvestigations.every((row) => row.product === 'Not Yet Identified'), true)
  assert.equal(parsed.cyclosporaInvestigations.every((row) => row.traceback && row.sampling), true)
})

test('CDC Cyclosporiasis parser detects current-season surveillance facts', () => {
  const html = `
    <h1>Surveillance of Cyclosporiasis</h1>
    <p>July 1, 2026</p>
    <h2>2026 fast facts</h2>
    <ul>
      <li>Cases acquired in the United States: 145</li>
      <li>Hospitalizations: 20</li>
      <li>Deaths: 0</li>
      <li>States reporting cases: 17</li>
    </ul>
    <p>There is currently no evidence of a single, multistate Cyclospora outbreak linking all cases.</p>`
  const parsed = parseCdcCyclosporiasis(html)
  assert.equal(parsed.found, true)
  assert.equal(parsed.updated, '2026-07-01')
  assert.equal(parsed.usAcquiredCases, 145)
  assert.equal(parsed.hospitalizations, 20)
  assert.equal(parsed.deaths, 0)
  assert.equal(parsed.statesReporting, 17)
  assert.equal(parsed.noSingleMultistateOutbreak, true)
})

test('CDC Powassan parser detects current-year source and update cadence', () => {
  const html = `
    <h1>Current Year Data for Powassan Virus Disease</h1>
    <p>June 30, 2026</p>
    <p>Current-year data are preliminary and updated every 1-2 weeks during June-December.</p>
    <p>State and local health departments may have more current data.</p>`
  const parsed = detectPowassanCurrentData(html)
  assert.equal(parsed.found, true)
  assert.equal(parsed.updated, '2026-06-30')
  assert.equal(parsed.preliminary, true)
  assert.match(parsed.cadence, /1-2 weeks/)
  assert.equal(parsed.mentionsStateLocalMoreCurrent, true)
})

test('WHO parser distinguishes Bundibugyo Ebola from generic Marburg references', () => {
  const html = `
    <h1>Ebola outbreak - DRC 2026</h1>
    <p>An Ebola outbreak was confirmed in the Democratic Republic of the Congo and in Uganda in May 2026.
    The Bundibugyo species of Ebola involved is one for which there is no vaccine or specific treatment.</p>
    <p>WHO guidelines for clinical management of filovirus disease, including Ebola and Marburg disease.</p>`
  const parsed = parseWhoBundibugyo(html)
  assert.equal(parsed.found, true)
  assert.equal(parsed.ugandaMentioned, true)
  assert.equal(parsed.drcMentioned, true)
  assert.equal(parsed.marburgMentioned, true)
  assert.equal(parsed.marburgConfirmedOutbreak, false)
})

test('Embassy parser handles RSS and WordPress JSON fallback shapes', () => {
  const rss = `
    <rss><channel><item>
      <title>Health Alert: U.S. Embassy Kampala, June 29, 2026</title>
      <link>https://ug.usembassy.gov/health-alert-health-alert-u-s-embassy-kampala-june-29-2026/</link>
      <pubDate>Mon, 29 Jun 2026 12:00:00 GMT</pubDate>
      <description>Uganda health alert for Kampala; monitor Ebola and Marburg references pending official public-health confirmation.</description>
    </item></channel></rss>`
  const json = JSON.stringify([{
    title: { rendered: 'Health Alert: U.S. Embassy Kampala' },
    content: { rendered: '<p>Operational alert for Uganda filovirus response.</p>' },
    link: 'https://ug.usembassy.gov/example/',
    date: '2026-06-29T12:00:00',
  }])
  const rssAlerts = parseEmbassyAlerts(rss)
  const jsonAlerts = parseEmbassyAlerts(json)
  assert.equal(rssAlerts.length, 1)
  assert.equal(rssAlerts[0].sourceFormat, 'rss')
  assert.equal(rssAlerts[0].matchedTerms.includes('marburg'), true)
  assert.equal(jsonAlerts.length, 1)
  assert.equal(jsonAlerts[0].sourceFormat, 'wordpress-json')
  assert.equal(jsonAlerts[0].matchedTerms.includes('uganda'), true)
})

test('Auto-created signals require official source binding and max watch severity', () => {
  const candidates = buildCandidates({
    signals: [],
    sources,
    policy,
    checkedAt: '2026-07-02T00:00:00.000Z',
    parsed: {
      fda: { found: true, cyclosporaInvestigations: [{ reference: '1381', cases: 2 }] },
      cdcCyclosporiasis: { found: true, usAcquiredCases: 145 },
      powassan: { found: true, preliminary: true },
      whoBundibugyo: { found: true, marburgConfirmedOutbreak: false },
      embassyAlerts: [],
    },
  })
  const cyclospora = candidates.find((candidate) => candidate.signalId === 'cyclospora-us-2026')
  const powassan = candidates.find((candidate) => candidate.signalId === 'powassan-us-2026')
  assert.equal(cyclospora.classification, 'AUTO_PUBLISH_ELIGIBLE')
  assert.equal(cyclospora.safety.canAutoPublish, true)
  assert.equal(cyclospora.safety.requestedSeverity, 'watch')
  assert.equal(powassan.classification, 'AUTO_PUBLISH_ELIGIBLE')
  assert.equal(powassan.safety.canAutoPublish, true)
  assert.equal(powassan.safety.requestedSeverity, 'monitor')
})

test('Embassy-only Marburg alert cannot write counts and stages for approval', () => {
  const candidates = buildCandidates({
    signals: [{ id: 'ebola-bundibugyo-drc-2026' }],
    sources,
    policy,
    checkedAt: '2026-07-02T00:00:00.000Z',
    parsed: {
      whoBundibugyo: { found: true, marburgConfirmedOutbreak: false },
      embassyAlerts: [{
        title: 'Health Alert: U.S. Embassy Kampala',
        link: 'https://ug.usembassy.gov/health-alert-health-alert-u-s-embassy-kampala-june-29-2026/',
        matchedTerms: ['health alert', 'uganda', 'marburg'],
        sourceFormat: 'rss',
      }],
    },
  })
  const sentinel = candidates.find((candidate) => candidate.signalId === 'ebola-bundibugyo-drc-2026')
  assert.equal(sentinel.classification, 'OPERATIONAL_SENTINEL')
  assert.equal(sentinel.safety.canWriteCounts, false)
  assert.equal(sentinel.safety.embassyOnlyCannotWriteCounts, true)
  assert.equal(sentinel.safety.requiresApproval, true)
})

if (process.exitCode) process.exit(process.exitCode)
