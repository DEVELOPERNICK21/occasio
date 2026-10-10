/**
 * Auto-renewal disclosure (California ARL and similar). Shown beside every
 * button that starts a subscription, so the person sees the interval, that it
 * renews until cancelled, and how to cancel, before they confirm.
 */
export type StorePlatform = 'ios' | 'android' | 'other';

export function storeLabel(platform: StorePlatform): string {
  if (platform === 'ios') return 'your App Store account settings';
  if (platform === 'android') return 'Google Play subscriptions';
  return 'your store account settings';
}

/** Cancelling is in the app first (no email, no support ticket), then the store. */
export function renewalTerms(platform: StorePlatform): string {
  return `Renews automatically until you cancel. Cancel any time in Account → Manage subscription, or in ${storeLabel(platform)}.`;
}

/** Where the store lets people manage or cancel, for when the in-app screen cannot open. */
export function subscriptionsUrl(platform: StorePlatform): string {
  return platform === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';
}

/** What a plan row says about renewal. One-time purchases do not renew. */
export function renewalPeriodLabel(interval: 'monthly' | 'yearly'): string {
  return interval === 'monthly'
    ? 'Renews monthly until you cancel'
    : 'Renews yearly until you cancel';
}
