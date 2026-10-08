// Google Play feature graphic, 1024x500 (24-bit PNG, no alpha).
// Text stays inside the centre-left safe area; art bleeds off the right/bottom edges.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';
import { page, background, phone as rawPhone, prop, glow, ring, confetti, HUES } from './design.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const W = 1024, H = 500;
const S = (n) => `../src/screens/${n}.jpg`;
const P = (n) => `../src/props/${n}.png`;
const h = HUES.coral;
const phone = (o) => rawPhone({ ...o, strip: ['#fbc7ce', '#fbe2dd', '#fbe3b8'] });

const body = `
  ${glow(840, 250, 380, h.light, 0.55)}
  ${ring(800, 330, 330, 0.16, 2)}${ring(800, 330, 450, 0.09, 2)}
  ${confetti({ seed: 7, n: 22, area: [0, 0, W, H], avoid: [[40, 70, 520, 380]], colors: ['#fff', h.accent, '#fff', h.light], z: 1 })
    .replace(/width:(\d+(?:\.\d+)?)px;height:(\d+(?:\.\d+)?)px/g, (m, a, b) => `width:${a * 0.6}px;height:${b * 0.6}px`)}
  <div style="position:absolute;left:58px;top:78px;z-index:10;display:flex;align-items:center;gap:22px">
    <img src="../src/brand/app-icon-shipped-1024.png" style="width:112px;height:112px;border-radius:26px;box-shadow:0 14px 34px rgba(60,5,20,.35),0 0 0 3px rgba(255,255,255,.35)">
    <div style="font:800 80px/1 'Plus Jakarta Sans',sans-serif;color:#fff;letter-spacing:-.02em;text-shadow:0 8px 30px rgba(60,0,20,.25)">Occasio</div>
  </div>
  <div style="position:absolute;left:58px;top:230px;z-index:10;width:490px;font:700 60px/1.04 'Fraunces',serif;color:#fff;letter-spacing:-.012em;text-shadow:0 6px 24px rgba(60,0,20,.22);font-variation-settings:'opsz' 144">
    Cards they’ll<br>want to <em style="font-style:italic;font-weight:600;color:${h.accent}">open</em>
  </div>
  <div style="position:absolute;left:60px;top:402px;z-index:10;width:480px;font:600 26px/1.3 'Plus Jakarta Sans',sans-serif;color:rgba(255,255,255,.95)">
    Birthday cards &amp; reminders
  </div>
  ${phone({ img: S('gate'), w: 270, x: 570, y: 80, rot: -7, z: 4, platform: 'android' })}
  ${phone({ img: S('candle'), w: 290, x: 745, y: 44, rot: 5, z: 6, platform: 'android' })}
  ${prop({ img: P('gift-birthday'), w: 190, x: 505, y: 360, rot: -8, z: 12, shadow: '0 14px 20px rgba(30,5,15,.3)' })}
`;

mkdirSync(resolve(here, '.gen'), { recursive: true });
mkdirSync(resolve(here, '../images/google-play'), { recursive: true });
const html = page({ canvasW: W, canvasH: H, H, platform: 'android', bg: background('coral', { angle: 100 }), body, designW: W });
const file = resolve(here, '.gen/feature-graphic.html');
writeFileSync(file, html);
const b = await launch();
await b.viewport(W, H, 1, false);
await b.navigate(pathToFileURL(file).href, 600);
await b.evaluate(`Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
await b.sleep(500);
await b.shot(resolve(here, '../images/google-play/feature-graphic-1024x500.png'));
console.log('✓ feature graphic');
await b.close();
