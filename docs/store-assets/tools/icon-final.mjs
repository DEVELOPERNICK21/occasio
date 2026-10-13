// The shipped app icon (concept C3: Pip + date badge) drawn once and exported as layers into assets/brand/:
//   app-icon-1024.png        the full icon (opaque)             -> iOS, App Store, Play, website
//   android-foreground.png   Pip + badge on transparent         -> Android adaptive icon (fitted to the safe zone later)
//   android-monochrome.png   one-colour silhouette, face cut out -> Android 13 themed icons
//   notification-glyph.png   Pip's head and hat, one colour     -> Android notification small icon
// Run: node icon-final.mjs, then python3 ../../../scripts/generate-app-icons.py (makes every platform file).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';
import { BG, BODY, HAT_OUTLINE, calendar, chunkyHeart, heart, pip, shadow } from './icon-art.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../../../assets/brand');
mkdirSync(OUT, { recursive: true });
mkdirSync(resolve(here, '.gen'), { recursive: true });

// C3: Pip fills the icon; the calendar-heart is a badge on his side.
const SHIFT = 16;
const SCALE = 0.93;
const PIP = { x: -40, y: 20, k: 3.05 };
const BADGE = 'translate(230 230) rotate(9)';

const subject = `<g filter="url(#sh)">${pip({ ...PIP, id: 'c', feet: true, hands: 'down' })}</g>
  <g filter="url(#sh)" transform="${BADGE}">${calendar({ x: -150, y: -150, w: 300, h: 300, headerH: 74, rings: false, lip: 12 })}
    ${chunkyHeart(0, 52, 128)}</g>`;

const place = (inner) => `<g transform="translate(512 ${512 + SHIFT * SCALE}) scale(${SCALE})">${inner}</g>`;
const defs = BG + shadow('sh', 14, 14, 0.28);

const fullIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs>${defs}</defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>${place(subject)}</svg>`;
const foreground = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs>${defs}</defs>${place(subject)}</svg>`;

// ---- One-colour versions. White in the mask is solid, black is a hole you can see through. ----
const pipMono = ({ x, y, k, feet = true, arms = true }) => `<g transform="translate(${x - 120 * k} ${y - 128 * k}) scale(${k})">
  ${feet ? '<ellipse cx="84" cy="236" rx="29" ry="13" fill="#fff"/><ellipse cx="156" cy="236" rx="29" ry="13" fill="#fff"/>' : ''}
  ${arms ? '<ellipse cx="22" cy="152" rx="15" ry="27" fill="#fff" transform="rotate(14 22 152)"/><ellipse cx="218" cy="152" rx="15" ry="27" fill="#fff" transform="rotate(-14 218 152)"/>' : ''}
  <path d="${BODY}" fill="#fff"/>
  ${HAT_OUTLINE('#000', 11)}
  <g transform="rotate(-9 120 44)"><path d="M82 46L120 -32L158 46Z" fill="#fff"/>
    <path d="M98 14L142 14L150 32L90 32Z" fill="#000"/><path d="M104 -2L136 -2L141 10L99 10Z" fill="#000"/>
    <ellipse cx="120" cy="46" rx="41" ry="8.5" fill="#fff"/><circle cx="120" cy="-33" r="10" fill="#fff"/></g>
  <ellipse cx="88" cy="116" rx="24" ry="30" fill="#000"/><ellipse cx="152" cy="116" rx="24" ry="30" fill="#000"/>
  <circle cx="91" cy="121" r="16" fill="#fff"/><circle cx="149" cy="121" r="16" fill="#fff"/>
  <circle cx="97" cy="112" r="6" fill="#000"/><circle cx="143" cy="112" r="6" fill="#000"/>
  <path d="M92 152Q120 160 148 152Q142 194 120 196Q98 194 92 152Z" fill="#000"/></g>`;

const badgeMono = `<g transform="${BADGE}">
  <rect x="-150" y="-150" width="300" height="300" rx="64" fill="#000" stroke="#000" stroke-width="30"/>
  <rect x="-150" y="-150" width="300" height="300" rx="64" fill="#fff"/>
  <rect x="-150" y="-82" width="300" height="12" fill="#000"/>
  <path d="${heart(128)}" transform="translate(0 52)" fill="#000"/></g>`;

const maskSvg = (inner, color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs>
  <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024"><rect width="1024" height="1024" fill="#000"/>${inner}</mask></defs>
  <rect width="1024" height="1024" fill="${color}" mask="url(#m)"/></svg>`;

const monochrome = maskSvg(place(pipMono(PIP) + badgeMono), '#000');
// Notification: just his head and hat, bigger, with no feet, arms or badge.
const glyph = maskSvg(`<g transform="translate(512 580)">${pipMono({ x: 0, y: 0, k: 3.4, feet: false, arms: false })}</g>`, '#fff');

const page = (inner, bg) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}html,body{width:1024px;height:1024px;overflow:hidden;background:${bg}}svg{display:block;width:1024px;height:1024px}</style></head><body>${inner}</body></html>`;

const b = await launch();
await b.viewport(1024, 1024, 1, false);
const jobs = [
  ['app-icon-1024.png', fullIcon, '#000', false],
  ['android-foreground.png', foreground, 'transparent', true],
  ['android-monochrome.png', monochrome, 'transparent', true],
  ['notification-glyph.png', glyph, 'transparent', true],
];
for (const [file, svg, bg, transparent] of jobs) {
  const f = resolve(here, `.gen/final-${file}.html`);
  writeFileSync(f, page(svg, bg));
  await b.navigate(pathToFileURL(f).href, 900);
  await b.sleep(500);
  await b.shot(`${OUT}/${file}`, { transparent });
  console.log('✓', file);
}
await b.close();
