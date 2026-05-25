#!/usr/bin/env bash
# .claude/hooks/check-secret-leak.sh
# Grep recently-modified files for common secret patterns.
# Exit non-zero (block) if matches found in any file the agent might have just written.

set -euo pipefail

PATTERNS='(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|hf_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[bapr]-[A-Za-z0-9-]+|-----BEGIN [A-Z ]+PRIVATE KEY-----)'

# Scan files modified in the last 5 minutes to keep the hook fast.
# Exclude vendored / build / fingerprint / handoff directories that may contain placeholders.
MATCHES=$(find . -type f -mmin -5 \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/.venv/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/.source-fingerprints/*' \
  -not -path '*/.claude/handoffs/*' \
  -not -name '.env.example' \
  -print0 2>/dev/null \
  | xargs -0 -r grep -lE "$PATTERNS" 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "BLOCKED: potential secret pattern found in:"
  echo "$MATCHES"
  echo ""
  echo "Run security-posture-agent before committing."
  echo "If this is a known false positive (e.g. a documentation example), tune the regex in .claude/hooks/check-secret-leak.sh rather than disabling the hook."
  exit 1
fi

exit 0
