// Renders four tab bar directions (two states each) with the real Lucide icons, Pip and the
// app palette, so a direction can be chosen before it is built. Run: node tab-bar-options.mjs
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from '../../store-assets/tools/cdp.mjs';
import { pip } from '../../store-assets/tools/icon-art.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ICONS = resolve(here, '../../../node_modules/lucide-react-native/dist/esm/icons');
mkdirSync(resolve(here, '.gen'), { recursive: true });

const C = { bg: '#FDF6F2', surface: '#FFFFFF', sidebar: '#FCEEE8', border: '#EDD5CA', ink: '#2A2220', muted: '#857371',
  accent: '#E8615D', accentHover: '#C94E4A', accentSoft: '#F7C9B6', butter: '#F9D56E', sage: '#5B7A6E' };

function nodes(file) {
  const src = readFileSync(`${ICONS}/${file}.mjs`, 'utf8');
  const m = src.match(/createLucideIcon\("[^"]+",\s*(\[[\s\S]*?\])\);/);
  return new Function(`return ${m[1]}`)();
}
const cache = {};
function icon(file, size, color, sw = 2) {
  cache[file] ??= nodes(file);
  const inner = cache[file]
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
const TABS = [
  { id: 'create', label: 'Create', file: 'wand-sparkles' },
  { id: 'vault', label: 'Vault', file: 'heart-plus' },
  { id: 'history', label: 'History', file: existsHistory() },
  { id: 'account', label: 'Account', file: 'circle-user-round' },
];
function existsHistory() { try { readFileSync(`${ICONS}/history.mjs`); return 'history'; } catch { return 'clock'; } }
const badge = (n) => `<span class="badge">${n}</span>`;
const pipFace = (size, id, mood = 'hopeful') =>
  `<svg width="${size}" height="${size * 1.08}" viewBox="-6 -52 252 292">${pip({ x: 120, y: 128, k: 1, id, feet: false, hands: 'none' })}</svg>`;

/* A: the active tab grows into a coral pill that carries its name. */
function barA(active) {
  return `<div class="bar a">${TABS.map((t) => {
    const on = t.id === active;
    return on
      ? `<div class="a-on">${icon(t.file, 22, '#fff', 2.2)}<b>${t.label}</b></div>`
      : `<div class="a-off">${icon(t.file, 24, C.muted, 1.9)}${t.id === 'vault' ? badge(2) : ''}</div>`;
  }).join('')}</div>`;
}
/* B: Duolingo-style: big icons, no labels, the active one sits in a chunky tile with a lip. */
function barB(active) {
  return `<div class="bar b">${TABS.map((t) => {
    const on = t.id === active;
    return `<div class="b-slot"><div class="${on ? 'b-tile' : 'b-flat'}">${icon(t.file, 28, on ? C.accent : C.muted, on ? 2.4 : 2)}${t.id === 'vault' && !on ? badge(2) : ''}</div></div>`;
  }).join('')}</div>`;
}
/* C: Create is Pip himself, a round button of its own beside a bar of the other three. */
function barC(active) {
  const others = TABS.filter((t) => t.id !== 'create');
  return `<div class="c-wrap"><div class="bar c">${others.map((t) => {
    const on = t.id === active;
    return `<div class="c-tab ${on ? 'on' : ''}">${icon(t.file, 24, on ? C.accentHover : C.muted, on ? 2.3 : 1.9)}<i>${t.label}</i>${t.id === 'vault' && !on ? badge(2) : ''}</div>`;
  }).join('')}</div>
  <div class="c-pip ${active === 'create' ? 'on' : ''}">${pipFace(46, 'cpip')}<u>Create</u></div></div>`;
}
/* D: a docked bar, every label always shown, a soft capsule behind the active icon. */
function barD(active) {
  return `<div class="bar d">${TABS.map((t) => {
    const on = t.id === active;
    return `<div class="d-tab ${on ? 'on' : ''}"><div class="d-cap">${icon(t.file, 24, on ? C.accentHover : C.muted, on ? 2.3 : 1.9)}${t.id === 'vault' && !on ? badge(2) : ''}</div><i>${t.label}</i></div>`;
  }).join('')}</div>`;
}

const ROWS = [
  ['A', 'Expanding pill', 'The active tab grows into a coral pill with its name. Compact, lively, easy to read.', barA],
  ['B', 'Chunky tiles (Duolingo style)', 'Big icons, no labels, the current one in a raised tile. Playful; names live in screen-reader labels only.', barB],
  ['C', 'Pip is Create', 'Your main action is Pip himself in his own round button; the other three sit in a calm bar.', barC],
  ['D', 'Docked + labels', 'A familiar docked bar with every label and a soft capsule behind the active icon. The safest.', barD],
];
const content = `<div class="page"><div class="card"><i></i><i style="width:55%"></i></div><div class="card"><i></i><i style="width:70%"></i></div></div>`;
const cell = (fn, active) => `<div class="phone ${fn === barB ? 'flush' : ''}">${content}${fn(active)}</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1000px;background:#F4EBE6;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:${C.ink};padding:28px}
h2{font-size:15px;font-weight:800;margin:0 0 3px}h2 em{font-style:normal;color:${C.accentHover}}
p{font-size:12px;color:#4D4340;margin-bottom:10px;max-width:640px;line-height:1.4}
.row{margin-bottom:26px}.cells{display:flex;gap:28px}
.phone{position:relative;width:390px;height:150px;background:${C.bg};border-radius:22px;overflow:hidden;box-shadow:0 8px 24px rgba(42,34,32,.12)}
.page{padding:14px 16px;display:flex;gap:10px}
.card{flex:1;height:60px;border-radius:14px;background:#fff;border:1px solid ${C.border};padding:12px;display:flex;flex-direction:column;gap:7px}
.card i{height:7px;border-radius:4px;background:${C.border};width:90%}
.bar{position:absolute;left:16px;right:16px;bottom:12px;height:64px;background:#fff;border:1px solid ${C.border};box-shadow:0 8px 20px rgba(42,34,32,.14)}
.badge{position:absolute;top:-5px;right:-8px;min-width:16px;height:16px;border-radius:8px;background:${C.accentHover};border:1.5px solid #fff;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 3px;font-style:normal}
/* A */
.a{border-radius:999px;display:flex;align-items:center;padding:0 8px;gap:2px}
.a-off{flex:1;display:flex;align-items:center;justify-content:center;height:100%;position:relative}
.a-on{display:flex;align-items:center;gap:8px;height:46px;padding:0 20px 0 16px;border-radius:999px;background:${C.accent};color:#fff;box-shadow:0 6px 12px rgba(232,97,93,.35)}
.a-on b{font-size:14px;font-weight:700}
.a-off .badge{right:calc(50% - 22px);top:12px}
/* B */
.b{left:0;right:0;bottom:0;height:78px;border-radius:0;border-width:2px 0 0 0;box-shadow:none;display:flex;align-items:center;padding:0 10px}
.phone.flush{}
.b-slot{flex:1;display:flex;justify-content:center}
.b-flat{width:56px;height:50px;display:flex;align-items:center;justify-content:center;position:relative}
.b-tile{width:58px;height:50px;display:flex;align-items:center;justify-content:center;border-radius:16px;background:${C.sidebar};border:2px solid ${C.accent};box-shadow:0 3px 0 ${C.accent}}
.b-flat .badge{right:6px;top:4px}
/* C */
.c-wrap{position:absolute;left:16px;right:16px;bottom:12px;height:64px;display:flex;gap:12px;align-items:flex-end}
.c-wrap .bar{position:relative;left:auto;right:auto;bottom:auto;flex:1;border-radius:999px;display:flex;height:64px}
.c-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;position:relative}
.c-tab i{font-size:11px;font-style:normal;font-weight:600;color:${C.muted}}
.c-tab.on i{color:${C.ink};font-weight:700}
.c-tab.on::before{content:"";position:absolute;top:7px;width:44px;height:30px;border-radius:15px;background:${C.sidebar};z-index:0}
.c-tab svg{position:relative;z-index:1;margin-top:-2px}
.c-pip{position:relative;width:78px;height:78px;margin-bottom:-2px;border-radius:50%;background:${C.sidebar};border:2px solid ${C.border};box-shadow:0 8px 18px rgba(42,34,32,.18);display:flex;align-items:flex-start;justify-content:center;padding-top:7px}
.c-pip u{position:absolute;bottom:7px;font-size:11px;font-weight:700;text-decoration:none;color:${C.ink}}
.c-pip.on{background:${C.accentSoft};border:3px solid ${C.accent};box-shadow:0 8px 18px rgba(232,97,93,.35)}
.c-pip svg{margin-top:-2px}
.c-tab .badge{right:calc(50% - 22px);top:10px}
/* D */
.d{left:0;right:0;bottom:0;height:78px;border-radius:24px 24px 0 0;border-width:1px 0 0 0;display:flex;padding:0 6px;box-shadow:0 -6px 18px rgba(42,34,32,.1)}
.d-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding-bottom:6px}
.d-cap{position:relative;width:62px;height:32px;border-radius:16px;display:flex;align-items:center;justify-content:center}
.d-tab.on .d-cap{background:${C.accentSoft}}
.d-tab i{font-size:11px;font-style:normal;font-weight:600;color:${C.muted}}
.d-tab.on i{color:${C.ink};font-weight:700}
.d-cap .badge{right:8px;top:-4px}
.states{font-size:10px;font-weight:700;color:${C.muted};letter-spacing:.06em;text-transform:uppercase;margin:0 0 5px 4px;display:flex;gap:28px}.states span{width:390px}
</style></head><body>
${ROWS.map(([k, name, why, fn]) => `<div class="row"><h2><em>${k}</em> · ${name}</h2><p>${why}</p>
<div class="states"><span>Create selected</span><span>Vault selected · 2 coming up</span></div>
<div class="cells">${cell(fn, 'create')}${cell(fn, 'vault')}</div></div>`).join('')}
</body></html>`;

const f = resolve(here, '.gen/options.html');
writeFileSync(f, html);
const b = await launch();
await b.viewport(1000, 1040, 2, false);
await b.navigate(pathToFileURL(f).href, 800);
await b.evaluate(`Promise.all([document.fonts.ready]).then(() => true)`);
await b.sleep(600);
const h = await b.evaluate('document.body.scrollHeight');
await b.viewport(1000, Number(h) || 1040, 2, false);
await b.sleep(300);
await b.shot(resolve(here, 'tab-bar-options.png'));
await b.close();
console.log('done', h);
