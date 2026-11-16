import data from '@/lib/festivalMotifs.json';

/** One shape of a drawing, as written by `scripts/art/festival-motifs.mjs`. */
type Shape = {
  k: 'p' | 'c' | 'e' | 'r';
  f?: string;
  s?: string;
  w?: number;
  o?: number;
  round?: number;
  lit?: number;
  dim?: number;
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  rx?: number;
  ry?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  w_?: number;
};

type RectShape = Shape & { x: number; y: number; w: number; h: number; rx?: number };

const MOTIFS = data.motifs as unknown as Record<string, Array<Record<string, unknown>>>;

export type MotifId = keyof typeof data.motifs;

export function hasMotif(id: string): id is MotifId {
  return Object.prototype.hasOwnProperty.call(MOTIFS, id);
}

/** The shapes of one drawing, to place inside any `<svg>` (a costume, a garland, a backdrop item). */
export function MotifShapes({ motif, lit = true }: { motif: string; lit?: boolean }) {
  const shapes = hasMotif(motif) ? MOTIFS[motif]! : [];
  return (
    <>
      {shapes.map((raw, i) => {
        const shape = raw as unknown as Shape & Record<string, number | string | undefined>;
        if (shape.lit && !lit) return null;
        if (shape.dim && lit) return null;
        const common = {
          fill: shape.f ?? 'none',
          stroke: shape.s,
          strokeWidth: shape.w,
          strokeLinecap: shape.round ? ('round' as const) : undefined,
          strokeLinejoin: shape.round ? ('round' as const) : undefined,
          opacity: shape.o,
        };
        switch (shape.k) {
          case 'p':
            return <path key={i} d={shape.d} {...common} />;
          case 'c':
            return <circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />;
          case 'e':
            return <ellipse key={i} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />;
          case 'r': {
            const r = raw as unknown as RectShape;
            return <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx} {...common} />;
          }
          default:
            return null;
        }
      })}
    </>
  );
}

/**
 * A festival drawing. `lit` shows the glow, flame or lights (a lamp that is lit, a tree with its stars on);
 * unlit shows the same thing switched off. Drawings with no light look the same either way.
 */
export function FestivalArt({
  motif,
  lit = true,
  size,
  className,
  label,
}: {
  motif: string;
  lit?: boolean;
  size?: number | string;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      width={size ?? '100%'}
      height={size ?? '100%'}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <MotifShapes motif={motif} lit={lit} />
    </svg>
  );
}
