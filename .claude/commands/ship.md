---
description: Pre-deploy gate. Runs the full review pass plus deployment readiness checks. Refuses to proceed if any blocker is present, and requires HANDOFF.md updated + commits pushed before declaring SHIP.
---

Run the pre-deploy gate for this branch.

Sequence:

1. `/review` equivalent — full read-only review pass (architecture, source-integrity, content-standards, ai-enrichment-policy, evidence-binding, grant-claims, security-posture).
2. `test-agent` runs the standard verification cadence:
   - `npm run test:validators`
   - `npm run validate:data`
   - `npm run build`
   - and the relevant audits depending on what changed (`audit:ai-enrichment`, `audit:autonomy`, `audit:sources`, `audit:source-drift`).
3. `deployment-agent` checks: build config (vite/vercel), env var separation (preview vs production), GitHub Actions workflow health, security headers / CSP intact in `vercel.json`, SPA rewrites still expose `/status.json` and `/api/v1/*`.
4. `security-posture-agent` final pass: grep for secret patterns in build output and committed files; verify no `VITE_*` wraps a non-public key.
5. `grant-claims-agent` final pass on rendered UI strings if any frontend changed.
6. `handoff-discipline-agent` confirms a HANDOFF.md entry exists for this change set, and reminds that **work is not shipped until `git push` succeeds** (per saved feedback memory).

Produce a single ship/no-ship verdict:

- **SHIP** — no blockers; HANDOFF entry present; recommended `git push` and (optional) `npm run verify:production` after deploy.
- **NO-SHIP** — list of blockers, the agent that flagged each, and the smallest path to clear them.

Target (optional): $ARGUMENTS
