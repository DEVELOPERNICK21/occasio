import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AnalyticsEvents, trackEvent } from '../../../shared/analytics/events';
import {
  createAccountWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  subscribeAuthState,
} from '../data/authRepository';
import { configureGoogleSignIn } from '../data/googleSignIn';
import { AuthError } from '../data/authErrors';
import type { AuthSessionStatus, AuthSignInMethod, AuthUser, GatedAction } from '../domain/types';

type SoftAuthRequest = {
  action: GatedAction;
  onSuccess: () => void;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthSessionStatus;
  softAuthRequest: SoftAuthRequest | null;
  requestAuth: (action: GatedAction, onSuccess: () => void) => void;
  dismissSoftAuth: () => void;
  completeSoftAuth: () => void;
  signOutUser: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  createEmailAccount: (email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthSessionStatus>('loading');
  const [softAuthRequest, setSoftAuthRequest] = useState<SoftAuthRequest | null>(null);

  useEffect(() => {
    configureGoogleSignIn();
    const unsubscribe = subscribeAuthState((nextUser) => {
      setUser(nextUser);
      setStatus(nextUser ? 'signed_in' : 'guest');
    });
    return unsubscribe;
  }, []);

  const requestAuth = useCallback((action: GatedAction, onSuccess: () => void) => {
    if (user) {
      onSuccess();
      return;
    }
    trackEvent(AnalyticsEvents.softAuthShown, { action });
    setSoftAuthRequest({ action, onSuccess });
  }, [user]);

  const dismissSoftAuth = useCallback(() => {
    setSoftAuthRequest(null);
  }, []);

  const completeSoftAuth = useCallback(() => {
    const pending = softAuthRequest;
    setSoftAuthRequest(null);
    pending?.onSuccess();
  }, [softAuthRequest]);

  const trackSignIn = useCallback((method: AuthSignInMethod) => {
    trackEvent(AnalyticsEvents.signInSuccess, { method });
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut();
    trackEvent(AnalyticsEvents.signOut);
  }, []);

  const signInGoogle = useCallback(async () => {
    const signedInUser = await signInWithGoogle();
    setUser(signedInUser);
    setStatus('signed_in');
    trackSignIn('google');
  }, [trackSignIn]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const signedInUser = await signInWithEmail(email, password);
    setUser(signedInUser);
    setStatus('signed_in');
    trackSignIn('email');
  }, [trackSignIn]);

  const createEmailAccount = useCallback(async (email: string, password: string) => {
    const signedInUser = await createAccountWithEmail(email, password);
    setUser(signedInUser);
    setStatus('signed_in');
    trackSignIn('email');
  }, [trackSignIn]);

  const value = useMemo(
    () => ({
      user,
      status,
      softAuthRequest,
      requestAuth,
      dismissSoftAuth,
      completeSoftAuth,
      signOutUser,
      signInGoogle,
      signInEmail,
      createEmailAccount,
    }),
    [
      user,
      status,
      softAuthRequest,
      requestAuth,
      dismissSoftAuth,
      completeSoftAuth,
      signOutUser,
      signInGoogle,
      signInEmail,
      createEmailAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
