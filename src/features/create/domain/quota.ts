import type { SubscriptionTier } from '../../billing/domain/types';

import { FREE_CARD_LIMIT, PRO_YEARLY_CARD_LIMIT } from '../../billing/domain/wishBalance';

/**
 * One free card per account, ever, and 24 Pro cards per rolling year (beyond that single wishes work).
 * Billing owns the numbers, since it also shows what is left; they are the same ones the server enforces.
 */
export { FREE_CARD_LIMIT, PRO_YEARLY_CARD_LIMIT };

type QuotaOptions = {
  /** Dev builds only — unlimited generates for testing. */
  bypassQuota?: boolean;
};

/** Free tier: 1 card in total. Paid tiers: the yearly allowance is counted by the server. */
export function canCreateManualCard(
  cardsCreated: number,
  tier: SubscriptionTier = 'free',
  options: QuotaOptions = {},
): boolean {
  if (options.bypassQuota) {
    return true;
  }
  if (tier !== 'free') {
    return true;
  }
  return cardsCreated < FREE_CARD_LIMIT;
}

export function shouldShowPaywall(
  cardsCreated: number,
  tier: SubscriptionTier = 'free',
  options: QuotaOptions = {},
): boolean {
  return !canCreateManualCard(cardsCreated, tier, options);
}

/** `null` when the tier has a paid allowance — nothing to count down. */
export function freeCardsRemaining(
  cardsCreated: number,
  tier: SubscriptionTier = 'free',
): number | null {
  if (tier !== 'free') {
    return null;
  }
  return Math.max(0, FREE_CARD_LIMIT - cardsCreated);
}

/**
 * Told up front, before the work — a limit discovered at the share step reads
 * as a trap even when the limit itself is fair.
 */
export function freeQuotaNotice(
  cardsCreated: number,
  tier: SubscriptionTier = 'free',
  /** False for an email and password account, which cannot claim the free card. */
  viaGoogleOrApple = true,
): string | null {
  const remaining = freeCardsRemaining(cardsCreated, tier);
  if (remaining === null) {
    return null;
  }
  if (remaining === 0) {
    return 'Your free card is used — buy one more wish or pick a plan when you are ready.';
  }
  if (remaining === 1) {
    return viaGoogleOrApple
      ? 'Your first card is free.'
      : 'Your first card is free with Google or Apple sign-in.';
  }
  return `${remaining} free cards left.`;
}
