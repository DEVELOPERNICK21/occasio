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
  motion: 'rise' | 'fall' | 'float' | 'twinkle';
};

function layersFor(id: BackdropId, colors: string[]): Layer[] {
  switch (id) {
    case 'party':
      return [
        { items: makeItems(['balloon'], 7, colors, 11, [26, 48], [26, 44]), motion: 'rise' },
        { items: makeItems(['confetti', 'ring', 'confetti'], 14, colors, 12, [7, 12], [14, 24]), motion: 'fall' },
      ];
    case 'romance':
      return [
        { items: makeItems(['petal'], 14, colors, 22, [14, 24], [16, 28]), motion: 'fall' },
        { items: makeItems(['heart'], 8, ['#FF6F91', '#E0446A', '#FFB3C7'], 23, [14, 24], [22, 34]), motion: 'rise' },
      ];
    case 'garden':
      return [
        { items: makeItems(['leaf'], 12, ['#8FC66F', '#6FA76A', '#B7D98F'], 31, [16, 26], [16, 28]), motion: 'fall' },
        { items: makeItems(['star'], 10, ['#F2A93B', '#FFC857'], 32, [8, 14], [3, 6]), motion: 'twinkle' },
      ];
    case 'celebration':
      return [
        { items: makeItems(['star'], 14, ['#F2A900', '#3557E8', '#EF476F'], 41, [10, 20], [2.6, 5]), motion: 'twinkle' },
        { items: makeItems(['confetti', 'ring'], 14, colors, 42, [6, 11], [12, 22]), motion: 'fall' },
      ];
    case 'doodle':
    default:
      return [
        { items: makeItems(['star', 'squiggle', 'heart', 'ring'], 14, colors, 51, [16, 34], [18, 34]), motion: 'float' },
      ];
  }
}

const GARLAND_STRING = 'M-10 6Q100 44 200 22T410 6';

function starPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return `${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`;
  }).join(' ');
}

/** Crisp decorations hung across the top of the screen, one per moment. */
function Decor({ id }: { id: BackdropId }): ReactNode {
  const heartPath = HEART;
  switch (id) {
    case 'party':
      return (
        <svg className="mbd-garland" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden>
          <path d={GARLAND_STRING} stroke="#8a5a6a" strokeWidth="1.6" fill="none" opacity=".55" />
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
    case 'romance':
      return (
        <svg className="mbd-garland" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden>
          <path d={GARLAND_STRING} stroke="#B76A80" strokeWidth="1.6" fill="none" opacity=".55" />
          {[
            [30, 20, '#E0446A'], [78, 30, '#FF8FA8'], [126, 34, '#C4325A'], [174, 30, '#FFB3C7'],
            [222, 26, '#E0446A'], [270, 22, '#FF8FA8'], [318, 18, '#C4325A'], [366, 14, '#FFB3C7'],
          ].map(([x, y, c]) => (
            <g key={String(x)} transform={`translate(${Number(x) - 14} ${Number(y) - 2}) scale(1.16)`}>
              <line x1="12" y1="0" x2="12" y2="4" stroke="#B76A80" strokeWidth="1" opacity=".6" />
              <path d={heartPath} fill={String(c)} />
            </g>
          ))}
        </svg>
      );
    case 'garden':
      return (
        <svg className="mbd-garland" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden>
          <path d={GARLAND_STRING} stroke="#5FA357" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".85" />
          {[24, 66, 108, 150, 192, 234, 276, 318, 360].map((x, i) => {
            const y = 8 + Math.sin((x / 400) * Math.PI * 2 - 0.4) * 10 + (x > 100 && x < 300 ? 14 : 4);
            return (
              <g key={x} transform={`translate(${x} ${y})`}>
                <ellipse cx="0" cy="8" rx="11" ry="5" fill={i % 2 ? '#6FA76A' : '#8FC66F'} transform={`rotate(${i % 2 ? 40 : -40} 0 8)`} />
                {i % 3 === 0 ? (
                  <>
                    <circle cx="0" cy="-1" r="5.5" fill="#FF8FA3" />
                    <circle cx="0" cy="-1" r="2.2" fill="#FFC233" />
                  </>
                ) : null}
              </g>
            );
          })}
        </svg>
      );
    case 'celebration':
      return (
        <svg className="mbd-garland" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden>
          <path d={GARLAND_STRING} stroke="#6B74A8" strokeWidth="1.6" fill="none" opacity=".55" />
          {[
            [30, 22, '#F2A900'], [78, 32, '#3557E8'], [126, 36, '#EF476F'], [174, 32, '#F2A900'],
            [222, 28, '#3557E8'], [270, 24, '#EF476F'], [318, 20, '#F2A900'], [366, 16, '#3557E8'],
          ].map(([x, y, c]) => (
            <polygon key={String(x)} points={starPoints(Number(x), Number(y) + 12, 15)} fill={String(c)} />
          ))}
        </svg>
      );
    case 'doodle':
    default:
      return (
        <>
          <span className="mbd-disc mbd-disc--a" aria-hidden />
          <span className="mbd-disc mbd-disc--b" aria-hidden />
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
                ...(layer.motion === 'twinkle'
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
