import { CARD_REVEAL } from '../../src/features/create/domain/cardReveal';

describe('the staged card reveal', () => {
  it('shows the beats in order: photo, occasion, name, message, then the celebration', () => {
    const starts = [CARD_REVEAL.photoAt, CARD_REVEAL.occasionAt, CARD_REVEAL.nameAt, CARD_REVEAL.messageAt, CARD_REVEAL.celebrationAt];
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it('flows: the next beat starts within a moment of the last one ending, never after a pause', () => {
    const gaps = [
      CARD_REVEAL.occasionAt - (CARD_REVEAL.photoAt + CARD_REVEAL.photoMs),
      CARD_REVEAL.nameAt - (CARD_REVEAL.occasionAt + CARD_REVEAL.occasionMs),
      CARD_REVEAL.messageAt - (CARD_REVEAL.nameAt + CARD_REVEAL.nameMs),
    ];
    for (const gap of gaps) expect(gap).toBeLessThanOrEqual(100);
  });

  it('starts the celebration once the last beat has finished, not before', () => {
    expect(CARD_REVEAL.celebrationAt).toBeGreaterThanOrEqual(CARD_REVEAL.messageAt + CARD_REVEAL.messageMs - 1);
    expect(CARD_REVEAL.totalMs).toBe(CARD_REVEAL.celebrationAt);
  });
});
