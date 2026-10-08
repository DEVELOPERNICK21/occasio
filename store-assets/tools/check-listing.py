"""Fails if any store field is over its limit. Counts like the stores do (UTF-16 units ~ chars)."""
import json, sys
LIMITS = {'title': 30, 'play_short': 80, 'ios_subtitle': 30, 'ios_promo': 170, 'ios_keywords': 100}
data = json.load(open('listing/metadata.json'))
bad = 0
for loc, fields in data.items():
    if loc.startswith('_'): continue
    print(f'\n[{loc}]')
    for k, lim in LIMITS.items():
        v = fields[k]; n = len(v)
        flag = 'OK ' if n <= lim else 'OVER'
        bad += n > lim
        print(f'  {flag} {k:13} {n:3}/{lim:<3} {v}')
for f in ['listing/play-description.en-US.txt', 'listing/app-store-description.en-US.txt', 'listing/play-description.hi-IN.txt', 'listing/app-store-description.hi-IN.txt']:
    n = len(open(f).read())
    flag = 'OK ' if n <= 4000 else 'OVER'
    bad += n > 4000
    print(f'\n  {flag} {f} {n}/4000')
sys.exit(1 if bad else 0)
