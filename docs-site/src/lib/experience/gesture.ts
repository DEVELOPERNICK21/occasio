/**
 * Tells a tap from a slide, so photos can answer to both. A finger always moves a
 * little during a tap, and a quick flick is a slide even when it is short, so the
 * numbers here are the part worth getting right (and testing).
 */

/** A finger that moves no further than this (px) and lifts soon is a tap. */
export const TAP_MAX_MOVE = 10;
export const TAP_MAX_MS = 600;
/** A slide goes at least this far sideways (px)... */
export const SLIDE_MIN = 64;
/** ...or a quick flick goes at least this far, within FLICK_MAX_MS. */
export const FLICK_MIN = 32;
export const FLICK_MAX_MS = 260;

export type Gesture = 'tap' | 'slide-left' | 'slide-right' | 'none';

export type Movement = {
  /** Sideways travel in px; positive is to the right. */
  dx: number;
  /** Vertical travel in px. */
  dy: number;
  /** How long the finger was down, in ms. */
  ms: number;
};

export function classifyGesture({ dx, dy, ms }: Movement): Gesture {
  const across = Math.abs(dx);
  const down = Math.abs(dy);

  if (across <= TAP_MAX_MOVE && down <= TAP_MAX_MOVE) {
    return ms <= TAP_MAX_MS ? 'tap' : 'none';
  }

  // Mostly sideways, or it is a scroll or a diagonal wobble rather than a slide.
  if (across <= down) return 'none';

  const farEnough = across >= SLIDE_MIN || (across >= FLICK_MIN && ms <= FLICK_MAX_MS);
  if (!farEnough) return 'none';
  return dx > 0 ? 'slide-right' : 'slide-left';
}
