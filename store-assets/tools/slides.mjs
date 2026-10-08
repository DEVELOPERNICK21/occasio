import { readFileSync } from 'node:fs';
import { HUES, background, glow, ring, confetti, phone as rawPhone, prop, headline, eyebrow, DESIGN_W as W } from './design.mjs';

const STRIPS = JSON.parse(readFileSync(new URL('../src/screens/strips.json', import.meta.url), 'utf8'));
/** Web (recipient-page) screens get the status-bar band; native ones are already full screens. */
const phone = (o) => {
  const name = o.img.split('/').pop().replace('.png', '');
  return rawPhone({ ...o, strip: STRIPS[name] ?? null });
};

const S = (n) => `../../src/screens/${n}.png`;
const P = (n) => `../../src/props/trimmed/${n}.png`;
const PAL = (hue) => ['#ffffff', HUES[hue].accent, '#ffffff', HUES[hue].light];
const HEADER_BOX = [60, 120, 1200, 520];

/** Shared backdrop: glow, rings, confetti kept clear of the headline. */
const backdrop = (hue, H, seed, { rings = true } = {}) =>
  glow(980, 1500, 760, HUES[hue].light, 0.5) +
  glow(200, H - 300, 620, HUES[hue].light, 0.32) +
  (rings ? ring(660, 1700, 820) + ring(660, 1700, 1060, 0.1) : '') +
  confetti({ seed, n: 36, area: [0, 40, W, H - 40], avoid: [HEADER_BOX], colors: PAL(hue) });

const head = (hue, lines, sub, platform, tag) => {
  const base = platform === 'ios' ? 128 : 100;
  return (
    eyebrow({ text: tag[0], kind: tag[1], top: base, deep: HUES[hue].deep }) +
    headline({ top: base + 92, lines, sub, accent: HUES[hue].accent })
  );
};
const sw = (platform, w) => (platform === 'android' ? Math.round(w * 0.9) : w);
/** A 3D prop peeking up from the bottom edge, clear of the UI above it. */
const peek = (H, name, x, w, rot = 0, show = 340) => prop({ img: P(name), w, x, y: H - show, rot, z: 12 });
const APP = (t) => [t, 'app'];
const GET = (t) => [t, 'recipient'];

/** Two overlapping phones: back-left, front-right. */
const duo = ({ left, right, platform, py = 780, lw = 840, rw = 840, lx = -40, rx = 420, lrot = -4, rrot = 2 }) =>
  phone({ img: S(left), w: lw, x: lx, y: py + 120, rot: lrot, z: 4, platform }) +
  phone({ img: S(right), w: rw, x: rx, y: py, rot: rrot, z: 6, platform });

export const slides = [
  {
    id: '01-hero',
    hue: 'coral',
    build: ({ H, platform }) =>
      backdrop('coral', H, 11) +
      head('coral', 'Wishes they’ll<br>want to <em>open</em>', 'Interactive birthday & anniversary<br>cards that feel like a gift', platform, GET('What they receive')) +
      (platform === 'ios'
        ? phone({ img: S('gate'), w: 1000, x: (W - 1042) / 2, y: 740, platform }) +
          peek(H, 'gift-birthday', -50, 520, -9, 330) +
          peek(H, 'cake-birthday', 840, 520, 7, 330)
        : phone({ img: S('gate'), w: 820, x: (W - 862) / 2, y: 700, platform }) +
          prop({ img: P('gift-birthday'), w: 380, x: -70, y: H - 470, rot: -9, z: 12 }) +
          prop({ img: P('cake-birthday'), w: 360, x: 1000, y: H - 440, rot: 7, z: 12 })),
  },
  {
    id: '02-interactive',
    hue: 'marigold',
    build: ({ H, platform }) =>
      backdrop('marigold', H, 22) +
      head('marigold', 'Pop. Blow. <em>Unwrap.</em>', 'Every card is a tiny adventure for them', platform, GET('What they play')) +
      phone({ img: S('balloons'), w: 900, x: -60, y: 880, rot: -6, z: 3, platform }) +
      phone({ img: S('gift-open'), w: 900, x: 444, y: 880, rot: 6, z: 3, platform }) +
      phone({ img: S('candle'), w: 1020, x: 129, y: 660, z: 6, platform }),
  },
  {
    id: '03-remember',
    hue: 'rose',
    build: ({ H, platform }) =>
      backdrop('rose', H, 33) +
      head('rose', 'Never miss a<br>birthday <em>again</em>', 'Save people once.<br>Occasio remembers every year.', platform, APP('In the app')) +
      phone({ img: S('vault'), w: sw(platform, 1000), x: (W - sw(platform, 1000) - 42) / 2, y: 740, platform }) +
      peek(H, 'gift-anniversary', 800, 540, 8),
  },
  {
    id: '04-create',
    hue: 'violet',
    build: ({ H, platform }) =>
      backdrop('violet', H, 44) +
      head('violet', 'Made in a<br>few <em>taps</em>', 'Pick the moment. Choose a frame.<br>Add your words.', platform, APP('In the app')) +
      duo({ left: 'moment-picker', right: 'frames', platform }) +
      peek(H, 'gift-just_because', 830, 500, 8) +
      peek(H, 'cake-birthday', -70, 480, -7),
  },
  {
    id: '05-letter',
    hue: 'green',
    build: ({ H, platform }) =>
      backdrop('green', H, 55) +
      head('green', 'A letter that<br><em>opens</em> in 3D', 'A wax seal, your words, your photo', platform, GET('What they open')) +
      duo({ left: 'letter-sealed', right: 'letter-open', platform }) +
      peek(H, 'gift-thank_you', -60, 520, -8),
  },
  {
    id: '06-moments',
    hue: 'coral',
    build: ({ H, platform }) => {
      const w = 470;
      const y1 = 700, y2 = 1670;
      return (
        backdrop('coral', H, 66, { rings: false }) +
        head('coral', 'Five moments.<br>Five <em>looks</em>.', 'Birthday, anniversary, thank you,<br>congrats, just because', platform, GET('What they receive')) +
        phone({ img: S('anniversary-gate'), w, x: -20, y: y1 + 40, rot: -5, z: 2, platform }) +
        phone({ img: S('gate'), w, x: 405, y: y1, rot: 0, z: 3, platform }) +
        phone({ img: S('thank_you-gate'), w, x: 830, y: y1 + 40, rot: 5, z: 2, platform }) +
        phone({ img: S('congratulations-gate'), w, x: 190, y: y2, rot: -3, z: 5, platform }) +
        phone({ img: S('just_because-gate'), w, x: 620, y: y2, rot: 3, z: 5, platform })
      );
    },
  },
  {
    id: '07-pip',
    hue: 'blue',
    build: ({ H, platform }) =>
      backdrop('blue', H, 77) +
      head('blue', 'Even <em>“No”</em> gets<br>a reaction', 'Pip has feelings. Your recipient will laugh.', platform, GET('What they see')) +
      duo({ left: 'gate-no1', right: 'gate-no2', platform, lw: 760, rw: 860, lx: -150, rx: 420, lrot: -5, rrot: 3, py: 760 }),
  },
  {
    id: '08-memories',
    hue: 'teal',
    build: ({ H, platform }) =>
      backdrop('teal', H, 88) +
      head('teal', 'Photos, reasons<br>& a <em>letter</em>', 'Three little rooms to open, in any order', platform, GET('What they open')) +
      duo({ left: 'hub', right: 'photos', platform }) +
      peek(H, 'cake-anniversary', -90, 520, -6),
  },
  {
    id: '09-stickers',
    hue: 'marigold',
    build: ({ H, platform }) =>
      backdrop('marigold', H, 99) +
      head('marigold', 'Collect <em>stickers</em><br>as you play', 'A little reward for opening every surprise', platform, GET('What they collect')) +
      duo({ left: 'finale', right: 'sticker', platform }) +
      peek(H, 'gift-congratulations', 820, 520, 8),
  },
  {
    id: '10-everyone',
    hue: 'coral',
    build: ({ H, platform }) =>
      backdrop('coral', H, 101) +
      head('coral', 'Made for everyone<br>who <em>matters</em>', 'Mom, dad, partner, best friend, family', platform, APP('In the app')) +
      duo({ left: 'home-scroll', right: 'home', platform }) +
      peek(H, 'gift-birthday', -70, 500, -8),
  },
];
