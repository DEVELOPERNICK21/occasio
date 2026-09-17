import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AnalyticsEvents, trackEvent } from '../../../shared/analytics/events';
import { useAuth } from '../../auth/application/useAuth';
import type { SubscriptionTier } from '../../vault/domain/types';
import {
  addCustomerInfoListener,
  canUseRevenueCat,
  configureRevenueCat,
  fetchBillingPlans,
  fetchHasPro,
  fetchSubscriptionTier,
  purchaseBillingPlan,
  restoreBillingPurchases,
  syncRevenueCatUser,
} from '../data/revenueCatClient';
import {
  presentCustomerCenter,
  presentProPaywall,
  presentProPaywallIfNeeded,
} from '../data/revenueCatUi';
import { isBillingError, isPurchaseCancelled } from '../data/billingErrors';
import { mirrorSubscriptionTier } from '../data/userTierMirror';
import type { BillingPlan, PaywallPresentResult } from '../domain/types';

type BillingContextValue = {
  tier: SubscriptionTier;
  hasPro: boolean;
  isReady: boolean;
  isConfigured: boolean;
  isPurchasing: boolean;
  plans: BillingPlan[];
  error: string | null;
  purchase: (planId: string) => Promise<boolean>;
  restore: () => Promise<boolean>;
  presentPaywall: (options?: { force?: boolean }) => Promise<PaywallPresentResult>;
  openCustomerCenter: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [hasPro, setHasPro] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = canUseRevenueCat();

  const refresh = useCallback(async () => {
    if (!canUseRevenueCat()) {
      setTier('free');
      setHasPro(false);
      setPlans([]);
      setIsReady(true);
      return;
    }

    try {
      await configureRevenueCat(user?.uid ?? null);
      await syncRevenueCatUser(user?.uid ?? null);
      const [nextTier, nextHasPro, nextPlans] = await Promise.all([
        fetchSubscriptionTier(),
        fetchHasPro(),
        fetchBillingPlans(),
      ]);
      setTier(nextTier);
      setHasPro(nextHasPro);
      setPlans(nextPlans);
      setError(null);
    } catch (e) {
      if (__DEV__) {
        console.warn('[Occasio] Billing refresh failed', e);
      }
    } finally {
      setIsReady(true);
    }
  }, [user?.uid]);

  useEffect(() => {
    setIsReady(false);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isConfigured) {
      return undefined;
    }

    return addCustomerInfoListener((snapshot) => {
      setTier(snapshot.tier);
      setHasPro(snapshot.hasPro);
    });
  }, [isConfigured]);

  useEffect(() => {
    if (!isReady || !user?.uid) {
      return;
    }

    void mirrorSubscriptionTier(user.uid, tier).catch((e) => {
      if (__DEV__) {
        console.warn('[Occasio] subscriptionTier mirror failed', e);
      }
    });
  }, [isReady, tier, user?.uid]);

  const purchase = useCallback(async (planId: string) => {
    setIsPurchasing(true);
    setError(null);
    trackEvent(AnalyticsEvents.purchaseStarted, { planId });

    try {
      const nextTier = await purchaseBillingPlan(planId);
      setTier(nextTier);
      setHasPro(nextTier !== 'free');
      trackEvent(AnalyticsEvents.subscribeSuccess, { tier: nextTier, planId });
      return true;
    } catch (e) {
      if (!isPurchaseCancelled(e)) {
        const message = isBillingError(e)
          ? e.message
          : 'Could not complete purchase. Try again.';
        setError(message);
        trackEvent(AnalyticsEvents.subscribeFailed, { planId, message });
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setIsPurchasing(true);
    setError(null);

    try {
      const nextTier = await restoreBillingPurchases();
      setTier(nextTier);
      setHasPro(nextTier !== 'free');
      if (nextTier !== 'free') {
        trackEvent(AnalyticsEvents.restoreSuccess, { tier: nextTier });
      }
      return nextTier !== 'free';
    } catch (e) {
      const message = isBillingError(e)
        ? e.message
        : 'Could not restore purchases.';
      setError(message);
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const presentPaywall = useCallback(
    async (options?: { force?: boolean }): Promise<PaywallPresentResult> => {
      setError(null);
      trackEvent(AnalyticsEvents.paywallShown);

      try {
        setIsPurchasing(true);
        const result = options?.force
          ? await presentProPaywall()
          : await presentProPaywallIfNeeded();

        if (result === 'purchased' || result === 'restored') {
          await refresh();
          trackEvent(AnalyticsEvents.subscribeSuccess, { source: 'paywall', result });
        } else if (result === 'error') {
          setError('Could not open the paywall. Check your RevenueCat offering.');
          trackEvent(AnalyticsEvents.subscribeFailed, { source: 'paywall' });
        }

        return result;
      } catch (e) {
        const message = isBillingError(e)
          ? e.message
          : 'Could not open the paywall.';
        setError(message);
        return 'error';
      } finally {
        setIsPurchasing(false);
      }
    },
    [refresh],
  );

  const openCustomerCenter = useCallback(async () => {
    setError(null);
    try {
      await presentCustomerCenter();
      await refresh();
    } catch (e) {
      const message = isBillingError(e)
        ? e.message
        : 'Could not open subscription management.';
      setError(message);
    }
  }, [refresh]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      tier,
      hasPro,
      isReady,
      isConfigured,
      isPurchasing,
      plans,
      error,
      purchase,
      restore,
      presentPaywall,
      openCustomerCenter,
      refresh,
      clearError,
    }),
    [
      tier,
      hasPro,
      isReady,
      isConfigured,
      isPurchasing,
      plans,
      error,
      purchase,
      restore,
      presentPaywall,
      openCustomerCenter,
      refresh,
      clearError,
    ],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBillingContext(): BillingContextValue {
  const value = useContext(BillingContext);
  if (!value) {
    throw new Error('useBillingContext must be used within BillingProvider');
  }
  return value;
}
