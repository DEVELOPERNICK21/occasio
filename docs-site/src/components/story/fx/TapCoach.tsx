'use client';

import { useEffect, useState } from 'react';

type Props = {
  /** The target still wants a tap. */
  active: boolean;
  /** Bump on every tap so the idle timer starts over. */
  progress: number;
  /** Where the fingertip lands, relative to the positioned parent. */
  x?: string;
  y?: string;
};

const IDLE_MS = 4000;

/**
 * A hand that taps the target after a few idle seconds, for a recipient who has
 * not worked out the scene is interactive. Sits inside the target's positioned
 * box with `pointer-events: none`, so the real tap still reaches the target.
 */
export function TapCoach({ active, progress, x = '50%', y = '55%' }: Props) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(false);
    if (!active) return;
    const t = window.setTimeout(() => setShown(true), IDLE_MS);
    return () => window.clearTimeout(t);
  }, [active, progress]);

  if (!active || !shown) return null;

  return (
    <span className="tap-coach" style={{ left: x, top: y }} aria-hidden>
      <span className="tap-coach__ring" />
      <svg className="tap-coach__hand" viewBox="0 0 24 24" width="44" height="44">
        <path
          d="M10 9.5V4a2 2 0 0 0-4 0v10l-1.59-1.59a2 2 0 0 0-2.83 2.82l3.6 3.6C6.67 20.31 8.38 22 12 22h2a8 8 0 0 0 8-8v-3a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0v-.5a2 2 0 0 0-4 0Z"
          fill="var(--surface)"
          stroke="var(--ink)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M14 10v3M18 11v2M10 9.5V13"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
