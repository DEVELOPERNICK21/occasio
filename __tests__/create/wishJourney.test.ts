import {
  computeWishJourney,
  computeWishStreak,
  levelForWishes,
  newlyEarnedBadges,
} from '../../src/features/create/domain/wishJourney';

const now = new Date(2026, 8, 27);

function entry(year: number, month: number, name = 'Mom') {
  return { createdAt: new Date(year, month, 10).toISOString(), recipientName: name };
}

describe('wishJourney', () => {
  it('starts guests at level 1 with every badge locked', () => {
    const journey = computeWishJourney([], 0, now);
    expect(journey.level.title).toBe('First spark');
    expect(journey.badges.every((b) => !b.unlocked)).toBe(true);
    expect(journey.caption).toBe('Send your first wish to earn your first badge.');
  });

  it('levels up on real wish counts', () => {
    expect(levelForWishes(1).level.title).toBe('Warm heart');
    expect(levelForWishes(3).level.title).toBe('Thoughtful');
    expect(levelForWishes(20).nextLevel).toBeNull();
  });

  it('counts consecutive months including this month', () => {
    const streak = computeWishStreak([entry(2026, 8), entry(2026, 7), entry(2026, 6)], now);
    expect(streak).toEqual({ months: 3, atRisk: false });
  });

  it('keeps a streak alive but at risk when this month has no wish yet', () => {
    const streak = computeWishStreak([entry(2026, 7), entry(2026, 6)], now);
    expect(streak).toEqual({ months: 2, atRisk: true });
  });

  it('breaks the streak after a missed month', () => {
    expect(computeWishStreak([entry(2026, 8), entry(2026, 6)], now).months).toBe(1);
  });

  it('unlocks badges from history and vault', () => {
    const entries = ['A', 'B', 'C', 'D', 'E'].map((name) => entry(2026, 8, name));
    const journey = computeWishJourney(entries, 1, now);
    const unlocked = journey.badges.filter((b) => b.unlocked).map((b) => b.id);
    expect(unlocked).toEqual(['first_wish', 'three_wishes', 'vault_saved', 'five_people']);
    expect(journey.caption).toBe('2 more wishes to reach Memory keeper.');
  });

  it('only surfaces unlocked badges that have not been celebrated', () => {
    const entries = ['A', 'B', 'C'].map((name) => entry(2026, 8, name));
    const { badges } = computeWishJourney(entries, 1, now);
    expect(newlyEarnedBadges(badges, ['first_wish']).map((b) => b.id)).toEqual([
      'three_wishes',
      'vault_saved',
    ]);
    expect(newlyEarnedBadges(badges, ['first_wish', 'three_wishes', 'vault_saved'])).toEqual([]);
  });
});
