'use client';

import { useCallback } from 'react';
import type { SceneContext } from '../context';
import { useOpenGesture } from '../useOpenGesture';
import styles from './palace.module.css';

/** Where the two brass handles are in the photograph, in units of the 400 by 800 stage. */
const RING_LEFT = { x: 161, y: 484 };
const RING_RIGHT = { x: 226, y: 484 };

/**
 * The Pink City gate, a photograph of the lotus gate at the City Palace in Jaipur: a fan of petals
 * over two carved golden doors. Take hold of a ring and pull it outwards and the doors swing open
 * on their hinges; let go early and they spring shut. A tap on a ring opens them too, as does the
 * Enter key. Then the whole front comes towards you, as if you were walking in.
 *
 * The doors are cut from the same photograph as the wall, so they match when shut. The outline of
 * each leaf is the carved arch, so it is the doorway that is left when they open, not a rectangle.
 */
export function PalaceGate({ ctx }: { ctx: SceneContext }) {
  const distance = useCallback(() => window.innerWidth * 0.32, []);
  const { gate, bind } = useOpenGesture({
    distance,
    onOpen: ctx.open,
    onGone: ctx.gone,
    settleMs: 2600,
    onComplete: (x, y) => ctx.fire(x, y, 'petals', 1.3),
  });
  const left = bind({ x: -1, y: 0 });
  const right = bind({ x: 1, y: 0 });
  const place = (point: { x: number; y: number }) => ({
    left: `calc(var(--u) * ${point.x - 32})`,
    top: `calc(var(--u) * ${point.y - 32})`,
  });

  return (
    <div ref={gate} className={styles.gate} data-settle="" style={{ '--open': 0 } as React.CSSProperties}>
      <div className={styles.rig}>
        <div className={styles.facade} />
        <div className={styles.doorway}>
          <div className={styles.room} />
          <div className={`${styles.leaf} ${styles.leafLeft}`} />
          <div className={`${styles.leaf} ${styles.leafRight}`} />
        </div>
        <svg className={styles.clips} width="0" height="0" aria-hidden focusable="false">
          <defs>
            <clipPath id="palaceDoorway" clipPathUnits="objectBoundingBox">
              <path d="M0 1 V0.16 C0 0.09 0.13 0.05 0.28 0.035 C0.4 0.02 0.46 0.012 0.5 0 C0.54 0.012 0.6 0.02 0.72 0.035 C0.87 0.05 1 0.09 1 0.16 V1 Z" />
            </clipPath>
            <clipPath id="palaceLeafLeft" clipPathUnits="objectBoundingBox">
              <path d="M0 1 V0.16 C0 0.09 0.26 0.05 0.56 0.035 C0.8 0.02 0.93 0.012 1 0 V1 Z" />
            </clipPath>
            <clipPath id="palaceLeafRight" clipPathUnits="objectBoundingBox">
              <path d="M1 1 V0.16 C1 0.09 0.74 0.05 0.44 0.035 C0.2 0.02 0.07 0.012 0 0 V1 Z" />
            </clipPath>
          </defs>
        </svg>

        <div className={styles.plaque}>
          <p className={styles.plaqueEyebrow}>You are invited</p>
          <p className={styles.plaqueNames}>{ctx.title}</p>
        </div>

        <button type="button" className={styles.ring} style={place(RING_LEFT)} aria-label="Open the invitation" {...left}>
          <span className={styles.ringHalo} />
        </button>
        <button type="button" className={styles.ring} style={place(RING_RIGHT)} aria-label="Open the invitation" {...right}>
          <span className={styles.ringHalo} />
        </button>
        <p className={styles.pullHint}>{ctx.theme.copy.gateHint}</p>
      </div>
    </div>
  );
}
