import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { httpClient } from '../../../shared/api/httpClient';
import { env, getApiBaseUrl } from '../../../shared/config/env';
import { mapFirebaseUser } from '../domain/mapUser';
import type { AuthUser } from '../domain/types';
import { AuthError, mapFirebaseAuthError, mapGoogleSignInError } from './authErrors';
import { configureGoogleSignIn } from './googleSignIn';

type Unsubscribe = () => void;

let mockUser: AuthUser | null = null;
let mockListeners: Array<(user: AuthUser | null) => void> = [];

function notifyMockListeners(): void {
  for (const listener of mockListeners) {
    listener(mockUser);
  }
}

function mapUser(firebaseUser: FirebaseAuthTypes.User): AuthUser {
  return mapFirebaseUser({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    phoneNumber: firebaseUser.phoneNumber,
    displayName: firebaseUser.displayName,
    createdAt: firebaseUser.metadata.creationTime ?? null,
  });
}

function isFirebaseAuthError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    String((error as { code: unknown }).code).startsWith('auth/')
  );
}

function logGoogleSignInFailure(error: unknown): void {
  if (!__DEV__) return;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : 'unknown';
  const message = error instanceof Error ? error.message : String(error);
  console.warn('[auth] Google sign-in failed', { code, message });
}

export function subscribeAuthState(onChange: (user: AuthUser | null) => void): Unsubscribe {
  if (env.useMockAuth) {
    mockListeners.push(onChange);
    onChange(mockUser);
    return () => {
      mockListeners = mockListeners.filter((listener) => listener !== onChange);
    };
  }

  return auth().onAuthStateChanged((firebaseUser) => {
    onChange(firebaseUser ? mapUser(firebaseUser) : null);
  });
}

export async function signInWithGoogle(): Promise<AuthUser> {
  if (env.useMockAuth) {
    mockUser = {
      uid: 'mock-google-user',
      email: 'develoepernick1@gmail.com',
      phoneNumber: null,
      displayName: 'Dev User',
      createdAt: new Date().toISOString(),
    };
    notifyMockListeners();
    return mockUser;
  }

  configureGoogleSignIn();

  try {
    await GoogleSignin.signOut().catch(() => undefined);
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const signInResult = await GoogleSignin.signIn();
    if (signInResult.type === 'cancelled') {
      throw new AuthError('CANCELLED', 'Sign-in was cancelled.');
    }

    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens.idToken ?? signInResult.data.idToken;
    if (!idToken) {
      throw new AuthError(
        'UNKNOWN',
        'Google did not return a sign-in token. Check Firebase SHA fingerprints and OAuth setup.',
      );
    }

    const credential = auth.GoogleAuthProvider.credential(
      idToken,
      tokens.accessToken ?? undefined,
    );
    const result = await auth().signInWithCredential(credential);
    if (!result.user) {
      throw new AuthError('UNKNOWN', 'Sign-in failed.');
    }
    return mapUser(result.user);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    if (isFirebaseAuthError(error)) {
      logGoogleSignInFailure(error);
      const code = String((error as { code: string }).code);
      if (code === 'auth/invalid-credential' || code === 'auth/account-exists-with-different-credential') {
        throw new AuthError(
          'UNKNOWN',
          'Google sign-in could not be verified. Enable Google in Firebase Auth, add the correct SHA-1, or sign in with email if you already have an account.',
        );
      }
      throw mapFirebaseAuthError(error);
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === statusCodes.SIGN_IN_CANCELLED
    ) {
      throw new AuthError('CANCELLED', 'Sign-in was cancelled.');
    }

    logGoogleSignInFailure(error);
    throw mapGoogleSignInError(error);
  }
}

/** iOS 13+ only; Android would need Apple's web flow, which we don't offer. */
export function isAppleSignInAvailable(): boolean {
  return env.useMockAuth || appleAuth.isSupported;
}

export async function signInWithApple(): Promise<AuthUser> {
  if (env.useMockAuth) {
    mockUser = {
      uid: 'mock-apple-user',
      email: 'dev@privaterelay.appleid.com',
      phoneNumber: null,
      displayName: 'Dev User',
      createdAt: new Date().toISOString(),
    };
    notifyMockListeners();
    return mockUser;
  }

  try {
    const response = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });
    if (!response.identityToken) {
      throw new AuthError('UNKNOWN', 'Apple did not return a sign-in token. Try again.');
    }

    const credential = auth.AppleAuthProvider.credential(
      response.identityToken,
      response.nonce,
    );
    const result = await auth().signInWithCredential(credential);
    if (!result.user) {
      throw new AuthError('UNKNOWN', 'Sign-in failed.');
    }

    // Apple shares the name only on the first authorization.
    const fullName = [response.fullName?.givenName, response.fullName?.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (fullName && !result.user.displayName) {
      await result.user.updateProfile({ displayName: fullName }).catch(() => undefined);
      await result.user.reload().catch(() => undefined);
      const refreshed = auth().currentUser;
      if (refreshed) {
        return mapUser(refreshed);
      }
    }
    return mapUser(result.user);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';
    if (code === appleAuth.Error.CANCELED) {
      throw new AuthError('CANCELLED', 'Sign-in was cancelled.');
    }
    if (code === 'auth/account-exists-with-different-credential') {
      throw new AuthError(
        'UNKNOWN',
        'This email already has an account. Sign in with Google or email instead.',
      );
    }
    if (isFirebaseAuthError(error)) {
      throw mapFirebaseAuthError(error);
    }
    if (__DEV__) {
      console.warn('[auth] Apple sign-in failed', { code, error });
    }
    throw new AuthError('UNKNOWN', 'Apple sign-in failed. Try again.');
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  if (env.useMockAuth) {
    mockUser = {
      uid: 'mock-email-user',
      email,
      phoneNumber: null,
      displayName: null,
      createdAt: new Date().toISOString(),
    };
    notifyMockListeners();
    return mockUser;
  }

  try {
    const result = await auth().signInWithEmailAndPassword(email, password);
    if (!result.user) {
      throw new AuthError('UNKNOWN', 'Sign-in failed.');
    }
    return mapUser(result.user);
  } catch (error) {
    throw mapFirebaseAuthError(error);
  }
}

export async function createAccountWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  if (env.useMockAuth) {
    mockUser = {
      uid: 'mock-email-user',
      email,
      phoneNumber: null,
      displayName: null,
      createdAt: new Date().toISOString(),
    };
    notifyMockListeners();
    return mockUser;
  }

  try {
    const result = await auth().createUserWithEmailAndPassword(email, password);
    if (!result.user) {
      throw new AuthError('UNKNOWN', 'Could not create account.');
    }
    return mapUser(result.user);
  } catch (error) {
    throw mapFirebaseAuthError(error);
  }
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (env.useMockAuth) {
    if (__DEV__) {
      console.log('[auth] Mock password reset — no email sent for', email);
    }
    return;
  }

  try {
    let signInMethods: string[] = [];
    try {
      signInMethods = await auth().fetchSignInMethodsForEmail(email);
    } catch {
      signInMethods = [];
    }

    if (signInMethods.length > 0 && !signInMethods.includes('password')) {
      throw new AuthError(
        'PASSWORD_RESET_UNAVAILABLE',
        signInMethods.includes('apple.com')
          ? 'This account uses Sign in with Apple, not a password. Go back and tap Continue with Apple.'
          : 'This account uses Google sign-in, not a password. Go back and tap Continue with Google.',
      );
    }

    await auth().sendPasswordResetEmail(email);

    if (__DEV__) {
      console.log('[auth] Password reset email requested for', email);
    }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
        ? (error as { code: string }).code
        : '';

    // Do not reveal whether the email is registered.
    if (code === 'auth/user-not-found') {
      return;
    }

    throw mapFirebaseAuthError(error);
  }
}

export async function signOut(): Promise<void> {
  if (env.useMockAuth) {
    mockUser = null;
    notifyMockListeners();
    return;
  }

  try {
    await GoogleSignin.signOut().catch(() => undefined);
    await auth().signOut();
  } catch (error) {
    throw mapFirebaseAuthError(error);
  }
}

/**
 * Permanently delete the account and everything tied to it (Vault, history,
 * shared links, photos). The server does the deletion; we only sign out locally.
 */
export async function deleteAccount(): Promise<void> {
  if (env.useMockAuth) {
    mockUser = null;
    notifyMockListeners();
    return;
  }

  const token = await auth().currentUser?.getIdToken();
  if (!token) {
    throw new AuthError('UNKNOWN', 'Sign in again to delete your account.');
  }

  try {
    await httpClient.delete(getApiBaseUrl(), '/v1/account', {
      Authorization: `Bearer ${token}`,
    });
  } catch {
    throw new AuthError(
      'UNKNOWN',
      'Could not delete your account right now. Check your connection and try again.',
    );
  }

  await GoogleSignin.signOut().catch(() => undefined);
  await auth().signOut().catch(() => undefined);
}
