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
