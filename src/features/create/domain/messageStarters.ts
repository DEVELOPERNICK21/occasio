import type { Occasion } from './templateSchema';

/**
 * Openers that stop the blank page. Each ends mid-sentence on purpose: the
 * person finishes it in their own words, so the card stays theirs.
 */
const STARTERS: Record<Occasion, readonly string[]> = {
  birthday: [
    'Happy birthday! One thing I admire about you is ',
    'Another year, and I am still so grateful for ',
    'I was thinking about the time we ',
  ],
  anniversary: [
    'Every year with you, I understand more that ',
    'My favourite memory of us is ',
    'Thank you for always ',
  ],
  thank_you: [
    'Thank you for always ',
    'I do not say it enough, but ',
    'You made a real difference when you ',
  ],
  congratulations: [
    'I am so proud of you for ',
    'You worked hard for this, and ',
    'Watching you do this made me realise ',
  ],
  just_because: [
    'I was thinking about you, and ',
    'No reason, I just wanted you to know ',
    'Do you remember when we ',
  ],
};

const GENERIC: readonly string[] = [
  'I was thinking about you, and ',
  'One thing I never say enough is ',
  'Do you remember when we ',
];

export function messageStarters(occasion: Occasion | null): readonly string[] {
  return occasion ? STARTERS[occasion] : GENERIC;
}
