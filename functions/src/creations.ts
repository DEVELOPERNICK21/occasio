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
    slug += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return slug;
}

export async function writeCreation(
  db: FirebaseFirestore.Firestore,
  input: WriteCreationInput,
): Promise<WriteCreationResult> {
  const createdAt = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + input.ttlDays * 24 * 60 * 60 * 1000),
  );
  const shareSlug = randomSlug();
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
