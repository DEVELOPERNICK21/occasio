import type { AuthUser } from './types';

type FirebaseUserLike = {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  createdAt?: string | null;
  /** Provider ids such as `password`, `google.com`, `apple.com`. */
  providerIds?: readonly string[];
};

export function mapFirebaseUser(user: FirebaseUserLike): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    createdAt: user.createdAt ?? null,
    viaGoogleOrApple:
      user.providerIds?.some((id) => id === 'google.com' || id === 'apple.com') === true,
  };
}

/** SSOT label for Account screen and signed-in surfaces. */
export function formatAuthIdentity(user: AuthUser): string {
  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }
  if (user.email) {
    return user.email;
  }
  if (user.phoneNumber) {
    return user.phoneNumber;
  }
  return 'Signed in';
}
