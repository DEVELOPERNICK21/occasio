import {
  MAX_BASE64_DATA_URL_CHARS,
  MAX_PHOTOS_BASE64,
  MAX_PHOTOS_STORAGE,
  MAX_STORAGE_PHOTO_BYTES,
} from '../../../shared/config/media';
import { isDataUrl, isDataUrlWithinLimit } from './base64Media';

export type PhotoValidationMode = 'base64' | 'storage';

export type PhotoPickValidationInput = {
  uri: string;
  currentCount: number;
  mode: PhotoValidationMode;
  fileSizeBytes?: number | null;
  isReplacing?: boolean;
};

export type PhotoValidationResult =
  | { valid: true }
  | { valid: false; message: string };

export function maxPhotosForMode(mode: PhotoValidationMode): number {
  return mode === 'base64' ? MAX_PHOTOS_BASE64 : MAX_PHOTOS_STORAGE;
}

export function validatePickedPhoto(
  input: PhotoPickValidationInput,
): PhotoValidationResult {
  const maxPhotos = maxPhotosForMode(input.mode);

  if (!input.isReplacing && input.currentCount >= maxPhotos) {
    return {
      valid: false,
      message:
        input.mode === 'base64'
          ? 'Only one photo is allowed for your card.'
          : `You can add up to ${maxPhotos} photos.`,
    };
  }

  if (input.mode === 'base64') {
    if (isDataUrl(input.uri) && !isDataUrlWithinLimit(input.uri)) {
      return {
        valid: false,
        message: 'Photo is too large. Try a smaller image or take a new photo.',
      };
    }

    if (
      input.fileSizeBytes != null &&
      input.fileSizeBytes > MAX_BASE64_DATA_URL_CHARS
    ) {
      return {
        valid: false,
        message: 'Photo is too large. Try a smaller image or take a new photo.',
      };
    }
  }

  if (
    input.mode === 'storage' &&
    input.fileSizeBytes != null &&
    input.fileSizeBytes > MAX_STORAGE_PHOTO_BYTES
  ) {
    return {
      valid: false,
      message: 'Photo must be under 5 MB. Try a smaller image.',
    };
  }

  return { valid: true };
}
