'use client';

import { useMemo, useState } from 'react';

type Props = {
  revealLine: string;
  onComplete: () => void;
};

const COUNT = 4;

export function BalloonPopScene({ revealLine, onComplete }: Props) {
  const [popped, setPopped] = useState<boolean[]>(() =>
    Array.from({ length: COUNT }, () => false),
  );
  const allPopped = useMemo(() => popped.every(Boolean), [popped]);

  return (
    <section className="story-balloons" aria-label="Pop the balloons">
      <h2 className="story-scene-title">Pop the balloons</h2>
      <div className="story-balloons__grid">
        {popped.map((isPopped, i) => (
          <button
            key={i}
            type="button"
            className={`story-balloon${isPopped ? ' is-popped' : ''}`}
            aria-label={isPopped ? 'Popped' : `Balloon ${i + 1}`}
            disabled={isPopped}
            onClick={() =>
              setPopped((prev) => prev.map((v, j) => (j === i ? true : v)))
            }
          />
        ))}
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
