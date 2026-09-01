type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

/** Phase 4 stub — wire to Firebase Analytics / Amplitude later. */
export function trackEvent(name: string, payload?: AnalyticsPayload): void {
  if (__DEV__) {
    console.log(`[analytics] ${name}`, payload ?? {});
  }
}

export const AnalyticsEvents = {
  createStarted: 'create_started',
  templateSelected: 'template_selected',
  photosAdded: 'photos_added',
  previewOpened: 'preview_opened',
  cardShared: 'card_shared',
  uploadFailed: 'upload_failed',
  paywallShown: 'paywall_shown',
  softAuthShown: 'soft_auth_shown',
  emailSignInStarted: 'email_sign_in_started',
  signInSuccess: 'sign_in_success',
  signOut: 'sign_out',
  vaultSaveRequested: 'vault_save_requested',
  vaultPersonAdded: 'vault_person_added',
  vaultSavePromptTapped: 'vault_save_prompt_tapped',
  historyRecorded: 'history_recorded',
} as const;
