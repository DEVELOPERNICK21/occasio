import type { SubscriptionTier } from '../../vault/domain/types';
import type { AuthUser } from './types';
import { formatAuthIdentity } from './mapUser';

export function tierDisplayLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case 'personal':
      return 'OCCASIO PRO';
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
      return 'You have Occasio Pro — unlimited cards, Vault for up to 5 people, and year-long links.';
    case 'family':
      return 'You have Family — Vault for up to 15 people.';
    default:
      return 'Free tier: 1 card per month and 1 Vault person. Upgrade to Occasio Pro for more.';
  }
}

export function subscriptionPaymentLabel(tier: SubscriptionTier): string {
  return tier === 'free' ? 'Not billed' : 'Active via store';
}

export function subscriptionAmountLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case 'personal':
      return 'Occasio Pro';
    case 'family':
      return 'Family';
    default:
      return 'Free';
  }
}
