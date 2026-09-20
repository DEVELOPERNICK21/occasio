'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { wishGreeting, type RecipientCard } from '@/lib/recipientCard';

type Props = {
  card: RecipientCard;
  onComplete: () => void;
};

export function LetterWriteScene({ card, onComplete }: Props) {
  const name = card.recipientName.trim() || 'you';
  const from = card.fromName?.trim() || '';
  const greeting = wishGreeting(card.templateType);
  const message =
    card.message?.trim() ||
    'Thinking of you today — and always grateful you’re in my life.';

  const lines = useMemo(
    () => message.split(/\n+/).map((l) => l.trim()).filter(Boolean),
    [message],
  );

  const writeMs = Math.max(1800, 700 + lines.length * 280);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), writeMs);
    return () => window.clearTimeout(id);
  }, [writeMs]);

  const continueNext = useCallback(() => {
    if (!ready) return;
    onComplete();
  }, [ready, onComplete]);

  return (
    <section className="story-letter-write" aria-label="A handwritten letter">
      <h2 className="story-scene-title">A letter for you</h2>
      <p className="story-scene-sub">
        {ready ? 'When you’re ready, continue' : 'Reading…'}
      </p>

      <article className="story-letter-paper" aria-live="polite">
        <p className="story-letter-paper__greeting">
          {greeting} {name}
        </p>
        <div className="story-letter-paper__body">
          {lines.map((line, i) => (
            <p
              key={`${i}-${line.slice(0, 12)}`}
              className="story-letter-paper__line"
              style={{ animationDelay: `${0.35 + i * 0.22}s` }}
            >
              {line}
            </p>
          ))}
        </div>
        {from ? (
          <p
            className="story-letter-paper__signoff"
            style={{ animationDelay: `${0.55 + lines.length * 0.22}s` }}
          >
            <span className="story-letter-paper__signoff-label">With love</span>
            {from}
          </p>
        ) : null}
      </article>

      <div className="story-cta">
        <button
          type="button"
          className="landing-btn-primary"
          disabled={!ready}
          onClick={continueNext}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
