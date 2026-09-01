/** Production share slugs — generated server-side only. */
export const SHARE_SLUG_LENGTH = 8;

export const SHARE_SLUG_PATTERN = /^[a-z0-9]{8}$/;

export function isValidShareSlug(slug: string): boolean {
  return SHARE_SLUG_PATTERN.test(slug);
}
