// Six more icon directions that carry the whole app (card, saved dates, private link, photos, Pip).
// Renders each at 1024x1024 (opaque), a subject-only copy on magenta (to measure the Android safe
// zone), and two comparison sheets. Run: node icons-v2.mjs, then python3 icons-v2-post.py.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../images/icons/v2');
mkdirSync(OUT, { recursive: true });
mkdirSync(resolve(here, '.gen'), { recursive: true });

// App palette (src/shared/theme/tokens.ts) and Pip's colours (tokens.mascot).
const C = {
  coral: '#E8615D', coralDeep: '#C94E4A', peach: '#F7C9B6', cream: '#FDF6F2', ink: '#2A2220',
  amber: '#F6A94A', butter: '#F9D56E', sage: '#5B7A6E', rose: '#E07A8A', roseSoft: '#FCE3E8',
};
const M = {
  light: '#FFB27A', base: '#FF8A4C', shade: '#E2622B', cheek: '#FF5D7A', ink: '#2B1B2E',
  hatRed: '#FF4D6D', hatBand: '#FFD166', hatBlue: '#3A86FF', hatBrim: '#FFB703',
};

// Heart centred on (0,0): about 1.0*s wide, 0.85*s tall.
const heart = (s, dy = 0) =>
  `M0 ${s * 0.42 + dy} C${-s * 0.62} ${-s * 0.02 + dy}, ${-s * 0.44} ${-s * 0.46 + dy}, ${-s * 0.2} ${-s * 0.46 + dy} C${-s * 0.08} ${-s * 0.46 + dy}, 0 ${-s * 0.38 + dy}, 0 ${-s * 0.26 + dy} C0 ${-s * 0.38 + dy}, ${s * 0.08} ${-s * 0.46 + dy}, ${s * 0.2} ${-s * 0.46 + dy} C${s * 0.44} ${-s * 0.46 + dy}, ${s * 0.62} ${-s * 0.02 + dy}, 0 ${s * 0.42 + dy} Z`;

const sparkle = (x, y, r, c = '#fff', o = 0.95) =>
  `<path d="M${x} ${y - r} Q${x + r * 0.14} ${y - r * 0.14} ${x + r} ${y} Q${x + r * 0.14} ${y + r * 0.14} ${x} ${y + r} Q${x - r * 0.14} ${y + r * 0.14} ${x - r} ${y} Q${x - r * 0.14} ${y - r * 0.14} ${x} ${y - r} Z" fill="${c}" opacity="${o}"/>`;

// Pip's party hat, brim centred on (x, y), scale k, tilted.
const hat = (x, y, k, rot = -9) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k}) translate(-120 -46)">
  <path d="M82 46L120 -32L158 46Z" fill="${M.hatRed}"/>
  <path d="M98 14L142 14L150 32L90 32Z" fill="${M.hatBand}"/>
  <path d="M104 -2L136 -2L141 10L99 10Z" fill="${M.hatBlue}" opacity=".9"/>
  <ellipse cx="120" cy="46" rx="41" ry="8.5" fill="${M.hatBrim}"/>
  <circle cx="120" cy="-33" r="10" fill="#fff"/><circle cx="117" cy="-36" r="3.5" fill="#fff" opacity=".8"/></g>`;

// Pip's head and face, body centre on (x, y), scale k.
const pipHead = (x, y, k, id) => `<g transform="translate(${x - 120 * k} ${y - 128 * k}) scale(${k})">
  <defs><radialGradient id="pb${id}" cx="36%" cy="26%" r="82%"><stop offset="0" stop-color="${M.light}"/><stop offset=".58" stop-color="${M.base}"/><stop offset="1" stop-color="${M.shade}"/></radialGradient></defs>
  <path d="M120 24C178 24 214 76 214 138C214 196 178 232 120 232C62 232 26 196 26 138C26 76 62 24 120 24Z" fill="url(#pb${id})"/>
  <ellipse cx="78" cy="70" rx="30" ry="17" fill="#fff" opacity=".28" transform="rotate(-24 78 70)"/>
  <ellipse cx="56" cy="152" rx="15" ry="9.5" fill="${M.cheek}" opacity=".6"/><ellipse cx="184" cy="152" rx="15" ry="9.5" fill="${M.cheek}" opacity=".6"/>
  <ellipse cx="86" cy="122" rx="19" ry="24" fill="#fff"/><ellipse cx="154" cy="122" rx="19" ry="24" fill="#fff"/>
  <circle cx="88" cy="126" r="13.5" fill="${M.ink}"/><circle cx="152" cy="126" r="13.5" fill="${M.ink}"/>
  <circle cx="93" cy="119" r="5.4" fill="#fff"/><circle cx="147" cy="119" r="5.4" fill="#fff"/>
  <path d="M66 94Q86 80 106 92" stroke="${M.ink}" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  <path d="M134 92Q154 80 174 94" stroke="${M.ink}" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  <path d="M103 158Q120 176 137 158" stroke="${M.ink}" stroke-width="5" stroke-linecap="round" fill="none"/>
  <g transform="rotate(-9 120 44)">
    <path d="M82 46L120 -32L158 46Z" fill="${M.hatRed}"/><path d="M98 14L142 14L150 32L90 32Z" fill="${M.hatBand}"/>
    <path d="M104 -2L136 -2L141 10L99 10Z" fill="${M.hatBlue}" opacity=".9"/><ellipse cx="120" cy="46" rx="41" ry="8.5" fill="${M.hatBrim}"/>
    <circle cx="120" cy="-33" r="10" fill="#fff"/></g></g>`;

const shadow = (id, dy, blur, color, op) =>
  `<filter id="${id}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="${color}" flood-opacity="${op}"/></filter>`;

const OSEAL = {
  name: 'J · O Seal',
  says: 'The “O” of Occasio as a ring around a heart, with Pip’s hat on top: a monogram you can recognise at 29 px.',
  reflects: 'Brand letter + heart + Pip’s hat',
  bg: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F57B6F"/><stop offset="1" stop-color="#C94E4A"/></linearGradient>
       <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFDFB"/><stop offset="1" stop-color="#F9D3C3"/></linearGradient>`,
  bgFill: 'url(#bg)',
  defs: shadow('sh', 16, 16, '#5a0f12', 0.34),
  subject: `<g filter="url(#sh)"><circle cx="0" cy="0" r="206" fill="url(#ring)"/></g>
    <circle cx="0" cy="0" r="166" fill="none" stroke="#F7C9B6" stroke-width="12"/>
    <g filter="url(#sh)"><path d="${heart(206, 0)}" transform="translate(0 10)" fill="${C.coral}"/></g>
    <path d="M-62 -26 Q-34 -62 8 -44" stroke="#fff" stroke-opacity=".55" stroke-width="12" stroke-linecap="round" fill="none"/>
    <g filter="url(#sh)">${hat(142, -166, 2.2, 26)}</g>
    ${sparkle(-246, -150, 24, '#FFE29A')}${sparkle(240, 168, 18, '#fff', 0.85)}`,
  shift: 22,
  scale: 1.2,
};

const CONCEPTS = {
  'd-pip-peek': {
    name: 'D · Pip Peek',
    says: 'Pip peeks out of a sealed card: the character, the card, the surprise inside.',
    reflects: 'Pip + card + heart seal',
    bg: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F68578"/><stop offset="1" stop-color="#D4504D"/></linearGradient>`,
    bgFill: 'url(#bg)',
    defs: shadow('sh', 18, 18, '#5a0f12', 0.34) + shadow('sh2', 8, 8, '#5a0f12', 0.3),
    subject: `<g filter="url(#sh)">${pipHead(0, -72, 1.5, 'd')}</g>
      <g filter="url(#sh)"><rect x="-212" y="44" width="424" height="196" rx="46" fill="#FFF4EC"/>
        <path d="M-206 232 L0 122 L206 232" stroke="#F2C3AE" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
      <g filter="url(#sh2)"><path d="${heart(112, 0)}" transform="translate(0 150)" fill="${C.coral}"/></g>
      <path d="M-34 124 Q-16 106 8 116" stroke="#fff" stroke-opacity=".6" stroke-width="9" stroke-linecap="round" fill="none"/>
      ${sparkle(222, -200, 30, '#FFE29A')}${sparkle(-236, -150, 20, '#fff', 0.85)}`,
    shift: 14,
    scale: 1.3,
  },
  'e-hat-heart': {
    name: 'E · Hat Heart',
    says: 'A heart wearing Pip’s party hat: love + celebration + the mascot’s signature, in one flat mark.',
    reflects: 'Heart + Pip’s hat + occasion',
    bg: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD470"/><stop offset="1" stop-color="#F29B3B"/></linearGradient>
         <linearGradient id="hf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDFB"/><stop offset="1" stop-color="#FBD9CB"/></linearGradient>`,
    bgFill: 'url(#bg)',
    defs: shadow('sh', 20, 20, '#7a3a05', 0.34),
    subject: `<g filter="url(#sh)"><path d="${heart(540, 36)}" fill="url(#hf)"/></g>
      <path d="M-196 -52 Q-176 -118 -112 -126" stroke="#fff" stroke-width="16" stroke-linecap="round" fill="none" opacity=".85"/>
      <g filter="url(#sh)">${hat(-112, -160, 2.6, -18)}</g>
      ${sparkle(236, -176, 34, '#fff', 0.95)}${sparkle(-260, 150, 22, '#fff', 0.8)}${sparkle(226, 190, 18, '#FFE29A', 0.9)}`,
    shift: 26,
    scale: 1.18,
  },
  'f-reveal': {
    name: 'F · Tap to Open',
    says: 'The moment a recipient opens it: the card lifts out of the envelope and the room lights up.',
    reflects: 'Private link + recipient reveal',
    bg: `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9B556"/><stop offset=".55" stop-color="#F0766A"/><stop offset="1" stop-color="#D4504D"/></linearGradient>
         <radialGradient id="glow" cx=".5" cy=".38" r=".5"><stop offset="0" stop-color="#FFF3C8" stop-opacity=".85"/><stop offset="1" stop-color="#FFF3C8" stop-opacity="0"/></radialGradient>
         <linearGradient id="hc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F26660"/><stop offset="1" stop-color="#D23C47"/></linearGradient>`,
    bgFill: 'url(#bg)',
    bgExtra: `<rect width="1024" height="1024" fill="url(#glow)"/>`,
    defs: shadow('sh', 16, 16, '#5a0f12', 0.34) + shadow('sh2', 10, 10, '#5a0f12', 0.32),
    subject: `${[...Array(9)].map((_, i) => { const a = (-160 + i * 17.5) * Math.PI / 180; return `<line x1="${Math.cos(a) * 196}" y1="${-30 + Math.sin(a) * 196}" x2="${Math.cos(a) * 252}" y2="${-30 + Math.sin(a) * 252}" stroke="#FFE9A8" stroke-width="16" stroke-linecap="round"/>`; }).join('')}
      <g filter="url(#sh)"><path d="M-200 60 L0 -128 L200 60 Z" fill="#F4C9B4"/></g>
      <g filter="url(#sh2)" transform="translate(0 -22) rotate(-7)"><path d="${heart(300, 0)}" fill="url(#hc)"/>
        <path d="M-78 -74 Q-48 -108 -6 -90" stroke="#fff" stroke-opacity=".6" stroke-width="13" stroke-linecap="round" fill="none"/></g>
      <g filter="url(#sh)"><rect x="-206" y="38" width="412" height="192" rx="44" fill="#FFF4EC"/>
        <path d="M-200 224 L-26 98 Q0 80 26 98 L200 224" stroke="#F2C3AE" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
      ${sparkle(-232, -150, 24, '#fff')}${sparkle(240, -170, 30, '#FFF1B8')}${sparkle(248, 30, 16, '#fff', 0.85)}`,
    shift: 4,
    scale: 1.3,
  },
  'g-date-hat': {
    name: 'G · Date Hat',
    says: 'The Vault’s promise: it remembers the day, and the hat says it is a celebration.',
    reflects: 'Saved dates + heart + Pip’s hat',
    bg: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBD0D8"/><stop offset="1" stop-color="#F0919F"/></linearGradient>
         <linearGradient id="hc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F26660"/><stop offset="1" stop-color="#D23C47"/></linearGradient>`,
    bgFill: 'url(#bg)',
    defs: shadow('sh', 16, 16, '#6a1d2a', 0.3),
    subject: `<g filter="url(#sh)"><rect x="-196" y="-146" width="392" height="404" rx="64" fill="#FFF8F2"/></g>
      <clipPath id="pg"><rect x="-196" y="-146" width="392" height="404" rx="64"/></clipPath>
      <g clip-path="url(#pg)"><rect x="-196" y="-146" width="392" height="112" fill="${C.coral}"/><rect x="-196" y="-40" width="392" height="8" fill="${C.coralDeep}" opacity=".3"/></g>
      <rect x="-118" y="-186" width="34" height="86" rx="17" fill="#FFF8F2" stroke="${C.coralDeep}" stroke-opacity=".4" stroke-width="5"/>
      <rect x="84" y="-186" width="34" height="86" rx="17" fill="#FFF8F2" stroke="${C.coralDeep}" stroke-opacity=".4" stroke-width="5"/>
      <path d="${heart(206, 0)}" transform="translate(0 118)" fill="url(#hc)"/>
      <path d="M-54 78 Q-26 50 10 68" stroke="#fff" stroke-opacity=".6" stroke-width="11" stroke-linecap="round" fill="none"/>
      <g filter="url(#sh)">${hat(150, -150, 2.1, 18)}</g>
      ${sparkle(-236, -190, 24, '#fff')}${sparkle(236, 230, 20, '#fff', 0.85)}`,
    shift: 22,
    scale: 1.2,
  },
  'h-photo-card': {
    name: 'H · Photo Card',
    says: 'Your photo and your words on a card: the one thing the app makes, in a calm green that stands out from red-and-pink love apps.',
    reflects: 'Photos + words (frames)',
    bg: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6E9082"/><stop offset="1" stop-color="#3F5D52"/></linearGradient>
         <linearGradient id="ph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAD3C0"/><stop offset="1" stop-color="#EE7C6F"/></linearGradient>`,
    bgFill: 'url(#bg)',
    defs: shadow('sh', 18, 18, '#14261f', 0.4),
    subject: `<g filter="url(#sh)" transform="rotate(7)"><rect x="-176" y="-206" width="352" height="412" rx="30" fill="#E9DFD2"/></g>
      <g filter="url(#sh)" transform="rotate(-6)"><rect x="-176" y="-206" width="352" height="412" rx="30" fill="#FFF8F2"/>
        <rect x="-148" y="-178" width="296" height="292" rx="14" fill="url(#ph)"/>
        <path d="${heart(190, 0)}" transform="translate(0 -30)" fill="#FFF8F2"/>
        <path d="M-108 150 Q-70 128 -34 148 T40 146" stroke="${C.ink}" stroke-width="9" stroke-linecap="round" fill="none" opacity=".75"/>
        <path d="${heart(34, 0)}" transform="translate(96 146)" fill="${C.coral}"/>
        <rect x="-52" y="-224" width="104" height="38" rx="6" fill="${C.butter}" opacity=".9" transform="rotate(-4)"/></g>`,
    shift: 8,
    scale: 1.25,
  },
  'i-balloon-card': {
    name: 'I · Heart Balloon',
    says: 'A heart balloon carries a card to someone: sent, floating up, on its way. A deep warm base so it stands apart on any wallpaper.',
    reflects: 'Sending + celebration (the balloons in the finale)',
    bg: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A3633"/><stop offset="1" stop-color="#2A2220"/></linearGradient>
         <radialGradient id="glow" cx=".5" cy=".3" r=".55"><stop offset="0" stop-color="${C.coral}" stop-opacity=".4"/><stop offset="1" stop-color="${C.coral}" stop-opacity="0"/></radialGradient>
         <linearGradient id="hc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F47A72"/><stop offset="1" stop-color="#D2424A"/></linearGradient>`,
    bgFill: 'url(#bg)',
    bgExtra: `<rect width="1024" height="1024" fill="url(#glow)"/>`,
    defs: shadow('sh', 12, 12, '#000', 0.4),
    subject: `<path d="M0 74 C-30 120 30 150 0 196" stroke="#FFF4EC" stroke-width="7" stroke-linecap="round" fill="none" opacity=".9"/>
      <g filter="url(#sh)"><path d="${heart(380, 0)}" transform="translate(0 -96)" fill="url(#hc)"/>
        <path d="M-12 62 L-30 90 L30 90 L12 62 Z" fill="${C.coralDeep}" transform="translate(0 -8)"/>
        <path d="M-118 -170 Q-84 -216 -34 -196" stroke="#fff" stroke-opacity=".55" stroke-width="17" stroke-linecap="round" fill="none"/></g>
      <g filter="url(#sh)" transform="translate(0 232) rotate(4)"><rect x="-120" y="-72" width="240" height="150" rx="26" fill="#FFF4EC"/>
        <path d="M-114 -64 L0 20 L114 -64" stroke="#F2C3AE" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
      ${sparkle(-236, -190, 24, '#FFE29A')}${sparkle(240, -120, 30, '#fff', 0.9)}${sparkle(-250, 60, 16, '#fff', 0.7)}${sparkle(236, 120, 20, '#FFE29A', 0.9)}`,
    shift: -6,
    scale: 1.25,
  },
  'j-o-seal': OSEAL,
};

const svgOf = (c, { measure = false } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>${c.bg}${c.defs}</defs>
  <rect width="1024" height="1024" fill="${measure ? '#FF00FF' : c.bgFill}"/>${measure ? '' : (c.bgExtra ?? '')}
  <g id="subject" transform="translate(512 ${512 + c.shift * (c.scale ?? 1)}) scale(${c.scale ?? 1})">${c.subject}</g></svg>`;

const wrap = (inner, size = 1024) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${size}px;height:${size}px;overflow:hidden;background:#000}svg,img{display:block;width:${size}px;height:${size}px}</style></head><body>${inner}</body></html>`;

const b = await launch();
await b.viewport(1024, 1024, 1, false);
for (const [id, c] of Object.entries(CONCEPTS)) {
  for (const measure of [false, true]) {
    const f = resolve(here, `.gen/v2-${id}${measure ? '-measure' : ''}.html`);
    writeFileSync(f, wrap(svgOf(c, { measure })));
    await b.navigate(pathToFileURL(f).href, 900);
    await b.sleep(500);
    await b.shot(measure ? resolve(here, `.gen/${id}-measure.png`) : `${OUT}/${id}-1024.png`);
  }
  console.log('✓', id);
}

// ---- Comparison sheet: each concept large, plus 120 / 60 / 29 px, and what it says. ----
const OUT_URL = pathToFileURL(OUT).href;
const SHIPPED = pathToFileURL(resolve(here, 'src/brand/app-icon-shipped-1024.png')).href;
const items = [{ id: 'shipped', name: 'Shipped today', says: 'Gift Heart (3D): what is in the build now.', reflects: 'Love + gift', abs: SHIPPED }]
  .concat(Object.entries(CONCEPTS).map(([id, c]) => ({ id, name: c.name, says: c.says, reflects: c.reflects, abs: `${OUT_URL}/${id}-1024.png` })));
const cell = (it) => `<div class="c"><div class="i"><img src="${it.abs}"></div><div class="n">${it.name}</div><div class="r">${it.reflects}</div><div class="t">${it.says}</div>
  <div class="sm"><div class="s120"><img src="${it.abs}"></div><div class="s60"><img src="${it.abs}"></div><div class="s29"><img src="${it.abs}"></div></div></div>`;
const sheet = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1640px;background:#FDF6F2;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#2A2220}
.g{display:grid;grid-template-columns:repeat(4,340px);gap:44px 56px;padding:56px}.c{width:340px}
.i{width:340px;height:340px;border-radius:76px;overflow:hidden;box-shadow:0 18px 40px rgba(42,34,32,.22)}.i img{width:100%;height:100%;display:block}
.n{margin-top:20px;font-weight:800;font-size:26px}.r{margin-top:4px;font-weight:700;font-size:18px;color:#C94E4A}.t{font-weight:500;font-size:17px;line-height:1.4;color:#4D4340;margin-top:6px;min-height:72px}
.sm{display:flex;gap:18px;align-items:flex-end;margin-top:14px}.sm div{overflow:hidden;box-shadow:0 6px 14px rgba(42,34,32,.2)}.sm img{width:100%;height:100%;display:block}
.s60{width:60px;height:60px;border-radius:14px}.s120{width:120px;height:120px;border-radius:27px}.s29{width:29px;height:29px;border-radius:7px}</style></head><body>
<div class="g">${items.map(cell).join('')}</div></body></html>`;
const sf = resolve(here, '.gen/v2-sheet.html');
writeFileSync(sf, sheet);
await b.viewport(1640, 1500, 1, false);
await b.navigate(pathToFileURL(sf).href, 600);
await b.evaluate(`Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
await b.sleep(500);
await b.shot(`${OUT}/_v2-comparison.png`);
console.log('✓ sheet');

// ---- Home-screen check: every icon at 120 and 60 px on light, dark and warm wallpapers. ----
const all = items;
const row = (bg, label, fg) => `<div class="w" style="background:${bg};color:${fg}"><div class="l">${label}</div><div class="ic">${all.map((it) => `<div class="a"><img style="width:120px;height:120px;border-radius:27px" src="${it.abs}"><img style="width:60px;height:60px;border-radius:13px;margin-top:10px" src="${it.abs}"><span>${it.name.split(' · ').pop()}</span></div>`).join('')}</div></div>`;
const home = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1640px;font-family:system-ui,-apple-system,sans-serif}
.w{padding:26px 40px 30px}.l{font-size:15px;font-weight:700;opacity:.7;margin-bottom:16px}.ic{display:flex;gap:34px}.a{display:flex;flex-direction:column;align-items:center;width:150px}.a span{font-size:15px;margin-top:10px;font-weight:600;text-align:center}img{display:block;box-shadow:0 4px 10px rgba(0,0,0,.18)}</style></head><body>
${row('#ECEEF2', 'Light wallpaper', '#222')}${row('#181A20', 'Dark wallpaper', '#ddd')}${row('linear-gradient(135deg,#D6AA96,#B07C8C)', 'Warm wallpaper', '#2A2220')}</body></html>`;
const hf = resolve(here, '.gen/v2-home.html');
writeFileSync(hf, home);
await b.viewport(1640, 1010, 1, false);
await b.navigate(pathToFileURL(hf).href, 600);
await b.evaluate(`Promise.all([...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
await b.sleep(400);
await b.shot(`${OUT}/_v2-homescreen.png`);
console.log('✓ homescreen');
await b.close();
