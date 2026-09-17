import type { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { dispatchScheduledSend } from './dispatch';
import {
  hasCreationPhotos,
  isAutosendDispatchEnabled,
  isReviewExpired,
  shouldAutoDispatchOnDeadline,
  type ScheduledSendStatus,
} from './types';

const SCHEDULED_SENDS = 'scheduled_sends';
const PAGE_SIZE = 100;

export type SweepResult = {
  expiredReviews: number;
  autoDispatched: number;
  incompletePack: number;
  approvedRetried: number;
};

async function requireUid(
  req: Request,
  auth: admin.auth.Auth,
): Promise<string | null> {
  const header = req.header('Authorization') ?? req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

function sendIdParam(req: Request): string | null {
  const id = req.params.id;
  if (typeof id === 'string' && id.length > 0) {
    return id;
  }
  return null;
}

function timestampToDate(value: unknown): Date | null {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const date = (value as FirebaseFirestore.Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

async function loadCreationPhotos(
  db: FirebaseFirestore.Firestore,
  tx: FirebaseFirestore.Transaction | null,
  creationId: unknown,
): Promise<boolean> {
  if (typeof creationId !== 'string' || !creationId) {
    return false;
  }
  const ref = db.collection('creations').doc(creationId);
  const snap = tx ? await tx.get(ref) : await ref.get();
  if (!snap.exists) {
    return false;
  }
  const data = snap.data() ?? {};
  return hasCreationPhotos(data.photoRefs, data.mediaUrls);
}

async function paginateByStatus(
  db: FirebaseFirestore.Firestore,
  status: ScheduledSendStatus,
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  while (true) {
    let query: FirebaseFirestore.Query = db
      .collection(SCHEDULED_SENDS)
      .where('status', '==', status)
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

export async function handleApproveScheduledSend(
  req: Request,
  res: Response,
  db: FirebaseFirestore.Firestore,
  messaging: admin.messaging.Messaging,
  auth: admin.auth.Auth,
): Promise<void> {
  const uid = await requireUid(req, auth);
  if (!uid) {
    res.status(401).json({ code: 'UNAUTHORIZED' });
    return;
  }

  const id = sendIdParam(req);
  if (!id) {
    res.status(400).json({ code: 'VALIDATION_ERROR' });
    return;
  }

  const sendRef = db.collection(SCHEDULED_SENDS).doc(id);

  try {
    const decision = await db.runTransaction(async (tx) => {
      const snap = await tx.get(sendRef);
      if (!snap.exists) {
        return { error: 'NOT_FOUND' as const };
      }
      const data = snap.data() ?? {};
      if (data.userId !== uid) {
        return { error: 'FORBIDDEN' as const };
      }
      if (data.status !== 'review') {
        return { error: 'CONFLICT' as const };
      }
      const hasPhotos = await loadCreationPhotos(
        db,
        tx,
        data.generatedCreationId,
      );
      if (!hasPhotos) {
        return { error: 'VALIDATION_ERROR' as const };
      }
      tx.update(sendRef, {
        status: 'approved',
        lastError: null,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      return { ok: true as const };
    });

    if ('error' in decision) {
      if (decision.error === 'NOT_FOUND') {
        res.status(404).json({ code: 'NOT_FOUND' });
        return;
      }
      if (decision.error === 'FORBIDDEN') {
        res.status(403).json({ code: 'FORBIDDEN' });
        return;
      }
      if (decision.error === 'CONFLICT') {
        res.status(409).json({ code: 'CONFLICT' });
        return;
      }
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'photos_required',
      });
      return;
    }

    const dispatched = await dispatchScheduledSend(db, messaging, id);
    res.status(200).json({
      ok: true,
      id,
      status: dispatched.status,
      shareUrl: dispatched.shareUrl,
      deliveryChannelUsed: dispatched.deliveryChannelUsed,
    });
  } catch (error) {
    console.error('approve scheduled send failed', id, error);
    res.status(500).json({ code: 'INTERNAL' });
  }
}

export async function handleCancelScheduledSend(
  req: Request,
  res: Response,
  db: FirebaseFirestore.Firestore,
  auth: admin.auth.Auth,
): Promise<void> {
  const uid = await requireUid(req, auth);
  if (!uid) {
    res.status(401).json({ code: 'UNAUTHORIZED' });
    return;
  }

  const id = sendIdParam(req);
  if (!id) {
    res.status(400).json({ code: 'VALIDATION_ERROR' });
    return;
  }

  const sendRef = db.collection(SCHEDULED_SENDS).doc(id);

  try {
    const decision = await db.runTransaction(async (tx) => {
      const snap = await tx.get(sendRef);
      if (!snap.exists) {
        return { error: 'NOT_FOUND' as const };
      }
      const data = snap.data() ?? {};
      if (data.userId !== uid) {
        return { error: 'FORBIDDEN' as const };
      }
      if (data.status !== 'review') {
        return { error: 'CONFLICT' as const };
      }
      tx.update(sendRef, {
        status: 'cancelled',
        lastError: null,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      return { ok: true as const };
    });

    if ('error' in decision) {
      const status =
        decision.error === 'NOT_FOUND'
          ? 404
          : decision.error === 'FORBIDDEN'
            ? 403
            : 409;
      res.status(status).json({ code: decision.error });
      return;
    }

    res.status(200).json({ ok: true, id, status: 'cancelled' });
  } catch (error) {
    console.error('cancel scheduled send failed', id, error);
    res.status(500).json({ code: 'INTERNAL' });
  }
}

async function resolveExpiredReview(
  db: FirebaseFirestore.Firestore,
  messaging: admin.messaging.Messaging,
  doc: FirebaseFirestore.QueryDocumentSnapshot,
  now: Date,
): Promise<'wait' | 'dispatch' | 'incomplete_pack' | 'skipped'> {
  const claimed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(doc.ref);
    if (!snap.exists) {
      return 'skipped' as const;
    }
    const data = snap.data() ?? {};
    if (data.status !== 'review') {
      return 'skipped' as const;
    }
    const deadline = timestampToDate(data.reviewDeadline);
    if (!isReviewExpired(deadline, now)) {
      return 'wait' as const;
    }
    const hasPhotos = await loadCreationPhotos(
      db,
      tx,
      data.generatedCreationId,
    );
    const action = shouldAutoDispatchOnDeadline(hasPhotos, true);
    if (action === 'incomplete_pack') {
      tx.update(doc.ref, {
        status: 'failed',
        lastError: 'incomplete_pack',
        updatedAt: admin.firestore.Timestamp.now(),
      });
      return 'incomplete_pack' as const;
    }
    tx.update(doc.ref, {
      status: 'approved',
      lastError: null,
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return 'dispatch' as const;
  });

  if (claimed === 'dispatch') {
    await dispatchScheduledSend(db, messaging, doc.id);
  }
  return claimed;
}

export async function sweepExpiredReviews(
  db: FirebaseFirestore.Firestore,
  messaging: admin.messaging.Messaging,
  now: Date,
): Promise<SweepResult> {
  const reviews = await paginateByStatus(db, 'review');
  let expiredReviews = 0;
  let autoDispatched = 0;
  let incompletePack = 0;

  for (const doc of reviews) {
    const outcome = await resolveExpiredReview(db, messaging, doc, now);
    if (outcome === 'wait' || outcome === 'skipped') {
      continue;
    }
    expiredReviews += 1;
    if (outcome === 'incomplete_pack') {
      incompletePack += 1;
    } else {
      autoDispatched += 1;
    }
  }

  let approvedRetried = 0;
  if (isAutosendDispatchEnabled()) {
    const approved = await paginateByStatus(db, 'approved');
    for (const doc of approved) {
      const result = await dispatchScheduledSend(db, messaging, doc.id);
      if (result.status === 'sent' || result.status === 'failed') {
        approvedRetried += 1;
      }
    }
  }

  return {
    expiredReviews,
    autoDispatched,
    incompletePack,
    approvedRetried,
  };
}
