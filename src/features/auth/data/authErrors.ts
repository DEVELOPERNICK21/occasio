import { statusCodes } from '@react-native-google-signin/google-signin';

export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'INVALID_PASSWORD'
  | 'EMAIL_IN_USE'
  | 'USER_NOT_FOUND'
  | 'WRONG_PASSWORD'
  | 'TOO_MANY_REQUESTS'
  | 'PASSWORD_RESET_UNAVAILABLE'
  | 'NETWORK'
  | 'CANCELLED'
  | 'UNKNOWN';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function mapFirebaseAuthError(error: unknown): AuthError {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return new AuthError('INVALID_EMAIL', 'Enter a valid email address.');
    case 'auth/weak-password':
      return new AuthError('INVALID_PASSWORD', 'Password must be at least 8 characters.');
    case 'auth/email-already-in-use':
      return new AuthError('EMAIL_IN_USE', 'An account with this email already exists. Sign in instead.');
    case 'auth/user-not-found':
      return new AuthError('USER_NOT_FOUND', 'No account found. Create one below.');
    case 'auth/wrong-password':
      return new AuthError('WRONG_PASSWORD', 'Email or password is incorrect.');
    case 'auth/invalid-credential':
      return new AuthError('WRONG_PASSWORD', 'Email or password is incorrect.');
    case 'auth/too-many-requests':
      return new AuthError('TOO_MANY_REQUESTS', 'Too many attempts. Wait a moment and retry.');
    case 'auth/network-request-failed':
      return new AuthError('NETWORK', 'Check your connection and try again.');
    default:
      return new AuthError('UNKNOWN', 'Sign-in failed. Please try again.');
  }
}

export function mapGoogleSignInError(error: unknown): AuthError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  ) {
    const code = String((error as { code: unknown }).code);

    if (code === 'SIGN_IN_CANCELLED' || code === statusCodes.SIGN_IN_CANCELLED) {
      return new AuthError('CANCELLED', 'Sign-in was cancelled.');
    }

    if (code === '10' || code === 'DEVELOPER_ERROR') {
      return new AuthError(
        'UNKNOWN',
        'Google Sign-In is not configured for this install. Add the correct SHA-1 in Firebase (debug, upload key, or Play App Signing key) and reinstall.',
      );
    }

    if (code === '12500' || code === '12501') {
      return new AuthError('CANCELLED', 'Sign-in was cancelled.');
    }

    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return new AuthError('NETWORK', 'Google Play Services is required for sign-in.');
    }
  }

  return mapFirebaseAuthError(error);
}
