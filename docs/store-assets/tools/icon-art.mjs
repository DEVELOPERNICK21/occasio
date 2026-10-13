// Shared drawing code for the Occasio app icon: Pip, the chunky heart and the calendar badge.
// Used by icons-v3.mjs (explorations) and icon-final.mjs (the shipped layers).
// App palette (tokens.ts) and Pip's colours (tokens.mascot).
export const P = {
  cream: '#FFF8F2', creamLip: '#EFD2C1', coral: '#EF5A55', coralLip: '#BF3D43', header: '#E8615D', headerLip: '#C94E4A',
  ink: '#2A2220',
};
export const M = {
  light: '#FFB27A', base: '#FF8A4C', shade: '#E2622B', lip: '#C9531F', cheek: '#FF5D7A', ink: '#2B1B2E',
  mouth: '#5B1F2E', tongue: '#FF7A93', hatRed: '#FF4D6D', hatBand: '#FFD166', hatBlue: '#3A86FF', hatBrim: '#FFB703',
};

export const BODY = 'M120 24C178 24 214 76 214 138C214 196 178 232 120 232C62 232 26 196 26 138C26 76 62 24 120 24Z';

// Heart centred on (0,0): about 1.0*s wide, 0.85*s tall.
export const heart = (s) =>
  `M0 ${s * 0.42} C${-s * 0.62} ${-s * 0.02}, ${-s * 0.44} ${-s * 0.46}, ${-s * 0.2} ${-s * 0.46} C${-s * 0.08} ${-s * 0.46}, 0 ${-s * 0.38}, 0 ${-s * 0.26} C0 ${-s * 0.38}, ${s * 0.08} ${-s * 0.46}, ${s * 0.2} ${-s * 0.46} C${s * 0.44} ${-s * 0.46}, ${s * 0.62} ${-s * 0.02}, 0 ${s * 0.42} Z`;

// A chunky coral heart with its darker lip underneath (the Duolingo "button" depth) and a glint.
export const chunkyHeart = (x, y, s) => `<g transform="translate(${x} ${y})">
  <path d="${heart(s)}" transform="translate(0 ${s * 0.05})" fill="${P.coralLip}"/>
  <path d="${heart(s)}" fill="${P.coral}"/>
  <path d="M${-s * 0.3} ${-s * 0.2} Q${-s * 0.22} ${-s * 0.36} ${-s * 0.06} ${-s * 0.3}" stroke="#fff" stroke-opacity=".6" stroke-width="${s * 0.065}" stroke-linecap="round" fill="none"/></g>`;

export const HAT = `<g transform="rotate(-9 120 44)">
  <path d="M82 46L120 -32L158 46Z" fill="${M.hatRed}"/><path d="M98 14L142 14L150 32L90 32Z" fill="${M.hatBand}"/>
  <path d="M104 -2L136 -2L141 10L99 10Z" fill="${M.hatBlue}" opacity=".92"/><ellipse cx="120" cy="46" rx="41" ry="8.5" fill="${M.hatBrim}"/>
  <circle cx="120" cy="-33" r="10" fill="#fff"/><circle cx="117" cy="-36" r="3.5" fill="#fff" opacity=".8"/></g>`;

export const HAT_OUTLINE = (c, w) => `<g transform="rotate(-9 120 44)" fill="${c}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round">
  <path d="M82 46L120 -32L158 46Z"/><ellipse cx="120" cy="46" rx="41" ry="8.5"/><circle cx="120" cy="-33" r="10"/></g>`;

// Pip: body centre on (x, y), scale k. Opens his eyes wide and grins (his "joy" mouth).
//   outline: a cream sticker edge so he stands off a similar-coloured backdrop.
//   hands: 'down' | 'hold' (hands lifted to the sides of something held at his belly) | 'grip' (on an edge)
export function pip({ x, y, k, id, outline = false, feet = true, hands = 'down' }) {
  const arms = hands === 'down'
    ? `<ellipse cx="22" cy="152" rx="15" ry="27" fill="${M.base}" transform="rotate(14 22 152)"/><ellipse cx="218" cy="152" rx="15" ry="27" fill="${M.base}" transform="rotate(-14 218 152)"/>`
    : '';
  const hold = hands === 'hold'
    ? `<ellipse cx="26" cy="168" rx="16" ry="26" fill="${M.base}" transform="rotate(-18 26 168)"/><ellipse cx="214" cy="168" rx="16" ry="26" fill="${M.base}" transform="rotate(18 214 168)"/>`
    : '';
  return `<g transform="translate(${x - 120 * k} ${y - 128 * k}) scale(${k})">
  <defs><radialGradient id="pb${id}" cx="36%" cy="26%" r="82%"><stop offset="0" stop-color="${M.light}"/><stop offset=".58" stop-color="${M.base}"/><stop offset="1" stop-color="${M.shade}"/></radialGradient>
        <clipPath id="mc${id}"><path d="M92 152Q120 160 148 152Q142 194 120 196Q98 194 92 152Z"/></clipPath></defs>
  ${outline ? `<path d="${BODY}" fill="${P.cream}" stroke="${P.cream}" stroke-width="13" stroke-linejoin="round"/>${HAT_OUTLINE(P.cream, 13)}` : ''}
  ${feet ? `<ellipse cx="84" cy="236" rx="29" ry="13" fill="${M.lip}"/><ellipse cx="156" cy="236" rx="29" ry="13" fill="${M.lip}"/>` : ''}
  ${arms}
  <path d="${BODY}" transform="translate(0 7)" fill="${M.lip}"/>
  <path d="${BODY}" fill="url(#pb${id})"/>
  <ellipse cx="78" cy="68" rx="30" ry="16" fill="#fff" opacity=".3" transform="rotate(-24 78 68)"/>
  <ellipse cx="54" cy="150" rx="16" ry="10" fill="${M.cheek}" opacity=".6"/><ellipse cx="186" cy="150" rx="16" ry="10" fill="${M.cheek}" opacity=".6"/>
  <ellipse cx="88" cy="116" rx="24" ry="30" fill="#fff"/><ellipse cx="152" cy="116" rx="24" ry="30" fill="#fff"/>
  <circle cx="91" cy="121" r="16" fill="${M.ink}"/><circle cx="149" cy="121" r="16" fill="${M.ink}"/>
  <circle cx="97" cy="112" r="6.5" fill="#fff"/><circle cx="143" cy="112" r="6.5" fill="#fff"/><circle cx="85" cy="130" r="3" fill="#fff" opacity=".9"/><circle cx="155" cy="130" r="3" fill="#fff" opacity=".9"/>
  <path d="M92 152Q120 160 148 152Q142 194 120 196Q98 194 92 152Z" fill="${M.mouth}"/>
  <g clip-path="url(#mc${id})"><ellipse cx="120" cy="190" rx="20" ry="13" fill="${M.tongue}"/><path d="M96 152Q120 160 144 152L143 146Q120 154 97 146Z" fill="#fff"/></g>
  ${hold}
  ${HAT}</g>`;
}

export const shadow = (id, dy, blur, op) =>
  `<filter id="${id}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="#7a3a05" flood-opacity="${op}"/></filter>`;

// The chosen Date Heart colours: amber field, cream page, coral header and heart. Flatter and a touch
// brighter than before so Pip's orange stands off it.
export const BG = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFCB4D"/><stop offset="1" stop-color="#FFAE2F"/></linearGradient>`;

export const calendar = ({ x, y, w, h, headerH = 96, rings = true, lip = 16 }) => `<g>
  <rect x="${x}" y="${y + lip}" width="${w}" height="${h}" rx="64" fill="${P.creamLip}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="64" fill="${P.cream}"/>
  <clipPath id="cal${x}${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="64"/></clipPath>
  <g clip-path="url(#cal${x}${y})"><rect x="${x}" y="${y}" width="${w}" height="${headerH}" fill="${P.header}"/><rect x="${x}" y="${y + headerH - 10}" width="${w}" height="10" fill="${P.headerLip}"/></g>
  ${rings ? `<rect x="${x + w * 0.24}" y="${y - 40}" width="34" height="84" rx="17" fill="${P.cream}" stroke="${P.headerLip}" stroke-width="6"/>
  <rect x="${x + w * 0.76 - 34}" y="${y - 40}" width="34" height="84" rx="17" fill="${P.cream}" stroke="${P.headerLip}" stroke-width="6"/>` : ''}</g>`;

