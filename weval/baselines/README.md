# weval/baselines/

Committed historical baselines for `weval/biosecurity-gemini-news-classification.yml`.

## Naming

`YYYY-MM-DD-<model-slug>.json` — e.g. `2026-06-01-google-gemini-2.5-flash.json`.

The model slug is the Weval model identifier with `:` and `/` replaced by `-`. The date is UTC at the time `scripts/run-weval.mjs` wrote the file.

## Content

Each baseline is the structured output of one Weval CLI run + the derived summary. Schema (additive over time, do not break existing fields):

```json
{
  "capturedAt": "ISO 8601 UTC",
  "model": "google:gemini-2.5-flash",
  "judgeModel": "anthropic:claude-haiku-4-5",
  "blueprint": "weval/biosecurity-gemini-news-classification.yml",
  "summary": {
    "totals": { "cases": 26, "passed": 24, "failed": 2 },
    "byCategory": {
      "classification-positive": { "total": 8, "passed": 8, "failed": 0 },
      "classification-negative": { "total": 3, "passed": 3, "failed": 0 },
      "hallucination-resistance": { "total": 3, "passed": 3, "failed": 0 },
      "confidence-calibration": { "total": 3, "passed": 2, "failed": 1 },
      "prompt-limit-adherence": { "total": 6, "passed": 6, "failed": 0 },
      "edge-cases": { "total": 3, "passed": 2, "failed": 1 }
    },
    "hallucinations": 0
  },
  "raw": { /* full Weval CLI output, preserved for forensic review */ }
}
```

## How files land here

- **CI workflow** (`.github/workflows/weval-baseline.yml`) runs `npm run eval:gemini` on a monthly cron + manual `workflow_dispatch`. On a clean (non-regressing) run it commits the new baseline under the `EMERGENZ Data Bot` identity.
- **Local manual runs** — operator runs `npm run eval:gemini` (with the env vars set in `.env.local`). On a clean run the wrapper writes the new baseline to this directory; operator decides whether to commit.

## What counts as a regression

Configured in `scripts/run-weval.mjs` and overridable via env:

| Check | Default threshold | Override env |
|---|---|---|
| Hallucinations (any signalId outside catalog) | 0 — any hallucination = regression | `WEVAL_HALLUCINATION_TOL` |
| Classification accuracy drop (positive + negative) | 10 percentage points | `WEVAL_ACCURACY_DROP_PCT` |
| Prompt-limit adherence drop | 5 percentage points | `WEVAL_LIMIT_DROP_PCT` |
| Confidence calibration drift | Not gated; warning only | n/a |

A regression suppresses the baseline write (the baseline only advances on clean runs), exits non-zero, and the CI workflow opens / updates the reusable `[WEVAL ALERT]` issue.

## Cleanup policy

Baselines are not pruned automatically. The directory is small (each file ~50-150 KB) and the history is itself the audit trail. If the directory grows unwieldy, prune by hand and add a HANDOFF entry explaining what was removed and why.
