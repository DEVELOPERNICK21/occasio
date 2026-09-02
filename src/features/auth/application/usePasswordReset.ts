import { useCallback, useEffect, useState } from 'react';
import { env } from '../../../shared/config/env';
import { isValidEmail, normalizeEmail } from '../domain/email';
import {
  PASSWORD_RESET_MOCK_COPY,
  PASSWORD_RESET_RESEND_SECONDS,
  PASSWORD_RESET_SENT_COPY,
  passwordResetResendLabel,
} from '../domain/passwordReset';
import { isAuthError, useAuthContext } from './AuthProvider';

export function usePasswordReset() {
  const { resetPassword } = useAuthContext();
  const [resetSent, setResetSent] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (resendSecondsLeft <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSecondsLeft]);

  const clearResetState = useCallback(() => {
    setResetSent(false);
    setResendSecondsLeft(0);
    setError(null);
    setIsLoading(false);
  }, []);

  const sendReset = useCallback(
    async (emailInput: string) => {
      const email = normalizeEmail(emailInput);
      if (!isValidEmail(email)) {
        setError('Enter a valid email address.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await resetPassword(email);
        setResetSent(true);
        setResendSecondsLeft(PASSWORD_RESET_RESEND_SECONDS);
      } catch (e) {
        setResetSent(false);
        setResendSecondsLeft(0);
        setError(isAuthError(e) ? e.message : 'Could not send reset email. Try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [resetPassword],
  );

  const successCopy = env.useMockAuth ? PASSWORD_RESET_MOCK_COPY : PASSWORD_RESET_SENT_COPY;

  return {
    resetSent,
    resendSecondsLeft,
    canResend: resetSent && resendSecondsLeft === 0 && !isLoading,
    resendLabel: passwordResetResendLabel(resendSecondsLeft),
    successCopy,
    error,
    isLoading,
    sendReset,
    clearResetState,
  };
}
