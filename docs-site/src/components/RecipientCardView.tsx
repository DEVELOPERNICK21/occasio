'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { CardReaction } from '@/components/CardReaction';
import { OccasionStickerShower } from '@/components/OccasionStickerShower';
import { WishCard } from '@/components/WishCard';
import { StoryPlayer } from '@/components/story/StoryPlayer';
import { resolveExperience } from '@/lib/experience/resolveExperience';
import type { RecipientCard } from '@/lib/recipientCard';

type Props = {
  card: RecipientCard;
  slug: string;
};

export function RecipientCardView({ card, slug }: Props) {
  const [replayKey, setReplayKey] = useState(0);
  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  try {
    const resolved = resolveExperience(card);
    if (resolved.mode === 'story') {
      return <StoryPlayer card={card} slug={slug} />;
    }
  } catch {
    // fall through to classic
  }

  return (
    <div className="wish-recipient-page">
      <OccasionStickerShower
        templateType={card.templateType}
        replayKey={replayKey}
      />
      <div className="wish-recipient-inner">
        <p className="mb-6 text-center text-xs font-medium tracking-wide text-[var(--accent)]">
          Occasio
        </p>

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
      </div>
    </div>
  );
}
