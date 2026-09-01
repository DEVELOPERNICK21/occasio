#!/usr/bin/env bash
# Regenerate iOS + Android launcher icons from assets/brand/app-icon-1024.png
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/brand/app-icon-1024.png"
IOS_DIR="$ROOT/ios/Occasio/Images.xcassets/AppIcon.appiconset"
ANDROID_RES="$ROOT/android/app/src/main/res"

if [[ ! -f "$SRC" ]]; then
  echo "Missing source icon: $SRC" >&2
  exit 1
fi

resize() {
  local size="$1"
  local out="$2"
  sips -z "$size" "$size" "$SRC" --out "$out" >/dev/null
}

echo "→ iOS AppIcon"
mkdir -p "$IOS_DIR"
resize 40  "$IOS_DIR/Icon-40.png"
resize 60  "$IOS_DIR/Icon-60.png"
resize 58  "$IOS_DIR/Icon-58.png"
resize 87  "$IOS_DIR/Icon-87.png"
resize 80  "$IOS_DIR/Icon-80.png"
resize 120 "$IOS_DIR/Icon-120.png"
resize 180 "$IOS_DIR/Icon-180.png"
cp "$SRC" "$IOS_DIR/Icon-1024.png"

cat > "$IOS_DIR/Contents.json" <<'EOF'
{
  "images": [
    { "filename": "Icon-40.png", "idiom": "iphone", "scale": "2x", "size": "20x20" },
    { "filename": "Icon-60.png", "idiom": "iphone", "scale": "3x", "size": "20x20" },
    { "filename": "Icon-58.png", "idiom": "iphone", "scale": "2x", "size": "29x29" },
    { "filename": "Icon-87.png", "idiom": "iphone", "scale": "3x", "size": "29x29" },
    { "filename": "Icon-80.png", "idiom": "iphone", "scale": "2x", "size": "40x40" },
    { "filename": "Icon-120.png", "idiom": "iphone", "scale": "3x", "size": "40x40" },
    { "filename": "Icon-120.png", "idiom": "iphone", "scale": "2x", "size": "60x60" },
    { "filename": "Icon-180.png", "idiom": "iphone", "scale": "3x", "size": "60x60" },
    { "filename": "Icon-1024.png", "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024" }
  ],
  "info": { "author": "xcode", "version": 1 }
}
EOF

echo "→ Android mipmaps"
for spec in "mdpi:48" "hdpi:72" "xhdpi:96" "xxhdpi:144" "xxxhdpi:192"; do
  folder="${spec%%:*}"
  size="${spec##*:}"
  dir="$ANDROID_RES/mipmap-$folder"
  mkdir -p "$dir"
  resize "$size" "$dir/ic_launcher.png"
  cp "$dir/ic_launcher.png" "$dir/ic_launcher_round.png"
done

mkdir -p "$ANDROID_RES/mipmap-anydpi-v26"
cat > "$ANDROID_RES/mipmap-anydpi-v26/ic_launcher.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF

cat > "$ANDROID_RES/mipmap-anydpi-v26/ic_launcher_round.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF

mkdir -p "$ANDROID_RES/values"
if ! grep -q ic_launcher_background "$ANDROID_RES/values/colors.xml" 2>/dev/null; then
  if [[ -f "$ANDROID_RES/values/colors.xml" ]]; then
    :
  else
    cat > "$ANDROID_RES/values/colors.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FDF6F2</color>
</resources>
EOF
  fi
fi

# Ensure colors.xml exists with background
cat > "$ANDROID_RES/values/colors.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FDF6F2</color>
</resources>
EOF

for spec in "mdpi:108" "hdpi:162" "xhdpi:216" "xxhdpi:324" "xxxhdpi:432"; do
  folder="${spec%%:*}"
  size="${spec##*:}"
  dir="$ANDROID_RES/mipmap-$folder"
  resize "$size" "$dir/ic_launcher_foreground.png"
done

echo "Done. Rebuild the app to see the new icon."
