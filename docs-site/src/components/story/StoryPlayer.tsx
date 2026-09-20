'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { CardReaction } from '@/components/CardReaction';
import { OccasionStickerShower } from '@/components/OccasionStickerShower';
import { WishCard } from '@/components/WishCard';
import { BalloonPopScene } from '@/components/story/BalloonPopScene';
import { CandleScene } from '@/components/story/CandleScene';
import { GiftScene } from '@/components/story/GiftScene';
import { LetterScene } from '@/components/story/LetterScene';
import { PhotoDeckScene } from '@/components/story/PhotoDeckScene';
import { resolveExperience } from '@/lib/experience/resolveExperience';
import type { SceneId } from '@/lib/experience/types';
import type { RecipientCard } from '@/lib/recipientCard';

type Props = { card: RecipientCard; slug: string };

function ClassicFallback({ card, slug }: Props) {
  const [replayKey, setReplayKey] = useState(0);
  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  return (
    <div className="wish-recipient-page">
      <OccasionStickerShower
        templateType={card.templateType}
        replayKey={replayKey}
      />
      <div className="wish-recipient-inner">
        <p className="story-brand">Occasio</p>
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

export function StoryPlayer({ card, slug }: Props) {
  const resolved = useMemo(() => resolveExperience(card), [card]);
  const [index, setIndex] = useState(0);

  const scene: SceneId | null = resolved.scenes[index] ?? null;

  const advance = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(resolved.scenes.length - 1, 0)));
  }, [resolved.scenes.length]);

  if (resolved.mode === 'classic' || !scene) {
    return <ClassicFallback card={card} slug={slug} />;
  }

  return (
    <div className="wish-recipient-page story-player">
      <div className="wish-recipient-inner">
        <p className="story-brand">Occasio</p>
        <div
          className="story-progress"
          aria-label={`Step ${index + 1} of ${resolved.scenes.length}`}
        >
          {resolved.scenes.map((id, i) => (
            <span
              key={id}
              className={`story-progress__dot${i <= index ? ' is-on' : ''}`}
            />
          ))}
        </div>

        {scene === 'balloons' ? (
          <BalloonPopScene
            revealLine={resolved.revealLine}
            onComplete={advance}
          />
        ) : null}
        {scene === 'candle' ? (
          <CandleScene
            recipientName={card.recipientName}
            onComplete={advance}
          />
        ) : null}
        {scene === 'gift' ? (
          <GiftScene
            templateType={card.templateType}
            recipientName={card.recipientName}
            onComplete={advance}
          />
        ) : null}
        {scene === 'photo_deck' ? (
          <PhotoDeckScene urls={card.mediaUrls ?? []} onComplete={advance} />
        ) : null}
        {scene === 'letter' ? <LetterScene card={card} slug={slug} /> : null}

        {scene !== 'letter' ? (
          <button
            type="button"
            className="story-skip"
            onClick={() => setIndex(resolved.scenes.length - 1)}
          >
            Skip to message
          </button>
        ) : null}
      </div>
    </div>
  );
}
