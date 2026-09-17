import { useCallback, useState } from 'react';
import { updateVaultPersonPack } from '../data/relationshipRepository';
import { VaultError } from '../data/vaultErrors';
import type { AutoSendPack } from '../domain/types';

type State = {
  isSaving: boolean;
  error: string | null;
};

const initialState: State = {
  isSaving: false,
  error: null,
};

export function useUpdateAutoSendPack() {
  const [state, setState] = useState<State>(initialState);

  const savePack = useCallback(async (personId: string, pack: AutoSendPack) => {
    setState({ isSaving: true, error: null });
    try {
      await updateVaultPersonPack(personId, pack);
      setState({ isSaving: false, error: null });
      return true;
    } catch (error) {
      const message =
        error instanceof VaultError
          ? error.message
          : 'Could not update auto-send pack.';
      setState({ isSaving: false, error: message });
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  return {
    ...state,
    savePack,
    clearError,
  };
}
