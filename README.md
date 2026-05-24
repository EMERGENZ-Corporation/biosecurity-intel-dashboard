# biosecurity-intel-dashboard

EMERGENZ Biosecurity Intelligence Dashboard — a static, source-backed
situational-awareness view across multiple biological threat domains
(viral hemorrhagic fevers, respiratory viruses, zoonotic and vector-borne
disease, vaccine-preventable disease, environmental surveillance, AMR,
and One Health signals).

This is not a clinical decision system, not a prediction engine, and not
a replacement for official public health guidance. It is a situational
awareness and triage dashboard built on linked primary sources.

The dashboard is derived from the EMERGENZ hantavirus-intel-dashboard
template and preserves its resilience patterns:

- `npm run validate:data` — schema validation for generalized signals,
  timeline, sources, and status records.
- `npm run test:parsers` — no-op placeholder until source extractors are
  reintroduced.
- `npm run verify:production` — verifies the deployed bundle and
  `/status.json` after each data update.
- `npm run monitor:status` — independent hourly check of the public
  status endpoint.
- `npm run audit:autonomy` — regression audit for scheduled update
  workflows, public status metadata, and review-gated content boundaries.
- `npm run audit:ai-enrichment` — confirms Gemini/Bright Data are not live
  production dependencies and that AI/enrichment disclosures remain current.
- `public/status.json` — machine-readable health contract for the
  dashboard, surfaced on the in-app Status page. It now includes the
  autonomous update contract: scheduled public writers, internal monitors,
  and manual review gates for structured/clinical content.

The hantavirus dashboard remains live as a separate incident vertical.
This project is the broader multi-threat companion.

Content and source decisions are governed by `CONTENT-STANDARDS.md`.
AI/enrichment boundaries are governed by `AI-ENRICHMENT-POLICY.md`; the
current dashboard does not require Gemini, Bright Data, or any equivalent
third-party AI/web-data API key.

Agents and operators should read `AGENTS.md` before starting work. It defines
model-change prompting rules, token-efficiency expectations, and the standard
verification cadence for Codex/Claude sessions.
