import type { PipMood } from '../ui/Pip';

/**
 * Every place Pip lives in the app, with how he looks there and what he says.
 * Pip is the app's voice: short, calm, concrete. No exclamation marks, no hype,
 * and never a guilt trip. He stays out of the paywall, subscription, delete
 * account and age-blocked screens on purpose: nothing playful near money or a
 * "no".
 */
export type PipSpot =
  | 'vaultEmpty'
  | 'historyEmpty'
  | 'noMatch'
  | 'loadError'
  | 'vaultGate'
  | 'historyGate'
  | 'shareReady'
  | 'ageGate'
  | 'cardMissing';

export type PipSpotConfig = {
  /** How Pip looks at rest. */
  mood: PipMood;
  /** How he reacts when tapped. */
  tapMood: PipMood;
  holdsGift?: boolean;
  /** Said one at a time, in order, each time he is tapped. `{name}` is the person's name. */
  lines: readonly string[];
};

export const PIP_SPOTS: Record<PipSpot, PipSpotConfig> = {
  vaultEmpty: {
    mood: 'hopeful',
    tapMood: 'joy',
    holdsGift: true,
    lines: [
      'I am good at remembering dates.',
      'Add one birthday and I will keep it.',
      'You will see who is coming up next.',
    ],
  },
  historyEmpty: {
    mood: 'hopeful',
    tapMood: 'joy',
    lines: [
      'Your shared cards will live here.',
      'Send one and I will keep the link.',
      'You can send a link again anytime.',
    ],
  },
  noMatch: {
    mood: 'hopeful',
    tapMood: 'wink',
    lines: [
      'I looked. Nobody by that name yet.',
      'Try fewer letters.',
      'Or add them as someone new.',
    ],
  },
  loadError: {
    mood: 'shocked',
    tapMood: 'wink',
    lines: [
      'That did not load.',
      'Your connection might have dropped.',
      'Tap Try again when you are ready.',
    ],
  },
  vaultGate: {
    mood: 'wink',
    tapMood: 'joy',
    lines: [
      'Sign in and I will remember for you.',
      'Birthdays and anniversaries, in one place.',
      'You can still make cards without an account.',
    ],
  },
  historyGate: {
    mood: 'wink',
    tapMood: 'joy',
    lines: [
      'Sign in and I will keep every link.',
      'Send one again in a tap.',
      'You can still make cards without an account.',
    ],
  },
  shareReady: {
    mood: 'joy',
    tapMood: 'wink',
    lines: [
      'It is ready. Send it to {name}.',
      'The link opens in any browser.',
      '{name} does not need the app.',
    ],
  },
  ageGate: {
    mood: 'hopeful',
    tapMood: 'joy',
    lines: [
      'Quick check before we start.',
      'Your birthday is not kept.',
      'It takes a few seconds.',
    ],
  },
  cardMissing: {
    mood: 'shocked',
    tapMood: 'wink',
    lines: [
      'I could not find that one.',
      'It may have been deleted.',
      'Your other cards are safe.',
    ],
  },
};

/** The `index`-th line for a spot (wrapping round), with the person's name filled in. */
export function pipLine(spot: PipSpot, index: number, name?: string): string {
  const { lines } = PIP_SPOTS[spot];
  const raw = lines[((index % lines.length) + lines.length) % lines.length];
  return raw.replace(/\{name\}/g, name?.trim() || 'them');
}
