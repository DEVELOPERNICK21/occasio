'use client';

import { useCallback, useId, useState } from 'react';
import { playGiftUnwrap } from '@/lib/experience/playBalloonPop';

type Props = {
  templateType: string;
  recipientName: string;
  onComplete: () => void;
};

type Phase = 'wrapped' | 'unwrapping' | 'open';

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
    window.setTimeout(() => setPhase('open'), 780);
  }, [phase]);

  const pinkTop = `gift-pink-top-${uid}`;
  const pinkLeft = `gift-pink-left-${uid}`;
  const pinkRight = `gift-pink-right-${uid}`;
  const gold = `gift-gold-${uid}`;
  const goldDark = `gift-gold-dark-${uid}`;
  const bow = `gift-bow-${uid}`;
  const gloss = `gift-gloss-${uid}`;

  return (
    <section
      className={`story-gift story-gift--${phase}`}
      aria-label={copy.title}
    >
      <h2 className="story-scene-title">{copy.title}</h2>
      <p className="story-scene-sub">{copy.subtitle}</p>

      <button
        type="button"
        className="story-gift-art"
        onClick={unwrap}
        disabled={phase !== 'wrapped'}
        aria-label={phase === 'wrapped' ? 'Unwrap the gift' : 'Gift unwrapped'}
      >
        <svg
          viewBox="0 0 260 260"
          width="240"
          height="240"
          className="story-gift-art__svg"
          aria-hidden
        >
          <defs>
            <linearGradient id={pinkTop} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8AAD" />
              <stop offset="45%" stopColor="#F25C88" />
              <stop offset="100%" stopColor="#E84570" />
            </linearGradient>
            <linearGradient id={pinkLeft} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D6456A" />
              <stop offset="100%" stopColor="#A82E4E" />
            </linearGradient>
            <linearGradient id={pinkRight} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F06A90" />
              <stop offset="100%" stopColor="#C73A66" />
            </linearGradient>
            <linearGradient id={gold} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF6D0" />
              <stop offset="40%" stopColor="#F2D96A" />
              <stop offset="100%" stopColor="#D4B03A" />
            </linearGradient>
            <linearGradient id={goldDark} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8C84A" />
              <stop offset="100%" stopColor="#B89428" />
            </linearGradient>
            <radialGradient id={bow} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF8DC" />
              <stop offset="45%" stopColor="#F2D96A" />
              <stop offset="100%" stopColor="#C9A22E" />
            </radialGradient>
            <linearGradient id={gloss} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <filter id={`gift-soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
          </defs>

          {/* floor contact shadow */}
          <ellipse
            cx="130"
            cy="228"
            rx="78"
            ry="14"
            fill="#2A2220"
            opacity="0.16"
            filter={`url(#gift-soft-${uid})`}
          />

          {/* box body — isometric */}
          <path
            d="M52 118 L130 158 L208 118 L208 178 L130 224 L52 178 Z"
            fill={`url(#${pinkRight})`}
          />
          <path
            d="M52 118 L130 158 L130 224 L52 178 Z"
            fill={`url(#${pinkLeft})`}
          />
          <path
            d="M130 158 L208 118 L208 178 L130 224 Z"
            fill="#E84B7A"
          />
          {/* subtle paper sheen on right face */}
          <path
            d="M140 162 L200 130 L200 170 L140 204 Z"
            fill={`url(#${gloss})`}
            opacity="0.55"
          />

          {/* lid group */}
          <g className={`story-gift-art__lid${open ? ' is-open' : ''}`}>
            {/* lid overhang sides */}
            <path
              d="M42 112 L130 66 L218 112 L130 156 Z"
              fill={`url(#${pinkTop})`}
            />
            <path
              d="M42 112 L130 156 L130 170 L42 126 Z"
              fill={`url(#${pinkLeft})`}
            />
            <path
              d="M218 112 L130 156 L130 170 L218 126 Z"
              fill={`url(#${pinkRight})`}
            />
            {/* lid top gloss */}
            <path
              d="M70 108 L130 78 L160 94 L100 124 Z"
              fill={`url(#${gloss})`}
              opacity="0.5"
            />

            {/* satin ribbon on lid — vertical */}
            <path
              d="M116 78 L144 92 L144 142 L116 128 Z"
              fill={`url(#${gold})`}
            />
            <path
              d="M118 80 L130 86 L130 136 L118 130 Z"
              fill="#FFF8DC"
              opacity="0.35"
            />
            {/* horizontal ribbon */}
            <path
              d="M72 112 L188 112 L196 120 L80 132 Z"
              fill={`url(#${goldDark})`}
            />
            <path
              d="M78 114 L186 114 L190 118 L82 126 Z"
              fill="#FFF6D0"
              opacity="0.28"
            />

            {/* bow — left loop */}
            <ellipse
              cx="92"
              cy="96"
              rx="34"
              ry="22"
              fill={`url(#${bow})`}
              transform="rotate(-32 92 96)"
            />
            <ellipse
              cx="98"
              cy="98"
              rx="16"
              ry="11"
              fill="#C9A22E"
              opacity="0.45"
              transform="rotate(-32 98 98)"
            />
            <ellipse
              cx="84"
              cy="90"
              rx="12"
              ry="8"
              fill="#FFF8DC"
              opacity="0.55"
              transform="rotate(-32 84 90)"
            />

            {/* bow — right loop */}
            <ellipse
              cx="168"
              cy="96"
              rx="34"
              ry="22"
              fill={`url(#${bow})`}
              transform="rotate(32 168 96)"
            />
            <ellipse
              cx="162"
              cy="98"
              rx="16"
              ry="11"
              fill="#B89428"
              opacity="0.4"
              transform="rotate(32 162 98)"
            />
            <ellipse
              cx="176"
              cy="90"
              rx="10"
              ry="7"
              fill="#FFF8DC"
              opacity="0.4"
              transform="rotate(32 176 90)"
            />

            {/* center knot */}
            <ellipse cx="130" cy="108" rx="16" ry="14" fill={`url(#${bow})`} />
            <ellipse cx="130" cy="106" rx="8" ry="6" fill="#FFF8DC" opacity="0.5" />
            {/* ribbon tails */}
            <path
              d="M118 118 Q112 138 104 152 Q120 140 124 122 Z"
              fill={`url(#${goldDark})`}
            />
            <path
              d="M142 118 Q148 138 156 152 Q140 140 136 122 Z"
              fill={`url(#${gold})`}
            />
          </g>

          {/* body ribbons under lid lip */}
          <path
            d="M116 132 L144 146 L144 206 L116 192 Z"
            fill={`url(#${gold})`}
          />
          <path
            d="M118 134 L130 140 L130 200 L118 194 Z"
            fill="#FFF8DC"
            opacity="0.3"
          />
          <path
            d="M64 148 L196 148 L204 156 L72 168 Z"
            fill={`url(#${goldDark})`}
          />
          <path
            d="M70 150 L198 150 L200 153 L72 162 Z"
            fill="#FFF6D0"
            opacity="0.25"
          />

          {/* tissue when opening */}
          {open ? (
            <g className="story-gift-art__tissue">
              <path
                d="M100 138 C72 108 58 92 78 74 C104 88 116 114 122 138 Z"
                fill="#FFF8EC"
              />
              <path
                d="M160 140 C192 108 206 90 186 72 C160 86 148 116 146 138 Z"
                fill="#FFE8F0"
              />
              <path
                d="M118 136 C108 108 112 88 130 78 C148 88 152 112 142 136 Z"
                fill="#FFF0D8"
              />
            </g>
          ) : null}

          {phase === 'open' ? (
            <g className="story-gift-art__note">
              <rect
                x="92"
                y="158"
                width="76"
                height="36"
                rx="6"
                fill="#FFFBF3"
                stroke="#E8D4A8"
                strokeWidth="1.5"
              />
              <rect
                x="96"
                y="162"
                width="68"
                height="28"
                rx="4"
                fill="#FFF8EC"
              />
              <text
                x="130"
                y="181"
                textAnchor="middle"
                fill="#C73A66"
                fontSize="15"
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
