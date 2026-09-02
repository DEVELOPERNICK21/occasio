import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { env } from '../../../shared/config/env';
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
        'This account uses Google sign-in, not a password. Go back and tap Continue with Google.',
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
