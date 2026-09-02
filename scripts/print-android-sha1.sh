#!/usr/bin/env bash
# Print SHA-1 fingerprints for Firebase Google Sign-In setup.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID="$ROOT/android/app"

echo "Occasio Android signing fingerprints"
echo "Add ALL relevant SHA-1 values in Firebase Console → Project settings → Your apps → Android → Add fingerprint"
echo ""

if [[ -f "$ANDROID/debug.keystore" ]]; then
  echo "→ Debug (npm run android)"
  keytool -list -v -keystore "$ANDROID/debug.keystore" -alias androiddebugkey -storepass android -keypass android 2>/dev/null | rg "SHA1:"
fi

if [[ -f "$ANDROID/occasio-upload-key.keystore" ]] && [[ -f "$ROOT/android/keystore.properties" ]]; then
  # shellcheck disable=SC1091
  source <(grep -E '^(storePassword|keyPassword|keyAlias|storeFile)=' "$ROOT/android/keystore.properties" | sed 's/\r$//')
  STORE="$ANDROID/${storeFile:-occasio-upload-key.keystore}"
  if [[ -f "$STORE" ]]; then
    echo ""
    echo "→ Release upload key (local release APK/AAB)"
    keytool -list -v -keystore "$STORE" -alias "${keyAlias}" -storepass "${storePassword}" -keypass "${keyPassword}" 2>/dev/null | rg "SHA1:"
  fi
fi

echo ""
echo "→ Play App Signing (if installed from Play Store internal/closed testing)"
echo "  Play Console → Your app → Test and release → App integrity → App signing key certificate → SHA-1"
echo "  That SHA-1 is DIFFERENT from your upload key — you must add it to Firebase too."
