type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

/** Phase 4 stub — wire to Firebase Analytics / Amplitude later. */
export function trackEvent(name: string, payload?: AnalyticsPayload): void {
  if (__DEV__) {
    console.log(`[analytics] ${name}`, payload ?? {});
  }
}

export const AnalyticsEvents = {
  onboardingStarted: 'onboarding_started',
  onboardingCompleted: 'onboarding_completed',
  onboardingSkipped: 'onboarding_skipped',
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
  vaultSaveRequested: 'vault_save_requested',
  vaultPersonAdded: 'vault_person_added',
  vaultSavePromptTapped: 'vault_save_prompt_tapped',
  historyRecorded: 'history_recorded',
  purchaseStarted: 'purchase_started',
  subscribeSuccess: 'subscribe_success',
  subscribeFailed: 'subscribe_failed',
  restoreSuccess: 'restore_success',
} as const;
