'use client';

import { useEffect, useRef, useState } from 'react';
import { haptic } from '../../scroll';
import type { SceneContext } from '../context';
import { useScrollLock } from '../useOpenGesture';
import styles from './garden.module.css';

type Stage = 'closed' | 'doors' | 'curtains';

/** How long each part of the opening takes, in milliseconds. */
const DOORS_MS = 1300;
const CURTAINS_MS = 1700;

/**
 * The green gate of the City Palace in Jaipur, a photograph. Tap the seal and the two golden doors
 * swing open on their hinges to show champagne satin curtains, which then draw back to either side
 * and leave the doorway open on the garden, which the whole front then moves towards. The page
 * behind has been waiting the whole time, so the garden is there the moment the cloth moves.
 *
 * The doors are cut from the same photograph as the wall, so they match when shut, and the doorway is
 * a hole in the wall (an even-odd clip), so what is behind the curtains is the page itself.
 */
export function GardenGate({ ctx }: { ctx: SceneContext }) {
  const [stage, setStage] = useState<Stage>('closed');
  const timers = useRef<number[]>([]);
  useScrollLock();

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const begin = (from: Element) => {
    if (stage !== 'closed') return;
    const rect = from.getBoundingClientRect();
    haptic(18);
    setStage('doors');
    ctx.open(rect.left + rect.width / 2, rect.top + rect.height / 2);
    ctx.fire(rect.left + rect.width / 2, rect.top + rect.height / 2, 'petals', 1.2);
    timers.current.push(
      window.setTimeout(() => setStage('curtains'), DOORS_MS - 200),
      window.setTimeout(ctx.gone, DOORS_MS + CURTAINS_MS + 300),
    );
  };

  return (
    <div className={styles.gate} data-stage={stage}>
      <div className={styles.sides}>
        <div className={styles.sidesImage} />
      </div>
      <div className={styles.rig}>
        <div className={styles.facade} />
        <div className={styles.doorway}>
          <div className={styles.curtains}>
            <div className={`${styles.curtain} ${styles.curtainLeft}`} />
            <div className={`${styles.curtain} ${styles.curtainRight}`} />
          </div>
          <div className={`${styles.door} ${styles.doorLeft}`} />
          <div className={`${styles.door} ${styles.doorRight}`} />
        </div>
        <svg className={styles.clips} width="0" height="0" aria-hidden focusable="false">
          <defs>
            <clipPath id="gardenWall" clipPathUnits="objectBoundingBox">
              <path
                clipRule="evenodd"
                d="M 0 0 H 1 V 1 H 0 Z M 0.2700 0.8525 V 0.5245 C 0.2700 0.4876 0.3240 0.4671 0.3960 0.4589 C 0.4500 0.4507 0.4770 0.4474 0.4950 0.4425 C 0.5130 0.4474 0.5400 0.4507 0.5940 0.4589 C 0.6660 0.4671 0.7200 0.4876 0.7200 0.5245 V 0.8525 Z"
              />
            </clipPath>
            <clipPath id="gardenDoorway" clipPathUnits="objectBoundingBox">
              <path d="M 0 1 V 0.2 C 0 0.11 0.12 0.06 0.28 0.04 C 0.4 0.02 0.46 0.012 0.5 0 C 0.54 0.012 0.6 0.02 0.72 0.04 C 0.88 0.06 1 0.11 1 0.2 V 1 Z" />
            </clipPath>
            <clipPath id="gardenLeafLeft" clipPathUnits="objectBoundingBox">
              <path d="M 0 1 V 0.2 C 0 0.11 0.24 0.06 0.56 0.04 C 0.8 0.02 0.93 0.012 1 0 V 1 Z" />
            </clipPath>
            <clipPath id="gardenLeafRight" clipPathUnits="objectBoundingBox">
              <path d="M 1 1 V 0.2 C 1 0.11 0.76 0.06 0.44 0.04 C 0.2 0.02 0.07 0.012 0 0 V 1 Z" />
            </clipPath>
          </defs>
        </svg>

        <p className={styles.gateNames}>{ctx.title}</p>
        <button
          type="button"
          className={styles.seal}
          aria-label="Open the invitation"
          onClick={(event) => begin(event.currentTarget)}
        >
          <span className={styles.sealHalo} />
          <span className={styles.sealDot} />
        </button>
        <p className={styles.gateHint}>{ctx.theme.copy.gateHint}</p>
      </div>
    </div>
  );
}
