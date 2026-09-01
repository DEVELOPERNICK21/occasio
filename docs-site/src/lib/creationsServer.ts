import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import type { RecipientCard } from '@/lib/recipientCard';
import { generateShareSlug } from '@/lib/shareSlug';

const GUEST_LINK_TTL_DAYS = 30;
const MAX_BASE64_DATA_URL_CHARS = 750_000;

export type CreateCreationInput = {
  templateType: string;
  recipientName: string;
  message: string;
  photoRefs: string[];
  mediaUrls?: string[];
};

export type CreateCreationResult = {
  creationId: string;
  shareSlug: string;
  shareUrl: string;
  expiresAt: string;
  watermarked: boolean;
};

export class ApiRouteError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRouteError';
  }
}

function randomSlug(): string {
  return generateShareSlug();
}

async function uniqueShareSlug(db: Firestore): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = randomSlug();
    const existing = await db
      .collection('creations')
      .where('shareSlug', '==', slug)
      .limit(1)
      .get();
    if (existing.empty) return slug;
  }
  throw new ApiRouteError(500, 'INTERNAL', 'Could not generate share link');
}

function computeExpiresAt(createdAt: Date): Date {
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + GUEST_LINK_TTL_DAYS);
  return expiresAt;
}

function isInlineBase64(photoRefs: string[]): boolean {
  return photoRefs.length >= 1 && /^inline:\d+$/.test(photoRefs[0] ?? '');
}

function validateMediaUrls(mediaUrls: string[], photoRefs: string[]): void {
  if (mediaUrls.length < 1 || mediaUrls.length > 3) {
    throw new ApiRouteError(
      400,
      'VALIDATION_ERROR',
      'mediaUrls must contain 1–3 items',
    );
  }

  if (isInlineBase64(photoRefs)) {
    if (mediaUrls.length !== 1) {
      throw new ApiRouteError(
        400,
        'VALIDATION_ERROR',
        'Only one inline photo is supported',
      );
    }
    const url = mediaUrls[0] ?? '';
    if (!url.startsWith('data:image/')) {
      throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Invalid image data URL');
    }
    if (url.length > MAX_BASE64_DATA_URL_CHARS) {
      throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Photo is too large');
    }
  }
}

export function validateCreateInput(body: unknown): CreateCreationInput {
  if (!body || typeof body !== 'object') {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const input = body as Partial<CreateCreationInput>;
  const templateType = input.templateType?.trim();
  const recipientName = input.recipientName?.trim() ?? '';
  const message = input.message?.trim() ?? '';
  const photoRefs = input.photoRefs;
  const mediaUrls = input.mediaUrls ?? [];

  if (!templateType) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Template is required');
  }
  if (recipientName.length < 1 || recipientName.length > 80) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Recipient name is required');
  }
  if (message.length > 500) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Message is too long');
  }
  if (!Array.isArray(photoRefs) || photoRefs.length < 1 || photoRefs.length > 3) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Add 1–3 photos');
  }
  if (!Array.isArray(mediaUrls)) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'mediaUrls must be an array');
  }

  validateMediaUrls(mediaUrls, photoRefs);

  return {
    templateType,
    recipientName,
    message,
    photoRefs,
    mediaUrls,
  };
}

export async function createCreation(
  input: CreateCreationInput,
): Promise<CreateCreationResult> {
  const db = getAdminFirestore();
  const createdAt = new Date();
  const expiresAt = computeExpiresAt(createdAt);
  const shareSlug = await uniqueShareSlug(db);
  const shareBase =
    process.env.OCCASIO_SHARE_BASE ?? 'https://occasio-greetings.vercel.app';

  const ref = db.collection('creations').doc();
  await ref.set({
    templateType: input.templateType,
    recipientName: input.recipientName,
    message: input.message,
    photoRefs: input.photoRefs,
    mediaUrls: input.mediaUrls ?? [],
    shareSlug,
    watermarked: true,
    viewCount: 0,
    createdAt: Timestamp.fromDate(createdAt),
    expiresAt: Timestamp.fromDate(expiresAt),
    userId: null,
  });

  return {
    creationId: ref.id,
    shareSlug,
    shareUrl: `${shareBase}/c/${shareSlug}`,
    expiresAt: expiresAt.toISOString(),
    watermarked: true,
  };
}

export type CardLookupResult =
  | { status: 'found'; card: RecipientCard }
  | { status: 'expired' }
  | { status: 'not_found' };

export async function lookupCardBySlug(slug: string): Promise<CardLookupResult> {
  if (!isFirebaseAdminConfigured()) {
    return { status: 'not_found' };
  }

  const db = getAdminFirestore();
  const snapshot = await db
    .collection('creations')
    .where('shareSlug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) return { status: 'not_found' };

  const doc = snapshot.docs[0]!.data();
  const expiresAt = doc.expiresAt as Timestamp | undefined;
  if (expiresAt && expiresAt.toDate() < new Date()) {
    return { status: 'expired' };
  }

  const recipientName = doc.recipientName as string | undefined;
  if (!recipientName) return { status: 'not_found' };

  return {
    status: 'found',
    card: {
      recipientName,
      message: (doc.message as string | null) ?? null,
      templateType: (doc.templateType as string) ?? 'birthday',
      fromName: (doc.fromName as string | null) ?? null,
      isDemo: false,
      mediaUrls: (doc.mediaUrls as string[] | undefined) ?? [],
    },
  };
}

export async function getCardBySlug(slug: string): Promise<RecipientCard | null> {
  const result = await lookupCardBySlug(slug);
  return result.status === 'found' ? result.card : null;
}

/** Increment view count (best-effort, server-only). */
export async function recordCardView(slug: string): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;

  const db = getAdminFirestore();
  const snapshot = await db
    .collection('creations')
    .where('shareSlug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) return;

  await snapshot.docs[0]!.ref.update({
    viewCount: FieldValue.increment(1),
  });
}
