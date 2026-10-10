import { useCallback, useEffect, useMemo } from 'react';
import { AnalyticsEvents, trackEvent } from '../../../shared/analytics/events';
import { triggerSuccessHaptic } from '../../../shared/platform/haptics';
import { useSubscription } from '../../billing/application/useSubscription';
import type { BillingPlan } from '../../billing/domain/types';
import { hasSubscriptionPlans, pickSubscriptionPlans } from '../domain/onboardingPlans';

/** The plan step's view of billing: real store prices, one purchase path, no invented numbers. */
export function useOnboardingPlans(active: boolean) {
  const subscription = useSubscription();
  const { plans: allPlans, purchase, restore, clearError } = subscription;
  const plans = useMemo(() => pickSubscriptionPlans(allPlans), [allPlans]);

  useEffect(() => {
    if (active) {
      trackEvent(AnalyticsEvents.paywallShown, { source: 'onboarding' });
    }
  }, [active]);

  const buy = useCallback(
    async (plan: BillingPlan) => {
      trackEvent(AnalyticsEvents.onboardingPlanSelected, { planId: plan.id });
      const ok = await purchase(plan.id);
      if (ok) {
        triggerSuccessHaptic();
      }
      return ok;
    },
    [purchase],
  );

  const restorePurchases = useCallback(async () => {
    trackEvent(AnalyticsEvents.onboardingRestoreTapped);
    const ok = await restore();
    if (ok) {
      triggerSuccessHaptic();
    }
    return ok;
  }, [restore]);

  return {
    plans,
    canBuy: subscription.isConfigured && hasSubscriptionPlans(plans),
    isLoading: subscription.isConfigured && !subscription.isReady,
    isPaid: subscription.isPaid,
    isPurchasing: subscription.isPurchasing,
    error: subscription.error,
    clearError,
    buy,
    restore: restorePurchases,
  };
}
