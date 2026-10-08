// Renders the three icon concepts (1024x1024, opaque) and a side-by-side comparison sheet
// (concepts + the icon that ships today, at store size and at home-screen size).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../images/icons');
mkdirSync(OUT, { recursive: true });
mkdirSync(resolve(here, '.gen'), { recursive: true });

const HEART = (cx, cy, s) =>
  // Heart centred on (cx, cy), width ≈ s.
  `M${cx} ${cy + s * 0.42} C${cx - s * 0.62} ${cy - s * 0.02}, ${cx - s * 0.44} ${cy - s * 0.46}, ${cx - s * 0.2} ${cy - s * 0.46} C${cx - s * 0.08} ${cy - s * 0.46}, ${cx} ${cy - s * 0.38}, ${cx} ${cy - s * 0.26} C${cx} ${cy - s * 0.38}, ${cx + s * 0.08} ${cy - s * 0.46}, ${cx + s * 0.2} ${cy - s * 0.46} C${cx + s * 0.44} ${cy - s * 0.46}, ${cx + s * 0.62} ${cy - s * 0.02}, ${cx} ${cy + s * 0.42} Z`;

const sparkle = (x, y, r, c = '#fff', o = 0.9) =>
  `<path d="M${x} ${y - r} Q${x + r * 0.12} ${y - r * 0.12} ${x + r} ${y} Q${x + r * 0.12} ${y + r * 0.12} ${x} ${y + r} Q${x - r * 0.12} ${y + r * 0.12} ${x - r} ${y} Q${x - r * 0.12} ${y - r * 0.12} ${x} ${y - r} Z" fill="${c}" opacity="${o}"/>`;

const ICONS = {
  'concept-a-sealed-heart': {
    title: 'A · Sealed Heart',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F57B6F"/><stop offset="1" stop-color="#C94E4A"/></linearGradient>
        <radialGradient id="glow" cx=".3" cy=".2" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <linearGradient id="seal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0524F"/><stop offset="1" stop-color="#B8282F"/></linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#5a0f12" flood-opacity=".35"/></filter>
        <filter id="sh2" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#5a0f12" flood-opacity=".35"/></filter>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#glow)"/>
      <g filter="url(#sh)">
        <rect x="180" y="300" width="664" height="450" rx="64" fill="#FFF4EC"/>
        <path d="M180 366 Q180 300 246 300 H778 Q844 300 844 366 L560 580 Q512 616 464 580 Z" fill="#F9D9C8"/>
        <path d="M180 366 L440 560 M844 366 L584 560" stroke="#F2C3AE" stroke-width="10" stroke-linecap="round" fill="none"/>
      </g>
      <g filter="url(#sh2)"><path d="${HEART(512, 560, 270)}" fill="url(#seal)"/></g>
      <path d="M440 505 Q462 478 492 492" stroke="#fff" stroke-opacity=".55" stroke-width="14" stroke-linecap="round" fill="none"/>
      ${sparkle(800, 210, 46, '#FFE29A')}${sparkle(236, 236, 28, '#fff', 0.8)}${sparkle(860, 830, 24, '#fff', 0.7)}
    </svg>`,
  },
  'concept-b-pip': {
    title: 'B · Pip',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC9BC"/><stop offset="1" stop-color="#F4948B"/></linearGradient>
        <radialGradient id="face" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#FFC662"/><stop offset=".6" stop-color="#F69A2E"/><stop offset="1" stop-color="#E5701B"/></radialGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#6a1d10" flood-opacity=".32"/></filter>
        <clipPath id="hat"><path d="M512 130 L372 372 Q512 410 652 372 Z"/></clipPath>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)"/>
      <g filter="url(#sh)">
        <ellipse cx="512" cy="590" rx="318" ry="304" fill="url(#face)"/>
        <g>
          <path d="M512 130 L372 372 Q512 410 652 372 Z" fill="#E8615D"/>
          <g clip-path="url(#hat)"><rect x="300" y="228" width="460" height="46" fill="#FFE29A" transform="rotate(-8 512 250)"/><rect x="300" y="310" width="460" height="46" fill="#FFE29A" transform="rotate(-8 512 330)"/></g>
          <circle cx="512" cy="126" r="38" fill="#FFE29A"/>
        </g>
        <ellipse cx="418" cy="560" rx="52" ry="68" fill="#fff"/><ellipse cx="606" cy="560" rx="52" ry="68" fill="#fff"/>
        <circle cx="428" cy="568" r="34" fill="#2A2220"/><circle cx="596" cy="568" r="34" fill="#2A2220"/>
        <circle cx="440" cy="552" r="12" fill="#fff"/><circle cx="608" cy="552" r="12" fill="#fff"/>
        <ellipse cx="338" cy="660" rx="44" ry="30" fill="#F7826F" opacity=".55"/><ellipse cx="686" cy="660" rx="44" ry="30" fill="#F7826F" opacity=".55"/>
        <path d="M424 678 Q512 770 600 678" stroke="#2A2220" stroke-width="26" stroke-linecap="round" fill="none"/>
      </g>
      ${sparkle(176, 250, 40, '#fff', 0.95)}${sparkle(850, 270, 30, '#FFE29A', 1)}${sparkle(880, 820, 36, '#fff', 0.85)}
      <circle cx="150" cy="800" r="16" fill="#E8615D" opacity=".75"/><circle cx="262" cy="880" r="11" fill="#FFE29A"/><circle cx="780" cy="120" r="12" fill="#fff" opacity=".8"/>
    </svg>`,
  },
  'concept-c-date-heart': {
    title: 'C · Date Heart',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC05A"/><stop offset="1" stop-color="#E5701B"/></linearGradient>
        <radialGradient id="glow" cx=".25" cy=".15" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <linearGradient id="heart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F26660"/><stop offset="1" stop-color="#D23C47"/></linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#6a2a05" flood-opacity=".34"/></filter>
        <clipPath id="page"><rect x="170" y="214" width="684" height="640" rx="96"/></clipPath>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#glow)"/>
      <g filter="url(#sh)"><rect x="170" y="214" width="684" height="640" rx="96" fill="#FFF8F2"/></g>
      <g clip-path="url(#page)"><rect x="170" y="214" width="684" height="188" fill="#E8615D"/><rect x="170" y="388" width="684" height="14" fill="#C94E4A" opacity=".35"/></g>
      <rect x="318" y="162" width="44" height="120" rx="22" fill="#FFF8F2" stroke="#C94E4A" stroke-opacity=".35" stroke-width="6"/>
      <rect x="662" y="162" width="44" height="120" rx="22" fill="#FFF8F2" stroke="#C94E4A" stroke-opacity=".35" stroke-width="6"/>
      <path d="${HEART(512, 640, 330)}" fill="url(#heart)"/>
      <path d="M416 570 Q444 536 482 554" stroke="#fff" stroke-opacity=".6" stroke-width="16" stroke-linecap="round" fill="none"/>
      ${sparkle(824, 150, 40, '#FFF1B8')}${sparkle(200, 900, 28, '#fff', 0.8)}${sparkle(860, 900, 22, '#fff', 0.7)}
    </svg>`,
  },
};

const wrap = (inner, size = 1024) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${size}px;height:${size}px;overflow:hidden;background:#000}svg,img{display:block;width:${size}px;height:${size}px}</style></head><body>${inner}</body></html>`;

const b = await launch();
await b.viewport(1024, 1024, 1, false);
for (const [id, def] of Object.entries(ICONS)) {
  const f = resolve(here, `.gen/${id}.html`);
  writeFileSync(f, wrap(def.svg));
  await b.navigate(pathToFileURL(f).href, 900);
  await b.sleep(700);
  await b.shot(`${OUT}/${id}-1024.png`);
  console.log('✓', id);
}

// Comparison sheet: shipped icon + 3 concepts, at 300px (squircle mask) and at 60/120px home-screen sizes.
const items = [
  { name: 'Shipped today', title: 'Gift Heart (3D)', src: '../src/brand/app-icon-shipped-1024.png' },
  { name: 'Concept A', title: 'Sealed Heart', src: `../../images/icons/concept-a-sealed-heart-1024.png` },
  { name: 'Concept B', title: 'Pip', src: `../../images/icons/concept-b-pip-1024.png` },
  { name: 'Concept C', title: 'Date Heart', src: `../../images/icons/concept-c-date-heart-1024.png` },
];
const sheet = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1600px;height:760px;background:#FDF6F2;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#2A2220}
.row{display:flex;gap:44px;padding:50px 56px 0}.c{width:340px}.i{width:340px;height:340px;border-radius:76px;overflow:hidden;box-shadow:0 18px 40px rgba(42,34,32,.22)}.i img{width:100%;height:100%;display:block}
.n{margin-top:22px;font-weight:800;font-size:26px}.t{font-weight:500;font-size:22px;color:#857371;margin-top:4px}
.sm{display:flex;gap:18px;align-items:flex-end;margin-top:22px}.sm div{overflow:hidden;box-shadow:0 6px 14px rgba(42,34,32,.2)}.sm img{width:100%;height:100%;display:block}
.s60{width:60px;height:60px;border-radius:14px}.s120{width:120px;height:120px;border-radius:27px}.s29{width:29px;height:29px;border-radius:7px}</style></head><body>
<div class="row">${items
  .map(
    (it) => `<div class="c"><div class="i"><img src="${it.src}"></div><div class="n">${it.name}</div><div class="t">${it.title}</div>
    <div class="sm"><div class="s120"><img src="${it.src}"></div><div class="s60"><img src="${it.src}"></div><div class="s29"><img src="${it.src}"></div></div></div>`,
  )
  .join('')}</div></body></html>`;
const sf = resolve(here, '.gen/icon-sheet.html');
writeFileSync(sf, sheet);
await b.viewport(1600, 760, 1, false);
await b.navigate(pathToFileURL(sf).href, 600);
await b.evaluate(`Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
await b.sleep(400);
await b.shot(`${OUT}/_icon-comparison.png`);
console.log('✓ sheet');
await b.close();
