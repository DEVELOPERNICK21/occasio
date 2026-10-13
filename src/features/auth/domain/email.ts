const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export type FieldError = string | null;

/** What to say under the email field, or null when it is fine. Empty and wrong are different problems. */
export function emailFieldError(raw: string): FieldError {
  const email = normalizeEmail(raw);
  if (email.length === 0) return 'Enter your email address.';
  if (!isValidEmail(email)) return 'Check the email address, it looks incomplete.';
  return null;
}

/**
 * Signing in only needs something typed: the server decides if it is right, and an
 * older account may have a password that is shorter than today's minimum.
 * Creating an account holds the new password to the minimum.
 */
export function passwordFieldError(password: string, mode: 'sign_in' | 'sign_up'): FieldError {
  if (password.length === 0) return 'Enter your password.';
  if (mode === 'sign_up' && !isValidPassword(password)) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/** The checklist shown while someone picks a new password. */
export const PASSWORD_RULES: readonly { id: string; label: string; met: (password: string) => boolean }[] = [
  { id: 'length', label: `At least ${MIN_PASSWORD_LENGTH} characters`, met: isValidPassword },
];

export type PasswordStrength = 'empty' | 'weak' | 'good' | 'strong';

/**
 * A rough guide, not a guarantee: length matters most, mixing kinds of
 * characters helps. Below the minimum it is always weak.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 'empty';
  if (!isValidPassword(password)) return 'weak';
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (password.length >= 12 && kinds >= 3) return 'strong';
  if (password.length >= 10 || kinds >= 3) return 'good';
  return 'weak';
}
