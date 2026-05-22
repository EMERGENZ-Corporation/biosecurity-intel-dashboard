import { signalSources } from './signals'
import type { Signal, SourceTier } from '../types'

/**
 * Source-diversity score per UX-GAP-ANALYSIS §1.7. A signal corroborated by
 * 5 distinct Tier 1 authorities is operationally different from one
 * supported by a single ProMED entry — both can carry the same severity
 * label, but the analytic confidence differs substantially.
 *
 * The score surfaces:
 * - distinctAuthorities: how many unique issuing bodies back this signal
 * - tierCounts: distribution across Tier 1-4
 * - topTier: highest tier represented (1 is highest)
 * - label: short human-readable strength tag
 *
 * Computed at runtime from signal.sourceIds — no new data to seed.
 */
export interface SourceDiversityScore {
  distinctAuthorities: number
  tierCounts: Record<SourceTier, number>
  topTier: SourceTier | null
  /** Short label: STRONG / MODERATE / WEAK / SINGLE-SOURCE */
  label: 'STRONG' | 'MODERATE' | 'WEAK' | 'SINGLE-SOURCE'
}

export function computeSourceDiversity(signal: Signal): SourceDiversityScore {
  const sources = signal.sourceIds
    .map((id) => signalSources.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)

  const tierCounts: Record<SourceTier, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  const authorities = new Set<string>()
  for (const s of sources) {
    tierCounts[s.sourceTier] += 1
    authorities.add(s.authority)
  }

  const distinctAuthorities = authorities.size
  const topTier =
    tierCounts[1] > 0 ? 1
    : tierCounts[2] > 0 ? 2
    : tierCounts[3] > 0 ? 3
    : tierCounts[4] > 0 ? 4
    : null

  // STRONG: >=3 distinct Tier 1/2 authorities
  // MODERATE: 2 distinct Tier 1/2 authorities, or >=4 distinct any
  // WEAK: 1-2 distinct authorities, only Tier 3/4
  // SINGLE-SOURCE: 1 distinct authority
  const tier12 = tierCounts[1] + tierCounts[2]
  const label: SourceDiversityScore['label'] =
    distinctAuthorities <= 1 ? 'SINGLE-SOURCE'
    : tier12 >= 3 ? 'STRONG'
    : tier12 >= 2 || distinctAuthorities >= 4 ? 'MODERATE'
    : 'WEAK'

  return { distinctAuthorities, tierCounts, topTier, label }
}

export function diversityLabelColor(label: SourceDiversityScore['label']): string {
  switch (label) {
    case 'STRONG': return 'var(--color-accent-green)'
    case 'MODERATE': return 'var(--color-accent-blue)'
    case 'WEAK': return 'var(--color-accent-yellow)'
    case 'SINGLE-SOURCE': return 'var(--color-accent-orange)'
  }
}
