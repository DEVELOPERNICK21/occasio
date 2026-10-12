import { useCallback, useEffect, useState } from 'react';
import { readFreeCardsUsed } from '../data/wishCreditStore';

/**
 * Free cards the server has counted for this account. `used` is null until the
 * first read finishes (or when it fails); `refresh` re-reads right now, for
 * checks that must not rely on a value read minutes ago.
 */
export function useFreeCardsUsed(userId: string | null) {
  const [used, setUsed] = useState<number | null>(null);

  const refresh = useCallback(async (): Promise<number | null> => {
    if (!userId) {
      setUsed(null);
      return null;
    }
    try {
      const value = await readFreeCardsUsed(userId);
      setUsed(value);
      return value;
    } catch {
      return null;
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { used, refresh };
}
