#!/usr/bin/env bash
# .claude/hooks/check-source-integrity.sh
# Block edits to source-attribution-sensitive files unless source-integrity-agent
# (or content-standards-agent, for curated fields) has been invoked this session.
#
# The agent is expected to write a marker file at .claude/.source-reviewed-this-session
# when it completes its review.

set -euo pipefail

# Paths considered source-/curated-sensitive in biosecurity-intel-dashboard.
SENSITIVE_PATHS=(
  "src/data/signal-sources.json"
  "src/data/sources.json"
  "src/data/signals.json"
  "src/data/news.json"
  "src/data/meta.json"
  "src/data/markers.json"
  "src/data/us-monitoring.json"
  "src/data/ems-briefing.json"
  "src/data/flights.json"
  ".source-fingerprints/"
  "AI-ENRICHMENT-POLICY.md"
  "CONTENT-STANDARDS.md"
)

# CLAUDE_FILE_PATHS is set by Claude Code with the files being touched.
TARGET="${CLAUDE_FILE_PATHS:-}"

if [ -z "$TARGET" ]; then
  exit 0
fi

for path in "${SENSITIVE_PATHS[@]}"; do
  if echo "$TARGET" | grep -q "$path"; then
    if [ ! -f ".claude/.source-reviewed-this-session" ]; then
      echo "BLOCKED: change touches source-attribution / curated-content path ($path)"
      echo "without source-integrity-agent or content-standards-agent review in this session."
      echo ""
      echo "Invoke the appropriate agent first:"
      echo "  - source-integrity-agent  → for sources.json, signal-sources.json, .source-fingerprints/"
      echo "  - content-standards-agent → for signals.json, meta.json, markers.json, us-monitoring.json, ems-briefing.json, flights.json, CONTENT-STANDARDS.md"
      echo "  - ai-enrichment-policy-agent → for AI-ENRICHMENT-POLICY.md"
      echo ""
      echo "The agent should write .claude/.source-reviewed-this-session when done."
      exit 1
    fi
  fi
done

exit 0
