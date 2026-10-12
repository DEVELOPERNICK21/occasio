import { randomBytes } from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** 36^12 combinations, so a link cannot be found by guessing. Older cards have 8. */
export const SHARE_SLUG_LENGTH = 12;

/** Cryptographically random slug (server-only). */
export function generateShareSlug(length = SHARE_SLUG_LENGTH): string {
  // Reject bytes past the last whole multiple of 36 so every character is equally likely.
  const limit = 256 - (256 % ALPHABET.length);
  let slug = '';
  while (slug.length < length) {
    for (const byte of randomBytes(length * 2)) {
      if (byte >= limit) continue;
      slug += ALPHABET[byte % ALPHABET.length];
      if (slug.length === length) break;
    }
  }
  return slug;
}
