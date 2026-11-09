'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Scroll-linked motion without re-rendering anything: one shared animation-frame loop measures the
 * registered scenes and writes their progress straight into a CSS custom property (`--p`, 0 to 1),
 * which the stylesheet turns into transforms and opacity. Only compositor-friendly properties are
 * driven this way, so it stays smooth on a phone.
 *
 * `pass`: 0 when the element enters at the bottom of the screen, 1 when it has left at the top.
 * `pin`: for a tall element holding a sticky screen: 0 when it reaches the top, 1 at its end.
 */

export type SceneMode = 'pass' | 'pin';

type Scene = { el: HTMLElement; mode: SceneMode; last: string };

const scenes = new Set<Scene>();
let pageRoot: HTMLElement | null = null;
let lastPage = '';
let queued = false;
let listening = false;

export function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** How far through a scene the screen is, 0 to 1. Pure, so it can be tested. */
export function sceneProgress(mode: SceneMode, top: number, height: number, viewport: number): number {
  if (mode === 'pin') return clamp01(-top / Math.max(1, height - viewport));
  return clamp01((viewport - top) / (viewport + height));
}

function frame() {
  queued = false;
  const viewport = window.innerHeight;
  // Read every rectangle first, then write: no layout thrash.
  const measured: Array<[Scene, DOMRect]> = [];
  scenes.forEach((scene) => measured.push([scene, scene.el.getBoundingClientRect()]));
  for (const [scene, rect] of measured) {
    const value = sceneProgress(scene.mode, rect.top, rect.height, viewport).toFixed(4);
    if (value !== scene.last) {
      scene.last = value;
      scene.el.style.setProperty('--p', value);
    }
  }
  if (pageRoot) {
    const max = document.documentElement.scrollHeight - viewport;
    const value = (max > 0 ? clamp01(window.scrollY / max) : 0).toFixed(4);
    if (value !== lastPage) {
      lastPage = value;
      pageRoot.style.setProperty('--page', value);
    }
  }
}

function schedule() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(frame);
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
}

function unlisten() {
  if (!listening || scenes.size > 0 || pageRoot) return;
  listening = false;
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
}

/** Starts driving `--p` on an element. Returns the function that stops it. */
export function registerScene(el: HTMLElement, mode: SceneMode): () => void {
  if (prefersReducedMotion()) {
    // Everything sits in its finished state; nothing moves with the scroll.
    el.style.setProperty('--p', '1');
    return () => undefined;
  }
  const scene: Scene = { el, mode, last: '' };
  scenes.add(scene);
  listen();
  schedule();
  return () => {
    scenes.delete(scene);
    unlisten();
  };
}

/** The page element that receives `--page`, how far down the whole page the reader is. */
export function registerPage(el: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => undefined;
  pageRoot = el;
  listen();
  schedule();
  return () => {
    if (pageRoot === el) pageRoot = null;
    unlisten();
  };
}

export function useScene<T extends HTMLElement>(mode: SceneMode): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    return registerScene(el, mode);
  }, [mode]);
  return ref;
}

/**
 * Fades things up the first time they are reached: every `[data-reveal]` inside the root gets
 * `data-in` once it is on screen. Nothing is hidden until this has run, so a page whose script
 * never loads still shows everything.
 */
export function useReveal(root: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const host = root.current;
    if (!host) return undefined;
    const targets = Array.from(host.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.setAttribute('data-in', ''));
      return undefined;
    }
    host.setAttribute('data-motion', 'on');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-in', '');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    );
    targets.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      host.removeAttribute('data-motion');
    };
  }, [root]);
}

/** A small tap of feedback on phones that support it. Never required, never throws. */
export function haptic(milliseconds = 10): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(milliseconds);
  } catch {
    // Some browsers refuse without a recent tap; that is fine.
  }
}
