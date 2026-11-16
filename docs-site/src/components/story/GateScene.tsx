'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CelebrationCanvas, type CelebrationHandle } from '@/components/story/fx/CelebrationCanvas';
import { useJoy } from '@/components/story/fx/JoyProvider';
import { Pip } from '@/components/story/fx/Pip';
import { OPEN_AFTER_ALL, declineLabel, gateView, nextPhase, type GatePhase } from '@/lib/experience/gateFlow';
import type { MomentTheme } from '@/lib/experience/momentTheme';
import { unlockMusic } from '@/lib/experience/occasionMusic';
import { playBoing, playSadTrombone, playTada } from '@/lib/experience/sfx';

type Props = {
  theme: MomentTheme;
  recipientName: string;
  fromName?: string | null;
  onComplete: () => void;
};

function buzz(ms: number): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported: silently skip
  }
}

/**
 * The first frame. Pip guards the surprise. The first "No" is a running gag (Pip is shocked, the button turns into
 * "Not now"); "Not now" is a real answer: Pip cries a little, the card closes, and nothing opens until the person taps
 * "Yes" or "Open it after all" themselves. A decline never opens the card. See `lib/experience/gateFlow.ts`.
 */
export function GateScene({ theme, recipientName, fromName, onComplete }: Props) {
  const { award } = useJoy();
  const fx = useRef<CelebrationHandle>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<GatePhase>('asking');
  const from = fromName?.trim() || 'Someone';
  const name = recipientName.trim();

  const leaving = phase === 'opening';
  const view = gateView(phase, theme.gate, from);
  const decline = declineLabel(phase);

  // The button that was pressed goes away when the card closes, so the heading takes focus and is read out.
  useEffect(() => {
    if (phase === 'declined') titleRef.current?.focus();
  }, [phase]);

  const yes = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (leaving) return;
      setPhase((current) => nextPhase(current, 'yes'));
      // This tap is what lets the song start on its own at the end.
      unlockMusic(theme.songType ?? theme.id);
      playTada();
      buzz(20);
      const rect = event.currentTarget.getBoundingClientRect();
      const at = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      fx.current?.burst(at, 1);
      award('gate', 1, { x: at.x, y: at.y - 30 });
      window.setTimeout(onComplete, 1100);
    },
    [award, leaving, onComplete, theme.id, theme.songType],
  );

  const no = useCallback(() => {
    if (leaving) return;
    const next = nextPhase(phase, 'decline');
    setPhase(next);
    buzz(next === 'reacted' ? 40 : 90);
    // Pip's reaction: a boing for the gasp, then the sad trombone for the tiny violin.
    if (next === 'reacted') playBoing();
    else playSadTrombone();
  }, [leaving, phase]);

  return (
    <section
      className={`gate gate--${theme.id}${leaving ? ' is-leaving' : ''}`}
      data-phase={phase}
      aria-label="Start the surprise"
    >
      <CelebrationCanvas ref={fx} preset={theme.fx} colors={theme.palette} fixed />

      <div className="gate__ticket">
        <span className="gate__tape gate__tape--l" aria-hidden />
        <span className="gate__tape gate__tape--r" aria-hidden />
        <span className="gate__ticket-eyebrow">a surprise for</span>
        <span className="gate__ticket-name">{name || 'you'}</span>
      </div>

      <div className="gate__stage">
        <span className="gate__aura" aria-hidden />
        <span className="gate__ring" aria-hidden />
        <Pip mood={view.mood} theme={theme} size={232} holdsGift />
        {view.pop ? (
          <span key={phase} className="gate__pop" aria-hidden>
            {view.pop}
          </span>
        ) : null}
      </div>

      <h2 key={`t${phase}`} ref={titleRef} tabIndex={-1} className="gate__title" aria-live="polite">
        {view.title}
      </h2>
      <p className="gate__sub">{view.sub}</p>
      {view.note ? <p className="gate__note">{view.note}</p> : null}

      <div className="gate__actions">
        {phase === 'declined' ? (
          <button type="button" className="gate__again" onClick={yes}>
            {OPEN_AFTER_ALL}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="gate__yes"
              style={{ transform: `scale(${phase === 'reacted' ? 1.08 : 1})` }}
              onClick={yes}
              disabled={leaving}
            >
              {theme.gate.yes}
            </button>
            {decline ? (
              <button type="button" className="gate__no" onClick={no} disabled={leaving}>
                {decline}
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
