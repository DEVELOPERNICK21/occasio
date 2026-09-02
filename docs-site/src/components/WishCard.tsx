'use client';

import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { OccasionIcon } from '@/components/OccasionIcon';
import { getWebTemplateTheme } from '@/lib/templateThemes';
import { templateLabel, type RecipientCard } from '@/lib/recipientCard';

type Props = {
  card: RecipientCard;
  /** Compact layout for embeds. */
  compact?: boolean;
};

function wishGreeting(templateType: string): string {
  const label = templateLabel(templateType);
  switch (templateType) {
    case 'sorry':
      return 'Thinking of you,';
    case 'proposal':
      return 'For you,';
    case 'anniversary':
      return 'Happy anniversary,';
    default:
      return `Happy ${label},`;
  }
}

export function WishCard({ card, compact = false }: Props) {
  const hasPhoto = Boolean(card.mediaUrls?.length);
  const photoSrc = card.mediaUrls?.[0];
  const [replayKey, setReplayKey] = useState(0);
  const theme = useMemo(() => getWebTemplateTheme(card.templateType), [card.templateType]);
  const greeting = wishGreeting(card.templateType);
  const displayName = card.recipientName.trim() || 'Someone special';

  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  const rootStyle = {
    '--wish-accent': theme.accent,
    '--wish-accent-secondary': theme.accentSecondary,
    '--wish-soft': theme.softBackground,
  } as CSSProperties;

  return (
    <div
      className={`wish-card-root ${compact ? 'wish-card-root--compact' : ''}`}
      data-template={card.templateType}
      style={rootStyle}
    >
      <article
        key={replayKey}
        className={`wish-card ${compact ? 'wish-card--compact' : ''} ${hasPhoto ? 'wish-card--photo' : 'wish-card--plain'}`}
      >
        {hasPhoto && photoSrc ? (
          <div className="wish-card-hero">
            {/* Base64 data URLs — next/image not suitable here */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoSrc}
              alt=""
              className="wish-card-photo"
            />
          </div>
        ) : (
          <div className="wish-card-hero wish-card-hero--plain" aria-hidden>
            <OccasionIcon templateType={card.templateType} className="wish-card-hero-icon" />
          </div>
        )}

        <div className="wish-card-body">
          <OccasionIcon templateType={card.templateType} className="wish-card-icon" />
          <p className="wish-card-greeting">{greeting}</p>
          <h1 className="wish-card-name">{displayName}</h1>
          {card.message ? (
            <p className="wish-card-message">{card.message}</p>
          ) : (
            <p className="wish-card-placeholder">A personalized wish is on its way.</p>
          )}
          {card.fromName ? (
            <p className="wish-card-signoff">With love, {card.fromName}</p>
          ) : null}
        </div>
      </article>

      <button type="button" className="wish-card-replay" onClick={handleReplay}>
        Replay animation
      </button>
    </div>
  );
}
