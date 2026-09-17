import { useCallback } from 'react';
import { useSubscription } from './useSubscription';

/**
 * Paywall orchestration — prefers RevenueCat dashboard Paywall UI.
 * @see https://www.revenuecat.com/docs/tools/paywalls
 */
export function usePaywall() {
  const subscription = useSubscription();
  const { presentPaywall, clearError, isPaid, isConfigured, ...rest } = subscription;

  const open = useCallback(async () => {
    if (!isConfigured) {
      return 'error' as const;
    }
    return presentPaywall({ force: false });
  }, [isConfigured, presentPaywall]);

  const openForced = useCallback(async () => {
    if (!isConfigured) {
      return 'error' as const;
    }
    return presentPaywall({ force: true });
  }, [isConfigured, presentPaywall]);

  const close = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    ...rest,
    clearError,
    isPaid,
    isConfigured,
    presentPaywall,
    open,
    openForced,
    close,
  };
}
