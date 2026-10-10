import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AgeState } from '../domain/ageGate';

const KEY = 'occasio.age.v1';
const STAMPED_PREFIX = 'occasio.age.stamped.';

/**
 * Only the result is kept on the device: a signed token that says "passed", or a
 * "blocked" marker so the check cannot simply be retried with another date. The
 * birthday itself is never written anywhere.
 */
export async function readAgeState(): Promise<AgeState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { status: 'unknown' };
    const parsed = JSON.parse(raw) as Partial<AgeState>;
    if (parsed.status === 'blocked') {
      return { status: 'blocked', at: String((parsed as { at?: string }).at ?? '') };
    }
    if (parsed.status === 'confirmed' && typeof (parsed as { attestation?: unknown }).attestation === 'string') {
      const confirmed = parsed as { attestation: string; at?: string };
      return { status: 'confirmed', attestation: confirmed.attestation, at: String(confirmed.at ?? '') };
    }
  } catch {
    // unreadable → ask again
  }
  return { status: 'unknown' };
}

export async function writeAgeConfirmed(attestation: string): Promise<void> {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({ status: 'confirmed', attestation, at: new Date().toISOString() }),
  );
}

export async function writeAgeBlocked(): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ status: 'blocked', at: new Date().toISOString() }));
}

/** The stored token is no longer accepted: ask for the date of birth again. */
export async function clearAgeConfirmed(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export async function wasAccountStamped(uid: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(`${STAMPED_PREFIX}${uid}`)) === '1';
  } catch {
    return false;
  }
}

export async function markAccountStamped(uid: string): Promise<void> {
  await AsyncStorage.setItem(`${STAMPED_PREFIX}${uid}`, '1');
}
