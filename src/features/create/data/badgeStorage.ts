import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WishBadgeId } from '../domain/wishJourney';

const KEY_PREFIX = 'occasio.badges.seen.v1';

function storageKey(uid: string): string {
  return `${KEY_PREFIX}.${uid}`;
}

/** `null` when this account has never stored celebrated badges on this device. */
export async function readSeenBadges(uid: string): Promise<WishBadgeId[] | null> {
  const raw = await AsyncStorage.getItem(storageKey(uid));
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is WishBadgeId => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function writeSeenBadges(uid: string, ids: readonly WishBadgeId[]): Promise<void> {
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(ids));
}
