'use client';

import { useCallback, useMemo, useState } from 'react';
import { CameraIcon, EnvelopeIcon, JarIcon } from '@/components/story/fx/HubIcons';
import { useJoy } from '@/components/story/fx/JoyProvider';
import { Pip } from '@/components/story/fx/Pip';
import { EnvelopeScene } from '@/components/story/EnvelopeScene';
import { LetterScene } from '@/components/story/LetterScene';
import { LetterWriteScene } from '@/components/story/LetterWriteScene';
import { PhotoLineScene } from '@/components/story/PhotoLineScene';
import { PhotoDeckScene } from '@/components/story/PhotoDeckScene';
import { ReasonsScene } from '@/components/story/ReasonsScene';
import { TapToContinue } from '@/components/story/fx/TapToContinue';
import type { MomentTheme } from '@/lib/experience/momentTheme';
import { storyCopyFor } from '@/lib/experience/storyCopy';
import { playTap } from '@/lib/experience/sfx';
import type { RecipientCard } from '@/lib/recipientCard';

type Room = 'photos' | 'reasons' | 'letter';
type LetterStep = 'envelope' | 'write' | 'read';

type Props = {
  card: RecipientCard;
  slug: string;
  theme: MomentTheme;
  onComplete: () => void;
  /** Demo cards only: open a room directly for review. */
  initialRoom?: Room | null;
};

/** Moments that hang photos on a line (with a note on the back) instead of a deck. */
const LINE_MOMENTS = new Set(['thank_you', 'just_because', 'congratulations']);

function bubbleFor(opened: number, total: number): string {
  if (opened === 0) return 'Pick anything. There is no wrong order.';
  if (opened >= total) return 'That is everything. Ready?';
  if (opened === total - 1) return 'One left. The letter is best saved for last.';
  return 'Nice. Keep going.';
}

/**
 * "Open each one": the recipient chooses the order. Choice is the point (it
 * feels like their own discovery), so nothing here is gated. The letter simply
 * comes with a gentle "best last" hint, and a Skip link is always available.
 */
export function HubScene({ card, slug, theme, onComplete, initialRoom = null }: Props) {
  const { award } = useJoy();
  const copy = storyCopyFor(card.templateType);
  const photos = useMemo(() => (card.mediaUrls ?? []).map((u) => u.trim()).filter(Boolean), [card.mediaUrls]);
  const reasons = useMemo(() => (card.reasons ?? []).map((r) => r.trim()).filter(Boolean), [card.reasons]);

  const rooms = useMemo<Room[]>(() => {
    const list: Room[] = [];
    if (photos.length > 0) list.push('photos');
    if (reasons.length > 0) list.push('reasons');
    list.push('letter');
    return list;
  }, [photos.length, reasons.length]);

  const [room, setRoom] = useState<Room | null>(initialRoom);
  const [step, setStep] = useState<LetterStep>('envelope');
  const [opened, setOpened] = useState<Set<Room>>(new Set());
  const total = rooms.length;
  const allDone = opened.size >= total;

  const enter = useCallback((next: Room) => {
    playTap();
    setStep('envelope');
    setRoom(next);
  }, []);

  const leave = useCallback(
    (from: Room) => {
      setOpened((current) => new Set(current).add(from));
      award(`hub:${from}`);
      setRoom(null);
    },
    [award],
  );

  if (room === 'photos') {
    const Photos = LINE_MOMENTS.has(card.templateType) ? PhotoLineScene : PhotoDeckScene;
    return (
      <Photos
        urls={photos}
        title={copy.photosTitle}
        captions={copy.photoCaptions}
        fromName={card.fromName}
        onComplete={() => leave('photos')}
      />
    );
  }

  if (room === 'reasons') {
    return (
      <ReasonsScene
        reasons={reasons}
        templateType={card.templateType}
        onComplete={() => leave('reasons')}
      />
    );
  }

  if (room === 'letter') {
    if (step === 'envelope') {
      return (
        <EnvelopeScene
          recipientName={card.recipientName}
          templateType={card.templateType}
          onComplete={() => setStep('write')}
        />
      );
    }
    if (step === 'write') {
      return <LetterWriteScene card={card} onComplete={() => setStep('read')} />;
    }
    return (
      <LetterScene
        card={card}
        slug={slug}
        onContinue={() => {
          leave('letter');
        }}
      />
    );
  }

  return (
    <section className="hub" aria-label="Open each one">
      <h2 className="story-scene-title">Open each one</h2>
      <p className="story-scene-sub" aria-live="polite">
        {opened.size} of {total} opened
      </p>

      <div className={`hub__grid hub__grid--${total}`}>
        {rooms.includes('photos') ? (
          <HubItem
            label={`Photos (${Math.min(photos.length, 5)})`}
            done={opened.has('photos')}
            onOpen={() => enter('photos')}
          >
            <CameraIcon accent={theme.mascot.base} secondary={theme.mascot.shade} />
          </HubItem>
        ) : null}
        {rooms.includes('reasons') ? (
          <HubItem
            label={theme.id === 'anniversary' ? 'Everything I love' : 'Reasons'}
            done={opened.has('reasons')}
            onOpen={() => enter('reasons')}
          >
            <JarIcon accent={theme.mascot.base} secondary={theme.mascot.light} />
          </HubItem>
        ) : null}
        <HubItem
          label="A letter"
          done={opened.has('letter')}
          onOpen={() => enter('letter')}
          hint={opened.size === total - 1 && !opened.has('letter') ? 'Open me last' : undefined}
        >
          <EnvelopeIcon accent={theme.mascot.base} secondary={theme.mascot.shade} />
        </HubItem>
      </div>

      <div className="hub__pip">
        <Pip mood={allDone ? 'joy' : opened.size > 0 ? 'wink' : 'hopeful'} theme={theme} size={92} />
        <p className="hub__bubble">{bubbleFor(opened.size, total)}</p>
      </div>

      <div className="story-cta">
        <button
          type="button"
          className="landing-btn-primary"
          disabled={!allDone}
          onClick={onComplete}
        >
          {allDone ? 'Finish' : 'Open them all to finish'}
        </button>
      </div>
      <TapToContinue active={allDone} onContinue={onComplete} />

      {!opened.has('letter') ? (
        <button type="button" className="story-skip" onClick={() => enter('letter')}>
          Skip to the letter
        </button>
      ) : !allDone ? (
        <button type="button" className="story-skip" onClick={onComplete}>
          Skip the rest
        </button>
      ) : null}
    </section>
  );
}

function HubItem({
  label,
  done,
  hint,
  onOpen,
  children,
}: {
  label: string;
  done: boolean;
  hint?: string;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`hub-item${done ? ' is-done' : ''}`}
      onClick={onOpen}
      aria-label={done ? `${label}, opened` : label}
    >
      <span className="hub-item__art">{children}</span>
      <span className="hub-item__label">{label}</span>
      {done ? (
        <span className="hub-item__check" aria-hidden>
          ✓
        </span>
      ) : hint ? (
        <span className="hub-item__hint">{hint}</span>
      ) : null}
    </button>
  );
}
