/** Actions that require a signed-in user (soft-auth gate). */
export type GatedAction =
  | 'vault_save'
  | 'vault_view'
  | 'history_sync'
  | 'autosend_enable'
  | 'subscription_manage'
  | 'create_link';

export type AuthSignInMethod = 'google' | 'apple' | 'email';

export type AuthUser = {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  /** ISO timestamp from Firebase Auth metadata when available. */
  createdAt: string | null;
  /** Signed in with, or linked to, Google or Apple: the only sign-ins that can claim the free card. */
  viaGoogleOrApple?: boolean;
};

export type AuthSessionStatus = 'loading' | 'guest' | 'signed_in';
