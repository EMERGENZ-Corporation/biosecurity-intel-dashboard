---
description: Run a full read-only review pass with all relevant audit agents before committing or shipping.
---

Run a multi-agent review pass on the current working state. Do not edit files.

Agents to invoke in parallel where possible:

1. `repo-scanner` — map what changed since the last clean state.
2. `architecture-agent` — review system boundary integrity (schema, pipeline, status.json contract, api/v1 contract).
3. `source-integrity-agent` — verify source registration, tier discipline, attribution preservation for any signal/news/source touch.
4. `content-standards-agent` — check curated fields, scope language, disclaimers, internal-only-vs-public.
5. `ai-enrichment-policy-agent` — verify any enrichment touch stays server-side, fail-open, news-only, structured-field-safe.
6. `grant-claims-agent` — review public-facing strings for overclaiming / scope drift.
7. `evidence-binding-agent` — verify quantified claims have working sources.
8. `security-posture-agent` — check for secrets, env separation, VITE_ exposure, CSP/header drift.

Then synthesize a single review summary:

- Blockers (must fix before merge).
- Cautions (should fix; document if deferred).
- Scope / maturity drift.
- HANDOFF.md status (run `handoff-discipline-agent` last to confirm a pending entry exists for the change).
- Recommended fix sequence (which agents to call next).

Scope (optional): $ARGUMENTS
