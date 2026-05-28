/**
 * briefings — shared picker logic + canonical priority list for the
 * "briefings" view of the dashboard.
 *
 * A "briefing" is a derived view of a Signal, not a separate content type.
 * /briefings and /ems-world-briefing both render briefing cards by picking
 * ONE detail section from each signal using the priority order in
 * briefings-priority.json.
 *
 * The priority list is shared with scripts/validate-data.mjs, which fails
 * the build if any signal lacks at least one matching section. That guard
 * means: when a new signal is added to signals.json, it is guaranteed to
 * have an operationally-actionable section the picker can surface — no
 * manual "create a briefing" step is needed.
 *
 * Do NOT auto-generate section content from signal data. Detail-section
 * bodyMarkdown is curated humans-only writes per CONTENT-STANDARDS.md and
 * AI-ENRICHMENT-POLICY.md.
 */
import briefingsConfig from './briefings-priority.json'
import type { Signal, SignalDetailSection } from '../types'

export const BRIEFING_SECTION_PRIORITY: readonly string[] = briefingsConfig.priority

/**
 * Pick the highest-priority detail section to surface as the briefing card
 * preview for the given signal. Falls back to the first detailSection if
 * none of the priority IDs match (this fallback should be unreachable in
 * practice because validate-data enforces priority coverage).
 */
export function pickBriefingSection(signal: Signal): SignalDetailSection | null {
  if (!signal.detailSections || signal.detailSections.length === 0) return null
  for (const id of BRIEFING_SECTION_PRIORITY) {
    const section = signal.detailSections.find((s) => s.id === id)
    if (section) return section
  }
  return signal.detailSections[0] ?? null
}

/**
 * True when the signal has at least one section whose id is in the priority
 * list. Used by the same logic the validator uses, so UI and validator
 * cannot drift.
 */
export function hasBriefingCoverage(signal: Signal): boolean {
  if (!signal.detailSections) return false
  return signal.detailSections.some((s) => BRIEFING_SECTION_PRIORITY.includes(s.id))
}
