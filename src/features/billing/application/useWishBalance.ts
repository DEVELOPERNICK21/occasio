import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPurchaseSummary } from '../data/revenueCatClient';
import { readAllowanceCounters } from '../data/wishCreditStore';
import { computeWishBalance, type WishBalance } from '../domain/wishBalance';
import { useSubscription } from './useSubscription';

/**
 * How many wishes this person has left, and where they came from, for the home screen and the profile.
 * `balance` is null for a guest, and until the first read finishes (or when it fails, in which case a
 * screen shows nothing rather than a wrong number). `refresh` reads again right now: call it when a
 * screen comes into view, since a card or a purchase since the last look changes the answer.
 */
export function useWishBalance(userId: string | null) {
  const { hasPro, tier } = useSubscription();
  const [balance, setBalance] = useState<WishBalance | null>(null);
  /** The first read has finished (whatever it found), so a screen can stop waiting. */
  const [settled, setSettled] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const refresh = useCallback(async (): Promise<WishBalance | null> => {
    if (!userId) {
      if (alive.current) {
        setBalance(null);
        setSettled(true);
      }
      return null;
    }
    try {
      const [counters, summary] = await Promise.all([
        readAllowanceCounters(userId),
        fetchPurchaseSummary(),
      ]);
      const next = computeWishBalance(counters, summary);
      if (alive.current) setBalance(next);
      return next;
    } catch {
      return null;
    } finally {
      if (alive.current) setSettled(true);
    }
  }, [userId]);

  // A new plan (a purchase, a restore, a lapse) changes the answer without the screen having to ask.
  useEffect(() => {
    void refresh();
  }, [refresh, hasPro, tier]);

  return { balance, settled, refresh };
}
