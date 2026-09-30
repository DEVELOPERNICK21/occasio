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
import type { GiftController } from './buildGift';

export type GiftStageHandle = {
  shake: (level: number) => void;
  open: () => void;
};

type Props = {
  theme: MomentTheme;
  name: string;
  line: string;
  disabled: boolean;
  ariaLabel: string;
  onTap: (at: { x: number; y: number }) => void;
  onOpened: () => void;
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

/**
 * Real-time 3D gift box. three.js is imported lazily so no other scene pays
 * for it. Drag to turn the box, tap to shake it; on any failure the parent
 * falls back to the flat SVG gift.
 */
export const Gift3DStage = forwardRef<GiftStageHandle, Props>(function Gift3DStage(
  { theme, name, line, disabled, ariaLabel, onTap, onOpened, onFail },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<GiftController | null>(null);
  const [ready, setReady] = useState(false);
  const cb = useRef({ onOpened, onFail });
  cb.current = { onOpened, onFail };
  const drag = useRef<{ x: number; yaw: number; moved: boolean } | null>(null);
  const yaw = useRef(0);

  useImperativeHandle(ref, () => ({
    shake: (level) => ctrlRef.current?.shake(level),
    open: () => ctrlRef.current?.open(),
  }));

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (!webglAvailable()) {
      cb.current.onFail();
      return;
    }
    // A fresh canvas per run: a disposed WebGL context can never be reused.
    const canvas = document.createElement('canvas');
    canvas.className = 'gift3d__canvas';
    wrap.prepend(canvas);
    // If the GPU context is lost (backgrounded tab, memory pressure), fall back to the flat art.
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      cb.current.onFail();
    });

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    import('./buildGift')
      .then(({ createGift }) => {
        if (cancelled) return;
        try {
          const ctrl = createGift(canvas, {
            style: theme.gift,
            name,
            line,
            reducedMotion: reduced,
            onOpened: () => cb.current.onOpened(),
          });
          ctrlRef.current = ctrl;
          const fit = () => ctrl.resize(wrap.clientWidth, wrap.clientHeight);
          fit();
          observer = new ResizeObserver(fit);
          observer.observe(wrap);
          setReady(true);
        } catch {
          cb.current.onFail();
        }
      })
      .catch(() => cb.current.onFail());

    return () => {
      cancelled = true;
      observer?.disconnect();
      ctrlRef.current?.dispose();
      ctrlRef.current = null;
      canvas.remove();
      setReady(false);
    };
  }, [theme.gift, name, line]);

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
    // A drag turns the box back toward centre; only a real tap shakes it.
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
      className={`gift3d${ready ? ' is-ready' : ''}${disabled ? ' is-disabled' : ''}`}
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
      {!ready ? <span className="gift3d__loading">Wrapping your gift…</span> : null}
    </div>
  );
});
