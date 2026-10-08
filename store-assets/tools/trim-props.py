"""Trims the transparent padding off the 3D prop renders and removes stray
particle specks, writing clean copies to src/props/trimmed/. (Pillow only.)"""
from PIL import Image, ImageFilter
import glob, os
os.makedirs('src/props/trimmed', exist_ok=True)
for f in sorted(glob.glob('src/props/*.png')):
    im = Image.open(f).convert('RGBA')
    mask = im.getchannel('A').point(lambda v: 255 if v > 100 else 0)
    core = mask.filter(ImageFilter.MinFilter(17))      # specks vanish, objects survive
    bbox = core.getbbox()
    if not bbox:
        print('skip (empty)', f); continue
    pad = 26
    box = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad))
    out = im.crop(box)
    out.save('src/props/trimmed/' + os.path.basename(f), optimize=True)
    print(os.path.basename(f), im.size, '->', out.size)
