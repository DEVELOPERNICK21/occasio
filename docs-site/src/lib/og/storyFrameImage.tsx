import type { StoryFrameCopy, StoryFrameParams } from '../experience/storyShare';
import { storyHeadlineSize } from '../experience/storyShare';
import type { OgTheme } from './ogTheme';
import { heavy, pipArt } from './surpriseImage';

/** A story is 9:16. Instagram covers the top 250 and the bottom 340 with its own buttons. */
export const STORY_SIZE = { width: 1080, height: 1920 } as const;

type Props = {
  copy: StoryFrameCopy;
  params: StoryFrameParams;
  theme: OgTheme;
};

/** A five-point star of radius 1 around (0,0). */
const STAR = (() => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? 1 : 0.42;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(Math.cos(angle) * radius).toFixed(3)} ${(Math.sin(angle) * radius).toFixed(3)}`;
  });
  return `M${points.join('L')}Z`;
})();

const SPARKLE = 'M0 -1 Q.14 -.14 1 0 Q.14 .14 0 1 Q-.14 .14 -1 0 Q-.14 -.14 0 -1Z';

/** Pieces around Pip, in the 760x560 box he sits in. */
const CONFETTI: ReadonlyArray<{ x: number; y: number; kind: 'dot' | 'bar' | 'star'; turn: number; size: number }> = [
  { x: 44, y: 130, kind: 'dot', turn: 0, size: 22 },
  { x: 120, y: 40, kind: 'bar', turn: 28, size: 40 },
  { x: 250, y: 18, kind: 'star', turn: 0, size: 26 },
  { x: 560, y: 34, kind: 'star', turn: 0, size: 30 },
  { x: 700, y: 150, kind: 'dot', turn: 0, size: 24 },
  { x: 690, y: 330, kind: 'bar', turn: -32, size: 44 },
  { x: 30, y: 360, kind: 'bar', turn: 40, size: 40 },
  { x: 96, y: 480, kind: 'dot', turn: 0, size: 20 },
  { x: 650, y: 490, kind: 'star', turn: 0, size: 26 },
  { x: 180, y: 250, kind: 'dot', turn: 0, size: 16 },
  { x: 596, y: 230, kind: 'dot', turn: 0, size: 18 },
];

/**
 * The story frame: Pip, who the surprise was from (nobody: it is public), how many stars were
 * found, and a button-shaped spot for the person to lay Instagram's link sticker over. Nothing
 * from the card appears. Everything that matters sits between Instagram's top and bottom strips.
 */
export function StoryFrameImage({ copy, params, theme }: Props) {
  const stars = copy.score !== null ? params.of : 0;
  const slot = stars > 0 ? 880 / stars : 0;
  const starSize = Math.min(84, slot * 0.78);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 250,
        background: `linear-gradient(170deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`,
        fontFamily: 'sans-serif',
      }}
    >
      <svg width="760" height="560" viewBox="0 0 760 560">
        <ellipse cx="380" cy="530" rx="190" ry="20" fill="#2A2220" opacity="0.12" />
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
                height={12}
                rx="5"
                fill={color}
                transform={`rotate(${piece.turn} ${piece.x} ${piece.y})`}
              />
            );
          }
          return <path key={i} d={SPARKLE} fill={color} transform={`translate(${piece.x} ${piece.y}) scale(${piece.size})`} />;
        })}
        <g transform="translate(236 100) scale(1.28)">{pipArt(theme.mascot)}</g>
      </svg>

      <div
        style={{
          display: 'flex',
          marginTop: 22,
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: theme.accentDeep,
          ...heavy(theme.accentDeep, 0.8),
        }}
      >
        {copy.eyebrow}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          textAlign: 'center',
          marginTop: 18,
          maxWidth: 900,
          fontSize: storyHeadlineSize(copy.headline),
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: '-0.01em',
          color: theme.ink,
          textWrap: 'balance',
          ...heavy(theme.ink, 4),
        }}
      >
        {copy.headline}
      </div>

      {copy.score !== null ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 44 }}>
          <svg width="880" height="96" viewBox="0 0 880 96">
            {Array.from({ length: stars }, (_, i) => {
              const found = i < params.found;
              return (
                <path
                  key={i}
                  d={STAR}
                  transform={`translate(${slot * i + slot / 2} 48) scale(${starSize / 2})`}
                  fill={found ? theme.confetti[0]! : 'none'}
                  stroke={found ? theme.accentDeep : theme.inkSoft}
                  strokeWidth={found ? 0.08 : 0.1}
                  strokeLinejoin="round"
                  opacity={found ? 1 : 0.45}
                />
              );
            })}
          </svg>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 42, color: theme.inkSoft }}>{copy.score}</div>
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          marginTop: 52,
          padding: '34px 76px',
          borderRadius: 999,
          background: theme.accentDeep,
          color: '#ffffff',
          fontSize: 50,
          fontWeight: 700,
          ...heavy('#ffffff', 0.8),
        }}
      >
        {copy.cta}
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 30,
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: theme.inkSoft,
          ...heavy(theme.inkSoft, 0.6),
        }}
      >
        OCCASIO
      </div>
    </div>
  );
}
