#!/usr/bin/env node
/**
 * Guards the dashboard's AI/enrichment disclosure boundary.
 *
 * The current production contract is deliberately conservative: no live Gemini
 * or Bright Data integration, no required AI/enrichment API key, and no
 * browser-exposed provider keys. If a future integration adds those services,
 * this audit should fail until the policy, public disclosure, and validators are
 * updated intentionally.
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const OUTPUT_PATH = process.env.AI_ENRICHMENT_AUDIT_OUTPUT || 'ai-enrichment-audit-result.json'

const REQUIRED_FILES = [
  'AI-ENRICHMENT-POLICY.md',
  'src/pages/AboutPage.tsx',
  'src/pages/MethodologyPage.tsx',
  'public/status.json',
  'scripts/generate-status.mjs',
  'CONTENT-STANDARDS.md',
]

const REQUIRED_DISCLOSURE = [
  {
    file: 'AI-ENRICHMENT-POLICY.md',
    phrases: [
      'Gemini is not used by the live dashboard pipeline',
      'Bright Data is not used by the live dashboard pipeline',
      'No Gemini, Google Generative AI, Bright Data, or Web Unlocker API key',
      'Bright Data must not become a source of record',
      'never fabricate numbers or events',
      'expose API keys through `VITE_` variables',
    ],
  },
  {
    file: 'src/pages/AboutPage.tsx',
    phrases: [
      'Gemini is not currently used by the live dashboard pipeline',
      'Bright Data is not currently used by the live dashboard pipeline',
      'source of record',
      'AI-assisted development and editorial work',
    ],
  },
  {
    file: 'src/pages/MethodologyPage.tsx',
    phrases: [
      'Gemini is not currently used by the live update pipeline',
      'Bright Data is not currently used by the live update pipeline',
      'source of record',
    ],
  },
  {
    file: 'CONTENT-STANDARDS.md',
    phrases: [
      'Gemini prompt rule',
      'Never show pipeline diagnostics publicly',
      'Clinical guidance is manually curated only',
    ],
  },
]

const LIVE_SCAN_PATHS = [
  '.env.example',
  'package.json',
  '.github/workflows',
  'scripts',
  'src',
]

const LIVE_KEY_PATTERNS = [
  /\bGEMINI_API_KEY\b/i,
  /\bGOOGLE_GENERATIVE_AI_API_KEY\b/i,
  /\bBRIGHT_DATA_API_KEY\b/i,
  /\bBRIGHTDATA_API_KEY\b/i,
  /\bBRD_API_KEY\b/i,
  /\bWEB_UNLOCKER\b/i,
]

const CLIENT_EXPOSED_KEY_PATTERN = /\bVITE_[A-Z0-9_]*(GEMINI|GOOGLE_GENERATIVE|BRIGHT|BRD|UNLOCKER)[A-Z0-9_]*\b/i

const ALLOWED_REFERENCES = new Set([
  'scripts/audit-ai-enrichment.mjs',
])

function read(path) {
  return readFileSync(path, 'utf8')
}

function walk(path) {
  const out = []
  const entries = readdirSync(path, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(path, entry.name).replace(/\\/g, '/')
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue
      out.push(...walk(full))
    } else {
      out.push(full)
    }
  }
  return out
}

function filesToScan() {
  const files = []
  for (const path of LIVE_SCAN_PATHS) {
    if (path.endsWith('.json') || path.endsWith('.example')) {
      files.push(path)
      continue
    }
    try {
      const entries = readdirSync(path, { withFileTypes: true })
      if (entries.length >= 0) files.push(...walk(path))
    } catch {
      files.push(path)
    }
  }
  return [...new Set(files)].filter((file) =>
    /\.(mjs|js|ts|tsx|json|yml|yaml|example)$/.test(file)
  )
}

function main() {
  const checkedAt = new Date().toISOString()
  const errors = []

  for (const file of REQUIRED_FILES) {
    try { read(file) } catch (error) { errors.push(`${file}: ${error.message}`) }
  }

  for (const { file, phrases } of REQUIRED_DISCLOSURE) {
    let body = ''
    try { body = read(file) } catch { continue }
    for (const phrase of phrases) {
      if (!body.includes(phrase)) errors.push(`${file}: missing disclosure phrase "${phrase}"`)
    }
  }

  const status = JSON.parse(read('public/status.json'))
  const aiGate = status.automation?.reviewGates?.find((gate) => gate.id === 'ai-or-enrichment-output')
  if (!aiGate) errors.push('public/status.json: missing ai-or-enrichment-output review gate')
  if (aiGate && aiGate.mode !== 'not-source-of-record') {
    errors.push(`public/status.json: ai-or-enrichment-output mode must be not-source-of-record; got ${aiGate.mode}`)
  }

  for (const file of filesToScan()) {
    if (ALLOWED_REFERENCES.has(file)) continue
    const body = read(file)
    if (CLIENT_EXPOSED_KEY_PATTERN.test(body)) {
      errors.push(`${file}: AI/enrichment keys must not be browser-exposed with VITE_`)
    }
    for (const pattern of LIVE_KEY_PATTERNS) {
      if (pattern.test(body)) {
        errors.push(`${file}: live AI/enrichment key reference detected (${pattern})`)
      }
    }
  }

  const result = {
    ok: errors.length === 0,
    checkedAt,
    scannedFiles: filesToScan().length,
    disclosureFiles: REQUIRED_DISCLOSURE.map((item) => item.file),
    errors,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n')

  if (!result.ok) {
    console.error('[audit-ai-enrichment] FAILED')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(`[audit-ai-enrichment] OK - ${result.scannedFiles} live files scanned`)
}

try {
  main()
} catch (error) {
  console.error('[audit-ai-enrichment] FAILED:', error.message)
  writeFileSync(OUTPUT_PATH, JSON.stringify({ ok: false, checkedAt: new Date().toISOString(), errors: [error.message] }, null, 2) + '\n')
  process.exitCode = 1
}
