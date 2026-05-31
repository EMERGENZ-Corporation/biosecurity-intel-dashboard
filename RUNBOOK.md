# biosecurity-intel-dashboard — Operational Runbook

**Audience:** the on-call operator (today: Michael), and any future maintainer who needs to diagnose a workflow failure, rotate a secret, recover from data corruption, or roll back a deploy.

This runbook only documents operational procedures. For content / source / authorship rules, read [CONTENT-STANDARDS.md](CONTENT-STANDARDS.md). For AI/enrichment posture, read [AI-ENRICHMENT-POLICY.md](AI-ENRICHMENT-POLICY.md). For session-start protocol, read [AGENTS.md](AGENTS.md). For the deploy/change log, read [HANDOFF.md](HANDOFF.md).

---

## 1. Scheduled workflows at a glance

| Workflow | File | Trigger | Cadence | Public-facing? |
|---|---|---|---|---|
| Status Refresh | `.github/workflows/update-data.yml` | cron `0 6 * * *` + push on data files | Daily 06:00 UTC | Yes — commits `public/status.json` + `public/api/v1/` |
| Update News Feed | `.github/workflows/update-news.yml` | cron `0 */6 * * *` + push on signals/script | Every 6h | Yes — commits `src/data/news.json` + `public/api/v1/news.json` + RSS |
| Production Status Monitor | `.github/workflows/status-monitor.yml` | cron `17 * * * *` | Hourly | No — opens/updates one reusable issue `status-monitor` on failure |
| Official Source Audit | `.github/workflows/official-source-audit.yml` | cron `43 7 * * *` + push on source files | Daily 07:43 UTC | No — opens/updates `source-audit` + `source-drift` issues |
| CI / validate-build | `.github/workflows/ci.yml` | PR + push to main | Per change | No — required check on `main` |

Two workflows write to `public/api/v1/` (Status Refresh + Update News Feed). They share the concurrency group `biosecurity-data-writers` (`cancel-in-progress: false`) so only one writer runs at a time. Both use `git pull --rebase -X theirs origin main` + API regeneration on conflict.

---

## 2. Workflow failure recovery

### 2.1 `Update News Feed` — push rejected after 5 retries

**Symptom:** workflow log shows `Push failed on attempt 5 - giving up`.

**Cause:** main moved faster than the rebase loop could keep up (rare — usually a coincident Status Refresh + a manual push within seconds).

**Recovery:**
1. Re-run the workflow from the GitHub Actions UI. The 6h schedule will retry on its own; manual re-run only if the news corpus is going stale (>24h since last successful run).
2. If it fails again, check `git log --oneline -20 origin/main` for an unexpected force-push or history rewrite. Without one, this is just transient.

### 2.2 `Update News Feed` — critical Tier 1 feed failure

**Symptom:** workflow exits 1 at the `Fetch and update news feed` step with `critical Tier 1 feed failure during active monitoring - writing no files`.

**Cause:** at least one Tier 1 source (CDC, WHO, or ECDC RSS) returned an unrecoverable error during active monitoring. By design, the pipeline aborts rather than write a partial corpus — the strict-gate decision was confirmed on 2026-05-24.

**Recovery:**
1. Open the `news-pipeline` reusable issue — it will list which Tier 1 feed failed and why.
2. Curl the feed URL directly from your workstation. If the URL has moved or the feed is permanently dead, edit `GLOBAL_FEEDS` in `scripts/update-news.mjs` and ship a fix.
3. If the failure is transient (timeout, 5xx), wait one cycle (6h). The reusable issue will close itself once a clean run completes.
4. Never disable the Tier 1 gate to make this go away — see CONTENT-STANDARDS §6.1.

### 2.3 `Status Refresh` — fail-on-stale step

**Symptom:** workflow exits 1 at `Alert on stale dashboard data`.

**Cause:** `status.json` `data.lastUpdated` is older than `MAX_DATA_AGE_HOURS` (default **168** = 7 days, aligned with the human review cadence per CONTENT-STANDARDS §3.4). This means structured signal data hasn't been touched in a week — a real review gap, not a workflow noise event.

**Recovery:**
1. Check whether this is a true alert (no signal updates in a week) or a generator bug (data did change but `lastUpdated` wasn't bumped).
2. If true: hand-curate one structured update from a primary Tier 1/2 source per CONTENT-STANDARDS §1 and ship via PR.
3. If false: the bug is in the generator; check `scripts/generate-status.mjs` for the `lastUpdated` computation.

### 2.4 `Production Status Monitor` — hourly status check failed

**Hard vs soft model (changed 2026-05-30).** The monitor now distinguishes two
classes of condition. Only **hard** failures fail the workflow (red-X + GitHub
"all jobs failed" email) and open/update the `status-monitor` issue. **Soft**
conditions (the routine signal-review backlog) exit 0 and are owned by the daily
**Human Review Digest** (`review-digest` issue) — so a lapsed review cadence no
longer emails you hourly. This split exists because `degraded`-from-stale-signals
is review work, not an outage, and the digest already lists the exact action to
clear each item.

**Symptom (hard — this is what now alerts):** `status-monitor` issue opens/updates
with `status URL unreachable`, `status.json generation > 30h`, `Unsupported
schemaVersion`, `Invalid status`, or `Dashboard status is critical`. The workflow
run goes red.

**Cause matrix:**

| Class | Failure line | Threshold (default) | Real cause |
|---|---|---|---|
| HARD | `HTTP …` / timeout fetching status URL | n/a | Production endpoint unreachable — page is down or DNS/Vercel broken. |
| HARD | `status.json generation > 30h` | `MAX_STATUS_GENERATED_AGE_HOURS=30` | Status Refresh failed 2+ consecutive days OR Vercel is not deploying the latest commit. |
| HARD | `Unsupported schemaVersion` / `Invalid status` | n/a | Generator emitted a malformed contract — code regression. |
| HARD | `Dashboard status is critical` | set by `generate-status.mjs` | Reserved for a future critical state; treat as an incident. |
| SOFT | `Dashboard status is degraded` | `staleReasons` accumulate | Review-cadence lapse. **No email** — see the `review-digest` issue. |
| SOFT | `Stale signals: …` | `MAX_SIGNAL_STALE_HOURS=168` (7d) | One or more signals not human-reviewed in a week. |
| SOFT | `headline signal data > 168h` / `last official source check > 168h` | `MAX_DATA_AGE_HOURS` / `MAX_OFFICIAL_CHECK_AGE_HOURS=168` | No structured data update / source re-verification in a week. |

**Important — threshold history:** the prior `MAX_OFFICIAL_CHECK_AGE_HOURS=48` default produced false alarms every weekend because it expected daily human review of `lastChecked` across 16 signals — incompatible with the actual weekly review cadence permitted by CONTENT-STANDARDS §3.4. Raised to 168h on 2026-05-25 to match `MAX_SIGNAL_STALE_HOURS`. The 2026-05-30 hard/soft split is the more durable fix: soft review lapses no longer page at all. Do not tighten without a CONTENT-STANDARDS conversation.

**Recovery (HARD failure — `result.hardFailures` in `status-monitor-result.json`):**
1. If `status URL unreachable` or `schemaVersion`/`Invalid status`: the deployed contract is broken — check the latest deploy and `generate-status.mjs`.
2. If `status.json generation > 30h`: check the latest Status Refresh workflow run. If it succeeded but production is still stale, the issue is in the Vercel deploy — check Vercel dashboard for `main`-branch deploy state. Vercel CLI auth is currently invalid on the maintainer machine.
3. If `Dashboard status is critical`: treat as an incident; inspect `staleReasons`.

**Soft conditions (NOT a workflow failure):** work them from the `review-digest`
issue (RUNBOOK §2.8) — verify each signal/source against its primary source and
bump `lastChecked`/`lastVerified`. Status Refresh regenerates `status.json` on the
next signal-data push; once no signal is stale, status returns to `ok`.

**Prevent this:** the Status Refresh workflow runs on push to any signal data file, so a human `lastChecked` bump immediately publishes a fresh `status.json`. After the hard/soft split, the hourly monitor only emails when (a) the production endpoint is unreachable, (b) `status.json` hasn't regenerated in >30h (Status Refresh failed twice running OR the deploy pipeline is broken), (c) the contract is malformed, or (d) status is `critical`. The routine review backlog never pages.

### 2.5 `Official Source Audit` — drift findings

**Symptom:** reusable issue `source-drift` opens listing N changed Tier 1/2 pages.

**Cause:** SHA-256 / ETag / Last-Modified / page-title fingerprints of registered sources have changed since the last audit run. Page rotations, index updates, and rewrites all trigger this; substantive content changes that affect dashboard claims do too.

**Recovery:**
1. Triage each entry into A/B/C buckets (see `docs/SOURCE-DRIFT-*.md` for examples):
   - **A** = rotating index/feed (`paho-epi-alerts`, `africa-cdc-outbreaks`, `fda-safety-alerts`, `ecdc-cdtr`) — refresh `lastVerified` after an eyeball check that the page still serves on-topic content.
   - **B** = page is the cited authority for specific structured numbers — requires SME re-verification of every structured claim before any `lastVerified` refresh.
   - **C** = reference/guidance — light review.
2. Update `src/data/signal-sources.json` with new `lastVerified` dates only for sources confirmed unchanged in substance.
3. Re-run `npm run audit:source-drift` locally; the cache will re-baseline once the workflow runs and writes the fingerprint artifact.
4. For sources that block automated fetches (e.g. `cdc-han` returns HTTP 403), use the `knownBlocked: true` + `knownBlockedReason` allowlist — see §6.3 below.

### 2.6 `CI / validate-build` failing on a PR

**Symptom:** required check failing on a PR before merge.

**Recovery:**
1. Run locally: `npm run test:validators && npm run validate:data && npm run build`.
2. The most common cause is a typo in a `relatedSignals[].signalId` (referential integrity), a stale `triageCard.lastReviewed` (>365 days), or a `news.json` description >280 chars.
3. Never bypass with `--no-verify` or `--force`. Fix the underlying issue.

### 2.7 `Weval Baseline` — Gemini classifier regression or run failure

**Symptom:** reusable issue `weval-pipeline` opens or updates with `[WEVAL ALERT] Gemini classifier regression or run failure`.

**Cause matrix:**

| Failure line | Default threshold | Real cause |
|---|---|---|
| `hallucination: N hallucination(s) detected; tolerance is 0` | `WEVAL_HALLUCINATION_TOL=0` | Gemini emitted a signalId outside the supplied catalog. Hard zero-tolerance; a single hallucination indicates the prompt-limit boundary is no longer effective. |
| `accuracy-drop (classification-positive)` | `WEVAL_ACCURACY_DROP_PCT=10` pp | Gemini classification quality dropped >10pp on positive cases vs. prior baseline. Most often a model update; sometimes a blueprint case has drifted out of relevance. |
| `accuracy-drop (classification-negative)` | Same | Gemini started tagging off-topic news. Could indicate context-window confusion or an over-eager update. |
| `limit-adherence-drop` | `WEVAL_LIMIT_DROP_PCT=5` pp | Gemini started writing clinical content, case counts, risk ratings, or other prohibited output. This is a CONTENT-STANDARDS §4.1 boundary violation. |
| `cli-failure: …` | n/a | Weval CLI not installed in the runner, judge model unreachable, blueprint malformed, etc. |
| `cli-skipped: …` | n/a | `WEVAL_SKIP_CLI=1` was set — not a real failure, but the workflow should not be configured this way in CI. |

**Threshold history:** the wrapper at `scripts/run-weval.mjs` defaults `WEVAL_HALLUCINATION_TOL=0`, `WEVAL_ACCURACY_DROP_PCT=10`, `WEVAL_LIMIT_DROP_PCT=5`. Same values pinned in `.github/workflows/weval-baseline.yml`. `audit:autonomy` guards against silent regression of these values. Do not tighten without an explicit decision logged in HANDOFF.

**Recovery procedure (operator):**

1. Read the issue body — `result.regressions` lists every failing check with quantified deltas.
2. **If `hallucination`** — open the most recent run's `weval-run-result.json` (artifact, not committed). Read the failing case's prompt + Gemini response. Two possible adjudications:
   - **(a) Genuine boundary failure**: Gemini invented a signalId. Investigate `scripts/enrich-news.mjs` prompt for any drift; consider tightening the prompt's "Use only the provided news items and signal catalog" clause. Patch + retest.
   - **(b) Test case is wrong**: the blueprint case unfairly penalized a correct behavior. Patch the blueprint's `should_not` line. Add a HANDOFF entry explaining why the rubric changed.
3. **If `accuracy-drop`** — likely a Gemini model update. Two possible adjudications:
   - **(a) Real regression**: Gemini is now worse at classification. Consider escalating to a more capable model (`gemini-2.5-pro` or another vendor); document in `AI-ENRICHMENT-POLICY.md` and update the production env in `update-news.yml`.
   - **(b) Test drift**: the blueprint case is no longer representative (e.g., a news item description format changed industry-wide). Patch the blueprint; HANDOFF entry.
4. **If `limit-adherence-drop`** — this is the most serious. Treat as a CONTENT-STANDARDS §4.1 incident:
   - Investigate which prohibited output category breached (clinical content / case counts / risk rating / URLs / numerics).
   - Tighten the production prompt in `scripts/enrich-news.mjs` immediately.
   - Consider pausing the `enrich:news` step in the news workflow until the prompt fix lands. Set `GEMINI_NEWS_ENRICHMENT=0` as a stop-gap (the deterministic fallback covers signal tagging).
5. **If `cli-failure`** — likely environmental. Check the workflow logs for the CLI exit code and stderr. Could be:
   - Weval CLI version drift (the upstream package name or flag shape changed); patch `WEVAL_CLI_COMMAND` env in the workflow.
   - `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` repo secret missing or rotated; refresh.
   - Network issue inside the runner; retry the workflow manually.
6. **Once fixed**, manually dispatch the workflow (`workflow_dispatch`) to confirm clean run. The reusable issue auto-closes on the next green run.

**Initial setup checklist (one-time):**

- [ ] Repo secret `GEMINI_API_KEY` exists (already set — used by `enrich-news`).
- [ ] Repo secret `ANTHROPIC_API_KEY` exists for the Weval judge model (Claude Haiku 4.5). Add via Settings → Secrets and variables → Actions. Different vendor family from Gemini = no self-grading bias; aligns with EMERGENZ Anthropic stack.
- [ ] First manual run via Actions → Weval Baseline → Run workflow. The first run has no prior baseline so it cannot regress; it just writes the first baseline JSON to `weval/baselines/` and commits it.
- [ ] After the first commit, the monthly cron is live.

**Cost expectation:** ~$0.10–$0.30 per full run (26 cases × judge calls). Monthly cadence → ~$1.20–$3.60/year. Tighten `WEVAL_HALLUCINATION_TOL`, accuracy / limit thresholds, or judge model only with deliberate cost-impact awareness.

### 2.8 `Human Review Digest` — review-digest issue

**Symptom:** reusable issue `review-digest` (titled `[REVIEW DIGEST] Dashboard items needing human attention`) opens or updates with a grouped, prioritized list of items needing a human.

**What it is:** the digest answers "what do I, a human, actually need to do?" — it is the actionable to-do board, not an outage signal. It consolidates the configured recurring review gates that require a curated-field edit a person must attest (CONTENT-STANDARDS §3.4) or a scheduled code removal. It is **report-only and never fails the workflow** (`npm run review:digest`, exit 0; set `REVIEW_DIGEST_STRICT=1` for a local non-zero gate). The hard red-X enforcement stays with the hourly `status-monitor` (§2.4). Run it any time: `npm run review:digest`.

**Why a separate channel:** the Production Status Monitor only tells you production is degraded; it does not tell you which signals, which sources, or what to change. The digest does, with the exact file, field, and primary-source URL for each item. Keeping them separate prevents the bare red-X (production health) from being confused with the to-do list (curation work).

**Buckets:**

- **NEEDS-HUMAN** — a gate has tripped or will trip on the next run; act now. Sources: signal `lastChecked` >168h; `triageCard.lastReviewed` >365d (a CI blocker — fix before the next data commit); Tier 1/2 source `lastVerified` >30d or malformed; a `_REMOVE_AFTER_`/`_DEPRECATE_AFTER_` code marker whose date has passed.
- **AUTONOMOUS-WATCH** — within policy but approaching a threshold (signal 120–168h, source 21–30d, triage 300–365d, detail sections >365d). Pre-warning only; no red-X is imminent.

**Recovery (clear a NEEDS-HUMAN item):**
1. Open the `review-digest` issue. Each item names the file, field, and (for signals/sources) the primary-source URL.
2. Verify the item against its primary source — this is the human attestation the curated timestamp represents; do not bump a timestamp without doing the review. For `triageCard.lastReviewed` items (category: clinical-content-freshness), verification must be performed by a reviewer with the clinical domain knowledge to assess whether the guidance still matches the cited authority — not just any human.
3. Edit the named field (`signals.json` `lastChecked` / `triageCard.lastReviewed`, or `signal-sources.json` `lastVerified`) to today's ISO date; commit + push. For a removal marker, complete the checklist in the file/`HANDOFF.md` or revise the marker date if the decision changed.
4. Status Refresh regenerates `status.json` on push to signal data; the next daily digest run closes the issue automatically once no NEEDS-HUMAN items remain.

**Important:** the digest is deterministic and reads only local data + present `*-result.json` artifacts. It makes no network calls and must never write a curated field — that would fabricate a human-review attestation. If it ever does, that is a CONTENT-STANDARDS §3.4 regression, not a feature.

---

## 3. Secret rotation

| Secret | Where used | How rotated | Last rotated |
|---|---|---|---|
| `BRIGHT_DATA_API_KEY` | `update-news.yml` → `enrich-news.mjs` | Bright Data dashboard → regenerate → update GitHub repo secret + Vercel env var | Per Bright Data quarterly cycle |
| `biosecurity_web_unlocker` | `update-news.yml` → `BRIGHT_DATA_ZONE` env | Bright Data → zone management (zone names rotate rarely; the secret stores the zone name string) | n/a |
| `GEMINI_API_KEY` | `update-news.yml` → `enrich-news.mjs`; `weval-baseline.yml` → `run-weval.mjs` | Google AI Studio → revoke + reissue → update GitHub repo secret + Vercel env var | Per Google quarterly cycle |
| `ANTHROPIC_API_KEY` | `weval-baseline.yml` → Weval judge model (Claude Haiku 4.5). Judge MUST be a different family from the production model under test to avoid self-grading bias. Anthropic chosen because (a) bias-free vs Gemini, (b) aligns with EMERGENZ Anthropic stack, (c) Weval is Anthropic-partnered. | Anthropic Console → revoke + reissue → update GitHub repo secret. **Not used outside the Weval workflow** — never expose to `update-news.yml`, `enrich-news.mjs`, or anywhere else. | Per Anthropic quarterly cycle |
| `GITHUB_TOKEN` | All workflows | Auto-issued per workflow run; never stored | n/a |

**Rotation procedure** (applies to Bright Data + Gemini):

1. Issue a new key in the provider dashboard.
2. Update GitHub repo secret: Settings → Secrets and variables → Actions → update the named secret. Do NOT rename the secret; the workflow references the name verbatim.
3. Update Vercel env var: Vercel project → Settings → Environment Variables → update the matching name.
4. Trigger one manual run (`workflow_dispatch`) on `Update News Feed`. The next scheduled run (≤6h) will also exercise the rotation.
5. Confirm the run output shows `Gemini enrichment: enabled` (and `Bright Data context: enabled` if applicable). The run artifact `ai-news-enrichment-result.json` shows `aiUsed: true` on a successful enrichment.
6. Revoke the old key in the provider dashboard *after* one full scheduled cycle confirms the rotation worked.

**Notes:**
- Bright Data IP allow-listing is not viable: GitHub Actions uses dynamic egress IPs. Blast radius is bounded by `MAX_BRIGHT_DATA_CONTEXT_ITEMS=5` and `MAX_AI_NEWS_ITEMS=80` instead. Set a monthly spend cap in the Bright Data dashboard as a safeguard.
- The `biosecurity_web_unlocker` secret is the *zone name*, not a key. It does not need rotation unless the zone is renamed.
- Never expose any of these as `VITE_*` env vars. The build-time `audit:ai-enrichment` would catch this, but the rule exists upstream of the audit.

---

## 4. Deploy rollback

The production site is deployed to Vercel from the `main` branch.

### 4.1 Bad deploy, want to revert to previous commit

1. From the Vercel dashboard: Deployments tab → find the previous green deployment → `...` menu → `Promote to Production`. Vercel re-deploys instantly without changing the git tree.
2. In parallel, open a `revert` PR in GitHub for the offending commit: `git revert <sha> && git push -u origin revert/<sha>`. This keeps `main` honest.
3. Once the revert PR merges, Vercel will auto-deploy from the reverted `main`. The manual promote in step 1 was bridge coverage during the gap.

### 4.2 Bad deploy, the offending commit was a `chore(news): automated update` from the bot

1. Same as 4.1 promote-from-Vercel.
2. The next scheduled `Update News Feed` run will overwrite `news.json` again. If the bot is producing bad output, suspend the schedule (comment out the `cron:` line in `update-news.yml`) before merging the revert, then re-enable after the fix.

### 4.3 Vercel deploy stuck / never finished

1. Vercel dashboard → cancel the stuck deploy → trigger a new build (`Redeploy` on the previous successful build).
2. If the build is timing out (rare — Vite build is fast), check whether the package install is the culprit (`npm ci` against npm registry rate limits).
3. Vercel CLI auth is currently invalid on the maintainer machine. Use the dashboard.

---

## 5. Data corruption recovery

### 5.1 `src/data/news.json` is corrupted or empty

**Detection:** `scripts/update-news.mjs` reads the existing file with corruption-aware parse. If `JSON.parse` throws, the script exits 1 rather than silent-reset (see `396f39b`).

**Recovery:**
1. Find the most recent successful `chore(news): automated update` commit: `git log --oneline -- src/data/news.json | head -5`.
2. Restore: `git checkout <sha> -- src/data/news.json && git commit -m "fix(news): restore corpus from <sha>"`.
3. The next scheduled `Update News Feed` run will layer fresh items on top.

**Prevention:** `update-news.mjs` uses `atomicWriteFileSync` (write-tmp → rename) so a mid-run SIGKILL cannot leave a half-truncated file. Don't remove this guard.

### 5.2 `src/data/signals.json` or `signal-timeline.json` lost a field after a PR

**Detection:** `validate:data` fails locally and in CI. `relatedSignals[].signalId` referential-integrity failures and `triageCard` staleness checks are common catches.

**Recovery:**
1. `git checkout <sha> -- src/data/signals.json` from the last green CI run.
2. Re-apply the intended change with the missing field restored.
3. Re-run `npm run validate:data && npm run build`.

### 5.3 `public/api/v1/*` artifacts drifted from generator output

**Detection:** a PR's diff shows changes in `public/api/v1/` that do not match the underlying data change in `src/data/`.

**Recovery:**
1. `npm run generate:api` from a clean working tree.
2. Commit any artifact deltas separately so the diff is reviewable.

See §7 below for the api/v1 commit policy.

---

## 6. Source registry maintenance

### 6.1 Adding a new source

1. Add an entry to `src/data/signal-sources.json` with `id`, `name`, `url`, `sourceTier`, `category`, `primary` (true for Tier 1/2 official sources only), `lastVerified` (YYYY-MM-DD = today), and `description`.
2. Reference the source from at least one signal via `sourceIds[]` (or `primarySourceId`) — orphaned sources fail validation.
3. Run `npm run validate:data && npm run audit:sources && npm run audit:source-drift` locally.
4. Ship the change through the standard PR flow; CI will exercise validation.

### 6.2 Updating `lastVerified` after SME review

1. Open `src/data/signal-sources.json`, update the `lastVerified` field for the source(s) reviewed.
2. Add a HANDOFF entry summarizing what was reviewed and the date.
3. Commit. The next `audit:source-drift` run will re-baseline the fingerprint cache automatically.

### 6.3 Working with sources that block automated fetches

When a Tier 1/2 source page returns HTTP 403 to identified user-agents (today: `cdc-han`), do NOT loosen the User-Agent header — that violates source operator intent and triggers IP bans. Use the `knownBlocked` allowlist instead:

```json
{
  "id": "cdc-han",
  ...
  "knownBlocked": true,
  "knownBlockedReason": "CDC HAN returns HTTP 403 to identified audit user-agents (verified 2026-05-23). Source still reachable via browser; re-verify status manually each quarter and reset this flag if access is restored."
}
```

- `knownBlocked` must be boolean; `knownBlockedReason` must be a non-empty string. Both are validated.
- Only HTTP 403 specifically is bypassed. Timeouts, 5xx, 404, redirects, and any other failure still count as real failures and surface in the `failures` array.
- Re-verify quarterly. The reason field is the audit trail.

---

## 7. `public/api/v1/*` commit policy

`public/api/v1/{signals,news,signal-sources,signal-timeline}.json` and `feed.rss` are tracked in git as a deliberate snapshot of the public API surface. They are regenerated by `scripts/generate-api.mjs` from the underlying data files.

**Rules:**

1. Never hand-edit `public/api/v1/*`. The data flows one direction: `src/data/*` → `generate-api.mjs` → `public/api/v1/*`. Direct edits will be overwritten on the next workflow run.
2. When you change `src/data/signals.json`, `signal-timeline.json`, `signal-sources.json`, or `news.json`, run `npm run generate:api` and commit both the data change and the regenerated artifacts **in the same commit**. This keeps the diff reviewable and the deployed snapshot in sync with the data of record.
3. When you change the generator itself (`scripts/generate-api.mjs`), commit the script + the regenerated artifacts in the same commit, and add a HANDOFF entry explaining the schema/shape change. Downstream consumers of `/api/v1/*` will see the diff.
4. CI's `npm run build` does not regenerate artifacts. If a PR's `public/api/v1/*` diff doesn't match its `src/data/*` diff or generator diff, a reviewer should flag it.
5. The artifacts are kept in git (not gitignored) because they make the diff reviewable, give Vercel a deterministic deploy target, and serve as the cacheable snapshot for external consumers of `/api/v1/*`. This is intentional — see `HANDOFF.md` "api/v1 commit policy" entry.

---

## 8. Known operational tradeoffs

These are deliberate decisions, not defects. Don't "fix" them without re-opening the underlying tradeoff.

- **Tier 1 RSS gate is strict.** Any critical Tier 1 feed (CDC / WHO / ECDC) failing during active monitoring aborts the news workflow. This sacrifices availability for data-integrity. Decision confirmed 2026-05-24; see CONTENT-STANDARDS §6.1.
- **`signal-timeline.json` is partially automated.** Curated events are human-written. As of the timeline auto-promote shipment, Tier-1 news with matched signalId and severity ≥ concern is auto-added with `provenance: "auto-news-tier1"`. See CONTENT-STANDARDS and AI-ENRICHMENT-POLICY for the policy contract.
- **AI enrichment (Gemini + Bright Data) is optional and fail-open.** Provider unavailability never aborts the pipeline. Provider-tagged signalIds are advisory only.
- **Vercel CLI auth is not configured on the maintainer machine.** All Vercel operations go through the dashboard.
- **Soft Tier 2/3 feed failures are tolerated.** They surface in the reusable `news-pipeline` issue but do not abort the workflow. Historical dead feeds (PHAC, RKI, AP News, CTV, Eurosurveillance, ProMED) have been removed from `GLOBAL_FEEDS`.

---

## 9. Verification cadence (after any change)

```bash
npm run test:validators       # regression tests for validate-data
npm run validate:data         # schema + referential integrity
npm run build                 # tsc -b && vite build
npm run audit:autonomy        # autonomy contract intact
npm run audit:ai-enrichment   # AI/enrichment disclosure intact
# Optional, slower:
npm run audit:sources         # network fetch of Tier 1/2 sources
npm run audit:source-drift    # fingerprint comparison
```

For observable UI changes, additionally run `npm run dev` and visit the affected route. Use `preview_eval` / `preview_snapshot` if the screenshot tool times out.

---

## 10. Where to look when this runbook isn't enough

- [HANDOFF.md](HANDOFF.md) — reverse-chronological log of every shipped change. The most recent ~10 entries usually contain the context for any current operational issue.
- [AGENTS.md](AGENTS.md) — model-selection policy, agent inventory, halt conditions.
- [CLAUDE.md](CLAUDE.md) — Claude Code-specific routing, slash commands, hooks.
- [CONTENT-STANDARDS.md](CONTENT-STANDARDS.md) — source tier rules, attribution, authorship, curated-fields list.
- [AI-ENRICHMENT-POLICY.md](AI-ENRICHMENT-POLICY.md) — Gemini / Bright Data posture, fail-open contract, prohibited uses.
- [SCRATCH.md](SCRATCH.md) — informal session notes, useful for "why is this configured this way" archaeology.
- `public/status.json` — machine-readable health contract. The `automation` block lists every scheduled writer, monitor, and review gate.
