'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { CardReaction } from '@/components/CardReaction';
import { OccasionStickerShower } from '@/components/OccasionStickerShower';
import { WishCard } from '@/components/WishCard';
import type { RecipientCard } from '@/lib/recipientCard';

type Props = { card: RecipientCard; slug: string };

export function LetterScene({ card, slug }: Props) {
  const [replayKey, setReplayKey] = useState(0);
  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  return (
    <section className="story-letter">
      <h2 className="story-scene-title">A message for you</h2>
      <OccasionStickerShower
        templateType={card.templateType}
        replayKey={replayKey}
      />
      <WishCard card={card} replayKey={replayKey} onReplay={handleReplay} />
      {card.isDemo ? (
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Preview card — create the link in the app for a real share URL.
        </p>
      ) : (
        <CardReaction slug={slug} initialCount={card.reactionCount ?? 0} />
      )}
      <div className="mt-8 text-center">
        <Link href="/" className="landing-btn-primary">
          Make one for someone
        </Link>
      </div>
    </section>
  );
}
