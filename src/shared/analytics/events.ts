import { canCollectAnalytics } from './consent';

type AnalyticsPayload = Record<string, string | number | boolean | undefined>;
type AnalyticsSink = (name: string, payload?: AnalyticsPayload) => void;

const sinks: AnalyticsSink[] = [];

/**
 * Connect an analytics or crash SDK here. A sink only ever sees events while the
 * person has opted in (see `consent.ts`); with no consent, nothing leaves the app.
 */
export function registerAnalyticsSink(sink: AnalyticsSink): void {
  sinks.push(sink);
}

/** Never put names, emails, photos, messages or other personal content in a payload. */
export function trackEvent(name: string, payload?: AnalyticsPayload): void {
  if (__DEV__) {
    // Local console only; nothing is sent anywhere.
    console.log(`[analytics] ${name}`, payload ?? {});
  }
  if (!canCollectAnalytics()) {
    return;
  }
  for (const sink of sinks) {
    sink(name, payload);
  }
}

export const AnalyticsEvents = {
  onboardingStarted: 'onboarding_started',
  onboardingCompleted: 'onboarding_completed',
  onboardingSkipped: 'onboarding_skipped',
  onboardingStepViewed: 'onboarding_step_viewed',
  onboardingAudiencePicked: 'onboarding_audience_picked',
  onboardingOccasionPicked: 'onboarding_occasion_picked',
  onboardingGiftOpened: 'onboarding_gift_opened',
  onboardingDateSet: 'onboarding_date_set',
  onboardingDateSkipped: 'onboarding_date_skipped',
  onboardingPledged: 'onboarding_pledged',
  onboardingPlanSelected: 'onboarding_plan_selected',
  onboardingRestoreTapped: 'onboarding_restore_tapped',
  onboardingFirstCardStarted: 'onboarding_first_card_started',
  createStarted: 'create_started',
  audienceSelected: 'audience_selected',
  occasionSelected: 'occasion_selected',
  templateSelected: 'template_selected',
  quickCreateStarted: 'quick_create_started',
  photosAdded: 'photos_added',
  previewOpened: 'preview_opened',
  cardShared: 'card_shared',
  uploadFailed: 'upload_failed',
  paywallShown: 'paywall_shown',
  softAuthShown: 'soft_auth_shown',
  emailSignInStarted: 'email_sign_in_started',
  passwordResetRequested: 'password_reset_requested',
  googleSignInStarted: 'google_sign_in_started',
  googleSignInFailed: 'google_sign_in_failed',
  signInSuccess: 'sign_in_success',
  signOut: 'sign_out',
  accountDeleted: 'account_deleted',
  vaultSaveRequested: 'vault_save_requested',
  vaultPersonAdded: 'vault_person_added',
  vaultSavePromptTapped: 'vault_save_prompt_tapped',
  historyRecorded: 'history_recorded',
  purchaseStarted: 'purchase_started',
  subscribeSuccess: 'subscribe_success',
  subscribeFailed: 'subscribe_failed',
  restoreSuccess: 'restore_success',
  wishCreditUsed: 'wish_credit_used',
  appleSignInStarted: 'apple_sign_in_started',
  appleSignInFailed: 'apple_sign_in_failed',
} as const;
