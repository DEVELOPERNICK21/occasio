import { useEffect, useMemo } from 'react';
import type { NoticeTone } from '../../../shared/ui/NoticeCard';
import { BILLING_ACTION_LABEL } from '../domain/billingNotice';
import { useSubscription } from './useSubscription';

/** The props a `NoticeCard` needs, ready to spread. */
export type BillingNoticeView = {
  tone: NoticeTone;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  busy: boolean;
  onDismiss?: () => void;
};

/**
 * What to show for the last purchase attempt: a payment that is pending, or why something did not
 * work, with the one thing the person can do about it. A screen that shows it clears it on the way out,
 * except a pending payment, which stays until the store settles it.
 */
export function useBillingNotice(): BillingNoticeView | null {
  const { notice, restore, recheckPending, clearError, dismissTransient, isPurchasing } =
    useSubscription();

  useEffect(() => dismissTransient, [dismissTransient]);

  return useMemo(() => {
    if (!notice) {
      return null;
    }
    const act =
      notice.action === 'recheck'
        ? () => void recheckPending()
        : notice.action === 'restore'
          ? () => void restore()
          : undefined;
    return {
      tone: notice.tone,
      title: notice.title,
      message: notice.message,
      actionLabel: notice.action ? BILLING_ACTION_LABEL[notice.action] : undefined,
      onAction: act,
      busy: isPurchasing,
      // A pending payment is not dismissed: it clears itself when the store settles it.
      onDismiss: notice.tone === 'pending' ? undefined : clearError,
    };
  }, [notice, restore, recheckPending, clearError, isPurchasing]);
}
