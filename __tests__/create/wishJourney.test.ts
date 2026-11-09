import {
  BADGE_DESCRIPTIONS,
  BADGE_SET_VERSION,
  badgeNextStep,
  badgePipLine,
  badgePipMood,
  computeWishJourney,
  computeWishStreak,
  countArmedAutoSend,
  firstWishRecipient,
  levelForWishes,
  newlyEarnedBadges,
  type WishBadgeId,
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

function typed(templateType: string, month = 8, name = 'Mom') {
  return { ...entry(2026, month, name), templateType };
}

describe('the wider badge set', () => {
  const ids = (journey: ReturnType<typeof computeWishJourney>) =>
    journey.badges.filter((b) => b.unlocked).map((b) => b.id);

  it('has eleven badges, each with a description, a hint and Pip\'s words', () => {
    const journey = computeWishJourney([], 0, now);
    expect(journey.badges).toHaveLength(11);
    for (const badge of journey.badges) {
      expect(BADGE_DESCRIPTIONS[badge.id].length).toBeGreaterThan(10);
      expect(badge.hint.length).toBeGreaterThan(5);
      expect(badgePipLine(badge.id).length).toBeGreaterThan(10);
      expect(['joy', 'wink', 'hopeful']).toContain(badgePipMood(badge.id));
      expect(['create', 'vault']).toContain(badgeNextStep(badge.id));
    }
  });

  it('earns the occasion badges from the kind of card that was sent', () => {
    const entries = [typed('thank_you', 8, 'A'), typed('anniversary', 7, 'B'), typed('invitation', 6, 'C')];
    const journey = computeWishJourney(entries, 0, now);
    expect(ids(journey)).toEqual(
      expect.arrayContaining(['thank_you', 'anniversary', 'invitation', 'three_occasions', 'three_wishes']),
    );
  });

  it('does not count cards whose kind is not known', () => {
    expect(ids(computeWishJourney([entry(2026, 8)], 0, now))).toEqual(['first_wish']);
  });

  it('earns ten wishes at ten', () => {
    const nine = Array.from({ length: 9 }, (_, i) => entry(2026, 8, `P${i}`));
    expect(ids(computeWishJourney(nine, 0, now))).not.toContain('ten_wishes');
    expect(ids(computeWishJourney([...nine, entry(2026, 8, 'P9')], 0, now))).toContain('ten_wishes');
  });

  it('earns autopilot once someone has auto-send armed', () => {
    expect(ids(computeWishJourney([], 1, now, { armedAutoSend: 1 }))).toEqual(['vault_saved', 'auto_send']);
    expect(ids(computeWishJourney([], 1, now))).toEqual(['vault_saved']);
    expect(
      countArmedAutoSend([
        { autoSendBirthday: true, autoSendAnniversary: false },
        { autoSendBirthday: false, autoSendAnniversary: true },
        { autoSendBirthday: false, autoSendAnniversary: false },
      ]),
    ).toBe(2);
  });

  it('says how to earn what is not earned yet, in the person\'s terms', () => {
    const journey = computeWishJourney([entry(2026, 8)], 0, now);
    const hint = (id: WishBadgeId) => journey.badges.find((b) => b.id === id)!.hint;
    expect(hint('three_wishes')).toBe('2 more wishes to earn this.');
    expect(hint('ten_wishes')).toBe('9 more wishes to earn this.');
    expect(hint('five_people')).toBe('4 more people to hear from you.');
    expect(hint('thank_you')).toBe('Send a thank you card.');
    expect(hint('vault_saved')).toBe('Save someone in your Vault.');
    expect(hint('auto_send')).toBe('Arm auto-send for someone in your Vault.');
  });

  it('points at the badge that is closest to done', () => {
    // 2 of 3 wishes: three_wishes is two thirds there, ahead of everything else.
    const two = computeWishJourney([entry(2026, 8, 'A'), entry(2026, 8, 'B')], 0, now);
    expect(two.nextBadge?.id).toBe('three_wishes');
    // Nothing earned: the first one on the list.
    expect(computeWishJourney([], 0, now).nextBadge?.id).toBe('first_wish');
    // All earned: nothing left to aim for.
    const entries = [
      ...Array.from({ length: 5 }, (_, i) => typed('birthday', 8, `P${i}`)),
      typed('thank_you', 7, 'T'),
      typed('anniversary', 6, 'N'),
      typed('invitation', 5, 'I'),
      ...Array.from({ length: 3 }, (_, i) => typed('birthday', 8, `Q${i}`)),
    ];
    const everything = computeWishJourney(entries, 1, now, { armedAutoSend: 1 });
    expect(everything.badges.every((b) => b.unlocked)).toBe(true);
    expect(everything.nextBadge).toBeNull();
  });

  it('remembers who got the first wish, by first name, for Pip to mention', () => {
    const entries = [
      { createdAt: new Date(2026, 8, 20).toISOString(), recipientName: 'Later Person' },
      { createdAt: new Date(2026, 6, 1).toISOString(), recipientName: '  Priya Sharma ' },
    ];
    expect(firstWishRecipient(entries)).toBe('Priya');
    expect(firstWishRecipient([])).toBeNull();
    expect(computeWishJourney(entries, 0, now).firstRecipient).toBe('Priya');
    expect(badgePipLine('first_wish', 'Priya')).toBe('Priya will open it soon, and know you thought of them.');
    expect(badgePipLine('first_wish', null)).toBe('They will open it soon, and know you thought of them.');
  });

  it('leads a Vault badge on to the Vault and the rest on to making a wish', () => {
    expect(badgeNextStep('vault_saved')).toBe('vault');
    expect(badgeNextStep('first_wish')).toBe('create');
    expect(badgeNextStep('auto_send')).toBe('create');
  });

  it('speaks in Pip\'s calm voice: no exclamation marks, no emoji', () => {
    const journey = computeWishJourney([], 0, now);
    for (const badge of journey.badges) {
      const words = [BADGE_DESCRIPTIONS[badge.id], badgePipLine(badge.id, 'Priya'), badge.hint, badge.label].join(' ');
      expect(words).not.toContain('!');
      expect(words).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('has a version to bump when badges are added', () => {
    expect(BADGE_SET_VERSION).toBeGreaterThanOrEqual(2);
  });
});
