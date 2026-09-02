import type { SubscriptionTier } from './quota';

/** Public greeting links — guest and free manual cards. */
export const SHARE_LINK_TTL_DAYS = {
  guest: 30,
  free: 30,
  paid: 365,
  /** Dev / local API only — short TTL for faster expiry testing. */
  dev: 3,
} as const;

type ShareLinkTtlOptions = {
  /** Dev builds only — links expire in 3 days. */
  devShortTtl?: boolean;
};

export function shareLinkTtlDays(
  tier: SubscriptionTier = 'free',
  isGuest = true,
  options: ShareLinkTtlOptions = {},
): number {
  if (options.devShortTtl) {
    return SHARE_LINK_TTL_DAYS.dev;
  }
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
  options: ShareLinkTtlOptions = {},
): Date {
  const days = shareLinkTtlDays(tier, isGuest, options);
  return new Date(createdAt.getTime() + days * 24 * 60 * 60 * 1000);
}
