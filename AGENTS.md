# Agent Operating Guide

This file is for Codex, Claude Code, and human operators working in this repo.
It complements `HANDOFF.md` and `CONTENT-STANDARDS.md`; it does not replace
system, developer, or user instructions.

## Startup Order

1. Read this file.
2. Read `HANDOFF.md` for current project state, required logging, and recent
   commits.
3. Read `CONTENT-STANDARDS.md` before changing source-backed content, clinical
   language, legal/compliance text, or data pipelines.
4. Use `rg` / `rg --files` first when exploring the repo.

## Model Selection Policy

Agents generally cannot switch their own model from inside the repo. Use this
guide to decide when to continue on the current model and when to prompt the
user to switch.

For routine tasks, continue without prompting for a model change:

- Reading files, summarizing state, or answering repo-orientation questions.
- Small markdown edits, typo fixes, labels, or non-clinical copy cleanup.
- Running validation commands and reporting results.
- Low-risk UI polish that does not change workflows, data contracts, or
  production behavior.

For high-risk tasks, pause and recommend a stronger reasoning model before
making changes if the current session/model is not clearly suited to the work:

- Clinical, triage-card, dosing, PPE, infection-control, or public-health
  guidance changes.
- Legal, licensing, attribution, privacy, disclaimer, or compliance language.
- Security headers, authentication, authorization, branch protection, CI/CD, or
  deployment behavior.
- Data schema, validator, parser, source-attribution, or generated public API
  changes.
- Incident response for failing workflows, production monitors, stale data, or
  broken deployments.
- Large cross-cutting refactors or changes touching several ownership areas.

Prompt format:

```text
Recommended model change: use a stronger reasoning model for <task> because
<risk>. Continue here or switch models first?
```

If the user explicitly says to continue, proceed conservatively and document the
decision in `HANDOFF.md` when the change ships.

## Token Efficiency

- Start with the smallest useful context: file list, targeted `rg`, then direct
  file reads.
- Do not bulk-read generated data or long markdown unless the task requires it.
- Prefer summaries of long artifacts after you have inspected the relevant
  sections.
- Reuse existing scripts and validators instead of manually re-deriving data.
- Keep edits narrow. Do not bundle unrelated cleanup with requested work.

## Required Verification

For most code/data/config changes, run:

```bash
npm run test:validators
npm run validate:data
npm run build
```

For production-status or deployment-monitor changes, also run the relevant
monitor/verify command from `package.json`.

## Handoff Discipline

Any meaningful change to `src/`, `scripts/`, `.github/workflows/`, `public/`,
data files, build config, user-visible text, or exported types requires a
`HANDOFF.md` entry in the same commit. Follow the exact handoff conventions in
`HANDOFF.md`.

## Agent Pipeline

This repo ships a multi-agent pipeline for both Claude Code (`.claude/agents/`)
and Codex (`.codex/agents/`). 14 agents total: 10 generic + 4 repo-specific.

**Always-first entry point:** `pipeline-router`. Slash commands wrap the common
workflows.

### Slash commands (Claude Code)

```
/route <task>   # autonomous routing through pipeline-router
/review         # full read-only audit pass (no edits)
/ship           # pre-deploy gate; refuses if blockers or missing HANDOFF entry
/handoff        # end-of-session capture + HANDOFF.md verification
```

### Agent inventory

| Agent | Role |
|---|---|
| `pipeline-router` | Classifies task, selects agent sequence. Always first. |
| `repo-scanner` | Read-only file map. Reduces token use. |
| `architecture-agent` | Schema, pipeline boundaries, status.json/api/v1 contract. |
| `ui-wireframe-agent` | React/Vite/Tailwind frontend implementation. |
| `source-integrity-agent` | **Repo-specific.** Source registry, tier discipline, attribution preservation, source-drift, fingerprint baselines. |
| `content-standards-agent` | **Repo-specific.** Enforces CONTENT-STANDARDS.md — curated fields, scope language, disclaimers, internal-vs-public. |
| `ai-enrichment-policy-agent` | **Repo-specific.** Enforces AI-ENRICHMENT-POLICY.md — server-side only, fail-open, news-only triage, never writes structured fields. |
| `handoff-discipline-agent` | **Repo-specific.** Verifies HANDOFF.md entry exists in the same commit cycle; reminds push-before-shipped. |
| `evidence-binding-agent` | Verifies every quantified claim is bound to a registered source. |
| `grant-claims-agent` | Audits public/funder-facing copy for overclaiming, scope drift. |
| `security-posture-agent` | Secrets, env vars, CSP, headers, VITE_ exposure. |
| `test-agent` | Runs `test:validators`, `validate:data`, `build`, and relevant `audit:*` scripts. |
| `deployment-agent` | Vercel, GitHub Actions, env, headers, SPA rewrites. |
| `documentation-agent` | README, AGENTS.md, CLAUDE.md, etc. Defers HANDOFF.md to `handoff-discipline-agent`. |

Agents from the EMERGENZ generic pack that are intentionally **not installed** in
this repo (they exist for STRATA / MHDDS / SENTRY / PRISM / MERIDIAN, which do not
live here): `compliance-agent`, `mhdds-taxonomy-agent`, `prism-agent`,
`meridian-agent`. The four repo-specific agents above cover the equivalent
disciplines for this dashboard.

### Halt conditions (router refuses to proceed without user approval)

- Adding a new external dependency to `package.json`.
- Adding a new data source not in `sources.json` or covered by audit scripts.
- Any clinical-decision, diagnostic, prediction, or outbreak-forecasting language.
- Routing data through a new AI provider not listed in `AI-ENRICHMENT-POLICY.md`.
- Removing or weakening fail-open behavior in `enrich-news.mjs`.
- Removing source attribution from any signal or news item.
- Exposing any API key via `VITE_*` or shipping it to the browser bundle.
- Loosening CSP, HSTS, X-Frame-Options, or Permissions-Policy in `vercel.json`.
- Promoting a Tier 3/4 source into a structured data field.

### Hooks (Claude Code)

`.claude/settings.json` wires three lifecycle hooks:

- `check-source-integrity.sh` — blocks writes to source registry / curated data
  files unless `source-integrity-agent` or `content-standards-agent` has run
  this session (marker file `.claude/.source-reviewed-this-session`).
- `check-secret-leak.sh` — blocks if a common secret pattern appears in any
  recently modified file.
- `maybe-handoff.sh` — at session stop, reminds about HANDOFF.md discipline.

### Codex model placeholders

The `.codex/agents/*.toml` files use `REPLACE_WITH_*` placeholders. Replace
once with model IDs from your Codex provider:

```
REPLACE_WITH_SMALL_AVAILABLE_CODEX_MODEL        → smallest
REPLACE_WITH_MID_AVAILABLE_CODEX_MODEL          → mid-tier default
REPLACE_WITH_HIGH_CAPABILITY_CODEX_MODEL        → high-capability
REPLACE_WITH_HIGHEST_CAPABILITY_CODEX_MODEL     → top
REPLACE_WITH_SMALL_OR_MID_AVAILABLE_CODEX_MODEL → either small or mid
```

Replace across all files in one pass once you settle on IDs.
