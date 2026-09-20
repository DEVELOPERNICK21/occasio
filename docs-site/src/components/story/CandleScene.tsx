'use client';

import { useCallback, useState } from 'react';
import { playCandleBlow } from '@/lib/experience/playBalloonPop';

type Props = {
  recipientName: string;
  onComplete: () => void;
};

const AIR_STREAKS = Array.from({ length: 14 }, (_, i) => i);

export function CandleScene({ recipientName, onComplete }: Props) {
  const name = recipientName.trim() || 'you';
  const [lit, setLit] = useState(true);
  const [blowing, setBlowing] = useState(false);
  const [smoke, setSmoke] = useState(false);

  const blowOut = useCallback(() => {
    if (!lit || blowing) return;
    playCandleBlow();
    setBlowing(true);
    window.setTimeout(() => {
      setLit(false);
      setSmoke(true);
    }, 300);
    window.setTimeout(() => setBlowing(false), 900);
    window.setTimeout(() => setSmoke(false), 1400);
  }, [lit, blowing]);

  return (
    <section
      className={`story-candle${blowing ? ' is-blowing' : ''}${!lit ? ' is-out' : ''}`}
      aria-label="Blow the candle"
    >
      <h2 className="story-scene-title">Blow the candle, {name}</h2>
      <p className="story-scene-sub">
        {lit ? 'Make a wish, then tap the cake' : 'Wish made — beautifully'}
      </p>

      {blowing ? (
        <div className="story-air" aria-hidden>
          {AIR_STREAKS.map((i) => (
            <span
              key={i}
              className="story-air__streak"
              style={{
                top: `${12 + (i % 7) * 11}%`,
                animationDelay: `${i * 0.03}s`,
                opacity: 0.25 + (i % 4) * 0.1,
              }}
            />
          ))}
          <div className="story-air__haze" />
        </div>
      ) : null}

      <button
        type="button"
        className={`story-cake-art${lit ? ' is-lit' : ' is-out'}${blowing ? ' is-blowing' : ''}`}
        onClick={blowOut}
        aria-label={lit ? 'Blow out the candle' : 'Candle is out'}
        disabled={!lit}
      >
        {/* Flat sticker cake — yellow / pink like reference */}
        <svg
          viewBox="0 0 240 220"
          width="220"
          height="200"
          className="story-cake-art__svg"
          aria-hidden
        >
          {/* plate */}
          <rect
            x="36"
            y="192"
            width="168"
            height="12"
            rx="5"
            fill="#F0C94A"
            stroke="#1A1A1A"
            strokeWidth="3.5"
          />

          {/* bottom tier — pink + LOVE */}
          <rect
            x="36"
            y="128"
            width="168"
            height="66"
            rx="12"
            fill="#F25C88"
            stroke="#1A1A1A"
            strokeWidth="3.5"
          />
          {/* left highlight strip */}
          <path
            d="M42 140 L52 136 L52 186 L42 182 Z"
            fill="#FF8AAD"
            opacity="0.85"
          />
          <text
            x="120"
            y="170"
            textAnchor="middle"
            fill="#1A1A1A"
            fontSize="26"
            className="story-cake-art__label"
          >
            LOVE
          </text>

          {/* top tier — yellow + WISH */}
          <rect
            x="60"
            y="78"
            width="120"
            height="52"
            rx="12"
            fill="#F6D35A"
            stroke="#1A1A1A"
            strokeWidth="3.5"
          />
          <path
            d="M66 90 L74 86 L74 122 L66 118 Z"
            fill="#FFF0A0"
            opacity="0.9"
          />
          <text
            x="120"
            y="112"
            textAnchor="middle"
            fill="#1A1A1A"
            fontSize="22"
            className="story-cake-art__label"
          >
            WISH
          </text>

          {/* leaves behind cherries */}
          <ellipse
            cx="112"
            cy="58"
            rx="14"
            ry="7"
            fill="#7CBC6E"
            stroke="#1A1A1A"
            strokeWidth="2.5"
            transform="rotate(-28 112 58)"
          />
          <ellipse
            cx="128"
            cy="60"
            rx="12"
            ry="6"
            fill="#5FA85A"
            stroke="#1A1A1A"
            strokeWidth="2.5"
            transform="rotate(32 128 60)"
          />

          {/* cherries / ornaments */}
          <circle
            cx="96"
            cy="66"
            r="14"
            fill="#E8455A"
            stroke="#1A1A1A"
            strokeWidth="3"
          />
          <path
            d="M90 60 Q94 56 98 62"
            fill="none"
            stroke="#FFF0F3"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle
            cx="144"
            cy="64"
            r="14"
            fill="#E8455A"
            stroke="#1A1A1A"
            strokeWidth="3"
          />
          <path
            d="M138 58 Q142 54 146 60"
            fill="none"
            stroke="#FFF0F3"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* stems / loops */}
          <path
            d="M96 52 Q100 42 108 48"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M144 50 Q140 40 132 46"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* candle between cherries */}
          <rect
            x="114"
            y="32"
            width="12"
            height="34"
            rx="3"
            fill="#FFF8E8"
            stroke="#1A1A1A"
            strokeWidth="2.8"
          />
          <line
            x1="120"
            y1="26"
            x2="120"
            y2="32"
            stroke="#1A1A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {lit ? (
            <g className={`story-cake-art__flame${blowing ? ' is-leaning' : ''}`}>
              <ellipse cx="120" cy="16" rx="9" ry="14" fill="#FF9F43" />
              <ellipse cx="120" cy="18" rx="4" ry="7" fill="#FFEAA7" />
            </g>
          ) : null}

          {smoke ? (
            <g className="story-cake-art__smoke" opacity="0.5">
              <path
                d="M120 28 Q114 16 118 4"
                fill="none"
                stroke="#888"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M124 28 Q130 16 126 4"
                fill="none"
                stroke="#aaa"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          ) : null}
        </svg>
      </button>

      <div className="story-cta">
        <button
          type="button"
          className="landing-btn-primary"
          disabled={lit}
          onClick={onComplete}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
