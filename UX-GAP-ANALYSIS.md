# UX / UX Gap Analysis & Adversarial Review

**Audit date:** 2026-05-22
**Scope:** Full dashboard — landing experience, navigation, signal detail, supporting pages.
**Method:** Information-architecture audit + adversarial walkthrough as each declared target user.

---

## 0. Empirical baseline (current state)

Numbers measured live, not estimated:

| Surface | Measurement |
|---|---|
| Overview page sections | 7 (Active briefings / Priority queue / Domain coverage / Data currency / News / Map / Timeline) |
| Above-the-fold interactivity | 0 buttons, 30 links — no obvious CTA |
| Signal detail (hantavirus) total scroll height | **77,838 px** |
| Viewport scrolls to reach the end of one signal | **60 viewport-heights** |
| Signal detail sections rendered | 13 (Summary, Current situation, Why it matters, Geography, Metrics, Timeline, Sources, 5 ContentBlocks, Data quality) |
| Top-nav items | 10 (Overview, Signals, Map, Timeline, Briefings, Resources, Sources, News, Status, About) |
| Active signals shown above the fold on Overview | 3 (briefing rail) |
| Click-through to find CDC EOC phone | 3 clicks: Overview → Signal → scroll to EMS section |
| Search affordance | None |
| Date-stamp on landing page | None (only inside `Data currency` card) |

This is **information-dense but not operator-friendly**. The dashboard reads like a structured archive, not an intelligence product.

---

## 1. Gap analysis — what's missing

### 1.1 Orientation & first-impression

| Gap | Why it matters |
|---|---|
| No hero "what this is, who it's for, what to do first" panel | A new user lands on counts and section headers with no narrative anchor. Drop-off risk is high. |
| No role-based entry ("EMS / EM / PH / HCW / Intel — start here") | Different users have radically different information needs; today everyone sees the same dashboard. |
| No "current as of" stamp visible above the fold | Operational users need to know data freshness immediately. Today it's buried in `Data currency`. |
| No global search | 16 signals, 80 sections, 500 news items, 37 sources, 41 timeline events — there is no way to jump to a topic. |
| No "what's changed since you last looked?" indicator | Repeat visitors get no differential view. |
| No onboarding pathway | Disclaimer modal blocks entry but offers no orientation. |

### 1.2 Operational rapid-scan (5-minute brief)

| Gap | Why it matters |
|---|---|
| Status strip leads with `Active signals: 14` — the least actionable number | The headline should be **what's at Action severity** and **what changed**, not the total count. |
| No "headline threat" hero card | The single most-important signal should be visually dominant on landing. Today, all signals look equal. |
| HCW alerts and Authority Risk badges live only on signal-detail pages | A user who never clicks in misses the most operationally urgent flags. |
| Active operational briefings rail caps at 3 | Concern + Action signals can exceed 3 — anything past 3 is silently hidden. |
| Briefing card preview cuts off the most operational content (phone numbers, PPE specs) | The 2-sentence summary lops off the actionable parts. |
| Map preview is below 4 other sections on Overview | Geo-driven dashboards should lead with the map for orientation. |
| No "where am I exposed?" / "regional" filter | A Texas user sees DRC Ebola at the same prominence as Texas-affected H5. |

### 1.3 Signal detail (drill-down)

| Gap | Why it matters |
|---|---|
| 60-viewport scroll height with no in-page navigation | Operators can't find a specific section without manual scroll. Critical info (phone numbers, PPE specs) is reached after multiple page-downs. |
| No table of contents / jump-to anchors | See above. |
| 13 sections rendered inline (uncollapsed) | Progressive disclosure (accordion / collapsed-by-default) would make scanning realistic. |
| Operational contact numbers not pinned | CDC EOC, state DOH lines are buried in section body text. Should be a fixed action strip. |
| No print/export-to-PDF | EMS captains, EOC briefers can't take this off-screen. |
| No "share this signal" / link-copy | Collaboration friction. |
| No "TL;DR" / one-paragraph executive summary above the long-form content | The `Summary` field is good but doesn't carry the operational verdict. |
| Metrics are static numbers — no trend, sparkline, or "vs last week" | A `38% CFR` number is much more useful with context. |

### 1.4 Information architecture

| Gap | Why it matters |
|---|---|
| 10-item top nav | At the upper limit of nav usability. Some items (`Resources` vs `Sources`) are easy to confuse. |
| `Resources` and `Sources` are nearly identical pages | Distinction is subtle — `Resources` is filtered, `Sources` is full registry with tier breakdown. Could merge or relabel. |
| `News` and `Timeline` overlap conceptually | Both are date-ordered streams. Different data sources, but the user doesn't know which to pick. |
| `Briefings` and `Overview > Active operational briefings` overlap | Same content; one is a subset of the other. |
| `Status` page exposes dashboard-health, not threat posture | Naming implies threat status; reality is plumbing. |

### 1.5 Actionability gaps

| Gap | Why it matters |
|---|---|
| No "Now do this" action card on signal detail | The PPE/protocols are described but not assembled into a 5-step operator workflow. |
| No printable case-definition card | An ED triage nurse cannot screenshot and post a one-pager. |
| No printable briefing PDF | Pre-shift briefings cannot be exported. |
| No bookmark / favorite signal | A user who tracks hantavirus weekly cannot pin it. |
| No alert subscription | RSS feed / email digest is absent. |

### 1.6 Visual hierarchy

| Gap | Why it matters |
|---|---|
| All cards/sections have equal visual weight | Important and routine content look the same. The user has to read to triage. |
| Severity color is used as a stripe but doesn't escalate the card's overall prominence | Action-severity cards should be visually dominant. |
| No animation / motion on changes | Operators visiting twice can't see deltas. |
| Density is uniform | Some sections (Geography, Sources & provenance) could collapse; others (HCW alert, briefings) deserve more vertical real estate. |

### 1.7 Analyst & intelligence-officer utility

| Gap | Why it matters |
|---|---|
| No data export (CSV / JSON download) | Analysts can't pull data into Excel / R / Python. |
| No public API endpoint described | `/status.json` exists but no documented schema for `/signals.json` etc. |
| No source-diversity indicator per signal | A signal corroborated by 5 Tier-1 authorities ≠ a signal from 1 ProMED entry. The dashboard treats them identically once `severity` is set. |
| No risk-level history (Δ over time) | When did WHO move from VERY LOW to LOW? Not visible. |
| No "watch indicators" / escalation triggers | What event would push H5 from `concern` to `action`? Not stated. |
| No competing-hypothesis or analytic-uncertainty surface | Intel rigor practice (ICD-203) is absent. |
| No relationship/network view across signals | H5 dairy + H5 humans + H5 wastewater are obviously linked; no cross-signal graph. |
| No "for further action / pass to JOC" workflow | A typical intel cycle ends with dissemination; this dashboard stops at display. |

### 1.8 Accessibility & mobile (partial — confirmed observations)

| Gap | Why it matters |
|---|---|
| Filter chip rows wrap but may stack awkwardly on phones | Operators in the field use phones first. |
| Map with 135 markers may be unusable on small screens | No mobile-first map UX (cluster markers, fullscreen). |
| Dense ContentBlock paragraphs are wall-of-text on narrow viewports | Reading on a 5" screen is hostile. |

---

## 2. Adversarial review — by persona

### 2.1 EMS paramedic
> "I have 30 seconds between calls. What do I do with this?"

| Friction | Severity |
|---|---|
| Landing page doesn't tell me which signals affect my region. I see DRC Ebola at the same prominence as Texas H5. | HIGH |
| To find the CDC EOC phone number for a suspected hantavirus case, I take 3 clicks and scroll 30 viewport-heights. | HIGH |
| No clinical decision support — I can't ask "febrile cruise-ship returner, what should I screen for?" | HIGH |
| Briefing card previews stop before the actionable bits (PPE specs, ECMO indications). | MEDIUM |
| No printable triage cheat-sheet I can post on the rig. | MEDIUM |
| No "EMS-relevant signals only" filter — I have to wade through wastewater dashboards I can't act on. | MEDIUM |
| No SMS / RSS alert when a new HAN drops for my region. | LOW |

**Verdict:** This dashboard would be a reference manual on a slow day, not a tool on shift.

### 2.2 Emergency manager (county/state preparedness)
> "I brief my director in 5 minutes."

| Friction | Severity |
|---|---|
| No "executive summary" / single-page brief. The Overview is good but still ~7 sections of mixed signal. | HIGH |
| No "what changed in the last 7 days" / weekly digest. I have to click through every signal to see deltas. | HIGH |
| Active briefings rail caps at 3, but a serious week could have 5+ concern-level signals. | MEDIUM |
| No agency-preparedness posture surface (PPE stock, vaccine availability, MOU activation). | MEDIUM |
| Timeline shows what happened, not what's projected. No "watch indicators" for escalation. | MEDIUM |
| No printable / shareable brief. I have to screenshot. | MEDIUM |

**Verdict:** Useful for analysts on my staff, not for the 5-minute director brief.

### 2.3 Public health analyst
> "I want raw data, charts, drill-down."

| Friction | Severity |
|---|---|
| No data export (CSV, JSON download). I can't pull this into Excel or R. | HIGH |
| No documented public API. `/status.json` exists; the rest of the schema isn't published. | HIGH |
| Metrics shown as static numbers, no epi curves, no trend lines, no CFR over time. | HIGH |
| Wastewater signals describe methodology but show no actual concentration curves. | HIGH |
| Sources tier system is good, but no way to filter signals by source diversity. | MEDIUM |
| No comparative views (compare 2 signals side by side). | MEDIUM |
| No links to GISAID, FluNet, ProMED archives. | MEDIUM |

**Verdict:** A starting point for context, not a tool for analysis.

### 2.4 Healthcare preparedness / infection prevention
> "What's coming, what PPE to stock, how to triage suspect cases."

| Friction | Severity |
|---|---|
| PPE specs are inside the `PPE & infection control` section — buried mid-page. No quick-access PPE inventory checklist. | HIGH |
| No facility-readiness self-assessment ("are you ready for X?"). | MEDIUM |
| Case definitions are embedded in prose, not extractable. | HIGH |
| CDC HAN advisories are linked but not displayed inline. | MEDIUM |
| No print-friendly clinical pathway cards. | HIGH |
| No quick comparison: Hantavirus vs Lassa — both VHF-like, PPE differs how? | MEDIUM |
| Specimen-handling guidance is mixed with clinical content. | MEDIUM |

**Verdict:** Useful reference if you have time to read; not a triage aid.

### 2.5 Nonprofit operational staff (humanitarian, logistics)
> "Where do I deploy, what risks, what supply chain?"

| Friction | Severity |
|---|---|
| No deployment planning view. I can't filter signals by "active outbreak zones with humanitarian access needs." | HIGH |
| No supply chain / countermeasure stockpile info. | MEDIUM |
| No partner organization references (MSF, IFRC, country MoH contacts). | MEDIUM |
| Cholera signal mentions ICG OCV stockpile but no current stockpile levels or requested-quantity tracking. | MEDIUM |

**Verdict:** Not designed for this user. Logistical depth is absent.

### 2.6 Medical intelligence officer
> "Rapid signal triage, attribution trace-back, anomaly detection."

| Friction | Severity |
|---|---|
| Severity / confidence / trend are categorical with no underlying methodology shown. ICD-203 estimative-language practice absent. | HIGH |
| No source-diversity score per signal (1 source ≠ 5 corroborating Tier-1 sources). | HIGH |
| No risk-history (Δ over time) — when did WHO change from VERY LOW to LOW? Not visible. | HIGH |
| No competing-hypothesis or analytic-uncertainty surface. The dashboard speaks in one voice; intel products should expose dissent. | HIGH |
| No "watch indicators" / escalation triggers per signal. | HIGH |
| No cross-signal relationship view (H5 dairy + H5 humans + H5 wastewater are obviously linked; no graph). | HIGH |
| No analytic gap callouts (where is evidence thin or conflicting?). | MEDIUM |
| No "single point of failure" indicator (if only ProMED is reporting, that's weaker than CDC + WHO + ECDC). | MEDIUM |
| No "for further action / handoff to JOC" workflow. | MEDIUM |
| No raw RSS-stream view per signal (news is global, not per-signal feed). | LOW |

**Verdict:** A polished status page, not an intel product. Would not satisfy ICD-203 / IC analytic standards.

---

## 3. Prioritized recommendations

Grouped by impact-per-effort. Each is a discrete shippable change.

### Tier 1 — first-impression / orientation (highest ROI)

1. **Hero "What is this?" panel above the stat strip** — 1-line value prop, 1-line "for whom," 1-line "what to do first." Replaces or precedes the current title. Includes prominent `Current as of` timestamp.
2. **Role selector** — chips at the top: `EMS · Emergency Mgmt · Public Health · Healthcare · Intel`. Each filters the dashboard's content emphasis. Persists in `localStorage`.
3. **Headline threat hero card** — the single highest-severity active signal gets a dominant card above the stat strip, with key numbers, severity pill, "View detail →".
4. **Global search bar** in the NavBar — search across signals, sections, news.
5. **"Changed in 7 days" badge** on signal cards when severity/risk-assessment moved in the last week.

### Tier 2 — operational rapid-scan

6. **Promote HCW alerts and Risk badges to the Overview** — currently only on signal detail.
7. **Briefing-rail card improvements**: pin contact phone numbers, PPE category, key action; remove the 3-card cap (show all concern+ signals scrollable).
8. **Reorder Overview** — move Map preview up to position 2 (after hero); push Threat domain coverage and Data currency below the fold.
9. **Regional filter** — "Show me signals affecting [region]". US state, country, WHO region.

### Tier 3 — signal-detail efficiency

10. **In-page table-of-contents / sticky nav** — left-rail jump-to for the 13 sections. Reduces 60-viewport-scroll problem.
11. **Fixed action strip** — pinned at top of signal detail: CDC EOC phone, state DOH lookup, "View full briefing PDF."
12. **Progressive disclosure** — collapse Sources, Timeline, Data quality by default; expand the 5 ContentBlocks on demand.
13. **TL;DR / Executive Verdict box** — 3-sentence operational verdict at the top of every signal.
14. **Print-to-PDF briefing button** — generates a single-page briefing per signal.
15. **Case-definition / triage card** — extractable, printable, posted-on-a-wall card.

### Tier 4 — analyst & intel rigor

16. **Data export** — `Download CSV` and `Download JSON` on every list/table.
17. **Public API documentation** — Status page lists the JSON contracts (`/signals.json`, `/news.json`, etc.).
18. **Source-diversity score per signal** — number of distinct Tier-1/2 authorities corroborating the current assessment. Display as a sub-score on the signal card.
19. **Risk-history chart** per signal — track risk-assessment changes over time.
20. **Watch-indicators block** in signal detail — explicit list of "if X happens, escalate to Y."
21. **Comparative view** — `/compare?signals=A,B` page showing two signals side-by-side.

### Tier 5 — networked intelligence (longer-horizon)

22. **Cross-signal relationship graph** — visualize how H5 dairy, H5 humans, H5 wastewater connect.
23. **Confidence methodology page** — document how severity / confidence / trend are assigned (ICD-203 alignment).
24. **Competing-hypothesis surface** — when assessments diverge between authorities, expose the dissent.
25. **Alert subscription** — RSS, email digest, webhook for signal-state changes.

---

## 4. Recommended first pass

If we ship **only items 1, 3, 4, 5, 10, 11, 13, 16** above, the dashboard moves from "comprehensive but undirected" to "operator-grade." Each is small-to-medium scope and independently testable. Combined, they address the dominant complaint across every persona: the user lands on the page and can't tell what they're looking at, what's important, or what to do.

If you'd like, I can convert any subset of these into discrete implementation tasks and execute one tier at a time.
