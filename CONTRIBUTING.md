# Contributing to EMERGENZ Hantavirus Intel Dashboard

This dashboard is a public health intelligence tool maintained by EMERGENZ Systems. Contributions that improve accuracy, accessibility, and clinical utility are welcome.

---

## Ground rules

- **Accuracy first.** Every factual claim must be traceable to a primary source such as WHO, CDC, ECDC, a peer-reviewed publication, or an official government release. Do not add information from secondary or opinion media.
- **Cite everything.** If you add or update a marker, case count, protocol, or clinical fact, include the source URL and publication date.
- **No speculation.** This is an operational tool. Predictive content, opinion, or extrapolation beyond official statements must be clearly labelled or excluded.

---

## Getting started

```bash
git clone https://github.com/EMERGENZ-Corporation/hantavirus-intel-dashboard.git
cd hantavirus-intel-dashboard
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables for automation:

- `BRIGHT_DATA_API_KEY` - Bright Data Web Unlocker key for fallback source fetching
- `GEMINI_API_KEY` - Google Gemini key for AI-assisted extraction and summaries

---

## What to contribute

| Area | How |
|------|-----|
| Map markers | Edit `src/data/markers.json` and follow the existing schema. Multi-source markers use the `sources[]` array. |
| Case counts / stats | Prefer `src/data/manual-overrides.json` for urgent temporary corrections, or update `src/data/meta.json` with source provenance. |
| Clinical content | Edit `src/pages/Clinical.tsx` or `src/pages/PPE.tsx` and cite all claims. |
| Protocol links | Update `src/data/protocols.json` and source metadata. |
| Parser logic | Update `scripts/update-data.mjs` and add/adjust `npm run test:parsers` fixtures. |
| Bug fixes / UI | Open an issue first for significant changes. |

---

## Pull request checklist

- [ ] All new data has a source URL and date
- [ ] `npm run test:parsers` passes
- [ ] `npm run validate:data` passes
- [ ] `npm run build` passes without errors
- [ ] Accessible: interactive elements have labels and focus states work
- [ ] PR description explains what changed and why, not just what

---

## Data update policy

Static data should be updated only from official primary sources. If a source changes or expires, open an issue rather than removing the reference.

Automated refresh runs through `.github/workflows/update-data.yml` and `scripts/update-data.mjs`. The production app is a static Vite build; it does not depend on Vercel serverless API routes at runtime.

The updater also writes `public/status.json`, published at `https://andeshantavirus.emergenzsystems.org/status.json`. Use that file for uptime checks, freshness checks, and incident triage instead of scraping the dashboard UI.

---

## Questions

Open a GitHub issue or contact EMERGENZ Systems via the repository contact page.
