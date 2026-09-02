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
