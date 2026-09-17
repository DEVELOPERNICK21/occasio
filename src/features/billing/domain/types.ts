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

export type PaywallPresentResult =
  | 'purchased'
  | 'restored'
  | 'cancelled'
  | 'not_presented'
  | 'error';
