# Copy / Plagiarism Monitoring

This repo is public. Current code is **AGPL-3.0** + a commercial license (see
[`LICENSE`](LICENSE) / [`COMMERCIAL-LICENSE.md`](COMMERCIAL-LICENSE.md)); curated
content is **CC BY-SA 4.0** ([`LICENSE-DATA.md`](LICENSE-DATA.md)). Lawful reuse
is permitted **with** attribution. What to watch for:

1. **Reuse that strips the AGPL / EMERGENZ attribution** (LICENSE, NOTICE, or the
   SPDX file headers removed), and
2. **Commercial deployment without a commercial license.**

**Last full sweep:** 2026-05-31 — **0 indexed unattributed copies found** across
12 maximum-distinctiveness fingerprints.

## Monthly check (~2 min)

A hit **outside** `github.com/EMERGENZ-Corporation` or an emergenz-owned domain
is a likely unattributed copy.

### GitHub code search — https://github.com/search?type=code
- `"biosecurity-intel.emergenzsystems.org" -org:EMERGENZ-Corporation`
- `"support-the-biosecurity-intelligence-dashboard" -org:EMERGENZ-Corporation`
- `"Multi-threat severity is not the same as clinical severity" -org:EMERGENZ-Corporation`

### Web search (Google/Bing — paste with the quotes)
- `"derived from the EMERGENZ hantavirus-intel-dashboard template and preserves its resilience patterns"`
- `"Multi-threat severity is not the same as clinical severity"`
- `"give users a scan-first operational view of what is happening, what changed, what matters"`

> A hit on the **Zeffy donation URL** or **emergenzsystems.org** in someone
> else's repo is near-certain proof of a stripped-attribution copy — those
> strings have no legitimate reason to appear elsewhere.

## If you find a copy

1. **Preserve evidence first** — screenshot the page/repo, save the URL, note the
   date/time, and archive/download the files before contacting anyone.
2. **Classify it** — compare against our commit history and check whether the
   `LICENSE` / `NOTICE` / SPDX headers were removed (AGPL violation) or whether
   it is a commercial deployment (needs a commercial license).
3. **Escalate** — a polite attribution/compliance request first; then GitHub's
   DMCA / AGPL-enforcement process if unresolved. Route commercial-licensing
   conversations to info@emergenz.us.

> **Forward-only caveat:** snapshots distributed under the prior MIT license stay
> MIT for whoever already had them. Enforcement here applies to copies of the
> **AGPL-era** code that strip attribution, not to pre-relicense MIT clones.

## Automated monitor

A scheduled monthly agent is intended to re-run this search set automatically.
Setup via Claude Code's `/schedule` was attempted on 2026-05-31 but the remote
scheduling backend was unavailable — **until the routine is confirmed active,
rely on the manual monthly check above.** Re-attempt with `/schedule` (the task
spec uses the strings in this file). **This file is the source of truth for the
strings the monitor checks** — if the distinctive strings change (e.g. the
deployment URL or donation link), update them here and in the scheduled task.
