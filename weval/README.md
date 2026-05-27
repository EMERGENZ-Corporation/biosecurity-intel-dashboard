# weval/ — EMERGENZ Biosecurity Weval blueprints

This directory holds [Weval](https://weval.org) evaluation blueprints scoped to the AI inference surfaces in this repo. For the broader rationale (why narrow, why now, what's out of scope), see [`docs/WEVAL-FIT-DASHBOARD.md`](../docs/WEVAL-FIT-DASHBOARD.md).

---

## Current blueprints

| File | Surface under test | Status |
|---|---|---|
| [`biosecurity-gemini-news-classification.yml`](biosecurity-gemini-news-classification.yml) | Production Gemini news classifier at `scripts/enrich-news.mjs` | Phase 1.5 - run-3 sandbox blueprint fixed 2026-05-27; public PR is appropriate if the provider-circuit caveat is disclosed |

---

## What each blueprint tests

### `biosecurity-gemini-news-classification.yml`

26 test cases across 5 dimensions:

| Dimension | Cases | What they catch |
|---|---|---|
| Classification accuracy (positive) | 8 | Wrong / missing / over-broad signal tagging |
| Classification accuracy (negative) | 3 | Inappropriate tagging of off-topic / out-of-scope news |
| Hallucination resistance | 3 | Invented signalIds outside the supplied catalog |
| Confidence calibration | 3 | `high`/`medium`/`low` confidence labels not matching reality |
| Prompt-limit adherence | 6 | Clinical content, case counts, risk ratings, public-health directives, fabricated URLs, fabricated numerics |
| Edge cases | 3 | Multi-tag restraint, deduplication, empty-input handling |

Each prompt embeds a realistic subset of the production signal catalog (id + name + category) and a synthesized news item modeled on real items in `src/data/news.json`. The catalog is intentionally slimmer than production (no `summary`, no `geography`) — production gives Gemini MORE context, so eval passes here are a conservative lower bound: if Gemini passes with less context, production should pass at least as well.

---

## Current sandbox baseline

Run 3 (`biosecurity-gemini-news-classification-run3.yml`, 2026-05-27) produced
100.0% displayed coverage across 26 prompts and 5 configured models after the
blueprint was changed to avoid Weval sandbox consensus-judge failures. A
committed summary is stored at
`weval/baselines/2026-05-27-sandbox-run3-summary.json`.

- Quoted prose rubric lines are preserved as `# rubric note:` comments.
- Active scoring uses deterministic Weval functions such as `$contains`,
  `$not_contains`, `$not_matches`, `$not_imatches`, and `$is_json`.
- The known Gemini markdown-fence failure is now tested with `$not_matches:
  "^\\s*```"` and a matching raw-JSON prompt instruction.
- The Andes confidence prompt clarifies that `confidence` means classifier
  confidence, not public-health risk severity.

Important caveat: the Weval sandbox still routed Gemini as
`openrouter:google/gemini-2.5-flash` in the exported result and completed only 2
Gemini prompts while 24 prompts hit provider circuit-breaker errors. Treat run 3
as a clean blueprint-structure baseline, not yet as a full production Gemini
baseline. Before publishing to the public Weval library, either get a full
Gemini run without the OpenRouter circuit breaker, or disclose the sandbox
limitation in the PR notes.

---

## How to author a new blueprint

1. Read [`docs/WEVAL-FIT-DASHBOARD.md`](../docs/WEVAL-FIT-DASHBOARD.md) to confirm the surface is in-scope (i.e., a real AI inference layer that isn't already covered by deterministic unit tests).
2. Read [`scripts/enrich-news.mjs`](../scripts/enrich-news.mjs) (lines 153-188 for the production prompt shape) so the eval mirrors what actually runs.
3. Read the Weval methodology: https://github.com/weval-org/app/blob/main/docs/METHODOLOGY.md
4. Create `weval/<surface>-<purpose>.yml` with this top-level structure:
   ```yaml
   title: "..."
   description: |
     ...
   models:
     - google:gemini-2.5-flash       # the actual production model
     - anthropic:claude-haiku-4-5    # cross-vendor comparison + the judge in CI
   tags:
     - public-health
     - biosecurity
     - <surface-specific tag>
   ---
   - id: case-1
     prompt: |
       [full production-style prompt with embedded inputs]
     should:
       - $contains: "expected-catalog-id"
       - $not_contains: "forbidden-catalog-id"
       - $not_matches: "forbidden-regex"
       # rubric note: concrete human-readable rationale for maintainers
     citation: "..."
   ```
5. Prefer deterministic `$` point functions over quoted prose rubric lines in
   sandbox-ready blueprints. The 2026-05-26/27 sandbox runs showed quoted prose
   criteria failing with `All judges failed in consensus mode`, even when the
   model response was correct. Keep human-readable rationale as `# rubric note:`
   comments when useful.
6. Add a row to the "Current blueprints" table above with status `Phase X — authored YYYY-MM-DD`.
7. Add a HANDOFF entry explaining the surface, its production load-bearing role, and the dimensions tested.
8. Run locally (see "Running locally" below) and confirm reasonable behavior against `google:gemini-2.5-flash` before any publication.

---

## Running locally

Weval supports both web-UI runs (via https://weval.org/sandbox) and CLI runs.

### Web sandbox (fastest, no setup)

1. Open https://weval.org/sandbox
2. Paste the contents of the `.yml` file
3. Configure your provider keys in the sandbox
4. **In the model picker, DESELECT `claude-3-haiku-20240307`** — it is a retired model and every prompt returns `404 model: claude-3-haiku-20240307`, polluting the coverage table with a 0% column. **However, the yaml DELIBERATELY lists it under `models:` anyway** — three sandbox runs without it returned `N/A` on every criterion and 0% macro coverage because the sandbox's LLM-judge layer (`holistic-claude-haiku-4-5`) appears to only spin up when an Anthropic model is present in the blueprint's `models:` block. Keeping it in the yaml satisfies that wiring; deselecting it in the picker keeps the failing 404 column out of your results. The blueprint also pre-selects the 4-model OpenAI tier sweep + Gemini production. `claude-haiku-4-5` (our CI judge) is not in the sandbox picker as of 2026-05 — that's expected; the judge runs server-side in CI only. The open-weight 7B/8B models (mistral, llama) are also intentionally left out — adding `openrouter:` slugs for them on 2026-05-25 aborted the grading pass for the whole run.
5. Run

### CLI (when scaling beyond ad-hoc runs)

Weval CLI lives at `weval-org/app` (see https://github.com/weval-org/app). Install:

```bash
npm install -g @weval/cli   # exact package name may differ; verify against the latest weval-org docs
```

Then:

```bash
weval run weval/biosecurity-gemini-news-classification.yml \
  --model google:gemini-2.5-flash \
  --judge anthropic:claude-haiku-4-5
# Requires GEMINI_API_KEY (production model) + ANTHROPIC_API_KEY
# (judge model) in the local environment. The judge is intentionally a
# different vendor family from the production model — bias-free grading
# of the Gemini classifier.
```

**Important:** `GEMINI_API_KEY` here must be the same key used by `scripts/enrich-news.mjs` in production; `ANTHROPIC_API_KEY` is Weval-only and never referenced by any other code path. **Only use these keys locally** — never check them into the repo, never expose them through `VITE_*`, and never pin them in a workflow outside `weval-baseline.yml` without the existing secret-store discipline. The Weval CLI run is read-only against the model APIs and does not write back to `src/data/`.

---

## How to publish to weval.org

When ready (recommended: after at least one local run shows reasonable signal-ID classification accuracy and zero hallucinations on the current Gemini model):

1. Fork https://github.com/weval-org/configs
2. Drop the blueprint at `blueprints/biosecurity-gemini-news-classification.yml` in the fork
3. Open a PR following the contribution guidelines (see the configs repo README)
4. The Weval team reviews against the civic-minded mission criteria; biosecurity intel evals fit the public-health-emergency criteria
5. On merge, the blueprint appears on weval.org leaderboards and can be re-run by anyone

**No publication should happen without:**
- A clean local run on `google:gemini-2.5-flash` (the production model)
- A clean sandbox or CLI result that does not depend on provider circuit-breaker
  auto-failures being hidden by the displayed coverage summary, or a clear PR
  note explaining any sandbox provider limitation
- A HANDOFF entry documenting baseline scores
- Explicit operator sign-off (publication makes our AI-boundary claims publicly auditable; that's the *point* of doing this, but the timing decision is operator's)

---

## What is NOT covered here

These surfaces are deliberately excluded from Weval evaluation (see `docs/WEVAL-FIT-DASHBOARD.md` for rationale):

- **Timeline auto-promote logic** (`scripts/promote-news-to-timeline.mjs`) — deterministic, covered by `scripts/test-promote-news-to-timeline.mjs` (12 unit tests) + 8 validator regression tests
- **Podcast script generation** (`PODCAST-EXPORT-DESIGN.md` §7) — deterministic by construction; will be covered by Session 1 unit tests
- **Synthetic voice rendering** — not generation; not an LLM inference layer
- **Validator / audit / build scripts** — not AI surfaces

---

## Forward link to Phase 2

When Phase 2 AI features ship (AI synthesis of weekly briefings, clinical recognition assistance, outbreak summarization), each gets its own blueprint:

- `weval/biosecurity-clinical-brief-synthesis.yml`
- `weval/biosecurity-outbreak-summarization.yml`
- `weval/biosecurity-search-relevance.yml`

The Phase 1.5 blueprint here is intentionally narrow and patterns the future suites — same prompt-fidelity-to-production approach, same deterministic `$` point-function discipline for sandbox-stable scoring.
