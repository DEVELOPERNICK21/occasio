import type { SubscriptionTier } from '../../vault/domain/types';
import { ENTITLEMENT_PRO } from './entitlements';

/**
 * Map active RevenueCat entitlement IDs → Occasio subscription tier.
 * `occasio_pro` unlocks Personal-tier limits (5 Vault people, unlimited cards).
 */
export function tierFromEntitlements(
  activeEntitlementIds: readonly string[],
): SubscriptionTier {
  if (activeEntitlementIds.includes(ENTITLEMENT_PRO)) {
    return 'personal';
  }
  return 'free';
}

export function hasProEntitlement(
  activeEntitlementIds: readonly string[],
): boolean {
  return activeEntitlementIds.includes(ENTITLEMENT_PRO);
}

export function activeEntitlementIdsFromRecord(
  activeEntitlements: Record<string, unknown>,
): string[] {
  return Object.keys(activeEntitlements);
}
