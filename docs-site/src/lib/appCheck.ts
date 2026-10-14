/**
 * Firebase App Check on our own API: is this request from the real Occasio app on a real
 * device, not a script, an emulator farm or a modified copy?
 *
 * The app sends a short-lived token in `X-Firebase-AppCheck`; the Admin SDK checks it was
 * issued to an app of this project. It says nothing about who the person is, so it never
 * replaces sign-in. It is what makes a device signal worth trusting later.
 *
 * Rolled out in three steps through `APP_CHECK_MODE`: `off` (not looked at), `log` (the
 * default: checked and logged, nothing refused) and `enforce` (a request without a valid
 * token is refused). Switch to `enforce` only once real devices show up as valid in the logs.
 */
import { getAppCheck } from 'firebase-admin/app-check';
import { getAdminApp } from './firebaseAdmin';

export type AppCheckMode = 'off' | 'log' | 'enforce';
export type AppCheckResult = 'valid' | 'missing' | 'invalid';

export const APP_CHECK_HEADER = 'x-firebase-appcheck';

/** Anything unrecognised is `log`, so a typo can neither lock everyone out nor switch it off. */
export function appCheckMode(value: string | undefined = process.env.APP_CHECK_MODE): AppCheckMode {
  const mode = value?.trim().toLowerCase();
  return mode === 'off' || mode === 'enforce' ? mode : 'log';
}

export function appCheckDecision(
  mode: AppCheckMode,
  result: AppCheckResult,
): { allow: boolean; log: boolean } {
  if (mode === 'off') return { allow: true, log: false };
  // While watching, every result is logged so the share of real devices that pass is visible;
  // once enforcing, only the refusals are worth a line.
  return {
    allow: result === 'valid' || mode !== 'enforce',
    log: mode === 'log' || result !== 'valid',
  };
}

export const APP_CHECK_REFUSAL = {
  status: 403,
  code: 'APP_CHECK_FAILED',
  message: 'We could not confirm this is the Occasio app. Update the app and try again.',
} as const;

/** Checks a token with Firebase. Returns true when it was issued to an app of this project. */
export type VerifyAppCheckToken = (token: string) => Promise<boolean>;

async function verifyWithFirebase(token: string): Promise<boolean> {
  try {
    await getAppCheck(getAdminApp()).verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function checkAppCheck(
  request: Request,
  verify: VerifyAppCheckToken = verifyWithFirebase,
): Promise<AppCheckResult> {
  const token = request.headers.get(APP_CHECK_HEADER)?.trim();
  if (!token) return 'missing';
  // A real token is a short JWT; refuse oversized junk before spending a network call on it.
  if (token.length > 4096) return 'invalid';
  return (await verify(token)) ? 'valid' : 'invalid';
}
