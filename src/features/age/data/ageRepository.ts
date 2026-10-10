import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { httpClient } from '../../../shared/api/httpClient';
import { isHttpError } from '../../../shared/api/errors';
import { env } from '../../../shared/config/env';
import type { DateOfBirth } from '../domain/ageGate';
import {
  clearAgeConfirmed,
  markAccountStamped,
  readAgeState,
  wasAccountStamped,
  writeAgeBlocked,
  writeAgeConfirmed,
} from './ageStorage';

export type AgeCheckResult = 'passed' | 'blocked' | 'offline';

const MOCK_ATTESTATION = 'mock-attestation';
const isMocked = () => env.useMockApi || env.useMockAuth;

/**
 * Debug builds only. While developing, the age endpoint may not be deployed yet
 * (or the server may be unreachable). Rather than lock the developer out, a debug
 * build accepts the date locally and stores this marker. `__DEV__` is a compile-time
 * constant, so none of this exists in a release build, and the server would reject
 * the marker anyway.
 */
const DEV_ATTESTATION = 'dev-attestation';

function devFallback(error: unknown): boolean {
  if (!__DEV__) return false;
  const missing = isHttpError(error) && (error.status === 404 || error.status === 503);
  const unreachable = !isHttpError(error);
  return missing || unreachable;
}

/**
 * Asks the server whether this date of birth is 13 or older. The server answers
 * yes or no and stores nothing; on "yes" the app keeps only the signed token.
 */
export async function checkDateOfBirth(dob: DateOfBirth): Promise<AgeCheckResult> {
  if (isMocked()) {
    await writeAgeConfirmed(MOCK_ATTESTATION);
    return 'passed';
  }
  try {
    const res = await httpClient.post<{ attestation: string }>(
      env.sparkApiBaseUrl,
      '/api/v1/age/check',
      dob,
    );
    await writeAgeConfirmed(res.attestation);
    return 'passed';
  } catch (error) {
    if (isHttpError(error) && error.code === 'UNDER_AGE') {
      await writeAgeBlocked();
      return 'blocked';
    }
    if (devFallback(error)) {
      console.warn('[age] Age server not reachable; accepting locally (debug build only).');
      await writeAgeConfirmed(DEV_ATTESTATION);
      return 'passed';
    }
    return 'offline';
  }
}

export class AccountAgeError extends Error {
  constructor(public readonly reason: 'under_age' | 'attestation' | 'network') {
    super(`age_${reason}`);
    this.name = 'AccountAgeError';
  }
}

/** Tells the server this account passed the check; the server records it. Throws `AccountAgeError`. */
export async function stampAccount(idToken: string): Promise<void> {
  if (isMocked()) return;
  const state = await readAgeState();
  if (state.status !== 'confirmed') {
    throw new AccountAgeError('attestation');
  }
  // Debug builds that used the local fallback have nothing the server could verify.
  if (__DEV__ && state.attestation === DEV_ATTESTATION) return;
  try {
    await httpClient.post(
      env.sparkApiBaseUrl,
      '/api/v1/account/age',
      { attestation: state.attestation },
      { Authorization: `Bearer ${idToken}` },
    );
  } catch (error) {
    if (isHttpError(error) && error.code === 'UNDER_AGE') throw new AccountAgeError('under_age');
    if (isHttpError(error) && (error.code === 'ATTESTATION_INVALID' || error.status === 403)) {
      await clearAgeConfirmed();
      throw new AccountAgeError('attestation');
    }
    throw new AccountAgeError('network');
  }
}

/**
 * A new account may only exist if the server accepts the age check. If it does
 * not, the account is deleted again straight away so nothing is kept.
 */
export async function enforceAgeForNewAccount(user: {
  getIdToken(): Promise<string>;
  delete(): Promise<void>;
}): Promise<void> {
  try {
    await stampAccount(await user.getIdToken());
  } catch (error) {
    await user.delete().catch(() => undefined);
    await auth().signOut().catch(() => undefined);
    throw error;
  }
}

/** Accounts that predate the check are stamped quietly the first time they are seen. */
export async function ensureAccountStamped(uid: string): Promise<void> {
  if (isMocked() || (await wasAccountStamped(uid))) return;
  try {
    const snap = await firestore().collection('users').doc(uid).get();
    if (snap.exists() && snap.data()?.ageConfirmedAt) {
      await markAccountStamped(uid);
      return;
    }
    const token = await auth().currentUser?.getIdToken();
    if (!token) return;
    await stampAccount(token);
    await markAccountStamped(uid);
  } catch {
    // Offline or not confirmed yet: try again next time the app starts.
  }
}
