import { themeFor } from '../invitationTheme';
import type { Invitation } from '../invitation';
import { mix } from './ogTheme';
import { heavy } from './surpriseImage';
import type { Teaser } from './teaser';

/** One marigold: a plain function (not a component) because the renderer cannot nest components in an svg. */
export function marigold(x: number, y: number, colour: string, key: number) {
  return (
    <g key={key} transform={`translate(${x} ${y})`}>
      {Array.from({ length: 10 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-10" rx="5" ry="10" fill={colour} transform={`rotate(${i * 36})`} />
      ))}
      <circle r="6" fill="#c2570b" />
      <circle r="2.8" fill="#7a3205" />
    </g>
  );
}

function balloon(x: number, y: number, size: number, colour: string, key: number) {
  const h = size * 1.2;
  return (
    <g key={key} transform={`translate(${x} ${y})`}>
      <path d={`M0 ${h / 2} Q${size * 0.18} ${h * 0.95} ${-size * 0.08} ${h * 1.6}`} fill="none" stroke="#8a7a6a" strokeWidth="2" />
      <ellipse cx="0" cy="0" rx={size / 2} ry={h / 2} fill={colour} opacity="0.92" />
      <path d={`M-6 ${h / 2 - 2} L6 ${h / 2 - 2} L0 ${h / 2 + 10} Z`} fill={colour} />
      <ellipse cx={-size * 0.17} cy={-h * 0.2} rx={size * 0.09} ry={h * 0.15} fill="#ffffff" opacity="0.55" transform={`rotate(24 ${-size * 0.17} ${-h * 0.2})`} />
    </g>
  );
}

function confettiBit(x: number, y: number, colour: string, turn: number, key: number) {
  return <rect key={key} x={x} y={y} width="16" height="8" rx="3" fill={colour} transform={`rotate(${turn} ${x} ${y})`} />;
}

/** A leafy branch for the sage preview: leaves hung along a gentle curve from a corner. */
function branch(mirror: boolean, colours: string[]) {
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const t = (i + 1) / 10;
    const x = -10 + t * 300;
    const y = 8 + 70 * t * t;
    const side = i % 2 === 0 ? -1 : 1;
    return (
      <ellipse
        key={i}
        cx={x}
        cy={y}
        rx={26 - i * 1.4}
        ry={9 - i * 0.5}
        fill={colours[i % colours.length]}
        opacity="0.9"
        transform={`rotate(${40 * side + t * 40} ${x} ${y})`}
      />
    );
  });
  return (
    <g key={mirror ? 'r' : 'l'} transform={mirror ? 'translate(1200 0) scale(-1 1)' : 'translate(0 0)'}>
      <path d="M-10 8 Q 120 10 290 78" fill="none" stroke="#33493b" strokeWidth="2.4" />
      {leaves}
    </g>
  );
}

export const FLOWERS = Array.from({ length: 21 }, (_, i) => ({
  x: i * 60,
  // The string sags between every other flower, as a hung garland does.
  y: 38 + 20 * Math.sin((i / 20) * Math.PI * 5),
}));

const BALLOONS = [
  { x: 70, y: 150, size: 92, i: 0 },
  { x: 150, y: 96, size: 74, i: 1 },
  { x: 54, y: 330, size: 66, i: 2 },
  { x: 1130, y: 160, size: 92, i: 3 },
  { x: 1050, y: 100, size: 72, i: 4 },
  { x: 1148, y: 340, size: 66, i: 0 },
];

const BITS = [
  [300, 60, 20], [520, 40, -30], [760, 70, 40], [930, 40, -20], [240, 540, 30], [440, 580, -40],
  [700, 560, 20], [980, 540, -30], [120, 470, 60], [1080, 480, -50],
] as const;

type Props = {
  teaser: Teaser;
  invitation: Pick<Invitation, 'occasion' | 'design' | 'nameOne' | 'nameTwo'>;
};

/**
 * The link preview of an invitation: the host's own look (marigold garland for a ceremony,
 * balloons and confetti for a party), the names and the day. No photo and no venue; those are
 * for whoever opens it.
 */
export function InvitationImage({ teaser, invitation }: Props) {
  const theme = themeFor(invitation.occasion, invitation.design);
  const { palette, look } = theme;
  const regal = look === 'regal';
  const party = look === 'party';
  const sage = look === 'sage';
  const palace = look === 'palace';
  const names = invitation.nameTwo ? [invitation.nameOne, invitation.nameTwo] : [invitation.nameOne];
  // Size the names from how many letters they share the line with, so a short one is big and a long one fits.
  const letters = names.reduce((total, name) => total + Array.from(name).length, 0);
  const nameFont = Math.max(56, Math.min(120, Math.floor((names[1] ? 900 : 940) / (letters * 0.58))));

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: palette.bg,
        fontFamily: 'sans-serif',
      }}
    >
      {regal || sage ? (
        <div
          style={{
            position: 'absolute',
            left: 24,
            top: 24,
            right: 24,
            bottom: 24,
            display: 'flex',
            border: `3px solid ${palette.accent}`,
            borderRadius: sage ? 40 : 18,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            background: `linear-gradient(160deg, ${palette.bg} 0%, ${mix(palette.bg, palette.accentSoft, 0.7)} 100%)`,
          }}
        />
      )}

      {palace ? (
        <div
          style={{
            position: 'absolute',
            left: 330,
            top: 36,
            width: 540,
            height: 700,
            display: 'flex',
            border: `3px solid ${palette.accent}`,
            borderRadius: '270px 270px 0 0',
            boxShadow: `inset 0 0 0 10px ${palette.paper}, inset 0 0 0 12px ${palette.accentSoft}`,
          }}
        />
      ) : null}
      {palace ? (
        <svg width="1200" height="40" viewBox="0 0 1200 40" style={{ position: 'absolute', left: 0, top: 0 }}>
          {Array.from({ length: 28 }, (_, i) => (
            <circle key={i} cx={i * 44 + 22} cy={10} r={21} fill={mix(palette.accentSoft, palette.pop, 0.3)} />
          ))}
          <rect x="0" y="0" width="1200" height="10" fill={mix(palette.accentSoft, palette.pop, 0.3)} />
        </svg>
      ) : null}

      {regal ? (
        <svg width="1200" height="110" viewBox="0 0 1200 110" style={{ position: 'absolute', left: 0, top: 18 }}>
          <path
            d={FLOWERS.map((f, i) => `${i === 0 ? 'M' : 'L'}${f.x} ${f.y - 14}`).join(' ')}
            fill="none"
            stroke="#8a6b2f"
            strokeWidth="2"
          />
          {FLOWERS.map((f, i) => marigold(f.x, f.y, i % 2 === 0 ? palette.pop : '#f6b93b', i))}
        </svg>
      ) : null}
      {sage ? (
        <svg width="1200" height="160" viewBox="0 0 1200 160" style={{ position: 'absolute', left: 0, top: 0 }}>
          {branch(false, [palette.primary, palette.pop, palette.accentSoft])}
          {branch(true, [palette.primary, palette.pop, palette.accentSoft])}
        </svg>
      ) : null}
      {party ? (
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', left: 0, top: 0 }}>
          {BITS.map(([x, y, turn], i) => confettiBit(x, y, palette.confetti[i % palette.confetti.length]!, turn, i))}
          {BALLOONS.map((b, i) => balloon(b.x, b.y, b.size, palette.confetti[(b.i + i) % palette.confetti.length]!, i))}
        </svg>
      ) : null}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          paddingTop: regal || sage ? 70 : palace ? 96 : 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: '0.2em',
            color: regal ? palette.accent : palette.primary,
            ...heavy(regal ? palette.accent : palette.primary, 0.7),
          }}
        >
          {teaser.eyebrow}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '16px 0 0',
            fontSize: nameFont,
            lineHeight: 1.05,
            color: palette.primaryDeep,
            ...heavy(palette.primaryDeep, 3),
          }}
        >
          {names[0]}
          {names[1] ? (
            <span
              style={{
                display: 'flex',
                margin: '0 28px',
                fontSize: nameFont * 0.6,
                color: palette.pop,
                ...heavy(palette.pop, 2),
              }}
            >
              &amp;
            </span>
          ) : null}
          {names[1] ?? null}
        </div>
        <div style={{ display: 'flex', margin: '22px 0 0', fontSize: 34, color: palette.muted }}>{teaser.line}</div>
        <div
          style={{
            display: 'flex',
            margin: '34px 0 0',
            padding: '18px 44px',
            borderRadius: 999,
            background: palette.primary,
            color: '#ffffff',
            ...heavy('#ffffff', 0.7),
            fontSize: 30,
          }}
        >
          {teaser.cta}
        </div>
      </div>
    </div>
  );
}
