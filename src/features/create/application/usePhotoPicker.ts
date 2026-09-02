import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import ImageCropPicker, { type Image } from 'react-native-image-crop-picker';
import { env } from '../../../shared/config/env';
import {
  CARD_PHOTO_CROP_HEIGHT,
  CARD_PHOTO_CROP_WIDTH,
} from '../../../shared/config/media';
import { colors } from '../../../shared/theme/tokens';

type PickSource = 'library' | 'camera';

export type PickedPhoto = {
  uri: string;
  fileSizeBytes?: number | null;
};

function isPickerCancelled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    String((error as { code: unknown }).code) === 'E_PICKER_CANCELLED'
  );
}

function cropOptions() {
  return {
    width: CARD_PHOTO_CROP_WIDTH,
    height: CARD_PHOTO_CROP_HEIGHT,
    cropping: true,
    mediaType: 'photo' as const,
    compressImageQuality: env.useBase64Media ? 0.7 : 0.8,
    includeBase64: env.useBase64Media,
    forceJpg: true,
    cropperToolbarTitle: 'Crop photo',
    cropperChooseText: 'Use photo',
    cropperCancelText: 'Cancel',
    cropperActiveWidgetColor: colors.accent,
    cropperToolbarColor: colors.ink,
    cropperToolbarWidgetColor: colors.surface,
  };
}

function photoFromCropResult(image: Image): PickedPhoto {
  if (env.useBase64Media && image.data) {
    return {
      uri: `data:image/jpeg;base64,${image.data}`,
      fileSizeBytes: image.size,
    };
  }

  return {
    uri: image.path,
    fileSizeBytes: image.size,
  };
}

async function pickFromSource(source: PickSource): Promise<PickedPhoto | null> {
  const options = cropOptions();

  try {
    const image =
      source === 'camera'
        ? await ImageCropPicker.openCamera(options)
        : await ImageCropPicker.openPicker(options);
    return photoFromCropResult(image);
  } catch (error) {
    if (isPickerCancelled(error)) return null;

    const message = error instanceof Error ? error.message : 'Something went wrong.';
    Alert.alert('Could not get photo', message);
    return null;
  }
}

/** Gallery or camera with fixed 5:4 crop for the card hero. */
export function usePhotoPicker() {
  const [picking, setPicking] = useState(false);

  const pickPhoto = useCallback((): Promise<PickedPhoto | null> => {
    if (picking) return Promise.resolve(null);

    return new Promise((resolve) => {
      Alert.alert('Add photo', 'Choose a source', [
        {
          text: 'Photo library',
          onPress: () => {
            setPicking(true);
            pickFromSource('library')
              .then(resolve)
              .finally(() => setPicking(false));
          },
        },
        {
          text: 'Camera',
          onPress: () => {
            setPicking(true);
            pickFromSource('camera')
              .then(resolve)
              .finally(() => setPicking(false));
          },
        },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });
  }, [picking]);

  return { pickPhoto, picking };
}
