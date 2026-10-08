#!/usr/bin/env bash
# Rebuilds every store graphic from src/ (no server needed).
# Needs: Node 22+, Python 3 + Pillow, and Chrome / Brave / Edge installed.
set -euo pipefail
cd "$(dirname "$0")"
node tools/build.mjs
node tools/feature-graphic.mjs
python3 tools/finalize.py >/dev/null
python3 tools/check-listing.py >/dev/null && echo "listing limits OK"
echo "Done → out/"
