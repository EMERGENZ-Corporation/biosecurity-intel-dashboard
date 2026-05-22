import { signals, signalSources } from './signals'
import newsData from '../data/news.json'
import type { NewsItem, Signal, SignalSource } from '../types'

const news = newsData as NewsItem[]

export type SearchHitKind = 'signal' | 'section' | 'news' | 'source'

export interface SearchHit {
  kind: SearchHitKind
  /** Display title shown in the search result */
  title: string
  /** One-line context (signal name, authority, etc.) */
  subtitle: string
  /** Short matched-text snippet */
  snippet?: string
  /** Internal route or external URL for the result */
  href: string
  /** Lower is more relevant */
  score: number
}

/**
 * Global search across signals (name, summary, sections), news, sources.
 * Lightweight scoring: title hits weighted highest, then subtitle, then body.
 * No dependency on an external index — small dataset (16 signals,
 * ~500 news, ~37 sources), so linear scan is fine.
 */
export function search(query: string, limit = 30): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const terms = q.split(/\s+/).filter((t) => t.length > 0)

  const hits: SearchHit[] = []

  // --- Signals (name, pathogen, summary, operationalRelevance) -------------
  for (const signal of signals) {
    const blob = [
      signal.name,
      signal.pathogen ?? '',
      signal.summary,
      signal.operationalRelevance,
      signal.whyItMatters ?? '',
      signal.currentSituation ?? '',
      signal.geography.join(' '),
    ].join(' ').toLowerCase()

    if (matches(blob, terms)) {
      const titleMatched = signal.name.toLowerCase().includes(q)
      hits.push({
        kind: 'signal',
        title: signal.name,
        subtitle: `${signal.severity.toUpperCase()} · ${signal.category}`,
        snippet: snippet(blob, q, signal.summary),
        href: `/signals/${signal.id}`,
        score: titleMatched ? 1 : 50,
      })
    }

    // --- Detail sections -------------------------------------------------
    for (const section of signal.detailSections ?? []) {
      const sectionBlob = `${section.title} ${section.bodyMarkdown}`.toLowerCase()
      if (matches(sectionBlob, terms)) {
        const titleMatched = section.title.toLowerCase().includes(q)
        hits.push({
          kind: 'section',
          title: section.title,
          subtitle: signal.name,
          snippet: snippet(sectionBlob, q, section.bodyMarkdown.slice(0, 220)),
          href: `/signals/${signal.id}#${section.id}`,
          score: titleMatched ? 30 : 100,
        })
      }
    }
  }

  // --- News items ----------------------------------------------------------
  for (const item of news) {
    const blob = `${item.title} ${item.description ?? ''}`.toLowerCase()
    if (matches(blob, terms)) {
      const titleMatched = item.title.toLowerCase().includes(q)
      // Newer items rank higher
      const ageDays = (Date.now() - (item.timestamp ?? 0)) / 86_400_000
      const recencyBoost = Math.max(0, 30 - ageDays)
      hits.push({
        kind: 'news',
        title: item.title,
        subtitle: `${item.authority} · ${new Date(item.pubDate).toLocaleDateString()}`,
        snippet: item.description?.slice(0, 220) ?? '',
        href: item.link,
        score: (titleMatched ? 70 : 150) - recencyBoost,
      })
    }
  }

  // --- Sources -------------------------------------------------------------
  for (const source of signalSources) {
    const blob = `${source.authority} ${source.title} ${source.notes ?? ''}`.toLowerCase()
    if (matches(blob, terms)) {
      hits.push({
        kind: 'source',
        title: `${source.authority} — ${source.title}`,
        subtitle: `Tier ${source.sourceTier} · ${source.sourceType}`,
        snippet: source.notes ?? '',
        href: source.url,
        score: 80,
      })
    }
  }

  return hits.sort((a, b) => a.score - b.score).slice(0, limit)
}

function matches(blob: string, terms: string[]): boolean {
  return terms.every((t) => blob.includes(t))
}

function snippet(blob: string, q: string, fallback: string): string {
  const idx = blob.indexOf(q)
  if (idx < 0) return fallback.slice(0, 220)
  const start = Math.max(0, idx - 60)
  const end = Math.min(blob.length, idx + q.length + 160)
  return (start > 0 ? '…' : '') + blob.slice(start, end) + (end < blob.length ? '…' : '')
}

export interface SearchSummary {
  query: string
  hitCount: number
  byKind: Record<SearchHitKind, number>
}

export function summarize(hits: SearchHit[], query: string): SearchSummary {
  const byKind: Record<SearchHitKind, number> = {
    signal: 0,
    section: 0,
    news: 0,
    source: 0,
  }
  for (const h of hits) byKind[h.kind] += 1
  return { query, hitCount: hits.length, byKind }
}

// Re-export for convenience
export type { Signal, SignalSource, NewsItem }
