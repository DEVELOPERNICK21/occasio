// Renders the real 3D props (gift, cake, wax-sealed envelope) to transparent PNGs.
import { launch } from './cdp.mjs';
const BASE = process.env.OCCASIO_BASE ?? 'http://localhost:3112';
const b = await launch();
await b.viewport(430, 932, 4);
const url = (m, qs) => `${BASE}/c/demo-${m}-maya-1408?${qs}`;

async function prop(name, u, wait, sel = '[role="button"][aria-label]') {
  await b.navigate(u, wait);
  const rect = await b.evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return null;
    el.classList.add('__target');
    const st = document.createElement('style');
    st.textContent = '*{background:transparent!important;box-shadow:none!important} body *{visibility:hidden!important} .__target, .__target *{visibility:visible!important} .__target::before,.__target::after{display:none!important}';
    document.head.appendChild(st);
    const r = el.getBoundingClientRect();
    return {x:r.left,y:r.top,width:r.width,height:r.height};
  })()`);
  if (!rect) { console.log('✗', name, 'no stage'); return; }
  await b.sleep(400);
  // retry until the WebGL stage has actually drawn something
  for (let i = 0; i < 4; i++) {
    await b.shot(`src/props/${name}.png`, { clip: rect, transparent: true });
    const { statSync } = await import('node:fs');
    if (statSync(`src/props/${name}.png`).size > 20000) break;
    await b.sleep(2500);
  }
  console.log('✓', name, JSON.stringify(rect));
}

const only = process.argv.slice(2);
for (const m of ['birthday', 'anniversary', 'thank_you', 'congratulations', 'just_because']) {
  await prop(`gift-${m}`, url(m, 'scene=gift'), 4800);
}
await prop('cake-birthday', url('birthday', 'scene=candle'), 4800);
await prop('cake-anniversary', url('anniversary', 'scene=candle'), 4800);
await prop('envelope-birthday', url('birthday', 'scene=hub&room=letter'), 7000);
await prop('envelope-anniversary', url('anniversary', 'scene=hub&room=letter'), 7000);
await b.close();
