import { useBillingContext } from './BillingProvider';

/** Current subscription state — backed by RevenueCat when configured. */
export function useSubscription() {
  const billing = useBillingContext();

  return {
    tier: billing.tier,
    hasPro: billing.hasPro,
    isReady: billing.isReady,
    isConfigured: billing.isConfigured,
    isPaid: billing.hasPro || billing.tier !== 'free',
    isPurchasing: billing.isPurchasing,
    plans: billing.plans,
    error: billing.error,
    purchase: billing.purchase,
    restore: billing.restore,
    presentPaywall: billing.presentPaywall,
    openCustomerCenter: billing.openCustomerCenter,
    refresh: billing.refresh,
    clearError: billing.clearError,
  };
}
