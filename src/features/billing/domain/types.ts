export type BillingPlan = {
  id: string;
  title: string;
  priceLabel: string;
  periodLabel: string;
};

export type BillingCustomerSnapshot = {
  appUserId: string;
  tier: import('../../vault/domain/types').SubscriptionTier;
  hasPro: boolean;
  activeEntitlements: string[];
  originalAppUserId: string | null;
};

/** How a wish beyond the free monthly allowance can be created, if at all. */
export type ExtraWishAccess = 'pro' | 'credit' | 'none';

export type PaywallPresentResult =
  | 'purchased'
  | 'restored'
  | 'cancelled'
  | 'not_presented'
  | 'error';
