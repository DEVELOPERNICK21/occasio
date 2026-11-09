import { useCallback, useEffect, useMemo, useState } from 'react';
import { readSeenBadges, writeSeenBadges } from '../data/badgeStorage';
import {
  BADGE_SET_VERSION,
  newlyEarnedBadges,
  type WishBadge,
  type WishBadgeId,
} from '../domain/wishJourney';

type SeenState = { uid: string; ids: WishBadgeId[] | null; version: number } | null;

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
      .then(({ ids, version }) => {
        if (active) setSeen({ uid, ids, version });
      })
      .catch(() => {
        if (active) setSeen({ uid, ids: [], version: BADGE_SET_VERSION });
      });
    return () => {
      active = false;
    };
  }, [uid]);

  const loaded = seen !== null && seen.uid === uid;

  // First run on this device, or the badge set has grown since: accept what is already earned without
  // a burst of celebrations. Only badges earned from now on get one.
  useEffect(() => {
    if (!uid || !ready || !loaded) return;
    if (seen.ids !== null && seen.version >= BADGE_SET_VERSION) return;
    const accepted = Array.from(
      new Set([...(seen.ids ?? []), ...badges.filter((b) => b.unlocked).map((b) => b.id)]),
    );
    setSeen({ uid, ids: accepted, version: BADGE_SET_VERSION });
    void writeSeenBadges(uid, accepted).catch(() => undefined);
  }, [badges, loaded, ready, seen, uid]);

  const celebrating = useMemo<WishBadge | null>(() => {
    if (!ready || !loaded || seen.ids === null || seen.version < BADGE_SET_VERSION) return null;
    return newlyEarnedBadges(badges, seen.ids)[0] ?? null;
  }, [badges, loaded, ready, seen]);

  const dismiss = useCallback(() => {
    if (!uid || !celebrating || !seen || seen.ids === null) return;
    const next = [...seen.ids, celebrating.id];
    setSeen({ uid, ids: next, version: BADGE_SET_VERSION });
    void writeSeenBadges(uid, next).catch(() => undefined);
  }, [celebrating, seen, uid]);

  return { celebrating, dismiss };
}
