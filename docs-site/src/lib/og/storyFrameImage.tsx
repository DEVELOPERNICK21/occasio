import { PIP_ASPECT, PIP_VIEW_BOX, pipFigure } from '../../components/story/fx/pipParts';
import type { StoryFrameCopy } from '../experience/storyShare';
import { storyHeadlineSize } from '../experience/storyShare';
import type { OgTheme } from './ogTheme';
import { mix } from './ogTheme';
import { heavy } from './surpriseImage';

/** A story is 9:16. Instagram covers the top 250 and the bottom 340 with its own buttons. */
export const STORY_SIZE = { width: 1080, height: 1920 } as const;

type Props = {
  copy: StoryFrameCopy;
  theme: OgTheme;
  /** A blurred wash of the first photo, or null. Never the photo itself. */
  wash: string | null;
  /** True when this shows something of the card (its words, who made it); false for the plain frame. */
  peek: boolean;
};

const SPARKLE = 'M0 -1 Q.14 -.14 1 0 Q.14 .14 0 1 Q-.14 .14 -1 0 Q-.14 -.14 0 -1Z';

/** Confetti over the whole picture, kept inside Instagram's safe area. */
const CONFETTI: ReadonlyArray<{ x: number; y: number; kind: 'dot' | 'bar' | 'star'; turn: number; size: number }> = [
  { x: 70, y: 340, kind: 'dot', turn: 0, size: 22 },
  { x: 130, y: 470, kind: 'bar', turn: 28, size: 40 },
  { x: 990, y: 330, kind: 'star', turn: 0, size: 28 },
  { x: 60, y: 760, kind: 'star', turn: 0, size: 26 },
  { x: 1010, y: 560, kind: 'dot', turn: 0, size: 24 },
  { x: 980, y: 800, kind: 'bar', turn: -32, size: 44 },
  { x: 40, y: 1030, kind: 'bar', turn: 40, size: 40 },
  { x: 1030, y: 1100, kind: 'star', turn: 0, size: 24 },
  { x: 80, y: 1330, kind: 'dot', turn: 0, size: 20 },
  { x: 1000, y: 1330, kind: 'bar', turn: 22, size: 38 },
  { x: 540, y: 276, kind: 'dot', turn: 0, size: 0 },
];

/** Where each piece of the picture sits. Everything that matters ends above y 1580. */
const PIP = { width: 290, left: 636, top: 524 };
const CARD = { left: 100, top: 814, width: 880 };

function confetti(theme: OgTheme) {
  return CONFETTI.filter((piece) => piece.size > 0).map((piece, i) => {
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
  });
}

/**
 * The story frame: Pip standing on a little card that is half open. A tilted photo (only ever a
 * blurred wash of it) is tucked into the corner, the first words of the message fade out, and the
 * name of whoever made it signs it, so people can see something was made for this person and
 * want to know what it says. A button-shaped spot below is where the person lays Instagram's link
 * sticker. Without a peek (the person chose to hide it, or the card is locked) the card shows
 * only lines where the words would be.
 */
export function StoryFrameImage({ copy, theme, wash, peek }: Props) {
  const paper = '#FFFDF8';
  const bar = mix(theme.accent, '#ffffff', 0.7);
  const fades = peek && copy.excerpt !== null && copy.excerpt.endsWith('…');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: `linear-gradient(170deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`,
        fontFamily: 'sans-serif',
      }}
    >
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        {confetti(theme)}
      </svg>

      <div
        style={{
          position: 'absolute',
          top: 262,
          left: 0,
          width: 1080,
          display: 'flex',
          justifyContent: 'center',
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
          position: 'absolute',
          top: 318,
          left: 90,
          width: 900,
          display: 'flex',
          justifyContent: 'center',
          textAlign: 'center',
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

      {/* The little card. */}
      <div
        style={{
          position: 'absolute',
          left: CARD.left,
          top: CARD.top,
          width: CARD.width,
          display: 'flex',
          flexDirection: 'column',
          padding: '128px 60px 46px',
          background: paper,
          borderRadius: 44,
          boxShadow: '0 34px 64px rgba(42,34,32,0.2)',
          transform: 'rotate(-1.5deg)',
        }}
      >
        {peek && copy.excerpt !== null ? (
          <div style={{ display: 'flex', position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                width: 760,
                fontSize: 54,
                lineHeight: 1.25,
                color: theme.ink,
                ...heavy(theme.ink, 0.5),
              }}
            >
              {`\u201C${copy.excerpt}${fades ? '' : '\u201D'}`}
            </div>
            {fades ? (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 96,
                  display: 'flex',
                  background: `linear-gradient(to bottom, rgba(255,253,248,0) 0%, ${paper} 92%)`,
                }}
              />
            ) : null}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
            {[760, 700, 480].map((width, i) => (
              <div
                key={i}
                style={{ display: 'flex', width, height: 30, borderRadius: 15, background: bar, marginBottom: 30 }}
              />
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 22,
            fontSize: 40,
            color: theme.inkSoft,
          }}
        >
          {peek && copy.signature ? copy.signature : 'Just for me'}
        </div>
      </div>

      {/* A photo tucked into the corner: only ever a blurred wash of it. */}
      <div
        style={{
          position: 'absolute',
          left: 86,
          top: 572,
          display: 'flex',
          width: 276,
          height: 332,
          padding: '16px 16px 62px',
          background: '#fffdf8',
          borderRadius: 10,
          boxShadow: '0 22px 38px rgba(42,34,32,0.24)',
          transform: 'rotate(-8deg)',
        }}
      >
        {wash ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={wash} width={244} height={254} style={{ borderRadius: 4, objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              display: 'flex',
              width: 244,
              height: 254,
              borderRadius: 4,
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(160deg, ${mix(theme.accent, '#ffffff', 0.55)} 0%, ${mix(theme.accent, '#ffffff', 0.2)} 100%)`,
            }}
          >
            <svg width="96" height="96" viewBox="-12 -12 24 24">
              <path
                d="M0 8 C-12 -1 -9 -10 -3 -9 C-1 -9 0 -7 0 -6 C0 -7 1 -9 3 -9 C9 -10 12 -1 0 8Z"
                fill="#ffffff"
                opacity="0.9"
              />
            </svg>
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: 92,
            width: 98,
            height: 40,
            display: 'flex',
            background: 'rgba(255,203,77,0.78)',
            transform: 'rotate(4deg)',
          }}
        />
      </div>

      {/* Pip stands on the card. */}
      <svg
        width={PIP.width}
        height={Math.round(PIP.width * PIP_ASPECT)}
        viewBox={PIP_VIEW_BOX}
        style={{ position: 'absolute', left: PIP.left, top: PIP.top }}
      >
        {pipFigure({ mood: 'joy', mascot: theme.mascot, costume: theme.costume, uid: 'story' })}
      </svg>

      {copy.chips.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: 1334,
            left: 0,
            width: 1080,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {copy.chips.map((chip) => (
            <div
              key={chip}
              style={{
                display: 'flex',
                margin: '0 9px',
                padding: '12px 30px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.78)',
                border: `3px solid ${mix(theme.accentDeep, '#ffffff', 0.62)}`,
                fontSize: 34,
                color: theme.ink,
                ...heavy(theme.ink, 0.4),
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          top: 1432,
          left: 0,
          width: 1080,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
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
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1568,
          left: 0,
          width: 1080,
          display: 'flex',
          justifyContent: 'center',
          fontSize: 32,
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
