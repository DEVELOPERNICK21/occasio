'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { chunkRevealWords } from '@/lib/experience/chunkRevealWords';
import { playBalloonPop } from '@/lib/experience/playBalloonPop';

type Props = {
  revealLine: string;
  onComplete: () => void;
};

const COUNT = 4;

/** Warm emotional cartoon balloons — glossy, rounded, playful */
const BALLOONS = [
  { fill: '#E84B7A', highlight: '#FF9BB8', shadow: '#B8325A', string: '#C73A66' },
  { fill: '#F6D35A', highlight: '#FFF0A8', shadow: '#D4A82E', string: '#C49A28' },
  { fill: '#FF8A65', highlight: '#FFC4B0', shadow: '#E0563A', string: '#D45A3A' },
  { fill: '#F06292', highlight: '#FFB3D1', shadow: '#C2185B', string: '#AD1457' },
] as const;

function BalloonSvg({
  fill,
  highlight,
  shadow,
  string,
  uid,
}: {
  fill: string;
  highlight: string;
  shadow: string;
  string: string;
  uid: string;
}) {
  const gid = `balloon-grad-${uid}`;
  const gloss = `balloon-gloss-${uid}`;
  return (
    <svg
      className="story-balloon__svg"
      viewBox="0 0 90 130"
      width="100%"
      height="100%"
      aria-hidden
    >
      <defs>
        <radialGradient id={gid} cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="42%" stopColor={fill} />
          <stop offset="100%" stopColor={shadow} />
        </radialGradient>
        <linearGradient id={gloss} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="45" cy="118" rx="16" ry="4" fill="#2A2220" opacity="0.12" />
      <ellipse cx="45" cy="46" rx="32" ry="42" fill={`url(#${gid})`} />
      <ellipse
        cx="45"
        cy="46"
        rx="30"
        ry="40"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.2"
        strokeWidth="2"
      />
      <ellipse cx="32" cy="30" rx="10" ry="16" fill={`url(#${gloss})`} />
      <ellipse cx="30" cy="26" rx="4" ry="7" fill="#FFFFFF" opacity="0.55" />
      <path d="M40 86 L45 96 L50 86 Z" fill={shadow} />
      <ellipse cx="45" cy="86" rx="5" ry="3" fill={fill} />
      <path
        d="M45 96 Q38 104 45 110 Q52 116 45 122"
        fill="none"
        stroke={string}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

export function BalloonPopScene({ revealLine, onComplete }: Props) {
  const reactId = useId().replace(/:/g, '');
  const words = useMemo(
    () => chunkRevealWords(revealLine, COUNT),
    [revealLine],
  );
  const [popped, setPopped] = useState<boolean[]>(() =>
    Array.from({ length: COUNT }, () => false),
  );
  const [burstAt, setBurstAt] = useState<number | null>(null);

  const allPopped = useMemo(() => popped.every(Boolean), [popped]);
  const revealed = useMemo(
    () => words.filter((_, i) => popped[i]),
    [words, popped],
  );

  const popBalloon = useCallback(
    (index: number) => {
      if (popped[index]) return;
      playBalloonPop();
      setBurstAt(index);
      window.setTimeout(() => setBurstAt(null), 420);
      setPopped((prev) => prev.map((v, j) => (j === index ? true : v)));
    },
    [popped],
  );

  return (
    <section className="story-balloons" aria-label="Pop the balloons">
      <h2 className="story-scene-title">Pop the balloons</h2>
      <p className="story-scene-sub" aria-live="polite">
        {revealed.length === 0
          ? 'Tap each one — a little wish waits inside'
          : revealed.join(' ')}
      </p>

      <div className="story-balloons__grid">
        {popped.map((isPopped, i) => {
          const palette = BALLOONS[i] ?? BALLOONS[0]!;
          const word = words[i] ?? '';
          return (
            <button
              key={i}
              type="button"
              className={`story-balloon${isPopped ? ' is-popped' : ''}${burstAt === i ? ' is-bursting' : ''}`}
              aria-label={
                isPopped ? `Revealed: ${word}` : `Balloon — tap to reveal a word`
              }
              disabled={isPopped}
              onClick={() => popBalloon(i)}
            >
              {!isPopped ? (
                <BalloonSvg
                  fill={palette.fill}
                  highlight={palette.highlight}
                  shadow={palette.shadow}
                  string={palette.string}
                  uid={`${reactId}-${i}`}
                />
              ) : (
                <span className="story-balloon__word" role="status">
                  {word}
                </span>
              )}
              {burstAt === i ? (
                <span className="story-balloon__burst" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      {allPopped ? (
        <p className="story-reveal-line story-reveal-line--done" role="status">
          {revealLine}
        </p>
      ) : null}

      <div className="story-cta">
        <button
          type="button"
          className="landing-btn-primary"
          disabled={!allPopped}
          onClick={onComplete}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
