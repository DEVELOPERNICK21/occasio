import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { defaultExperienceMode } from '@/lib/experience/resolveExperience';
import { normalizeBalloonLine } from '@/lib/experience/splitRevealLine';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import type { RecipientCard } from '@/lib/recipientCard';
import { generateShareSlug } from '@/lib/shareSlug';

const GUEST_LINK_TTL_DAYS_PROD = 30;
const GUEST_LINK_TTL_DAYS_DEV = 3;

export type CreateCreationInput = {
  templateType: string;
  /** Frame the sender picked — the recipient page renders the same one. */
  templateId: string | null;
  recipientName: string;
  fromName: string;
  message: string;
  photoRefs: string[];
  mediaUrls?: string[];
  /** Optional client override; otherwise derived from templateType. */
  experienceMode?: 'story' | 'classic';
  /** Optional ≤8-word line for balloon pops. */
  balloonLine?: string;
  /** Ignored unless server is in dev-relaxed mode. */
  devMode?: boolean;
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

const MAX_PHOTOS = 5;
/** Per inline photo — keep total under Firestore ~1 MB with message + metadata. */
const MAX_BASE64_DATA_URL_CHARS = 160_000;

/** Local docs-site dev or explicit env — never enable on production Vercel. */
export function isDevRelaxedQuota(devModeRequested = false): boolean {
  if (process.env.OCCASIO_DEV_RELAXED_QUOTA === 'true') {
    return true;
  }
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  return devModeRequested && process.env.OCCASIO_ALLOW_DEV_CREATE === 'true';
}

function guestLinkTtlDays(devModeRequested = false): number {
  return isDevRelaxedQuota(devModeRequested)
    ? GUEST_LINK_TTL_DAYS_DEV
    : GUEST_LINK_TTL_DAYS_PROD;
}

function computeExpiresAt(createdAt: Date, devModeRequested = false): Date {
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + guestLinkTtlDays(devModeRequested));
  return expiresAt;
}

function isInlineBase64(photoRefs: string[]): boolean {
  return photoRefs.length >= 1 && /^inline:\d+$/.test(photoRefs[0] ?? '');
}

function validateMediaUrls(mediaUrls: string[], photoRefs: string[]): void {
  // Storage-only creates send photoRefs without embedded mediaUrls.
  if (mediaUrls.length === 0) {
    return;
  }

  if (mediaUrls.length < 1 || mediaUrls.length > MAX_PHOTOS) {
    throw new ApiRouteError(
      400,
      'VALIDATION_ERROR',
      `mediaUrls must contain 1–${MAX_PHOTOS} items`,
    );
  }

  if (isInlineBase64(photoRefs)) {
    if (mediaUrls.length !== photoRefs.length) {
      throw new ApiRouteError(
        400,
        'VALIDATION_ERROR',
        'Inline photos must match photoRefs',
      );
    }
    for (const url of mediaUrls) {
      if (!url.startsWith('data:image/')) {
        throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Invalid image data URL');
      }
      if (url.length > MAX_BASE64_DATA_URL_CHARS) {
        throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Photo is too large');
      }
    }
  }
}

export function validateCreateInput(body: unknown): CreateCreationInput {
  if (!body || typeof body !== 'object') {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const input = body as Partial<CreateCreationInput>;
  const templateType = input.templateType?.trim();
  const templateId = input.templateId?.trim() || null;
  const recipientName = input.recipientName?.trim() ?? '';
  const fromName = input.fromName?.trim() ?? '';
  const message = input.message?.trim() ?? '';
  const photoRefs = input.photoRefs;
  const mediaUrls = input.mediaUrls ?? [];

  if (!templateType) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Template is required');
  }
  if (recipientName.length < 1 || recipientName.length > 80) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Recipient name is required');
  }
  if (fromName.length > 80) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Sender name is too long');
  }
  if (templateId && !/^[A-Za-z0-9_-]{1,16}$/.test(templateId)) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Invalid template id');
  }
  if (message.length > 500) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Message is too long');
  }
  if (
    !Array.isArray(photoRefs) ||
    photoRefs.length < 1 ||
    photoRefs.length > MAX_PHOTOS
  ) {
    throw new ApiRouteError(
      400,
      'VALIDATION_ERROR',
      `Add 1–${MAX_PHOTOS} photos`,
    );
  }
  if (!Array.isArray(mediaUrls)) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'mediaUrls must be an array');
  }

  validateMediaUrls(mediaUrls, photoRefs);

  const rawBalloon =
    typeof input.balloonLine === 'string' ? input.balloonLine.trim() : '';
  const balloonLine = rawBalloon
    ? normalizeBalloonLine(rawBalloon)
    : undefined;

  const devMode = input.devMode === true;
  const experienceMode =
    input.experienceMode === 'story' || input.experienceMode === 'classic'
      ? input.experienceMode
      : undefined;

  return {
    templateType,
    templateId,
    recipientName,
    fromName,
    message,
    photoRefs,
    mediaUrls,
    ...(balloonLine ? { balloonLine } : {}),
    ...(experienceMode ? { experienceMode } : {}),
    devMode,
  };
}

export async function createCreation(
  input: CreateCreationInput,
): Promise<CreateCreationResult> {
  const db = getAdminFirestore();
  const createdAt = new Date();
  const expiresAt = computeExpiresAt(createdAt, input.devMode === true);
  const shareSlug = await uniqueShareSlug(db);
  const shareBase =
    process.env.OCCASIO_SHARE_BASE ?? 'https://occasio-greetings.vercel.app';

  const ref = db.collection('creations').doc();
  await ref.set({
    templateType: input.templateType,
    templateId: input.templateId ?? null,
    recipientName: input.recipientName,
    fromName: input.fromName || null,
    message: input.message,
    photoRefs: input.photoRefs,
    mediaUrls: input.mediaUrls ?? [],
    experienceMode:
      input.experienceMode === 'story' || input.experienceMode === 'classic'
        ? input.experienceMode
        : defaultExperienceMode(input.templateType),
    experienceVersion: 1,
    balloonLine: input.balloonLine
      ? normalizeBalloonLine(input.balloonLine)
      : null,
    shareSlug,
    watermarked: true,
    viewCount: 0,
    reactionCount: 0,
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
      templateId: (doc.templateId as string | null) ?? null,
      fromName: (doc.fromName as string | null) ?? null,
      isDemo: false,
      mediaUrls: (doc.mediaUrls as string[] | undefined) ?? [],
      reactionCount: (doc.reactionCount as number | undefined) ?? 0,
      experienceMode:
        doc.experienceMode === 'story' || doc.experienceMode === 'classic'
          ? doc.experienceMode
          : null,
      experienceVersion: (doc.experienceVersion as number | undefined) ?? null,
      balloonLine:
        typeof doc.balloonLine === 'string' && doc.balloonLine.trim()
          ? normalizeBalloonLine(doc.balloonLine)
          : null,
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

/** Recipient tapped the heart. Returns the new count, or null when unavailable. */
export async function recordCardReaction(slug: string): Promise<number | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const db = getAdminFirestore();
  const snapshot = await db
    .collection('creations')
    .where('shareSlug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0]!;
  const expiresAt = doc.data().expiresAt as Timestamp | undefined;
  if (expiresAt && expiresAt.toDate() < new Date()) {
    return null;
  }

  await doc.ref.update({ reactionCount: FieldValue.increment(1) });
  return ((doc.data().reactionCount as number | undefined) ?? 0) + 1;
}
