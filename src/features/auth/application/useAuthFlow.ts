import { useCallback, useState } from 'react';
import { AnalyticsEvents, trackEvent } from '../../../shared/analytics/events';
import { triggerCardHaptic } from '../../../shared/platform/haptics';
import {
  emailFieldError,
  normalizeEmail,
  passwordFieldError,
} from '../domain/email';
import { isAuthError, useAuthContext } from './AuthProvider';

export type AuthMode = 'sign_in' | 'sign_up';
type Provider = 'google' | 'apple';

type Options = {
  /** Runs once someone is signed in, by any method. */
  onSignedIn?: () => void;
};

/**
 * Everything the sign-in screens do besides draw themselves: Google, Apple and
 * email, with one place for loading, errors and analytics. The Login tab and the
 * sign-in sheet shown to guests both use it, so they can never behave differently.
 */
export function useAuthFlow({ onSignedIn }: Options = {}) {
  const { signInGoogle, canSignInWithApple, signInApple, signInEmail, createEmailAccount } =
    useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const continueWith = useCallback(
    async (provider: Provider) => {
      const isGoogle = provider === 'google';
      setIsLoading(true);
      setPendingProvider(provider);
      setError(null);
      triggerCardHaptic();
      trackEvent(isGoogle ? AnalyticsEvents.googleSignInStarted : AnalyticsEvents.appleSignInStarted);
      try {
        await (isGoogle ? signInGoogle() : signInApple());
        onSignedIn?.();
      } catch (e) {
        // Closing the Google or Apple sheet is not a failure.
        if (isAuthError(e) && e.code === 'CANCELLED') return;
        setError(
          isAuthError(e) ? e.message : `${isGoogle ? 'Google' : 'Apple'} sign-in failed. Try again.`,
        );
        trackEvent(isGoogle ? AnalyticsEvents.googleSignInFailed : AnalyticsEvents.appleSignInFailed, {
          code: isAuthError(e) ? e.code : 'unknown',
        });
      } finally {
        setIsLoading(false);
        setPendingProvider(null);
      }
    },
    [onSignedIn, signInApple, signInGoogle],
  );

  const continueWithGoogle = useCallback(() => continueWith('google'), [continueWith]);
  const continueWithApple = useCallback(() => continueWith('apple'), [continueWith]);

  /** Signs in or creates the account. The form checks each field first; this is the last line of defence. */
  const submitEmail = useCallback(
    async (mode: AuthMode, emailInput: string, password: string) => {
      const problem = emailFieldError(emailInput) ?? passwordFieldError(password, mode);
      if (problem) {
        setError(problem);
        return;
      }
      setIsLoading(true);
      setError(null);
      triggerCardHaptic();
      trackEvent(AnalyticsEvents.emailSignInStarted, { mode });
      try {
        const email = normalizeEmail(emailInput);
        if (mode === 'sign_up') {
          await createEmailAccount(email, password);
        } else {
          await signInEmail(email, password);
        }
        onSignedIn?.();
      } catch (e) {
        setError(isAuthError(e) ? e.message : 'Sign-in failed. Try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [createEmailAccount, onSignedIn, signInEmail],
  );

  return {
    canSignInWithApple,
    error,
    clearError,
    isLoading,
    pendingProvider,
    continueWithGoogle,
    continueWithApple,
    submitEmail,
  };
}
