'use client';

import { useCallback, useRef, useState } from 'react';
import { CelebrationCanvas, type CelebrationHandle } from '@/components/story/fx/CelebrationCanvas';
import { useJoy } from '@/components/story/fx/JoyProvider';
import { Pip, type PipMood } from '@/components/story/fx/Pip';
import type { MomentTheme } from '@/lib/experience/momentTheme';
import { playBoing, playSadTrombone, playTada } from '@/lib/experience/sfx';

type Props = {
  theme: MomentTheme;
  recipientName: string;
  fromName?: string | null;
  onComplete: () => void;
};

const MOODS: PipMood[] = ['hopeful', 'shocked', 'cry'];
const POP = ['', '💢', '💧'];

function buzz(ms: number): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported: silently skip
  }
}

/**
 * The first frame. Pip guards the surprise; saying "No" is a running gag that
 * escalates (shocked, then crying with a tiny violin) but never blocks: the
 * second refusal turns both buttons into "Yes", and Yes is always one tap away.
 */
export function GateScene({ theme, recipientName, fromName, onComplete }: Props) {
  const { award } = useJoy();
  const fx = useRef<CelebrationHandle>(null);
  const [refusals, setRefusals] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const from = fromName?.trim() || 'Someone';
  const name = recipientName.trim();
  const copy = theme.gate;

  const mood: PipMood = leaving ? 'joy' : (MOODS[Math.min(refusals, 2)] ?? 'hopeful');
  const title =
    refusals === 0
      ? `${from} ${copy.hopeful}`
      : refusals === 1
        ? copy.refusedOnce
        : copy.refusedTwice;
  const sub =
    refusals === 0 ? copy.hopefulSub : refusals === 1 ? copy.refusedOnceSub : copy.refusedTwiceSub;

  const yes = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (leaving) return;
      setLeaving(true);
      playTada();
      buzz(20);
      const rect = event.currentTarget.getBoundingClientRect();
      const at = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      fx.current?.burst(at, 1);
      award('gate', 1, { x: at.x, y: at.y - 30 });
      window.setTimeout(onComplete, 1100);
    },
    [award, leaving, onComplete],
  );

  const no = useCallback(() => {
    if (leaving) return;
    const next = refusals + 1;
    setRefusals(next);
    buzz(next === 1 ? 40 : 90);
    if (next === 1) playBoing();
    else playSadTrombone();
  }, [leaving, refusals]);

  const bothYes = refusals >= 2;

  return (
    <section
      className={`gate gate--${theme.id}${leaving ? ' is-leaving' : ''}`}
      data-refusals={refusals}
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
        <Pip mood={mood} theme={theme} size={232} holdsGift />
        {POP[Math.min(refusals, 2)] ? (
          <span key={refusals} className="gate__pop" aria-hidden>
            {POP[Math.min(refusals, 2)]}
          </span>
        ) : null}
      </div>

      <h2 key={`t${refusals}${leaving}`} className="gate__title" aria-live="polite">
        {leaving ? 'Here we go!' : title}
      </h2>
      <p className="gate__sub">{leaving ? 'Sound on for the full effect.' : sub}</p>

      <div className="gate__actions">
        <button
          type="button"
          className="gate__yes"
          style={{ transform: `scale(${bothYes ? 1 : 1 + refusals * 0.08})` }}
          onClick={yes}
          disabled={leaving}
        >
          {copy.yes}
        </button>
        <button
          type="button"
          className={`gate__no${bothYes ? ' is-yes' : ''}`}
          style={{ transform: `scale(${bothYes ? 1 : 1 - refusals * 0.14})` }}
          onClick={bothYes ? yes : no}
          disabled={leaving}
        >
          {bothYes ? copy.yes : 'No'}
        </button>
      </div>
    </section>
  );
}
