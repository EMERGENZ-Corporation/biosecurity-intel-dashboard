#!/usr/bin/env node
/**
 * Regression tests for scripts/validate-data.mjs. These tests run the real
 * validator against temporary copies of the production data and mutate one
 * risky field at a time so validator coverage cannot quietly regress.
 */

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { spawnSync } from 'child_process'

const root = process.cwd()
const tempRoot = mkdtempSync(join(tmpdir(), 'emergenz-validate-data-'))

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
}

function makeCaseDir(name) {
  const caseRoot = join(tempRoot, name)
  const dataDir = join(caseRoot, 'data')
  const publicDir = join(caseRoot, 'public')
  mkdirSync(publicDir, { recursive: true })
  cpSync(join(root, 'src', 'data'), dataDir, { recursive: true })
  cpSync(join(root, 'public', 'status.json'), join(publicDir, 'status.json'))
  return { dataDir, publicDir, signalsPath: join(dataDir, 'signals.json') }
}

function runValidator(dataDir, publicDir) {
  return spawnSync(process.execPath, ['scripts/validate-data.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      VALIDATE_DATA_DIR: dataDir,
      VALIDATE_PUBLIC_DIR: publicDir,
    },
    encoding: 'utf8',
  })
}

function expectPass(name) {
  const { dataDir, publicDir } = makeCaseDir(name)
  const result = runValidator(dataDir, publicDir)
  if (result.status !== 0) {
    throw new Error(`${name}: expected pass, got failure\n${result.stderr}${result.stdout}`)
  }
}

function expectFailure(name, mutate, expectedText) {
  const { dataDir, publicDir, signalsPath } = makeCaseDir(name)
  const signals = readJson(signalsPath)
  mutate(signals)
  writeJson(signalsPath, signals)

  const result = runValidator(dataDir, publicDir)
  const output = `${result.stderr}\n${result.stdout}`
  if (result.status === 0) {
    throw new Error(`${name}: expected failure, got pass`)
  }
  if (!output.includes(expectedText)) {
    throw new Error(`${name}: expected output to include "${expectedText}"\n${output}`)
  }
}

try {
  expectPass('baseline-valid-data')

  expectFailure(
    'unknown-related-signal',
    (signals) => {
      signals[0].relatedSignals = [{
        signalId: 'not-a-real-signal',
        relationship: 'Intentional invalid relationship for validator regression coverage',
        type: 'shared-context',
      }]
    },
    'not-a-real-signal',
  )

  expectFailure(
    'invalid-hypothesis-disposition',
    (signals) => {
      const signal = signals.find((item) => Array.isArray(item.alternativeHypotheses))
      signal.alternativeHypotheses[0].disposition = 'maybe'
    },
    'invalid disposition "maybe"',
  )

  expectFailure(
    'stale-triage-card',
    (signals) => {
      const signal = signals.find((item) => item.triageCard)
      signal.triageCard.lastReviewed = '2020-01-01'
    },
    'clinical content must be re-verified',
  )

  expectFailure(
    'invalid-risk-assessment-url',
    (signals) => {
      const signal = signals.find((item) => Array.isArray(item.riskAssessments))
      signal.riskAssessments[0].url = 'not-a-url'
    },
    'url must be valid',
  )

  console.log('[test-validate-data] OK')
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
