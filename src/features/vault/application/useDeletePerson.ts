import { useCallback, useState } from 'react';
import { deleteVaultPerson } from '../data/relationshipRepository';
import { VaultError } from '../data/vaultErrors';

type State = {
  isDeleting: boolean;
  error: string | null;
};

const initialState: State = {
  isDeleting: false,
  error: null,
};

export function useDeletePerson() {
  const [state, setState] = useState<State>(initialState);

  const remove = useCallback(async (personId: string): Promise<boolean> => {
    setState({ isDeleting: true, error: null });

    try {
      await deleteVaultPerson(personId);
      setState({ isDeleting: false, error: null });
      return true;
    } catch (error) {
      const message =
        error instanceof VaultError
          ? error.message
          : 'Could not delete person. Try again.';
      setState({ isDeleting: false, error: message });
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  return {
    ...state,
    remove,
    clearError,
  };
}
