import type { GateCopy } from './momentTheme';

/**
 * The first frame of a card: Pip asks "do you want to see it?", and whatever the person answers stays answered.
 *
 * The joke is Pip's reaction, not the buttons. The first "No" makes Pip gasp and the button turns into "Not now",
 * which is a real answer: Pip cries a little (tiny violin), the card closes, and nothing opens until the person
 * taps "Yes" or "Open it after all" themselves. No button is ever turned into "Yes" for them.
 *
 *   asking ──decline──▶ reacted ──decline──▶ declined
 *     │                    │                    │
 *     └────────────────────┴─────── yes ────────┴──▶ opening (final)
 */
export type GatePhase = 'asking' | 'reacted' | 'declined' | 'opening';

/** The two buttons: the one that opens the card, and the other one ("No", then "Not now"). */
export type GateAnswer = 'yes' | 'decline';

export function nextPhase(phase: GatePhase, answer: GateAnswer): GatePhase {
  if (phase === 'opening') return phase;
  // Only a yes opens the card. A decline can never lead there.
  if (answer === 'yes') return 'opening';
  if (phase === 'asking') return 'reacted';
  return 'declined';
}

/** What the second button says, or null when the card is closed and there is no second button. */
export function declineLabel(phase: GatePhase): string | null {
  if (phase === 'asking') return 'No';
  if (phase === 'reacted') return 'Not now';
  return null;
}

/** The quiet way back once the card is closed: the person's own choice, offered but never done for them. */
export const OPEN_AFTER_ALL = 'Open it after all';

export type GateView = {
  mood: 'hopeful' | 'shocked' | 'cry' | 'joy';
  title: string;
  sub: string;
  /** A small reaction mark beside Pip, or empty. */
  pop: string;
  /** Said plainly once the card is closed, after the joke, so the answer is clearly honoured. */
  note: string | null;
};

/** What is on screen in each phase. `from` is the sender's name, or "Someone". */
export function gateView(phase: GatePhase, copy: GateCopy, from: string): GateView {
  switch (phase) {
    case 'asking':
      return { mood: 'hopeful', title: `${from} ${copy.hopeful}`, sub: copy.hopefulSub, pop: '', note: null };
    case 'reacted':
      return { mood: 'shocked', title: copy.refusedOnce, sub: copy.refusedOnceSub, pop: '💢', note: null };
    case 'declined':
      return {
        mood: 'cry',
        title: copy.declined,
        sub: copy.declinedSub,
        pop: '💧',
        note: 'No problem. Your surprise will be right here whenever you want it.',
      };
    case 'opening':
      return { mood: 'joy', title: 'Here we go!', sub: 'Sound on for the full effect.', pop: '', note: null };
  }
}
