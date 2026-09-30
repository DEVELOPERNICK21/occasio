'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { LetterStage, type LetterStageHandle } from '@/components/story/gift3d/LetterStage';
import { useJoy } from '@/components/story/fx/JoyProvider';
import { TapToContinue } from '@/components/story/fx/TapToContinue';
import type { MomentTheme } from '@/lib/experience/momentTheme';
import { playPaperRustle, playSealCrack } from '@/lib/experience/sfx';
import { storyCopyFor } from '@/lib/experience/storyCopy';
import { wishGreeting, type RecipientCard } from '@/lib/recipientCard';

type Props = {
  card: RecipientCard;
  theme: MomentTheme;
  onComplete: () => void;
  onFail: () => void;
};

type Stage = 'sealed' | 'opening' | 'written';

/**
 * Break the wax seal, watch the letter slide out and unfold, then see it being
 * written. Replaces the flat envelope + typewriter scenes wherever WebGL works.
 */
export function Letter3DScene({ card, theme, onComplete, onFail }: Props) {
  const { award } = useJoy();
  const copy = storyCopyFor(card.templateType);
  const stage = useRef<LetterStageHandle>(null);
  const [state, setState] = useState<Stage>('sealed');
  const name = card.recipientName.trim() || 'you';

  const text = useMemo(() => {
    const from = card.fromName?.trim();
    const message =
      card.message?.trim() ||
      'Thinking of you today — and always grateful you’re in my life.';
    const sign = from ? `\n\nWith love,\n${from}` : '';
    return `${wishGreeting(card.templateType)} ${name},\n\n${message}${sign}`;
  }, [card.fromName, card.message, card.templateType, name]);

  const sealBroken = useCallback(() => {
    playSealCrack();
    award('envelope');
    setState('opening');
  }, [award]);

  const unfolded = useCallback(() => {
    playPaperRustle();
  }, []);

  const written = useCallback(() => {
    award('letter_write');
    setState('written');
  }, [award]);

  return (
    <section className="letter3d-scene" aria-label="Open the letter">
      <h2 className="story-scene-title">{state === 'sealed' ? copy.envelopeTitle(name) : copy.letterWriteTitle}</h2>
      <p className="story-scene-sub" aria-live="polite">
        {state === 'sealed'
          ? 'Press and hold the wax seal'
          : state === 'opening'
            ? 'Opening…'
            : 'When you’re ready, continue'}
      </p>

      <LetterStage
        ref={stage}
        theme={theme}
        text={text}
        ariaLabel={state === 'sealed' ? 'Wax-sealed envelope. Press and hold, or press Enter, to open it.' : 'Your letter'}
        onSealBroken={sealBroken}
        onUnfolded={unfolded}
        onWritten={written}
        onFail={onFail}
      />

      <div className="story-cta">
        <button
          type="button"
          className="landing-btn-primary"
          disabled={state !== 'written'}
          onClick={onComplete}
        >
          Continue
        </button>
        {state === 'opening' ? (
          <button type="button" className="story-skip" onClick={() => stage.current?.skip()}>
            Show the whole letter
          </button>
        ) : null}
      </div>
      <TapToContinue active={state === 'written'} onContinue={onComplete} />
    </section>
  );
}
