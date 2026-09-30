import { randomInt } from 'crypto';
import * as admin from 'firebase-admin';

const SHARE_BASE_DEFAULT = 'https://occasio-greetings.vercel.app';

export type WriteCreationInput = {
  templateType: string;
  templateId?: string | null;
  recipientName: string;
  fromName?: string | null;
  message?: string;
  photoRefs: string[];
  mediaUrls?: string[];
  userId?: string | null;
  ttlDays: number;
};

export type WriteCreationResult = {
  creationId: string;
  shareSlug: string;
  shareUrl: string;
  expiresAt: admin.firestore.Timestamp;
};

export function randomSlug(length = 8): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < length; i += 1) {
    slug += alphabet[randomInt(alphabet.length)];
  }
  return slug;
}

function storageBucketName(): string | null {
  try {
    const config = JSON.parse(process.env.FIREBASE_CONFIG ?? '{}') as {
      storageBucket?: string;
    };
    if (config.storageBucket) {
      return config.storageBucket;
    }
  } catch {
    // fall through
  }
  const project = process.env.GCLOUD_PROJECT;
  return project ? `${project}.firebasestorage.app` : null;
}

/** Storage paths written by the app (`uploads/guest/...`) are publicly readable. */
export function isStoragePath(ref: string): boolean {
  return ref.startsWith('uploads/');
}

export function storagePathToUrl(path: string): string | null {
  const bucket = storageBucketName();
  if (!bucket || !isStoragePath(path)) {
    return null;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}

/** Display URLs for a creation: known URLs first, else resolve storage paths. */
export function resolveMediaUrls(
  mediaUrls: string[],
  photoRefs: string[],
): string[] {
  if (mediaUrls.length > 0) {
    return mediaUrls;
  }
  return photoRefs
    .map(storagePathToUrl)
    .filter((url): url is string => url !== null);
}

async function uniqueSlug(db: FirebaseFirestore.Firestore): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = randomSlug();
    const existing = await db
      .collection('creations')
      .where('shareSlug', '==', slug)
      .limit(1)
      .get();
    if (existing.empty) {
      return slug;
    }
  }
  throw new Error('slug_generation_failed');
}

export async function writeCreation(
  db: FirebaseFirestore.Firestore,
  input: WriteCreationInput,
): Promise<WriteCreationResult> {
  const createdAt = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + input.ttlDays * 24 * 60 * 60 * 1000),
  );
  const shareSlug = await uniqueSlug(db);
  const shareBase = process.env.OCCASIO_SHARE_BASE ?? SHARE_BASE_DEFAULT;
  const docRef = db.collection('creations').doc();

  await docRef.set({
    templateType: input.templateType,
    templateId: input.templateId ?? null,
    recipientName: input.recipientName.trim(),
    fromName: input.fromName?.trim() || null,
    message: input.message?.trim() ?? '',
    photoRefs: input.photoRefs,
    mediaUrls: input.mediaUrls ?? [],
    shareSlug,
    watermarked: true,
    viewCount: 0,
    reactionCount: 0,
    createdAt,
    expiresAt,
    userId: input.userId ?? null,
  });

  return {
    creationId: docRef.id,
    shareSlug,
    shareUrl: `${shareBase}/c/${shareSlug}`,
    expiresAt,
  };
}
