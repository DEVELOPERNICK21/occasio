import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type CameraOptions,
  type ImageLibraryOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { env } from '../../../shared/config/env';

type PickSource = 'library' | 'camera';

function pickerOptions(): CameraOptions & ImageLibraryOptions {
  return {
    mediaType: 'photo',
    selectionLimit: 1,
    quality: env.useBase64Media ? 0.7 : 0.8,
    maxWidth: env.useBase64Media ? 960 : undefined,
    maxHeight: env.useBase64Media ? 960 : undefined,
    includeBase64: env.useBase64Media,
  };
}

function uriFromResult(result: ImagePickerResponse): string | null {
  if (result.didCancel || result.errorCode) {
    if (result.errorCode) {
      Alert.alert('Could not get photo', result.errorMessage ?? result.errorCode);
    }
    return null;
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) return null;

  if (env.useBase64Media && asset.base64) {
    return `data:image/jpeg;base64,${asset.base64}`;
  }
  return asset.uri;
}

async function pickFromSource(source: PickSource): Promise<string | null> {
  const options = pickerOptions();
  const result =
    source === 'camera'
      ? await launchCamera({ ...options, saveToPhotos: false })
      : await launchImageLibrary(options);
  return uriFromResult(result);
}

/** Gallery or camera — returns local URI or base64 data URL. */
export function usePhotoPicker() {
  const [picking, setPicking] = useState(false);

  const pickPhoto = useCallback((): Promise<string | null> => {
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
