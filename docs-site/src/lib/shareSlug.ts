import { randomBytes } from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const SHARE_SLUG_LENGTH = 8;

/** Cryptographically random slug (server-only). */
export function generateShareSlug(length = SHARE_SLUG_LENGTH): string {
  const bytes = randomBytes(length);
  let slug = '';
  for (let i = 0; i < length; i += 1) {
    slug += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return slug;
}
