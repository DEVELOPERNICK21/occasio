'use client';

import { useCallback, useState } from 'react';
import { CardReaction } from '@/components/CardReaction';
import { WishCard } from '@/components/WishCard';
import type { RecipientCard } from '@/lib/recipientCard';

type Props = { card: RecipientCard; slug: string; onContinue?: () => void };

export function LetterScene({ card, slug, onContinue }: Props) {
  const [replayKey, setReplayKey] = useState(0);
  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  return (
    <section className="story-letter">
      <h2 className="story-scene-title">A message for you</h2>
      <p className="story-scene-sub">Written just for this moment</p>
      <WishCard card={card} replayKey={replayKey} onReplay={handleReplay} />
      {card.isDemo ? (
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Preview card — create the link in the app for a real share URL.
        </p>
      ) : (
        <CardReaction slug={slug} initialCount={card.reactionCount ?? 0} />
      )}
      {onContinue ? (
        <div className="mt-8 text-center">
          <button type="button" className="landing-btn-primary" onClick={onContinue}>
            Continue
          </button>
        </div>
      ) : null}
    </section>
  );
}
