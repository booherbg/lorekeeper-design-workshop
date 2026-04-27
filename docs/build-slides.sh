#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INPUT="$SCRIPT_DIR/slides.md"
OUTPUT="$SCRIPT_DIR/slides.html"

if ! command -v npx &> /dev/null; then
  echo "npx not found — install Node.js first"
  exit 1
fi

echo "Building slides..."
npx @marp-team/marp-cli "$INPUT" -o "$OUTPUT" --html
echo "Done: $OUTPUT"
