import { Camera, Images } from 'lucide-react-native';
import { ActionSheet, type SheetAction } from '../../../../shared/ui/ActionSheet';
import { PipFriend } from '../../../../shared/ui/PipFriend';
import type { PhotoSourceSheetState } from '../../application/usePhotoPicker';

/**
 * "Where is the photo?": our own sheet instead of the stock dialog, with Pip. It only
 * asks the question; the gallery and the crop that follow are the phone's own screens.
 */
export function PhotoSourceSheet({ visible, mode, remaining, onLibrary, onCamera, onClose }: PhotoSourceSheetState) {
  const many = mode === 'many';
  const actions: SheetAction[] = [
    {
      id: 'library',
      label: 'Photo library',
      description: many ? `Pick up to ${remaining} at once` : 'Choose one and crop it to fit',
      icon: Images,
      onPress: onLibrary,
    },
    {
      id: 'camera',
      label: 'Take a photo',
      description: many ? 'One at a time, cropped to fit' : 'Take a new one and crop it',
      icon: Camera,
      onPress: onCamera,
    },
  ];

  return (
    <ActionSheet
      visible={visible}
      title={many ? 'Add photos' : 'Replace photo'}
      message={many ? `You can add up to ${remaining} more.` : 'Pick a new one for this spot.'}
      header={<PipFriend spot={many ? 'photosPick' : 'photosReplace'} variant="inline" size={72} />}
      actions={actions}
      onClose={onClose}
    />
  );
}
