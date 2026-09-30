'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { playGiftRattle, playGiftUnwrap } from '@/lib/experience/playBalloonPop';
import { storyCopyFor } from '@/lib/experience/storyCopy';

type Props = {
  templateType: string;
  recipientName: string;
  onComplete: () => void;
};

type Phase = 'wrapped' | 'opening' | 'open';

const SHAKES_TO_OPEN = 3;

const ROSES = [
  { cx: 94, cy: 100, r: 16, petal: '#F07A8C', deep: '#C94A5E' },
  { cx: 166, cy: 98, r: 16, petal: '#F7B2BE', deep: '#D98394' },
  { cx: 111, cy: 116, r: 19, petal: '#D7264A', deep: '#9E1433' },
  { cx: 150, cy: 114, r: 19, petal: '#E8455A', deep: '#B0233B' },
  { cx: 130, cy: 94, r: 21, petal: '#C6284A', deep: '#8A0F2A' },
];

const LEAVES = [
  { cx: 88, cy: 118, rot: -40 },
  { cx: 172, cy: 116, rot: 40 },
  { cx: 114, cy: 80, rot: -60 },
  { cx: 150, cy: 78, rot: 60 },
];

const BABY_BREATH = [
  [104, 80],
  [158, 80],
  [92, 110],
  [168, 108],
  [122, 76],
  [140, 74],
];

const PETALS = Array.from({ length: 14 }, (_, i) => ({
  dx: Math.round(Math.cos((i / 14) * Math.PI * 2) * (70 + (i % 3) * 26)),
  dy: Math.round(60 + (i % 4) * 30),
  rot: (i * 53) % 360,
  delay: (i % 5) * 0.06,
  color: i % 3 === 0 ? '#F7B2BE' : i % 3 === 1 ? '#E8455A' : '#F07A8C',
}));

const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return {
    dx: Math.round(Math.cos(a) * 110),
    dy: Math.round(Math.sin(a) * 90 - 50),
    delay: (i % 3) * 0.04,
  };
});

function Rose({ cx, cy, r, petal, deep }: (typeof ROSES)[number]) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={deep} />
      <path
        d={`M${cx - r} ${cy + r * 0.1} Q${cx - r * 0.9} ${cy - r * 0.9} ${cx} ${cy - r * 0.85} Q${cx + r * 0.9} ${cy - r * 0.9} ${cx + r} ${cy + r * 0.1} Q${cx} ${cy + r * 0.55} ${cx - r} ${cy + r * 0.1} Z`}
        fill={petal}
      />
      <ellipse cx={cx} cy={cy - r * 0.18} rx={r * 0.62} ry={r * 0.5} fill={deep} opacity="0.55" />
      <path
        d={`M${cx - r * 0.45} ${cy - r * 0.1} Q${cx - r * 0.4} ${cy - r * 0.6} ${cx + r * 0.1} ${cy - r * 0.55} Q${cx + r * 0.5} ${cy - r * 0.45} ${cx + r * 0.35} ${cy - r * 0.05} Q${cx + r * 0.1} ${cy + r * 0.2} ${cx - r * 0.15} ${cy - r * 0.05}`}
        fill="none"
        stroke={petal}
        strokeWidth={Math.max(1.4, r * 0.14)}
        strokeLinecap="round"
      />
      <path
        d={`M${cx - r * 0.7} ${cy + r * 0.35} Q${cx} ${cy + r * 0.8} ${cx + r * 0.7} ${cy + r * 0.35}`}
        fill="none"
        stroke={deep}
        strokeWidth="1.4"
        opacity="0.7"
      />
      <circle cx={cx - r * 0.35} cy={cy - r * 0.55} r={r * 0.14} fill="#fff" opacity="0.45" />
    </g>
  );
}

export function GiftScene({ templateType, recipientName, onComplete }: Props) {
  const uid = useId().replace(/:/g, '');
  const name = recipientName.trim() || 'you';
  const copy = storyCopyFor(templateType);
  const [phase, setPhase] = useState<Phase>('wrapped');
  const [shakes, setShakes] = useState(0);
  const timerRef = useRef<number | null>(null);
  const open = phase !== 'wrapped';

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const shake = useCallback(() => {
    if (phase !== 'wrapped') return;
    const next = shakes + 1;
    setShakes(next);
    if (next < SHAKES_TO_OPEN) {
      playGiftRattle();
      return;
    }
    playGiftUnwrap();
    setPhase('opening');
    timerRef.current = window.setTimeout(() => setPhase('open'), 950);
  }, [phase, shakes]);

  const remaining = SHAKES_TO_OPEN - shakes;

  return (
    <section
      className={`story-gift story-gift--${phase}`}
      aria-label={open ? `For ${name}` : `A gift for ${name}`}
    >
      <h2 className="story-scene-title">{copy.giftTitle(name, open)}</h2>
      <p className="story-scene-sub">{copy.giftSub(open)}</p>

      <button
        type="button"
        className={`story-gift-art${phase === 'wrapped' ? ' is-idle' : ''}${open ? ' is-open' : ''}`}
        onClick={shake}
        disabled={phase !== 'wrapped'}
        aria-label={
          phase === 'wrapped'
            ? `Shake the gift, ${remaining} more ${remaining === 1 ? 'tap' : 'taps'} to open`
            : 'Gift unwrapped'
        }
      >
        {phase === 'wrapped' ? <span className="story-gift-art__glow" aria-hidden /> : null}

        {open ? (
          <span className="story-burst story-burst--gift" aria-hidden>
            {SPARKS.map((s, i) => (
              <span
                key={`s${i}`}
                className="story-burst__piece story-burst__piece--spark"
                style={
                  {
                    '--dx': `${s.dx}px`,
                    '--dy': `${s.dy}px`,
                    '--rot': '0deg',
                    animationDelay: `${0.15 + s.delay}s`,
                  } as CSSProperties
                }
              />
            ))}
            {PETALS.map((p, i) => (
              <span
                key={`p${i}`}
                className="story-gift-art__petal"
                style={
                  {
                    '--dx': `${p.dx}px`,
                    '--dy': `${p.dy}px`,
                    '--rot': `${p.rot}deg`,
                    background: p.color,
                    animationDelay: `${0.3 + p.delay}s`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        ) : null}

        <span
          key={shakes}
          className={`story-gift-art__shaker${shakes > 0 && phase === 'wrapped' ? ` is-shaking-${shakes}` : ''}`}
        >
          <svg
            viewBox="0 62 260 262"
            width="240"
            height="242"
            className="story-gift-art__svg"
            aria-hidden
          >
            <defs>
              <linearGradient id={`box-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B7A" />
                <stop offset="55%" stopColor="#E8455A" />
                <stop offset="100%" stopColor="#C6284A" />
              </linearGradient>
              <linearGradient id={`lid-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF8A95" />
                <stop offset="100%" stopColor="#E8455A" />
              </linearGradient>
              <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF3B0" />
                <stop offset="40%" stopColor="#F6D35A" />
                <stop offset="100%" stopColor="#D4A02A" />
              </linearGradient>
              <linearGradient id={`gold-side-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#E8C84A" />
                <stop offset="100%" stopColor="#C49A28" />
              </linearGradient>
              <linearGradient id={`kraft-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#D9B88A" />
                <stop offset="50%" stopColor="#F0D9B5" />
                <stop offset="100%" stopColor="#CFAA78" />
              </linearGradient>
              <clipPath id={`inbox-${uid}`}>
                <rect x="-200" y="-400" width="660" height="700" />
              </clipPath>
              <filter id={`blur-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" />
              </filter>
            </defs>

            <ellipse
              cx="130"
              cy="312"
              rx="80"
              ry="11"
              fill="#2A2220"
              opacity="0.14"
              filter={`url(#blur-${uid})`}
            />

            <rect x="52" y="188" width="156" height="16" rx="5" fill="#8A1630" />

            {open ? (
              <g clipPath={`url(#inbox-${uid})`}>
              <g className="story-gift-art__bouquet">
                {[96, 112, 130, 148, 164].map((x) => (
                  <line key={x} x1={x} y1="104" x2="130" y2="250" stroke="#3E8E5A" strokeWidth="3" strokeLinecap="round" />
                ))}
                {LEAVES.map((l) => (
                  <ellipse
                    key={`${l.cx}-${l.cy}`}
                    cx={l.cx}
                    cy={l.cy}
                    rx="13"
                    ry="6"
                    fill="#3E9B63"
                    stroke="#2B6E45"
                    strokeWidth="1"
                    transform={`rotate(${l.rot} ${l.cx} ${l.cy})`}
                  />
                ))}
                <path d="M88 122 L130 252 L172 122 Q130 138 88 122 Z" fill={`url(#kraft-${uid})`} stroke="#B08A5A" strokeWidth="1.5" />
                <path d="M100 126 L130 236 L118 130 Z" fill="#F6E4C6" opacity="0.8" />
                {ROSES.map((r) => (
                  <Rose key={`${r.cx}-${r.cy}`} {...r} />
                ))}
                {BABY_BREATH.map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="#FFFFFF" stroke="#E8D9CF" strokeWidth="0.6" />
                ))}
                <rect x="104" y="150" width="52" height="9" rx="3" fill={`url(#gold-${uid})`} />
                <ellipse cx="120" cy="154" rx="9" ry="5" fill={`url(#gold-${uid})`} transform="rotate(-20 120 154)" />
                <ellipse cx="140" cy="154" rx="9" ry="5" fill={`url(#gold-side-${uid})`} transform="rotate(20 140 154)" />
                <line x1="146" y1="158" x2="170" y2="170" stroke="#B08A5A" strokeWidth="1" />
                <g transform="rotate(-8 190 176)">
                  <rect x="164" y="162" width="56" height="26" rx="5" fill="#FFFBF3" stroke="#E8D4A8" strokeWidth="1.2" />
                  <circle cx="170" cy="175" r="2" fill="#E8D4A8" />
                  <text
                    x="195"
                    y="179"
                    textAnchor="middle"
                    fill="#C73A66"
                    fontSize="11"
                    className="story-gift-art__note-text"
                  >
                    For {name.length > 9 ? `${name.slice(0, 8)}…` : name}
                  </text>
                </g>
              </g>
              </g>
            ) : null}

            <rect x="48" y="198" width="164" height="104" rx="16" fill={`url(#box-${uid})`} />
            <path d="M56 212 L68 206 L68 290 L56 284 Z" fill="#FFF0F3" opacity="0.28" />
            <rect x="112" y="198" width="36" height="104" fill={`url(#gold-${uid})`} />
            <rect x="118" y="198" width="8" height="104" fill="#FFF8DC" opacity="0.35" />

            <g className={`story-gift-art__lid${open ? ' is-open' : ''}`}>
              <rect x="40" y="176" width="180" height="34" rx="12" fill={`url(#lid-${uid})`} />
              <rect x="40" y="198" width="180" height="10" fill="#C6284A" opacity="0.55" />
              <rect x="112" y="176" width="36" height="34" fill={`url(#gold-${uid})`} />
              <ellipse cx="98" cy="162" rx="32" ry="18" fill={`url(#gold-${uid})`} transform="rotate(-18 98 162)" />
              <ellipse cx="162" cy="162" rx="32" ry="18" fill={`url(#gold-side-${uid})`} transform="rotate(18 162 162)" />
              <ellipse cx="92" cy="156" rx="11" ry="7" fill="#FFF8DC" opacity="0.55" transform="rotate(-18 92 156)" />
              <ellipse cx="130" cy="176" rx="14" ry="12" fill="#E8C84A" />
              <ellipse cx="128" cy="172" rx="5" ry="4" fill="#FFF8DC" opacity="0.6" />
              <path d="M118 184 L108 214 L122 202 Z" fill={`url(#gold-side-${uid})`} />
              <path d="M142 184 L152 214 L138 202 Z" fill={`url(#gold-${uid})`} />
            </g>
          </svg>
        </span>
      </button>

      <div className="story-hint-row" aria-live="polite">
        {phase === 'wrapped' ? (
          <span className="story-hint-chip">
            Shake it open
            <span className="story-hint-dots" aria-hidden>
              {Array.from({ length: SHAKES_TO_OPEN }, (_, i) => (
                <span key={i} className={i < shakes ? 'is-on' : undefined} />
              ))}
            </span>
          </span>
        ) : null}
      </div>

      <div className="story-cta">
        <button
          type="button"
          className="landing-btn-primary"
          disabled={phase !== 'open'}
          onClick={onComplete}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
