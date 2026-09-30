'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CardReaction } from '@/components/CardReaction';
import { OccasionStickerShower } from '@/components/OccasionStickerShower';
import { WishCard } from '@/components/WishCard';
import { BalloonPopScene } from '@/components/story/BalloonPopScene';
import { CandleScene } from '@/components/story/CandleScene';
import { ContractScene } from '@/components/story/ContractScene';
import { FinaleScene } from '@/components/story/FinaleScene';
import { GateScene } from '@/components/story/GateScene';
import { GiftScene } from '@/components/story/GiftScene';
import { HubScene } from '@/components/story/HubScene';
import { LampScene } from '@/components/story/LampScene';
import { JoyHud, JoyProvider, useJoy } from '@/components/story/fx/JoyProvider';
import { MomentBackdrop } from '@/components/story/fx/MomentBackdrop';
import { trackCardEvent } from '@/lib/cardEvents';
import { resolveExperience } from '@/lib/experience/resolveExperience';
import { starCapacity } from '@/lib/experience/joy';
import { momentThemeFor } from '@/lib/experience/momentTheme';
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
  const max = useMemo(
    () =>
      starCapacity(resolved.scenes, {
        reasons: (card.reasons ?? []).filter((r) => r.trim()).length,
        photos: (card.mediaUrls ?? []).length,
      }),
    [resolved.scenes, card.reasons, card.mediaUrls],
  );

  if (resolved.mode === 'classic' || resolved.scenes.length === 0) {
    return <ClassicFallback card={card} slug={slug} />;
  }

  return (
    <JoyProvider max={max}>
      <StoryStage card={card} slug={slug} />
    </JoyProvider>
  );
}

function StoryStage({ card, slug }: Props) {
  const resolved = useMemo(() => resolveExperience(card), [card]);
  const theme = useMemo(() => momentThemeFor(card.templateType), [card.templateType]);
  const { award, stars, max } = useJoy();
  const [index, setIndex] = useState(0);
  const [demoRoom, setDemoRoom] = useState<'photos' | 'reasons' | 'letter' | null>(null);

  // Demo cards only: `?scene=gift` jumps straight to a scene so each one can be reviewed.
  useEffect(() => {
    if (!card.isDemo) return;
    const wanted = new URLSearchParams(window.location.search).get('scene');
    const at = wanted ? resolved.scenes.indexOf(wanted as SceneId) : -1;
    if (at > 0) setIndex(at);
    const room = new URLSearchParams(window.location.search).get('room');
    if (room === 'photos' || room === 'reasons' || room === 'letter') setDemoRoom(room);
  }, [card.isDemo, resolved.scenes]);

  const scene: SceneId | null = resolved.scenes[index] ?? null;

  const advance = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(resolved.scenes.length - 1, 0)));
  }, [resolved.scenes.length]);

  if (!scene) {
    return <ClassicFallback card={card} slug={slug} />;
  }

  const hubIndex = Math.max(resolved.scenes.indexOf('hub'), 0);
  const skipToMessage = () => setIndex(hubIndex);
  const firstStoryIndex = Math.max(resolved.scenes.indexOf('lamp'), 0);
  const replay = () => setIndex(firstStoryIndex);
  // The gate and finale bookend the story; progress counts only the scenes between.
  const bookends = resolved.scenes.filter((id) => id === 'gate' || id === 'finale').length;
  const showProgress = scene !== 'gate' && scene !== 'finale';

  if (scene === 'lamp') {
    return (
      <LampScene
        recipientName={card.recipientName}
        templateType={card.templateType}
        step={index}
        total={resolved.scenes.length - bookends}
        onComplete={() => {
          award('lamp');
          advance();
        }}
        onSkip={skipToMessage}
      />
    );
  }

  return (
    <div
      className={`wish-recipient-page story-player story-themed story-theme--${theme.id}`}
      style={theme.vars as CSSProperties}
    >
      <MomentBackdrop theme={theme} />
      {scene !== 'gate' && scene !== 'finale' ? <JoyHud /> : null}

      <div className="wish-recipient-inner">
        {scene !== 'gate' ? <p className="story-brand">Occasio</p> : null}
        {showProgress ? (
          <div
            className="story-progress"
            aria-label={`Step ${index} of ${resolved.scenes.length - bookends}`}
          >
            {resolved.scenes.map((id, i) =>
              id === 'gate' || id === 'finale' ? null : (
                <span
                  key={id}
                  className={`story-progress__dot${i <= index ? ' is-on' : ''}`}
                />
              ),
            )}
          </div>
        ) : null}

        {scene === 'gate' ? (
          <GateScene
            theme={theme}
            recipientName={card.recipientName}
            fromName={card.fromName}
            onComplete={() => {
              trackCardEvent(slug, 'opened', card.isDemo);
              advance();
            }}
          />
        ) : null}
        {scene === 'balloons' ? (
          <BalloonPopScene
            revealLine={resolved.revealLine}
            templateType={card.templateType}
            onComplete={advance}
          />
        ) : null}
        {scene === 'candle' ? (
          <CandleScene
            recipientName={card.recipientName}
            templateType={card.templateType}
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
        {scene === 'contract' ? (
          <ContractScene
            fromName={card.fromName}
            recipientName={card.recipientName}
            onComplete={advance}
          />
        ) : null}
        {scene === 'hub' ? (
          <HubScene
            card={card}
            slug={slug}
            theme={theme}
            initialRoom={demoRoom}
            onComplete={advance}
          />
        ) : null}
        {scene === 'finale' ? (
          <FinaleScene
            card={card}
            slug={slug}
            theme={theme}
            stars={stars}
            maxStars={max}
            onReplay={replay}
          />
        ) : null}

        {scene !== 'gate' && scene !== 'finale' && scene !== 'hub' ? (
          <button
            type="button"
            className="story-skip"
            onClick={skipToMessage}
          >
            Skip to message
          </button>
        ) : null}
      </div>
    </div>
  );
}
