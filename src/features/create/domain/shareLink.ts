import type { SubscriptionTier } from './quota';

/** Public greeting links — guest and free manual cards. */
export const SHARE_LINK_TTL_DAYS = {
  guest: 30,
  free: 30,
  paid: 365,
} as const;

export function shareLinkTtlDays(
  tier: SubscriptionTier = 'free',
  isGuest = true,
): number {
  if (isGuest) {
    return SHARE_LINK_TTL_DAYS.guest;
  }
  if (tier === 'free') {
    return SHARE_LINK_TTL_DAYS.free;
  }
  return SHARE_LINK_TTL_DAYS.paid;
}

export function computeShareLinkExpiresAt(
  createdAt: Date,
  tier: SubscriptionTier = 'free',
  isGuest = true,
): Date {
  const days = shareLinkTtlDays(tier, isGuest);
  return new Date(createdAt.getTime() + days * 24 * 60 * 60 * 1000);
}
