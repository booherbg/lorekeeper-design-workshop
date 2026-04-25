#!/usr/bin/env bash
set -euo pipefail

HANDOFF="docs/PROMPTS/CURRENT-HANDOFF-PROMPT.md"

if [ ! -f "$HANDOFF" ]; then
  echo "No hand-off prompt found at $HANDOFF"
  echo "Run a session and close it properly to generate one."
  exit 1
fi

exec claude "$(cat "$HANDOFF")"
