"""Builds src/screens/ — the clean screen library the compositions use.

* native app captures (src/raw/*.webp, your simulator/device screenshots):
  status-bar strip (clock, island, wifi) is replaced by the row just below it,
  so the template can draw one uniform 9:41 status bar on every screen.
* recipient-page captures (src/captures/*.png) are copied under stable names.
"""
from PIL import Image
import shutil, os

RAW = 'src/raw'
OUT = 'src/screens'
os.makedirs(OUT, exist_ok=True)

# your numbered screenshots -> meaningful names
NATIVE = {
    '4': 'home', '5': 'home-scroll', '6': 'vault', '8': 'moment-picker',
    '9': 'frames', '10': 'frames-2', '11': 'words', '12': 'preview',
}
STATUS_H = 128  # px of status bar in the 921x2000 captures

for num, name in NATIVE.items():
    src = f'{RAW}/{num}.webp'
    im = Image.open(src).convert('RGB')
    w, h = im.size
    row = im.crop((0, STATUS_H + 1, w, STATUS_H + 2)).resize((w, STATUS_H + 1))
    im.paste(row, (0, 0))
    im.save(f'{OUT}/{name}.png', optimize=True)
    print('native', name, im.size)

CAP = {
    'gate': 'gates/s0-5', 'gate-no1': 'gates/s1-2', 'gate-no2': 'gates/s2-1',
    'balloons': 'pt-balloons-popped', 'candle': 'pt-candle-lit', 'candle-cut': 'pt-candle-cut',
    'gift': 'pt-gift', 'gift-open': 'pt-gift-open', 'hub': 'pt-hub-done',
    'photos': 'pt-photos', 'reasons': 'pt-reasons', 'letter-sealed': 'pt-letter-sealed',
    'letter-opening': 'pt-letter-opening', 'letter-open': 'pt-letter-open',
    'message': 'pt-message', 'finale': 'pt-finale', 'sticker': 'pt-sticker',
    'anniversary-gate': 'anniversary-gate', 'thank_you-gate': 'thank_you-gate',
    'congratulations-gate': 'congratulations-gate', 'just_because-gate': 'just_because-gate',
    'anniversary-gift': 'anniversary-gift', 'thank_you-gift': 'thank_you-gift',
    'congratulations-gift': 'congratulations-gift', 'just_because-gift': 'just_because-gift',
}
for name, cap in CAP.items():
    shutil.copy(f'src/captures/{cap}.png', f'{OUT}/{name}.png')
print('copied', len(CAP), 'web captures')

# Colour of the page's own top edge (left / middle / right). The device frame
# paints this as the status-bar band so the page appears to start below it,
# exactly like mobile Safari does.
import json, statistics
strips = {}
for name in CAP:
    im = Image.open(f'{OUT}/{name}.png').convert('RGB')
    w, h = im.size
    def med(x0, x1):
        px = [im.getpixel((x, y)) for x in range(x0, x1) for y in range(0, 4)]
        return '#%02x%02x%02x' % tuple(int(statistics.median(c[i] for c in px)) for i in range(3))
    strips[name] = [med(2, 40), med(w // 2 - 20, w // 2 + 20), med(w - 40, w - 2)]
json.dump(strips, open(f'{OUT}/strips.json', 'w'), indent=1)
print('strips', len(strips))
