#!/usr/bin/env node
/**
 * Generates static API endpoints under public/api/v1/ so consumers (analysts,
 * partner agencies, downstream tools) can fetch the dashboard's structured
 * data directly without scraping. Each endpoint is wrapped in a small
 * envelope carrying the generation timestamp, item count, and the schema
 * version so consumers can detect breaking changes.
 *
 * Endpoints:
 *   /api/v1/signals.json       — full Signal[] array
 *   /api/v1/signal-sources.json — full SignalSource[] array
 *   /api/v1/signal-timeline.json — full SignalTimelineEvent[] array
 *   /api/v1/news.json          — full NewsItem[] array
 *
 * Run via `npm run generate:api` or as part of the data refresh workflow.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

const SCHEMA_VERSION = 1

const ENDPOINTS = [
  { src: 'src/data/signals.json',          dst: 'public/api/v1/signals.json',          name: 'signals'        },
  { src: 'src/data/signal-sources.json',   dst: 'public/api/v1/signal-sources.json',   name: 'signalSources'  },
  { src: 'src/data/signal-timeline.json',  dst: 'public/api/v1/signal-timeline.json',  name: 'signalTimeline' },
  { src: 'src/data/news.json',             dst: 'public/api/v1/news.json',             name: 'news'           },
]

function ensureDir(path) {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function main() {
  const generatedAt = new Date().toISOString()
  let totalItems = 0

  for (const { src, dst, name } of ENDPOINTS) {
    const data = JSON.parse(readFileSync(src, 'utf8'))
    if (!Array.isArray(data)) {
      throw new Error(`${src} did not parse to an array`)
    }
    const envelope = {
      schemaVersion: SCHEMA_VERSION,
      generatedAt,
      endpoint: dst.replace(/^public/, ''),
      count: data.length,
      [name]: data,
    }
    ensureDir(dst)
    writeFileSync(dst, JSON.stringify(envelope, null, 2) + '\n')
    totalItems += data.length
    console.log(`  wrote ${dst} (${data.length} ${name})`)
  }

  console.log(`[generate-api] generated ${ENDPOINTS.length} endpoints, ${totalItems} total items`)
}

main()
