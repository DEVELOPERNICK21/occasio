'use client';

/**
 * What is drawn in the baraat invitation: strings of marigolds. The car, the street and the gate are
 * a photograph (BaraatGate, baraat.module.css).
 */

const MARIGOLD = ['#f29a1f', '#f6c945'] as const;

/** A marigold from the front. */
function Flower({ x, y, r, petal }: { x: number; y: number; r: number; petal: string }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      {Array.from({ length: 9 }, (_, i) => (
        <ellipse
          key={i}
          cx="0"
          cy={-r * 0.55}
          rx={r * 0.38}
          ry={r * 0.6}
          fill={petal}
          stroke="#b86a0c"
          strokeOpacity="0.45"
          strokeWidth="0.5"
          transform={`rotate(${(i * 360) / 9})`}
        />
      ))}
      <circle r={r * 0.3} fill="#c2570b" />
      <circle r={r * 0.14} fill="#7a3205" />
    </g>
  );
}

/** A point on a quadratic curve, for hanging flowers along a sagging string. */
function along(from: [number, number], control: [number, number], to: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [
    u * u * from[0] + 2 * u * t * control[0] + t * t * to[0],
    u * u * from[1] + 2 * u * t * control[1] + t * t * to[1],
  ];
}

/** A string of marigolds hung between two points, sagging in the middle. */
export function Garland({ from, to, sag, count, className }: { from: [number, number]; to: [number, number]; sag: number; count: number; className?: string }) {
  const control: [number, number] = [(from[0] + to[0]) / 2, Math.max(from[1], to[1]) + sag];
  return (
    <g className={className}>
      <path d={`M ${from[0]} ${from[1]} Q ${control[0]} ${control[1]} ${to[0]} ${to[1]}`} fill="none" stroke="#6b4a1a" strokeWidth="1.2" />
      {Array.from({ length: count }, (_, i) => {
        const [x, y] = along(from, control, to, (i + 0.5) / count);
        return <Flower key={i} x={x} y={y} r={4.6} petal={MARIGOLD[i % 2]!} />;
      })}
    </g>
  );
}
