import assert from 'node:assert/strict'
import {
  parseCdcSituation,
  parseEcdcSurveillance,
  parsePhacUpdate,
  parseWhoAssessment,
} from './update-data.mjs'

const ecdcNarrative = `
  As of 19 May, a total of 11 cases has been reported, including 9 confirmed
  and 2 probable cases. The risk to the EU/EEA general population remains very low.
  Confirmed cases 9 Probable cases 2 Suspected cases 0 Number of deaths 3
`

const ecdcTable = `
  Confirmed cases 9
  Probable cases 2
  Suspected cases 0
  Number of deaths 3
  The risk to the EU/EEA general population is very low.
`

const cdcSituation = `
  CDC is supporting health departments as 11 U.S. states are monitoring
  travelers after potential exposure. This update is associated with HAN 528.
`

const whoAssessment = `
  Based on currently available information, the overall public health risk remains low
  for the general population.
`

const phacUpdate = `
  The National Microbiology Laboratory has confirmed that one former passenger
  tested positive for Andes hantavirus.
`

const ecdcNarrativeResult = parseEcdcSurveillance(ecdcNarrative)
assert.equal(ecdcNarrativeResult.caseStats.confirmed, 11)
assert.equal(ecdcNarrativeResult.caseStats.deaths, 3)
assert.equal(ecdcNarrativeResult.riskLevels.ecdcRisk, 'VERY LOW')

const ecdcTableResult = parseEcdcSurveillance(ecdcTable)
assert.equal(ecdcTableResult.caseStats.confirmed, 11)
assert.equal(ecdcTableResult.caseStats.deaths, 3)
assert.equal(ecdcTableResult.riskLevels.ecdcRisk, 'VERY LOW')

const cdcResult = parseCdcSituation(cdcSituation)
assert.equal(cdcResult.caseStats.usStatesMonitoring, 11)
assert.equal(cdcResult.riskLevels.cdcResponseLevel, 'HAN 528')

const whoResult = parseWhoAssessment(whoAssessment)
assert.equal(whoResult.riskLevels.whoGlobalRisk, 'LOW')

const phacResult = parsePhacUpdate(phacUpdate)
assert.deepEqual(phacResult.facts, ['PHAC confirms one Canadian case linked to MV Hondius'])

console.log('[test-official-parsers] OK')
