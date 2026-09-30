'use client';

import { useCallback, useState } from 'react';
import { RecipientCardView } from '@/components/RecipientCardView';
import type { RecipientCard } from '@/lib/recipientCard';

type Props = { slug: string; hint: string | null };

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/** Keypad lock. The code is checked on the server; the card is only sent on success. */
export function PasscodeGate({ slug, hint }: Props) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<RecipientCard | null>(null);

  const submit = useCallback(
    async (value: string) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/v1/cards/${encodeURIComponent(slug)}/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: value }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          card?: RecipientCard;
          attemptsLeft?: number;
          retryAfterSec?: number;
        };
        if (res.ok && data.card) {
          setCard(data.card);
          return;
        }
        setShake(true);
        window.setTimeout(() => setShake(false), 420);
        setCode('');
        if (res.status === 429) {
          const mins = Math.max(1, Math.ceil((data.retryAfterSec ?? 900) / 60));
          setMessage(`Too many tries. Try again in about ${mins} min.`);
        } else if (res.status === 410) {
          setMessage('This link has expired.');
        } else {
          setMessage(
            data.attemptsLeft !== undefined
              ? `Not quite. ${data.attemptsLeft} ${data.attemptsLeft === 1 ? 'try' : 'tries'} left.`
              : 'Not quite. Try again.',
          );
        }
      } catch {
        setMessage('Could not check the code. Check your connection.');
        setCode('');
      } finally {
        setBusy(false);
      }
    },
    [slug],
  );

  const press = (digit: string) => {
    if (busy || code.length >= 4) return;
    const next = `${code}${digit}`;
    setCode(next);
    setMessage(null);
    if (next.length === 4) void submit(next);
  };

  if (card) {
    return <RecipientCardView card={card} slug={slug} />;
  }

  return (
    <div className="wish-recipient-page">
      <div className="wish-recipient-inner">
        <p className="story-brand">Occasio</p>
        <section className={`story-lock${shake ? ' is-shaking' : ''}`} aria-label="Enter passcode">
          <h1 className="story-scene-title">Someone locked a surprise for you</h1>
          <p className="story-scene-sub">
            {hint ? `Hint: ${hint}` : 'Enter the 4-digit code'}
          </p>

          <div className="story-lock__dots" aria-live="polite">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`story-lock__dot${i < code.length ? ' is-on' : ''}`} />
            ))}
          </div>
          <p className="story-lock__message" role="status">
            {message ?? ' '}
          </p>

          <div className="story-lock__pad">
            {KEYS.map((k) => (
              <button key={k} type="button" onClick={() => press(k)} disabled={busy}>
                {k}
              </button>
            ))}
            <span />
            <button type="button" onClick={() => press('0')} disabled={busy}>
              0
            </button>
            <button
              type="button"
              aria-label="Delete"
              onClick={() => setCode((c) => c.slice(0, -1))}
              disabled={busy || code.length === 0}
            >
              ⌫
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
