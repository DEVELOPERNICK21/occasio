import type { AuthUser } from './types';

/**
 * The free card needs an identity somebody has vouched for. Google and Apple do that when
 * they sign someone in; an email and password does not until the inbox is confirmed. This is
 * only for the app's screens: the server decides, and checks the same thing itself.
 */
export function needsEmailVerification(user: AuthUser | null | undefined): boolean {
  return Boolean(user && user.usesPassword === true && user.emailVerified !== true);
}

/** Wait this long before offering to send the confirmation email again. */
export const VERIFY_RESEND_SECONDS = 60;

export function verifyResendLabel(secondsLeft: number): string {
  return secondsLeft > 0 ? `Send the link again (${secondsLeft}s)` : 'Send the link again';
}

/** What to show under the sheet after a check that found the email still unconfirmed. */
export const STILL_UNCONFIRMED_NOTICE =
  'Not confirmed yet. Open the link in your email first, then check again.';
