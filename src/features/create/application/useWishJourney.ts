import { useMemo } from 'react';
import { useHistory } from '../../history/application/useHistory';
import { useVaultPeople } from '../../vault/application/useVaultPeople';
import { computeWishJourney, countArmedAutoSend } from '../domain/wishJourney';

/** Level, streak and badges from the person's real cards and Vault, for a screen that is not Create home. */
export function useWishJourney(enabled: boolean) {
  const { entries, isLoading: historyLoading } = useHistory(enabled);
  const { people, isLoading: vaultLoading } = useVaultPeople(enabled);

  const journey = useMemo(
    () =>
      computeWishJourney(enabled ? entries : [], enabled ? people.length : 0, new Date(), {
        armedAutoSend: enabled ? countArmedAutoSend(people) : 0,
      }),
    [enabled, entries, people],
  );

  return { journey, isLoading: enabled && (historyLoading || vaultLoading) };
}
