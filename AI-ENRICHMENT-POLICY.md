# AI and Enrichment Policy

This dashboard is source-backed first. AI systems and paid web-data tools may
support maintenance or review workflows, but they do not replace public health
authorities, clinical reviewers, source licenses, or the source registry.

## Current Live Status

- Gemini is not used by the live dashboard pipeline unless `GEMINI_API_KEY` is
  configured in the server-side workflow environment.
- Gemini is integrated only as optional server-side news enrichment for signal
  tagging, duplicate/event clustering, query expansion candidates, and internal
  brief generation.
- Bright Data is integrated only as optional server-side context fallback for
  low-risk news triage when `BRIGHT_DATA_API_KEY` and `BRIGHT_DATA_ZONE` are
  configured.
- No Gemini, Google Generative AI, Bright Data, or Web Unlocker API key is
  required to build, validate, deploy, or run the dashboard. Missing keys must
  degrade to the deterministic RSS/Google News keyword pipeline.
- The active public writers are RSS/Google News keyword collection,
  optional AI news enrichment, `public/status.json` generation, static
  `/api/v1/` generation, production status monitoring, and official-source
  review alerts.

## Bright Data Decision

The dashboard does not require a Bright Data API key for the current
architecture. The current source model depends on official RSS feeds,
registered public authority URLs, Google News RSS search, source reachability
audits, and manual review for structured public-health fields.

Bright Data is permitted for narrow enrichment jobs:

- resolving metadata from pages that do not expose stable RSS feeds;
- improving source-availability checks when public pages block basic fetches;
- collecting article metadata where the original publisher remains the cited
  source;
- feeding an internal review queue for analysts.

Bright Data must not become a source of record. Any Bright Data-derived artifact
must preserve the original publisher URL, title, authority, license context, and
retrieval date. It must not write case counts, risk levels, clinical guidance,
PPE guidance, triage cards, legal text, licensing text, or source-tier decisions
without independent Tier 1 or Tier 2 verification.

Bright Data's own documentation describes Web Unlocker as a way to handle proxy
rotation, anti-bot challenges, and CAPTCHA handling, and its Scraper APIs as
prebuilt extraction tools. Those capabilities can improve access reliability,
but they also increase cost, compliance, and attribution burden. The live
dashboard therefore limits Bright Data to a small, optional context fallback
inside news enrichment rather than a broad crawler.

References:

- https://docs.brightdata.com/scraping-automation/web-unlocker/introduction
- https://docs.brightdata.com/datasets/scrapers/overview

## Gemini Decision

Gemini is permitted only for low-risk autonomous news intelligence. The
production path calls Gemini from `scripts/enrich-news.mjs` after the
deterministic news updater succeeds and only when a server-side API key is
configured. Gemini failures, quota errors, invalid JSON, or missing keys must
not block news updates.

Allowed Gemini tasks:

- classifying already-linked news items into existing signal categories;
- identifying duplicate or same-event news items;
- generating query expansion candidates for future feed discovery;
- generating an internal reviewer brief from already-linked news items;
- adding high-confidence signal tags to news items, without removing
  deterministic tags.

Any Gemini or equivalent extractor must follow the standing rule in
`CONTENT-STANDARDS.md`: never fabricate numbers or events; only extract what
sources explicitly state; use `null` for any field that is not confidently
verified from the cited source. Gemini must not write signal facts, clinical
guidance, PPE guidance, risk levels, source tiers, legal text, licensing text,
or public-health recommendations.

## Prohibited Uses

AI or enrichment tools must not:

- be cited as the authority for public-health claims;
- create or modify clinical guidance without qualified review;
- write structured signal facts directly to public files without validators and
  source attribution;
- publish model confidence as if it were authority confidence;
- expose API keys through `VITE_` variables or browser-side code;
- put provider errors, proxy failures, or enrichment diagnostics on the public
  dashboard.

## Required Before Any Future Integration

Before expanding Gemini, Bright Data, or similar services beyond low-risk news
enrichment:

- update this policy and the public About/Methodology disclosures;
- add server-side-only environment variables to `.env.example`;
- add validator or audit coverage for the new data path;
- ensure generated public output preserves original source attribution;
- document what the tool may read, what it may write, and what remains
  review-gated;
- keep all clinical and structured public-health fields tied to Tier 1 or Tier 2
  sources.
