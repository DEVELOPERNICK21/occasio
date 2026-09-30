'use client';

import { useState } from 'react';
import {
  addToStickerBook,
  bookProgress,
  pickSticker,
  tierFor,
  type Sticker,
} from '@/lib/experience/joy';
import type { MomentTheme } from '@/lib/experience/momentTheme';
import { playShimmer, playTada } from '@/lib/experience/sfx';

type Props = {
  theme: MomentTheme;
  stars: number;
  maxStars: number;
  onReveal?: (at: { x: number; y: number }) => void;
};

const TIER_COPY = {
  bronze: 'Nice start',
  silver: 'Great playing',
  gold: 'Full sparkle',
} as const;

/** A sealed sticker pack. The tap is the reward: rarer stickers follow better play. */
export function StickerReveal({ theme, stars, maxStars, onReveal }: Props) {
  const tier = tierFor(stars, maxStars);
  const [state, setState] = useState<{
    sticker: Sticker;
    isNew: boolean;
    owned: number;
    total: number;
  } | null>(null);

  const open = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (state) return;
    const sticker = pickSticker(theme.id, tier);
    const { isNew, book } = addToStickerBook(sticker.id);
    const { owned, total } = bookProgress(book);
    setState({ sticker, isNew, owned, total });
    if (sticker.rarity === 'common') playShimmer();
    else playTada();
    const rect = event.currentTarget.getBoundingClientRect();
    onReveal?.({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return (
    <div className={`sticker-reveal tier-${tier}${state ? ' is-open' : ''}`}>
      <button
        type="button"
        className="sticker-pack"
        onClick={open}
        disabled={Boolean(state)}
        aria-label={state ? `${state.sticker.name} sticker` : 'Open your sticker pack'}
      >
        <span className="sticker-pack__face sticker-pack__face--front" aria-hidden>
          <span className="sticker-pack__shine" />
          <span className="sticker-pack__mark">?</span>
        </span>
        <span className="sticker-pack__face sticker-pack__face--back" aria-hidden>
          <span className="sticker-pack__emoji">{state?.sticker.emoji}</span>
        </span>
      </button>

      {state ? (
        <div className="sticker-reveal__meta" role="status">
          <p className="sticker-reveal__name">
            {state.sticker.name}
            <span className={`sticker-chip rarity-${state.sticker.rarity}`}>
              {state.sticker.rarity}
            </span>
            {state.isNew ? <span className="sticker-chip is-new">New</span> : null}
          </p>
          <p className="sticker-reveal__book">
            Sticker book {state.owned}/{state.total}
          </p>
        </div>
      ) : (
        <p className="sticker-reveal__prompt">
          {TIER_COPY[tier]} · {stars} {theme.starName}. Tap to open your sticker
        </p>
      )}
    </div>
  );
}
