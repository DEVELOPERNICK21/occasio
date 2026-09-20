'use client';

import { useMemo, type CSSProperties } from 'react';
import { OccasionIcon } from '@/components/OccasionIcon';
import { getWebTemplateTheme } from '@/lib/templateThemes';
import { wishLayoutId } from '@/lib/templateLayout';
import { wishGreeting, type RecipientCard } from '@/lib/recipientCard';

type Props = {
  card: RecipientCard;
  /** Compact layout for embeds. */
  compact?: boolean;
  replayKey?: number;
  onReplay?: () => void;
};

export function WishCard({
  card,
  compact = false,
  replayKey = 0,
  onReplay,
}: Props) {
  const photos = useMemo(
    () => (card.mediaUrls ?? []).filter(Boolean),
    [card.mediaUrls],
  );
  const hasPhoto = photos.length > 0;
  const layoutId = wishLayoutId(card.templateId, photos.length);
  const theme = useMemo(() => getWebTemplateTheme(card.templateType), [card.templateType]);
  const greeting = wishGreeting(card.templateType);
  const displayName = card.recipientName.trim() || 'Someone special';

  const rootStyle = {
    '--wish-accent': theme.accent,
    '--wish-accent-secondary': theme.accentSecondary,
    '--wish-soft': theme.softBackground,
  } as CSSProperties;

  const body = (
    <div className="wish-card-body">
      <div className="wish-reveal wish-reveal--occasion">
        <p className="wish-card-greeting">{greeting}</p>
        <div className="wish-card-divider" aria-hidden>
          <span className="wish-card-divider__spark" />
        </div>
      </div>
      <h1 className="wish-card-name wish-reveal wish-reveal--name">{displayName}</h1>
      <div className="wish-reveal wish-reveal--message">
        {card.message ? (
          <p className="wish-card-message">{card.message}</p>
        ) : (
          <p className="wish-card-placeholder">A personalized wish is on its way.</p>
        )}
        {card.fromName ? (
          <p className="wish-card-signoff">
            <span className="wish-card-signoff__label">With love</span>
            {card.fromName}
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <div
      className={`wish-card-root ${compact ? 'wish-card-root--compact' : ''}`}
      data-template={card.templateType}
      data-layout={layoutId}
      style={rootStyle}
    >
      <article
        key={replayKey}
        className={`wish-card ${compact ? 'wish-card--compact' : ''} ${hasPhoto ? 'wish-card--photo' : 'wish-card--plain'}`}
      >
        {layoutId === 'minimal_fullscreen' && hasPhoto ? (
          <div className="wish-card-hero wish-card-hero--full wish-reveal wish-reveal--photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt="" className="wish-card-photo" />
            <div className="wish-card-overlay">
              <p className="wish-card-greeting">{greeting}</p>
              <h1 className="wish-card-name">{displayName}</h1>
            </div>
          </div>
        ) : layoutId === 'dual_editorial' ? (
          <div className="wish-card-hero wish-card-hero--dual wish-reveal wish-reveal--photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt="" className="wish-card-photo" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[1]} alt="" className="wish-card-photo" />
          </div>
        ) : hasPhoto ? (
          <div className="wish-card-hero wish-reveal wish-reveal--photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt="" className="wish-card-photo" />
          </div>
        ) : (
          <div
            className="wish-card-hero wish-card-hero--plain wish-reveal wish-reveal--photo"
            aria-hidden
          >
            <OccasionIcon templateType={card.templateType} className="wish-card-hero-icon" />
          </div>
        )}

        {layoutId === 'minimal_fullscreen' && hasPhoto ? (
          <div className="wish-card-body wish-card-body--quiet wish-reveal wish-reveal--message">
            {card.message ? (
              <p className="wish-card-message">{card.message}</p>
            ) : null}
            {card.fromName ? (
              <p className="wish-card-signoff">
                <span className="wish-card-signoff__label">With love</span>
                {card.fromName}
              </p>
            ) : null}
          </div>
        ) : (
          body
        )}
      </article>

      {onReplay ? (
        <button type="button" className="wish-card-replay" onClick={onReplay}>
          Replay
        </button>
      ) : null}
    </div>
  );
}
