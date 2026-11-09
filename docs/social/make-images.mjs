// Builds the five social post images (1080x1350, 4:5) for Threads and Reddit.
//   node docs/social/make-images.mjs            all five
//   node docs/social/make-images.mjs 3 4        only posts 3 and 4
// Reuses the store-asset design kit (palette, phone frame, headline) and the real app screens in
// docs/store-assets/tools/src/screens. Needs Node 22+ and Chrome / Brave / Edge (see cdp.mjs). Fonts load from Google Fonts.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { launch } from '../store-assets/tools/cdp.mjs';
import { page, background, glow, ring, confetti, phone as rawPhone, prop, headline, eyebrow, HUES, DESIGN_W as W } from '../store-assets/tools/design.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const TOOLS = resolve(here, '../store-assets/tools');
const OUT = resolve(here, 'images');
const STRIPS = JSON.parse(readFileSync(`${TOOLS}/src/screens/strips.json`, 'utf8'));
const S = (n) => pathToFileURL(`${TOOLS}/src/screens/${n}.jpg`).href;
const P = (n) => pathToFileURL(`${TOOLS}/src/props/${n}.png`).href;
const ICON = pathToFileURL(`${TOOLS}/src/brand/app-icon-shipped-1024.png`).href;

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const H = Math.round(CANVAS_H * (W / CANVAS_W)); // design-space height (1650)

/** Recipient-page screens get the browser status-bar band; native screens are already full-bleed. */
const phone = (o) => rawPhone({ ...o, strip: STRIPS[o.img.split('/').pop().replace('.jpg', '')] ?? null, platform: 'ios' });

const backdrop = (hue, seed) =>
  glow(1000, 1250, 700, HUES[hue].light, 0.5) +
  glow(160, H - 260, 600, HUES[hue].light, 0.32) +
  ring(660, 1500, 780) +
  ring(660, 1500, 1000, 0.1) +
  confetti({ seed, n: 30, area: [0, 40, W, H - 40], avoid: [[60, 80, 1200, 560]], colors: ['#ffffff', HUES[hue].accent, '#ffffff', HUES[hue].light] });

const head = (hue, tag, lines, sub, size = 122) =>
  eyebrow({ text: tag, kind: 'open', top: 92, deep: HUES[hue].deep }) +
  headline({ top: 190, lines, sub, accent: HUES[hue].accent, size, subSize: 46, subW: 1040 });

const label = (text, cx, y, deep) =>
  `<div style="position:absolute;left:${cx}px;top:${y}px;transform:translateX(-50%);z-index:30;white-space:nowrap;font:800 30px/1 'Plus Jakarta Sans',system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;padding:15px 28px;border-radius:999px;background:#fff;color:${deep};box-shadow:0 10px 26px rgba(30,5,15,.25)">${text}</div>`;

/** Small brand chip at the bottom so every image carries the name. */
const brand = () =>
  `<div style="position:absolute;left:50%;bottom:44px;transform:translateX(-50%);z-index:40;display:flex;align-items:center;gap:18px;padding:12px 34px 12px 14px;border-radius:999px;background:#fff;box-shadow:0 14px 36px rgba(30,5,15,.3)">
    <img src="${ICON}" style="width:64px;height:64px;border-radius:16px">
    <span style="font:700 40px/1 'Fraunces',Georgia,serif;color:#2A2220;letter-spacing:-.01em">Occasio</span>
  </div>`;

const POSTS = [
  {
    id: '1-candles',
    hue: 'marigold',
    seed: 11,
    build: (hue) =>
      head(hue, 'A card they play', 'Blow out the<br>candles on a <em>card</em>', 'Pop balloons. Blow the candles. Unwrap a gift.<br>They play before they read.') +
      phone({ img: S('balloons'), w: 540, x: -150, y: 900, rot: -6, z: 4 }) +
      phone({ img: S('gift-open'), w: 540, x: 930, y: 900, rot: 6, z: 4 }) +
      phone({ img: S('candle'), w: 600, x: 345, y: 700, rot: 0, z: 6 }),
  },
  {
    id: '2-no-button',
    hue: 'rose',
    seed: 22,
    build: (hue) => {
      const d = HUES[hue].deep;
      return (
        head(hue, 'A small detail', 'What happens when<br>they tap <em>No</em>', 'Say no twice and it becomes yes.<br>Nobody gets stuck.') +
        phone({ img: S('gate'), w: 480, x: -70, y: 800, rot: -3, z: 4 }) +
        phone({ img: S('gate-no1'), w: 480, x: 395, y: 730, rot: 0, z: 6 }) +
        phone({ img: S('gate-no2'), w: 480, x: 860, y: 800, rot: 3, z: 4 }) +
        label('1 · Tap No', 190, 740, d) +
        label('2 · Tap again', 660, 670, d) +
        label('3 · It’s a yes', 1100, 740, d)
      );
    },
  },
  {
    id: '3-vault',
    hue: 'coral',
    seed: 33,
    build: (hue) =>
      head(hue, 'Never miss their day', 'Save their<br>birthday <em>once</em>', 'Birthdays and anniversaries in one place.<br>See who is coming up next.') +
      phone({ img: S('vault'), w: 700, x: 120, y: 760, rot: -2, z: 6 }) +
      prop({ img: P('gift-birthday'), w: 560, x: 760, y: H - 520, rot: 8, z: 12 }),
  },
  {
    id: '4-diwali',
    hue: 'marigold',
    seed: 44,
    build: (hue) => {
      const d = HUES[hue].deep;
      return (
        head(hue, 'Diwali is 8 November', 'A Diwali wish they<br><em>open</em>, not forward', 'Your photo and your own words,<br>sent as a private link.', 114) +
        phone({ img: S('thank_you-gate'), w: 560, x: -90, y: 880, rot: -4, z: 4 }) +
        phone({ img: S('just_because-gate'), w: 620, x: 600, y: 780, rot: 3, z: 6 }) +
        label('Thank you', 190, 830, d) +
        label('Just because', 940, 730, d)
      );
    },
  },
  {
    id: '5-how-it-works',
    hue: 'sage',
    seed: 55,
    build: (hue) => {
      const d = HUES[hue].deep;
      return (
        head(hue, 'Free first card', 'Pick it. Write it.<br><em>Send</em> the link.', 'They open it on any phone.<br>No app. No account.') +
        phone({ img: S('moment-picker'), w: 480, x: -70, y: 800, rot: -3, z: 4 }) +
        phone({ img: S('words'), w: 480, x: 395, y: 730, rot: 0, z: 6 }) +
        phone({ img: S('gate'), w: 480, x: 860, y: 800, rot: 3, z: 4 }) +
        label('1 · Pick it', 190, 740, d) +
        label('2 · Write it', 660, 670, d) +
        label('3 · They open it', 1085, 740, d)
      );
    },
  },
];

const only = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const genDir = resolve(tmpdir(), 'occasio-social-gen');
mkdirSync(genDir, { recursive: true });

const b = await launch({ port: 9555 });
await b.viewport(CANVAS_W, CANVAS_H, 1, false);
for (const p of POSTS) {
  if (only.length && !only.some((o) => p.id.startsWith(o))) continue;
  const html = page({
    canvasW: CANVAS_W,
    canvasH: CANVAS_H,
    H,
    platform: 'ios',
    bg: background(p.hue),
    body: backdrop(p.hue, p.seed) + p.build(p.hue) + brand(),
  });
  const file = resolve(genDir, `post-${p.id}.html`);
  writeFileSync(file, html);
  await b.navigate(pathToFileURL(file).href, 600);
  await b.evaluate(`Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
  await b.sleep(500);
  await b.shot(`${OUT}/post-${p.id}.png`);
  console.log('done', p.id);
}
await b.close();
