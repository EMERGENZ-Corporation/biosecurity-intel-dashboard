#!/usr/bin/env node
/**
 * Wrapper around the Weval CLI for the EMERGENZ Biosecurity blueprints.
 *
 * Responsibilities:
 *  1. Invoke the Weval CLI against weval/biosecurity-gemini-news-classification.yml
 *  2. Parse the structured result
 *  3. Compare to the most recent baseline in weval/baselines/
 *  4. Emit `weval-run-result.json` (gitignored) with a structured diff
 *  5. Exit non-zero ONLY on regression beyond configurable thresholds
 *
 * Designed to be safe to run locally and in CI. Fails open when the CLI is
 * absent (logs and exits 0) so that a missing CLI on the operator's machine
 * doesn't break unrelated workflows. The CI workflow explicitly installs
 * the CLI first; absence there is a real failure.
 *
 * Environment variables (all optional; sensible defaults documented):
 *   WEVAL_BLUEPRINT          - path to the blueprint YAML (default: weval/biosecurity-gemini-news-classification.yml)
 *   WEVAL_MODEL              - production model under test (default: google:gemini-2.5-flash)
 *   WEVAL_JUDGE_MODEL        - judge model (default: openai:gpt-4o-mini)
 *   WEVAL_BASELINE_DIR       - directory holding committed baselines (default: weval/baselines)
 *   WEVAL_OUTPUT_PATH        - path for the run-result artifact (default: weval-run-result.json)
 *   WEVAL_REGRESSION_FAIL    - "1" to exit non-zero on regression; "0" to exit 0 even on regression (default: "1")
 *   WEVAL_ACCURACY_DROP_PCT  - regression threshold for classification accuracy (default: 10)
 *   WEVAL_LIMIT_DROP_PCT     - regression threshold for prompt-limit adherence (default: 5)
 *   WEVAL_HALLUCINATION_TOL  - max hallucinations allowed (default: 0; any hallucination = regression)
 *   WEVAL_CLI_COMMAND        - CLI binary to invoke (default: "npx weval"); operator overrides if Weval CLI is installed globally as a different name
 *   WEVAL_SKIP_CLI           - "1" to skip CLI invocation and just compare existing artifacts (used by tests)
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'

const BLUEPRINT = process.env.WEVAL_BLUEPRINT || 'weval/biosecurity-gemini-news-classification.yml'
const MODEL = process.env.WEVAL_MODEL || 'google:gemini-2.5-flash'
const JUDGE_MODEL = process.env.WEVAL_JUDGE_MODEL || 'openai:gpt-4o-mini'
const BASELINE_DIR = process.env.WEVAL_BASELINE_DIR || 'weval/baselines'
const OUTPUT_PATH = process.env.WEVAL_OUTPUT_PATH || 'weval-run-result.json'
const REGRESSION_FAIL = (process.env.WEVAL_REGRESSION_FAIL || '1') === '1'
const ACCURACY_DROP_PCT = Number.parseFloat(process.env.WEVAL_ACCURACY_DROP_PCT || '10')
const LIMIT_DROP_PCT = Number.parseFloat(process.env.WEVAL_LIMIT_DROP_PCT || '5')
const HALLUCINATION_TOL = Number.parseInt(process.env.WEVAL_HALLUCINATION_TOL || '0', 10)
const CLI_COMMAND = process.env.WEVAL_CLI_COMMAND || 'npx weval'
const SKIP_CLI = process.env.WEVAL_SKIP_CLI === '1'

function atomicWriteFileSync(path, content) {
  const tmp = `${path}.tmp.${process.pid}`
  writeFileSync(tmp, content)
  try {
    renameSync(tmp, path)
  } catch (error) {
    if (existsSync(tmp)) {
      try { unlinkSync(tmp) } catch { /* best-effort cleanup */ }
    }
    throw error
  }
}

function writeResult(result) {
  atomicWriteFileSync(OUTPUT_PATH, JSON.stringify({
    checkedAt: new Date().toISOString(),
    blueprint: BLUEPRINT,
    model: MODEL,
    judgeModel: JUDGE_MODEL,
    ...result,
  }, null, 2) + '\n')
}

function findMostRecentBaseline() {
  if (!existsSync(BASELINE_DIR)) return null
  const entries = readdirSync(BASELINE_DIR)
    .filter((name) => name.endsWith('.json') && !name.startsWith('_'))
    .map((name) => ({ name, full: join(BASELINE_DIR, name) }))
    .filter((e) => statSync(e.full).isFile())
    .sort((a, b) => b.name.localeCompare(a.name)) // YYYY-MM-DD sorts chronologically
  if (entries.length === 0) return null
  try {
    return { name: entries[0].name, data: JSON.parse(readFileSync(entries[0].full, 'utf8')) }
  } catch {
    return null
  }
}

function todayUtcDate() {
  return new Date().toISOString().slice(0, 10)
}

function modelSlug(model) {
  return model.replace(/[:/]/g, '-')
}

function runWevalCli() {
  if (SKIP_CLI) {
    return { ok: false, skipped: true, reason: 'WEVAL_SKIP_CLI=1', stdout: '', stderr: '', exitCode: 0 }
  }
  const cliParts = CLI_COMMAND.trim().split(/\s+/)
  const cliBinary = cliParts[0]
  const cliArgs = [
    ...cliParts.slice(1),
    'run',
    BLUEPRINT,
    '--model', MODEL,
    '--judge', JUDGE_MODEL,
    '--format', 'json',
  ]
  const child = spawnSync(cliBinary, cliArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (child.error) {
    return {
      ok: false,
      skipped: false,
      reason: `Weval CLI invocation failed: ${child.error.message}`,
      stdout: child.stdout || '',
      stderr: child.stderr || '',
      exitCode: child.status ?? -1,
    }
  }
  if (child.status !== 0) {
    return {
      ok: false,
      skipped: false,
      reason: `Weval CLI exited ${child.status}`,
      stdout: child.stdout || '',
      stderr: child.stderr || '',
      exitCode: child.status,
    }
  }
  try {
    const parsed = JSON.parse(child.stdout)
    return { ok: true, parsed, stdout: child.stdout, stderr: child.stderr || '', exitCode: 0 }
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: `Weval CLI output is not valid JSON: ${error.message}`,
      stdout: child.stdout,
      stderr: child.stderr || '',
      exitCode: child.status,
    }
  }
}

function summarizeResults(parsed) {
  // The Weval CLI's exact output shape may evolve. We extract conservatively:
  // total cases, pass count per category, and any hallucination flags.
  const cases = Array.isArray(parsed?.cases) ? parsed.cases : []
  const totals = { cases: cases.length, passed: 0, failed: 0 }
  const byCategory = {}
  let hallucinations = 0

  for (const c of cases) {
    const id = c.id || ''
    const category = id.startsWith('classify-') ? 'classification-positive'
      : id.startsWith('negative-') ? 'classification-negative'
      : id.startsWith('hallucination-') ? 'hallucination-resistance'
      : id.startsWith('confidence-') ? 'confidence-calibration'
      : id.startsWith('limit-') ? 'prompt-limit-adherence'
      : id.startsWith('multi-tag-') || id.startsWith('dedup-') || id.startsWith('empty-') ? 'edge-cases'
      : 'other'
    byCategory[category] = byCategory[category] || { total: 0, passed: 0, failed: 0 }
    byCategory[category].total += 1
    const passed = c.passed === true || c.pass === true || c.score === 1
    if (passed) {
      totals.passed += 1
      byCategory[category].passed += 1
    } else {
      totals.failed += 1
      byCategory[category].failed += 1
    }
    if (category === 'hallucination-resistance' && !passed) hallucinations += 1
  }

  return { totals, byCategory, hallucinations }
}

function detectRegressions(currentSummary, baseline) {
  if (!baseline) return { regressed: false, regressions: [], reason: 'no prior baseline; first run' }
  const baseSum = baseline.summary || baseline
  const regressions = []

  if (currentSummary.hallucinations > HALLUCINATION_TOL) {
    regressions.push({
      kind: 'hallucination',
      detail: `${currentSummary.hallucinations} hallucination(s) detected; tolerance is ${HALLUCINATION_TOL}`,
    })
  }

  function categoryPct(s, key) {
    const c = s.byCategory?.[key]
    if (!c || c.total === 0) return null
    return (c.passed / c.total) * 100
  }
  const accuracyKeys = ['classification-positive', 'classification-negative']
  for (const key of accuracyKeys) {
    const now = categoryPct(currentSummary, key)
    const before = categoryPct(baseSum, key)
    if (now !== null && before !== null && (before - now) > ACCURACY_DROP_PCT) {
      regressions.push({
        kind: 'accuracy-drop',
        category: key,
        detail: `${key} accuracy dropped ${(before - now).toFixed(1)} pp (was ${before.toFixed(1)}%, now ${now.toFixed(1)}%); threshold ${ACCURACY_DROP_PCT} pp`,
      })
    }
  }
  const now = categoryPct(currentSummary, 'prompt-limit-adherence')
  const before = categoryPct(baseSum, 'prompt-limit-adherence')
  if (now !== null && before !== null && (before - now) > LIMIT_DROP_PCT) {
    regressions.push({
      kind: 'limit-adherence-drop',
      detail: `prompt-limit adherence dropped ${(before - now).toFixed(1)} pp (was ${before.toFixed(1)}%, now ${now.toFixed(1)}%); threshold ${LIMIT_DROP_PCT} pp`,
    })
  }

  return { regressed: regressions.length > 0, regressions, reason: '' }
}

async function main() {
  if (!existsSync(BLUEPRINT)) {
    writeResult({ ok: false, reason: `blueprint not found: ${BLUEPRINT}` })
    console.error(`[run-weval] FAILED: blueprint not found at ${BLUEPRINT}`)
    process.exitCode = 1
    return
  }

  const cliResult = runWevalCli()

  if (cliResult.skipped) {
    writeResult({ ok: true, mode: 'cli-skipped', reason: cliResult.reason })
    console.log(`[run-weval] CLI skipped (${cliResult.reason})`)
    return
  }

  if (!cliResult.ok) {
    writeResult({ ok: false, mode: 'cli-failure', reason: cliResult.reason, stderr: cliResult.stderr })
    console.error(`[run-weval] FAILED: ${cliResult.reason}`)
    if (cliResult.stderr) console.error(cliResult.stderr)
    // Fail open when CLI is absent (npx weval not yet installed locally),
    // fail closed in CI where the workflow explicitly installs.
    const isAbsentCli = /command not found|ENOENT|not recognized/i.test(cliResult.reason + cliResult.stderr)
    process.exitCode = isAbsentCli && !REGRESSION_FAIL ? 0 : 1
    return
  }

  const summary = summarizeResults(cliResult.parsed)
  const baselineRecord = findMostRecentBaseline()
  const regressionCheck = detectRegressions(summary, baselineRecord?.data)

  const nextBaselineName = `${todayUtcDate()}-${modelSlug(MODEL)}.json`
  const nextBaselinePath = join(BASELINE_DIR, nextBaselineName)
  let wroteBaseline = false
  if (!regressionCheck.regressed) {
    if (!existsSync(BASELINE_DIR)) mkdirSync(BASELINE_DIR, { recursive: true })
    const baselineContent = {
      capturedAt: new Date().toISOString(),
      model: MODEL,
      judgeModel: JUDGE_MODEL,
      blueprint: BLUEPRINT,
      summary,
      raw: cliResult.parsed,
    }
    atomicWriteFileSync(nextBaselinePath, JSON.stringify(baselineContent, null, 2) + '\n')
    wroteBaseline = true
  }

  writeResult({
    ok: !regressionCheck.regressed,
    mode: 'completed',
    priorBaseline: baselineRecord?.name || null,
    summary,
    regressed: regressionCheck.regressed,
    regressions: regressionCheck.regressions,
    reason: regressionCheck.reason,
    wroteBaseline,
    nextBaseline: wroteBaseline ? nextBaselineName : null,
  })

  if (regressionCheck.regressed) {
    console.error('[run-weval] REGRESSION DETECTED')
    for (const r of regressionCheck.regressions) console.error(`- ${r.kind}: ${r.detail}`)
    process.exitCode = REGRESSION_FAIL ? 1 : 0
    return
  }

  console.log(`[run-weval] OK · cases=${summary.totals.cases} passed=${summary.totals.passed} failed=${summary.totals.failed}${wroteBaseline ? ` · wrote baseline ${nextBaselineName}` : ''}`)
}

main().catch((error) => {
  console.error('[run-weval] FAILED:', error.message)
  writeResult({ ok: false, reason: error.message })
  process.exitCode = 1
})
