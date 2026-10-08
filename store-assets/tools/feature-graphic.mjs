// Google Play feature graphic, 1024x500. Text stays inside the centre-left
// safe area; art bleeds off the right/bottom edges.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';
import { page, background, phone, prop, glow, ring, confetti, HUES } from './design.mjs';

const W = 1024, H = 500;
const S = (n) => `../../src/screens/${n}.png`;
const P = (n) => `../../src/props/trimmed/${n}.png`;
const h = HUES.coral;

const body = `
  ${glow(840, 250, 380, h.light, 0.55)}
  ${ring(800, 330, 330, 0.16, 2)}${ring(800, 330, 450, 0.09, 2)}
  ${confetti({ seed: 7, n: 22, area: [0, 0, W, H], avoid: [[40, 90, 520, 330]], colors: ['#fff', h.accent, '#fff', h.light], z: 1 })
    .replace(/width:(\d+(?:\.\d+)?)px;height:(\d+(?:\.\d+)?)px/g, (m, a, b) => `width:${a * 0.6}px;height:${b * 0.6}px`)}
  <div style="position:absolute;left:58px;top:92px;z-index:10;display:flex;align-items:center;gap:22px">
    <img src="../../src/brand/app-icon.png" style="width:128px;height:128px;border-radius:30px;box-shadow:0 14px 34px rgba(60,5,20,.35),0 0 0 3px rgba(255,255,255,.35)">
    <div style="font:700 92px/1 'Fraunces',serif;color:#fff;letter-spacing:-.015em;text-shadow:0 8px 30px rgba(60,0,20,.25);font-variation-settings:'opsz' 144">Occasio</div>
  </div>
  <div style="position:absolute;left:58px;top:250px;z-index:10;width:480px;font:700 56px/1.06 'Fraunces',serif;color:#fff;letter-spacing:-.01em;text-shadow:0 6px 24px rgba(60,0,20,.22);font-variation-settings:'opsz' 144">
    Wishes they’ll<br>want to <em style="font-style:italic;font-weight:600;color:${h.accent}">open</em>
  </div>
  <div style="position:absolute;left:60px;top:408px;z-index:10;width:470px;font:600 27px/1.3 'Plus Jakarta Sans',sans-serif;color:rgba(255,255,255,.94)">
    Interactive birthday cards &amp; reminders
  </div>
  ${phone({ img: S('gate'), w: 270, x: 560, y: 70, rot: -7, z: 4, platform: 'android' })}
  ${phone({ img: S('candle'), w: 290, x: 735, y: 38, rot: 5, z: 6, platform: 'android' })}
  ${prop({ img: P('gift-birthday'), w: 200, x: 505, y: 352, rot: -8, z: 12, shadow: '0 14px 20px rgba(30,5,15,.3)' })}
`;

mkdirSync('tools/.gen', { recursive: true });
mkdirSync('out/google-play', { recursive: true });
const html = page({ canvasW: W, canvasH: H, H, platform: 'android', bg: background('coral', { angle: 100 }), body, designW: W });
const file = resolve('tools/.gen/feature-graphic.html');
writeFileSync(file, html);
const b = await launch();
await b.viewport(W, H, 1, false);
await b.navigate(pathToFileURL(file).href, 600);
await b.evaluate(`Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
await b.sleep(500);
await b.shot('out/google-play/feature-graphic-1024x500.png');
console.log('✓ feature graphic');
await b.close();
