import type { StorePlatform } from './renewalTerms';

/**
 * What a person is told when a purchase does not simply succeed. The store and RevenueCat speak in
 * codes ("error 20"); this is the one place that turns them into a plain sentence, says what happened
 * to their money where we can, and says what to do next. The raw text of an SDK error is never shown.
 */
export type BillingErrorCode =
  | 'NOT_CONFIGURED'
  | 'CANCELLED'
  | 'NETWORK'
  | 'STORE'
  | 'INTERNAL'
  | 'PENDING'
  | 'NOT_ALLOWED'
  | 'PAYMENT_PROBLEM'
  | 'UNAVAILABLE'
  | 'ALREADY_OWNED'
  | 'OTHER_ACCOUNT'
  | 'BUSY'
  | 'INELIGIBLE'
  | 'NOTHING_TO_RESTORE';

/** What was being bought, so the words can say what will happen. */
export type BillingSubject = 'pro' | 'wish' | 'other';

/** `pending` is not a failure: the store is still working. `info` needs nothing from the person. */
export type BillingNoticeTone = 'pending' | 'problem' | 'info';

/** The one thing a notice can offer to do about itself. */
export type BillingNoticeAction = 'recheck' | 'restore';

export type BillingNotice = {
  code: BillingErrorCode;
  tone: BillingNoticeTone;
  title: string;
  message: string;
  action: BillingNoticeAction | null;
};

export const BILLING_ACTION_LABEL: Record<BillingNoticeAction, string> = {
  recheck: 'Check again',
  restore: 'Restore purchases',
};

type Context = {
  platform: StorePlatform;
  subject?: BillingSubject;
  /** The person has already asked us to check, and the store has still not confirmed it. */
  rechecked?: boolean;
};

/** "Google Play", "the App Store". Mid-sentence use; `Store` is the same at the start of one. */
export function storeName(platform: StorePlatform): string {
  if (platform === 'ios') return 'the App Store';
  if (platform === 'android') return 'Google Play';
  return 'the store';
}

function startOfSentence(platform: StorePlatform): string {
  const name = storeName(platform);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function pending({ platform, subject = 'other', rechecked }: Context): BillingNotice {
  const Store = startOfSentence(platform);
  if (rechecked) {
    return {
      code: 'PENDING',
      tone: 'pending',
      title: 'Still pending',
      message: `${Store} has not confirmed it yet. There is nothing more you need to do: it switches on by itself once the payment goes through, and ${storeName(platform)} will tell you if it fails.`,
      action: 'recheck',
    };
  }
  const what =
    subject === 'pro'
      ? 'Occasio Pro switches on by itself once it goes through, so you can close this and keep using Occasio.'
      : subject === 'wish'
        ? 'Your extra wish is ready as soon as it goes through. Then come back and tap Create the link.'
        : 'It switches on by itself once it goes through.';
  return {
    code: 'PENDING',
    tone: 'pending',
    title: 'Your payment is pending',
    message: `${Store} is still confirming your payment. This can take a few minutes, and longer for some payment methods. ${what}`,
    action: 'recheck',
  };
}

/** The notice for a billing problem, in the words of the platform the person is on. */
export function describeBillingNotice(code: BillingErrorCode, context: Context): BillingNotice {
  const { platform } = context;
  const store = storeName(platform);
  const Store = startOfSentence(platform);

  switch (code) {
    case 'PENDING':
      return pending(context);
    case 'NETWORK':
      return {
        code,
        tone: 'problem',
        title: 'No connection',
        message: `We could not reach ${store}. Check your connection and try again. If you were already charged, tap Restore purchases to bring it back.`,
        action: 'restore',
      };
    case 'STORE':
      return {
        code,
        tone: 'problem',
        title: `${Store} had a problem`,
        message: `${Store} could not finish this purchase right now. Try again in a moment. If it keeps happening, make sure ${store} is up to date and you are signed in to it.`,
        action: null,
      };
    case 'NOT_ALLOWED':
      return {
        code,
        tone: 'problem',
        title: 'Purchases are turned off',
        message:
          'This device or store account is not allowed to make purchases, for example because of parental controls or a restricted account. Change that in your device settings, then try again.',
        action: null,
      };
    case 'PAYMENT_PROBLEM':
      return {
        code,
        tone: 'problem',
        title: 'The payment did not go through',
        message: `${Store} could not take the payment. Check your payment method in ${store}, then try again.`,
        action: null,
      };
    case 'UNAVAILABLE':
      return {
        code,
        tone: 'problem',
        title: 'That plan is not available',
        message:
          'This plan is not available in your country, or not right now. Try again later, or choose another option.',
        action: null,
      };
    case 'ALREADY_OWNED':
      return {
        code,
        tone: 'info',
        title: 'You already have this',
        message: `This purchase is already on your ${store} account. Tap Restore purchases to bring it back.`,
        action: 'restore',
      };
    case 'OTHER_ACCOUNT':
      return {
        code,
        tone: 'problem',
        title: 'Used by another account',
        message:
          'This purchase is linked to a different Occasio account. Sign in with that account to use it, or contact us if that does not look right.',
        action: null,
      };
    case 'BUSY':
      return {
        code,
        tone: 'info',
        title: 'Still working on it',
        message: 'Another purchase is in progress. Wait a moment, then check again.',
        action: 'recheck',
      };
    case 'INELIGIBLE':
      return {
        code,
        tone: 'problem',
        title: 'Not available for this account',
        message: 'This offer is not available for your account. Choose another plan.',
        action: null,
      };
    case 'NOT_CONFIGURED':
      return {
        code,
        tone: 'info',
        title: 'Plans are not available yet',
        message: 'Plans are not available right now. You can keep using Occasio free and try again later.',
        action: null,
      };
    case 'NOTHING_TO_RESTORE':
      return {
        code,
        tone: 'info',
        title: 'Nothing to restore',
        message: `We could not find an Occasio purchase on this ${store} account. If you bought it with a different account, sign in to ${store} with that one, then try again.`,
        action: null,
      };
    case 'CANCELLED':
      return {
        code,
        tone: 'info',
        title: 'Purchase cancelled',
        message: 'Nothing was charged.',
        action: null,
      };
    case 'INTERNAL':
    default:
      return {
        code: 'INTERNAL',
        tone: 'problem',
        title: 'Something went wrong',
        message: `We could not finish the purchase. If ${store} shows a charge, tap Restore purchases. If that does not help, contact us and we will sort it out.`,
        action: 'restore',
      };
  }
}

/**
 * The store's own plans screen failed. We cannot tell whether a payment had started, so this says what
 * will happen either way and offers nothing to "check".
 */
export function plansUnavailableNotice(platform: StorePlatform): BillingNotice {
  return {
    code: 'STORE',
    tone: 'problem',
    title: 'We could not finish that',
    message: `Check your connection and try again. Your cards and Vault are not affected. If a payment was already started, Occasio Pro switches on by itself once ${storeName(platform)} confirms it.`,
    action: null,
  };
}
