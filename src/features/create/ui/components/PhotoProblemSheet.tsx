import { Settings } from 'lucide-react-native';
import { ActionSheet, type SheetAction } from '../../../../shared/ui/ActionSheet';
import type { PhotoProblemSheetState } from '../../application/usePhotoPicker';

/**
 * Says what went wrong with a photo in our own sheet, not the stock alert, and offers
 * the one fix there is: switching the permission back on in Settings.
 */
export function PhotoProblemSheet({
  visible,
  title,
  message,
  canOpenSettings,
  onOpenSettings,
  onClose,
}: PhotoProblemSheetState) {
  const actions: SheetAction[] = canOpenSettings
    ? [
        {
          id: 'settings',
          label: 'Open Settings',
          description: 'Switch it on, then come back',
          icon: Settings,
          onPress: onOpenSettings,
        },
      ]
    : [];

  return (
    <ActionSheet
      visible={visible}
      title={title}
      message={message}
      actions={actions}
      cancelLabel={canOpenSettings ? 'Not now' : 'OK'}
      onClose={onClose}
    />
  );
}
