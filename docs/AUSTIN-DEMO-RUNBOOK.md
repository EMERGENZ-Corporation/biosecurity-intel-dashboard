# EMS World Briefing Runbook

Use this path for EMS World Live: Austin 2026 booth or hallway demos. Keep it short, source-backed, and operational.

## Open

1. Open `/ems-world-briefing`.
2. Clear the acknowledgment modal if it appears.
3. Confirm the page shows three anchors: Active operational briefings, FIFA 2026 signal, and Printable triage card.

## Live Click Path

1. Click **Start briefings**.
   - Say: "The dashboard turns active source-backed signals into operational briefings."
   - Open one briefing card and point to the visible source chip.

2. Return to `/ems-world-briefing`, then click **FIFA signal**.
   - Say: "FIFA 2026 is a preparedness signal, not an outbreak assertion."
   - Show mass-gathering, travel/importation, map markers, and EMS surge readiness.

3. Return to `/demo`, then click **Print triage card**.
   - The measles card opens in a new tab with the browser print dialog.
   - Cancel print for a live preview, or save as PDF if requested.
   - Point to the source footer, last-reviewed date, and operational-reference disclaimer.

4. If asked about freshness, open `/status`.
   - Use the curated signal data, latest news, and official source review clocks.

5. If asked where claims come from, open `/sources`.
   - Show the source-tier registry and explain that Tier 1/2 sources drive structured fields.

## Guardrails

- Do not describe the dashboard as diagnostic, predictive, or a clinical decision system.
- Do not improvise clinical recommendations from the triage card.
- Use "source-backed situational awareness" and "verify against linked guidance and local protocols."
- If Wi-Fi is unreliable, stay on `/ems-world-briefing`, the FIFA signal page, and the already opened triage card.

## Post-Event Removal (after 2026-05-30)

**Decision (2026-05-28):** After EMS World Live: Austin ends on 2026-05-30,
the `/ems-world-briefing` surface is **removed** from the dashboard — it has no
unique value-add over the standing dashboard (the FIFA signal, measles triage
card, and briefings all live at their own routes and are unaffected). This doc
is also removed at that time.

**Searchable marker in code:** `EMS_WORLD_2026_REMOVE_AFTER_2026-05-30`. Grep
for it to find every reference that needs deletion. The full removal checklist
is in the comment at the top of `src/pages/DemoPack.tsx`.

What survives removal (standing dashboard content, independent of this surface):

- `/signals/fifa-world-cup-2026-prep` — FIFA 2026 preparedness signal
- `/signals/measles-us-2026` and the printable triage card route
- `/briefings` — standing briefings page
- All data in `src/data/*.json`

This doc remains valid for the live Austin demos until 2026-05-30.
