import {
  FREE_CARD_LIMIT,
  NO_PURCHASES,
  PRO_YEARLY_CARD_LIMIT,
  balanceDetail,
  balanceHeadline,
  balanceParts,
  balanceRows,
  computeWishBalance,
  emptyGuidance,
  formatDay,
  nextWishNotice,
  purchaseSummaryFrom,
  type AllowanceCounters,
  type PurchaseSummary,
} from '../../src/features/billing/domain/wishBalance';

const now = new Date(2026, 10, 9, 12, 0, 0);
const day = 24 * 60 * 60 * 1000;

const fresh: AllowanceCounters = { freeCardsUsed: 0, wishCreditsUsed: 0, proCardTimes: [] };
const usedFree: AllowanceCounters = { ...fresh, freeCardsUsed: 1 };
const pro = (productId = 'occasio_pro_yearly', expiresAt: string | null = '2027-11-03T00:00:00.000Z', willRenew = true) =>
  ({ ...NO_PURCHASES, pro: { productId, expiresAt, willRenew } }) satisfies PurchaseSummary;
const credits = (n: number, last: string | null = '2026-11-04T10:00:00.000Z'): PurchaseSummary => ({
  ...NO_PURCHASES,
  creditsPurchased: n,
  lastCreditPurchasedAt: last,
});

describe('the limits match the server', () => {
  it('is one free card and 24 Pro cards a year', () => {
    expect(FREE_CARD_LIMIT).toBe(1);
    expect(PRO_YEARLY_CARD_LIMIT).toBe(24);
  });
});

describe('computeWishBalance', () => {
  it('starts with the free card', () => {
    const balance = computeWishBalance(fresh, NO_PURCHASES, now);
    expect(balance.ready).toBe(1);
    expect(balance.next).toBe('free');
    expect(balance.free).toEqual({ limit: 1, used: 0, left: 1 });
    expect(balance.pro).toBeNull();
    expect(balanceHeadline(balance)).toBe('1 wish ready');
  });

  it('has nothing left once the free card is used and nothing was bought', () => {
    const balance = computeWishBalance(usedFree, NO_PURCHASES, now);
    expect(balance.ready).toBe(0);
    expect(balance.next).toBe('none');
    expect(balanceHeadline(balance)).toBe('No wishes left');
    expect(balanceDetail(balance)).toBe(
      'Your free card is used. Buy one wish, or choose Occasio Pro for 24 cards a year.',
    );
    expect(nextWishNotice(balance)).toBeNull();
  });

  it('shows a bought wish: bought minus used, never below zero', () => {
    expect(computeWishBalance(usedFree, credits(3), now).credits).toMatchObject({ purchased: 3, used: 0, left: 3 });
    const spent = computeWishBalance({ ...usedFree, wishCreditsUsed: 1 }, credits(3), now);
    expect(spent.credits).toMatchObject({ purchased: 3, used: 1, left: 2 });
    expect(spent.ready).toBe(2);
    expect(spent.next).toBe('credit');
    const over = computeWishBalance({ ...usedFree, wishCreditsUsed: 5 }, credits(3), now);
    expect(over.credits.left).toBe(0);
    expect(over.credits.used).toBe(3);
  });

  it('counts only Pro cards from the last 365 days, and says when the oldest frees a slot', () => {
    const times = [now.getTime() - 400 * day, now.getTime() - 100 * day, now.getTime() - 5 * day];
    const balance = computeWishBalance({ ...usedFree, proCardTimes: times }, pro(), now);
    expect(balance.pro?.used).toBe(2);
    expect(balance.pro?.left).toBe(22);
    expect(balance.pro?.nextSlotAt?.getTime()).toBe(now.getTime() - 100 * day + 365 * day);
    expect(balance.next).toBe('pro');
  });

  it('ignores times that are in the future or not numbers', () => {
    const balance = computeWishBalance(
      { ...usedFree, proCardTimes: [now.getTime() + day, Number.NaN, now.getTime() - day] },
      pro(),
      now,
    );
    expect(balance.pro?.used).toBe(1);
  });

  it('adds the sources up in the order the server spends them: free, then Pro, then bought', () => {
    const balance = computeWishBalance(
      { freeCardsUsed: 0, wishCreditsUsed: 0, proCardTimes: [now.getTime() - day] },
      { ...pro(), creditsPurchased: 2, lastCreditPurchasedAt: null },
      now,
    );
    expect(balance.ready).toBe(1 + 23 + 2);
    expect(balance.next).toBe('free');
    expect(balanceParts(balance)).toEqual([
      '1 free card',
      '23 of 24 Pro cards left this year',
      '2 extra wishes',
    ]);
  });

  it('falls back to a bought wish when every Pro card is used', () => {
    const times = Array.from({ length: 24 }, (_, i) => now.getTime() - (i + 1) * day);
    const balance = computeWishBalance({ ...usedFree, proCardTimes: times }, { ...pro(), creditsPurchased: 1, lastCreditPurchasedAt: null }, now);
    expect(balance.pro?.left).toBe(0);
    expect(balance.next).toBe('credit');
    expect(balance.ready).toBe(1);
    expect(balanceParts(balance)).toEqual(['0 of 24 Pro cards left this year', '1 extra wish']);
  });

  it('tells a Pro member who is out what to do, with the date a slot opens', () => {
    const oldest = now.getTime() - 100 * day;
    const times = Array.from({ length: 24 }, (_, i) => oldest + i * day);
    const balance = computeWishBalance({ ...usedFree, proCardTimes: times }, pro(), now);
    expect(balance.ready).toBe(0);
    expect(emptyGuidance(balance)).toBe(
      `All 24 Pro cards for the year are used. Your next one opens on ${formatDay(new Date(oldest + 365 * day))}, or buy an extra wish.`,
    );
  });

  it('names the plan from the product', () => {
    expect(computeWishBalance(fresh, pro('occasio_pro_yearly'), now).pro?.planLabel).toBe('Occasio Pro, yearly');
    expect(computeWishBalance(fresh, pro('occasio_pro_monthly'), now).pro?.planLabel).toBe('Occasio Pro, monthly');
    expect(computeWishBalance(fresh, pro('something_else'), now).pro?.planLabel).toBe('Occasio Pro');
    expect(computeWishBalance(fresh, pro(null as unknown as string), now).pro?.planLabel).toBe('Occasio Pro');
  });
});

describe('the words', () => {
  it('says which wish the next card uses', () => {
    expect(nextWishNotice(computeWishBalance(fresh, NO_PURCHASES, now))).toBe('This uses your free card.');
    expect(nextWishNotice(computeWishBalance(usedFree, pro(), now))).toBe(
      'This uses 1 of your 24 Pro cards left this year.',
    );
    expect(nextWishNotice(computeWishBalance(usedFree, credits(2), now))).toBe('This uses 1 of your 2 extra wishes.');
    expect(nextWishNotice(computeWishBalance(usedFree, credits(1), now))).toBe('This uses 1 of your 1 extra wish.');
  });

  it('writes the profile rows with real dates and counts', () => {
    const balance = computeWishBalance(
      { freeCardsUsed: 1, wishCreditsUsed: 1, proCardTimes: [now.getTime() - 5 * day, now.getTime() - 6 * day, now.getTime() - 7 * day] },
      { ...pro('occasio_pro_yearly', '2027-11-03T00:00:00.000Z', true), creditsPurchased: 3, lastCreditPurchasedAt: '2026-11-04T10:00:00.000Z' },
      now,
    );
    const rows = balanceRows(balance);
    expect(rows.map((r) => r.label)).toEqual(['Plan', 'Pro cards this year', 'Extra wishes', 'Free card']);
    expect(rows[0]).toMatchObject({ value: 'Occasio Pro, yearly', note: 'Renews on 3 Nov 2027' });
    expect(rows[1]).toMatchObject({ value: '21 of 24 left', progress: 21 / 24 });
    expect(rows[2]).toMatchObject({
      value: '2 ready',
      note: '3 bought, 1 used. Last bought 4 Nov 2026.',
    });
    expect(rows[3]).toMatchObject({ value: 'Used' });
  });

  it('says a plan that will not renew ends, and a free account what Pro adds', () => {
    const ends = balanceRows(computeWishBalance(fresh, pro('occasio_pro_monthly', '2026-12-01T00:00:00.000Z', false), now));
    expect(ends[0]!.note).toBe('Ends on 1 Dec 2026. It will not renew.');

    const free = balanceRows(computeWishBalance(fresh, NO_PURCHASES, now));
    expect(free[0]).toMatchObject({ value: 'Free', note: 'Occasio Pro adds 24 cards a year.' });
    expect(free.find((r) => r.label === 'Extra wishes')).toMatchObject({ value: 'None bought' });
    expect(free.find((r) => r.label === 'Free card')).toMatchObject({ value: 'Not used yet' });
  });

  it('keeps to the project voice: calm, no exclamation marks, no emoji', () => {
    const cases = [
      computeWishBalance(fresh, NO_PURCHASES, now),
      computeWishBalance(usedFree, NO_PURCHASES, now),
      computeWishBalance(usedFree, pro(), now),
      computeWishBalance(usedFree, credits(2), now),
    ];
    for (const balance of cases) {
      const text = [balanceHeadline(balance), balanceDetail(balance), nextWishNotice(balance) ?? '', ...balanceRows(balance).flatMap((r) => [r.label, r.value, r.note ?? ''])].join(' ');
      expect(text).not.toContain('!');
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});

describe('purchaseSummaryFrom', () => {
  const info = {
    entitlements: {
      active: {
        occasio_pro: { productIdentifier: 'occasio_pro_yearly', expirationDate: '2027-11-03T00:00:00.000Z', willRenew: true },
      },
    },
    nonSubscriptionTransactions: [
      { productIdentifier: 'occasio_wish_single', purchaseDate: '2026-10-01T00:00:00.000Z' },
      { productIdentifier: 'something_else', purchaseDate: '2026-11-08T00:00:00.000Z' },
      { productIdentifier: 'single_wish', purchaseDate: '2026-11-04T10:00:00.000Z' },
    ],
  };

  it('reads the Pro plan and counts only single-wish purchases', () => {
    expect(purchaseSummaryFrom(info)).toEqual({
      pro: { productId: 'occasio_pro_yearly', expiresAt: '2027-11-03T00:00:00.000Z', willRenew: true },
      creditsPurchased: 2,
      lastCreditPurchasedAt: '2026-11-04T10:00:00.000Z',
    });
  });

  it('has no plan and no wishes when nothing was bought', () => {
    expect(purchaseSummaryFrom({ entitlements: { active: {} }, nonSubscriptionTransactions: [] })).toEqual(NO_PURCHASES);
  });
});
