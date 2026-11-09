'use client';

import { useCallback, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { Divider } from './ornaments';
import { haptic } from './scroll';
import styles from './invitation.module.css';

const FLING_DISTANCE = 96;
const FLING_MS = 320;

/**
 * Photos as a stack of prints. Drag the top one away, or tap it, and the next comes forward while
 * the first slips to the back. Arrow keys and the buttons do the same.
 */
export function MomentStack({ photos }: { photos: string[] }) {
  const [top, setTop] = useState(0);
  const count = photos.length;
  const card = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ active: false, startX: 0, startY: 0, dx: 0, moved: 0, busy: false });

  const advance = useCallback(
    (direction: 1 | -1) => {
      if (count < 2) return;
      setTop((current) => (current + direction + count) % count);
      haptic(8);
    },
    [count],
  );

  const fling = useCallback(
    (direction: 1 | -1) => {
      const element = card.current;
      if (!element || drag.current.busy) return;
      drag.current.busy = true;
      element.style.transition = `transform ${FLING_MS}ms cubic-bezier(.3,.7,.4,1), opacity ${FLING_MS}ms ease`;
      element.style.transform = `translate3d(${direction * window.innerWidth}px, -30px, 0) rotate(${direction * 24}deg)`;
      element.style.opacity = '0';
      window.setTimeout(() => {
        // It slips to the back of the stack unseen, then fades in there.
        element.style.transition = 'none';
        element.style.transform = '';
        drag.current.busy = false;
        advance(1);
        window.setTimeout(() => {
          element.style.transition = 'opacity 300ms ease';
          element.style.opacity = '';
          window.setTimeout(() => {
            element.style.transition = '';
          }, 320);
        }, 60);
      }, FLING_MS);
    },
    [advance],
  );

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current.busy || count < 2) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { ...drag.current, active: true, startX: event.clientX, startY: event.clientY, dx: 0, moved: 0 };
    event.currentTarget.style.transition = 'none';
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state.active) return;
    state.dx = event.clientX - state.startX;
    const dy = (event.clientY - state.startY) * 0.25;
    state.moved = Math.max(state.moved, Math.abs(state.dx));
    event.currentTarget.style.transform = `translate3d(${state.dx}px, ${dy}px, 0) rotate(${state.dx * 0.06}deg)`;
  };

  const release = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state.active) return;
    state.active = false;
    const element = event.currentTarget;
    if (Math.abs(state.dx) > FLING_DISTANCE) {
      fling(state.dx > 0 ? 1 : -1);
    } else if (state.moved < 6) {
      fling(1);
    } else {
      element.style.transition = 'transform 380ms cubic-bezier(.2,1.2,.4,1)';
      element.style.transform = '';
      window.setTimeout(() => {
        element.style.transition = '';
      }, 400);
    }
  };

  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fling(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      advance(-1);
    }
  };

  if (count === 0) return null;

  return (
    <section className={`${styles.section} ${styles.moments}`} aria-labelledby="moments-title">
      <Divider className={styles.divider} />
      <h2 className={styles.heading} id="moments-title" data-reveal="up">
        Moments
      </h2>
      <div className={styles.stack} data-reveal="zoom">
        {photos.map((url, index) => {
          const depth = (index - top + count) % count;
          const isTop = depth === 0;
          return (
            <div
              key={url}
              ref={isTop ? card : undefined}
              className={styles.print}
              data-top={isTop ? '' : undefined}
              style={{ '--d': Math.min(depth, 3), '--spin': index % 2 === 0 ? 1 : -1 } as CSSProperties}
              role={isTop && count > 1 ? 'button' : undefined}
              tabIndex={isTop && count > 1 ? 0 : -1}
              aria-label={isTop && count > 1 ? `Photo ${top + 1} of ${count}. Swipe or press for the next` : undefined}
              aria-hidden={isTop ? undefined : true}
              onPointerDown={isTop ? down : undefined}
              onPointerMove={isTop ? move : undefined}
              onPointerUp={isTop ? release : undefined}
              onPointerCancel={isTop ? release : undefined}
              onKeyDown={isTop ? key : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" draggable={false} loading="lazy" />
            </div>
          );
        })}
      </div>
      {count > 1 ? (
        <div className={styles.stackBar}>
          <button type="button" className={styles.stackStep} aria-label="Previous photo" onClick={() => advance(-1)}>
            &lsaquo;
          </button>
          <p className={styles.stackCount} aria-live="polite">
            {top + 1} / {count}
          </p>
          <button type="button" className={styles.stackStep} aria-label="Next photo" onClick={() => fling(1)}>
            &rsaquo;
          </button>
        </div>
      ) : null}
      {count > 1 ? <p className={styles.stackHint}>Swipe the photo away</p> : null}
    </section>
  );
}
