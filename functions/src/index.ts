import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import express, { type Request, type Response } from 'express';
import { handleAutosendCronRequest, runAutosendCron } from './autosend/cron';
import {
  handleApproveScheduledSend,
  handleCancelScheduledSend,
} from './autosend/review';
import { writeCreation } from './creations';

admin.initializeApp();

const db = admin.firestore();
const app = express();
app.use(express.json());

const GUEST_LINK_TTL_DAYS_PROD = 30;
const GUEST_LINK_TTL_DAYS_DEV = 3;

function isDevRelaxedQuota(devModeRequested = false): boolean {
  if (process.env.OCCASIO_DEV_RELAXED_QUOTA === 'true') {
    return true;
  }
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    return true;
  }
  return devModeRequested && process.env.OCCASIO_ALLOW_DEV_CREATE === 'true';
}

function guestLinkTtlDays(devModeRequested = false): number {
  return isDevRelaxedQuota(devModeRequested)
    ? GUEST_LINK_TTL_DAYS_DEV
    : GUEST_LINK_TTL_DAYS_PROD;
}

app.post('/v1/creations', async (req: Request, res: Response) => {
  const {
    templateType,
    templateId,
    recipientName,
    fromName,
    message,
    photoRefs,
    devMode,
  } = req.body as {
    templateType?: string;
    templateId?: string | null;
    recipientName?: string;
    fromName?: string;
    message?: string;
    photoRefs?: string[];
    devMode?: boolean;
  };

  if (!templateType || !recipientName?.trim() || !photoRefs?.length) {
    res.status(400).json({ code: 'VALIDATION_ERROR' });
    return;
  }

  const result = await writeCreation(db, {
    templateType,
    templateId,
    recipientName: recipientName.trim(),
    fromName,
    message,
    photoRefs,
    userId: null,
    ttlDays: guestLinkTtlDays(devMode === true),
  });

  res.status(201).json({
    creationId: result.creationId,
    shareSlug: result.shareSlug,
    shareUrl: result.shareUrl,
    expiresAt: result.expiresAt.toDate().toISOString(),
    watermarked: true,
  });
});

app.get('/v1/cards/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const snapshot = await db
    .collection('creations')
    .where('shareSlug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    res.status(404).json({ code: 'NOT_FOUND' });
    return;
  }

  const doc = snapshot.docs[0].data();
  const expiresAt = doc.expiresAt as admin.firestore.Timestamp;
  if (expiresAt.toDate() < new Date()) {
    res.status(410).json({ code: 'EXPIRED' });
    return;
  }

  res.json({
    recipientName: doc.recipientName,
    message: doc.message,
    templateType: doc.templateType,
    templateId: doc.templateId ?? null,
    mediaUrls: doc.mediaUrls ?? [],
    fromName: doc.fromName ?? null,
    reactionCount: doc.reactionCount ?? 0,
  });
});

app.post('/v1/uploads/presign', (_req: Request, res: Response) => {
  res.status(501).json({ code: 'NOT_IMPLEMENTED', message: 'R2 presign coming soon' });
});

app.post(
  '/v1/scheduled-sends/:id/approve',
  async (req: Request, res: Response) => {
    await handleApproveScheduledSend(
      req,
      res,
      db,
      admin.messaging(),
      admin.auth(),
    );
  },
);

app.post(
  '/v1/scheduled-sends/:id/cancel',
  async (req: Request, res: Response) => {
    await handleCancelScheduledSend(req, res, db, admin.auth());
  },
);

app.post('/v1/internal/autosend/run', async (req: Request, res: Response) => {
  await handleAutosendCronRequest(req, res, db, admin.messaging());
});

export const api = onRequest({ region: 'asia-south1' }, app);

export const autosendDaily = onSchedule(
  {
    schedule: '0 6 * * *',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
  },
  async () => {
    await runAutosendCron(db, new Date(), admin.messaging());
  },
);
