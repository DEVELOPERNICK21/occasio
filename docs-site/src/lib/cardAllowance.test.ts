import {
  billingStateFromSubscriber,
  decideCreateAllowance,
  freeClaimId,
  linkTtlDaysFor,
  PRO_YEARLY_CARD_LIMIT,
  proCardTimesInWindow,
  recipientEditAllowed,
} from './cardAllowance';

const NOW = Date.parse('2026-06-15T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const noBilling = { proActive: false, creditsPurchased: 0 };
const pro = { proActive: true, creditsPurchased: 0 };

function times(count: number, ageDays = 1): number[] {
  return Array.from({ length: count }, (_, i) => NOW - ageDays * DAY - i);
}

describe('decideCreateAllowance', () => {
  it('gives the very first card for free, without asking RevenueCat', () => {
    expect(decideCreateAllowance({}, NOW, null)).toBe('free');
  });

  it('never refills the free card, however long ago it was used', () => {
    expect(decideCreateAllowance({ freeCardsUsed: 1 }, NOW + 400 * DAY, null)).toBe(
      'needs_billing',
    );
  });

  it('lets Pro through until the yearly allowance is used', () => {
    const used = { freeCardsUsed: 1 };
    expect(decideCreateAllowance(used, NOW, pro)).toBe('pro');
    expect(
      decideCreateAllowance(
        { ...used, proCardTimes: times(PRO_YEARLY_CARD_LIMIT - 1) },
        NOW,
        pro,
      ),
    ).toBe('pro');
    expect(
      decideCreateAllowance(
        { ...used, proCardTimes: times(PRO_YEARLY_CARD_LIMIT) },
        NOW,
        pro,
      ),
    ).toBe('none');
  });

  it('frees a Pro slot once a card is more than a year old', () => {
    const doc = {
      freeCardsUsed: 1,
      proCardTimes: [...times(PRO_YEARLY_CARD_LIMIT - 1), NOW - 366 * DAY],
    };
    expect(decideCreateAllowance(doc, NOW, pro)).toBe('pro');
  });

  it('spends a purchased credit when Pro is exhausted or absent', () => {
    const full = { freeCardsUsed: 1, proCardTimes: times(PRO_YEARLY_CARD_LIMIT) };
    expect(
      decideCreateAllowance(full, NOW, { proActive: true, creditsPurchased: 1 }),
    ).toBe('credit');
    expect(
      decideCreateAllowance(
        { freeCardsUsed: 1, wishCreditsUsed: 1 },
        NOW,
        { proActive: false, creditsPurchased: 2 },
      ),
    ).toBe('credit');
    expect(
      decideCreateAllowance(
        { freeCardsUsed: 1, wishCreditsUsed: 2 },
        NOW,
        { proActive: false, creditsPurchased: 2 },
      ),
    ).toBe('none');
    expect(decideCreateAllowance({ freeCardsUsed: 1 }, NOW, noBilling)).toBe('none');
  });

  it('ignores junk values in the user document', () => {
    expect(
      decideCreateAllowance(
        { freeCardsUsed: -5, wishCreditsUsed: 'x', proCardTimes: 'no' },
        NOW,
        null,
      ),
    ).toBe('free');
    expect(
      decideCreateAllowance(
        { freeCardsUsed: 1, proCardTimes: ['a', null, NaN] },
        NOW,
        pro,
      ),
    ).toBe('pro');
  });
});

describe('linkTtlDaysFor', () => {
  it('gives Pro cards a year and everything else 30 days', () => {
    expect(linkTtlDaysFor('pro')).toBe(365);
    expect(linkTtlDaysFor('free')).toBe(30);
    expect(linkTtlDaysFor('credit')).toBe(30);
  });
});

describe('proCardTimesInWindow', () => {
  it('keeps only valid timestamps from the last 365 days', () => {
    expect(
      proCardTimesInWindow([NOW - DAY, NOW - 400 * DAY, 'x', NOW - 364 * DAY], NOW),
    ).toEqual([NOW - DAY, NOW - 364 * DAY]);
  });
});

describe('freeClaimId', () => {
  it('maps the same inbox to one id, whatever the spelling', () => {
    const base = freeClaimId('Priya.Sharma@Gmail.com');
    expect(base).toBeTruthy();
    expect(freeClaimId('priyasharma@gmail.com')).toBe(base);
    expect(freeClaimId('priya.sharma+cards@gmail.com')).toBe(base);
    expect(freeClaimId('priyasharma@googlemail.com')).toBe(base);
  });

  it('keeps dots meaningful outside Gmail and never exposes the address', () => {
    expect(freeClaimId('a.b@example.com')).not.toBe(freeClaimId('ab@example.com'));
    expect(freeClaimId('a.b@example.com')).not.toContain('example');
  });

  it('has no id without an email', () => {
    expect(freeClaimId(null)).toBeNull();
    expect(freeClaimId('')).toBeNull();
  });
});

describe('billingStateFromSubscriber', () => {
  const now = new Date('2026-06-15T00:00:00Z');

  it('reads an active Pro entitlement and counts single-wish purchases', () => {
    expect(
      billingStateFromSubscriber(
        {
          entitlements: { occasio_pro: { expires_date: '2026-07-01T00:00:00Z' } },
          non_subscriptions: { occasio_wish_single: [{}, {}], single_wish: [{}] },
        },
        now,
      ),
    ).toEqual({ proActive: true, creditsPurchased: 3 });
  });

  it('treats an expired entitlement as free', () => {
    expect(
      billingStateFromSubscriber(
        { entitlements: { occasio_pro: { expires_date: '2026-06-01T00:00:00Z' } } },
        now,
      ),
    ).toEqual({ proActive: false, creditsPurchased: 0 });
  });
});

describe('recipientEditAllowed', () => {
  it('allows case, spacing and small typo fixes', () => {
    expect(recipientEditAllowed('Priya', 'priya ')).toBe(true);
    expect(recipientEditAllowed('Pryia', 'Priya')).toBe(true);
    expect(recipientEditAllowed('Alexandra', 'Alexsandr')).toBe(true);
  });

  it('refuses a different person', () => {
    expect(recipientEditAllowed('Priya', 'Rahul')).toBe(false);
    expect(recipientEditAllowed('Mom', 'Dad')).toBe(false);
    expect(recipientEditAllowed('Anna', 'Emma')).toBe(false);
  });
});
