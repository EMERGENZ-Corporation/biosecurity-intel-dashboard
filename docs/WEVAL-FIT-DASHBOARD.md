# Weval Fit Assessment — biosecurity-intel-dashboard

**Date:** 2026-05-25
**Scope:** This single repository (`biosecurity-intel-dashboard`). For the broader EMERGENZ portfolio view across PRISM / STRATA / MERIDIAN / Core Stack, see the separate cross-portfolio Weval-fit analysis at `~/Downloads/weval-fit-analysis.md`.

---

## Headline

The cross-portfolio analysis records the dashboard's **current** Weval fit as `None`, with rationale: *"Dashboard is data aggregation and display with verbatim sourced content. No AI inference layer to evaluate."*

**That rationale is materially incorrect for this repo as of 2026-05-25.** There is a small but real AI inference surface in production today — Gemini-driven news classification in `scripts/enrich-news.mjs` — and as of today's timeline auto-promote ship (`67743e2`), its stakes have increased.

This doc refines the cross-portfolio assessment for this specific repo:

| Surface | Current fit | Why |
|---|---|---|
| Gemini signal-ID classification (`enrich-news.mjs` → `news.json` `signalIds`) | **Narrow but real** | Production AI, persisted to public news.json, now feeds the timeline auto-promote |
| Gemini duplicate/cluster detection | Marginal | Internal-only artifact; analyst reads, doesn't auto-action |
| Gemini query-expansion suggestions | Marginal | Internal-only; analyst-reviewed |
| Gemini internal-brief generation | Marginal | Internal-only; explicit prompt limits on clinical content |
| Timeline auto-promote logic (`promote-news-to-timeline.mjs`) | **None** | Deterministic; no model in the loop at promotion time |
| Podcast Sessions 1-6 (locked, not yet built) | **None** | Deterministic by construction per PODCAST-EXPORT-DESIGN.md §7 + §12 + CONTENT-STANDARDS §4.6 |
| Future Phase 2 AI features (synthesis, clinical briefs) | **Strong** (matches cross-portfolio analysis) | Real AI synthesis would need accuracy + hallucination + appropriateness evals |

---

## The Gemini surface in this repo, precisely

`scripts/enrich-news.mjs` calls Gemini 2.5 Flash with a structured prompt (lines 153-188 of that file) and writes the output to four channels:

| Gemini output field | Where it lands | Public-facing? | Eval priority |
|---|---|---|---|
| `items[].suggestedSignalIds[]` | `src/data/news.json` `signalIds` field | **Yes** — drives News page tagging + feeds timeline auto-promote eligibility | **High** |
| `items[].duplicateOf` / `eventClusterKey` | Internal `ai-news-enrichment-result.json` | No | Low |
| `items[].confidence` | Used to gate which `signalIds` get persisted | Indirect | Medium |
| `queryExpansions[]` | Reusable `[AI BRIEF]` GitHub issue | No | Low |
| `internalBrief` headline + priorityItems | Same reusable issue | No | Low |

The prompt explicitly prohibits clinical content, case counts, risk levels, public-health directives, invented authorities / sources / URLs. Adherence to these limits is itself eval-worthy (a regression here would be a content-standards violation).

---

## Why stakes increased today (2026-05-25)

Earlier this session I shipped `feat(timeline): deterministic Tier 1 news → signal-timeline auto-promote` (`67743e2`). Gemini-assigned `signalIds` now indirectly gate auto-promote eligibility:

- Gate #2: `news.signalIds.length === 1` — exactly one signalId required for promotion eligibility
- A Gemini error that tags one item with two signalIds → benign (item skips, no harm)
- A Gemini error that *correctly* tags a Tier 1 news item with the *wrong* single signalId → **misattributed auto-promoted timeline event ships under the EMERGENZ Data Bot identity**

This is now a non-trivial integrity surface. The downstream defenses (Tier 1 authority allowlist, Tier 1 sourceId hard-resolve, same-day collision skip) reduce blast radius but don't make this go away.

It is exactly the kind of narrow, well-scoped AI surface Weval is designed to evaluate.

---

## Recommended path — Phase 1.5

**Build a small, focused Weval eval suite scoped to the Gemini signal-ID classification surface only.** ~30 test cases across four evaluation dimensions:

| Dimension | What it tests | Why it matters |
|---|---|---|
| 1. Classification accuracy | Does Gemini pick the correct `signalId(s)` from the catalog for a given news headline + description? | Direct user-facing impact + auto-promote eligibility |
| 2. Hallucination resistance | Does Gemini ever invent a `signalId` that doesn't exist in the supplied catalog? | Should be 0%; a single hallucinated tag would land in `news.json` and could trigger auto-promote |
| 3. Confidence calibration | Are items Gemini marks `confidence: "high"` actually higher precision than `medium` and `low`? | Whether the confidence filter in `enrich-news.mjs` is doing real work |
| 4. Prompt-limit adherence | Does Gemini ever write clinical content / case counts / risk levels / authoritative claims despite the prompt's hard limits? | Direct CONTENT-STANDARDS §4.1 violation if breached |

### Sequencing — Phase 1.5 BEFORE podcast Session 1

Locked decision (user, 2026-05-25): build the eval suite before podcast Session 1.

Rationale:
- The podcast feature will introduce public "synthetic voice" disclosure language that funders/reviewers will read alongside any AI claims
- A shipped Weval suite materially strengthens the AI-boundary story
- The work is bounded (~4-8 hours of authoring)
- Doesn't block podcast — Session 1 (lexicon tool + script generator) can begin once the eval suite ships
- The eval pattern established here will be reused when Phase 2 AI features (clinical brief synthesis, etc.) ship; doing it once with this small surface lays the groundwork

### Out of scope for Phase 1.5

- Evals for duplicate-detection, query-expansion, or internal-brief outputs (low priority — internal-only artifacts)
- Cross-model comparison runs against non-Gemini providers (Phase 2 if/when we evaluate switching providers)
- Production CI integration (eval suite lives in `weval/` and is run on-demand; no CI gate yet — the cost/value of failing a CI build on a Weval miss isn't worth it for a narrow classifier)
- Periodic re-runs and drift detection (Phase 2 — once we have a baseline, can be added later)

### Out of scope permanently

- Evals of `promote-news-to-timeline.mjs` (deterministic; covered by `scripts/test-promote-news-to-timeline.mjs` with 12 cases)
- Evals of the podcast script generator (deterministic; covered by future `scripts/test-podcast-script-generation.mjs` in Session 1)
- Evals of the synthetic voice itself (this is rendering, not generation; out of scope for any LLM eval framework)

---

## Deliverables

| File | Status | Purpose |
|---|---|---|
| `docs/WEVAL-FIT-DASHBOARD.md` | This file | Repo-scoped fit assessment + recommendation |
| `weval/biosecurity-gemini-news-classification.yml` | Phase 1.5 deliverable | The Weval blueprint (~30 test cases) |
| `weval/README.md` | Phase 1.5 deliverable | How to author, run, publish |

The Weval blueprint is authored in YAML per the upstream format (https://github.com/weval-org/configs). Publishing to weval.org is a separate operational step (PR to `weval-org/configs`) and is **not** part of this Phase 1.5 — that submission decision is deferred until after we've run the suite locally against `gemini-2.5-flash` and have an internal baseline.

---

## Forward link to Phase 2

When Phase 2 AI features land (e.g., AI-generated weekly briefing synthesis, clinical recognition assistance, outbreak summarization), each new AI surface gets its own Weval blueprint published in parallel:

- `weval/biosecurity-clinical-brief-synthesis.yml`
- `weval/biosecurity-outbreak-summarization.yml`
- `weval/biosecurity-search-relevance.yml`

The Phase 1.5 blueprint built now is intentionally narrow so that pattern can scale cleanly.

---

## What this does NOT change

- The deterministic news/status/api/timeline-promote pipelines.
- The CONTENT-STANDARDS §1 tier discipline.
- The fail-open posture documented in AI-ENRICHMENT-POLICY.md.
- The non-clinical, non-predictive scope of the dashboard.
- Any decision in `~/Downloads/weval-fit-analysis.md` regarding STRATA / MHDDS / MERIDIAN / PRISM / Core Stack.

This is a narrow Phase 1.5 addition to the existing autonomy contract, not a posture shift.
