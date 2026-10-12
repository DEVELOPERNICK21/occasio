import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { MAX_STORAGE_PHOTO_BYTES } from '../../../shared/config/media';
import { CreationApiError } from './types';

/** Each user uploads into their own folder; storage.rules only lets them write there. */
function newStoragePath(): string {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    throw new CreationApiError('VALIDATION_ERROR', 'Sign in to share your card.');
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `uploads/${uid}/${id}.jpg`;
}

/** Best effort: remove photos uploaded for a share that did not go through. */
export async function deleteUploadedPhotos(paths: string[]): Promise<void> {
  await Promise.allSettled(
    paths
      .filter((path) => path.startsWith('uploads/'))
      .map(async (path) => storage().ref(path).delete()),
  );
}

/**
 * Upload a local file URI to Firebase Storage.
 * Returns the storage path (stored in Firestore — not base64).
 */
export async function uploadPhotoToStorage(localUri: string): Promise<string> {
  if (localUri.startsWith('placeholder://')) {
    throw new CreationApiError('VALIDATION_ERROR', 'Pick a real photo before sharing.');
  }

  const path = newStoragePath();
  const ref = storage().ref(path);

  try {
    const task = ref.putFile(localUri);
    await task;
    const meta = await ref.getMetadata();
    if (meta.size != null && meta.size > MAX_STORAGE_PHOTO_BYTES) {
      await ref.delete().catch(() => undefined);
      throw new CreationApiError('VALIDATION_ERROR', 'Photo must be under 5 MB.');
    }
    return path;
  } catch (e) {
    if (e instanceof CreationApiError) {
      throw e;
    }
    throw new CreationApiError('INTERNAL', 'Photo upload failed');
  }
}

/** Public download URL for recipient web (token URL from Storage). */
export async function getPhotoDownloadUrl(storagePath: string): Promise<string> {
  return storage().ref(storagePath).getDownloadURL();
}
