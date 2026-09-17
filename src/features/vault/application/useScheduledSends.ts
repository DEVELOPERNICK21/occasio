import { useEffect, useState } from 'react';
import { subscribeScheduledSends } from '../data/scheduledSendRepository';
import type { ScheduledSend } from '../data/scheduledSendRepository';

type State = {
  sends: ScheduledSend[];
  isLoading: boolean;
  error: string | null;
};

const initialState: State = {
  sends: [],
  isLoading: true,
  error: null,
};

export function useScheduledSends(enabled: boolean) {
  const [state, setState] = useState<State>(initialState);

  useEffect(() => {
    if (!enabled) {
      setState({ sends: [], isLoading: false, error: null });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const unsubscribe = subscribeScheduledSends(
        (sends) => {
          setState({ sends, isLoading: false, error: null });
        },
        () => {
          setState({
            sends: [],
            isLoading: false,
            error: 'Could not load scheduled sends.',
          });
        },
      );
      return unsubscribe;
    } catch {
      setState({
        sends: [],
        isLoading: false,
        error: 'Sign in to view scheduled sends.',
      });
      return undefined;
    }
  }, [enabled]);

  const reviewCount = state.sends.filter((send) => send.status === 'review').length;

  return {
    ...state,
    reviewCount,
  };
}
