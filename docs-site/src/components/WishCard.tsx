'use client';

import { useMemo, type CSSProperties } from 'react';
import { OccasionIcon } from '@/components/OccasionIcon';
import { getWebTemplateTheme } from '@/lib/templateThemes';
import { wishLayoutId, type WishLayoutId } from '@/lib/templateLayout';
import { wishGreeting, type RecipientCard } from '@/lib/recipientCard';

type Props = {
  card: RecipientCard;
  /** Compact layout for embeds. */
  compact?: boolean;
  replayKey?: number;
  onReplay?: () => void;
};

function CollageHero({
  layoutId,
  photos,
}: {
  layoutId: WishLayoutId;
  photos: string[];
}) {
  if (layoutId === 'film_strip') {
    return (
      <div className="wish-card-hero wish-card-hero--strip wish-reveal wish-reveal--photo">
        {[0, 1, 2].map((i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={photos[i]} alt="" className="wish-card-photo" />
        ))}
      </div>
    );
  }

  if (layoutId === 'asymmetric_split') {
    return (
      <div className="wish-card-hero wish-card-hero--asym wish-reveal wish-reveal--photo">
        <div className="wish-card-asym__top">
          <div className="wish-card-asym__left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt="" className="wish-card-photo" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[1]} alt="" className="wish-card-photo" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[2]} alt="" className="wish-card-photo wish-card-asym__tall" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[3]} alt="" className="wish-card-photo wish-card-asym__footer" />
      </div>
    );
  }

  if (layoutId === 'story_mosaic') {
    return (
      <div className="wish-card-hero wish-card-hero--mosaic wish-reveal wish-reveal--photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt="" className="wish-card-photo wish-card-mosaic__banner" />
        <div className="wish-card-mosaic__row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[1]} alt="" className="wish-card-photo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[2]} alt="" className="wish-card-photo" />
        </div>
        <div className="wish-card-mosaic__row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[3]} alt="" className="wish-card-photo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[4]} alt="" className="wish-card-photo" />
        </div>
      </div>
    );
  }

  if (layoutId === 'polaroid_overlay') {
    return (
      <div className="wish-card-hero wish-card-hero--polaroid wish-reveal wish-reveal--photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt="" className="wish-card-photo" />
        <div className="wish-card-polaroid-inset">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[1]} alt="" className="wish-card-photo" />
        </div>
      </div>
    );
  }

  return null;
}

const COLLAGE_LAYOUTS: WishLayoutId[] = [
  'film_strip',
  'asymmetric_split',
  'story_mosaic',
  'polaroid_overlay',
];

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
  const isCollage = COLLAGE_LAYOUTS.includes(layoutId);

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
        ) : isCollage && hasPhoto ? (
          <CollageHero layoutId={layoutId} photos={photos} />
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
