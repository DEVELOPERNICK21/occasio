'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import { CardReaction } from '@/components/CardReaction';
import { CelebrationCanvas, type CelebrationHandle } from '@/components/story/fx/CelebrationCanvas';
import { Pip } from '@/components/story/fx/Pip';
import { StickerReveal } from '@/components/story/fx/StickerReveal';
import { trackCardEvent } from '@/lib/cardEvents';
import type { MomentTheme } from '@/lib/experience/momentTheme';
import { playBoom, playTada } from '@/lib/experience/sfx';
import { wishGreeting } from '@/lib/recipientCard';
import type { RecipientCard } from '@/lib/recipientCard';

type Props = {
  card: RecipientCard;
  slug: string;
  theme: MomentTheme;
  stars: number;
  maxStars: number;
  onReplay: () => void;
};

const TAP_COOLDOWN_MS = 220;

/**
 * The peak-end moment. One choreographed show plays once; after that the
 * recipient is in control: tap anywhere for a small pop in this moment's
 * style. Nothing loops on its own.
 */
export function FinaleScene({ card, slug, theme, stars, maxStars, onReplay }: Props) {
  const fx = useRef<CelebrationHandle>(null);
  const lastTap = useRef(0);
  const name = card.recipientName.trim();

  useEffect(() => {
    trackCardEvent(slug, 'finished', card.isDemo);
    playTada();
    const timers: number[] = [];
    if (theme.fx === 'fireworks') {
      [900, 1500, 2200, 2900].forEach((ms) => timers.push(window.setTimeout(playBoom, ms)));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [slug, card.isDemo, theme.fx]);

  const pop = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest('button, a')) return;
      const now = performance.now();
      if (now - lastTap.current < TAP_COOLDOWN_MS) return;
      lastTap.current = now;
      fx.current?.burst({ x: event.clientX, y: event.clientY }, 0.8);
      if (theme.fx === 'fireworks') playBoom();
    },
    [theme.fx],
  );

  const replay = () => {
    trackCardEvent(slug, 'replayed', card.isDemo);
    onReplay();
  };

  return (
    <section className="finale" onPointerDown={pop} aria-label="Finale">
      <CelebrationCanvas ref={fx} preset={theme.fx} colors={theme.palette} fixed autoBurst />

      <div className="finale__hero">
        <Pip mood="joy" theme={theme} size={176} />
        <p className="finale__greeting">{wishGreeting(card.templateType)}</p>
        <h2 className="finale__name" aria-label={name}>
          {name.split('').map((ch, i) => (
            <span key={i} style={{ animationDelay: `${0.5 + i * 0.05}s` }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </h2>
        {card.fromName ? (
          <p className="finale__from">Made with love by {card.fromName}</p>
        ) : null}
      </div>

      <StickerReveal
        theme={theme}
        stars={stars}
        maxStars={maxStars}
        onReveal={(at) => fx.current?.burst(at, 1)}
      />

      <div className="finale__actions">
        {card.isDemo ? null : (
          <CardReaction slug={slug} initialCount={card.reactionCount ?? 0} />
        )}
        <button type="button" className="landing-btn-secondary" onClick={replay}>
          Replay the surprise
        </button>
      </div>

      <div className="finale__loop">
        <p>Someone made this for you. Make one for someone you love.</p>
        <Link
          href={`/?ref=${encodeURIComponent(slug)}`}
          className="landing-btn-primary"
          onClick={() => trackCardEvent(slug, 'cta', card.isDemo)}
        >
          Make one on Occasio
        </Link>
      </div>
      <p className="finale__tap-hint">Tap anywhere for a little more</p>
    </section>
  );
}
