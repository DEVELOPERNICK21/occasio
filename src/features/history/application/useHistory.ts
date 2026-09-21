import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteHistoryEntry,
  subscribeHistory,
  recordHistoryEntry,
} from '../data/historyRepository';
import { HistoryError } from '../data/historyErrors';
import { enqueuePendingHistoryEntry } from '../data/pendingHistoryStorage';
import { syncPendingHistoryEntries } from '../data/syncPendingHistory';
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

/** Permanently delete a history entry (UI confirms in screens). */
export function useDeleteHistory() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (entryId: string): Promise<string | null> => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteHistoryEntry(entryId);
      setIsDeleting(false);
      return null;
    } catch (err) {
      const message =
        err instanceof HistoryError
          ? err.message
          : 'Could not delete this card. Try again.';
      setError(message);
      setIsDeleting(false);
      return message;
    }
  }, []);

  return { remove, isDeleting, error };
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

/** Queue a guest creation locally until the user signs in. */
export function useQueueGuestHistory() {
  const queuedRef = useRef<Set<string>>(new Set());

  const queue = useCallback(async (input: RecordHistoryInput) => {
    if (queuedRef.current.has(input.creationId)) {
      return;
    }
    queuedRef.current.add(input.creationId);
    await enqueuePendingHistoryEntry(input);
  }, []);

  return { queue };
}

export { syncPendingHistoryEntries };
