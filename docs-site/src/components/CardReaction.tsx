'use client';

import { useCallback, useEffect, useState } from 'react';

type Props = {
  slug: string;
  initialCount: number;
};

function storageKey(slug: string): string {
  return `occasio.reacted.${slug}`;
}

/** One heart per device — a counter the sender can see, not a vanity metric. */
export function CardReaction({ slug, initialCount }: Props) {
  const [count, setCount] = useState(initialCount);
  const [reacted, setReacted] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      setReacted(window.localStorage.getItem(storageKey(slug)) === '1');
    } catch {
      // Private mode — the button simply stays tappable.
    }
  }, [slug]);

  const react = useCallback(async () => {
    if (reacted || pending) return;
    setPending(true);
    setReacted(true);
    setCount((c) => c + 1);

    try {
      const response = await fetch(`/api/v1/cards/${slug}/reactions`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Reaction failed');
      const data = (await response.json()) as { reactionCount?: number };
      if (typeof data.reactionCount === 'number') {
        setCount(data.reactionCount);
      }
      window.localStorage.setItem(storageKey(slug), '1');
    } catch {
      setReacted(false);
      setCount((c) => Math.max(0, c - 1));
    } finally {
      setPending(false);
    }
  }, [pending, reacted, slug]);

  return (
    <div className="wish-reaction">
      <button
        type="button"
        className="wish-reaction-btn"
        aria-pressed={reacted}
        disabled={pending}
        onClick={() => void react()}
      >
        <svg viewBox="0 0 24 24" aria-hidden focusable="false">
          <path
            d="M12 20.3 4.7 13a4.6 4.6 0 1 1 6.5-6.5l.8.8.8-.8A4.6 4.6 0 1 1 19.3 13Z"
            fill={reacted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        {reacted ? 'They know you saw it' : 'Let them know you saw it'}
      </button>
      {count > 0 ? (
        <p className="wish-reaction-count">
          {count === 1 ? 'Opened with love once' : `Loved ${count} times`}
        </p>
      ) : null}
    </div>
  );
}
