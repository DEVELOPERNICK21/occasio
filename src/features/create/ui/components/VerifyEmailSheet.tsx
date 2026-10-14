import { useEffect, useRef, useState } from 'react';
import { CircleCheck, Mail } from 'lucide-react-native';
import { ActionSheet, type SheetAction } from '../../../../shared/ui/ActionSheet';
import { PipFriend } from '../../../../shared/ui/PipFriend';
import {
  STILL_UNCONFIRMED_NOTICE,
  VERIFY_RESEND_SECONDS,
  verifyResendLabel,
} from '../../../auth/domain/emailVerification';
import type { VerifyReason } from '../../application/useCreateShareLink';

type Props = {
  /** Why the free card is waiting. Null while nothing is being asked. */
  reason: VerifyReason | null;
  email: string | null;
  /** Sends the confirmation link again. */
  sendVerification: () => Promise<void>;
  /** Looks again; true once the inbox is confirmed. */
  checkVerified: () => Promise<boolean>;
  /** The inbox is confirmed: carry on and create the link. */
  onVerified: () => void;
  onClose: () => void;
};

const NOT_ALLOWED_MESSAGE =
  'That email address cannot be used for the free card. Sign in with Google or Apple, or use a regular email address.';

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}

/**
 * The free card is waiting for a confirmed email. This is not a payment screen: it says what
 * to do (open the link we sent), lets them check again or send it again, and carries on to
 * create the link the moment the email is confirmed.
 */
export function VerifyEmailSheet({
  reason,
  email,
  sendVerification,
  checkVerified,
  onVerified,
  onClose,
}: Props) {
  // The sheet closes while an action runs, then comes back if the answer was "not yet".
  const [away, setAway] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (reason === null) {
      setAway(false);
      setNotice(null);
    }
  }, [reason]);

  const comeBack = (message: string | null) => {
    if (!mounted.current) return;
    setNotice(message);
    setAway(false);
  };

  const check = async () => {
    try {
      if (await checkVerified()) {
        if (mounted.current) setNotice(null);
        onVerified();
        return;
      }
      comeBack(STILL_UNCONFIRMED_NOTICE);
    } catch (error) {
      comeBack(messageOf(error));
    }
  };

  const resend = async () => {
    if (cooldown > 0) {
      comeBack(`Please wait ${cooldown} seconds before sending it again.`);
      return;
    }
    try {
      await sendVerification();
      if (mounted.current) setCooldown(VERIFY_RESEND_SECONDS);
      comeBack('Sent. Open the link in your email, then check again.');
    } catch (error) {
      comeBack(messageOf(error));
    }
  };

  if (reason === 'not_allowed') {
    return (
      <ActionSheet
        visible
        title="Use a different email"
        message={NOT_ALLOWED_MESSAGE}
        actions={[]}
        cancelLabel="OK"
        onClose={onClose}
      />
    );
  }

  const actions: SheetAction[] = [
    {
      id: 'check',
      label: 'I confirmed it',
      description: 'Check again, then create the link',
      icon: CircleCheck,
      onPress: () => void check(),
    },
    {
      id: 'resend',
      label: verifyResendLabel(cooldown),
      description: 'Look in spam if it has not arrived',
      icon: Mail,
      onPress: () => void resend(),
    },
  ];

  return (
    <ActionSheet
      visible={reason === 'unverified' && !away}
      title="Confirm your email"
      message={
        notice ??
        (email
          ? `We sent a link to ${email}. Open it, then come back and tap “I confirmed it”.`
          : 'We sent you a link. Open it, then come back and tap “I confirmed it”.')
      }
      header={<PipFriend spot="verifyEmail" variant="inline" size={72} />}
      actions={actions}
      cancelLabel="Not now"
      onClose={(why) => {
        if (why === 'action') setAway(true);
        else onClose();
      }}
    />
  );
}
