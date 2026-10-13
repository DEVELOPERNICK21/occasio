import type { CSSProperties } from 'react';
import { flagLayout, wishText } from '@/lib/experience/giftWish';

type Props = {
  templateType: string;
};

/**
 * The wish, spelled in bold letters on bunting that springs out of the opened gift,
 * a flag at a time. Real text, not part of the 3D scene, so it is crisp, easy to
 * read, and works the same on the flat fallback gift. The words are read out by the
 * scene itself (see `wishText`), so the flags are hidden from screen readers.
 */
export function GiftWishBanner({ templateType }: Props) {
  const { maxCount, flags } = flagLayout(templateType);
  const rows = Array.from(new Set(flags.map((flag) => flag.row)));

  return (
    <div
      className="gift-banner"
      aria-hidden
      data-wish={wishText(templateType)}
      style={{ '--maxn': maxCount } as CSSProperties}
    >
      {rows.map((row) => {
        const rope = flags.filter((flag) => flag.row === row);
        return (
          <div
            key={row}
            className="gift-banner__row"
            style={{ '--row': row, '--mid': (rope.length - 1) / 2 } as CSSProperties}
          >
            {rope.map((flag) => (
              <span
                key={flag.order}
                className="gift-banner__flag"
                style={
                  {
                    '--i': flag.index,
                    '--k': flag.order,
                    '--c': flag.color,
                    '--tilt': flag.tilt,
                    '--drop': flag.drop,
                    '--spin': `${(flag.order % 2 === 0 ? 1 : -1) * (150 + flag.order * 17)}deg`,
                  } as CSSProperties
                }
              >
                <span className="gift-banner__cloth">{flag.char}</span>
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
