import type { SubscriptionTier } from './types';

export function personCapForTier(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free':
      return 1;
    case 'personal':
      return 5;
    case 'family':
      return 15;
    default:
      return 1;
  }
}

export function canAddPerson(currentCount: number, tier: SubscriptionTier): boolean {
  return currentCount < personCapForTier(tier);
}

/** Auto-send is a paid feature — free tier can save people but not arm sends. */
export function canEnableAutoSend(tier: SubscriptionTier): boolean {
  return tier !== 'free';
}
