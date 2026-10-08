#!/usr/bin/env bash
# Re-captures the recipient experience + 3D props from the real docs-site.
# Run this only when the recipient UI changes. Serves a production build on :3112.
set -euo pipefail
cd "$(dirname "$0")"
(cd ../docs-site && npx next build --turbopack && (npx next start -p 3112 & echo $! > /tmp/occasio-next.pid))
sleep 6
node tools/capture-recipient.mjs
node tools/capture-gates.mjs
node tools/playthrough.mjs
node tools/capture-props.mjs
kill "$(cat /tmp/occasio-next.pid)" 2>/dev/null || true
python3 tools/prepare-screens.py
python3 tools/trim-props.py
echo "Captured. Now run ./build.sh (re-pick frames in tools/prepare-screens.py if you want different ones)."
