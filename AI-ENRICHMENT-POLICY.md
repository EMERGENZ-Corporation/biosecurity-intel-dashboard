# AI and Enrichment Policy

This dashboard is source-backed first. AI systems and paid web-data tools may
support maintenance or review workflows, but they do not replace public health
authorities, clinical reviewers, source licenses, or the source registry.

## Current Live Status

- Gemini is not used by the live dashboard pipeline.
- Bright Data is not used by the live dashboard pipeline.
- No Gemini, Google Generative AI, Bright Data, or Web Unlocker API key is
  required to build, validate, deploy, or run the current dashboard.
- The active public writers are RSS/Google News keyword collection,
  `public/status.json` generation, static `/api/v1/` generation, production
  status monitoring, and official-source review alerts.

## Bright Data Decision

The dashboard does not need a Bright Data API key for the current architecture.
The current source model depends on official RSS feeds, registered public
authority URLs, Google News RSS search, source reachability audits, and manual
review for structured public-health fields.

Bright Data could become useful later for narrow enrichment jobs:

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
but they also increase cost, compliance, and attribution burden, so they should
be introduced only when a specific blocked-source problem justifies it.

References:

- https://docs.brightdata.com/scraping-automation/web-unlocker/introduction
- https://docs.brightdata.com/datasets/scrapers/overview

## Gemini Decision

Gemini is not currently doing anything in the live repository. There are no live
Gemini dependencies, workflows, source imports, or environment variables in the
current production path. Historical project standards mention Gemini because an
older dashboard expected possible automated extraction.

If Gemini or another model is reintroduced, it may only assist with reviewable
tasks such as:

- extracting candidate facts into a draft review artifact;
- summarizing source pages for analyst review;
- classifying already-linked items into dashboard signal categories;
- generating test fixtures or maintenance code.

Any Gemini or equivalent extractor must follow the standing rule in
`CONTENT-STANDARDS.md`: never fabricate numbers or events; only extract what
sources explicitly state; use `null` for any field that is not confidently
verified from the cited source.

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

Before adding Gemini, Bright Data, or similar services to the live pipeline:

- update this policy and the public About/Methodology disclosures;
- add server-side-only environment variables to `.env.example`;
- add validator or audit coverage for the new data path;
- ensure generated public output preserves original source attribution;
- document what the tool may read, what it may write, and what remains
  review-gated;
- keep all clinical and structured public-health fields tied to Tier 1 or Tier 2
  sources.
