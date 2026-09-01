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
  });
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
      email: 'dev@occasio.app',
      phoneNumber: null,
      displayName: 'Dev User',
    };
    notifyMockListeners();
    return mockUser;
  }

  configureGoogleSignIn();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult.data?.idToken;
    if (!idToken) {
      throw new AuthError('CANCELLED', 'Sign-in was cancelled.');
    }

    const credential = auth.GoogleAuthProvider.credential(idToken);
    const result = await auth().signInWithCredential(credential);
    if (!result.user) {
      throw new AuthError('UNKNOWN', 'Sign-in failed.');
    }
    return mapUser(result.user);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === statusCodes.SIGN_IN_CANCELLED
    ) {
      throw new AuthError('CANCELLED', 'Sign-in was cancelled.');
    }
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
