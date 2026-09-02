import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import express, { type Request, type Response } from 'express';

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

function randomSlug(length = 8): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < length; i += 1) {
    slug += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return slug;
}

app.post('/v1/creations', async (req: Request, res: Response) => {
  const { templateType, recipientName, message, photoRefs, devMode } = req.body as {
    templateType?: string;
    recipientName?: string;
    message?: string;
    photoRefs?: string[];
    devMode?: boolean;
  };

  if (!templateType || !recipientName?.trim() || !photoRefs?.length) {
    res.status(400).json({ code: 'VALIDATION_ERROR' });
    return;
  }

  const createdAt = admin.firestore.Timestamp.now();
  const ttlDays = guestLinkTtlDays(devMode === true);
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
  );
  const shareSlug = randomSlug();
  const shareBase =
    process.env.OCCASIO_SHARE_BASE ?? 'https://occasio-greetings.vercel.app';

  const docRef = db.collection('creations').doc();
  await docRef.set({
    templateType,
    recipientName: recipientName.trim(),
    message: message?.trim() ?? '',
    photoRefs,
    shareSlug,
    watermarked: true,
    viewCount: 0,
    createdAt,
    expiresAt,
    userId: null,
  });

  res.status(201).json({
    creationId: docRef.id,
    shareSlug,
    shareUrl: `${shareBase}/c/${shareSlug}`,
    expiresAt: expiresAt.toDate().toISOString(),
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
    mediaUrls: doc.mediaUrls ?? [],
    fromName: doc.fromName ?? null,
  });
});

app.post('/v1/uploads/presign', (_req: Request, res: Response) => {
  res.status(501).json({ code: 'NOT_IMPLEMENTED', message: 'R2 presign coming soon' });
});

export const api = onRequest({ region: 'asia-south1' }, app);
