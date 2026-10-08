// Plays the birthday story like a real recipient, capturing key frames, so the
// HUD shows genuine star counts. Needs docs-site on :3112.
import { launch } from './cdp.mjs';
const BASE = process.env.OCCASIO_BASE ?? 'http://localhost:3112';
const OUT = 'src/captures';
const b = await launch();
await b.viewport(430, 876, 3);

const clickText = (t) =>
  b.evaluate(`(() => { const el=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().startsWith(${JSON.stringify(t)}) && !x.disabled); if(el){el.click();return true} return false })()`);
const click = (sel, nth = 0) =>
  b.evaluate(`(() => { const el=[...document.querySelectorAll(${JSON.stringify(sel)})][${nth}]; if(!el) return false; el.click(); return true })()`);
const waitClick = async (t, timeout = 30000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await clickText(t)) return true;
    await b.sleep(400);
  }
  console.log('TIMEOUT waiting for', t);
  return false;
};
const count = (sel) => b.evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const shot = async (n) => { await b.shot(`${OUT}/${n}.png`); console.log('✓', n); };
const stageTap = async (sel = '[role="button"][aria-label]', ms = 60) => {
  const c = await b.center(sel);
  if (!c) { console.log('no stage', sel); return; }
  await b.tap(c.x, c.y, ms);
};
const url = (moment, qs = '') => `${BASE}/c/demo-${moment}-maya-1408${qs}`;
const hud = () => b.evaluate(`document.body.innerText.match(/★?\\s*\\d+/g)?.slice(0,2).join(',')`);

// ── balloons ───────────────────────────────────────────────────────────────
await b.navigate(url('birthday', '?scene=balloons'), 3500);
const n = await count('.story-balloon');
for (let i = 0; i < n; i++) { await click('.story-balloon', i); await b.sleep(450); }
await b.sleep(1800);
await shot('pt-balloons-popped');
await waitClick('Continue');
await b.sleep(2800);

// ── candle ─────────────────────────────────────────────────────────────────
await shot('pt-candle-lit');
for (let i = 0; i < 3; i++) { await stageTap(); await b.sleep(1100); }
await b.sleep(1200);
await shot('pt-candle-out');
await stageTap(); // cut the cake
await b.sleep(2800);
await shot('pt-candle-cut');
await waitClick('Continue');
await b.sleep(3800);

// ── gift ───────────────────────────────────────────────────────────────────
await shot('pt-gift');
for (let i = 0; i < 5; i++) { await stageTap(); await b.sleep(900); }
await b.sleep(3000);
await shot('pt-gift-open');
await waitClick('Continue');
await b.sleep(3200);
await shot('pt-hub');

// ── hub: photos ────────────────────────────────────────────────────────────
const tile = (label) => b.evaluate(`(() => { const el=[...document.querySelectorAll('.hub button')].find(x=>(x.getAttribute('aria-label')||'').startsWith(${JSON.stringify(label)})); if(el){el.click();return true} return false })()`);
console.log('photos', await tile('Photos'));
await b.sleep(3200);
await shot('pt-photos');
await waitClick('Continue');
await b.sleep(2500);

// ── hub: reasons ───────────────────────────────────────────────────────────
console.log('reasons', await tile('Reasons'));
await b.sleep(2500);
for (let i = 0; i < 3; i++) { await click('.story-reasons button', i); await b.sleep(900); }
await b.sleep(1200);
await shot('pt-reasons');
await waitClick('Continue');
await b.sleep(2500);

// ── hub: letter (press and hold the wax seal) ─────────────────────────────
console.log('letter', await tile('A letter'));
await b.sleep(5500);
await shot('pt-letter-sealed');
const c = await b.center('[role="button"][aria-label^="Wax"]');
console.log('seal stage', JSON.stringify(c));
await b.mouse('mouseMoved', c.x, c.y);
await b.mouse('mousePressed', c.x, c.y);
await b.sleep(3200);
await shot('pt-letter-breaking');
await b.mouse('mouseReleased', c.x, c.y);
await b.sleep(1800);
await shot('pt-letter-opening');
await b.sleep(5500);
// wait until the letter is fully written (Continue enabled), then frame it
for (let i = 0; i < 80; i++) {
  const ready = await b.evaluate(`[...document.querySelectorAll('button')].some(x=>x.textContent.trim()==='Continue' && !x.disabled)`);
  if (ready) break;
  await b.sleep(400);
}
await b.sleep(1500);
await shot('pt-letter-open');
await waitClick('Continue');            // letter 3D → message
await b.sleep(2800);
await shot('pt-message');
await waitClick('Continue');            // message → hub
await b.sleep(2500);
await shot('pt-hub-done');
await waitClick('Finish');
await b.sleep(6500);
await shot('pt-finale');
console.log('buttons', await b.evaluate(`[...document.querySelectorAll('button')].map(x=>(x.getAttribute('aria-label')||x.textContent.trim())+(x.disabled?'(d)':'')).join(' | ')`));
const pack = await b.center('.sticker-pack');
console.log('pack', JSON.stringify(pack));
if (pack) { await b.tap(pack.x, pack.y); await b.sleep(3500); await shot('pt-sticker'); }
await b.close();
