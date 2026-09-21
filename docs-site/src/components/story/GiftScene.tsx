'use client';

import { useCallback, useId, useState } from 'react';
import { playGiftUnwrap } from '@/lib/experience/playBalloonPop';
import { storyCopyFor } from '@/lib/experience/storyCopy';

type Props = {
  templateType: string;
  recipientName: string;
  onComplete: () => void;
};

type Phase = 'wrapped' | 'unwrapping' | 'open';

function SmallRose({
  cx,
  cy,
  r,
}: {
  cx: number;
  cy: number;
  r: number;
}) {
  return (
    <g>
      <ellipse
        cx={cx - r * 0.35}
        cy={cy}
        rx={r * 0.55}
        ry={r * 0.38}
        fill="#C6284A"
        transform={`rotate(-30 ${cx} ${cy})`}
      />
      <ellipse
        cx={cx + r * 0.35}
        cy={cy}
        rx={r * 0.55}
        ry={r * 0.38}
        fill="#E8455A"
        transform={`rotate(30 ${cx} ${cy})`}
      />
      <ellipse cx={cx} cy={cy - r * 0.22} rx={r * 0.45} ry={r * 0.34} fill="#F25C72" />
      <circle cx={cx} cy={cy} r={r * 0.28} fill="#FFE0E8" />
      <circle cx={cx - r * 0.08} cy={cy - r * 0.1} r={r * 0.1} fill="#fff" opacity="0.55" />
    </g>
  );
}

export function GiftScene({ templateType, recipientName, onComplete }: Props) {
  const uid = useId().replace(/:/g, '');
  const name = recipientName.trim() || 'you';
  const copy = storyCopyFor(templateType);
  const [phase, setPhase] = useState<Phase>('wrapped');
  const open = phase === 'unwrapping' || phase === 'open';

  const unwrap = useCallback(() => {
    if (phase !== 'wrapped') return;
    playGiftUnwrap();
    setPhase('unwrapping');
    window.setTimeout(() => setPhase('open'), 780);
  }, [phase]);

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
        onClick={unwrap}
        disabled={phase !== 'wrapped'}
        aria-label={phase === 'wrapped' ? 'Unwrap the gift' : 'Gift unwrapped'}
      >
        {phase === 'wrapped' ? (
          <span className="story-gift-art__glow" aria-hidden />
        ) : null}

        <svg
          viewBox="0 0 260 280"
          width="230"
          height="248"
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
            <filter id={`blur-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>

          <ellipse
            cx="130"
            cy="258"
            rx="78"
            ry="12"
            fill="#2A2220"
            opacity="0.14"
            filter={`url(#blur-${uid})`}
          />

          {/* box body — front view */}
          <rect
            x="48"
            y="128"
            width="164"
            height="118"
            rx="18"
            fill={`url(#box-${uid})`}
          />
          {/* left highlight */}
          <path
            d="M56 142 L68 136 L68 232 L56 226 Z"
            fill="#FFF0F3"
            opacity="0.28"
          />
          {/* vertical ribbon */}
          <rect
            x="112"
            y="128"
            width="36"
            height="118"
            fill={`url(#gold-${uid})`}
          />
          <rect
            x="118"
            y="128"
            width="8"
            height="118"
            fill="#FFF8DC"
            opacity="0.35"
          />

          {/* rising bouquet + note when open */}
          {open ? (
            <g className="story-gift-art__surprise">
              {/* small rose bouquet */}
              <g className="story-gift-art__mini-bouquet">
                <path
                  d="M98 118 L86 70 L174 70 L162 118 Z"
                  fill="#1A1A1A"
                />
                <path
                  d="M92 96 L84 58 L176 58 L168 96 Z"
                  fill="#2A2A2A"
                />
                <ellipse cx="108" cy="72" rx="10" ry="5" fill="#2F8A5F" transform="rotate(-35 108 72)" />
                <ellipse cx="152" cy="70" rx="10" ry="5" fill="#3D9B6E" transform="rotate(32 152 70)" />
                <SmallRose cx={118} cy={66} r={14} />
                <SmallRose cx={142} cy={64} r={15} />
                <SmallRose cx={130} cy={52} r={16} />
                <rect x="116" y="96" width="28" height="10" rx="3" fill="#E8455A" />
              </g>

              {/* message card rising from box */}
              <g className="story-gift-art__note">
                <rect
                  x="78"
                  y="108"
                  width="104"
                  height="52"
                  rx="8"
                  fill="#FFFBF3"
                  stroke="#E8D4A8"
                  strokeWidth="1.5"
                />
                <rect x="84" y="114" width="92" height="40" rx="5" fill="#FFF8EC" />
                <text
                  x="130"
                  y="132"
                  textAnchor="middle"
                  fill="#C73A66"
                  fontSize="13"
                  className="story-gift-art__note-text"
                >
                  For {name}
                </text>
                <text
                  x="130"
                  y="148"
                  textAnchor="middle"
                  fill="#857371"
                  fontSize="11"
                  fontFamily="var(--font-display-serif), Georgia, serif"
                  fontStyle="italic"
                >
                  With love
                </text>
              </g>
            </g>
          ) : null}

          {/* lid */}
          <g className={`story-gift-art__lid${open ? ' is-open' : ''}`}>
            <rect
              x="40"
              y="108"
              width="180"
              height="36"
              rx="12"
              fill={`url(#lid-${uid})`}
            />
            <rect
              x="40"
              y="132"
              width="180"
              height="10"
              fill="#C6284A"
              opacity="0.55"
            />
            {/* lid ribbon */}
            <rect
              x="112"
              y="108"
              width="36"
              height="36"
              fill={`url(#gold-${uid})`}
            />
            {/* bow loops */}
            <ellipse
              cx="96"
              cy="96"
              rx="34"
              ry="20"
              fill={`url(#gold-${uid})`}
              transform="rotate(-18 96 96)"
            />
            <ellipse
              cx="164"
              cy="96"
              rx="34"
              ry="20"
              fill={`url(#gold-side-${uid})`}
              transform="rotate(18 164 96)"
            />
            <ellipse
              cx="90"
              cy="90"
              rx="12"
              ry="8"
              fill="#FFF8DC"
              opacity="0.55"
              transform="rotate(-18 90 90)"
            />
            {/* knot */}
            <ellipse cx="130" cy="108" rx="14" ry="12" fill="#E8C84A" />
            <ellipse cx="128" cy="104" rx="5" ry="4" fill="#FFF8DC" opacity="0.6" />
            {/* tails */}
            <path
              d="M118 116 L108 148 L122 136 Z"
              fill={`url(#gold-side-${uid})`}
            />
            <path
              d="M142 116 L152 148 L138 136 Z"
              fill={`url(#gold-${uid})`}
            />
          </g>
        </svg>
      </button>

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
