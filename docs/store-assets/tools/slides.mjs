// The 8-frame screenshot storyboard (see ../04-listing.md → "Screenshot storyboard").
// One layout serves both stores: everything is drawn in a 1320-wide design space
// and scaled to 1320x2868 (App Store 6.9") or 1080x1920 (Google Play).
//
// Copy lives in COPY below so a translation is a one-object change.
import { readFileSync } from 'node:fs';
import { HUES, glow, ring, confetti, phone as rawPhone, prop, headline, DESIGN_W as W } from './design.mjs';

const STRIPS = JSON.parse(readFileSync(new URL('./src/screens/strips.json', import.meta.url), 'utf8'));
const S = (n) => `../src/screens/${n}.jpg`;
const P = (n) => `../src/props/${n}.png`;

/** Recipient-page screens get the browser status-bar band; native screens are already full-bleed. */
const phone = (o) => {
  const name = o.img.split('/').pop().replace('.jpg', '');
  return rawPhone({ ...o, strip: STRIPS[name] ?? null });
};

export const COPY = {
  'en-US': {
    tags: { app: 'In the app', open: 'What they open', play: 'What they play', see: 'What they see', free: 'Free to start' },
    labels: { app: 'In your app', them: 'On their phone' },
    f1: { l: 'Cards they’ll<br>want to <em>open</em>', s: 'Make it in minutes. They open a link —<br>no app or account needed.' },
    f2: { l: 'Pop. Blow. <em>Unwrap.</em>', s: 'Balloons, candles and a 3D gift.<br>They play before they read.' },
    f3: { l: 'Never miss<br>their <em>day</em>', s: 'Save birthdays and anniversaries once.<br>See who’s coming up next.' },
    f4: { l: 'Made in a<br>few <em>taps</em>', s: 'Pick the moment. Add a photo<br>and your own words.' },
    f5: { l: 'Five moments.<br>Five <em>looks</em>.', s: 'Birthday, anniversary, thank you,<br>congrats, just because' },
    f6: { l: 'A letter that<br><em>opens</em> in 3D', s: 'A wax seal, your words, your photo' },
    f7: { l: 'Even <em>“No”</em> gets<br>a reaction', s: 'Say no twice and it becomes yes.<br>Nobody gets stuck.' },
    f8: { l: 'Start <em>free</em>.<br>Upgrade anytime.', s: 'Your first card needs no account.' },
    plan: {
      free: { name: 'Free', items: ['1 card to try', 'No account to start', '1 saved person'] },
      pro: { name: 'Occasio Pro', items: ['24 cards a year', '5 saved people', 'Cancel anytime'] },
      note: 'Need just one more? Buy a single card.',
    },
  },
};

const PAL = (hue) => ['#ffffff', HUES[hue].accent, '#ffffff', HUES[hue].light];
const HEADER_BOX = [60, 120, 1200, 560];

const backdrop = (hue, H, seed, { rings = true } = {}) =>
  glow(980, 1500, 760, HUES[hue].light, 0.5) +
  glow(200, H - 300, 620, HUES[hue].light, 0.32) +
  (rings ? ring(660, 1700, 820) + ring(660, 1700, 1060, 0.1) : '') +
  confetti({ seed, n: 34, area: [0, 40, W, H - 40], avoid: [HEADER_BOX], colors: PAL(hue) });

/** Tag pill above the headline: solid = a screen from the app, outline = what the recipient opens. */
const tagPill = (text, kind, top, deep) => {
  const solid = kind === 'app';
  return `<div style="position:absolute;left:0;right:0;top:${top}px;z-index:21;display:flex;justify-content:center;">
    <div style="font:800 33px/1 'Plus Jakarta Sans',system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;padding:17px 34px 17px 38px;border-radius:999px;${
      solid ? `background:#fff;color:${deep};box-shadow:0 10px 30px rgba(30,5,15,.22)` : 'color:#fff;border:3px solid rgba(255,255,255,.62);background:rgba(255,255,255,.12)'
    }">${text}</div></div>`;
};

const head = (hue, copy, platform, tag) => {
  const base = platform === 'ios' ? 128 : 100;
  return (
    tagPill(tag[0], tag[1], base, HUES[hue].deep) +
    headline({ top: base + 92, lines: copy.l, sub: copy.s, accent: HUES[hue].accent })
  );
};

/** Small label that sits on a phone's top edge ("In your app" / "On their phone"). */
const tab = (text, cx, y, deep, solid = true) =>
  `<div style="position:absolute;left:${cx}px;top:${y}px;transform:translateX(-50%);z-index:30;white-space:nowrap;font:800 30px/1 'Plus Jakarta Sans',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:15px 30px;border-radius:999px;${
    solid ? `background:#fff;color:${deep};box-shadow:0 10px 26px rgba(30,5,15,.25)` : `background:${deep};color:#fff;box-shadow:0 10px 26px rgba(30,5,15,.3)`
  }">${text}</div>`;

const peek = (H, name, x, w, rot = 0, show = 340) => prop({ img: P(name), w, x, y: H - show, rot, z: 12 });

const duo = ({ left, right, platform, py = 800, lw = 840, rw = 840, lx = -40, rx = 420, lrot = -4, rrot = 2 }) =>
  phone({ img: S(left), w: lw, x: lx, y: py + 120, rot: lrot, z: 4, platform }) +
  phone({ img: S(right), w: rw, x: rx, y: py, rot: rrot, z: 6, platform });

const sw = (platform, w) => (platform === 'android' ? Math.round(w * 0.9) : w);

export function buildSlides(lang = 'en-US') {
  const C = COPY[lang];
  const T = C.tags;
  return [
    {
      id: '01-hero',
      hue: 'coral',
      build: ({ H, platform }) => {
        const nw = 700;
        const rw = 770;
        const ny = 960, ry = 840;
        return (
          backdrop('coral', H, 11) +
          head('coral', C.f1, platform, [T.free, 'play']) +
          phone({ img: S('home'), w: nw, x: -40, y: ny, rot: -3, z: 4, platform }) +
          phone({ img: S('gate'), w: rw, x: 1320 - rw - 30, y: ry, rot: 3, z: 6, platform }) +
          tab(C.labels.app, -40 + nw / 2 + 20, ny - 30, HUES.coral.deep) +
          tab(C.labels.them, 1320 - rw - 30 + rw / 2 + 20, ry - 26, HUES.coral.deep, false) +
          prop({ img: P('gift-birthday'), w: platform === 'ios' ? 440 : 340, x: -60, y: H - (platform === 'ios' ? 330 : 250), rot: -9, z: 12 }) +
          (platform === 'ios' ? prop({ img: P('cake-birthday'), w: 440, x: 960, y: H - 320, rot: 7, z: 12 }) : '')
        );
      },
    },
    {
      id: '02-interactive',
      hue: 'marigold',
      build: ({ H, platform }) =>
        backdrop('marigold', H, 22) +
        head('marigold', C.f2, platform, [T.play, 'open']) +
        phone({ img: S('balloons'), w: 900, x: -60, y: 900, rot: -6, z: 3, platform }) +
        phone({ img: S('gift-open'), w: 900, x: 444, y: 900, rot: 6, z: 3, platform }) +
        phone({ img: S('candle'), w: 1020, x: 129, y: 680, z: 6, platform }),
    },
    {
      id: '03-remember',
      hue: 'rose',
      build: ({ H, platform }) =>
        backdrop('rose', H, 33) +
        head('rose', C.f3, platform, [T.app, 'app']) +
        phone({ img: S('home-scroll'), w: sw(platform, 800), x: 560, y: 1000, rot: 4, z: 3, platform }) +
        phone({ img: S('vault'), w: sw(platform, 900), x: 30, y: 800, rot: -2, z: 6, platform }) +
        peek(H, 'gift-anniversary', 860, 480, 8, 300),
    },
    {
      id: '04-create',
      hue: 'sage',
      build: ({ H, platform }) =>
        backdrop('sage', H, 44) +
        head('sage', C.f4, platform, [T.app, 'app']) +
        duo({ left: 'moment-picker', right: 'words', platform }) +
        peek(H, 'gift-thank_you', 830, 480, 8, 300) +
        peek(H, 'cake-birthday', -70, 460, -7, 300),
    },
    {
      id: '05-moments',
      hue: 'coral',
      build: ({ H, platform }) => {
        const w = 470;
        const y1 = 760, y2 = 1730;
        return (
          backdrop('coral', H, 66, { rings: false }) +
          head('coral', C.f5, platform, [T.open, 'open']) +
          phone({ img: S('anniversary-gate'), w, x: -20, y: y1 + 40, rot: -5, z: 2, platform }) +
          phone({ img: S('gate'), w, x: 405, y: y1, rot: 0, z: 3, platform }) +
          phone({ img: S('thank_you-gate'), w, x: 830, y: y1 + 40, rot: 5, z: 2, platform }) +
          phone({ img: S('congratulations-gate'), w, x: 190, y: y2, rot: -3, z: 5, platform }) +
          phone({ img: S('just_because-gate'), w, x: 620, y: y2, rot: 3, z: 5, platform })
        );
      },
    },
    {
      id: '06-letter',
      hue: 'marigold',
      build: ({ H, platform }) =>
        backdrop('marigold', H, 55) +
        head('marigold', C.f6, platform, [T.open, 'open']) +
        duo({ left: 'letter-sealed', right: 'letter-open', platform }) +
        peek(H, 'envelope-birthday', -40, 520, -6, 280),
    },
    {
      id: '07-reaction',
      hue: 'rose',
      build: ({ H, platform }) =>
        backdrop('rose', H, 77) +
        head('rose', C.f7, platform, [T.see, 'open']) +
        duo({ left: 'gate-no1', right: 'gate-no2', platform, lw: 760, rw: 860, lx: -150, rx: 420, lrot: -5, rrot: 3, py: 800 }),
    },
    {
      id: '08-plan',
      hue: 'coral',
      build: ({ H, platform }) => {
        const card = (c, { pro = false } = {}) => `
          <div style="width:600px;padding:50px 40px 46px;border-radius:44px;background:#fff;${pro ? 'border:6px solid #FFE29A;box-shadow:0 26px 60px rgba(60,5,20,.35)' : 'box-shadow:0 20px 50px rgba(60,5,20,.22)'};font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#2A2220">
            <div style="display:inline-block;font-weight:800;font-size:30px;letter-spacing:.12em;text-transform:uppercase;padding:12px 24px;border-radius:999px;${pro ? 'background:#E8615D;color:#fff' : 'background:#FCEEE8;color:#C94E4A'}">${c.name}</div>
            <div style="margin-top:30px;display:flex;flex-direction:column;gap:30px">
              ${c.items
                .map(
                  (t) => `<div style="display:flex;gap:20px;align-items:center;font-weight:700;font-size:46px;line-height:1.15">
                    <svg width="46" height="46" viewBox="0 0 46 46" style="flex:none"><circle cx="23" cy="23" r="23" fill="${pro ? '#E8615D' : '#F7C9B6'}"/><path d="M13 23.5l7 7 13-14" fill="none" stroke="${pro ? '#fff' : '#C94E4A'}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span>${t}</span></div>`,
                )
                .join('')}
            </div>
          </div>`;
        const py = platform === 'ios' ? 1560 : 1380;
        return (
          backdrop('coral', H, 101) +
          head('coral', C.f8, platform, [T.free, 'play']) +
          `<div style="position:absolute;left:0;right:0;top:${platform === 'ios' ? 800 : 740}px;z-index:10;display:flex;justify-content:center;gap:40px;padding:0 40px">
            ${card(C.plan.free)}${card(C.plan.pro, { pro: true })}
          </div>` +
          `<div style="position:absolute;left:0;right:0;top:${platform === 'ios' ? 1300 : 1240}px;z-index:10;text-align:center;font:700 40px/1.2 'Plus Jakarta Sans',system-ui,sans-serif;color:#fff;text-shadow:0 2px 14px rgba(60,0,20,.25)">${C.plan.note}</div>` +
          phone({ img: S('home-scroll'), w: sw(platform, 860), x: (W - sw(platform, 860) - 42) / 2, y: py, platform, z: 4 })
        );
      },
    },
  ];
}
