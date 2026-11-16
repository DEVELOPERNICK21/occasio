#!/usr/bin/env node
/**
 * The festival drawings: one small illustration per symbol (a diya, Santa, a Christmas tree, a pumpkin...),
 * written as shapes on a 100 x 100 canvas and saved as JSON. The app (react-native-svg) and the recipient's
 * page (inline SVG) both read the same file, so a festival looks the same everywhere.
 *
 *   node scripts/art/festival-motifs.mjs            writes both copies
 *   node scripts/art/festival-motifs.mjs --check    exits 1 if a copy is out of date
 *
 * Shape kinds: p path, c circle, e ellipse, r rect. Optional: f fill, s stroke, w stroke width,
 * o opacity, round (round line ends), lit (drawn only when the thing is lit up), dim (drawn only when it is not).
 * A lamp, a tree or a pumpkin is "lit" when someone taps it in the story.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUTS = [
  { file: path.join(ROOT, 'src/shared/ui/art/festivalMotifs.json'), part: 'motifs' },
  { file: path.join(ROOT, 'docs-site/src/lib/festivalMotifs.json'), part: 'motifs' },
  { file: path.join(ROOT, 'src/features/create/domain/festivalArtData.json'), part: 'festivals' },
  { file: path.join(ROOT, 'docs-site/src/lib/festivalArtData.json'), part: 'festivals' },
];

/* ------------------------------------------------------------------ geometry */
const f1 = (n) => Number(n.toFixed(1));
const rad = (deg) => (deg * Math.PI) / 180;
const at = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
const spin = ([x, y], cx, cy, deg) => {
  const dx = x - cx;
  const dy = y - cy;
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
};
const poly = (pts) => 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z';
const starPts = (cx, cy, R, r, n = 5, rot = -90) =>
  Array.from({ length: n * 2 }, (_, i) => at(cx, cy, i % 2 ? r : R, rot + (i * 180) / n));

const P = (d, f, x = {}) => ({ k: 'p', d, f, ...x });
const C = (cx, cy, r, f, x = {}) => ({ k: 'c', cx, cy, r, f, ...x });
const E = (cx, cy, rx, ry, f, x = {}) => ({ k: 'e', cx, cy, rx, ry, f, ...x });
const R = (x, y, w, h, rx, f, extra = {}) => ({ k: 'r', x, y, w, h, rx, f, ...extra });
const LINE = (d, s, w, x = {}) => ({ k: 'p', d, f: 'none', s, w, round: 1, ...x });
const STAR = (cx, cy, Rr, r, f, x = {}) => P(poly(starPts(cx, cy, Rr, r)), f, x);
const SPARK = (cx, cy, Rr, f, x = {}) => P(poly(starPts(cx, cy, Rr, Rr * 0.28, 4)), f, x);

/** A petal that starts at (cx,cy) and points out `len` at angle `deg`. */
function petal(cx, cy, len, wid, deg, f, x = {}) {
  const tip = at(cx, cy, len, deg);
  const a = at(cx, cy, len * 0.55, deg + 90);
  const b = at(cx, cy, len * 0.55, deg - 90);
  const side = (p) => [cx + (p[0] - cx) * (wid / len), cy + (p[1] - cy) * (wid / len)];
  const [ax, ay] = side(a);
  const [bx, by] = side(b);
  const mx = at(cx, cy, len * 0.55, deg);
  return P(
    `M${f1(cx)} ${f1(cy)}Q${f1(mx[0] + (ax - cx))} ${f1(mx[1] + (ay - cy))} ${f1(tip[0])} ${f1(tip[1])}Q${f1(mx[0] + (bx - cx))} ${f1(mx[1] + (by - cy))} ${f1(cx)} ${f1(cy)}Z`,
    f,
    x,
  );
}
const ring = (n, fn) => Array.from({ length: n }, (_, i) => fn(i, (i * 360) / n));
/** The part of an ellipse between two heights, for stripes that stay inside an egg. */
function band(cx, cy, rx, ry, y1, y2, f, zig = 0) {
  const half = (y) => rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
  const top = [];
  const bottom = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const x = -1 + (2 * i) / steps;
    const dy = zig && i % 2 ? zig : 0;
    top.push([cx + x * half(y1), y1 + dy]);
    bottom.push([cx + x * half(y2), y2 + dy]);
  }
  return P(poly([...top, ...bottom.reverse()]), f);
}

const GLOW = (cx, cy, r, f, o = 0.3) => C(cx, cy, r, f, { o, lit: 1 });

/* ------------------------------------------------------------------ the drawings */
const M = {};

M.star = [
  STAR(50, 52, 44, 19, '#FFC933'),
  P(poly(starPts(50, 52, 44, 19).slice(0, 5).concat([[50, 52]])), '#FFE27A', { o: 0.7 }),
];
M.sparkle = [SPARK(50, 50, 46, '#FFD966'), SPARK(50, 50, 22, '#FFFFFF', { o: 0.85 })];
M.snowflake = [
  ...ring(6, (i, a) => {
    const e = at(50, 50, 40, a - 90);
    const m = at(50, 50, 24, a - 90);
    const l = spin(at(m[0], m[1], 11, a - 90 - 50), m[0], m[1], 0);
    const r = at(m[0], m[1], 11, a - 90 + 50);
    return LINE(`M50 50L${f1(e[0])} ${f1(e[1])}M${f1(m[0])} ${f1(m[1])}L${f1(l[0])} ${f1(l[1])}M${f1(m[0])} ${f1(m[1])}L${f1(r[0])} ${f1(r[1])}`, '#9ED8FF', 4.5);
  }),
  C(50, 50, 6, '#FFFFFF', { s: '#9ED8FF', w: 3 }),
];
M.heart = [
  P('M50 90C16 62 8 42 18 26 28 12 44 16 50 30 56 16 72 12 82 26 92 42 84 62 50 90Z', '#E63D5C'),
  P('M26 28C30 22 38 22 42 28', 'none', { s: '#FF9CB0', w: 4, round: 1 }),
];
M.rose = [
  LINE('M50 56L50 96', '#3E8E47', 5),
  P('M50 78Q70 72 78 82Q62 90 50 80Z', '#4CAF50'),
  P('M50 70Q32 64 24 74Q40 84 50 72Z', '#4CAF50'),
  C(50, 36, 26, '#C81E3E'),
  C(50, 38, 19, '#E63D5C'),
  P('M36 34Q50 22 64 34Q50 48 36 34Z', '#C81E3E'),
  P('M42 38Q50 30 58 38Q50 46 42 38Z', '#FF6B85'),
  LINE('M32 28Q50 14 68 28', '#FF9CB0', 3, { o: 0.6 }),
];
M.balloon = [
  E(50, 40, 26, 32, '#E84B7A'),
  E(40, 28, 7, 11, '#FF9BB8', { o: 0.7 }),
  P('M44 71L50 78L56 71Z', '#C73A66'),
  LINE('M50 78Q42 86 50 92Q58 98 50 100', '#9A8A8A', 2),
];

/* Diwali */
M.diya = [
  GLOW(50, 38, 30, '#FFD166', 0.28),
  P('M10 52Q14 80 50 82Q86 80 90 52Z', '#B8582B'),
  P('M10 52Q30 60 50 60Q70 60 90 52Q86 80 50 82Q14 80 10 52Z', '#C8693A', { o: 0.9 }),
  E(50, 52, 40, 9, '#E2915F'),
  E(50, 52, 33, 6.5, '#7A3B1C'),
  E(50, 52, 30, 5, '#F2B33D', { o: 0.85 }),
  E(50, 85, 18, 4, '#8E4524'),
  C(30, 68, 2.2, '#F6D28D'), C(42, 72, 2.2, '#F6D28D'), C(58, 72, 2.2, '#F6D28D'), C(70, 68, 2.2, '#F6D28D'),
  P('M48 52Q50 44 52 52Z', '#3A2A1A'),
  P('M50 14Q70 38 60 52Q50 62 40 52Q30 38 50 14Z', '#FF8A00', { lit: 1 }),
  P('M50 30Q60 44 55 52Q50 57 45 52Q40 44 50 30Z', '#FFE08A', { lit: 1 }),
  P('M50 42Q54 48 52 52Q50 54 48 52Q46 48 50 42Z', '#FFFFFF', { lit: 1, o: 0.85 }),
];
M.rocket = [
  P('M40 30L50 8L60 30Z', '#FFB703'),
  R(40, 30, 20, 40, 3, '#E63946'),
  R(40, 44, 20, 8, 0, '#FFFFFF'),
  P('M40 60L28 78L40 72Z', '#E63946'),
  P('M60 60L72 78L60 72Z', '#E63946'),
  R(48.5, 70, 3, 26, 1.5, '#B8895A'),
  P('M44 70L50 90L56 70Z', '#FF9F1C', { lit: 1 }),
  P('M47 70L50 82L53 70Z', '#FFE08A', { lit: 1 }),
  SPARK(22, 20, 9, '#FFD166', { lit: 1 }), SPARK(80, 14, 7, '#FF8FAB', { lit: 1 }), SPARK(84, 44, 6, '#7DD3FC', { lit: 1 }),
];
M.anar = [
  P('M34 94L28 56L72 56L66 94Z', '#D62839'),
  R(30, 66, 40, 6, 0, '#FFC233'),
  R(32, 82, 36, 6, 0, '#FFC233'),
  E(50, 56, 22, 6, '#A31C2B'),
  E(50, 56, 17, 4, '#2A1A1A'),
  ...[[-60, '#FFD166'], [-40, '#FF9F1C'], [-20, '#FFE08A'], [0, '#FF6B6B'], [20, '#FFE08A'], [40, '#FF9F1C'], [60, '#FFD166']].map(([a, c]) => {
    const end = at(50, 54, 40, a - 90);
    const mid = at(50, 54, 22, a * 0.4 - 90);
    return LINE(`M50 54Q${f1(mid[0])} ${f1(mid[1])} ${f1(end[0])} ${f1(end[1])}`, c, 3.5, { lit: 1 });
  }),
  SPARK(50, 10, 8, '#FFFFFF', { lit: 1 }), SPARK(20, 22, 6, '#FFD166', { lit: 1 }), SPARK(80, 22, 6, '#FFD166', { lit: 1 }),
];
M.rangoli = [
  ...ring(24, (i, a) => C(...at(50, 50, 46, a), 2.6, '#FFC933')),
  ...ring(12, (i, a) => petal(50, 50, 44, 15, a, '#E84B7A')),
  ...ring(12, (i, a) => petal(50, 50, 34, 11, a + 15, '#FF9F1C')),
  ...ring(8, (i, a) => petal(50, 50, 24, 9, a, '#FFD34D')),
  ...ring(8, (i, a) => C(...at(50, 50, 14, a + 22.5), 3, '#7B2D8E')),
  C(50, 50, 8, '#FFFFFF'),
  C(50, 50, 4, '#E84B7A'),
];
M.pookalam = [
  ...ring(16, (i, a) => C(...at(50, 50, 42, a), 8, i % 2 ? '#FFFFFF' : '#FFD34D')),
  ...ring(12, (i, a) => C(...at(50, 50, 30, a), 7, i % 2 ? '#F28C28' : '#E84B7A')),
  ...ring(8, (i, a) => C(...at(50, 50, 19, a), 6, i % 2 ? '#FFD34D' : '#FFFFFF')),
  C(50, 50, 9, '#7BAE4A'),
  C(50, 50, 4.5, '#E84B7A'),
];
M.marigold = [
  ...ring(12, (i, a) => C(...at(50, 50, 28, a), 14, '#F59E0B')),
  ...ring(10, (i, a) => C(...at(50, 50, 18, a + 18), 11, '#FBBF24')),
  ...ring(8, (i, a) => C(...at(50, 50, 9, a), 7, '#FCD34D')),
  C(50, 50, 5, '#D97706'),
];
M.lotus = [
  E(50, 86, 38, 7, '#4CAF50', { o: 0.85 }),
  petal(50, 82, 46, 26, -90 - 62, '#F8A5C2'),
  petal(50, 82, 46, 26, -90 + 62, '#F8A5C2'),
  petal(50, 82, 52, 28, -90 - 34, '#F48FB1'),
  petal(50, 82, 52, 28, -90 + 34, '#F48FB1'),
  petal(50, 82, 58, 26, -90, '#F06292'),
  petal(50, 82, 46, 14, -90, '#FFD1E0', { o: 0.7 }),
  C(50, 82, 6, '#FFC933'),
];

/* Christmas */
M.santa = [
  P('M22 50Q24 14 58 12Q76 12 80 32Q82 40 82 50Z', '#D62839'),
  P('M22 50Q24 14 58 12Q40 24 38 50Z', '#B71C2B', { o: 0.5 }),
  C(78, 14, 9, '#FFFFFF'),
  C(50, 66, 22, '#FFD7B5'),
  R(16, 44, 68, 15, 7.5, '#FFFFFF'),
  P('M24 62Q22 98 50 98Q78 98 76 62Q66 74 50 74Q34 74 24 62Z', '#FFFFFF'),
  E(41, 72, 10, 5.5, '#FFFFFF', { s: '#EAEAF2', w: 1 }),
  E(59, 72, 10, 5.5, '#FFFFFF', { s: '#EAEAF2', w: 1 }),
  C(50, 66, 4.8, '#F4A19A'),
  C(40, 60, 2.6, '#2A2220'),
  C(60, 60, 2.6, '#2A2220'),
  C(33, 66, 4.5, '#F6A5A5', { o: 0.6 }),
  C(67, 66, 4.5, '#F6A5A5', { o: 0.6 }),
];
M.tree = [
  P('M50 40L88 92L12 92Z', '#1F7A4D'),
  P('M50 24L80 66L20 66Z', '#2E9E63'),
  P('M50 10L72 44L28 44Z', '#3DB877'),
  R(43, 90, 14, 9, 2, '#7A4B2A'),
  LINE('M28 44Q50 52 72 44M22 66Q50 76 78 66', '#FFD54A', 2.2, { o: 0.9 }),
  C(40, 58, 4, '#E63946'), C(60, 54, 4, '#3B82F6'), C(50, 80, 4.5, '#FFC233'),
  C(30, 84, 4, '#3B82F6'), C(70, 84, 4, '#E63946'), C(46, 34, 3.4, '#E63946'),
  GLOW(50, 10, 16, '#FFE9A0', 0.45),
  STAR(50, 10, 10, 4.4, '#FFD54A'),
  SPARK(34, 30, 7, '#FFFFFF', { lit: 1 }), SPARK(70, 56, 6, '#FFFFFF', { lit: 1 }), SPARK(26, 78, 6, '#FFFFFF', { lit: 1 }),
  GLOW(40, 58, 9, '#FF9AA2', 0.5), GLOW(60, 54, 9, '#9EC5FF', 0.5), GLOW(50, 80, 10, '#FFE08A', 0.5),
];

/* Halloween */
M.pumpkin = [
  GLOW(50, 58, 38, '#FFB347', 0.35),
  E(32, 60, 19, 28, '#E67E22'),
  E(68, 60, 19, 28, '#E67E22'),
  E(50, 58, 21, 30, '#F28C28'),
  E(50, 60, 14, 28, '#FFA94D'),
  P('M45 30Q46 18 57 14L60 22Q53 24 54 32Z', '#5B8C3A'),
  P('M34 54L46 54L40 42Z', '#4A2A12', { dim: 1 }), P('M54 54L66 54L60 42Z', '#4A2A12', { dim: 1 }), P('M50 60L45 68L55 68Z', '#4A2A12', { dim: 1 }),
  P('M30 72Q50 90 70 72L64 68L58 76L50 68L42 76L36 68Z', '#4A2A12', { dim: 1 }),
  P('M34 54L46 54L40 42Z', '#FFE066', { lit: 1 }), P('M54 54L66 54L60 42Z', '#FFE066', { lit: 1 }), P('M50 60L45 68L55 68Z', '#FFE066', { lit: 1 }),
  P('M30 72Q50 90 70 72L64 68L58 76L50 68L42 76L36 68Z', '#FFE066', { lit: 1 }),
];
M.ghost = [
  P('M22 92L22 46Q22 10 50 10Q78 10 78 46L78 92L68 84L59 92L50 84L41 92L32 84Z', '#F7F7FF', { s: '#CFCFEA', w: 2 }),
  E(40, 44, 5, 7.5, '#2B2B3C'), E(60, 44, 5, 7.5, '#2B2B3C'),
  E(50, 62, 6, 8, '#2B2B3C'),
  C(31, 56, 4.5, '#FFB6C8', { o: 0.7 }), C(69, 56, 4.5, '#FFB6C8', { o: 0.7 }),
];
M.bat = [
  P('M50 42Q30 16 4 28Q16 36 14 54Q26 44 34 58Q42 48 50 62Q58 48 66 58Q74 44 86 54Q84 36 96 28Q70 16 50 42Z', '#2B2438'),
  C(50, 44, 11, '#2B2438'),
  P('M42 38L40 24L49 34Z', '#2B2438'), P('M58 38L60 24L51 34Z', '#2B2438'),
  C(46, 44, 2.2, '#FFD54A'), C(54, 44, 2.2, '#FFD54A'),
  P('M47 52L50 57L53 52Z', '#FFFFFF'),
];

/* Eid, Ramadan, lanterns */
M.crescent = [
  GLOW(46, 50, 44, '#FFE9A0', 0.25),
  P('M62 10A40 40 0 1 0 62 90A48 48 0 0 1 62 10Z', '#F4C542'),
  P('M62 10A40 40 0 0 0 26 30A44 44 0 0 1 62 16Z', '#FFE27A', { o: 0.85 }),
  STAR(74, 40, 11, 4.8, '#F4C542'),
];
M.lantern = [
  LINE('M50 4L50 16', '#8E6B2E', 3),
  P('M38 24Q50 12 62 24L62 30L38 30Z', '#C08A2E'),
  P('M34 30L66 30L72 52L66 78L34 78L28 52Z', '#E7B84A'),
  P('M38 34L62 34L66 52L62 74L38 74L34 52Z', '#2A9D8F', { o: 0.9 }),
  GLOW(50, 54, 22, '#FFE9A0', 0.55),
  P('M42 40L58 40L60 52L58 68L42 68L40 52Z', '#FFE9A0', { lit: 1, o: 0.85 }),
  LINE('M50 30L50 78', '#C08A2E', 2.2),
  P('M36 78L64 78L60 86L40 86Z', '#C08A2E'),
  LINE('M50 86L50 96', '#C08A2E', 3), C(50, 96, 3, '#C08A2E'),
];
M.lantern_red = [
  LINE('M50 4L50 14', '#8E6B2E', 3),
  R(38, 14, 24, 8, 2.5, '#F2B33D'),
  E(50, 52, 34, 28, '#D62839'),
  E(50, 52, 22, 28, '#E63946'),
  E(50, 52, 9, 28, '#F25560', { o: 0.9 }),
  GLOW(50, 52, 30, '#FFC9A8', 0.5),
  R(38, 78, 24, 8, 2.5, '#F2B33D'),
  LINE('M44 86L44 98M50 86L50 98M56 86L56 98', '#F2B33D', 2.4),
];

/* Holi */
M.splash = [
  C(40, 44, 22, '#E84B7A', { o: 0.95 }), C(64, 36, 17, '#F6B93B', { o: 0.95 }),
  C(60, 66, 20, '#3DA5D9', { o: 0.92 }), C(32, 70, 15, '#6BCB77', { o: 0.95 }),
  C(50, 54, 14, '#B15EE0', { o: 0.7 }),
  C(14, 28, 5, '#E84B7A'), C(84, 16, 4.5, '#F6B93B'), C(90, 52, 5, '#3DA5D9'), C(14, 90, 4, '#6BCB77'), C(78, 90, 4.5, '#E84B7A'),
  C(26, 10, 3.4, '#3DA5D9'), C(8, 56, 3.4, '#F6B93B'),
];
M.gulal = [
  P('M14 62Q18 92 50 92Q82 92 86 62Z', '#8E5A3C'),
  E(50, 62, 36, 8, '#A87048'),
  P('M18 62Q26 26 50 20Q74 26 82 62Z', '#E84B7A'),
  P('M30 58Q34 36 50 30Q40 40 40 58Z', '#FF9BB8', { o: 0.7 }),
  C(22, 30, 6, '#F6B93B'), C(80, 26, 5, '#3DA5D9'), C(12, 48, 4, '#6BCB77'), C(88, 46, 4, '#B15EE0'),
];

/* Raksha Bandhan, Bhai Dooj */
M.rakhi = [
  P('M34 52Q10 66 24 90L34 84Q26 70 40 60Z', '#E84B7A'),
  P('M66 52Q90 66 76 90L66 84Q74 70 60 60Z', '#E84B7A'),
  ...ring(8, (i, a) => petal(50, 40, 26, 11, a, '#F2B33D')),
  C(50, 40, 17, '#D62839'),
  C(50, 40, 10, '#FFD34D'),
  C(50, 40, 4.5, '#D62839'),
  C(26, 84, 3, '#FFD34D'), C(74, 84, 3, '#FFD34D'),
];
M.thali = [
  C(50, 54, 42, '#D9A93A'),
  C(50, 54, 36, '#F6D27A'),
  C(50, 54, 30, '#E7B84A', { o: 0.5 }),
  C(28, 52, 6.5, '#D62839'),
  C(72, 58, 6.5, '#FFFFFF'),
  C(60, 74, 5, '#F59E0B'), C(40, 76, 5, '#FBBF24'), C(66, 34, 5, '#F59E0B'),
  GLOW(50, 46, 20, '#FFD166', 0.3),
  P('M36 54Q38 66 50 67Q62 66 64 54Z', '#C8693A'),
  E(50, 54, 14, 4, '#E2915F'),
  P('M50 30Q60 44 55 53Q50 58 45 53Q40 44 50 30Z', '#FF8A00', { lit: 1 }),
  P('M50 40Q56 48 53 53Q50 55 47 53Q44 48 50 40Z', '#FFE08A', { lit: 1 }),
];

/* Harvest, new years */
M.kite = [
  P('M50 6L84 42L50 82L16 42Z', '#F06292'),
  P('M50 6L84 42L50 42Z', '#FFC933'),
  P('M16 42L50 42L50 82Z', '#3DA5D9'),
  P('M50 42L84 42L50 82Z', '#7BC96F'),
  LINE('M50 6L50 82M16 42L84 42', '#FFFFFF', 1.6, { o: 0.8 }),
  LINE('M50 82Q40 88 50 92Q60 96 52 100', '#8A7A7A', 1.6),
  P('M44 90L50 86L50 94Z', '#F06292'), P('M56 96L50 92L52 100Z', '#FFC933'),
];
M.bonfire = [
  GLOW(50, 52, 34, '#FFB347', 0.35),
  P('M50 12Q76 42 68 68Q60 82 50 82Q40 82 32 68Q24 42 50 12Z', '#FF7A00', { lit: 1 }),
  P('M50 34Q64 52 60 68Q56 76 50 76Q44 76 40 68Q36 52 50 34Z', '#FFC233', { lit: 1 }),
  P('M50 52Q56 62 54 70Q50 74 46 70Q44 62 50 52Z', '#FFF3B0', { lit: 1 }),
  P('M14 88L70 70L74 78L18 96Z', '#7A4B2A'),
  P('M86 88L30 70L26 78L82 96Z', '#8E5A3C'),
];
M.pongal = [
  LINE('M82 18L86 76', '#6FA33B', 6), LINE('M72 24L72 78', '#7BB347', 6),
  P('M22 56Q16 86 50 92Q84 86 78 56Z', '#E8B27A'),
  P('M20 68Q50 76 80 68L79 77Q50 85 21 77Z', '#C0392B'),
  E(50, 56, 28, 8, '#C48A52'),
  C(38, 50, 11, '#FFFFFF'), C(52, 44, 13, '#FFFFFF'), C(65, 50, 10, '#FFFFFF'), C(46, 52, 8, '#F3F3F3'),
  LINE('M40 36Q44 28 40 20M54 30Q58 22 54 14', '#FFFFFF', 3, { o: 0.7 }),
];
M.sun = [
  ...ring(12, (i, a) => P(poly([at(50, 50, 46, a), at(50, 50, 30, a - 9), at(50, 50, 30, a + 9)]), '#FFB703')),
  C(50, 50, 26, '#FFC933'),
  C(50, 50, 20, '#FFD966'),
  C(43, 44, 6, '#FFF3B0', { o: 0.8 }),
];
M.dandiya = (() => {
  const stick = (deg, bands) => {
    const part = (y1, y2, f) => P(poly([[46, y1], [54, y1], [54, y2], [46, y2]].map((p) => spin(p, 50, 50, deg))), f);
    return [part(8, 92, '#C49A6C'), part(14, 22, bands[0]), part(30, 38, bands[1]), part(46, 54, bands[0]), part(62, 70, bands[1]), part(78, 86, bands[0]),
      C(...spin([50, 6], 50, 50, deg), 4.5, bands[1]), C(...spin([50, 94], 50, 50, deg), 4.5, bands[1])];
  };
  return [...stick(38, ['#D62839', '#FFC233']), ...stick(-38, ['#3557E8', '#FF9F1C'])];
})();
M.kalash = [
  ...[-62, -34, -10, 14, 40, 66].map((a, i) => petal(50, 44, 40, 13, a - 90, i % 2 ? '#3E9B4F' : '#58B368')),
  P('M30 50Q20 62 26 80Q36 94 50 94Q64 94 74 80Q80 62 70 50Z', '#C77D3A'),
  R(37, 42, 26, 10, 3, '#B56A2B'),
  E(50, 42, 17, 4.5, '#D8924E'),
  P('M27 66Q50 76 73 66L74 73Q50 83 26 73Z', '#D62839'),
  C(40, 86, 2.2, '#FFD34D'), C(50, 88, 2.2, '#FFD34D'), C(60, 86, 2.2, '#FFD34D'),
  C(50, 24, 13, '#7A5A3A'), C(46, 20, 2.2, '#4A3724'), C(54, 20, 2.2, '#4A3724'), C(50, 27, 2.2, '#4A3724'),
];
M.modak = [
  P('M50 8Q56 24 74 42Q90 62 74 80Q62 92 50 92Q38 92 26 80Q10 62 26 42Q44 24 50 8Z', '#FFE3A3'),
  P('M50 8Q56 24 74 42Q82 52 80 62Q70 40 50 8Z', '#FFF3CC', { o: 0.8 }),
  LINE('M50 20L50 90M42 30L36 88M58 30L64 88M34 46L26 80M66 46L74 80', '#E0B86A', 2.2, { o: 0.8 }),
  C(50, 8, 4, '#E0B86A'),
];
M.hibiscus = [
  ...ring(5, (i, a) => petal(50, 54, 40, 30, a - 90, i % 2 ? '#E5383B' : '#F25C5E')),
  C(50, 54, 8, '#B71C2B'),
  LINE('M50 54L66 22', '#FFC233', 3),
  C(66, 22, 3.4, '#FFC233'), C(60, 28, 2.4, '#FFE08A'), C(70, 28, 2.4, '#FFE08A'),
];
M.flute = [
  P(poly([[8, 66], [10, 58], [92, 30], [94, 38]]), '#D9A441'),
  P(poly([[8, 66], [10, 58], [92, 30], [94, 38]].map(([x, y]) => [x, y + 1])), '#B8862F', { o: 0.35 }),
  C(32, 56, 2.6, '#3A2A1A'), C(44, 52, 2.6, '#3A2A1A'), C(56, 48, 2.6, '#3A2A1A'), C(68, 44, 2.6, '#3A2A1A'), C(80, 40, 2.6, '#3A2A1A'),
  R(4, 60, 8, 8, 2, '#E84B7A'),
  R(86, 28, 9, 11, 2, '#E84B7A'),
];
M.feather = [
  LINE('M50 54Q44 74 52 98', '#6A8E3A', 3),
  LINE('M48 66Q34 62 26 70M50 74Q64 70 72 78M48 82Q38 80 32 88', '#7DAA45', 2, { o: 0.8 }),
  E(50, 34, 22, 30, '#2A9D8F'),
  E(50, 34, 15, 22, '#1D6FA5'),
  E(50, 34, 8, 12, '#F2B33D'),
  E(50, 34, 3.6, 6, '#1D4E8F'),
];
M.matka = [
  P('M26 34Q10 62 30 84Q40 94 50 94Q60 94 70 84Q90 62 74 34Z', '#C8693A'),
  E(50, 34, 26, 8, '#D98A57'),
  E(50, 34, 20, 5, '#F7EFE3'),
  P('M30 58Q50 68 70 58L72 66Q50 78 28 66Z', '#F7EFE3', { o: 0.9 }),
  C(36, 76, 2.4, '#F7EFE3'), C(50, 82, 2.4, '#F7EFE3'), C(64, 76, 2.4, '#F7EFE3'),
  C(40, 30, 7, '#FFF7E0'), C(54, 28, 8, '#FFF7E0'), C(62, 32, 6, '#FFF7E0'),
];
M.bow = [
  LINE('M30 8Q86 50 30 92', '#8E5A3C', 6),
  LINE('M30 8L30 92', '#EBDCB0', 1.6),
  LINE('M12 50L84 50', '#C49A6C', 3.2),
  P('M84 43L98 50L84 57Z', '#F2B33D'),
  P('M12 50L4 43L18 50L4 57Z', '#D62839'),
];
M.conch = [
  P('M14 60L2 52L10 64L0 72L16 70Z', '#F2D3BC', { s: '#D3A088', w: 1.6 }),
  P('M14 62Q12 34 44 24Q82 18 90 50Q94 78 62 88Q30 96 16 72Z', '#FBE7D3', { s: '#D3A088', w: 2 }),
  P('M44 24Q82 18 90 50Q70 40 56 46Q40 52 44 24Z', '#F6CDB2', { o: 0.9 }),
  LINE('M34 40Q56 34 74 46M28 54Q54 46 80 60M30 68Q54 62 78 74', '#D3A088', 2.4),
  P('M62 88Q92 76 90 50Q80 74 62 88Z', '#F28B8B', { s: '#D3706F', w: 1.6 }),
];
M.bilva = [
  petal(50, 82, 56, 24, -90, '#4C9F50'),
  petal(50, 82, 50, 22, -90 - 42, '#3E8E45'),
  petal(50, 82, 50, 22, -90 + 42, '#3E8E45'),
  LINE('M50 82L50 98', '#6B4423', 3),
  LINE('M50 80L50 38', '#7DC47F', 1.6, { o: 0.8 }),
];

/* Learning and country */
M.book = [
  P('M6 30L6 84Q28 78 50 86Q72 78 94 84L94 30Z', '#3557E8'),
  P('M50 26Q30 18 10 24L10 78Q30 72 50 80Z', '#FFFFFF', { s: '#C9B79C', w: 1.4 }),
  P('M50 26Q70 18 90 24L90 78Q70 72 50 80Z', '#FBF5E8', { s: '#C9B79C', w: 1.4 }),
  LINE('M18 36Q32 33 44 38M18 46Q32 43 44 48M18 56Q32 53 44 58', '#B8B0A0', 2),
  LINE('M56 38Q68 33 82 36M56 48Q68 43 82 46M56 58Q68 53 82 56', '#B8B0A0', 2),
  P('M66 24L72 24L72 46L69 42L66 46Z', '#E63946'),
];
M.apple = [
  P('M50 30Q30 18 18 40Q8 66 28 86Q40 96 50 88Q60 96 72 86Q92 66 82 40Q70 18 50 30Z', '#E63946'),
  P('M30 38Q24 52 30 66', 'none', { s: '#FF8A94', w: 4, round: 1, o: 0.8 }),
  R(48, 14, 4, 18, 2, '#6B4423'),
  P('M52 24Q66 8 82 16Q72 32 52 24Z', '#4CAF50'),
];
M.flag = [
  R(14, 6, 4.5, 90, 2, '#8E8E8E'),
  C(16, 6, 4, '#D9A93A'),
  R(19, 12, 70, 17, 0, '#FF9933'),
  R(19, 29, 70, 17, 0, '#FFFFFF', { s: '#E4E4E4', w: 0.8 }),
  R(19, 46, 70, 17, 0, '#138808'),
  C(54, 37.5, 7, 'none', { s: '#000080', w: 1.4 }),
  ...ring(12, (i, a) => LINE(`M54 37.5L${f1(at(54, 37.5, 7, a)[0])} ${f1(at(54, 37.5, 7, a)[1])}`, '#000080', 0.9)),
  C(54, 37.5, 1.6, '#000080'),
];
M.wheat = [
  LINE('M50 98Q46 60 50 8', '#C9962B', 3),
  ...[18, 32, 46, 60].flatMap((y) => [E(41, y + 6, 7, 11, '#E0A526'), E(59, y + 6, 7, 11, '#E9B73A')]),
  E(50, 8, 5, 10, '#E0A526'),
];
M.dhol = [
  P('M20 34Q8 50 20 66L80 66Q92 50 80 34Z', '#C8693A'),
  E(20, 50, 8, 16, '#F1D9A0', { s: '#B8862F', w: 1.5 }),
  E(80, 50, 8, 16, '#F1D9A0', { s: '#B8862F', w: 1.5 }),
  LINE('M26 36L36 64L46 36L56 64L66 36L74 64', '#F2B33D', 2.4),
  LINE('M30 20L58 8', '#8E5A3C', 4), C(30, 20, 4, '#D62839'),
];
M.toran = [
  LINE('M4 20Q50 40 96 20', '#8E5A3C', 2.4),
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => {
    const t = (i + 0.5) / 7;
    const x = (1 - t) ** 2 * 4 + 2 * (1 - t) * t * 50 + t * t * 96;
    const y = (1 - t) ** 2 * 20 + 2 * (1 - t) * t * 40 + t * t * 20;
    return petal(x, y, 40 - Math.abs(i - 3) * 2, 13, 90, i % 2 ? '#3E9B4F' : '#58B368');
  }),
  ...[0, 1, 2, 3, 4, 5].map((i) => {
    const t = (i + 1) / 7;
    const x = (1 - t) ** 2 * 4 + 2 * (1 - t) * t * 50 + t * t * 96;
    const y = (1 - t) ** 2 * 20 + 2 * (1 - t) * t * 40 + t * t * 20;
    return C(x, y + 3, 4, '#F59E0B');
  }),
];
M.egg = [
  E(50, 56, 28, 36, '#FFD6E8'),
  band(50, 56, 28, 36, 40, 50, '#9BD7FF', 4),
  band(50, 56, 28, 36, 62, 72, '#FFE27A', 4),
  band(50, 56, 28, 36, 80, 86, '#B6E3A8'),
  C(40, 38, 3, '#FFFFFF'), C(58, 34, 3, '#FFFFFF'), C(62, 52, 2.6, '#E84B7A'), C(36, 60, 2.6, '#E84B7A'),
  E(38, 36, 6, 12, '#FFFFFF', { o: 0.35 }),
];
M.bunny = [
  E(36, 26, 9, 24, '#FFFFFF', { s: '#E3D6D6', w: 1.6 }), E(36, 28, 4.5, 15, '#F4B6C2'),
  E(64, 26, 9, 24, '#FFFFFF', { s: '#E3D6D6', w: 1.6 }), E(64, 28, 4.5, 15, '#F4B6C2'),
  C(50, 66, 26, '#FFFFFF', { s: '#E3D6D6', w: 1.6 }),
  C(41, 62, 3, '#2A2220'), C(59, 62, 3, '#2A2220'),
  P('M46 70L54 70L50 75Z', '#F4A1B2'),
  LINE('M50 75L50 80M50 80Q44 84 41 80M50 80Q56 84 59 80', '#B89A9A', 1.6),
  C(34, 72, 4.5, '#FFC7D3', { o: 0.7 }), C(66, 72, 4.5, '#FFC7D3', { o: 0.7 }),
];
(() => {
  const radii = [40, 24, 36, 20, 38, 22, 34, 20, 30, 18, 24, 18, 24, 18, 30, 20, 34, 22, 38, 20, 36, 24];
  const pts = radii.map((r, i) => at(50, 50, r, -90 + (i * 360) / radii.length));
  M.leaf = [P(poly(pts), '#D9641E'), P(poly(pts.map(([x, y]) => [50 + (x - 50) * 0.6, 50 + (y - 50) * 0.6])), '#F08A3C', { o: 0.6 }),
    LINE('M50 18L50 84M50 56L36 44M50 56L64 44', '#A84A12', 2), R(48.5, 84, 3, 14, 1.5, '#7A4B2A')];
})();
M.burst = [
  ...ring(12, (i, a) => {
    const colors = ['#FFC933', '#FF6B8B', '#7DD3FC', '#FFFFFF'];
    const s = at(50, 50, 10, a);
    const e = at(50, 50, i % 2 ? 34 : 44, a);
    return LINE(`M${f1(s[0])} ${f1(s[1])}L${f1(e[0])} ${f1(e[1])}`, colors[i % 4], 3.6);
  }),
  ...ring(12, (i, a) => C(...at(50, 50, i % 2 ? 40 : 50, a), 2.6, ['#FFC933', '#FF6B8B', '#7DD3FC', '#FFFFFF'][i % 4])),
  C(50, 50, 5, '#FFFFFF'),
];
M.clock = [
  C(50, 52, 40, '#34439A'),
  C(50, 52, 34, '#FFFFFF'),
  ...ring(12, (i, a) => {
    const s = at(50, 52, i % 3 === 0 ? 24 : 28, a - 90);
    const e = at(50, 52, 31, a - 90);
    return LINE(`M${f1(s[0])} ${f1(s[1])}L${f1(e[0])} ${f1(e[1])}`, '#34439A', i % 3 === 0 ? 3 : 1.8);
  }),
  LINE('M50 52L50 28', '#2A2A5A', 4), LINE('M50 52L50 22', '#D4AE47', 2.6),
  C(50, 52, 4, '#D4AE47'),
  SPARK(88, 14, 9, '#FFD966'), SPARK(12, 20, 7, '#FFD966'),
];
M.envelope = [
  R(24, 8, 52, 84, 6, '#D62839'),
  P('M24 8L50 46L76 8Z', '#B71C2B'),
  C(50, 58, 13, '#F2B33D'),
  R(45, 53, 10, 10, 1.5, '#D62839'),
  LINE('M32 80L68 80', '#F2B33D', 2.4),
];
M.menorah = [
  LINE('M12 40Q12 74 50 74Q88 74 88 40', '#E7B84A', 5),
  R(46.5, 56, 7, 34, 2, '#E7B84A'),
  R(28, 88, 44, 7, 3, '#E7B84A'),
  ...Array.from({ length: 9 }, (_, i) => {
    const x = 12 + i * 9.5;
    const top = i === 4 ? 20 : 30;
    return [R(x - 2.6, top + 10, 5.2, 24, 1.5, i === 4 ? '#3B82F6' : '#60A5FA'),
      P(`M${f1(x)} ${top - 6}Q${f1(x + 5)} ${top + 4} ${f1(x)} ${top + 9}Q${f1(x - 5)} ${top + 4} ${f1(x)} ${top - 6}Z`, '#FF9F1C', { lit: 1 }),
      P(`M${f1(x)} ${top}Q${f1(x + 2.4)} ${top + 4} ${f1(x)} ${top + 8}Q${f1(x - 2.4)} ${top + 4} ${f1(x)} ${top}Z`, '#FFE08A', { lit: 1 })];
  }).flat(),
];
M.dreidel = [
  R(46, 10, 8, 22, 2.5, '#F2B33D'),
  R(36, 28, 28, 8, 3, '#F2B33D'),
  P('M30 36L70 36L76 60L50 90L24 60Z', '#3557E8'),
  P('M30 36L50 36L50 90L24 60Z', '#2A46C2', { o: 0.5 }),
  P(poly(starPts(50, 56, 12, 5, 4)), '#FFFFFF'),
];
M.honey = [
  P('M28 38Q22 42 22 52L22 80Q22 92 34 92L66 92Q78 92 78 80L78 52Q78 42 72 38Z', '#F2B33D'),
  P('M30 40Q26 46 26 56L26 78', 'none', { s: '#FFE08A', w: 4, round: 1, o: 0.8 }),
  R(30, 26, 40, 12, 3.5, '#8E5A3C'),
  R(33, 56, 34, 22, 4, '#FFF4D6'),
  LINE('M42 66L58 66M42 72L54 72', '#C9962B', 2.2),
  P('M30 38Q34 50 40 38Z', '#D9941E', { o: 0.7 }),
];
M.flower = [
  LINE('M50 56L50 96', '#4CAF50', 5),
  P('M50 84Q30 80 22 64Q40 66 50 80Z', '#58B368'), P('M50 78Q70 74 78 58Q60 60 50 74Z', '#58B368'),
  P('M30 34Q30 14 40 10Q46 24 50 30Q54 24 60 10Q70 14 70 34Q70 58 50 62Q30 58 30 34Z', '#F06292'),
  P('M42 12Q50 32 50 62Q34 58 32 36Q32 20 42 12Z', '#F8A5C2', { o: 0.8 }),
];
M.tie = [
  P('M42 8L58 8L55 24L45 24Z', '#2A46C2'),
  P('M45 24L55 24L66 76L50 94L34 76Z', '#3557E8'),
  LINE('M42 40L58 34M40 54L60 48M38 68L62 62', '#8FA6FF', 3),
  P('M45 24L50 30L55 24Z', '#1E3399'),
];
M.band = [
  ...ring(6, (i, a) => {
    const s = at(50, 50, 33, a - 90);
    const e = at(50, 50, 33, a - 30);
    return P(`M${f1(s[0])} ${f1(s[1])}A33 33 0 0 1 ${f1(e[0])} ${f1(e[1])}`, 'none', { s: ['#E84B7A', '#FFC933', '#3DA5D9', '#7BC96F', '#B15EE0', '#FF8A3D'][i], w: 14 });
  }),
  C(50, 50, 40, 'none', { s: '#FFFFFF', w: 1.4, o: 0.5 }),
  C(50, 50, 26, 'none', { s: '#FFFFFF', w: 1.4, o: 0.5 }),
  P('M44 14L56 14L56 22L44 22Z', '#FFFFFF', { o: 0.7 }),
];
M.moon = [
  GLOW(50, 50, 46, '#FFF3C4', 0.35),
  C(50, 50, 36, '#FFF3C4'),
  C(38, 40, 7, '#F3DD99'), C(62, 56, 9, '#F3DD99'), C(44, 68, 5, '#F3DD99'), C(64, 34, 4, '#F3DD99'),
];


/* ------------------------------------------------------------------ which festival uses what */
/*
 * Each festival's signature look. Row: [hero, extras, taps, garland, ambient, costume, finale].
 *  hero      the festival's face: its tile in the list and on Home, and its corner decoration
 *  extras    a few more drawings that belong to it
 *  taps      four things the recipient taps in the story (a diya lights, a cracker bursts, a tree's stars come on)
 *  garland   what hangs across the top of the story page (null for none)
 *  ambient   what drifts behind it: [drawing, rise | fall | float | twinkle], one or two layers
 *  costume   what Pip wears: a named costume, "head:<drawing>" worn on the head, "held:<drawing>" held in hand
 *  finale    the celebration at the end: confetti petals fireworks lanterns stars snow powder
 */
const FESTIVALS = {
  // Hindu festivals
  maha_shivratri: ['bilva', ['moon', 'diya', 'lotus'], ['diya', 'bilva', 'diya', 'moon'], 'bilva', [['sparkle', 'twinkle']], 'head:crescent', 'lanterns'],
  holi: ['splash', ['gulal', 'balloon', 'heart'], ['splash', 'gulal', 'balloon', 'splash'], 'marigold', [['splash', 'float']], 'holi_colour', 'powder'],
  ram_navami: ['bow', ['sun', 'diya', 'marigold'], ['diya', 'bow', 'diya', 'sun'], 'marigold', [['sparkle', 'twinkle']], 'head:diya', 'lanterns'],
  hanuman_jayanti: ['sun', ['marigold', 'diya', 'flag'], ['diya', 'sun', 'diya', 'marigold'], 'marigold', [['sparkle', 'twinkle']], 'head:marigold', 'lanterns'],
  raksha_bandhan: ['rakhi', ['thali', 'heart', 'sparkle'], ['rakhi', 'heart', 'rakhi', 'thali'], 'marigold', [['heart', 'rise']], 'held:rakhi', 'petals'],
  janmashtami: ['flute', ['feather', 'matka', 'lotus'], ['matka', 'feather', 'matka', 'flute'], 'feather', [['feather', 'float']], 'held:flute', 'petals'],
  ganesh_chaturthi: ['modak', ['hibiscus', 'marigold', 'lotus'], ['modak', 'hibiscus', 'modak', 'marigold'], 'marigold', [['hibiscus', 'fall']], 'head:hibiscus', 'petals'],
  navratri: ['dandiya', ['kalash', 'diya', 'marigold'], ['diya', 'dandiya', 'diya', 'kalash'], 'marigold', [['sparkle', 'twinkle']], 'held:dandiya', 'confetti'],
  durga_puja: ['conch', ['marigold', 'lotus', 'diya'], ['diya', 'conch', 'diya', 'lotus'], 'marigold', [['marigold', 'fall']], 'head:marigold', 'lanterns'],
  dussehra: ['bow', ['marigold', 'diya', 'rocket'], ['rocket', 'diya', 'rocket', 'bow'], 'marigold', [['sparkle', 'twinkle']], 'held:bow', 'fireworks'],
  karwa_chauth: ['moon', ['thali', 'heart', 'diya'], ['diya', 'moon', 'diya', 'heart'], 'heart', [['heart', 'rise']], 'held:thali', 'petals'],
  diwali: ['diya', ['rocket', 'anar', 'rangoli', 'marigold'], ['diya', 'rocket', 'anar', 'diya'], 'marigold', [['sparkle', 'rise'], ['diya', 'float']], 'head:diya', 'fireworks'],
  bhai_dooj: ['thali', ['rakhi', 'heart', 'marigold'], ['thali', 'heart', 'thali', 'rakhi'], 'marigold', [['heart', 'rise']], 'held:thali', 'petals'],
  chhath_puja: ['sun', ['marigold', 'lotus', 'diya'], ['diya', 'sun', 'diya', 'lotus'], 'marigold', [['sparkle', 'twinkle']], 'head:sun', 'lanterns'],
  guru_purnima: ['book', ['lotus', 'moon', 'diya'], ['diya', 'book', 'diya', 'lotus'], 'marigold', [['sparkle', 'twinkle']], 'held:book', 'stars'],

  // New years and harvest
  lohri: ['bonfire', ['wheat', 'sparkle', 'sun'], ['bonfire', 'wheat', 'bonfire', 'wheat'], 'wheat', [['sparkle', 'rise']], 'head:wheat', 'lanterns'],
  makar_sankranti: ['kite', ['sun', 'wheat', 'balloon'], ['kite', 'sun', 'kite', 'sun'], 'kite', [['kite', 'float']], 'held:kite', 'confetti'],
  pongal: ['pongal', ['sun', 'wheat', 'marigold'], ['pongal', 'sun', 'wheat', 'pongal'], 'toran', [['sparkle', 'rise']], 'head:wheat', 'stars'],
  basant_panchami: ['flower', ['sparkle', 'book', 'kite'], ['flower', 'kite', 'flower', 'book'], 'marigold', [['kite', 'float']], 'flower_crown', 'petals'],
  ugadi: ['toran', ['kalash', 'marigold', 'sun'], ['kalash', 'sun', 'kalash', 'marigold'], 'toran', [['marigold', 'fall']], 'head:marigold', 'petals'],
  gudi_padwa: ['kalash', ['toran', 'marigold', 'flag'], ['kalash', 'marigold', 'kalash', 'sun'], 'toran', [['marigold', 'fall']], 'head:marigold', 'petals'],
  vishu: ['marigold', ['kalash', 'sun', 'lotus'], ['marigold', 'kalash', 'marigold', 'sun'], 'marigold', [['marigold', 'fall']], 'flower_crown', 'petals'],
  puthandu: ['sun', ['toran', 'kalash', 'marigold'], ['sun', 'kalash', 'sun', 'marigold'], 'toran', [['sparkle', 'twinkle']], 'head:sun', 'confetti'],
  pohela_boishakh: ['sun', ['dhol', 'marigold', 'balloon'], ['sun', 'dhol', 'sun', 'dhol'], 'marigold', [['sparkle', 'twinkle']], 'flower_crown', 'confetti'],
  baisakhi: ['wheat', ['dhol', 'sun', 'marigold'], ['dhol', 'wheat', 'dhol', 'wheat'], 'wheat', [['sparkle', 'twinkle']], 'held:dhol', 'confetti'],
  onam: ['pookalam', ['marigold', 'lotus', 'kalash'], ['pookalam', 'marigold', 'pookalam', 'kalash'], 'marigold', [['marigold', 'fall']], 'flower_crown', 'petals'],
  gujarati_new_year: ['rangoli', ['diya', 'marigold', 'sparkle'], ['diya', 'rangoli', 'diya', 'rocket'], 'marigold', [['sparkle', 'rise']], 'head:diya', 'fireworks'],

  // National days
  republic_day: ['flag', ['sparkle', 'star', 'balloon'], ['flag', 'balloon', 'flag', 'burst'], 'flag', [['star', 'twinkle']], 'held:flag', 'fireworks'],
  independence_day: ['flag', ['sparkle', 'star', 'balloon'], ['flag', 'burst', 'flag', 'balloon'], 'flag', [['star', 'twinkle']], 'held:flag', 'fireworks'],
  teachers_day: ['book', ['apple', 'star', 'flower'], ['apple', 'book', 'apple', 'star'], 'star', [['star', 'twinkle']], 'held:book', 'stars'],
  childrens_day: ['balloon', ['kite', 'star', 'heart'], ['balloon', 'kite', 'balloon', 'star'], 'balloon', [['balloon', 'rise']], 'party_hat', 'confetti'],

  // Eid and Ramadan
  ramadan: ['crescent', ['lantern', 'moon', 'star'], ['lantern', 'crescent', 'lantern', 'star'], 'lantern', [['star', 'twinkle']], 'head:crescent', 'lanterns'],
  eid_al_fitr: ['crescent', ['lantern', 'star', 'heart'], ['lantern', 'crescent', 'lantern', 'star'], 'lantern', [['star', 'twinkle']], 'head:crescent', 'lanterns'],
  eid_al_adha: ['crescent', ['lantern', 'moon', 'star'], ['lantern', 'crescent', 'lantern', 'star'], 'lantern', [['star', 'twinkle']], 'head:crescent', 'stars'],

  // Christian
  easter: ['egg', ['bunny', 'flower', 'sparkle'], ['egg', 'bunny', 'egg', 'flower'], 'egg', [['flower', 'fall']], 'bunny_ears', 'petals'],
  christmas: ['santa', ['tree', 'star', 'snowflake'], ['tree', 'star', 'santa', 'tree'], 'star', [['snowflake', 'fall'], ['sparkle', 'twinkle']], 'santa_hat', 'snow'],

  // Sikh, Buddhist and Jain
  guru_nanak_jayanti: ['diya', ['sun', 'marigold', 'lotus'], ['diya', 'sun', 'diya', 'marigold'], 'marigold', [['sparkle', 'rise']], 'head:diya', 'lanterns'],
  buddha_purnima: ['lotus', ['moon', 'diya', 'sparkle'], ['lotus', 'diya', 'moon', 'diya'], 'lotus', [['sparkle', 'twinkle']], 'head:lotus', 'lanterns'],
  mahavir_jayanti: ['lotus', ['diya', 'sun', 'heart'], ['lotus', 'diya', 'lotus', 'diya'], 'marigold', [['sparkle', 'twinkle']], 'head:lotus', 'stars'],

  // Around the world
  new_year: ['burst', ['clock', 'sparkle', 'star'], ['burst', 'rocket', 'burst', 'star'], 'star', [['sparkle', 'twinkle']], 'party_hat', 'fireworks'],
  valentines_day: ['rose', ['heart', 'envelope', 'sparkle'], ['heart', 'rose', 'heart', 'rose'], 'heart', [['heart', 'rise']], 'rose', 'petals'],
  womens_day: ['flower', ['heart', 'star', 'sparkle'], ['flower', 'heart', 'flower', 'star'], 'flower', [['flower', 'fall']], 'flower_crown', 'petals'],
  mothers_day: ['flower', ['heart', 'rose', 'sparkle'], ['flower', 'heart', 'rose', 'heart'], 'flower', [['heart', 'rise']], 'flower_crown', 'petals'],
  fathers_day: ['tie', ['star', 'book', 'heart'], ['tie', 'star', 'tie', 'heart'], 'star', [['star', 'twinkle']], 'shades', 'stars'],
  friendship_day: ['band', ['heart', 'star', 'balloon'], ['band', 'heart', 'band', 'balloon'], 'heart', [['heart', 'rise']], 'party_hat', 'confetti'],
  halloween: ['pumpkin', ['ghost', 'bat', 'sparkle'], ['pumpkin', 'ghost', 'pumpkin', 'bat'], 'bat', [['bat', 'float']], 'witch_hat', 'stars'],
  thanksgiving: ['leaf', ['pumpkin', 'wheat', 'apple'], ['pumpkin', 'leaf', 'pumpkin', 'apple'], 'leaf', [['leaf', 'fall']], 'head:leaf', 'petals'],
  new_years_eve: ['clock', ['burst', 'star', 'sparkle'], ['burst', 'rocket', 'burst', 'star'], 'star', [['sparkle', 'twinkle']], 'party_hat', 'fireworks'],
  lunar_new_year: ['lantern_red', ['envelope', 'sparkle', 'flower'], ['lantern_red', 'envelope', 'lantern_red', 'burst'], 'lantern_red', [['sparkle', 'twinkle']], 'held:lantern_red', 'fireworks'],

  // Jewish
  hanukkah: ['menorah', ['dreidel', 'star', 'sparkle'], ['menorah', 'dreidel', 'menorah', 'star'], 'star', [['sparkle', 'twinkle']], 'held:dreidel', 'stars'],
  rosh_hashanah: ['apple', ['honey', 'sparkle', 'star'], ['apple', 'honey', 'apple', 'honey'], 'apple', [['sparkle', 'twinkle']], 'held:honey', 'stars'],
};

const NAMED_COSTUMES = ['party_hat', 'rose', 'flower_crown', 'medal', 'shades', 'santa_hat', 'witch_hat', 'bunny_ears', 'holi_colour'];
const FINALES = ['confetti', 'petals', 'fireworks', 'lanterns', 'stars', 'snow', 'powder'];
const MOTIONS = ['rise', 'fall', 'float', 'twinkle'];

const festivals = {};
const problems = [];
for (const [id, [hero, extras, taps, garland, ambient, costume, fx]] of Object.entries(FESTIVALS)) {
  const used = [hero, ...extras, ...taps, ...(garland ? [garland] : []), ...ambient.map((a) => a[0])];
  for (const motif of used) if (!M[motif]) problems.push(`${id}: no drawing named "${motif}"`);
  for (const [, motion] of ambient) if (!MOTIONS.includes(motion)) problems.push(`${id}: bad motion "${motion}"`);
  if (taps.length !== 4) problems.push(`${id}: needs exactly four taps`);
  if (!FINALES.includes(fx)) problems.push(`${id}: bad finale "${fx}"`);
  const [kind, drawing] = costume.split(':');
  if (drawing ? !(['head', 'held'].includes(kind) && M[drawing]) : !NAMED_COSTUMES.includes(costume)) problems.push(`${id}: bad costume "${costume}"`);
  festivals[id] = { hero, extras, taps, garland, ambient: ambient.map(([motif, motion]) => ({ motif, motion })), costume, fx };
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

/* ------------------------------------------------------------------ write */
function clean(shape) {
  const out = {};
  for (const [key, value] of Object.entries(shape)) {
    if (value === undefined || value === 0 && key === 'rx') continue;
    out[key] = typeof value === 'number' ? f1(value) : value;
  }
  return out;
}

const motifs = Object.fromEntries(
  Object.entries(M)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, shapes]) => [id, shapes.map(clean)]),
);
const contentFor = (part) =>
  JSON.stringify(part === 'motifs' ? { box: 100, motifs } : { festivals }, null, 1) + '\n';

if (process.argv.includes('--check')) {
  const stale = OUTPUTS.filter(({ file, part }) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== contentFor(part));
  if (stale.length) {
    console.error('Out of date:\n' + stale.map(({ file }) => '  ' + path.relative(ROOT, file)).join('\n') + '\nRun: node scripts/art/festival-motifs.mjs');
    process.exit(1);
  }
  console.log(`Festival art is up to date (${Object.keys(motifs).length} drawings, ${Object.keys(festivals).length} festivals).`);
} else {
  for (const { file, part } of OUTPUTS) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contentFor(part));
  }
  console.log(`Wrote ${Object.keys(motifs).length} drawings and ${Object.keys(festivals).length} festivals to ${OUTPUTS.length} files.`);
}
