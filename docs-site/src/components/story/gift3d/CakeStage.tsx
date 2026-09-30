'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { MomentTheme } from '@/lib/experience/momentTheme';
import type { CakeController } from './buildCake';

export type CakeStageHandle = {
  blow: (index: number) => void;
  cut: () => void;
  celebrate: (kind: 'out' | 'cut') => void;
};

type Props = {
  theme: MomentTheme;
  candles: number;
  disabled: boolean;
  ariaLabel: string;
  onTap: (at: { x: number; y: number }) => void;
  onFail: () => void;
};

const DRAG_THRESHOLD_PX = 7;

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Real-time 3D cake. Drag to turn it, tap to act; the parent falls back to the flat cake on failure. */
export const CakeStage = forwardRef<CakeStageHandle, Props>(function CakeStage(
  { theme, candles, disabled, ariaLabel, onTap, onFail },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<CakeController | null>(null);
  const [ready, setReady] = useState(false);
  const failRef = useRef(onFail);
  failRef.current = onFail;
  const drag = useRef<{ x: number; yaw: number; moved: boolean } | null>(null);
  const yaw = useRef(0);

  useImperativeHandle(ref, () => ({
    blow: (i) => ctrlRef.current?.blow(i),
    cut: () => ctrlRef.current?.cut(),
    celebrate: (kind) => ctrlRef.current?.celebrate(kind),
  }));

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (!webglAvailable()) {
      failRef.current();
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.className = 'gift3d__canvas';
    wrap.prepend(canvas);
    // If the GPU context is lost (backgrounded tab, memory pressure), fall back to the flat art.
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      failRef.current();
    });

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    import('./buildCake')
      .then(({ createCake }) => {
        if (cancelled) return;
        try {
          const ctrl = createCake(canvas, {
            style: theme.cake,
            glow: theme.gift.glow,
            candles,
            reducedMotion: reduced,
          });
          ctrlRef.current = ctrl;
          const fit = () => ctrl.resize(wrap.clientWidth, wrap.clientHeight);
          fit();
          observer = new ResizeObserver(fit);
          observer.observe(wrap);
          setReady(true);
        } catch {
          failRef.current();
        }
      })
      .catch(() => failRef.current());

    return () => {
      cancelled = true;
      observer?.disconnect();
      ctrlRef.current?.dispose();
      ctrlRef.current = null;
      canvas.remove();
      setReady(false);
    };
  }, [theme.cake, theme.gift.glow, candles]);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    drag.current = { x: e.clientX, yaw: yaw.current, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) d.moved = true;
    if (d.moved) {
      yaw.current = d.yaw + dx * 0.012;
      ctrlRef.current?.setYaw(yaw.current);
    }
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      yaw.current = 0;
      ctrlRef.current?.setYaw(0);
      return;
    }
    onTap({ x: e.clientX, y: e.clientY });
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const r = wrapRef.current?.getBoundingClientRect();
      onTap({ x: (r?.left ?? 0) + (r?.width ?? 0) / 2, y: (r?.top ?? 0) + (r?.height ?? 0) / 3 });
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`gift3d cake3d${ready ? ' is-ready' : ''}${disabled ? ' is-disabled' : ''}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onKeyDown={key}
    >
      {!ready ? <span className="gift3d__loading">Baking something sweet…</span> : null}
    </div>
  );
});
