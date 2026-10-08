// Several frames of each gate state so we can pick one with no balloon over the text.
import { launch } from './cdp.mjs';
const BASE = process.env.OCCASIO_BASE ?? 'http://localhost:3112';
const b = await launch();
await b.viewport(430, 876, 3);
const clickLast = () =>
  b.evaluate(`(() => { const bs=[...document.querySelectorAll('button')].filter(x=>/show me|no$/i.test(x.textContent.trim())); const el=bs[bs.length-1]; if(el){el.click();return el.textContent} return null })()`);
await b.navigate(`${BASE}/c/demo-birthday-maya-1408`, 2500);
for (const state of ['s0', 's1', 's2']) {
  for (let i = 0; i < 6; i++) {
    await b.shot(`src/captures/gates/${state}-${i}.png`);
    await b.sleep(900);
  }
  await clickLast();
  await b.sleep(1500);
}
await b.close();
