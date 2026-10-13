"""Flatten the v2 icons to opaque RGB and report how far each one reaches from the centre.

Android's adaptive icon shows only a circle in the middle of the canvas, so a subject that
reaches too far gets clipped. The factor printed is the scale to give the artwork when it is
used as the Android foreground (1.00 = already safe)."""
import math, glob, os
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, '../images/icons/v3')
SAFE_RADIUS = 1024 * (66 / 108) / 2  # the 66dp safe zone of the 108dp adaptive canvas

for path in sorted(glob.glob(os.path.join(out, '*-1024.png'))):
    im = Image.open(path)
    if im.mode != 'RGB':
        im.convert('RGB').save(path, optimize=True)
    name = os.path.basename(path).replace('-1024.png', '')
    mpath = os.path.join(here, '.gen', f'{name}-measure.png')
    if not os.path.exists(mpath):
        continue
    m = Image.open(mpath).convert('RGB')
    px = m.load()
    far = 0.0
    for y in range(0, 1024, 2):
        for x in range(0, 1024, 2):
            r, g, b = px[x, y]
            if not (r > 240 and g < 20 and b > 240):  # not the magenta backdrop
                far = max(far, math.hypot(x - 512, y - 512))
    factor = min(1.0, SAFE_RADIUS / far)
    print(f'{name:16s} reaches {far:5.0f}px from centre (safe {SAFE_RADIUS:.0f}) -> Android foreground scale {factor:.2f}  mode={Image.open(path).mode}')
