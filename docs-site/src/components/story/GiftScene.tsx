'use client';

import { useCallback, useId, useState } from 'react';
import { playGiftUnwrap } from '@/lib/experience/playBalloonPop';

type Props = {
  templateType: string;
  recipientName: string;
  onComplete: () => void;
};

type Phase = 'wrapped' | 'unwrapping' | 'open';

const SPARKS = Array.from({ length: 12 }, (_, i) => i);

function giftCopy(
  name: string,
  phase: Phase,
): { title: string; subtitle: string } {
  if (phase === 'open') {
    return {
      title: `For ${name}`,
      subtitle: 'A little joy, just for you',
    };
  }
  return {
    title: `A gift for ${name}`,
    subtitle: 'Tap to unwrap something sweet',
  };
}

export function GiftScene({ recipientName, onComplete }: Props) {
  const uid = useId().replace(/:/g, '');
  const name = recipientName.trim() || 'you';
  const [phase, setPhase] = useState<Phase>('wrapped');
  const copy = giftCopy(name, phase);
  const open = phase === 'unwrapping' || phase === 'open';

  const unwrap = useCallback(() => {
    if (phase !== 'wrapped') return;
    playGiftUnwrap();
    setPhase('unwrapping');
    window.setTimeout(() => setPhase('open'), 900);
  }, [phase]);

  const pinkTop = `gift-pink-top-${uid}`;
  const pinkLeft = `gift-pink-left-${uid}`;
  const pinkRight = `gift-pink-right-${uid}`;
  const gold = `gift-gold-${uid}`;
  const goldDark = `gift-gold-dark-${uid}`;
  const bow = `gift-bow-${uid}`;
  const gloss = `gift-gloss-${uid}`;
  const paper = `gift-paper-${uid}`;

  return (
    <section
      className={`story-gift story-gift--${phase}`}
      aria-label={copy.title}
    >
      <h2 className="story-scene-title">{copy.title}</h2>
      <p className="story-scene-sub">{copy.subtitle}</p>

      <button
        type="button"
        className={`story-gift-art${phase === 'wrapped' ? ' is-idle' : ''}${open ? ' is-open' : ''}`}
        onClick={unwrap}
        disabled={phase !== 'wrapped'}
        aria-label={phase === 'wrapped' ? 'Unwrap the gift' : 'Gift unwrapped'}
      >
        {phase === 'wrapped' ? (
          <span className="story-gift-art__glow" aria-hidden />
        ) : null}

        {open ? (
          <span className="story-gift-art__sparks" aria-hidden>
            {SPARKS.map((i) => (
              <span
                key={i}
                className="story-gift-art__spark"
                style={{
                  ['--spark-i' as string]: i,
                  left: `${18 + (i % 6) * 12}%`,
                  top: `${28 + Math.floor(i / 6) * 18}%`,
                }}
              />
            ))}
          </span>
        ) : null}

        <svg
          viewBox="0 0 280 280"
          width="248"
          height="248"
          className="story-gift-art__svg"
          aria-hidden
        >
          <defs>
            <linearGradient id={pinkTop} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFA3C0" />
              <stop offset="40%" stopColor="#F25C88" />
              <stop offset="100%" stopColor="#D63A68" />
            </linearGradient>
            <linearGradient id={pinkLeft} x1="20%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C73A66" />
              <stop offset="100%" stopColor="#8E2448" />
            </linearGradient>
            <linearGradient id={pinkRight} x1="0%" y1="0%" x2="40%" y2="100%">
              <stop offset="0%" stopColor="#F06A90" />
              <stop offset="100%" stopColor="#B8325A" />
            </linearGradient>
            <linearGradient id={gold} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF8DC" />
              <stop offset="35%" stopColor="#F5D76E" />
              <stop offset="100%" stopColor="#C9A22E" />
            </linearGradient>
            <linearGradient id={goldDark} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EED67A" />
              <stop offset="100%" stopColor="#A88420" />
            </linearGradient>
            <radialGradient id={bow} cx="32%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#FFF8DC" />
              <stop offset="40%" stopColor="#F2D96A" />
              <stop offset="100%" stopColor="#B89428" />
            </radialGradient>
            <linearGradient id={gloss} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <pattern
              id={paper}
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(18)"
            >
              <rect width="12" height="12" fill="transparent" />
              <circle cx="1" cy="1" r="0.7" fill="#FFFFFF" opacity="0.12" />
            </pattern>
            <filter id={`gift-blur-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          <ellipse
            cx="140"
            cy="246"
            rx="86"
            ry="16"
            fill="#2A2220"
            opacity="0.18"
            filter={`url(#gift-blur-${uid})`}
          />

          {/* box body */}
          <path
            d="M55 128 L140 172 L225 128 L225 192 L140 244 L55 192 Z"
            fill={`url(#${pinkRight})`}
          />
          <path
            d="M55 128 L140 172 L140 244 L55 192 Z"
            fill={`url(#${pinkLeft})`}
          />
          <path
            d="M140 172 L225 128 L225 192 L140 244 Z"
            fill="#E84B7A"
          />
          <path
            d="M55 128 L140 172 L225 128 L140 172 Z"
            fill="transparent"
          />
          {/* paper grain */}
          <path
            d="M55 128 L140 172 L140 244 L55 192 Z"
            fill={`url(#${paper})`}
          />
          <path
            d="M140 172 L225 128 L225 192 L140 244 Z"
            fill={`url(#${paper})`}
          />
          <path
            d="M150 176 L215 140 L215 182 L150 220 Z"
            fill={`url(#${gloss})`}
            opacity="0.65"
          />

          {/* lid */}
          <g className={`story-gift-art__lid${open ? ' is-open' : ''}`}>
            <path
              d="M42 120 L140 68 L238 120 L140 170 Z"
              fill={`url(#${pinkTop})`}
            />
            <path
              d="M42 120 L140 170 L140 186 L42 136 Z"
              fill={`url(#${pinkLeft})`}
            />
            <path
              d="M238 120 L140 170 L140 186 L238 136 Z"
              fill={`url(#${pinkRight})`}
            />
            <path
              d="M70 116 L140 80 L168 96 L98 132 Z"
              fill={`url(#${gloss})`}
              opacity="0.55"
            />
            <path d="M42 120 L140 170 L238 120" fill="none" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />

            {/* ribbons on lid */}
            <path
              d="M124 82 L156 98 L156 156 L124 140 Z"
              fill={`url(#${gold})`}
            />
            <path
              d="M126 84 L140 92 L140 150 L126 142 Z"
              fill="#FFF8DC"
              opacity="0.4"
            />
            <path
              d="M74 120 L206 120 L214 128 L82 142 Z"
              fill={`url(#${goldDark})`}
            />
            <path
              d="M80 122 L204 122 L208 126 L84 136 Z"
              fill="#FFF8DC"
              opacity="0.3"
            />

            {/* bow loops */}
            <ellipse
              cx="98"
              cy="102"
              rx="38"
              ry="24"
              fill={`url(#${bow})`}
              transform="rotate(-34 98 102)"
            />
            <ellipse
              cx="106"
              cy="104"
              rx="18"
              ry="12"
              fill="#A88420"
              opacity="0.4"
              transform="rotate(-34 106 104)"
            />
            <ellipse
              cx="88"
              cy="94"
              rx="14"
              ry="9"
              fill="#FFF8DC"
              opacity="0.55"
              transform="rotate(-34 88 94)"
            />
            <ellipse
              cx="182"
              cy="102"
              rx="38"
              ry="24"
              fill={`url(#${bow})`}
              transform="rotate(34 182 102)"
            />
            <ellipse
              cx="174"
              cy="104"
              rx="18"
              ry="12"
              fill="#A88420"
              opacity="0.38"
              transform="rotate(34 174 104)"
            />
            <ellipse
              cx="192"
              cy="94"
              rx="12"
              ry="8"
              fill="#FFF8DC"
              opacity="0.4"
              transform="rotate(34 192 94)"
            />
            <ellipse cx="140" cy="116" rx="18" ry="15" fill={`url(#${bow})`} />
            <ellipse cx="140" cy="113" rx="9" ry="7" fill="#FFF8DC" opacity="0.55" />
            <path
              d="M126 128 Q118 152 108 168 Q128 154 132 132 Z"
              fill={`url(#${goldDark})`}
            />
            <path
              d="M154 128 Q162 152 172 168 Q152 154 148 132 Z"
              fill={`url(#${gold})`}
            />
          </g>

          {/* body ribbons */}
          <path
            d="M124 144 L156 160 L156 228 L124 212 Z"
            fill={`url(#${gold})`}
          />
          <path
            d="M126 146 L140 154 L140 222 L126 214 Z"
            fill="#FFF8DC"
            opacity="0.35"
          />
          <path
            d="M66 162 L214 162 L222 170 L74 184 Z"
            fill={`url(#${goldDark})`}
          />
          <path
            d="M72 164 L216 164 L218 167 L74 176 Z"
            fill="#FFF8DC"
            opacity="0.28"
          />

          {/* shimmer sweep while wrapped */}
          {!open ? (
            <rect
              className="story-gift-art__shimmer"
              x="40"
              y="70"
              width="40"
              height="160"
              fill={`url(#${gloss})`}
              opacity="0.35"
            />
          ) : null}

          {open ? (
            <g className="story-gift-art__tissue">
              <path
                d="M108 148 C76 114 58 96 80 76 C110 92 124 122 130 148 Z"
                fill="#FFF8EC"
              />
              <path
                d="M172 150 C208 114 224 94 200 74 C168 90 154 124 152 148 Z"
                fill="#FFE8F0"
              />
              <path
                d="M128 146 C116 112 120 90 140 78 C160 90 164 118 152 146 Z"
                fill="#FFF0D8"
              />
            </g>
          ) : null}

          {phase === 'open' ? (
            <g className="story-gift-art__note">
              <rect
                x="98"
                y="172"
                width="84"
                height="40"
                rx="7"
                fill="#FFFBF3"
                stroke="#E8D4A8"
                strokeWidth="1.5"
              />
              <text
                x="140"
                y="197"
                textAnchor="middle"
                fill="#C73A66"
                fontSize="16"
                className="story-gift-art__note-text"
              >
                With love
              </text>
            </g>
          ) : null}
        </svg>
      </button>

      <button
        type="button"
        className="landing-btn-primary"
        disabled={phase !== 'open'}
        onClick={onComplete}
      >
        Continue
      </button>
    </section>
  );
}
