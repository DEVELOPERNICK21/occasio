import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeHistory, recordHistoryEntry } from '../data/historyRepository';
import type { HistoryEntry, RecordHistoryInput } from '../domain/types';

export function useHistory(enabled: boolean) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setEntries([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeHistory(
        (next) => {
          setEntries(next);
          setIsLoading(false);
          setError(null);
        },
        () => {
          setEntries([]);
          setIsLoading(false);
          setError('Could not load history.');
        },
      );
      return unsubscribe;
    } catch {
      setEntries([]);
      setIsLoading(false);
      setError('Sign in to view your history.');
      return undefined;
    }
  }, [enabled]);

  return { entries, isLoading, error };
}

/** Persist a creation to signed-in history (idempotent by creationId). */
export function useRecordHistory() {
  const recordedRef = useRef<Set<string>>(new Set());

  const record = useCallback(async (input: RecordHistoryInput) => {
    if (recordedRef.current.has(input.creationId)) {
      return;
    }
    recordedRef.current.add(input.creationId);
    try {
      await recordHistoryEntry(input);
    } catch {
      recordedRef.current.delete(input.creationId);
    }
  }, []);

  return { record };
}
