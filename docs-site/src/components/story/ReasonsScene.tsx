'use client';

import { useMemo, useState } from 'react';
import { useJoy } from '@/components/story/fx/JoyProvider';
import { TapToContinue } from '@/components/story/fx/TapToContinue';
import { storyCopyFor } from '@/lib/experience/storyCopy';

type Props = {
  reasons: string[];
  templateType?: string;
  onComplete: () => void;
};

/** One tap = one reason. The Continue button appears once all are open. */
export function ReasonsScene({ reasons, templateType = 'birthday', onComplete }: Props) {
  const copy = storyCopyFor(templateType);
  const { award } = useJoy();
  const items = useMemo(() => reasons.filter((r) => r.trim()), [reasons]);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const allOpen = open.size >= items.length;

  const reveal = (index: number, at: { x: number; y: number }) => {
    setOpen((current) => new Set(current).add(index));
    award(`reason:${index}`, 1, at);
  };

  return (
    <section className="story-reasons" aria-label={copy.reasonsTitle}>
      <h2 className="story-scene-title">{copy.reasonsTitle}</h2>
      <p className="story-scene-sub">
        {allOpen ? 'And so many more' : copy.reasonsSub}
      </p>

      <ol className="story-reasons__list">
        {items.map((reason, index) => {
          const isOpen = open.has(index);
          return (
            <li key={`${index}-${reason}`}>
              <button
                type="button"
                className={`story-reason${isOpen ? ' is-open' : ''}`}
                onClick={(e) => reveal(index, { x: e.clientX, y: e.clientY })}
                aria-expanded={isOpen}
              >
                <span className="story-reason__no">Reason {index + 1}</span>
                <span className="story-reason__text">
                  {isOpen ? reason : 'Tap to open'}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {allOpen ? (
        <button type="button" className="landing-btn-primary story-continue" onClick={onComplete}>
          Continue
        </button>
      ) : null}
      <TapToContinue active={allOpen} onContinue={onComplete} />
    </section>
  );
}
