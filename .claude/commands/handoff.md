---
description: End-of-session capture. Writes a compact handoff document to .claude/handoffs/ AND confirms HANDOFF.md (the canonical log) has been updated for any shipped change in this session.
---

Two outputs:

1. **Session handoff** — Use `documentation-agent` to write `.claude/handoffs/$(date +%Y-%m-%d-%H%M)-handoff.md`. Include:
   - **Repo**: biosecurity-intel-dashboard.
   - **Task completed this session** — one paragraph.
   - **Files changed** — paths and one-line summary each.
   - **Agents used** — which agents ran, what they flagged.
   - **Open risks / cautions** — what `source-integrity-agent`, `content-standards-agent`, `ai-enrichment-policy-agent`, or `security-posture-agent` left unresolved.
   - **Validation state** — output of last `npm run test:validators && npm run validate:data && npm run build`.
   - **Next steps** — ordered list, with the agent that should run each step.
   - **Halt conditions encountered** — anything that required user escalation.

   Keep it under one page. No marketing language. No emojis.

2. **HANDOFF.md check** — Then run `handoff-discipline-agent` to confirm the canonical `HANDOFF.md` log has an entry for any change shipped this session, and that commits have been pushed. If not, draft the entry and remind the user.

Context (optional): $ARGUMENTS
