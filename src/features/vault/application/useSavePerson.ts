import { useCallback, useState } from 'react';
import { AnalyticsEvents, trackEvent } from '../../../shared/analytics/events';
import { createVaultPerson } from '../data/relationshipRepository';
import { VaultError } from '../data/vaultErrors';
import { validatePersonDraft } from '../domain/personRules';
import { canAddPerson, canEnableAutoSend } from '../domain/tierLimits';
import type { PersonDraft, SubscriptionTier, VaultPerson } from '../domain/types';

type State = {
  isSaving: boolean;
  error: string | null;
};

const initialState: State = {
  isSaving: false,
  error: null,
};

type Options = {
  currentCount: number;
  tier?: SubscriptionTier;
};

export function useSavePerson(options: Options) {
  const { currentCount, tier = 'free' } = options;
  const [state, setState] = useState<State>(initialState);

  const save = useCallback(
    async (
      draft: PersonDraft,
      arms: { birthday: boolean; anniversary: boolean },
    ): Promise<VaultPerson | null> => {
      if (!canAddPerson(currentCount, tier)) {
        setState({
          isSaving: false,
          error: 'Person limit reached on your plan. Upgrade to save more.',
        });
        return null;
      }

      const wantsBirthday = arms.birthday && canEnableAutoSend(tier);
      const wantsAnniversary = arms.anniversary && canEnableAutoSend(tier);
      const validation = validatePersonDraft(draft, {
        autoSendBirthday: wantsBirthday,
        autoSendAnniversary: wantsAnniversary,
      });

      if (!validation.ok) {
        setState({ isSaving: false, error: validation.error });
        return null;
      }

      setState({ isSaving: true, error: null });

      try {
        const person = await createVaultPerson({
          ...validation.input,
          autoSendBirthday: wantsBirthday,
          autoSendAnniversary: wantsAnniversary,
        });
        trackEvent(AnalyticsEvents.vaultPersonAdded, {
          relationshipType: person.relationshipType,
          hasBirthday: Boolean(person.birthday),
        });
        setState({ isSaving: false, error: null });
        return person;
      } catch (error) {
        const message =
          error instanceof VaultError
            ? error.message
            : 'Could not save person. Try again.';
        setState({ isSaving: false, error: message });
        return null;
      }
    },
    [currentCount, tier],
  );

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  return {
    ...state,
    save,
    clearError,
    canEnableAutoSend: canEnableAutoSend(tier),
    personCapReached: !canAddPerson(currentCount, tier),
  };
}
