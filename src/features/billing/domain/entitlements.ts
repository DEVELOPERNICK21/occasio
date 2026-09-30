/**
 * RevenueCat identifiers — must match the dashboard exactly.
 *
 * Entitlement: occasio_pro (monthly | yearly subscriptions)
 * Packages (current offering): monthly | yearly | single_wish
 */

/** Primary paid entitlement — unlocks Personal-tier features (Vault caps, quota, auto-send). */
export const ENTITLEMENT_PRO = 'occasio_pro';

/** Package identifiers on the current offering. */
export const PACKAGE_YEARLY = 'yearly';
export const PACKAGE_MONTHLY = 'monthly';
/** Consumable — one extra wish beyond the free monthly allowance. Not tied to the entitlement. */
export const PACKAGE_SINGLE_WISH = 'single_wish';

export const PACKAGE_IDS = [
  PACKAGE_YEARLY,
  PACKAGE_MONTHLY,
  PACKAGE_SINGLE_WISH,
] as const;

export type PackageId = (typeof PACKAGE_IDS)[number];

/** Store product ids of the single-wish consumable (App Store / Play, Test Store). */
export const WISH_CREDIT_PRODUCT_IDS = ['occasio_wish_single', 'single_wish'] as const;

export const ENTITLEMENT_IDS = [ENTITLEMENT_PRO] as const;

export type EntitlementId = (typeof ENTITLEMENT_IDS)[number];
