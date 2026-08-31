import { MAX_PHOTOS_BASE64 } from '../../../shared/config/media';
import { env } from '../../../shared/config/env';
import { useSparkBackend } from './backendMode';
import { assertDataUrlFits, toDataUrl } from './base64MediaService';
import { uploadPhotoToStorage } from './storageService';
import { CreationApiError } from './types';

export type ResolvedCreationMedia = {
  photoRefs: string[];
  mediaUrls: string[];
};

/**
 * Prepare photo refs + display URLs for create.
 * Spark pre-Blaze: inline base64 in Firestore. Blaze: Firebase Storage paths.
 */
export async function resolveCreationMedia(
  photoUris: string[],
): Promise<ResolvedCreationMedia> {
  if (photoUris.length < 1) {
    throw new CreationApiError('VALIDATION_ERROR', 'Add at least one photo');
  }

  if (env.useMockApi) {
    return {
      photoRefs: photoUris.map((uri, i) =>
        uri.startsWith('placeholder://')
          ? `uploads/tmp/placeholder-${i}.jpg`
          : uri,
      ),
      mediaUrls: [],
    };
  }

  if (env.useBase64Media) {
    if (photoUris.length > MAX_PHOTOS_BASE64) {
      throw new CreationApiError(
        'VALIDATION_ERROR',
        `Only ${MAX_PHOTOS_BASE64} photo is supported until Storage is enabled.`,
      );
    }

    const mediaUrls: string[] = [];
    for (const uri of photoUris) {
      if (uri.startsWith('placeholder://')) {
        throw new CreationApiError(
          'VALIDATION_ERROR',
          'Pick a real photo before sharing.',
        );
      }
      const dataUrl = await toDataUrl(uri);
      assertDataUrlFits(dataUrl);
      mediaUrls.push(dataUrl);
    }

    return {
      photoRefs: mediaUrls.map((_, i) => `inline:${i}`),
      mediaUrls,
    };
  }

  const photoRefs: string[] = [];
  for (const uri of photoUris) {
    if (uri.startsWith('placeholder://')) {
      throw new CreationApiError(
        'VALIDATION_ERROR',
        'Pick real photos before sharing (placeholders are dev-only).',
      );
    }
    photoRefs.push(await uploadPhotoToStorage(uri));
  }

  return { photoRefs, mediaUrls: [] };
}

export { useSparkBackend };
