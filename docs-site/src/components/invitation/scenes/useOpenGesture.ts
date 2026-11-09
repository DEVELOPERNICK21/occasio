'use client';

import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { clamp01, haptic } from '../scroll';

/** The page cannot scroll behind an entrance. */
export function useScrollLock() {
  useEffect(() => {
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = before;
    };
  }, []);
}

/** How far along the pull an open must be when the finger lifts for it to carry on by itself. */
export const OPEN_THRESHOLD = 0.32;

/** A pull of `distance` pixels along `dir` opens the entrance fully. Pure, so it can be tested. */
export function pullProgress(dx: number, dy: number, dir: { x: number; y: number } | null, distance: number): number {
  const along = dir ? dx * dir.x + dy * dir.y : Math.hypot(dx, dy);
  return clamp01(along / Math.max(1, distance));
}

type Options = {
  /** Pixels of pull that open it fully. */
  distance: () => number;
  /** Called the moment it starts to open, with the point it opens from. */
  onOpen: (x: number, y: number) => void;
  /** Called once it has left the screen. */
  onGone: () => void;
  /** How long the opening takes before it is removed, in milliseconds. */
  settleMs: number;
  /** Extra work at the moment it opens (a burst, a sound). */
  onComplete?: (x: number, y: number) => void;
};

/**
 * One way to open an entrance: grab a handle and pull, and the gate follows your finger through a
 * CSS variable (`--open`, 0 to 1). Let go past a third of the way and it finishes by itself, or it
 * springs back. A plain tap or the Enter key opens it too, so nothing depends on a drag.
 */
export function useOpenGesture({ distance, onOpen, onGone, settleMs, onComplete }: Options) {
  const gate = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const drag = useRef({ active: false, startX: 0, startY: 0, moved: 0, open: 0 });
  useScrollLock();

  const setOpen = useCallback((value: number) => {
    gate.current?.style.setProperty('--open', value.toFixed(3));
  }, []);

  const complete = useCallback(
    (from: Element | null) => {
      if (finished.current) return;
      finished.current = true;
      const element = gate.current;
      if (!element) return;
      element.setAttribute('data-settle', '');
      element.setAttribute('data-opening', '');
      setOpen(1);
      haptic(18);
      const rect = from?.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      onOpen(x, y);
      onComplete?.(x, y);
      window.setTimeout(onGone, settleMs);
    },
    [onComplete, onGone, onOpen, setOpen, settleMs],
  );

  const snapBack = useCallback(
    (handle: HTMLElement) => {
      gate.current?.setAttribute('data-settle', '');
      setOpen(0);
      handle.style.transform = '';
      drag.current.open = 0;
    },
    [setOpen],
  );

  /** The handlers for one handle. `dir` is the way that opens it (null: any way). */
  const bind = useCallback(
    (dir: { x: number; y: number } | null) => ({
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (finished.current) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { active: true, startX: event.clientX, startY: event.clientY, moved: 0, open: 0 };
        gate.current?.removeAttribute('data-settle');
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        const state = drag.current;
        if (!state.active || finished.current) return;
        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        state.moved = Math.max(state.moved, Math.hypot(dx, dy));
        state.open = pullProgress(dx, dy, dir, distance());
        setOpen(state.open);
        event.currentTarget.style.transform = `translate3d(${dx * 0.5}px,${dy * 0.5}px,0)`;
      },
      onPointerUp: (event: PointerEvent<HTMLElement>) => {
        const state = drag.current;
        if (!state.active) return;
        state.active = false;
        if (state.moved < 8 || state.open > OPEN_THRESHOLD) complete(event.currentTarget);
        else snapBack(event.currentTarget);
      },
      onPointerCancel: (event: PointerEvent<HTMLElement>) => {
        if (!drag.current.active) return;
        drag.current.active = false;
        snapBack(event.currentTarget);
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          complete(event.currentTarget);
        }
      },
      onClick: (event: { detail: number; currentTarget: Element }) => {
        // A keyboard or screen-reader "click" has no pointer; a real tap is handled on release.
        if (event.detail === 0) complete(event.currentTarget);
      },
    }),
    [complete, distance, setOpen, snapBack],
  );

  return { gate, bind, complete };
}
