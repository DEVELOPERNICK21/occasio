import { useRef } from 'react';
import { RotateCcw } from 'lucide-react-native';
import { ActionSheet } from '../../../../shared/ui/ActionSheet';
import { PipFriend } from '../../../../shared/ui/PipFriend';

type Props = {
  /** What went wrong, in words. Null while nothing has. */
  message: string | null;
  /** Make the link again. */
  onRetry: () => void;
  onClose: () => void;
};

/**
 * A link that could not be made, said in our own sheet with Pip, like the rest of the
 * create flow, instead of a red line under the button.
 */
export function CreateProblemSheet({ message, onRetry, onClose }: Props) {
  // The words stay while the sheet slides away, instead of the sheet emptying first.
  const last = useRef(message);
  if (message) last.current = message;
  return (
    <ActionSheet
      visible={message !== null}
      title="That did not go through"
      message={message ?? last.current ?? undefined}
      header={<PipFriend spot="createFailed" variant="inline" size={72} />}
      actions={[
        {
          id: 'retry',
          label: 'Try again',
          description: 'Your card is still here',
          icon: RotateCcw,
          onPress: onRetry,
        },
      ]}
      cancelLabel="Close"
      onClose={onClose}
    />
  );
}
