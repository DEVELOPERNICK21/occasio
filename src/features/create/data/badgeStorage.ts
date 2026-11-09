import AsyncStorage from '@react-native-async-storage/async-storage';
import { BADGE_SET_VERSION, type WishBadgeId } from '../domain/wishJourney';

const KEY_PREFIX = 'occasio.badges.seen.v1';
const VERSION_PREFIX = 'occasio.badges.set';

function storageKey(uid: string): string {
  return `${KEY_PREFIX}.${uid}`;
}

function versionKey(uid: string): string {
  return `${VERSION_PREFIX}.${uid}`;
}

export type SeenBadges = {
  /** `null` when this account has never stored celebrated badges on this device. */
  ids: WishBadgeId[] | null;
  /** The badge set the stored ids were saved against (0 for none). */
  version: number;
};

export async function readSeenBadges(uid: string): Promise<SeenBadges> {
  const [raw, rawVersion] = await Promise.all([
    AsyncStorage.getItem(storageKey(uid)),
    AsyncStorage.getItem(versionKey(uid)),
  ]);
  const version = Number.parseInt(rawVersion ?? '', 10);
  const stored = Number.isFinite(version) ? version : 0;
  if (raw === null) return { ids: null, version: stored };
  try {
    const parsed: unknown = JSON.parse(raw);
    return {
      ids: Array.isArray(parsed)
        ? parsed.filter((id): id is WishBadgeId => typeof id === 'string')
        : [],
      version: stored,
    };
  } catch {
    return { ids: [], version: stored };
  }
}

export async function writeSeenBadges(uid: string, ids: readonly WishBadgeId[]): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(storageKey(uid), JSON.stringify(ids)),
    AsyncStorage.setItem(versionKey(uid), String(BADGE_SET_VERSION)),
  ]);
}
