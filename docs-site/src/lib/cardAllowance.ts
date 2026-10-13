/**
 * Who may create a new card, decided server-side. The app's own count is only a
 * hint for the UI: History can be deleted and the app can be modified, so the
 * counters here live on `users/{uid}`, which clients cannot write.
 *
 * Plan: one free card per person, ever. Pro includes 24 cards in any rolling
 * 365 days; beyond that, single-wish credits still work.
 */
import { createHash } from 'node:crypto';

export const FREE_CARD_LIMIT = 1;
export const PRO_YEARLY_CARD_LIMIT = 24;

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const ENTITLEMENT_PRO = 'occasio_pro';
const WISH_CREDIT_PRODUCT_IDS = ['occasio_wish_single', 'single_wish'];

export type BillingState = {
  proActive: boolean;
  creditsPurchased: number;
};

export type AllowanceUserDoc = {
  freeCardsUsed?: unknown;
  wishCreditsUsed?: unknown;
  /** Epoch ms of each card made under the Pro allowance. */
  proCardTimes?: unknown;
};

/** `needs_billing`: the free card is used and RevenueCat has not been asked yet. */
export type CreateAllowance = 'free' | 'pro' | 'credit' | 'none' | 'needs_billing';

/** Free cards and single wishes stay live for 30 days; Pro cards for a full year. */
export const FREE_LINK_TTL_DAYS = 30;
export const PRO_LINK_TTL_DAYS = 365;

/** Only a card made under the Pro allowance gets the year-long link. */
export function linkTtlDaysFor(allowance: 'free' | 'pro' | 'credit'): number {
  return allowance === 'pro' ? PRO_LINK_TTL_DAYS : FREE_LINK_TTL_DAYS;
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

export function freeCardsUsed(doc: AllowanceUserDoc): number {
  return count(doc.freeCardsUsed);
}

export function wishCreditsUsed(doc: AllowanceUserDoc): number {
  return count(doc.wishCreditsUsed);
}

/** Valid Pro card timestamps from the last 365 days (older ones free up a slot). */
export function proCardTimesInWindow(value: unknown, nowMs: number): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (t): t is number =>
      typeof t === 'number' && Number.isFinite(t) && t > nowMs - YEAR_MS && t <= nowMs,
  );
}

export function decideCreateAllowance(
  doc: AllowanceUserDoc,
  nowMs: number,
  billing: BillingState | null,
): CreateAllowance {
  if (freeCardsUsed(doc) < FREE_CARD_LIMIT) {
    return 'free';
  }
  if (!billing) {
    return 'needs_billing';
  }
  if (
    billing.proActive &&
    proCardTimesInWindow(doc.proCardTimes, nowMs).length < PRO_YEARLY_CARD_LIMIT
  ) {
    return 'pro';
  }
  return billing.creditsPurchased - wishCreditsUsed(doc) > 0 ? 'credit' : 'none';
}

/**
 * Stable id for "this inbox already had its free card", so deleting an account
 * and signing up again (same email, +tags, Gmail dots) does not refill it.
 * Only a hash is stored. `null` when the sign-in has no email.
 */
export function freeClaimId(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) {
    return null;
  }
  const at = trimmed.lastIndexOf('@');
  let local = trimmed.slice(0, at).split('+')[0] ?? '';
  let domain = trimmed.slice(at + 1);
  if (domain === 'googlemail.com') {
    domain = 'gmail.com';
  }
  if (domain === 'gmail.com') {
    local = local.replace(/\./g, '');
  }
  if (!local || !domain) {
    return null;
  }
  return createHash('sha256').update(`${local}@${domain}`).digest('hex');
}

type RcSubscriber = {
  entitlements?: Record<string, { expires_date?: string | null }>;
  non_subscriptions?: Record<string, unknown[]>;
};

export function billingStateFromSubscriber(
  subscriber: RcSubscriber,
  now: Date,
): BillingState {
  const pro = subscriber.entitlements?.[ENTITLEMENT_PRO];
  const expires = pro?.expires_date ? new Date(pro.expires_date) : null;
  const proActive = Boolean(pro) && (expires === null || expires > now);

  let creditsPurchased = 0;
  for (const productId of WISH_CREDIT_PRODUCT_IDS) {
    const purchases = subscriber.non_subscriptions?.[productId];
    if (Array.isArray(purchases)) {
      creditsPurchased += purchases.length;
    }
  }
  return { proActive, creditsPurchased };
}

/**
 * A brand-new Firebase uid (delete account, then sign in again) has no
 * RevenueCat subscriber yet. That is unpaid, not an outage — 5xx is the outage.
 */
export function billingStateFromRevenueCatHttp(
  status: number,
  subscriber: RcSubscriber | undefined,
  now: Date,
): BillingState {
  if (status === 404) {
    return { proActive: false, creditsPurchased: 0 };
  }
  if (status < 200 || status >= 300) {
    throw new Error(`revenuecat_${status}`);
  }
  return billingStateFromSubscriber(subscriber ?? {}, now);
}

/**
 * RevenueCat is the source of truth for plans and purchased credits. Without a
 * secret key nobody gets past the free card — failing open would give it away.
 */
export async function fetchBillingState(
  uid: string,
  now = new Date(),
): Promise<BillingState> {
  const secret = process.env.REVENUECAT_SECRET_KEY;
  if (!secret) {
    console.warn('[billing] REVENUECAT_SECRET_KEY is not set; paid wishes are refused');
    return { proActive: false, creditsPurchased: 0 };
  }
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' },
  );
  if (!res.ok) {
    return billingStateFromRevenueCatHttp(res.status, undefined, now);
  }
  const body = (await res.json()) as { subscriber?: RcSubscriber };
  return billingStateFromRevenueCatHttp(res.status, body.subscriber, now);
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Edit distance where swapping two neighbouring letters counts as one edit. */
function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
      }
    }
  }
  return d[a.length]![b.length]!;
}

/**
 * A link is made for one person. Editing is free, so without this a single
 * free link could be rewritten and resent to anyone. Typo fixes still pass.
 */
export function recipientEditAllowed(previous: string, next: string): boolean {
  const a = normalizeName(previous);
  const b = normalizeName(next);
  if (a === b) {
    return true;
  }
  const length = Math.min(a.length, b.length);
  const tolerance = length >= 8 ? 2 : length >= 4 ? 1 : 0;
  return editDistance(a, b) <= tolerance;
}
