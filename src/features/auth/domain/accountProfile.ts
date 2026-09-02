import type { SubscriptionTier } from '../../vault/domain/types';
import type { AuthUser } from './types';
import { formatAuthIdentity } from './mapUser';

export function tierDisplayLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case 'personal':
      return 'PERSONAL TIER';
    case 'family':
      return 'FAMILY TIER';
    default:
      return 'FREE TIER';
  }
}

export function memberSinceLabel(createdAt: string | null): string {
  if (!createdAt) {
    return 'Member since you joined';
  }
  const year = new Date(createdAt).getFullYear();
  return Number.isFinite(year) ? `Member since ${year}` : 'Member since you joined';
}

export function profileBio(_user: AuthUser): string {
  return "Curating life's most exquisite moments with precision and elegance. Your legacy, beautifully managed.";
}

export function profileInitials(user: AuthUser): string {
  const name = formatAuthIdentity(user);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'OC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function subscriptionStatusCopy(tier: SubscriptionTier): string {
  switch (tier) {
    case 'personal':
      return 'Your current status is Personal Tier. Billed annually when store billing ships.';
    case 'family':
      return 'Your current status is Family Tier. Billed annually when store billing ships.';
    default:
      return 'Your current status is Free Tier. Upgrade for unlimited cards and Vault.';
  }
}

export function subscriptionPaymentLabel(tier: SubscriptionTier): string {
  return tier === 'free' ? 'Not billed' : 'When billing launches';
}

export function subscriptionAmountLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case 'personal':
      return 'Plus plan';
    case 'family':
      return 'Family plan';
    default:
      return 'Free';
  }
}
