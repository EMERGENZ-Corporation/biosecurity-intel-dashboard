#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
/**
 * Checks that the dashboard's autonomous update loop is still wired together.
 *
 * This is intentionally a repo-structure audit, not a network monitor. Runtime
 * network health is covered by update-news, official-source-audit, source-drift,
 * and monitor:status. This script guards against accidental regression in the
 * scheduled workflows, generated-public-data contract, and content-standard
 * boundaries that make the dashboard safe to run without manual babysitting.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'

const OUTPUT_PATH = process.env.AUTONOMY_AUDIT_OUTPUT || 'autonomy-audit-result.json'

const REQUIRED_PACKAGE_SCRIPTS = [
  'update:news',
  'enrich:news',
  'promote:timeline',
  'eval:gemini',
  'generate:status',
  'generate:api',
  'validate:data',
  'audit:ai-enrichment',
  'audit:sources',
  'audit:source-drift',
  'monitor:status',
  'review:digest',
  'verify:production',
]

const WORKFLOW_CHECKS = [
  {
    id: 'news-feed',
    path: '.github/workflows/update-news.yml',
    requiredText: [
      "cron: '0 */6 * * *'",
      'npm run update:news',
      'npm run enrich:news',
      'npm run promote:timeline',
      'npm run generate:api',
      'EMERGENZ Data Bot',
      'MAX_NEWS_ITEMS: 500',
      'GEMINI_API_KEY',
      'BRIGHT_DATA_API_KEY',
      'ai-news-brief',
      'news-pipeline',
      'biosecurity-data-writers',
      'src/data/signal-timeline.json',
    ],
  },
  {
    id: 'status-refresh',
    path: '.github/workflows/update-data.yml',
    requiredText: [
      "cron: '0 6 * * *'",
      'npm run validate:data',
      'npm run generate:status',
      'npm run generate:api',
      'npm run verify:production',
      'stale-data',
      'biosecurity-data-writers',
    ],
  },
  {
    id: 'official-source-audit',
    path: '.github/workflows/official-source-audit.yml',
    requiredText: [
      "cron: '43 7 * * *'",
      'npm run audit:sources',
      'npm run audit:source-drift',
      'OFFICIAL_SOURCE_AUDIT_STRICT: 0',
      'OFFICIAL_SOURCE_DRIFT_STRICT: 0',
      'source-audit',
      'source-drift',
    ],
  },
  {
    id: 'production-status-monitor',
    path: '.github/workflows/status-monitor.yml',
    requiredText: [
      "cron: '17 * * * *'",
      'npm run monitor:status',
      'status-monitor',
      'MAX_STATUS_GENERATED_AGE_HOURS: 30',
      // The next two pins were added 2026-05-25 after a false-alarm cycle on
      // the official-source-check age. They keep the monitor aligned with the
      // human review cadence for structured signal data. Raised 168h→336h
      // (14 days) on 2026-06-20. Do not change without a CONTENT-STANDARDS
      // §3.4 conversation.
      'MAX_OFFICIAL_CHECK_AGE_HOURS: 336',
      'MAX_DATA_AGE_HOURS: 336',
    ],
  },
  {
    id: 'review-digest',
    path: '.github/workflows/review-digest.yml',
    requiredText: [
      "cron: '30 6 * * *'",
      'npm run review:digest',
      'review-digest',
    ],
  },
  {
    id: 'weval-baseline',
    path: '.github/workflows/weval-baseline.yml',
    requiredText: [
      // Monthly cron; first of the month at 05:00 UTC.
      "cron: '0 5 1 * *'",
      'npm run eval:gemini',
      'weval-pipeline',
      'EMERGENZ Data Bot',
      // Tolerances pinned at the workflow layer so they can be tuned without
      // changing the wrapper script. Do not tighten without RUNBOOK §2.7 review.
      'WEVAL_HALLUCINATION_TOL: 0',
      'WEVAL_ACCURACY_DROP_PCT: 10',
      'WEVAL_LIMIT_DROP_PCT: 5',
      // Judge must be a DIFFERENT family from the production model.
      // Anthropic Claude Haiku 4.5 chosen for: no self-grading bias vs
      // Gemini production model + alignment with EMERGENZ Anthropic stack +
      // Weval is Anthropic-partnered. Switch (2026-05-25) — see HANDOFF.
      'WEVAL_JUDGE_MODEL: anthropic:claude-haiku-4-5',
      'GEMINI_API_KEY',
      'ANTHROPIC_API_KEY',
    ],
  },
  {
    id: 'ci',
    path: '.github/workflows/ci.yml',
    requiredText: [
      'npm run audit:autonomy',
      'npm run audit:ai-enrichment',
      'npm run test:validators',
      'npm run validate:data',
      'npm run build',
    ],
  },
]

const PUBLIC_ENDPOINTS = [
  'public/status.json',
  'public/api/v1/signals.json',
  'public/api/v1/signal-sources.json',
  'public/api/v1/signal-timeline.json',
  'public/api/v1/news.json',
  'public/api/v1/feed.rss',
]

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function pushMissing(errors, id, detail) {
  errors.push(`${id}: ${detail}`)
}

function checkPackageScripts(errors) {
  const pkg = readJson('package.json')
  for (const script of REQUIRED_PACKAGE_SCRIPTS) {
    if (!pkg.scripts?.[script]) pushMissing(errors, 'package.json', `missing npm script "${script}"`)
  }
}

function checkWorkflows(errors) {
  for (const workflow of WORKFLOW_CHECKS) {
    if (!existsSync(workflow.path)) {
      pushMissing(errors, workflow.id, `missing ${workflow.path}`)
      continue
    }
    const body = readFileSync(workflow.path, 'utf8')
    for (const text of workflow.requiredText) {
      if (!body.includes(text)) pushMissing(errors, workflow.id, `missing workflow guard "${text}"`)
    }
  }
}

function checkPublicContract(errors) {
  for (const endpoint of PUBLIC_ENDPOINTS) {
    if (!existsSync(endpoint)) pushMissing(errors, 'public contract', `missing ${endpoint}`)
  }

  const status = readJson('public/status.json')
  if (status.schemaVersion !== 2) pushMissing(errors, 'status.json', `schemaVersion must be 2; got ${status.schemaVersion}`)
  if (status.automation?.mode !== 'autonomous-with-review-gates') {
    pushMissing(errors, 'status.json', 'automation.mode must be "autonomous-with-review-gates"')
  }
  if (!Array.isArray(status.automation?.dataWriters) || status.automation.dataWriters.length < 3) {
    pushMissing(errors, 'status.json', 'automation.dataWriters must describe the scheduled public writers')
  }
  if (!status.automation?.dataWriters?.some((writer) => writer.id === 'ai-news-enrichment')) {
    pushMissing(errors, 'status.json', 'automation.dataWriters must include ai-news-enrichment')
  }
  if (!status.automation?.dataWriters?.some((writer) => writer.id === 'auto-timeline-promote')) {
    pushMissing(errors, 'status.json', 'automation.dataWriters must include auto-timeline-promote')
  }
  if (!Array.isArray(status.automation?.reviewGates) || status.automation.reviewGates.length < 2) {
    pushMissing(errors, 'status.json', 'automation.reviewGates must describe non-autonomous clinical/structured-data boundaries')
  }
  if (!Array.isArray(status.automation?.monitors) || status.automation.monitors.length < 3) {
    pushMissing(errors, 'status.json', 'automation.monitors must describe production/source monitoring')
  }
}

function checkContentStandards(errors) {
  const standards = readFileSync('CONTENT-STANDARDS.md', 'utf8')
  const required = [
    'Tier 1 feed failure = hard alert',
    'Tier 3 and 4 sources populate news feeds only',
    'Clinical guidance is manually curated only',
    'Never show pipeline diagnostics publicly',
  ]
  for (const text of required) {
    if (!standards.includes(text)) pushMissing(errors, 'CONTENT-STANDARDS.md', `missing standard "${text}"`)
  }
}

function main() {
  const checkedAt = new Date().toISOString()
  const errors = []

  checkPackageScripts(errors)
  checkWorkflows(errors)
  checkPublicContract(errors)
  checkContentStandards(errors)

  const result = {
    ok: errors.length === 0,
    checkedAt,
    packageScripts: REQUIRED_PACKAGE_SCRIPTS.length,
    workflows: WORKFLOW_CHECKS.map((workflow) => workflow.id),
    publicEndpoints: PUBLIC_ENDPOINTS.length,
    errors,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n')

  if (!result.ok) {
    console.error('[audit-autonomy] FAILED')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(`[audit-autonomy] OK - ${WORKFLOW_CHECKS.length} workflows, ${PUBLIC_ENDPOINTS.length} public endpoints, ${REQUIRED_PACKAGE_SCRIPTS.length} npm scripts`)
}

try {
  main()
} catch (error) {
  console.error('[audit-autonomy] FAILED:', error.message)
  writeFileSync(OUTPUT_PATH, JSON.stringify({ ok: false, checkedAt: new Date().toISOString(), errors: [error.message] }, null, 2) + '\n')
  process.exitCode = 1
}
