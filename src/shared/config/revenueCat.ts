/**
 * RevenueCat public SDK keys (safe in client — never put secret/webhook keys here).
 *
 * - Test Store key (`test_…`): works on both platforms for sandbox / Shipaton testing.
 * - Production: use platform keys `goog_…` (Android) and `appl_…` (iOS) from the dashboard.
 *
 * @see https://www.revenuecat.com/docs/getting-started/installation/reactnative
 */
export const revenueCatConfig = {
  /** Shared Test Store key — used when platform-specific keys are empty. */
  testApiKey: 'test_rjZzlhclstStOVZQJORtmFKGbdh',
  androidApiKey: '',
  iosApiKey: '',
} as const;

export function isRevenueCatConfigured(): boolean {
  return (
    revenueCatConfig.testApiKey.length > 0 ||
    revenueCatConfig.androidApiKey.length > 0 ||
    revenueCatConfig.iosApiKey.length > 0
  );
}