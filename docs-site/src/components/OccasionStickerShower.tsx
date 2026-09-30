'use client';

import { useEffect, useRef } from 'react';
import { CelebrationCanvas, type CelebrationHandle } from '@/components/story/fx/CelebrationCanvas';
import { momentThemeFor } from '@/lib/experience/momentTheme';
import { effectForTemplateType, type ScreenEffectId } from '@/lib/occasionEffects';

type Props = {
  templateType: string;
  /** Change to play the show again (e.g. a Replay button). */
  replayKey?: number;
  /** Wait for the letter reveal before celebrating (ms). */
  startDelayMs?: number;
};

const DEFAULT_START_DELAY_MS = 2600;

function soundFile(effectId: ScreenEffectId): string {
  const music = effectId === 'balloons' || effectId === 'hearts' || effectId === 'sparkles';
  return `/sounds/${effectId}.${music ? 'mp3' : 'wav'}`;
}

/**
 * Celebration for the classic (non-story) card. Plays once per mount or
 * replayKey change, in this moment's style, and never restarts by itself.
 */
export function OccasionStickerShower({
  templateType,
  replayKey = 0,
  startDelayMs = DEFAULT_START_DELAY_MS,
}: Props) {
  const theme = momentThemeFor(templateType);
  const fx = useRef<CelebrationHandle>(null);

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    const timer = window.setTimeout(() => {
      fx.current?.burst();
      try {
        audio = new Audio(soundFile(effectForTemplateType(templateType)));
        audio.volume = 0.5;
        void audio.play().catch(() => undefined);
      } catch {
        // audio blocked or unavailable: the visuals still play
      }
    }, startDelayMs);
    return () => {
      window.clearTimeout(timer);
      audio?.pause();
    };
  }, [replayKey, startDelayMs, templateType]);

  return <CelebrationCanvas ref={fx} preset={theme.fx} colors={theme.palette} fixed />;
}
