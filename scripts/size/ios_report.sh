#!/bin/sh
# Where the bytes of a built iOS app are, and roughly what the IPA would be.
#
#   sh scripts/size/ios_report.sh path/to/Occasio.app
#
# Build an unsigned Release app to measure (no signing, no archive):
#   cd ios && xcodebuild -workspace Occasio.xcworkspace -scheme Occasio -configuration Release \
#     -sdk iphoneos -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build
# then look in ~/Library/Developer/Xcode/DerivedData/Occasio-*/Build/Products/Release-iphoneos/.
#
# The App Store sends each phone a thinned copy that is smaller than the IPA; for the exact figure,
# export from Xcode Organizer with "App Thinning: all compatible device variants" and read the
# App Thinning Size Report.
set -e
app="${1:?usage: ios_report.sh path/to/Occasio.app}"
kb() { du -sk "$1" | cut -f1; }
echo "App total: $(( $(kb "$app") / 1024 )) MB uncompressed"
echo
echo "By item (KB):"
for item in "$app"/*; do printf '%9s  %s\n' "$(kb "$item")" "$(basename "$item")"; done | sort -rn | head -12
echo
if [ -d "$app/Frameworks" ]; then
  echo "Frameworks (KB):"
  for item in "$app"/Frameworks/*; do printf '%9s  %s\n' "$(kb "$item")" "$(basename "$item")"; done | sort -rn | head -6
  echo
fi
main="$app/$(basename "$app" .app)"
[ -f "$main" ] && printf 'Main binary: %s MB (%s)\n' "$(( $(stat -f%z "$main") / 1048576 ))" "$(lipo -archs "$main" 2>/dev/null)"
[ -f "$app/main.jsbundle" ] && printf 'JS bundle:   %s KB\n' "$(( $(stat -f%z "$app/main.jsbundle") / 1024 ))"
if [ -d "$app/assets" ]; then
  echo
  echo "Bundled assets over 100 KB:"
  find "$app/assets" -type f -size +100k -exec stat -f '%z %N' {} + | sort -rn | awk '{printf "%9.0f KB  %s\n", $1/1024, $2}' | sed "s#$app/##"
fi
tmp="$(mktemp -d)"
( cd "$tmp" && mkdir Payload && cp -R "$app" Payload/ && /usr/bin/zip -qry app.ipa Payload )
printf '\nIPA (zipped app): about %s MB\n' "$(( $(stat -f%z "$tmp/app.ipa") / 1048576 ))"
rm -rf "$tmp"
