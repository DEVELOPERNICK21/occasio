'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createCelebration, type Celebration, type Vec } from '@/lib/experience/celebrate';
import type { FxPreset } from '@/lib/experience/momentTheme';

export type CelebrationHandle = {
  /** With no origin: the full show. With an origin: a small local pop. */
  burst: (origin?: Vec, intensity?: number) => void;
};

type Props = {
  preset: FxPreset;
  colors: string[];
  /** Cover the viewport (fixed) or the nearest positioned parent (absolute). */
  fixed?: boolean;
  /** Play the full show once on mount. */
  autoBurst?: boolean;
  /** Delay before the auto burst, ms. */
  autoDelayMs?: number;
};

/**
 * One-shot celebration layer. It never loops: a new burst only happens when
 * the caller asks for one (a tap, a Replay button).
 */
export const CelebrationCanvas = forwardRef<CelebrationHandle, Props>(
  function CelebrationCanvas(
    { preset, colors, fixed = true, autoBurst = false, autoDelayMs = 250 },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Celebration | null>(null);
    const reduceRef = useRef(false);
    const presetRef = useRef(preset);
    const colorsRef = useRef(colors);
    presetRef.current = preset;
    colorsRef.current = colors;

    useImperativeHandle(ref, () => ({
      burst(origin, intensity) {
        if (reduceRef.current) return;
        engineRef.current?.burst(presetRef.current, colorsRef.current, origin, intensity);
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      reduceRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const engine = createCelebration(canvas);
      engineRef.current = engine;

      const observer = new ResizeObserver(() => engine.resize());
      observer.observe(canvas);

      let timer: number | undefined;
      if (autoBurst && !reduceRef.current) {
        timer = window.setTimeout(() => {
          engine.resize();
          engine.burst(presetRef.current, colorsRef.current);
        }, autoDelayMs);
      }

      return () => {
        if (timer) window.clearTimeout(timer);
        observer.disconnect();
        engine.destroy();
        engineRef.current = null;
      };
    }, [autoBurst, autoDelayMs]);

    return (
      <canvas
        ref={canvasRef}
        className={`celebration-canvas${fixed ? ' is-fixed' : ''}`}
        aria-hidden
      />
    );
  },
);
