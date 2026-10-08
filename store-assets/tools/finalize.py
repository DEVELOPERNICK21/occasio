"""Final export pass.
* store icons from the shipped app icon (iOS 1024 opaque, Play 512)
* iPhone 6.5" set derived from the 6.9" set
* every PNG flattened to opaque RGB (Apple rejects screenshots with alpha)
"""
from PIL import Image
import glob, os

os.makedirs('out/app-store', exist_ok=True)
os.makedirs('out/google-play', exist_ok=True)

icon = Image.open('src/brand/app-icon.png').convert('RGB')
icon.resize((1024, 1024), Image.LANCZOS).save('out/app-store/app-icon-1024.png', optimize=True)
icon.resize((512, 512), Image.LANCZOS).save('out/google-play/app-icon-512.png', optimize=True)

# iPhone 6.5" (1284 x 2778): same art, scaled to width then trimmed at the bottom
os.makedirs('out/app-store/iphone-6.5', exist_ok=True)
for f in sorted(glob.glob('out/app-store/iphone-6.9/*.png')):
    im = Image.open(f).convert('RGB')
    r = 1284 / im.width
    im = im.resize((1284, round(im.height * r)), Image.LANCZOS).crop((0, 0, 1284, 2778))
    im.save('out/app-store/iphone-6.5/' + os.path.basename(f), optimize=True)

# flatten + optimise everything
for f in glob.glob('out/**/*.png', recursive=True):
    im = Image.open(f)
    if im.mode != 'RGB':
        im = im.convert('RGB')
    im.save(f, optimize=True)

print('%-52s %-12s %-6s %s' % ('file', 'size', 'mode', 'KB'))
for f in sorted(glob.glob('out/**/*.png', recursive=True)):
    im = Image.open(f)
    print('%-52s %-12s %-6s %d' % (f, '%dx%d' % im.size, im.mode, os.path.getsize(f) // 1024))

# Google Play shows at most 8 phone screenshots: keep the first 8, park the rest.
os.makedirs('out/google-play/phone-spare', exist_ok=True)
for f in sorted(glob.glob('out/google-play/phone/*.png')):
    if int(os.path.basename(f)[:2]) > 8:
        os.replace(f, 'out/google-play/phone-spare/' + os.path.basename(f))

# Overview sheets for quick review / the README
def sheet(files, out, cw, ch, cols, tw):
    th = int(tw * ch / cw)
    rows = (len(files) + cols - 1) // cols
    S = Image.new('RGB', (cols * (tw + 16) + 16, rows * (th + 16) + 16), (247, 242, 238))
    for i, f in enumerate(files):
        im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS)
        S.paste(im, (16 + (i % cols) * (tw + 16), 16 + (i // cols) * (th + 16)))
    S.save(out, optimize=True)
sheet(sorted(glob.glob('out/app-store/iphone-6.9/*.png')), 'out/_overview-app-store.png', 1320, 2868, 5, 300)
sheet(sorted(glob.glob('out/google-play/phone/*.png')), 'out/_overview-google-play.png', 1080, 1920, 4, 320)
