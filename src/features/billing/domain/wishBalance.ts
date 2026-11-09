import { ENTITLEMENT_PRO, WISH_CREDIT_PRODUCT_IDS } from './entitlements';

/**
 * What a person has left to send, in one place: the free card, the Pro cards for the year, and the single
 * wishes they bought. The server decides who may create a card and keeps the counters
 * (`users/{uid}`: `freeCardsUsed`, `wishCreditsUsed`, `proCardTimes`); this only reads them back, so
 * the numbers on screen are the ones the server will enforce.
 */

/** One free card per account, ever. Must match `docs-site/src/lib/cardAllowance.ts`. */
export const FREE_CARD_LIMIT = 1;
/** Pro includes this many cards in any rolling 365 days; beyond it, single wishes still work. */
export const PRO_YEARLY_CARD_LIMIT = 24;

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/** The counters on `users/{uid}`. */
export type AllowanceCounters = {
  freeCardsUsed: number;
  wishCreditsUsed: number;
  /** Epoch ms of each card made under the Pro allowance. */
  proCardTimes: number[];
};

/** What the store says the person has bought. */
export type PurchaseSummary = {
  pro: { productId: string | null; expiresAt: string | null; willRenew: boolean } | null;
  creditsPurchased: number;
  lastCreditPurchasedAt: string | null;
};

export const NO_PURCHASES: PurchaseSummary = {
  pro: null,
  creditsPurchased: 0,
  lastCreditPurchasedAt: null,
};

/** The parts of RevenueCat's customer info this needs, so it can be read without the SDK. */
export type CustomerInfoLike = {
  entitlements: {
    active: Record<
      string,
      { productIdentifier: string; expirationDate: string | null; willRenew: boolean }
    >;
  };
  nonSubscriptionTransactions: ReadonlyArray<{ productIdentifier: string; purchaseDate: string }>;
};

export function purchaseSummaryFrom(info: CustomerInfoLike): PurchaseSummary {
  const entitlement = info.entitlements.active[ENTITLEMENT_PRO];
  const wishIds: readonly string[] = WISH_CREDIT_PRODUCT_IDS;
  const credits = info.nonSubscriptionTransactions.filter((t) => wishIds.includes(t.productIdentifier));
  const last = credits.map((t) => t.purchaseDate).sort().pop() ?? null;
  return {
    pro: entitlement
      ? {
          productId: entitlement.productIdentifier ?? null,
          expiresAt: entitlement.expirationDate ?? null,
          willRenew: entitlement.willRenew === true,
        }
      : null,
    creditsPurchased: credits.length,
    lastCreditPurchasedAt: last,
  };
}

/** What the next card will use. The server spends them in this order. */
export type WishSource = 'free' | 'pro' | 'credit' | 'none';

export type WishBalance = {
  free: { limit: number; used: number; left: number };
  credits: { purchased: number; used: number; left: number; lastPurchasedAt: Date | null };
  pro: null | {
    limit: number;
    used: number;
    left: number;
    /** When the oldest card of the year frees a slot; only meaningful once they are all used. */
    nextSlotAt: Date | null;
    planLabel: string;
    endsAt: Date | null;
    willRenew: boolean;
  };
  /** Cards that can be made right now. */
  ready: number;
  next: WishSource;
};

function whole(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function planLabel(productId: string | null): string {
  const id = (productId ?? '').toLowerCase();
  if (id.includes('year') || id.includes('annual')) return 'Occasio Pro, yearly';
  if (id.includes('month')) return 'Occasio Pro, monthly';
  return 'Occasio Pro';
}

export function computeWishBalance(
  counters: AllowanceCounters,
  summary: PurchaseSummary,
  now: Date = new Date(),
): WishBalance {
  const freeUsed = whole(counters.freeCardsUsed);
  const free = {
    limit: FREE_CARD_LIMIT,
    used: Math.min(freeUsed, FREE_CARD_LIMIT),
    left: Math.max(0, FREE_CARD_LIMIT - freeUsed),
  };

  const purchased = whole(summary.creditsPurchased);
  const creditsUsed = whole(counters.wishCreditsUsed);
  const credits = {
    purchased,
    used: Math.min(creditsUsed, purchased),
    left: Math.max(0, purchased - creditsUsed),
    lastPurchasedAt: toDate(summary.lastCreditPurchasedAt),
  };

  let pro: WishBalance['pro'] = null;
  if (summary.pro) {
    const windowStart = now.getTime() - YEAR_MS;
    const times = counters.proCardTimes
      .filter((t) => Number.isFinite(t) && t > windowStart && t <= now.getTime())
      .sort((a, b) => a - b);
    const used = times.length;
    pro = {
      limit: PRO_YEARLY_CARD_LIMIT,
      used,
      left: Math.max(0, PRO_YEARLY_CARD_LIMIT - used),
      nextSlotAt: times.length > 0 ? new Date(times[0]! + YEAR_MS) : null,
      planLabel: planLabel(summary.pro.productId),
      endsAt: toDate(summary.pro.expiresAt),
      willRenew: summary.pro.willRenew,
    };
  }

  const next: WishSource =
    free.left > 0 ? 'free' : pro && pro.left > 0 ? 'pro' : credits.left > 0 ? 'credit' : 'none';

  return { free, credits, pro, ready: free.left + (pro?.left ?? 0) + credits.left, next };
}

/* ------------------------------------------------------------------ words */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "12 Mar 2027". */
export function formatDay(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function wishes(count: number): string {
  return count === 1 ? 'wish' : 'wishes';
}

/** "3 wishes ready", or the plain fact that there are none. */
export function balanceHeadline(balance: WishBalance): string {
  return balance.ready > 0 ? `${balance.ready} ${wishes(balance.ready)} ready` : 'No wishes left';
}

/** Where the ready wishes come from: "1 free card · 21 of 24 Pro cards left this year · 2 extra wishes". */
export function balanceParts(balance: WishBalance): string[] {
  const parts: string[] = [];
  if (balance.free.left > 0) {
    parts.push(`${balance.free.left} free ${balance.free.left === 1 ? 'card' : 'cards'}`);
  }
  if (balance.pro) {
    parts.push(`${balance.pro.left} of ${balance.pro.limit} Pro cards left this year`);
  }
  if (balance.credits.left > 0) {
    parts.push(`${balance.credits.left} extra ${wishes(balance.credits.left)}`);
  }
  return parts;
}

/** What to do when there is nothing left, said once and plainly. */
export function emptyGuidance(balance: WishBalance): string {
  if (balance.pro) {
    const opens = balance.pro.nextSlotAt ? `Your next one opens on ${formatDay(balance.pro.nextSlotAt)}, or buy` : 'Buy';
    return `All ${balance.pro.limit} Pro cards for the year are used. ${opens} an extra wish.`;
  }
  return 'Your free card is used. Buy one wish, or choose Occasio Pro for 24 cards a year.';
}

/** The second line under the headline: the sources, or what to do about having none. */
export function balanceDetail(balance: WishBalance): string {
  return balance.ready > 0 ? balanceParts(balance).join(' · ') : emptyGuidance(balance);
}

/** Said on the review screen, before a card is made: which of the wishes this one uses. */
export function nextWishNotice(balance: WishBalance): string | null {
  switch (balance.next) {
    case 'free':
      return 'This uses your free card.';
    case 'pro':
      return `This uses 1 of your ${balance.pro?.left ?? 0} Pro cards left this year.`;
    case 'credit':
      return `This uses 1 of your ${balance.credits.left} extra ${wishes(balance.credits.left)}.`;
    default:
      return null;
  }
}

export type BalanceRow = {
  label: string;
  value: string;
  note?: string;
  /** 0 to 1, for a bar. */
  progress?: number;
};

/** The profile's "what you have" rows, with every word and date worked out. */
export function balanceRows(balance: WishBalance): BalanceRow[] {
  const rows: BalanceRow[] = [];

  if (balance.pro) {
    const { endsAt, willRenew } = balance.pro;
    rows.push({
      label: 'Plan',
      value: balance.pro.planLabel,
      note: endsAt
        ? willRenew
          ? `Renews on ${formatDay(endsAt)}`
          : `Ends on ${formatDay(endsAt)}. It will not renew.`
        : 'Billed through your store account.',
    });
    rows.push({
      label: 'Pro cards this year',
      value: `${balance.pro.left} of ${balance.pro.limit} left`,
      note:
        balance.pro.left === 0 && balance.pro.nextSlotAt
          ? `The next one opens on ${formatDay(balance.pro.nextSlotAt)}.`
          : undefined,
      progress: balance.pro.limit > 0 ? balance.pro.left / balance.pro.limit : 0,
    });
  } else {
    rows.push({ label: 'Plan', value: 'Free', note: 'Occasio Pro adds 24 cards a year.' });
  }

  rows.push({
    label: 'Extra wishes',
    value: balance.credits.purchased > 0 ? `${balance.credits.left} ready` : 'None bought',
    note:
      balance.credits.purchased > 0
        ? `${balance.credits.purchased} bought, ${balance.credits.used} used${
            balance.credits.lastPurchasedAt ? `. Last bought ${formatDay(balance.credits.lastPurchasedAt)}.` : '.'
          }`
        : 'Each one makes one more card.',
  });

  rows.push({
    label: 'Free card',
    value: balance.free.left > 0 ? 'Not used yet' : 'Used',
  });

  return rows;
}
