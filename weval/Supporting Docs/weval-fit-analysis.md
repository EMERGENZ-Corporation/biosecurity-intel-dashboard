# Weval Fit Analysis — EMERGENZ
**Date:** May 25, 2026  
**Prepared by:** EMERGENZ / Claude session  
**Subject:** Weval (weval.org) integration assessment across EMERGENZ programs

---

## What Is Weval

Weval is an open-source, community-built platform for creating and running qualitative AI model benchmarks. It allows contributors to publish evaluation suites (structured prompt + rubric sets), run them against multiple LLMs, and compare results on public leaderboards. Backed by the Collective Intelligence Project, with Anthropic and Microsoft as partners. 1,000+ contributors. No EMS or public safety domain coverage in current library.

---

## Programs Evaluated

| Program | Description |
|---|---|
| **EMERGENZ Core Stack** | Google Workspace, M365, Box, Slack, Monday.com, Notion, Zoho; AI division of labor established |
| **PRISM** | Local AI inference and RAG system; Ollama + Gemma on-prem; sensitive EMS operational data constraint |
| **STRATA / MHDDS** | CAD and emergency communications platform; Apache 2.0 engine; proprietary MHDDS taxonomy |
| **MERIDIAN** | Open-source EMS monitoring and data intelligence analytics network; Phase 1 not yet started |
| **Biosecurity Intelligence Dashboard** | Multi-threat public health intelligence platform for EMS/EM/public health; prerelease; data aggregation and display, verbatim sourced content, full attribution |

---

## Decision Matrix

| Program | Current Fit | Future Fit | Recommended Action |
|---|---|---|---|
| **Core Stack / AI Division of Labor** | None | None | No action. Model selection decisions are made. |
| **PRISM** | None | Low | PRISM is local-first with a fixed model set. Weval doesn't evaluate local inference pipelines. |
| **STRATA / MHDDS** | None | Moderate | If MHDDS is published as open-source, contributing a dispatch triage accuracy eval suite to Weval would support credibility positioning. 12–18 month horizon. |
| **MERIDIAN** | None | Moderate | Once Phase 1 is built and triage inference is validated, a public MERIDIAN eval suite on Weval is a viable open-source credibility move. Gated on Phase 1 completion. |
| **Biosecurity Dashboard (current)** | None | N/A | Dashboard is data aggregation and display with verbatim sourced content. No AI inference layer to evaluate. Weval is not applicable to this architecture. |
| **Biosecurity Dashboard (Phase 2 AI features)** | N/A | Strong | If/when AI-generated threat classification, summary synthesis, or clinical brief generation is added, build a Weval eval suite in parallel. Publish alongside the platform as part of open-source release. |

---

## Key Findings

**No current integration recommended across any EMERGENZ program.**

Weval evaluates model behavior in AI inference pipelines. The majority of EMERGENZ's current stack does not expose an AI inference layer that requires third-party benchmark evaluation. The biosecurity dashboard — the most plausible candidate — is currently a display and aggregation product with verbatim sourced content, not an AI synthesis product.

**One high-value future opportunity exists.**

When the biosecurity dashboard adds AI-generated content (threat classification, clinical brief synthesis, outbreak summarization), building a concurrent Weval evaluation suite would:

- Establish reproducible, third-party-verifiable accuracy standards for the AI layer
- Fill a genuine gap in Weval's library (no public health emergency intelligence evals exist)
- Signal rigor to biosecurity and public health funders
- Align with EMERGENZ's open-source credibility positioning across STRATA and MERIDIAN

**Contribution framing when the time comes:**  
Publish the eval suite as *EMERGENZ Biosecurity AI Accuracy Benchmark* alongside the platform's open-source release. Cite source fidelity (WHO/CDC/ECDC accuracy), hallucination resistance on case count and transmission data, and clinical language appropriateness for EMS-facing audiences as the three core evaluation dimensions.

---

## Decision

| Decision | Outcome |
|---|---|
| Integrate Weval now | **No** |
| Add to current roadmap | **No** |
| Flag for Phase 2 biosecurity AI features | **Yes** |
| Flag for STRATA/MERIDIAN open-source release | **Yes — 12–18 month horizon** |
