# Contributing to EMERGENZ Hantavirus Intel Dashboard

This dashboard is a public health intelligence tool maintained by EMERGENZ Systems. Contributions that improve accuracy, accessibility, and clinical utility are welcome.

---

## Ground rules

- **Accuracy first.** Every factual claim must be traceable to a primary source (WHO, CDC, ECDC, peer-reviewed publication, or official government release). Do not add information from secondary or opinion media.
- **Cite everything.** If you add or update a marker, case count, protocol, or clinical fact, include the source URL and publication date.
- **No speculation.** This is an operational tool. Predictive content, opinion, or extrapolation beyond official statements must be clearly labelled or excluded.

---

## Getting started

```bash
git clone https://github.com/EMERGENZ-Corporation/hantavirus-intel-dashboard.git
cd hantavirus-intel-dashboard
npm install
cp .env.example .env.local   # fill in your API keys for local development
npm run dev
```

Required environment variables (see `.env.example`):
- `BRIGHT_DATA_API_KEY` — Bright Data Web Unlocker key for CDC scraping
- `GEMINI_API_KEY` — Google Gemini 2.0 Flash key for AI summaries

---

## What to contribute

| Area | How |
|------|-----|
| Map markers | Edit `src/data/markers.json` — follow the existing schema. Multi-source markers use the `sources[]` array. |
| Case counts / stats | Update `STATIC_DATA` in `src/pages/Dashboard.tsx` and note the source + date in the PR description. |
| Clinical content | Edit `src/pages/Clinical.tsx` or `src/pages/PPE.tsx` — cite all claims. |
| Protocol links | Update the `PINNED_PROTOCOLS` array in `api/feeds.ts`. |
| Bug fixes / UI | Open an issue first for significant changes. |

---

## Pull request checklist

- [ ] All new data has a source URL and date
- [ ] `npm run build` passes without errors
- [ ] No `console.log` left in production paths
- [ ] Accessible: interactive elements have labels, focus states work
- [ ] PR description explains *what changed and why*, not just *what*

---

## Data update policy

Static data (case counts, markers) should be updated only from official primary sources. If a source changes or expires, open an issue rather than removing the reference.

Automated refresh (`api/refresh.ts`) supplements static data — it does not replace it. Static data is the authoritative baseline.

---

## Questions

Open a GitHub issue or contact EMERGENZ Systems via the repository contact page.
