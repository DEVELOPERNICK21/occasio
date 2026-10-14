'use client';

import { useId } from 'react';
import type { MomentTheme } from '@/lib/experience/momentTheme';
import { PIP_ASPECT, PIP_VIEW_BOX, pipFigure, type PipMood } from './pipParts';

export type { PipMood } from './pipParts';

type Props = {
  mood: PipMood;
  theme: MomentTheme;
  /** Rendered width in px; height follows the artwork's aspect ratio. */
  size?: number;
  /** Show the wrapped gift Pip hides behind its back (hopeful/wink). */
  holdsGift?: boolean;
  className?: string;
};

/**
 * Pip: Occasio's original mascot. Six moods, one costume per moment, and a few
 * gag props (tiny violin, steam) for the gate's escalating jokes. The drawing itself
 * lives in `pipParts.tsx`, shared with the picture people post to their story.
 */
export function Pip({ mood, theme, size = 220, holdsGift = false, className }: Props) {
  const uid = useId().replace(/:/g, '');

  return (
    <svg
      className={`pip${className ? ` ${className}` : ''}`}
      data-mood={mood}
      viewBox={PIP_VIEW_BOX}
      width={size}
      height={size * PIP_ASPECT}
      role="img"
      aria-label={`Pip looking ${mood}`}
    >
      {pipFigure({ mood, mascot: theme.mascot, costume: theme.costume, uid, holdsGift })}
    </svg>
  );
}
