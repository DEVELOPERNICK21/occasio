import { messageStarters } from '../../src/features/create/domain/messageStarters';
import type { Occasion } from '../../src/features/create/domain/templateSchema';

const OCCASIONS: Occasion[] = [
  'birthday',
  'anniversary',
  'thank_you',
  'congratulations',
  'just_because',
];

describe('messageStarters', () => {
  it('offers three openers for every moment, and a generic set when there is none', () => {
    for (const occasion of OCCASIONS) {
      expect(messageStarters(occasion)).toHaveLength(3);
    }
    expect(messageStarters(null)).toHaveLength(3);
  });

  it('ends each opener mid-sentence so the person finishes it themselves', () => {
    for (const occasion of [...OCCASIONS, null]) {
      for (const starter of messageStarters(occasion)) {
        expect(starter.endsWith(' ')).toBe(true);
        expect(starter.trim().endsWith('.')).toBe(false);
        expect(starter.length).toBeLessThan(60);
      }
    }
  });

  it('keeps the tone calm: no hype, no emoji', () => {
    for (const occasion of [...OCCASIONS, null]) {
      for (const starter of messageStarters(occasion)) {
        expect(starter).not.toMatch(/amazing|awesome|best ever|\p{Extended_Pictographic}/iu);
      }
    }
  });
});
