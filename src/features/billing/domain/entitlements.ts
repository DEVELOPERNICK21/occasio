/**
 * RevenueCat identifiers — must match the dashboard exactly.
 *
 * Entitlement: occasio_pro
 * Packages (current offering): lifetime | yearly | monthly
 */

/** Primary paid entitlement — unlocks Personal-tier features (Vault caps, quota, auto-send). */
export const ENTITLEMENT_PRO = 'occasio_pro';

/** Package identifiers on the current offering. */
export const PACKAGE_LIFETIME = 'lifetime';
export const PACKAGE_YEARLY = 'yearly';
export const PACKAGE_MONTHLY = 'monthly';

export const PACKAGE_IDS = [
  PACKAGE_LIFETIME,
  PACKAGE_YEARLY,
  PACKAGE_MONTHLY,
] as const;

export type PackageId = (typeof PACKAGE_IDS)[number];

export const ENTITLEMENT_IDS = [ENTITLEMENT_PRO] as const;

export type EntitlementId = (typeof ENTITLEMENT_IDS)[number];
