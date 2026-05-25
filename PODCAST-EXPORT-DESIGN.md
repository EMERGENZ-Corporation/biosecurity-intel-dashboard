# Podcast Export — Design Document

**Status:** APPROVED — §13 decisions locked 2026-05-25, §18 sign-off complete. Session 1 ready to begin on explicit go-signal.
**Authored:** 2026-05-23
**Approved:** 2026-05-25
**Scope:** Add a podcast export to the Briefings page so EMS, healthcare, and public-health staff can listen to current briefings on the move, with no paid services, no robotic-sounding voice, and no degradation of the dashboard's content-integrity standards.

> **Model recommendation per `AGENTS.md`:** Implementation touches CI/CD, generated public artifacts, AI/enrichment policy, public clinical content, and the autonomy contract. **A stronger reasoning model is required for the build phase.** This design doc itself is low-risk authoring and can be reviewed/edited on any model.

---

## 1. Goals and non-goals

### Goals

- Listenable, downloadable audio for every active **Watch+** briefing on the dashboard.
- A subscribable **daily combined episode** as a true podcast (Apple Podcasts, Spotify, Overcast).
- **Zero ongoing cost** to EMERGENZ — no per-character TTS billing, no premium voice, no paid email service.
- **Natural-sounding voice** — must clear the "this isn't a robot" bar for clinical audiences.
- **Content-equivalent** to what the page displays — no paraphrasing, summarization, or AI rewording.
- **Auditable** end-to-end — every published MP3 traceable to a commit SHA and source citations.

### Non-goals

- Multi-language audio (English only in v1).
- Voice-cloning a real EMERGENZ team member (avoidable rights/identity concerns).
- Interactive audio (Q&A, navigation between sections, etc.).
- Audio descriptions of map/network/timeline visualizations.
- Live/streaming audio.
- AI-generated narration, hosting personalities, or editorial commentary on top of source content.

---

## 2. Hard constraints

1. **No paid services.** Storage, generation, distribution, and email export must all use $0 free tiers we already use or that have no usage cliff.
2. **No paraphrasing.** The audio script is generated *deterministically* from `signals.json`. Any rewording, summarization, or AI-generated transitional language is **prohibited** — synthetic voice ≠ AI-generated content, and this distinction must hold in code, in audits, and in disclosure.
3. **Mandatory intro + outro disclaimers** on every MP3. Pipeline cannot publish without them; CI audit blocks publication if absent.
4. **Pronunciation lexicon required** for medical terminology. Reviewed entries only — no auto-generated phonetics.
5. **Retention: 7 days for daily episodes.** Older episodes are pruned by the same workflow that publishes new ones. Per-card MP3s are replace-in-place (one current file per signal). See §6.
6. **Content-equivalence guarantee.** What the audio says must match what the page says, with the audio adding only the citation read-aloud and the mandatory disclaimers.

---

## 3. Architecture overview

```
                        ┌─────────────────────┐
                        │  signals.json       │
                        │  (source of truth)  │
                        └──────────┬──────────┘
                                   │
                                   ▼
                  ┌────────────────────────────────┐
                  │  scripts/generate-podcast-     │
                  │  script.mjs                    │
                  │                                │
                  │  - Read approved fields only   │
                  │  - Apply lexicon substitutions │
                  │  - Emit deterministic script + │
                  │    expected duration + hash    │
                  └──────────┬─────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                              ▼
      ┌───────────────┐              ┌───────────────┐
      │ Per-card MP3  │              │ Daily combined│
      │ (1 per signal)│              │ episode       │
      └───────┬───────┘              └───────┬───────┘
              │                              │
              ▼                              ▼
   ┌──────────────────────────────────────────────────┐
   │  TTS engine: Kokoro-82M on GHA CPU runner        │
   │  - Reads lexicon-preprocessed script             │
   │  - Concatenates: intro.wav + body + outro.wav    │
   │  - Encodes to MP3 (64 kbps mono)                 │
   └──────────────────────────┬───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  audit:podcast        │
                  │  (CI gate)            │
                  └──────────┬────────────┘
                             │ pass
                             ▼
              ┌──────────────────────────────┐
              │  Vercel Blob upload          │
              │  - Predictable URLs          │
              │  - 7-day pruning of episodes │
              └──────────┬───────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                  ▼
┌──────────────────┐               ┌──────────────────┐
│ manifest.json    │               │ feed.xml (RSS)   │
│ (committed)      │               │ (regenerated)    │
└────────┬─────────┘               └────────┬─────────┘
         │                                   │
         ▼                                   ▼
   Briefings page UI                Apple/Spotify/Overcast
   (Listen, Download, Email)        (subscribe)
```

---

## 4. TTS engine selection

**Choice: Kokoro-82M** (Apache 2.0, 82M params, December 2024 release).

| Criterion | Kokoro-82M | Piper TTS | Edge TTS (unofficial) | Cloudflare AI MeloTTS |
|---|---|---|---|---|
| License | Apache 2.0 | MIT | Microsoft TOS (gray area) | Cloudflare TOS |
| Cost | $0 forever | $0 forever | $0 (fragile) | $0 within 10k neurons/day |
| Naturalness | Strong | Acceptable | Excellent | Decent |
| Medical-term handling | Acceptable with lexicon | Weak | Good | Acceptable |
| Runs on free GHA CPU | ✅ ~3-5 min/episode | ✅ ~1-2 min | n/a (API call) | n/a (API call) |
| Long-term stability | High (open weights) | High (open weights) | Low (unofficial endpoint) | Medium (vendor) |

Kokoro is the only option that combines **naturalness**, **zero ongoing cost**, **license clarity**, and **on-prem control** (no vendor dependency). The lexicon (§5) is what closes the medical-terminology gap.

**Specifications:**
- Model: `kokoro-82M` from Hugging Face
- Voice: single fixed voice for brand consistency. Recommended: `af_bella` (clear, neutral, broadcast-style). **Open decision — see §13.**
- Output format: 64 kbps mono MP3 (podcast standard for voice)
- Sample rate: 24 kHz (Kokoro native)

---

## 5. Pronunciation lexicon

`src/data/tts-lexicon.json` — handcrafted phonetic mappings for medical terminology that off-the-shelf TTS engines mispronounce.

**Schema:**

```json
[
  {
    "term": "Bundibugyo",
    "phonetic": "bun-dee-BOO-gyoh",
    "source": "WHO Ebola Bundibugyo Q&A 2026",
    "addedBy": "<curator>",
    "addedOn": "2026-05-23"
  },
  {
    "term": "Koplik",
    "phonetic": "KOP-lik",
    "source": "Merriam-Webster Medical 2024",
    "addedBy": "<curator>",
    "addedOn": "2026-05-23"
  }
]
```

**Rules:**
- Every entry must cite a source. No auto-generated phonetics.
- Subject-matter expert (SME) review required for every new entry. The validator must confirm provenance fields are populated.
- Validator: every lexicon term must appear in at least one current briefing — no dead entries, no unauthorized future additions.
- Lexicon is preprocessed into the script before TTS — the model sees the phonetic representation, listeners hear the correct pronunciation.

**Seed list (initial ~80 terms):** derived from a static analysis of all current `bodyMarkdown` content in `signals.json`. Owner: clinical reviewer (SME). **Open decision — see §13.**

---

## 6. Storage and retention

### Storage tier
**Vercel Blob (1 GB free tier).** With 7-day retention (§6.2), steady-state footprint is approximately:

- Per-card MP3s (16 signals × ~1 MB): 16 MB
- Daily combined episodes (7 × ~15 MB): 105 MB
- Intro/outro WAV assets: <1 MB
- **Total: ~122 MB (12% of free tier)**

Cloudflare R2 was considered (10 GB free) but is not necessary at 7-day retention. Reassess if retention extends or per-card audio length grows substantially.

### Retention policy

- **Daily combined episodes:** keep last **7 days**, prune older. Same GHA workflow that publishes new episodes runs the pruner.
- **Per-card MP3s:** replace in place. One file per signal, always reflecting current text. When a signal is archived/closed, its MP3 is deleted within 24h.
- **Intro/outro WAV assets:** committed to `public/podcast/assets/` in the repo, version-controlled.

### Manifest
`public/podcast/manifest.json` — committed to the repo. Lists current published MP3s with their Blob URLs, generation timestamps, content hashes, and source script hashes. The RSS feed and Briefings UI both read from this manifest. The audit gate (§9) validates manifest consistency.

### URL structure
```
https://blob.vercel-storage.com/podcast/<account>/
    cards/<signal-id>.mp3                     (replace in place)
    daily/<YYYY-MM-DD>.mp3                    (7-day rolling)
    assets/intro-v1.wav                       (committed to repo, not Blob)
    assets/outro-v1.wav                       (committed to repo, not Blob)
```

---

## 7. Script generation (content-equivalence guarantee)

`scripts/generate-podcast-script.mjs` produces a deterministic, source-derived script. **No model is in the loop.** It is mechanical transcription.

### Per-card script structure

```
[INTRO]
  — pre-recorded intro WAV (5-8 sec)

[HEADER]
  "<Signal name>. Severity: <severity label>. Category: <category label>.
   Geography: <primary geography>."

[OPERATIONAL RELEVANCE]
  Verbatim from signal.operationalRelevance

[DETAIL SECTION]
  "<Section title>."
  Verbatim from signal.detailSections[<picked>].bodyMarkdown,
  with markdown stripped (links → bare URLs read as
  "see the linked source"; bold/italic → ignored).

[ATTRIBUTION]
  "This section is sourced from <authority>, <document title>,
   dated <date>."

[OUTRO]
  — pre-recorded outro WAV (10 sec)
```

### Daily combined episode structure

```
[INTRO]
  — pre-recorded daily intro WAV with date insertion

[OVERVIEW]
  "Today's briefing covers <N> active signals at Watch level or above."

[FOR EACH Watch+ SIGNAL, sorted by severity then ranking]
  <per-card script content above, minus its own intro/outro>

[CLOSING]
  "For the full briefing with linked sources, visit
   biosecurity-intel.emergenzsystems.org/briefings."

[OUTRO]
  — pre-recorded outro WAV
```

### Hard rules

- The script generator may **strip markdown formatting** (bold, italic, links, headers).
- The script generator may **add structural connective tissue** that is purely identifying (section titles read aloud, "Severity:" prefix, etc.).
- The script generator **may not** paraphrase, summarize, abbreviate, expand, or otherwise transform clinical content.
- The script generator **may not** call any AI service for any reason.
- A SHA-256 hash of the final script is recorded in the manifest. The audit gate re-derives the script from current `signals.json` and verifies the hash matches.

---

## 8. Mandatory disclaimers (intro/outro)

Pre-recorded WAV files committed to `public/podcast/assets/`. Generated once by Kokoro (with a separately approved disclaimer script), reviewed by SME, then frozen. Versioned (`intro-v1.wav`, `outro-v1.wav`) — bumping the version is a deliberate review step.

### Intro (per-card and daily combined)

> "This is an EMERGENZ Biosecurity Intelligence briefing. Synthetic voice. Generated from publicly available sources. This is not medical advice."

(~8 seconds)

### Outro (per-card and daily combined)

> "Verify all clinical guidance against the linked source documents. EMERGENZ does not provide medical advice. Full methodology and source citations at emergenzsystems.org."

(~10 seconds)

### Date insertion (daily combined only)

A short TTS-generated date stub is inserted between the intro and the overview: "Briefing for May 23, 2026." This is the only TTS in the disclaimer slots; the fixed phrase before and after the date is pre-recorded.

### Enforcement

The audit gate (§9) verifies every published MP3 has:
- Duration ≥ (intro_duration + outro_duration + 5s body)
- Audio fingerprint matching the committed intro at offset 0
- Audio fingerprint matching the committed outro at offset (duration - outro_duration)

If either fails, the MP3 is rejected and not uploaded. The pipeline alerts via the existing news-pipeline-issue mechanism.

---

## 9. Audit and validation (`audit:podcast`)

New script: `scripts/audit-podcast.mjs`. New npm script: `npm run audit:podcast`. Wired into:
- `.github/workflows/ci.yml` — runs on push and PR
- `scripts/audit-autonomy.mjs` — adds `audit:podcast` to the autonomy contract
- `scripts/generate-status.mjs` — adds podcast pipeline state to `/status.json`

### Audit checks

1. **Script equivalence** — re-derive scripts from current `signals.json`; compare SHA-256 hashes against the manifest. Fail if any divergence.
2. **Disclaimer presence** — for every MP3 in the manifest, verify intro + outro by audio fingerprint at expected offsets.
3. **Retention enforcement** — no daily episode in the manifest may be older than 7 days. No per-card MP3 may reference an archived/deleted signal.
4. **Lexicon integrity** — every lexicon entry has all required provenance fields. Every term appears in at least one current briefing.
5. **RSS conformance** — feed.xml parses as valid iTunes-spec podcast XML. Every `<enclosure>` URL returns HTTP 200 with `Content-Type: audio/mpeg`.
6. **Disclosure presence** — `AI-ENRICHMENT-POLICY.md` contains the synthetic-voice section. `CONTENT-STANDARDS.md` contains the synthetic-audio section. Methodology and About pages contain the public disclosure block. (Same audit pattern as the existing AI-enrichment disclosure check.)

### Failure handling

Mirrors the existing `update-news` pipeline alerts. A failed audit:
- Blocks the publish step in the GHA workflow
- Opens (or comments on) a reusable `[PIPELINE ALERT] Podcast pipeline failed` issue
- Surfaces in `/status.json` under `monitors.podcastPipeline`

---

## 10. Distribution

### Download (Briefings page UI)
Each Watch+ briefing card gets two buttons next to the existing "Read full briefing →" link:
- **▶ Listen** — inline `<audio>` element streams the per-card MP3
- **↓ MP3** — direct download

A top-of-page block for the daily combined episode:
```
🎧 TODAY'S COMBINED BRIEFING · 14 min · Updated 06:00 UTC
   [▶ Play]  [↓ Download MP3]  [📧 Email link]  [📡 Subscribe]
```

### Email
The "📧 Email link" button opens a `mailto:` link:
```
mailto:?subject=EMERGENZ%20Daily%20Briefing%20—%202026-05-23&body=<link to MP3 on Vercel Blob>%0A%0A<3-line description>
```

No email service vendor required. User attaches the MP3 themselves if they wish (rather than embedding via attachment, which `mailto:` cannot do).

### RSS / Podcast subscription
`public/podcast/feed.xml` — regenerated by the workflow from the manifest. Conforms to iTunes podcast spec:
- `<itunes:author>EMERGENZ Medical Intelligence Unit</itunes:author>`
- `<itunes:explicit>false</itunes:explicit>`
- `<itunes:category>` News > Health News
- `<itunes:summary>` includes synthetic-voice disclosure
- `<itunes:image>` references a 3000×3000 JPEG committed to `public/podcast/assets/artwork.jpg`
- Every `<item>` has `<enclosure url="..." type="audio/mpeg" length="..."/>`
- `<pubDate>` and `<itunes:duration>` populated from manifest

Subscription URL exposed in the UI as:
- "📡 Subscribe in podcast app" → opens `podcast:` deep link OR copies the feed URL to clipboard with a toast

Apple/Spotify directory submission is a separate operational step (one-time), not part of the automated pipeline.

---

## 11. UI changes

### Briefings page (`src/pages/Briefings.tsx`)

1. Top-of-page banner for the daily combined episode (above the filter group).
2. Per-card audio controls inside each `BriefingCard`:
   - "▶ Listen (2:14)" pill button → expands inline `<audio>` element
   - "↓ MP3" pill button → direct download link
   - Both styled to match the existing `intel-pill is-button` pattern.
3. Small "🔊 Synthetic voice" badge near the audio controls, linking to the methodology page anchor for synthetic-voice disclosure.

### Methodology page (`src/pages/MethodologyPage.tsx`)

New section: **Synthetic audio briefings.** Explains:
- Voice is generated by an open-weight TTS model (Kokoro-82M).
- Content is read verbatim from source-cited briefings.
- Pronunciation lexicon for medical terminology.
- Mandatory disclaimers.
- 7-day episode retention.
- Audio is advisory only, never source-of-record.

### About page (`src/pages/AboutPage.tsx`)

Cross-link to the methodology synthetic-audio section, mirroring the existing pattern for Gemini/Bright Data disclosure.

---

## 12. Content and authoring standards updates

### `CONTENT-STANDARDS.md` — new section

**"Synthetic audio output"**

- Script source: read-only `signals.json` content via `scripts/generate-podcast-script.mjs`.
- Permitted transformations: markdown stripping, structural prefixes (section titles, severity labels), citation read-aloud, pre-recorded disclaimers.
- Prohibited transformations: paraphrasing, summarization, expansion, AI rewording, editorial commentary, voice cloning of real persons.
- Lexicon entries require source citation, SME review, and provenance fields.
- Intro/outro disclaimers are mandatory and audio-fingerprint enforced.
- Audio is advisory only — never source-of-record. The page is the source-of-record.

### `AI-ENRICHMENT-POLICY.md` — new section

**"Synthetic voice"**

- The voice is generated; the content is not.
- Mechanical transcription, categorically different from AI-generated narration — like braille output or a screen reader.
- Hard prohibition on AI rewording, summarization, or editorial generation in the script pipeline.
- `audit:podcast` enforces the boundary and is part of the autonomy contract.

---

## 13. Open decisions — LOCKED 2026-05-25

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | Voice | **`af_bella`** — neutral American Female, broadcast-style. Closest Kokoro voice to NPR news-anchor tone. |
| 2 | Generation cadence | **06:00 UTC daily** — aligned with news pipeline freshness; lands before US East Coast morning briefings. |
| 3 | Intro/outro voicing | **Kokoro, fixed voice** (same `af_bella`). Synthetic-voice intro reinforces the disclosure; human intro could imply human narration of the body. Versioned (`intro-v1.wav`, `outro-v1.wav`). |
| 4 | Lexicon seed + SME | **Self-SME for v1**, AND new tooling: `scripts/build-lexicon-seed.mjs` will scan `signals.json` `bodyMarkdown` + signal names + clinical terminology and emit a candidate lexicon to `src/data/tts-lexicon-candidates.json`. Self-SME reviews each candidate (provenance + phonetic), promotes approved entries into `src/data/tts-lexicon.json`. Validator enforces provenance fields on the promoted file only. |
| 5 | RSS metadata | Title: **`EMERGENZ Biosecurity Briefing`**. Author: **`EMERGENZ Corporation`** (changed from "Medical Intelligence Unit"). Category: **News > Health News**. Artwork: placeholder EMERGENZ wordmark on brand color, upgrade later. **`<itunes:summary>` carries the authorship + synthetic-voice disclaimer matching CONTENT-STANDARDS** — synthetic voice, source-cited, advisory only, not source-of-record, verify all clinical guidance against linked sources. |
| 6 | Apple / Spotify directory submission | After **14 consecutive green `audit:podcast` runs** (~2 weeks of stable daily episodes). Operational step, not part of automated pipeline. |
| 7 | Per-card audio | **Pre-generate.** ~16 MB total; matches Vercel Blob retention design; instant availability for EMS in-rig use case. |
| 8 | Filtered podcast download | **No in v1.** Combined episode is always full Watch+. Filtering requires on-demand generation, contradicts §7. |

---

## 14. Build plan (multi-session)

This is too large for one session. Proposed sequence, each session ending with a green CI run and a HANDOFF entry:

**Session 1 — Foundations**
- `scripts/generate-podcast-script.mjs` (deterministic, no TTS yet — emits JSON scripts to disk for review)
- `scripts/build-lexicon-seed.mjs` (new per §13 #4 lock) — scans `signals.json` content + signal names, derives candidate medical terms, writes `src/data/tts-lexicon-candidates.json`. Self-SME promotes approved entries (with phonetic + source citation) into `src/data/tts-lexicon.json`.
- `src/data/tts-lexicon.json` (initially small; grows from self-SME promotions over time)
- Validator additions in `scripts/validate-data.mjs` for the promoted lexicon (provenance, every term appears in current briefings)
- New sections in `CONTENT-STANDARDS.md` and `AI-ENRICHMENT-POLICY.md`
- No CI changes yet
- No TTS yet

**Session 2 — TTS pipeline**
- Kokoro-82M integration script (`scripts/render-podcast-audio.mjs`)
- Pre-recorded intro/outro WAV assets
- Local-only audio generation (no upload yet)
- Pronunciation review with SME

**Session 3 — Storage and manifest**
- Vercel Blob integration
- `public/podcast/manifest.json` schema and generator
- `public/podcast/feed.xml` RSS generator
- Retention/pruning logic

**Session 4 — Audit and CI**
- `scripts/audit-podcast.mjs`
- New GHA workflow (`.github/workflows/render-podcast.yml`)
- Wire into `audit:autonomy` and `generate:status`
- Pipeline alert issue scaffolding

**Session 5 — UI**
- Briefings page audio controls
- Methodology page synthetic-audio section
- About page cross-link
- "Synthetic voice" badge

**Session 6 — Stabilization and directory submission**
- Two-week soak period for daily episodes
- Apple Podcasts Connect / Spotify for Podcasters submission
- Production monitor for podcast pipeline freshness

Each session ends with required verification (`test:validators`, `validate:data`, `build`, `audit:podcast` once it exists), a HANDOFF entry in the same commit, and a push to main.

---

## 15. Out of scope (v1)

- Multi-language audio
- Per-card filter-aware downloads (severity/category)
- Voice cloning
- Listener analytics / subscription counts
- In-app podcast player UI beyond a simple `<audio>` element
- Audio descriptions for visual content (map, network, timeline)
- Push notifications when new episodes drop
- Comments, transcripts as separate files (the page itself is the transcript)

---

## 16. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TTS mispronounces critical medical term | Medium | High (credibility) | Pronunciation lexicon + SME review + listener feedback channel |
| Synthetic voice perceived as AI-generated content | Medium | High (policy) | Clear public disclosure; intro/outro disclaimers; `audit:podcast` enforcement |
| Vercel Blob 1 GB limit exceeded | Low at 7d retention | Medium | Audit enforces retention; alert threshold at 80% of quota |
| Kokoro-82M deprecated or weights unavailable | Low | Medium | Open weights are mirrored; Piper is a fallback engine |
| RSS feed rejected by Apple/Spotify | Medium | Low | Conformance audit before submission; both directories accept resubmission |
| Daily generation workflow fails silently | Medium | Medium | Pipeline alert mirrors news workflow; status monitor surfaces stale episodes |
| Listener acts on audio without verifying source | Always present | High | Mandatory disclaimers; UI badge; advisory-only positioning |

---

## 17. Required reading before approval

- `AGENTS.md` — model selection policy
- `CONTENT-STANDARDS.md` — source attribution and authorship requirements
- `AI-ENRICHMENT-POLICY.md` — current AI/enrichment policy this design extends
- `HANDOFF.md` — recent context including the AI-disclosure audit and Bright Data integration

---

## 18. Sign-off needed

Before any code in this design lands on main, the following must be locked:

1. ✅ This design doc reviewed and approved by EMERGENZ (locked 2026-05-25).
2. ✅ Open decisions §13 resolved (see table above; all 8 locked 2026-05-25).
3. ✅ SME identified for lexicon curation and intro/outro voicing approval — **self-SME for v1**, supported by the new `build-lexicon-seed.mjs` tool that auto-derives candidate terms from `signals.json`.
4. ✅ Confirmation that a stronger reasoning model will be used for Sessions 1-6 — **`claude-opus-4.7-1m`** (current session model) per AGENTS.md halt-list.

All four satisfied. **Session 1 ready to begin on explicit go-signal.**
