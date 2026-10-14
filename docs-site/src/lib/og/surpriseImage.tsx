import type { OgTheme } from './ogTheme';
import { mix } from './ogTheme';
import { headlineSize, type Teaser } from './teaser';

export const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * The renderer's built-in font has a single weight, and fetching one at request time would
 * send every recipient's name to a font server. So big text is thickened with a stroke in its
 * own colour instead (rounded, so the edges stay smooth).
 */
function heavy(color: string, width: number) {
  return { WebkitTextStroke: `${width}px ${color}`, paintOrder: 'stroke fill' } as const;
}

type Props = {
  teaser: Teaser;
  theme: OgTheme;
  /** A blurred wash of the first photo, or null. Never the photo itself. */
  wash: string | null;
};

const SPARKLE = 'M0 -1 Q.14 -.14 1 0 Q.14 .14 0 1 Q-.14 .14 -1 0 Q-.14 -.14 0 -1Z';

/**
 * Pip, flat, winking, in his party hat. Drawn at (0,0) to (240,236); the caller places and scales it.
 * A plain function, not a component: the image renderer cannot expand components inside an svg.
 */
function pipArt(colors: OgTheme['mascot']) {
  return (
    <g>
      <ellipse cx="84" cy="236" rx="29" ry="13" fill={colors.shade} />
      <ellipse cx="156" cy="236" rx="29" ry="13" fill={colors.shade} />
      <path
        d="M120 24C178 24 214 76 214 138C214 196 178 232 120 232C62 232 26 196 26 138C26 76 62 24 120 24Z"
        fill={colors.base}
      />
      <ellipse cx="100" cy="92" rx="66" ry="54" fill={colors.light} opacity="0.7" />
      <ellipse cx="78" cy="68" rx="30" ry="16" fill="#fff" opacity="0.32" transform="rotate(-24 78 68)" />
      <ellipse cx="54" cy="152" rx="16" ry="10" fill={colors.cheek} opacity="0.7" />
      <ellipse cx="186" cy="152" rx="16" ry="10" fill={colors.cheek} opacity="0.7" />
      <path d="M64 128Q86 94 108 128" stroke="#2B1B2E" strokeWidth="7" strokeLinecap="round" fill="none" />
      <ellipse cx="154" cy="120" rx="22" ry="28" fill="#fff" />
      <circle cx="152" cy="125" r="15" fill="#2B1B2E" />
      <circle cx="158" cy="116" r="6" fill="#fff" />
      <path d="M96 156Q120 182 144 156" stroke="#2B1B2E" strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="134" cy="173" rx="8" ry="10" fill="#FF7A93" />
      <g transform="rotate(-9 120 44)">
        <path d="M82 46L120 -32L158 46Z" fill="#FF4D6D" />
        <path d="M98 14L142 14L150 32L90 32Z" fill="#FFD166" />
        <path d="M104 -2L136 -2L141 10L99 10Z" fill="#3A86FF" />
        <ellipse cx="120" cy="46" rx="41" ry="9" fill="#FFB703" />
        <circle cx="120" cy="-33" r="10" fill="#fff" />
      </g>
    </g>
  );
}

const CONFETTI: ReadonlyArray<{ x: number; y: number; kind: 'dot' | 'bar' | 'star'; turn: number; size: number }> = [
  { x: 38, y: 96, kind: 'dot', turn: 0, size: 12 },
  { x: 96, y: 40, kind: 'bar', turn: 28, size: 22 },
  { x: 200, y: 22, kind: 'star', turn: 0, size: 18 },
  { x: 452, y: 40, kind: 'star', turn: 0, size: 22 },
  { x: 488, y: 150, kind: 'dot', turn: 0, size: 14 },
  { x: 472, y: 300, kind: 'bar', turn: -32, size: 24 },
  { x: 24, y: 290, kind: 'bar', turn: 40, size: 22 },
  { x: 60, y: 420, kind: 'dot', turn: 0, size: 12 },
  { x: 472, y: 430, kind: 'star', turn: 0, size: 18 },
  { x: 150, y: 590, kind: 'dot', turn: 0, size: 14 },
  { x: 410, y: 585, kind: 'bar', turn: 20, size: 20 },
];

/**
 * The link preview: a sealed gift, Pip peeking over it, the name, and a clear way in.
 * It teases and never spoils: the photo, if there is one, is only a blurred wash.
 */
export function SurpriseImage({ teaser, theme, wash }: Props) {
  const lid = mix(theme.paper, '#ffffff', 0.18);
  const shade = mix(theme.paper, '#000000', 0.16);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: `linear-gradient(150deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Left: who it is for, and the way in. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: 660,
          paddingLeft: 78,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: theme.accentDeep,
            ...heavy(theme.accentDeep, 0.7),
          }}
        >
          {teaser.eyebrow}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: headlineSize(teaser.headline),
            fontWeight: 700,
            lineHeight: 1.04,
            color: theme.ink,
            ...heavy(theme.ink, 4),
            margin: '14px 0 0',
            letterSpacing: '-0.01em',
          }}
        >
          {teaser.headline}
        </div>
        <div style={{ display: 'flex', fontSize: 32, color: theme.inkSoft, margin: '26px 0 0', maxWidth: 480, textWrap: 'balance' }}>
          {teaser.line}
        </div>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            margin: '44px 0 0',
            padding: '20px 40px',
            borderRadius: 999,
            background: theme.accentDeep,
            color: '#ffffff',
            ...heavy('#ffffff', 0.7),
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          {teaser.cta}
        </div>
      </div>

      {/* Right: the surprise. Back to front: confetti and Pip, the photo wash, the gift. */}
      <div style={{ position: 'absolute', right: 20, top: 16, display: 'flex', width: 520, height: 600 }}>
        <svg width="520" height="600" viewBox="0 0 520 600" style={{ position: 'absolute', left: 0, top: 0 }}>
          <ellipse cx="250" cy="566" rx="210" ry="22" fill="#2A2220" opacity="0.12" />
          {CONFETTI.map((piece, i) => {
            const color = theme.confetti[i % theme.confetti.length]!;
            if (piece.kind === 'dot') return <circle key={i} cx={piece.x} cy={piece.y} r={piece.size / 2} fill={color} />;
            if (piece.kind === 'bar') {
              return (
                <rect
                  key={i}
                  x={piece.x}
                  y={piece.y}
                  width={piece.size}
                  height={8}
                  rx="3"
                  fill={color}
                  transform={`rotate(${piece.turn} ${piece.x} ${piece.y})`}
                />
              );
            }
            return <path key={i} d={SPARKLE} fill={color} transform={`translate(${piece.x} ${piece.y}) scale(${piece.size})`} />;
          })}
          <g transform="translate(262 52) scale(1.02)">{pipArt(theme.mascot)}</g>
        </svg>

        {wash ? (
          <div
            style={{
              position: 'absolute',
              left: 6,
              top: 120,
              display: 'flex',
              width: 232,
              height: 296,
              padding: '14px 14px 58px',
              background: '#fffdf8',
              borderRadius: 10,
              boxShadow: '0 18px 30px rgba(42,34,32,0.22)',
              transform: 'rotate(-9deg)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img src={wash} width={204} height={224} style={{ borderRadius: 4, objectFit: 'cover' }} />
          </div>
        ) : null}

        <svg width="520" height="600" viewBox="0 0 520 600" style={{ position: 'absolute', left: 0, top: 0 }}>
          {/* Box */}
          <rect x="76" y="372" width="346" height="186" rx="24" fill={theme.paper} />
          <rect x="96" y="394" width="26" height="150" rx="13" fill="#fff" opacity="0.2" />
          {/* Lid */}
          <rect x="58" y="318" width="382" height="72" rx="22" fill={lid} />
          <rect x="58" y="374" width="382" height="16" rx="8" fill={shade} opacity="0.25" />
          {/* Ribbon */}
          <rect x="224" y="318" width="50" height="240" fill={theme.ribbon} />
          <rect x="224" y="318" width="14" height="240" fill="#fff" opacity="0.28" />
          {/* Bow */}
          <ellipse cx="206" cy="296" rx="62" ry="34" fill={theme.ribbon} transform="rotate(-22 206 296)" />
          <ellipse cx="292" cy="296" rx="62" ry="34" fill={mix(theme.ribbon, '#000000', 0.12)} transform="rotate(22 292 296)" />
          <ellipse cx="190" cy="288" rx="22" ry="11" fill="#fff" opacity="0.4" transform="rotate(-22 190 288)" />
          <rect x="226" y="282" width="46" height="40" rx="14" fill={mix(theme.ribbon, '#000000', 0.06)} />
          {/* The "?" seal on the front: a secret */}
          <circle cx="249" cy="470" r="46" fill="#fff" />
          <circle cx="249" cy="470" r="38" fill="none" stroke={theme.accentDeep} strokeWidth="4" opacity="0.35" />
          <path
            d="M228 456 Q228 436 249 436 Q270 436 270 454 Q270 466 256 474 Q249 478 249 488"
            fill="none"
            stroke={theme.accentDeep}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="249" cy="506" r="8" fill={theme.accentDeep} />
        </svg>
      </div>
    </div>
  );
}
