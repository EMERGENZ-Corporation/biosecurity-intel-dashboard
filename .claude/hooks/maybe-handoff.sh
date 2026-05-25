#!/usr/bin/env bash
# .claude/hooks/maybe-handoff.sh
# On session stop, remind the user that HANDOFF.md must reflect every meaningful
# change in the same commit — per the repo's saved handoff-discipline rule.

set -euo pipefail

# Detect any meaningful change in the last 30 minutes (excludes node_modules, .git,
# .claude/handoffs/, and the handoff log itself so a HANDOFF-only edit doesn't re-trigger).
RECENT=$(find . -type f -mmin -30 \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/.venv/*' \
  -not -path '*/dist/*' \
  -not -path '*/.claude/handoffs/*' \
  -not -name 'HANDOFF.md' \
  -print 2>/dev/null \
  | head -1 || true)

if [ -n "$RECENT" ]; then
  echo ""
  echo "Session ending with recent changes detected."
  echo ""
  echo "Reminders (per HANDOFF.md + saved feedback memory):"
  echo "  1. Every meaningful change to src/, scripts/, .github/workflows/, public/,"
  echo "     data files, build config, or user-visible text needs a HANDOFF.md entry"
  echo "     in the SAME commit."
  echo "  2. Work is not 'shipped' until commits are pushed to main."
  echo ""
  echo "Run '/handoff' to capture session state, then run handoff-discipline-agent"
  echo "to verify HANDOFF.md is correct before push."
fi

exit 0
