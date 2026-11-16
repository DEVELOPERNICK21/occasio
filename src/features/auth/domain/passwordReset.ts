/** Seconds before the user can request another reset email. */
export const PASSWORD_RESET_RESEND_SECONDS = 60;

/**
 * Said whether or not an email was really sent: Firebase accepts a reset for any address and sends only
 * to a real password account, and we must not reveal which addresses have an account. So the copy has
 * to cover the two ways nothing arrives: it is in spam, or the account has no password at all.
 */
export const PASSWORD_RESET_SENT_COPY =
  'If this email has a password account, we sent a reset link. It can take a few minutes and may land in spam. If you joined with Google or Apple there is no password to reset: go back and continue with Google or Apple.';

/** What a failed request says. Not "sign-in failed": nobody was signing in. */
export const PASSWORD_RESET_FAILED_COPY =
  'We could not send the reset email just now. Check your connection and try again in a minute.';

export const PASSWORD_RESET_MOCK_COPY =
  'Mock auth is on — no email is sent. Turn off useMockAuth in env.ts to test real reset emails.';

export function passwordResetResendLabel(secondsLeft: number): string {
  if (secondsLeft > 0) {
    return `Resend in ${secondsLeft}s`;
  }
  return 'Resend email';
}
