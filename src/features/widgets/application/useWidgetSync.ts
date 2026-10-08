import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { VaultPerson } from '../../vault/domain/types';
import { clearWidgetSnapshot, writeWidgetSnapshot } from '../data/widgetBridge';
import { buildWidgetSnapshot, snapshotSignature } from '../domain/widgetSnapshot';

type Input = {
  authLoading: boolean;
  isSignedIn: boolean;
  people: VaultPerson[];
  peopleLoading: boolean;
  peopleError: boolean;
};

/**
 * Keeps the widgets' copy of the Vault current: written when people change and
 * once per app foreground (so "next occurrence" dates roll forward), and wiped
 * on sign-out or account deletion.
 */
export function useWidgetSync({
  authLoading,
  isSignedIn,
  people,
  peopleLoading,
  peopleError,
}: Input): void {
  const lastSignature = useRef<string | null>(null);
  const [foregrounds, setForegrounds] = useState(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setForegrounds((count) => count + 1);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!isSignedIn) {
      lastSignature.current = null;
      void clearWidgetSnapshot();
      return;
    }
    // Never publish a half-loaded Vault: an empty list would blank the widgets.
    if (peopleLoading || peopleError) {
      return;
    }

    const snapshot = buildWidgetSnapshot(people, new Date(), true);
    const signature = snapshotSignature(snapshot);
    if (signature === lastSignature.current) {
      return;
    }
    lastSignature.current = signature;
    void writeWidgetSnapshot(snapshot).then((ok) => {
      if (!ok) {
        lastSignature.current = null;
      }
    });
  }, [authLoading, isSignedIn, people, peopleLoading, peopleError, foregrounds]);
}
