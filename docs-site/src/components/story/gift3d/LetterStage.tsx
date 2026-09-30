'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { MomentTheme } from '@/lib/experience/momentTheme';
import type { LetterController } from './buildLetter';

export type LetterStageHandle = {
  skip: () => void;
};

export type LetterContent = {
  greeting: string;
  body: string;
  signoff: string;
  /** Optional photo taped to the letter. Must allow cross-origin canvas use, or it is skipped. */
  photoUrl?: string | null;
};

type Props = {
  theme: MomentTheme;
  content: LetterContent;
  ariaLabel: string;
  onSealBroken: () => void;
  onUnfolded: () => void;
  onWritten: () => void;
  onFail: () => void;
};

const HOLD_SECONDS = 0.85;
const DRAG_PX = 10;

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Resolve the site's handwriting font to a concrete family name the canvas can use. */
async function handwritingFamily(): Promise<string> {
  const probe = document.createElement('span');
  probe.style.fontFamily = 'var(--font-hand), cursive';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.textContent = 'Aa';
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily || 'cursive';
  probe.remove();
  try {
    await document.fonts.load(`46px ${family}`);
  } catch {
    // the fallback face is fine
  }
  return family;
}

/** Load a photo for the letter; resolves null on any failure so it can never block opening. */
function loadPhoto(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    // Anonymous CORS: a photo without the right headers fails to load (skipped)
    // instead of tainting the canvas and breaking the whole 3D scene.
    img.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => resolve(null), 2500);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * The wax-sealed envelope. Press and hold the seal to break it; the envelope
 * opens and the letter unfolds. Keyboard users press Enter or Space.
 */
export const LetterStage = forwardRef<LetterStageHandle, Props>(function LetterStage(
  { theme, content, ariaLabel, onSealBroken, onUnfolded, onWritten, onFail },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<LetterController | null>(null);
  const cb = useRef({ onSealBroken, onUnfolded, onWritten, onFail });
  cb.current = { onSealBroken, onUnfolded, onWritten, onFail };
  const [ready, setReady] = useState(false);
  const [ring, setRing] = useState<{ x: number; y: number; p: number } | null>(null);
  const hold = useRef({ active: false, opened: false, p: 0, raf: 0, last: 0, startX: 0, dragging: false, ticks: 0 });

  useImperativeHandle(ref, () => ({ skip: () => ctrlRef.current?.skip() }));

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (!webglAvailable()) {
      cb.current.onFail();
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.className = 'gift3d__canvas';
    wrap.prepend(canvas);
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      cb.current.onFail();
    });

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    Promise.all([import('./buildLetter'), handwritingFamily(), loadPhoto(content.photoUrl)])
      .then(([{ createLetter }, fontFamily, photo]) => {
        if (cancelled) return;
        try {
          const ctrl = createLetter(canvas, {
            style: theme.letter,
            glow: theme.gift.glow,
            greeting: content.greeting,
            body: content.body,
            signoff: content.signoff,
            photo,
            fontFamily,
            reducedMotion: reduced,
            onSealBroken: () => cb.current.onSealBroken(),
            onUnfolded: () => cb.current.onUnfolded(),
            onWritten: () => cb.current.onWritten(),
          });
          ctrlRef.current = ctrl;
          const fit = () => {
            ctrl.resize(wrap.clientWidth, wrap.clientHeight);
            const s = ctrl.sealScreen();
            setRing((r) => (r ? { ...r, x: s.x, y: s.y } : r));
          };
          fit();
          observer = new ResizeObserver(fit);
          observer.observe(wrap);
          const s = ctrl.sealScreen();
          setRing({ x: s.x, y: s.y, p: 0 });
          setReady(true);
        } catch {
          cb.current.onFail();
        }
      })
      .catch(() => cb.current.onFail());

    return () => {
      cancelled = true;
      cancelAnimationFrame(hold.current.raf);
      observer?.disconnect();
      ctrlRef.current?.dispose();
      ctrlRef.current = null;
      canvas.remove();
      setReady(false);
      setRing(null);
    };
  }, [theme.letter, theme.gift.glow, content.greeting, content.body, content.signoff, content.photoUrl]);

  const step = useCallback((now: number) => {
    const h = hold.current;
    const ctrl = ctrlRef.current;
    if (!ctrl || ctrl.isOpened()) return;
    const dt = Math.min((now - h.last) / 1000, 0.05);
    h.last = now;
    h.p = h.active && !h.dragging ? h.p + dt / HOLD_SECONDS : Math.max(0, h.p - dt * 3.2);
    ctrl.setHold(h.p);
    setRing((r) => (r ? { ...r, p: h.p } : r));

    // Small haptic ticks while the wax resists.
    const tick = Math.floor(h.p * 5);
    if (h.active && tick > h.ticks) {
      h.ticks = tick;
      try {
        navigator.vibrate?.(12);
      } catch {
        // haptics are optional
      }
    }

    if (h.p >= 1) {
      h.active = false;
      h.p = 0;
      ctrl.setHold(0);
      setRing((r) => (r ? { ...r, p: 0 } : r));
      ctrl.breakSeal();
      return;
    }
    if (h.active || h.p > 0) h.raf = requestAnimationFrame(step);
  }, []);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    const h = hold.current;
    // Once opened, a press only tilts the letter. Before that it starts the hold.
    h.active = !ctrl.isOpened();
    h.opened = ctrl.isOpened();
    h.dragging = false;
    h.startX = e.clientX;
    h.ticks = 0;
    h.last = performance.now();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // pointer already ended
    }
    cancelAnimationFrame(h.raf);
    h.raf = requestAnimationFrame(step);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const h = hold.current;
    if (!h.active && !h.opened) return;
    const dx = e.clientX - h.startX;
    if (Math.abs(dx) > DRAG_PX) {
      h.dragging = true;
      ctrlRef.current?.setYaw(dx * 0.008);
    }
  };
  const up = () => {
    const h = hold.current;
    h.active = false;
    h.opened = false;
    h.dragging = false;
    ctrlRef.current?.setYaw(0);
    cancelAnimationFrame(h.raf);
    h.last = performance.now();
    h.raf = requestAnimationFrame(step);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const ctrl = ctrlRef.current;
      if (!ctrl) return;
      if (ctrl.isOpened()) ctrl.skip();
      else ctrl.breakSeal();
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`gift3d letter3d${ready ? ' is-ready' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      {ring && ring.p > 0 ? (
        <svg
          className="letter3d__ring"
          style={{ left: `${ring.x * 100}%`, top: `${ring.y * 100}%` }}
          viewBox="0 0 80 80"
          aria-hidden
        >
          <circle cx="40" cy="40" r="34" className="letter3d__ring-track" />
          <circle
            cx="40"
            cy="40"
            r="34"
            className="letter3d__ring-fill"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - Math.min(ring.p, 1))}`}
          />
        </svg>
      ) : null}
      {!ready ? <span className="gift3d__loading">Sealing the envelope…</span> : null}
    </div>
  );
});
