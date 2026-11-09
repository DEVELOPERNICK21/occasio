import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnalyticsEvents, trackEvent } from '../../../shared/analytics/events';
import { appPlatform } from '../../../shared/platform/runtime';
import { useAuth } from '../../auth/application/useAuth';
import {
  describeBillingNotice,
  plansUnavailableNotice,
  type BillingNotice,
  type BillingSubject,
} from '../domain/billingNotice';
import { PACKAGE_SINGLE_WISH } from '../domain/entitlements';
import type { SubscriptionTier } from '../domain/types';
import {
  addCustomerInfoListener,
  canUseRevenueCat,
  configureRevenueCat,
  fetchBillingPlans,
  fetchHasPro,
  fetchPurchasedWishCredits,
  fetchSubscriptionTier,
  purchaseBillingPlan,
  refreshCustomerInfo,
  restoreBillingPurchases,
  syncRevenueCatUser,
} from '../data/revenueCatClient';
import {
  presentCustomerCenter,
  presentProPaywall,
  presentProPaywallIfNeeded,
} from '../data/revenueCatUi';
import { billingErrorFromSdk, isPurchaseCancelled } from '../data/billingErrors';
import { syncSubscriptionTier } from '../data/userTierMirror';
import { readWishCreditsUsed } from '../data/wishCreditStore';
import { availableWishCredits } from '../domain/wishCredits';
import type { BillingPlan, ExtraWishAccess, PaywallPresentResult } from '../domain/types';

type BillingContextValue = {
  tier: SubscriptionTier;
  hasPro: boolean;
  isReady: boolean;
  isConfigured: boolean;
  isPurchasing: boolean;
  plans: BillingPlan[];
  /** What to tell the person about the last purchase, restore or paywall attempt, if anything. */
  notice: BillingNotice | null;
  purchase: (planId: string) => Promise<boolean>;
  /** `restored` is true when a plan came back; otherwise `notice` says why not. */
  restore: () => Promise<{ restored: boolean; notice: BillingNotice | null }>;
  /**
   * Asks the store again about a payment that was pending. `true` once it has gone through (and the
   * notice is gone); `false` while the store is still working on it.
   */
  recheckPending: () => Promise<boolean>;
  presentPaywall: (options?: { force?: boolean }) => Promise<PaywallPresentResult>;
  /** Resolves `true` once Customer Center was shown, `false` if it could not open. */
  openCustomerCenter: () => Promise<boolean>;
  refresh: () => Promise<void>;
  clearError: () => void;
  /** Clears a notice that only mattered on the screen being left. A pending payment stays. */
  dismissTransient: () => void;
  /** Fresh check (not cached state) for a wish beyond the free monthly allowance. */
  resolveExtraWish: () => Promise<ExtraWishAccess>;
};

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [hasPro, setHasPro] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [notice, setNotice] = useState<BillingNotice | null>(null);
  /** What the pending payment was for, so "check again" can look in the right place. */
  const pendingSubject = useRef<BillingSubject>('other');

  const isConfigured = canUseRevenueCat();
  const userId = user?.uid ?? null;

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
      setNotice((current) => (current?.code === 'PENDING' ? current : null));
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
      // The store confirmed a payment that was pending: there is nothing left to wait for.
      if (snapshot.hasPro) {
        setNotice((current) => (current?.code === 'PENDING' ? null : current));
      }
    });
  }, [isConfigured]);

  useEffect(() => {
    if (!isReady || !user?.uid) {
      return;
    }

    void syncSubscriptionTier(user.uid).catch((e) => {
      if (__DEV__) {
        console.warn('[Occasio] subscriptionTier mirror failed', e);
      }
    });
  }, [isReady, tier, user?.uid]);

  const purchase = useCallback(async (planId: string) => {
    const subject: BillingSubject = planId.toLowerCase().includes(PACKAGE_SINGLE_WISH)
      ? 'wish'
      : 'pro';
    setIsPurchasing(true);
    setNotice(null);
    trackEvent(AnalyticsEvents.purchaseStarted, { planId });

    try {
      const nextTier = await purchaseBillingPlan(planId);
      setTier(nextTier);
      setHasPro(nextTier !== 'free');
      trackEvent(AnalyticsEvents.subscribeSuccess, { tier: nextTier, planId });
      return true;
    } catch (e) {
      if (!isPurchaseCancelled(e)) {
        const { code } = billingErrorFromSdk(e);
        if (code === 'PENDING') {
          pendingSubject.current = subject;
          trackEvent(AnalyticsEvents.purchasePending, { planId });
        } else {
          trackEvent(AnalyticsEvents.subscribeFailed, { planId, code });
        }
        setNotice(describeBillingNotice(code, { platform: appPlatform(), subject }));
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setIsPurchasing(true);
    setNotice(null);
    const platform = appPlatform();

    try {
      const nextTier = await restoreBillingPurchases();
      setTier(nextTier);
      setHasPro(nextTier !== 'free');
      if (nextTier !== 'free') {
        trackEvent(AnalyticsEvents.restoreSuccess, { tier: nextTier });
        return { restored: true, notice: null };
      }
      const empty = describeBillingNotice('NOTHING_TO_RESTORE', { platform });
      setNotice(empty);
      return { restored: false, notice: empty };
    } catch (e) {
      const failed = describeBillingNotice(billingErrorFromSdk(e).code, { platform });
      setNotice(failed);
      return { restored: false, notice: failed };
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const recheckPending = useCallback(async (): Promise<boolean> => {
    if (!canUseRevenueCat()) {
      return false;
    }
    setIsPurchasing(true);
    try {
      await refreshCustomerInfo();
      const [nextTier, nextHasPro] = await Promise.all([fetchSubscriptionTier(), fetchHasPro()]);
      setTier(nextTier);
      setHasPro(nextHasPro);

      let arrived = nextHasPro;
      if (!arrived && pendingSubject.current === 'wish' && userId) {
        const [purchased, used] = await Promise.all([
          fetchPurchasedWishCredits(),
          readWishCreditsUsed(userId),
        ]);
        arrived = availableWishCredits(purchased, used) > 0;
      }

      if (arrived) {
        setNotice(null);
        trackEvent(AnalyticsEvents.subscribeSuccess, { source: 'pending_resolved' });
        return true;
      }
      setNotice(
        describeBillingNotice('PENDING', {
          platform: appPlatform(),
          subject: pendingSubject.current,
          rechecked: true,
        }),
      );
      return false;
    } catch (e) {
      // Could not even ask: say so, and leave the pending wording alone so nothing is lost.
      setNotice(describeBillingNotice(billingErrorFromSdk(e).code, { platform: appPlatform() }));
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [userId]);

  const presentPaywall = useCallback(
    async (options?: { force?: boolean }): Promise<PaywallPresentResult> => {
      setNotice(null);
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
          setNotice(plansUnavailableNotice(appPlatform()));
          trackEvent(AnalyticsEvents.subscribeFailed, { source: 'paywall' });
        }

        return result;
      } catch (e) {
        setNotice(describeBillingNotice(billingErrorFromSdk(e).code, { platform: appPlatform() }));
        return 'error';
      } finally {
        setIsPurchasing(false);
      }
    },
    [refresh],
  );

  const openCustomerCenter = useCallback(async (): Promise<boolean> => {
    try {
      await presentCustomerCenter();
      await refresh();
      return true;
    } catch {
      // The caller sends the person to the store's own page, so there is nothing to show here.
      return false;
    }
  }, [refresh]);

  const clearError = useCallback(() => {
    setNotice(null);
  }, []);

  const dismissTransient = useCallback(() => {
    setNotice((current) => (current?.code === 'PENDING' ? current : null));
  }, []);

  const resolveExtraWish = useCallback(async (): Promise<ExtraWishAccess> => {
    if (!canUseRevenueCat()) {
      return 'none';
    }
    try {
      if (await fetchHasPro()) {
        return 'pro';
      }
      if (!userId) {
        return 'none';
      }
      const [purchased, used] = await Promise.all([
        fetchPurchasedWishCredits(),
        readWishCreditsUsed(userId),
      ]);
      return availableWishCredits(purchased, used) > 0 ? 'credit' : 'none';
    } catch (e) {
      if (__DEV__) {
        console.warn('[Occasio] Extra wish check failed', e);
      }
      return 'none';
    }
  }, [userId]);

  const value = useMemo(
    () => ({
      tier,
      hasPro,
      isReady,
      isConfigured,
      isPurchasing,
      plans,
      notice,
      purchase,
      restore,
      recheckPending,
      presentPaywall,
      openCustomerCenter,
      refresh,
      clearError,
      dismissTransient,
      resolveExtraWish,
    }),
    [
      tier,
      hasPro,
      isReady,
      isConfigured,
      isPurchasing,
      plans,
      notice,
      purchase,
      restore,
      recheckPending,
      presentPaywall,
      openCustomerCenter,
      refresh,
      clearError,
      dismissTransient,
      resolveExtraWish,
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
