'use client';

import { useEffect, useRef, useState } from 'react';
import { haptic } from '../../scroll';
import type { SceneContext } from '../context';
import { useScrollLock } from '../useOpenGesture';
import styles from './baraat.module.css';

/** How long the gate stays before it lets the page show, and then goes, in milliseconds. */
const FADE_AFTER_MS = 900;
const GONE_AFTER_MS = 1900;

/**
 * "Save the date" over a photograph of the couple's car, dressed for the wedding. Tap to honk the
 * horn: the photograph jolts, marigold petals fly, and the gate lets go so the page can arrive. The
 * same photograph, out of focus and dimmed, is the room behind the whole page.
 */
export function BaraatGate({ ctx }: { ctx: SceneContext }) {
  const [beat, setBeat] = useState(0);
  const [fading, setFading] = useState(false);
  const timers = useRef<number[]>([]);
  useScrollLock();

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const strike = (from: Element) => {
    if (beat > 0) return;
    const rect = from.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setBeat(1);
    haptic(24);
    ctx.open(x, y);
    ctx.fire(x, y, 'petals', 1.6);
    timers.current.push(
      window.setTimeout(() => ctx.fire(x, y, 'confetti', 0.9), 260),
      window.setTimeout(() => setFading(true), FADE_AFTER_MS),
      window.setTimeout(ctx.gone, GONE_AFTER_MS),
    );
  };

  return (
    <div className={styles.gate} data-fading={fading ? '' : undefined} data-struck={beat > 0 ? '' : undefined}>
      <p className={styles.gateEyebrow}>{ctx.theme.copy.gateEyebrow}</p>
      <p className={styles.gateTitle}>{ctx.title}</p>
      <div className={styles.gateFrame}>
        <div className={styles.gatePhoto} />
      </div>
      <button
        type="button"
        className={styles.hornButton}
        aria-label="Open the invitation"
        onClick={(event) => strike(event.currentTarget)}
      >
        <span className={styles.hornHalo} />
        <span className={styles.hornLabel}>{ctx.theme.copy.gateHint}</span>
      </button>
    </div>
  );
}
