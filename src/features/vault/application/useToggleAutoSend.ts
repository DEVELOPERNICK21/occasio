import { useCallback, useState } from 'react';
import {
  setVaultPersonAutoSendAnniversary,
  setVaultPersonAutoSendBirthday,
} from '../data/relationshipRepository';
import { VaultError } from '../data/vaultErrors';
import { canEnableAutoSend } from '../domain/tierLimits';
import type { OccasionType, SubscriptionTier } from '../domain/types';

export function useToggleAutoSend(tier: SubscriptionTier = 'free') {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoSendAllowed = canEnableAutoSend(tier);

  const toggle = useCallback(
    async (
      personId: string,
      occasion: OccasionType,
      nextValue: boolean,
    ) => {
      if (!autoSendAllowed) {
        setError('Occasio Pro unlocks auto-send arming. Upgrade in Account.');
        return false;
      }

      setPendingId(personId);
      setError(null);
      try {
        if (occasion === 'anniversary') {
          await setVaultPersonAutoSendAnniversary(personId, nextValue);
        } else {
          await setVaultPersonAutoSendBirthday(personId, nextValue);
        }
        return true;
      } catch (e) {
        setError(
          e instanceof VaultError ? e.message : 'Could not update auto-send.',
        );
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [autoSendAllowed],
  );

  return {
    toggle,
    pendingId,
    error,
    autoSendAllowed,
    clearError: () => setError(null),
  };
}
