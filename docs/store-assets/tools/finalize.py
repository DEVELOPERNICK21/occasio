"""Final export pass for /docs/store-assets/images.

* store icons from the icon that ships in the app (iOS 1024 opaque, Play 512)
* iPhone 6.3" set (1206x2622) derived from the 6.9" set (same aspect ratio)
* every screenshot flattened to opaque RGB (Apple rejects screenshots with alpha)
* overview sheets + a spec report that fails loudly on a wrong size
Run from docs/store-assets:  python3 tools/finalize.py
"""
from PIL import Image
import glob, os, sys

IMG = 'images'
os.makedirs(f'{IMG}/app-store', exist_ok=True)
os.makedirs(f'{IMG}/google-play', exist_ok=True)

icon = Image.open('tools/src/brand/app-icon-shipped-1024.png').convert('RGB')
icon.resize((1024, 1024), Image.LANCZOS).save(f'{IMG}/app-store/app-icon-1024.png', optimize=True)

# iPhone 6.3" (1206 x 2622)
os.makedirs(f'{IMG}/app-store/iphone-6.3', exist_ok=True)
for f in sorted(glob.glob(f'{IMG}/app-store/iphone-6.9/*.png')):
    im = Image.open(f).convert('RGB')
    im.resize((1206, 2622), Image.LANCZOS).save(f'{IMG}/app-store/iphone-6.3/' + os.path.basename(f), optimize=True)

# flatten every PNG (no alpha anywhere except nothing: all store art is opaque)
for f in glob.glob(f'{IMG}/**/*.png', recursive=True):
    if f.endswith('app-icon-512.png'):
        continue
    im = Image.open(f)
    if im.mode != 'RGB':
        im.convert('RGB').save(f, optimize=True)

# Play wants a 32-bit PNG for the 512 icon (alpha allowed); keep it RGBA, fully opaque.
icon.resize((512, 512), Image.LANCZOS).convert('RGBA').save(f'{IMG}/google-play/app-icon-512.png', optimize=True)

EXPECT = {
    f'{IMG}/app-store/iphone-6.9': (1320, 2868),
    f'{IMG}/app-store/iphone-6.3': (1206, 2622),
    f'{IMG}/google-play/phone': (1080, 1920),
}
bad = 0
print('%-58s %-11s %-5s %s' % ('file', 'size', 'mode', 'KB'))
for d, size in EXPECT.items():
    for f in sorted(glob.glob(d + '/*.png')):
        im = Image.open(f)
        ok = im.size == size and im.mode == 'RGB'
        bad += not ok
        print('%-58s %-11s %-5s %-5d %s' % (f, '%dx%d' % im.size, im.mode, os.path.getsize(f) // 1024, '' if ok else '<-- WRONG'))
checks = {
    f'{IMG}/google-play/feature-graphic-1024x500.png': (1024, 500),
    f'{IMG}/google-play/app-icon-512.png': (512, 512),
    f'{IMG}/app-store/app-icon-1024.png': (1024, 1024),
}
for f, size in checks.items():
    im = Image.open(f)
    ok = im.size == size and im.mode == ('RGBA' if f.endswith('app-icon-512.png') else 'RGB')
    bad += not ok
    print('%-58s %-11s %-5s %-5d %s' % (f, '%dx%d' % im.size, im.mode, os.path.getsize(f) // 1024, '' if ok else '<-- WRONG'))


def sheet(files, out, cw, ch, cols, tw):
    th = int(tw * ch / cw)
    rows = (len(files) + cols - 1) // cols
    S = Image.new('RGB', (cols * (tw + 16) + 16, rows * (th + 16) + 16), (247, 242, 238))
    for i, f in enumerate(files):
        im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS)
        S.paste(im, (16 + (i % cols) * (tw + 16), 16 + (i // cols) * (th + 16)))
    S.save(out, optimize=True)


sheet(sorted(glob.glob(f'{IMG}/app-store/iphone-6.9/*.png')), f'{IMG}/_overview-app-store.png', 1320, 2868, 4, 330)
sheet(sorted(glob.glob(f'{IMG}/google-play/phone/*.png')), f'{IMG}/_overview-google-play.png', 1080, 1920, 4, 330)
print('\nOK' if not bad else f'\n{bad} file(s) wrong')
sys.exit(1 if bad else 0)
