#!/usr/bin/env bash
# Redraw the app icon layers, then make every platform icon from them.
# The art lives in docs/store-assets/tools/icon-art.mjs; the platform files come from scripts/generate-app-icons.py.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node "$ROOT/docs/store-assets/tools/icon-final.mjs"
python3 "$ROOT/scripts/generate-app-icons.py"
