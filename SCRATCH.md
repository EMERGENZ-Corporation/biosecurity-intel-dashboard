# Scratch Log

Informal notes, ideas, and session context. Not a source of truth — use HANDOFF.md for shipped changes.

---

## 2026-05-23

### Brightdata / API key setup
- Brightdata account in use for `biosecurity_web_unlocker` zone (Web Unlocker API)
- GitHub + Vercel secrets confirmed:
  - `BRIGHT_DATA_API_KEY` — API token
  - `biosecurity_web_unlocker` — zone name (was misreferenced as `BRIGHT_DATA_ZONE` in workflow, now fixed in f85562e)
  - `GEMINI_API_KEY` — Gemini enrichment
- IP restriction on Brightdata key is not viable — GitHub Actions uses dynamic IPs
- Blast radius already controlled by `MAX_BRIGHT_DATA_CONTEXT_ITEMS=5`

### Security notes
- Rotate `BRIGHT_DATA_API_KEY` periodically; update both GitHub secrets and Vercel env vars
- Set a monthly spend cap in the Brightdata dashboard as a safeguard

---

<!-- Add new entries at the top, below this line -->

## 2026-05-26

### Codex subagent usage note
- Codex multi-agent roles are available in this repo/session (`pipeline-router`, `ui-wireframe-agent`, `deployment-agent`, `test-agent`, etc.).
- Future non-trivial work should use the exposed Codex subagents where practical instead of only following their discipline manually.
- Do not change `.claude/agents/*` when tuning Codex behavior. Preserve Claude Code compatibility.
- If Codex agent placeholders become a runtime blocker, make a narrow `.codex/agents/*.toml`-only model mapping patch and keep `.codex/config.toml` on `[orchestration]`, not `[agents]`.
