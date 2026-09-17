import { useCallback, useState } from 'react';
import {
  approveScheduledSend,
  cancelScheduledSend,
} from '../data/scheduledSendRepository';
import {
  ScheduledSendApiError,
  type ReviewSendResult,
} from '../data/scheduledSendErrors';

function toUserMessage(error: unknown): string {
  if (error instanceof ScheduledSendApiError) {
    return error.message;
  }
  return 'Could not update scheduled send.';
}

export function useReviewSend() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async (id: string): Promise<ReviewSendResult | null> => {
    setPendingId(id);
    setError(null);
    try {
      return await approveScheduledSend(id);
    } catch (e) {
      setError(toUserMessage(e));
      return null;
    } finally {
      setPendingId(null);
    }
  }, []);

  const cancel = useCallback(async (id: string): Promise<boolean> => {
    setPendingId(id);
    setError(null);
    try {
      await cancelScheduledSend(id);
      return true;
    } catch (e) {
      setError(toUserMessage(e));
      return false;
    } finally {
      setPendingId(null);
    }
  }, []);

  return {
    approve,
    cancel,
    pendingId,
    error,
    clearError: () => setError(null),
  };
}
