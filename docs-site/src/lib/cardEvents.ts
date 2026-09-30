export type CardEventName = 'opened' | 'finished' | 'replayed' | 'cta';

/** Fire-and-forget funnel counter. Never blocks or breaks the card. */
export function trackCardEvent(slug: string, type: CardEventName, isDemo = false): void {
  if (isDemo || typeof window === 'undefined') return;
  try {
    void fetch(`/api/v1/cards/${encodeURIComponent(slug)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // analytics must never surface to the recipient
  }
}
