"""Fails if any store field is over its limit or breaks a metadata rule.
Run from docs/store-assets:  python3 tools/check-limits.py
Counts characters like the stores do (one character per code point), and the iOS keyword field in UTF-8 bytes.
"""
import json, re, sys

LIM = {'ios.name': 30, 'ios.subtitle': 30, 'ios.keywords': 100, 'ios.promo': 170, 'play.title': 30, 'play.short': 80,
       'play.whats_new': 500, 'iap.name': 30, 'iap.desc': 45, 'screenshot': None}
BANNED = re.compile(r"\b(best|#1|top|free|sale|discount|download now|whatsapp|instagram|facebook|jibjab|heartcraft|birthdayalarm)\b", re.I)
bad = 0

def chk(label, text, limit, bytes_=False, banned=True):
    global bad
    n = len(text.encode()) if bytes_ else len(text)
    over = limit is not None and n > limit
    hit = BANNED.search(text) if banned else None
    bad += bool(over) + bool(hit)
    flag = 'OVER' if over else ('BAN ' if hit else 'ok  ')
    lim = f'/{limit}' if limit else ''
    print(f'  {flag} {label:28} {n:4}{lim:5} {text[:90]}' + (f'   <- "{hit.group(0)}"' if hit else ''))

data = json.load(open('metadata/metadata.json'))
us = data['en-US']
print('[en-US iOS]')
for k in ('name', 'subtitle'):
    for i, t in enumerate(us['ios'][k]): chk(f'{k}[{i}]', t, LIM['ios.' + k])
for i, t in enumerate(us['ios']['keywords']): chk(f'keywords[{i}] (bytes)', t, 100, bytes_=True)
for i, t in enumerate(us['ios']['promo']): chk(f'promo[{i}]', t, 170, banned=False)
chk('whats_new_1_0', us['ios']['whats_new_1_0'], 4000)
# repeated words between recommended name + subtitle + keywords
words = lambda s: set(re.findall(r"[a-z]+", s.lower()))
name_sub = words(us['ios']['name'][0]) | words(us['ios']['subtitle'][0])
kw = [w for k in us['ios']['keywords'] for w in k.split(',')]
dups = [w for w in kw if w in name_sub or w + 's' in name_sub or w.rstrip('s') in name_sub]
print('  keyword words repeating title/subtitle:', dups or 'none')
bad += bool(dups)
print('[en-US Play]')
for i, t in enumerate(us['play']['title']): chk(f'title[{i}]', t, 30)
for i, t in enumerate(us['play']['short']): chk(f'short[{i}]', t, 80, banned=False)
chk('whats_new_1_0', us['play']['whats_new_1_0'], 500)
print('[IAP]')
for k in ('monthly_name', 'yearly_name', 'single_name'): chk(k, us['iap'][k], 30)
for k in ('sub_desc', 'single_desc'): chk(k, us['iap'][k], 45, banned=False)
print('[Screenshot headlines: max 6 words]')
for t in us['screenshot_headlines']:
    n = len(re.findall(r"[\w’']+", t))
    bad += n > 6
    print(f"  {'ok  ' if n <= 6 else 'OVER'} {n} words  {t}")
for f in ('ios_description', 'play_full_description'):
    p = {'ios_description': us['ios']['description_file'], 'play_full_description': us['play']['description_file']}[f]
    n = len(open(p).read()); bad += n > 4000
    print(f"  {'ok  ' if n <= 4000 else 'OVER'} {f:28} {n:4}/4000")
hi = data.get('hi-IN_OPTIONAL_DRAFT')
if hi:
    print('[hi-IN optional draft]')
    chk('ios.name', hi['ios']['name'][0], 30, banned=False); chk('ios.subtitle', hi['ios']['subtitle'][0], 30, banned=False)
    chk('ios.keywords (bytes)', hi['ios']['keywords'][0], 100, bytes_=True, banned=False)
    chk('play.short', hi['play']['short'][0], 80, banned=False)
print('\nALL OK' if not bad else f'\n{bad} problem(s)')
sys.exit(1 if bad else 0)
