// Captures the real recipient experience (docs-site demo cards) at 1290x2796.
// Needs the docs-site running:  cd docs-site && npx next start -p 3112
import { launch } from './cdp.mjs';

const BASE = process.env.OCCASIO_BASE ?? 'http://localhost:3112';
const OUT = 'src/captures';
const b = await launch();
await b.viewport(430, 876, 3);

const slug = (moment, name = 'maya') => `${BASE}/c/demo-${moment}-${name}-1408`;
const clickText = (t) =>
  b.evaluate(`(() => { const el=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===${JSON.stringify(t)}); if(el){el.click();return true} return false })()`);
const clickLast = () =>
  b.evaluate(`(() => { const bs=[...document.querySelectorAll('button')].filter(x=>/show me|no/i.test(x.textContent)); const el=bs[bs.length-1]; if(el){el.click();return el.textContent} return null })()`);

async function shotScene(name, url, wait = 3200) {
  await b.navigate(url, wait);
  await b.shot(`${OUT}/${name}.png`);
  console.log('✓', name);
}

// ── Birthday: the full story ───────────────────────────────────────────────
await b.navigate(slug('birthday'), 3200);
await b.shot(`${OUT}/birthday-gate.png`);
console.log('✓ birthday-gate');
for (const n of [1, 2, 3]) {
  await clickLast();
  await b.sleep(1700);
  await b.shot(`${OUT}/birthday-gate-no${n}.png`);
  console.log('✓ birthday-gate-no' + n);
}
for (const s of ['balloons', 'candle', 'gift']) {
  await shotScene(`birthday-${s}`, `${slug('birthday')}?scene=${s}`, 4200);
}
await shotScene('birthday-hub', `${slug('birthday')}?scene=hub`, 3200);
await shotScene('birthday-photos', `${slug('birthday')}?scene=hub&room=photos`, 3600);
await shotScene('birthday-reasons', `${slug('birthday')}?scene=hub&room=reasons`, 3600);
await shotScene('birthday-letter', `${slug('birthday')}?scene=hub&room=letter`, 9500);
await shotScene('birthday-finale', `${slug('birthday')}?scene=finale`, 4500);

// ── Every moment gets its own look ─────────────────────────────────────────
for (const m of ['anniversary', 'thank_you', 'congratulations', 'just_because']) {
  await shotScene(`${m}-gate`, slug(m), 3200);
  await shotScene(`${m}-gift`, `${slug(m)}?scene=gift`, 4200);
  await shotScene(`${m}-finale`, `${slug(m)}?scene=finale`, 4500);
}
await shotScene('anniversary-candle', `${slug('anniversary')}?scene=candle`, 4200);
await shotScene('anniversary-letter', `${slug('anniversary')}?scene=hub&room=letter`, 9500);

await b.close();
