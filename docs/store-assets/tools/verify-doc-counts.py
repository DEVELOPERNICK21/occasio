"""Cross-checks the character counts printed in 04-listing.md and 05-growth-plan.md against the strings beside them.
Run from docs/store-assets:  python3 tools/verify-doc-counts.py
Looks for table rows shaped  | ... | `text` | N/L | ...  and  | ... | `text` | B/100 | ..."""
import re, sys
doc = open('04-listing.md').read() + '\n' + open('05-growth-plan.md').read()
bad = n = 0
for m in re.finditer(r"`([^`\n]+)`\s*\|\s*(\d+)/(\d+)", doc):
    text, shown, lim = m.group(1), int(m.group(2)), int(m.group(3))
    actual = len(text.encode()) if lim == 100 and ',' in text and ' ' not in text else len(text)
    n += 1
    if actual != shown:
        bad += 1
        print(f'MISMATCH shown {shown} actual {actual}: {text}')
for m in re.finditer(r"`([^`\n]+)` \((\d+)/(\d+)\)", doc):
    n += 1
    if len(m.group(1)) != int(m.group(2)):
        bad += 1; print('MISMATCH', m.group(0))
print(f'{n} counts checked,', 'all match' if not bad else f'{bad} wrong')
sys.exit(1 if bad else 0)
