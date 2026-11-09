'use client';

import { useCallback, useState, type CSSProperties } from 'react';
import { haptic, prefersReducedMotion } from './scroll';
import styles from './invitation.module.css';

export type BurstKind = 'petals' | 'confetti' | 'sparks';

type Shape = 'petal' | 'bit' | 'dot';

type Particle = {
  id: number;
  dx: number;
  dy: number;
  turn: number;
  size: number;
  delay: number;
  color: string;
  shape: Shape;
};

type Burst = { id: number; x: number; y: number; particles: Particle[] };

const SETTINGS: Record<BurstKind, { count: number; reach: number; shape: Shape }> = {
  petals: { count: 22, reach: 190, shape: 'petal' },
  confetti: { count: 34, reach: 240, shape: 'bit' },
  sparks: { count: 10, reach: 80, shape: 'dot' },
};

let nextId = 1;

/** Particles fan out in every direction, mostly upward, then fall. Made on a tap, never during a render. */
function makeBurst(x: number, y: number, kind: BurstKind, colors: string[], scale: number): Burst {
  const { count, reach, shape } = SETTINGS[kind];
  const total = Math.round(count * scale);
  const particles: Particle[] = Array.from({ length: total }, (_, index) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = reach * (0.35 + Math.random() * 0.75);
    return {
      id: index,
      dx: Math.cos(angle) * distance,
      // A bias upward, so it reads as a toss rather than a ring.
      dy: Math.sin(angle) * distance - reach * 0.35,
      turn: (Math.random() - 0.5) * 720,
      size: (shape === 'dot' ? 4 : 8) + Math.random() * (shape === 'dot' ? 4 : 8),
      delay: Math.random() * 80,
      color: colors[index % colors.length]!,
      shape,
    };
  });
  return { id: nextId++, x, y, particles };
}

/** Bursts of petals, confetti and sparks that fly from a point on the screen. */
export function useBursts(colors: string[]) {
  const [bursts, setBursts] = useState<Burst[]>([]);

  const fire = useCallback(
    (x: number, y: number, kind: BurstKind = 'confetti', scale = 1) => {
      if (prefersReducedMotion()) return;
      const burst = makeBurst(x, y, kind, colors, scale);
      setBursts((current) => [...current.slice(-3), burst]);
      window.setTimeout(() => setBursts((current) => current.filter((item) => item.id !== burst.id)), 2300);
      if (kind !== 'sparks') haptic(12);
    },
    [colors],
  );

  /** From the middle of an element, which is where a tap on it lands. */
  const fireFrom = useCallback(
    (element: Element | null, kind: BurstKind = 'confetti', scale = 1) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      fire(rect.left + rect.width / 2, rect.top + rect.height / 2, kind, scale);
    },
    [fire],
  );

  return { bursts, fire, fireFrom };
}

export function BurstLayer({ bursts }: { bursts: ReadonlyArray<Burst> }) {
  return (
    <div className={styles.bursts} aria-hidden>
      {bursts.map((burst) => (
        <div key={burst.id} className={styles.burst} style={{ left: burst.x, top: burst.y }}>
          {burst.particles.map((p) => (
            <span
              key={p.id}
              className={`${styles.bit} ${p.shape === 'petal' ? styles.bitPetal : p.shape === 'dot' ? styles.bitDot : styles.bitBar}`}
              style={
                {
                  '--dx': `${p.dx.toFixed(1)}px`,
                  '--dy': `${p.dy.toFixed(1)}px`,
                  '--turn': `${p.turn.toFixed(0)}deg`,
                  width: p.shape === 'bit' ? p.size * 1.5 : p.size,
                  height: p.shape === 'petal' ? p.size * 1.7 : p.size,
                  background: p.color,
                  animationDelay: `${p.delay.toFixed(0)}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
