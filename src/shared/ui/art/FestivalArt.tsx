import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import data from './festivalMotifs.json';

type Shape = Record<string, number | string | undefined> & { k: 'p' | 'c' | 'e' | 'r' };

const MOTIFS = data.motifs as unknown as Record<string, Shape[]>;

export function hasMotif(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(MOTIFS, id);
}

type Props = {
  /** The name of a drawing, such as "diya" or "tree". */
  motif: string;
  size?: number;
  /** Shows the flame, glow or lights. Drawings with none look the same either way. */
  lit?: boolean;
};

/**
 * A festival drawing, from the same file the recipient's page draws from
 * (`scripts/art/festival-motifs.mjs` writes both). Colours are part of the drawing, not the theme.
 */
export function FestivalArt({ motif, size = 40, lit = true }: Props) {
  const shapes = hasMotif(motif) ? MOTIFS[motif]! : [];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {shapes.map((shape, i) => {
        if (shape.lit && !lit) return null;
        if (shape.dim && lit) return null;
        const paint = {
          fill: (shape.f as string | undefined) ?? 'none',
          stroke: shape.s as string | undefined,
          strokeWidth: shape.w as number | undefined,
          strokeLinecap: shape.round ? ('round' as const) : undefined,
          strokeLinejoin: shape.round ? ('round' as const) : undefined,
          opacity: shape.o as number | undefined,
        };
        switch (shape.k) {
          case 'p':
            return <Path key={i} d={shape.d as string} {...paint} />;
          case 'c':
            return <Circle key={i} cx={shape.cx as number} cy={shape.cy as number} r={shape.r as number} {...paint} />;
          case 'e':
            return (
              <Ellipse key={i} cx={shape.cx as number} cy={shape.cy as number} rx={shape.rx as number} ry={shape.ry as number} {...paint} />
            );
          case 'r':
            return (
              <Rect
                key={i}
                x={shape.x as number}
                y={shape.y as number}
                width={shape.w as number}
                height={shape.h as number}
                rx={(shape.rx as number | undefined) ?? 0}
                {...paint}
              />
            );
          default:
            return null;
        }
      })}
    </Svg>
  );
}
