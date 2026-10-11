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
  greeting,
  displayName,
}: {
  layoutId: WishLayoutId;
  photos: string[];
  greeting: string;
  displayName: string;
}) {
  const heading = greeting.replace(/[,.]\s*$/, '');

  if (layoutId === 'scrapbook') {
    return (
      <div className="wish-card-hero wish-card-hero--scrap wish-reveal wish-reveal--photo">
        {[0, 1, 2].map((i) => (
          <figure key={i} className={`wish-card-scrap__print wish-card-scrap__print--${i}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[i]} alt="" className="wish-card-photo" />
            <span className="wish-card-scrap__tape" />
          </figure>
        ))}
      </div>
    );
  }

  if (layoutId === 'poster_type') {
    return (
      <div className="wish-card-hero wish-card-hero--poster wish-reveal wish-reveal--photo">
        <p className="wish-card-poster__word">{heading}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt="" className="wish-card-photo" />
        <p className="wish-card-poster__word">{displayName}</p>
      </div>
    );
  }

  if (layoutId === 'big_words') {
    const words = heading
      .toLowerCase()
      .replace(/[,.!]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4);
    return (
      <div className="wish-card-hero wish-card-hero--words wish-reveal wish-reveal--photo">
        {[0, 1, 2, 3].map((i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={photos[i]} alt="" className="wish-card-photo" />
        ))}
        <div className="wish-card-words" aria-hidden>
          {words.map((word, i) => (
            <span key={`${word}-${i}`}>{word}</span>
          ))}
        </div>
      </div>
    );
  }

  if (layoutId === 'framed_blur') {
    return (
      <div className="wish-card-hero wish-card-hero--framed wish-reveal wish-reveal--photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt="" className="wish-card-photo wish-card-framed__blur" />
        <figure className="wish-card-framed__mount">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[0]} alt="" className="wish-card-photo" />
          <figcaption>{heading}</figcaption>
        </figure>
      </div>
    );
  }

  if (layoutId === 'contact_sheet') {
    const frameNumbers = ['1A', '2', '2A', '3', '3A'];
    return (
      <div className="wish-card-hero wish-card-hero--sheet wish-reveal wish-reveal--photo">
        <p className="wish-card-sheet__edge">OCCASIO 400 ▸ 5 ▸ 5A ▸ 6</p>
        <div className="wish-card-sheet__body">
          <span className="wish-card-sheet__holes" aria-hidden />
          <div className="wish-card-sheet__grid">
            {frameNumbers.map((number, i) => (
              <div key={number} className="wish-card-sheet__frame">
                <span className="wish-card-sheet__number">{number}</span>
                <div className="wish-card-sheet__cell">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photos[i]} alt="" className="wish-card-photo" />
                </div>
                {i === 0 ? (
                  <svg
                    className="wish-card-sheet__pencil"
                    viewBox="0 0 100 80"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path d="M6 40 C4 14 38 4 70 7 C98 11 99 58 68 71 C38 82 5 70 8 38 C9 26 18 18 30 16" />
                  </svg>
                ) : null}
              </div>
            ))}
            <div className="wish-card-sheet__frame">
              <span className="wish-card-sheet__number">4</span>
              <div className="wish-card-sheet__cell wish-card-sheet__cell--note">
                <span>{heading}</span>
              </div>
            </div>
          </div>
          <span className="wish-card-sheet__holes" aria-hidden />
        </div>
      </div>
    );
  }

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

/** Layouts that set their own words as well as the photos, so they replace the shared body. */
const EXPRESSIVE_LAYOUTS: WishLayoutId[] = [
  'cinema_still',
  'handwritten_note',
  'postcard',
  'photo_booth',
];

const HEART_PATH =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

function ExpressiveCard({
  layoutId,
  photos,
  greeting,
  displayName,
  message,
  fromName,
}: {
  layoutId: WishLayoutId;
  photos: string[];
  greeting: string;
  displayName: string;
  message: string;
  fromName: string;
}) {
  const heading = greeting.replace(/[,.]\s*$/, '');

  if (layoutId === 'cinema_still') {
    return (
      <>
        <div className="wish-card-cinema__title wish-reveal wish-reveal--occasion">
          <p className="wish-card-cinema__tagline">{heading}</p>
          <h1 className="wish-card-cinema__name">{displayName}</h1>
        </div>
        <div className="wish-card-hero wish-card-hero--cinema wish-reveal wish-reveal--photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[0]} alt="" className="wish-card-photo" />
          {['tl', 'tr', 'bl', 'br'].map((corner) => (
            <i key={corner} className={`wish-card-cinema__corner wish-card-cinema__corner--${corner}`} aria-hidden />
          ))}
        </div>
        <div className="wish-card-cinema__credits wish-reveal wish-reveal--message">
          {message ? <p className="wish-card-cinema__message">{message}</p> : null}
          {fromName ? (
            <p className="wish-card-cinema__directed">
              Directed by <strong>{fromName}</strong>
            </p>
          ) : null}
        </div>
      </>
    );
  }

  if (layoutId === 'handwritten_note') {
    return (
      <div className="wish-card-note">
        <div className="wish-card-note__header">
          <div className="wish-card-note__greeting wish-reveal wish-reveal--name">
            <p className="wish-card-note__occasion">{heading}</p>
            <h1 className="wish-card-note__name">Dear {displayName},</h1>
          </div>
          <figure className="wish-card-note__print wish-reveal wish-reveal--photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt="" className="wish-card-photo" />
            <span className="wish-card-note__tape" aria-hidden />
          </figure>
        </div>
        <div className="wish-reveal wish-reveal--message">
          {message ? <p className="wish-card-note__message">{message}</p> : null}
          {fromName ? <p className="wish-card-note__signoff">with love, {fromName}</p> : null}
        </div>
      </div>
    );
  }

  if (layoutId === 'postcard') {
    return (
      <div className="wish-card-postcard">
        <figure className="wish-card-postcard__front wish-reveal wish-reveal--photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[0]} alt="" className="wish-card-photo" />
          <figcaption>{heading}</figcaption>
        </figure>
        <div className="wish-card-postcard__back wish-reveal wish-reveal--message">
          <div className="wish-card-postcard__message">
            {message ? <p>{message}</p> : null}
            {fromName ? <p className="wish-card-postcard__signoff">with love, {fromName}</p> : null}
          </div>
          <div className="wish-card-postcard__address">
            <div className="wish-card-postcard__stamps" aria-hidden>
              <span className="wish-card-postcard__stamp">
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path d={HEART_PATH} />
                </svg>
              </span>
              <span className="wish-card-postcard__postmark">OCCASIO</span>
            </div>
            <h1 className="wish-card-postcard__name">{displayName}</h1>
            <span className="wish-card-postcard__rule" aria-hidden />
            <span className="wish-card-postcard__rule" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  // photo_booth
  return (
    <div className="wish-card-booth">
      <div className="wish-card-booth__strip wish-reveal wish-reveal--photo">
        {[0, 1, 2].map((i) => (
          <div key={i} className="wish-card-booth__shot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[i]} alt="" className="wish-card-photo" />
          </div>
        ))}
        <div className="wish-card-booth__shot wish-card-booth__shot--caption">
          <span>{heading}</span>
        </div>
      </div>
      <div className="wish-card-booth__copy">
        <p className="wish-card-booth__kicker wish-reveal wish-reveal--occasion">{heading}</p>
        <div className="wish-reveal wish-reveal--name">
          <h1 className="wish-card-booth__name">{displayName}</h1>
          <span className="wish-card-booth__rule" aria-hidden />
        </div>
        <div className="wish-reveal wish-reveal--message">
          {message ? <p className="wish-card-booth__message">{message}</p> : null}
          {fromName ? <p className="wish-card-booth__signoff">with love, {fromName}</p> : null}
        </div>
      </div>
    </div>
  );
}

const COLLAGE_LAYOUTS: WishLayoutId[] = [
  'film_strip',
  'asymmetric_split',
  'story_mosaic',
  'polaroid_overlay',
  'scrapbook',
  'poster_type',
  'big_words',
  'framed_blur',
  'contact_sheet',
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
  const isExpressive = hasPhoto && EXPRESSIVE_LAYOUTS.includes(layoutId);

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
        {isExpressive ? (
          <ExpressiveCard
            layoutId={layoutId}
            photos={photos}
            greeting={greeting}
            displayName={displayName}
            message={card.message ?? ''}
            fromName={card.fromName ?? ''}
          />
        ) : layoutId === 'minimal_fullscreen' && hasPhoto ? (
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
          <CollageHero
            layoutId={layoutId}
            photos={photos}
            greeting={greeting}
            displayName={displayName}
          />
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

        {isExpressive ? null : layoutId === 'minimal_fullscreen' && hasPhoto ? (
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
