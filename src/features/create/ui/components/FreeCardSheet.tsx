import { useEffect, useRef, useState } from 'react';
import { CreditCard, LogIn } from 'lucide-react-native';
import { ActionSheet, type SheetAction } from '../../../../shared/ui/ActionSheet';
import { PipFriend } from '../../../../shared/ui/PipFriend';
import { isAuthError } from '../../../auth/application/AuthProvider';
import type { FreeCardBlock } from '../../application/useCreateShareLink';

type Props = {
  /** Why the free card is not available to this account. Null while nothing is being asked. */
  reason: FreeCardBlock | null;
  canSignInWithApple: boolean;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  onSeePlans: () => void;
  /** Signed in with Google or Apple: carry on and create the link. */
  onSignedIn: () => void;
  onClose: () => void;
};

const NEEDS_PROVIDER_MESSAGE =
  'The free card is for Google or Apple accounts. Pick one and your link is made right after.';
const NOT_ALLOWED_MESSAGE =
  'That email address cannot be used for the free card. Use a Google or Apple account with a regular address, or choose a plan.';

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}

/**
 * The free card is for Google and Apple accounts, because anyone can make an email account
 * (and a "confirmed" throwaway inbox) by the hundred. This says so plainly, offers the sign-in
 * that unlocks it, or the plans, and creates the link the moment the sign-in succeeds. It is
 * not a paywall: nothing here asks for money unless they choose to look at the plans.
 */
export function FreeCardSheet({
  reason,
  canSignInWithApple,
  signInGoogle,
  signInApple,
  onSeePlans,
  onSignedIn,
  onClose,
}: Props) {
  // The sheet closes while a sign-in runs, then comes back if it did not finish.
  const [away, setAway] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (reason === null) {
      setAway(false);
      setNotice(null);
    }
  }, [reason]);

  const signIn = async (run: () => Promise<void>) => {
    try {
      await run();
      if (mounted.current) setNotice(null);
      onSignedIn();
    } catch (error) {
      if (!mounted.current) return;
      // Backing out of the Google or Apple screen is not an error worth a message.
      setNotice(isAuthError(error) && error.code === 'CANCELLED' ? null : messageOf(error));
      setAway(false);
    }
  };

  const plans: SheetAction = {
    id: 'plans',
    label: 'See plans',
    description: 'Pay for a card instead',
    icon: CreditCard,
    onPress: onSeePlans,
  };

  const actions: SheetAction[] =
    reason === 'not_allowed'
      ? [plans]
      : [
          {
            id: 'google',
            label: 'Continue with Google',
            description: 'Signs this phone in to that account',
            icon: LogIn,
            onPress: () => void signIn(signInGoogle),
          },
          ...(canSignInWithApple
            ? [
                {
                  id: 'apple',
                  label: 'Continue with Apple',
                  description: 'Signs this phone in to that account',
                  icon: LogIn,
                  onPress: () => void signIn(signInApple),
                },
              ]
            : []),
          plans,
        ];

  return (
    <ActionSheet
      visible={reason !== null && !away}
      title={reason === 'not_allowed' ? 'Use a different email' : 'Your free card is waiting'}
      message={notice ?? (reason === 'not_allowed' ? NOT_ALLOWED_MESSAGE : NEEDS_PROVIDER_MESSAGE)}
      header={<PipFriend spot="freeCardSignIn" variant="inline" size={72} />}
      actions={actions}
      cancelLabel="Not now"
      onClose={(why) => {
        if (why === 'action') setAway(true);
        else onClose();
      }}
    />
  );
}
