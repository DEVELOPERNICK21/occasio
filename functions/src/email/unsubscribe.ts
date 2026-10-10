import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * One-click unsubscribe without keeping addresses. A suppression is stored under
 * the SHA-256 of the lower-cased address, and the link carries only that hash
 * plus an HMAC, so the link cannot be forged and the stored list cannot be read
 * back into email addresses. Keep this file identical in behaviour to
 * `docs-site/src/lib/email/unsubscribe.ts` (a contract test checks it).
 */
export const SUPPRESSIONS = 'email_suppressions';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailKey(email: string): string {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

function mac(key: string, secret: string): string {
  return createHmac('sha256', secret).update(`unsubscribe:${key}`).digest('base64url');
}

export function createUnsubscribeToken(email: string, secret: string): string {
  const key = emailKey(email);
  return `${key}.${mac(key, secret)}`;
}

/** Returns the suppression key when the token is genuine, otherwise `null`. */
export function verifyUnsubscribeToken(token: unknown, secret: string): string | null {
  if (typeof token !== 'string' || token.length > 200) return null;
  const [key, sig, extra] = token.split('.');
  if (!key || !sig || extra !== undefined || !/^[0-9a-f]{64}$/.test(key)) return null;
  const expected = Buffer.from(mac(key, secret));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected) ? key : null;
}

export async function isSuppressed(
  db: FirebaseFirestore.Firestore,
  email: string,
): Promise<boolean> {
  const snap = await db.collection(SUPPRESSIONS).doc(emailKey(email)).get();
  return snap.exists;
}
