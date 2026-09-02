/** Seconds before the user can request another reset email. */
export const PASSWORD_RESET_RESEND_SECONDS = 60;

export const PASSWORD_RESET_SENT_COPY =
  'If this email has a password account, we sent reset instructions. Check your inbox and spam folder.';

export const PASSWORD_RESET_MOCK_COPY =
  'Mock auth is on — no email is sent. Turn off useMockAuth in env.ts to test real reset emails.';

export function passwordResetResendLabel(secondsLeft: number): string {
  if (secondsLeft > 0) {
    return `Resend in ${secondsLeft}s`;
  }
  return 'Resend email';
}
