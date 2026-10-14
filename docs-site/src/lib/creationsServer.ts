import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { defaultExperienceMode } from '@/lib/experience/resolveExperience';
import { normalizeBalloonLine } from '@/lib/experience/splitRevealLine';
import {
  type AllowanceUserDoc,
  type BillingState,
  decideCreateAllowance,
  fetchBillingState,
  freeCardsUsed,
  linkTtlDaysFor,
  proCardTimesInWindow,
  recipientEditAllowed,
  wishCreditsUsed,
} from '@/lib/cardAllowance';
import {
  applyFreeRules,
  eligibilityRefusal,
  freeClaimIds,
  freeEligibility,
} from '@/lib/freeClaims';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import type { RecipientCard } from '@/lib/recipientCard';
import {
  PASSCODE_PATTERN,
  hashPasscode,
  newPasscodeSalt,
  verifyPasscode,
} from '@/lib/passcode';
import { generateShareSlug } from '@/lib/shareSlug';
import { MAX_MESSAGE_CHARS, MAX_PHOTOS, mediaViolation } from '@/lib/creationMedia';
import { isDevRelaxedQuota } from '@/lib/devQuota';
import { storageBucketName } from '@/lib/storagePaths';

/** Dev-relaxed mode only — short links make expiry easy to test. */
const LINK_TTL_DAYS_DEV = 3;

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
  /** Up to 5 short "reasons I love you" lines revealed one tap at a time. */
  reasons?: string[];
  /** 4-digit code the recipient must enter. `null` clears it on update; omitted keeps it. */
  passcode?: string | null;
  passcodeHint?: string;
};

const MAX_REASONS = 5;
const MAX_REASON_CHARS = 90;
const MAX_HINT_CHARS = 60;
const UNLOCK_MAX_FAILS = 5;
const UNLOCK_LOCK_MS = 15 * 60 * 1000;

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

function computeExpiresAt(
  createdAt: Date,
  allowance: 'free' | 'pro' | 'credit',
  relaxed: boolean,
): Date {
  const days = relaxed ? LINK_TTL_DAYS_DEV : linkTtlDaysFor(allowance);
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

/** Photos and image URLs must be ones this card is allowed to hold (see creationMedia.ts). */
function assertAllowedMedia(
  input: CreateCreationInput,
  uid: string,
  existingRefs: string[] = [],
): void {
  const problem = mediaViolation({
    photoRefs: input.photoRefs,
    mediaUrls: input.mediaUrls ?? [],
    uid,
    bucket: storageBucketName(),
    existingRefs,
  });
  if (problem) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', problem);
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
  if (message.length > MAX_MESSAGE_CHARS) {
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

  const rawBalloon =
    typeof input.balloonLine === 'string' ? input.balloonLine.trim() : '';
  const balloonLine = rawBalloon
    ? normalizeBalloonLine(rawBalloon)
    : undefined;

  const rawReasons = Array.isArray(input.reasons) ? input.reasons : [];
  const reasons = rawReasons
    .filter((r): r is string => typeof r === 'string')
    .map((r) => r.trim())
    .filter(Boolean);
  if (reasons.length > MAX_REASONS) {
    throw new ApiRouteError(
      400,
      'VALIDATION_ERROR',
      `Add up to ${MAX_REASONS} reasons`,
    );
  }
  if (reasons.some((r) => r.length > MAX_REASON_CHARS)) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'A reason is too long');
  }

  let passcode: string | null | undefined;
  if (input.passcode === null) {
    passcode = null;
  } else if (typeof input.passcode === 'string' && input.passcode !== '') {
    if (!PASSCODE_PATTERN.test(input.passcode)) {
      throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Passcode must be 4 digits');
    }
    passcode = input.passcode;
  }
  const passcodeHint =
    typeof input.passcodeHint === 'string' ? input.passcodeHint.trim() : '';
  if (passcodeHint.length > MAX_HINT_CHARS) {
    throw new ApiRouteError(400, 'VALIDATION_ERROR', 'Passcode hint is too long');
  }

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
    reasons,
    ...(passcode !== undefined ? { passcode } : {}),
    ...(passcodeHint ? { passcodeHint } : {}),
    devMode,
  };
}

/** Firestore fields for the optional passcode gate. Only a salted hash is stored. */
function passcodeFields(
  input: CreateCreationInput,
): Record<string, unknown> {
  if (input.passcode === null) {
    return {
      passcodeHash: FieldValue.delete(),
      passcodeSalt: FieldValue.delete(),
      passcodeHint: FieldValue.delete(),
    };
  }
  if (typeof input.passcode === 'string') {
    const salt = newPasscodeSalt();
    return {
      passcodeHash: hashPasscode(input.passcode, salt),
      passcodeSalt: salt,
      passcodeHint: input.passcodeHint ?? null,
      unlockFails: 0,
      unlockLockedUntil: null,
    };
  }
  return {};
}

/**
 * The allowance check and the card write share one transaction, so a double tap
 * or two devices cannot both spend the same free card or credit.
 */
export async function createCreation(
  input: CreateCreationInput,
  user: {
    uid: string;
    /** Only ever a verified address. */
    email?: string | null;
    verified?: boolean;
    subjects?: readonly string[];
  },
): Promise<CreateCreationResult> {
  const { uid } = user;
  assertAllowedMedia(input, uid);
  const db = getAdminFirestore();
  const createdAt = new Date();
  const nowMs = createdAt.getTime();
  // The free card needs a verified identity, and is spent once per person however many
  // accounts they make: see lib/freeClaims.ts for what counts.
  const identity = {
    email: user.email ?? null,
    verified: user.verified === true,
    subjects: user.subjects ?? [],
  };
  const eligibility = freeEligibility(identity);
  const claimRefs = freeClaimIds(identity).map((id) => db.collection('free_claims').doc(id));
  const relaxed = isDevRelaxedQuota(input.devMode === true);
  const shareSlug = await uniqueShareSlug(db);
  const shareBase =
    process.env.OCCASIO_SHARE_BASE ?? 'https://occasio-greetings.vercel.app';

  const userRef = db.collection('users').doc(uid);
  const ref = db.collection('creations').doc();
  const cardFields = {
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
    reasons: input.reasons ?? [],
    ...passcodeFields(input),
    shareSlug,
    watermarked: true,
    viewCount: 0,
    reactionCount: 0,
    createdAt: Timestamp.fromDate(createdAt),
    userId: uid,
  };

  let billing: BillingState | null = null;
  let expiresAt = createdAt;
  let spent: 'free' | 'pro' | 'credit' = 'free';
  // True when this person still has a free card but may not spend it yet (not verified).
  let freeHeldBack = false;
  for (;;) {
    const allowance = await db.runTransaction(async (tx) => {
      const doc = ((await tx.get(userRef)).data() ?? {}) as AllowanceUserDoc;
      const claims = claimRefs.length > 0 ? await tx.getAll(...claimRefs) : [];
      // The same person already had their free card, under an earlier (deleted) account or a
      // different door (another inbox spelling, Google, Apple).
      const claimedElsewhere = claims.some(
        (claim) => claim.exists && claim.data()?.uid !== uid,
      );
      const rules = applyFreeRules(doc, eligibility, claimedElsewhere);
      freeHeldBack = rules.freeHeldBack;
      const seen = rules.seen;
      const decided = relaxed ? 'pro' : decideCreateAllowance(seen, nowMs, billing);
      if (decided === 'needs_billing' || decided === 'none') {
        return decided;
      }
      if (!relaxed) {
        if (decided === 'free') {
          tx.set(userRef, { freeCardsUsed: freeCardsUsed(doc) + 1 }, { merge: true });
          for (const claimRef of claimRefs) {
            tx.set(claimRef, { uid, at: Timestamp.fromDate(createdAt) });
          }
        } else if (decided === 'pro') {
          tx.set(
            userRef,
            { proCardTimes: [...proCardTimesInWindow(doc.proCardTimes, nowMs), nowMs] },
            { merge: true },
          );
        } else if (decided === 'credit') {
          tx.set(userRef, { wishCreditsUsed: wishCreditsUsed(doc) + 1 }, { merge: true });
        }
      }
      // The plan decides how long the link lives: Pro 365 days, everything else 30.
      spent = decided;
      expiresAt = computeExpiresAt(createdAt, decided, relaxed);
      tx.set(ref, { ...cardFields, expiresAt: Timestamp.fromDate(expiresAt) });
      // The owner's History row is written with the card, so History is right even
      // when the app's own save fails. The app may still write it; same id, same data.
      tx.set(db.collection('user_creations').doc(ref.id), {
        userId: uid,
        creationId: ref.id,
        shareSlug,
        shareUrl: `${shareBase}/c/${shareSlug}`,
        recipientName: input.recipientName,
        templateType: input.templateType,
        message: input.message,
        createdAt: Timestamp.fromDate(createdAt),
        expiresAt: Timestamp.fromDate(expiresAt),
      });
      return decided;
    });

    if (allowance === 'none') {
      // A free card they could have used but for being unverified is a different answer from
      // "you have used it": the first asks them to confirm their email, the second to pay.
      if (freeHeldBack && !eligibility.ok) {
        const refusal = eligibilityRefusal(eligibility.reason);
        throw new ApiRouteError(refusal.status, refusal.code, refusal.message);
      }
      throw new ApiRouteError(
        402,
        'QUOTA_EXCEEDED',
        'No cards left on your plan. Buy one more wish to continue.',
      );
    }
    if (allowance !== 'needs_billing') {
      break;
    }
    try {
      billing = await fetchBillingState(uid);
    } catch (error) {
      console.error('[createCreation] billing check failed', error);
      throw new ApiRouteError(503, 'INTERNAL', 'Could not check your plan. Try again.');
    }
  }

  // A subscriber's very first card spends the free card, but they still pay for
  // the year-long link. Best effort: if RevenueCat is unreachable they keep 30 days.
  if (spent === 'free' && !relaxed) {
    try {
      const state = billing ?? (await fetchBillingState(uid));
      if (state.proActive) {
        expiresAt = computeExpiresAt(createdAt, 'pro', false);
        await ref.update({ expiresAt: Timestamp.fromDate(expiresAt) });
        await db
          .collection('user_creations')
          .doc(ref.id)
          .set({ expiresAt: Timestamp.fromDate(expiresAt) }, { merge: true });
      }
    } catch (error) {
      console.error('[createCreation] could not check plan for link length', error);
    }
  }

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
  | { status: 'locked'; hint: string | null }
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

  if (typeof doc.passcodeHash === 'string') {
    return {
      status: 'locked',
      hint: typeof doc.passcodeHint === 'string' ? doc.passcodeHint : null,
    };
  }

  return { status: 'found', card: cardFromDoc(doc, recipientName) };
}

function cardFromDoc(
  doc: FirebaseFirestore.DocumentData,
  recipientName: string,
): RecipientCard {
  return {
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
      reasons: Array.isArray(doc.reasons)
        ? (doc.reasons as unknown[]).filter(
            (r): r is string => typeof r === 'string' && r.trim().length > 0,
          )
        : [],
  };
}

export type UnlockResult =
  | { status: 'unlocked'; card: RecipientCard }
  | { status: 'wrong'; attemptsLeft: number }
  | { status: 'throttled'; retryAfterSec: number }
  | { status: 'not_found' }
  | { status: 'expired' };

/** Check a passcode server-side; the card body is only returned on success. */
export async function unlockCardBySlug(
  slug: string,
  code: string,
  now = new Date(),
): Promise<UnlockResult> {
  if (!isFirebaseAdminConfigured()) return { status: 'not_found' };

  const db = getAdminFirestore();
  const snapshot = await db
    .collection('creations')
    .where('shareSlug', '==', slug)
    .limit(1)
    .get();
  if (snapshot.empty) return { status: 'not_found' };

  const ref = snapshot.docs[0]!.ref;
  const doc = snapshot.docs[0]!.data();
  const expiresAt = doc.expiresAt as Timestamp | undefined;
  if (expiresAt && expiresAt.toDate() < now) return { status: 'expired' };

  const recipientName = doc.recipientName as string | undefined;
  if (!recipientName) return { status: 'not_found' };

  // No passcode set: nothing to unlock.
  if (
    typeof doc.passcodeHash !== 'string' ||
    typeof doc.passcodeSalt !== 'string'
  ) {
    return { status: 'unlocked', card: cardFromDoc(doc, recipientName) };
  }

  const lockedUntil = (doc.unlockLockedUntil as Timestamp | null | undefined)?.toDate();
  if (lockedUntil && lockedUntil > now) {
    return {
      status: 'throttled',
      retryAfterSec: Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000),
    };
  }

  if (verifyPasscode(code, doc.passcodeSalt, doc.passcodeHash)) {
    await ref.update({ unlockFails: 0, unlockLockedUntil: null });
    return { status: 'unlocked', card: cardFromDoc(doc, recipientName) };
  }

  const fails = ((doc.unlockFails as number | undefined) ?? 0) + 1;
  if (fails >= UNLOCK_MAX_FAILS) {
    await ref.update({
      unlockFails: 0,
      unlockLockedUntil: Timestamp.fromMillis(now.getTime() + UNLOCK_LOCK_MS),
    });
    return { status: 'throttled', retryAfterSec: UNLOCK_LOCK_MS / 1000 };
  }
  await ref.update({ unlockFails: fails });
  return { status: 'wrong', attemptsLeft: UNLOCK_MAX_FAILS - fails };
}

export const CARD_EVENT_TYPES = ['opened', 'finished', 'replayed', 'cta'] as const;
export type CardEventType = (typeof CARD_EVENT_TYPES)[number];

/** Anonymous funnel counters (opened → finished → replayed → cta) for growth metrics. */
export async function recordCardEvent(
  slug: string,
  type: CardEventType,
): Promise<boolean> {
  if (!isFirebaseAdminConfigured()) return false;

  const db = getAdminFirestore();
  const snapshot = await db
    .collection('creations')
    .where('shareSlug', '==', slug)
    .limit(1)
    .get();
  if (snapshot.empty) return false;

  await snapshot.docs[0]!.ref.update({
    [`stats.${type}`]: FieldValue.increment(1),
  });
  return true;
}

export async function getCardBySlug(slug: string): Promise<RecipientCard | null> {
  const result = await lookupCardBySlug(slug);
  return result.status === 'found' ? result.card : null;
}

export type OwnedCreation = {
  creationId: string;
  shareSlug: string;
  shareUrl: string;
  expiresAt: string;
  watermarked: boolean;
  templateType: string;
  templateId: string | null;
  recipientName: string;
  fromName: string;
  message: string;
  photoRefs: string[];
  mediaUrls: string[];
  experienceMode: 'story' | 'classic' | null;
  balloonLine: string | null;
  reasons: string[];
  hasPasscode: boolean;
  passcodeHint: string | null;
};

export type OwnedCreationResult =
  | { status: 'found'; creation: OwnedCreation }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'expired' };

export type UpdateCreationResult =
  | { status: 'updated'; creation: CreateCreationResult }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'expired' };

async function assertOwnedCreation(creationId: string, uid: string) {
  const id = creationId.trim();
  if (!id || id.length > 128) {
    return { status: 'not_found' as const };
  }

  const db = getAdminFirestore();
  const historyRef = db.collection('user_creations').doc(id);

  // Ownership comes from the card itself. A History row is only a pointer that
  // any signed-in user could try to create, so it proves nothing.
  const creationRef = db.collection('creations').doc(id);
  const creationSnap = await creationRef.get();
  if (!creationSnap.exists) {
    return { status: 'not_found' as const };
  }

  const creationData = creationSnap.data() ?? {};
  if (creationData.userId !== uid) {
    return { status: 'forbidden' as const };
  }
  const expiresAt = creationData.expiresAt as Timestamp | undefined;
  if (expiresAt && expiresAt.toDate() < new Date()) {
    return { status: 'expired' as const };
  }

  const shareSlug =
    typeof creationData.shareSlug === 'string' ? creationData.shareSlug : '';
  if (!shareSlug) {
    return { status: 'not_found' as const };
  }

  const shareBase =
    process.env.OCCASIO_SHARE_BASE ?? 'https://occasio-greetings.vercel.app';

  return {
    status: 'ok' as const,
    historyRef,
    creationRef,
    creationData,
    shareSlug,
    shareBase,
  };
}

/**
 * Load a creation the signed-in user owns (for edit-after-create).
 */
export async function getOwnedCreation(
  creationId: string,
  uid: string,
): Promise<OwnedCreationResult> {
  if (!isFirebaseAdminConfigured()) {
    throw new ApiRouteError(503, 'INTERNAL', 'Server is not configured');
  }

  const owned = await assertOwnedCreation(creationId, uid);
  if (owned.status !== 'ok') {
    return { status: owned.status };
  }

  const doc = owned.creationData;
  const expiresAt = doc.expiresAt as Timestamp | undefined;
  const recipientName =
    typeof doc.recipientName === 'string' ? doc.recipientName : '';
  if (!recipientName) {
    return { status: 'not_found' };
  }

  return {
    status: 'found',
    creation: {
      creationId: creationId.trim(),
      shareSlug: owned.shareSlug,
      shareUrl: `${owned.shareBase}/c/${owned.shareSlug}`,
      expiresAt: expiresAt
        ? expiresAt.toDate().toISOString()
        : new Date().toISOString(),
      watermarked: doc.watermarked !== false,
      templateType: (doc.templateType as string) ?? 'birthday',
      templateId: (doc.templateId as string | null) ?? null,
      recipientName,
      fromName: typeof doc.fromName === 'string' ? doc.fromName : '',
      message: typeof doc.message === 'string' ? doc.message : '',
      photoRefs: Array.isArray(doc.photoRefs)
        ? (doc.photoRefs as string[])
        : [],
      mediaUrls: Array.isArray(doc.mediaUrls)
        ? (doc.mediaUrls as string[])
        : [],
      experienceMode:
        doc.experienceMode === 'story' || doc.experienceMode === 'classic'
          ? doc.experienceMode
          : null,
      balloonLine:
        typeof doc.balloonLine === 'string' && doc.balloonLine.trim()
          ? normalizeBalloonLine(doc.balloonLine)
          : null,
      reasons: Array.isArray(doc.reasons)
        ? (doc.reasons as unknown[]).filter(
            (r): r is string => typeof r === 'string',
          )
        : [],
      hasPasscode: typeof doc.passcodeHash === 'string',
      passcodeHint:
        typeof doc.passcodeHint === 'string' ? doc.passcodeHint : null,
    },
  };
}

/**
 * Update card content in place — same shareSlug / shareUrl.
 * No quota charge. Requires ownership via `user_creations/{creationId}`.
 */
export async function updateCreation(
  creationId: string,
  uid: string,
  input: CreateCreationInput,
): Promise<UpdateCreationResult> {
  if (!isFirebaseAdminConfigured()) {
    throw new ApiRouteError(503, 'INTERNAL', 'Server is not configured');
  }

  const owned = await assertOwnedCreation(creationId, uid);
  if (owned.status !== 'ok') {
    return { status: owned.status };
  }

  assertAllowedMedia(
    input,
    uid,
    Array.isArray(owned.creationData.photoRefs)
      ? (owned.creationData.photoRefs as string[])
      : [],
  );

  const previousRecipient =
    typeof owned.creationData.recipientName === 'string'
      ? owned.creationData.recipientName
      : '';
  if (!recipientEditAllowed(previousRecipient, input.recipientName)) {
    throw new ApiRouteError(
      400,
      'VALIDATION_ERROR',
      'The name on a card stays the same after the link is made. Create a new card for someone else.',
    );
  }

  const expiresAt = owned.creationData.expiresAt as Timestamp | undefined;
  const expiresAtIso = expiresAt
    ? expiresAt.toDate().toISOString()
    : new Date().toISOString();

  await owned.creationRef.update({
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
    balloonLine: input.balloonLine
      ? normalizeBalloonLine(input.balloonLine)
      : null,
    reasons: input.reasons ?? [],
    ...passcodeFields(input),
    updatedAt: Timestamp.now(),
    updatedBy: uid,
  });

  await owned.historyRef.set(
    {
      userId: uid,
      recipientName: input.recipientName,
      templateType: input.templateType,
      message: input.message,
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  return {
    status: 'updated',
    creation: {
      creationId: creationId.trim(),
      shareSlug: owned.shareSlug,
      shareUrl: `${owned.shareBase}/c/${owned.shareSlug}`,
      expiresAt: expiresAtIso,
      watermarked: owned.creationData.watermarked !== false,
    },
  };
}

export type RevokeCreationResult =
  | { status: 'revoked' }
  | { status: 'not_found' }
  | { status: 'forbidden' };

/**
 * Kill a public share link after History delete.
 * Requires ownership via `user_creations/{creationId}`.
 */
export async function revokeCreation(
  creationId: string,
  uid: string,
): Promise<RevokeCreationResult> {
  if (!isFirebaseAdminConfigured()) {
    throw new ApiRouteError(503, 'INTERNAL', 'Server is not configured');
  }

  const id = creationId.trim();
  if (!id || id.length > 128) {
    return { status: 'not_found' };
  }

  const db = getAdminFirestore();
  const historyRef = db.collection('user_creations').doc(id);
  const creationRef = db.collection('creations').doc(id);
  const creationSnap = await creationRef.get();

  if (!creationSnap.exists) {
    // The card is already gone (purged). Only the person whose History row it is
    // may clear the leftover row.
    const historySnap = await historyRef.get();
    if (!historySnap.exists) return { status: 'not_found' };
    if ((historySnap.data() as { userId?: string } | undefined)?.userId !== uid) {
      return { status: 'forbidden' };
    }
    await historyRef.delete();
    return { status: 'revoked' };
  }

  // Ownership comes from the card itself, not from the History row.
  if (creationSnap.get('userId') !== uid) {
    return { status: 'forbidden' };
  }

  // Expire immediately so GET /cards/:slug returns 410.
  await creationRef.update({
    expiresAt: Timestamp.fromDate(new Date(0)),
    revokedAt: Timestamp.now(),
    revokedBy: uid,
  });

  await historyRef.delete();
  return { status: 'revoked' };
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
