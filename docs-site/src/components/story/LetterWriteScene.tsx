'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { storyCopyFor } from '@/lib/experience/storyCopy';
import { wishGreeting, type RecipientCard } from '@/lib/recipientCard';

type Props = {
  card: RecipientCard;
  onComplete: () => void;
};

export function LetterWriteScene({ card, onComplete }: Props) {
  const name = card.recipientName.trim() || 'you';
  const from = card.fromName?.trim() || '';
  const greeting = wishGreeting(card.templateType);
  const copy = storyCopyFor(card.templateType);
  const message =
    card.message?.trim() ||
    'Thinking of you today — and always grateful you’re in my life.';

  const script = useMemo(() => {
    const sign = from ? `\n\nWith love,\n${from}` : '';
    return `${greeting} ${name},\n\n${message}${sign}`;
  }, [from, greeting, message, name]);

  const [count, setCount] = useState(0);
  const done = count >= script.length;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setCount(script.length);
      return;
    }
    if (done) return;
    const id = window.setTimeout(() => setCount((c) => c + 1), 32);
    return () => window.clearTimeout(id);
  }, [count, done, script.length]);

  const continueNext = useCallback(() => {
    if (!done) return;
    onComplete();
  }, [done, onComplete]);

  return (
    <section className="story-letter-write" aria-label="A handwritten letter">
      <h2 className="story-scene-title">{copy.letterWriteTitle}</h2>
      <p className="story-scene-sub">
        {done ? 'When you’re ready, continue' : 'Someone is writing…'}
      </p>

      <article className="story-letter-paper" aria-live="polite">
        <p className="story-letter-type">
          {script.slice(0, count)}
          {done ? null : <span className="story-letter-caret" aria-hidden />}
        </p>
      </article>

      <div className="story-cta">
        <button
          type="button"
          className="landing-btn-primary"
          disabled={!done}
          onClick={continueNext}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
