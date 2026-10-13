// "Date Heart" with Pip, drawn in a Duolingo-inspired way: one big front-facing character, a flat
// saturated colour field, chunky shapes with a darker "button lip" under them, big glossy eyes and
// no decoration. Three layouts of the same idea. Run: node icons-v3.mjs, then python3 icons-v3-post.py.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../images/icons/v3');
mkdirSync(OUT, { recursive: true });
mkdirSync(resolve(here, '.gen'), { recursive: true });

import { P, M, BODY, heart, chunkyHeart, HAT, HAT_OUTLINE, pip, shadow, BG, calendar } from './icon-art.mjs';

const CONCEPTS = {
  'c1-pip-holds-the-date': {
    name: 'C1 · Pip holds the date',
    says: 'Pip stands in front of the wall calendar holding the heart: he remembers the day for you.',
    defs: BG + shadow('sh', 14, 14, 0.28),
    subject: `<g filter="url(#sh)">${calendar({ x: -330, y: -250, w: 660, h: 470, headerH: 100 })}</g>
      <g filter="url(#sh)">${pip({ x: 0, y: 50, k: 2.45, id: 'a', feet: true, hands: 'hold' })}</g>
      ${chunkyHeart(0, 232, 210)}`,
    shift: 6,
    scale: 1,
  },
  'c2-pip-peeks': {
    name: 'C2 · Pip peeks over the calendar',
    says: 'Pip peeks over the top of the calendar, hands on the edge: the mascot and the date in one glance.',
    defs: BG + shadow('sh', 14, 14, 0.28),
    subject: `<g filter="url(#sh)">${pip({ x: 0, y: -105, k: 2.2, id: 'b', outline: true, feet: false, hands: 'none' })}</g>
      <g filter="url(#sh)">${calendar({ x: -352, y: 40, w: 704, h: 370, headerH: 92, rings: false })}</g>
      <ellipse cx="-150" cy="38" rx="44" ry="34" fill="${M.base}"/><ellipse cx="150" cy="38" rx="44" ry="34" fill="${M.base}"/>
      <ellipse cx="-150" cy="30" rx="30" ry="14" fill="#fff" opacity=".28"/><ellipse cx="150" cy="30" rx="30" ry="14" fill="#fff" opacity=".28"/>
      ${chunkyHeart(0, 268, 205)}`,
    shift: 6,
    scale: 0.92,
  },
  'c3-pip-hero': {
    name: 'C3 · Pip hero + date badge',
    says: 'Pip fills the icon, Duolingo-style; the calendar-heart becomes a badge on his side.',
    defs: BG + shadow('sh', 14, 14, 0.28),
    subject: `<g filter="url(#sh)">${pip({ x: -40, y: 20, k: 3.05, id: 'c', feet: true, hands: 'down' })}</g>
      <g filter="url(#sh)" transform="translate(230 230) rotate(9)">${calendar({ x: -150, y: -150, w: 300, h: 300, headerH: 74, rings: false, lip: 12 })}
        ${chunkyHeart(0, 52, 128)}</g>`,
    shift: 16,
    scale: 0.93,
  },
};

const svgOf = (c, { measure = false } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>${c.defs}</defs>
  <rect width="1024" height="1024" fill="${measure ? '#FF00FF' : 'url(#bg)'}"/>
  <g id="subject" transform="translate(512 ${512 + c.shift}) scale(${c.scale ?? 1})">${c.subject}</g></svg>`;

const wrap = (inner, size = 1024) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${size}px;height:${size}px;overflow:hidden;background:#000}svg,img{display:block;width:${size}px;height:${size}px}</style></head><body>${inner}</body></html>`;

const b = await launch();
await b.viewport(1024, 1024, 1, false);
for (const [id, c] of Object.entries(CONCEPTS)) {
  for (const measure of [false, true]) {
    const f = resolve(here, `.gen/v3-${id}${measure ? '-measure' : ''}.html`);
    writeFileSync(f, wrap(svgOf(c, { measure })));
    await b.navigate(pathToFileURL(f).href, 900);
    await b.sleep(500);
    await b.shot(measure ? resolve(here, `.gen/${id}-measure.png`) : `${OUT}/${id}-1024.png`);
  }
  console.log('✓', id);
}

// ---- Comparison: the chosen Date Heart as it is today, then the three layouts, at 340 / 120 / 60 / 29 px. ----
const OUT_URL = pathToFileURL(OUT).href;
const CHOSEN = pathToFileURL(resolve(here, '../images/icons/concept-c-date-heart-1024.png')).href;
const items = [{ name: 'Date Heart (chosen)', says: 'The calendar and heart you picked, as it is now.', abs: CHOSEN }]
  .concat(Object.entries(CONCEPTS).map(([id, c]) => ({ name: c.name, says: c.says, abs: `${OUT_URL}/${id}-1024.png` })));
const cell = (it) => `<div class="c"><div class="i"><img src="${it.abs}"></div><div class="n">${it.name}</div><div class="t">${it.says}</div>
  <div class="sm"><div class="s120"><img src="${it.abs}"></div><div class="s60"><img src="${it.abs}"></div><div class="s29"><img src="${it.abs}"></div></div></div>`;
const sheet = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1640px;background:#FDF6F2;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#2A2220}
.g{display:grid;grid-template-columns:repeat(4,340px);gap:44px 56px;padding:56px}.c{width:340px}
.i{width:340px;height:340px;border-radius:76px;overflow:hidden;box-shadow:0 18px 40px rgba(42,34,32,.22)}.i img{width:100%;height:100%;display:block}
.n{margin-top:20px;font-weight:800;font-size:25px}.t{font-weight:500;font-size:17px;line-height:1.4;color:#4D4340;margin-top:8px;min-height:72px}
.sm{display:flex;gap:18px;align-items:flex-end;margin-top:14px}.sm div{overflow:hidden;box-shadow:0 6px 14px rgba(42,34,32,.2)}.sm img{width:100%;height:100%;display:block}
.s60{width:60px;height:60px;border-radius:14px}.s120{width:120px;height:120px;border-radius:27px}.s29{width:29px;height:29px;border-radius:7px}</style></head><body>
<div class="g">${items.map(cell).join('')}</div></body></html>`;
const sf = resolve(here, '.gen/v3-sheet.html');
writeFileSync(sf, sheet);
await b.viewport(1640, 700, 1, false);
await b.navigate(pathToFileURL(sf).href, 600);
await b.evaluate(`Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
await b.sleep(500);
await b.shot(`${OUT}/_v3-comparison.png`);
console.log('✓ sheet');

const row = (bg, label, fg) => `<div class="w" style="background:${bg};color:${fg}"><div class="l">${label}</div><div class="ic">${items.map((it) => `<div class="a"><img style="width:120px;height:120px;border-radius:27px" src="${it.abs}"><img style="width:60px;height:60px;border-radius:13px;margin-top:10px" src="${it.abs}"><img style="width:40px;height:40px;border-radius:9px;margin-top:10px" src="${it.abs}"><span>${it.name.split(' · ').pop().replace(' (chosen)', '')}</span></div>`).join('')}</div></div>`;
const home = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:900px;font-family:system-ui,-apple-system,sans-serif}
.w{padding:22px 36px 26px}.l{font-size:15px;font-weight:700;opacity:.7;margin-bottom:14px}.ic{display:flex;gap:30px}.a{display:flex;flex-direction:column;align-items:center;width:160px}.a span{font-size:14px;margin-top:10px;font-weight:600;text-align:center}img{display:block;box-shadow:0 4px 10px rgba(0,0,0,.18)}</style></head><body>
${row('#ECEEF2', 'Light wallpaper', '#222')}${row('#181A20', 'Dark wallpaper', '#ddd')}${row('linear-gradient(135deg,#D6AA96,#B07C8C)', 'Warm wallpaper', '#2A2220')}</body></html>`;
const hf = resolve(here, '.gen/v3-home.html');
writeFileSync(hf, home);
await b.viewport(900, 1000, 1, false);
await b.navigate(pathToFileURL(hf).href, 600);
await b.evaluate(`Promise.all([...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
await b.sleep(400);
await b.shot(`${OUT}/_v3-homescreen.png`);
console.log('✓ homescreen');
await b.close();
