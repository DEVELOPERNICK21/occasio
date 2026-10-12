/**
 * What to tell someone whose account deletion did not go through. The cause
 * decides the advice: a connection problem is theirs to retry, a server fault is
 * ours, and either way they are never left without a way to get it done.
 */
export const DELETE_SUPPORT_EMAIL = 'developernick1@gmail.com';

function statusOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null;
  const status = Number((error as { status: unknown }).status);
  return Number.isFinite(status) ? status : null;
}

export function deleteAccountFailureMessage(error: unknown): string {
  const status = statusOf(error);

  if (status === 401 || status === 403) {
    return 'Your sign-in has expired. Sign out, sign in again, then try deleting your account.';
  }
  if (status === 429) {
    return 'Too many attempts. Wait a few minutes, then try again.';
  }
  if (status !== null) {
    return `We could not delete your account because of a problem on our side. Nothing was removed. Try again in a little while, or email ${DELETE_SUPPORT_EMAIL} and we will delete it for you.`;
  }
  return 'Could not reach Occasio. Check your connection and try again.';
}
