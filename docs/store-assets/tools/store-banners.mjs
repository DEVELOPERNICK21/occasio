// App Store "Header" and "Search Results" creative assets (the new product-page header and
// search-result card). Sizes are the ones App Store Connect lists in the upload box:
//   Header          5244x2950 · 3840x1646
//   Search results  5244x2950 · 3840x2560 · 1920x1280
// Apple publishes templates with exact safe areas ("Explore templates" in App Store Connect);
// this layout keeps everything inside the centre ~84% and the headline inside the left half,
// but check it against Apple's template before upload.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';
import { background, glow, ring, confetti, phone as rawPhone, prop, HUES } from './design.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../images/app-store/header-and-search');
mkdirSync(OUT, { recursive: true });
mkdirSync(resolve(here, '.gen'), { recursive: true });

const S = (n) => `../src/screens/${n}.jpg`;
const P = (n) => `../src/props/${n}.png`;
const STRIP = ['#fbc7ce', '#fbe2dd', '#fbe3b8'];
const phone = (o) => rawPhone({ ...o, strip: STRIP, platform: 'ios' });
const h = HUES.coral;

const TARGETS = [
  { file: 'header-3840x1646', w: 3840, h: 1646 },
  { file: 'header-5244x2950', w: 5244, h: 2950 },
  { file: 'search-3840x2560', w: 3840, h: 2560 },
  { file: 'search-1920x1280', w: 1920, h: 1280 },
];

const DW = 1600; // design width; everything below is in this space then scaled to the target

function layout(H) {
  const pw = Math.round(H * 0.4); // phone screen width
  const headSize = Math.round(Math.min(H * 0.135, 104));
  const left = Math.round(DW * 0.085);
  return `
    ${glow(1180, H * 0.55, H * 0.85, h.light, 0.55)}
    ${glow(120, H, H * 0.7, h.light, 0.3)}
    ${ring(1130, H * 0.62, H * 0.62, 0.16, 3)}${ring(1130, H * 0.62, H * 0.86, 0.09, 3)}
    ${confetti({ seed: 5, n: 26, area: [0, 0, DW, H], avoid: [[left - 20, H * 0.14, DW * 0.46, H * 0.72]], colors: ['#fff', h.accent, '#fff', h.light], z: 1 })}
    <div style="position:absolute;left:${left}px;top:${Math.round(H * 0.16)}px;z-index:10;display:flex;align-items:center;gap:${Math.round(H * 0.035)}px">
      <img src="../src/brand/app-icon-shipped-1024.png" style="width:${Math.round(H * 0.13)}px;height:${Math.round(H * 0.13)}px;border-radius:${Math.round(H * 0.03)}px;box-shadow:0 14px 34px rgba(60,5,20,.35),0 0 0 3px rgba(255,255,255,.35)">
      <div style="font:800 ${Math.round(H * 0.09)}px/1 'Plus Jakarta Sans',sans-serif;color:#fff;letter-spacing:-.02em;text-shadow:0 8px 30px rgba(60,0,20,.25)">Occasio</div>
    </div>
    <div style="position:absolute;left:${left}px;top:${Math.round(H * 0.38)}px;z-index:10;width:${Math.round(DW * 0.4)}px;font:700 ${headSize}px/1.04 'Fraunces',serif;color:#fff;letter-spacing:-.012em;text-shadow:0 6px 24px rgba(60,0,20,.22);font-variation-settings:'opsz' 144">
      Cards they’ll<br>want to <em style="font-style:italic;font-weight:600;color:${h.accent}">open</em>
    </div>
    <div style="position:absolute;left:${left}px;top:${Math.round(H * 0.38 + headSize * 2.35)}px;z-index:10;width:${Math.round(DW * 0.44)}px;font:600 ${Math.round(Math.min(H * 0.047, 36))}px/1.3 'Plus Jakarta Sans',sans-serif;color:rgba(255,255,255,.95)">
      Birthday cards &amp; reminders
    </div>
    ${phone({ img: S('gate'), w: pw, x: Math.round(DW * 0.5), y: Math.round(H * 0.1), rot: -6, z: 4 })}
    ${phone({ img: S('candle'), w: Math.round(pw * 1.06), x: Math.round(DW * 0.5 + pw * 0.62), y: Math.round(H * 0.05), rot: 5, z: 6 })}
    ${prop({ img: P('gift-birthday'), w: Math.round(H * 0.3), x: Math.round(DW * 0.5 - H * 0.07), y: Math.round(H * 0.72), rot: -8, z: 12, shadow: '0 14px 20px rgba(30,5,15,.3)' })}`;
}

function html(t) {
  const H = Math.round((DW * t.h) / t.w);
  const s = t.w / DW;
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{width:${t.w}px;height:${t.h}px;overflow:hidden;background:#000}
.stage{position:absolute;left:0;top:0;width:${DW}px;height:${H}px;transform:scale(${s});transform-origin:0 0;overflow:hidden;${background('coral', { angle: 100 })}}</style></head>
<body><div class="stage">${layout(H)}</div></body></html>`;
}

const b = await launch();
for (const t of TARGETS) {
  await b.viewport(t.w, t.h, 1, false);
  const f = resolve(here, `.gen/${t.file}.html`);
  writeFileSync(f, html(t));
  await b.navigate(pathToFileURL(f).href, 900);
  await b.evaluate(`Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
  await b.sleep(900);
  await b.shot(`${OUT}/${t.file}.png`);
  console.log('✓', t.file);
}
await b.close();
