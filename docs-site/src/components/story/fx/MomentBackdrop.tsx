'use client';

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { BackdropId, MomentTheme } from '@/lib/experience/momentTheme';

type Item = {
  kind: string;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rot: number;
  color: string;
};

/** Deterministic so server and client render the same markup (no hydration drift). */
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeItems(
  kinds: string[],
  count: number,
  colors: string[],
  seed: number,
  size: [number, number],
  duration: [number, number],
): Item[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, (_, i) => ({
    kind: kinds[i % kinds.length]!,
    left: 3 + rand() * 94,
    top: 4 + rand() * 90,
    size: size[0] + rand() * (size[1] - size[0]),
    delay: -rand() * duration[1],
    duration: duration[0] + rand() * (duration[1] - duration[0]),
    drift: (rand() - 0.5) * 60,
    rot: (rand() - 0.5) * 60,
    color: colors[i % colors.length]!,
  }));
}

const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const STAR4 = 'M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z';
const LEAF = 'M4 20C4 9 11 3 21 3c0 10-6 17-17 17zM4 20L15 9';
const PETAL = 'M12 2C7 6 5 12 8 18c2 3 6 3 8 0 3-6 1-12-4-16z';

function Shape({ kind, color }: { kind: string; color: string }) {
  switch (kind) {
    case 'balloon':
      return (
        <svg viewBox="0 0 40 70" width="100%" height="100%" aria-hidden>
          <ellipse cx="20" cy="22" rx="16" ry="20" fill={color} />
          <ellipse cx="14" cy="14" rx="4" ry="7" fill="#fff" opacity=".45" />
          <path d="M17 41h6l-3 5z" fill={color} />
          <path d="M20 46c-5 6 5 10 0 16" stroke={color} strokeWidth="1.4" fill="none" opacity=".7" />
        </svg>
      );
    case 'confetti':
      return (
        <svg viewBox="0 0 10 16" width="100%" height="100%" aria-hidden>
          <rect width="10" height="16" rx="2" fill={color} />
        </svg>
      );
    case 'petal':
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <path d={PETAL} fill={color} />
          <path d="M12 4c-1 5-1 9 0 14" stroke="#fff" strokeOpacity=".35" fill="none" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <path d={HEART} fill={color} />
        </svg>
      );
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <path d={LEAF} fill={color} stroke="#3f7a3a" strokeOpacity=".5" strokeWidth=".8" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <path d={STAR4} fill={color} />
        </svg>
      );
    case 'squiggle':
      return (
        <svg viewBox="0 0 40 16" width="100%" height="100%" aria-hidden>
          <path d="M2 8c4-8 8 8 12 0s8 8 12 0 8 8 12 0" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'ring':
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="3" fill="none" />
        </svg>
      );
    default:
      // bokeh / firefly: soft glowing dot
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <defs>
            <radialGradient id={`g-${kind}`}>
              <stop offset="0%" stopColor={color} stopOpacity="0.95" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="12" fill={`url(#g-${kind})`} />
        </svg>
      );
  }
}

type Layer = {
  items: Item[];
  motion: 'rise' | 'fall' | 'float' | 'twinkle' | 'breathe';
  className?: string;
};

function layersFor(id: BackdropId, colors: string[]): Layer[] {
  switch (id) {
    case 'party':
      return [
        { items: makeItems(['balloon'], 7, colors, 11, [26, 48], [26, 44]), motion: 'rise' },
        { items: makeItems(['confetti', 'ring', 'confetti'], 14, colors, 12, [7, 12], [14, 24]), motion: 'fall' },
      ];
    case 'candlelit':
      return [
        { items: makeItems(['bokeh'], 9, ['#FFB37A', '#FF86A8', '#FFD3A5'], 21, [50, 120], [7, 12]), motion: 'breathe' },
        { items: makeItems(['petal'], 12, colors, 22, [14, 24], [16, 28]), motion: 'fall' },
        { items: makeItems(['heart'], 5, ['#FF6F91'], 23, [12, 20], [22, 34]), motion: 'rise' },
      ];
    case 'garden':
      return [
        { items: makeItems(['leaf'], 10, ['#8FC66F', '#6FA76A', '#B7D98F'], 31, [16, 26], [16, 28]), motion: 'fall' },
        { items: makeItems(['bokeh'], 14, ['#FFE29A', '#FFD166'], 32, [14, 30], [3, 6]), motion: 'twinkle' },
      ];
    case 'spotlight':
      return [
        { items: makeItems(['star'], 16, ['#FFD166', '#FFF3B0', '#FFFFFF'], 41, [8, 18], [2.4, 5]), motion: 'twinkle' },
        { items: makeItems(['confetti'], 10, colors, 42, [6, 10], [12, 20]), motion: 'fall' },
      ];
    case 'doodle':
    default:
      return [
        { items: makeItems(['star', 'squiggle', 'heart', 'ring'], 14, colors, 51, [16, 34], [18, 34]), motion: 'float' },
      ];
  }
}

function Decor({ id }: { id: BackdropId }): ReactNode {
  switch (id) {
    case 'party':
      // Bunting garland across the top.
      return (
        <svg className="mbd-bunting" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden>
          <path d="M-10 6Q100 44 200 22T410 6" stroke="#8a5a6a" strokeWidth="1.6" fill="none" opacity=".55" />
          {[
            [30, 20, '#FF4D6D'], [78, 30, '#FFB703'], [126, 34, '#3A86FF'], [174, 30, '#8338EC'],
            [222, 26, '#06D6A0'], [270, 22, '#FB5607'], [318, 18, '#FF4D6D'], [366, 14, '#FFB703'],
          ].map(([x, y, c]) => (
            <path
              key={String(x)}
              d={`M${Number(x) - 15} ${Number(y)} L${Number(x) + 15} ${Number(y) - 2} L${Number(x)} ${Number(y) + 28}Z`}
              fill={String(c)}
              opacity=".92"
            />
          ))}
        </svg>
      );
    case 'candlelit':
      return (
        <>
          <span className="mbd-glow mbd-glow--warm" />
          <div className="mbd-stringlights" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} style={{ '--i': i } as CSSProperties} />
            ))}
          </div>
        </>
      );
    case 'garden':
      return <span className="mbd-sunrays" aria-hidden />;
    case 'spotlight':
      return (
        <>
          <span className="mbd-beam mbd-beam--a" aria-hidden />
          <span className="mbd-beam mbd-beam--b" aria-hidden />
        </>
      );
    case 'doodle':
    default:
      return (
        <>
          <span className="mbd-blob mbd-blob--a" aria-hidden />
          <span className="mbd-blob mbd-blob--b" aria-hidden />
        </>
      );
  }
}

/** Fixed, non-interactive atmosphere behind every scene of a moment. */
export function MomentBackdrop({ theme }: { theme: MomentTheme }) {
  const layers = useMemo(
    () => layersFor(theme.backdrop, theme.palette),
    [theme.backdrop, theme.palette],
  );

  return (
    <div className={`mbd mbd--${theme.backdrop}`} aria-hidden>
      <Decor id={theme.backdrop} />
      {layers.map((layer, li) =>
        layer.items.map((item, i) => (
          <span
            key={`${li}-${i}`}
            className={`mbd-item mbd-item--${layer.motion} mbd-item--${item.kind}`}
            style={
              {
                left: `${item.left}%`,
                ...(layer.motion === 'twinkle' || layer.motion === 'breathe'
                  ? { top: `${item.top}%` }
                  : {}),
                width: item.size,
                height: item.kind === 'balloon' ? item.size * 1.75 : item.size,
                animationDelay: `${item.delay}s`,
                animationDuration: `${item.duration}s`,
                '--drift': `${item.drift}px`,
                '--rot': `${item.rot}deg`,
              } as CSSProperties
            }
          >
            <span className="mbd-item__inner">
              <Shape kind={item.kind} color={item.color} />
            </span>
          </span>
        )),
      )}
    </div>
  );
}
