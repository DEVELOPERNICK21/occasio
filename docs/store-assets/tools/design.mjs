// Shared building blocks for the Occasio store graphics (adapted from /store-assets/tools/design.mjs): palette, device frames,
// status bar, confetti, glows. Everything is laid out in a 1320-wide design
// space and scaled to the final canvas, so one layout serves iOS and Play.

export const DESIGN_W = 1320;

/**
 * Brand hues only (design-tokens.json: coral primary, amber secondary, rose, sage).
 * `deep` sits behind the headline (white text needs >= 4.5:1, checked by contrastWhite()).
 */
export const HUES = {
  coral:   { deep: '#C23447', mid: '#E8615D', light: '#FF9A6B', accent: '#FFE29A' },
  marigold:{ deep: '#B8520C', mid: '#E07A22', light: '#FFB347', accent: '#FFF1B8' },
  rose:    { deep: '#A92A56', mid: '#DB4670', light: '#FF7E9C', accent: '#FFE0B8' },
  sage:    { deep: '#2F5E4C', mid: '#4C8A6D', light: '#8FCBA8', accent: '#FFF1B8' },
};

function lum(hex) {
  const c = hex.replace('#', '').match(/../g).map((v) => parseInt(v, 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const contrastWhite = (hex) => 1.05 / (lum(hex) + 0.05);

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function background(hue, { angle = 172 } = {}) {
  const h = HUES[hue];
  return `background:
    radial-gradient(900px 700px at 88% 62%, ${h.light}66 0%, transparent 70%),
    radial-gradient(1100px 900px at 8% 105%, ${h.light}55 0%, transparent 65%),
    linear-gradient(${angle}deg, ${h.deep} 0%, ${h.mid} 52%, ${h.light} 118%);`;
}

/** Soft light blob. */
export const glow = (x, y, r, color = '#fff', a = 0.35) =>
  `<div style="position:absolute;left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:radial-gradient(circle, ${color}${Math.round(a * 255).toString(16).padStart(2, '0')} 0%, transparent 68%);"></div>`;

/** Thin decorative ring. */
export const ring = (cx, cy, r, a = 0.18, w = 3) =>
  `<div style="position:absolute;left:${cx - r}px;top:${cy - r}px;width:${r * 2}px;height:${r * 2}px;border-radius:50%;border:${w}px solid rgba(255,255,255,${a});"></div>`;

/** Deterministic confetti scattered over a region, avoiding `avoid` boxes. */
export function confetti({ seed = 1, n = 28, area, avoid = [], colors, z = 1 }) {
  const rand = rng(seed);
  const [ax, ay, aw, ah] = area;
  let out = '';
  let placed = 0, guard = 0;
  while (placed < n && guard++ < n * 20) {
    const x = ax + rand() * aw, y = ay + rand() * ah;
    if (avoid.some(([bx, by, bw, bh]) => x > bx - 30 && x < bx + bw + 30 && y > by - 30 && y < by + bh + 30)) continue;
    const c = colors[Math.floor(rand() * colors.length)];
    const kind = rand();
    const rot = Math.floor(rand() * 360);
    const op = (0.5 + rand() * 0.45).toFixed(2);
    if (kind < 0.5) {
      const w = 12 + rand() * 8, h = 30 + rand() * 18;
      out += `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:4px;background:${c};opacity:${op};transform:rotate(${rot}deg)"></div>`;
    } else if (kind < 0.78) {
      const d = 22 + rand() * 18;
      out += `<div style="position:absolute;left:${x}px;top:${y}px;width:${d}px;height:${d}px;border-radius:50%;border:5px solid ${c};opacity:${op}"></div>`;
    } else {
      const d = 16 + rand() * 12;
      out += `<div style="position:absolute;left:${x}px;top:${y}px;width:${d}px;height:${d}px;border-radius:50%;background:${c};opacity:${op}"></div>`;
    }
    placed++;
  }
  return `<div style="position:absolute;inset:0;z-index:${z};pointer-events:none">${out}</div>`;
}

const SIGNAL = `<svg viewBox="0 0 54 34" width="1em" height="0.63em"><g fill="currentColor"><rect x="0" y="22" width="9" height="12" rx="2.5"/><rect x="15" y="15" width="9" height="19" rx="2.5"/><rect x="30" y="8" width="9" height="26" rx="2.5"/><rect x="45" y="0" width="9" height="34" rx="2.5"/></g></svg>`;
const WIFI = `<svg viewBox="0 0 48 34" width="0.9em" height="0.64em"><g fill="none" stroke="currentColor" stroke-width="5.2" stroke-linecap="round"><path d="M4 12.5a28 28 0 0 1 40 0"/><path d="M11 20a18 18 0 0 1 26 0"/></g><circle cx="24" cy="29" r="4.4" fill="currentColor"/></svg>`;
const BATTERY = `<svg viewBox="0 0 84 36" width="1.35em" height="0.58em"><rect x="1.5" y="1.5" width="70" height="33" rx="10" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="3"/><rect x="6" y="6" width="61" height="24" rx="6.5" fill="currentColor"/><path d="M76 12v12c3.2-.9 5.5-4 5.5-6s-2.3-5.1-5.5-6z" fill="currentColor" fill-opacity=".45"/></svg>`;

/**
 * A device with the screenshot inside. `platform`: 'ios' | 'android'.
 * `w` is the SCREEN width; the frame adds a bezel around it.
 */
export function phone({ img, w = 960, x = 0, y = 0, rot = 0, z = 5, platform = 'ios', fit = 'cover', statusColor = '#2A2220', dim = 0, aspect = 2000 / 921, shadow = true, strip = null }) {
  const android = platform === 'android';
  const h = Math.round(w * aspect);
  const bez = Math.round(w * (android ? 0.017 : 0.021));
  const rScreen = Math.round(w * (android ? 0.092 : 0.128));
  const rOuter = rScreen + bez;
  const fs = w * 0.0395;
  const status = `
    <div style="position:absolute;left:0;right:0;top:${w * 0.036}px;height:${w * 0.062}px;display:flex;align-items:center;justify-content:space-between;padding:0 ${w * (android ? 0.075 : 0.085)}px;font:600 ${fs}px/1 -apple-system,'SF Pro Text','Plus Jakarta Sans',system-ui,sans-serif;color:${statusColor};z-index:3;">
      <span style="letter-spacing:-0.01em;${android ? '' : `margin-left:${w * 0.02}px;`}">9:41</span>
      <span style="display:flex;gap:${w * 0.014}px;align-items:center;font-size:${fs}px;">${SIGNAL}${WIFI}${BATTERY}</span>
    </div>`;
  const cutout = android
    ? `<div style="position:absolute;left:50%;top:${w * 0.028}px;width:${w * 0.036}px;height:${w * 0.036}px;margin-left:${-w * 0.018}px;border-radius:50%;background:#050506;z-index:4;box-shadow:0 0 0 ${w * 0.004}px #111"></div>`
    : `<div style="position:absolute;left:50%;top:${w * 0.026}px;width:${w * 0.285}px;height:${w * 0.083}px;margin-left:${-w * 0.1425}px;border-radius:${w * 0.05}px;background:#050506;z-index:4;"></div>`;
  const btn = (side, top, hh) =>
    `<div style="position:absolute;${side}:${-bez * 0.5}px;top:${top}px;width:${bez * 0.9}px;height:${hh}px;border-radius:${bez}px;background:linear-gradient(${side === 'left' ? 90 : 270}deg,#2b2b30,#46464c);"></div>`;
  const buttons = android
    ? btn('right', h * 0.2, h * 0.07) + btn('right', h * 0.3, h * 0.11)
    : btn('left', h * 0.17, h * 0.035) + btn('left', h * 0.24, h * 0.06) + btn('left', h * 0.315, h * 0.06) + btn('right', h * 0.26, h * 0.095);
  return `
  <div style="position:absolute;left:${x}px;top:${y}px;width:${w + bez * 2}px;height:${h + bez * 2}px;transform:rotate(${rot}deg);transform-origin:50% 60%;z-index:${z};${shadow ? `filter:drop-shadow(0 ${w * 0.05}px ${w * 0.07}px rgba(30,5,15,.38)) drop-shadow(0 ${w * 0.012}px ${w * 0.02}px rgba(30,5,15,.25));` : ''}">
    ${buttons}
    <div style="position:absolute;inset:0;border-radius:${rOuter}px;background:linear-gradient(150deg,#5a5a62 0%,#1d1d21 22%,#2a2a2f 60%,#4a4a52 100%);padding:${bez}px;box-shadow:inset 0 0 0 ${Math.max(2, bez * 0.12)}px rgba(255,255,255,.16);">
      <div style="position:relative;width:${w}px;height:${h}px;border-radius:${rScreen}px;overflow:hidden;background:#000;box-shadow:0 0 0 ${Math.max(3, bez * 0.22)}px #060607;">
        ${strip
          ? `<div style="position:absolute;left:0;top:0;right:0;height:${Math.round(w * 0.134) + 2}px;background:linear-gradient(90deg,${strip[0]},${strip[1]},${strip[2]})"></div>
        <img src="${img}" style="position:absolute;left:0;right:0;top:${Math.round(w * 0.134)}px;width:100%;height:${h - Math.round(w * 0.134)}px;object-fit:cover;object-position:top;display:block">`
          : `<img src="${img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:${fit};object-position:top;display:block">`}
        ${dim ? `<div style="position:absolute;inset:0;background:rgba(20,5,10,${dim})"></div>` : ''}
        ${status}${cutout}
      </div>
    </div>
  </div>`;
}

/** Floating 3D prop (transparent PNG from the real scenes). */
export function prop({ img, w, x, y, rot = 0, z = 8, shadow = '0 40px 50px rgba(30,5,15,.28)', flip = false, op = 1 }) {
  return `<img src="${img}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;transform:rotate(${rot}deg)${flip ? ' scaleX(-1)' : ''};z-index:${z};opacity:${op};filter:drop-shadow(${shadow});pointer-events:none">`;
}

export function headline({ top = 150, lines, sub, accent, size = 136, subSize = 52, subW = 1060, align = 'center' }) {
  return `
  <div style="position:absolute;left:0;right:0;top:${top}px;z-index:20;text-align:${align};padding:0 70px;">
    <div class="hl" style="font-size:${size}px;--accent:${accent}">${lines}</div>
    ${sub ? `<div class="sub" style="font-size:${subSize}px;max-width:${subW}px;margin:${Math.round(size * 0.24)}px auto 0">${sub}</div>` : ''}
  </div>`;
}

/** Small pill above the headline: solid = screen from the app, outline = what the recipient opens. */
export function eyebrow({ text, kind, top, deep }) {
  const solid = kind === 'app';
  return `<div style="position:absolute;left:0;right:0;top:${top}px;z-index:21;display:flex;justify-content:center;">
    <div style="font:800 33px/1 'Plus Jakarta Sans',system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;padding:17px 34px 17px 38px;border-radius:999px;${
      solid ? `background:#fff;color:${deep};box-shadow:0 10px 30px rgba(30,5,15,.22)` : 'color:#fff;border:3px solid rgba(255,255,255,.62);background:rgba(255,255,255,.12)'
    }">${text}</div></div>`;
}

export function page({ canvasW, canvasH, H, platform, body, bg, designW = DESIGN_W }) {
  const s = canvasW / designW;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,600;1,9..144,700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${canvasW}px;height:${canvasH}px;overflow:hidden;background:#000}
.stage{position:absolute;left:0;top:0;width:${designW}px;height:${H}px;transform:scale(${s});transform-origin:0 0;overflow:hidden;${bg}}
.hl{font-family:'Fraunces',Georgia,serif;font-weight:700;color:#fff;line-height:1.02;letter-spacing:-0.012em;text-shadow:0 3px 0 rgba(0,0,0,.05),0 10px 40px rgba(60,0,20,.18);font-variation-settings:'opsz' 144}
.hl em{font-style:italic;font-weight:600;color:var(--accent)}
.sub{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;color:rgba(255,255,255,.94);line-height:1.3;letter-spacing:-0.003em;text-shadow:0 2px 14px rgba(60,0,20,.18)}
</style></head><body><div class="stage">${body}</div></body></html>`;
}
