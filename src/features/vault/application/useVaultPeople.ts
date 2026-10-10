import { useCallback, useEffect, useState } from 'react';
import { subscribeVaultPeople } from '../data/relationshipRepository';
import type { VaultPerson } from '../domain/types';

type State = {
  people: VaultPerson[];
  isLoading: boolean;
  error: string | null;
};

const initialState: State = {
  people: [],
  isLoading: true,
  error: null,
};

export function useVaultPeople(enabled: boolean) {
  const [state, setState] = useState<State>(initialState);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    if (!enabled) {
      setState({ people: [], isLoading: false, error: null });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const unsubscribe = subscribeVaultPeople(
        (people) => {
          setState({ people, isLoading: false, error: null });
        },
        () => {
          setState({
            people: [],
            isLoading: false,
            error: 'Could not load your Vault.',
          });
        },
      );
      return unsubscribe;
    } catch {
      setState({
        people: [],
        isLoading: false,
        error: 'Sign in to view your Vault.',
      });
      return undefined;
    }
  }, [enabled, attempt]);

  return { ...state, reload };
}
