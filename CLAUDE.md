# CLAUDE.md

Claude Code-specific guidance for `biosecurity-intel-dashboard`. Read `AGENTS.md`
first — it holds the canonical startup order, model-selection policy, token
discipline, verification cadence, handoff rules, and agent inventory. This file
adds Claude Code-specific behavior on top.

## Required first step for non-trivial tasks

**Invoke `pipeline-router` first.** Do not begin reading files or editing
directly. The router is read-only and cheap; it classifies the task and selects
the agent sequence.

Trivial work (single-line typo fix, one obvious value change with no claim or
attribution implication) may be done directly — but `test-agent`,
`documentation-agent`, and `handoff-discipline-agent` still apply.

The fastest entry point is the `/route` slash command:

```
/route <one-line task description>
```

## Agent inventory (in `.claude/agents/`)

| Agent | Model | When to use |
|---|---|---|
| `pipeline-router` | claude-haiku-4-5 | Always first. Classifies task. |
| `repo-scanner` | claude-haiku-4-5 | Read-only file map. |
| `architecture-agent` | claude-opus-4-7 | Schema, pipeline, status.json/api/v1 contract. |
| `ui-wireframe-agent` | claude-sonnet-4-6 | React/Vite/Tailwind frontend. |
| `source-integrity-agent` | claude-sonnet-4-6 | Source registry, tier discipline, attribution, source-drift. |
| `content-standards-agent` | claude-sonnet-4-6 | CONTENT-STANDARDS.md enforcement. |
| `ai-enrichment-policy-agent` | claude-sonnet-4-6 | AI-ENRICHMENT-POLICY.md enforcement. |
| `evidence-binding-agent` | claude-sonnet-4-6 | Quantified-claim verification. |
| `grant-claims-agent` | claude-sonnet-4-6 | Funder-facing copy audit. |
| `security-posture-agent` | claude-sonnet-4-6 | Secrets, env, CSP, headers. |
| `test-agent` | claude-haiku-4-5 | `test:validators`, `validate:data`, `build`, relevant `audit:*`. |
| `deployment-agent` | claude-sonnet-4-6 | Vercel, GitHub Actions, env, headers. |
| `documentation-agent` | claude-haiku-4-5 | README/AGENTS/CLAUDE/CONTENT-STANDARDS/AI-ENRICHMENT-POLICY. |
| `handoff-discipline-agent` | claude-haiku-4-5 | HANDOFF.md entry verification. |

If your account exposes different model aliases, update the `model:` field in
each `.claude/agents/*.md` file accordingly, or set
`export CLAUDE_CODE_SUBAGENT_MODEL=inherit` to force subagents to follow the
main session.

## Slash commands (in `.claude/commands/`)

```
/route <task>   # autonomous routing through pipeline-router
/review         # full read-only audit pass (no edits)
/ship           # pre-deploy gate; refuses if blockers or missing HANDOFF entry
/handoff        # end-of-session capture + HANDOFF.md verification
```

## Token-control rules

1. Run `pipeline-router` first; let it pick the minimum agent set.
2. Cheap/read-only agents for search, discovery, docs, test interpretation.
3. Reserve `claude-opus-4-7` for `architecture-agent`.
4. Subagents return summaries, not file dumps.
5. Start new sessions after large implementation cycles.
6. One bug, one feature, one validation target per session.

## Hooks (in `.claude/settings.json` + `.claude/hooks/`)

- **PreToolUse: `check-source-integrity.sh`** — blocks `Write|Edit` on source
  registry / curated data files unless `source-integrity-agent` or
  `content-standards-agent` has written `.claude/.source-reviewed-this-session`.
- **PreToolUse: `check-secret-leak.sh`** — blocks `Bash` if a common secret
  pattern is found in any recently modified file.
- **PostToolUse** — reminds to run the verification cadence and
  `handoff-discipline-agent` after any `Write|Edit`.
- **Stop: `maybe-handoff.sh`** — reminds about HANDOFF.md discipline and the
  push-before-shipped rule.

Both hooks fail open with `exit 0` when they have no work to do. If a hook
produces a false positive, tune the regex in the script — do not disable the
hook.

## Project context this Claude session should treat as load-bearing

- This is the EMERGENZ **biosecurity-intel-dashboard** — a public, source-backed
  situational-awareness dashboard. Not STRATA / MHDDS / SENTRY / PRISM /
  MERIDIAN / Triage Field Intelligence / Allied Rescue.
- Not a clinical decision system, not a prediction engine, not a replacement
  for official public-health guidance. Drift toward those framings is a halt.
- Source-of-truth docs: `AGENTS.md`, `CONTENT-STANDARDS.md`,
  `AI-ENRICHMENT-POLICY.md`, `HANDOFF.md`.
- Curated fields (humans-only writes): `confirmed`, `deaths`, `countries`,
  `cdcResponseLevel`, `meta.source`, all entries of `markers.json`,
  `us-monitoring.json`, `ems-briefing.json`, `flights.json`.
- AI enrichment (Gemini + Bright Data) is optional, server-side, fail-open,
  news-only. Never writes structured fields.
- Security headers in `vercel.json` are strict by design — loosening any of
  CSP / HSTS / X-Frame-Options / Permissions-Policy is a security regression
  by default.
- Every meaningful change must land with a `HANDOFF.md` entry **in the same
  commit**, and work is not "shipped" until `git push` succeeds.

## EMERGENZ portfolio anchors (apply here even though they originate elsewhere)

- EMERGENZ is **not CAAS-accredited**. COVID-19 SOPs were written *to CAAS
  standards*. Do not collapse.
- Never name a medical director.
- Never list a partner agency / funder / vendor without a current signed
  MOU/LOI.
- EMERGENZ ≠ Allied Rescue — separate 501(c)(3) entities.
