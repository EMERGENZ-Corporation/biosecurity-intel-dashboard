# Dashboard Restoration Handoff Log

**Last updated:** 2026-05-24 (AI and enrichment disclosure audit)
**Purpose:** Multi-session restoration of the biosecurity-intel-dashboard to the depth of the original hantavirus-intel-dashboard. If you are a new agent picking this up, start here.

> **Rule for any agent (including future-me):** Every change must be logged here in the same commit that ships the change. No exceptions — even one-line label renames. The user has explicitly asked that this file stay continuously current. If you forget, fix it in a follow-up commit immediately.

---

## How to maintain this file (read before editing the repo)

If you are an agent picking up work on this repo, follow these instructions every session.

Start with `AGENTS.md` for model-selection prompting, token-efficiency rules,
and baseline verification expectations; then return here for the chronological
project state and handoff logging rules.

### When you must update HANDOFF.md

**Before staging a commit, check whether HANDOFF.md needs an entry.** If your change:

- Adds, removes, or renames any file in `src/`, `scripts/`, `.github/workflows/`, or `public/`
- Modifies any data file (`signals.json`, `signal-sources.json`, `signal-timeline.json`, `news.json`)
- Changes any user-visible string (labels, copy, button text)
- Touches build configuration (`package.json`, `vite.config.ts`, `tsconfig.json`)
- Adds or modifies a TypeScript type, interface, or exported constant
- Updates a workflow URL, env var, schedule, or step
- Adds or removes a dependency

…then it requires a HANDOFF entry. Trivial whitespace/formatting cleanups do not.

### Where the entry goes

The file is organized as a reverse-chronological log. Add a new `## ✅ <Title> (commit <SHA-prefix>)` section immediately under the most recent shipped item. Move older items down — never delete them. Keep the **Outstanding work (backlog)** section as the tail.

### Entry structure

```markdown
## ✅ <Short title of what shipped> (commit <7-char-sha>)

<1–3 sentences describing what changed and why. Include the user's
original ask if applicable so future agents see the intent, not just
the implementation.>

**Files touched:**
- `src/path/to/file.tsx` — what changed
- `scripts/something.mjs` — what it does

<For larger shipments, add a bullet list of specifics — e.g. signal
names affected, marker counts, etc.>

**Verify:** <one-line description of how to confirm the change is live
in the browser or in test output, with an explicit path like `/map` or
a command like `npm run validate:data`>
```

### When you complete a backlog item

1. Move it from "Outstanding work (backlog)" into a new "✅ Shipped" section above (don't delete from the backlog — strike it through or rewrite as a completed item).
2. Cross-reference the commit SHA so future agents can find the diff.

### When you discover new outstanding work

Add it to the **Outstanding work (backlog)** section with:
- Why it matters (1 sentence)
- What's blocking it from being done now (if anything)
- Rough scope (small / medium / large)

### Update the timestamp

Edit the `**Last updated:**` line at the top of the file to reflect the most recent change. Format: `2026-MM-DD (short summary)`.

### Commit message convention for HANDOFF updates

When you ship a change, the commit message body should include a HANDOFF mention. Examples:

- `docs(handoff): log <feature> ship` — when HANDOFF is the only file changed (backfill)
- For combined commits, mention "HANDOFF.md updated" in the body, after the description of the code change

### What "current" means

The file should always represent the **state of main**, not work-in-progress. If you stage but don't commit, don't update HANDOFF yet. If you commit but don't push, update HANDOFF in the pending commit. The user reads this file to know what's actually deployed.

### Backfill discipline

If you discover an old commit that wasn't logged, backfill it as a separate `docs(handoff)` commit. Don't bundle backfills with new feature work.

### Stale check

At the start of every session, scan recent `git log` and compare against HANDOFF entries. If commits exist that aren't logged, backfill before starting new work.

```bash
git log --oneline -20  # check recent commits
# If any commits aren't reflected in HANDOFF.md, backfill before proceeding
```

---

---

## Background

The repository was migrated from a single-threat hantavirus dashboard to a multi-threat biosecurity scaffold in commits `f39f8a4`, `cfd08bb`, `90bd172`, and `f4ebe5c` (Mar–May 2026). The migration **stripped substantial depth** — news feed, deep clinical pages, source-attributed content blocks, US monitoring tables, EMS briefing cards, flight tracing, dark-mode map with typed markers, and a comprehensive About/Legal page.

The user wants the depth restored, **adapted for the broader multi-threat scope** (16 signals across 10 categories, not just hantavirus). All restoration work must adhere to [CONTENT-STANDARDS.md](CONTENT-STANDARDS.md).

### Deleted-content recovery points
The original hantavirus components and pages can be retrieved from git history:
- **`f4ebe5c^`** — last commit with old `scripts/update-data.mjs`, `src/components/*.tsx` (GlobalMap, USMonitoringTable, EMSBriefingCard, FlightTracingPanel, Timeline, SourceChip, ShareModal, MapLayerToggle, ContentBlock), and `src/data/*.json` (news, markers, ems-briefing, us-monitoring, flights, meta, timeline, protocols, sources, manual-overrides)
- **`90bd172^`** — last commit with old `src/pages/*.tsx` (About, Clinical, Dashboard, Genomics, News, PPE, Protocols, Sources)

To inspect: `git show <ref>:<path>` — example: `git show f4ebe5c^:src/data/news.json`

---

## Restoration plan (in order)

1. ✅ **News feed** — page + pipeline + workflow
2. ✅ **About & Legal page** — multi-threat adaptation
3. ✅ **Map** — dark CARTO + typed markers + seed data
4. ✅ **SignalDetail / ContentBlock** — per-block source attribution
5. ✅ **Overview page** — restored briefing/news/monitoring rails
6. ✅ **Sweep remaining tabs** — Timeline, Briefings, Sources, Resources, SignalCard

**All six restoration items shipped.** Future work is now polish, content deepening, or new features — see "Outstanding work" below for backlog ideas.

---

## ✅ Completed

## ✅ AI and enrichment disclosure audit (commit TBD)

User asked to proceed on the Gemini/Bright Data review and AI-use disclosure question. Confirmed the live pipeline does not use Gemini, Bright Data, or any equivalent AI/web-data API key; added a formal AI/enrichment policy and a CI audit so future provider-key or live integration changes must update disclosure and review gates intentionally.

**Files touched:**
- `AI-ENRICHMENT-POLICY.md` — new policy documenting current non-use, the Bright Data decision, Gemini boundaries, prohibited uses, and required steps before any future integration.
- `scripts/audit-ai-enrichment.mjs` — new audit that checks public disclosure, status review gates, and live code/workflows for Gemini/Bright Data key references or browser-exposed provider keys.
- `package.json` — adds `npm run audit:ai-enrichment`.
- `.github/workflows/ci.yml` — runs the AI/enrichment audit on push and pull request.
- `scripts/audit-autonomy.mjs` — expects the AI/enrichment audit to remain part of the autonomy contract.
- `scripts/generate-status.mjs` — clarifies that Gemini/Bright Data are not live today and adds the disclosure audit to the status monitor list.
- `src/pages/AboutPage.tsx` and `src/pages/MethodologyPage.tsx` — strengthen public disclosure that no Gemini/Bright Data dependency, key, workflow, or public writer is active, and that future usage is review-only / not source-of-record.
- `public/status.json` and `public/api/v1/` — regenerated after the status contract update.
- `README.md` and `.gitignore` — document the new audit and ignore its local result artifact.
- `HANDOFF.md` — logs the disclosure hardening task.

**Verify:** `npm run audit:ai-enrichment`, `npm run audit:autonomy`, `npm run test:validators`, `npm run validate:data`, and `npm run build` pass. Visit `/about`, `/methodology`, and `/status`; Gemini and Bright Data should be disclosed as not live production dependencies and future use should be framed as review-gated enrichment only.

---

## ✅ Autonomous update contract audit (commit 914c1c5)

User asked to proceed with making the dashboard autonomous while preserving content and attribution standards. Added a first-class autonomy contract to `public/status.json`, surfaced it on `/status`, and added a CI regression audit so scheduled public writers, monitoring workflows, generated endpoints, and manual-review boundaries cannot be removed silently.

**Files touched:**
- `scripts/audit-autonomy.mjs` — new non-network regression audit for package scripts, scheduled workflow wiring, public status/API endpoints, and content-standard boundaries.
- `package.json` — adds `npm run audit:autonomy`.
- `.github/workflows/ci.yml` — runs the autonomy audit on push and pull request before data validation/build.
- `scripts/generate-status.mjs` — adds `automation` metadata covering scheduled writers, monitors, and review gates.
- `scripts/validate-data.mjs` — requires the `status.automation` contract in `public/status.json`.
- `src/pages/Status.tsx` — displays the autonomous update loop summary from the status contract.
- `public/status.json` and `public/api/v1/` — regenerated after the status contract update.
- `README.md` and `.gitignore` — document the audit command and ignore its local result artifact.
- `HANDOFF.md` — logs the autonomy hardening task.

**Verify:** `npm run audit:autonomy`, `npm run test:validators`, `npm run validate:data`, and `npm run build` pass. Visit `/status`; the page should show an "Autonomous update loop" card with scheduled writers, review gates, monitors, and the news/status refresh cadences.

---

## ✅ Official source audit report-only workflow fix (commit 72d8125)

User reported the Official Source Audit workflow was still failing and generating GitHub failure notifications. Root cause: source review findings were intentionally converted into failed workflow steps, so expected URL blocks/timeouts/drift alerts caused "All jobs have failed" emails instead of quiet internal issue updates.

**Files touched:**
- `scripts/audit-official-sources.mjs` — adds `OFFICIAL_SOURCE_AUDIT_STRICT`; when set to `0`, source review findings still write JSON and console output but do not return a nonzero exit code.
- `scripts/audit-source-drift.mjs` — adds `OFFICIAL_SOURCE_DRIFT_STRICT` with the same report-only behavior for drift findings.
- `.github/workflows/official-source-audit.yml` — runs both audits with strict mode disabled and removes the final failure gates, preserving reusable `source-audit` / `source-drift` issue updates without failing the scheduled workflow.
- `HANDOFF.md` — logs the permanent notification fix.

**Verify:** `OFFICIAL_SOURCE_AUDIT_STRICT=0 npm run audit:sources` and `OFFICIAL_SOURCE_DRIFT_STRICT=0 npm run audit:source-drift` both exit 0 while still reporting current review items. `npm run test:validators`, `npm run validate:data`, and `npm run build` pass.

---

## ✅ Official source drift detector (commit 13f335f)

User said to proceed to the next autonomy task after the official source freshness audit. Added a second non-mutating autonomy layer that fingerprints Tier 1/2 source pages, compares them with the previous private GitHub Actions cache baseline, and opens or updates one internal `source-drift` issue when official pages change or cannot be fingerprinted.

**Files touched:**
- `scripts/audit-source-drift.mjs` — new source drift script that normalizes fetched source pages, records content hash / ETag / Last-Modified / page title fingerprints, compares against the previous cached baseline, writes an internal JSON result, and supports network-skip mode for local validation.
- `package.json` — adds `npm run audit:source-drift`.
- `.github/workflows/official-source-audit.yml` — extends the official source audit workflow with fingerprint cache restore/save, source drift auditing, reusable `source-drift` issue reconciliation, and a failure step when changed or unreadable official pages need review.
- `.gitignore` — ignores source drift runtime JSON and private fingerprint cache output.
- `HANDOFF.md` — logs the source drift autonomy step and verification.

**Verify:** `OFFICIAL_SOURCE_DRIFT_SKIP_NETWORK=1 npm run audit:source-drift`, `OFFICIAL_SOURCE_AUDIT_SKIP_NETWORK=1 npm run audit:sources`, `npm run test:validators`, `npm run validate:data`, and `npm run build` pass. A full local networked drift run flagged review items rather than writing data: NETEC/Paho fingerprint changes plus `africa-cdc-outbreaks` timeout and `cdc-han` HTTP 403.

---

## ✅ Official source freshness audit workflow (commit 2558add)

User approved the next autonomy task: add an internal Tier 1/2 source freshness audit before attempting higher-risk automated source extractors. Added a non-mutating audit command that checks official source registry records for stale `lastVerified` dates and URL reachability, writes an internal JSON result, and added a daily GitHub Actions workflow that opens or updates one reusable `source-audit` issue when official sources need review.

**Files touched:**
- `scripts/audit-official-sources.mjs` — new Tier 1/2 source audit script with `lastVerified` age checks, HTTP(S) reachability checks, timeout handling, JSON result output, and a network-skip mode for local validation.
- `package.json` — adds `npm run audit:sources`.
- `.github/workflows/official-source-audit.yml` — new daily/manual/push workflow that runs the audit and reconciles one internal GitHub issue without exposing diagnostics on the public dashboard.
- `.gitignore` — ignores the local `official-source-audit-result.json` runtime artifact.
- `HANDOFF.md` — logs the autonomy hardening task and verification.

**Verify:** `OFFICIAL_SOURCE_AUDIT_SKIP_NETWORK=1 npm run audit:sources`, `npm run test:validators`, `npm run validate:data`, and `npm run build` pass. A full local networked audit currently flags two review items (`africa-cdc-outbreaks` timeout and `cdc-han` HTTP 403), which the new workflow is designed to surface internally via GitHub issue.

---

## ✅ Automation and AI disclosure + full Intelligence naming (commit b2fef42)

User asked whether the dashboard needs Bright Data, what Gemini is currently doing, whether AI-use disclosure should be enhanced, whether the dashboard should be titled Biosecurity or Biosurveillance Intelligence, and then explicitly said to proceed after the model-change recommendation for legal/data-integrity-sensitive work. Kept the scope as Biosecurity, expanded public-facing "Intel" product-name text to "Biosecurity Intelligence Dashboard," and added clear About/Methodology disclosure that current autonomy covers news/status/API/monitoring while Gemini and Bright Data are not used by the live pipeline.

**Files touched:**
- `src/pages/AboutPage.tsx` — adds "Automation & AI Use Disclosure" covering current automation, Gemini non-use, Bright Data non-use, future AI guardrails, and source-attribution boundaries; updates citation examples to the full dashboard title.
- `src/pages/MethodologyPage.tsx` — adds "Automation boundaries" and "AI and enrichment tools" sections for analyst-facing transparency.
- `index.html`, `src/components/AcknowledgmentModal.tsx`, `src/components/NavBar.tsx`, `src/pages/Overview.tsx`, `scripts/generate-api.mjs` — updates public-facing product-name/title text from "Biosecurity Intel Dashboard" to "Biosecurity Intelligence Dashboard" while keeping the repo/domain identifiers unchanged.
- `public/api/v1/` — regenerated static API/RSS outputs so the feed title and generation timestamps match the updated generator.

**Verify:** Visit `/about` and `/methodology`; About should show "Automation & AI Use Disclosure" with Gemini and Bright Data non-use language, Methodology should show "Automation boundaries" and "AI and enrichment tools," and the browser title / overview heading / RSS feed title should use "Biosecurity Intelligence Dashboard." `npm run test:validators`, `npm run validate:data`, and `npm run build` pass.

---

## ✅ Support button and relationship network clipping fix (commit 73ed36e)

User asked for a Donate/support button linked to the Zeffy donation form, a visual fix for clipping in the signal relationship network graphic, and a Medical Intelligence Unit brand line under the EMERGENZ wordmark. Added the support link in both desktop and compact navigation, expanded the network SVG drawing area so the outer severity ring and labels no longer clip, and moved the compact nav breakpoint earlier to avoid header overflow.

**Files touched:**
- `src/components/NavBar.tsx` — adds the Zeffy support link, renders "Medical Intelligence Unit" under the Singapore Sling wordmark, and switches to compact navigation below 1360px to prevent header overflow.
- `src/pages/NetworkPage.tsx` — expands the SVG viewBox, adjusts outer ring radius, and allows contained horizontal scroll on narrow graph layouts.

**Verify:** Visit `/network`; graph nodes and labels should remain inside the SVG bounds with no page-level horizontal overflow. The header should show "Medical Intelligence Unit" under EMERGENZ and the Support link should target the Zeffy donation form.

---

## ✅ Agent model-selection and token-efficiency guide (commit 864d6e4)

User asked whether the repo already tells Codex/Claude which model to use for token-efficient work and when agents should prompt the user to switch models. Added a root `AGENTS.md` that clarifies agents cannot reliably switch their own model from repo instructions, but must prompt the user before high-risk work when a stronger reasoning model is appropriate.

**Files touched:**
- `AGENTS.md` — new agent/operator guide covering startup order, model-change prompting, high-risk task categories, token-efficiency expectations, verification commands, and handoff discipline.
- `README.md` — points agents/operators to `AGENTS.md`.
- `HANDOFF.md` — adds the startup pointer and logs this documentation change.

**Verify:** Read `AGENTS.md`; it should direct routine tasks to proceed without interruption and high-risk clinical/legal/security/CI/data-integrity work to prompt the user for a stronger model when needed.

---

## ✅ Status monitor threshold aligned with daily refresh cadence (commit dafa3ef)

User reported same-day failures from the Production Status Monitor workflow. Root cause: the monitor ran hourly but failed when deployed `status.json` was older than 8 hours, while the Status Refresh workflow only regenerates `status.json` once daily; this created predictable false-positive failures for much of each day.

**Files touched:**
- `.github/workflows/status-monitor.yml` — raises `MAX_STATUS_GENERATED_AGE_HOURS` from 8 to 30 so the hourly monitor catches missed daily refresh/deploy cycles instead of normal daily cadence.
- `scripts/check-status.mjs` — changes the default generated-age threshold to 30 hours and exits via `process.exitCode` instead of immediate `process.exit(1)`, avoiding the local Windows Node assertion seen during reproduction.
- `HANDOFF.md` — logs the production-monitor fix.

**Verify:** `STATUS_URL=https://biosecurity-intel.emergenzsystems.org/status.json MAX_STATUS_GENERATED_AGE_HOURS=30 npm run monitor:status` passes against the currently deployed status endpoint. `npm run validate:data` and `npm run build` pass.

---

## ✅ CI workflow for branch protection (commit f4d8b4d)

User asked how to deal with the remaining GitHub branch-protection item after noting GitHub is installed locally and connected. Added a minimal PR/push CI workflow so `main` protection can require a real check before merge rather than relying only on scheduled data-refresh workflows.

**Files touched:**
- `.github/workflows/ci.yml` — new `CI / validate-build` job on `pull_request` and `push` to `main`; runs `npm ci`, `npm run test:validators`, `npm run validate:data`, and `npm run build`.
- `HANDOFF.md` — logs the branch-protection prerequisite.

**Next GitHub-side step:** Enable branch protection on `main` requiring pull requests and the `validate-build` check after this workflow has run once on GitHub.

**Verify:** `npm run test:validators`, `npm run validate:data`, and `npm run build` already pass locally; GitHub should show the `CI / validate-build` check after push.

---

## ✅ Triage-card dose de-risking — remove exact medication regimens (commit 99cee91)

User asked how to proceed on Claude's remaining drug-dose content risk. The adopted policy is: printable/operator-facing triage cards should preserve treatment direction and escalation logic, but must not contain exact medication doses or dosing schedules; clinicians must verify current dosing through linked source guidance, facility protocol, and public-health consultation.

**Files touched:**
- `src/data/signals.json` — removes exact vitamin A, oseltamivir, and ribavirin regimens from printable triage-card fields; replaces them with source/protocol verification language.
- `scripts/seed-triage-cards.mjs` — updates the triage-card seeder so future reseeding does not restore exact dose strings.
- `scripts/validate-data.mjs` — adds a triage-card dose-pattern guard that rejects exact drug doses or dose schedules in printable cards.
- `scripts/test-validate-data.mjs` — adds a regression case proving the validator fails a triage card containing `75 mg BID`.
- `public/api/v1/signals.json` — regenerated public API signal envelope after the signal data update.
- `HANDOFF.md` — logs the clinical-content policy decision.

**Scope note:** Source-attributed deep clinical/detail sections may still describe medication dosing as reference context. The hard prohibition applies to printable triage cards because those are the highest-risk operator-facing artifacts.

**Verify:** `npm run test:validators`, `npm run validate:data`, and `npm run build` all pass. The validator now fails if a printable triage card contains dose patterns such as `75 mg BID`.

---

## ✅ Follow-up hardening — CSP headers, news snippets, validator tests (commit a324dbc)

User shared the remaining four-pass review findings from Claude and asked for the flagged risks to be considered. This commit ships the low-regret follow-ups that did not require a policy/legal tradeoff: security headers for Vercel, fair-use news snippet truncation, and regression tests for the expanded data validator.

**Files touched:**
- `vercel.json` — adds site-wide CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, and frame-denial headers while allowing Google Fonts and CARTO map tiles.
- `scripts/update-news.mjs` — normalizes RSS descriptions to <=280-character snippets for newly fetched and retained existing items.
- `src/data/news.json` — truncates the checked-in news corpus to the same snippet limit.
- `public/api/v1/news.json` — regenerates the public API news envelope from the truncated corpus.
- `scripts/validate-data.mjs` — allows test runs to point the validator at temporary data/public directories.
- `scripts/test-validate-data.mjs` — new regression harness for valid baseline data, related-signal referential integrity, hypothesis disposition enums, stale triage cards, and risk-assessment URL validation.
- `package.json` — adds `npm run test:validators`.
- `HANDOFF.md` — logs this follow-up hardening bundle.

**Deferred:** Specific triage-card drug dosing still needs a clinical/legal product decision. Tier 1 feed gating remains intentionally strict until the data-integrity vs availability tradeoff is decided. Branch protection, uptime monitoring, a formal WCAG/Lighthouse pass, `RUNBOOK.md`, and the generated `public/api/v1/*` commit policy remain external or follow-up items.

**Verify:** `npm run test:validators`, `npm run validate:data`, and `npm run build` all pass. Direct invariant check shows max `description` length is 278 in both `src/data/news.json` and `public/api/v1/news.json`.

---

## ✅ Review-driven hardening — validator + atomicity + ADA fonts + attribution caveat (commit 396f39b)

User requested a four-pass review (logic gap analysis, adversarial compliance review,
systems-engineering stability review, and attribution/citation guidance for About page).
This commit lands the highest-leverage cross-cutting fixes the three review agents
agreed on. The full agent findings are summarized in the user-facing message; what
shipped here:

### Logic-gap fixes (P0)
- **Validator coverage of new fields** (`scripts/validate-data.mjs`) — referential
  integrity for `relatedSignals[].signalId` (a typo previously caused silent drop
  from the /network graph + RelatedSignalsBlock); enum validation for
  `SignalRelationshipType` and `HypothesisDisposition`; `triageCard.lastReviewed`
  ISO check + 365-day staleness rejection; required-field assertions for
  `triageCard`, `alternativeHypotheses`, `riskAssessments`; self-referential signal
  check.
- **Atomic write in news pipeline** (`scripts/update-news.mjs`) — `atomicWriteFileSync`
  helper using `writeFileSync(tmp) → renameSync(tmp, dest)`. Previously a SIGKILL
  mid-write left a half-truncated `news.json`; the next run's `JSON.parse` would
  silently fall back to `[]` and nuke 30 days of curated entries. Now corrupt
  reads fail loud (`process.exit(1)`) rather than silent reset; atomic write
  prevents corruption in the first place.
- **Visible staleness** — `SignalDetail` "Last checked" Field now renders a
  `Stale >7d` chip when `isSignalStale(signal, 168)` returns true. Previously the
  status generator computed `staleSignalIds` but no UI surfaced it; users would
  see a 14-day-old data point with no warning.

### Compliance fixes (severe)
- **ADA / WCAG 2.1 AA font sizes** — Legal disclaimer text on triage cards raised
  from 0.5rem / 0.5625rem (8–9px, sub-WCAG) to 0.875rem (14px). The compliance
  review flagged this as a plaintiff's gift: "EMERGENZ buried its liability
  disclaimer in unreadable font."
- **Triage card staleness banner** (`src/pages/TriageCardPrint.tsx`) — Amber
  alert at top of card when `lastReviewed > 180 days`, with explicit "do not rely
  for clinical decisions" and link to live source. Logic-gap review #7 + compliance
  review #2 agreed this was a tort surface.
- **Hypothesis attribution caveat** (`src/components/CompetingHypothesesBlock.tsx`) —
  Added explicit disclaimer that proponent attributions are EMERGENZ editorial
  summaries, not direct quotations. Addresses defamation-by-summary risk from
  compliance review #3 (MSF, ECDC, named academic researchers attributed without
  always-linked source).
- **Disclaimer/source-footer text size** on triage card raised from 0.5625rem to
  0.75rem (≥12px WCAG minimum).

### Files touched
- `scripts/validate-data.mjs` — +~80 lines of new field validation
- `scripts/update-news.mjs` — atomic write helper + corruption-aware read
- `src/pages/SignalDetail.tsx` — `isSignalStale` import + stale chip on Last checked
- `src/pages/TriageCardPrint.tsx` — staleness banner + raised font sizes + stronger
  disclaimer language
- `src/components/CompetingHypothesesBlock.tsx` — attribution caveat paragraph;
  body text raised from 0.75rem to 0.8125rem

### Deferred (filed for user prioritization)
Cross-cutting findings that need user decision before implementation:

- **Drug doses on triage cards** — compliance EXISTENTIAL #2 recommends replacing
  specific mg/kg dosing with "see source for current dosing" to collapse the largest
  medical-tort surface. Requires re-seeding the 5 existing cards. Decision: keep
  current dosing (source-attributed paraphrase, currently legally defensible per
  FDA learned-intermediary doctrine) vs. follow the more-cautious recommendation.
- **WHO/WastewaterSCAN NC-license vs SaaS** — compliance EXISTENTIAL #1 — must get
  written commercial waivers from WHO Press + Stanford/Emory before any paid tier.
  Human action, not code.
- **News-description truncation** to 280 chars — compliance SEVERE #4. Would
  require migrating the existing 500-item news.json corpus.
- **Tier 1 RSS gate** from "any failed" to "majority failed" — systems review P1.
  Architectural change; could reduce data-integrity bar.
- **Branch protection on main** — systems review P0. Repo settings, not code.
- **CSP/security headers** — systems review P2. Vercel.json change.
- **Tests for validators** — systems review P3.
- **USPTO trademark search for EMERGENZ** — compliance SEVERE #6. Human action.

**Verify:** `npm run validate:data` → OK with new coverage. `npm run build` → clean.
Triage card pages render the new staleness banner when applicable. Stale signals
show "Stale >7d" chip on detail pages. Hypothesis block shows the new attribution
caveat. Legal disclaimer text is now ≥14px on triage cards.

---

## ✅ About page — attribution/citation guidance + WastewaterSCAN notice (commit 9b53e48)

User asked for "attribution/citation guidance for the dashboard in the about section"
as part of a broader four-pass review. Added two new cards to `src/pages/AboutPage.tsx`:

**1. Attribution & Citation Guidance card** — six-section operator-facing guidance:
- Cite the underlying authority first (the dashboard exists to surface, not replace, sources)
- How to cite the dashboard itself (APA + inline + machine-readable JSON formats)
- License-aware re-use — explicit per-source table (US Gov 17 USC §105, WHO CC BY-NC-SA
  3.0 IGO, WastewaterSCAN CC BY-NC 4.0, Africa CDC / ECDC / PAHO mixed, Tier 3 news fair-use)
- Triage cards — re-distribution rules, lastReviewed preservation, derivation marking
- Competing hypotheses — these are EMERGENZ summaries, cite the named proponent's own
  document, not the dashboard's framing
- Reporting attribution errors — GitHub issue link, P0 same-day correction policy

**2. WastewaterSCAN Attribution Notice card** — previously missing despite the data
being used in 5 wastewater signal cards. CC BY-NC 4.0 attribution; explicit commercial
deployment caveat with contact email for separate licensing.

**Files touched:**
- `src/pages/AboutPage.tsx` — two new Cards inserted before WHO Content Attribution Notice

**Verify:** `/about` shows the two new cards in the correct position. Both attribution
licenses (WHO + WastewaterSCAN + per-source table) are explicit and link to the upstream
license text. `npm run build` → clean.

---

## ✅ Progressive disclosure on signal detail (commit 1aca4ac)

Closes UX-GAP-ANALYSIS §3 #12. Three sections on signal detail now collapse by default,
addressing the 60-viewport-scroll problem (§0): Timeline, Sources & provenance, and
Data quality & confidence are appendix material, not operational data. Users opening
a signal now land on the operational rails (Summary, Current situation, Why it matters,
Watch indicators, Competing hypotheses, Geography, Metrics, detailSections) without
scrolling past the appendix.

The `Section` component (inline in `SignalDetail.tsx`) was extended with optional
`collapsible`, `defaultOpen`, and `badge` props. When `collapsible` is true, the
header renders as a `<button aria-expanded>` with a chevron and Show/Hide hint;
the badge displays an inline count (e.g. "5 events", "7 sources") so users know
what's hidden without opening it.

Always-expanded sections (no change):
- Summary, Current situation, Why it matters
- Watch indicators, Competing hypotheses
- Geography (with map), Metrics
- detailSections (the 5 ContentBlocks per signal)
- Related signals
- Authority risk badges, HCW alert, TL;DR, Action strip (above the fold)

Collapsed by default:
- **Timeline** (badge: event count)
- **Sources & provenance** (badge: source count)
- **Data quality & confidence**

TOC navigation still works: clicking a TOC entry scrolls the user to the section header,
which is always visible. Users click the header to expand. This is intentional — the
TOC entries for collapsible sections function as "jump and decide" markers.

**Files touched:**
- `src/pages/SignalDetail.tsx` — `Section` component extended; three sections marked
  `collapsible` with badges where appropriate; `useState` import added.

**Verify:** Open any signal detail page → Timeline, Sources, and Data quality sections
appear as collapsed headers with chevrons and badges. Click any header → section expands,
chevron rotates 90°. `npm run build` → clean (SignalDetail bundle ~33 kB, +1.8 kB).

---

## ✅ Triage card system — printable case-definition cards (commit dfdab99)

Closes UX-GAP-ANALYSIS §3 #15 — printable case-definition / triage card. For ED triage
nurses, EMS captains, and EOC briefers, this provides a single-page clinical operations
one-pager that can be printed and posted on a wall or saved as PDF for pre-shift briefing.

Per CONTENT-STANDARDS §7.1, all clinical content is sourced to a specific authoritative
CDC clinical guidance document, manually authored, and timestamped with `lastReviewed`.
Signals without verified clinical content omit the `triageCard` field — no fabrication.

**New type `TriageCard` with fields:**
- `whenToSuspect[]` — clinical signs (label + detail)
- `exposureCriteria[]` — epidemiologic criteria
- `isolation` — isolation precaution category
- `ppe` — required PPE
- `initialActions[]` — first 30 minutes ordered actions
- `notify[]` — notification chain (party, contact, timing)
- `treatmentSummary` — brief treatment narrative
- `sourceAuthority`, `sourceTitle`, `sourceUrl`, `lastReviewed`

**New `/signals/:id/triage` route** — `TriageCardPrint.tsx`:
- Single-page layout optimized for US Letter / A4 printing
- Screen-only controls (back link, Print button) hidden via `.triage-screen-controls`
- `?print=1` query param auto-fires browser print dialog on mount
- Friendly fallback when triageCard is undefined ("not yet authored", links back to signal)
- Disclaimer: "For operational reference only. Always verify against your facility's
  current clinical protocols."

**SignalActionStrip** — conditional "🩺 Triage card ↗" button (only when triageCard is set;
opens in new tab with `?print=1` so the print dialog fires automatically).

**Print stylesheet (`src/index.css`)** — added:
- `.print-card` light-mode forcing (black-on-white)
- `.triage-screen-controls` hidden during print
- `.triage-section-header` print-friendly styling
- `.disclaimer-banner` hidden during print
- `@page { margin: 0.5in }` for proper margin geometry

**Seeded 5 signals** with verified CDC clinical case definitions (all URLs verified as
specific guidance pages, not homepages):
- `measles-us-2026` — CDC Measles Clinical Overview (cdc.gov/measles/hcp/clinical-overview/)
- `avian-influenza-h5-2026` — CDC H5N1 Clinical Care (cdc.gov/bird-flu/hcp/clinical-care/)
- `ebola-bundibugyo-drc-2026` — CDC Ebola for Clinicians (cdc.gov/vhf/ebola/clinicians/)
- `mpox-africa-clade-i-2026` — CDC Mpox Clinical Recognition
  (cdc.gov/poxvirus/mpox/clinicians/clinical-recognition.html)
- `lassa-fever-2026` — CDC Lassa Fever for Healthcare Workers (cdc.gov/vhf/lassa/healthcare-workers/)

Each card includes specific clinical signs, isolation type, PPE level, 6 ordered first-30-min
actions, and a 3-tier notification chain (state DOH → CDC EOC → hospital IP).

**Files touched:**
- `src/types.ts` — `TriageCard`, `TriageCardCriterion` types; `triageCard?` on `Signal`
- `src/pages/TriageCardPrint.tsx` — new printable route page
- `src/components/SignalActionStrip.tsx` — conditional triage card button
- `src/App.tsx` — `/signals/:id/triage` route added
- `src/index.css` — print stylesheet extended for card rendering
- `scripts/seed-triage-cards.mjs` — new seeder (idempotent)
- `src/data/signals.json` — 5 signals patched with triageCard
- `public/status.json`, `public/api/v1/` — regenerated

**Verify:** Open the Lassa fever signal → action strip shows "🩺 Triage card ↗" button.
Click it → opens `/signals/lassa-fever-2026/triage?print=1` in new tab → print dialog auto-fires.
Print view fits one page; black-on-white; nav and disclaimer banner hidden.
Open a signal without a triage card (e.g. covid-wastewater) → no triage button shown.
`npm run validate:data` → OK; `npm run build` → clean.

---

## ✅ Fix workflow push-race rebase conflicts (commit e011871)

Both "Status Refresh / Commit refreshed status.json" (step 9) and
"Update News Feed / Commit updated news.json" (step 8) have been failing
intermittently when both workflows are triggered by the same push (any commit
that touches `src/data/signals.json` triggers both). The concurrency group
serializes execution, but the second workflow's commit can still conflict with
manual commits or the first workflow's generated-file changes during rebase.

Root causes identified:
1. **Status Refresh had NO retry loop** — a single `git push` with no error handling.
   If the push was rejected or the rebase conflicted, the step failed immediately.
2. **Update News Feed's retry loop used `|| { exit 1 }`** on `git pull --rebase`,
   which aborts on ANY conflict — including conflicts in generated files that could
   be auto-resolved by taking the remote version and regenerating.

Both fixes use `git pull --rebase -X theirs origin main`:
- `-X theirs` resolves rebase conflicts on generated artifact files (`public/api/v1/`,
  `public/status.json`) by accepting the incoming remote version
- Immediately after rebase, `generate-api.mjs` is re-run so the final committed
  state correctly blends both workflows' source-level changes
- Status Refresh now has the same 5-attempt push-retry loop as Update News Feed

Failure pattern that triggered this: any push touching `src/data/signals.json`
(signals refresh, Tier 5 intel commit) would simultaneously trigger both workflows.
Even with the concurrency group serializing them, the second workflow's rebase
onto the first workflow's generated-file commit would fail without `-X theirs`.

**Files touched:**
- `.github/workflows/update-data.yml` — Status Refresh commit step: added
  5-attempt push-retry loop + `-X theirs` rebase + API regeneration after rebase
- `.github/workflows/update-news.yml` — Update News Feed retry loop: `git pull
  --rebase` → `git pull --rebase -X theirs` + `git rebase --abort` cleanup on failure

**Verify:** Next push touching `src/data/signals.json` should trigger both workflows;
both should complete with "Push succeeded on attempt 1" (or a clean retry if one
queues behind the other). No more "Rebase conflict" or single-push failures.

---

## ✅ Tier 5 — competing hypotheses (ICD-203) + cross-signal relationship network (commit 23d56f8)

Implements UX-GAP-ANALYSIS §3 items 22 and 24 — the two remaining Tier 5 backlog items.

### §3 #24 — Competing hypothesis surface

New `alternativeHypotheses[]` field on `Signal` (type: `AlternativeHypothesis`, per
`types.ts`). Each entry has: `hypothesis`, `proponent`, `evidence`, `disposition`
(`active | under-investigation | discounted`), optional `url` and `sourceId`.

New `CompetingHypothesesBlock` component renders the hypotheses list with an amber
ICD-203 header badge, disposition chips (color-coded by status), and a framing note
that warns against single-hypothesis thinking. Wired into `SignalDetail.tsx` after
the Watch Indicators section and added to the TOC.

Seeded on 4 signals with documented authority or analytical disagreements:
- `avian-influenza-h5-2026`: 3 hypotheses — CDC LOW assessment, academic dairy-reservoir
  concern, optimistic trend read
- `measles-us-2026`: 3 hypotheses — structural coverage decline (CDC), importation-driven
  ignition, adult waning immunity
- `ebola-bundibugyo-drc-2026`: 3 hypotheses — healthcare-facility amplification (historical),
  community transmission (multi-zone spread pattern), lower intrinsic transmissibility
- `cholera-africa-2026`: 2 hypotheses — genuine 65% decline (Africa CDC), surveillance
  artifact from conflict-degraded reporting systems

Per CONTENT-STANDARDS.md §4.1: no claims fabricated; all framed as documented analytical
perspectives with attributed proponents; no specific words put in any authority's mouth.

### §3 #22 — Cross-signal relationship graph

New `relatedSignals[]` field on `Signal` (type: `SignalRelationship` with `signalId`,
`relationship` description, and `type` from `SignalRelationshipType` union).

New `RelatedSignalsBlock` component in `SignalDetail` (below data-quality section) shows
linked signal cards — severity-topped, relationship type badge, one-sentence description,
link to the related signal, and a "View network graph →" link to the new route.

New `/network` page (`NetworkPage.tsx`) — pure SVG radial graph, no D3 dependency:
- Nodes positioned in 4 severity rings (action → concern → watch → monitor)
- Edges deduplicated across both sides; colored by relationship type (6 colors)
- Node size scales with connection count (base 8px, +1 per connection, max 14)
- Hover highlighting: hovered node + connected edges/nodes glow; others dim to 20%
- Hover tooltip bar below graph: signal name, connection count, link to detail page
- Legend: severity ring colors + edge type styles
- Accessible fallback: collapsible `<details>` table of all edges with links

Relationship types seeded (documented from epidemiological or operational evidence):
- `avian-influenza-h5-2026` ↔ `seasonal-influenza-2026` (pathogen-family, reassortment)
- `avian-influenza-h5-2026` ↔ `fifa-world-cup-2026-prep` (shared-context, venue exposure)
- `ebola-bundibugyo-drc-2026` ↔ `mpox-africa-clade-i-2026` (response-resource-conflict)
- `ebola-bundibugyo-drc-2026` ↔ `lassa-fever-2026` (pathogen-family, VHF shared protocols)
- `measles-us-2026` ↔ `seasonal-influenza-2026` (shared-context, vaccine hesitancy)
- `measles-us-2026` ↔ `fifa-world-cup-2026-prep` (shared-context, importation risk)
- `mpox-africa-clade-i-2026` ↔ `cholera-africa-2026` (geographic-overlap, DRC/Great Lakes)
- `cholera-africa-2026` ↔ `screwworm-onehealth-2026` (shared-context, conflict WASH)
- `covid-wastewater-2026` ↔ norovirus/RSV/hMPV/C.auris/H5 (surveillance-platform / pandemic-precursor)
- `seasonal-influenza-2026` ↔ `fifa-world-cup-2026-prep` (shared-context)
- `fifa-world-cup-2026-prep` ↔ `andes-hantavirus-mv-hondius-2026` (geographic-overlap, Andes endemic zone)

**Files touched:**
- `src/types.ts` — `AlternativeHypothesis`, `HypothesisDisposition`, `SignalRelationship`,
  `SignalRelationshipType` types; `alternativeHypotheses?` and `relatedSignals?` on `Signal`
- `src/components/CompetingHypothesesBlock.tsx` — new component
- `src/components/RelatedSignalsBlock.tsx` — new component
- `src/pages/NetworkPage.tsx` — new `/network` route page
- `src/pages/SignalDetail.tsx` — imports and renders both new blocks; TOC updated
- `src/App.tsx` — lazy-loaded `NetworkPage`, `/network` route
- `src/components/NavBar.tsx` — "Network" nav link added
- `scripts/seed-network-and-hypotheses.mjs` — new seeder (idempotent)
- `src/data/signals.json` — 13 signals patched with relatedSignals and/or alternativeHypotheses
- `public/status.json`, `public/api/v1/` — regenerated

**Verify:** `/network` shows a labeled SVG radial graph; hover a node to highlight connections.
Open H5 signal detail → competing hypotheses section appears with 3 ICD-203 hypothesis cards.
Open any wastewater signal detail → "Related signals" section shows linked surveillance platform signals.
`npm run validate:data` → OK; `npm run build` → clean.

---

## ✅ Signal content refresh — measles/cholera/avian-flu/ebola + WastewaterSCAN link-out (commit 53fbdfd)

Bundle 1 (signal content refresh) and Bundle 2 (WastewaterSCAN link-out) from the
prioritized backlog. All four fast-moving signals were updated with verified
primary-source data gathered 2026-05-23. Five wastewater signal summaries received
a direct link-out to the WastewaterSCAN live tracker, closing the UX gap where
methodology was described but no concentration curves were accessible.

**Sources verified:**
- CDC Measles Data Research (cdc.gov/measles/data-research), May 21 2026
- Africa CDC epidemic intelligence via Brown Pandemic Center Tracking Report, May 21 2026
- CDC H5 Avian Influenza Situation Summary (cdc.gov/bird-flu), May 2026
- WHO declaration + Africa CDC for Ebola Bundibugyo (WHO DON pages returning 404;
  narrative-only update, no fabricated metrics per CONTENT-STANDARDS.md)
- WastewaterSCAN tracker (data.wastewaterscan.org/tracker), CC BY-NC 4.0

**Signal changes:**
- `measles-us-2026`: summary/currentSituation updated; confidence→official; 3 metrics
  added (1,952 cases, 29 outbreaks, 40 jurisdictions); lastUpdated 2026-05-23
- `cholera-africa-2026`: **trend corrected "increasing" → "decreasing"**; 40,707 cases
  metric added (Africa CDC); narrative updated with 65% YOY decline confirmation
- `avian-influenza-h5-2026`: 71 US human cases metric added (CDC); narrative updated
  with poultry detection trend and current risk assessment (LOW)
- `ebola-bundibugyo-drc-2026`: summary/currentSituation/geography updated; no metrics
  (WHO DON 404 at time of run; counts require verification before operational briefing)
- 5 wastewater signals (`covid-wastewater-2026`, `norovirus-wastewater-2026`,
  `rsv-wastewater-2026`, `hmpv-wastewater-2026`, `candida-auris-wastewater-2026`):
  appended `data.wastewaterscan.org/tracker` with CC BY-NC 4.0 attribution to summary

**Files touched:**
- `scripts/refresh-signal-data.mjs` — new one-time seeder script (idempotent; checks
  before appending wastewater tracker URL)
- `src/data/signals.json` — 9 signals patched (4 content refresh + 5 wastewater link-out)
- `public/status.json`, `public/api/v1/` — regenerated

**Verify:** Open any wastewater signal detail page — summary should end with the
WastewaterSCAN tracker URL. Measles signal should show 3 metrics with value 1952/29/40.
Cholera trend badge should read "decreasing". Run `npm run validate:data` → OK.

---

## ✅ Fix concurrent workflow push collision (commit 332dfc6)

GitHub Actions failure: "Update News Feed / Commit updated news.json" failed.
Root cause: our source-registry commit touched both `scripts/update-news.mjs`
(triggering Update News Feed) AND `src/data/signal-sources.json` (triggering
Status Refresh) simultaneously. Both workflows write to `public/api/v1/`.
Status Refresh pushed first; Update News Feed's `git pull --rebase` then hit
a conflict on the same generated files.

Two changes:
1. Added `concurrency: group: biosecurity-data-writers / cancel-in-progress: false`
   to both `update-news.yml` and `update-data.yml`. This queues overlapping
   data-writer runs so only one executes at a time.
2. Replaced the single `git pull --rebase && git push` in the commit step
   with a 5-attempt retry loop. On each retry: rebase onto origin/main,
   re-run `generate-api.mjs` (so the committed API state reflects the merged
   news + status data), amend the commit if needed, then push.

Also removed the FDA MedWatch RSS URL added in the previous commit — the URL
returned 404 (FDA blocks automated user agents). The FDA source entry in
`signal-sources.json` stays (correct and valuable); the RSS will be added when
a verified endpoint URL is confirmed.

**Files touched:**
- `.github/workflows/update-news.yml` — concurrency group + retry commit logic
- `.github/workflows/update-data.yml` — concurrency group added
- `scripts/update-news.mjs` — removed 404 FDA RSS URL; reverted FDA authority weight

**Verify:** Next push that triggers both workflows simultaneously (or next 06:00 UTC
schedule overlap) should show one workflow queuing while the other completes,
with no "Commit updated news.json" failure.

---

## ✅ Source registry audit — WastewaterSCAN attribution + FDA addition + pipeline RSS (commit 961a332)

Triggered by a review of the Brown University Pandemic Center May 21 2026
newsletter and WastewaterSCAN. Addressed two questions: (1) are all sources
cited by the newsletter already captured in our RSS/scraping stack; (2) can
we legally use WastewaterSCAN and Brown Pandemic Center, and is attribution
correct.

### Findings
- **WastewaterSCAN**: Licensed CC BY-NC 4.0. Permissible for nonprofit
  dashboard use but commercial hosted-service use requires a separate
  commercial license from Stanford/Emory. Previous registry entry was missing
  `authorityFull`, license notation, required attribution string, and the
  Boehm et al. citation. All added.
- **Brown Pandemic Center**: No explicit license published on their site
  (as of 2026-05-22; contact `public_health@brown.edu` for formal terms).
  Correctly marked `primary: false`, `sourceTier: 3`. Fixed URL to point at
  `/newsletter-archive` rather than homepage. Added note that no RSS feed is
  exposed from MailChimp hosted archive.
- **FDA**: Newsletter cited FDA for EUAs but FDA had no entry in the source
  registry and no RSS feed in the news pipeline. Added both.
- **Other newsletter sources** (WHO, CDC, Africa CDC, PAHO, USDA APHIS,
  NETEC, PHAC): All already captured in signal-sources.json. PAHO/Africa
  CDC/USDA APHIS have no working RSS feeds; covered via Google News and
  per-signal queries.
- **Commercial deployment caveat documented**: WastewaterSCAN CC BY-NC 4.0
  notes warn that any paid SaaS tier incorporating WastewaterSCAN data needs
  commercial licensing from Stanford/Emory before launch.

**Files touched:**
- `src/data/signal-sources.json` — WastewaterSCAN: added `authorityFull`,
  `license`, `notes` with full CC BY-NC 4.0 attribution string and commercial
  constraint. Brown Pandemic Center: fixed `url` to `/newsletter-archive`,
  expanded `notes`. FDA (`fda-safety-alerts`): new Tier 1 entry added.
  Source count: 37 → 38.
- `scripts/update-news.mjs` — Added FDA MedWatch RSS feed to `GLOBAL_FEEDS`;
  FDA authority weight set to 90 (just below WHO/ECDC, above UKHSA).
- `public/status.json` — regenerated (38 sources now reflected)
- `public/api/v1/signal-sources.json` — regenerated (38 sources)
- `public/api/v1/` — all endpoints regenerated
- `src/pages/Status.tsx` — updated hardcoded "37 sources" → "38 sources"

**Verify:** `npm run validate:data` passes; `/status` page Source Registry
shows 38 registered sources; WastewaterSCAN entry on `/sources` shows
authorityFull and license note; FDA appears in sources list.

---

## ✅ Production status verification + RSS note cleanup (commit a5cf183)

Confirmed the pushed source-freshness refresh is live at
`https://biosecurity-intel.emergenzsystems.org/status.json`; production now
reports `status: ok`, `lastOfficialSourceCheck: 2026-05-22T20:55:00.000Z`,
and no stale reasons. Also cleaned up the stale Known Issues RSS note: the
PHAC/RKI/AP/CTV/Eurosurveillance feeds listed there are no longer configured
in `GLOBAL_FEEDS`; they remain documented in `scripts/update-news.mjs` as
historical removals.

**Files touched:**
- `HANDOFF.md` — added this verification note and replaced the stale RSS
  known-issue bullet with the current pipeline behavior

**Verify:** production `/status.json` returns `status: ok` and
`staleReasons: []`; `scripts/update-news.mjs` `GLOBAL_FEEDS` contains only
currently configured RSS endpoints.

---

## ✅ Source freshness refresh (commit 1238f58)

Refreshed the dashboard's official-source check metadata after verifying the
30 source URLs actively cited by the 16 monitored signals. Direct fetch checks
confirmed 28 URLs; the PHAC Andes media update and CDC HAN landing page were
verified separately because they rejected or timed out scripted requests while
remaining browser-accessible. No case counts, severity labels, risk language,
or operational guidance were changed.

**Files touched:**
- `src/data/signals.json` — updated `lastChecked` for all 16 signals to
  `2026-05-22T20:55:00.000Z`
- `src/data/signal-sources.json` — updated `lastVerified` to `2026-05-22`
  for the 30 source records referenced by active signal metadata
- `public/status.json` — regenerated; status moved from degraded to ok and
  stale reasons cleared
- `public/api/v1/signals.json` — regenerated signal endpoint
- `public/api/v1/signal-sources.json` — regenerated source endpoint
- `public/api/v1/signal-timeline.json` — regenerated timeline endpoint
- `public/api/v1/news.json` — regenerated news endpoint envelope
- `public/api/v1/feed.rss` — regenerated RSS feed timestamps

**Verify:** `npm run validate:data`, `npm run build`, and visit `/status` —
expect status `ok`, last official source check `2026-05-22T20:55:00.000Z`,
and no stale reasons.

---

## ✅ Methodology page + RSS feed + mobile search (commit d96a7db)

Closes UX-GAP-ANALYSIS §3 items 23 (confidence methodology) and 25 (alert
subscription) plus the mobile-search affordance gap.

### Analytic methodology page (§3 #23)
- `src/pages/MethodologyPage.tsx` (new) — documents how severity,
  confidence, trend, source diversity, watch indicators, source tiers,
  and estimative language are assigned. ICD-203 alignment so external
  reviewers can audit analytic process.
- 8 sections: Severity, Confidence, Trend, Source diversity, Watch
  indicators, Source tiers, Estimative language, Independent review
- New `/methodology` route registered in `App.tsx`
- "Methodology" added to NavBar (between Status and About)

### RSS alert feed (§3 #25)
- `scripts/generate-api.mjs` extended — also emits `public/api/v1/feed.rss`
  alongside the JSON endpoints
- RSS 2.0 format: high-severity (concern+) active signals + 20 most-recent
  news items, with severity prefixes in titles
- Each pipeline run regenerates the feed; analysts subscribe in their
  feed reader for push-style alerts
- Status page "Public API" card lists `/api/v1/feed.rss` alongside JSON
  endpoints

### Mobile search affordance
- `src/components/NavBar.tsx` mobile dropdown — search input added at
  top of the menu (44px min-height for touch targets); same `onSubmit`
  handler as desktop search navigates to `/search?q=...`

### Files touched
- New: `src/pages/MethodologyPage.tsx`
- Modified: `scripts/generate-api.mjs` (RSS emitter),
  `src/App.tsx` (methodology route),
  `src/components/NavBar.tsx` (methodology link + mobile search),
  `src/pages/Status.tsx` (RSS entry in API card)
- Generated: `public/api/v1/feed.rss`

**Verify:**
- `/methodology` renders 8 sections covering analytic rubric
- `/api/v1/feed.rss` returns valid RSS 2.0 XML with 6 signals + 20 news
- Mobile nav menu shows search input at top (44px min-height)
- Status page lists feed.rss endpoint alongside JSON

---

## ✅ Analyst tooling — public API + /compare side-by-side (commit 89c0866)

Closes UX-GAP-ANALYSIS §3 items 17 (public API documentation) and 21
(comparative view). Together with the prior intel-rigor bundle, the
analyst & medical-intel-officer personas now have:
- Source-diversity score (item 18 — prior bundle)
- Risk-history Δ (item 19 — prior bundle)
- Watch indicators (item 20 — prior bundle)
- Public API endpoints + documentation (items 16, 17 — this bundle)
- Side-by-side comparative view (item 21 — this bundle)

### Public API endpoints (§3 #17)
- `scripts/generate-api.mjs` (new) — copies `src/data/*.json` to
  `public/api/v1/*.json` with envelope: `{ schemaVersion, generatedAt,
  endpoint, count, <name> }`. Tested locally:
  - `/api/v1/signals.json` (16 signals)
  - `/api/v1/signal-sources.json` (37 sources)
  - `/api/v1/signal-timeline.json` (41 events)
  - `/api/v1/news.json` (500 items)
- `package.json` — adds `generate:api` script
- `.github/workflows/update-data.yml` — runs `generate:api` after `generate:status`;
  stages `public/api/v1/` in the bot commit so endpoints stay fresh
- `.github/workflows/update-news.yml` — runs `generate:api` after the news
  pipeline; stages `public/api/v1/` so news endpoint stays fresh
- `src/pages/Status.tsx` — new "Public API" card with envelope description,
  per-endpoint list, sample `curl` command

### Comparative view (§3 #21)
- `src/pages/ComparePage.tsx` (new) — `/compare?signals=A,B,C` route.
  Multi-select chip row (toggles signal in/out of comparison, caps at 4);
  sticky-left column table with 17 comparison rows: Severity, Confidence,
  Trend, Status, Category, Pathogen, Geography, Map markers, Detail
  sections, Risk badges, HCW alert, Watch indicators, Source diversity,
  Last updated, Last checked, Summary, Operational relevance
- `src/App.tsx` — `/compare` route registered (lazy-loaded)
- `src/components/SignalActionStrip.tsx` — adds "Compare with… ↗" button
  linking to `/compare?signals={this signal id}` as launch point

### Files touched
- New: `scripts/generate-api.mjs`, `src/pages/ComparePage.tsx`
- Modified: `package.json` (generate:api script),
  `.github/workflows/update-data.yml`,
  `.github/workflows/update-news.yml`,
  `src/pages/Status.tsx` (Public API card),
  `src/App.tsx` (compare route),
  `src/components/SignalActionStrip.tsx` (Compare with… link)
- Generated: `public/api/v1/signals.json`, `signal-sources.json`,
  `signal-timeline.json`, `news.json`

**Verify (live):**
- `/api/v1/signals.json` returns enveloped JSON with 16 signals
- `/status` shows new "Public API" card listing all 4 endpoints + curl example
- `/compare?signals=andes-hantavirus-mv-hondius-2026,lassa-fever-2026`
  renders 17-row comparison table with both signals' headers + severity stripes
- Signal detail action strip shows "Compare with… ↗" button that
  pre-fills the current signal

---

## ✅ Intel rigor bundle — source diversity + watch indicators + risk history (commit 02934f5)

Implements UX-GAP-ANALYSIS §3 items 18, 19, 20 (analyst & intel rigor tier).
All three address the medical intelligence officer persona's gap: "no
source-diversity score, no risk-history Δ, no watch indicators — would
not satisfy ICD-203 / IC analytic standards."

### Source-diversity score (§3 #18)
- `src/utils/sourceDiversity.ts` (new) — computes distinct-authority count,
  per-tier counts, top tier, and STRONG / MODERATE / WEAK / SINGLE-SOURCE
  label. No new data; runtime-calculated from signal.sourceIds.
- `src/components/SourceDiversityBadge.tsx` (new) — two variants:
  - `card`: compact "STRONG · 9 src" chip on SignalCard
  - `detail`: expanded breakdown row on SignalDetail with T1/T2/T3/T4 counts
- Hantavirus reads STRONG (≥3 distinct Tier 1/2 authorities corroborating).

### Watch indicators (§3 #20)
- `WatchIndicator` interface in `src/types.ts` — `trigger` + `threshold` +
  `escalateTo` (severity) + `rationale`. Optional `Signal.watchIndicators[]`.
- `src/components/WatchIndicatorsBlock.tsx` (new) — yellow-accent section
  with trigger headline, "Escalate to X" pill, threshold line, rationale.
  Inserted between "Why it matters" and "Geography" on signal detail.
- TOC dynamically includes "Watch indicators" entry when present.
- 18 indicators seeded across 5 highest-priority signals via
  `scripts/seed-intel-rigor.mjs`:
  - hantavirus: 4 (P2P transmission, HCW infection with intact PPE,
    >42d incubation, atypical genomics)
  - ebola: 4 (cross-border, vaccine evasion, imported case, ETU cluster)
  - avian flu H5: 4 (sustained H2H, severe non-occupational case,
    geographic expansion, antiviral resistance)
  - mpox clade I: 3 (sustained outside Africa, pediatric outside endemic,
    JYNNEOS breakthrough)
  - lassa: 3 (imported with onward transmission, above-baseline season,
    HCW death)

### Risk-assessment history Δ (§3 #19)
- `RiskAssessmentHistoryEntry` interface in `src/types.ts` — `label` +
  `asOf` + optional `url`. Optional `RiskAssessment.history[]`.
- `AuthorityRiskBadges` extended to render "Δ PRIOR → CURRENT" sub-line
  under each badge when history is present; full chronology shown on hover.
- 12 history entries seeded:
  - hantavirus: WHO (VERY LOW→LOW), CDC (Monitoring→HAN 528), ECDC
  - mpox clade I: WHO (CONCERN→HIGH→PHEIC), Africa CDC
  - avian flu H5: WHO, USDA APHIS (WATCH→INCIDENT)
  - ebola, cholera: prior alert states

### Files touched
- New: `src/utils/sourceDiversity.ts`, `src/components/SourceDiversityBadge.tsx`,
  `src/components/WatchIndicatorsBlock.tsx`, `scripts/seed-intel-rigor.mjs`
- Modified: `src/types.ts` (added WatchIndicator, RiskAssessmentHistoryEntry,
  optional `Signal.watchIndicators`, optional `RiskAssessment.history`),
  `src/pages/SignalDetail.tsx` (renders new components, extends TOC),
  `src/components/SignalCard.tsx` (compact diversity badge),
  `src/components/AuthorityRiskBadges.tsx` (renders Δ history line),
  `src/data/signals.json` (seeded watch indicators + risk history),
  `public/status.json` (regenerated)

**Verify (live):**
- `/signals/andes-hantavirus-mv-hondius-2026` shows STRONG diversity badge,
  4 watch indicators with Escalate-to pills, 3 risk-history Δ lines under
  WHO/CDC/ECDC badges. TOC includes "Watch indicators" entry.
- `/signals` cards show compact diversity badge (e.g. "STRONG · 9 src").
- `npm run build` and `npm run validate:data` clean.

---

## ✅ UX first-pass shortlist — 8 highest-ROI fixes (commit 9176928)

Implements all 8 items from UX-GAP-ANALYSIS §4 (first-pass shortlist) in
3 logical bundles, shipped as one commit per user request.

### Bundle 1 — Landing experience
- **Overview.tsx hero panel** — value prop, target-user list, `Current as of`
  timestamp; replaces the old bare H1
- **Headline threat hero card** — dominant card for highest-severity active
  signal with metric tiles and "View full briefing →" CTA
- **SignalCard.tsx "Updated 7d" badge** — appears when `signal.lastUpdated`
  is within the past 7 days

### Bundle 2 — Signal detail efficiency
Solves the 60-viewport-scroll problem documented in UX-GAP-ANALYSIS §0.
- **SignalActionStrip.tsx** (new) — pinned quick-action bar with `tel:` link
  to CDC EOC (770-488-7100), state DOH lookup, primary-source anchor, and a
  Print briefing button (uses `window.print()` + media-print stylesheet)
- **TldrBox.tsx** (new) — executive verdict card at the top of every signal:
  severity pill + confidence + trend + first sentence of operationalRelevance
  + "Why it matters" highlight
- **SignalDetailToc.tsx** (new) — sticky 200px side rail with scroll-spy
  (IntersectionObserver). All 13 sections (summary, current-situation, why-it-
  matters, geography, metrics, timeline, sources, 5 ContentBlocks, data-quality)
  get `id`s and `scrollMarginTop`; TOC entries scroll-into-view on click.
- **index.css `@media print`** — hides nav/footer/action-strip/TOC/modal when
  printing; forces white background, prints URLs after links

### Bundle 3 — Search + data export
- **src/utils/search.ts** (new) — global search across signals (name + summary
  + section bodies), detail sections, news (title + description), sources
  (authority + title + notes). Lightweight scoring favors title hits +
  recency for news. No external index — linear scan over ~16 + 80 + 500 + 37
  records.
- **src/pages/SearchPage.tsx** (new) — `/search?q=...` route with autofocus
  input, kind filter chips (Signal / Section / News / Source counts),
  shareable URL (URLSearchParams sync).
- **NavBar.tsx** — desktop search box with `<form role="search">` that
  navigates to `/search?q=...` on submit. Hidden on mobile (use hamburger
  menu → search link in a future pass).
- **App.tsx** — `/search` route registered (lazy-loaded).
- **src/utils/export.ts** (new) — `downloadCsv()` and `downloadJson()` helpers
  that create a Blob, generate an object URL, synthesize a hidden anchor
  click, and revoke the URL after 100ms. CSV uses union-of-keys column set
  with quote-escaping.
- **src/components/ExportButtons.tsx** (new) — compact "CSV ↓ JSON ↓" bar
  consumed by Signals, News, and SourcesPage. JSON exports the full filtered
  array; CSV flattens to first-level scalar columns.

**Verify (live):**
- `/` shows "BIOSECURITY INTEL DASHBOARD" hero with "Current as of" stamp;
  headline threat card renders the highest-severity active signal with
  metric tiles
- `/signals/{id}` shows action strip with CDC EOC tel link + Print button,
  TLDR executive verdict box, sticky TOC with 13 entries linking to in-page
  anchors. `npm run build` clean.
- `/search?q=hantavirus` returns 30 hits (1 signal + 29 news, 0 sections,
  0 sources) with kind-filter chips
- `/signals` shows `Export: CSV ↓ JSON ↓` buttons; same on `/news`, `/sources`
- `@media print` rules in index.css hide chrome when printing

**Files touched:**
- New: `src/components/SignalActionStrip.tsx`, `src/components/TldrBox.tsx`,
  `src/components/SignalDetailToc.tsx`, `src/components/ExportButtons.tsx`,
  `src/utils/search.ts`, `src/utils/export.ts`, `src/pages/SearchPage.tsx`
- Modified: `src/pages/Overview.tsx`, `src/pages/SignalDetail.tsx`,
  `src/pages/Signals.tsx`, `src/pages/News.tsx`, `src/pages/SourcesPage.tsx`,
  `src/components/SignalCard.tsx`, `src/components/NavBar.tsx`,
  `src/App.tsx`, `src/index.css`

---

## 🔍 UX gap analysis + adversarial review (commit a551fdc)

Produced **UX-GAP-ANALYSIS.md** — full audit of the dashboard's UX/UX
from 5 target user perspectives (EMS, emergency manager, public health
analyst, healthcare preparedness, nonprofit ops) plus a medical
intelligence officer.

**Key empirical findings:**
- Signal detail page is **77,838 px tall** — **60 viewport-heights** to
  read through; 13 sections inline with no jump navigation
- CDC EOC phone for a suspected case takes **3 clicks and 30 viewport-
  scrolls** to find
- Overview leads with `Active signals: 14` (least actionable number); no
  hero threat card; no role selector; no `Current as of` stamp visible
  above the fold
- 10-item top nav, no global search
- `Resources` and `Sources` are nearly duplicate pages
- Wastewater signals describe methodology but show no concentration curves
- No data export, no documented API for signal/news JSON contracts
- No source-diversity score, no risk-history (Δ over time), no watch-
  indicator escalation triggers, no competing-hypothesis surface
  (ICD-203 analytic rigor absent)

**Document structure:**
- §0 Empirical baseline (measured live)
- §1 Gap analysis (8 categories: orientation, rapid-scan, drill-down, IA,
  actionability, visual hierarchy, analyst utility, accessibility/mobile)
- §2 Adversarial review by 6 personas (severity-ranked frictions)
- §3 25 prioritized recommendations across 5 tiers
- §4 Recommended first-pass shortlist (8 highest-ROI items)

**Files touched:**
- `UX-GAP-ANALYSIS.md` (new) — the full audit

**No code changes yet.** The next conversation step is to convert any
subset of the §3 recommendations into discrete implementation tasks.

---

## ✅ Full section parity (commit 19ffb28)

Brings every non-hantavirus signal from 3 → 5 attributed `detailSections`,
matching the hantavirus signal. Total sections across the dashboard:
**50 → 80** (30 new sections). Closes the last item on the restoration
backlog.

Each signal received 2 new thematic ContentBlocks inserted BEFORE its
existing "Operational guidance" section so the clinical/operational
ordering reads naturally. Themes were chosen to avoid duplication with
existing sections and to surface practical operational depth:

- **ebola**: Laboratory diagnostics · EMS transport protocols
- **measles**: School and childcare response · Surveillance and reporting
- **mpox clade I**: Laboratory diagnostics · Travel and importation risk
- **avian flu H5**: One Health surveillance coordination · Laboratory diagnostics
- **cholera**: WASH interventions · Outbreak response coordination
- **seasonal influenza**: Vaccine strategy · Antiviral stewardship
- **covid wastewater**: Variant tracking · Clinical surveillance integration
- **norovirus wastewater**: Laboratory diagnostics · Healthcare and LTCF IPC
- **rsv wastewater**: Laboratory diagnostics · Pediatric surge management
- **hmpv wastewater**: Clinical management · Infection prevention
- **lassa fever**: Ribavirin treatment protocol · Travel surveillance
- **chikungunya**: Chronic arthropathy management · Vector establishment and importation
- **candida auris**: Outbreak investigation · Antifungal stewardship
- **screwworm**: USDA APHIS coordination · Wildlife and border surveillance
- **fifa 2026**: Cross-border coordination · Pre-event vaccination and traveler health

All sections carry primary `attribution` + 1-2 `additionalAttributions`
pulled from `signal-sources.json` with `lastReviewed: 2026-05-21`. Bodies
are factual, non-prescriptive per CONTENT-STANDARDS §7.1; specifics cite
the primary source inline so reviewers can verify quickly.

**Files touched:**
- `scripts/parity-signal-sections.mjs` — one-time seeder
- `src/data/signals.json` — 30 new sections added (5 per signal × 15 non-hantavirus + hantavirus unchanged at 5)
- `public/status.json` — regenerated; `signals.totalDetailSections: 80`

**Verify:** visit `/signals/lassa-fever-2026` (5 ContentBlocks ordered Clinical → PPE → Ribavirin → Travel → Operational), `/signals/fifa-world-cup-2026-prep` (5 ContentBlocks), and `/status` ("Detail sections: 80").

---

## ✅ Semantic intelligence color system (commit fe52413)

User request: replace arbitrary tag colors with a semantically consistent
intelligence/biosurveillance visual language. Severity now follows a strict
blue -> amber -> orange -> red escalation gradient; threat categories cluster
by operational domain; marker types use function-specific colors for cases,
deaths, outbreak zones, exposure events, monitoring sites, animal/vector
detections, infrastructure, ship routes, flight tracking, and US monitoring.

**Files touched:**
- `src/utils/signals.ts` - adds shared severity/category/marker tone registries, marker color constants, and `intelToneStyle()` helpers.
- `src/index.css` - adds the reusable `.intel-pill` / `.intel-dot` treatment: dark translucent fill, colored border, muted glow, uppercase white text, hover and active states.
- `src/tokens.css` - retunes the base dark navy/charcoal palette and shared accent colors.
- `src/pages/MapPage.tsx` - applies semantic severity, category, and marker-type filter pills.
- `src/pages/Signals.tsx` - applies semantic severity/category filter pills.
- `src/components/SignalCard.tsx` - applies semantic severity/category chips on signal cards.
- `src/pages/Briefings.tsx` - applies semantic pills to briefing cards and filters.
- `src/pages/TimelinePage.tsx` - applies semantic pills to timeline filters and event chips.
- `src/pages/News.tsx` - applies semantic signal filter pills.
- `src/pages/Overview.tsx` - applies semantic pills to active briefings, domain counts, and latest-news signal chips.
- `src/pages/SignalDetail.tsx` - applies semantic category/severity pills in the signal metadata strip.
- `src/components/SignalsMap.tsx` - softens marker fills and uses semantic marker-type popup pills.
- `HANDOFF.md` - logs the semantic color-system shipment.

**Verify:** `npm run validate:data`, `npm run build`, then visit `/`, `/signals`, `/map`, `/timeline`, `/briefings`, `/news`, and a representative signal detail page to confirm the pill system and map markers render with muted dark tactical styling.

## ✅ Hantavirus marker deduplication (commit 0272520)

Completed the cosmetic marker-deduplication backlog item. Removed the legacy
generic `andes-fr-paris` marker ("France — confirmed case") because it had the
same coordinates and case semantics as the richer restored `case-paris` marker.
Other close marker pairs were left intact because they represent distinct event
types at the same city or site, such as a hospital exposure event and a death
record.

**Files touched:**
- `src/data/signals.json` — removes the duplicate hantavirus France/Paris marker; hantavirus markers now total 47.
- `public/status.json` — regenerated so `signals.totalMapMarkers` reflects the marker count change.
- `HANDOFF.md` — logs the marker-deduplication backlog completion.

**Verify:** `npm run generate:status`, `npm run validate:data`, and confirm `/signals/andes-hantavirus-mv-hondius-2026` no longer includes the duplicate "France — confirmed case" marker while retaining "Paris, France".

## ✅ Tier 1 news feed hard alerts + refresh (commit 39fd4a1)

Completed the intermittent-feed backlog item in line with
CONTENT-STANDARDS §6.1. The news updater now uses live official CDC, WHO, and
ECDC RSS endpoints as critical Tier 1 feeds; when any critical feed fails while
active signals exist, the script writes no `news.json`, emits
`update-news-result.json`, and exits non-zero so GitHub Actions can alert.
The update-news workflow now has `issues: write`, creates/reuses a
`news-pipeline` issue on failure, closes it on recovery, and only commits
`news.json` when the updater succeeds.

The local verification run fetched all three Tier 1 feeds successfully and
refreshed the checked-in static snapshot to 500 news items. One CBC News timeout
was recorded as a soft Tier 3 failure, which does not fail the pipeline.

**Files touched:**
- `scripts/update-news.mjs` — replaces dead WHO/ECDC feed URLs, marks WHO/ECDC critical, writes `update-news-result.json`, and exits before writing public data on critical Tier 1 failures.
- `.github/workflows/update-news.yml` — adds issue reconciliation for news pipeline failures and gates data commits on successful updater runs.
- `.gitignore` — ignores the local/workflow `update-news-result.json` diagnostic file.
- `src/data/news.json` — refreshed by `npm run update:news` after Tier 1 feed verification.
- `public/status.json` — regenerated after the news refresh.
- `HANDOFF.md` — logs the pipeline hard-alert backlog completion.

**Verify:** `npm run update:news`, `npm run generate:status`, `npm run validate:data`, `npm run build`, and `npm audit`. In the verification run, CDC/WHO/ECDC returned success and `update-news-result.json` had `criticalFailures: []`.

## ✅ Accessibility sweep: modal focus + filter semantics (commit d9ef47e)

Completed the next backlog item after the bundle split. The acknowledgment
modal now traps Tab focus inside the dialog, focuses the acceptance button on
open, returns focus on close, and handles Escape without dismissing the
required acknowledgment. Filter chip rows now expose grouped labels and pressed
state to assistive technologies across the primary filter-heavy pages.

**Files touched:**
- `src/components/AcknowledgmentModal.tsx` — adds focus trap, Escape handling, focus restoration, `aria-describedby`, and an explicit button type/ref.
- `src/pages/MapPage.tsx` — adds filter groups, button types, and `aria-pressed` to severity/category/marker-type filters.
- `src/pages/Signals.tsx` — adds filter groups and `aria-pressed` to severity/category chips.
- `src/pages/Briefings.tsx` — adds filter groups and `aria-pressed` to severity/category chips.
- `src/pages/TimelinePage.tsx` — adds filter groups and `aria-pressed` to severity/category chips.
- `src/pages/News.tsx` — adds filter group and `aria-pressed` to signal filter tabs.
- `src/pages/SourcesPage.tsx` — adds filter group and `aria-pressed` to tier filter chips.
- `HANDOFF.md` — logs the accessibility backlog completion.

**Verify:** `npm run validate:data` and `npm run build`. Manual browser follow-up: open a fresh session, Tab/Shift+Tab inside the acknowledgment modal, press Escape, and confirm filter chips announce pressed/unpressed state.

## ✅ Custom domain verification + bundle split (commit 6798844)

User reported the custom domain was resolved. Verified
`biosecurity-intel.emergenzsystems.org` now resolves to Vercel DNS, confirmed
`https://biosecurity-intel.emergenzsystems.org/status.json` returns HTTP 200,
and `npm run monitor:status` passes against the custom-domain status endpoint.

The bundle-size backlog item was addressed by lazy-loading the Overview route
and splitting React, Leaflet, signal data, and news data into stable Rollup
chunks. This reduced the app-shell entry chunk from **928.90 kB / 297.83 kB
gzip** to **18.23 kB / 6.39 kB gzip** and removed Vite's >500 kB chunk warning.

**Files touched:**
- `src/App.tsx` — lazy-loads the Overview route so large route/data imports stay out of the app shell.
- `vite.config.ts` — adds `manualChunks` for `react-vendor`, `map-vendor`, `signal-data`, and `news-data`.
- `HANDOFF.md` — logs the domain verification and bundle-size backlog completion.

**Verify:** `npm run validate:data`, `npm run build`, `STATUS_URL=https://biosecurity-intel.emergenzsystems.org/status.json MAX_STATUS_GENERATED_AGE_HOURS=24 npm run monitor:status`, and `npm audit`.

### 1. News feed (commit `b0c0753`)
- `src/pages/News.tsx` — multi-signal filter tabs, authority-color cards, signal tag chips
- `scripts/update-news.mjs` — RSS-only pipeline (17 global feeds + per-signal Google News queries), tags items with `signalIds[]`, deduplicates, caps at 200, no API keys
- `src/data/news.json` — seeded with 31 hantavirus items from history; ~200 after first pipeline run
- `.github/workflows/update-news.yml` — runs every 6h on schedule + on signal data changes
- `src/types.ts` — added `NewsItem` interface
- NavBar + App route + `update:news` script wired
- `fast-xml-parser` added as devDependency

**Verify:** `npm run update:news`, then `npm run dev` and visit `/news`.

### 2. About & Legal page (commit `0591b49`)
- `src/pages/AboutPage.tsx` — 12-card layout adapted from hantavirus version
- Cards: About This Dashboard (links CONTENT-STANDARDS.md), About EMERGENZ Corp (EIN 93-4070519, DE/CA), Who this is for, What it is not, Source provenance & tier system, Data currency & cadence, Resilience, Legal Disclaimer, Privacy, MIT License (full text), WHO Content Attribution Notice (CC BY-NC-SA 3.0 IGO), U.S. Government Content Notice (17 U.S.C. §105)
- GitHub URL updated to `biosecurity-intel-dashboard`
- Data currency clause updated for current cadence

**Verify:** visit `/about`.

### 3. Map (commit `8196828`)
- `src/types.ts` — `MarkerType` union (8 multi-threat categories), `MarkerSource`, expanded `SignalMapMarker`
- `src/utils/signals.ts` — `MARKER_TYPE_COLORS` palette, `markerRadius` helper
- `src/components/SignalsMap.tsx` — rewritten: dark CARTO tiles, CircleMarker, dark popup styling, source links in popup
- `src/pages/MapPage.tsx` — added marker-type filter row alongside severity and category, color-swatch chips, visible-marker count
- `scripts/seed-map-markers.mjs` — one-time seeder that wrote 103 typed markers across all 16 signals (hantavirus 15, Ebola 7, measles 8, mpox 7, H5 8, cholera 7, lassa 6, chikungunya 6, FIFA 8, wastewater 3–6 each, etc.)
- `src/data/signals.json` — markers field populated for all 16 signals

**Verify:** visit `/map`. Tile URL should contain `cartocdn.com/dark_all`. Marker counter shows "103 markers visible". Click marker → dark popup with type label and source links.

### 4. SignalDetail / ContentBlock (commit `9c3b3e9`)
- `src/types.ts` — added `SectionAttribution` interface; `SignalDetailSection` extended with optional `attribution`, `additionalAttributions[]`
- `src/components/ContentBlock.tsx` — new component: title + body paragraphs + per-block source-attribution footer with primary "Source:" row and "Also:" rows for additional sources, plus optional License badge and lastReviewed line
- `src/components/SourceChip.tsx` — restored from history; renders "Authority · Document title · Date ↗" chip
- `src/pages/SignalDetail.tsx` — `detailSections[]` now rendered via ContentBlock (was: plain `<Paragraph>` per `\n\n` split)
- `scripts/seed-section-attribution.mjs` — one-time seeder:
  - Hantavirus 5 existing sections: layered structured attribution (CDC HAN 528, NYC DOH HAN #8, NETEC, WHO DON601, etc.) onto unchanged bodyMarkdown
  - Other 15 signals: added a single "Operational guidance" / "Mass-gathering health preparedness" section with primary + 1-2 additional attributions sourced from CDC, WHO, USDA APHIS, WOAH, PAHO, ECDC, Africa CDC, WastewaterSCAN
- Total: 20 attributed sections (5 hantavirus + 15 new)

**Verify:** visit `/signals/andes-hantavirus-mv-hondius-2026` — 5 ContentBlocks each with Source: chip and Also: rows. Visit `/signals/avian-influenza-h5-2026` — Operational guidance ContentBlock with USDA APHIS source chip. `npm run validate:data` passes.

### 5. Overview page rails (commit `d959dfd`)
- `src/pages/Overview.tsx` — restructured with 7 sections plus stat strip:
  - Status strip adds **News items** stat chip alongside existing (active signals, highest severity, domains, stale signals)
  - **Active operational briefings** rail (NEW, EMERGENZ accent border) — pulls signals at severity >= concern, surfaces the `ems-specific` / `operational-guidance` / `protocols-and-guidance` section, shows severity chip, category, section title + authority, and a 2-sentence summary card. Top 3, sorted by severity rank. Each card links to the signal detail page.
  - Priority signal queue (preserved)
  - Threat domain coverage + Data currency (preserved, Data currency now also shows news item count)
  - **Latest authority & media coverage** (NEW) — 5 most-recent items from `news.json`, authority color stripe, signal chips, links external to source
  - Signal map preview (preserved, dark CARTO via SignalsMap rewrite)
  - Recent developments timeline (preserved)
- Authority color map + signal short-name map mirror the News page so chips render consistently.

**Verify:** visit `/`. Expect 7 section headers above; "Active operational briefings" shows hantavirus + concern-level signals; latest news rail shows 5 items with signal chips; mini-map renders dark tiles with 100+ markers.

---

### 6. Tab sweep (commit `57346a9`)
- **Briefings (`/briefings`):** complete rebuild. Each signal at severity Watch+ rendered as a card surfacing its `ems-specific` / `operational-guidance` / `protocols-and-guidance` / `clinical-profile` section (whichever is present, in that priority). Card shows severity pill, category, geography, signal name link, operational relevance, a tinted preview box with section title and first 2 paragraphs + "Read full briefing →" link, and a footer SourceChip pulling from `section.attribution` (falls back to primarySourceId). Severity + category filters.
- **Timeline (`/timeline`):** event card `borderLeft` now uses the signal's severity color (was always blue). Each event includes a severity pill matching the signal. Source link replaced with a proper `SourceChip`. Added severity filter alongside category. Events grouped by month with EMERGENZ-accent month headers. Header shows event count and signal count.
- **SignalCard:** added depth indicators (markers / sections / news counts) rendered as small mono chips. Reads from `signal.mapMarkers`, `signal.detailSections`, and matches against `news.json` by `signalIds`. Counts surface signal depth at-a-glance on `/signals` and on Overview.
- **Sources (`/sources`):** added tier-breakdown summary grid at the top (Tier 1 / 2 / 3 / 4 with count and tier color); tier filter chips; per-source `borderLeft` colored by tier instead of primary/secondary; tier pill in card header. References CONTENT-STANDARDS.md §1 in the intro card.
- **Resources (`/resources`):** per-source `borderLeft` switched from primary/secondary (green/purple) to tier-colored. Result count shown in header ("N of M shown").
- **Tier color palette:** Tier 1 green, Tier 2 blue, Tier 3 yellow, Tier 4 orange. Defined identically in both SourcesPage.tsx and Resources.tsx.

**Verify:** `/briefings` shows 12 cards each with Source: footer; `/timeline` groups by month with severity stripes and SourceChip footers; `/signals` first card shows depth badges ("7 markers", "1 sections", "83 news"); `/sources` shows tier breakdown grid + tier filter (Tier 1: 19, Tier 2: 11, Tier 3: 4, Tier 4: 0); `/resources` borderLeft now tier-colored.

---

## ✅ Backlog bundle (commit f7490f6)

Shipped in a single safe bundle:

- **Custom domain workflows.** `status-monitor.yml` STATUS_URL and `update-data.yml` PRODUCTION_URL restored to `https://biosecurity-intel.emergenzsystems.org` now that DNS resolves.
- **RSS endpoints (`scripts/update-news.mjs`).** Removed 6 dead feeds (ProMED, Eurosurveillance, PHAC, RKI, AP News, CTV News). Added 3 known-working: CIDRAP (`cidrap.umn.edu/rss.xml` — Tier 2 institutional), NBC News health, CBC News (alt URL `webfeed/rss/rss-health`). Per-signal Google News queries already cover removed authorities. Authority-weight map updated.
- **Authority colors** synced in `News.tsx` and `Overview.tsx` so chips render consistently for the new feeds.
- **Zero-write skip (CONTENT-STANDARDS §4.4).** `update-news.mjs` now serializes the candidate output, compares byte-for-byte to existing `news.json`, and skips the write if identical. Prevents spurious commits and Vercel rebuilds.
- **Tier 4 sources added** (3 entries): bioRxiv Infectious Diseases, medRxiv Infectious Diseases, medRxiv Epidemiology. All carry `notes` explaining the not-peer-reviewed status per §1.
- **Status page depth.** `generate-status.mjs` now exposes `signals.totalMapMarkers` (103), `signals.totalDetailSections` (20), `sources.byTier` ({tier1: 19, tier2: 11, tier3: 4, tier4: 3}), and `news` ({total, newest}). Status.tsx renders a new "Dashboard depth" card and an extended source-registry section with per-tier counts.

**Verify:** `npm run generate:status` then visit `/status` — expect "Map markers 103 · Detail sections 20 · Timeline events 13 · News items 200" and a Tier 1–4 breakdown.

---

## ✅ Section deepening (commit b37e9a9)

`scripts/deepen-signal-sections.mjs` added 2 attributed ContentBlock sections to each of the 15 non-hantavirus signals (30 new sections; total now 50). Hantavirus unchanged at 5.

Section themes per signal:
- **Ebola DRC**: Clinical profile · PPE & isolation
- **Measles US**: Clinical profile · Post-exposure prophylaxis
- **Mpox clade I**: Clinical profile · Infection prevention & vaccination
- **Avian flu H5**: Human clinical profile · Occupational exposure response
- **Cholera Africa**: Clinical management · Oral cholera vaccine deployment
- **Seasonal influenza**: Clinical management · Surveillance methods
- **COVID wastewater**: Surveillance methodology · Interpretation & limitations
- **Norovirus wastewater**: Clinical profile · Outbreak response
- **RSV wastewater**: Clinical profile · Prevention (nirsevimab, maternal & adult vaccines)
- **hMPV wastewater**: Clinical profile · Diagnostic testing
- **Lassa fever**: Clinical profile · PPE & isolation
- **Chikungunya**: Clinical profile · Vector control & vaccination (Ixchiq)
- **Candida auris**: Infection prevention in healthcare · Laboratory identification
- **Screwworm**: Animal detection & surveillance · Human myiasis
- **FIFA 2026**: Surveillance planning · EMS surge readiness

All sections carry: primary `attribution` + 1-2 `additionalAttributions` (pulled from `signal-sources.json`), `lastReviewed: 2026-05-20`. Bodies are factual, non-prescriptive per CONTENT-STANDARDS §7.1; clinical specifics cite the primary source inline so reviewers can verify.

**Verify:** any non-hantavirus signal detail page (e.g. `/signals/cholera-africa-2026`) shows 3 ContentBlocks each with Source: + Also: rows. `/status` shows "Detail sections: 50".

---

## ✅ Threat-category label rename (commit f0fc728)

User request: friendlier display labels for the 10 threat categories.

Internal keys **unchanged** (vhf, respiratory, zoonotic, vaccine_preventable,
enteric, vector_borne, amr_fungal, environmental, mass_gathering, travel),
so no schema or data migration. Only `THREAT_CATEGORY_LABELS` in `src/types.ts`
updated. All filter chips, signal cards, map popups, briefing badges, and
About-page tier copy pick up the new labels automatically.

New labels:
- `respiratory` → "Respiratory Threats"
- `vhf` → "Hemorrhagic Threats"
- `enteric` → "Enteric / Waterborne"
- `vector_borne` → "Vector-Borne"
- `zoonotic` → "Zoonotic Spillover"
- `amr_fungal` → "Healthcare-Associated / AMR"
- `environmental` → "Environmental Surveillance"
- `mass_gathering` → "Mass Gatherings & Events"
- `travel` → "Travel & Importation"
- `vaccine_preventable` → "Vaccine Gaps"

**Verify:** visit `/map` — all 10 category chips render with the new labels.

---

## ✅ Risk badges + HCW alerts extended (commit be1a004 / 681b11b)

Risk-assessment badge strip now renders on **9 signals** total (added 8):
mpox (WHO PHEIC), lassa, ebola, avian flu H5, measles US, cholera, chikungunya, screwworm.

HCW alert callouts now render on **6 signals** total (added 5):
ebola, lassa, mpox, measles, candida auris.

`scripts/seed-risk-and-hcw.mjs`: one-time seeder. All risk badges link to
real published authority documents; HCW alerts cite the authority issuing
the operational guidance.

---

## ✅ Hantavirus-asset restoration (commit f4c4438)

Addresses gaps documented in [HANTAVIRUS-ASSET-AUDIT.md](HANTAVIRUS-ASSET-AUDIT.md).

**Types** (`src/types.ts`):
- `MarkerType` extended with `ship_route`, `us_state_monitoring`, `flight_tracing` — preserves original hantavirus dashboard semantics
- New interfaces: `RiskAssessment` (authority + label + description + url), `HcwAlert` (headline + body + source)
- `Signal` interface adds optional `riskAssessments[]` and `hcwAlert`

**Components** (new):
- `src/components/HcwAlertCard.tsx` — orange-accent alert callout with headline, body, source link, updated-at
- `src/components/AuthorityRiskBadges.tsx` — colored badge strip (WHO/CDC/ECDC etc.) with click-through to source

**SignalDetail** now renders, in this order: risk badges → HCW alert → summary → ...

**Data restored** (via `scripts/restore-hantavirus-assets.mjs`):
- **48 hantavirus markers** (was 15) — 6 ship-route waypoints, 11 US-state monitoring nodes, 4 flight-tracing markers, 7 specific case/death sites, Arrowe Park UK monitoring, Colorado Sin Nombre context, Rotterdam return destination
- **231 news items** (was 200) — 31 original hantavirus items (CDC HAN, WHO DON, ECDC, AP, BBC, etc.) re-seeded with `signalIds: ['andes-hantavirus-mv-hondius-2026']`
- **41 timeline events** (was 13) — 28 hantavirus events restored across April–May 2026
- **3 authority risk badges** for hantavirus (WHO LOW, CDC HAN 528, ECDC VERY LOW) wired through to source documents
- **HCW alert** on hantavirus signal citing NYC DOH HAN #8 and Radboud UMC HCW exposure event

**Pipeline fix** (`scripts/update-news.mjs` + `.github/workflows/update-news.yml`):
- `MAX_ITEMS` raised from 200 → 500 so authoritative seeded items survive the daily Google News flood
- Root cause documented: pipeline-generated IDs (`${authority}-${md5(link).slice(0,8)}`) don't collide with manually-seeded IDs, so without higher cap, sort-by-timestamp evicts older items

**Status counters** now read: 136 markers · 50 sections · 41 events · 231 news.

**Verify:** visit `/signals/andes-hantavirus-mv-hondius-2026` — expect risk-badge strip (WHO/CDC/ECDC), HCW alert callout, 48 markers on mini-map. `/status` shows updated counts. `/timeline` shows the restored hantavirus chronology.

---

## ⏳ Outstanding work (backlog)

- **~~Further deepening.~~** ✅ Shipped. Every signal now has 5 attributed sections (was 3 for non-hantavirus). Total dashboard sections: 80 (was 50). See `scripts/parity-signal-sections.mjs`.
- **~~Bundle size.~~** ✅ Addressed by lazy route loading + Rollup `manualChunks`. Entry chunk is now 18.23 kB (gzip 6.39 kB); heavy map/data/vendor chunks are split and cacheable.
- **~~Accessibility sweep.~~** ✅ Code-level sweep shipped: acknowledgment modal focus trap/Escape handling and grouped `aria-pressed` filter chips on Map, Signals, Briefings, Timeline, News, and Sources. Manual browser/axe pass still useful before a formal accessibility sign-off.
- **~~Intermittent feed failures.~~** ✅ Addressed for Tier 1 feeds: CDC, WHO, and ECDC now use live endpoints and hard-fail the news workflow during active monitoring. Soft Tier 2/3 feed failures remain tolerated and internal-only.
- **~~Marker deduplication (cosmetic).~~** ✅ Removed the exact France/Paris duplicate marker. Other close pairs were retained because they represent different event types rather than duplicate records.
- **~~HCW alert / risk badges on other signals.~~** ✅ Shipped. Risk badges now on 9 signals total (hantavirus + 8 others); HCW alerts on 6 signals total (hantavirus + 5 others). See `scripts/seed-risk-and-hcw.mjs`.

---

## Conventions & rules

### Commit style (per CONTENT-STANDARDS §8.1)
- `feat(scope): subject` — new feature
- `fix(scope): subject` — bug fix
- `chore(scope): subject` — pipeline / housekeeping
- All AI-assisted commits end with `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Pipeline-generated commits use `EMERGENZ Data Bot <bot@emergenz.org>`

### Push procedure
The `update-news` workflow may commit while you're working. If push is rejected:
```
git pull --rebase origin main && git push origin main
```

### Verification cadence
- After each implementation: `npm run validate:data` and `npm run build` (TypeScript + Vite)
- For observable UI: `npm run dev` and visit the affected route. Use `preview_eval` / `preview_snapshot` if the screenshot tool times out (known issue).

### Source attribution
- Tier 1 (WHO/CDC/ECDC) drives structured data
- Tier 2 (PHAC, UKHSA, RKI, journals) drives structured data
- Tier 3 (news outlets) → news feed only
- Tier 4 (preprints) must be labeled
- Per CONTENT-STANDARDS §4.1, never fabricate. Use `null` (rendered as `—` or `TBD`) when uncertain.

---

## Known issues / deferred

- **Vercel CLI auth** is invalid on this machine; deploy plumbing is owned by the user.
- **Soft news-feed failures are tolerated and alerted.** The currently configured Tier 1 feeds (CDC, WHO, ECDC) hard-fail the news workflow during active monitoring; Tier 2/3 RSS or per-signal Google News failures are recorded in `update-news-result.json` and surfaced through the reusable `news-pipeline` GitHub issue. Historical dead feeds (PHAC, RKI, AP News, CTV News, Eurosurveillance, ProMED) are no longer in `GLOBAL_FEEDS`; keep them removed unless a stable endpoint is found.

---

## Quick reference commands

```bash
# Run news fetch locally
npm run update:news

# Validate signals/sources/timeline
npm run validate:data

# Regenerate /public/status.json
npm run generate:status

# Type-check & build
npm run build

# Dev server
npm run dev

# View what was deleted in the multi-threat migration
git show f4ebe5c^:src/data/news.json | head
git show 90bd172^:src/pages/Clinical.tsx | head
```
