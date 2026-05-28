# Impact Reporting — Quarterly Procedure

This is the operator-facing procedure for producing the quarterly impact report
that EMERGENZ uses for funder updates (Coefficient Giving, NYCT, SF Foundation,
PSEG, Mozilla, Motorola, fal.ai, Bright Initiative) and grant applications.

## Hard constraint — preserved privacy posture

The dashboard's About → Privacy section publicly states:

> "EMERGENZ Corporation does not collect, store, or process any personally
> identifiable information through this dashboard. No cookies, tracking pixels,
> or analytics tools are employed."

This commitment is load-bearing. **Impact reporting must stay inside it.** That
means:

- **Do not** install `@vercel/analytics`, `@vercel/speed-insights`, Plausible,
  Fathom, Google Analytics, Segment, or any other client-side tracking package.
- **Do not** add tracking pixels, beacons, or telemetry endpoints to any page.
- **Do not** loosen the CSP in `vercel.json` to allow a third-party tracking host.
- **Do not** introduce server-side identifiers (session cookies, fingerprints,
  client IDs) for reporting purposes.

If a future funder requirement appears to demand client-side analytics, surface
that as an explicit policy decision in `HANDOFF.md` and update the public
Privacy section *before* changing the dashboard, not after.

## What we report from instead

Impact reports are assembled from two sources, neither of which violates the
privacy commitment:

| Source | What it tells us | Where it comes from |
|---|---|---|
| **Artifact snapshot** | What the dashboard publishes (signals tracked, sources cited, source-tier mix, news linkage, content depth, freshness) | `npm run audit:impact` (in this repo) |
| **Vercel server-side logs** | Aggregate reach (request counts, top paths, status mix, geography by request header where available) | Vercel project → Observability tab → Logs (web UI) or `vercel logs` / `vercel metrics` (CLI) |

These two together answer the questions a public-good funder typically asks:
*what does this dashboard cover, how authoritative is the sourcing, and is anyone
reading it.* What they **do not** answer: per-user journeys, retention cohorts,
funnels, or any individual-level behavior. That is deliberate, and the right
framing in reporting is "reach + reuse + artifact coverage," not "engagement."

## Quarterly procedure

Run once at the end of each calendar quarter (March, June, September,
December). Total time: ~15 minutes.

### Step 1 — Capture the artifact snapshot

From the repo root:

```bash
npm run audit:impact
```

This writes two files (both gitignored, both safe to share with funders):

- `impact-baseline-result.json` — machine-readable snapshot
- `impact-baseline-result.md` — paste-into-grant-report ready

The Markdown file is the one you'll typically forward. Spot-check the
"Freshness" line — if it's below ~85%, run `npm run audit:sources` and
`npm run audit:source-drift` first, then re-run `audit:impact`.

### Step 2 — Export Vercel request logs for the quarter

Two equivalent paths.

**Web UI (recommended for the first time):**

1. Open the Vercel dashboard → biosecurity-intel-dashboard project.
2. Click the **Observability** tab.
3. Set the time range to the reporting quarter (e.g. 2026-04-01 → 2026-06-30).
4. Capture three things as screenshots or CSV exports:
   - Total request count (the headline number)
   - Top paths (which signals and pages received the most traffic)
   - Geography breakdown if your plan exposes it
5. If the free/hobby plan retention does not cover the full quarter, note the
   actual covered window in the report and flag it for follow-up.

**CLI (faster on the second run):**

```bash
vercel metrics vercel.request.count --since=2026-04-01 --until=2026-06-30
vercel logs --since=2026-04-01 --until=2026-06-30
```

Pipe to a file if you want a permanent archive.

### Step 3 — Compose the quarterly report

Combine the two outputs into a single document with this skeleton:

```markdown
# EMERGENZ Biosecurity Intelligence Dashboard — Impact Report <quarter>

## Coverage (artifact snapshot)
<paste the `audit:impact` Markdown output here, lightly trimmed>

## Reach (Vercel request logs)
- Total requests this quarter: <number>
- Top 10 paths by request volume: <list>
- Geography (where available): <list>
- Retention window covered: <date range>

## Source posture
- Public commitment: no client-side analytics, no cookies, no PII collection
- Tracking method: server-side aggregate request logs only (Vercel infrastructure logging)
- Privacy section unchanged from the deployment at <commit SHA on main at report date>

## Caveats
- News.json is a rolling live window — cumulative news ingest for the quarter
  is best derived from `git log src/data/news.json` over the date range, not from
  the artifact snapshot.
- We do not measure individual user behavior, retention, or funnels. Reach
  figures are aggregate request counts.
```

### Step 4 — File the report

- Store the final report wherever EMERGENZ keeps quarterly grant artifacts.
- Add a one-line `HANDOFF.md` entry noting which quarter was produced and a
  brief callout if anything in the snapshot warrants follow-up (e.g. dropping
  freshness, narrowing source diversity, a category with no signals for an
  extended period).

## Things this procedure intentionally does not do

- **No retention cohorts, no funnels, no per-user analytics.** If a funder
  insists, route that conversation through EMERGENZ leadership before any code
  change — see "Hard constraint" above.
- **No automated dashboard-side counter UI.** A live `/impact` page would
  create a tracking-feedback loop and an overclaiming surface. The report is
  produced quarterly, in-document, and signed off by a human.
- **No `npm run audit:impact` from CI.** The snapshot is point-in-time and
  meaningful only when an operator captures it for a specific window. Letting
  CI run it on every push would produce noise without insight.

## Related guards

- `npm run audit:autonomy` — confirms the pipeline scripts that produce these
  artifacts are still wired together.
- `npm run audit:sources` — confirms registered sources are still reachable;
  drops in this score should appear in the next impact report's caveats.
- `npm run audit:source-drift` — confirms source attribution hasn't silently
  degraded.

If you change this procedure, also update the `Privacy` section of
[src/pages/AboutPage.tsx](../src/pages/AboutPage.tsx) and add a `HANDOFF.md`
entry describing the change.
