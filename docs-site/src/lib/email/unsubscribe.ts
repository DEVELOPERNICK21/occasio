import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies an unsubscribe link and writes the suppression. Must behave exactly
 * like `functions/src/email/unsubscribe.ts`, which creates the links and checks
 * the list before every send (a contract test in `__tests__/email` enforces it).
 */
export const SUPPRESSIONS = 'email_suppressions';

export function emailKey(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function mac(key: string, secret: string): string {
  return createHmac('sha256', secret).update(`unsubscribe:${key}`).digest('base64url');
}

export function createUnsubscribeToken(email: string, secret: string): string {
  const key = emailKey(email);
  return `${key}.${mac(key, secret)}`;
}

export function verifyUnsubscribeToken(token: unknown, secret: string): string | null {
  if (typeof token !== 'string' || token.length > 200) return null;
  const [key, sig, extra] = token.split('.');
  if (!key || !sig || extra !== undefined || !/^[0-9a-f]{64}$/.test(key)) return null;
  const expected = Buffer.from(mac(key, secret));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected) ? key : null;
}

export function unsubscribeSecret(): string | null {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}
