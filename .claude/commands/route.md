---
description: Route a task through the biosecurity-intel-dashboard agent pipeline. Use this instead of asking the main session to do work directly.
---

Use the `pipeline-router` subagent to classify this task and execute the full agent sequence it selects.

Rules:
- The router is always first.
- Follow the router's recommended sequence in order.
- Run `source-integrity-agent` and `content-standards-agent` in parallel for any change touching signals, sources, or curated fields.
- Run `evidence-binding-agent` and `grant-claims-agent` in parallel for any public-facing copy with quantified claims.
- Run `ai-enrichment-policy-agent` and `security-posture-agent` in parallel for any change touching `scripts/enrich-news.mjs` or AI/Bright Data env vars.
- After any code change, `test-agent` must run the standard verification cadence: `npm run test:validators && npm run validate:data && npm run build`.
- After the implementation cycle completes, `documentation-agent` records the change and `handoff-discipline-agent` confirms the HANDOFF.md entry.
- Stop and ask me if any halt condition is triggered (new dependency, new external source, clinical/predictive language, new AI provider, fail-open weakening, attribution removal, secret in client bundle, CSP loosening, Tier 3/4 in structured field).

The task is: $ARGUMENTS
