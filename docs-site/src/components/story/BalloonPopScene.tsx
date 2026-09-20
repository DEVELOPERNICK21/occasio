'use client';

import { useId, useMemo, useState } from 'react';

type Props = {
  revealLine: string;
  onComplete: () => void;
};

const COUNT = 4;

/** Occasio cream/green palette — glossy party balloons, not flat pills. */
const BALLOONS = [
  { fill: '#2F5D50', highlight: '#7CB5A3', shadow: '#1A3A32' },
  { fill: '#C4A574', highlight: '#F0E2C4', shadow: '#8A6F3E' },
  { fill: '#5C8F7A', highlight: '#B8D9C8', shadow: '#2F5D50' },
  { fill: '#8B7355', highlight: '#D4C4A8', shadow: '#5C4A35' },
] as const;

function BalloonSvg({
  fill,
  highlight,
  shadow,
  uid,
}: {
  fill: string;
  highlight: string;
  shadow: string;
  uid: string;
}) {
  const gid = `balloon-grad-${uid}`;
  return (
    <svg
      className="story-balloon__svg"
      viewBox="0 0 80 120"
      width="100%"
      height="100%"
      aria-hidden
    >
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="45%" stopColor={fill} />
          <stop offset="100%" stopColor={shadow} />
        </radialGradient>
      </defs>
      {/* soft ground shadow */}
      <ellipse cx="40" cy="108" rx="18" ry="4" fill="#2A2220" opacity="0.12" />
      {/* balloon body */}
      <ellipse cx="40" cy="42" rx="30" ry="38" fill={`url(#${gid})`} />
      {/* gloss highlight */}
      <ellipse cx="28" cy="28" rx="9" ry="14" fill="#FFFFFF" opacity="0.42" />
      {/* knot */}
      <path d="M36 78 L40 86 L44 78 Z" fill={shadow} />
      {/* string */}
      <path
        d="M40 86 Q36 96 40 106 Q44 112 40 116"
        fill="none"
        stroke="#5C534A"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

export function BalloonPopScene({ revealLine, onComplete }: Props) {
  const reactId = useId().replace(/:/g, '');
  const [popped, setPopped] = useState<boolean[]>(() =>
    Array.from({ length: COUNT }, () => false),
  );
  const allPopped = useMemo(() => popped.every(Boolean), [popped]);

  return (
    <section className="story-balloons" aria-label="Pop the balloons">
      <h2 className="story-scene-title">Pop the balloons</h2>
      <div className="story-balloons__grid">
        {popped.map((isPopped, i) => {
          const palette = BALLOONS[i] ?? BALLOONS[0];
          return (
            <button
              key={i}
              type="button"
              className={`story-balloon${isPopped ? ' is-popped' : ''}`}
              aria-label={isPopped ? 'Popped' : `Balloon ${i + 1}`}
              disabled={isPopped}
              onClick={() =>
                setPopped((prev) => prev.map((v, j) => (j === i ? true : v)))
              }
            >
              <BalloonSvg
                fill={palette.fill}
                highlight={palette.highlight}
                shadow={palette.shadow}
                uid={`${reactId}-${i}`}
              />
            </button>
          );
        })}
      </div>
      {allPopped ? (
        <p className="story-reveal-line" role="status">
          {revealLine}
        </p>
      ) : (
        <p className="story-scene-sub">Tap each one</p>
      )}
      <button
        type="button"
        className="landing-btn-primary"
        disabled={!allPopped}
        onClick={onComplete}
      >
        Continue
      </button>
    </section>
  );
}
