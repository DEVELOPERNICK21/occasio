/**
 * RevenueCat public SDK keys (safe in client — never put secret/webhook keys here).
 *
 * - Test Store key (`test_…`): works on both platforms for sandbox / Shipaton testing.
 * - Production: use platform keys `goog_…` (Android) and `appl_…` (iOS) from the dashboard.
 *
 * @see https://www.revenuecat.com/docs/getting-started/installation/reactnative
 */
export const revenueCatConfig = {
  /**
   * Test Store key: sandbox purchases that never reach a real store. It exists
   * only in debug builds. `__DEV__` is a compile-time constant, so release
   * bundles drop the string entirely (RevenueCat rejects apps that ship it).
   */
  testApiKey: __DEV__ ? 'test_rjZzlhclstStOVZQJORtmFKGbdh' : '',
  /** Google Play app `com.occasio.greetings` — used by release builds. */
  androidApiKey: 'goog_AldUMUxDVYoUQqEFJAksKcgKodk',
  /** App Store app `com.occasio.ios` — used by release builds. */
  iosApiKey: 'appl_YGUxmXJZsprHOzNOQEXelybdsjn',
} as const;

export function isRevenueCatConfigured(): boolean {
  return (
    revenueCatConfig.testApiKey.length > 0 ||
    revenueCatConfig.androidApiKey.length > 0 ||
    revenueCatConfig.iosApiKey.length > 0
  );
}