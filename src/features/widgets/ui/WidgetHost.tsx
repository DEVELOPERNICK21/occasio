import { useAuth } from '../../auth/application/useAuth';
import { useVaultPeople } from '../../vault/application/useVaultPeople';
import { useWidgetLinks } from '../application/useWidgetLinks';
import { useWidgetSync } from '../application/useWidgetSync';

/**
 * Invisible. Feeds the native widgets and handles their taps. Mounted inside the
 * create-draft provider so a tap can start a card.
 */
export function WidgetHost() {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const { people, isLoading: peopleLoading, error } = useVaultPeople(isSignedIn);

  useWidgetSync({
    authLoading,
    isSignedIn,
    people,
    peopleLoading,
    peopleError: error !== null,
  });
  useWidgetLinks({ people, ready: !authLoading && !peopleLoading });

  return null;
}
