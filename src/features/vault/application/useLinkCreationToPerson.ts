import { useCallback, useState } from 'react';
import { linkVaultPersonCreation } from '../data/relationshipRepository';
import { VaultError } from '../data/vaultErrors';
import {
  packFromLinkedCreation,
  type LinkCreationFields,
} from '../domain/contentFallback';

export type LinkCreationInput = LinkCreationFields & {
  creationId: string;
};

type State = {
  isSaving: boolean;
  error: string | null;
};

const initialState: State = {
  isSaving: false,
  error: null,
};

export function useLinkCreationToPerson() {
  const [state, setState] = useState<State>(initialState);

  const link = useCallback(
    async (personId: string, input: LinkCreationInput) => {
      setState({ isSaving: true, error: null });
      try {
        const { creationId, ...fields } = input;
        await linkVaultPersonCreation(
          personId,
          creationId,
          packFromLinkedCreation(fields),
        );
        setState({ isSaving: false, error: null });
        return true;
      } catch (error) {
        const message =
          error instanceof VaultError
            ? error.message
            : 'Could not save this card for auto-send.';
        setState({ isSaving: false, error: message });
        return false;
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  return {
    ...state,
    link,
    clearError,
  };
}
