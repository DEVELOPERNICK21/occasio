import { timingSafeEqual } from 'crypto';
import type { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { writeCreation } from '../creations';
import { packFromRelationship, resolveAutoSendContent } from './content';
import {
  buildIdempotencyKey,
  formatIstDate,
  istCalendarDate,
  matchesMonthDay,
} from './dates';
import { pruneFcmTokens, sendAutosendReview } from './fcm';
import { sweepExpiredReviews } from './review';
import {
  isPaidAutosendTier,
  type AutoSendLastCreation,
  type OccasionType,
  type PersonDate,
  type RelationshipRecord,
  type ScheduledSendStatus,
} from './types';

const PAGE_SIZE = 100;
const REVIEW_WINDOW_MS = 24 * 60 * 60 * 1000;
const PAID_LINK_TTL_DAYS = 365;
const SCHEDULED_SENDS = 'scheduled_sends';

/** Dev/emulator only — default false in production. */
function autosendTierAllowed(tier: unknown): boolean {
  if (process.env.OCCASIO_AUTOSEND_ALLOW_FREE === 'true') {
    return true;
  }
  return isPaidAutosendTier(tier);
}

export type AutosendCronResult = {
  asOf: string;
  matched: number;
  created: number;
  skipped: number;
  failed: number;
  expiredReviews: number;
  autoDispatched: number;
  incompletePack: number;
  approvedRetried: number;
};

type UserRecord = {
  subscriptionTier: unknown;
  fcmTokens: string[];
};

function personDate(value: unknown): PersonDate | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const record = value as { month?: unknown; day?: unknown };
  const month = Number(record.month);
  const day = Number(record.day);
  if (!Number.isInteger(month) || !Number.isInteger(day)) {
    return undefined;
  }
  return { month, day };
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function relationshipFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): RelationshipRecord | null {
  const userId = typeof data.userId === 'string' ? data.userId : '';
  const personName = typeof data.personName === 'string' ? data.personName : '';
  if (!userId || !personName) {
    return null;
  }

  const datesRaw =
    data.dates && typeof data.dates === 'object'
      ? (data.dates as { birthday?: unknown; anniversary?: unknown })
      : undefined;
  const enabledRaw =
    data.autoSendEnabled && typeof data.autoSendEnabled === 'object'
      ? (data.autoSendEnabled as { birthday?: unknown; anniversary?: unknown })
      : undefined;

  return {
    id,
    userId,
    personName,
    dates: {
      birthday: personDate(datesRaw?.birthday),
      anniversary: personDate(datesRaw?.anniversary),
    },
    autoSendEnabled: {
      birthday: Boolean(enabledRaw?.birthday),
      anniversary: Boolean(enabledRaw?.anniversary),
    },
    preferredTemplateId:
      typeof data.preferredTemplateId === 'string'
        ? data.preferredTemplateId
        : undefined,
    preferredTemplateType:
      typeof data.preferredTemplateType === 'string'
        ? data.preferredTemplateType
        : undefined,
    photoRefs: Array.isArray(data.photoRefs)
      ? stringArray(data.photoRefs)
      : undefined,
    defaultMessage:
      typeof data.defaultMessage === 'string' ? data.defaultMessage : undefined,
    fromName: typeof data.fromName === 'string' ? data.fromName : undefined,
    lastCreationId:
      typeof data.lastCreationId === 'string' ? data.lastCreationId : undefined,
  };
}

function lastCreationFromDoc(
  data: FirebaseFirestore.DocumentData,
): AutoSendLastCreation | null {
  const templateType =
    typeof data.templateType === 'string' ? data.templateType : null;
  if (!templateType) {
    return null;
  }
  const photoRefs = stringArray(data.photoRefs);
  const mediaUrls = stringArray(data.mediaUrls);
  return {
    templateType,
    templateId: typeof data.templateId === 'string' ? data.templateId : '',
    photoRefs: photoRefs.length > 0 ? photoRefs : mediaUrls,
    message: typeof data.message === 'string' ? data.message : '',
    fromName: typeof data.fromName === 'string' ? data.fromName : null,
  };
}

function matchingOccasions(
  rel: RelationshipRecord,
  today: { month: number; day: number },
): OccasionType[] {
  const occasions: OccasionType[] = [];
  if (
    rel.autoSendEnabled?.birthday &&
    matchesMonthDay(rel.dates?.birthday, today)
  ) {
    occasions.push('birthday');
  }
  if (
    rel.autoSendEnabled?.anniversary &&
    matchesMonthDay(rel.dates?.anniversary, today)
  ) {
    occasions.push('anniversary');
  }
  return occasions;
}

async function paginateArmed(
  db: FirebaseFirestore.Firestore,
  field: OccasionType,
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  while (true) {
    let query: FirebaseFirestore.Query = db
      .collection('relationships')
      .where(`autoSendEnabled.${field}`, '==', true)
      .limit(PAGE_SIZE);
    if (last) {
      query = query.startAfter(last);
    }
    const snap = await query.get();
    if (snap.empty) {
      break;
    }
    docs.push(...snap.docs);
    if (snap.size < PAGE_SIZE) {
      break;
    }
    last = snap.docs[snap.docs.length - 1];
  }
  return docs;
}

async function loadArmedRelationships(
  db: FirebaseFirestore.Firestore,
): Promise<RelationshipRecord[]> {
  const [birthdayDocs, anniversaryDocs] = await Promise.all([
    paginateArmed(db, 'birthday'),
    paginateArmed(db, 'anniversary'),
  ]);
  const byId = new Map<string, RelationshipRecord>();
  for (const doc of [...birthdayDocs, ...anniversaryDocs]) {
    if (byId.has(doc.id)) {
      continue;
    }
    const record = relationshipFromDoc(doc.id, doc.data());
    if (record) {
      byId.set(doc.id, record);
    }
  }
  return [...byId.values()];
}

async function loadUser(
  db: FirebaseFirestore.Firestore,
  cache: Map<string, UserRecord>,
  userId: string,
): Promise<UserRecord> {
  const cached = cache.get(userId);
  if (cached) {
    return cached;
  }
  const snap = await db.collection('users').doc(userId).get();
  const data = snap.data() ?? {};
  const record: UserRecord = {
    subscriptionTier: data.subscriptionTier,
    fcmTokens: stringArray(data.fcmTokens),
  };
  cache.set(userId, record);
  return record;
}

function isAlreadyExists(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  return code === 6 || code === '6' || code === 'already-exists';
}

async function loadLastCreation(
  db: FirebaseFirestore.Firestore,
  creationId: string | undefined,
): Promise<AutoSendLastCreation | null> {
  if (!creationId) {
    return null;
  }
  const snap = await db.collection('creations').doc(creationId).get();
  if (!snap.exists) {
    return null;
  }
  return lastCreationFromDoc(snap.data() ?? {});
}

async function notifyReview(
  db: FirebaseFirestore.Firestore,
  messaging: admin.messaging.Messaging,
  user: UserRecord,
  userId: string,
  payload: {
    sendId: string;
    personName: string;
    occasionType: OccasionType;
  },
): Promise<void> {
  try {
    const invalid = await sendAutosendReview(
      messaging,
      user.fcmTokens,
      payload,
    );
    if (invalid.length === 0) {
      return;
    }
    user.fcmTokens = user.fcmTokens.filter((token) => !invalid.includes(token));
    await pruneFcmTokens(db, userId, invalid);
  } catch (error) {
    console.error('autosend FCM failed', error);
  }
}

async function processOccasion(
  db: FirebaseFirestore.Firestore,
  messaging: admin.messaging.Messaging,
  userCache: Map<string, UserRecord>,
  rel: RelationshipRecord,
  occasionType: OccasionType,
  today: ReturnType<typeof istCalendarDate>,
  now: Date,
): Promise<'created' | 'skipped' | 'failed'> {
  const idempotencyKey = buildIdempotencyKey(
    rel.userId,
    rel.id,
    occasionType,
    today.year,
  );
  const sendRef = db.collection(SCHEDULED_SENDS).doc(idempotencyKey);
  const existing = await sendRef.get();
  const existingData = existing.data();
  const existingStatus = existing.exists
    ? (existingData?.status as ScheduledSendStatus | undefined)
    : undefined;
  const existingLastError =
    typeof existingData?.lastError === 'string' ? existingData.lastError : null;
  const tierFailureRetry =
    existingStatus === 'failed' && existingLastError === 'tier';

  if (existingStatus && existingStatus !== 'pending' && !tierFailureRetry) {
    return 'skipped';
  }

  const user = await loadUser(db, userCache, rel.userId);
  const nowTs = admin.firestore.Timestamp.fromDate(now);
  const scheduledDate = formatIstDate(today);

  if (!autosendTierAllowed(user.subscriptionTier)) {
    await sendRef.set(
      {
        userId: rel.userId,
        relationshipId: rel.id,
        personName: rel.personName,
        occasionType,
        scheduledDate,
        reviewDeadline: null,
        status: 'failed',
        generatedCreationId: null,
        shareUrl: null,
        lastError: 'tier',
        idempotencyKey,
        createdAt: existingData?.createdAt ?? nowTs,
        updatedAt: nowTs,
      },
      { merge: true },
    );
    return 'failed';
  }

  if (!existing.exists) {
    try {
      await sendRef.create({
        userId: rel.userId,
        relationshipId: rel.id,
        personName: rel.personName,
        occasionType,
        scheduledDate,
        reviewDeadline: null,
        status: 'pending',
        generatedCreationId: null,
        shareUrl: null,
        lastError: null,
        idempotencyKey,
        createdAt: nowTs,
        updatedAt: nowTs,
      });
    } catch (error) {
      if (isAlreadyExists(error)) {
        return 'skipped';
      }
      throw error;
    }
  }

  try {
    const lastCreation = await loadLastCreation(db, rel.lastCreationId);
    const content = resolveAutoSendContent({
      occasionType,
      pack: packFromRelationship(rel),
      lastCreation,
    });
    const creation = await writeCreation(db, {
      templateType: content.templateType,
      templateId: content.templateId,
      recipientName: rel.personName,
      fromName: content.fromName,
      message: content.message,
      photoRefs: content.photoRefs,
      userId: rel.userId,
      ttlDays: PAID_LINK_TTL_DAYS,
    });
    const reviewDeadline = admin.firestore.Timestamp.fromDate(
      new Date(now.getTime() + REVIEW_WINDOW_MS),
    );
    await sendRef.update({
      status: 'review',
      generatedCreationId: creation.creationId,
      shareUrl: creation.shareUrl,
      reviewDeadline,
      lastError: null,
      updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
    });
    await notifyReview(db, messaging, user, rel.userId, {
      sendId: sendRef.id,
      personName: rel.personName,
      occasionType,
    });
    return 'created';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'generation_failed';
    await sendRef.update({
      status: 'failed',
      lastError: message.slice(0, 500),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
    });
    console.error('autosend generation failed', idempotencyKey, error);
    return 'failed';
  }
}

export async function runAutosendCron(
  db: FirebaseFirestore.Firestore,
  now: Date,
  messaging: admin.messaging.Messaging,
): Promise<AutosendCronResult> {
  const today = istCalendarDate(now);
  const relationships = await loadArmedRelationships(db);
  const userCache = new Map<string, UserRecord>();
  let matched = 0;
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const rel of relationships) {
    const occasions = matchingOccasions(rel, today);
    for (const occasionType of occasions) {
      matched += 1;
      const outcome = await processOccasion(
        db,
        messaging,
        userCache,
        rel,
        occasionType,
        today,
        now,
      );
      if (outcome === 'created') created += 1;
      else if (outcome === 'skipped') skipped += 1;
      else failed += 1;
    }
  }

  const sweep = await sweepExpiredReviews(db, messaging, now);

  return {
    asOf: now.toISOString(),
    matched,
    created,
    skipped,
    failed,
    expiredReviews: sweep.expiredReviews,
    autoDispatched: sweep.autoDispatched,
    incompletePack: sweep.incompletePack,
    approvedRetried: sweep.approvedRetried,
  };
}

function cronSecretOk(header: string | undefined): 'ok' | 'missing' | 'unauthorized' {
  const expected = process.env.OCCASIO_CRON_SECRET;
  if (!expected) {
    return 'missing';
  }
  if (!header) {
    return 'unauthorized';
  }
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return 'unauthorized';
  }
  return timingSafeEqual(a, b) ? 'ok' : 'unauthorized';
}

function parseAsOf(body: unknown): Date | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const asOf = (body as { asOf?: unknown }).asOf;
  if (typeof asOf !== 'string') {
    return null;
  }
  const parsed = new Date(asOf);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export async function handleAutosendCronRequest(
  req: Request,
  res: Response,
  db: FirebaseFirestore.Firestore,
  messaging: admin.messaging.Messaging,
): Promise<void> {
  const auth = cronSecretOk(
    typeof req.header('x-occasio-cron-secret') === 'string'
      ? req.header('x-occasio-cron-secret')
      : undefined,
  );
  if (auth === 'missing') {
    res.status(503).json({ code: 'CRON_SECRET_MISSING' });
    return;
  }
  if (auth !== 'ok') {
    res.status(401).json({ code: 'UNAUTHORIZED' });
    return;
  }

  const now = parseAsOf(req.body) ?? new Date();
  const result = await runAutosendCron(db, now, messaging);
  res.status(200).json({ ok: true, ...result });
}
