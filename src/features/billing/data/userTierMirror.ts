import firestore from '@react-native-firebase/firestore';
import type { SubscriptionTier } from '../../vault/domain/types';

const VALID_TIERS: SubscriptionTier[] = ['free', 'personal', 'family'];

function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === 'string' && VALID_TIERS.includes(value as SubscriptionTier);
}

/**
 * Mirror RevenueCat-derived tier on users/{uid} for server-side autosend gates.
 * Client-only; cron reads this field (missing → free).
 */
export async function mirrorSubscriptionTier(
  userId: string,
  tier: SubscriptionTier,
): Promise<void> {
  if (!userId || !isSubscriptionTier(tier)) {
    return;
  }

  await firestore()
    .collection('users')
    .doc(userId)
    .set({ subscriptionTier: tier }, { merge: true });
}
