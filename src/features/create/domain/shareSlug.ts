/** Production share slugs — generated server-side only. */
export const SHARE_SLUG_LENGTH = 12;

/** New cards get 12 characters; cards made earlier have 8 and still work. */
export const SHARE_SLUG_PATTERN = /^[a-z0-9]{8,12}$/;

export function isValidShareSlug(slug: string): boolean {
  return SHARE_SLUG_PATTERN.test(slug);
}
