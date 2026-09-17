export type SubscriptionTier = 'free' | 'personal' | 'family';

export const FREE_MONTHLY_CARD_LIMIT = 1;

type QuotaOptions = {
  /** Dev builds only — unlimited generates for testing. */
  bypassQuota?: boolean;
};

/** Free tier: 1 manual card per calendar month. Paid tiers: unlimited. */
export function canCreateManualCard(
  cardsCreatedThisMonth: number,
  tier: SubscriptionTier = 'free',
  options: QuotaOptions = {},
): boolean {
  if (options.bypassQuota) {
    return true;
  }
  if (tier !== 'free') {
    return true;
  }
  return cardsCreatedThisMonth < FREE_MONTHLY_CARD_LIMIT;
}

export function shouldShowPaywall(
  cardsCreatedThisMonth: number,
  tier: SubscriptionTier = 'free',
  options: QuotaOptions = {},
): boolean {
  return !canCreateManualCard(cardsCreatedThisMonth, tier, options);
}

/** `null` when the tier is unlimited — nothing to count down. */
export function freeCardsRemaining(
  cardsCreatedThisMonth: number,
  tier: SubscriptionTier = 'free',
): number | null {
  if (tier !== 'free') {
    return null;
  }
  return Math.max(0, FREE_MONTHLY_CARD_LIMIT - cardsCreatedThisMonth);
}

/**
 * Told up front, before the work — a limit discovered at the share step reads
 * as a trap even when the limit itself is fair.
 */
export function freeQuotaNotice(
  cardsCreatedThisMonth: number,
  tier: SubscriptionTier = 'free',
): string | null {
  const remaining = freeCardsRemaining(cardsCreatedThisMonth, tier);
  if (remaining === null) {
    return null;
  }
  if (remaining === 0) {
    return 'Free card used this month — a plan unlocks more when you are ready.';
  }
  if (remaining === 1) {
    return '1 free card left this month.';
  }
  return `${remaining} free cards left this month.`;
}
