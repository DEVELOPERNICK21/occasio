import { useEffect } from 'react';
import { ensureAccountStamped } from '../features/age/application/accountAge';
import { useAuth } from '../features/auth/application/useAuth';
import { syncPendingHistoryEntries } from '../features/history/application/useHistory';

/**
 * What should happen each time someone signs in, wired here so auth knows nothing about the
 * features that react to it: cards made as a guest are saved to the account, and an account that
 * predates the age check gets it recorded once, quietly.
 */
export function SessionEffects(): null {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    void syncPendingHistoryEntries();
    void ensureAccountStamped(user.uid);
  }, [user]);

  return null;
}
