#!/usr/bin/env python3
"""Make every platform icon from the layers in assets/brand/.

Layers (drawn by docs/store-assets/tools/icon-final.mjs):
  app-icon-1024.png        full icon, opaque
  android-foreground.png   Pip + badge on transparent
  android-monochrome.png   one-colour silhouette for Android 13 themed icons
  notification-glyph.png   Pip's head and hat, white on transparent

Writes: the iOS AppIcon set (opaque, no alpha), the Android adaptive / legacy / round / monochrome
icons and notification icon, the store copies, and the website favicon. Run from the repo root:
    python3 scripts/generate-app-icons.py
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / 'assets/brand'
IOS = ROOT / 'ios/Occasio/Images.xcassets/AppIcon.appiconset'
RES = ROOT / 'android/app/src/main/res'
LANCZOS = Image.LANCZOS

# Android shows only a circle in the middle of the 108dp adaptive canvas (72dp visible, 66dp safe).
# Fit the artwork so nothing important is cut: the safe radius is 313px of 1024, the visible one 341.
ADAPTIVE_FIT_RADIUS = 330
DENSITIES = {'mdpi': 1.0, 'hdpi': 1.5, 'xhdpi': 2.0, 'xxhdpi': 3.0, 'xxxhdpi': 4.0}


def opaque(path: Path) -> Image.Image:
    return Image.open(path).convert('RGB')


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)


def squircle_mask(size: int, radius_share: float) -> Image.Image:
    big = 4
    mask = Image.new('L', (size * big, size * big), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size * big - 1, size * big - 1), radius=int(size * big * radius_share), fill=255
    )
    return mask.resize((size, size), LANCZOS)


def circle_mask(size: int) -> Image.Image:
    big = 4
    mask = Image.new('L', (size * big, size * big), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * big - 1, size * big - 1), fill=255)
    return mask.resize((size, size), LANCZOS)


def solid_bbox(layer: Image.Image, threshold: int = 128):
    return layer.getchannel('A').point(lambda v: 255 if v >= threshold else 0).getbbox()


def reach(layer: Image.Image, cx: float, cy: float, threshold: int = 128) -> float:
    """Farthest solid pixel from (cx, cy)."""
    alpha = layer.getchannel('A').load()
    far = 0.0
    for y in range(0, layer.height, 2):
        for x in range(0, layer.width, 2):
            if alpha[x, y] >= threshold:
                far = max(far, math.hypot(x - cx, y - cy))
    return far


def fit_to_safe_zone(layer: Image.Image, reference: Image.Image) -> Image.Image:
    """Centre the artwork on the canvas and scale it into Android's adaptive safe zone.

    The move and the scale come from `reference` (the foreground), so the monochrome layer lines up."""
    left, top, right, bottom = solid_bbox(reference)
    cx, cy = (left + right) / 2, (top + bottom) / 2
    far = reach(reference, cx, cy)
    factor = min(1.0, ADAPTIVE_FIT_RADIUS / far)
    size = round(layer.width * factor)
    scaled = layer.resize((size, size), LANCZOS)
    out = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    out.alpha_composite(scaled, (round(layer.width / 2 - cx * factor), round(layer.height / 2 - cy * factor)))
    print(f'  adaptive fit: artwork reaches {far:.0f}px, scaled to {factor:.2f}')
    return out


def ios(master: Image.Image) -> None:
    print('→ iOS AppIcon (opaque, no alpha)')
    contents = json.loads((IOS / 'Contents.json').read_text())
    done = set()
    for entry in contents['images']:
        name = entry['filename']
        if name in done:
            continue
        done.add(name)
        px = round(float(entry['size'].split('x')[0]) * int(entry['scale'].rstrip('x')))
        save_png(master.resize((px, px), LANCZOS), IOS / name)
    print(f'  {len(done)} files')


def android(master: Image.Image) -> None:
    print('→ Android launcher icons')
    foreground = Image.open(BRAND / 'android-foreground.png').convert('RGBA')
    mono = Image.open(BRAND / 'android-monochrome.png').convert('RGBA')
    glyph = Image.open(BRAND / 'notification-glyph.png').convert('RGBA')

    fg = fit_to_safe_zone(foreground, foreground)
    mn = fit_to_safe_zone(mono, foreground)
    for name, scale in DENSITIES.items():
        legacy = round(48 * scale)
        adaptive = round(108 * scale)
        folder = RES / f'mipmap-{name}'
        # Legacy launchers (Android 7.x) show the file as is: a rounded square, and a circle.
        sq = master.resize((legacy, legacy), LANCZOS).convert('RGBA')
        sq.putalpha(squircle_mask(legacy, 0.2237))
        save_png(sq, folder / 'ic_launcher.png')
        rd = master.resize((legacy, legacy), LANCZOS).convert('RGBA')
        rd.putalpha(circle_mask(legacy))
        save_png(rd, folder / 'ic_launcher_round.png')
        save_png(fg.resize((adaptive, adaptive), LANCZOS), folder / 'ic_launcher_foreground.png')
        save_png(mn.resize((adaptive, adaptive), LANCZOS), folder / 'ic_launcher_monochrome.png')

    # Notification small icon: a flat glyph, about 20 of 24dp, white on transparent.
    left, top, right, bottom = glyph.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    crop = glyph.crop((left, top, right, bottom))
    side = max(crop.size)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    square.alpha_composite(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
    for name, scale in DENSITIES.items():
        box = round(24 * scale)
        inner = round(box * 20 / 24)
        icon = Image.new('RGBA', (box, box), (0, 0, 0, 0))
        icon.alpha_composite(square.resize((inner, inner), LANCZOS), ((box - inner) // 2, (box - inner) // 2))
        save_png(icon, RES / f'drawable-{name}' / 'ic_stat_occasio.png')

    (RES / 'drawable').mkdir(parents=True, exist_ok=True)
    (RES / 'drawable/ic_launcher_background.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n'
        '    <gradient android:angle="270" android:startColor="#FFCB4D" android:endColor="#FFAE2F" android:type="linear"/>\n'
        '</shape>\n'
    )
    adaptive_xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@drawable/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        '    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n'
        '</adaptive-icon>\n'
    )
    (RES / 'mipmap-anydpi-v26/ic_launcher.xml').write_text(adaptive_xml)
    (RES / 'mipmap-anydpi-v26/ic_launcher_round.xml').write_text(adaptive_xml)
    (RES / 'values/colors.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<resources>\n'
        '    <color name="ic_launcher_background">#FFCB4D</color>\n'
        '    <color name="notification_accent">#E8615D</color>\n'
        '</resources>\n'
    )


def stores_and_web(master: Image.Image) -> None:
    print('→ Store copies and website')
    save_png(master, ROOT / 'docs/store-assets/images/app-store/app-icon-1024.png')
    save_png(master, ROOT / 'docs/store-assets/tools/src/brand/app-icon-shipped-1024.png')
    play = master.resize((512, 512), LANCZOS).convert('RGBA')
    save_png(play, ROOT / 'docs/store-assets/images/google-play/app-icon-512.png')
    # The older store-assets/ folder keeps its own copies.
    save_png(master, ROOT / 'store-assets/src/brand/app-icon.png')
    save_png(master, ROOT / 'store-assets/out/app-store/app-icon-1024.png')
    save_png(play, ROOT / 'store-assets/out/google-play/app-icon-512.png')
    # Website: favicon (several sizes in one .ico) and the iOS home-screen icon.
    app = ROOT / 'docs-site/src/app'
    # Next.js refuses an .ico whose embedded PNGs are not RGBA, so add the alpha channel here.
    master.convert('RGBA').resize((256, 256), LANCZOS).save(
        app / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    save_png(master.resize((180, 180), LANCZOS), app / 'apple-icon.png')


def main() -> None:
    master = opaque(BRAND / 'app-icon-1024.png')
    assert master.size == (1024, 1024), master.size
    ios(master)
    android(master)
    stores_and_web(master)
    print('Done. Rebuild the apps to see the new icon.')


if __name__ == '__main__':
    main()
