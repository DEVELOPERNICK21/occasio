'use client';

import { useCallback, useState } from 'react';
import { templateLabel, type RecipientCard } from '@/lib/recipientCard';

type Props = {
  card: RecipientCard;
  /** Compact layout for embeds. */
  compact?: boolean;
};

export function WishCard({ card, compact = false }: Props) {
  const hasPhoto = Boolean(card.mediaUrls?.length);
  const photoSrc = card.mediaUrls?.[0];
  const [replayKey, setReplayKey] = useState(0);

  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  return (
    <div className={`wish-card-root ${compact ? 'wish-card-root--compact' : ''}`}>
      <div className="wish-card-orb wish-card-orb--a" aria-hidden />
      <div className="wish-card-orb wish-card-orb--b" aria-hidden />

      <article
        key={replayKey}
        className={`wish-card ${compact ? 'wish-card--compact' : ''}`}
      >
        <div
          className={`wish-card-media ${hasPhoto ? 'wish-card-media--photo' : 'wish-card-media--plain'}`}
        >
          {hasPhoto && photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={`Wish for ${card.recipientName}`}
              className="wish-card-photo"
            />
          ) : null}
          <div className="wish-card-scrim" />
          <div className="wish-card-content">
            <p className="wish-card-badge">
              <span className="wish-card-badge-dot" aria-hidden />
              {templateLabel(card.templateType)}
            </p>
            <h1 className="wish-card-name">{card.recipientName}</h1>
            {card.message ? (
              <p className="wish-card-message">{card.message}</p>
            ) : !hasPhoto ? (
              <p className="wish-card-placeholder">A personalized wish is on its way.</p>
            ) : null}
          </div>
        </div>

        {card.fromName ? (
          <p className="wish-card-from">From {card.fromName}</p>
        ) : null}
      </article>

      <button type="button" className="wish-card-replay" onClick={handleReplay}>
        Replay animation
      </button>
    </div>
  );
}
