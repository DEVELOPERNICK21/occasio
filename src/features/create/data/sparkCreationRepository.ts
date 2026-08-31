import firestore from '@react-native-firebase/firestore';
import { env } from '../../../shared/config/env';
import { computeShareLinkExpiresAt } from '../domain/shareLink';
import type { CreationDraft } from '../domain/types';
import type { CreateCreationResponse } from './types';
import { CreationApiError } from './types';
import { getPhotoDownloadUrl } from './storageService';

function randomSlug(length = 8): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < length; i += 1) {
    slug += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return slug;
}

async function resolveStorageMediaUrls(photoRefs: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const path of photoRefs) {
    if (path.startsWith('uploads/tmp/placeholder') || path.startsWith('inline:')) {
      continue;
    }
    urls.push(await getPhotoDownloadUrl(path));
  }
  return urls;
}

/** Spark plan: write creation to Firestore (no Cloud Functions). */
export async function createShareLinkSpark(
  draft: CreationDraft,
  photoRefs: string[],
  mediaUrls: string[] = [],
): Promise<CreateCreationResponse> {
  if (!draft.templateType) {
    throw new CreationApiError('VALIDATION_ERROR', 'Template is required');
  }

  const createdAt = new Date();
  const expiresAt = computeShareLinkExpiresAt(createdAt, 'free', true);
  const shareSlug = randomSlug();
  const resolvedMediaUrls =
    mediaUrls.length > 0 ? mediaUrls : await resolveStorageMediaUrls(photoRefs);

  const doc = {
    templateType: draft.templateType,
    recipientName: draft.recipientName.trim(),
    message: draft.message.trim(),
    photoRefs,
    mediaUrls: resolvedMediaUrls,
    shareSlug,
    watermarked: true,
    viewCount: 0,
    createdAt: firestore.Timestamp.fromDate(createdAt),
    expiresAt: firestore.Timestamp.fromDate(expiresAt),
    userId: null,
  };

  try {
    const ref = await firestore().collection('creations').add(doc);
    return {
      creationId: ref.id,
      shareSlug,
      shareUrl: `${env.shareBaseUrl}/c/${shareSlug}`,
      expiresAt: expiresAt.toISOString(),
      watermarked: true,
    };
  } catch {
    throw new CreationApiError('INTERNAL', 'Could not save your card');
  }
}
