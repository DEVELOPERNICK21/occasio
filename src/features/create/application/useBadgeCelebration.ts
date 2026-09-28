import { useCallback, useEffect, useMemo, useState } from 'react';
import { readSeenBadges, writeSeenBadges } from '../data/badgeStorage';
import {
  newlyEarnedBadges,
  type WishBadge,
  type WishBadgeId,
} from '../domain/wishJourney';

type SeenState = { uid: string; ids: WishBadgeId[] | null } | null;

/**
 * Surfaces one newly earned badge at a time. `ready` must only be true once
 * History and Vault have loaded, otherwise badges would appear to "unlock"
 * mid-fetch.
 */
export function useBadgeCelebration(
  uid: string | null,
  badges: readonly WishBadge[],
  ready: boolean,
) {
  const [seen, setSeen] = useState<SeenState>(null);

  useEffect(() => {
    if (!uid) {
      setSeen(null);
      return;
    }
    let active = true;
    void readSeenBadges(uid)
      .then((ids) => {
        if (active) setSeen({ uid, ids });
      })
      .catch(() => {
        if (active) setSeen({ uid, ids: [] });
      });
    return () => {
      active = false;
    };
  }, [uid]);

  const loaded = seen !== null && seen.uid === uid;

  // First run on this device: accept already-earned badges without a burst of
  // celebrations for existing users.
  useEffect(() => {
    if (!uid || !ready || !loaded || seen.ids !== null) return;
    const initial = badges.filter((b) => b.unlocked).map((b) => b.id);
    setSeen({ uid, ids: initial });
    void writeSeenBadges(uid, initial).catch(() => undefined);
  }, [badges, loaded, ready, seen, uid]);

  const celebrating = useMemo<WishBadge | null>(() => {
    if (!ready || !loaded || seen.ids === null) return null;
    return newlyEarnedBadges(badges, seen.ids)[0] ?? null;
  }, [badges, loaded, ready, seen]);

  const dismiss = useCallback(() => {
    if (!uid || !celebrating || !seen || seen.ids === null) return;
    const next = [...seen.ids, celebrating.id];
    setSeen({ uid, ids: next });
    void writeSeenBadges(uid, next).catch(() => undefined);
  }, [celebrating, seen, uid]);

  return { celebrating, dismiss };
}
