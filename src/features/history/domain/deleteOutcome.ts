/**
 * Deleting a card does two things: turn its share link off, then clear the
 * History row. The cause of a failure decides what to tell the person and what
 * to do next: a dropped connection is theirs to retry, an expired sign-in needs
 * signing in again, and "this account does not own the link" will never work on
 * retry, so History must not stay stuck on it.
 */
export type DeleteFailureKind = 'sign_in' | 'not_owner' | 'busy' | 'server' | 'network';

/** `status` is the HTTP status the server answered with, or null when it never answered. */
export function deleteFailureKind(status: number | null): DeleteFailureKind {
  if (status === 401) return 'sign_in';
  if (status === 403) return 'not_owner';
  if (status === 429) return 'busy';
  if (status !== null) return 'server';
  return 'network';
}

/** Shown when the card could not be deleted and the person should try again. */
export const DELETE_RETRY_MESSAGE: Record<Exclude<DeleteFailureKind, 'not_owner'>, string> = {
  sign_in: 'Your sign-in has expired. Sign out, sign in again, then try deleting this card.',
  busy: 'Too many attempts. Wait a minute, then try again.',
  server:
    'Something went wrong on our side, so the link was not turned off. Try again in a little while.',
  network: 'Could not reach Occasio. Check your connection and try again.',
};

/** What a finished delete tells the person, when it did not go all the way. */
export const LINK_STILL_ACTIVE_NOTICE = {
  title: 'Removed from History',
  body: 'We could not turn its link off from this account, so the link stays active until it expires.',
} as const;
